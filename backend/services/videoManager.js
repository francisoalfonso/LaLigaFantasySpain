/**
 * Video Manager - Gestión completa de descarga y almacenamiento local de videos VEO3
 * Sistema de almacenamiento local únicamente
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class VideoManager {
    constructor() {
        this.videoDir = path.join(__dirname, '../../output/videos');
        this.metadataFile = path.join(this.videoDir, 'videos_metadata.json');
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? `https://${process.env.PROJECT_DOMAIN}`
            : `http://localhost:${process.env.PORT || 3000}`;

        this.initializeStorage();
    }

    /**
     * Inicializar estructura de almacenamiento
     */
    async initializeStorage() {
        try {
            await fs.mkdir(this.videoDir, { recursive: true });

            // Crear archivo metadata si no existe
            try {
                await fs.access(this.metadataFile);
            } catch {
                await fs.writeFile(this.metadataFile, JSON.stringify({ videos: [] }, null, 2));
            }

            logger.info('✅ VideoManager: Almacenamiento inicializado');
        } catch (error) {
            logger.error('❌ VideoManager: Error inicializando almacenamiento:', error.message);
        }
    }

    /**
     * Descargar video desde URL VEO3 y almacenar localmente (con opción Bunny.net)
     */
    async downloadAndStore(veo3Url, metadata = {}) {
        try {
            logger.info('📥 Descargando video desde VEO3:', veo3Url);

            // Generar nombre único para el archivo
            const timestamp = Date.now();
            const videoId = metadata.id || `video_${timestamp}`;
            const filename = `${videoId}_${timestamp}.mp4`;
            const localPath = path.join(this.videoDir, filename);

            // Intentar subir a Bunny.net primero si está configurado
            if (this.bunnyStream && this.bunnyStream.isConfigured()) {
                try {
                    logger.info('📤 Intentando subir a Bunny.net Stream:', veo3Url);

                    const bunnyData = await this.bunnyStream.uploadFromVeo3Url(veo3Url, {
                        title: metadata.title || `Video Manager - ${videoId}`,
                        ...metadata
                    });

                    const videoData = {
                        id: videoId,
                        filename: filename,
                        originalUrl: veo3Url,
                        bunnyId: bunnyData.id,
                        bunnyUrl: bunnyData.directUrl,
                        embedUrl: bunnyData.embedUrl,
                        thumbnailUrl: bunnyData.thumbnailUrl,
                        publicUrl: bunnyData.directUrl, // URL permanente de Bunny.net
                        downloadedAt: new Date().toISOString(),
                        size: bunnyData.size || 0,
                        platform: 'bunny',
                        metadata: metadata
                    };

                    await this.updateMetadata(videoData);

                    logger.info('✅ Video subido a Bunny.net:', bunnyData.directUrl);
                    return videoData;

                } catch (bunnyError) {
                    logger.warn('⚠️ Bunny.net falló, usando almacenamiento local:', bunnyError.message);
                }
            }

            // Fallback: Descargar y almacenar localmente
            const response = await this.downloadWithRetry(veo3Url, 3);

            // Guardar archivo localmente
            await fs.writeFile(localPath, response.data);

            // Actualizar metadata
            const videoData = {
                id: videoId,
                filename: filename,
                originalUrl: veo3Url,
                localPath: localPath,
                publicUrl: `${this.baseUrl}/api/videos/${filename}`,
                downloadedAt: new Date().toISOString(),
                size: response.data.length,
                platform: 'local',
                metadata: metadata
            };

            await this.updateMetadata(videoData);

            logger.info('✅ Video descargado y almacenado localmente:', filename);
            return videoData;

        } catch (error) {
            logger.error('❌ Error descargando video:', error.message);
            throw new Error(`Fallo descarga video: ${error.message}`);
        }
    }

    /**
     * Descarga con reintentos automáticos
     */
    async downloadWithRetry(url, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`📥 Intento ${attempt}/${maxRetries} descargando...`);

                const response = await axios({
                    method: 'GET',
                    url: url,
                    responseType: 'arraybuffer',
                    timeout: 60000, // 60 segundos timeout
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    }
                });

                return response;

            } catch (error) {
                logger.warn(`⚠️ Intento ${attempt} falló:`, error.message);

                if (attempt === maxRetries) {
                    throw error;
                }

                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
        }
    }

    /**
     * Concatenar múltiples videos en uno solo (compatible con Bunny.net y local)
     */
    async concatenateVideos(videoIds, outputMetadata = {}) {
        try {
            logger.info('🔗 Concatenando videos:', videoIds);

            const metadata = await this.getMetadata();
            const videos = videoIds.map(id =>
                metadata.videos.find(v => v.id === id)
            ).filter(Boolean);

            if (videos.length === 0) {
                throw new Error('No se encontraron videos para concatenar');
            }

            // Verificar si tenemos videos de Bunny.net
            const bunnyVideos = videos.filter(v => v.platform === 'bunny');
            const localVideos = videos.filter(v => v.platform === 'local' && v.localPath);

            // Si todos los videos están en Bunny.net, usar herramientas de Bunny.net si están disponibles
            if (bunnyVideos.length === videos.length && this.bunnyStream && this.bunnyStream.isConfigured()) {
                try {
                    logger.info('🐰 Intentando concatenación con Bunny.net Stream...');

                    // Para concatenación en Bunny.net, crear un nuevo video y subir el resultado
                    // Por ahora, descargamos, concatenamos localmente y resubimos
                    const timestamp = Date.now();
                    const tempDir = path.join(this.videoDir, `temp_${timestamp}`);
                    await fs.mkdir(tempDir, { recursive: true });

                    logger.info('📥 Descargando videos de Bunny.net para concatenación...');
                    const downloadedFiles = [];

                    for (let i = 0; i < bunnyVideos.length; i++) {
                        const video = bunnyVideos[i];
                        const tempFilename = `video_${i}_${timestamp}.mp4`;
                        const tempPath = path.join(tempDir, tempFilename);

                        const response = await this.downloadWithRetry(video.bunnyUrl || video.publicUrl, 3);
                        await fs.writeFile(tempPath, response.data);
                        downloadedFiles.push(tempPath);
                    }

                    // Concatenar usando FFmpeg
                    const outputFilename = `concatenated_${timestamp}.mp4`;
                    const outputPath = path.join(tempDir, outputFilename);
                    const fileListPath = path.join(tempDir, `filelist_${timestamp}.txt`);
                    const fileList = downloadedFiles.map(f => `file '${path.basename(f)}'`).join('\n');
                    await fs.writeFile(fileListPath, fileList);

                    const ffmpegCmd = `cd "${tempDir}" && ffmpeg -f concat -safe 0 -i "${path.basename(fileListPath)}" -c copy "${outputFilename}"`;
                    logger.info('🎬 Ejecutando FFmpeg para videos Bunny.net:', ffmpegCmd);
                    await execAsync(ffmpegCmd);

                    // Subir resultado a Bunny.net
                    logger.info('📤 Subiendo video concatenado a Bunny.net...');
                    const bunnyData = await this.bunnyStream.uploadFromFile(outputPath, {
                        title: outputMetadata.title || `Video Concatenado ${new Date().toISOString().slice(0, 10)}`,
                        type: 'concatenated',
                        sourceVideos: videoIds,
                        ...outputMetadata
                    });

                    // Limpiar archivos temporales
                    await fs.rm(tempDir, { recursive: true, force: true });

                    const concatData = {
                        id: `concat_${timestamp}`,
                        filename: outputFilename,
                        bunnyId: bunnyData.id,
                        bunnyUrl: bunnyData.directUrl,
                        embedUrl: bunnyData.embedUrl,
                        thumbnailUrl: bunnyData.thumbnailUrl,
                        publicUrl: bunnyData.directUrl,
                        createdAt: new Date().toISOString(),
                        platform: 'bunny',
                        type: 'concatenated',
                        sourceVideos: videoIds,
                        metadata: outputMetadata
                    };

                    await this.updateMetadata(concatData);

                    logger.info('✅ Videos concatenados y subidos a Bunny.net:', bunnyData.directUrl);
                    return concatData;

                } catch (bunnyError) {
                    logger.warn('⚠️ Concatenación Bunny.net falló, usando método local:', bunnyError.message);
                }
            }

            // Fallback: Concatenación local tradicional
            if (localVideos.length < videos.length) {
                throw new Error('Algunos videos no están disponibles localmente para concatenación');
            }

            // Generar archivo de salida
            const timestamp = Date.now();
            const outputFilename = `concatenated_${timestamp}.mp4`;
            const outputPath = path.join(this.videoDir, outputFilename);

            // Crear lista de archivos para FFmpeg
            const fileListPath = path.join(this.videoDir, `filelist_${timestamp}.txt`);
            const fileList = localVideos.map(v => `file '${path.basename(v.localPath)}'`).join('\n');
            await fs.writeFile(fileListPath, fileList);

            // Ejecutar concatenación con FFmpeg
            const ffmpegCmd = `cd "${this.videoDir}" && ffmpeg -f concat -safe 0 -i "${path.basename(fileListPath)}" -c copy "${outputFilename}"`;

            logger.info('🎬 Ejecutando FFmpeg local:', ffmpegCmd);
            await execAsync(ffmpegCmd);

            // Limpiar archivo temporal
            await fs.unlink(fileListPath);

            // Crear metadata para video concatenado
            const concatData = {
                id: `concat_${timestamp}`,
                filename: outputFilename,
                localPath: outputPath,
                publicUrl: `${this.baseUrl}/api/videos/${outputFilename}`,
                createdAt: new Date().toISOString(),
                platform: 'local',
                type: 'concatenated',
                sourceVideos: videoIds,
                metadata: outputMetadata
            };

            await this.updateMetadata(concatData);

            logger.info('✅ Videos concatenados exitosamente (local):', outputFilename);
            return concatData;

        } catch (error) {
            logger.error('❌ Error concatenando videos:', error.message);
            throw new Error(`Fallo concatenación: ${error.message}`);
        }
    }

    /**
     * Obtener metadata de todos los videos
     */
    async getMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.warn('⚠️ Error leyendo metadata, creando nuevo archivo');
            return { videos: [] };
        }
    }

    /**
     * Actualizar metadata con nuevo video
     */
    async updateMetadata(videoData) {
        try {
            const metadata = await this.getMetadata();

            // Evitar duplicados
            const existingIndex = metadata.videos.findIndex(v => v.id === videoData.id);
            if (existingIndex >= 0) {
                metadata.videos[existingIndex] = videoData;
            } else {
                metadata.videos.push(videoData);
            }

            await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));

        } catch (error) {
            logger.error('❌ Error actualizando metadata:', error.message);
        }
    }

    /**
     * Listar videos disponibles
     */
    async listVideos(limit = 20) {
        try {
            const metadata = await this.getMetadata();
            return metadata.videos
                .sort((a, b) => new Date(b.downloadedAt || b.createdAt) - new Date(a.downloadedAt || a.createdAt))
                .slice(0, limit);
        } catch (error) {
            logger.error('❌ Error listando videos:', error.message);
            return [];
        }
    }

    /**
     * Obtener video por ID
     */
    async getVideo(videoId) {
        try {
            const metadata = await this.getMetadata();
            return metadata.videos.find(v => v.id === videoId);
        } catch (error) {
            logger.error('❌ Error obteniendo video:', error.message);
            return null;
        }
    }

    /**
     * Obtener path local del archivo de video
     */
    async getVideoPath(filename) {
        return path.join(this.videoDir, filename);
    }

    /**
     * Verificar si un video existe localmente
     */
    async videoExists(filename) {
        try {
            const videoPath = path.join(this.videoDir, filename);
            await fs.access(videoPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Limpiar videos antiguos (más de 7 días)
     */
    async cleanupOldVideos(maxAgeDays = 7) {
        try {
            const metadata = await this.getMetadata();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

            const videosToKeep = [];
            const videosToDelete = [];

            for (const video of metadata.videos) {
                const videoDate = new Date(video.downloadedAt || video.createdAt);
                if (videoDate > cutoffDate) {
                    videosToKeep.push(video);
                } else {
                    videosToDelete.push(video);
                }
            }

            // Eliminar archivos antiguos
            for (const video of videosToDelete) {
                try {
                    await fs.unlink(video.localPath);
                    logger.info(`🗑️ Video eliminado: ${video.filename}`);
                } catch (error) {
                    logger.warn(`⚠️ No se pudo eliminar: ${video.filename}`);
                }
            }

            // Actualizar metadata
            await fs.writeFile(this.metadataFile, JSON.stringify({ videos: videosToKeep }, null, 2));

            logger.info(`✅ Limpieza completada: ${videosToDelete.length} videos eliminados`);
            return { deleted: videosToDelete.length, remaining: videosToKeep.length };

        } catch (error) {
            logger.error('❌ Error en limpieza:', error.message);
            return { deleted: 0, remaining: 0 };
        }
    }
}

module.exports = new VideoManager();