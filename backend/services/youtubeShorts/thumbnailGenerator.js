/**
 * Thumbnail Generator - YouTube Shorts
 *
 * Generador automático de thumbnails impactantes para YouTube Shorts.
 * Los thumbnails son críticos para CTR (Click-Through Rate).
 *
 * Funcionalidades:
 * - Diseño automático por tipo de contenido
 * - Elementos visuales impactantes (texto grande, emojis, colores)
 * - Optimización para móvil (preview pequeño)
 * - Branding consistente
 *
 * Basado en: docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md
 */

const logger = require('../../utils/logger');
const nodeHtmlToImage = require('node-html-to-image');
const path = require('path');
const fs = require('fs').promises;
const Jimp = require('jimp');

/**
 * CONFIGURACIÓN THUMBNAILS YOUTUBE SHORTS
 */
const THUMBNAIL_CONFIG = {
    // Dimensiones YouTube
    DIMENSIONS: {
        width: 1280,
        height: 720,
        aspectRatio: '16:9' // Aunque Shorts sea 9:16, thumbnail es 16:9
    },

    // Colores por tipo de contenido
    COLORS: {
        chollo_viral: {
            primary: '#00FF00', // Verde brillante
            secondary: '#FFD700', // Dorado
            background: '#1a1a1a', // Negro oscuro
            accent: '#FF3333' // Rojo acento
        },
        breaking_news: {
            primary: '#FF0000', // Rojo urgente
            secondary: '#FFFFFF', // Blanco
            background: '#000000', // Negro
            accent: '#FFD700' // Dorado acento
        },
        stats_impactantes: {
            primary: '#0066CC', // Azul profesional
            secondary: '#FFD700', // Dorado
            background: '#0a0a0a', // Negro profundo
            accent: '#00FF00' // Verde acento
        },
        prediccion_jornada: {
            primary: '#FFD700', // Dorado
            secondary: '#FFFFFF', // Blanco
            background: '#1a1a2e', // Azul oscuro
            accent: '#00FF00' // Verde acento
        }
    },

    // Estilos de texto
    TEXT_STYLES: {
        mainTitle: {
            fontSize: '120px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            textShadow: '6px 6px 0px rgba(0,0,0,0.8)',
            lineHeight: '1.2'
        },
        subtitle: {
            fontSize: '60px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            textShadow: '3px 3px 0px rgba(0,0,0,0.8)',
            lineHeight: '1.3'
        },
        smallText: {
            fontSize: '40px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
        }
    },

    // Elementos visuales
    VISUAL_ELEMENTS: {
        emoji: {
            fontSize: '180px',
            position: 'top-right'
        },
        badge: {
            fontSize: '50px',
            backgroundColor: 'rgba(255,0,0,0.9)',
            borderRadius: '15px',
            padding: '10px 30px'
        },
        logo: {
            size: '100px',
            position: 'bottom-right',
            opacity: 0.8
        }
    },

    // Output
    OUTPUT: {
        format: 'jpeg',
        quality: 90,
        compression: 'high'
    }
};

class ThumbnailGenerator {
    constructor() {
        this.config = THUMBNAIL_CONFIG;
        this.outputDir = path.join(__dirname, '../../../output/thumbnails');
        this.ensureOutputDir();
        logger.info('✅ ThumbnailGenerator inicializado');
    }

    /**
     * Asegurar que directorio de output existe
     */
    async ensureOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            logger.error('❌ Error creando directorio output:', error);
        }
    }

    /**
     * Genera thumbnail automático
     * @param {String} contentType - Tipo de contenido
     * @param {Object} contentData - Datos del contenido
     * @returns {Object} { success, thumbnailPath, metadata }
     */
    async generateThumbnail(contentType, contentData) {
        logger.info(`🖼️ Generando thumbnail para: ${contentType}`);

        try {
            // Validar tipo de contenido
            if (!this.config.COLORS[contentType]) {
                throw new Error(`Tipo de contenido inválido: ${contentType}`);
            }

            // Generar HTML del thumbnail
            const html = this.buildThumbnailHTML(contentType, contentData);

            // Generar imagen desde HTML
            const filename = `${contentType}_${Date.now()}.${this.config.OUTPUT.format}`;
            const outputPath = path.join(this.outputDir, filename);

            await nodeHtmlToImage({
                output: outputPath,
                html: html,
                quality: this.config.OUTPUT.quality,
                type: this.config.OUTPUT.format,
                puppeteerArgs: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });

            // Post-procesamiento con Jimp (compresión y optimización)
            await this.optimizeThumbnail(outputPath);

            logger.info(`✅ Thumbnail generado: ${filename}`);

            return {
                success: true,
                thumbnailPath: outputPath,
                filename,
                metadata: {
                    contentType,
                    width: this.config.DIMENSIONS.width,
                    height: this.config.DIMENSIONS.height,
                    format: this.config.OUTPUT.format,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('❌ Error generando thumbnail:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Construye HTML del thumbnail según tipo de contenido
     */
    buildThumbnailHTML(contentType, contentData) {
        const colors = this.config.COLORS[contentType];
        const dimensions = this.config.DIMENSIONS;

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    width: ${dimensions.width}px;
                    height: ${dimensions.height}px;
                    background: ${colors.background};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                }
                .container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px;
                    position: relative;
                    z-index: 10;
                }
                .main-text {
                    font-size: ${this.config.TEXT_STYLES.mainTitle.fontSize};
                    font-family: ${this.config.TEXT_STYLES.mainTitle.fontFamily};
                    font-weight: ${this.config.TEXT_STYLES.mainTitle.fontWeight};
                    color: ${colors.primary};
                    text-align: center;
                    text-transform: uppercase;
                    text-shadow: ${this.config.TEXT_STYLES.mainTitle.textShadow};
                    line-height: ${this.config.TEXT_STYLES.mainTitle.lineHeight};
                    margin-bottom: 30px;
                    max-width: 90%;
                    word-wrap: break-word;
                }
                .subtitle {
                    font-size: ${this.config.TEXT_STYLES.subtitle.fontSize};
                    font-family: ${this.config.TEXT_STYLES.subtitle.fontFamily};
                    font-weight: ${this.config.TEXT_STYLES.subtitle.fontWeight};
                    color: ${colors.secondary};
                    text-align: center;
                    text-shadow: ${this.config.TEXT_STYLES.subtitle.textShadow};
                    line-height: ${this.config.TEXT_STYLES.subtitle.lineHeight};
                    max-width: 90%;
                }
                .emoji {
                    font-size: ${this.config.VISUAL_ELEMENTS.emoji.fontSize};
                    position: absolute;
                    top: 60px;
                    right: 60px;
                    z-index: 5;
                }
                .badge {
                    position: absolute;
                    top: 60px;
                    left: 60px;
                    background: ${this.config.VISUAL_ELEMENTS.badge.backgroundColor};
                    color: white;
                    font-size: ${this.config.VISUAL_ELEMENTS.badge.fontSize};
                    font-family: Arial Black, sans-serif;
                    font-weight: bold;
                    padding: ${this.config.VISUAL_ELEMENTS.badge.padding};
                    border-radius: ${this.config.VISUAL_ELEMENTS.badge.borderRadius};
                    text-transform: uppercase;
                    box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                }
                .logo {
                    position: absolute;
                    bottom: 30px;
                    right: 30px;
                    font-size: 40px;
                    font-family: Arial Black, sans-serif;
                    color: ${colors.secondary};
                    opacity: ${this.config.VISUAL_ELEMENTS.logo.opacity};
                    text-shadow: 2px 2px 0px rgba(0,0,0,0.8);
                }
                .accent-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 15px;
                    background: ${colors.accent};
                }
            </style>
        </head>
        <body>
        `;

        // Contenido específico por tipo
        switch (contentType) {
            case 'chollo_viral':
                html += `
                <div class="badge">CHOLLO</div>
                <div class="emoji">💰</div>
                <div class="container">
                    <div class="main-text">${contentData.playerName}</div>
                    <div class="subtitle">${contentData.price}M = ¡ROBO!</div>
                </div>
                <div class="logo">⚽ Fantasy La Liga</div>
                <div class="accent-bar"></div>
                `;
                break;

            case 'breaking_news':
                html += `
                <div class="badge">🚨 ÚLTIMA HORA</div>
                <div class="emoji">⚡</div>
                <div class="container">
                    <div class="main-text">${contentData.playerName}</div>
                    <div class="subtitle">${contentData.newsTitle || 'BREAKING NEWS'}</div>
                </div>
                <div class="logo">⚽ Fantasy La Liga</div>
                <div class="accent-bar"></div>
                `;
                break;

            case 'stats_impactantes':
                html += `
                <div class="badge">📊 STATS</div>
                <div class="emoji">🔥</div>
                <div class="container">
                    <div class="main-text">${contentData.playerName}</div>
                    <div class="subtitle">${contentData.statHighlight || 'Dato INCREÍBLE'}</div>
                </div>
                <div class="logo">⚽ Fantasy La Liga</div>
                <div class="accent-bar"></div>
                `;
                break;

            case 'prediccion_jornada':
                html += `
                <div class="badge">J${contentData.gameweek}</div>
                <div class="emoji">🎯</div>
                <div class="container">
                    <div class="main-text">3 PREDICCIONES</div>
                    <div class="subtitle">LA 3ª ES POLÉMICA</div>
                </div>
                <div class="logo">⚽ Fantasy La Liga</div>
                <div class="accent-bar"></div>
                `;
                break;
        }

        html += `
        </body>
        </html>
        `;

        return html;
    }

    /**
     * Optimiza thumbnail con Jimp (compresión y ajustes finales)
     */
    async optimizeThumbnail(thumbnailPath) {
        try {
            const image = await Jimp.read(thumbnailPath);

            // Ajustar calidad y comprimir
            image.quality(this.config.OUTPUT.quality);

            // Guardar optimizado
            await image.writeAsync(thumbnailPath);

            logger.info('✅ Thumbnail optimizado con Jimp');
        } catch (error) {
            logger.error('❌ Error optimizando thumbnail:', error);
            // No throw - thumbnail ya generado, optimización es bonus
        }
    }

    /**
     * Genera múltiples variaciones de thumbnail (A/B testing)
     */
    async generateVariations(contentType, contentData, variationCount = 3) {
        logger.info(`🎨 Generando ${variationCount} variaciones de thumbnail...`);

        const variations = [];

        for (let i = 0; i < variationCount; i++) {
            // Modificar ligeramente contentData para cada variación
            const variedData = this.applyVariation(contentData, i);

            const result = await this.generateThumbnail(contentType, variedData);

            if (result.success) {
                variations.push({
                    index: i + 1,
                    thumbnailPath: result.thumbnailPath,
                    filename: result.filename,
                    variation: variedData.variationNote || `Variation ${i + 1}`
                });
            }
        }

        logger.info(`✅ ${variations.length} variaciones generadas correctamente`);

        return {
            success: true,
            variations,
            totalGenerated: variations.length
        };
    }

    /**
     * Aplica variaciones sutiles a datos para A/B testing
     */
    applyVariation(contentData, variationIndex) {
        const varied = { ...contentData };

        switch (variationIndex) {
            case 0:
                // Variación original
                varied.variationNote = 'Original';
                break;
            case 1:
                // Variación con más énfasis
                varied.playerName = `¡${varied.playerName}!`;
                varied.variationNote = 'Énfasis con signos';
                break;
            case 2:
                // Variación con emojis adicionales
                if (varied.price) varied.price = `💰 ${varied.price}`;
                varied.variationNote = 'Emojis extra';
                break;
        }

        return varied;
    }

    /**
     * Genera thumbnail desde frame de video (extrae frame con FFmpeg)
     */
    async generateFromVideoFrame(videoPath, timeSeconds = 1) {
        logger.info(`📹 Extrayendo frame de video en t=${timeSeconds}s...`);

        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);

            const filename = `frame_${Date.now()}.jpg`;
            const outputPath = path.join(this.outputDir, filename);

            const ffmpegCommand = `ffmpeg -i "${videoPath}" -ss ${timeSeconds} -vframes 1 "${outputPath}"`;

            await execPromise(ffmpegCommand);

            logger.info('✅ Frame extraído correctamente');

            return {
                success: true,
                thumbnailPath: outputPath,
                filename
            };
        } catch (error) {
            logger.error('❌ Error extrayendo frame:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Valida dimensiones del thumbnail
     */
    async validateThumbnail(thumbnailPath) {
        try {
            const image = await Jimp.read(thumbnailPath);

            const validation = {
                passed: true,
                checks: []
            };

            // Check dimensiones
            if (
                image.bitmap.width !== this.config.DIMENSIONS.width ||
                image.bitmap.height !== this.config.DIMENSIONS.height
            ) {
                validation.checks.push({
                    name: 'Dimensiones',
                    passed: false,
                    message: `Dimensiones incorrectas: ${image.bitmap.width}x${image.bitmap.height} (esperado: ${this.config.DIMENSIONS.width}x${this.config.DIMENSIONS.height})`
                });
                validation.passed = false;
            } else {
                validation.checks.push({
                    name: 'Dimensiones',
                    passed: true,
                    message: 'Dimensiones correctas ✅'
                });
            }

            // Check tamaño de archivo (<2MB recomendado)
            const stats = await fs.stat(thumbnailPath);
            const fileSizeMB = stats.size / (1024 * 1024);

            if (fileSizeMB > 2) {
                validation.checks.push({
                    name: 'Tamaño archivo',
                    passed: false,
                    message: `Archivo muy grande: ${fileSizeMB.toFixed(2)}MB (recomendado <2MB)`
                });
                validation.passed = false;
            } else {
                validation.checks.push({
                    name: 'Tamaño archivo',
                    passed: true,
                    message: `Tamaño óptimo: ${fileSizeMB.toFixed(2)}MB ✅`
                });
            }

            return validation;
        } catch (error) {
            logger.error('❌ Error validando thumbnail:', error);
            return {
                passed: false,
                error: error.message
            };
        }
    }

    /**
     * Limpia thumbnails antiguos (>7 días)
     */
    async cleanupOldThumbnails() {
        try {
            const files = await fs.readdir(this.outputDir);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días

            let deleted = 0;

            for (const file of files) {
                const filePath = path.join(this.outputDir, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    deleted++;
                    logger.info(`🗑️ Thumbnail antiguo eliminado: ${file}`);
                }
            }

            logger.info(`✅ Limpieza completada: ${deleted} thumbnails eliminados`);

            return { deleted };
        } catch (error) {
            logger.error('❌ Error limpiando thumbnails:', error);
        }
    }

    /**
     * Obtiene estadísticas del servicio
     */
    async getStats() {
        const files = await fs.readdir(this.outputDir);
        return {
            totalThumbnails: files.length,
            dimensions: this.config.DIMENSIONS,
            supportedTypes: Object.keys(this.config.COLORS),
            outputFormat: this.config.OUTPUT.format,
            version: '1.0.0',
            lastUpdated: '2025-10-01'
        };
    }
}

module.exports = ThumbnailGenerator;
