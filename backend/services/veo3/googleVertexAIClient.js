/**
 * Google Vertex AI VEO3 Client
 *
 * Cliente alternativo usando la API oficial de Google Vertex AI
 * para generación de videos con VEO3.
 *
 * Documentación: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation
 *
 * Diferencias vs KIE.ai:
 * - API oficial de Google (más estable)
 * - Autenticación vía Service Account
 * - Pricing directo de Google Cloud
 * - Mayor control sobre parámetros
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class GoogleVertexAIClient {
    constructor() {
        // Configuración Google Cloud
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        this.apiKey = process.env.GOOGLE_VERTEX_AI_KEY; // API Key directa

        // Endpoint Vertex AI con API key
        this.apiEndpoint = `https://${this.location}-aiplatform.googleapis.com`;

        // Configuración VEO3
        this.model = 'imagegeneration@006'; // Modelo Imagen (VEO aún no disponible públicamente)
        this.defaultDuration = 8; // Segundos
        this.defaultAspectRatio = '9:16'; // Vertical para redes sociales

        // Ana Character
        this.anaImageUrl = process.env.ANA_IMAGE_URL;
        this.characterSeed = parseInt(process.env.ANA_CHARACTER_SEED) || 30001;

        // Rate limiting
        this.requestDelay = 6000; // 6 segundos entre requests
        this.lastRequestTime = 0;
    }

    /**
     * Validar configuración
     */
    validateConfig() {
        if (!this.apiKey) {
            throw new Error('GOOGLE_VERTEX_AI_KEY no configurada en .env');
        }
        if (!this.projectId) {
            throw new Error('GOOGLE_CLOUD_PROJECT_ID no configurado en .env');
        }
        return true;
    }

    /**
     * Generar video con Google Vertex AI VEO3
     */
    async generateVideo(options) {
        const {
            prompt,
            referenceImageUrl = this.anaImageUrl,
            duration = this.defaultDuration,
            aspectRatio = this.defaultAspectRatio,
            seed = this.characterSeed
        } = options;

        // Validar configuración
        this.validateConfig();

        // Rate limiting
        await this.respectRateLimit();

        try {
            // Endpoint de predicción con API key
            const endpoint = `${this.apiEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:predict`;

            // Request body según documentación Google
            const requestBody = {
                instances: [
                    {
                        prompt: prompt,
                        image: {
                            bytesBase64Encoded: referenceImageUrl // O gcsUri si usas GCS
                        }
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: aspectRatio,
                    seed: seed,
                    safetySetting: "block_some",
                    personGeneration: "allow_adult"
                }
            };

            logger.info('[Google Vertex AI] Generando imagen/video...');
            logger.info(`[Google Vertex AI] Prompt: ${prompt.substring(0, 100)}...`);
            logger.info(`[Google Vertex AI] Reference Image: ${referenceImageUrl}`);
            logger.info(`[Google Vertex AI] Aspect: ${aspectRatio}`);

            const response = await axios.post(`${endpoint}?key=${this.apiKey}`, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 300000 // 5 minutos
            });

            logger.info('[Google Vertex AI] Respuesta recibida:', JSON.stringify(response.data, null, 2));

            // Procesar respuesta
            const prediction = response.data.predictions?.[0];

            if (!prediction) {
                throw new Error('No predictions returned from API');
            }

            return {
                success: true,
                taskId: response.data.metadata?.generationId || 'unknown',
                status: 'SUCCEEDED',
                videoUrl: prediction.bytesBase64Encoded ? 'data:image/png;base64,' + prediction.bytesBase64Encoded : null,
                metadata: {
                    duration: duration,
                    aspectRatio: aspectRatio,
                    seed: seed,
                    model: this.model
                }
            };

        } catch (error) {
            logger.error('[Google Vertex AI] Error generando:', error.message);

            if (error.response) {
                logger.error('[Google Vertex AI] Response status:', error.response.status);
                logger.error('[Google Vertex AI] Response data:', JSON.stringify(error.response.data, null, 2));
            }

            throw new Error(`Google Vertex AI generation failed: ${error.message}`);
        }
    }

    /**
     * Verificar estado de generación
     */
    async checkStatus(taskId) {
        try {
            const accessToken = await this.getAccessToken();

            // Endpoint de operaciones
            const endpoint = `${this.apiEndpoint}/v1/${taskId}`;

            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const operation = response.data;

            return {
                taskId: taskId,
                status: operation.done ? 'SUCCEEDED' : 'RUNNING',
                progress: operation.metadata?.progressPercent || 0,
                videoUrl: operation.response?.videoUri,
                error: operation.error
            };

        } catch (error) {
            logger.error('[Google Vertex AI] Error checking status:', error.message);
            throw error;
        }
    }

    /**
     * Rate limiting
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            logger.info(`[Google Vertex AI] Rate limiting: esperando ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            this.validateConfig();

            return {
                status: 'OK',
                provider: 'Google Vertex AI',
                model: this.model,
                location: this.location,
                projectId: this.projectId,
                apiKeyConfigured: !!this.apiKey,
                anaImageUrl: this.anaImageUrl
            };

        } catch (error) {
            return {
                status: 'ERROR',
                provider: 'Google Vertex AI',
                error: error.message
            };
        }
    }
}

module.exports = GoogleVertexAIClient;
