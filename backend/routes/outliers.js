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
 * POST /api/outliers/analyze/:videoId
 * Analizar un outlier específico (transcripción + AI analysis)
 *
 * FLUJO:
 * 1. Obtener outlier de DB
 * 2. Descargar audio con yt-dlp
 * 3. Transcribir con Whisper API
 * 4. Analizar contenido con GPT-4o Mini
 * 5. Guardar transcripción + análisis en DB
 * 6. Limpiar archivos temporales
 * 7. Update status: analyzing → analyzed
 */
router.post('/analyze/:videoId', limiter, async (req, res) => {
    const { videoId } = req.params;

    try {
        logger.info('[Outliers API] Iniciando análisis de outlier', { videoId });

        // 1. Obtener outlier de DB
        const outlier = await youtubeOutlierDetector.getOutliers({
            status: null // Get any status
        });

        const outlierData = outlier.find(o => o.video_id === videoId);

        if (!outlierData) {
            return res.status(404).json({
                success: false,
                error: `Outlier not found: ${videoId}`
            });
        }

        // Update status to 'analyzing'
        await youtubeOutlierDetector.updateOutlierStatus(videoId, 'analyzing');

        // 2. Descargar audio (solo audio, más rápido y ligero)
        logger.info('[Outliers API] Descargando audio del video...', { videoId });

        const { exec } = require('child_process');
        const fs = require('fs');
        const path = require('path');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const tempDir = path.join(__dirname, '../../output/temp-outliers');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const audioPath = path.join(tempDir, `${videoId}.m4a`);

        // Download only audio (10x faster, 10x smaller)
        const ytdlpCmd = `yt-dlp -f bestaudio -o "${audioPath}" "https://www.youtube.com/watch?v=${videoId}"`;

        try {
            await execAsync(ytdlpCmd, { timeout: 120000 }); // 2 min timeout
            logger.info('[Outliers API] ✅ Audio descargado', { audioPath });
        } catch (error) {
            logger.error('[Outliers API] Error descargando audio', { error: error.message });
            await youtubeOutlierDetector.updateOutlierStatus(videoId, 'failed');
            return res.status(500).json({
                success: false,
                error: 'Failed to download video audio',
                details: error.message
            });
        }

        // 3. Transcribir con Whisper API
        logger.info('[Outliers API] Transcribiendo audio con Whisper...', { videoId });

        const transcriptionService = require('../services/contentAnalysis/transcriptionService');
        let transcription;

        try {
            transcription = await transcriptionService.transcribeAudio(audioPath);
            logger.info('[Outliers API] ✅ Transcripción completada', {
                length: transcription.length,
                cost: '$0.006'
            });
        } catch (error) {
            logger.error('[Outliers API] Error transcribiendo', { error: error.message });
            // Clean up
            fs.unlinkSync(audioPath);
            await youtubeOutlierDetector.updateOutlierStatus(videoId, 'failed');
            return res.status(500).json({
                success: false,
                error: 'Transcription failed',
                details: error.message
            });
        }

        // 4. Analizar contenido con GPT-4o Mini
        logger.info('[Outliers API] Analizando contenido con GPT...', { videoId });

        const contentAnalyzer = require('../services/contentAnalysis/contentAnalyzer');
        let contentAnalysis;

        try {
            const analysisPrompt = `Analiza este video viral de Fantasy La Liga:

TÍTULO: ${outlierData.title}
CANAL: ${outlierData.channel_name}
VIEWS: ${outlierData.views}
TRANSCRIPCIÓN:
${transcription}

Identifica y devuelve en formato JSON:
{
  "thesis": "Tesis principal del video en 1 frase",
  "key_arguments": ["Argumento 1", "Argumento 2", "Argumento 3"],
  "players_mentioned": ["Pedri", "Lewandowski"],
  "viral_hooks": ["Hook 1", "Hook 2"],
  "response_angle": "rebatir | complementar | ampliar",
  "suggested_data_points": ["Dato que buscar en API-Sports", "Otro dato"],
  "emotional_tone": "neutral | entusiasta | crítico | alarmista",
  "target_audience": "descripción de la audiencia"
}`;

            contentAnalysis = await contentAnalyzer.analyzeContent(analysisPrompt);
            logger.info('[Outliers API] ✅ Análisis completado', {
                cost: '$0.001'
            });
        } catch (error) {
            logger.error('[Outliers API] Error analizando contenido', { error: error.message });
            // Clean up
            fs.unlinkSync(audioPath);
            await youtubeOutlierDetector.updateOutlierStatus(videoId, 'failed');
            return res.status(500).json({
                success: false,
                error: 'Content analysis failed',
                details: error.message
            });
        }

        // 5. Guardar en DB
        logger.info('[Outliers API] Guardando resultados en DB...', { videoId });

        const { supabaseAdmin } = require('../config/supabase');

        try {
            const { error: updateError } = await supabaseAdmin
                .from('youtube_outliers')
                .update({
                    transcription: transcription,
                    content_analysis: contentAnalysis,
                    mentioned_players: contentAnalysis.players_mentioned || [],
                    processing_status: 'analyzed',
                    analyzed_at: new Date().toISOString()
                })
                .eq('video_id', videoId);

            if (updateError) {
                throw updateError;
            }

            logger.info('[Outliers API] ✅ Resultados guardados en DB');
        } catch (error) {
            logger.error('[Outliers API] Error guardando en DB', { error: error.message });
            // Clean up
            fs.unlinkSync(audioPath);
            return res.status(500).json({
                success: false,
                error: 'Failed to save analysis to database',
                details: error.message
            });
        }

        // 6. Limpiar archivos temporales
        try {
            fs.unlinkSync(audioPath);
            logger.info('[Outliers API] 🗑️  Archivo temporal eliminado');
        } catch (cleanupError) {
            logger.warn('[Outliers API] No se pudo eliminar archivo temporal', {
                audioPath,
                error: cleanupError.message
            });
        }

        // Success response
        res.json({
            success: true,
            message: 'Outlier analyzed successfully',
            data: {
                videoId,
                transcriptionLength: transcription.length,
                contentAnalysis,
                processingTime: 'N/A',
                totalCost: 0.007, // $0.006 Whisper + $0.001 GPT
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
