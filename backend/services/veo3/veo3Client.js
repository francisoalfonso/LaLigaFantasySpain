const axios = require('axios');
const logger = require('../../utils/logger');
const videoManager = require('../videoManager');
const characterRefs = require('../../config/characterReferences');
const { ANA_IMAGE_URL } = require('../../config/veo3/anaCharacter');
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
        this.anaImageUrl = process.env.ANA_IMAGE_URL || ANA_IMAGE_URL;
        this.characterSeed = parseInt(process.env.ANA_CHARACTER_SEED) || 30001;
        this.defaultModel = process.env.VEO3_DEFAULT_MODEL || 'veo3_fast';
        this.defaultAspect = process.env.VEO3_DEFAULT_ASPECT || '9:16';
        this.watermark = process.env.VEO3_WATERMARK || 'Fantasy La Liga Pro';
        this.requestDelay = parseInt(process.env.VEO3_REQUEST_DELAY) || 15000;
        this.coolingPeriod = parseInt(process.env.VEO3_COOLING_PERIOD) || 30000;
        this.timeout = parseInt(process.env.VEO3_TIMEOUT) || 300000;

        // Sistema de Reintentos Inteligentes (4 Oct 2025)
        this.maxRetries = parseInt(process.env.VEO3_MAX_RETRIES) || 3;
        this.retryBackoffBase = parseInt(process.env.VEO3_RETRY_BACKOFF_BASE) || 120000; // 2 min
        this.retryBackoffMultiplier = parseInt(process.env.VEO3_RETRY_BACKOFF_MULTIPLIER) || 2;

        // Sistema de rotación de imágenes Ana
        // ✅ POOL CON SOLO 1 IMAGEN para desarrollo (agregar más en futuro para activar rotación)
        // ✅ FIX: Usar this.anaImageUrl (que respeta .env) en lugar de ANA_IMAGE_URL (constante hardcodeada)
        this.anaImagePool = [this.anaImageUrl]; // Solo ana-estudio-pelo-suelto.jpg por ahora
        this.currentImageIndex = 0;
        this.imageRotationEnabled = process.env.VEO3_IMAGE_ROTATION !== 'false';

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

        logger.info(`[VEO3Client] Sistema rotación imágenes Ana: ${this.imageRotationEnabled ? 'ACTIVO' : 'DESACTIVO'} (${this.anaImagePool.length} imágenes en pool)`);
        if (this.anaImagePool.length === 1) {
            logger.info(`[VEO3Client] ✅ Pool con 1 sola imagen (desarrollo): ${this.anaImagePool[0]}`);
        }
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
            // ✅ FIX (6 Oct 2025): Respetar useImageReference: false
            let selectedImage;

            if (options.useImageReference === false) {
                // NO usar imagen - solo descripción textual en prompt
                selectedImage = null;
                logger.info(`[VEO3Client] ✅ useImageReference=false - SIN imagen URL (solo descripción)`);
            } else if (options.imageUrl) {
                // Imagen específica proporcionada - PRIORIDAD
                selectedImage = options.imageUrl;
                logger.info(`[VEO3Client] Usando imagen específica: ${selectedImage}`);
            } else {
                // Sistema de rotación automática
                const rotationStrategy = options.imageRotation || 'random';
                selectedImage = this.selectAnaImage(rotationStrategy, options.imageIndex);
            }

            // ✅ PARÁMETROS OFICIALES KIE.ai VEO3 API
            // Fuente: docs/KIE_AI_VEO3_API_OFICIAL.md
            // ⚠️ IMPORTANTE: voice, referenceImageWeight, characterConsistency NO EXISTEN
            const params = {
                prompt,
                model: options.model || this.defaultModel,
                aspectRatio: options.aspectRatio || this.defaultAspect,
                seeds: this.characterSeed, // ✅ NOTA: API usa "seeds" (plural)
                watermark: options.watermark || this.watermark, // ✅ NOTA: "watermark" no "waterMark"
                enableTranslation: false, // ✅ FIX (10 Oct 2025): NUNCA traducir - elimina "speaks in Spanish from Spain"
                enableFallback: options.enableFallback !== false
                // ❌ ELIMINADOS parámetros no soportados:
                // - voice: NO existe en API
                // - referenceImageWeight: NO existe en API
                // - characterConsistency: NO existe en API
                // Control de idioma/acento se hace vía TEXTO DEL PROMPT (ver NORMA #3)
                // ⚠️ IMPORTANTE: enableTranslation=true causa que KIE.ai "traduzca" el prompt,
                //    eliminando la instrucción "speaks in Spanish from Spain" → audio en INGLÉS
            };

            // ✅ Solo agregar imageUrls si hay imagen
            if (selectedImage) {
                params.imageUrls = [selectedImage];
            }

            logger.info(`[VEO3Client] Generando video con prompt: ${prompt.substring(0, 100)}...`);
            logger.info(`[VEO3Client] Imagen Ana: ${selectedImage ? selectedImage.split('/').pop() : 'NINGUNA (solo descripción)'}`);
            logger.info(
                `[VEO3Client] Usando modelo: ${params.model}, aspect: ${params.aspectRatio}`
            );

            const response = await axios.post(`${this.baseUrl}/generate`, params, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000, // 120 segundos (2 min) para request inicial
                validateStatus: (status) => status < 500, // Aceptar 4xx para mejor manejo errores
                maxRedirects: 5
            });

            const result = response.data;

            // ⚠️ DEBUG TEMPORAL: Usar console.log para ver estructura completa
            console.log('[VEO3Client] 🔍 DEBUG - Respuesta VEO3:', JSON.stringify(result, null, 2));
            console.log('[VEO3Client] 🔍 DEBUG - result.code:', result.code);
            console.log('[VEO3Client] 🔍 DEBUG - result.data:', result.data);
            console.log('[VEO3Client] 🔍 DEBUG - result.data?.taskId:', result.data?.taskId);

            if (result.code !== 200) {
                logger.error(`[VEO3Client] ❌ Error API - code: ${result.code}, msg: ${result.msg}`);
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
            logger.info(`[VEO3Client] 🔍 Consultando estado para taskId: ${taskId}`);
            const response = await axios.get(`${this.baseUrl}/record-info?taskId=${taskId}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 45000, // 45 segundos para status check (aumentado)
                validateStatus: (status) => status < 500,
                maxRedirects: 5
            });

            logger.info(`[VEO3Client] ✅ Respuesta recibida. Status code: ${response.status}`);
            logger.info(`[VEO3Client] 📦 Response data structure:`, Object.keys(response.data));

            return response.data;
        } catch (error) {
            logger.error(`[VEO3Client] ❌ Error obteniendo estado ${taskId}:`, error.message);
            if (error.response) {
                logger.error(`[VEO3Client] ❌ Response status: ${error.response.status}`);
                logger.error(`[VEO3Client] ❌ Response data:`, JSON.stringify(error.response.data, null, 2));
            }
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

                // 🔍 DEBUG: Log completo de la respuesta para investigar error
                logger.info(`[VEO3Client] 🔍 Status attempt ${attempts} para ${taskId}:`);
                logger.info(`[VEO3Client]    successFlag: ${status.data?.successFlag}`);
                logger.info(`[VEO3Client]    taskStatus: ${status.data?.taskStatus}`);
                logger.info(`[VEO3Client]    Respuesta completa:\n${JSON.stringify(status.data, null, 2)}`);

                // Video completado exitosamente
                if (status.data?.successFlag === 1) {
                    logger.info(
                        `[VEO3Client] Video completado en ${attempts} intentos (${Date.now() - startTime}ms)`
                    );

                    // ✅ FIX CORRECTO (4 Oct 2025): Los campos están en status.data.response cuando successFlag=1
                    // El objeto "response" es null cuando successFlag=0 (procesando)
                    // El objeto "response" se popula cuando successFlag=1 (completado)
                    const veo3Url = status.data.response.resultUrls[0];
                    logger.info(`[VEO3Client] ✅ Video VEO3 disponible: ${veo3Url}`);
                    logger.info(`[VEO3Client] ✅ Usando URL VEO3 directa (sin Bunny.net)`);

                    // 🔧 FIX: La API no provee duration/cost en response, calcular estimados
                    const estimatedDuration = parseInt(process.env.VEO3_MAX_DURATION) || 7; // Duración típica VEO3 (máx 7s para evitar caras raras)
                    const estimatedCost = 0.30; // Costo típico por video VEO3

                    return {
                        taskId,
                        url: veo3Url, // ✅ URL VEO3 directa - pública y con CDN
                        originalUrl: veo3Url,
                        resultUrls: status.data.response.resultUrls, // ✅ Array completo de URLs
                        duration: estimatedDuration, // 🔧 Estimado (API no provee)
                        cost: estimatedCost, // 🔧 Estimado (API no provee)
                        generatedAt: new Date(),
                        success: true,
                        platform: 'veo3',
                        seeds: status.data.response.seeds
                    };
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
     * ⚠️ LEGACY - NO SE USA EN FLUJO ACTUAL
     * Este método es legacy. El flujo actual usa:
     *   ThreeSegmentGenerator → UnifiedScriptGenerator → PromptBuilder.buildPrompt()
     *
     * Crear prompt de Ana Real para chollos
     * @deprecated Usar PromptBuilder.buildPrompt() en su lugar
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
     * ⚠️ LEGACY - NO SE USA EN FLUJO ACTUAL
     * Este método es legacy. El flujo actual usa:
     *   ThreeSegmentGenerator → UnifiedScriptGenerator → PromptBuilder.buildPrompt()
     *
     * Crear prompt de Ana Real para análisis de jugadores
     * @deprecated Usar PromptBuilder.buildPrompt() en su lugar
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
     * ✅ OPTIMIZADO: Usa sistema de reintentos + cooling periods (4 Oct 2025)
     *
     * @param {Array} prompts - Array de prompts para generar
     * @param {object} options - Opciones para concatenación
     * @returns {Promise<object>} - Video concatenado final
     */
    async generateMultipleVideos(prompts, options = {}) {
        try {
            logger.info(`[VEO3Client] 🎬 Generando ${prompts.length} videos con sistema optimizado (retry + cooling periods)`);

            const videos = [];
            const videoIds = [];
            const startTime = Date.now();

            // Generar videos SECUENCIALMENTE con cooling periods
            for (let i = 0; i < prompts.length; i++) {
                const prompt = prompts[i];
                logger.info(
                    `[VEO3Client] 📹 Segmento ${i + 1}/${prompts.length}: ${prompt.substring(0, 50)}...`
                );

                const segmentStartTime = Date.now();

                // ✅ NUEVO: Usar generateVideoWithRetry en lugar de generateCompleteVideo
                const video = await this.generateVideoWithRetry(prompt, options, {
                    segmentIndex: i + 1,
                    totalSegments: prompts.length
                });

                videos.push(video);
                videoIds.push(video.videoId);

                const segmentDuration = Date.now() - segmentStartTime;
                logger.info(`[VEO3Client] ✅ Segmento ${i + 1} completado en ${(segmentDuration / 1000).toFixed(1)}s`);

                // ✅ COOLING PERIOD: Esperar después de cada segmento exitoso (excepto el último)
                if (i < prompts.length - 1) {
                    logger.info(`[VEO3Client] ❄️ Aplicando cooling period: ${this.coolingPeriod}ms (${this.coolingPeriod / 1000}s)`);
                    await new Promise(resolve => setTimeout(resolve, this.coolingPeriod));
                }
            }

            const totalDuration = Date.now() - startTime;
            logger.info(`[VEO3Client] 🎉 ${videos.length} videos generados exitosamente en ${(totalDuration / 1000 / 60).toFixed(1)} minutos`);

            // Concatenar todos los videos
            logger.info(`[VEO3Client] 🔗 Iniciando concatenación de ${videos.length} segmentos`);
            const concatenatedVideo = await videoManager.concatenateVideos(videoIds, {
                title: options.title || 'Video concatenado VEO3',
                description: options.description || 'Videos de Ana Real concatenados',
                sourcePrompts: prompts,
                createdBy: 'VEO3Client',
                type: 'multi_segment'
            });

            logger.info(`[VEO3Client] ✅ Video final concatenado: ${concatenatedVideo.publicUrl}`);

            return {
                success: true,
                individualVideos: videos,
                concatenatedVideo: concatenatedVideo,
                totalVideos: videos.length,
                finalUrl: concatenatedVideo.publicUrl,
                totalDurationMs: totalDuration,
                averageTimePerSegment: totalDuration / videos.length
            };
        } catch (error) {
            logger.error('[VEO3Client] ❌ Error generando videos múltiples:', error.message);
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

    /**
     * Generar video con Image-to-Video para continuidad frame-to-frame
     *
     * Usa el último frame del video anterior como primer frame del nuevo
     * Garantiza continuidad visual perfecta entre segmentos
     *
     * @param {string} prompt - Prompt para el video
     * @param {string} previousVideoPath - Ruta al video anterior (null si es el primero)
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Video generado con continuidad
     */
    async generateWithContinuity(prompt, previousVideoPath, options = {}) {
        const frameExtractor = require('./frameExtractor');

        logger.info(`[VEO3Client] Generando video con continuidad frame-to-frame`);

        let imageUrl = options.imageUrl;

        // Si hay video anterior, extraer último frame
        if (previousVideoPath) {
            logger.info(`[VEO3Client] Extrayendo último frame de: ${previousVideoPath}`);

            try {
                const lastFrame = await frameExtractor.extractLastFrame(previousVideoPath);
                imageUrl = lastFrame;

                logger.info(`[VEO3Client] ✅ Usando último frame como imagen inicial: ${lastFrame}`);
            } catch (error) {
                logger.warn(`[VEO3Client] ⚠️ Error extrayendo frame, usando imagen default`);
                // Fallback a imagen Ana por defecto
                imageUrl = options.imageUrl || process.env.ANA_IMAGE_URL;
            }
        }

        // Generar video con imagen continuidad
        return this.generateVideoWithRetry(prompt, {
            ...options,
            imageUrl, // Usar frame extraído o imagen default
            // Mantener seed fijo para consistencia Ana
            seed: this.characterSeed
        });
    }
}

module.exports = VEO3Client;
