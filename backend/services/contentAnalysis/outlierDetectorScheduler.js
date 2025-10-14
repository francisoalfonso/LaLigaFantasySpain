/**
 * Outlier Detector Scheduler
 *
 * Cron job automático para detectar videos virales (outliers) en YouTube
 * cada N horas sin intervención manual.
 *
 * CONFIGURACIÓN:
 * - OUTLIER_DETECTION_INTERVAL_HOURS (default: 6h)
 * - Busca videos publicados en últimas 24h
 * - Clasifica por prioridad (P0, P1, P2)
 * - Guarda en Supabase automáticamente
 *
 * VENTAJAS:
 * - Detección 24/7 sin supervisión
 * - Captura virales emergentes en primeras horas
 * - Reduce carga manual de monitoreo
 */

const youtubeOutlierDetector = require('./youtubeOutlierDetector');
const logger = require('../../utils/logger');

class OutlierDetectorScheduler {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;

        // Configuración del intervalo (en horas)
        this.intervalHours = parseInt(process.env.OUTLIER_DETECTION_INTERVAL_HOURS) || 6;
        this.intervalMs = this.intervalHours * 60 * 60 * 1000;

        // Configuración de búsqueda
        this.searchConfig = {
            hoursBack: parseInt(process.env.OUTLIER_SEARCH_HOURS_BACK) || 24,
            maxResultsPerKeyword: parseInt(process.env.OUTLIER_MAX_RESULTS_PER_KEYWORD) || 50
        };

        // Estadísticas
        this.stats = {
            totalRuns: 0,
            totalOutliersDetected: 0,
            lastRunAt: null,
            lastRunDuration: null,
            lastRunSuccess: null,
            nextRunAt: null
        };
    }

    /**
     * Iniciar el cron job automático
     */
    async start() {
        if (this.isRunning) {
            logger.warn('[OutlierScheduler] Cron job ya está corriendo');
            return;
        }

        this.isRunning = true;

        logger.info('🚀 [OutlierScheduler] Iniciando cron job automático', {
            interval: `${this.intervalHours}h`,
            intervalMs: this.intervalMs,
            searchHoursBack: this.searchConfig.hoursBack,
            maxResults: this.searchConfig.maxResultsPerKeyword
        });

        // Ejecutar inmediatamente al iniciar (opcional)
        const runImmediately = process.env.OUTLIER_RUN_ON_START !== 'false';
        if (runImmediately) {
            logger.info('[OutlierScheduler] Ejecutando detección inicial...');
            await this._runDetection();
        }

        // Programar ejecuciones periódicas
        this.intervalId = setInterval(async () => {
            await this._runDetection();
        }, this.intervalMs);

        // Calcular próxima ejecución
        this.stats.nextRunAt = new Date(Date.now() + this.intervalMs).toISOString();

        logger.info('✅ [OutlierScheduler] Cron job iniciado exitosamente', {
            nextRun: this.stats.nextRunAt
        });
    }

    /**
     * Detener el cron job
     */
    stop() {
        if (!this.isRunning) {
            logger.warn('[OutlierScheduler] Cron job no está corriendo');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        this.stats.nextRunAt = null;

        logger.info('🛑 [OutlierScheduler] Cron job detenido');
    }

    /**
     * Ejecutar detección de outliers
     * @private
     */
    async _runDetection() {
        const runId = Date.now();
        const startTime = Date.now();

        logger.info('🔍 [OutlierScheduler] Iniciando detección automática de outliers', {
            runId,
            run: this.stats.totalRuns + 1,
            config: this.searchConfig
        });

        try {
            // Ejecutar detección
            const outliers = await youtubeOutlierDetector.detectOutliers(this.searchConfig);

            const duration = Date.now() - startTime;

            // Actualizar estadísticas
            this.stats.totalRuns++;
            this.stats.totalOutliersDetected += outliers.length;
            this.stats.lastRunAt = new Date().toISOString();
            this.stats.lastRunDuration = duration;
            this.stats.lastRunSuccess = true;
            this.stats.nextRunAt = new Date(Date.now() + this.intervalMs).toISOString();

            // Contar por prioridad
            const p0Count = outliers.filter(o => o.priority === 'P0').length;
            const p1Count = outliers.filter(o => o.priority === 'P1').length;
            const p2Count = outliers.filter(o => o.priority === 'P2').length;

            logger.info('✅ [OutlierScheduler] Detección completada exitosamente', {
                runId,
                duration: `${(duration / 1000).toFixed(1)}s`,
                outliersDetected: outliers.length,
                priorities: {
                    p0: p0Count,
                    p1: p1Count,
                    p2: p2Count
                },
                nextRun: this.stats.nextRunAt
            });

            // Alerta si hay P0 (críticos)
            if (p0Count > 0) {
                logger.warn('🚨 [OutlierScheduler] ALERTA: Outliers P0 (críticos) detectados', {
                    count: p0Count,
                    message: 'Requieren respuesta en <24h'
                });
            }

            return {
                success: true,
                outliers,
                stats: {
                    total: outliers.length,
                    p0: p0Count,
                    p1: p1Count,
                    p2: p2Count
                }
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            // Actualizar estadísticas de error
            this.stats.totalRuns++;
            this.stats.lastRunAt = new Date().toISOString();
            this.stats.lastRunDuration = duration;
            this.stats.lastRunSuccess = false;
            this.stats.nextRunAt = new Date(Date.now() + this.intervalMs).toISOString();

            logger.error('❌ [OutlierScheduler] Error en detección automática', {
                runId,
                error: error.message,
                duration: `${(duration / 1000).toFixed(1)}s`,
                nextRun: this.stats.nextRunAt
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Ejecutar detección manualmente (fuera del cron)
     */
    async runManually() {
        logger.info('[OutlierScheduler] Ejecutando detección manual (fuera del cron)');
        return await this._runDetection();
    }

    /**
     * Obtener estadísticas del scheduler
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            config: {
                intervalHours: this.intervalHours,
                searchHoursBack: this.searchConfig.hoursBack,
                maxResultsPerKeyword: this.searchConfig.maxResultsPerKeyword
            }
        };
    }

    /**
     * Cambiar intervalo del cron (requiere restart)
     */
    setInterval(hours) {
        if (hours < 1) {
            throw new Error('Intervalo debe ser al menos 1 hora');
        }

        const wasRunning = this.isRunning;

        // Detener si está corriendo
        if (wasRunning) {
            this.stop();
        }

        // Actualizar intervalo
        this.intervalHours = hours;
        this.intervalMs = hours * 60 * 60 * 1000;

        logger.info('[OutlierScheduler] Intervalo actualizado', {
            newInterval: `${hours}h`
        });

        // Reiniciar si estaba corriendo
        if (wasRunning) {
            this.start();
        }

        return {
            success: true,
            intervalHours: hours,
            isRunning: this.isRunning
        };
    }

    /**
     * Obtener tiempo restante hasta próxima ejecución
     */
    getTimeUntilNextRun() {
        if (!this.stats.nextRunAt) {
            return null;
        }

        const nextRun = new Date(this.stats.nextRunAt);
        const now = new Date();
        const diffMs = nextRun - now;

        if (diffMs < 0) {
            return {
                overdue: true,
                message: 'Próxima ejecución retrasada'
            };
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return {
            overdue: false,
            hours,
            minutes,
            totalMinutes: Math.floor(diffMs / (1000 * 60)),
            message: `${hours}h ${minutes}m restantes`
        };
    }
}

// Singleton
module.exports = new OutlierDetectorScheduler();
