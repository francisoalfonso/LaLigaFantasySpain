/**
 * Rutas para gestión del sistema automático de chollos
 * Monitoreo del ChollosScheduler y ejecución manual
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// El chollosScheduler se importa como singleton desde server.js
// Para acceder a él, lo obtendremos del módulo padre
let chollosSchedulerInstance = null;

// Setter para inyectar el scheduler desde server.js
function setChollosScheduler(scheduler) {
    chollosSchedulerInstance = scheduler;
    logger.info('[Chollos Routes] ChollosScheduler inyectado');
}

/**
 * @route GET /api/chollos/status
 * @desc Obtener estado del ChollosScheduler
 */
router.get('/status', (req, res) => {
    try {
        if (!chollosSchedulerInstance) {
            return res.status(503).json({
                success: false,
                message: 'ChollosScheduler no inicializado'
            });
        }

        const stats = chollosSchedulerInstance.getStats();

        res.json({
            success: true,
            data: {
                scheduler: 'ChollosScheduler',
                status: stats.enabled ? 'ACTIVO' : 'DESACTIVADO',
                schedule: stats.schedule,
                lastRun: stats.lastRun,
                nextRun: stats.nextRun,
                statistics: {
                    totalRuns: stats.stats.totalRuns,
                    successfulRuns: stats.stats.successfulRuns,
                    failedRuns: stats.stats.failedRuns,
                    successRate:
                        stats.stats.totalRuns > 0
                            ? ((stats.stats.successfulRuns / stats.stats.totalRuns) * 100).toFixed(
                                  1
                              )
                            : '0',
                    lastError: stats.stats.lastError
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[Chollos Routes] Error obteniendo status:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estado del scheduler',
            error: error.message
        });
    }
});

/**
 * @route POST /api/chollos/run-now
 * @desc Ejecutar generación de chollo manualmente (sin esperar al cron)
 */
router.post('/run-now', (req, res) => {
    try {
        if (!chollosSchedulerInstance) {
            return res.status(503).json({
                success: false,
                message: 'ChollosScheduler no inicializado'
            });
        }

        logger.info('[Chollos Routes] 🚀 Ejecución manual solicitada');

        // Responder inmediatamente (ejecución en background)
        res.json({
            success: true,
            message: 'Generación de chollo iniciada en background',
            note: 'El proceso tomará ~12-15 minutos. Monitorea los logs del servidor.',
            timestamp: new Date().toISOString()
        });

        // Ejecutar en background
        chollosSchedulerInstance.runNow().catch(error => {
            logger.error('[Chollos Routes] Error en ejecución manual:', error);
        });
    } catch (error) {
        logger.error('[Chollos Routes] Error iniciando ejecución manual:', error);
        res.status(500).json({
            success: false,
            message: 'Error iniciando generación manual',
            error: error.message
        });
    }
});

module.exports = { router, setChollosScheduler };
