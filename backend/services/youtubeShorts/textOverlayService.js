/**
 * Text Overlay Service - YouTube Shorts
 *
 * Sistema de overlays dinámicos de texto y datos para YouTube Shorts.
 * Muestra estadísticas, precios, y datos clave de forma visual impactante.
 *
 * Funcionalidades:
 * - Overlays de texto animados
 * - Stats cards visuales
 * - Price tags y badges
 * - Animaciones de entrada/salida
 * - Posicionamiento inteligente (no interferir con subtítulos ni UI)
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
 * CONFIGURACIÓN TEXT OVERLAYS YOUTUBE SHORTS
 */
const OVERLAY_CONFIG = {
    // Resolución Shorts
    CANVAS: {
        width: 1080,
        height: 1920,
        aspectRatio: '9:16'
    },

    // Zonas seguras (evitar UI de YouTube Shorts)
    SAFE_ZONES: {
        top: 180, // Evitar botones superiores
        bottom: 250, // Evitar botones like/comment/share
        left: 40,
        right: 40,
        captionsZone: { top: 800, bottom: 1120 } // Zona reservada subtítulos
    },

    // Posiciones predefinidas
    POSITIONS: {
        'top-left': { x: 60, y: 200 },
        'top-right': { x: 880, y: 200, anchor: 'right' },
        'top-center': { x: 540, y: 200, anchor: 'center' },
        'middle-left': { x: 60, y: 640 },
        'middle-right': { x: 880, y: 640, anchor: 'right' },
        'center': { x: 540, y: 960, anchor: 'center' },
        'bottom-left': { x: 60, y: 1600 },
        'bottom-right': { x: 880, y: 1600, anchor: 'right' },
        'bottom-center': { x: 540, y: 1600, anchor: 'center' }
    },

    // Estilos de texto
    TEXT_STYLES: {
        'extra-large-bold': {
            fontSize: 120,
            fontFamily: 'Arial Black',
            fontColor: 'white',
            strokeColor: 'black',
            strokeWidth: 6,
            bold: true,
            shadow: true,
            shadowColor: 'black',
            shadowOffsetX: 4,
            shadowOffsetY: 4
        },
        'large-bold': {
            fontSize: 80,
            fontFamily: 'Arial Black',
            fontColor: 'white',
            strokeColor: 'black',
            strokeWidth: 4,
            bold: true,
            shadow: true,
            shadowColor: 'black',
            shadowOffsetX: 3,
            shadowOffsetY: 3
        },
        'medium': {
            fontSize: 60,
            fontFamily: 'Arial',
            fontColor: 'white',
            strokeColor: 'black',
            strokeWidth: 3,
            bold: true,
            shadow: true,
            shadowColor: 'black',
            shadowOffsetX: 2,
            shadowOffsetY: 2
        },
        'small': {
            fontSize: 40,
            fontFamily: 'Arial',
            fontColor: 'white',
            strokeColor: 'black',
            strokeWidth: 2,
            bold: false,
            shadow: true,
            shadowColor: 'black',
            shadowOffsetX: 2,
            shadowOffsetY: 2
        },
        'banner': {
            fontSize: 70,
            fontFamily: 'Arial Black',
            fontColor: 'white',
            strokeColor: 'black',
            strokeWidth: 4,
            bold: true,
            shadow: true,
            backgroundColor: 'rgba(255,0,0,0.8)',
            padding: 20
        }
    },

    // Animaciones
    ANIMATIONS: {
        'fade-in': {
            duration: 0.5,
            easing: 'ease-in'
        },
        'fade-out': {
            duration: 0.5,
            easing: 'ease-out'
        },
        'slide-in-left': {
            duration: 0.6,
            easing: 'ease-out'
        },
        'slide-in-right': {
            duration: 0.6,
            easing: 'ease-out'
        },
        'zoom-in': {
            duration: 0.8,
            easing: 'ease-out',
            scale: { from: 0.5, to: 1.0 }
        },
        'pulse': {
            duration: 1.0,
            easing: 'ease-in-out',
            repeat: true,
            scale: { from: 1.0, to: 1.1 }
        },
        'bounce': {
            duration: 0.8,
            easing: 'bounce'
        }
    },

    // Colores por tipo de dato
    COLORS: {
        price: '#00FF00', // Verde para precios
        positive: '#00FF00', // Verde para datos positivos
        negative: '#FF0000', // Rojo para datos negativos
        neutral: '#FFFFFF', // Blanco para neutro
        highlight: '#FFD700', // Dorado para destacar
        warning: '#FF6600', // Naranja para advertencias
        urgent: '#FF0000' // Rojo para urgente
    }
};

class TextOverlayService {
    constructor() {
        this.config = OVERLAY_CONFIG;
        this.tempDir = path.join(__dirname, '../../temp/overlays');
        this.ensureTempDir();
        logger.info('✅ TextOverlayService inicializado para Shorts');
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
     * Genera overlays de texto para un Short
     * @param {Array} overlays - Array de overlays con configuración
     * @param {Number} videoDuration - Duración total del video
     * @returns {Object} { success, overlaysConfig, ffmpegFilter }
     */
    async generateOverlays(overlays, videoDuration) {
        logger.info(`📊 Generando ${overlays.length} overlays de texto...`);

        try {
            const processedOverlays = [];

            for (const overlay of overlays) {
                const processed = this.processOverlay(overlay, videoDuration);
                processedOverlays.push(processed);
            }

            // Construir filtro FFmpeg
            const ffmpegFilter = this.buildFFmpegFilter(processedOverlays);

            logger.info(`✅ ${processedOverlays.length} overlays procesados correctamente`);

            return {
                success: true,
                overlays: processedOverlays,
                ffmpegFilter,
                metadata: {
                    totalOverlays: processedOverlays.length,
                    videoDuration,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('❌ Error generando overlays:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesa un overlay individual
     */
    processOverlay(overlay, videoDuration) {
        // Validar posición
        const position = this.config.POSITIONS[overlay.position] || this.config.POSITIONS['center'];

        // Validar estilo
        const style = this.config.TEXT_STYLES[overlay.style] || this.config.TEXT_STYLES['medium'];

        // Calcular timing
        let startTime = overlay.startTime || 0;
        let duration;

        if (overlay.duration === 'full') {
            duration = videoDuration;
        } else {
            duration = overlay.duration || 3;
        }

        const endTime = startTime + duration;

        // Color dinámico
        let textColor = overlay.color || style.fontColor;
        if (overlay.colorType) {
            textColor = this.config.COLORS[overlay.colorType] || textColor;
        }

        // Animación
        const animation = overlay.animation
            ? this.config.ANIMATIONS[overlay.animation]
            : this.config.ANIMATIONS['fade-in'];

        return {
            text: overlay.text,
            position,
            style: {
                ...style,
                fontColor: textColor
            },
            timing: {
                startTime,
                endTime,
                duration
            },
            animation,
            zIndex: overlay.zIndex || 10
        };
    }

    /**
     * Construye filtro complejo de FFmpeg para todos los overlays
     */
    buildFFmpegFilter(overlays) {
        const filters = [];

        overlays.forEach((overlay, index) => {
            const text = overlay.text.replace(/'/g, "\\'"); // Escapar comillas
            const style = overlay.style;
            const pos = overlay.position;
            const timing = overlay.timing;

            // Determinar posición X/Y según anchor
            let xPos, yPos;

            if (pos.anchor === 'center') {
                xPos = `(w-text_w)/2`;
                yPos = pos.y;
            } else if (pos.anchor === 'right') {
                xPos = `w-text_w-${this.config.SAFE_ZONES.right}`;
                yPos = pos.y;
            } else {
                xPos = pos.x;
                yPos = pos.y;
            }

            // Construir drawtext filter
            let drawtext = `drawtext=text='${text}'`;
            drawtext += `:fontfile=/System/Library/Fonts/Supplemental/Arial.ttf`; // macOS path
            drawtext += `:fontsize=${style.fontSize}`;
            drawtext += `:fontcolor=${style.fontColor}`;
            drawtext += `:x=${xPos}`;
            drawtext += `:y=${yPos}`;

            // Stroke (borde)
            if (style.strokeWidth > 0) {
                drawtext += `:borderw=${style.strokeWidth}`;
                drawtext += `:bordercolor=${style.strokeColor}`;
            }

            // Shadow
            if (style.shadow) {
                drawtext += `:shadowx=${style.shadowOffsetX}`;
                drawtext += `:shadowy=${style.shadowOffsetY}`;
                drawtext += `:shadowcolor=${style.shadowColor}`;
            }

            // Timing con fade in/out
            const fadeInDuration = 0.5;
            const fadeOutDuration = 0.5;
            const fadeOutStart = timing.endTime - fadeOutDuration;

            drawtext += `:enable='between(t,${timing.startTime},${timing.endTime})'`;

            // Fade in
            if (overlay.animation.easing === 'ease-in' || overlay.animation.easing === 'ease-out') {
                drawtext += `:alpha='if(lt(t,${timing.startTime + fadeInDuration}), (t-${timing.startTime})/${fadeInDuration}, if(gt(t,${fadeOutStart}), (${timing.endTime}-t)/${fadeOutDuration}, 1))'`;
            }

            filters.push(drawtext);
        });

        // Unir todos los filtros con comas
        return filters.join(',');
    }

    /**
     * Aplica overlays a un video usando FFmpeg
     */
    async applyOverlaysToVideo(videoPath, overlays, videoDuration, outputPath) {
        logger.info('🎬 Aplicando overlays a video con FFmpeg...');

        try {
            const overlaysResult = await this.generateOverlays(overlays, videoDuration);

            if (!overlaysResult.success) {
                throw new Error('Error generando configuración overlays');
            }

            const ffmpegFilter = overlaysResult.ffmpegFilter;

            if (!ffmpegFilter || ffmpegFilter === '') {
                logger.warn('⚠️ No hay overlays para aplicar');
                return {
                    success: true,
                    outputPath: videoPath,
                    message: 'No overlays to apply'
                };
            }

            const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "${ffmpegFilter}" -c:a copy "${outputPath}"`;

            const { stdout, stderr } = await execPromise(ffmpegCommand);

            logger.info('✅ Overlays aplicados correctamente');

            return {
                success: true,
                outputPath,
                overlaysApplied: overlays.length,
                logs: { stdout, stderr }
            };
        } catch (error) {
            logger.error('❌ Error aplicando overlays con FFmpeg:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Genera overlays predefinidos por tipo de contenido
     */
    generateOverlaysByContentType(contentType, contentData, videoDuration) {
        const overlays = [];

        switch (contentType) {
            case 'chollo_viral':
                // Precio destacado top-right
                overlays.push({
                    text: `💰 ${contentData.price}M`,
                    position: 'top-right',
                    style: 'large-bold',
                    colorType: 'price',
                    duration: 'full',
                    animation: 'fade-in',
                    zIndex: 15
                });

                // Ratio valor bottom-left (aparece después)
                overlays.push({
                    text: `📈 Valor: ${contentData.valueRatio}x`,
                    position: 'bottom-left',
                    style: 'medium',
                    colorType: 'highlight',
                    startTime: 5,
                    duration: 8,
                    animation: 'slide-in-left',
                    zIndex: 12
                });

                // Puntos esperados (aparece al final)
                overlays.push({
                    text: `⚡ ${contentData.expectedPoints}pts esperados`,
                    position: 'bottom-center',
                    style: 'medium',
                    colorType: 'positive',
                    startTime: 15,
                    duration: 5,
                    animation: 'zoom-in',
                    zIndex: 12
                });
                break;

            case 'breaking_news':
                // Banner ÚLTIMA HORA top-center
                overlays.push({
                    text: '🚨 ÚLTIMA HORA',
                    position: 'top-center',
                    style: 'banner',
                    colorType: 'urgent',
                    duration: 'full',
                    animation: 'pulse',
                    zIndex: 20
                });

                // Nombre jugador center (impacto)
                overlays.push({
                    text: contentData.playerName.toUpperCase(),
                    position: 'center',
                    style: 'extra-large-bold',
                    colorType: 'highlight',
                    startTime: 2,
                    duration: 4,
                    animation: 'zoom-in',
                    zIndex: 18
                });
                break;

            case 'stats_impactantes':
                // Estadística principal center (impacto máximo)
                overlays.push({
                    text: contentData.statValue,
                    position: 'center',
                    style: 'extra-large-bold',
                    colorType: 'highlight',
                    startTime: 3,
                    duration: 5,
                    animation: 'zoom-in',
                    zIndex: 18
                });

                // Comparativa bottom-center (contexto)
                overlays.push({
                    text: contentData.comparison,
                    position: 'bottom-center',
                    style: 'medium',
                    colorType: 'neutral',
                    startTime: 10,
                    duration: 8,
                    animation: 'fade-in',
                    zIndex: 12
                });
                break;

            case 'prediccion_jornada':
                // Jornada top-left (contexto)
                overlays.push({
                    text: `⚽ J${contentData.gameweek}`,
                    position: 'top-left',
                    style: 'large-bold',
                    colorType: 'neutral',
                    duration: 'full',
                    animation: 'fade-in',
                    zIndex: 15
                });

                // Apuesta 1 (timing sincronizado con audio)
                overlays.push({
                    text: '1️⃣',
                    position: 'top-right',
                    style: 'large-bold',
                    colorType: 'highlight',
                    startTime: 5,
                    duration: 12,
                    animation: 'bounce',
                    zIndex: 12
                });

                // Apuesta 2
                overlays.push({
                    text: '2️⃣',
                    position: 'top-right',
                    style: 'large-bold',
                    colorType: 'highlight',
                    startTime: 18,
                    duration: 12,
                    animation: 'bounce',
                    zIndex: 12
                });

                // Apuesta 3 (POLÉMICA)
                overlays.push({
                    text: '3️⃣ 🔥',
                    position: 'top-right',
                    style: 'large-bold',
                    colorType: 'urgent',
                    startTime: 31,
                    duration: 15,
                    animation: 'pulse',
                    zIndex: 12
                });
                break;
        }

        return overlays;
    }

    /**
     * Valida que overlays no interfieran con zonas críticas
     */
    validateOverlayPositions(overlays) {
        const validation = {
            passed: true,
            warnings: []
        };

        overlays.forEach((overlay, index) => {
            const pos = overlay.position;

            // Check zona de subtítulos
            if (
                pos.y >= this.config.SAFE_ZONES.captionsZone.top &&
                pos.y <= this.config.SAFE_ZONES.captionsZone.bottom
            ) {
                validation.warnings.push(
                    `Overlay ${index + 1} puede interferir con subtítulos (y=${pos.y})`
                );
            }

            // Check zona UI inferior
            if (pos.y > this.config.CANVAS.height - this.config.SAFE_ZONES.bottom) {
                validation.warnings.push(
                    `Overlay ${index + 1} puede quedar oculto por UI de Shorts (y=${pos.y})`
                );
            }

            // Check zona UI superior
            if (pos.y < this.config.SAFE_ZONES.top) {
                validation.warnings.push(
                    `Overlay ${index + 1} puede quedar oculto por UI superior (y=${pos.y})`
                );
            }
        });

        return validation;
    }

    /**
     * Limpia archivos temporales antiguos
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
    getStats() {
        return {
            canvas: this.config.CANVAS,
            safeZones: this.config.SAFE_ZONES,
            availablePositions: Object.keys(this.config.POSITIONS),
            availableStyles: Object.keys(this.config.TEXT_STYLES),
            availableAnimations: Object.keys(this.config.ANIMATIONS),
            availableColors: Object.keys(this.config.COLORS),
            version: '1.0.0',
            lastUpdated: '2025-10-01'
        };
    }
}

module.exports = TextOverlayService;
