#!/usr/bin/env node

/**
 * Script para concatenar videos Ana Real en videos largos
 * Uso: node scripts/veo3/concatenate-videos.js [opciones]
 */

require('dotenv').config();
const fs = require('fs');
const logger = require('../../../../../../../utils/logger');
const path = require('path');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');

class ConcatenationScript {
    constructor() {
        this.concatenator = new VideoConcatenator();
        this.veo3Client = new VEO3Client();
        this.promptBuilder = new PromptBuilder();
        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
    }

    /**
     * Concatenar videos existentes
     * @param {Array} videoPaths - Array de rutas de videos
     * @param {object} options - Opciones de concatenación
     */
    async concatenateExistingVideos(videoPaths, options = {}) {
        try {
            logger.info(`[ConcatenationScript] Concatenando ${videoPaths.length} videos existentes...`);

            // Validar que todos los videos existen
            for (const videoPath of videoPaths) {
                if (!fs.existsSync(videoPath)) {
                    throw new Error(`Video no encontrado: ${videoPath}`);
                }
            }

            const startTime = Date.now();
            const resultPath = await this.concatenator.concatenateVideos(videoPaths, options);
            const processingTime = Date.now() - startTime;

            logger.info(`[ConcatenationScript] ✅ Videos concatenados exitosamente`);
            logger.info(`[ConcatenationScript] Video final: ${resultPath}`);
            logger.info(`[ConcatenationScript] Tiempo de procesamiento: ${(processingTime / 1000).toFixed(2)}s`);

            return resultPath;

        } catch (error) {
            logger.error(`[ConcatenationScript] Error concatenando videos:`, error.message);
            throw error;
        }
    }

    /**
     * Crear video largo generando segmentos automáticamente
     * @param {string} theme - Tema del contenido
     * @param {number} segmentCount - Número de segmentos a generar
     * @param {object} options - Opciones adicionales
     */
    async createLongVideoAutomatic(theme, segmentCount = 3, options = {}) {
        try {
            logger.info(`[ConcatenationScript] Creando video largo "${theme}" con ${segmentCount} segmentos...`);

            // Generar prompts basados en el tema
            const prompts = this.generateThemePrompts(theme, segmentCount);

            logger.info(`[ConcatenationScript] Prompts generados:`);
            prompts.forEach((prompt, i) => {
                logger.info(`  ${i + 1}. ${prompt.substring(0, 80)}...`);
            });

            const resultPath = await this.concatenator.createLongVideoFromPrompts(
                prompts,
                this.veo3Client,
                options
            );

            logger.info(`[ConcatenationScript] ✅ Video largo "${theme}" completado`);
            logger.info(`[ConcatenationScript] Video final: ${resultPath}`);

            return resultPath;

        } catch (error) {
            logger.error(`[ConcatenationScript] Error creando video largo:`, error.message);
            throw error;
        }
    }

    /**
     * Generar prompts basados en un tema
     * @param {string} theme - Tema del contenido
     * @param {number} count - Número de prompts a generar
     * @returns {Array} - Array de prompts
     */
    generateThemePrompts(theme, count) {
        const prompts = [];

        switch (theme.toLowerCase()) {
            case 'chollos':
                // Serie de chollos
                const players = ['Pedri', 'Bellingham', 'Lewandowski'];
                const prices = [8.5, 10.2, 9.5];

                for (let i = 0; i < Math.min(count, players.length); i++) {
                    prompts.push(this.promptBuilder.buildCholloPrompt(players[i], prices[i]));
                }
                break;

            case 'analysis':
                // Serie de análisis
                const analysisPlayers = ['Vinicius', 'Gavi', 'Morata'];
                const analysisPrices = [11.5, 7.0, 8.0];

                for (let i = 0; i < Math.min(count, analysisPlayers.length); i++) {
                    prompts.push(this.promptBuilder.buildAnalysisPrompt(analysisPlayers[i], analysisPrices[i]));
                }
                break;

            case 'predictions':
                // Serie de predicciones
                const predictions = [
                    'Barcelona dominará en casa',
                    'Real Madrid marcará más de 2 goles',
                    'Sevilla sorprenderá como visitante'
                ];

                for (let i = 0; i < Math.min(count, predictions.length); i++) {
                    prompts.push(this.promptBuilder.buildPredictionPrompt(i + 5, predictions[i]));
                }
                break;

            case 'jornada':
                // Preview completo de jornada
                prompts.push(this.promptBuilder.buildIntroPrompt({
                    dialogue: "¡Hola Misters! Bienvenidos al análisis completo de la jornada. Tenemos chollos increíbles."
                }));

                prompts.push(this.promptBuilder.buildCholloPrompt('Pedri', 8.5));

                prompts.push(this.promptBuilder.buildOutroPrompt({
                    dialogue: "¡Hasta la próxima, Misters! Recordad fichar a estos chollos antes del cierre."
                }));
                break;

            default:
                // Tema genérico
                for (let i = 0; i < count; i++) {
                    prompts.push(this.promptBuilder.buildIntroPrompt({
                        dialogue: `Segmento ${i + 1} de Fantasy La Liga. Análisis profesional para Misters.`
                    }));
                }
                break;
        }

        return prompts;
    }

    /**
     * Buscar videos Ana existentes
     * @returns {Array} - Array de rutas de videos
     */
    findAnaVideos() {
        try {
            if (!fs.existsSync(this.outputDir)) {
                return [];
            }

            return fs.readdirSync(this.outputDir)
                .filter(file => file.startsWith('ana-') && file.endsWith('.mp4') && !file.includes('concatenated'))
                .map(file => {
                    const filePath = path.join(this.outputDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        path: filePath,
                        name: file,
                        mtime: stats.mtime
                    };
                })
                .sort((a, b) => b.mtime - a.mtime)  // Más recientes primero
                .map(item => item.path);

        } catch (error) {
            logger.error('[ConcatenationScript] Error buscando videos:', error.message);
            return [];
        }
    }

    /**
     * Test básico de concatenación
     */
    async runTest() {
        try {
            logger.info('[ConcatenationScript] 🧪 Ejecutando test de concatenación...');

            // Buscar videos Ana existentes
            const anaVideos = this.findAnaVideos().slice(0, 2); // Tomar 2 más recientes

            if (anaVideos.length < 2) {
                logger.info('[ConcatenationScript] Insuficientes videos Ana. Generando videos para test...');

                // Generar 2 videos cortos para test
                const testPrompts = [
                    this.promptBuilder.buildIntroPrompt({
                        dialogue: "¡Hola Misters! Este es el primer segmento de test."
                    }),
                    this.promptBuilder.buildOutroPrompt({
                        dialogue: "¡Hasta la próxima! Este es el segundo segmento de test."
                    })
                ];

                const videoPaths = [];
                for (let i = 0; i < testPrompts.length; i++) {
                    logger.info(`[ConcatenationScript] Generando video test ${i + 1}/2...`);
                    const video = await this.veo3Client.generateCompleteVideo(testPrompts[i]);

                    // Descargar video
                    const segmentPath = path.join(this.outputDir, `ana-test-segment-${i + 1}-${Date.now()}.mp4`);
                    await this.downloadVideo(video.url, segmentPath);
                    videoPaths.push(segmentPath);
                }

                const resultPath = await this.concatenateExistingVideos(videoPaths, {
                    transition: { enabled: true, duration: 0.5 }
                });

                logger.info('[ConcatenationScript] ✅ Test completado con videos generados');
                return { success: true, outputVideo: resultPath, inputVideos: videoPaths };
            } else {
                // Usar videos existentes
                logger.info(`[ConcatenationScript] Usando ${anaVideos.length} videos existentes...`);
                anaVideos.forEach((video, i) => {
                    logger.info(`  ${i + 1}. ${path.basename(video)}`);
                });

                const resultPath = await this.concatenateExistingVideos(anaVideos, {
                    transition: { enabled: true, duration: 0.5 }
                });

                logger.info('[ConcatenationScript] ✅ Test completado con videos existentes');
                return { success: true, outputVideo: resultPath, inputVideos: anaVideos };
            }

        } catch (error) {
            logger.error('[ConcatenationScript] ❌ Test falló:', error.message);
            throw error;
        }
    }

    /**
     * Demo de video largo con tema específico
     * @param {string} theme - Tema del video
     */
    async runThemeDemo(theme = 'jornada') {
        try {
            logger.info(`[ConcatenationScript] 🎭 Ejecutando demo "${theme}"...`);

            const resultPath = await this.createLongVideoAutomatic(theme, 3, {
                transition: { enabled: true, duration: 0.5 }
            });

            logger.info(`[ConcatenationScript] ✅ Demo "${theme}" completado`);
            logger.info(`[ConcatenationScript] Video final: ${resultPath}`);

            return { success: true, theme, outputVideo: resultPath };

        } catch (error) {
            logger.error(`[ConcatenationScript] ❌ Demo "${theme}" falló:`, error.message);
            throw error;
        }
    }

    /**
     * Descargar video desde URL
     * @param {string} url - URL del video
     * @param {string} localPath - Ruta local
     * @returns {Promise<string>} - Ruta del archivo descargado
     */
    async downloadVideo(url, localPath) {
        try {
            const axios = require('axios');
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(localPath));
                writer.on('error', reject);
            });

        } catch (error) {
            logger.error('[ConcatenationScript] Error descargando video:', error.message);
            throw error;
        }
    }
}

// Función principal CLI
async function main() {
    const args = process.argv.slice(2);
    const script = new ConcatenationScript();

    try {
        if (args.includes('--test')) {
            // Test básico
            await script.runTest();
        } else if (args.includes('--theme')) {
            // Demo con tema específico
            const themeIndex = args.indexOf('--theme');
            const theme = themeIndex !== -1 ? args[themeIndex + 1] : 'jornada';
            await script.runThemeDemo(theme);
        } else if (args.includes('--concat')) {
            // Concatenar videos específicos
            const videoArgs = args.slice(args.indexOf('--concat') + 1);
            if (videoArgs.length < 2) {
                throw new Error('Se necesitan al menos 2 videos para concatenar');
            }
            await script.concatenateExistingVideos(videoArgs);
        } else {
            // Mostrar ayuda
            logger.info('🎬 Video Concatenator - Fantasy La Liga');
            logger.info('Uso:');
            logger.info('  --test                                    # Test básico');
            logger.info('  --theme [chollos|analysis|predictions|jornada]  # Demo temático');
            logger.info('  --concat video1.mp4 video2.mp4 [...]     # Concatenar videos específicos');
            logger.info('');
            logger.info('Ejemplos:');
            logger.info('  npm run veo3:test-concat                  # Test básico');
            logger.info('  node scripts/veo3/concatenate-videos.js --theme chollos');

            // Test por defecto
            await script.runTest();
        }

    } catch (error) {
        logger.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = ConcatenationScript;