const ffmpeg = require('fluent-ffmpeg');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');
const CaptionsService = require('../youtubeShorts/captionsService');
const PlayerCardOverlay = require('./playerCardOverlay');
const AudioAnalyzer = require('./audioAnalyzer');
const { execSync } = require('child_process');

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

        // ✨ NUEVO: Generador de subtítulos virales (formato aprobado Test #47)
        this.captionsService = new CaptionsService();

        // ✨ NUEVO: Generador de tarjetas de jugador
        this.playerCardOverlay = new PlayerCardOverlay();

        // ✨ NUEVO (8 Oct 2025): Analizador de audio para detectar fin de habla
        this.audioAnalyzer = new AudioAnalyzer();

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
                fadeInOut: false, // ⚠️ DESACTIVADO por defecto - evita crossfades no deseados
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
                duration: 1.5, // Duración del logo (1.5s)
                // 🔧 FIX #2: Freeze frame antes del logo para transición controlada
                freezeFrame: {
                    enabled: true, // ✅ ACTIVADO - agregar freeze frame antes del logo
                    duration: 0.8 // Duración del freeze frame (0.8s)
                }
            },
            // ✨ NUEVO: Subtítulos virales automáticos
            viralCaptions: {
                enabled: true, // ✅ ACTIVADO - agregar subtítulos virales
                applyBeforeConcatenation: true // Aplicar a cada segmento antes de concatenar
            },
            // ✨ NUEVO: Tarjeta de jugador overlay
            playerCard: {
                enabled: false, // ⚠️ DESACTIVADO por defecto - activar cuando se pasan playerData
                startTime: 3.0, // Aparece en el segundo 3
                duration: 4.0, // Visible durante 4 segundos (hasta segundo 7)
                slideInDuration: 0.5, // Animación de entrada dura 0.5s
                applyToFirstSegment: true // Solo aplicar al primer segmento
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
     * @param {Array} videoPaths - Array de rutas de videos O array de objetos {videoPath, dialogue}
     * @param {object} options - Opciones de concatenación
     * @returns {Promise<string>} - Ruta del video concatenado
     */
    async concatenateVideos(videoPaths, options = {}) {
        try {
            logger.info(`[VideoConcatenator] Concatenando ${videoPaths.length} videos...`);

            // Normalizar input: soportar tanto strings como objetos {videoPath, dialogue}
            const segments = videoPaths.map(item => {
                if (typeof item === 'string') {
                    return { videoPath: item, dialogue: null };
                }
                return item;
            });

            // Validar que todos los videos existen
            for (const segment of segments) {
                if (!fs.existsSync(segment.videoPath)) {
                    throw new Error(`Video no encontrado: ${segment.videoPath}`);
                }
            }

            const config = { ...this.config, ...options };

            // ✨ NUEVO: Aplicar subtítulos virales automáticamente si está habilitado
            let processedSegments = [...segments];
            if (config.viralCaptions.enabled && config.viralCaptions.applyBeforeConcatenation) {
                logger.info(`[VideoConcatenator] ✨ Aplicando subtítulos virales a ${segments.length} segmentos...`);
                processedSegments = await this.applyViralCaptionsToSegments(segments);
            }

            // ✨ NUEVO: Aplicar tarjeta de jugador al primer segmento si está habilitado
            if (config.playerCard.enabled && options.playerData && processedSegments.length > 0) {
                logger.info(`[VideoConcatenator] 🃏 Aplicando tarjeta de jugador a video final...`);

                try {
                    // Aplicar tarjeta solo al primer segmento (donde Ana menciona al jugador)
                    const firstSegmentIndex = config.playerCard.applyToFirstSegment ? 0 : processedSegments.length - 1;
                    const segmentToProcess = processedSegments[firstSegmentIndex];

                    const videoWithCard = await this.playerCardOverlay.generateAndApplyCard(
                        segmentToProcess.videoPath,
                        options.playerData,
                        {
                            startTime: config.playerCard.startTime,
                            duration: config.playerCard.duration,
                            slideInDuration: config.playerCard.slideInDuration,
                            cleanup: true // Eliminar imagen temporal después
                        }
                    );

                    // Reemplazar video procesado
                    processedSegments[firstSegmentIndex].videoPath = videoWithCard;
                    logger.info(`[VideoConcatenator] ✅ Tarjeta de jugador aplicada a segmento ${firstSegmentIndex + 1}`);

                } catch (error) {
                    logger.error(`[VideoConcatenator] ❌ Error aplicando tarjeta de jugador: ${error.message}`);
                    logger.warn(`[VideoConcatenator] ⚠️  Continuando sin tarjeta de jugador...`);
                }
            }

            // Extraer solo las rutas de video para concatenación
            let finalVideoPaths = processedSegments.map(s => s.videoPath);

            // ✨ NUEVO (8 Oct 2025): Detectar fin real del audio y recortar TODOS los segmentos
            // Esto evita que Ana empiece a prepararse para hablar de nuevo al final de cada segmento
            if (config.outro.enabled && config.outro.freezeFrame.enabled) {
                logger.info(`[VideoConcatenator] 🎤 Analizando audio de ${finalVideoPaths.length} segmentos...`);

                try {
                    // Analizar todos los segmentos para detectar cuándo termina el audio
                    const audioDurations = await this.audioAnalyzer.analyzeAllSegments(finalVideoPaths);

                    // Recortar cada segmento a su duración real de audio
                    const trimmedPaths = [];
                    for (let i = 0; i < finalVideoPaths.length; i++) {
                        const videoPath = finalVideoPaths[i];
                        const audioDuration = audioDurations[i];

                        logger.info(`[VideoConcatenator] ✂️ Segmento ${i + 1}: recortando a ${audioDuration.toFixed(2)}s (fin de audio)...`);

                        try {
                            const trimmedPath = await this.audioAnalyzer.trimToAudioEnd(
                                videoPath,
                                audioDuration,
                                {
                                    safetyMargin: 0.05, // Solo 0.05s extra (mínimo margen)
                                    outputDir: this.tempDir
                                }
                            );
                            trimmedPaths.push(trimmedPath);
                            logger.info(`[VideoConcatenator] ✅ Segmento ${i + 1} recortado correctamente`);
                        } catch (error) {
                            logger.error(`[VideoConcatenator] ❌ Error recortando segmento ${i + 1}: ${error.message}`);
                            logger.warn(`[VideoConcatenator] ⚠️  Usando segmento original...`);
                            trimmedPaths.push(videoPath);
                        }
                    }

                    finalVideoPaths = trimmedPaths;
                    logger.info(`[VideoConcatenator] ✅ Todos los segmentos recortados al fin de audio`);

                } catch (error) {
                    logger.error(`[VideoConcatenator] ❌ Error en análisis de audio: ${error.message}`);
                    logger.warn(`[VideoConcatenator] ⚠️  Continuando sin recorte automático...`);
                }
            }

            // 🔧 FIX #2: Crear freeze frame del último segmento ANTES de agregar logo
            let freezeFramePath = null;
            if (config.outro.enabled && config.outro.freezeFrame.enabled && finalVideoPaths.length > 0) {
                const lastSegmentPath = finalVideoPaths[finalVideoPaths.length - 1];
                logger.info(`[VideoConcatenator] 🔧 Creando freeze frame del último segmento para transición controlada al logo...`);

                try {
                    freezeFramePath = await this.createFreezeFrame(
                        lastSegmentPath,
                        config.outro.freezeFrame.duration
                    );
                    logger.info(`[VideoConcatenator] ✅ Freeze frame creado: ${freezeFramePath}`);
                    finalVideoPaths.push(freezeFramePath);
                } catch (error) {
                    logger.error(`[VideoConcatenator] ❌ Error creando freeze frame: ${error.message}`);
                    logger.warn(`[VideoConcatenator] ⚠️  Continuando sin freeze frame...`);
                }
            }

            // 🔧 FIX: Agregar logo outro automáticamente si está habilitado
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

                // 🔧 FIX: Cuando hay freeze frame + logo, usar concat FILTER en lugar de concat DEMUXER
                // El concat demuxer (-c copy) puede cortar audio si los streams no coinciden exactamente
                // El concat filter re-encodea pero garantiza que TODO el audio se preserve
                const useFilterConcat = config.outro.enabled && config.outro.freezeFrame.enabled;

                if (useFilterConcat) {
                    // Usar concat FILTER (más lento pero audio perfecto)
                    logger.info(`[VideoConcatenator] 🎬 Usando concat filter para preservar audio completo...`);

                    // Construir comando FFmpeg con concat filter
                    const ffmpegCommand = ffmpeg();

                    // Agregar cada video como input
                    videoPaths.forEach(videoPath => {
                        ffmpegCommand.input(videoPath);
                    });

                    // Construir filtro concat
                    const filterInputs = videoPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');
                    const concatFilter = `${filterInputs}concat=n=${videoPaths.length}:v=1:a=1[outv][outa]`;

                    ffmpegCommand
                        .complexFilter(concatFilter)
                        .outputOptions(['-map', '[outv]', '-map', '[outa]'])
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .outputOptions([
                            '-pix_fmt yuv420p',
                            '-preset fast',
                            '-movflags +faststart'
                        ])
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

                } else {
                    // Usar concat DEMUXER (rápido, solo para videos simples sin freeze/logo)
                    logger.info(`[VideoConcatenator] ⚡ Copiando streams sin re-encodear (fast mode)...`);

                    ffmpeg()
                        .input(concatListPath)
                        .inputOptions(['-f concat', '-safe 0'])
                        .outputOptions(['-c copy'])
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
            }
        });
    }

    /**
     * ✨ Aplicar subtítulos virales (formato Test #47 aprobado) a cada segmento
     * Usa CaptionsService con ASS karaoke word-by-word + golden color (#FFD700)
     * @param {Array} segments - Array de objetos {videoPath, dialogue, duration}
     * @returns {Promise<Array>} - Array de segmentos con subtítulos aplicados
     */
    async applyViralCaptionsToSegments(segments) {
        const processedSegments = [];
        let currentTime = 0;

        // Detectar duración de cada segmento
        const segmentsWithDuration = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            // Obtener duración real del video con ffprobe
            let duration = segment.duration || 8;
            try {
                const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${segment.videoPath}"`;
                const durationOutput = execSync(durationCmd, { encoding: 'utf8' }).trim();
                duration = parseFloat(durationOutput);
            } catch (err) {
                logger.warn(`[VideoConcatenator] No se pudo obtener duración de ${segment.videoPath}, usando 8s por defecto`);
            }

            segmentsWithDuration.push({
                index: i + 1,
                dialogue: segment.dialogue,
                duration: duration,
                startTime: currentTime
            });

            currentTime += duration;
        }

        // Generar archivo ASS karaoke para todos los segmentos
        logger.info(`[VideoConcatenator] 📝 Generando subtítulos ASS karaoke (Test #47)...`);

        try {
            const captionsResult = await this.captionsService.generateCaptions(
                segmentsWithDuration,
                'karaoke',  // Formato aprobado Test #47
                'ass'       // Advanced SubStation Alpha
            );

            if (!captionsResult.success) {
                throw new Error(captionsResult.error);
            }

            const assFilePath = captionsResult.captionsFile;
            logger.info(`[VideoConcatenator] ✅ Archivo ASS generado: ${assFilePath}`);
            logger.info(`[VideoConcatenator]    Total subtítulos: ${captionsResult.metadata.totalSubtitles}`);
            logger.info(`[VideoConcatenator]    Estilo: Karaoke word-by-word golden (#FFD700)`);

            // Aplicar subtítulos ASS a cada segmento individual
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];

                // Si el segmento no tiene diálogo, saltamos los subtítulos
                if (!segment.dialogue || segment.dialogue.trim() === '') {
                    logger.warn(`[VideoConcatenator] ⚠️  Segmento ${i + 1} sin diálogo, omitiendo subtítulos`);
                    processedSegments.push(segment);
                    continue;
                }

                try {
                    logger.info(`[VideoConcatenator] 🎬 Aplicando subtítulos ASS a segmento ${i + 1}/${segments.length}...`);

                    const outputPath = segment.videoPath.replace('.mp4', '-with-captions.mp4');

                    // Aplicar subtítulos usando filtro ASS de FFmpeg
                    const ffmpegCmd = `ffmpeg -i "${segment.videoPath}" -vf "ass='${assFilePath}'" -c:a copy "${outputPath}" -y`;

                    logger.info(`[VideoConcatenator] FFmpeg: ${ffmpegCmd.substring(0, 150)}...`);
                    execSync(ffmpegCmd, { stdio: 'pipe' });

                    processedSegments.push({
                        ...segment,
                        videoPath: outputPath,
                        originalPath: segment.videoPath,
                        captionsApplied: true,
                        captionsFormat: 'ass-karaoke'
                    });

                    logger.info(`[VideoConcatenator] ✅ Subtítulos ASS aplicados a segmento ${i + 1}`);

                } catch (error) {
                    logger.error(`[VideoConcatenator] ❌ Error aplicando subtítulos a segmento ${i + 1}:`, error.message);
                    logger.warn(`[VideoConcatenator] ⚠️  Continuando sin subtítulos para este segmento...`);

                    processedSegments.push({
                        ...segment,
                        captionsApplied: false,
                        error: error.message
                    });
                }
            }

            // Limpiar archivo ASS temporal
            try {
                fs.unlinkSync(assFilePath);
            } catch (err) {
                logger.warn(`[VideoConcatenator] No se pudo eliminar ASS temporal: ${err.message}`);
            }

        } catch (error) {
            logger.error(`[VideoConcatenator] ❌ Error generando subtítulos ASS:`, error.message);
            logger.warn(`[VideoConcatenator] ⚠️  Continuando sin subtítulos...`);

            // Si falla la generación ASS, devolver segmentos originales sin subtítulos
            return segments.map(s => ({ ...s, captionsApplied: false, error: error.message }));
        }

        const successCount = processedSegments.filter(s => s.captionsApplied).length;
        logger.info(`[VideoConcatenator] ✅ Subtítulos ASS aplicados a ${successCount}/${segments.length} segmentos`);

        return processedSegments;
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
     * 🔧 FIX #2: Crear freeze frame del último frame de un video
     * Extrae el último frame y crea un clip de duración específica con ese frame congelado
     * Usado para crear transición controlada al logo outro
     * @param {string} videoPath - Ruta del video del cual extraer el último frame
     * @param {number} duration - Duración del freeze frame en segundos
     * @returns {Promise<string>} - Ruta del video freeze frame generado
     */
    async createFreezeFrame(videoPath, duration = 0.8) {
        return new Promise((resolve, reject) => {
            try {
                const { execSync } = require('child_process');
                const freezeFrameFileName = `freeze-frame-${Date.now()}.mp4`;
                const freezeFramePath = path.join(this.tempDir, freezeFrameFileName);
                const tempImagePath = path.join(this.tempDir, `last-frame-${Date.now()}.jpg`);

                logger.info(`[VideoConcatenator] Extrayendo último frame de: ${videoPath}`);

                // Paso 1: Extraer el último frame del video usando raw FFmpeg
                try {
                    const extractCmd = `ffmpeg -sseof -1 -i "${videoPath}" -update 1 -q:v 1 -frames:v 1 "${tempImagePath}" -y`;
                    logger.info(`[VideoConcatenator] FFmpeg comando: ${extractCmd}`);
                    execSync(extractCmd, { stdio: 'pipe' });
                    logger.info(`[VideoConcatenator] ✅ Último frame extraído: ${tempImagePath}`);
                } catch (extractError) {
                    logger.error(`[VideoConcatenator] ❌ Error extrayendo frame: ${extractError.message}`);
                    return reject(extractError);
                }

                // Paso 2: Crear video con audio silencioso usando raw FFmpeg
                // Este método funciona sin lavfi: crear audio silencio desde una fuente sine muy baja
                logger.info(`[VideoConcatenator] Creando freeze frame de ${duration}s con audio...`);

                try {
                    // Comando que funciona sin lavfi: loop imagen + generar audio silencio con sine a volumen 0
                    const createCmd = `ffmpeg -loop 1 -i "${tempImagePath}" -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t ${duration} -c:v libx264 -c:a aac -pix_fmt yuv420p -preset fast -shortest "${freezeFramePath}" -y`;

                    logger.info(`[VideoConcatenator] FFmpeg comando: ${createCmd}`);
                    execSync(createCmd, { stdio: 'pipe' });
                    logger.info(`[VideoConcatenator] ✅ Freeze frame creado: ${freezeFramePath}`);

                    // Limpiar imagen temporal
                    try {
                        fs.unlinkSync(tempImagePath);
                    } catch (err) {
                        logger.warn(`[VideoConcatenator] No se pudo eliminar imagen temporal: ${err.message}`);
                    }

                    resolve(freezeFramePath);
                } catch (createError) {
                    logger.error(`[VideoConcatenator] ❌ Error creando freeze frame: ${createError.message}`);

                    // Si lavfi sigue sin funcionar, crear sin audio (fallback)
                    logger.warn(`[VideoConcatenator] ⚠️  Intentando crear freeze frame SIN audio (fallback)...`);

                    try {
                        const fallbackCmd = `ffmpeg -loop 1 -i "${tempImagePath}" -t ${duration} -c:v libx264 -pix_fmt yuv420p -preset fast -an "${freezeFramePath}" -y`;
                        execSync(fallbackCmd, { stdio: 'pipe' });
                        logger.warn(`[VideoConcatenator] ⚠️  Freeze frame creado SIN audio: ${freezeFramePath}`);

                        // Limpiar imagen temporal
                        try {
                            fs.unlinkSync(tempImagePath);
                        } catch (err) {
                            // Ignorar
                        }

                        resolve(freezeFramePath);
                    } catch (fallbackError) {
                        logger.error(`[VideoConcatenator] ❌ Error en fallback: ${fallbackError.message}`);

                        // Limpiar archivos temporales
                        try {
                            if (fs.existsSync(tempImagePath)) {
                                fs.unlinkSync(tempImagePath);
                            }
                        } catch (err) {
                            // Ignorar error de limpieza
                        }

                        reject(fallbackError);
                    }
                }
            } catch (error) {
                logger.error(`[VideoConcatenator] ❌ Error en createFreezeFrame: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Recortar video a duración específica
     * @param {string} videoPath - Ruta del video a recortar
     * @param {number} duration - Duración objetivo en segundos
     * @returns {Promise<string>} - Ruta del video recortado
     */
    async trimVideo(videoPath, duration) {
        return new Promise((resolve, reject) => {
            try {
                const trimmedFileName = `trimmed-${Date.now()}.mp4`;
                const trimmedPath = path.join(this.tempDir, trimmedFileName);

                logger.info(`[VideoConcatenator] ✂️ Recortando video a ${duration}s: ${videoPath}`);

                ffmpeg(videoPath)
                    .setStartTime(0)
                    .setDuration(duration)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions([
                        '-pix_fmt yuv420p',
                        '-preset fast',
                        '-movflags +faststart'
                    ])
                    .on('start', commandLine => {
                        logger.info(`[VideoConcatenator] FFmpeg command: ${commandLine}`);
                    })
                    .on('progress', progress => {
                        if (progress.percent) {
                            logger.info(`[VideoConcatenator] Progreso recorte: ${progress.percent.toFixed(1)}%`);
                        }
                    })
                    .on('end', () => {
                        logger.info(`[VideoConcatenator] ✅ Video recortado exitosamente: ${trimmedPath}`);
                        resolve(trimmedPath);
                    })
                    .on('error', error => {
                        logger.error(`[VideoConcatenator] ❌ Error recortando video: ${error.message}`);
                        reject(error);
                    })
                    .save(trimmedPath);
            } catch (error) {
                logger.error(`[VideoConcatenator] ❌ Error en trimVideo: ${error.message}`);
                reject(error);
            }
        });
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
