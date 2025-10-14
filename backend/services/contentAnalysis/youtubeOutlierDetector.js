/**
 * YouTube Outlier Detector
 *
 * Sistema de detección de videos virales emergentes (outliers) en el nicho de Fantasy La Liga.
 *
 * ESTRATEGIA:
 * - Buscar videos en keywords relevantes cada 6h
 * - Calcular outlier score basado en views/subs ratio, engagement, velocity
 * - Detectar virales en primeras 24-48h (antes que la competencia)
 * - Priorizar respuesta según urgencia (P0, P1, P2)
 *
 * VENTAJA COMPETITIVA:
 * - 80% de virales vienen de canales inesperados (no competidores conocidos)
 * - Responder en <24h = capturar toda la audiencia viral
 * - ROI altísimo: $0.01 búsqueda → 500K+ views potenciales
 */

const axios = require('axios');
const logger = require('../../utils/logger');
const { supabaseAdmin } = require('../../config/supabase');

class YouTubeOutlierDetector {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';

        // Keywords para búsqueda (MÁS ESPECÍFICOS)
        this.searchKeywords = [
            'fantasy laliga',
            'biwenger',
            'comunio',
            'chollos fantasy laliga',
            'fichajes fantasy laliga',
            'mister fantasy laliga'
        ];

        // Palabras a EXCLUIR (blacklist)
        this.blacklistKeywords = [
            'nba',
            'nfl',
            'premier league',
            'champions',
            'ucl',
            'bundesliga',
            'serie a',
            'ligue 1',
            'premier',
            'epl'
        ];

        // Filtros de calidad mínima
        this.minChannelSubscribers = 500; // Mínimo 500 suscriptores
        this.minViews = 1000; // Mínimo 1K views para considerar
        this.minOutlierScore = 20; // Score mínimo para guardar

        // Thresholds para clasificación (MÁS ESTRICTOS)
        this.thresholds = {
            p0: 70, // CRÍTICO - Respuesta <24h (más difícil de alcanzar)
            p1: 50, // ALTA - Respuesta <48h
            p2: 30 // MEDIA - Respuesta <5 días
        };
    }

    /**
     * Buscar outliers virales en YouTube
     *
     * @param {Object} options - Opciones de búsqueda
     * @param {number} [options.hoursBack=24] - Buscar videos de últimas N horas
     * @param {number} [options.maxResultsPerKeyword=50] - Max resultados por keyword
     * @returns {Array} Videos outliers detectados
     */
    async detectOutliers(options = {}) {
        try {
            const { hoursBack = 24, maxResultsPerKeyword = 50 } = options;

            logger.info('🔍 [OutlierDetector] Iniciando búsqueda de outliers', {
                hoursBack,
                keywords: this.searchKeywords.length
            });

            // Calcular publishedAfter timestamp
            const publishedAfter = new Date();
            publishedAfter.setHours(publishedAfter.getHours() - hoursBack);
            const publishedAfterISO = publishedAfter.toISOString();

            // Buscar videos en todas las keywords
            const allVideos = [];
            for (const keyword of this.searchKeywords) {
                try {
                    const videos = await this._searchVideos({
                        keyword,
                        publishedAfter: publishedAfterISO,
                        maxResults: maxResultsPerKeyword
                    });

                    allVideos.push(...videos);

                    logger.info(
                        `[OutlierDetector] Keyword "${keyword}": ${videos.length} videos encontrados`
                    );
                } catch (error) {
                    logger.warn(`[OutlierDetector] Error buscando keyword "${keyword}"`, {
                        error: error.message
                    });
                }
            }

            // Eliminar duplicados (mismo videoId)
            const uniqueVideos = this._deduplicateVideos(allVideos);

            logger.info(`[OutlierDetector] Total videos únicos: ${uniqueVideos.length}`);

            // Obtener detalles completos de cada video (stats, channel info)
            const videosWithDetails = await this._enrichVideosWithDetails(uniqueVideos);

            // Calcular outlier score para cada video
            const videosWithScores = videosWithDetails.map(video => ({
                ...video,
                outlierScore: this._calculateOutlierScore(video),
                priority: this._calculatePriority(video)
            }));

            // Aplicar filtros de calidad y relevancia (con tracking)
            const filterStats = {
                total: videosWithScores.length,
                blacklist: 0,
                smallChannel: 0,
                lowViews: 0,
                lowScore: 0,
                passed: 0
            };

            const outliers = videosWithScores.filter(video => {
                // 1. Filtro de blacklist - Excluir contenido no relevante (NBA, NFL, etc.)
                const titleLower = video.title.toLowerCase();
                const descriptionLower = (video.description || '').toLowerCase();
                const hasBlacklistKeyword = this.blacklistKeywords.some(
                    keyword =>
                        titleLower.includes(keyword.toLowerCase()) ||
                        descriptionLower.includes(keyword.toLowerCase())
                );

                if (hasBlacklistKeyword) {
                    filterStats.blacklist++;
                    logger.debug('[OutlierDetector] ❌ Video descartado por blacklist', {
                        videoId: video.videoId,
                        title: video.title
                    });
                    return false;
                }

                // 2. Filtro de tamaño mínimo de canal
                if (video.channelSubscribers < this.minChannelSubscribers) {
                    filterStats.smallChannel++;
                    logger.debug('[OutlierDetector] ❌ Video descartado por canal pequeño', {
                        videoId: video.videoId,
                        subscribers: video.channelSubscribers,
                        min: this.minChannelSubscribers
                    });
                    return false;
                }

                // 3. Filtro de views mínimas
                if (video.views < this.minViews) {
                    filterStats.lowViews++;
                    logger.debug('[OutlierDetector] ❌ Video descartado por pocas views', {
                        videoId: video.videoId,
                        views: video.views,
                        min: this.minViews
                    });
                    return false;
                }

                // 4. Filtro de outlier score mínimo
                if (video.outlierScore < this.minOutlierScore) {
                    filterStats.lowScore++;
                    logger.debug('[OutlierDetector] ❌ Video descartado por score bajo', {
                        videoId: video.videoId,
                        score: video.outlierScore,
                        min: this.minOutlierScore
                    });
                    return false;
                }

                filterStats.passed++;
                return true;
            });

            // Log resumen de filtrado
            logger.info('🔍 [OutlierDetector] Resumen de filtrado', {
                total: filterStats.total,
                descartados: {
                    blacklist: filterStats.blacklist,
                    canalPequeño: filterStats.smallChannel,
                    pocasViews: filterStats.lowViews,
                    scoreBajo: filterStats.lowScore,
                    total: filterStats.total - filterStats.passed
                },
                aprobados: filterStats.passed,
                tasaAprobacion: `${Math.round((filterStats.passed / filterStats.total) * 100)}%`
            });

            // Ordenar por score descendente
            outliers.sort((a, b) => b.outlierScore - a.outlierScore);

            logger.info('✅ [OutlierDetector] Outliers detectados', {
                total: outliers.length,
                p0: outliers.filter(v => v.priority === 'P0').length,
                p1: outliers.filter(v => v.priority === 'P1').length,
                p2: outliers.filter(v => v.priority === 'P2').length
            });

            // Guardar outliers en Supabase
            if (outliers.length > 0) {
                await this._saveOutliersToDatabase(outliers);
            }

            return outliers;
        } catch (error) {
            logger.error('❌ [OutlierDetector] Error detectando outliers', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Buscar videos en YouTube por keyword
     * @private
     */
    async _searchVideos({ keyword, publishedAfter, maxResults }) {
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    key: this.apiKey,
                    part: 'snippet',
                    q: keyword,
                    type: 'video',
                    publishedAfter: publishedAfter,
                    maxResults: maxResults,
                    order: 'viewCount', // Ordenar por views para encontrar virales
                    relevanceLanguage: 'es',
                    regionCode: 'ES'
                }
            });

            if (!response.data || !response.data.items) {
                return [];
            }

            return response.data.items.map(item => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                channelId: item.snippet.channelId,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                thumbnailUrl:
                    item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                description: item.snippet.description
            }));
        } catch (error) {
            logger.error('[OutlierDetector] Error en YouTube search API', {
                keyword,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Eliminar videos duplicados
     * @private
     */
    _deduplicateVideos(videos) {
        const seen = new Set();
        return videos.filter(video => {
            if (seen.has(video.videoId)) {
                return false;
            }
            seen.add(video.videoId);
            return true;
        });
    }

    /**
     * Enriquecer videos con detalles completos (stats, channel info)
     * @private
     */
    async _enrichVideosWithDetails(videos) {
        try {
            // Obtener stats de videos en batch (max 50 por request)
            const enrichedVideos = [];
            const batchSize = 50;

            for (let i = 0; i < videos.length; i += batchSize) {
                const batch = videos.slice(i, i + batchSize);
                const videoIds = batch.map(v => v.videoId).join(',');

                // Get video stats
                const statsResponse = await axios.get(`${this.baseUrl}/videos`, {
                    params: {
                        key: this.apiKey,
                        part: 'statistics,contentDetails',
                        id: videoIds
                    }
                });

                // Get channel stats
                const channelIds = [...new Set(batch.map(v => v.channelId))].join(',');
                const channelsResponse = await axios.get(`${this.baseUrl}/channels`, {
                    params: {
                        key: this.apiKey,
                        part: 'statistics',
                        id: channelIds
                    }
                });

                // Map stats to videos
                const channelStatsMap = {};
                if (channelsResponse.data && channelsResponse.data.items) {
                    channelsResponse.data.items.forEach(channel => {
                        channelStatsMap[channel.id] = {
                            subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
                            videoCount: parseInt(channel.statistics.videoCount) || 0
                        };
                    });
                }

                if (statsResponse.data && statsResponse.data.items) {
                    statsResponse.data.items.forEach(videoStats => {
                        const originalVideo = batch.find(v => v.videoId === videoStats.id);
                        if (originalVideo) {
                            enrichedVideos.push({
                                ...originalVideo,
                                views: parseInt(videoStats.statistics.viewCount) || 0,
                                likes: parseInt(videoStats.statistics.likeCount) || 0,
                                comments: parseInt(videoStats.statistics.commentCount) || 0,
                                duration: videoStats.contentDetails.duration,
                                channelSubscribers:
                                    channelStatsMap[originalVideo.channelId]?.subscriberCount || 0,
                                channelVideoCount:
                                    channelStatsMap[originalVideo.channelId]?.videoCount || 0
                            });
                        }
                    });
                }
            }

            return enrichedVideos;
        } catch (error) {
            logger.error('[OutlierDetector] Error enriqueciendo videos', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Calcular outlier score
     *
     * FÓRMULA:
     * - Viral Ratio: (views / channelSubscribers) * 100 [peso: 1.0]
     * - Engagement Rate: ((likes + comments) / views) * 100 * 10 [peso: 1.0]
     * - Velocity: (views / hoursElapsed) [peso: 0.05]
     *
     * @private
     */
    _calculateOutlierScore(video) {
        try {
            // 1. Viral Ratio (views vs channel size)
            let viralRatio = 0;
            if (video.channelSubscribers > 0) {
                viralRatio = (video.views / video.channelSubscribers) * 100;
            } else {
                // Si no tiene subs, asumir canal pequeño con 1K subs
                viralRatio = (video.views / 1000) * 100;
            }

            // Cap viral ratio at 1000 (videos con 10x más views que subs del canal)
            viralRatio = Math.min(viralRatio, 1000);

            // 2. Engagement Rate
            let engagementRate = 0;
            if (video.views > 0) {
                engagementRate = ((video.likes + video.comments) / video.views) * 100 * 10;
            }

            // 3. Velocity (views per hour)
            const publishedDate = new Date(video.publishedAt);
            const now = new Date();
            const hoursElapsed = Math.max((now - publishedDate) / (1000 * 60 * 60), 1);
            const velocity = video.views / hoursElapsed;

            // Outlier Score = weighted sum
            const outlierScore = viralRatio * 1.0 + engagementRate * 1.0 + velocity * 0.05;

            return Math.round(outlierScore * 10) / 10; // Round to 1 decimal
        } catch (error) {
            logger.warn('[OutlierDetector] Error calculando outlier score', {
                videoId: video.videoId,
                error: error.message
            });
            return 0;
        }
    }

    /**
     * Calcular prioridad según outlier score
     * @private
     */
    _calculatePriority(video) {
        const score = video.outlierScore || this._calculateOutlierScore(video);

        if (score >= this.thresholds.p0) {
            return 'P0';
        }
        if (score >= this.thresholds.p1) {
            return 'P1';
        }
        if (score >= this.thresholds.p2) {
            return 'P2';
        }
        return 'P3';
    }

    /**
     * Guardar outliers en Supabase
     * @private
     */
    async _saveOutliersToDatabase(outliers) {
        try {
            const records = outliers.map(outlier => {
                // Calcular viral_ratio
                let viralRatio = 0;
                if (outlier.channelSubscribers > 0) {
                    viralRatio = (outlier.views / outlier.channelSubscribers) * 100;
                } else {
                    viralRatio = (outlier.views / 1000) * 100;
                }
                viralRatio = Math.min(viralRatio, 1000);

                // Calcular velocity
                const publishedDate = new Date(outlier.publishedAt);
                const now = new Date();
                const hoursElapsed = Math.max((now - publishedDate) / (1000 * 60 * 60), 1);
                const velocity = outlier.views / hoursElapsed;

                return {
                    video_id: outlier.videoId,
                    title: outlier.title,
                    channel_id: outlier.channelId,
                    channel_name: outlier.channelTitle,
                    channel_subscribers: outlier.channelSubscribers,
                    published_at: outlier.publishedAt,
                    views: outlier.views,
                    likes: outlier.likes,
                    comments: outlier.comments,
                    engagement_rate:
                        outlier.views > 0
                            ? ((outlier.likes + outlier.comments) / outlier.views) * 100
                            : 0,
                    outlier_score: outlier.outlierScore,
                    priority: outlier.priority,
                    viral_ratio: Math.round(viralRatio * 100) / 100, // Redondear a 2 decimales
                    velocity: Math.round(velocity * 100) / 100, // Redondear a 2 decimales
                    duration: outlier.duration || null,
                    thumbnail_url: outlier.thumbnailUrl,
                    video_url: `https://www.youtube.com/watch?v=${outlier.videoId}`,
                    detected_at: new Date().toISOString(),
                    processing_status: 'detected' // detected, analyzing, analyzed, responded
                };
            });

            // Upsert para evitar duplicados
            const { data, error } = await supabaseAdmin.from('youtube_outliers').upsert(records, {
                onConflict: 'video_id',
                ignoreDuplicates: false
            });

            if (error) {
                throw error;
            }

            logger.info('✅ [OutlierDetector] Outliers guardados en Supabase', {
                count: records.length
            });

            return data;
        } catch (error) {
            logger.error('❌ [OutlierDetector] Error guardando outliers en DB', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtener outliers desde base de datos
     *
     * @param {Object} filters - Filtros opcionales
     * @param {string} [filters.priority] - Filtrar por prioridad (P0, P1, P2, P3)
     * @param {number} [filters.hoursBack=48] - Outliers de últimas N horas
     * @param {string} [filters.status] - Filtrar por status
     * @returns {Array} Outliers
     */
    async getOutliers(filters = {}) {
        try {
            const { priority, hoursBack = 48, status } = filters;

            let query = supabaseAdmin
                .from('youtube_outliers')
                .select('*')
                .order('outlier_score', { ascending: false });

            // Filtrar por tiempo
            if (hoursBack) {
                const cutoffDate = new Date();
                cutoffDate.setHours(cutoffDate.getHours() - hoursBack);
                query = query.gte('detected_at', cutoffDate.toISOString());
            }

            // Filtrar por prioridad
            if (priority) {
                query = query.eq('priority', priority);
            }

            // Filtrar por status
            if (status) {
                query = query.eq('processing_status', status);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            logger.error('❌ [OutlierDetector] Error obteniendo outliers', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Actualizar status de un outlier
     *
     * @param {string} videoId - ID del video
     * @param {string} status - Nuevo status (detected, analyzing, analyzed, responded)
     * @returns {Object} Outlier actualizado
     */
    async updateOutlierStatus(videoId, status) {
        try {
            const { data, error } = await supabaseAdmin
                .from('youtube_outliers')
                .update({
                    processing_status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('video_id', videoId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            logger.info('[OutlierDetector] Status actualizado', {
                videoId,
                status
            });

            return data;
        } catch (error) {
            logger.error('[OutlierDetector] Error actualizando status', {
                videoId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtener estadísticas de outliers
     *
     * @returns {Object} Estadísticas globales
     */
    async getOutlierStats() {
        try {
            // Total outliers (últimas 48h)
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - 48);

            const { data: allOutliers, error: allError } = await supabaseAdmin
                .from('youtube_outliers')
                .select('*')
                .gte('detected_at', cutoffDate.toISOString());

            if (allError) {
                throw allError;
            }

            // Contar por prioridad
            const stats = {
                total: allOutliers.length,
                p0: allOutliers.filter(o => o.priority === 'P0').length,
                p1: allOutliers.filter(o => o.priority === 'P1').length,
                p2: allOutliers.filter(o => o.priority === 'P2').length,
                p3: allOutliers.filter(o => o.priority === 'P3').length,
                detected: allOutliers.filter(o => o.processing_status === 'detected').length,
                analyzing: allOutliers.filter(o => o.processing_status === 'analyzing').length,
                analyzed: allOutliers.filter(o => o.processing_status === 'analyzed').length,
                responded: allOutliers.filter(o => o.processing_status === 'responded').length,
                avgOutlierScore:
                    allOutliers.length > 0
                        ? Math.round(
                              (allOutliers.reduce((sum, o) => sum + o.outlier_score, 0) /
                                  allOutliers.length) *
                                  10
                          ) / 10
                        : 0
            };

            return stats;
        } catch (error) {
            logger.error('❌ [OutlierDetector] Error obteniendo stats', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new YouTubeOutlierDetector();
