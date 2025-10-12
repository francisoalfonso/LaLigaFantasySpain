/**
 * Competitive Onboarding Service
 *
 * Proceso de análisis inicial de canales competidores:
 * 1. Fetch últimos N videos
 * 2. Análisis de metadata (engagement, patterns)
 * 3. Identificación de top performers
 * 4. Transcripción selectiva
 * 5. Content analysis con FILTRADO de branding
 * 6. Generación de insights agregados
 * 7. Extracción de viral patterns para mejorar VEO3
 */

const youtubeMonitor = require('./youtubeMonitor');
const transcriptionService = require('./transcriptionService');
const contentAnalyzer = require('./contentAnalyzer');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.supabase') });

// Cliente Supabase para guardar insights
const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CompetitiveOnboardingService {
    constructor() {
        this.modes = {
            quick: { maxVideos: 10, transcribeTopN: 0 },
            smart: { maxVideos: 20, transcribeTopN: 5 },
            full: { maxVideos: 30, transcribeTopN: 30 }
        };
    }

    /**
     * Onboard de un canal competidor
     */
    async onboardChannel(channelData, options = {}) {
        const mode = options.mode || 'smart';
        const config = this.modes[mode];

        logger.info(`[Onboarding] Iniciando onboarding de canal: ${channelData.channel_name}`, {
            mode,
            maxVideos: config.maxVideos,
            transcribeTopN: config.transcribeTopN
        });

        const result = {
            channel_id: channelData.id,
            channel_name: channelData.channel_name,
            mode,
            started_at: new Date().toISOString(),
            steps: [],
            insights: null,
            viral_patterns: null,
            cost_estimate: 0,
            errors: []
        };

        try {
            // PASO 1: Fetch videos
            result.steps.push({ step: 'fetch_videos', status: 'in_progress' });
            const videos = await this._fetchVideos(channelData.channel_id, config.maxVideos);
            result.videos_found = videos.length;
            result.steps[0].status = 'completed';
            result.steps[0].videos_found = videos.length;

            logger.info(`[Onboarding] ${videos.length} videos encontrados`);

            // PASO 2: Análisis de metadata (GRATIS)
            result.steps.push({ step: 'analyze_metadata', status: 'in_progress' });
            const metadataAnalysis = await this._analyzeMetadata(videos);
            result.metadata_analysis = metadataAnalysis;
            result.steps[1].status = 'completed';

            logger.info(`[Onboarding] Metadata analizada`, {
                avgViews: metadataAnalysis.averages.views,
                avgEngagement: metadataAnalysis.averages.engagement_rate
            });

            // PASO 3: Guardar videos en la base de datos
            result.steps.push({ step: 'save_videos_to_database', status: 'in_progress' });

            try {
                const savedVideosCount = await this._saveVideosToDatabase(videos, channelData.id);
                result.steps[2].status = 'completed';
                result.steps[2].videos_saved = savedVideosCount;

                logger.info(
                    `[Onboarding] ${savedVideosCount} videos guardados en competitive_videos`
                );
            } catch (error) {
                logger.error('[Onboarding] Error guardando videos en BD', {
                    error: error.message
                });
                result.errors.push(`Video save failed: ${error.message}`);
                result.steps[2].status = 'failed';
            }

            // PASO 4: Identificar top performers
            result.steps.push({ step: 'identify_top_performers', status: 'in_progress' });
            const topVideos = this._identifyTopPerformers(videos, config.transcribeTopN);
            result.top_videos = topVideos.map(v => ({
                video_id: v.video_id,
                title: v.title,
                views: v.views,
                engagement_rate: v.engagement_rate
            }));
            result.steps[3].status = 'completed';
            result.steps[3].top_count = topVideos.length;

            logger.info(`[Onboarding] Top ${topVideos.length} videos identificados`);

            // PASO 5: Transcripción (COSTO: $0.006/min)
            if (config.transcribeTopN > 0) {
                result.steps.push({ step: 'transcribe', status: 'in_progress' });
                const transcriptions = await this._transcribeVideos(topVideos);
                result.transcriptions = transcriptions;
                result.steps[4].status = 'completed';
                result.steps[4].transcribed_count = transcriptions.length;

                // Estimar costo
                const totalMinutes = transcriptions.reduce((sum, t) => sum + t.duration / 60, 0);
                result.cost_estimate += totalMinutes * 0.006;

                logger.info(`[Onboarding] ${transcriptions.length} videos transcritos`, {
                    totalMinutes,
                    estimatedCost: result.cost_estimate
                });

                // PASO 6: Content analysis con FILTRADO de branding
                result.steps.push({ step: 'content_analysis', status: 'in_progress' });
                const contentAnalysis = await this._analyzeContent(
                    transcriptions,
                    channelData.channel_name
                );
                result.content_analysis = contentAnalysis;
                result.steps[5].status = 'completed';

                logger.info(`[Onboarding] Análisis de contenido completado`);
            }

            // PASO 7: Generar insights agregados
            result.steps.push({ step: 'generate_insights', status: 'in_progress' });
            const insights = await this._generateInsights(
                metadataAnalysis,
                result.content_analysis,
                channelData
            );
            result.insights = insights;
            result.steps[result.steps.length - 1].status = 'completed';

            logger.info(`[Onboarding] Insights generados`);

            // PASO 8: Extraer viral patterns para VEO3
            result.steps.push({ step: 'extract_viral_patterns', status: 'in_progress' });
            const viralPatterns = this._extractViralPatterns(result);
            result.viral_patterns = viralPatterns;
            result.steps[result.steps.length - 1].status = 'completed';

            logger.info(`[Onboarding] Viral patterns extraídos para VEO3`);

            // PASO 9: Guardar insights en la base de datos
            result.steps.push({ step: 'save_to_database', status: 'in_progress' });

            try {
                const { error: updateError } = await supabase
                    .from('competitive_channels')
                    .update({
                        insights: result.insights,
                        viral_patterns: result.viral_patterns,
                        onboarding_completed_at: new Date().toISOString(),
                        onboarding_metadata: {
                            mode: config.mode,
                            videos_found: result.videos_found,
                            top_count: result.top_videos.length,
                            transcribed_count: result.transcriptions
                                ? result.transcriptions.length
                                : 0,
                            cost_estimate: result.cost_estimate,
                            started_at: result.started_at,
                            completed_at: new Date().toISOString(),
                            duration_seconds: Math.round(
                                (new Date() - new Date(result.started_at)) / 1000
                            )
                        },
                        last_checked: new Date().toISOString()
                    })
                    .eq('id', channelData.id);

                if (updateError) {
                    logger.error('[Onboarding] Error guardando en BD', {
                        error: updateError.message
                    });
                    result.errors.push(`DB save failed: ${updateError.message}`);
                } else {
                    logger.info('[Onboarding] ✅ Insights guardados en la base de datos');
                    result.steps[result.steps.length - 1].status = 'completed';
                }
            } catch (dbError) {
                logger.error('[Onboarding] Error crítico guardando en BD', {
                    error: dbError.message
                });
                result.errors.push(`DB critical error: ${dbError.message}`);
                // No fallar el onboarding por error de BD
            }

            result.completed_at = new Date().toISOString();
            result.status = 'completed';

            return result;
        } catch (error) {
            logger.error('[Onboarding] Error durante onboarding', { error: error.message });
            result.status = 'failed';
            result.errors.push(error.message);
            throw error;
        }
    }

    /**
     * Fetch últimos N videos del canal
     */
    async _fetchVideos(channelId, maxVideos) {
        try {
            // Usar channel ID directamente (ya resuelto en BD)
            const videos = await youtubeMonitor.getLatestVideos(channelId, maxVideos);

            // Enriquecer con métricas de engagement (si disponibles via API)
            return videos.map(video => ({
                ...video,
                views: video.views || 0,
                likes: video.likes || 0,
                comments: video.comments || 0,
                engagement_rate: this._calculateEngagementRate(video)
            }));
        } catch (error) {
            logger.error('[Onboarding] Error fetching videos', { error: error.message });
            throw error;
        }
    }

    /**
     * Calcular engagement rate
     */
    _calculateEngagementRate(video) {
        if (!video.views || video.views === 0) {
            return 0;
        }
        const engagements = (video.likes || 0) + (video.comments || 0);
        return engagements / video.views;
    }

    /**
     * Analizar metadata de todos los videos (GRATIS)
     */
    async _analyzeMetadata(videos) {
        const analysis = {
            total_videos: videos.length,
            date_range: {
                from: videos[videos.length - 1]?.published_at,
                to: videos[0]?.published_at
            },
            averages: {
                views: this._average(videos.map(v => v.views || 0)),
                likes: this._average(videos.map(v => v.likes || 0)),
                comments: this._average(videos.map(v => v.comments || 0)),
                engagement_rate: this._average(videos.map(v => v.engagement_rate || 0)),
                duration_seconds: this._average(videos.map(v => v.duration_seconds || 45))
            },
            top_tags: this._extractTopTags(videos),
            posting_patterns: this._analyzePostingPatterns(videos)
        };

        return analysis;
    }

    /**
     * Identificar top performers por engagement
     */
    _identifyTopPerformers(videos, topN) {
        if (topN === 0) {
            return [];
        }

        // Ordenar por engagement rate
        const sorted = [...videos].sort(
            (a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0)
        );

        // Filtrar videos con mínimo de views (evitar falsos positivos)
        const minViews = 1000;
        const qualified = sorted.filter(v => (v.views || 0) >= minViews);

        return qualified.slice(0, topN);
    }

    /**
     * Transcribir videos seleccionados
     */
    async _transcribeVideos(videos) {
        const transcriptions = [];

        for (const video of videos) {
            try {
                logger.info(`[Onboarding] Transcribiendo video: ${video.video_id}`);

                // Descargar video
                const tempDir = path.join(__dirname, '../../temp/onboarding');
                await fs.mkdir(tempDir, { recursive: true });

                const videoPath = path.join(tempDir, `${video.video_id}.mp4`);
                const audioPath = path.join(tempDir, `${video.video_id}.mp3`);

                await youtubeMonitor.downloadVideo(video.video_url, videoPath);
                await youtubeMonitor.extractAudio(videoPath, audioPath);

                // Transcribir
                const transcription = await transcriptionService.transcribe(audioPath);

                transcriptions.push({
                    video_id: video.video_id,
                    video_url: video.video_url,
                    title: video.title,
                    transcription: transcription.text,
                    duration: transcription.duration,
                    language: transcription.language
                });

                // Limpiar archivos temporales
                await fs.unlink(videoPath).catch(() => {});
                await fs.unlink(audioPath).catch(() => {});
            } catch (error) {
                logger.error(`[Onboarding] Error transcribiendo video ${video.video_id}`, {
                    error: error.message
                });
                // Continuar con siguiente video
            }
        }

        return transcriptions;
    }

    /**
     * Analizar contenido con FILTRADO de branding
     */
    async _analyzeContent(transcriptions, channelName) {
        const analyses = [];

        for (const transcription of transcriptions) {
            try {
                // Análisis con GPT
                const analysis = await contentAnalyzer.analyze(transcription.transcription, {
                    title: transcription.title
                });

                // FILTRAR branding del competidor
                const cleanedAnalysis = this._removeBranding(analysis, channelName);

                analyses.push({
                    video_id: transcription.video_id,
                    ...cleanedAnalysis
                });
            } catch (error) {
                logger.error(`[Onboarding] Error analizando contenido ${transcription.video_id}`, {
                    error: error.message
                });
            }
        }

        // Análisis agregado
        return {
            individual_analyses: analyses,
            aggregated: this._aggregateContentAnalysis(analyses)
        };
    }

    /**
     * CRÍTICO: Remover branding del competidor
     */
    _removeBranding(analysis, channelName) {
        // Patrones a eliminar
        const brandingPatterns = [
            channelName,
            'mi canal',
            'suscríbete',
            'suscribete',
            'like',
            'campanita',
            'link en',
            'descripción',
            'como siempre',
            'ya sabéis que',
            '@',
            '#'
        ];

        const cleaned = JSON.parse(JSON.stringify(analysis)); // Deep clone

        // Limpiar claims
        if (cleaned.claims) {
            cleaned.claims = cleaned.claims
                .map(claim => {
                    let cleanedText = claim.text || claim;

                    brandingPatterns.forEach(pattern => {
                        const regex = new RegExp(pattern, 'gi');
                        cleanedText = cleanedText.replace(regex, '');
                    });

                    // Eliminar frases con CTAs de marca
                    if (
                        cleanedText.toLowerCase().includes('suscr') ||
                        cleanedText.toLowerCase().includes('link') ||
                        cleanedText.toLowerCase().includes('canal')
                    ) {
                        return null;
                    }

                    return typeof claim === 'string'
                        ? cleanedText.trim()
                        : { ...claim, text: cleanedText.trim() };
                })
                .filter(
                    claim =>
                        claim &&
                        (typeof claim === 'string' ? claim.length > 10 : claim.text.length > 10)
                );
        }

        return cleaned;
    }

    /**
     * Agregar análisis de contenido
     */
    _aggregateContentAnalysis(analyses) {
        const allKeywords = [];
        const allPlayers = [];
        const allClaims = [];
        const tones = {};

        analyses.forEach(a => {
            if (a.keywords) {
                allKeywords.push(...a.keywords);
            }
            if (a.players) {
                allPlayers.push(...a.players.map(p => p.name || p));
            }
            if (a.claims) {
                allClaims.push(...a.claims);
            }
            if (a.tone) {
                tones[a.tone] = (tones[a.tone] || 0) + 1;
            }
        });

        return {
            top_keywords: this._topFrequent(allKeywords, 10),
            most_mentioned_players: this._topFrequent(allPlayers, 10),
            viral_claims: allClaims.slice(0, 20),
            tone_distribution: tones
        };
    }

    /**
     * Generar insights completos
     */
    async _generateInsights(metadataAnalysis, contentAnalysis, channelData) {
        return {
            channel: {
                name: channelData.channel_name,
                content_type: channelData.content_type,
                priority: channelData.priority
            },
            performance_benchmarks: metadataAnalysis.averages,
            content_patterns: contentAnalysis?.aggregated || {},
            posting_strategy: metadataAnalysis.posting_patterns,
            top_tags: metadataAnalysis.top_tags,
            competitive_strategy: this._deriveCompetitiveStrategy(metadataAnalysis, contentAnalysis)
        };
    }

    /**
     * Extraer viral patterns para aplicar a VEO3
     */
    _extractViralPatterns(onboardingResult) {
        const patterns = {
            content_structures: [],
            viral_keywords: [],
            tone_preferences: [],
            hook_strategies: [],
            engagement_tactics: [],
            recommendations_for_veo3: []
        };

        // Extraer de content analysis
        if (onboardingResult.content_analysis) {
            const agg = onboardingResult.content_analysis.aggregated;

            patterns.viral_keywords = agg.top_keywords || [];
            patterns.tone_preferences = Object.keys(agg.tone_distribution || {}).sort(
                (a, b) => agg.tone_distribution[b] - agg.tone_distribution[a]
            );
        }

        // Derivar recomendaciones para VEO3
        patterns.recommendations_for_veo3 = [
            'Usar keywords virales identificados en hooks',
            `Tono preferido: ${patterns.tone_preferences[0] || 'técnico'}`,
            'Estructurar videos: hook (3s) → claim (5s) → justificación (30s) → CTA suave',
            'Incluir jugadores top mencionados por competencia',
            'Evitar copiar claims exactos, generar contraste con datos'
        ];

        return patterns;
    }

    /**
     * Derivar estrategia competitiva
     */
    _deriveCompetitiveStrategy(metadata, content) {
        return {
            their_strength: 'Por determinar con más análisis',
            our_opportunity: 'Análisis técnico profundo con datos API-Sports',
            response_timing: 'Publicar 2-4h después con datos de contraste',
            differentiation: 'Ana con respaldo estadístico vs opinión viral'
        };
    }

    /**
     * Guardar videos en la tabla competitive_videos
     */
    async _saveVideosToDatabase(videos, channelId) {
        const videosToInsert = videos.map(video => ({
            channel_id: channelId,
            video_id: video.videoId,
            video_url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
            title: video.title,
            thumbnail: video.thumbnail,
            published_at: video.publishedAt,
            detected_at: new Date().toISOString(),
            processed: false,
            processing_status: 'onboarding_analyzed',
            views: video.views || 0,
            likes: video.likes || 0,
            comments: video.comments || 0,
            engagement_rate: video.engagement_rate || 0,
            duration_seconds: video.duration || 0,
            engagement_metrics: {
                views: video.views || 0,
                likes: video.likes || 0,
                comments: video.comments || 0,
                engagement_rate: video.engagement_rate || 0
            }
        }));

        // Insertar en batch (Supabase permite hasta 1000 registros)
        const { data, error } = await supabase.from('competitive_videos').upsert(videosToInsert, {
            onConflict: 'video_id', // Si el video ya existe, actualizar
            ignoreDuplicates: false
        });

        if (error) {
            logger.error('[Onboarding] Error insertando videos', {
                error: error.message,
                count: videosToInsert.length
            });
            throw new Error(`Failed to insert videos: ${error.message}`);
        }

        logger.info('[Onboarding] Videos insertados/actualizados en BD', {
            count: videosToInsert.length
        });

        return videosToInsert.length;
    }

    // Utilidades
    _average(arr) {
        if (arr.length === 0) {
            return 0;
        }
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    _topFrequent(arr, topN) {
        const freq = {};
        arr.forEach(item => {
            const key = typeof item === 'string' ? item.toLowerCase() : item;
            freq[key] = (freq[key] || 0) + 1;
        });

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([item, count]) => ({ item, count }));
    }

    _extractTopTags(videos) {
        const allTags = [];
        videos.forEach(v => {
            if (v.tags) {
                allTags.push(...v.tags);
            }
        });
        return this._topFrequent(allTags, 10);
    }

    _analyzePostingPatterns(videos) {
        // Analizar días/horas de publicación
        const days = {};
        const hours = {};

        videos.forEach(v => {
            if (v.published_at) {
                const date = new Date(v.published_at);
                const day = date.toLocaleDateString('es-ES', { weekday: 'long' });
                const hour = date.getHours();

                days[day] = (days[day] || 0) + 1;
                hours[hour] = (hours[hour] || 0) + 1;
            }
        });

        return {
            best_days: Object.entries(days)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([day]) => day),
            best_hours: Object.entries(hours)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([hour]) => `${hour}:00-${hour}:59`)
        };
    }
}

module.exports = new CompetitiveOnboardingService();
