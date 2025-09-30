#!/usr/bin/env node

/**
 * Script para generar videos de Ana Real usando VEO3
 * Uso: node scripts/veo3/generate-ana-video.js [opciones]
 */

require('dotenv').config();
const fs = require('fs');
const logger = require('../../../../../../../utils/logger');
const path = require('path');
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');

class AnaVideoGenerator {
    constructor() {
        this.veo3Client = new VEO3Client();
        this.promptBuilder = new PromptBuilder();
        this.outputDir = process.env.VEO3_OUTPUT_DIR || './output/veo3';
        this.logsDir = process.env.VEO3_LOGS_DIR || './logs/veo3';

        // Crear directorios si no existen
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.outputDir, this.logsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`[AnaVideoGenerator] Directorio creado: ${dir}`);
            }
        });
    }

    /**
     * Generar video de chollo Fantasy
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} options - Opciones adicionales
     */
    async generateCholloVideo(playerName, price, options = {}) {
        try {
            logger.info(`[AnaVideoGenerator] Generando video chollo: ${playerName} - ${price}€`);

            const prompt = this.promptBuilder.buildCholloPrompt(playerName, price, options);
            logger.info(`[AnaVideoGenerator] Prompt generado: ${prompt.substring(0, 100)}...`);

            const video = await this.veo3Client.generateCompleteVideo(prompt, options.veo3Options);

            const filename = `ana-chollo-${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp4`;
            const videoPath = await this.downloadVideo(video.url, filename);

            const result = {
                type: 'chollo',
                player: playerName,
                price,
                video: {
                    ...video,
                    localPath: videoPath,
                    filename
                },
                prompt,
                generatedAt: new Date().toISOString()
            };

            this.logGeneration(result);
            return result;

        } catch (error) {
            logger.error(`[AnaVideoGenerator] Error generando chollo ${playerName}:`, error.message);
            throw error;
        }
    }

    /**
     * Generar video de análisis de jugador
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} stats - Estadísticas del jugador
     * @param {object} options - Opciones adicionales
     */
    async generateAnalysisVideo(playerName, price, stats = {}, options = {}) {
        try {
            logger.info(`[AnaVideoGenerator] Generando video análisis: ${playerName}`);

            const prompt = this.promptBuilder.buildAnalysisPrompt(playerName, price, stats, options);
            const video = await this.veo3Client.generateCompleteVideo(prompt, options.veo3Options);

            const filename = `ana-analysis-${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp4`;
            const videoPath = await this.downloadVideo(video.url, filename);

            const result = {
                type: 'analysis',
                player: playerName,
                price,
                stats,
                video: {
                    ...video,
                    localPath: videoPath,
                    filename
                },
                prompt,
                generatedAt: new Date().toISOString()
            };

            this.logGeneration(result);
            return result;

        } catch (error) {
            logger.error(`[AnaVideoGenerator] Error generando análisis ${playerName}:`, error.message);
            throw error;
        }
    }

    /**
     * Generar video de predicciones de jornada
     * @param {number} gameweek - Número de jornada
     * @param {string} prediction - Predicción principal
     * @param {object} options - Opciones adicionales
     */
    async generatePredictionVideo(gameweek, prediction, options = {}) {
        try {
            logger.info(`[AnaVideoGenerator] Generando video predicción jornada ${gameweek}`);

            const prompt = this.promptBuilder.buildPredictionPrompt(gameweek, prediction, options);
            const video = await this.veo3Client.generateCompleteVideo(prompt, options.veo3Options);

            const filename = `ana-prediction-j${gameweek}-${Date.now()}.mp4`;
            const videoPath = await this.downloadVideo(video.url, filename);

            const result = {
                type: 'prediction',
                gameweek,
                prediction,
                video: {
                    ...video,
                    localPath: videoPath,
                    filename
                },
                prompt,
                generatedAt: new Date().toISOString()
            };

            this.logGeneration(result);
            return result;

        } catch (error) {
            logger.error(`[AnaVideoGenerator] Error generando predicción J${gameweek}:`, error.message);
            throw error;
        }
    }

    /**
     * Generar video personalizado con prompt directo
     * @param {string} prompt - Prompt personalizado
     * @param {object} options - Opciones adicionales
     */
    async generateCustomVideo(prompt, options = {}) {
        try {
            logger.info(`[AnaVideoGenerator] Generando video personalizado`);

            // Validar prompt
            const validation = this.promptBuilder.validatePrompt(prompt);
            if (!validation.valid) {
                throw new Error(`Prompt inválido: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                logger.warn(`[AnaVideoGenerator] Warnings: ${validation.warnings.join(', ')}`);
            }

            const video = await this.veo3Client.generateCompleteVideo(prompt, options.veo3Options);

            const filename = `ana-custom-${Date.now()}.mp4`;
            const videoPath = await this.downloadVideo(video.url, filename);

            const result = {
                type: 'custom',
                video: {
                    ...video,
                    localPath: videoPath,
                    filename
                },
                prompt,
                generatedAt: new Date().toISOString()
            };

            this.logGeneration(result);
            return result;

        } catch (error) {
            logger.error(`[AnaVideoGenerator] Error generando video personalizado:`, error.message);
            throw error;
        }
    }

    /**
     * Descargar video desde URL remota
     * @param {string} url - URL del video
     * @param {string} filename - Nombre del archivo
     * @returns {Promise<string>} - Ruta local del video descargado
     */
    async downloadVideo(url, filename) {
        try {
            const axios = require('axios');
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream'
            });

            const localPath = path.join(this.outputDir, filename);
            const writer = fs.createWriteStream(localPath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logger.info(`[AnaVideoGenerator] Video descargado: ${localPath}`);
                    resolve(localPath);
                });
                writer.on('error', reject);
            });

        } catch (error) {
            logger.error(`[AnaVideoGenerator] Error descargando video:`, error.message);
            throw error;
        }
    }

    /**
     * Log de generación para seguimiento
     * @param {object} result - Resultado de la generación
     */
    logGeneration(result) {
        const logPath = path.join(this.logsDir, 'ana-generation.log');
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: result.type,
            success: true,
            cost: result.video.cost,
            duration: result.video.duration,
            filename: result.video.filename,
            promptLength: result.prompt.length
        };

        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
        logger.info(`[AnaVideoGenerator] Log actualizado: ${logPath}`);
    }

    /**
     * Test básico de funcionamiento
     */
    async runTest() {
        try {
            logger.info('[AnaVideoGenerator] 🧪 Ejecutando test básico...');

            // Test de conectividad
            const connected = await this.veo3Client.testConnection();
            if (!connected) {
                throw new Error('Test de conectividad falló');
            }

            // Test de generación simple
            const testPrompt = this.promptBuilder.buildIntroPrompt({
                dialogue: "¡Hola Misters! Este es un test de Fantasy La Liga con Ana Real."
            });

            logger.info('[AnaVideoGenerator] Generando video de test...');
            const video = await this.veo3Client.generateCompleteVideo(testPrompt);

            const filename = `ana-test-${Date.now()}.mp4`;
            const videoPath = await this.downloadVideo(video.url, filename);

            logger.info('[AnaVideoGenerator] ✅ Test completado exitosamente');
            logger.info(`[AnaVideoGenerator] Video test guardado: ${videoPath}`);
            logger.info(`[AnaVideoGenerator] Duración: ${video.duration}s, Coste: $${video.cost}`);

            return {
                success: true,
                video: {
                    ...video,
                    localPath: videoPath,
                    filename
                }
            };

        } catch (error) {
            logger.error('[AnaVideoGenerator] ❌ Test falló:', error.message);
            throw error;
        }
    }
}

// Función principal CLI
async function main() {
    const args = process.argv.slice(2);
    const generator = new AnaVideoGenerator();

    try {
        if (args.includes('--test')) {
            // Modo test
            await generator.runTest();
        } else if (args.includes('--chollo')) {
            // Modo chollo
            const playerIndex = args.indexOf('--player');
            const priceIndex = args.indexOf('--price');

            if (playerIndex === -1 || priceIndex === -1) {
                throw new Error('Usar: --chollo --player "Nombre" --price 8.5');
            }

            const playerName = args[playerIndex + 1];
            const price = parseFloat(args[priceIndex + 1]);

            await generator.generateCholloVideo(playerName, price);
        } else if (args.includes('--analysis')) {
            // Modo análisis
            const playerIndex = args.indexOf('--player');
            const priceIndex = args.indexOf('--price');

            if (playerIndex === -1 || priceIndex === -1) {
                throw new Error('Usar: --analysis --player "Nombre" --price 8.5');
            }

            const playerName = args[playerIndex + 1];
            const price = parseFloat(args[priceIndex + 1]);

            await generator.generateAnalysisVideo(playerName, price);
        } else if (args.includes('--prediction')) {
            // Modo predicción
            const gameweekIndex = args.indexOf('--gameweek');
            const predictionIndex = args.indexOf('--prediction');

            if (gameweekIndex === -1 || predictionIndex === -1) {
                throw new Error('Usar: --prediction --gameweek 5 --prediction "Texto"');
            }

            const gameweek = parseInt(args[gameweekIndex + 1]);
            const prediction = args[predictionIndex + 1];

            await generator.generatePredictionVideo(gameweek, prediction);
        } else {
            // Modo interactivo por defecto
            logger.info('🎬 Ana Video Generator - Fantasy La Liga');
            logger.info('Uso:');
            logger.info('  --test                              # Test básico');
            logger.info('  --chollo --player "Nombre" --price 8.5');
            logger.info('  --analysis --player "Nombre" --price 8.5');
            logger.info('  --prediction --gameweek 5 --prediction "Texto"');

            // Test por defecto
            await generator.runTest();
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

module.exports = AnaVideoGenerator;