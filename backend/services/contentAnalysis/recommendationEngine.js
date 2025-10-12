/**
 * Recommendation Engine
 *
 * Genera recomendaciones priorizadas basadas en análisis competitivo
 * Para ser consumidas por el agente de guiones virales VEO3
 *
 * FLUJO:
 * 1. Analiza videos completados
 * 2. Detecta oportunidades (contraargumentos, trends, etc.)
 * 3. Genera recomendaciones priorizadas
 * 4. Las guarda en competitive_recommendations
 */

const logger = require('../../utils/logger');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class RecommendationEngine {
    constructor() {
        this.lastRun = null;
    }

    /**
     * Generar recomendaciones desde videos analizados
     *
     * @param {object} options - Opciones de generación
     * @returns {Promise<Array>} Recomendaciones generadas
     */
    async generateRecommendations(options = {}) {
        const startTime = Date.now();

        logger.info(
            '[RecommendationEngine] 🎯 Generando recomendaciones desde análisis competitivo'
        );

        try {
            // 1. Obtener videos completados recientemente
            const videos = await this._getRecentCompletedVideos(options.lookbackDays || 7);

            logger.info(`[RecommendationEngine] 📹 ${videos.length} videos a analizar`);

            if (videos.length === 0) {
                logger.info('[RecommendationEngine] No hay videos nuevos para analizar');
                return [];
            }

            const recommendations = [];

            // 2. Detectar oportunidades de contraargumento
            const counterArguments = await this._detectCounterArguments(videos);
            recommendations.push(...counterArguments);

            // 3. Detectar jugadores trending
            const playerSpotlights = await this._detectPlayerSpotlights(videos);
            recommendations.push(...playerSpotlights);

            // 4. Detectar oportunidades de respuesta viral urgente
            const viralResponses = await this._detectViralResponses(videos);
            recommendations.push(...viralResponses);

            // 5. Priorizar recomendaciones
            const prioritized = this._prioritizeRecommendations(recommendations);

            // 6. Guardar en BD
            await this._saveRecommendations(prioritized);

            const duration = Date.now() - startTime;

            logger.info('[RecommendationEngine] ✅ Recomendaciones generadas', {
                total: prioritized.length,
                counterArguments: counterArguments.length,
                playerSpotlights: playerSpotlights.length,
                viralResponses: viralResponses.length,
                duration: `${duration}ms`
            });

            this.lastRun = new Date().toISOString();

            return prioritized;
        } catch (error) {
            logger.error('[RecommendationEngine] Error generando recomendaciones', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtener videos completados recientes
     * @private
     */
    async _getRecentCompletedVideos(lookbackDays = 7) {
        const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('competitive_videos')
            .select(
                `
                *,
                competitive_channels!inner (
                    id,
                    channel_name,
                    content_type,
                    priority
                )
            `
            )
            .eq('processing_status', 'completed')
            .gte('created_at', cutoffDate)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('[RecommendationEngine] Error fetching videos', { error: error.message });
            return [];
        }

        return data || [];
    }

    /**
     * Detectar oportunidades de contraargumento
     * @private
     */
    async _detectCounterArguments(videos) {
        const counterArguments = [];

        for (const video of videos) {
            const analysis = video.analysis;
            if (!analysis) {
                continue;
            }

            // Buscar claims controversiales o exagerados
            const claims = analysis.claims || [];
            const viralPotential = analysis.viralPotential || 0;

            // Si el video tiene viral potential alto y claims específicos
            if (viralPotential >= 7 && claims.length > 0) {
                const players = analysis.players || [];

                for (const player of players.slice(0, 3)) {
                    // Top 3 jugadores mencionados
                    // Solo si tenemos playerId (normalizado correctamente)
                    if (!player.playerId) {
                        continue;
                    }

                    counterArguments.push({
                        recommendation_type: 'counter_argument',
                        title: `CONTRAARGUMENTO: ${player.name} - Análisis con datos reales`,
                        description: `${video.competitive_channels.channel_name} publicó video sobre ${player.name}. Crear contraargumento con nuestros datos de API-Sports`,
                        rationale: `Video competidor: "${video.title}" (${video.views?.toLocaleString() || 0} views). ${claims[0] || 'Claims sin verificar'}. Oportunidad para contrastar con datos oficiales.`,
                        source_video_id: video.id,
                        source_channel_id: video.channel_id,
                        target_player: player.name,
                        target_gameweek: analysis.context?.gameweek || null,
                        competitor_claim: claims[0] || null,
                        our_data: {
                            player_id: player.playerId,
                            player_name: player.name,
                            team: player.team,
                            position: player.position,
                            confidence: player.confidence,
                            // Aquí se agregarían datos reales de BargainAnalyzer cuando se consuma
                            placeholder_data: true
                        },
                        viral_potential: Math.min(viralPotential + 1, 10),
                        urgency_deadline: this._calculateDeadline(2), // 2 días
                        estimated_views: Math.round(video.views * 0.5) // 50% de las views del competidor
                    });
                }
            }
        }

        return counterArguments;
    }

    /**
     * Detectar jugadores mencionados frecuentemente (trending)
     * @private
     */
    async _detectPlayerSpotlights(videos) {
        const playerMentions = {};

        // Agregar todas las menciones
        videos.forEach(video => {
            const players = video.analysis?.players || [];
            players.forEach(player => {
                if (!player.name) {
                    return;
                }

                if (!playerMentions[player.name]) {
                    playerMentions[player.name] = {
                        name: player.name,
                        playerId: player.playerId,
                        team: player.team,
                        position: player.position,
                        mentions: 0,
                        channels: new Set(),
                        totalViews: 0
                    };
                }

                playerMentions[player.name].mentions++;
                playerMentions[player.name].channels.add(video.competitive_channels.channel_name);
                playerMentions[player.name].totalViews += video.views || 0;
            });
        });

        // Filtrar jugadores con 3+ menciones en múltiples canales
        const trending = Object.values(playerMentions).filter(
            p => p.mentions >= 3 && p.channels.size >= 2 && p.playerId
        );

        return trending.map(player => ({
            recommendation_type: 'player_spotlight',
            title: `ANÁLISIS: ${player.name} - El jugador del momento`,
            description: `${player.name} mencionado ${player.mentions} veces en ${player.channels.size} canales competidores. Crear spotlight profundo`,
            rationale: `Trending player detectado: ${player.mentions} menciones, ${player.totalViews.toLocaleString()} views acumuladas. Oportunidad para contenido autoritativo con datos completos.`,
            source_video_id: null, // No viene de un video específico
            source_channel_id: null,
            target_player: player.name,
            target_gameweek: null,
            competitor_claim: null,
            our_data: {
                player_id: player.playerId,
                player_name: player.name,
                team: player.team,
                position: player.position,
                mentions: player.mentions,
                channels: Array.from(player.channels),
                total_competitor_views: player.totalViews,
                placeholder_data: true
            },
            viral_potential: Math.min(5 + player.mentions, 10),
            urgency_deadline: this._calculateDeadline(5), // 5 días
            estimated_views: Math.round(player.totalViews * 0.3)
        }));
    }

    /**
     * Detectar oportunidades de respuesta viral urgente
     * @private
     */
    async _detectViralResponses(videos) {
        const viralResponses = [];

        // Videos con viral potential >= 8 y publicados en últimas 24h
        const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const video of videos) {
            const analysis = video.analysis;
            if (!analysis) {
                continue;
            }

            const viralPotential = analysis.viralPotential || 0;
            const publishedAt = new Date(video.published_at);

            // Oportunidad de respuesta viral urgente
            if (viralPotential >= 8 && publishedAt > cutoff24h && video.views > 20000) {
                const contentType = analysis.contentType || 'general';
                const players = analysis.players || [];
                const mainPlayer = players[0];

                viralResponses.push({
                    recommendation_type: 'viral_response',
                    title: `🔥 RESPUESTA VIRAL: ${video.title.substring(0, 60)}`,
                    description: `Video viral (${video.views.toLocaleString()} views en 24h) requiere respuesta inmediata`,
                    rationale: `URGENTE: ${video.competitive_channels.channel_name} publicó contenido viral. Viral potential ${viralPotential}/10. Responder en próximas 12-24h para capturar audiencia.`,
                    source_video_id: video.id,
                    source_channel_id: video.channel_id,
                    target_player: mainPlayer?.name || null,
                    target_gameweek: analysis.context?.gameweek || null,
                    competitor_claim: (analysis.claims || [])[0] || null,
                    our_data: {
                        competitor_views: video.views,
                        competitor_engagement: video.engagement_rate,
                        content_type: contentType,
                        viral_potential: viralPotential,
                        published_hours_ago: Math.round(
                            (Date.now() - publishedAt) / (60 * 60 * 1000)
                        )
                    },
                    viral_potential: 10,
                    urgency_deadline: this._calculateDeadline(1), // 24 horas
                    estimated_views: Math.round(video.views * 0.8) // 80% potencial
                });
            }
        }

        return viralResponses;
    }

    /**
     * Priorizar recomendaciones
     * @private
     */
    _prioritizeRecommendations(recommendations) {
        return recommendations.map(rec => {
            // Calcular prioridad basada en múltiples factores
            let priority = 'P2'; // Default: medio

            const urgencyHours = rec.urgency_deadline
                ? (new Date(rec.urgency_deadline) - Date.now()) / (60 * 60 * 1000)
                : 9999;

            // P0: Urgencia crítica (<24h) O viral response
            if (urgencyHours < 24 || rec.recommendation_type === 'viral_response') {
                priority = 'P0';
            }
            // P1: Urgencia alta (<48h) O viral potential alto
            else if (urgencyHours < 48 || rec.viral_potential >= 8) {
                priority = 'P1';
            }
            // P2: Urgencia media (<5 días)
            else if (urgencyHours < 120) {
                priority = 'P2';
            }
            // P3: Baja prioridad
            else {
                priority = 'P3';
            }

            return {
                ...rec,
                priority,
                status: 'pending'
            };
        });
    }

    /**
     * Guardar recomendaciones en BD
     * @private
     */
    async _saveRecommendations(recommendations) {
        if (recommendations.length === 0) {
            return;
        }

        const { data, error } = await supabase
            .from('competitive_recommendations')
            .insert(recommendations)
            .select();

        if (error) {
            logger.error('[RecommendationEngine] Error guardando recomendaciones', {
                error: error.message
            });
            throw error;
        }

        logger.info('[RecommendationEngine] 💾 Recomendaciones guardadas en BD', {
            count: data?.length || 0
        });

        return data;
    }

    /**
     * Calcular deadline basado en días
     * @private
     */
    _calculateDeadline(days) {
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    /**
     * Obtener estadísticas de recomendaciones
     */
    async getStats() {
        const { data, error } = await supabase
            .from('competitive_recommendations')
            .select('status, priority, recommendation_type');

        if (error) {
            logger.error('[RecommendationEngine] Error obteniendo stats', { error: error.message });
            return null;
        }

        const stats = {
            total: data.length,
            by_status: {},
            by_priority: {},
            by_type: {}
        };

        data.forEach(rec => {
            stats.by_status[rec.status] = (stats.by_status[rec.status] || 0) + 1;
            stats.by_priority[rec.priority] = (stats.by_priority[rec.priority] || 0) + 1;
            stats.by_type[rec.recommendation_type] =
                (stats.by_type[rec.recommendation_type] || 0) + 1;
        });

        return stats;
    }
}

module.exports = new RecommendationEngine();
