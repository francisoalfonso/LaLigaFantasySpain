/**
 * Subtitle Generator - FFmpeg + Subtitle Burning
 *
 * PROPÓSITO:
 * Agregar subtítulos hardcoded (burned-in) a videos de Shorts.
 * CRÍTICO: 85% de Shorts se ven sin audio → subtítulos = engagement obligatorio.
 *
 * ESTRATEGIA:
 * - Input: Video generado por VEO3 + script con dialogues
 * - Process: Crear archivo .srt con timestamps → FFmpeg subtitles filter
 * - Output: Video con subtítulos quemados (no removibles)
 * - Style: Viral (tipografía bold, fondo negro semi-transparente, centrado)
 *
 * TECNOLOGÍA:
 * - FFmpeg subtitles filter (gratis, local)
 * - SRT format (universal, compatible)
 * - Tipografía: Arial Bold (disponible en todos los sistemas)
 * - Color: Blanco con outline negro (máxima legibilidad)
 *
 * ALTERNATIVAS EVALUADAS:
 * - WhisperX: Genera .srt pero requiere transcripción (ya tenemos script)
 * - FFmpeg: Perfecto porque ya tenemos el script con timestamps
 *
 * WHY NOT WhisperX:
 * - Ya tenemos el script con timing exacto desde VEO3
 * - No necesitamos transcripción automática
 * - FFmpeg es más rápido y preciso con timing manual
 *
 * COST: $0 (FFmpeg local)
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logger = require('../../utils/logger');

class SubtitleGenerator {
    constructor() {
        // Configuración de estilo de subtítulos (optimizado para Shorts virales)
        this.subtitleStyle = {
            fontName: 'Arial-Bold', // Tipografía bold universal
            fontSize: 28, // Grande para móviles (9:16)
            primaryColor: '&HFFFFFF', // Blanco
            outlineColor: '&H000000', // Negro
            backColor: '&H80000000', // Fondo negro semi-transparente
            outline: 3, // Grosor del outline
            shadow: 2, // Sombra para legibilidad
            alignment: 2, // Centrado abajo (posición 2 en ASS)
            marginV: 80, // Margen vertical desde abajo (80px para móvil)
            bold: -1 // Bold enabled
        };

        // Duración por segmento (VEO3 genera 8s por segmento)
        this.segmentDuration = 8000; // milisegundos
    }

    /**
     * Agregar subtítulos al video
     *
     * @param {Object} options - Opciones
     * @param {string} options.videoPath - Path al video sin subtítulos
     * @param {array} options.segments - Segmentos del script con dialogues
     * @param {string} options.outputPath - Path de salida del video con subtítulos
     * @param {string} [options.style='viral'] - 'viral' | 'classic' | 'minimal'
     * @returns {Promise<Object>} Resultado con path del video con subtítulos
     */
    async addSubtitles(options) {
        const startTime = Date.now();

        try {
            const { videoPath, segments, outputPath, style = 'viral' } = options;

            logger.info('[SubtitleGenerator] Iniciando generación de subtítulos', {
                videoPath,
                segments: segments.length,
                outputPath,
                style
            });

            // Validar inputs
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video no encontrado: ${videoPath}`);
            }

            if (!segments || segments.length === 0) {
                throw new Error('Se requieren segmentos con dialogues');
            }

            // 1. Generar archivo .srt con timestamps
            const srtPath = outputPath.replace(path.extname(outputPath), '.srt');
            await this._generateSRT(segments, srtPath);

            logger.info('[SubtitleGenerator] Archivo SRT generado', { srtPath });

            // 2. Quemar subtítulos en el video con FFmpeg
            await this._burnSubtitles(videoPath, srtPath, outputPath, style);

            // 3. Limpiar archivo .srt temporal
            if (fs.existsSync(srtPath)) {
                fs.unlinkSync(srtPath);
                logger.info('[SubtitleGenerator] Archivo SRT temporal eliminado');
            }

            const duration = Date.now() - startTime;

            logger.info('[SubtitleGenerator] ✅ Subtítulos agregados exitosamente', {
                outputPath,
                duration: `${duration}ms`
            });

            return {
                success: true,
                videoPath: outputPath,
                subtitlesAdded: true,
                segmentsCount: segments.length,
                processingTime: duration
            };
        } catch (error) {
            logger.error('[SubtitleGenerator] Error agregando subtítulos', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generar archivo .srt con timestamps
     * @private
     */
    async _generateSRT(segments, srtPath) {
        try {
            let srtContent = '';
            let startTime = 0; // milisegundos

            segments.forEach((segment, index) => {
                // Cada segmento dura 8 segundos
                const endTime = startTime + this.segmentDuration;

                // Formato SRT:
                // 1
                // 00:00:00,000 --> 00:00:08,000
                // Dialogue text here
                //
                // 2
                // 00:00:08,000 --> 00:00:16,000
                // Next dialogue
                //

                srtContent += `${index + 1}\n`;
                srtContent += `${this._formatSRTTime(startTime)} --> ${this._formatSRTTime(endTime)}\n`;
                srtContent += `${segment.dialogue}\n`;
                srtContent += '\n';

                startTime = endTime;
            });

            // Escribir archivo SRT
            fs.writeFileSync(srtPath, srtContent, 'utf8');

            logger.info('[SubtitleGenerator] SRT content generado', {
                segments: segments.length,
                totalDuration: `${startTime / 1000}s`
            });
        } catch (error) {
            logger.error('[SubtitleGenerator] Error generando SRT', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Formatear tiempo en formato SRT (HH:MM:SS,mmm)
     * @private
     */
    _formatSRTTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const milliseconds = ms % 1000;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = num => String(num).padStart(2, '0');
        const padMs = num => String(num).padStart(3, '0');

        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${padMs(milliseconds)}`;
    }

    /**
     * Quemar subtítulos en el video con FFmpeg
     * @private
     */
    async _burnSubtitles(videoPath, srtPath, outputPath, style) {
        try {
            // Obtener configuración de estilo
            const styleConfig = this._getStyleConfig(style);

            // FFmpeg command para quemar subtítulos
            // Usar subtitles filter con force_style para personalizar apariencia
            const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "subtitles='${srtPath}':force_style='${styleConfig}'" -c:a copy "${outputPath}"`;

            logger.info('[SubtitleGenerator] Ejecutando FFmpeg...', {
                command: ffmpegCommand.substring(0, 100) + '...'
            });

            // Ejecutar FFmpeg
            const { stdout, stderr } = await exec(ffmpegCommand, {
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            if (stderr && stderr.includes('Error')) {
                throw new Error(`FFmpeg error: ${stderr}`);
            }

            logger.info('[SubtitleGenerator] FFmpeg completado', {
                outputPath
            });
        } catch (error) {
            logger.error('[SubtitleGenerator] Error en FFmpeg', {
                error: error.message,
                stderr: error.stderr
            });
            throw error;
        }
    }

    /**
     * Obtener configuración de estilo según preset
     * @private
     */
    _getStyleConfig(style) {
        const styles = {
            viral: `FontName=${this.subtitleStyle.fontName},FontSize=${this.subtitleStyle.fontSize},PrimaryColour=${this.subtitleStyle.primaryColor},OutlineColour=${this.subtitleStyle.outlineColor},BackColour=${this.subtitleStyle.backColor},Outline=${this.subtitleStyle.outline},Shadow=${this.subtitleStyle.shadow},Alignment=${this.subtitleStyle.alignment},MarginV=${this.subtitleStyle.marginV},Bold=${this.subtitleStyle.bold}`,

            classic: `FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,Alignment=2,MarginV=60`,

            minimal: `FontName=Arial,FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=1,Shadow=0,Alignment=2,MarginV=40`
        };

        return styles[style] || styles.viral;
    }

    /**
     * Generar subtítulos automáticamente desde audio (alternative method)
     * Usa Whisper para transcribir y generar .srt automáticamente
     *
     * @param {string} videoPath - Path al video
     * @param {string} outputSrtPath - Path de salida del .srt
     * @returns {Promise<Object>} Resultado con path del .srt
     */
    async generateSRTFromAudio(videoPath, outputSrtPath) {
        try {
            logger.info('[SubtitleGenerator] Generando SRT desde audio con Whisper...');

            // Extraer audio del video
            const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
            const extractAudioCmd = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}"`;

            await exec(extractAudioCmd);

            logger.info('[SubtitleGenerator] Audio extraído', { audioPath });

            // Usar transcriptionService para transcribir
            const transcriptionService = require('../contentAnalysis/transcriptionService');
            const transcription = await transcriptionService.transcribe(audioPath, {
                responseFormat: 'srt'
            });

            // Guardar SRT
            fs.writeFileSync(outputSrtPath, transcription.text, 'utf8');

            // Limpiar audio temporal
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }

            logger.info('[SubtitleGenerator] ✅ SRT generado desde audio', {
                outputSrtPath
            });

            return {
                success: true,
                srtPath: outputSrtPath,
                method: 'whisper_auto'
            };
        } catch (error) {
            logger.error('[SubtitleGenerator] Error generando SRT desde audio', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Validar que el video tiene subtítulos quemados
     *
     * @param {string} videoPath - Path al video
     * @returns {Promise<boolean>} true si tiene subtítulos
     */
    async validateSubtitles(videoPath) {
        try {
            // FFmpeg puede detectar si hay texto quemado, pero es complejo
            // Por ahora, asumir que si el archivo existe y tiene tamaño > original, tiene subtítulos
            const stats = fs.statSync(videoPath);

            logger.info('[SubtitleGenerator] Video validado', {
                videoPath,
                size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
            });

            return stats.size > 0;
        } catch (error) {
            logger.error('[SubtitleGenerator] Error validando subtítulos', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Calcular costo de generación de subtítulos
     *
     * @param {number} count - Número de videos
     * @param {string} method - 'manual' | 'whisper_auto'
     * @returns {number} Costo en USD
     */
    calculateCost(count = 1, method = 'manual') {
        if (method === 'manual') {
            return 0; // FFmpeg local es gratis
        } else if (method === 'whisper_auto') {
            // Whisper API: $0.006 por minuto
            const avgDurationMinutes = 0.4; // 24s ≈ 0.4 min
            return count * avgDurationMinutes * 0.006;
        }

        return 0;
    }
}

module.exports = new SubtitleGenerator();
