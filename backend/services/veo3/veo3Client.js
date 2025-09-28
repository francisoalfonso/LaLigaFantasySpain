const axios = require('axios');
const videoManager = require('../videoManager');
const BunnyStreamManager = require('../bunnyStreamManager');

// Ana Character Bible - NUNCA CAMBIAR PARA MANTENER CONSISTENCIA
const ANA_CHARACTER_BIBLE = "A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy";

/**
 * Cliente para la API VEO3 de KIE.ai
 * Genera videos de Ana Real con consistencia perfecta
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

        // Inicializar Bunny.net Stream Manager
        this.bunnyStream = new BunnyStreamManager();

        if (!this.apiKey) {
            throw new Error('KIE_AI_API_KEY no encontrada en variables de entorno');
        }

        if (!this.anaImageUrl) {
            throw new Error('ANA_IMAGE_URL no encontrada en variables de entorno');
        }
    }

    /**
     * Generar video con Ana Real
     * @param {string} prompt - Prompt para generación del video
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Respuesta de la API con taskId
     */
    async generateVideo(prompt, options = {}) {
        try {
            const params = {
                prompt,
                imageUrls: [this.anaImageUrl],
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

            console.log(`[VEO3Client] Generando video con prompt: ${prompt.substring(0, 100)}...`);
            console.log(`[VEO3Client] Usando modelo: ${params.model}, aspect: ${params.aspectRatio}`);

            const response = await axios.post(`${this.baseUrl}/generate`, params, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 segundos para request inicial
            });

            const result = response.data;

            if (result.code !== 200) {
                throw new Error(`Error API VEO3: ${result.msg}`);
            }

            console.log(`[VEO3Client] Video iniciado, taskId: ${result.data.taskId}`);
            return result;

        } catch (error) {
            console.error('[VEO3Client] Error generando video:', error.message);

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
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            return response.data;

        } catch (error) {
            console.error(`[VEO3Client] Error obteniendo estado ${taskId}:`, error.message);
            throw error;
        }
    }

    /**
     * Esperar a que se complete la generación del video
     * @param {string} taskId - ID de la tarea
     * @param {number} timeout - Timeout en milisegundos (default: 5 min)
     * @returns {Promise<object>} - Resultado del video completado
     */
    async waitForCompletion(taskId, timeout = this.timeout) {
        const startTime = Date.now();
        let attempts = 0;

        console.log(`[VEO3Client] Esperando completar video ${taskId} (timeout: ${timeout}ms)`);

        while (Date.now() - startTime < timeout) {
            attempts++;

            try {
                const status = await this.getStatus(taskId);

                // Video completado exitosamente
                if (status.data?.successFlag === 1) {
                    console.log(`[VEO3Client] Video completado en ${attempts} intentos (${Date.now() - startTime}ms)`);

                    const veo3Url = status.data.response.resultUrls[0];
                    console.log(`[VEO3Client] Descargando video de VEO3: ${veo3Url}`);

                    // NUEVA ESTRATEGIA: Subir directamente a Bunny.net Stream
                    try {
                        console.log(`[VEO3Client] Subiendo video a Bunny.net Stream: ${veo3Url}`);

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

                        console.log(`[VEO3Client] Video subido exitosamente a Bunny.net: ${bunnyData.directUrl}`);

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
                        console.error(`[VEO3Client] Error subiendo a Bunny.net: ${bunnyError.message}`);

                        // Fallback: Intentar descarga local como antes
                        try {
                            console.log(`[VEO3Client] Fallback: intentando descarga local`);

                            const videoData = await videoManager.downloadAndStore(veo3Url, {
                                taskId,
                                duration: status.data.response.duration,
                                cost: status.data.response.cost,
                                veo3OriginalUrl: veo3Url,
                                service: 'veo3'
                            });

                            console.log(`[VEO3Client] Video almacenado localmente como fallback: ${videoData.publicUrl}`);

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
                            console.error(`[VEO3Client] Ambos fallback fallaron: ${localError.message}`);

                            // Último fallback: URL original (lo que teníamos antes)
                            console.warn('[VEO3Client] Usando URL original como último recurso');
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
                    console.error(`[VEO3Client] Video ${taskId} falló: ${errorMsg}`);
                    throw new Error(`Generación falló: ${errorMsg}`);
                }

                // Aún procesando (successFlag: 0)
                console.log(`[VEO3Client] Video ${taskId} aún procesando... (intento ${attempts})`);

            } catch (error) {
                console.error(`[VEO3Client] Error comprobando estado:`, error.message);
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

            console.log(`[VEO3Client] Video completo: ${video.url} (${video.duration}s, $${video.cost})`);
            return video;

        } catch (error) {
            console.error('[VEO3Client] Error generación completa:', error.message);
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
            console.log(`[VEO3Client] Generando ${prompts.length} videos para concatenar`);

            const videos = [];
            const videoIds = [];

            // Generar videos en paralelo (limitado por API)
            for (let i = 0; i < prompts.length; i++) {
                const prompt = prompts[i];
                console.log(`[VEO3Client] Generando video ${i + 1}/${prompts.length}: ${prompt.substring(0, 50)}...`);

                const video = await this.generateCompleteVideo(prompt, options);
                videos.push(video);
                videoIds.push(video.videoId);

                // Delay entre generaciones para evitar rate limiting
                if (i < prompts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.requestDelay));
                }
            }

            console.log(`[VEO3Client] ${videos.length} videos generados, iniciando concatenación`);

            // Concatenar todos los videos
            const concatenatedVideo = await videoManager.concatenateVideos(videoIds, {
                title: options.title || 'Video concatenado VEO3',
                description: options.description || 'Videos de Ana Real concatenados',
                sourcePrompts: prompts,
                createdBy: 'VEO3Client',
                type: 'multi_segment'
            });

            console.log(`[VEO3Client] Video final concatenado: ${concatenatedVideo.publicUrl}`);

            return {
                success: true,
                individualVideos: videos,
                concatenatedVideo: concatenatedVideo,
                totalVideos: videos.length,
                finalUrl: concatenatedVideo.publicUrl
            };

        } catch (error) {
            console.error('[VEO3Client] Error generando videos múltiples:', error.message);
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

            console.log('[VEO3Client] Testando conexión con API...');
            const result = await this.generateVideo(testPrompt);

            if (result.code === 200 && result.data?.taskId) {
                console.log('[VEO3Client] ✅ Conexión API exitosa');
                return true;
            } else {
                console.log('[VEO3Client] ❌ Conexión API falló');
                return false;
            }

        } catch (error) {
            console.error('[VEO3Client] ❌ Error testando conexión:', error.message);
            return false;
        }
    }
}

module.exports = VEO3Client;