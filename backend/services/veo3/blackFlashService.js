const ffmpeg = require('fluent-ffmpeg');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Black Flash Service - Transiciones dramáticas entre segmentos
 *
 * Inserta flashes negros (blackouts) de milisegundos al final de cada segmento
 * para crear cortes dinámicos estilo cortometrajes/trailers.
 *
 * Efectos visuales:
 * - 3ms (0.003s): Subliminal, casi imperceptible
 * - 10ms (0.01s): Sutil, efecto "beat" rápido
 * - 50ms (0.05s): Visible, corte dramático (RECOMENDADO)
 * - 100ms+ (0.1s): Muy marcado, estilo videoclip
 *
 * Inspiración: Trailers de cine, cortometrajes, videoclips de acción
 */
class BlackFlashService {
    constructor() {
        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
        this.tempDir = process.env.VEO3_TEMP_DIR || './temp/veo3';
        this.logsDir = process.env.VEO3_LOGS_DIR || './logs/veo3';

        // Configuración por defecto
        this.config = {
            defaultDuration: 0.05, // 50ms - balance perfecto entre visible y no disruptivo
            minDuration: 0.003, // 3ms - mínimo técnico
            maxDuration: 0.2, // 200ms - máximo recomendado
            fadeType: 'hard' // 'hard' (corte directo) o 'soft' (fade suave)
        };

        this.ensureDirectories();
        logger.info('[BlackFlashService] ✅ Servicio inicializado (50ms default)');
    }

    ensureDirectories() {
        [this.outputDir, this.tempDir, this.logsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Calcular puntos de flash automáticamente desde segmentos del script
     *
     * @param {Array} segments - Segmentos con duration
     * @param {number} offset - Offset antes del final del segmento (default: 0ms)
     * @returns {Array} - Array de timestamps donde insertar flashes
     *
     * Ejemplo:
     * Input: [{ duration: 8 }, { duration: 8 }, { duration: 8 }]
     * Output: [7.95, 15.95] (flash al final de seg 1 y 2, no al final del 3)
     */
    calculateFlashPoints(segments, offset = 0) {
        const flashPoints = [];
        let accumulatedTime = 0;

        segments.forEach((segment, index) => {
            accumulatedTime += segment.duration;

            // Insertar flash SOLO entre segmentos (no al final del último)
            if (index < segments.length - 1) {
                // Flash 50ms antes del final del segmento para que coincida con el silencio
                const flashTimestamp = accumulatedTime - this.config.defaultDuration - offset;
                flashPoints.push(flashTimestamp);

                logger.info(
                    `[BlackFlashService] 🎬 Flash ${index + 1}: ${flashTimestamp.toFixed(3)}s (después de "${segment.role}")`
                );
            }
        });

        logger.info(`[BlackFlashService] 📊 Total flashes calculados: ${flashPoints.length}`);
        return flashPoints;
    }

    /**
     * Añadir flashes negros en timestamps específicos
     *
     * @param {string} videoPath - Ruta del video original
     * @param {Array} flashPoints - Timestamps donde insertar flashes (segundos)
     * @param {number} duration - Duración del flash en segundos (default: 50ms)
     * @param {object} options - Opciones adicionales
     * @returns {Promise<string>} - Ruta del video con flashes
     */
    async addBlackFlashes(videoPath, flashPoints, duration = null, _options = {}) {
        try {
            const flashDuration = duration || this.config.defaultDuration;

            // Validaciones
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video no encontrado: ${videoPath}`);
            }

            if (!flashPoints || flashPoints.length === 0) {
                logger.warn(
                    '[BlackFlashService] ⚠️ No hay puntos de flash, retornando video original'
                );
                return videoPath;
            }

            if (
                flashDuration < this.config.minDuration ||
                flashDuration > this.config.maxDuration
            ) {
                throw new Error(
                    `Duración de flash inválida: ${flashDuration}s (rango: ${this.config.minDuration}-${this.config.maxDuration}s)`
                );
            }

            logger.info(`[BlackFlashService] 🎬 Añadiendo ${flashPoints.length} flashes negros...`);
            logger.info(
                `[BlackFlashService] ⏱️  Duración flash: ${(flashDuration * 1000).toFixed(0)}ms`
            );
            logger.info(
                `[BlackFlashService] 📍 Timestamps: ${flashPoints.map(t => t.toFixed(3)).join(', ')}s`
            );

            // Generar nombre de archivo de salida
            const videoBaseName = path.basename(videoPath, path.extname(videoPath));
            const outputVideoPath = path.join(this.outputDir, `${videoBaseName}-with-flashes.mp4`);

            // Construir filtros FFmpeg para cada flash
            // Usando drawbox con enable para control preciso de timing
            const filters = flashPoints
                .map(timestamp => {
                    const startTime = timestamp;
                    const endTime = timestamp + flashDuration;

                    // drawbox cubre toda la pantalla con negro en el intervalo especificado
                    return `drawbox=enable='between(t,${startTime},${endTime})':x=0:y=0:w=iw:h=ih:color=black:t=fill`;
                })
                .join(',');

            logger.info('[BlackFlashService] 🔧 Aplicando filtros FFmpeg...');

            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .videoFilters(filters)
                    .audioCodec('copy') // Mantener audio sin cambios
                    .videoCodec('libx264')
                    .outputOptions([
                        '-preset ultrafast', // Encoding rápido
                        '-crf 23' // Calidad razonable
                    ])
                    .format('mp4')
                    .on('start', commandLine => {
                        logger.info(`[BlackFlashService] FFmpeg comando: ${commandLine}`);
                    })
                    .on('progress', progress => {
                        if (progress.percent) {
                            logger.info(
                                `[BlackFlashService] Progreso: ${Math.round(progress.percent)}%`
                            );
                        }
                    })
                    .on('end', () => {
                        logger.info(
                            `[BlackFlashService] ✅ Flashes añadidos exitosamente: ${outputVideoPath}`
                        );

                        // Log de operación
                        this.logOperation({
                            type: 'addBlackFlashes',
                            success: true,
                            inputVideo: videoPath,
                            outputVideo: outputVideoPath,
                            flashCount: flashPoints.length,
                            flashDuration: flashDuration,
                            processingTime: Date.now()
                        });

                        resolve(outputVideoPath);
                    })
                    .on('error', error => {
                        logger.error('[BlackFlashService] ❌ Error FFmpeg:', error.message);

                        this.logOperation({
                            type: 'addBlackFlashes',
                            success: false,
                            inputVideo: videoPath,
                            error: error.message,
                            processingTime: Date.now()
                        });

                        reject(error);
                    })
                    .save(outputVideoPath);
            });
        } catch (error) {
            logger.error('[BlackFlashService] Error añadiendo flashes:', error.message);
            throw error;
        }
    }

    /**
     * Wrapper simplificado: añadir flashes desde segmentos del script
     *
     * @param {string} videoPath - Video original
     * @param {Array} segments - Segmentos con duration del script
     * @param {number} duration - Duración del flash (opcional, default 50ms)
     * @returns {Promise<string>} - Video con flashes
     */
    async addFlashesFromSegments(videoPath, segments, duration = null) {
        logger.info('[BlackFlashService] 🎯 Añadiendo flashes automáticos desde script...');

        const flashPoints = this.calculateFlashPoints(segments);

        if (flashPoints.length === 0) {
            logger.warn(
                '[BlackFlashService] ⚠️ Solo hay 1 segmento o menos, no hay flashes que añadir'
            );
            return videoPath;
        }

        return this.addBlackFlashes(videoPath, flashPoints, duration);
    }

    /**
     * Log de operaciones para seguimiento
     */
    logOperation(operation) {
        const logPath = path.join(this.logsDir, 'black-flashes.log');
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: operation.type,
            success: operation.success,
            inputVideo: operation.inputVideo,
            outputVideo: operation.outputVideo || null,
            flashCount: operation.flashCount || 0,
            flashDuration: operation.flashDuration || null,
            error: operation.error || null,
            processingTime: operation.processingTime
        };

        try {
            fs.appendFileSync(logPath, `${JSON.stringify(logEntry)}\n`);
        } catch (error) {
            logger.error('[BlackFlashService] Error escribiendo log:', error.message);
        }
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return {
            defaultDuration: this.config.defaultDuration,
            defaultDurationMs: this.config.defaultDuration * 1000,
            minDuration: this.config.minDuration,
            maxDuration: this.config.maxDuration,
            fadeType: this.config.fadeType,
            description: '50ms black flashes between segments for dramatic cuts'
        };
    }

    /**
     * Health check del servicio
     */
    async healthCheck() {
        return {
            service: 'BlackFlashService',
            status: 'healthy',
            config: this.getConfig(),
            ffmpegAvailable: true // Asumimos que ffmpeg está disponible
        };
    }
}

module.exports = BlackFlashService;
