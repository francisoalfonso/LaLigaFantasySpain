const axios = require('axios');
const logger = require('../../utils/logger');
const videoManager = require('../videoManager');
const BunnyStreamManager = require('../bunnyStreamManager');
const characterRefs = require('../../config/characterReferences');
const { ALL_ANA_IMAGES } = require('../../config/veo3/anaCharacter');
const VEO3ErrorAnalyzer = require('./veo3ErrorAnalyzer');
const VEO3RetryManager = require('./veo3RetryManager');
const { validateAndPrepare, updatePlayerSuccessRate } = require('../../utils/playerDictionaryValidator');

// Ana Character Bible - MANTENER PARA BACKWARD COMPATIBILITY
const ANA_CHARACTER_BIBLE =
    'A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy';

/**
 * Cliente para la API VEO3 de KIE.ai
 * Genera videos con múltiples reporters y contextos visuales
 */
class VEO3Client {
    constructor() {
        this.apiKey = process.env.KIE_AI_API_KEY;
        this.baseUrl = 'https://api.kie.ai/api/v1/veo';
        this.anaImageUrl = process.env.ANA_IMAGE_URL;
        this.characterSeed = parseInt(process.env.ANA_CHARACTER_SEED) || 30001;
        this.defaultModel = process.env.VEO3_DEFAULT_MODEL || 'veo3_fast';
        this.defaultAspect = process.env.VEO3_DEFAULT_ASPECT || '9:16';
        this.watermark = process.env.VEO3_WATERMARK || 'Fantasy La Liga Pro';
        this.requestDelay = parseInt(process.env.VEO3_REQUEST_DELAY) || 6000;
        this.timeout = parseInt(process.env.VEO3_TIMEOUT) || 300000;

        // Sistema de rotación de imágenes Ana
        this.anaImagePool = ALL_ANA_IMAGES;
        this.currentImageIndex = 0;
        this.imageRotationEnabled = process.env.VEO3_IMAGE_ROTATION !== 'false';

        // Inicializar Bunny.net Stream Manager
        this.bunnyStream = new BunnyStreamManager();

        // Inicializar VEO3ErrorAnalyzer
        this.errorAnalyzer = new VEO3ErrorAnalyzer();

        // Inicializar VEO3RetryManager (después de que 'this' esté completamente inicializado)
        // Se inicializa lazy en el primer uso para evitar dependencias circulares
        this._retryManager = null;

        // Referencias de personajes (nuevo sistema)
        this.characterReferences = {
            ana: characterRefs.ANA_REFERENCES,
            carlos: characterRefs.CARLOS_REFERENCES,
            lucia: characterRefs.LUCIA_REFERENCES,
            pablo: characterRefs.PABLO_REFERENCES
        };

        if (!this.apiKey) {
            throw new Error('KIE_AI_API_KEY no encontrada en variables de entorno');
        }

        if (!this.anaImageUrl) {
            logger.warn(
                '[VEO3Client] ANA_IMAGE_URL no encontrada, usando sistema multi-referencia'
            );
        }

        logger.info(`[VEO3Client] Sistema rotación imágenes Ana: ${this.imageRotationEnabled ? 'ACTIVO' : 'DESACTIVO'} (${this.anaImagePool.length} imágenes disponibles)`);
    }

    /**
     * Getter lazy para RetryManager
     * @returns {VEO3RetryManager}
     */
    get retryManager() {
        if (!this._retryManager) {
            this._retryManager = new VEO3RetryManager(this);
            logger.info('[VEO3Client] VEO3RetryManager inicializado');
        }
        return this._retryManager;
    }

    /**
     * Seleccionar imagen Ana para rotación
     * @param {string} strategy - Estrategia: 'random', 'sequential', 'specific'
     * @param {number} specificIndex - Índice específico (opcional)
     * @returns {string} URL de la imagen seleccionada
     */
    selectAnaImage(strategy = 'random', specificIndex = null) {
        if (!this.imageRotationEnabled) {
            return this.anaImageUrl;
        }

        let selectedUrl;

        if (specificIndex !== null && specificIndex >= 0 && specificIndex < this.anaImagePool.length) {
            selectedUrl = this.anaImagePool[specificIndex];
            logger.info(`[VEO3Client] Imagen Ana específica seleccionada: índice ${specificIndex}`);
        } else if (strategy === 'random') {
            const randomIndex = Math.floor(Math.random() * this.anaImagePool.length);
            selectedUrl = this.anaImagePool[randomIndex];
            logger.info(`[VEO3Client] Imagen Ana aleatoria seleccionada: índice ${randomIndex}/${this.anaImagePool.length}`);
        } else { // sequential
            selectedUrl = this.anaImagePool[this.currentImageIndex];
            this.currentImageIndex = (this.currentImageIndex + 1) % this.anaImagePool.length;
            logger.info(`[VEO3Client] Imagen Ana secuencial seleccionada: índice ${this.currentImageIndex - 1}/${this.anaImagePool.length}`);
        }

        return selectedUrl;
    }

    /**
     * Generar video con Ana Real
     * @param {string} prompt - Prompt para generación del video
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Respuesta de la API con taskId
     */
    async generateVideo(prompt, options = {}) {
        try {
            // Usar imagen específica si se proporciona, sino usar rotación
            let selectedImage;
            if (options.imageUrl) {
                // Imagen específica proporcionada - PRIORIDAD
                selectedImage = options.imageUrl;
                logger.info(`[VEO3Client] Usando imagen específica: ${selectedImage}`);
            } else {
                // Sistema de rotación automática
                const rotationStrategy = options.imageRotation || 'random';
                selectedImage = this.selectAnaImage(rotationStrategy, options.imageIndex);
            }

            const params = {
                prompt,
                imageUrls: [selectedImage],
                model: options.model || this.defaultModel,
                aspectRatio: options.aspectRatio || this.defaultAspect,
                seed: this.characterSeed, // CRÍTICO: SEED FIJO para Ana consistencia
                waterMark: options.waterMark || this.watermark,
                enableTranslation: options.enableTranslation !== false,
                enableFallback: options.enableFallback !== false,
                voice: {
                    locale: process.env.ANA_VOICE_LOCALE || 'es-ES',
                    gender: process.env.ANA_VOICE_GENDER || 'female',
                    style: process.env.ANA_VOICE_STYLE || 'professional'
                },
                // Forzar consistencia absoluta
                referenceImageWeight: 1.0, // Máximo peso a imagen referencia
                characterConsistency: true,
                ...options
            };

            logger.info(`[VEO3Client] Generando video con prompt: ${prompt.substring(0, 100)}...`);
            logger.info(`[VEO3Client] Imagen Ana: ${selectedImage.split('/').pop()}`);
            logger.info(
                `[VEO3Client] Usando modelo: ${params.model}, aspect: ${params.aspectRatio}`
            );

            const response = await axios.post(`${this.baseUrl}/generate`, params, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 segundos para request inicial
            });

            const result = response.data;

            if (result.code !== 200) {
                throw new Error(`Error API VEO3: ${result.msg}`);
            }

            logger.info(`[VEO3Client] Video iniciado, taskId: ${result.data.taskId}`);
            return result;
        } catch (error) {
            logger.error('[VEO3Client] Error generando video:', error.message);

            // Manejo específico de errores
            if (error.response?.status === 401) {
                throw new Error('API Key inválida para KIE.ai');
            } else if (error.response?.status === 429) {
                throw new Error('Rate limit excedido. Esperar antes de retry.');
            } else if (error.message.includes('content policies')) {
                throw new Error('Prompt violó políticas de contenido. Simplificar prompt.');
            }

            throw error;
        }
    }

    /**
     * Obtener estado de generación de video
     * @param {string} taskId - ID de la tarea de generación
     * @returns {Promise<object>} - Estado actual del video
     */
    async getStatus(taskId) {
        try {
            const response = await axios.get(`${this.baseUrl}/record-info?taskId=${taskId}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            return response.data;
        } catch (error) {
            logger.error(`[VEO3Client] Error obteniendo estado ${taskId}:`, error.message);
            throw error;
        }
    }

    /**
     * Esperar a que se complete la generación del video
     * @param {string} taskId - ID de la tarea
     * @param {number} timeout - Timeout en milisegundos (default: 5 min)
     * @param {string} prompt - Prompt original (opcional, para análisis de errores)
     * @returns {Promise<object>} - Resultado del video completado
     */
    async waitForCompletion(taskId, timeout = this.timeout, prompt = null) {
        const startTime = Date.now();
        let attempts = 0;

        logger.info(`[VEO3Client] Esperando completar video ${taskId} (timeout: ${timeout}ms)`);

        while (Date.now() - startTime < timeout) {
            attempts++;

            try {
                const status = await this.getStatus(taskId);

                // Video completado exitosamente
                if (status.data?.successFlag === 1) {
                    logger.info(
                        `[VEO3Client] Video completado en ${attempts} intentos (${Date.now() - startTime}ms)`
                    );

                    const veo3Url = status.data.response.resultUrls[0];
                    logger.info(`[VEO3Client] Descargando video de VEO3: ${veo3Url}`);

                    // NUEVA ESTRATEGIA: Subir directamente a Bunny.net Stream
                    try {
                        logger.info(`[VEO3Client] Subiendo video a Bunny.net Stream: ${veo3Url}`);

                        const bunnyData = await this.bunnyStream.uploadFromVeo3Url(veo3Url, {
                            taskId,
                            title: `Ana Real - Video ${new Date().toISOString().slice(0, 10)}`,
                            duration: status.data.response.duration,
                            cost: status.data.response.cost,
                            veo3OriginalUrl: veo3Url,
                            service: 'veo3',
                            type: 'veo3_generated',
                            seeds: status.data.response.seeds
                        });

                        logger.info(
                            `[VEO3Client] Video subido exitosamente a Bunny.net: ${bunnyData.directUrl}`
                        );

                        return {
                            taskId,
                            url: bunnyData.directUrl, // URL PERMANENTE de Bunny.net
                            bunnyId: bunnyData.id,
                            embedUrl: bunnyData.embedUrl,
                            thumbnailUrl: bunnyData.thumbnailUrl,
                            streamUrl: bunnyData.bunnyUrl,
                            originalUrl: veo3Url,
                            duration: status.data.response.duration,
                            cost: status.data.response.cost,
                            generatedAt: new Date(),
                            success: true,
                            platform: 'bunny',
                            videoId: bunnyData.id // ID de Bunny.net para futuras referencias
                        };
                    } catch (bunnyError) {
                        logger.error(
                            `[VEO3Client] Error subiendo a Bunny.net: ${bunnyError.message}`
                        );

                        // Fallback: Intentar descarga local como antes
                        try {
                            logger.info(`[VEO3Client] Fallback: intentando descarga local`);

                            const videoData = await videoManager.downloadAndStore(veo3Url, {
                                taskId,
                                duration: status.data.response.duration,
                                cost: status.data.response.cost,
                                veo3OriginalUrl: veo3Url,
                                service: 'veo3'
                            });

                            logger.info(
                                `[VEO3Client] Video almacenado localmente como fallback: ${videoData.publicUrl}`
                            );

                            return {
                                taskId,
                                url: videoData.publicUrl,
                                localPath: videoData.localPath,
                                originalUrl: veo3Url,
                                duration: status.data.response.duration,
                                cost: status.data.response.cost,
                                generatedAt: new Date(),
                                success: true,
                                platform: 'local',
                                videoId: videoData.id,
                                bunnyError: bunnyError.message
                            };
                        } catch (localError) {
                            logger.error(
                                `[VEO3Client] Ambos fallback fallaron: ${localError.message}`
                            );

                            // Último fallback: URL original (lo que teníamos antes)
                            logger.warn('[VEO3Client] Usando URL original como último recurso');
                            return {
                                taskId,
                                url: veo3Url,
                                duration: status.data.response.duration,
                                cost: status.data.response.cost,
                                generatedAt: new Date(),
                                success: true,
                                platform: 'external',
                                bunnyError: bunnyError.message,
                                localError: localError.message
                            };
                        }
                    }
                }

                // Video falló
                if (status.data?.successFlag >= 2) {
                    const errorMsg = status.data.errorMessage || 'Error desconocido en generación';
                    logger.error(`[VEO3Client] Video ${taskId} falló: ${errorMsg}`);
                    logger.error(
                        `[VEO3Client] Status completo:`,
                        JSON.stringify(status.data, null, 2)
                    );

                    // NUEVO: Analizar error con VEO3ErrorAnalyzer
                    if (prompt) {
                        const errorAnalysis = this.errorAnalyzer.analyzeError(status, prompt, taskId);

                        logger.warn('[VEO3Client] 🔍 Análisis de error automático:');
                        logger.warn(`   Error Category: ${errorAnalysis.errorCategory}`);
                        logger.warn(`   Triggers detectados: ${errorAnalysis.likelyTriggers.length}`);
                        logger.warn(`   Confianza análisis: ${(errorAnalysis.confidence * 100).toFixed(0)}%`);

                        if (errorAnalysis.suggestedFixes.length > 0) {
                            logger.warn('\n   💡 Fixes sugeridos:');
                            errorAnalysis.suggestedFixes.slice(0, 3).forEach((fix, i) => {
                                logger.warn(`   ${i + 1}. ${fix.strategy} (confianza: ${(fix.confidence * 100).toFixed(0)}%)`);
                                logger.warn(`      ${fix.description}`);
                            });
                        }

                        // Agregar análisis al error para retry manager
                        const enhancedError = new Error(`Generación falló: ${errorMsg}`);
                        enhancedError.analysis = errorAnalysis;
                        throw enhancedError;
                    }

                    throw new Error(`Generación falló: ${errorMsg}`);
                }

                // Aún procesando (successFlag: 0)
                logger.info(`[VEO3Client] Video ${taskId} aún procesando... (intento ${attempts})`);
            } catch (error) {
                logger.error(`[VEO3Client] Error comprobando estado:`, error.message);
                throw error;
            }

            // Esperar antes del siguiente check
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
        }

        throw new Error(`Timeout: Video ${taskId} no completó en ${timeout}ms`);
    }

    /**
     * Generar video completo con espera automática
     * @param {string} prompt - Prompt para el video
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Video completado
     */
    async generateCompleteVideo(prompt, options = {}) {
        try {
            // Iniciar generación
            const initResult = await this.generateVideo(prompt, options);

            // Esperar antes de empezar a comprobar estado (API delay)
            await new Promise(resolve => setTimeout(resolve, this.requestDelay));

            // Esperar completar
            const video = await this.waitForCompletion(initResult.data.taskId);

            logger.info(
                `[VEO3Client] Video completo: ${video.url} (${video.duration}s, $${video.cost})`
            );
            return video;
        } catch (error) {
            logger.error('[VEO3Client] Error generación completa:', error.message);
            throw error;
        }
    }

    /**
     * Crear prompt de Ana Real para chollos
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} options - Opciones adicionales
     * @returns {string} - Prompt optimizado
     */
    createCholloPrompt(playerName, price, options = {}) {
        const dialogue = `¡Misters! He descubierto algo sobre ${playerName}... ¡A ${price}€ es INCREÍBLE! ¡Preparaos para el chollo del SIGLO!`;
        const prompt = `The person in the reference image speaking in Spanish: "${dialogue}". Exact appearance from reference image.`;

        return prompt;
    }

    /**
     * Crear prompt de Ana Real para análisis de jugadores
     * @param {string} playerName - Nombre del jugador
     * @param {number} price - Precio del jugador
     * @param {object} stats - Estadísticas del jugador
     * @returns {string} - Prompt optimizado
     */
    createAnalysisPrompt(playerName, price, stats = {}) {
        const dialogue = `${playerName}... los números son ESPECTACULARES! ${price}€ por este nivel... ¡Es MATEMÁTICA pura!`;
        const prompt = `The person in the reference image speaking in Spanish: "${dialogue}". Exact appearance from reference image.`;

        return prompt;
    }

    /**
     * Generar múltiples videos y concatenarlos automáticamente
     * @param {Array} prompts - Array de prompts para generar
     * @param {object} options - Opciones para concatenación
     * @returns {Promise<object>} - Video concatenado final
     */
    async generateMultipleVideos(prompts, options = {}) {
        try {
            logger.info(`[VEO3Client] Generando ${prompts.length} videos para concatenar`);

            const videos = [];
            const videoIds = [];

            // Generar videos en paralelo (limitado por API)
            for (let i = 0; i < prompts.length; i++) {
                const prompt = prompts[i];
                logger.info(
                    `[VEO3Client] Generando video ${i + 1}/${prompts.length}: ${prompt.substring(0, 50)}...`
                );

                const video = await this.generateCompleteVideo(prompt, options);
                videos.push(video);
                videoIds.push(video.videoId);

                // Delay entre generaciones para evitar rate limiting
                if (i < prompts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.requestDelay));
                }
            }

            logger.info(`[VEO3Client] ${videos.length} videos generados, iniciando concatenación`);

            // Concatenar todos los videos
            const concatenatedVideo = await videoManager.concatenateVideos(videoIds, {
                title: options.title || 'Video concatenado VEO3',
                description: options.description || 'Videos de Ana Real concatenados',
                sourcePrompts: prompts,
                createdBy: 'VEO3Client',
                type: 'multi_segment'
            });

            logger.info(`[VEO3Client] Video final concatenado: ${concatenatedVideo.publicUrl}`);

            return {
                success: true,
                individualVideos: videos,
                concatenatedVideo: concatenatedVideo,
                totalVideos: videos.length,
                finalUrl: concatenatedVideo.publicUrl
            };
        } catch (error) {
            logger.error('[VEO3Client] Error generando videos múltiples:', error.message);
            throw error;
        }
    }

    /**
     * Descargar video desde URL de VEO3
     * @param {string} videoUrl - URL del video generado
     * @param {string} outputPath - Ruta donde guardar el video
     * @returns {Promise<void>}
     */
    async downloadVideo(videoUrl, outputPath) {
        const fs = require('fs');
        const path = require('path');

        try {
            logger.info(`[VEO3Client] Descargando video: ${videoUrl}`);

            const response = await axios({
                method: 'GET',
                url: videoUrl,
                responseType: 'stream',
                timeout: 120000 // 2 minutos para descarga
            });

            // Crear directorio si no existe
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Escribir stream a archivo
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logger.info(`[VEO3Client] ✅ Video descargado: ${outputPath}`);
                    resolve();
                });
                writer.on('error', error => {
                    logger.error(`[VEO3Client] ❌ Error descargando video:`, error.message);
                    reject(error);
                });
            });
        } catch (error) {
            logger.error('[VEO3Client] Error en downloadVideo:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estado de tarea (alias para compatibilidad)
     * @param {string} taskId - ID de la tarea
     * @returns {Promise<object>} - Estado formateado
     */
    async getTaskStatus(taskId) {
        try {
            const status = await this.getStatus(taskId);

            // Formatear respuesta para compatibilidad
            if (status.data?.successFlag === 1) {
                return {
                    state: 'SUCCEEDED',
                    progress: 100,
                    videoUrl: status.data.response.resultUrls[0]
                };
            } else if (status.data?.successFlag === 0) {
                return {
                    state: 'FAILED',
                    error: status.data.response?.error || 'Unknown error'
                };
            } else {
                // En progreso
                return {
                    state: 'PROCESSING',
                    progress: 50
                };
            }
        } catch (error) {
            logger.error(`[VEO3Client] Error en getTaskStatus:`, error.message);
            throw error;
        }
    }

    /**
     * Test de conectividad con la API
     * @returns {Promise<boolean>} - true si conexión OK
     */
    async testConnection() {
        try {
            const testPrompt = `The person in the reference image speaking in Spanish: "¡Hola Misters! Bienvenidos a Fantasy La Liga." Exact appearance from reference image.`;

            logger.info('[VEO3Client] Testando conexión con API...');
            const result = await this.generateVideo(testPrompt);

            if (result.code === 200 && result.data?.taskId) {
                logger.info('[VEO3Client] ✅ Conexión API exitosa');
                return true;
            } else {
                logger.info('[VEO3Client] ❌ Conexión API falló');
                return false;
            }
        } catch (error) {
            logger.error('[VEO3Client] ❌ Error testando conexión:', error.message);
            return false;
        }
    }

    /**
     * NUEVO: Generar video con contexto visual (multi-referencia)
     * @param {string} reporter - 'ana', 'carlos', 'lucia', 'pablo'
     * @param {string} contentType - 'chollo_viral', 'analisis_tactica', etc.
     * @param {string} prompt - Prompt del video
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Resultado de generación
     */
    async generateVideoWithContext(reporter, contentType, prompt, options = {}) {
        try {
            logger.info(`[VEO3Client] Generando video contextual: ${reporter} - ${contentType}`);

            // Obtener contexto de producción
            const context = characterRefs.getProductionContext(contentType);

            // Obtener referencias del reporter
            const reporterRefs = this.characterReferences[reporter.toLowerCase()];
            if (!reporterRefs) {
                throw new Error(`Reporter no encontrado: ${reporter}`);
            }

            // Seleccionar imágenes según contexto
            const contextImages = this.selectContextImages(reporterRefs, context);

            // Obtener seed del reporter
            const reporterSeed = reporterRefs.seed;

            logger.info(`[VEO3Client] Usando ${contextImages.length} imágenes de referencia`);
            logger.info(
                `[VEO3Client] Contexto: ${context.environment}, outfit: ${context.outfit}, mood: ${context.mood}`
            );

            // Generar video con referencias múltiples
            return await this.generateVideo(prompt, {
                imageUrls: contextImages,
                seed: reporterSeed,
                referenceImageWeight: options.referenceImageWeight || 0.9,
                ...options
            });
        } catch (error) {
            logger.error('[VEO3Client] Error generando video contextual:', error.message);
            throw error;
        }
    }

    /**
     * Seleccionar imágenes de referencia según contexto
     * @param {object} reporterRefs - Referencias del reporter
     * @param {object} context - Contexto de producción
     * @returns {Array<string>} - URLs de imágenes
     */
    selectContextImages(reporterRefs, context) {
        const images = [];

        // SIEMPRE incluir imagen base frontal (cara principal)
        images.push(reporterRefs.base.main);

        // Agregar outfit específico si existe
        const outfitKey = context.outfit;
        if (outfitKey && reporterRefs.outfits[outfitKey]) {
            images.push(reporterRefs.outfits[outfitKey]);
        }

        // Agregar ambiente específico si existe
        const envKey = context.environment;
        if (envKey && reporterRefs.environments[envKey]) {
            images.push(reporterRefs.environments[envKey]);
        }

        return images;
    }

    /**
     * Construir prompt completo con contexto cinematográfico
     * @param {string} reporter - Nombre del reporter
     * @param {string} contentType - Tipo de contenido
     * @param {string} dialogue - Diálogo a decir
     * @param {string} behavior - Descripción comportamiento
     * @param {string} cinematography - Descripción cámara
     * @returns {string} - Prompt completo
     */
    buildContextualPrompt(reporter, contentType, dialogue, behavior = '', cinematography = '') {
        const reporterRefs = this.characterReferences[reporter.toLowerCase()];
        const context = characterRefs.getProductionContext(contentType);

        // Character Bible del reporter
        const characterBible = reporterRefs.characterBible;

        // Descripciones de mood y cámara
        const lighting = characterRefs.getLightingDescription(context.mood);
        const cameraMovement = characterRefs.getCameraDescription(context.cameraStyle);

        // Construir prompt completo
        return `
            ${characterBible}

            Speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}"

            ${behavior ? `BEHAVIOR: ${behavior}` : ''}

            CINEMATOGRAPHY: ${cinematography || cameraMovement}

            LIGHTING: ${lighting}

            Exact facial features from reference images.
            Natural hand gestures for emphasis.
            Direct eye contact with camera.
        `.trim();
    }

    /**
     * ============================================
     * MÉTODOS CON RETRY AUTOMÁTICO (PRODUCCIÓN 24/7)
     * ============================================
     */

    /**
     * Generar video con retry automático inteligente
     * Método recomendado para producción 24/7
     *
     * @param {string} prompt - Prompt del video
     * @param {object} options - Opciones VEO3
     * @param {object} context - Contexto (playerName, team, etc.)
     * @returns {Promise<object>} - Video con metadata de retry
     */
    async generateVideoWithRetry(prompt, options = {}, context = {}) {
        return await this.retryManager.generateWithRetry(prompt, options, context);
    }

    /**
     * Generar múltiples segmentos con retry automático
     * Método recomendado para videos multi-segmento en producción
     *
     * @param {Array} segments - Array de {label, prompt, context}
     * @param {object} options - Opciones VEO3
     * @returns {Promise<Array>} - Array de resultados con metadata
     */
    async generateMultipleWithRetry(segments, options = {}) {
        return await this.retryManager.generateMultipleWithRetry(segments, options);
    }

    /**
     * Obtener estadísticas del retry manager
     */
    getRetryStats() {
        return this.retryManager.getStats();
    }
}

module.exports = VEO3Client;
