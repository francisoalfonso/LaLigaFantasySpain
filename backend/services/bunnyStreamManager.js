/**
 * Bunny.net Stream Manager - Gestión profesional de videos
 * Solución definitiva para hosting, streaming y analytics de videos VEO3
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class BunnyStreamManager {
    constructor() {
        // Configuración Bunny.net Stream
        this.apiKey = process.env.BUNNY_STREAM_API_KEY;
        this.libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
        this.baseUrl = 'https://video.bunnycdn.com';
        this.cdnUrl = process.env.BUNNY_STREAM_CDN_URL; // ej: https://vz-xyz.b-cdn.net

        // Metadata local para tracking
        this.metadataFile = path.join(__dirname, '../../output/videos/bunny_metadata.json');

        if (!this.apiKey || !this.libraryId) {
            console.warn('⚠️ BunnyStreamManager: API Key o Library ID no configurados');
        } else {
            console.log('🐰 BunnyStreamManager inicializado');
            this.initializeStorage();
        }
    }

    /**
     * Inicializar almacenamiento de metadata
     */
    async initializeStorage() {
        try {
            const videoDir = path.join(__dirname, '../../output/videos');
            await fs.mkdir(videoDir, { recursive: true });

            // Crear archivo metadata si no existe
            try {
                await fs.access(this.metadataFile);
            } catch {
                await fs.writeFile(this.metadataFile, JSON.stringify({ videos: [] }, null, 2));
            }

            console.log('🐰 BunnyStreamManager: Storage inicializado');
        } catch (error) {
            console.error('❌ BunnyStreamManager: Error inicializando storage:', error.message);
        }
    }

    /**
     * Verificar si Bunny.net está configurado
     */
    isConfigured() {
        return !!(this.apiKey && this.libraryId && this.cdnUrl);
    }

    /**
     * Obtener headers para requests
     */
    getHeaders() {
        return {
            'AccessKey': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Subir video desde archivo local
     */
    async uploadFromFile(filePath, metadata = {}) {
        try {
            console.log(`[BunnyStream] Subiendo archivo local: ${filePath}`);

            // Crear video en biblioteca
            const createResponse = await axios.post(`${this.baseUrl}/library/${this.libraryId}/videos`, {
                title: metadata.title || `Local Video ${Date.now()}`,
                collectionId: metadata.collectionId || ''
            }, {
                headers: this.getHeaders(),
                timeout: 30000
            });

            const videoId = createResponse.data.guid;
            console.log(`[BunnyStream] Video creado con ID: ${videoId}`);

            // Leer archivo
            const fileBuffer = await fs.readFile(filePath);

            // Subir video desde buffer
            const uploadResponse = await axios.put(
                `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`,
                fileBuffer,
                {
                    headers: {
                        'AccessKey': this.apiKey,
                        'Content-Type': 'video/mp4'
                    },
                    timeout: 300000, // 5 minutos
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            if (uploadResponse.status !== 200) {
                throw new Error(`Upload falló: ${uploadResponse.status}`);
            }

            console.log(`[BunnyStream] Archivo subido, esperando procesamiento...`);

            // Esperar procesamiento
            const processedVideo = await this.waitForProcessing(videoId);

            // Generar URLs de acceso
            const videoData = {
                id: videoId,
                title: metadata.title || `Local Video ${Date.now()}`,
                directUrl: `${this.cdnUrl}/${videoId}/play_720p.mp4`,
                embedUrl: `${this.cdnUrl}/${videoId}/iframe`,
                thumbnailUrl: processedVideo.thumbnailFileName ?
                    `${this.cdnUrl}/${videoId}/${processedVideo.thumbnailFileName}` : null,
                bunnyUrl: `${this.cdnUrl}/${videoId}/playlist.m3u8`,
                size: fileBuffer.length,
                duration: processedVideo.length || 0,
                status: processedVideo.status,
                uploadedAt: new Date().toISOString(),
                metadata: {
                    source: 'local_file',
                    originalPath: filePath,
                    ...metadata
                }
            };

            // Guardar metadata local
            await this.saveLocalMetadata(videoData);

            console.log(`[BunnyStream] ✅ Archivo subido exitosamente: ${videoData.directUrl}`);
            return videoData;

        } catch (error) {
            console.error(`[BunnyStream] ❌ Error subiendo archivo:`, error.message);
            throw new Error(`Upload desde archivo falló: ${error.message}`);
        }
    }

    /**
     * Subir video desde URL de VEO3 directamente a Bunny.net
     */
    async uploadFromVeo3Url(veo3Url, metadata = {}) {
        try {
            console.log('🐰 Subiendo video VEO3 a Bunny.net:', veo3Url);

            // Paso 1: Crear video en Bunny.net (NO especificar isPublic al crear)
            const createResponse = await axios.post(`${this.baseUrl}/library/${this.libraryId}/videos`, {
                title: metadata.title || `Fantasy Video ${Date.now()}`,
                collectionId: metadata.collectionId || ''
            }, {
                headers: {
                    'AccessKey': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const videoId = createResponse.data.guid;
            console.log('🐰 Video creado en Bunny.net:', videoId);

            // Paso 2: Upload desde URL externa
            const uploadResponse = await axios.post(
                `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}/fetch`,
                {
                    url: veo3Url,
                    headers: {
                        'User-Agent': 'Fantasy-LaLiga-Bot/1.0'
                    }
                },
                {
                    headers: {
                        'AccessKey': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('🐰 Upload iniciado desde VEO3 URL');

            // Paso 3: Esperar a que se complete el processing
            const videoInfo = await this.waitForProcessing(videoId);

            // Paso 3.5: Hacer el video público automáticamente
            console.log('🔓 Haciendo video público automáticamente...');
            await this.makeVideoPublic(videoId);

            // Paso 4: Generar URLs de acceso
            const bunnyVideoData = {
                id: videoId,
                title: metadata.title || `Fantasy Video ${Date.now()}`,
                sourceUrl: veo3Url,
                bunnyUrl: `${this.cdnUrl}/${videoId}/playlist.m3u8`,
                embedUrl: `${this.cdnUrl}/${videoId}/iframe`,
                thumbnailUrl: `${this.cdnUrl}/${videoId}/preview.webp`,
                directUrl: `${this.cdnUrl}/${videoId}/play_720p.mp4`,
                status: videoInfo.status,
                duration: videoInfo.duration,
                uploadedAt: new Date().toISOString(),
                metadata: {
                    ...metadata,
                    veo3TaskId: metadata.taskId,
                    playerData: metadata.playerData,
                    apiData: metadata.apiData,
                    type: metadata.type || 'veo3_generated'
                }
            };

            // Paso 5: Guardar metadata localmente
            await this.saveLocalMetadata(bunnyVideoData);

            console.log('✅ Video subido exitosamente a Bunny.net:', bunnyVideoData.directUrl);
            return bunnyVideoData;

        } catch (error) {
            console.error('❌ Error subiendo a Bunny.net:', error.message);
            if (error.response?.data) {
                console.error('❌ Bunny.net error details:', error.response.data);
            }
            throw new Error(`Fallo upload Bunny.net: ${error.message}`);
        }
    }

    /**
     * Esperar a que Bunny.net complete el processing del video
     */
    async waitForProcessing(videoId, maxWaitTime = 300000) {
        const startTime = Date.now();
        let attempts = 0;

        console.log(`🐰 Esperando processing de video ${videoId}...`);

        while (Date.now() - startTime < maxWaitTime) {
            attempts++;

            try {
                const response = await axios.get(
                    `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`,
                    {
                        headers: {
                            'AccessKey': this.apiKey
                        }
                    }
                );

                const videoInfo = response.data;

                // Estados: 0=Uploading, 1=Processing, 2=Ready, 3=Failed, 4=AwaitingUpload, 5=AwaitingProcessing
                if (videoInfo.status === 2) {
                    console.log(`✅ Video processing completado en ${attempts} intentos (${Date.now() - startTime}ms)`);
                    return videoInfo;
                } else if (videoInfo.status === 3) {
                    throw new Error(`Video processing falló: ${videoInfo.statusMessage}`);
                }

                console.log(`🐰 Video aún procesando... estado: ${videoInfo.status} (intento ${attempts})`);

            } catch (error) {
                console.error(`❌ Error verificando estado:`, error.message);
                throw error;
            }

            // Esperar antes del siguiente check
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos
        }

        throw new Error(`Timeout: Video ${videoId} no completó processing en ${maxWaitTime}ms`);
    }

    /**
     * Obtener analytics de un video
     */
    async getVideoAnalytics(videoId, dateFrom = null, dateTo = null) {
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);

            const response = await axios.get(
                `${this.baseUrl}/library/${this.libraryId}/statistics?${params}`,
                {
                    headers: {
                        'AccessKey': this.apiKey
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('❌ Error obteniendo analytics:', error.message);
            return null;
        }
    }

    /**
     * Listar todos los videos en Bunny.net
     */
    async listVideos(page = 1, itemsPerPage = 50) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/library/${this.libraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=dateUploaded`,
                {
                    headers: {
                        'AccessKey': this.apiKey
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('❌ Error listando videos:', error.message);
            return { items: [], totalItems: 0 };
        }
    }

    /**
     * Obtener información detallada de un video
     */
    async getVideoInfo(videoId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`,
                {
                    headers: {
                        'AccessKey': this.apiKey
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('❌ Error obteniendo info de video:', error.message);
            return null;
        }
    }

    /**
     * Hacer video público en Bunny.net - Configuración simplificada
     */
    async makeVideoPublic(videoId) {
        try {
            console.log(`🔓 Verificando configuración de biblioteca para acceso público...`);

            // Obtener configuración actual de la biblioteca
            const libraryResponse = await axios.get(
                `${this.baseUrl}/library/${this.libraryId}`,
                {
                    headers: {
                        'AccessKey': this.apiKey
                    }
                }
            );

            const library = libraryResponse.data;
            console.log(`📚 Biblioteca configurada - AllowDirectAccess: ${library.AllowDirectPlay}`);

            // Si la biblioteca no permite acceso directo, intentar configurarla
            if (!library.AllowDirectPlay) {
                console.log('🔧 Configurando biblioteca para acceso público...');

                try {
                    // Usar PUT para actualizar configuración de biblioteca
                    await axios.put(
                        `${this.baseUrl}/library/${this.libraryId}`,
                        {
                            Name: library.Name,
                            AllowDirectPlay: true,
                            EnableTokenAuthentication: false,
                            EnableTokenIPValidation: false,
                            BlockNoneReferrer: false,
                            BlockedReferrers: [],
                            AllowedReferrers: []
                        },
                        {
                            headers: {
                                'AccessKey': this.apiKey,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ Biblioteca configurada para acceso público con PUT');
                } catch (configError) {
                    console.warn('⚠️ No se pudo configurar biblioteca automáticamente:', configError.message);

                    // Intentar con solo AllowDirectPlay si el error persiste
                    try {
                        const simpleConfig = await axios.patch(
                            `${this.baseUrl}/library/${this.libraryId}`,
                            { AllowDirectPlay: true },
                            {
                                headers: {
                                    'AccessKey': this.apiKey,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        console.log('✅ Biblioteca configurada con PATCH simple');
                    } catch (patchError) {
                        console.warn('⚠️ PATCH también falló:', patchError.message);
                    }
                }
            }

            // Obtener info del video y configurarlo como público
            const videoInfo = await this.getVideoInfo(videoId);
            if (!videoInfo) {
                throw new Error('Video no encontrado');
            }

            console.log(`🔓 Video ${videoId} está listo - CDN URL: ${this.cdnUrl}/${videoId}/playlist.m3u8`);
            return true;

        } catch (error) {
            console.error('❌ Error en makeVideoPublic:', error.message);
            if (error.response?.data) {
                console.error('❌ Bunny.net error details:', error.response.data);
            }
            return false;
        }
    }

    /**
     * Eliminar video de Bunny.net
     */
    async deleteVideo(videoId) {
        try {
            await axios.delete(
                `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`,
                {
                    headers: {
                        'AccessKey': this.apiKey
                    }
                }
            );

            // Remover de metadata local
            await this.removeVideoMetadata(videoId);

            console.log(`🗑️ Video eliminado: ${videoId}`);
            return true;

        } catch (error) {
            console.error('❌ Error eliminando video:', error.message);
            return false;
        }
    }

    /**
     * Guardar metadata del video localmente
     */
    async saveLocalMetadata(videoData) {
        try {
            const metadata = await this.getLocalMetadata();

            // Evitar duplicados
            const existingIndex = metadata.videos.findIndex(v => v.id === videoData.id);
            if (existingIndex >= 0) {
                metadata.videos[existingIndex] = videoData;
            } else {
                metadata.videos.push(videoData);
            }

            await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));

        } catch (error) {
            console.error('❌ Error guardando metadata:', error.message);
        }
    }

    /**
     * Remover metadata del video localmente
     */
    async removeVideoMetadata(videoId) {
        try {
            const metadata = await this.getLocalMetadata();
            metadata.videos = metadata.videos.filter(v => v.id !== videoId);
            await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));

        } catch (error) {
            console.error('❌ Error removiendo metadata:', error.message);
        }
    }

    /**
     * Obtener metadata local
     */
    async getLocalMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn('⚠️ Error leyendo metadata, creando nuevo archivo');
            return { videos: [] };
        }
    }

    /**
     * Obtener videos locales con filtros
     */
    async getLocalVideos(filters = {}) {
        try {
            const metadata = await this.getLocalMetadata();
            let videos = metadata.videos;

            // Filtrar por tipo
            if (filters.type) {
                videos = videos.filter(v => v.metadata?.type === filters.type);
            }

            // Filtrar por fecha
            if (filters.dateFrom) {
                videos = videos.filter(v => new Date(v.uploadedAt) >= new Date(filters.dateFrom));
            }

            // Ordenar por fecha de upload descendente
            videos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

            // Limitar resultados
            if (filters.limit) {
                videos = videos.slice(0, filters.limit);
            }

            return videos;

        } catch (error) {
            console.error('❌ Error obteniendo videos locales:', error.message);
            return [];
        }
    }

    /**
     * Test de conectividad con Bunny.net
     */
    async testConnection() {
        try {
            if (!this.apiKey || !this.libraryId) {
                return {
                    success: false,
                    error: 'API Key o Library ID no configurados'
                };
            }

            const response = await axios.get(
                `${this.baseUrl}/library/${this.libraryId}`,
                {
                    headers: {
                        'AccessKey': this.apiKey
                    }
                }
            );

            return {
                success: true,
                library: response.data,
                message: 'Conexión Bunny.net exitosa'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generar URL de embed responsive
     */
    generateEmbedCode(videoId, options = {}) {
        const width = options.width || '100%';
        const height = options.height || '400px';
        const autoplay = options.autoplay ? 'autoplay' : '';
        const controls = options.controls !== false ? 'controls' : '';

        return `
<div style="position: relative; width: ${width}; height: ${height};">
    <iframe
        src="${this.cdnUrl}/${videoId}/iframe"
        width="100%"
        height="100%"
        frameborder="0"
        allowfullscreen
        ${autoplay}
        ${controls}
        style="position: absolute; top: 0; left: 0;">
    </iframe>
</div>`;
    }
}

module.exports = BunnyStreamManager;