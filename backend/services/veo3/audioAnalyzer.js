const ffmpeg = require('fluent-ffmpeg');
const logger = require('../../utils/logger');

/**
 * AudioAnalyzer - Detecta duración exacta del audio (sin silencios finales)
 *
 * Usa FFmpeg para analizar el audio y detectar dónde termina realmente el habla,
 * permitiendo recortar videos justo cuando Ana termina de hablar.
 */
class AudioAnalyzer {
    /**
     * Detectar duración real del audio (excluyendo silencio final)
     * @param {string} videoPath - Ruta del video a analizar
     * @param {object} options - Opciones de detección
     * @returns {Promise<number>} - Duración real del audio en segundos
     */
    async detectAudioEnd(videoPath, options = {}) {
        const {
            silenceThreshold = -50, // dB (🔧 FIX 9 Oct: -50dB menos agresivo que -60dB, detecta solo silencios reales)
            minSilenceDuration = 1.0 // 🔧 FIX 9 Oct: 1.0s mínimo (era 0.5s) - evita cortes por pausas naturales
        } = options;

        return new Promise((resolve, reject) => {
            try {
                logger.info(`[AudioAnalyzer] Analizando duración audio: ${videoPath}`);

                let lastSilenceStart = null; // 🔧 FIX 9 Oct: Guardar ÚLTIMO silencio, no el primero
                let resolved = false; // 🔧 FIX 9 Oct: Flag para evitar múltiples resolves

                // Usar silencedetect de FFmpeg para encontrar silencios
                ffmpeg(videoPath)
                    .audioFilters(`silencedetect=noise=${silenceThreshold}dB:d=${minSilenceDuration}`)
                    .outputOptions(['-f', 'null'])
                    .on('start', (commandLine) => {
                        logger.info(`[AudioAnalyzer] FFmpeg: ${commandLine}`);
                    })
                    .on('stderr', (stderrLine) => {
                        // FFmpeg output de silencedetect está en stderr
                        // Ejemplo: [silencedetect @ 0x...] silence_start: 6.234
                        const silenceStartMatch = stderrLine.match(/silence_start:\s*([\d.]+)/);

                        if (silenceStartMatch) {
                            const silenceStart = parseFloat(silenceStartMatch[1]);
                            logger.info(`[AudioAnalyzer] 🔇 Silencio detectado en: ${silenceStart.toFixed(2)}s`);

                            // 🔧 FIX 9 Oct: GUARDAR el último silencio, NO resolver inmediatamente
                            // Esto evita cortar en pausas naturales del habla
                            lastSilenceStart = silenceStart;
                        }
                    })
                    .on('end', () => {
                        if (resolved) return; // Ya resuelto
                        resolved = true;

                        if (lastSilenceStart !== null) {
                            // Usar el ÚLTIMO silencio detectado (no el primero)
                            logger.info(`[AudioAnalyzer] ✅ Usando último silencio: ${lastSilenceStart.toFixed(2)}s`);
                            resolve(lastSilenceStart);
                        } else {
                            // Si no se detectó silencio, usar duración completa del video
                            // (significa que Ana habla durante todo el video)
                            this.getVideoDuration(videoPath)
                                .then(duration => {
                                    logger.info(`[AudioAnalyzer] No silencio detectado, usando duración completa: ${duration}s`);
                                    resolve(duration);
                                })
                                .catch(reject);
                        }
                    })
                    .on('error', (error) => {
                        if (resolved) return; // Ya resuelto
                        resolved = true;

                        logger.error(`[AudioAnalyzer] ❌ Error: ${error.message}`);
                        // Fallback: usar duración completa del video
                        this.getVideoDuration(videoPath)
                            .then(duration => {
                                logger.warn(`[AudioAnalyzer] ⚠️ Fallback a duración completa: ${duration}s`);
                                resolve(duration);
                            })
                            .catch(reject);
                    })
                    .output('-')
                    .run();

            } catch (error) {
                logger.error(`[AudioAnalyzer] ❌ Error en detectAudioEnd: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Obtener duración total del video
     * @param {string} videoPath - Ruta del video
     * @returns {Promise<number>} - Duración en segundos
     */
    getVideoDuration(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    logger.error(`[AudioAnalyzer] ❌ Error ffprobe: ${err.message}`);
                    return reject(err);
                }

                const duration = metadata.format.duration;
                logger.info(`[AudioAnalyzer] Duración video: ${duration.toFixed(2)}s`);
                resolve(duration);
            });
        });
    }

    /**
     * Analizar todos los segmentos y detectar duración óptima de cada uno
     * @param {Array<string>} videoPaths - Array de rutas de videos
     * @returns {Promise<Array<number>>} - Array de duraciones reales
     */
    async analyzeAllSegments(videoPaths) {
        const durations = [];

        for (let i = 0; i < videoPaths.length; i++) {
            const videoPath = videoPaths[i];
            logger.info(`[AudioAnalyzer] Analizando segmento ${i + 1}/${videoPaths.length}...`);

            try {
                const duration = await this.detectAudioEnd(videoPath);
                durations.push(duration);
                logger.info(`[AudioAnalyzer] ✅ Segmento ${i + 1}: ${duration.toFixed(2)}s`);
            } catch (error) {
                logger.error(`[AudioAnalyzer] ❌ Error en segmento ${i + 1}: ${error.message}`);
                // Fallback: 8s (duración default)
                durations.push(8.0);
            }
        }

        logger.info(`[AudioAnalyzer] ✅ Análisis completo: ${durations.map(d => d.toFixed(2) + 's').join(', ')}`);
        return durations;
    }

    /**
     * Recortar video a duración específica (con pequeño margen de seguridad)
     * @param {string} videoPath - Video a recortar
     * @param {number} duration - Duración objetivo en segundos
     * @param {object} options - Opciones de recorte
     * @returns {Promise<string>} - Ruta del video recortado
     */
    async trimToAudioEnd(videoPath, duration, options = {}) {
        const path = require('path');

        const {
            safetyMargin = 0.5, // 🔧 FIX 9 Oct: Margen de seguridad aumentado a 0.5s (era 0.3s)
            outputDir = path.dirname(videoPath)
        } = options;
        const trimmedDuration = Math.max(2.0, duration + safetyMargin); // 🔧 FIX 9 Oct: Mínimo 2.0s (era 1.0s)
        const trimmedFileName = `trimmed-${Date.now()}.mp4`;
        const trimmedPath = path.join(outputDir, trimmedFileName);

        return new Promise((resolve, reject) => {
            logger.info(`[AudioAnalyzer] ✂️ Recortando a ${trimmedDuration.toFixed(2)}s: ${videoPath}`);

            ffmpeg(videoPath)
                .setStartTime(0)
                .setDuration(trimmedDuration)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    '-pix_fmt yuv420p',
                    '-preset fast',
                    '-movflags +faststart'
                ])
                .on('start', (commandLine) => {
                    logger.info(`[AudioAnalyzer] FFmpeg: ${commandLine}`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        logger.info(`[AudioAnalyzer] Progreso: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    logger.info(`[AudioAnalyzer] ✅ Video recortado: ${trimmedPath}`);
                    resolve(trimmedPath);
                })
                .on('error', (error) => {
                    logger.error(`[AudioAnalyzer] ❌ Error recortando: ${error.message}`);
                    reject(error);
                })
                .save(trimmedPath);
        });
    }
}

module.exports = AudioAnalyzer;
