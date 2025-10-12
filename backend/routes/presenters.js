/**
 * Routes: Presenter Assignment System
 *
 * Endpoints para gestionar la asignación automática de presentadores por tipología de contenido.
 * El calendario general llama a estos endpoints para determinar qué presentador debe hacer cada contenido.
 */

const express = require('express');
const router = express.Router();
const presenterScheduler = require('../services/presenterScheduler');
const logger = require('../utils/logger');

/**
 * POST /api/presenters/assign
 * 🎯 ENDPOINT PRINCIPAL: Asignar presentador para un tipo de contenido
 *
 * Body: {
 *   contentType: 'chollos', // obligatorio
 *   topic: 'Top chollos jornada 5', // opcional
 *   format: 'reel', // opcional
 *   forcePresenter: 'ana' // opcional (override manual)
 * }
 *
 * Response: {
 *   presenter: 'ana',
 *   contentType: 'chollos',
 *   category: 'engagement',
 *   assignment_rule: 'ana', // o 'auto' si fue automático
 *   history: { ana: 10, carlos: 5 }
 * }
 */
router.post('/assign', async (req, res) => {
    try {
        const { contentType, topic, format, forcePresenter } = req.body;

        if (!contentType) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el campo "contentType"'
            });
        }

        const result = presenterScheduler.assignPresenter(contentType, {
            topic,
            format,
            forcePresenter
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('[POST /api/presenters/assign] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/presenters/rules
 * Obtener todas las reglas de asignación por tipología
 */
router.get('/rules', async (req, res) => {
    try {
        const rules = presenterScheduler.getAssignmentRules();

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        logger.error('[GET /api/presenters/rules] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/presenters/by-category
 * Obtener asignaciones agrupadas por categoría (engagement, analytical, flexible)
 */
router.get('/by-category', async (req, res) => {
    try {
        const byCategory = presenterScheduler.getAssignmentsByCategory();

        res.json({
            success: true,
            data: byCategory
        });
    } catch (error) {
        logger.error('[GET /api/presenters/by-category] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/presenters/by-presenter
 * Obtener asignaciones agrupadas por presentador (ana, carlos, auto)
 */
router.get('/by-presenter', async (req, res) => {
    try {
        const byPresenter = presenterScheduler.getAssignmentsByPresenter();

        res.json({
            success: true,
            data: byPresenter
        });
    } catch (error) {
        logger.error('[GET /api/presenters/by-presenter] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/presenters/stats
 * Obtener estadísticas de distribución histórica
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = presenterScheduler.calculateDistributionStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('[GET /api/presenters/stats] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/presenters/summary
 * Obtener resumen completo del sistema de asignación
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = presenterScheduler.getSummary();

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        logger.error('[GET /api/presenters/summary] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/presenters/assignment/:contentType
 * Actualizar regla de asignación para un tipo de contenido
 *
 * Body: {
 *   presenter: 'ana', // 'ana', 'carlos', o 'auto'
 *   description: 'Nueva descripción' // opcional
 * }
 */
router.put('/assignment/:contentType', async (req, res) => {
    try {
        const { contentType } = req.params;
        const { presenter, description } = req.body;

        if (!presenter) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el campo "presenter"'
            });
        }

        const result = presenterScheduler.updateAssignment(contentType, presenter, {
            description
        });

        res.json({
            success: true,
            message: `Asignación actualizada: ${contentType} → ${presenter}`,
            data: result
        });
    } catch (error) {
        logger.error(`[PUT /api/presenters/assignment/${req.params.contentType}] Error:`, error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/presenters/distribution
 * Actualizar distribución objetivo (ej: 70% Ana / 30% Carlos)
 *
 * Body: {
 *   ana: 0.7,
 *   carlos: 0.3
 * }
 */
router.put('/distribution', async (req, res) => {
    try {
        const { ana, carlos } = req.body;

        if (ana === undefined || carlos === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren los campos "ana" y "carlos"'
            });
        }

        const result = presenterScheduler.updateDistribution({ ana, carlos });

        res.json({
            success: true,
            message: 'Distribución actualizada correctamente',
            data: result
        });
    } catch (error) {
        logger.error('[PUT /api/presenters/distribution] Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/presenters/reset-history
 * Resetear historial de asignaciones (útil para nueva temporada)
 */
router.post('/reset-history', async (req, res) => {
    try {
        const result = presenterScheduler.resetHistory();

        res.json({
            success: true,
            message: 'Historial reseteado correctamente',
            data: result
        });
    } catch (error) {
        logger.error('[POST /api/presenters/reset-history] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
