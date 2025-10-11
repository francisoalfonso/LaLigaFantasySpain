const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');
const axios = require('axios');
const BargainsDataService = require('../bargainsDataService');

/**
 * PlayerCardOverlay
 *
 * Genera tarjetas de jugador visuales tipo Instagram
 * y las superpone en videos con animación slide-in
 *
 * Diseño basado en mockup del usuario:
 * - Foto jugador (izquierda, 120x120px circular)
 * - Nombre del jugador (fuente grande, bold)
 * - 3 stats: Partidos, Goles, Rating
 * - Fondo semi-transparente blanco/gris
 * - Animación slide-in desde izquierda en segundo 3
 *
 * ✅ OPTIMIZACIÓN (9 Oct 2025):
 * Usa BargainsDataService para obtener datos completos desde caché
 * - Evita llamadas repetidas a API-Sports
 * - Obtiene ID correcto del jugador
 * - Obtiene URL de foto oficial
 * - Caché de 30 minutos (automático en BargainAnalyzer)
 */
class PlayerCardOverlay {
    constructor() {
        this.outputDir = process.env.VEO3_OUTPUT_DIR || path.join(__dirname, '../../output/veo3');
        this.tempDir = process.env.VEO3_TEMP_DIR || path.join(__dirname, '../../temp/veo3');
        this.cacheDir = path.join(this.tempDir, 'cache');

        // ✅ NUEVO: Servicio para obtener datos de bargains desde caché
        this.bargainsService = new BargainsDataService();

        // Dimensiones de la tarjeta (basado en mockup)
        this.cardWidth = 320; // Reducido de 380 a 320
        this.cardHeight = 100; // Reducido de 120 a 100

        // Posición en el video (parte inferior izquierda)
        // NOTA: Videos VEO3 son 720x1280 (no 1080x1920)
        this.cardPosition = {
            x: 0, // Pegado al borde izquierdo (sin margen)
            y: 1280 - 100 - 310 // 310px desde el fondo (ajustado: +180px arriba total)
            // Resultado: y = 870px (para videos 720x1280)
        };

        // Timing de la animación
        this.animation = {
            startTime: 3.0, // Aparece en el segundo 3
            duration: 4.0, // Visible durante 4 segundos (hasta segundo 7)
            slideInDuration: 0.5 // Animación de entrada dura 0.5s
        };

        // Tipografía y colores
        this.design = {
            backgroundColor: 0xf5f5f5ff, // Gris claro con opacidad
            textColor: 0x000000ff, // Negro para texto
            accentColor: 0x3b82f6ff, // Azul para números
            photoSize: 100, // Tamaño de la foto circular
            borderRadius: 12, // Bordes redondeados de la tarjeta
            padding: 10, // Padding interno
            shadowColor: 0x00000040 // Sombra suave
        };

        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.outputDir, this.tempDir, this.cacheDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Obtiene el logo del equipo como data URI
     * @param {object} playerData - Datos del jugador
     * @returns {Promise<string|null>} - Data URI del logo o null
     */
    async getTeamLogo(playerData) {
        try {
            if (playerData.teamLogo && playerData.teamLogo.startsWith('http')) {
                logger.info(`[PlayerCardOverlay] 🏆 Descargando logo del equipo...`);
                const response = await axios.get(playerData.teamLogo, {
                    responseType: 'arraybuffer',
                    timeout: 5000
                });
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                return `data:image/png;base64,${base64Image}`;
            }
            return null;
        } catch (error) {
            logger.warn(`[PlayerCardOverlay] ⚠️  Error descargando logo: ${error.message}`);
            return null;
        }
    }

    /**
     * Obtiene la foto del jugador (local > API > placeholder)
     * @param {object} playerData - Datos del jugador
     * @returns {Promise<string>} - URL de la foto (local file:// o data URI placeholder)
     */
    async getPlayerPhoto(playerData) {
        try {
            // 1. Intentar foto local (si tenemos player_id)
            if (playerData.id) {
                const localPhotoPath = path.join(
                    __dirname,
                    '../../../data/player-photos',
                    `${playerData.id}.jpg`
                );
                logger.info(`[PlayerCardOverlay] 🔍 Buscando foto en: ${localPhotoPath}`);

                if (fs.existsSync(localPhotoPath)) {
                    logger.info(`[PlayerCardOverlay] 📸 Usando foto local para ${playerData.name}`);
                    // Convertir a data URI para Puppeteer
                    const imageBuffer = fs.readFileSync(localPhotoPath);
                    const base64Image = imageBuffer.toString('base64');
                    return `data:image/jpeg;base64,${base64Image}`;
                } else {
                    logger.warn(
                        `[PlayerCardOverlay] ⚠️  Foto local NO encontrada en: ${localPhotoPath}`
                    );
                }
            } else {
                logger.warn(`[PlayerCardOverlay] ⚠️  playerData.id no proporcionado`);
            }

            // 2. Intentar URL de API (si playerData.photo existe)
            if (playerData.photo && playerData.photo.startsWith('http')) {
                logger.info(`[PlayerCardOverlay] 🌐 Usando foto de API para ${playerData.name}`);
                // Descargar y convertir a data URI para evitar problemas de CORS
                const response = await axios.get(playerData.photo, {
                    responseType: 'arraybuffer',
                    timeout: 5000
                });
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                return `data:image/jpeg;base64,${base64Image}`;
            }

            // 3. Placeholder (círculo gris con "?")
            logger.info(`[PlayerCardOverlay] ⚪ Usando placeholder para ${playerData.name}`);
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0NDQ0NDQyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+PzwvdGV4dD48L3N2Zz4=';
        } catch (error) {
            logger.error(`[PlayerCardOverlay] Error obteniendo foto: ${error.message}`);
            // Fallback a placeholder
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0NDQ0NDQyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+PzwvdGV4dD48L3N2Zz4=';
        }
    }

    /**
     * Genera imagen PNG de la tarjeta del jugador usando HTML + Puppeteer
     * @param {object} playerData - Datos del jugador
     * @param {number} playerData.id - ID del jugador (API-Sports) (opcional)
     * @param {string} playerData.name - Nombre del jugador
     * @param {number} playerData.stats.games - Partidos jugados
     * @param {number} playerData.stats.goals - Goles
     * @param {string} playerData.stats.rating - Rating (ej: "6.93")
     * @param {string} playerData.photo - URL de la foto del jugador (opcional)
     * @returns {Promise<string>} - Ruta de la imagen PNG generada
     */
    async generateCardImage(playerData) {
        let browser;
        try {
            logger.info(`[PlayerCardOverlay] Generando tarjeta para ${playerData.name}...`);

            // ✅ OPTIMIZACIÓN: Enriquecer datos desde caché de bargains si es necesario
            let enrichedPlayerData = playerData;

            if (!playerData.id || !playerData.photo) {
                logger.info(
                    `[PlayerCardOverlay] Datos incompletos - buscando en caché de bargains...`
                );
                const bargainData = await this.bargainsService.getBargainByPlayerName(
                    playerData.name
                );

                if (bargainData) {
                    logger.info(
                        `[PlayerCardOverlay] ✅ Datos encontrados en caché (id: ${bargainData.id})`
                    );
                    enrichedPlayerData = {
                        ...playerData,
                        id: bargainData.id,
                        photo: bargainData.photo,
                        team: bargainData.team || playerData.team,
                        position: bargainData.position || playerData.position
                    };
                } else {
                    logger.warn(
                        `[PlayerCardOverlay] ⚠️ Jugador no encontrado en caché de bargains`
                    );
                }
            }

            // Obtener foto del jugador (local > API > placeholder)
            const photoUrl = await this.getPlayerPhoto(enrichedPlayerData);

            // Obtener logo del equipo
            const teamLogoUrl = await this.getTeamLogo(playerData);

            // Generar HTML de la tarjeta
            const html = this.generateCardHTML({
                ...playerData,
                photo: photoUrl,
                teamLogoDataUri: teamLogoUrl
            });

            // Lanzar Puppeteer
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Configurar viewport con dimensiones de la tarjeta
            await page.setViewport({
                width: this.cardWidth,
                height: this.cardHeight,
                deviceScaleFactor: 2 // Retina para mejor calidad
            });

            // Cargar HTML
            await page.setContent(html, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            // Esperar un momento para que se renderice
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generar screenshot
            const cardFilename = `player-card-${playerData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
            const cardPath = path.join(this.tempDir, cardFilename);

            await page.screenshot({
                path: cardPath,
                omitBackground: false // Incluir fondo
            });

            await browser.close();

            logger.info(`[PlayerCardOverlay] ✅ Tarjeta generada: ${cardPath}`);
            return cardPath;
        } catch (error) {
            if (browser) {
                await browser.close();
            }
            logger.error(`[PlayerCardOverlay] Error generando tarjeta: ${error.message}`);
            throw error;
        }
    }

    /**
     * Genera HTML de la tarjeta con CSS inline
     * Basado en mockups del usuario
     */
    generateCardHTML(playerData) {
        // Si no hay foto, usamos un placeholder SVG embebido
        const photoUrl =
            playerData.photo ||
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0NDQ0NDQyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+PzwvdGV4dD48L3N2Zz4=';

        return `
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
            width: ${this.cardWidth}px;
            height: ${this.cardHeight}px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: rgba(255, 255, 255, 0.20);
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            position: relative;
        }

        .card {
            display: flex;
            align-items: center;
            width: 100%;
            height: 100%;
        }

        .photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            background: #CCCCCC;
            border: 2px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .info {
            flex: 1;
            margin-left: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .player-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }

        .name {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.2;
        }

        .team-logo {
            width: 20px;
            height: 20px;
            object-fit: contain;
        }

        .position-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #3B82F6;
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 6px;
            text-transform: uppercase;
        }

        .stats {
            display: flex;
            gap: 20px;
        }

        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .stat-value {
            font-size: 22px;
            font-weight: 700;
            color: #3B82F6;
            line-height: 1;
            margin-bottom: 2px;
        }

        .stat-label {
            font-size: 9px;
            font-weight: 500;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    ${playerData.position ? `<div class="position-badge">${playerData.position}</div>` : ''}
    <div class="card">
        <div class="photo">
            <img src="${photoUrl}" alt="${playerData.name}" onerror="this.style.display='none'">
        </div>
        <div class="info">
            <div class="player-header">
                <div class="name">${playerData.name}</div>
                ${playerData.teamLogoDataUri ? `<img src="${playerData.teamLogoDataUri}" class="team-logo" alt="Team logo">` : ''}
            </div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${playerData.stats.games}</div>
                    <div class="stat-label">Partidos</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${playerData.stats.goals}</div>
                    <div class="stat-label">Goles</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${playerData.stats.rating}</div>
                    <div class="stat-label">Rating</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Aplica overlay de tarjeta a un video con FFmpeg
     * Incluye animación slide-in desde la izquierda
     *
     * @param {string} videoPath - Ruta del video original
     * @param {string} cardImagePath - Ruta de la imagen de la tarjeta
     * @param {object} options - Opciones de overlay
     * @returns {Promise<string>} - Ruta del video con overlay
     */
    async applyCardOverlay(videoPath, cardImagePath, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                logger.info(`[PlayerCardOverlay] Aplicando overlay de tarjeta al video...`);

                const ffmpeg = require('fluent-ffmpeg');
                const outputFilename = `video-with-card-${Date.now()}.mp4`;
                const outputPath = path.join(this.outputDir, outputFilename);

                // Configuración de overlay con animación slide-in
                const startTime = options.startTime || this.animation.startTime;
                const duration = options.duration || this.animation.duration;
                const slideInDuration = options.slideInDuration || this.animation.slideInDuration;

                // Posición final de la tarjeta (parte inferior izquierda)
                const finalX = this.cardPosition.x;
                const finalY = this.cardPosition.y;

                // Posición inicial (fuera de pantalla, izquierda)
                const initialX = -this.cardWidth;
                const initialY = finalY;

                // Filtro FFmpeg para overlay animado
                // Explicación:
                // - overlay=x=... : Posición X calculada dinámicamente
                // - if(between(t,START,END), ...) : Solo visible entre START y END
                // - Animación lineal desde initialX hasta finalX durante slideInDuration
                const overlayFilter =
                    `[0:v][1:v]overlay=` +
                    `x='if(between(t,${startTime},${startTime + slideInDuration}),` +
                    `${initialX}+((${finalX}-${initialX})*((t-${startTime})/${slideInDuration})),` +
                    `if(between(t,${startTime + slideInDuration},${startTime + duration}),${finalX},-${this.cardWidth}))':` +
                    `y=${finalY}:` +
                    `enable='between(t,${startTime},${startTime + duration})'`;

                ffmpeg()
                    .input(videoPath)
                    .input(cardImagePath)
                    .complexFilter([overlayFilter])
                    .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a copy'])
                    .on('start', commandLine => {
                        logger.info(`[PlayerCardOverlay] FFmpeg iniciado: ${commandLine}`);
                    })
                    .on('progress', progress => {
                        if (progress.percent) {
                            logger.info(
                                `[PlayerCardOverlay] Progreso: ${Math.round(progress.percent)}%`
                            );
                        }
                    })
                    .on('end', () => {
                        logger.info(`[PlayerCardOverlay] ✅ Overlay aplicado: ${outputPath}`);
                        resolve(outputPath);
                    })
                    .on('error', error => {
                        logger.error(`[PlayerCardOverlay] ❌ Error FFmpeg: ${error.message}`);
                        reject(error);
                    })
                    .save(outputPath);
            } catch (error) {
                logger.error(`[PlayerCardOverlay] Error aplicando overlay: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Genera y aplica tarjeta en un solo paso
     * @param {string} videoPath - Ruta del video
     * @param {object} playerData - Datos del jugador
     * @param {object} options - Opciones
     * @returns {Promise<string>} - Ruta del video con tarjeta
     */
    async generateAndApplyCard(videoPath, playerData, options = {}) {
        try {
            // 1. Generar imagen de la tarjeta
            const cardImagePath = await this.generateCardImage(playerData);

            // 2. Aplicar overlay al video
            const videoWithCard = await this.applyCardOverlay(videoPath, cardImagePath, options);

            // 3. Limpiar imagen temporal (opcional)
            if (options.cleanup !== false) {
                try {
                    fs.unlinkSync(cardImagePath);
                    logger.info(
                        `[PlayerCardOverlay] 🗑️  Imagen temporal eliminada: ${cardImagePath}`
                    );
                } catch (error) {
                    logger.warn(
                        `[PlayerCardOverlay] No se pudo eliminar imagen temporal: ${error.message}`
                    );
                }
            }

            return videoWithCard;
        } catch (error) {
            logger.error(`[PlayerCardOverlay] Error en generateAndApplyCard: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PlayerCardOverlay;
