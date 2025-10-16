/**
 * Cron Scheduler para Generación Automática de Chollos
 *
 * Genera videos virales de chollos Fantasy La Liga automáticamente
 * usando BargainAnalyzer + VEO3 + Nano Banana
 *
 * Frecuencia configurable vía ENV: CHOLLOS_CRON_SCHEDULE
 * Default: '0 8 * * *' (8:00 AM diario)
 */

const cron = require('node-cron');
const logger = require('../../utils/logger');
const axios = require('axios');

class ChollosScheduler {
    constructor() {
        // Configuración del cron desde ENV o default
        this.schedule = process.env.CHOLLOS_CRON_SCHEDULE || '0 8 * * *'; // 8 AM diario
        this.enabled = process.env.CHOLLOS_CRON_ENABLED !== 'false'; // Activado por default
        this.serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        this.task = null;
        this.lastRun = null;
        this.nextRun = null;
        this.stats = {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            lastError: null
        };

        logger.info('[ChollosScheduler] ✅ Inicializado');
        logger.info(`[ChollosScheduler] Horario: ${this.schedule}`);
        logger.info(`[ChollosScheduler] Estado: ${this.enabled ? 'ACTIVO' : 'DESACTIVADO'}`);
    }

    /**
     * Iniciar cron job
     */
    start() {
        if (!this.enabled) {
            logger.info('[ChollosScheduler] ⏸️  Cron desactivado por configuración');
            return;
        }

        // Validar formato de cron
        if (!cron.validate(this.schedule)) {
            logger.error(`[ChollosScheduler] ❌ Formato de cron inválido: ${this.schedule}`);
            return;
        }

        this.task = cron.schedule(this.schedule, async () => {
            await this.executeJob();
        });

        // Calcular próxima ejecución
        this.nextRun = this.getNextRun();

        logger.info('[ChollosScheduler] 🚀 Cron job iniciado');
        logger.info(`[ChollosScheduler] Próxima ejecución: ${this.nextRun}`);
    }

    /**
     * Ejecutar tarea de generación de chollos
     */
    async executeJob() {
        const startTime = Date.now();
        this.lastRun = new Date().toISOString();
        this.stats.totalRuns++;

        logger.info('\n╔══════════════════════════════════════════════════════════════╗');
        logger.info('║  🤖 CRON JOB: Generación Automática de Chollos           ║');
        logger.info('╚══════════════════════════════════════════════════════════════╝\n');
        logger.info(`[ChollosScheduler] 🕐 Inicio: ${this.lastRun}`);

        try {
            // Paso 1: Obtener top chollo del día
            logger.info('[ChollosScheduler] 📊 Paso 1/4: Analizando bargains...');
            const bargainsResponse = await axios.get(`${this.serverUrl}/api/bargains/top`, {
                timeout: 120000 // 2 min para análisis inicial de bargains
            });

            if (!bargainsResponse.data.success || bargainsResponse.data.bargains.length === 0) {
                throw new Error('No se encontraron chollos disponibles');
            }

            const topBargain = bargainsResponse.data.bargains[0];
            logger.info(
                `[ChollosScheduler] ✅ Top chollo: ${topBargain.name} (${topBargain.team})`
            );
            logger.info(
                `[ChollosScheduler]    💰 Precio: €${topBargain.price} | Ratio: ${topBargain.valueRatio.toFixed(2)}`
            );

            // Paso 2: Preparar sesión VEO3 (Fase 1: Script + Nano Banana)
            logger.info(
                '[ChollosScheduler] 🎬 Paso 2/4: Preparando sesión VEO3 (script + imágenes)...'
            );
            const prepareResponse = await axios.post(
                `${this.serverUrl}/api/veo3/prepare-session`,
                {
                    contentType: 'chollo',
                    playerData: {
                        name: topBargain.name,
                        team: topBargain.team,
                        position: topBargain.position,
                        price: topBargain.price,
                        stats: topBargain.stats
                    },
                    presenter: 'ana', // Ana para chollos virales
                    preset: 'viral_3seg',
                    bargainData: {
                        valueRatio: topBargain.valueRatio,
                        expectedPoints: topBargain.expectedPoints,
                        trend: topBargain.trend || 'ascending'
                    }
                },
                { timeout: 300000 } // 5 min para Nano Banana
            );

            if (!prepareResponse.data.success) {
                throw new Error(`Fase 1 falló: ${prepareResponse.data.message}`);
            }

            const sessionId = prepareResponse.data.data.sessionId;
            logger.info(`[ChollosScheduler] ✅ Fase 1 completada`);
            logger.info(`[ChollosScheduler]    📁 Session ID: ${sessionId}`);
            logger.info(
                `[ChollosScheduler]    🖼️  Imágenes: ${prepareResponse.data.data.nanoBananaImages.length}`
            );

            // Paso 3: Generar 3 segmentos de video (Fase 2)
            logger.info('[ChollosScheduler] 🎥 Paso 3/4: Generando 3 segmentos de video...');

            const segmentPromises = [0, 1, 2].map(async segmentIndex => {
                logger.info(`[ChollosScheduler]    🔄 Generando segmento ${segmentIndex + 1}/3...`);
                const segmentResponse = await axios.post(
                    `${this.serverUrl}/api/veo3/generate-segment`,
                    {
                        sessionId,
                        segmentIndex
                    },
                    { timeout: 300000 } // 5 min por segmento
                );

                if (!segmentResponse.data.success) {
                    throw new Error(`Segmento ${segmentIndex + 1} falló`);
                }

                logger.info(`[ChollosScheduler]    ✅ Segmento ${segmentIndex + 1} completado`);
                return segmentResponse.data;
            });

            await Promise.all(segmentPromises);

            // Paso 4: Finalizar video (Fase 3: Concatenar + Logo)
            logger.info(
                '[ChollosScheduler] 🎬 Paso 4/4: Finalizando video (concatenación + logo)...'
            );
            const finalizeResponse = await axios.post(
                `${this.serverUrl}/api/veo3/finalize-session`,
                { sessionId },
                { timeout: 120000 } // 2 min para concatenar
            );

            if (!finalizeResponse.data.success) {
                throw new Error(`Finalización falló: ${finalizeResponse.data.message}`);
            }

            const videoUrl = finalizeResponse.data.data.finalVideoUrl;
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            logger.info('\n╔══════════════════════════════════════════════════════════════╗');
            logger.info('║  ✅ VIDEO CHOLLO GENERADO EXITOSAMENTE                    ║');
            logger.info('╚══════════════════════════════════════════════════════════════╝\n');
            logger.info(`[ChollosScheduler] 🎉 Player: ${topBargain.name}`);
            logger.info(`[ChollosScheduler] 📹 Video: ${videoUrl.substring(0, 80)}...`);
            logger.info(`[ChollosScheduler] ⏱️  Duración: ${duration}s`);
            logger.info(
                `[ChollosScheduler] 💰 Costo: $${finalizeResponse.data.data.totalCost.toFixed(3)}`
            );

            this.stats.successfulRuns++;
            this.stats.lastError = null;

            // TODO: Aquí se puede agregar la publicación automática a Instagram vía n8n
            // await this.publishToInstagram(videoUrl, topBargain);
        } catch (error) {
            this.stats.failedRuns++;
            this.stats.lastError = error.message;

            logger.error('\n╔══════════════════════════════════════════════════════════════╗');
            logger.error('║  ❌ ERROR EN GENERACIÓN DE CHOLLO                         ║');
            logger.error('╚══════════════════════════════════════════════════════════════╝\n');
            logger.error(`[ChollosScheduler] ❌ Error: ${error.message}`);

            if (error.response) {
                logger.error(`[ChollosScheduler]    Status: ${error.response.status}`);
                logger.error(`[ChollosScheduler]    Data:`, error.response.data);
            }
        } finally {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            this.nextRun = this.getNextRun();

            logger.info(`[ChollosScheduler] ⏱️  Duración total: ${duration}s`);
            logger.info(
                `[ChollosScheduler] 📊 Stats: ${this.stats.successfulRuns}/${this.stats.totalRuns} exitosos`
            );
            logger.info(`[ChollosScheduler] 🕐 Próxima ejecución: ${this.nextRun}\n`);
        }
    }

    /**
     * Detener cron job
     */
    stop() {
        if (this.task) {
            this.task.stop();
            logger.info('[ChollosScheduler] ⏹️  Cron job detenido');
        }
    }

    /**
     * Obtener estadísticas del scheduler
     */
    getStats() {
        return {
            enabled: this.enabled,
            schedule: this.schedule,
            lastRun: this.lastRun,
            nextRun: this.nextRun,
            stats: this.stats
        };
    }

    /**
     * Calcular próxima ejecución (aproximado)
     */
    getNextRun() {
        // Parsear cron schedule (formato: minuto hora dia mes diasemana)
        const parts = this.schedule.split(' ');
        if (parts.length !== 5) {
            return 'Formato inválido';
        }

        const [minute, hour] = parts;

        const now = new Date();
        const next = new Date();

        // Si es formato simple (ej: '0 8 * * *')
        if (minute !== '*' && hour !== '*') {
            next.setHours(parseInt(hour));
            next.setMinutes(parseInt(minute));
            next.setSeconds(0);

            // Si ya pasó hoy, mover a mañana
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
        }

        return next.toISOString();
    }

    /**
     * Ejecutar job manualmente (para testing)
     */
    async runNow() {
        logger.info('[ChollosScheduler] 🚀 Ejecución manual iniciada');
        await this.executeJob();
    }
}

module.exports = ChollosScheduler;
