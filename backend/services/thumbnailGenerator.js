/**
 * YouTube Thumbnail Generator
 *
 * Genera thumbnails personalizados automáticamente para YouTube Shorts.
 *
 * ESTRATEGIA:
 * - Extraer primer frame del video (cara de Ana)
 * - Agregar overlay con texto grande del precio/chollo
 * - Agregar logo del equipo
 * - Optimizar para CTR (1280x720px, colores contrastantes)
 *
 * IMPACTO:
 * - 80% del CTR depende del thumbnail
 * - Thumbnails personalizados aumentan CTR 3-5x vs auto-generados
 */

const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class ThumbnailGenerator {
    constructor() {
        this.config = {
            width: 1280,
            height: 720,
            quality: 90,
            format: 'png',

            // Colores del brand (Fantasy La Liga)
            colors: {
                primary: '#FF4B00',      // Naranja brillante
                secondary: '#FFD700',    // Dorado
                background: '#1a1a2e',   // Azul oscuro
                text: '#FFFFFF'          // Blanco
            },

            // Tipografía
            fonts: {
                main: 'Arial-Bold',
                secondary: 'Arial'
            }
        };

        this.outputDir = path.join(__dirname, '../../output/thumbnails');

        // Crear directorio si no existe
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generar thumbnail para un video de chollo
     *
     * @param {Object} options - Opciones de generación
     * @param {string} options.videoPath - Path del video fuente
     * @param {Object} options.playerData - Datos del jugador
     * @param {string} options.playerData.name - Nombre del jugador
     * @param {string} options.playerData.team - Equipo
     * @param {number} options.playerData.price - Precio en millones
     * @param {number} options.playerData.ratio - Ratio valor
     * @param {string} options.playerData.position - Posición
     * @param {string} [options.teamLogoPath] - Path al logo del equipo (opcional)
     *
     * @returns {string} Path del thumbnail generado
     */
    async generateCholloThumbnail(options) {
        try {
            const { videoPath, playerData, teamLogoPath } = options;

            logger.info('🎨 [ThumbnailGenerator] Iniciando generación de thumbnail', {
                video: path.basename(videoPath),
                player: playerData.name
            });

            // 1. Extraer primer frame del video (cara de Ana)
            const frameTimestamp = '00:00:00.500'; // 0.5 segundos (Ana ya visible)
            const framePath = await this._extractFrame(videoPath, frameTimestamp);

            logger.info('[ThumbnailGenerator] Frame extraído', { framePath });

            // 2. Crear overlay con texto del chollo
            const overlayPath = await this._createTextOverlay(playerData);

            logger.info('[ThumbnailGenerator] Overlay de texto creado', { overlayPath });

            // 3. Combinar frame + overlay + logo (si existe)
            const thumbnailPath = await this._composeThumbnail({
                framePath,
                overlayPath,
                teamLogoPath,
                playerData
            });

            logger.info('✅ [ThumbnailGenerator] Thumbnail generado exitosamente', {
                path: thumbnailPath
            });

            // Limpiar archivos temporales
            this._cleanupTemp([framePath, overlayPath]);

            return thumbnailPath;
        } catch (error) {
            logger.error('❌ [ThumbnailGenerator] Error generando thumbnail', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Extraer frame del video usando FFmpeg
     * @private
     */
    async _extractFrame(videoPath, timestamp) {
        const outputPath = path.join(
            this.outputDir,
            `frame-${Date.now()}.png`
        );

        const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`;

        try {
            await execAsync(command);

            if (!fs.existsSync(outputPath)) {
                throw new Error('Frame no generado por FFmpeg');
            }

            return outputPath;
        } catch (error) {
            logger.error('[ThumbnailGenerator] Error extrayendo frame', {
                error: error.message,
                command
            });
            throw error;
        }
    }

    /**
     * Crear overlay de texto con información del chollo
     * @private
     */
    async _createTextOverlay(playerData) {
        const { price, ratio, name } = playerData;

        // Formatear precio (€4.54M)
        const priceText = `€${price.toFixed(2)}M`;

        // Crear SVG con texto estilizado
        const svg = `
            <svg width="${this.config.width}" height="${this.config.height}">
                <!-- Rectángulo semitransparente en la parte superior -->
                <rect x="0" y="0" width="${this.config.width}" height="200"
                      fill="${this.config.colors.background}" opacity="0.85" />

                <!-- Texto "CHOLLO" -->
                <text x="640" y="80"
                      font-family="${this.config.fonts.main}"
                      font-size="72"
                      fill="${this.config.colors.primary}"
                      text-anchor="middle"
                      font-weight="bold">
                    🔥 CHOLLO
                </text>

                <!-- Precio grande -->
                <text x="640" y="160"
                      font-family="${this.config.fonts.main}"
                      font-size="90"
                      fill="${this.config.colors.secondary}"
                      text-anchor="middle"
                      font-weight="bold"
                      stroke="${this.config.colors.background}"
                      stroke-width="3">
                    ${priceText}
                </text>

                <!-- Rectángulo en la parte inferior para ratio -->
                <rect x="0" y="${this.config.height - 120}" width="${this.config.width}" height="120"
                      fill="${this.config.colors.background}" opacity="0.85" />

                <!-- Ratio valor -->
                <text x="640" y="${this.config.height - 50}"
                      font-family="${this.config.fonts.main}"
                      font-size="60"
                      fill="${this.config.colors.text}"
                      text-anchor="middle"
                      font-weight="bold">
                    Ratio ${ratio.toFixed(2)}x 💎
                </text>
            </svg>
        `;

        const overlayPath = path.join(
            this.outputDir,
            `overlay-${Date.now()}.png`
        );

        try {
            // Convertir SVG a PNG con sharp
            await sharp(Buffer.from(svg))
                .png()
                .toFile(overlayPath);

            return overlayPath;
        } catch (error) {
            logger.error('[ThumbnailGenerator] Error creando overlay', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Componer thumbnail final (frame + overlay + logo)
     * @private
     */
    async _composeThumbnail({ framePath, overlayPath, teamLogoPath, playerData }) {
        const outputPath = path.join(
            this.outputDir,
            `thumbnail-${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
        );

        try {
            // Redimensionar frame a 1280x720 (16:9)
            let image = sharp(framePath)
                .resize(this.config.width, this.config.height, {
                    fit: 'cover',
                    position: 'center'
                });

            // Composiciones a agregar
            const composites = [
                {
                    input: overlayPath,
                    blend: 'over'
                }
            ];

            // Agregar logo del equipo si existe
            if (teamLogoPath && fs.existsSync(teamLogoPath)) {
                // Redimensionar logo a 120x120 y posicionarlo en esquina superior derecha
                const logoBuffer = await sharp(teamLogoPath)
                    .resize(120, 120, { fit: 'inside' })
                    .png()
                    .toBuffer();

                composites.push({
                    input: logoBuffer,
                    top: 30,
                    left: this.config.width - 150,
                    blend: 'over'
                });
            }

            // Aplicar todas las composiciones
            await image
                .composite(composites)
                .png({ quality: this.config.quality })
                .toFile(outputPath);

            logger.info('[ThumbnailGenerator] Thumbnail compuesto exitosamente', {
                output: outputPath,
                size: `${this.config.width}x${this.config.height}`
            });

            return outputPath;
        } catch (error) {
            logger.error('[ThumbnailGenerator] Error componiendo thumbnail', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Limpiar archivos temporales
     * @private
     */
    _cleanupTemp(filePaths) {
        filePaths.forEach(filePath => {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    logger.debug('[ThumbnailGenerator] Archivo temporal eliminado', {
                        file: path.basename(filePath)
                    });
                } catch (error) {
                    logger.warn('[ThumbnailGenerator] No se pudo eliminar archivo temporal', {
                        file: path.basename(filePath),
                        error: error.message
                    });
                }
            }
        });
    }

    /**
     * Subir thumbnail a YouTube
     *
     * @param {string} thumbnailPath - Path local del thumbnail
     * @param {string} videoId - ID del video de YouTube
     * @param {Object} youtube - Cliente de YouTube Data API
     * @returns {boolean} true si se subió exitosamente
     */
    async uploadToYouTube(thumbnailPath, videoId, youtube) {
        try {
            if (!fs.existsSync(thumbnailPath)) {
                throw new Error(`Thumbnail no encontrado: ${thumbnailPath}`);
            }

            logger.info('📤 [ThumbnailGenerator] Subiendo thumbnail a YouTube', {
                videoId,
                thumbnailPath: path.basename(thumbnailPath)
            });

            await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    body: fs.createReadStream(thumbnailPath)
                }
            });

            logger.info('✅ [ThumbnailGenerator] Thumbnail subido exitosamente a YouTube', {
                videoId
            });

            return true;
        } catch (error) {
            logger.error('❌ [ThumbnailGenerator] Error subiendo thumbnail a YouTube', {
                error: error.message,
                videoId
            });
            throw error;
        }
    }

    /**
     * Generar y subir thumbnail en un solo paso
     *
     * @param {Object} options - Opciones combinadas
     * @returns {Object} Resultado con paths y estado
     */
    async generateAndUpload(options) {
        try {
            const { videoPath, playerData, teamLogoPath, videoId, youtube } = options;

            // 1. Generar thumbnail
            const thumbnailPath = await this.generateCholloThumbnail({
                videoPath,
                playerData,
                teamLogoPath
            });

            // 2. Subir a YouTube
            await this.uploadToYouTube(thumbnailPath, videoId, youtube);

            return {
                success: true,
                thumbnailPath,
                videoId,
                uploaded: true
            };
        } catch (error) {
            logger.error('❌ [ThumbnailGenerator] Error en generateAndUpload', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new ThumbnailGenerator();
