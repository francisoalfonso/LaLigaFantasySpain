const ffmpeg = require('fluent-ffmpeg');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Sistema de concatenación de videos VEO3
 * Combina múltiples segmentos de Ana para crear videos largos >8s
 */
class VideoConcatenator {
    constructor() {
        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
        this.tempDir = process.env.VEO3_TEMP_DIR || './temp/veo3';
        this.logsDir = process.env.VEO3_LOGS_DIR || './logs/veo3';

        // 🔧 FIX: Path al logo outro estático
        this.logoOutroPath = path.join(this.outputDir, 'logo-static.mp4');

        // Configuración de concatenación
        // NOTA: Con frame-to-frame transitions, crossfade de VIDEO NO es necesario
        // PERO audio crossfade SÍ mejora transiciones para evitar cortes bruscos
        // Ver: docs/VEO3_TRANSICIONES_FRAME_TO_FRAME.md
        this.config = {
            // Transición entre segmentos
            transition: {
                type: 'crossfade', // Tipo de transición (legacy)
                duration: 0.5, // Duración de transición en segundos
                enabled: false // ⚠️ DESACTIVADO por defecto - usar frame-to-frame para VIDEO
            },
            // Audio
            audio: {
                normalize: true, // Normalizar audio entre segmentos
                fadeInOut: true, // ✅ ACTIVADO - evita cortes de audio en transiciones
                fadeDuration: 0.3 // Duración del fade (0.3s para transiciones suaves)
            },
            // Video
            video: {
                resolution: '1080x1920', // Resolución final (9:16)
                framerate: 30, // FPS
                bitrate: '2M' // Bitrate del video
            },
            // 🔧 FIX: Logo outro automático
            outro: {
                enabled: true, // ✅ ACTIVADO - agregar logo al final
                logoPath: null, // Se establece dinámicamente
                duration: 1.5 // Duración del logo (1.5s)
            }
        };

        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.outputDir, this.tempDir, this.logsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Concatenar lista de videos
     * @param {Array} videoPaths - Array de rutas de videos
     * @param {object} options - Opciones de concatenación
     * @returns {Promise<string>} - Ruta del video concatenado
     */
    async concatenateVideos(videoPaths, options = {}) {
        try {
            logger.info(`[VideoConcatenator] Concatenando ${videoPaths.length} videos...`);

            // Validar que todos los videos existen
            for (const videoPath of videoPaths) {
                if (!fs.existsSync(videoPath)) {
                    throw new Error(`Video no encontrado: ${videoPath}`);
                }
            }

            const config = { ...this.config, ...options };

            // 🔧 FIX: Agregar logo outro automáticamente si está habilitado
            const finalVideoPaths = [...videoPaths];
            if (config.outro.enabled && fs.existsSync(this.logoOutroPath)) {
                logger.info(`[VideoConcatenator] ✅ Agregando logo outro al final...`);
                finalVideoPaths.push(this.logoOutroPath);
            } else if (config.outro.enabled) {
                logger.warn(
                    `[VideoConcatenator] ⚠️  Logo outro no encontrado: ${this.logoOutroPath}`
                );
            }

            const outputFileName = `ana-concatenated-${Date.now()}.mp4`;
            const outputPath = path.join(this.outputDir, outputFileName);

            if (config.transition.enabled && finalVideoPaths.length > 1) {
                // Concatenación con transiciones
                return await this.concatenateWithTransitions(finalVideoPaths, outputPath, config);
            } else {
                // Concatenación simple sin transiciones
                return await this.concatenateSimple(finalVideoPaths, outputPath, config);
            }
        } catch (error) {
            logger.error('[VideoConcatenator] Error concatenando videos:', error.message);
            throw error;
        }
    }

    /**
     * Concatenación simple sin transiciones de video
     * PERO con audio crossfade para evitar cortes bruscos
     * @param {Array} videoPaths - Array de rutas de videos
     * @param {string} outputPath - Ruta del archivo final
     * @param {object} config - Configuración
     * @returns {Promise<string>} - Ruta del video concatenado
     */
    async concatenateSimple(videoPaths, outputPath, config) {
        return new Promise((resolve, reject) => {
            logger.info('[VideoConcatenator] Concatenación simple...');

            const command = ffmpeg();

            // Agregar todos los videos como inputs
            videoPaths.forEach(videoPath => {
                command.input(videoPath);
            });

            // 🔧 FIX: Aplicar audio crossfade si está activado
            if (config.audio.fadeInOut && videoPaths.length > 1) {
                logger.info('[VideoConcatenator] Aplicando audio crossfade entre segmentos...');
                const audioFilters = this.generateAudioCrossfadeFilters(videoPaths.length, config);

                command
                    .complexFilter(audioFilters, ['audio_out'])
                    .map('[audio_out]')
                    .videoCodec('copy') // Copiar video sin procesar (más rápido)
                    .audioCodec('aac')
                    .on('start', commandLine => {
                        logger.info(`[VideoConcatenator] FFmpeg iniciado: ${commandLine}`);
                    })
                    .on('progress', progress => {
                        if (progress.percent) {
                            logger.info(
                                `[VideoConcatenator] Progreso: ${Math.round(progress.percent)}%`
                            );
                        }
                    })
                    .on('end', () => {
                        logger.info(
                            `[VideoConcatenator] ✅ Concatenación completada: ${outputPath}`
                        );
                        resolve(outputPath);
                    })
                    .on('error', error => {
                        logger.error('[VideoConcatenator] ❌ Error FFmpeg:', error.message);
                        reject(error);
                    })
                    .save(outputPath);
            } else {
                // 🔧 FIX: Concatenación básica con archivo concat manual (rutas absolutas)
                // Crear archivo concat con rutas absolutas
                const concatListPath = path.join(this.tempDir, `concat-list-${Date.now()}.txt`);
                const concatContent = videoPaths
                    .map(videoPath => {
                        // Convertir a ruta absoluta
                        const absolutePath = path.isAbsolute(videoPath)
                            ? videoPath
                            : path.resolve(videoPath);
                        return `file '${absolutePath}'`;
                    })
                    .join('\n');

                fs.writeFileSync(concatListPath, concatContent);
                logger.info(`[VideoConcatenator] 📋 Archivo concat creado: ${concatListPath}`);
                logger.info(`[VideoConcatenator] 📂 Videos a concatenar:\n${concatContent}`);

                // Usar concat demuxer con archivo de lista
                ffmpeg()
                    .input(concatListPath)
                    .inputOptions(['-f concat', '-safe 0'])
                    .outputOptions(['-c copy']) // Copiar streams sin re-encodear
                    .on('start', commandLine => {
                        logger.info(`[VideoConcatenator] FFmpeg iniciado: ${commandLine}`);
                    })
                    .on('progress', progress => {
                        if (progress.percent) {
                            logger.info(
                                `[VideoConcatenator] Progreso: ${Math.round(progress.percent)}%`
                            );
                        }
                    })
                    .on('end', () => {
                        logger.info(
                            `[VideoConcatenator] ✅ Concatenación completada: ${outputPath}`
                        );
                        // Limpiar archivo concat temporal
                        try {
                            fs.unlinkSync(concatListPath);
                        } catch (err) {
                            logger.warn(
                                `[VideoConcatenator] No se pudo eliminar archivo concat temporal: ${err.message}`
                            );
                        }
                        resolve(outputPath);
                    })
                    .on('error', error => {
                        logger.error('[VideoConcatenator] ❌ Error FFmpeg:', error.message);
                        // Limpiar archivo concat temporal
                        try {
                            fs.unlinkSync(concatListPath);
                            // eslint-disable-next-line no-unused-vars
                        } catch (err) {
                            // Ignorar error de limpieza
                        }
                        reject(error);
                    })
                    .save(outputPath);
            }
        });
    }

    /**
     * Concatenación con transiciones entre segmentos
     * @param {Array} videoPaths - Array de rutas de videos
     * @param {string} outputPath - Ruta del archivo final
     * @param {object} config - Configuración
     * @returns {Promise<string>} - Ruta del video concatenado
     */
    async concatenateWithTransitions(videoPaths, outputPath, config) {
        return new Promise((resolve, reject) => {
            logger.info('[VideoConcatenator] Concatenación con transiciones...');

            const command = ffmpeg();

            // Agregar todos los videos como inputs
            videoPaths.forEach(videoPath => {
                command.input(videoPath);
            });

            // Generar filtros de transición
            const filters = this.generateTransitionFilters(videoPaths.length, config);

            command
                .complexFilter(filters)
                .map('[final_output]')
                .videoCodec('libx264')
                .audioCodec('aac')
                .videoBitrate(config.video.bitrate)
                .fps(config.video.framerate)
                .size(config.video.resolution)
                .format('mp4')
                .on('start', commandLine => {
                    logger.info(`[VideoConcatenator] FFmpeg iniciado: ${commandLine}`);
                })
                .on('progress', progress => {
                    if (progress.percent) {
                        logger.info(
                            `[VideoConcatenator] Progreso: ${Math.round(progress.percent)}%`
                        );
                    }
                })
                .on('end', () => {
                    logger.info(
                        `[VideoConcatenator] ✅ Concatenación con transiciones completada: ${outputPath}`
                    );
                    resolve(outputPath);
                })
                .on('error', error => {
                    logger.error('[VideoConcatenator] ❌ Error FFmpeg:', error.message);
                    reject(error);
                })
                .save(outputPath);
        });
    }

    /**
     * Generar filtros FFmpeg para transiciones
     * @param {number} videoCount - Número de videos
     * @param {object} config - Configuración
     * @returns {Array} - Array de filtros FFmpeg
     */
    generateTransitionFilters(videoCount, config) {
        const filters = [];
        const transitionDuration = config.transition.duration;

        if (videoCount === 2) {
            // Transición simple entre 2 videos
            filters.push(
                `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=7.5[video_out]`
            );
            filters.push(`[0:a][1:a]acrossfade=d=${transitionDuration}[audio_out]`);
            filters.push(`[video_out][audio_out]concat=n=1:v=1:a=1[final_output]`);
        } else if (videoCount > 2) {
            // Múltiples transiciones
            for (let i = 0; i < videoCount - 1; i++) {
                if (i === 0) {
                    // Primera transición
                    filters.push(
                        `[${i}:v][${i + 1}:v]xfade=transition=fade:duration=${transitionDuration}:offset=7.5[v${i}]`
                    );
                    filters.push(`[${i}:a][${i + 1}:a]acrossfade=d=${transitionDuration}[a${i}]`);
                } else if (i === videoCount - 2) {
                    // Última transición
                    filters.push(
                        `[v${i - 1}][${i + 1}:v]xfade=transition=fade:duration=${transitionDuration}:offset=7.5[video_out]`
                    );
                    filters.push(
                        `[a${i - 1}][${i + 1}:a]acrossfade=d=${transitionDuration}[audio_out]`
                    );
                } else {
                    // Transiciones intermedias
                    filters.push(
                        `[v${i - 1}][${i + 1}:v]xfade=transition=fade:duration=${transitionDuration}:offset=7.5[v${i}]`
                    );
                    filters.push(
                        `[a${i - 1}][${i + 1}:a]acrossfade=d=${transitionDuration}[a${i}]`
                    );
                }
            }
            filters.push(`[video_out][audio_out]concat=n=1:v=1:a=1[final_output]`);
        }

        return filters;
    }

    /**
     * Generar filtros FFmpeg SOLO para audio crossfade (sin tocar video)
     * Usado en concatenación simple para evitar cortes de audio
     * @param {number} videoCount - Número de videos
     * @param {object} config - Configuración
     * @returns {Array} - Array de filtros FFmpeg para audio
     */
    generateAudioCrossfadeFilters(videoCount, config) {
        const filters = [];
        const fadeDuration = config.audio.fadeDuration;

        if (videoCount === 2) {
            // Audio crossfade simple entre 2 videos
            filters.push({
                filter: 'acrossfade',
                options: { d: fadeDuration },
                inputs: ['0:a', '1:a'],
                outputs: 'audio_out'
            });
        } else if (videoCount > 2) {
            // Múltiples audio crossfades
            for (let i = 0; i < videoCount - 1; i++) {
                if (i === 0) {
                    // Primer crossfade
                    filters.push({
                        filter: 'acrossfade',
                        options: { d: fadeDuration },
                        inputs: [`${i}:a`, `${i + 1}:a`],
                        outputs: `a${i}`
                    });
                } else if (i === videoCount - 2) {
                    // Último crossfade
                    filters.push({
                        filter: 'acrossfade',
                        options: { d: fadeDuration },
                        inputs: [`a${i - 1}`, `${i + 1}:a`],
                        outputs: 'audio_out'
                    });
                } else {
                    // Crossfades intermedios
                    filters.push({
                        filter: 'acrossfade',
                        options: { d: fadeDuration },
                        inputs: [`a${i - 1}`, `${i + 1}:a`],
                        outputs: `a${i}`
                    });
                }
            }
        }

        logger.info(`[VideoConcatenator] Generados ${filters.length} audio crossfade filters`);
        return filters;
    }

    /**
     * Crear video largo a partir de múltiples prompts
     * @param {Array} prompts - Array de prompts para generar
     * @param {object} veo3Client - Cliente VEO3
     * @param {object} options - Opciones adicionales
     * @returns {Promise<string>} - Ruta del video largo final
     */
    async createLongVideoFromPrompts(prompts, veo3Client, options = {}) {
        try {
            logger.info(
                `[VideoConcatenator] Creando video largo con ${prompts.length} segmentos...`
            );

            const videoPaths = [];
            const startTime = Date.now();

            // Generar cada segmento individualmente
            for (let i = 0; i < prompts.length; i++) {
                const prompt = prompts[i];
                logger.info(`[VideoConcatenator] Generando segmento ${i + 1}/${prompts.length}...`);

                try {
                    const video = await veo3Client.generateCompleteVideo(
                        prompt,
                        options.veo3Options
                    );

                    // Descargar video localmente
                    const segmentPath = path.join(this.tempDir, `segment-${i}-${Date.now()}.mp4`);
                    await this.downloadVideo(video.url, segmentPath);
                    videoPaths.push(segmentPath);

                    logger.info(`[VideoConcatenator] Segmento ${i + 1} completado: ${segmentPath}`);
                } catch (error) {
                    logger.error(`[VideoConcatenator] Error en segmento ${i + 1}:`, error.message);
                    // Continuar con los demás segmentos
                }
            }

            if (videoPaths.length === 0) {
                throw new Error('No se pudo generar ningún segmento');
            }

            logger.info(
                `[VideoConcatenator] ${videoPaths.length} segmentos generados. Concatenando...`
            );

            // Concatenar todos los segmentos
            const finalPath = await this.concatenateVideos(videoPaths, options);
            const totalTime = Date.now() - startTime;

            // Limpiar archivos temporales
            videoPaths.forEach(path => {
                if (fs.existsSync(path)) {
                    fs.unlinkSync(path);
                }
            });

            logger.info(`[VideoConcatenator] ✅ Video largo completado: ${finalPath}`);
            logger.info(`[VideoConcatenator] Tiempo total: ${(totalTime / 1000).toFixed(2)}s`);

            // Log de la operación
            this.logConcatenation({
                success: true,
                segmentsGenerated: videoPaths.length,
                segmentsRequested: prompts.length,
                outputPath: finalPath,
                totalTime
            });

            return finalPath;
        } catch (error) {
            logger.error('[VideoConcatenator] Error creando video largo:', error.message);
            throw error;
        }
    }

    /**
     * Descargar video desde URL
     * @param {string} url - URL del video
     * @param {string} localPath - Ruta local donde guardar
     * @returns {Promise<string>} - Ruta local del video
     */
    async downloadVideo(url, localPath) {
        try {
            const axios = require('axios');
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(localPath));
                writer.on('error', reject);
            });
        } catch (error) {
            logger.error('[VideoConcatenator] Error descargando video:', error.message);
            throw error;
        }
    }

    /**
     * Test del sistema de concatenación
     * @param {Array} testVideoPaths - Videos para test (opcional)
     * @returns {Promise<object>} - Resultado del test
     */
    async runTest(testVideoPaths = null) {
        try {
            logger.info('[VideoConcatenator] 🧪 Ejecutando test de concatenación...');

            let videosToConcat = testVideoPaths;

            if (!videosToConcat) {
                // Buscar videos Ana existentes para test
                const anaVideos = this.findAnaVideos().slice(0, 2); // Máximo 2 para test

                if (anaVideos.length < 2) {
                    throw new Error(
                        'Se necesitan al menos 2 videos Ana para test. Ejecuta: npm run veo3:test-ana'
                    );
                }

                videosToConcat = anaVideos;
            }

            logger.info(
                `[VideoConcatenator] Concatenando ${videosToConcat.length} videos de test...`
            );

            const startTime = Date.now();
            const resultPath = await this.concatenateVideos(videosToConcat, {
                transition: { enabled: true, duration: 0.5 }
            });
            const processingTime = Date.now() - startTime;

            logger.info('[VideoConcatenator] ✅ Test completado exitosamente');
            logger.info(`[VideoConcatenator] Video concatenado: ${resultPath}`);
            logger.info(
                `[VideoConcatenator] Tiempo de procesamiento: ${(processingTime / 1000).toFixed(2)}s`
            );

            return {
                success: true,
                inputVideos: videosToConcat,
                outputVideo: resultPath,
                processingTime
            };
        } catch (error) {
            logger.error('[VideoConcatenator] ❌ Test falló:', error.message);
            throw error;
        }
    }

    /**
     * Buscar videos Ana existentes
     * @returns {Array} - Array de rutas de videos Ana
     */
    findAnaVideos() {
        try {
            if (!fs.existsSync(this.outputDir)) {
                return [];
            }

            return fs
                .readdirSync(this.outputDir)
                .filter(file => file.startsWith('ana-') && file.endsWith('.mp4'))
                .map(file => path.join(this.outputDir, file))
                .filter(filePath => fs.existsSync(filePath));
        } catch (error) {
            logger.error('[VideoConcatenator] Error buscando videos Ana:', error.message);
            return [];
        }
    }

    /**
     * Log de operaciones de concatenación
     * @param {object} operation - Detalles de la operación
     */
    logConcatenation(operation) {
        const logPath = path.join(this.logsDir, 'concatenation.log');
        const logEntry = {
            timestamp: new Date().toISOString(),
            success: operation.success,
            segmentsRequested: operation.segmentsRequested,
            segmentsGenerated: operation.segmentsGenerated,
            outputPath: operation.outputPath,
            processingTime: operation.totalTime
        };

        fs.appendFileSync(logPath, `${JSON.stringify(logEntry)}\n`);
    }
}

module.exports = VideoConcatenator;
