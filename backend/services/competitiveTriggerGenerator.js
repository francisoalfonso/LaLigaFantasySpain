/**
 * Competitive Trigger Generator
 *
 * Analiza los videos procesados de competencia y genera triggers automáticos
 * para el editorial planning basándose en:
 * - Engagement rate alto
 * - Contenido viral
 * - Players mencionados
 * - Temas trending
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const editorialPlanning = require('./editorialPlanningService');

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CompetitiveTriggerGenerator {
    constructor() {
        this.viralThresholds = {
            engagement_rate: 4.0, // 4%+
            views: 20000,
            quality_score: 7.0
        };
    }

    /**
     * Analizar videos recientes y generar triggers
     */
    async analyzeAndGenerateTriggers(options = {}) {
        const { channelId, lookbackHours = 24, autoActivate = true } = options;

        logger.info('[TriggerGenerator] 🔍 Analizando videos para generar triggers...', {
            channelId: channelId || 'all',
            lookbackHours,
            autoActivate
        });

        try {
            // 1. Obtener videos completados recientes
            const cutoffDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

            let query = supabase
                .from('competitive_videos')
                .select(
                    `
                    *,
                    competitive_channels (
                        channel_name,
                        content_type,
                        priority
                    )
                `
                )
                .eq('processing_status', 'completed')
                .gte('published_at', cutoffDate)
                .order('engagement_rate', { ascending: false })
                .limit(20);

            if (channelId) {
                query = query.eq('channel_id', channelId);
            }

            const { data: videos, error } = await query;

            if (error) {
                throw error;
            }

            logger.info(`[TriggerGenerator] ${videos.length} videos completados encontrados`);

            // 2. Filtrar videos virales
            const viralVideos = videos.filter(video => this._isViral(video));

            logger.info(`[TriggerGenerator] ${viralVideos.length} videos virales detectados`);

            // 3. Generar triggers para cada video viral
            const triggers = [];

            for (const video of viralVideos) {
                const trigger = this._generateTrigger(video);
                triggers.push(trigger);

                // Activar trigger automáticamente si está habilitado
                if (autoActivate) {
                    try {
                        await editorialPlanning.activateTrigger(trigger);
                        logger.info(
                            `[TriggerGenerator] ✅ Trigger activado: ${trigger.suggested_response}`
                        );
                    } catch (error) {
                        logger.error('[TriggerGenerator] Error activando trigger:', error);
                    }
                }
            }

            return {
                success: true,
                analyzed_videos: videos.length,
                viral_videos: viralVideos.length,
                triggers_generated: triggers.length,
                triggers: autoActivate ? [] : triggers, // No devolver si ya se activaron
                message: autoActivate
                    ? `${triggers.length} triggers activados automáticamente`
                    : `${triggers.length} triggers generados (no activados)`
            };
        } catch (error) {
            logger.error('[TriggerGenerator] Error generando triggers:', error);
            throw error;
        }
    }

    /**
     * Determinar si un video es viral
     */
    _isViral(video) {
        const engagementRate = video.engagement_rate || 0;
        const views = video.views || 0;
        const qualityScore = video.quality_score || 0;

        // Criterios de viralidad
        const isHighEngagement = engagementRate >= this.viralThresholds.engagement_rate;
        const isHighViews = views >= this.viralThresholds.views;
        const isHighQuality = qualityScore >= this.viralThresholds.quality_score;

        return isHighEngagement && isHighViews && isHighQuality;
    }

    /**
     * Generar trigger desde video viral
     */
    _generateTrigger(video) {
        const channelName = video.competitive_channels?.channel_name || 'Canal competencia';
        const contentType = video.analysis?.contentType || 'general';

        // Extraer jugadores mencionados
        const players = video.analysis?.players || [];
        const topPlayers = players
            .slice(0, 3)
            .map(p => p.name || p)
            .join(', ');

        // Determinar tipo de trigger
        const triggerType = this._mapContentTypeToTrigger(contentType);

        // Generar respuesta sugerida
        const suggestedResponse = this._generateResponseSuggestion(video, topPlayers);

        // Calcular deadline (contenido viral = responder rápido)
        const deadline = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 horas

        return {
            type: triggerType,
            priority: this._calculatePriority(video),
            platform: 'instagram',
            suggested_response: suggestedResponse,
            deadline: deadline.toISOString(),
            trigger_content: {
                video_id: video.video_id,
                video_url: video.video_url,
                title: video.title,
                channel: channelName,
                engagement_rate: video.engagement_rate,
                views: video.views,
                quality_score: video.quality_score,
                viralScore: this._calculateViralScore(video),
                players: players,
                content_type: contentType
            },
            topic: {
                name: topPlayers || contentType,
                momentum: video.engagement_rate / 10 // Normalizar a 0-1
            },
            metadata: {
                source: 'competitive_analysis',
                channel_id: video.channel_id,
                video_id: video.video_id,
                analyzed_at: new Date().toISOString()
            }
        };
    }

    /**
     * Mapear content type a trigger type
     */
    _mapContentTypeToTrigger(contentType) {
        const mapping = {
            chollo: 'trending_topic',
            chollos: 'trending_topic',
            prediccion: 'viral_response',
            analysis: 'viral_response',
            general: 'viral_response',
            news: 'trending_topic'
        };

        return mapping[contentType.toLowerCase()] || 'viral_response';
    }

    /**
     * Generar sugerencia de respuesta
     */
    _generateResponseSuggestion(video, topPlayers) {
        const contentType = video.analysis?.contentType || 'general';
        const title = video.title || 'Video viral';

        const templates = {
            chollo: `Respuesta Ana: Chollos alternativos con datos API-Sports${topPlayers ? ` (${topPlayers})` : ''}`,
            prediccion: `Análisis Carlos: Datos estadísticos vs predicción viral${topPlayers ? ` sobre ${topPlayers}` : ''}`,
            general: `Respuesta experta: Nuestra perspectiva con datos${topPlayers ? ` sobre ${topPlayers}` : ''}`
        };

        return templates[contentType] || `Análisis: ${title.substring(0, 60)}...`;
    }

    /**
     * Calcular prioridad del trigger
     */
    _calculatePriority(video) {
        const engagementRate = video.engagement_rate || 0;
        const viralScore = this._calculateViralScore(video);

        if (viralScore >= 85) {
            return 'urgent';
        }
        if (viralScore >= 70) {
            return 'high';
        }
        if (viralScore >= 50) {
            return 'medium';
        }
        return 'normal';
    }

    /**
     * Calcular viral score (0-100)
     */
    _calculateViralScore(video) {
        const engagementRate = video.engagement_rate || 0;
        const qualityScore = video.quality_score || 0;
        const views = video.views || 0;

        // Normalizar views (20k = 50 puntos, 100k = 100 puntos)
        const viewsScore = Math.min((views / 100000) * 100, 100);

        // Ponderación: 40% engagement, 30% quality, 30% views
        const viralScore = engagementRate * 4 * 0.4 + qualityScore * 0.3 + viewsScore * 0.3;

        return Math.min(Math.round(viralScore), 100);
    }

    /**
     * 🎯 GENERAR TRIGGERS DESDE RECOMMENDATIONS (CON BRIEF COMPLETO)
     *
     * Este método usa las recommendations generadas por RecommendationEngine
     * y las convierte en triggers para el editorial planning con brief completo
     * incluyendo:
     * - Qué hacer (tipo de video)
     * - Motivo (por qué responder)
     * - Datos a usar (API-Sports)
     * - Frases clave/ideas (hooks, CTAs)
     */
    async generateTriggersFromRecommendations(options = {}) {
        const { priority, autoActivate = true, limit = 10 } = options;

        logger.info('[TriggerGenerator] 🎯 Generando triggers desde recommendations...', {
            priority: priority || 'all',
            autoActivate,
            limit
        });

        try {
            // 1. Obtener recommendations pendientes
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
                        published_at,
                        engagement_rate,
                        analysis
                    )
                `
                )
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (priority) {
                query = query.eq('priority', priority);
            }

            const { data: recommendations, error } = await query;

            if (error) {
                throw error;
            }

            logger.info(`[TriggerGenerator] ${recommendations.length} recommendations encontradas`);

            // 2. Generar triggers con brief completo
            const triggers = [];

            for (const rec of recommendations) {
                const trigger = this._generateEnrichedTrigger(rec);
                triggers.push(trigger);

                // Activar trigger automáticamente si está habilitado
                if (autoActivate) {
                    try {
                        await editorialPlanning.activateTrigger(trigger);
                        logger.info(
                            `[TriggerGenerator] ✅ Trigger activado: ${trigger.suggested_response}`
                        );

                        // Marcar recommendation como 'in_progress'
                        await supabase
                            .from('competitive_recommendations')
                            .update({ status: 'in_progress' })
                            .eq('id', rec.id);
                    } catch (error) {
                        logger.error('[TriggerGenerator] Error activando trigger:', error);
                    }
                }
            }

            return {
                success: true,
                recommendations_processed: recommendations.length,
                triggers_generated: triggers.length,
                triggers: autoActivate ? [] : triggers,
                message: autoActivate
                    ? `${triggers.length} triggers activados en editorial planning`
                    : `${triggers.length} triggers generados (no activados)`
            };
        } catch (error) {
            logger.error(
                '[TriggerGenerator] Error generando triggers desde recommendations:',
                error
            );
            throw error;
        }
    }

    /**
     * Generar trigger enriquecido desde recommendation
     * Incluye brief completo para agente redactor
     */
    _generateEnrichedTrigger(recommendation) {
        const channelName =
            recommendation.competitive_channels?.channel_name || 'Canal competencia';
        const videoData = recommendation.competitive_videos || {};
        const analysis = videoData.analysis || {};

        // Brief completo para agente redactor
        const writerBrief = {
            // 1. QUÉ HACER
            what_to_do: {
                video_type: this._mapRecommendationTypeToVideoType(
                    recommendation.recommendation_type
                ),
                title: recommendation.title,
                description: recommendation.description,
                segments: 3,
                duration: '24 segundos (8s por segmento)',
                presenter: this._assignPresenter(recommendation.recommendation_type)
            },

            // 2. MOTIVO (Por qué responder)
            why: {
                rationale: recommendation.rationale,
                competitor_claim: recommendation.competitor_claim,
                viral_potential_original: analysis.viralPotential || 0,
                viral_potential_ours: Math.min((analysis.viralPotential || 0) + 1, 10),
                estimated_views: recommendation.estimated_views,
                urgency: this._calculateUrgency(recommendation)
            },

            // 3. DATOS A USAR (API-Sports)
            data_to_use: {
                players: this._extractPlayersData(recommendation, analysis),
                our_data: recommendation.our_data || {},
                api_endpoints: this._suggestAPIEndpoints(recommendation),
                data_points: this._extractKeyDataPoints(recommendation, analysis)
            },

            // 4. FRASES CLAVE E IDEAS (Mejores prácticas)
            content_ideas: {
                hooks: this._generateHooks(recommendation, channelName, analysis),
                key_messages: this._generateKeyMessages(recommendation, analysis),
                cta_suggestions: this._generateCTAs(recommendation),
                viral_elements: this._extractViralElements(analysis),
                tone: this._defineTone(recommendation.recommendation_type)
            },

            // 5. CONTEXTO ORIGINAL
            competitor_context: {
                channel: channelName,
                video_title: videoData.title,
                video_url: videoData.video_url,
                views: videoData.views,
                engagement_rate: videoData.engagement_rate,
                published_at: videoData.published_at
            }
        };

        // Generar título sugerido para el video
        const suggestedTitle = this._generateVideoTitle(recommendation, analysis);

        return {
            type: this._mapRecommendationTypeToTriggerType(recommendation.recommendation_type),
            priority: recommendation.priority.toLowerCase(),
            platform: 'instagram',
            suggested_response: suggestedTitle,
            deadline: recommendation.urgency_deadline,

            // BRIEF COMPLETO
            writer_brief: writerBrief,

            trigger_content: {
                recommendation_id: recommendation.id,
                recommendation_type: recommendation.recommendation_type,
                target_player: recommendation.target_player,
                target_gameweek: recommendation.target_gameweek,
                viralScore: recommendation.viral_potential * 10,
                estimated_views: recommendation.estimated_views
            },

            topic: {
                name: recommendation.target_player || recommendation.title,
                momentum: recommendation.viral_potential / 10
            },

            metadata: {
                source: 'competitive_recommendations',
                recommendation_id: recommendation.id,
                channel_id: recommendation.source_channel_id,
                video_id: recommendation.source_video_id,
                generated_at: new Date().toISOString()
            }
        };
    }

    // =====================================================
    // HELPER METHODS PARA BRIEF ENRIQUECIDO
    // =====================================================

    _mapRecommendationTypeToVideoType(type) {
        const mapping = {
            counter_argument: 'Contraargumento con Datos Reales',
            player_spotlight: 'Análisis Profundo de Jugador Trending',
            viral_response: 'Respuesta Rápida a Contenido Viral'
        };
        return mapping[type] || 'Análisis';
    }

    _mapRecommendationTypeToTriggerType(type) {
        const mapping = {
            counter_argument: 'viral_response',
            player_spotlight: 'trending_topic',
            viral_response: 'viral_response'
        };
        return mapping[type] || 'viral_response';
    }

    _assignPresenter(recommendationType) {
        // Ana para chollos/contra-argumentos, Carlos para análisis técnicos
        if (recommendationType === 'counter_argument') {
            return 'ana';
        }
        if (recommendationType === 'player_spotlight') {
            return 'carlos';
        }
        return 'ana';
    }

    _calculateUrgency(recommendation) {
        const priority = recommendation.priority;
        const mapping = {
            P0: 'CRÍTICO - Responder en <24h',
            P1: 'ALTA - Responder en <48h',
            P2: 'MEDIA - Responder en <5 días',
            P3: 'BAJA - Sin deadline urgente'
        };
        return mapping[priority] || 'MEDIA';
    }

    _extractPlayersData(recommendation, analysis) {
        const players = analysis.players || [];
        return players.map(player => ({
            name: player.name,
            team: player.team,
            position: player.position,
            playerId: player.playerId,
            mentioned_count: player.mentioned_count
        }));
    }

    _suggestAPIEndpoints(recommendation) {
        const endpoints = [
            'GET /api/players/{id}/stats - Estadísticas del jugador',
            'GET /api/fixtures/{teamId}/next - Próximos partidos',
            'GET /api/bargains/position/{pos} - Chollos por posición'
        ];

        if (recommendation.target_player) {
            endpoints.unshift(
                `GET /api/players/search?name=${recommendation.target_player} - Buscar jugador`
            );
        }

        return endpoints;
    }

    _extractKeyDataPoints(recommendation, analysis) {
        const points = [];

        if (recommendation.target_player) {
            points.push(`Precio actual de ${recommendation.target_player}`);
            points.push(`Fantasy points últimos 5 partidos`);
            points.push(`Value ratio (points/price)`);
        }

        if (recommendation.target_gameweek) {
            points.push(`Rival en ${recommendation.target_gameweek}`);
            points.push(`Difficulty rating del partido`);
        }

        points.push('Comparativa con promedio de posición');
        points.push('Form reciente (últimas 3 jornadas)');

        return points;
    }

    _generateHooks(recommendation, channelName, analysis) {
        const player = recommendation.target_player || 'este jugador';
        const hooks = [];

        if (recommendation.recommendation_type === 'counter_argument') {
            hooks.push(`¿Has visto el video viral de ${channelName} sobre ${player}?`);
            hooks.push(`ATENCIÓN: Lo que NO te están diciendo sobre ${player}`);
            hooks.push(`${channelName} dice que ${player} es chollo... pero ¿lo es REALMENTE?`);
        } else if (recommendation.recommendation_type === 'player_spotlight') {
            hooks.push(`${player}: TODO EL MUNDO habla de él esta semana`);
            hooks.push(`¿Por qué ${player} es trending? Datos COMPLETOS aquí`);
            hooks.push(`ANÁLISIS PROFUNDO: ${player} - ¿Vale la pena o es solo hype?`);
        } else {
            hooks.push(`🚨 CONTENIDO VIRAL sobre ${player} - Aquí la VERDAD`);
            hooks.push(`Todo el mundo habla de ${player}... esto es lo que IMPORTA`);
            hooks.push(`URGENTE: La información que FALTA sobre ${player}`);
        }

        return hooks;
    }

    _generateKeyMessages(recommendation, analysis) {
        const messages = [];

        if (recommendation.competitor_claim) {
            messages.push(`Claim del competidor: "${recommendation.competitor_claim}"`);
            messages.push('Nuestra respuesta basada en datos oficiales API-Sports');
        }

        if (analysis.contentType) {
            messages.push(`Tipo de contenido competidor: ${analysis.contentType}`);
        }

        messages.push('SIEMPRE verificar con datos oficiales antes de fichar');
        messages.push('Tu éxito en Fantasy depende de decisiones basadas en hechos');

        return messages;
    }

    _generateCTAs(recommendation) {
        return [
            'Descarga Fantasy La Liga Pro para ver datos actualizados',
            'Sígueme para más análisis con fuentes verificadas',
            '¿Ya lo fichaste? Cuéntame en comentarios',
            'Guarda este video para consultarlo antes del deadline',
            'Comparte si te ayudó a tomar una decisión'
        ];
    }

    _extractViralElements(analysis) {
        const elements = [];

        if (analysis.viralPotential >= 7) {
            elements.push('Alto potencial viral detectado en video original');
        }

        if (analysis.claims && analysis.claims.length > 0) {
            elements.push(`${analysis.claims.length} claims específicos a contrastar`);
        }

        if (analysis.players && analysis.players.length >= 3) {
            elements.push('Múltiples jugadores mencionados - oportunidad spotlight');
        }

        elements.push('Usar datos oficiales como diferenciador clave');
        elements.push('Mantener tono autoritativo pero educativo');

        return elements;
    }

    _defineTone(recommendationType) {
        const tones = {
            counter_argument:
                'Autoritativo pero no agresivo. Basado en hechos, no en opiniones. Educativo.',
            player_spotlight:
                'Experto y completo. Análisis exhaustivo con datos. Proyección clara.',
            viral_response:
                'Urgente pero preciso. Alta energía. Información inmediata y accionable.'
        };
        return tones[recommendationType] || 'Profesional y basado en datos';
    }

    _generateVideoTitle(recommendation, analysis) {
        const player = recommendation.target_player || 'jugador';

        const templates = {
            counter_argument: `CONTRAARGUMENTO: ${player} - Los DATOS REALES`,
            player_spotlight: `ANÁLISIS COMPLETO: ${player} - ¿FICHAR o DESCARTAR?`,
            viral_response: `🚨 URGENTE: La VERDAD sobre ${player}`
        };

        return templates[recommendation.recommendation_type] || recommendation.title;
    }

    /**
     * Obtener estadísticas de triggers generados
     */
    async getTriggersStats() {
        try {
            // Contar videos virales en las últimas 24h
            const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data: videos, error } = await supabase
                .from('competitive_videos')
                .select('*')
                .eq('processing_status', 'completed')
                .gte('published_at', cutoffDate);

            if (error) {
                throw error;
            }

            const viralVideos = videos.filter(video => this._isViral(video));

            // Contar recommendations pendientes
            const { data: recommendations, error: recError } = await supabase
                .from('competitive_recommendations')
                .select('priority')
                .eq('status', 'pending');

            const recStats = recommendations
                ? {
                      total: recommendations.length,
                      p0: recommendations.filter(r => r.priority === 'P0').length,
                      p1: recommendations.filter(r => r.priority === 'P1').length,
                      p2: recommendations.filter(r => r.priority === 'P2').length,
                      p3: recommendations.filter(r => r.priority === 'P3').length
                  }
                : { total: 0, p0: 0, p1: 0, p2: 0, p3: 0 };

            return {
                videos_stats: {
                    total_videos_24h: videos.length,
                    viral_videos_24h: viralVideos.length,
                    viral_percentage:
                        videos.length > 0
                            ? `${((viralVideos.length / videos.length) * 100).toFixed(1)}%`
                            : '0%'
                },
                recommendations_stats: recStats,
                thresholds: this.viralThresholds
            };
        } catch (error) {
            logger.error('[TriggerGenerator] Error obteniendo stats:', error);
            throw error;
        }
    }
}

module.exports = new CompetitiveTriggerGenerator();
