const logger = require('../../utils/logger');
const VEO3ErrorAnalyzer = require('./veo3ErrorAnalyzer');
const { getInstance: getStatsTracker } = require('./veo3StatsTracker');

/**
 * VEO3RetryManager - Sistema de reintentos inteligentes para VEO3
 *
 * Automatiza el proceso de retry cuando VEO3/Google bloquean contenido:
 * 1. Detecta error con análisis automático
 * 2. Selecciona mejor fix según confianza
 * 3. Modifica prompt con fix aplicado
 * 4. Reintenta generación
 * 5. Itera hasta éxito o max intentos
 *
 * Características:
 * - Retry inteligente con mejora progresiva
 * - Múltiples estrategias de fix ordenadas por confianza
 * - Delay exponencial entre intentos
 * - Historial de intentos para debugging
 * - Integración completa con VEO3ErrorAnalyzer
 * - ✅ Stats tracking automático (4 Oct 2025)
 */
class VEO3RetryManager {
    constructor(veo3Client) {
        this.veo3Client = veo3Client;
        this.errorAnalyzer = new VEO3ErrorAnalyzer();
        this.statsTracker = getStatsTracker(); // ✅ NUEVO: Tracking automático

        // ✅ ACTUALIZADO (4 Oct 2025): Usar variables coherentes con .env
        this.maxAttempts = parseInt(process.env.VEO3_MAX_RETRIES) || 3;
        this.baseDelay = parseInt(process.env.VEO3_RETRY_BACKOFF_BASE) || 120000; // 2 min
        this.backoffMultiplier = parseInt(process.env.VEO3_RETRY_BACKOFF_MULTIPLIER) || 2;
        this.useExponentialBackoff = process.env.VEO3_EXPONENTIAL_BACKOFF !== 'false';

        logger.info(`[VEO3RetryManager] Configurado: ${this.maxAttempts} intentos, base delay ${this.baseDelay}ms, multiplier ${this.backoffMultiplier}x`);
        logger.info(`[VEO3RetryManager] Stats tracking: ACTIVO`);
    }

    /**
     * Generar video con retry automático inteligente
     *
     * @param {string} originalPrompt - Prompt original
     * @param {object} options - Opciones VEO3
     * @param {object} context - Contexto adicional (playerName, team, etc.)
     * @returns {Promise<object>} - Video generado exitosamente
     */
    async generateWithRetry(originalPrompt, options = {}, context = {}) {
        const attemptHistory = [];
        let currentPrompt = originalPrompt;
        let lastError = null;
        let lastAnalysis = null;

        // ✅ NUEVO: Registrar inicio en stats tracker
        const attemptId = this.statsTracker.recordGenerationStart(context);

        logger.info(`[VEO3RetryManager] Iniciando generación con retry automático`);
        logger.info(`[VEO3RetryManager] Max intentos: ${this.maxAttempts}`);
        logger.info(`[VEO3RetryManager] Prompt original: "${originalPrompt.substring(0, 100)}..."`);
        logger.info(`[VEO3RetryManager] Attempt ID: ${attemptId}`);

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            logger.info(`\n${'─'.repeat(80)}`);
            logger.info(`[VEO3RetryManager] 🔄 INTENTO ${attempt}/${this.maxAttempts}`);
            logger.info(`${'─'.repeat(80)}`);

            // Registrar intento (FUERA del try para que esté disponible en catch)
            const attemptInfo = {
                attempt,
                prompt: currentPrompt,
                timestamp: new Date().toISOString(),
                strategy: attempt === 1 ? 'ORIGINAL' : lastAnalysis?.suggestedFixes[0]?.strategy,
                confidence: attempt === 1 ? 1.0 : lastAnalysis?.suggestedFixes[0]?.confidence
            };

            try {

                logger.info(`[VEO3RetryManager] Prompt actual: "${currentPrompt.substring(0, 150)}..."`);
                if (attemptInfo.strategy && attemptInfo.strategy !== 'ORIGINAL') {
                    logger.info(`[VEO3RetryManager] Estrategia: ${attemptInfo.strategy} (${(attemptInfo.confidence * 100).toFixed(0)}% confianza)`);
                }

                // Intentar generar video
                logger.info(`[VEO3RetryManager] ⏳ Generando video...`);
                const initResult = await this.veo3Client.generateVideo(currentPrompt, options);

                if (initResult.code !== 200 || !initResult.data?.taskId) {
                    throw new Error(`Error iniciando generación: ${initResult.msg || 'Unknown error'}`);
                }

                const taskId = initResult.data.taskId;
                logger.info(`[VEO3RetryManager] ✅ Video iniciado, taskId: ${taskId}`);

                // Esperar completar (aquí es donde puede fallar)
                logger.info(`[VEO3RetryManager] ⏳ Esperando completar...`);
                const video = await this.veo3Client.waitForCompletion(taskId, undefined, currentPrompt);

                // ✅ ÉXITO
                attemptInfo.result = 'SUCCESS';
                attemptInfo.video = video;
                attemptHistory.push(attemptInfo);

                logger.info(`\n${'='.repeat(80)}`);
                logger.info(`[VEO3RetryManager] ✅ ÉXITO en intento ${attempt}/${this.maxAttempts}`);
                logger.info(`${'='.repeat(80)}`);
                logger.info(`[VEO3RetryManager] Platform: ${video.platform}`);
                logger.info(`[VEO3RetryManager] Duración: ${video.duration}s`);
                logger.info(`[VEO3RetryManager] Costo: $${video.cost}`);

                if (attempt > 1) {
                    logger.info(`[VEO3RetryManager] 🎯 Fix exitoso aplicado: ${attemptInfo.strategy}`);
                    logger.info(`[VEO3RetryManager] 📊 Total intentos necesarios: ${attempt}`);
                }

                // ✅ NUEVO: Registrar éxito en stats tracker
                this.statsTracker.recordSuccess(attemptId, {
                    cost: video.cost,
                    segmentIndex: context.segmentIndex
                });

                // Retornar resultado con metadata de retry
                return {
                    ...video,
                    retryMetadata: {
                        totalAttempts: attempt,
                        successfulStrategy: attemptInfo.strategy,
                        attemptHistory,
                        originalPrompt,
                        finalPrompt: currentPrompt
                    }
                };

            } catch (error) {
                // ❌ ERROR - Analizar y preparar retry
                lastError = error;

                attemptInfo.result = 'FAILED';
                attemptInfo.error = error.message;

                // Si el error tiene análisis adjunto (de VEO3Client.waitForCompletion)
                if (error.analysis) {
                    lastAnalysis = error.analysis;
                    attemptInfo.analysis = lastAnalysis;

                    logger.warn(`[VEO3RetryManager] ❌ Intento ${attempt} falló: ${error.message}`);
                    logger.warn(`[VEO3RetryManager] 🔍 Análisis automático:`);
                    logger.warn(`   Error Category: ${lastAnalysis.errorCategory}`);
                    logger.warn(`   Triggers detectados: ${lastAnalysis.likelyTriggers.length}`);
                    logger.warn(`   Confianza análisis: ${(lastAnalysis.confidence * 100).toFixed(0)}%`);

                    if (lastAnalysis.suggestedFixes.length > 0) {
                        logger.warn(`\n   💡 Fixes disponibles:`);
                        lastAnalysis.suggestedFixes.slice(0, 3).forEach((fix, i) => {
                            logger.warn(`   ${i + 1}. ${fix.strategy} (${(fix.confidence * 100).toFixed(0)}% confianza)`);
                            logger.warn(`      ${fix.description}`);
                            if (fix.example) {
                                logger.warn(`      Ej: ${fix.example}`);
                            }
                        });
                    }
                } else {
                    // Error sin análisis (timeout, network, etc.)
                    logger.error(`[VEO3RetryManager] ❌ Intento ${attempt} falló sin análisis: ${error.message}`);
                }

                attemptHistory.push(attemptInfo);

                // Si es el último intento, lanzar error
                if (attempt === this.maxAttempts) {
                    logger.error(`\n${'='.repeat(80)}`);
                    logger.error(`[VEO3RetryManager] ❌ FALLO TOTAL después de ${this.maxAttempts} intentos`);
                    logger.error(`${'='.repeat(80)}`);
                    logger.error(`[VEO3RetryManager] Último error: ${lastError.message}`);

                    // ✅ NUEVO: Registrar fallo en stats tracker
                    this.statsTracker.recordFailure(attemptId, {
                        errorCategory: lastAnalysis?.errorCategory || 'unknown',
                        segmentIndex: context.segmentIndex
                    });

                    // Construir error detallado
                    const finalError = new Error(
                        `VEO3 generación falló después de ${this.maxAttempts} intentos: ${lastError.message}`
                    );
                    finalError.attemptHistory = attemptHistory;
                    finalError.lastAnalysis = lastAnalysis;
                    throw finalError;
                }

                // Preparar siguiente intento con fix
                logger.info(`\n[VEO3RetryManager] 🔄 Preparando intento ${attempt + 1}/${this.maxAttempts}...`);

                let selectedStrategy = null;

                if (lastAnalysis && lastAnalysis.suggestedFixes.length > 0) {
                    // Seleccionar fix con mayor confianza que aún no hayamos probado
                    const usedStrategies = attemptHistory
                        .filter(a => a.strategy && a.strategy !== 'ORIGINAL')
                        .map(a => a.strategy);

                    let selectedFix = null;
                    for (const fix of lastAnalysis.suggestedFixes) {
                        if (!usedStrategies.includes(fix.strategy)) {
                            selectedFix = fix;
                            break;
                        }
                    }

                    if (selectedFix) {
                        selectedStrategy = selectedFix.strategy;

                        logger.info(`[VEO3RetryManager] 🎯 Aplicando fix: ${selectedFix.strategy}`);
                        logger.info(`[VEO3RetryManager] 📝 ${selectedFix.description}`);
                        logger.info(`[VEO3RetryManager] 💪 Confianza: ${(selectedFix.confidence * 100).toFixed(0)}%`);

                        // Aplicar fix al prompt
                        currentPrompt = selectedFix.implementation;

                        logger.info(`[VEO3RetryManager] ✏️  Prompt modificado: "${currentPrompt.substring(0, 150)}..."`);
                    } else {
                        logger.warn(`[VEO3RetryManager] ⚠️  No hay más fixes disponibles, reintentando con último prompt`);
                    }
                } else {
                    logger.warn(`[VEO3RetryManager] ⚠️  Sin análisis disponible, reintentando con prompt original`);
                    currentPrompt = originalPrompt;
                }

                // ✅ NUEVO: Registrar retry en stats tracker
                this.statsTracker.recordRetry(attemptId, attempt, {
                    strategy: selectedStrategy,
                    errorCategory: lastAnalysis?.errorCategory
                });

                // Delay antes del siguiente intento
                const delay = this.calculateDelay(attempt);
                logger.info(`[VEO3RetryManager] ⏳ Esperando ${(delay / 1000).toFixed(0)}s antes del siguiente intento...`);
                await this.sleep(delay);
            }
        }

        // No debería llegar aquí, pero por si acaso
        throw new Error('Max retry attempts reached without success or final error');
    }

    /**
     * Calcular delay para siguiente intento
     * ✅ ACTUALIZADO (4 Oct 2025): Usa backoffMultiplier configurable
     *
     * @param {number} attempt - Número de intento actual
     * @returns {number} - Delay en milisegundos
     */
    calculateDelay(attempt) {
        if (!this.useExponentialBackoff) {
            return this.baseDelay;
        }

        // Exponential backoff: baseDelay * multiplier^(attempt-1)
        // Con baseDelay=120000ms (2min), multiplier=2:
        // Intento 1: 120s (2 min)
        // Intento 2: 240s (4 min)
        // Intento 3: 480s (8 min)
        const exponentialDelay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1);

        // Cap máximo de 10 minutos
        return Math.min(exponentialDelay, 600000);
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generar múltiples segmentos con retry automático
     *
     * @param {Array} segments - Array de objetos {label, prompt}
     * @param {object} options - Opciones VEO3
     * @returns {Promise<Array>} - Array de videos generados
     */
    async generateMultipleWithRetry(segments, options = {}) {
        const results = [];

        logger.info(`[VEO3RetryManager] Generando ${segments.length} segmentos con retry automático`);

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            logger.info(`\n${'='.repeat(80)}`);
            logger.info(`[VEO3RetryManager] 📹 SEGMENTO ${i + 1}/${segments.length}`);
            logger.info(`[VEO3RetryManager] Label: ${segment.label}`);
            logger.info(`${'='.repeat(80)}`);

            try {
                const video = await this.generateWithRetry(segment.prompt, options, segment.context || {});

                results.push({
                    segmentIndex: i,
                    label: segment.label,
                    video,
                    success: true
                });

                logger.info(`[VEO3RetryManager] ✅ Segmento ${i + 1}/${segments.length} completado`);

            } catch (error) {
                logger.error(`[VEO3RetryManager] ❌ Segmento ${i + 1}/${segments.length} falló definitivamente`);

                results.push({
                    segmentIndex: i,
                    label: segment.label,
                    error: error.message,
                    attemptHistory: error.attemptHistory,
                    success: false
                });

                // Decidir si continuar o abortar
                if (process.env.VEO3_ABORT_ON_SEGMENT_FAIL === 'true') {
                    throw new Error(`Generación abortada en segmento ${i + 1}: ${error.message}`);
                }

                logger.warn(`[VEO3RetryManager] ⚠️  Continuando con siguientes segmentos...`);
            }
        }

        // Resumen final
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        logger.info(`\n${'='.repeat(80)}`);
        logger.info(`[VEO3RetryManager] 📊 RESUMEN GENERACIÓN MÚLTIPLE`);
        logger.info(`${'='.repeat(80)}`);
        logger.info(`[VEO3RetryManager] Total segmentos: ${segments.length}`);
        logger.info(`[VEO3RetryManager] ✅ Exitosos: ${successCount}`);
        logger.info(`[VEO3RetryManager] ❌ Fallidos: ${failCount}`);

        return results;
    }

    /**
     * Obtener estadísticas de retry manager
     * ✅ ACTUALIZADO (4 Oct 2025): Incluye stats tracker completo
     */
    getStats() {
        return {
            configuration: {
                maxAttempts: this.maxAttempts,
                baseDelay: this.baseDelay,
                backoffMultiplier: this.backoffMultiplier,
                useExponentialBackoff: this.useExponentialBackoff
            },
            currentSession: this.statsTracker.getSessionReport(),
            historical: this.statsTracker.getHistoricalReport(),
            errorAnalyzer: this.errorAnalyzer.getErrorStats()
        };
    }

    /**
     * Log reporte completo de estadísticas
     */
    logStatsReport() {
        this.statsTracker.logReport();
    }
}

module.exports = VEO3RetryManager;
