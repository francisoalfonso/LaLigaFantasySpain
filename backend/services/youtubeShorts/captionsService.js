/**
 * Captions Service - YouTube Shorts
 *
 * Sistema CRÍTICO de subtítulos automáticos para YouTube Shorts.
 * 85% de usuarios ven Shorts SIN AUDIO - los subtítulos son OBLIGATORIOS.
 *
 * Funcionalidades:
 * - Generación automática de subtítulos desde audio
 * - Estilo karaoke (word-by-word highlighting)
 * - Posicionamiento optimizado para móvil
 * - Sincronización perfecta con audio
 * - Formato .srt, .vtt, .ass para FFmpeg
 *
 * Basado en: docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md
 */

const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * CONFIGURACIÓN SUBTÍTULOS YOUTUBE SHORTS
 */
const CAPTIONS_CONFIG = {
    // Estilos de subtítulos
    STYLES: {
        karaoke: {
            // Estilo word-by-word con highlighting (MÁS EFECTIVO)
            fontName: 'Arial Black',
            fontSize: 80, // Tamaño equilibrado - legible sin tapar a Ana
            primaryColor: '&H00FFFFFF', // Blanco
            secondaryColor: '&H00FFD700', // Dorado (palabra actual)
            outlineColor: '&H00000000', // Negro
            backgroundColor: '&H80000000', // Negro 50% transparencia
            bold: true,
            italic: false,
            underline: false,
            outline: 6, // Borde para legibilidad
            shadow: 4,
            alignment: 5, // Centro medio
            marginV: 200 // Margen vertical desde abajo
        },
        static: {
            // Estilo estático tradicional (FALLBACK)
            fontName: 'Arial',
            fontSize: 28,
            primaryColor: '&H00FFFFFF',
            outlineColor: '&H00000000',
            backgroundColor: '&H80000000',
            bold: true,
            italic: false,
            underline: false,
            outline: 2,
            shadow: 1,
            alignment: 2, // Centro abajo
            marginV: 100
        }
    },

    // Configuración timing
    TIMING: {
        maxCharsPerLine: 35, // Máximo caracteres por línea en móvil
        maxWordsPerSubtitle: 8, // Máximo palabras por subtítulo
        minDuration: 0.8, // Mínima duración subtítulo (segundos)
        maxDuration: 5.0, // Máxima duración subtítulo (segundos)
        wordDuration: 0.25, // Duración promedio por palabra (segundos)
        karaokeHighlightDuration: 0.3 // Duración highlight palabra (segundos)
    },

    // Posicionamiento para Shorts (9:16)
    POSITIONING: {
        // Zona segura Shorts (evitar UI de YouTube)
        safeZone: {
            top: 180, // Evitar botones superiores
            bottom: 250, // Evitar botones inferiores
            left: 40,
            right: 40
        },
        // Posiciones recomendadas
        recommended: 'center-middle' // Centro-medio (no interferir con rostro ni UI)
    },

    // Formato de salida
    OUTPUT_FORMATS: ['srt', 'vtt', 'ass'], // .ass = Advanced SubStation Alpha (mejor para karaoke)

    // Idioma
    LANGUAGE: 'es-ES' // Español de España
};

class CaptionsService {
    constructor() {
        this.config = CAPTIONS_CONFIG;
        this.tempDir = path.join(__dirname, '../../temp/captions');
        this.ensureTempDir();
        logger.info('✅ CaptionsService inicializado - Modo CRÍTICO para Shorts');
    }

    /**
     * Asegurar que directorio temporal existe
     */
    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            logger.error('❌ Error creando directorio temporal:', error);
        }
    }

    /**
     * ✅ NORMA #2: Convertir números literales a dígitos para subtítulos
     * Audio (VEO3): "cinco punto cinco millones" → Subtítulo: "5.5M"
     */
    convertLiteralToNumber(text) {
        const numberMap = {
            'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
            'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9'
        };

        const conversions = [
            // Precios: "cinco punto cinco millones" → "5.5M"
            {
                pattern: /(\w+)\s+punto\s+(\w+)\s+millones/gi,
                replace: (match, p1, p2) => {
                    const num1 = numberMap[p1.toLowerCase()] || p1;
                    const num2 = numberMap[p2.toLowerCase()] || p2;
                    return `${num1}.${num2}M`;
                }
            },
            // Ratios 3 dígitos: "uno punto dos tres" → "1.23"
            {
                pattern: /(\w+)\s+punto\s+(\w+)\s+(\w+)(?!\s+millones)/gi,
                replace: (match, p1, p2, p3) => {
                    const num1 = numberMap[p1.toLowerCase()] || p1;
                    const num2 = numberMap[p2.toLowerCase()] || p2;
                    const num3 = numberMap[p3.toLowerCase()] || p3;
                    return `${num1}.${num2}${num3}`;
                }
            },
            // Decimales simples: "siete punto uno dos" → "7.12"
            {
                pattern: /(\w+)\s+punto\s+(\w+)\s+(\w+)/gi,
                replace: (match, p1, p2, p3) => {
                    const num1 = numberMap[p1.toLowerCase()] || p1;
                    const num2 = numberMap[p2.toLowerCase()] || p2;
                    const num3 = numberMap[p3.toLowerCase()] || p3;
                    return `${num1}.${num2}${num3}`;
                }
            }
        ];

        let result = text;
        conversions.forEach(conv => {
            result = result.replace(conv.pattern, conv.replace);
        });

        return result;
    }

    /**
     * Genera subtítulos automáticos desde transcripción
     * @param {Array} segments - Segmentos con dialogue, duration, startTime
     * @param {String} style - 'karaoke' o 'static'
     * @param {String} outputFormat - 'srt', 'vtt', 'ass'
     * @returns {Object} { success, captionsFile, metadata }
     */
    async generateCaptions(segments, style = 'karaoke', outputFormat = 'ass') {
        logger.info(`📝 Generando subtítulos ${style} en formato ${outputFormat}...`);

        try {
            // Validar formato
            if (!this.config.OUTPUT_FORMATS.includes(outputFormat)) {
                throw new Error(`Formato no soportado: ${outputFormat}`);
            }

            // Procesar segmentos en subtítulos con timing
            const subtitles = this.processSegmentsToSubtitles(segments, style);

            // Generar archivo según formato
            let captionsFile;
            switch (outputFormat) {
                case 'srt':
                    captionsFile = await this.generateSRT(subtitles);
                    break;
                case 'vtt':
                    captionsFile = await this.generateVTT(subtitles);
                    break;
                case 'ass':
                    captionsFile = await this.generateASS(subtitles, style);
                    break;
            }

            logger.info(`✅ Subtítulos generados: ${captionsFile}`);

            return {
                success: true,
                captionsFile,
                format: outputFormat,
                style,
                metadata: {
                    totalSubtitles: subtitles.length,
                    totalDuration: this.calculateTotalDuration(subtitles),
                    language: this.config.LANGUAGE,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('❌ Error generando subtítulos:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesa segmentos VEO3 en subtítulos con timing correcto
     */
    processSegmentsToSubtitles(segments, style) {
        const subtitles = [];
        let currentTime = 0;

        segments.forEach((segment, index) => {
            const dialogue = segment.dialogue;
            const duration = segment.duration || 8; // Default 8s si no especificado

            if (style === 'karaoke') {
                // ✅ NORMA #2: Convertir números literales a dígitos en subtítulos
                const dialogueWithNumbers = this.convertLiteralToNumber(dialogue);

                // Dividir en palabras para highlighting individual
                const words = dialogueWithNumbers.split(' ');
                const wordDuration = duration / words.length;

                words.forEach((word, wordIndex) => {
                    subtitles.push({
                        index: subtitles.length + 1,
                        startTime: currentTime,
                        endTime: currentTime + wordDuration,
                        text: word,
                        isKaraoke: true,
                        fullText: dialogueWithNumbers, // Contexto completo con números
                        currentWordIndex: wordIndex
                    });
                    currentTime += wordDuration;
                });
            } else {
                // Dividir en frases de máximo 8 palabras
                const words = dialogue.split(' ');
                const chunks = [];

                for (let i = 0; i < words.length; i += this.config.TIMING.maxWordsPerSubtitle) {
                    chunks.push(words.slice(i, i + this.config.TIMING.maxWordsPerSubtitle).join(' '));
                }

                const chunkDuration = duration / chunks.length;

                chunks.forEach((chunk) => {
                    subtitles.push({
                        index: subtitles.length + 1,
                        startTime: currentTime,
                        endTime: currentTime + chunkDuration,
                        text: chunk,
                        isKaraoke: false
                    });
                    currentTime += chunkDuration;
                });
            }
        });

        return subtitles;
    }

    /**
     * Genera archivo .SRT (SubRip)
     */
    async generateSRT(subtitles) {
        const filename = `captions_${Date.now()}.srt`;
        const filepath = path.join(this.tempDir, filename);

        let srtContent = '';

        subtitles.forEach((sub) => {
            if (!sub.isKaraoke) {
                // Solo subtítulos completos en SRT (no word-by-word)
                srtContent += `${sub.index}\n`;
                srtContent += `${this.formatTimeSRT(sub.startTime)} --> ${this.formatTimeSRT(sub.endTime)}\n`;
                srtContent += `${sub.text}\n\n`;
            }
        });

        await fs.writeFile(filepath, srtContent, 'utf8');
        return filepath;
    }

    /**
     * Genera archivo .VTT (WebVTT)
     */
    async generateVTT(subtitles) {
        const filename = `captions_${Date.now()}.vtt`;
        const filepath = path.join(this.tempDir, filename);

        let vttContent = 'WEBVTT\n\n';

        subtitles.forEach((sub) => {
            if (!sub.isKaraoke) {
                vttContent += `${this.formatTimeVTT(sub.startTime)} --> ${this.formatTimeVTT(sub.endTime)}\n`;
                vttContent += `${sub.text}\n\n`;
            }
        });

        await fs.writeFile(filepath, vttContent, 'utf8');
        return filepath;
    }

    /**
     * Genera archivo .ASS (Advanced SubStation Alpha) - MEJOR para karaoke
     */
    async generateASS(subtitles, style) {
        const filename = `captions_${Date.now()}.ass`;
        const filepath = path.join(this.tempDir, filename);

        const styleConfig = this.config.STYLES[style];

        // Header ASS - AJUSTADO PARA 720x1280 (resolución VEO3)
        let assContent = '[Script Info]\n';
        assContent += 'Title: Fantasy La Liga Shorts Captions\n';
        assContent += 'ScriptType: v4.00+\n';
        assContent += 'WrapStyle: 0\n';
        assContent += 'PlayResX: 720\n';
        assContent += 'PlayResY: 1280\n';
        assContent += 'ScaledBorderAndShadow: yes\n\n';

        // Styles
        assContent += '[V4+ Styles]\n';
        assContent += 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';

        if (style === 'karaoke') {
            // Estilo para palabra no destacada
            assContent += `Style: Default,${styleConfig.fontName},${styleConfig.fontSize},${styleConfig.primaryColor},${styleConfig.secondaryColor},${styleConfig.outlineColor},${styleConfig.backgroundColor},${styleConfig.bold ? -1 : 0},${styleConfig.italic ? -1 : 0},${styleConfig.underline ? -1 : 0},0,100,100,0,0,1,${styleConfig.outline},${styleConfig.shadow},${styleConfig.alignment},40,40,${styleConfig.marginV},1\n`;
            // Estilo para palabra destacada
            assContent += `Style: Highlight,${styleConfig.fontName},${styleConfig.fontSize},${styleConfig.secondaryColor},${styleConfig.secondaryColor},${styleConfig.outlineColor},${styleConfig.backgroundColor},${styleConfig.bold ? -1 : 0},${styleConfig.italic ? -1 : 0},${styleConfig.underline ? -1 : 0},0,100,100,0,0,1,${styleConfig.outline},${styleConfig.shadow},${styleConfig.alignment},40,40,${styleConfig.marginV},1\n`;
        } else {
            assContent += `Style: Default,${styleConfig.fontName},${styleConfig.fontSize},${styleConfig.primaryColor},${styleConfig.secondaryColor},${styleConfig.outlineColor},${styleConfig.backgroundColor},${styleConfig.bold ? -1 : 0},${styleConfig.italic ? -1 : 0},${styleConfig.underline ? -1 : 0},0,100,100,0,0,1,${styleConfig.outline},${styleConfig.shadow},${styleConfig.alignment},40,40,${styleConfig.marginV},1\n`;
        }

        assContent += '\n[Events]\n';
        assContent += 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';

        // Events
        if (style === 'karaoke') {
            // Modo word-by-word: cada palabra aparece individualmente
            subtitles.forEach((sub) => {
                if (sub.isKaraoke) {
                    const startTime = this.formatTimeASS(sub.startTime);
                    const endTime = this.formatTimeASS(sub.endTime);

                    // Solo mostrar la palabra actual (no la frase completa)
                    assContent += `Dialogue: 0,${startTime},${endTime},Highlight,,0,0,0,,${sub.text}\n`;
                }
            });
        } else {
            // Subtítulos estáticos
            subtitles.forEach((sub) => {
                const startTime = this.formatTimeASS(sub.startTime);
                const endTime = this.formatTimeASS(sub.endTime);
                assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${sub.text}\n`;
            });
        }

        await fs.writeFile(filepath, assContent, 'utf8');
        return filepath;
    }

    /**
     * Agrupa subtítulos karaoke por diálogo completo
     */
    groupKaraokeSubtitles(subtitles) {
        const grouped = [];
        let currentGroup = null;

        subtitles.forEach((sub) => {
            if (!sub.isKaraoke) return;

            if (!currentGroup || currentGroup.fullText !== sub.fullText) {
                // Nuevo grupo
                if (currentGroup) {
                    grouped.push(currentGroup);
                }
                currentGroup = {
                    fullText: sub.fullText,
                    startTime: sub.startTime,
                    endTime: sub.endTime,
                    words: []
                };
            }

            currentGroup.words.push({
                word: sub.text,
                startTime: sub.startTime,
                duration: sub.endTime - sub.startTime
            });
            currentGroup.endTime = sub.endTime;
        });

        if (currentGroup) {
            grouped.push(currentGroup);
        }

        return grouped;
    }

    /**
     * Aplica subtítulos a video usando FFmpeg
     * @param {String} videoPath - Ruta al video original
     * @param {String} captionsFile - Ruta al archivo de subtítulos
     * @param {String} outputPath - Ruta para video con subtítulos
     */
    async applyCaptionsToVideo(videoPath, captionsFile, outputPath) {
        logger.info('🎬 Aplicando subtítulos a video con FFmpeg...');

        try {
            const ext = path.extname(captionsFile);

            let ffmpegCommand;

            if (ext === '.ass') {
                // Usar filtro subtitles para .ass (mejor calidad)
                ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "ass='${captionsFile}'" -c:a copy "${outputPath}"`;
            } else {
                // Usar filtro subtitles para .srt/.vtt
                ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "subtitles='${captionsFile}'" -c:a copy "${outputPath}"`;
            }

            const { stdout, stderr } = await execPromise(ffmpegCommand);

            logger.info('✅ Subtítulos aplicados correctamente');

            return {
                success: true,
                outputPath,
                logs: { stdout, stderr }
            };
        } catch (error) {
            logger.error('❌ Error aplicando subtítulos con FFmpeg:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Genera subtítulos directamente desde segmentos VEO3 (wrapper simplificado)
     */
    async generateFromVEO3Segments(segments, outputFormat = 'ass') {
        return await this.generateCaptions(segments, 'karaoke', outputFormat);
    }

    /**
     * Valida que subtítulos cumplan con mejores prácticas Shorts
     */
    validateCaptions(subtitles) {
        const validation = {
            passed: true,
            checks: [],
            warnings: []
        };

        // Check 1: Duración por subtítulo
        subtitles.forEach((sub, index) => {
            const duration = sub.endTime - sub.startTime;

            if (duration < this.config.TIMING.minDuration) {
                validation.warnings.push(
                    `Subtítulo ${index + 1} demasiado corto (${duration.toFixed(2)}s < ${this.config.TIMING.minDuration}s)`
                );
            }

            if (duration > this.config.TIMING.maxDuration) {
                validation.warnings.push(
                    `Subtítulo ${index + 1} demasiado largo (${duration.toFixed(2)}s > ${this.config.TIMING.maxDuration}s)`
                );
            }
        });

        // Check 2: Longitud de texto
        subtitles.forEach((sub, index) => {
            if (!sub.isKaraoke && sub.text.length > this.config.TIMING.maxCharsPerLine) {
                validation.warnings.push(
                    `Subtítulo ${index + 1} demasiado largo (${sub.text.length} caracteres > ${this.config.TIMING.maxCharsPerLine})`
                );
            }
        });

        // Check 3: Cobertura total
        const totalDuration = this.calculateTotalDuration(subtitles);
        if (totalDuration < 10) {
            validation.checks.push({
                name: 'Cobertura',
                passed: false,
                message: `Duración total muy corta: ${totalDuration.toFixed(1)}s`
            });
            validation.passed = false;
        } else {
            validation.checks.push({
                name: 'Cobertura',
                passed: true,
                message: `Duración total: ${totalDuration.toFixed(1)}s ✅`
            });
        }

        return validation;
    }

    // === UTILIDADES DE FORMATEO ===

    formatTimeSRT(seconds) {
        const date = new Date(seconds * 1000);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const secs = String(date.getUTCSeconds()).padStart(2, '0');
        const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${secs},${millis}`;
    }

    formatTimeVTT(seconds) {
        const date = new Date(seconds * 1000);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const secs = String(date.getUTCSeconds()).padStart(2, '0');
        const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${secs}.${millis}`;
    }

    formatTimeASS(seconds) {
        const date = new Date(seconds * 1000);
        const hours = String(date.getUTCHours()).padStart(1, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const secs = String(date.getUTCSeconds()).padStart(2, '0');
        const centis = String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0');
        return `${hours}:${minutes}:${secs}.${centis}`;
    }

    calculateTotalDuration(subtitles) {
        if (subtitles.length === 0) return 0;
        return Math.max(...subtitles.map((s) => s.endTime));
    }

    /**
     * Limpia archivos temporales antiguos (>24h)
     */
    async cleanupTempFiles() {
        try {
            const files = await fs.readdir(this.tempDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas

            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    logger.info(`🗑️ Archivo temporal eliminado: ${file}`);
                }
            }
        } catch (error) {
            logger.error('❌ Error limpiando archivos temporales:', error);
        }
    }

    /**
     * Obtiene estadísticas del servicio
     */
    async getStats() {
        const files = await fs.readdir(this.tempDir);
        return {
            tempFiles: files.length,
            supportedFormats: this.config.OUTPUT_FORMATS,
            styles: Object.keys(this.config.STYLES),
            config: this.config,
            version: '1.0.0',
            lastUpdated: '2025-10-01'
        };
    }
}

module.exports = CaptionsService;
