const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * Sistema de Player Cards Overlay para videos Ana Real
 * Superpone tarjetas de jugadores sobre videos VEO3
 */
class PlayerCardsOverlay {
    constructor() {
        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
        this.tempDir = process.env.VEO3_TEMP_DIR || './temp/veo3';
        this.logsDir = process.env.VEO3_LOGS_DIR || './logs/veo3';

        // Configuración de overlay
        this.overlayConfig = {
            // Posición de la tarjeta de jugador (esquina inferior derecha)
            position: {
                x: 'W-w-20', // 20px desde el borde derecho
                y: 'H-h-20', // 20px desde el borde inferior
            },
            // Timing del overlay
            timing: {
                startTime: 2,    // Aparece a los 2 segundos
                duration: 4,     // Visible por 4 segundos
                fadeIn: 0.5,     // Fade in de 0.5 segundos
                fadeOut: 0.5     // Fade out de 0.5 segundos
            },
            // Tamaño de la tarjeta
            cardSize: {
                width: 280,      // Ancho de la tarjeta
                height: 180      // Alto de la tarjeta
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
     * Generar tarjeta de jugador en HTML para convertir a imagen
     * @param {object} playerData - Datos del jugador
     * @returns {string} - HTML de la tarjeta
     */
    generatePlayerCardHTML(playerData) {
        const {
            name = 'Jugador',
            team = 'Equipo',
            position = 'MID',
            price = '8.0',
            rating = '7.5',
            form = '3-2-1',
            photo = null
        } = playerData;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Arial', sans-serif;
                    background: transparent;
                }
                .player-card {
                    width: 280px;
                    height: 180px;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                    border: 2px solid #ffffff;
                    position: relative;
                    overflow: hidden;
                    color: white;
                }
                .card-header {
                    background: rgba(255,255,255,0.1);
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    backdrop-filter: blur(10px);
                }
                .position-badge {
                    background: #ff3333;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .team-name {
                    font-size: 12px;
                    opacity: 0.9;
                    text-transform: uppercase;
                    font-weight: 500;
                }
                .player-info {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: calc(100% - 40px);
                }
                .player-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .stats-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .stat-item {
                    text-align: center;
                    flex: 1;
                }
                .stat-label {
                    font-size: 11px;
                    opacity: 0.8;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .stat-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #00ff88;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                .price-highlight {
                    background: linear-gradient(45deg, #ff3333, #ff6b6b);
                    color: white;
                    text-align: center;
                    padding: 8px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    margin-top: 8px;
                }
                .fantasy-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #ffd700;
                    color: #000;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(255,215,0,0.4);
                }
            </style>
        </head>
        <body>
            <div class="player-card">
                <div class="card-header">
                    <div class="position-badge">${position}</div>
                    <div class="team-name">${team}</div>
                </div>

                <div class="player-info">
                    <div class="player-name">${name}</div>

                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-label">Rating</div>
                            <div class="stat-value">${rating}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Form</div>
                            <div class="stat-value">${form}</div>
                        </div>
                    </div>

                    <div class="price-highlight">
                        ${price}M €
                    </div>
                </div>

                <div class="fantasy-badge">
                    CHOLLO
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generar imagen de tarjeta de jugador desde HTML
     * @param {object} playerData - Datos del jugador
     * @param {string} outputPath - Ruta donde guardar la imagen
     * @returns {Promise<string>} - Ruta de la imagen generada
     */
    async generatePlayerCardImage(playerData, outputPath) {
        try {
            const nodeHtmlToImage = require('node-html-to-image');
            const html = this.generatePlayerCardHTML(playerData);

            console.log(`[PlayerCardsOverlay] Generando tarjeta de ${playerData.name}...`);

            await nodeHtmlToImage({
                output: outputPath,
                html: html,
                quality: 100,
                type: 'png',
                transparent: true,
                puppeteerArgs: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });

            console.log(`[PlayerCardsOverlay] Tarjeta generada: ${outputPath}`);
            return outputPath;

        } catch (error) {
            console.error('[PlayerCardsOverlay] Error generando tarjeta:', error.message);
            throw error;
        }
    }

    /**
     * Aplicar overlay de tarjeta de jugador a video
     * @param {string} videoPath - Ruta del video original
     * @param {object} playerData - Datos del jugador para la tarjeta
     * @param {object} options - Opciones adicionales
     * @returns {Promise<string>} - Ruta del video con overlay
     */
    async addPlayerCardOverlay(videoPath, playerData, options = {}) {
        try {
            console.log(`[PlayerCardsOverlay] Agregando overlay de ${playerData.name} al video`);

            // Generar nombre de archivos
            const videoBaseName = path.basename(videoPath, path.extname(videoPath));
            const cardImagePath = path.join(this.tempDir, `card-${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`);
            const outputVideoPath = path.join(this.outputDir, `${videoBaseName}-with-card.mp4`);

            // Generar imagen de tarjeta
            await this.generatePlayerCardImage(playerData, cardImagePath);

            // Configuración de overlay
            const config = { ...this.overlayConfig, ...options };

            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .input(cardImagePath)
                    .complexFilter([
                        // Aplicar fade in y fade out a la tarjeta
                        `[1:v]fade=t=in:st=${config.timing.startTime}:d=${config.timing.fadeIn}:alpha=1[card_fadein]`,
                        `[card_fadein]fade=t=out:st=${config.timing.startTime + config.timing.duration - config.timing.fadeOut}:d=${config.timing.fadeOut}:alpha=1[card_complete]`,
                        // Superponer la tarjeta sobre el video
                        `[0:v][card_complete]overlay=${config.position.x}:${config.position.y}:enable='between(t,${config.timing.startTime},${config.timing.startTime + config.timing.duration})'[output]`
                    ])
                    .map('[output]')
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .format('mp4')
                    .on('start', (commandLine) => {
                        console.log(`[PlayerCardsOverlay] FFmpeg iniciado: ${commandLine}`);
                    })
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            console.log(`[PlayerCardsOverlay] Progreso: ${Math.round(progress.percent)}%`);
                        }
                    })
                    .on('end', () => {
                        console.log(`[PlayerCardsOverlay] ✅ Overlay completado: ${outputVideoPath}`);

                        // Limpiar archivo temporal de tarjeta
                        if (fs.existsSync(cardImagePath)) {
                            fs.unlinkSync(cardImagePath);
                        }

                        resolve(outputVideoPath);
                    })
                    .on('error', (error) => {
                        console.error('[PlayerCardsOverlay] ❌ Error FFmpeg:', error.message);
                        reject(error);
                    })
                    .save(outputVideoPath);
            });

        } catch (error) {
            console.error('[PlayerCardsOverlay] Error aplicando overlay:', error.message);
            throw error;
        }
    }

    /**
     * Crear video con múltiples tarjetas de jugadores
     * @param {string} videoPath - Ruta del video original
     * @param {Array} playersData - Array de datos de jugadores
     * @param {object} options - Opciones adicionales
     * @returns {Promise<string>} - Ruta del video con múltiples overlays
     */
    async addMultiplePlayerCards(videoPath, playersData, options = {}) {
        try {
            console.log(`[PlayerCardsOverlay] Agregando ${playersData.length} tarjetas al video`);

            let currentVideoPath = videoPath;
            const baseName = path.basename(videoPath, path.extname(videoPath));

            for (let i = 0; i < playersData.length; i++) {
                const playerData = playersData[i];
                const timing = {
                    startTime: (i * 2) + 1, // Cada tarjeta aparece 2 segundos después
                    duration: 3,            // Cada tarjeta visible por 3 segundos
                    fadeIn: 0.3,
                    fadeOut: 0.3
                };

                const tempOutputPath = path.join(this.tempDir, `${baseName}-temp-${i}.mp4`);

                await this.addPlayerCardOverlay(currentVideoPath, playerData, {
                    timing,
                    ...options
                });

                // Si no es el primer video, eliminar el temporal anterior
                if (i > 0 && currentVideoPath !== videoPath) {
                    fs.unlinkSync(currentVideoPath);
                }

                currentVideoPath = tempOutputPath;
            }

            // Mover resultado final al directorio de output
            const finalOutputPath = path.join(this.outputDir, `${baseName}-multi-cards.mp4`);
            fs.renameSync(currentVideoPath, finalOutputPath);

            console.log(`[PlayerCardsOverlay] ✅ Múltiples overlays completados: ${finalOutputPath}`);
            return finalOutputPath;

        } catch (error) {
            console.error('[PlayerCardsOverlay] Error con múltiples overlays:', error.message);
            throw error;
        }
    }

    /**
     * Test del sistema de overlays
     * @param {string} videoPath - Ruta del video para test
     * @returns {Promise<object>} - Resultado del test
     */
    async runTest(videoPath) {
        try {
            console.log('[PlayerCardsOverlay] 🧪 Ejecutando test de overlay...');

            // Datos de test
            const testPlayerData = {
                name: 'Pedri',
                team: 'Barcelona',
                position: 'MID',
                price: '8.5',
                rating: '8.2',
                form: '5-4-3'
            };

            const resultPath = await this.addPlayerCardOverlay(videoPath, testPlayerData);

            console.log('[PlayerCardsOverlay] ✅ Test completado exitosamente');
            return {
                success: true,
                outputPath: resultPath,
                playerData: testPlayerData
            };

        } catch (error) {
            console.error('[PlayerCardsOverlay] ❌ Test falló:', error.message);
            throw error;
        }
    }

    /**
     * Log de operaciones para seguimiento
     * @param {object} operation - Detalles de la operación
     */
    logOperation(operation) {
        const logPath = path.join(this.logsDir, 'player-cards.log');
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: operation.type,
            success: operation.success,
            inputVideo: operation.inputVideo,
            outputVideo: operation.outputVideo,
            playersCount: operation.playersCount || 1,
            processingTime: operation.processingTime
        };

        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    }
}

module.exports = PlayerCardsOverlay;