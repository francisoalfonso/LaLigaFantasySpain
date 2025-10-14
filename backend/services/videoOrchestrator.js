/**
 * Video Orchestrator
 *
 * Orquestador maestro que gestiona la cola centralizada de automatizaciones
 * Respeta rate limits, prioridades y capacidades de APIs
 *
 * RESPONSABILIDADES:
 * - Consumir automation_queue de forma segura
 * - Respetar límites de concurrencia por proveedor (VEO3: 2, OpenAI: 5, etc.)
 * - Ejecutar trabajos según prioridad y deadline
 * - Reintentar fallos automáticamente
 * - Monitorear trabajos stuck
 */

const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class VideoOrchestrator {
    constructor() {
        this.isRunning = false;
        this.pollInterval = null;
        this.processingJobs = new Map(); // job_id → started_at

        // Configuración de capacidades por proveedor
        this.providerLimits = {
            veo3: {
                maxConcurrent: 2, // Max 2 videos VEO3 simultáneos
                minIntervalMs: 10000, // Mínimo 10s entre inicios
                estimatedDurationSeconds: 300 // ~5 min por video
            },
            openai: {
                maxConcurrent: 5,
                minIntervalMs: 1000,
                estimatedDurationSeconds: 10
            },
            instagram: {
                maxConcurrent: 3,
                minIntervalMs: 5000,
                estimatedDurationSeconds: 30
            }
        };

        this.lastJobStart = {}; // provider → timestamp
    }

    /**
     * Iniciar orquestador (polling)
     */
    async start() {
        if (this.isRunning) {
            logger.warn('[VideoOrchestrator] Ya está ejecutándose');
            return;
        }

        logger.info('[VideoOrchestrator] 🎬 Iniciando orquestador de videos');
        this.isRunning = true;

        // Polling cada 10 segundos
        this.pollInterval = setInterval(async () => {
            await this.processQueue();
        }, 10000);

        // Primera ejecución inmediata
        await this.processQueue();
    }

    /**
     * Detener orquestador
     */
    stop() {
        logger.info('[VideoOrchestrator] ⏹️  Deteniendo orquestador');
        this.isRunning = false;

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Procesar cola (llamado cada 10s)
     */
    async processQueue() {
        if (!this.isRunning) {
            return;
        }

        try {
            // 1. Limpiar trabajos stuck (>2x duración estimada)
            await this._cleanupStuckJobs();

            // 2. Para cada proveedor, verificar capacidad y procesar siguiente job
            for (const provider of ['veo3', 'openai', 'instagram']) {
                await this._processProviderQueue(provider);
            }
        } catch (error) {
            logger.error('[VideoOrchestrator] Error procesando cola', {
                error: error.message
            });
        }
    }

    /**
     * Procesar cola de un proveedor específico
     * @private
     */
    async _processProviderQueue(provider) {
        try {
            // 1. Verificar capacidad disponible
            const capacity = await this._getProviderCapacity(provider);

            if (!capacity.is_available) {
                logger.debug(`[VideoOrchestrator] ${provider}: Sin capacidad disponible`, capacity);
                return;
            }

            // 2. Verificar intervalo mínimo desde último inicio
            const limits = this.providerLimits[provider];
            const lastStart = this.lastJobStart[provider] || 0;
            const timeSinceLastStart = Date.now() - lastStart;

            if (timeSinceLastStart < limits.minIntervalMs) {
                logger.debug(`[VideoOrchestrator] ${provider}: Esperando intervalo mínimo`);
                return;
            }

            // 3. Obtener siguiente trabajo pendiente para este proveedor
            const job = await this._getNextJob(provider);

            if (!job) {
                logger.debug(`[VideoOrchestrator] ${provider}: No hay trabajos pendientes`);
                return;
            }

            // 4. Iniciar trabajo
            logger.info(`[VideoOrchestrator] 🚀 Iniciando trabajo ${job.id}`, {
                type: job.job_type,
                title: job.title,
                provider
            });

            await this._startJob(job);
            this.lastJobStart[provider] = Date.now();

            // 5. Ejecutar trabajo (async, no bloquea)
            this._executeJob(job).catch(error => {
                logger.error(`[VideoOrchestrator] Error ejecutando job ${job.id}`, {
                    error: error.message
                });
            });
        } catch (error) {
            logger.error(`[VideoOrchestrator] Error en _processProviderQueue(${provider})`, {
                error: error.message
            });
        }
    }

    /**
     * Obtener capacidad disponible de un proveedor
     * @private
     */
    async _getProviderCapacity(provider) {
        const { data, error } = await supabase.rpc('get_available_capacity', {
            provider_name: provider
        });

        if (error) {
            logger.error('[VideoOrchestrator] Error obteniendo capacidad', {
                provider,
                error: error.message
            });
            // Asumir no disponible en caso de error
            return { is_available: false };
        }

        return data;
    }

    /**
     * Obtener siguiente trabajo pendiente para un proveedor
     * @private
     */
    async _getNextJob(provider) {
        const { data, error } = await supabase
            .from('automation_queue')
            .select('*')
            .eq('status', 'queued')
            .eq('api_provider', provider)
            .lte('schedule_after', new Date().toISOString())
            .order('priority', { ascending: true })
            .order('deadline', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found - no hay trabajos pendientes
                return null;
            }
            logger.error('[VideoOrchestrator] Error obteniendo siguiente job', {
                provider,
                error: error.message
            });
            return null;
        }

        return data;
    }

    /**
     * Marcar trabajo como iniciado
     * @private
     */
    async _startJob(job) {
        const { error } = await supabase.rpc('start_job', {
            job_id: job.id
        });

        if (error) {
            logger.error('[VideoOrchestrator] Error iniciando job', {
                jobId: job.id,
                error: error.message
            });
            throw error;
        }

        this.processingJobs.set(job.id, Date.now());
    }

    /**
     * Ejecutar trabajo (async)
     * @private
     */
    async _executeJob(job) {
        try {
            logger.info(`[VideoOrchestrator] ⚙️  Ejecutando ${job.job_type}`, {
                jobId: job.id,
                title: job.title
            });

            let result;

            // Routing según tipo de trabajo
            switch (job.job_type) {
                case 'veo3_chollo':
                case 'veo3_competitive_response':
                case 'veo3_player_spotlight':
                case 'veo3_breaking':
                    result = await this._executeVEO3Job(job);
                    break;

                case 'instagram_reel':
                case 'instagram_carousel':
                    result = await this._executeInstagramJob(job);
                    break;

                case 'tiktok_video':
                    result = await this._executeTikTokJob(job);
                    break;

                default:
                    throw new Error(`Tipo de trabajo no soportado: ${job.job_type}`);
            }

            // Completar trabajo
            await this._completeJob(job.id, result);

            // Actualizar recomendación si existe
            if (job.recommendation_id) {
                await this._updateRecommendationAfterPublish(job.recommendation_id, result);
            }
        } catch (error) {
            logger.error(`[VideoOrchestrator] ❌ Error ejecutando job ${job.id}`, {
                error: error.message,
                stack: error.stack
            });

            await this._failJob(job.id, error.message, { stack: error.stack });
        } finally {
            this.processingJobs.delete(job.id);
        }
    }

    /**
     * Ejecutar trabajo VEO3
     * @private
     */
    async _executeVEO3Job(job) {
        // TODO: Integrar con viralVideoBuilder.js
        logger.info('[VideoOrchestrator] Ejecutando trabajo VEO3', { jobId: job.id });

        // Por ahora, simular ejecución
        await this._sleep(5000); // Simular 5s de procesamiento

        // En producción, esto llamaría a:
        // const viralVideoBuilder = require('./veo3/viralVideoBuilder');
        // const result = await viralVideoBuilder.generateFromRecommendation(job.job_config);

        return {
            session_id: `session_${job.job_type}_${Date.now()}`,
            video_path: `/output/veo3/sessions/session_${Date.now()}/final.mp4`,
            duration: 24,
            cost: 1.5
        };
    }

    /**
     * Ejecutar trabajo Instagram
     * @private
     */
    async _executeInstagramJob(job) {
        logger.info('[VideoOrchestrator] Ejecutando trabajo Instagram', { jobId: job.id });

        try {
            const instagramPublisher = require('./instagramPublisher');

            // Verificar que está configurado
            if (!instagramPublisher.isConfigured()) {
                throw new Error('InstagramPublisher no está configurado. Ver docs/INSTAGRAM_SETUP_CREDENTIALS.md');
            }

            // Obtener configuración del trabajo
            const { videoUrl, caption, coverUrl, locationId, shareToFeed } = job.job_config;

            if (!videoUrl) {
                throw new Error('job_config debe incluir videoUrl');
            }

            if (!caption) {
                throw new Error('job_config debe incluir caption');
            }

            // Publicar Reel
            const result = await instagramPublisher.publishReel({
                videoUrl,
                caption,
                coverUrl,
                locationId,
                shareToFeed: shareToFeed !== false // default true
            });

            if (!result.success) {
                throw new Error(result.error || 'Error publicando en Instagram');
            }

            logger.info('✅ [VideoOrchestrator] Reel publicado en Instagram', {
                postId: result.postId,
                permalink: result.permalink
            });

            return {
                instagram_id: result.postId,
                url: result.permalink,
                cost: 0, // Instagram API es gratis
                publishedAt: result.publishedAt
            };
        } catch (error) {
            logger.error('❌ [VideoOrchestrator] Error en _executeInstagramJob', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Ejecutar trabajo TikTok
     * @private
     */
    async _executeTikTokJob(job) {
        logger.info('[VideoOrchestrator] Ejecutando trabajo TikTok', { jobId: job.id });

        // TODO: Integrar con TikTok API
        await this._sleep(2000);

        return {
            tiktok_id: `video_${Date.now()}`,
            url: `https://tiktok.com/@user/video/${Date.now()}`,
            cost: 0
        };
    }

    /**
     * Completar trabajo
     * @private
     */
    async _completeJob(jobId, result) {
        const { error } = await supabase.rpc('complete_job', {
            job_id: jobId,
            result_data_param: result,
            actual_cost_param: result.cost || null,
            output_urls_param: { video_url: result.video_path || result.url }
        });

        if (error) {
            logger.error('[VideoOrchestrator] Error completando job', {
                jobId,
                error: error.message
            });
            throw error;
        }

        logger.info(`[VideoOrchestrator] ✅ Trabajo ${jobId} completado`);
    }

    /**
     * Marcar trabajo como fallido
     * @private
     */
    async _failJob(jobId, errorMessage, errorDetails = {}) {
        const { error } = await supabase.rpc('fail_job', {
            job_id: jobId,
            error_message_param: errorMessage,
            error_details_param: errorDetails
        });

        if (error) {
            logger.error('[VideoOrchestrator] Error marcando job como fallido', {
                jobId,
                error: error.message
            });
        }
    }

    /**
     * Actualizar recomendación después de publicar
     * @private
     */
    async _updateRecommendationAfterPublish(recommendationId, result) {
        try {
            await supabase.rpc('publish_recommendation', {
                recommendation_id: recommendationId,
                youtube_url: result.video_path || null,
                instagram_url: result.url || null,
                session_id: result.session_id || null
            });

            logger.info('[VideoOrchestrator] Recomendación actualizada', {
                recommendationId
            });
        } catch (error) {
            logger.error('[VideoOrchestrator] Error actualizando recomendación', {
                recommendationId,
                error: error.message
            });
        }
    }

    /**
     * Limpiar trabajos stuck (>2x duración estimada)
     * @private
     */
    async _cleanupStuckJobs() {
        try {
            const { data: stuckJobs, error } = await supabase
                .from('automation_queue')
                .select('id, job_type, started_at, estimated_duration_seconds')
                .eq('status', 'processing');

            if (error || !stuckJobs) {
                return;
            }

            const now = Date.now();

            for (const job of stuckJobs) {
                const startedAt = new Date(job.started_at).getTime();
                const elapsed = (now - startedAt) / 1000; // segundos
                const maxDuration = (job.estimated_duration_seconds || 300) * 2;

                if (elapsed > maxDuration) {
                    logger.warn('[VideoOrchestrator] Trabajo stuck detectado', {
                        jobId: job.id,
                        type: job.job_type,
                        elapsedSeconds: elapsed,
                        maxSeconds: maxDuration
                    });

                    await this._failJob(
                        job.id,
                        `Trabajo stuck (${elapsed.toFixed(0)}s > ${maxDuration}s)`,
                        { stuck: true, elapsed_seconds: elapsed }
                    );
                }
            }
        } catch (error) {
            logger.error('[VideoOrchestrator] Error limpiando stuck jobs', {
                error: error.message
            });
        }
    }

    /**
     * Obtener estado del orquestador
     */
    async getStatus() {
        const { data: stats, error } = await supabase
            .from('automation_queue')
            .select('status, job_type, api_provider');

        if (error) {
            logger.error('[VideoOrchestrator] Error obteniendo stats', {
                error: error.message
            });
            return null;
        }

        const status = {
            is_running: this.isRunning,
            processing_jobs: this.processingJobs.size,
            stats: {
                total: stats.length,
                by_status: {},
                by_type: {},
                by_provider: {}
            }
        };

        stats.forEach(job => {
            status.stats.by_status[job.status] = (status.stats.by_status[job.status] || 0) + 1;
            status.stats.by_type[job.job_type] = (status.stats.by_type[job.job_type] || 0) + 1;
            status.stats.by_provider[job.api_provider] =
                (status.stats.by_provider[job.api_provider] || 0) + 1;
        });

        return status;
    }

    /**
     * Helper: sleep
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new VideoOrchestrator();
