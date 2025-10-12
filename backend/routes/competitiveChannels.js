/**
 * Competitive Channels Routes
 *
 * CRUD para gestión de canales de competencia YouTube
 * Permite añadir/eliminar/configurar canales a monitorizar
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/competitive/channels
 *
 * Listar todos los canales monitorizados
 */
router.get('/channels', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitive_channels')
            .select('*')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] Canales listados', {
            count: data.length
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error listando canales', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/channels/:id
 *
 * Obtener canal específico con stats
 */
router.get('/channels/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener canal
        const { data: channel, error: channelError } = await supabase
            .from('competitive_channels')
            .select('*')
            .eq('id', id)
            .single();

        if (channelError) {
            throw channelError;
        }

        // Obtener videos del canal
        const { data: videos, error: videosError } = await supabase
            .from('competitive_videos')
            .select('*')
            .eq('channel_id', id)
            .order('detected_at', { ascending: false })
            .limit(20);

        if (videosError) {
            throw videosError;
        }

        res.json({
            success: true,
            data: {
                channel,
                videos,
                stats: {
                    totalVideos: videos.length,
                    processed: videos.filter(v => v.processed).length,
                    pending: videos.filter(v => !v.processed).length,
                    avgQuality:
                        videos.reduce((sum, v) => sum + (v.quality_score || 0), 0) /
                        (videos.length || 1)
                }
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error obteniendo canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/channels
 *
 * Añadir nuevo canal a monitorizar
 */
router.post('/channels', async (req, res) => {
    try {
        const {
            channel_url,
            channel_id,
            channel_name,
            priority = 3,
            content_type = 'general',
            monitoring_frequency = '1h'
        } = req.body;

        // Validaciones
        if (!channel_url) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere channel_url'
            });
        }

        // Extraer channel ID de URL si no se proporciona
        let finalChannelId = channel_id;
        if (!finalChannelId) {
            // Intentar extraer de URL
            if (channel_url.includes('/channel/')) {
                finalChannelId = channel_url.split('/channel/')[1].split('/')[0];
            } else if (channel_url.includes('/@')) {
                finalChannelId = channel_url.split('/@')[1].split('/')[0];
            }
        }

        // Insertar canal
        const { data, error } = await supabase
            .from('competitive_channels')
            .insert([
                {
                    channel_url,
                    channel_id: finalChannelId,
                    channel_name,
                    priority,
                    content_type,
                    monitoring_frequency,
                    is_active: true,
                    videos_processed: 0
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Canal añadido', {
            id: data.id,
            channelName: data.channel_name,
            priority: data.priority
        });

        res.json({
            success: true,
            message: 'Canal añadido correctamente',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error añadiendo canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/competitive/channels/:id
 *
 * Actualizar configuración de canal
 */
router.put('/channels/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Campos permitidos para actualización
        const allowedFields = [
            'is_active',
            'priority',
            'content_type',
            'monitoring_frequency',
            'channel_name',
            'channel_id'
        ];

        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        filteredUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('competitive_channels')
            .update(filteredUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Canal actualizado', {
            id: data.id,
            updates: Object.keys(filteredUpdates)
        });

        res.json({
            success: true,
            message: 'Canal actualizado correctamente',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error actualizando canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/competitive/channels/:id
 *
 * Eliminar canal (soft delete: is_active = false)
 */
router.delete('/channels/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('competitive_channels')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Canal desactivado', {
            id: data.id
        });

        res.json({
            success: true,
            message: 'Canal desactivado correctamente',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error eliminando canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/videos/pending
 *
 * Obtener videos pendientes de procesar
 */
router.get('/videos/pending', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitive_videos')
            .select(
                `
                *,
                competitive_channels (
                    channel_name,
                    priority
                )
            `
            )
            .eq('processed', false)
            .order('detected_at', { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] Videos pendientes listados', {
            count: data.length
        });

        res.json({
            success: true,
            data: data.map(v => ({
                ...v,
                channel_name: v.competitive_channels?.channel_name
            }))
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error listando videos pendientes', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/videos/processed
 *
 * Obtener historial de videos analizados (incluye onboarding)
 */
router.get('/videos/processed', async (req, res) => {
    try {
        const { channel_id, limit = 50 } = req.query;

        let query = supabase
            .from('competitive_videos')
            .select(
                `
                *,
                competitive_channels (
                    channel_name
                )
            `
            )
            // Mostrar todos los videos analizados (no filtrar por processed)
            .order('detected_at', { ascending: false })
            .limit(parseInt(limit));

        if (channel_id) {
            query = query.eq('channel_id', channel_id);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data.map(v => ({
                ...v,
                channel_name: v.competitive_channels?.channel_name
            }))
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error listando videos procesados', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/videos/:id/process
 *
 * Procesar video manualmente (generar respuesta)
 */
router.post('/videos/:id/process', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener video
        const { data: video, error: videoError } = await supabase
            .from('competitive_videos')
            .select('*')
            .eq('id', id)
            .single();

        if (videoError) {
            throw videoError;
        }

        // Marcar como processing
        await supabase
            .from('competitive_videos')
            .update({ processing_status: 'processing' })
            .eq('id', id);

        logger.info('[CompetitiveChannels] Video marcado para procesamiento', {
            videoId: video.video_id
        });

        // TODO: Aquí iría la lógica de procesamiento completo
        // Por ahora solo marcamos el estado

        res.json({
            success: true,
            message: 'Video en cola de procesamiento',
            data: {
                videoId: video.video_id,
                status: 'processing'
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error procesando video', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/videos/:id/skip
 *
 * Marcar video como skip (no interesante)
 */
router.post('/videos/:id/skip', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Manual skip' } = req.body;

        const { data, error } = await supabase
            .from('competitive_videos')
            .update({
                processed: true,
                processing_status: 'skipped',
                analysis: { skip_reason: reason }
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Video marcado como skip', {
            videoId: data.video_id,
            reason
        });

        res.json({
            success: true,
            message: 'Video marcado como skip',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error marcando skip', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/channels/:id/onboard
 *
 * Proceso de onboarding: analizar últimos N videos del canal
 * Modos: quick, smart, full
 */
router.post('/channels/:id/onboard', async (req, res) => {
    try {
        const { id } = req.params;
        const { mode = 'smart' } = req.body;

        logger.info('[CompetitiveChannels] 🚀 Iniciando onboarding', {
            channelId: id,
            mode
        });

        // Obtener datos del canal
        const { data: channel, error: channelError } = await supabase
            .from('competitive_channels')
            .select('*')
            .eq('id', id)
            .single();

        if (channelError) {
            throw channelError;
        }

        // Importar servicio (lazy load para evitar circular deps)
        const competitiveOnboardingService = require('../services/contentAnalysis/competitiveOnboardingService');

        // Ejecutar onboarding
        const result = await competitiveOnboardingService.onboardChannel(channel, { mode });

        // Guardar insights en el canal
        await supabase
            .from('competitive_channels')
            .update({
                last_checked: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        logger.info('[CompetitiveChannels] ✅ Onboarding completado', {
            channelId: id,
            videosAnalyzed: result.videos_found,
            costEstimate: result.cost_estimate
        });

        res.json({
            success: true,
            message: 'Onboarding completado',
            data: result
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error en onboarding', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/insights/viral-patterns
 *
 * Obtener viral patterns agregados de todos los onboardings
 * Para aplicar a sistema VEO3
 */
router.get('/insights/viral-patterns', async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        logger.info('[CompetitiveChannels] 📊 Exportando viral patterns', { format });

        // Obtener todos los canales con insights
        const { data: channels, error } = await supabase
            .from('competitive_channels')
            .select('*')
            .eq('is_active', true)
            .not('last_checked', 'is', null);

        if (error) {
            throw error;
        }

        if (channels.length === 0) {
            return res.json({
                success: true,
                message: 'No hay insights disponibles aún. Ejecuta onboarding de canales primero.',
                data: null
            });
        }

        // Por ahora devolvemos estructura vacía
        // TODO: Implementar lectura de insights guardados
        const viralInsightsIntegration = require('../services/contentAnalysis/viralInsightsIntegration');

        const insights = await viralInsightsIntegration.exportForVEO3(format);

        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error exportando insights', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/process/auto-start
 *
 * Iniciar procesamiento automático de videos
 * Procesa videos secuencialmente (más antiguo primero)
 */
router.post('/process/auto-start', async (req, res) => {
    try {
        logger.info('[CompetitiveChannels] 🤖 Iniciando procesamiento automático');

        const autoProcessor = require('../services/contentAnalysis/automaticVideoProcessor');

        // Iniciar procesamiento en background
        autoProcessor.startAutoProcessing().catch(error => {
            logger.error('[CompetitiveChannels] Error en procesamiento automático', {
                error: error.message
            });
        });

        res.json({
            success: true,
            message: 'Procesamiento automático iniciado en background',
            status: autoProcessor.getStatus()
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error iniciando procesamiento automático', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/process/auto-stop
 *
 * Detener procesamiento automático
 */
router.post('/process/auto-stop', async (req, res) => {
    try {
        logger.info('[CompetitiveChannels] 🛑 Deteniendo procesamiento automático');

        const autoProcessor = require('../services/contentAnalysis/automaticVideoProcessor');

        const result = await autoProcessor.stopAutoProcessing();

        res.json(result);
    } catch (error) {
        logger.error('[CompetitiveChannels] Error deteniendo procesamiento automático', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/process/status
 *
 * Obtener estado del procesamiento automático
 */
router.get('/process/status', async (req, res) => {
    try {
        const autoProcessor = require('../services/contentAnalysis/automaticVideoProcessor');

        const status = autoProcessor.getStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error obteniendo estado', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/generate-triggers
 *
 * Generar triggers automáticos desde recommendations para editorial planning
 * Incluye brief completo para agente redactor
 */
router.post('/generate-triggers', async (req, res) => {
    try {
        const { priority, autoActivate = true, limit = 10 } = req.body;

        logger.info('[CompetitiveChannels] 🚨 Generando triggers desde recommendations', {
            priority: priority || 'all',
            autoActivate,
            limit
        });

        const triggerGenerator = require('../services/competitiveTriggerGenerator');

        const result = await triggerGenerator.generateTriggersFromRecommendations({
            priority,
            autoActivate,
            limit
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error generando triggers', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/triggers/stats
 *
 * Obtener estadísticas de triggers generables
 */
router.get('/triggers/stats', async (req, res) => {
    try {
        const triggerGenerator = require('../services/competitiveTriggerGenerator');

        const stats = await triggerGenerator.getTriggersStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error obteniendo stats de triggers', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/dashboard
 *
 * Dashboard completo de inteligencia competitiva
 * Devuelve toda la información agregada de canales y videos
 */
router.get('/dashboard', async (req, res) => {
    try {
        logger.info('[CompetitiveChannels] 📊 Cargando dashboard completo');

        // 1. Obtener todos los canales activos
        const { data: channels, error: channelsError } = await supabase
            .from('competitive_channels')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (channelsError) {
            throw channelsError;
        }

        // 2. Para cada canal, obtener sus videos con análisis completo
        const channelsWithDetails = await Promise.all(
            channels.map(async channel => {
                // Obtener videos del canal
                const { data: videos, error: videosError } = await supabase
                    .from('competitive_videos')
                    .select('*')
                    .eq('channel_id', channel.id)
                    .order('published_at', { ascending: false });

                if (videosError) {
                    logger.error('[CompetitiveChannels] Error obteniendo videos', {
                        channelId: channel.id,
                        error: videosError.message
                    });
                    return { ...channel, videos: [], stats: {} };
                }

                // Calcular estadísticas del canal
                const completedVideos = videos.filter(v => v.processing_status === 'completed');
                const analyzingVideos = videos.filter(v => v.processing_status === 'analyzing');
                const pendingVideos = videos.filter(
                    v => v.processing_status === 'onboarding_analyzed'
                );

                // Estadísticas de engagement
                const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
                const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

                const totalEngagement = videos.reduce(
                    (sum, v) => sum + ((v.likes || 0) + (v.comments || 0)),
                    0
                );
                const avgEngagementRate =
                    totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : 0;

                // Calidad promedio
                const avgQuality =
                    completedVideos.length > 0
                        ? (
                              completedVideos.reduce((sum, v) => sum + (v.quality_score || 0), 0) /
                              completedVideos.length
                          ).toFixed(2)
                        : 0;

                // Extraer información de los análisis (estructura real)
                const allPlayers = [];
                const allClaims = [];
                const contentTypes = {};

                completedVideos.forEach(video => {
                    if (video.analysis) {
                        // Players (keywords principales)
                        if (video.analysis.players && Array.isArray(video.analysis.players)) {
                            video.analysis.players.forEach(player => {
                                const name = player.name || player;
                                allPlayers.push({
                                    name,
                                    position: player.position || 'N/A',
                                    count: player.mentioned_count || 1
                                });
                            });
                        }

                        // Claims
                        if (video.analysis.claims && Array.isArray(video.analysis.claims)) {
                            allClaims.push(...video.analysis.claims);
                        }

                        // Content Types (topics)
                        if (video.analysis.contentType) {
                            const type = video.analysis.contentType;
                            contentTypes[type] = (contentTypes[type] || 0) + 1;
                        }
                    }
                });

                // Top players (frecuencia)
                const playerFrequency = {};
                allPlayers.forEach(p => {
                    playerFrequency[p.name] = (playerFrequency[p.name] || 0) + p.count;
                });

                const topKeywords = Object.entries(playerFrequency)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 15)
                    .map(([keyword, count]) => ({ keyword, count }));

                // Top content types (topics)
                const topTopics = Object.entries(contentTypes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([topic, count]) => ({ topic, count }));

                return {
                    ...channel,
                    videos: videos.map(v => ({
                        ...v,
                        // Calcular engagement rate por video
                        engagement_rate:
                            v.views > 0 ? (((v.likes || 0) + (v.comments || 0)) / v.views) * 100 : 0
                    })),
                    stats: {
                        total_videos: videos.length,
                        completed: completedVideos.length,
                        analyzing: analyzingVideos.length,
                        pending: pendingVideos.length,
                        total_views: totalViews,
                        avg_views: avgViews,
                        avg_engagement_rate: parseFloat(avgEngagementRate),
                        avg_quality: parseFloat(avgQuality),
                        top_keywords: topKeywords,
                        top_topics: topTopics,
                        total_claims: allClaims.length
                    },
                    insights: {
                        keywords: topKeywords,
                        topics: topTopics,
                        claims_sample: allClaims.slice(0, 10)
                    }
                };
            })
        );

        // 3. Estadísticas globales
        const totalVideos = channelsWithDetails.reduce(
            (sum, ch) => sum + (ch.videos?.length || 0),
            0
        );
        const totalCompleted = channelsWithDetails.reduce(
            (sum, ch) => sum + (ch.stats?.completed || 0),
            0
        );
        const totalPending = channelsWithDetails.reduce(
            (sum, ch) => sum + (ch.stats?.pending || 0),
            0
        );

        // 4. Estado del procesador automático
        const autoProcessor = require('../services/contentAnalysis/automaticVideoProcessor');
        const processorStatus = autoProcessor.getStatus();

        logger.info('[CompetitiveChannels] ✅ Dashboard cargado', {
            channels: channels.length,
            totalVideos,
            totalCompleted,
            totalPending
        });

        res.json({
            success: true,
            data: {
                channels: channelsWithDetails,
                global_stats: {
                    total_channels: channels.length,
                    total_videos: totalVideos,
                    total_completed: totalCompleted,
                    total_pending: totalPending,
                    completion_rate:
                        totalVideos > 0 ? ((totalCompleted / totalVideos) * 100).toFixed(2) : 0
                },
                processor_status: processorStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error cargando dashboard', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/recommendations
 *
 * Obtener recomendaciones priorizadas generadas por RecommendationEngine
 * Agrupa por prioridad y muestra insights detallados
 */
router.get('/recommendations', async (req, res) => {
    try {
        const { priority, status = 'pending', limit = 50 } = req.query;

        logger.info('[CompetitiveChannels] 📋 Obteniendo recomendaciones', {
            priority,
            status,
            limit
        });

        let query = supabase
            .from('competitive_recommendations')
            .select(
                `
                *,
                competitive_channels!source_channel_id (
                    channel_name,
                    content_type
                ),
                competitive_videos!source_video_id (
                    title,
                    views,
                    published_at
                )
            `
            )
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (priority) {
            query = query.eq('priority', priority);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        // Enriquecer con información adicional
        const enrichedRecommendations = data.map(rec => ({
            ...rec,
            channel_name: rec.competitive_channels?.channel_name || 'N/A',
            video_title: rec.competitive_videos?.title || 'N/A',
            video_views: rec.competitive_videos?.views || 0,
            video_published_at: rec.competitive_videos?.published_at || null,
            urgency_hours: rec.urgency_deadline
                ? Math.round((new Date(rec.urgency_deadline) - Date.now()) / (60 * 60 * 1000))
                : null
        }));

        // Estadísticas agregadas
        const stats = {
            total: data.length,
            by_priority: {
                P0: data.filter(r => r.priority === 'P0').length,
                P1: data.filter(r => r.priority === 'P1').length,
                P2: data.filter(r => r.priority === 'P2').length,
                P3: data.filter(r => r.priority === 'P3').length
            },
            by_type: {
                counter_argument: data.filter(r => r.recommendation_type === 'counter_argument')
                    .length,
                player_spotlight: data.filter(r => r.recommendation_type === 'player_spotlight')
                    .length,
                viral_response: data.filter(r => r.recommendation_type === 'viral_response').length
            },
            estimated_total_views: data.reduce((sum, r) => sum + (r.estimated_views || 0), 0),
            avg_viral_potential:
                data.length > 0
                    ? (
                          data.reduce((sum, r) => sum + (r.viral_potential || 0), 0) / data.length
                      ).toFixed(2)
                    : 0
        };

        logger.info('[CompetitiveChannels] ✅ Recomendaciones obtenidas', {
            total: data.length,
            p0: stats.by_priority.P0,
            p1: stats.by_priority.P1
        });

        res.json({
            success: true,
            data: {
                recommendations: enrichedRecommendations,
                stats
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error obteniendo recomendaciones', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/recommendations/generate
 *
 * Generar nuevas recomendaciones desde videos analizados
 */
router.post('/recommendations/generate', async (req, res) => {
    try {
        const { lookbackDays = 7 } = req.body;

        logger.info('[CompetitiveChannels] 🎯 Generando nuevas recomendaciones', {
            lookbackDays
        });

        const recommendationEngine = require('../services/contentAnalysis/recommendationEngine');

        const recommendations = await recommendationEngine.generateRecommendations({
            lookbackDays
        });

        res.json({
            success: true,
            message: 'Recomendaciones generadas correctamente',
            data: {
                generated: recommendations.length,
                recommendations: recommendations.slice(0, 10) // Primeras 10
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error generando recomendaciones', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/recommendations/:id/details
 *
 * Obtener detalles completos de una recomendación para el agente redactor
 * Incluye análisis del video fuente y datos procesados
 */
router.get('/recommendations/:id/details', async (req, res) => {
    try {
        const { id } = req.params;

        logger.info('[CompetitiveChannels] 📖 Obteniendo detalles de recomendación', { id });

        // Obtener recomendación con joins
        const { data: recommendation, error } = await supabase
            .from('competitive_recommendations')
            .select(
                `
                *,
                competitive_channels!source_channel_id (
                    *
                ),
                competitive_videos!source_video_id (
                    *
                )
            `
            )
            .eq('id', id)
            .single();

        if (error) {
            throw error;
        }

        // Preparar datos para agente redactor viral
        const writerBrief = {
            // Información básica
            recommendation_id: recommendation.id,
            recommendation_type: recommendation.recommendation_type,
            priority: recommendation.priority,
            urgency_deadline: recommendation.urgency_deadline,

            // Contexto del competidor
            competitor: {
                channel_name: recommendation.competitive_channels?.channel_name,
                video_title: recommendation.competitive_videos?.title,
                video_views: recommendation.competitive_videos?.views,
                published_at: recommendation.competitive_videos?.published_at,
                claim: recommendation.competitor_claim
            },

            // Análisis del video fuente
            source_analysis: recommendation.competitive_videos?.analysis || {},

            // Nuestros datos
            our_data: recommendation.our_data || {},

            // Target
            target_player: recommendation.target_player,
            target_gameweek: recommendation.target_gameweek,

            // Métricas objetivo
            viral_potential: recommendation.viral_potential,
            estimated_views: recommendation.estimated_views,

            // Rationale (por qué esta recomendación)
            rationale: recommendation.rationale,

            // Guía para el redactor
            writer_guidance: this._generateWriterGuidance(recommendation)
        };

        logger.info('[CompetitiveChannels] ✅ Detalles de recomendación preparados');

        res.json({
            success: true,
            data: writerBrief
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error obteniendo detalles', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper para generar guía al redactor
function _generateWriterGuidance(recommendation) {
    const guidance = {
        content_type: '',
        tone: '',
        key_points: [],
        hook_suggestions: [],
        cta_suggestions: []
    };

    switch (recommendation.recommendation_type) {
        case 'counter_argument':
            guidance.content_type = 'Contraargumento con datos reales';
            guidance.tone = 'Autoritativo pero no agresivo, basado en hechos';
            guidance.key_points = [
                'Reconocer el video del competidor',
                'Presentar datos oficiales API-Sports',
                'Contrastar con claim específico',
                'CTA: "Revisa siempre los datos oficiales"'
            ];
            guidance.hook_suggestions = [
                '¿Has visto el video de [canal] sobre [jugador]?',
                'Hay un video viral sobre [jugador] que necesita contexto...',
                'ATENCIÓN: Lo que NO te están diciendo sobre [jugador]'
            ];
            break;

        case 'player_spotlight':
            guidance.content_type = 'Análisis profundo de jugador trending';
            guidance.tone = 'Experto y completo, datos exhaustivos';
            guidance.key_points = [
                'Por qué todo el mundo habla de este jugador',
                'Análisis completo con TODAS las estadísticas',
                'Proyección para próximas jornadas',
                'CTA: "Ficha/descarta YA"'
            ];
            guidance.hook_suggestions = [
                '[Jugador]: El nombre que TODOS repiten esta semana',
                '¿Por qué [jugador] es tendencia? Te lo explico con datos',
                'ANÁLISIS COMPLETO: [jugador] - ¿Vale la pena o es hype?'
            ];
            break;

        case 'viral_response':
            guidance.content_type = 'Respuesta rápida a contenido viral';
            guidance.tone = 'URGENTE, datos inmediatos, alta energía';
            guidance.key_points = [
                'Referencia al video viral (sin enlazarlo)',
                'Nuestra versión con datos actualizados',
                'Acción inmediata recomendada',
                'CTA urgente: "Actúa ANTES del deadline"'
            ];
            guidance.hook_suggestions = [
                '🚨 VIDEO VIRAL sobre [jugador] - AQUÍ LA VERDAD',
                'Todo el mundo habla de [topic] - Esto es lo que importa',
                'URGENTE: La información que falta en el video de [canal]'
            ];
            break;
    }

    guidance.cta_suggestions = [
        'Descarga la app Fantasy La Liga Pro',
        'Sígueme para más análisis con datos reales',
        'Comenta si ya lo fichaste',
        '¿Estás de acuerdo? Déjame tu opinión'
    ];

    return guidance;
}

module.exports = router;
