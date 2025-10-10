const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * VEO3StatsTracker - Sistema de tracking de success/failure rates
 *
 * Monitorea y registra estadísticas detalladas de generación VEO3:
 * - Success rate global y por segmento
 * - Tiempo promedio de generación
 * - Intentos necesarios por éxito
 * - Estrategias de fix más efectivas
 * - Costos acumulados
 * - Análisis de errores frecuentes
 *
 * Características:
 * - Persistencia en archivo JSON
 * - Agregación por día/semana/mes
 * - Reporting detallado
 * - Integración con RetryManager
 */
class VEO3StatsTracker {
    constructor() {
        this.statsDir = process.env.VEO3_STATS_DIR || './logs/veo3/stats';
        this.statsFile = path.join(this.statsDir, 'generation-stats.json');

        // Stats en memoria
        this.currentSession = {
            startedAt: new Date().toISOString(),
            totalAttempts: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            totalRetries: 0,
            totalCost: 0,
            totalDurationMs: 0,
            successByAttempt: {}, // { "1": 45, "2": 30, "3": 15 }
            errorsByCategory: {}, // { "content_policy": 25, "timeout": 5 }
            strategiesUsed: {}, // { "remove_team_mention": 20, "simplify_prompt": 15 }
            segmentStats: [] // [{segmentIndex, success, attempts, duration}]
        };

        // Cargar stats persistentes si existen
        this.loadPersistedStats();

        logger.info('[VEO3StatsTracker] Inicializado');
    }

    /**
     * Cargar estadísticas persistentes del disco
     */
    loadPersistedStats() {
        try {
            // Crear directorio si no existe
            if (!fs.existsSync(this.statsDir)) {
                fs.mkdirSync(this.statsDir, { recursive: true });
            }

            if (fs.existsSync(this.statsFile)) {
                const data = fs.readFileSync(this.statsFile, 'utf-8');
                this.persistedStats = JSON.parse(data);
                logger.info(
                    `[VEO3StatsTracker] Stats cargadas: ${this.persistedStats.totalGenerations || 0} generaciones`
                );
            } else {
                this.persistedStats = this.initializePersistedStats();
                this.saveStats();
            }
        } catch (error) {
            logger.error('[VEO3StatsTracker] Error cargando stats:', error.message);
            this.persistedStats = this.initializePersistedStats();
        }
    }

    /**
     * Inicializar estructura de stats persistentes
     */
    initializePersistedStats() {
        return {
            firstGenerationAt: new Date().toISOString(),
            lastGenerationAt: null,
            totalGenerations: 0,
            totalSuccesses: 0,
            totalFailures: 0,
            totalRetries: 0,
            totalCost: 0,
            totalDurationMs: 0,
            successRateOverall: 0,
            averageAttemptsToSuccess: 0,
            averageDurationMs: 0,
            byDay: {}, // {"2025-10-04": {...stats}}
            byWeek: {}, // {"2025-W40": {...stats}}
            byMonth: {} // {"2025-10": {...stats}}
        };
    }

    /**
     * Registrar inicio de generación
     * @param {object} context - Contexto de generación
     */
    recordGenerationStart(context = {}) {
        this.currentSession.totalAttempts++;

        const attempt = {
            attemptId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startedAt: new Date().toISOString(),
            context,
            retries: []
        };

        if (!this.currentSession.currentAttempt) {
            this.currentSession.currentAttempt = attempt;
        }

        return attempt.attemptId;
    }

    /**
     * Registrar retry de generación
     * @param {string} attemptId - ID del intento
     * @param {number} retryNumber - Número de retry
     * @param {object} retryInfo - Info del retry
     */
    recordRetry(attemptId, retryNumber, retryInfo = {}) {
        if (
            this.currentSession.currentAttempt &&
            this.currentSession.currentAttempt.attemptId === attemptId
        ) {
            this.currentSession.currentAttempt.retries.push({
                retryNumber,
                timestamp: new Date().toISOString(),
                ...retryInfo
            });

            this.currentSession.totalRetries++;

            // Trackear estrategia usada
            if (retryInfo.strategy) {
                this.currentSession.strategiesUsed[retryInfo.strategy] =
                    (this.currentSession.strategiesUsed[retryInfo.strategy] || 0) + 1;
            }
        }
    }

    /**
     * Registrar generación exitosa
     * @param {string} attemptId - ID del intento
     * @param {object} result - Resultado de generación
     */
    recordSuccess(attemptId, result = {}) {
        const attempt = this.currentSession.currentAttempt;

        if (attempt && attempt.attemptId === attemptId) {
            const durationMs = Date.now() - new Date(attempt.startedAt).getTime();
            const totalAttempts = 1 + attempt.retries.length;

            this.currentSession.successfulGenerations++;
            this.currentSession.totalCost += result.cost || 0.3;
            this.currentSession.totalDurationMs += durationMs;

            // Agregar a successByAttempt
            this.currentSession.successByAttempt[totalAttempts] =
                (this.currentSession.successByAttempt[totalAttempts] || 0) + 1;

            // Stats de segmento si aplica
            if (result.segmentIndex !== undefined) {
                this.currentSession.segmentStats.push({
                    segmentIndex: result.segmentIndex,
                    success: true,
                    attempts: totalAttempts,
                    durationMs,
                    cost: result.cost || 0.3
                });
            }

            logger.info(
                `[VEO3StatsTracker] ✅ Generación exitosa en ${totalAttempts} intento(s) - ${(durationMs / 1000).toFixed(1)}s`
            );

            this.currentSession.currentAttempt = null;

            // Persistir stats
            this.updatePersistedStats('success', {
                attempts: totalAttempts,
                durationMs,
                cost: result.cost || 0.3
            });
        }
    }

    /**
     * Registrar generación fallida
     * @param {string} attemptId - ID del intento
     * @param {object} error - Error de generación
     */
    recordFailure(attemptId, error = {}) {
        const attempt = this.currentSession.currentAttempt;

        if (attempt && attempt.attemptId === attemptId) {
            const durationMs = Date.now() - new Date(attempt.startedAt).getTime();
            const totalAttempts = 1 + attempt.retries.length;

            this.currentSession.failedGenerations++;
            this.currentSession.totalDurationMs += durationMs;

            // Categorizar error
            const errorCategory = error.errorCategory || 'unknown';
            this.currentSession.errorsByCategory[errorCategory] =
                (this.currentSession.errorsByCategory[errorCategory] || 0) + 1;

            // Stats de segmento si aplica
            if (error.segmentIndex !== undefined) {
                this.currentSession.segmentStats.push({
                    segmentIndex: error.segmentIndex,
                    success: false,
                    attempts: totalAttempts,
                    durationMs,
                    errorCategory
                });
            }

            logger.warn(
                `[VEO3StatsTracker] ❌ Generación fallida después de ${totalAttempts} intento(s) - ${errorCategory}`
            );

            this.currentSession.currentAttempt = null;

            // Persistir stats
            this.updatePersistedStats('failure', {
                attempts: totalAttempts,
                durationMs,
                errorCategory
            });
        }
    }

    /**
     * Actualizar stats persistentes
     */
    updatePersistedStats(type, data = {}) {
        const now = new Date();
        const dateKey = now.toISOString().split('T')[0]; // "2025-10-04"
        const weekKey = this.getWeekKey(now); // "2025-W40"
        const monthKey = now.toISOString().substring(0, 7); // "2025-10"

        this.persistedStats.lastGenerationAt = now.toISOString();
        this.persistedStats.totalGenerations++;

        if (type === 'success') {
            this.persistedStats.totalSuccesses++;
            this.persistedStats.totalCost += data.cost || 0.3;
        } else {
            this.persistedStats.totalFailures++;
        }

        this.persistedStats.totalRetries += data.attempts - 1;
        this.persistedStats.totalDurationMs += data.durationMs || 0;

        // Actualizar rates
        this.persistedStats.successRateOverall =
            this.persistedStats.totalSuccesses / this.persistedStats.totalGenerations;
        this.persistedStats.averageAttemptsToSuccess =
            this.persistedStats.totalRetries / Math.max(this.persistedStats.totalSuccesses, 1);
        this.persistedStats.averageDurationMs =
            this.persistedStats.totalDurationMs / this.persistedStats.totalGenerations;

        // Actualizar agregaciones por tiempo
        this.updateTimeAggregation(this.persistedStats.byDay, dateKey, type, data);
        this.updateTimeAggregation(this.persistedStats.byWeek, weekKey, type, data);
        this.updateTimeAggregation(this.persistedStats.byMonth, monthKey, type, data);

        // Guardar a disco
        this.saveStats();
    }

    /**
     * Actualizar agregación temporal
     */
    updateTimeAggregation(aggregation, key, type, data) {
        if (!aggregation[key]) {
            aggregation[key] = {
                total: 0,
                successes: 0,
                failures: 0,
                totalRetries: 0,
                totalCost: 0,
                totalDurationMs: 0
            };
        }

        const agg = aggregation[key];
        agg.total++;

        if (type === 'success') {
            agg.successes++;
            agg.totalCost += data.cost || 0.3;
        } else {
            agg.failures++;
        }

        agg.totalRetries += data.attempts - 1;
        agg.totalDurationMs += data.durationMs || 0;
        agg.successRate = agg.successes / agg.total;
        agg.averageAttempts = agg.totalRetries / Math.max(agg.successes, 1);
    }

    /**
     * Obtener clave de semana ISO (ej: "2025-W40")
     */
    getWeekKey(date) {
        const yearStart = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((date - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    }

    /**
     * Guardar stats a disco
     */
    saveStats() {
        try {
            fs.writeFileSync(this.statsFile, JSON.stringify(this.persistedStats, null, 2));
        } catch (error) {
            logger.error('[VEO3StatsTracker] Error guardando stats:', error.message);
        }
    }

    /**
     * Obtener reporte de sesión actual
     */
    getSessionReport() {
        const totalGenerations =
            this.currentSession.successfulGenerations + this.currentSession.failedGenerations;
        const successRate =
            totalGenerations > 0
                ? this.currentSession.successfulGenerations / totalGenerations
                : 0;

        const averageDuration =
            totalGenerations > 0 ? this.currentSession.totalDurationMs / totalGenerations / 1000 : 0;

        const averageAttempts =
            this.currentSession.successfulGenerations > 0
                ? (totalGenerations +
                      this.currentSession.totalRetries) /
                  this.currentSession.successfulGenerations
                : 0;

        return {
            sessionStartedAt: this.currentSession.startedAt,
            totalGenerations,
            successfulGenerations: this.currentSession.successfulGenerations,
            failedGenerations: this.currentSession.failedGenerations,
            successRate: (successRate * 100).toFixed(1) + '%',
            totalRetries: this.currentSession.totalRetries,
            averageAttemptsToSuccess: averageAttempts.toFixed(2),
            averageDurationSeconds: averageDuration.toFixed(1),
            totalCost: '$' + this.currentSession.totalCost.toFixed(2),
            successByAttempt: this.currentSession.successByAttempt,
            errorsByCategory: this.currentSession.errorsByCategory,
            strategiesUsed: this.currentSession.strategiesUsed,
            segmentStats: this.currentSession.segmentStats
        };
    }

    /**
     * Obtener reporte histórico
     */
    getHistoricalReport() {
        return {
            overview: {
                firstGenerationAt: this.persistedStats.firstGenerationAt,
                lastGenerationAt: this.persistedStats.lastGenerationAt,
                totalGenerations: this.persistedStats.totalGenerations,
                totalSuccesses: this.persistedStats.totalSuccesses,
                totalFailures: this.persistedStats.totalFailures,
                successRate: (this.persistedStats.successRateOverall * 100).toFixed(1) + '%',
                averageAttemptsToSuccess:
                    this.persistedStats.averageAttemptsToSuccess.toFixed(2),
                averageDurationMinutes: (this.persistedStats.averageDurationMs / 1000 / 60).toFixed(
                    2
                ),
                totalCost: '$' + this.persistedStats.totalCost.toFixed(2)
            },
            byDay: this.persistedStats.byDay,
            byWeek: this.persistedStats.byWeek,
            byMonth: this.persistedStats.byMonth
        };
    }

    /**
     * Log reporte completo
     */
    logReport() {
        const sessionReport = this.getSessionReport();
        const historicalReport = this.getHistoricalReport();

        logger.info('\n' + '='.repeat(80));
        logger.info('[VEO3StatsTracker] 📊 REPORTE DE ESTADÍSTICAS');
        logger.info('='.repeat(80));

        logger.info('\n📈 SESIÓN ACTUAL:');
        logger.info(`   Iniciada: ${sessionReport.sessionStartedAt}`);
        logger.info(`   Total generaciones: ${sessionReport.totalGenerations}`);
        logger.info(`   ✅ Exitosas: ${sessionReport.successfulGenerations}`);
        logger.info(`   ❌ Fallidas: ${sessionReport.failedGenerations}`);
        logger.info(`   Success Rate: ${sessionReport.successRate}`);
        logger.info(`   Reintentos totales: ${sessionReport.totalRetries}`);
        logger.info(`   Intentos promedio/éxito: ${sessionReport.averageAttemptsToSuccess}`);
        logger.info(`   Duración promedio: ${sessionReport.averageDurationSeconds}s`);
        logger.info(`   Costo total: ${sessionReport.totalCost}`);

        if (Object.keys(sessionReport.successByAttempt).length > 0) {
            logger.info('\n   Éxitos por intento:');
            Object.entries(sessionReport.successByAttempt).forEach(([attempt, count]) => {
                logger.info(`     Intento ${attempt}: ${count} éxitos`);
            });
        }

        if (Object.keys(sessionReport.errorsByCategory).length > 0) {
            logger.info('\n   Errores por categoría:');
            Object.entries(sessionReport.errorsByCategory).forEach(([category, count]) => {
                logger.info(`     ${category}: ${count}`);
            });
        }

        logger.info('\n📊 HISTÓRICO GLOBAL:');
        logger.info(`   Generaciones totales: ${historicalReport.overview.totalGenerations}`);
        logger.info(`   Success Rate: ${historicalReport.overview.successRate}`);
        logger.info(
            `   Intentos promedio/éxito: ${historicalReport.overview.averageAttemptsToSuccess}`
        );
        logger.info(
            `   Duración promedio: ${historicalReport.overview.averageDurationMinutes} min`
        );
        logger.info(`   Costo total: ${historicalReport.overview.totalCost}`);

        logger.info('\n' + '='.repeat(80));
    }

    /**
     * Resetear stats de sesión actual
     */
    resetSession() {
        this.currentSession = {
            startedAt: new Date().toISOString(),
            totalAttempts: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            totalRetries: 0,
            totalCost: 0,
            totalDurationMs: 0,
            successByAttempt: {},
            errorsByCategory: {},
            strategiesUsed: {},
            segmentStats: []
        };

        logger.info('[VEO3StatsTracker] Sesión reseteada');
    }
}

// Singleton instance
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new VEO3StatsTracker();
        }
        return instance;
    },
    VEO3StatsTracker
};
