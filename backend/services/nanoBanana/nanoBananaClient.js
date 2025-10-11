/**
 * Nano Banana Client (KIE.ai) - Ana Martínez Character System
 *
 * Sistema de generación de imágenes realistas de Ana Martínez usando
 * Gemini 2.5 Flash Image (Nano Banana) vía KIE.ai API con referencias múltiples.
 *
 * Documentación: docs/presentadores-BASE ANA - NANOBANANA/guia_nanobanana_KIEAI_ana_martinez.md
 *
 * CARACTERÍSTICAS CLAVE:
 * ✅ 5 imágenes de referencia (4 vistas Ana + 1 estudio FLP)
 * ✅ Seed fijo 12500 para consistencia total
 * ✅ Prompt strength 0.8 (equilibrio identidad/entorno)
 * ✅ Integración total con estudio FLP (neón rojo + pantallas)
 * ✅ Piel realista sin look 3D/plástico
 *
 * Pricing KIE.ai: $0.02 por imagen
 *
 * IMPORTANTE: Este sistema usa 'image_urls' (array de URLs públicas)
 *             NO 'referenced_image_ids' (solo para API core de Google)
 */

const axios = require('axios');
const logger = require('../../utils/logger');

// Configuración FLP con estructura flp/ana/, flp/estudio/, flp/kits/
// Generada por check-buckets-and-reorganize.js (Oct 2025)
const FLP_CONFIG = require('../../../data/flp-nano-banana-config.json');

class NanoBananaClient {
    constructor() {
        // API Key de KIE.ai
        this.apiKey = process.env.KIE_AI_API_KEY;
        this.baseUrl = 'https://api.kie.ai/api/v1';

        if (!this.apiKey) {
            throw new Error('KIE_AI_API_KEY no configurada en .env');
        }

        // Endpoints de KIE.ai
        this.createTaskEndpoint = '/playground/createTask';
        this.recordInfoEndpoint = '/playground/recordInfo';

        // Configuración de Ana Martínez (desde flp-nano-banana-config.json)
        this.anaConfig = {
            seed: FLP_CONFIG.seed || 12500,
            promptStrength: FLP_CONFIG.prompt_strength || 0.75,
            model: FLP_CONFIG.model || 'google/nano-banana-edit',
            imageSize: FLP_CONFIG.image_size || '9:16', // CRITICAL: Fuerza formato vertical 576x1024
            outputFormat: FLP_CONFIG.output_format || 'png',
            transparentBackground: FLP_CONFIG.transparent_background || false
        };

        // URLs de referencias para Nano Banana
        // Orden: 4 Ana + 1 estudio (estudio al final)
        // El aspect ratio se fuerza con image_size: "9:16" (no depende del orden)
        this.anaReferenceUrls = [
            ...FLP_CONFIG.ana_references.map(ref => ref.url),
            FLP_CONFIG.estudio.url
        ];

        // Información de kits disponibles (para cambio de camiseta)
        this.availableKits = FLP_CONFIG.kits || [];

        logger.info('[NanoBananaClient] ✅ Cliente inicializado (Ana Martínez System)');
        logger.info(`[NanoBananaClient] Referencias: ${this.anaReferenceUrls.length} imágenes`);
        logger.info(`[NanoBananaClient] Seed: ${this.anaConfig.seed}`);
        logger.info(`[NanoBananaClient] Prompt strength: ${this.anaConfig.promptStrength}`);
        logger.info('[NanoBananaClient] Pricing: $0.02/imagen');
    }

    /**
     * Generar imágenes de Ana con progresión cinematográfica
     *
     * SISTEMA ACTUALIZADO (Oct 2025):
     * - Usa 5 referencias múltiples (4 vistas Ana + 1 estudio)
     * - Seed fijo 12500 para consistencia absoluta
     * - Variaciones solo en planos y expresiones (NO en identidad)
     *
     * Progresión: Wide Shot → Medium Shot → Close-Up
     * - Segmento 1 (Hook): Wide shot - establece escenario
     * - Segmento 2 (Desarrollo): Medium shot - acercamiento natural
     * - Segmento 3 (CTA): Close-up - intimidad y urgencia
     *
     * @param {object} options - Opciones de generación
     * @returns {Promise<Array>} - Array de 3 objetos con URLs de imágenes
     */
    async generateAnaProgression(options = {}) {
        const {
            _style = 'professional',
            progression = 'wide-medium-closeup',
            _dialogue = null // Opcional: diálogo específico para cada segmento
        } = options;

        logger.info('[NanoBananaClient] 🎨 Iniciando generación de 3 imágenes Ana...');
        logger.info(`[NanoBananaClient] Progresión: ${progression}`);
        logger.info(`[NanoBananaClient] Referencias: ${this.anaReferenceUrls.length} imágenes`);

        // Prompt base de Ana - CONFIGURACIÓN DEFINITIVA VALIDADA (Oct 10, 2025)
        // PROMPT EXACTO DEL TEST EXITOSO - NO MODIFICAR
        // Menos texto = más realismo, menos aspecto 3D/render
        // ✅ CRÍTICO (Oct 11): "green-hazel eyes" añadido para mantener color original de Ana
        const anaBasePrompt = `ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, same face with green-hazel eyes, hairstyle and red FLP polo shirt, integrated with the studio lighting and reflections, very soft red neon glow from the FLP sign behind her, reflecting faintly on the right edge of her face only, no red color cast on hair, maintain natural blonde hair color, balanced neutral white balance, gentle blue monitor reflections on left side, realistic soft shadows and light diffusion, cinematic tone, Canon EOS R5 85mm f1.4 lens, shallow depth of field, film grain, authentic human skin texture, no CGI, no render, no plastic skin, confident professional expression`;

        // Negative prompt detallado para evitar reflejos rojizos en pelo
        const negativePrompt = `no red tint on hair, no red highlights on hair, no strong color reflections, no magenta tone on face, no HDR, no 3D render, no composite lighting mismatch, no overexposed red areas, no fake reflections`;

        // Definir 3 prompts con SOLO variación de plano cinematográfico
        // IMPORTANTE: Mantener prompts cortos para evitar aspecto 3D/render
        const prompts = [
            {
                index: 1,
                shot: 'wide',
                segmentRole: 'hook',
                prompt: anaBasePrompt, // Sin añadir texto extra
                seed: this.anaConfig.seed // Seed fijo
            },
            {
                index: 2,
                shot: 'medium',
                segmentRole: 'development',
                prompt: anaBasePrompt, // Sin añadir texto extra
                seed: this.anaConfig.seed + 1 // Variación mínima (+1 para microcambios naturales)
            },
            {
                index: 3,
                shot: 'close-up',
                segmentRole: 'cta',
                prompt: anaBasePrompt, // Sin añadir texto extra
                seed: this.anaConfig.seed + 2 // Variación mínima (+2)
            }
        ];

        const images = [];
        const startTime = Date.now();

        for (let i = 0; i < prompts.length; i++) {
            const { index, shot, segmentRole, prompt, seed } = prompts[i];

            try {
                logger.info(
                    `[NanoBananaClient] 📸 Generando imagen ${index}/3 (${shot} - ${segmentRole})...`
                );
                logger.info(`[NanoBananaClient]    Seed: ${seed}`);

                // DEBUG: Log del payload que vamos a enviar
                const payload = {
                    model: this.anaConfig.model,
                    input: {
                        prompt: prompt,
                        negative_prompt: negativePrompt,
                        image_urls: this.anaReferenceUrls,
                        output_format: this.anaConfig.outputFormat,
                        image_size: this.anaConfig.imageSize, // "9:16" fuerza vertical 576x1024
                        seed: seed,
                        prompt_strength: this.anaConfig.promptStrength,
                        transparent_background: this.anaConfig.transparentBackground,
                        n: 1
                    }
                };

                console.log('\n=== PAYLOAD A ENVIAR ===');
                console.log(JSON.stringify(payload, null, 2));
                console.log('=========================\n');

                // 1. Crear tarea de generación en KIE.ai
                const createResponse = await axios.post(
                    `${this.baseUrl}${this.createTaskEndpoint}`,
                    {
                        model: this.anaConfig.model,
                        input: {
                            prompt: prompt,
                            negative_prompt: negativePrompt,
                            image_urls: this.anaReferenceUrls, // ✅ CRÍTICO: Array de URLs (no referenced_image_ids)
                            output_format: this.anaConfig.outputFormat,
                            image_size: this.anaConfig.imageSize, // ✅ CRÍTICO: "9:16" fuerza vertical 576x1024
                            seed: seed,
                            prompt_strength: this.anaConfig.promptStrength,
                            transparent_background: this.anaConfig.transparentBackground,
                            n: 1
                        }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                // DEBUG: Loggear respuesta completa CON CONSOLE.LOG (Winston puede estar filtrando)
                console.log('\n=== DEBUG: RESPONSE DE CREATE TASK ===');
                console.log('Status:', createResponse.status);
                console.log('Data completo:', JSON.stringify(createResponse.data, null, 2));
                console.log('=====================================\n');

                logger.info('[NanoBananaClient] 📋 Response status:', createResponse.status);
                logger.info(
                    '[NanoBananaClient] 📋 Response data:',
                    JSON.stringify(createResponse.data, null, 2)
                );

                // Extraer taskId
                const taskId = createResponse.data?.data?.taskId;

                if (!taskId) {
                    console.error('\n=== ERROR: NO TASK_ID ===');
                    console.error('createResponse.data:', createResponse.data);
                    console.error('createResponse.data.data:', createResponse.data?.data);
                    console.error('==========================\n');

                    logger.error('[NanoBananaClient] ❌ No se encontró task_id');
                    logger.error(
                        '[NanoBananaClient] Response data:',
                        JSON.stringify(createResponse.data, null, 2)
                    );
                    throw new Error('No se recibió task_id en respuesta de createTask');
                }

                logger.info(`[NanoBananaClient] Task creada: ${taskId}, esperando generación...`);

                // 2. Polling para esperar que la imagen se genere
                let imageUrl = null;
                let attempts = 0;
                const maxAttempts = 60; // 60 intentos × 3s = 180s max (aumentado para Nano Banana API lenta)

                while (!imageUrl && attempts < maxAttempts) {
                    attempts++;

                    // Esperar 3 segundos antes de cada intento (excepto el primero)
                    if (attempts > 1) {
                        await this.sleep(3000);
                    }

                    const statusResponse = await axios.get(
                        `${this.baseUrl}${this.recordInfoEndpoint}`,
                        {
                            params: { taskId: taskId },
                            headers: {
                                Authorization: `Bearer ${this.apiKey}`
                            },
                            timeout: 15000
                        }
                    );

                    const data = statusResponse.data?.data;
                    const state = data?.state;
                    const resultJson = data?.resultJson;

                    logger.info(
                        `[NanoBananaClient] Intento ${attempts}/${maxAttempts}: State = ${state}`
                    );

                    if (state === 'success') {
                        // Parsear resultJson para obtener URL
                        const result = JSON.parse(resultJson);
                        imageUrl = result?.resultUrls?.[0];
                        if (!imageUrl) {
                            throw new Error('No se encontró URL en resultJson');
                        }
                        break;
                    } else if (state === 'failed' || state === 'fail') {
                        // KIE.ai puede devolver 'fail' o 'failed'
                        const errorMsg = data?.failMsg || 'Generación de imagen falló en servidor';
                        throw new Error(errorMsg);
                    }
                    // Si state es 'queuing' o 'generating', continuar polling
                }

                if (!imageUrl) {
                    throw new Error(
                        `Timeout esperando generación después de ${maxAttempts} intentos`
                    );
                }

                images.push({
                    index: index,
                    shot: shot,
                    segmentRole: segmentRole,
                    url: imageUrl,
                    prompt: prompt,
                    seed: seed,
                    referenceCount: this.anaReferenceUrls.length,
                    generatedAt: new Date().toISOString()
                });

                logger.info(`[NanoBananaClient] ✅ Imagen ${index} generada exitosamente`);
                logger.info(`[NanoBananaClient]    URL: ${imageUrl.substring(0, 80)}...`);

                // Cooling period entre generaciones (evitar rate limiting)
                if (i < prompts.length - 1) {
                    logger.info('[NanoBananaClient] ⏳ Cooling 3s antes de siguiente imagen...');
                    await this.sleep(3000);
                }
            } catch (error) {
                console.error('\n=== ERROR CAPTURADO ===');
                console.error('Message:', error.message);
                console.error('Response Status:', error.response?.status);
                console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
                console.error(
                    'Request Config:',
                    JSON.stringify(
                        {
                            url: error.config?.url,
                            method: error.config?.method,
                            headers: error.config?.headers
                        },
                        null,
                        2
                    )
                );
                console.error('========================\n');

                logger.error(`[NanoBananaClient] ❌ Error generando imagen ${index}:`, {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                throw new Error(`Failed to generate image ${index} (${shot}): ${error.message}`);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalCost = images.length * 0.02;

        logger.info(`[NanoBananaClient] ✅ 3 imágenes Ana generadas exitosamente`);
        logger.info(`[NanoBananaClient] ⏱️  Duración: ${duration}s`);
        logger.info(`[NanoBananaClient] 💰 Costo: $${totalCost.toFixed(3)}`);
        logger.info(`[NanoBananaClient] 📊 Sistema: Ana Martínez (seed ${this.anaConfig.seed})`);

        return images;
    }

    /**
     * Generar UNA imagen específica de Ana (para testing o casos especiales)
     *
     * @param {object} options - Opciones de generación
     * @returns {Promise<object>} - Objeto con URL de imagen
     */
    async generateSingleImage(options = {}) {
        const {
            shot = 'medium',
            _expression = 'professional confident',
            customPrompt = null,
            seed = this.anaConfig.seed
        } = options;

        logger.info(`[NanoBananaClient] 📸 Generando imagen individual (${shot})...`);

        // Usar el MISMO prompt base que en generateAnaProgression (sin añadidos)
        // Añadir texto extra causa aspecto 3D/render
        // ✅ CRÍTICO (Oct 11): "green-hazel eyes" añadido para mantener color original de Ana
        const basePrompt =
            customPrompt ||
            `ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, same face with green-hazel eyes, hairstyle and red FLP polo shirt, integrated with the studio lighting and reflections, very soft red neon glow from the FLP sign behind her, reflecting faintly on the right edge of her face only, no red color cast on hair, maintain natural blonde hair color, balanced neutral white balance, gentle blue monitor reflections on left side, realistic soft shadows and light diffusion, cinematic tone, Canon EOS R5 85mm f1.4 lens, shallow depth of field, film grain, authentic human skin texture, no CGI, no render, no plastic skin, confident professional expression`;

        const negativePrompt = `no red tint on hair, no red highlights on hair, no strong color reflections, no magenta tone on face, no HDR, no 3D render, no composite lighting mismatch, no overexposed red areas, no fake reflections`;

        // DEBUG
        console.log('\n=== GENERATE SINGLE IMAGE - PAYLOAD ===');
        console.log('Modelo:', this.anaConfig.model);
        console.log('Prompt:', `${basePrompt.substring(0, 100)}...`);
        console.log('Referencias:', this.anaReferenceUrls.length);
        console.log('Seed:', seed);
        console.log('========================================\n');

        try {
            const createResponse = await axios.post(
                `${this.baseUrl}${this.createTaskEndpoint}`,
                {
                    model: this.anaConfig.model,
                    input: {
                        prompt: basePrompt,
                        negative_prompt: negativePrompt,
                        image_urls: this.anaReferenceUrls,
                        output_format: this.anaConfig.outputFormat,
                        image_size: this.anaConfig.imageSize, // ✅ CRÍTICO: "9:16" fuerza vertical 576x1024
                        seed: seed,
                        prompt_strength: this.anaConfig.promptStrength,
                        transparent_background: false,
                        n: 1
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            // DEBUG: Ver respuesta completa
            console.log('\n=== RESPONSE DE CREATE TASK (SINGLE) ===');
            console.log('Status:', createResponse.status);
            console.log('Data:', JSON.stringify(createResponse.data, null, 2));
            console.log('=========================================\n');

            const taskId = createResponse.data?.data?.taskId;
            if (!taskId) {
                console.error('ERROR: taskId no encontrado');
                console.error('createResponse.data:', createResponse.data);
                console.error('createResponse.data.data:', createResponse.data?.data);
                throw new Error('No se recibió task_id');
            }

            // Polling
            let imageUrl = null;
            let attempts = 0;
            const maxAttempts = 60; // 60 intentos × 3s = 180s max (aumentado para Nano Banana API lenta)

            while (!imageUrl && attempts < maxAttempts) {
                attempts++;
                if (attempts > 1) {
                    await this.sleep(3000);
                }

                const statusResponse = await axios.get(
                    `${this.baseUrl}${this.recordInfoEndpoint}`,
                    {
                        params: { taskId },
                        headers: { Authorization: `Bearer ${this.apiKey}` },
                        timeout: 15000
                    }
                );

                const data = statusResponse.data?.data;
                const state = data?.state;

                if (state === 'success') {
                    const result = JSON.parse(data.resultJson);
                    imageUrl = result?.resultUrls?.[0];
                    break;
                } else if (state === 'failed') {
                    throw new Error(data?.failMsg || 'Generación falló');
                }
            }

            if (!imageUrl) {
                throw new Error('Timeout esperando generación');
            }

            logger.info(`[NanoBananaClient] ✅ Imagen generada: ${imageUrl}`);

            return {
                url: imageUrl,
                shot,
                seed,
                prompt: basePrompt,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('\n=== ERROR EN SINGLE IMAGE ===');
            console.error('Message:', error.message);
            console.error('Response Status:', error.response?.status);
            console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Stack:', error.stack);
            console.error('==============================\n');

            logger.error('[NanoBananaClient] ❌ Error generando imagen:', error.message);
            throw error;
        }
    }

    /**
     * Sleep helper para cooling periods y polling
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validar configuración del cliente
     */
    async healthCheck() {
        try {
            logger.info('[NanoBananaClient] 🏥 Health check...');

            if (!this.apiKey) {
                throw new Error('API Key no configurada');
            }

            if (!this.anaReferenceUrls || this.anaReferenceUrls.length === 0) {
                throw new Error('No hay imágenes de referencia configuradas');
            }

            logger.info('[NanoBananaClient] ✅ Health check OK');
            return {
                configured: true,
                model: this.anaConfig.model,
                seed: this.anaConfig.seed,
                references: this.anaReferenceUrls.length,
                promptStrength: this.anaConfig.promptStrength,
                imageSize: this.anaConfig.imageSize,
                pricing: '$0.020/imagen'
            };
        } catch (error) {
            logger.error('[NanoBananaClient] ❌ Health check falló:', error.message);
            return {
                configured: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener información de configuración actual
     */
    getConfig() {
        return {
            seed: this.anaConfig.seed,
            promptStrength: this.anaConfig.promptStrength,
            model: this.anaConfig.model,
            imageSize: this.anaConfig.imageSize,
            references: this.anaReferenceUrls,
            referenceCount: this.anaReferenceUrls.length
        };
    }

    /**
     * ✅ NUEVO (10 Oct 2025): Generar imagen contextualizada con prompt personalizado
     * Para integración con UnifiedScriptGenerator → Nano Banana → VEO3
     *
     * @param {string} customPrompt - Prompt con contexto del segmento
     * @param {string} shotType - wide, medium, close-up
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} - Imagen generada
     */
    async generateContextualImage(customPrompt, shotType, options = {}) {
        try {
            logger.info(`[NanoBananaClient] 🎨 Generando imagen contextualizada (${shotType})...`);
            logger.info(`[NanoBananaClient] Prompt: "${customPrompt.substring(0, 100)}..."`);

            const seed = options.seed || this.anaConfig.seed;

            // Negative prompt para evitar reflejos rojizos y aspecto 3D
            const negativePrompt = `no red tint on hair, no red highlights on hair, no strong color reflections, no magenta tone on face, no HDR, no 3D render, no composite lighting mismatch, no overexposed red areas, no fake reflections`;

            const payload = {
                model: this.anaConfig.model,
                input: {
                    prompt: customPrompt,
                    negative_prompt: negativePrompt,
                    image_urls: this.anaReferenceUrls,
                    output_format: this.anaConfig.outputFormat,
                    image_size: this.anaConfig.imageSize, // "9:16" vertical 576x1024
                    seed: seed,
                    prompt_strength: this.anaConfig.promptStrength,
                    transparent_background: false,
                    n: 1
                }
            };

            // 1. Crear tarea
            const createResponse = await axios.post(
                `${this.baseUrl}${this.createTaskEndpoint}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const taskId = createResponse.data?.data?.taskId;

            if (!taskId) {
                logger.error('[NanoBananaClient] ❌ No se recibió taskId');
                logger.error(
                    '[NanoBananaClient] Response:',
                    JSON.stringify(createResponse.data, null, 2)
                );
                throw new Error('No se recibió task_id en respuesta de createTask');
            }

            logger.info(`[NanoBananaClient] Task creada: ${taskId}, esperando generación...`);

            // 2. Polling hasta que complete
            let imageUrl = null;
            let attempts = 0;
            const maxAttempts = 60; // 60 intentos × 3s = 180s max (aumentado para Nano Banana API lenta)

            while (!imageUrl && attempts < maxAttempts) {
                attempts++;

                if (attempts > 1) {
                    await this.sleep(3000);
                }

                const statusResponse = await axios.get(
                    `${this.baseUrl}${this.recordInfoEndpoint}`,
                    {
                        params: { taskId: taskId },
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`
                        },
                        timeout: 15000
                    }
                );

                const data = statusResponse.data?.data;
                const state = data?.state;

                logger.info(
                    `[NanoBananaClient] Intento ${attempts}/${maxAttempts}: State = ${state}`
                );

                if (state === 'success') {
                    const result = JSON.parse(data.resultJson);
                    imageUrl = result?.resultUrls?.[0];

                    if (!imageUrl) {
                        throw new Error('No se encontró URL en resultJson');
                    }
                    break;
                } else if (state === 'failed' || state === 'fail') {
                    const errorMsg = data?.failMsg || 'Generación de imagen falló en servidor';
                    throw new Error(errorMsg);
                }
            }

            if (!imageUrl) {
                throw new Error(`Timeout esperando generación después de ${maxAttempts} intentos`);
            }

            logger.info(`[NanoBananaClient] ✅ Imagen generada: ${imageUrl.substring(0, 80)}...`);

            return {
                url: imageUrl,
                shot: shotType,
                seed: seed,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error(
                '[NanoBananaClient] ❌ Error generando imagen contextualizada:',
                error.message
            );
            throw error;
        }
    }
}

module.exports = NanoBananaClient;
