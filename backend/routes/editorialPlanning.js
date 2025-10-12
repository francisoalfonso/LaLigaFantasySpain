/**
 * Routes: Editorial Planning
 *
 * Endpoints para gestionar el planning editorial integrado:
 * - Planificación manual de contenidos
 * - Activadores desde competitive intelligence
 * - Gestión de estado (scheduled → production → published)
 */

const express = require('express');
const router = express.Router();
const editorialPlanning = require('../services/editorialPlanningService');
const logger = require('../utils/logger');

/**
 * GET /api/planning
 * Obtener planning completo con todas las categorías
 */
router.get('/', async (req, res) => {
    try {
        const planning = editorialPlanning.getFullPlanning();

        res.json({
            success: true,
            data: planning
        });
    } catch (error) {
        logger.error('[GET /api/planning] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/planning/schedule
 * Planificar nuevo contenido manualmente
 *
 * Body: {
 *   contentType: 'chollos',
 *   topic: 'Top Chollos Jornada 5',
 *   platform: 'instagram',
 *   scheduledDate: '2025-10-15T10:00:00Z',
 *   priority: 'high'
 * }
 */
router.post('/schedule', async (req, res) => {
    try {
        const content = req.body;

        if (!content.contentType || !content.topic) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren contentType y topic'
            });
        }

        const result = await editorialPlanning.scheduleContent(content);

        res.json({
            success: true,
            data: result,
            message: 'Contenido planificado correctamente'
        });
    } catch (error) {
        logger.error('[POST /api/planning/schedule] Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/planning/trigger
 * Activar trigger desde competitive intelligence
 *
 * Body: {
 *   type: 'viral_response',
 *   priority: 'high',
 *   platform: 'instagram',
 *   suggested_response: 'Análisis del gol viral de Benzema',
 *   deadline: '2025-10-13T15:00:00Z',
 *   trigger_content: { ... }
 * }
 */
router.post('/trigger', async (req, res) => {
    try {
        const trigger = req.body;

        if (!trigger.type) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el campo "type"'
            });
        }

        const result = await editorialPlanning.activateTrigger(trigger);

        res.json({
            success: true,
            data: result,
            message: 'Trigger activado correctamente'
        });
    } catch (error) {
        logger.error('[POST /api/planning/trigger] Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/planning/production/:id
 * Mover contenido de scheduled/triggers → in_production
 */
router.put('/production/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await editorialPlanning.moveToProduction(id);

        res.json({
            success: true,
            data: result,
            message: 'Item movido a producción'
        });
    } catch (error) {
        logger.error(`[PUT /api/planning/production/${req.params.id}] Error:`, error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/planning/publish/:id
 * Marcar contenido como publicado (in_production → published)
 *
 * Body: {
 *   publishedAt: '2025-10-13T10:00:00Z',
 *   postUrl: 'https://instagram.com/p/xyz',
 *   metrics: { views: 1000, likes: 50, ... }
 * }
 */
router.put('/publish/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const publishData = req.body;

        const result = await editorialPlanning.markAsPublished(id, publishData);

        res.json({
            success: true,
            data: result,
            message: 'Item marcado como publicado'
        });
    } catch (error) {
        logger.error(`[PUT /api/planning/publish/${req.params.id}] Error:`, error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/planning/:id
 * Eliminar item del planning
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await editorialPlanning.deleteItem(id);

        res.json({
            success: true,
            data: result,
            message: 'Item eliminado correctamente'
        });
    } catch (error) {
        logger.error(`[DELETE /api/planning/${req.params.id}] Error:`, error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/planning/monitoring/start
 * Iniciar monitoreo automático de competencia
 */
router.post('/monitoring/start', async (req, res) => {
    try {
        const result = await editorialPlanning.startCompetitiveMonitoring();

        res.json({
            success: true,
            data: result,
            message: 'Monitoreo de competencia iniciado'
        });
    } catch (error) {
        logger.error('[POST /api/planning/monitoring/start] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/planning/monitoring/stop
 * Detener monitoreo de competencia
 */
router.post('/monitoring/stop', async (req, res) => {
    try {
        const result = editorialPlanning.stopCompetitiveMonitoring();

        res.json({
            success: true,
            data: result,
            message: 'Monitoreo de competencia detenido'
        });
    } catch (error) {
        logger.error('[POST /api/planning/monitoring/stop] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
