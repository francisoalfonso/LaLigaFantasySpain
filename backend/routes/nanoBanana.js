/**
 * Rutas API para Nano Banana (Google Gemini 2.5 Flash Image)
 *
 * Endpoints para generación de imágenes realistas de Ana Martínez
 * usando el sistema Nano Banana vía KIE.ai
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const NanoBananaClient = require('../services/nanoBanana/nanoBananaClient');

// Inicializar cliente Nano Banana
let nanoBananaClient;
try {
    nanoBananaClient = new NanoBananaClient();
} catch (error) {
    logger.error('[NanoBananaRoutes] Error inicializando cliente:', error.message);
}

/**
 * GET /api/nano-banana/health
 * Health check del sistema Nano Banana
 */
router.get('/health', async (req, res) => {
    try {
        if (!nanoBananaClient) {
            return res.status(503).json({
                success: false,
                error: 'Nano Banana client no inicializado'
            });
        }

        const health = await nanoBananaClient.healthCheck();

        res.json({
            success: true,
            system: 'Nano Banana (Google Gemini 2.5 Flash Image)',
            health
        });

    } catch (error) {
        logger.error('[NanoBananaRoutes] Error en health check:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/nano-banana/config
 * Obtener configuración actual
 */
router.get('/config', async (req, res) => {
    try {
        if (!nanoBananaClient) {
            return res.status(503).json({
                success: false,
                error: 'Nano Banana client no inicializado'
            });
        }

        const config = nanoBananaClient.getConfig();

        res.json({
            success: true,
            config
        });

    } catch (error) {
        logger.error('[NanoBananaRoutes] Error obteniendo config:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/nano-banana/generate-progression
 * Generar progresión de 3 imágenes (Wide, Medium, Close-up)
 *
 * Body:
 * {
 *   style: 'professional',
 *   progression: 'wide-medium-closeup',
 *   dialogue?: string // Opcional
 * }
 */
router.post('/generate-progression', async (req, res) => {
    try {
        if (!nanoBananaClient) {
            return res.status(503).json({
                success: false,
                error: 'Nano Banana client no inicializado'
            });
        }

        const {
            style = 'professional',
            progression = 'wide-medium-closeup',
            dialogue = null
        } = req.body;

        logger.info('[NanoBananaRoutes] 🎨 Generando progresión de 3 imágenes Ana...');
        logger.info(`[NanoBananaRoutes] Style: ${style}, Progression: ${progression}`);

        const startTime = Date.now();

        const images = await nanoBananaClient.generateAnaProgression({
            style,
            progression,
            dialogue
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const cost = images.length * 0.02;

        logger.info(`[NanoBananaRoutes] ✅ 3 imágenes generadas en ${duration}s`);

        res.json({
            success: true,
            images,
            metadata: {
                count: images.length,
                duration_seconds: parseFloat(duration),
                cost_usd: cost,
                progression,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('[NanoBananaRoutes] Error generando progresión:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/nano-banana/generate-single
 * Generar UNA imagen específica de Ana
 *
 * Body:
 * {
 *   shot: 'medium' | 'wide' | 'close-up',
 *   expression?: 'professional confident',
 *   customPrompt?: string,
 *   seed?: number
 * }
 */
router.post('/generate-single', async (req, res) => {
    try {
        if (!nanoBananaClient) {
            return res.status(503).json({
                success: false,
                error: 'Nano Banana client no inicializado'
            });
        }

        const {
            shot = 'medium',
            expression = 'professional confident',
            customPrompt = null,
            seed = null
        } = req.body;

        logger.info(`[NanoBananaRoutes] 📸 Generando imagen individual: ${shot}`);

        const startTime = Date.now();

        const options = { shot, expression };
        if (customPrompt) options.customPrompt = customPrompt;
        if (seed) options.seed = seed;

        const image = await nanoBananaClient.generateSingleImage(options);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        logger.info(`[NanoBananaRoutes] ✅ Imagen generada en ${duration}s`);

        res.json({
            success: true,
            image,
            metadata: {
                duration_seconds: parseFloat(duration),
                cost_usd: 0.02,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('[NanoBananaRoutes] Error generando imagen:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/nano-banana/test
 * Test rápido de generación
 */
router.get('/test', async (req, res) => {
    try {
        if (!nanoBananaClient) {
            return res.status(503).json({
                success: false,
                error: 'Nano Banana client no inicializado',
                message: 'Verifica que KIE_AI_API_KEY esté configurada en .env'
            });
        }

        logger.info('[NanoBananaRoutes] 🧪 Test endpoint llamado');

        const config = nanoBananaClient.getConfig();
        const health = await nanoBananaClient.healthCheck();

        res.json({
            success: true,
            message: 'Nano Banana client inicializado correctamente',
            config: {
                model: config.model,
                seed: config.seed,
                promptStrength: config.promptStrength,
                imageSize: config.imageSize,
                referenceCount: config.referenceCount
            },
            health,
            endpoints: {
                health: 'GET /api/nano-banana/health',
                config: 'GET /api/nano-banana/config',
                generateProgression: 'POST /api/nano-banana/generate-progression',
                generateSingle: 'POST /api/nano-banana/generate-single'
            },
            pricing: {
                perImage: '$0.02',
                progression3Images: '$0.06'
            }
        });

    } catch (error) {
        logger.error('[NanoBananaRoutes] Error en test:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
