/**
 * YouTube Outliers API Routes
 *
 * Endpoints para detección y gestión de videos virales (outliers)
 */

const express = require('express');
const router = express.Router();
const youtubeOutlierDetector = require('../services/contentAnalysis/youtubeOutlierDetector');
const logger = require('../utils/logger');
const { generalLimiter, adaptiveRateLimiter } = require('../middleware/rateLimiter');

// Use adaptive rate limiter que respeta DISABLE_RATE_LIMIT en desarrollo
const limiter = adaptiveRateLimiter(generalLimiter);

/**
 * GET /api/outliers/detect
 * Buscar outliers virales en YouTube
 */
router.get('/detect', limiter, async (req, res) => {
    try {
        const { hoursBack = 24, maxResultsPerKeyword = 50 } = req.query;

        logger.info('[Outliers API] Iniciando detección de outliers', {
            hoursBack,
            maxResultsPerKeyword
        });

        const outliers = await youtubeOutlierDetector.detectOutliers({
            hoursBack: parseInt(hoursBack),
            maxResultsPerKeyword: parseInt(maxResultsPerKeyword)
        });

        res.json({
            success: true,
            data: {
                outliers,
                count: outliers.length,
                p0: outliers.filter(o => o.priority === 'P0').length,
                p1: outliers.filter(o => o.priority === 'P1').length,
                p2: outliers.filter(o => o.priority === 'P2').length
            }
        });
    } catch (error) {
        logger.error('[Outliers API] Error detectando outliers', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/outliers/list
 * Listar outliers desde base de datos
 */
router.get('/list', limiter, async (req, res) => {
    try {
        const { priority, hoursBack = 48, status } = req.query;

        const outliers = await youtubeOutlierDetector.getOutliers({
            priority,
            hoursBack: parseInt(hoursBack),
            status
        });

        res.json({
            success: true,
            data: {
                outliers,
                count: outliers.length
            }
        });
    } catch (error) {
        logger.error('[Outliers API] Error listando outliers', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/outliers/stats
 * Obtener estadísticas de outliers
 */
router.get('/stats', limiter, async (req, res) => {
    try {
        const stats = await youtubeOutlierDetector.getOutlierStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('[Outliers API] Error obteniendo stats', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/outliers/:videoId/status
 * Actualizar status de un outlier
 */
router.put('/:videoId/status', limiter, async (req, res) => {
    try {
        const { videoId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status es requerido'
            });
        }

        const validStatuses = ['detected', 'analyzing', 'analyzed', 'responded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Status debe ser uno de: ${validStatuses.join(', ')}`
            });
        }

        const outlier = await youtubeOutlierDetector.updateOutlierStatus(videoId, status);

        res.json({
            success: true,
            data: outlier
        });
    } catch (error) {
        logger.error('[Outliers API] Error actualizando status', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/outliers/generate-script/:videoId
 * Generar script VEO3 inteligente para responder a outlier
 *
 * FLUJO:
 * 1. Obtener outlier de DB (debe estar 'analyzed')
 * 2. Enriquecer con API-Sports si aún no está hecho
 * 3. Generar script con GPT-4o via intelligentScriptGenerator
 * 4. Guardar generated_script en DB
 * 5. Update status: analyzed → scripted
 *
 * COST: ~$0.002 por script (GPT-4o-mini cached)
 */
router.post('/generate-script/:videoId', limiter, async (req, res) => {
    const { videoId } = req.params;
    const { responseAngle = 'rebatir', presenter = 'ana' } = req.body;

    try {
        logger.info('[Outliers API] Generando script para outlier', {
            videoId,
            responseAngle,
            presenter
        });

        // 1. Obtener outlier de DB
        const outliers = await youtubeOutlierDetector.getOutliers({
            status: null
        });

        const outlier = outliers.find(o => o.video_id === videoId);

        if (!outlier) {
            return res.status(404).json({
                success: false,
                error: `Outlier not found: ${videoId}`
            });
        }

        // Verificar que tiene análisis
        if (!outlier.content_analysis || !outlier.transcription) {
            return res.status(400).json({
                success: false,
                error: 'Outlier must be analyzed first. Call POST /api/outliers/analyze/:videoId'
            });
        }

        // 2. Detectar tipo de video (player_spotlight vs generic_analysis)
        const videoType = outlier.content_analysis?.video_type || 'player_spotlight';
        const targetPlayer = outlier.content_analysis?.target_player;
        const isGenericVideo = videoType === 'generic_analysis';

        logger.info('[Outliers API] Tipo de video detectado:', {
            videoType,
            targetPlayer: targetPlayer || 'N/A',
            skipEnrichment: isGenericVideo
        });

        // 3. Enriquecer con API-Sports SOLO si es video de jugador específico
        let enrichedData = null;

        if (!isGenericVideo) {
            enrichedData = outlier.enriched_data;

            // ✅ NUEVO (15 Oct): Si ya tiene enriched_data pero target_player no es el primero, reordenar
            if (enrichedData && targetPlayer && enrichedData.players?.length > 0) {
                const firstPlayerName = enrichedData.players[0]?.name?.toLowerCase();
                const targetPlayerLower = targetPlayer.toLowerCase();

                if (firstPlayerName !== targetPlayerLower) {
                    logger.info(
                        '[Outliers API] 🔄 Reordenando enriched_data existente: target_player no es primero',
                        {
                            currentFirst: enrichedData.players[0]?.name,
                            targetPlayer: targetPlayer
                        }
                    );

                    // Buscar el target_player en el array
                    const targetIndex = enrichedData.players.findIndex(
                        p => p.name?.toLowerCase() === targetPlayerLower
                    );

                    if (targetIndex > 0) {
                        // Mover target_player al inicio
                        const [targetPlayerData] = enrichedData.players.splice(targetIndex, 1);
                        enrichedData.players.unshift(targetPlayerData);

                        // Guardar orden actualizado en DB
                        const { supabaseAdmin } = require('../config/supabase');
                        await supabaseAdmin
                            .from('youtube_outliers')
                            .update({ enriched_data: enrichedData })
                            .eq('video_id', videoId);

                        logger.info('[Outliers API] ✅ enriched_data reordenado y guardado');
                    } else if (targetIndex === -1) {
                        logger.warn(
                            '[Outliers API] ⚠️ Target player no encontrado en enriched_data, regenerando...'
                        );
                        enrichedData = null; // Forzar regeneración
                    }
                }
            }

            if (!enrichedData && outlier.mentioned_players?.length > 0) {
                // ✅ NUEVO (15 Oct): Reordenar jugadores para poner target_player primero
                let playersToEnrich = [...outlier.mentioned_players]; // Copia para no mutar original

                if (targetPlayer) {
                    // Filtrar target_player del array
                    playersToEnrich = playersToEnrich.filter(
                        p => p.toLowerCase() !== targetPlayer.toLowerCase()
                    );
                    // Poner target_player al inicio
                    playersToEnrich.unshift(targetPlayer);

                    logger.info('[Outliers API] 🎯 Reordenando jugadores: target_player primero', {
                        targetPlayer: targetPlayer,
                        totalPlayers: playersToEnrich.length
                    });
                }

                logger.info('[Outliers API] Enriqueciendo con API-Sports...', {
                    players: playersToEnrich
                });

                const ApiFootballClient = require('../services/apiFootball');
                const apiFootball = new ApiFootballClient();
                const enrichmentResult =
                    await apiFootball.getPlayerStatsForOutlier(playersToEnrich);

                if (enrichmentResult.success) {
                    enrichedData = enrichmentResult;

                    // Guardar enriched data en DB
                    const { supabaseAdmin } = require('../config/supabase');
                    await supabaseAdmin
                        .from('youtube_outliers')
                        .update({
                            enriched_data: enrichedData,
                            processing_status: 'enriched'
                        })
                        .eq('video_id', videoId);

                    logger.info('[Outliers API] ✅ Datos enriquecidos guardados en DB');
                } else {
                    logger.warn('[Outliers API] ⚠️ No se pudieron enriquecer datos de jugadores');
                    // Continue anyway, script generator can work without enriched data
                    enrichedData = { players: [], totalFound: 0 };
                }
            }
        } else {
            logger.info('[Outliers API] ⏭️  Saltando enriquecimiento (video genérico)');
        }

        // 4. Generar script con intelligentScriptGenerator
        logger.info('[Outliers API] Generando script inteligente con GPT-4o...');

        const intelligentScriptGenerator = require('../services/contentAnalysis/intelligentScriptGenerator');

        const scriptResult = await intelligentScriptGenerator.generateResponseScript(
            {
                video_id: outlier.video_id,
                title: outlier.title,
                channel_name: outlier.channel_name,
                views: outlier.views,
                transcription: outlier.transcription,
                content_analysis: outlier.content_analysis,
                enriched_data: enrichedData
            },
            {
                responseAngle,
                presenter
            }
        );

        if (!scriptResult.success) {
            throw new Error('Script generation failed');
        }

        // 4. Guardar generated_script en DB
        logger.info('[Outliers API] Guardando script en DB...');

        const { supabaseAdmin } = require('../config/supabase');
        const { error: updateError } = await supabaseAdmin
            .from('youtube_outliers')
            .update({
                generated_script: scriptResult,
                processing_status: 'scripted'
            })
            .eq('video_id', videoId);

        if (updateError) {
            throw updateError;
        }

        logger.info('[Outliers API] ✅ Script guardado en DB');

        // Format for VEO3
        const veo3Script = intelligentScriptGenerator.formatForVEO3(scriptResult);

        // Success response
        res.json({
            success: true,
            message: 'Script generated successfully',
            data: {
                videoId,
                script: scriptResult.script,
                veo3Format: veo3Script,
                metadata: scriptResult.metadata,
                totalCost: scriptResult.metadata.cost_usd,
                status: 'scripted',
                nextStep: 'POST /api/veo3/prepare-session with veo3Format'
            }
        });
    } catch (error) {
        logger.error('[Outliers API] Error generando script', {
            videoId,
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/outliers/analyze/:videoId
 * Analizar un outlier específico usando Gemini 2.0 Flash
 *
 * FLUJO NUEVO (con Gemini):
 * 1. Obtener outlier de DB
 * 2. Analizar video directamente con Gemini (transcripción + análisis en 1 call)
 * 3. Guardar resultados en DB
 * 4. Update status: analyzing → analyzed
 *
 * VENTAJAS vs yt-dlp + Whisper:
 * - ✅ No descarga videos (evita SABR protection)
 * - ✅ 1 API call en lugar de 2
 * - ✅ Más rápido (~30-60s vs 1-2 min)
 * - ✅ Más barato (~$0.004 vs $0.007)
 */
router.post('/analyze/:videoId', limiter, async (req, res) => {
    const { videoId } = req.params;

    try {
        logger.info('[Outliers API] Iniciando análisis con Gemini', { videoId });

        // 1. Obtener outlier de DB
        const outliers = await youtubeOutlierDetector.getOutliers({
            status: null // Get any status
        });

        const outlierData = outliers.find(o => o.video_id === videoId);

        if (!outlierData) {
            return res.status(404).json({
                success: false,
                error: `Outlier not found: ${videoId}`
            });
        }

        // Update status to 'analyzing'
        await youtubeOutlierDetector.updateOutlierStatus(videoId, 'analyzing');

        // 2. Analizar video con Gemini (transcripción + análisis en 1 call)
        logger.info('[Outliers API] Analizando video con Gemini 2.0 Flash...', { videoId });

        const geminiVideoAnalyzer = require('../services/contentAnalysis/geminiVideoAnalyzer');
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        let analysisResult;
        try {
            analysisResult = await geminiVideoAnalyzer.analyzeYouTubeVideo(youtubeUrl, outlierData);

            logger.info('[Outliers API] ✅ Análisis con Gemini completado', {
                duration: `${analysisResult.duration_seconds}s`,
                cost: `$${analysisResult.cost_usd.toFixed(4)}`,
                transcriptionLength: analysisResult.transcription.length
            });
        } catch (error) {
            logger.error('[Outliers API] Error en análisis con Gemini', {
                error: error.message
            });
            await youtubeOutlierDetector.updateOutlierStatus(videoId, 'failed');
            return res.status(500).json({
                success: false,
                error: 'Gemini analysis failed',
                details: error.message
            });
        }

        // 3. Guardar en DB
        logger.info('[Outliers API] Guardando resultados en DB...', { videoId });

        const { supabaseAdmin } = require('../config/supabase');

        try {
            const { error: updateError } = await supabaseAdmin
                .from('youtube_outliers')
                .update({
                    transcription: analysisResult.transcription,
                    content_analysis: analysisResult.contentAnalysis,
                    mentioned_players: analysisResult.contentAnalysis.players_mentioned || [],
                    video_type: analysisResult.contentAnalysis.video_type, // ✅ NUEVO (15 Oct): Guardar tipo de video
                    processing_status: 'analyzed',
                    analyzed_at: new Date().toISOString()
                })
                .eq('video_id', videoId);

            if (updateError) {
                throw updateError;
            }

            logger.info('[Outliers API] ✅ Resultados guardados en DB', {
                videoType: analysisResult.contentAnalysis.video_type
            });
        } catch (error) {
            logger.error('[Outliers API] Error guardando en DB', { error: error.message });
            return res.status(500).json({
                success: false,
                error: 'Failed to save analysis to database',
                details: error.message
            });
        }

        // Success response
        res.json({
            success: true,
            message: 'Outlier analyzed successfully with Gemini',
            data: {
                videoId,
                transcriptionLength: analysisResult.transcription.length,
                contentAnalysis: analysisResult.contentAnalysis,
                processingTime: `${analysisResult.duration_seconds}s`,
                totalCost: analysisResult.cost_usd,
                model: analysisResult.model,
                status: 'analyzed'
            }
        });
    } catch (error) {
        logger.error('[Outliers API] Error general en análisis', {
            videoId,
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
