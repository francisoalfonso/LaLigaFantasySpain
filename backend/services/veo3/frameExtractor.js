const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../utils/logger');

/**
 * FrameExtractor - Extrae frames de videos para continuidad VEO3
 *
 * Implementa técnica Image-to-Video de Google Veo 3:
 * - Extrae último frame del Segmento N
 * - Usa como primer frame del Segmento N+1
 * - Garantiza continuidad visual perfecta
 */
class FrameExtractor {
    constructor() {
        this.tempDir = path.join(__dirname, '../../../temp/frames');
    }

    /**
     * Inicializar directorio temporal
     */
    async init() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
            logger.info(`[FrameExtractor] Directorio temp creado: ${this.tempDir}`);
        } catch (error) {
            logger.error('[FrameExtractor] Error creando directorio temp:', error);
            throw error;
        }
    }

    /**
     * Extraer último frame de un video
     *
     * @param {string} videoPath - Ruta al video fuente
     * @param {string} outputName - Nombre del archivo de salida (opcional)
     * @returns {Promise<string>} - Ruta al frame extraído
     */
    async extractLastFrame(videoPath, outputName = null) {
        logger.info(`[FrameExtractor] Extrayendo último frame de: ${videoPath}`);

        // Asegurar directorio temp existe
        await this.init();

        // Generar nombre de salida
        const timestamp = Date.now();
        const frameName = outputName || `last_frame_${timestamp}.jpg`;
        const outputPath = path.join(this.tempDir, frameName);

        // ✅ FIX: Obtener duración primero para calcular 99% correctamente
        const duration = await this.getVideoDuration(videoPath);
        const lastFrameTime = Math.max(0, duration - 0.1); // 0.1s antes del final

        logger.info(`[FrameExtractor] Duración video: ${duration}s → Extrayendo frame a ${lastFrameTime}s`);

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                // ✅ FIX: Usar tiempo en segundos, NO porcentaje
                .seekInput(lastFrameTime)
                // Extraer 1 frame
                .frames(1)
                // Calidad máxima (q:v 2 = alta calidad JPEG)
                .outputOptions(['-q:v 2'])
                .output(outputPath)
                .on('start', (commandLine) => {
                    logger.info('[FrameExtractor] FFmpeg command:', commandLine);
                })
                .on('end', () => {
                    logger.info(`[FrameExtractor] ✅ Frame extraído: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    logger.error('[FrameExtractor] ❌ Error extrayendo frame:', err.message);
                    reject(err);
                })
                .run();
        });
    }

    /**
     * Extraer múltiples frames de un video (para debugging)
     *
     * @param {string} videoPath - Ruta al video
     * @param {number} count - Número de frames a extraer
     * @returns {Promise<string[]>} - Rutas a los frames
     */
    async extractMultipleFrames(videoPath, count = 5) {
        logger.info(`[FrameExtractor] Extrayendo ${count} frames de: ${videoPath}`);

        await this.init();

        const timestamp = Date.now();
        const outputPattern = path.join(this.tempDir, `frame_${timestamp}_%03d.jpg`);

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions([
                    `-vf fps=1/${count}`, // 1 frame cada N segundos
                    '-q:v 2'
                ])
                .output(outputPattern)
                .on('end', async () => {
                    // Leer frames generados
                    const files = await fs.readdir(this.tempDir);
                    const frames = files
                        .filter((f) => f.startsWith(`frame_${timestamp}_`))
                        .map((f) => path.join(this.tempDir, f));

                    logger.info(`[FrameExtractor] ✅ ${frames.length} frames extraídos`);
                    resolve(frames);
                })
                .on('error', (err) => {
                    logger.error('[FrameExtractor] ❌ Error:', err);
                    reject(err);
                })
                .run();
        });
    }

    /**
     * Limpiar frames temporales antiguos
     *
     * @param {number} maxAgeHours - Edad máxima en horas
     */
    async cleanup(maxAgeHours = 24) {
        logger.info(`[FrameExtractor] Limpiando frames más antiguos de ${maxAgeHours}h`);

        try {
            const files = await fs.readdir(this.tempDir);
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;

            let deleted = 0;
            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    deleted++;
                }
            }

            logger.info(`[FrameExtractor] ✅ ${deleted} frames eliminados`);
            return deleted;
        } catch (error) {
            logger.error('[FrameExtractor] Error en cleanup:', error);
            throw error;
        }
    }

    /**
     * Obtener duración del video
     *
     * @param {string} videoPath - Ruta al video
     * @returns {Promise<number>} - Duración en segundos
     */
    async getVideoDuration(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    logger.error('[FrameExtractor] Error obteniendo duración:', err);
                    reject(err);
                } else {
                    const duration = metadata.format.duration;
                    logger.info(`[FrameExtractor] Duración video: ${duration}s`);
                    resolve(duration);
                }
            });
        });
    }
}

module.exports = new FrameExtractor();
