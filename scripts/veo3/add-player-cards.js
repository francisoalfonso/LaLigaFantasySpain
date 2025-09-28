#!/usr/bin/env node

/**
 * Script para agregar player cards overlay a videos Ana Real
 * Uso: node scripts/veo3/add-player-cards.js [opciones]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const PlayerCardsOverlay = require('../../backend/services/veo3/playerCardsOverlay');

class PlayerCardsScript {
    constructor() {
        this.overlaySystem = new PlayerCardsOverlay();
        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
    }

    /**
     * Agregar tarjeta de jugador a video existente
     * @param {string} videoPath - Ruta del video
     * @param {object} playerData - Datos del jugador
     * @param {object} options - Opciones adicionales
     */
    async addSinglePlayerCard(videoPath, playerData, options = {}) {
        try {
            console.log(`[PlayerCardsScript] Agregando tarjeta de ${playerData.name}...`);

            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video no encontrado: ${videoPath}`);
            }

            const startTime = Date.now();
            const resultPath = await this.overlaySystem.addPlayerCardOverlay(videoPath, playerData, options);
            const processingTime = Date.now() - startTime;

            console.log(`[PlayerCardsScript] ✅ Tarjeta agregada exitosamente`);
            console.log(`[PlayerCardsScript] Video final: ${resultPath}`);
            console.log(`[PlayerCardsScript] Tiempo de procesamiento: ${(processingTime / 1000).toFixed(2)}s`);

            // Log de la operación
            this.overlaySystem.logOperation({
                type: 'single_overlay',
                success: true,
                inputVideo: videoPath,
                outputVideo: resultPath,
                playersCount: 1,
                processingTime
            });

            return resultPath;

        } catch (error) {
            console.error(`[PlayerCardsScript] Error agregando tarjeta:`, error.message);
            throw error;
        }
    }

    /**
     * Agregar múltiples tarjetas de jugadores
     * @param {string} videoPath - Ruta del video
     * @param {Array} playersData - Array de datos de jugadores
     * @param {object} options - Opciones adicionales
     */
    async addMultiplePlayerCards(videoPath, playersData, options = {}) {
        try {
            console.log(`[PlayerCardsScript] Agregando ${playersData.length} tarjetas...`);

            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video no encontrado: ${videoPath}`);
            }

            const startTime = Date.now();
            const resultPath = await this.overlaySystem.addMultiplePlayerCards(videoPath, playersData, options);
            const processingTime = Date.now() - startTime;

            console.log(`[PlayerCardsScript] ✅ ${playersData.length} tarjetas agregadas exitosamente`);
            console.log(`[PlayerCardsScript] Video final: ${resultPath}`);
            console.log(`[PlayerCardsScript] Tiempo de procesamiento: ${(processingTime / 1000).toFixed(2)}s`);

            // Log de la operación
            this.overlaySystem.logOperation({
                type: 'multiple_overlay',
                success: true,
                inputVideo: videoPath,
                outputVideo: resultPath,
                playersCount: playersData.length,
                processingTime
            });

            return resultPath;

        } catch (error) {
            console.error(`[PlayerCardsScript] Error agregando múltiples tarjetas:`, error.message);
            throw error;
        }
    }

    /**
     * Crear tarjeta de jugador desde datos de la API
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} additionalData - Datos adicionales
     * @returns {object} - Datos formateados para la tarjeta
     */
    createPlayerCardData(playerName, price, additionalData = {}) {
        return {
            name: playerName,
            team: additionalData.team || 'La Liga',
            position: additionalData.position || 'MID',
            price: price.toString(),
            rating: additionalData.rating || '7.5',
            form: additionalData.form || '3-2-1',
            photo: additionalData.photo || null
        };
    }

    /**
     * Encontrar último video Ana generado
     * @returns {string|null} - Ruta del último video o null
     */
    findLatestAnaVideo() {
        try {
            if (!fs.existsSync(this.outputDir)) {
                return null;
            }

            const files = fs.readdirSync(this.outputDir)
                .filter(file => file.startsWith('ana-') && file.endsWith('.mp4'))
                .map(file => {
                    const filePath = path.join(this.outputDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        path: filePath,
                        mtime: stats.mtime
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);

            return files.length > 0 ? files[0].path : null;

        } catch (error) {
            console.error('[PlayerCardsScript] Error buscando videos:', error.message);
            return null;
        }
    }

    /**
     * Test básico del sistema
     */
    async runTest() {
        try {
            console.log('[PlayerCardsScript] 🧪 Ejecutando test de player cards...');

            // Buscar último video Ana
            const latestVideo = this.findLatestAnaVideo();
            if (!latestVideo) {
                console.log('[PlayerCardsScript] No se encontraron videos Ana. Generando uno para test...');

                // Aquí podrías generar un video Ana para test
                throw new Error('No hay videos Ana disponibles para test. Ejecuta primero: npm run veo3:test-ana');
            }

            console.log(`[PlayerCardsScript] Usando video: ${path.basename(latestVideo)}`);

            // Datos de test
            const testPlayerData = this.createPlayerCardData('Pedri', 8.5, {
                team: 'Barcelona',
                position: 'MID',
                rating: '8.2',
                form: '5-4-3'
            });

            // Agregar tarjeta
            const resultPath = await this.addSinglePlayerCard(latestVideo, testPlayerData);

            console.log('[PlayerCardsScript] ✅ Test completado exitosamente');
            console.log(`[PlayerCardsScript] Video con tarjeta: ${resultPath}`);

            return {
                success: true,
                inputVideo: latestVideo,
                outputVideo: resultPath,
                playerData: testPlayerData
            };

        } catch (error) {
            console.error('[PlayerCardsScript] ❌ Test falló:', error.message);
            throw error;
        }
    }

    /**
     * Demo con múltiples jugadores
     */
    async runMultiDemo() {
        try {
            console.log('[PlayerCardsScript] 🎭 Ejecutando demo múltiples jugadores...');

            const latestVideo = this.findLatestAnaVideo();
            if (!latestVideo) {
                throw new Error('No hay videos Ana disponibles. Ejecuta primero: npm run veo3:test-ana');
            }

            // Datos de múltiples jugadores
            const playersData = [
                this.createPlayerCardData('Pedri', 8.5, {
                    team: 'Barcelona',
                    position: 'MID',
                    rating: '8.2',
                    form: '5-4-3'
                }),
                this.createPlayerCardData('Bellingham', 10.2, {
                    team: 'Real Madrid',
                    position: 'MID',
                    rating: '8.8',
                    form: '4-5-4'
                }),
                this.createPlayerCardData('Lewandowski', 9.5, {
                    team: 'Barcelona',
                    position: 'FWD',
                    rating: '8.0',
                    form: '3-4-2'
                })
            ];

            const resultPath = await this.addMultiplePlayerCards(latestVideo, playersData);

            console.log('[PlayerCardsScript] ✅ Demo múltiples jugadores completado');
            console.log(`[PlayerCardsScript] Video con múltiples tarjetas: ${resultPath}`);

            return {
                success: true,
                inputVideo: latestVideo,
                outputVideo: resultPath,
                playersCount: playersData.length
            };

        } catch (error) {
            console.error('[PlayerCardsScript] ❌ Demo falló:', error.message);
            throw error;
        }
    }
}

// Función principal CLI
async function main() {
    const args = process.argv.slice(2);
    const script = new PlayerCardsScript();

    try {
        if (args.includes('--test')) {
            // Test básico
            await script.runTest();
        } else if (args.includes('--multi-demo')) {
            // Demo con múltiples jugadores
            await script.runMultiDemo();
        } else if (args.includes('--add')) {
            // Agregar tarjeta específica
            const videoIndex = args.indexOf('--video');
            const playerIndex = args.indexOf('--player');
            const priceIndex = args.indexOf('--price');

            if (videoIndex === -1 || playerIndex === -1) {
                throw new Error('Usar: --add --video "path/video.mp4" --player "Nombre" [--price 8.5]');
            }

            const videoPath = args[videoIndex + 1];
            const playerName = args[playerIndex + 1];
            const price = priceIndex !== -1 ? parseFloat(args[priceIndex + 1]) : 8.0;

            const playerData = script.createPlayerCardData(playerName, price);
            await script.addSinglePlayerCard(videoPath, playerData);
        } else {
            // Mostrar ayuda
            console.log('🎬 Player Cards Overlay - Fantasy La Liga');
            console.log('Uso:');
            console.log('  --test                                    # Test básico');
            console.log('  --multi-demo                              # Demo múltiples jugadores');
            console.log('  --add --video "path" --player "Nombre" --price 8.5');
            console.log('');
            console.log('Ejemplos:');
            console.log('  npm run veo3:test-cards                   # Test básico');
            console.log('  node scripts/veo3/add-player-cards.js --multi-demo');

            // Test por defecto
            await script.runTest();
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = PlayerCardsScript;