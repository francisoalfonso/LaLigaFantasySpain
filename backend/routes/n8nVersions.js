/**
 * Rutas API para N8n Version Control System
 * Control de versiones entre MCP local y VPS
 * Refactorizado para usar Error Handler centralizado
 */

const express = require('express');
const router = express.Router();
const N8nVersionControl = require('../services/n8nVersionControl');
const logger = require('../utils/logger');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

const versionControl = new N8nVersionControl();

/**
 * @swagger
 * /api/n8n-versions/test:
 *   get:
 *     summary: Test del sistema de control de versiones n8n
 *     description: Verifica que el sistema de control de versiones n8n está funcionando
 *     tags: [n8n Versions]
 *     responses:
 *       200:
 *         description: Sistema funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: N8n Version Control System funcionando correctamente
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     compare:
 *                       type: string
 *                       example: /api/n8n-versions/compare
 *                     latest:
 *                       type: string
 *                       example: /api/n8n-versions/latest
 *                     history:
 *                       type: string
 *                       example: /api/n8n-versions/history
 *                     status:
 *                       type: string
 *                       example: /api/n8n-versions/status
 */
router.get('/test', (req, res) => {
    logger.info('Test endpoint n8n version control');
    res.json({
        success: true,
        message: 'N8n Version Control System funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
            compare: '/api/n8n-versions/compare',
            latest: '/api/n8n-versions/latest',
            history: '/api/n8n-versions/history',
            status: '/api/n8n-versions/status'
        }
    });
});

/**
 * GET /api/n8n-versions/compare
 * Compara versiones entre MCP local y VPS
 * Genera alertas automáticas si hay desincronización
 */
router.get(
    '/compare',
    asyncHandler(async (req, res) => {
        logger.info('Comparando versiones n8n MCP vs VPS');

        const comparison = await versionControl.compareVersions();

        res.json({
            success: true,
            comparison: comparison,
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * GET /api/n8n-versions/latest
 * Obtiene el último snapshot de comparación guardado
 */
router.get(
    '/latest',
    asyncHandler(async (req, res) => {
        logger.info('Obteniendo último snapshot n8n');

        const snapshot = await versionControl.getLatestSnapshot();

        if (!snapshot) {
            throw new NotFoundError('Snapshot', 'Ejecuta /api/n8n-versions/compare primero');
        }

        res.json({
            success: true,
            snapshot: snapshot,
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * GET /api/n8n-versions/history
 * Obtiene historial de snapshots (últimos 10 por defecto)
 */
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        logger.info('Obteniendo historial snapshots n8n', { limit });

        const history = await versionControl.getSnapshotHistory(limit);

        res.json({
            success: true,
            history: history,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo historial:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/n8n-versions/status
 * Estado rápido de sincronización sin generar snapshot
 */
router.get('/status', async (req, res) => {
    try {
        logger.info('Verificando estado sincronización n8n');

        // Obtener último snapshot sin generar uno nuevo
        const latestSnapshot = await versionControl.getLatestSnapshot();

        if (!latestSnapshot) {
            return res.json({
                success: true,
                status: 'UNKNOWN',
                message: 'No hay snapshots. Ejecuta /compare para generar uno.',
                needsCheck: true
            });
        }

        // Calcular antigüedad del snapshot
        const snapshotAge = Date.now() - new Date(latestSnapshot.timestamp).getTime();
        const hoursOld = Math.floor(snapshotAge / (1000 * 60 * 60));

        // Si el snapshot tiene más de 24h, recomendar nueva comparación
        const needsRefresh = hoursOld > 24;

        res.json({
            success: true,
            status: latestSnapshot.needsUpdate ? 'OUT_OF_SYNC' : 'SYNCED',
            severity: latestSnapshot.severity,
            needsUpdate: latestSnapshot.needsUpdate,
            differenceCount: latestSnapshot.differences.length,
            lastCheck: latestSnapshot.timestamp,
            hoursOld: hoursOld,
            needsRefresh: needsRefresh,
            local: latestSnapshot.local,
            vps: latestSnapshot.vps,
            differences: latestSnapshot.differences
        });
    } catch (error) {
        logger.error('Error verificando estado:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/n8n-versions/alert
 * Genera alerta manual (para testing)
 */
router.post('/alert', async (req, res) => {
    try {
        logger.info('Generando alerta manual n8n');

        const comparison = await versionControl.compareVersions();

        res.json({
            success: true,
            message: 'Alerta generada',
            alertGenerated: comparison.needsUpdate,
            comparison: comparison
        });
    } catch (error) {
        logger.error('Error generando alerta:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;