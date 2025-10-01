/**
 * YouTube Shorts Routes
 *
 * API endpoints para el sistema completo de YouTube Shorts.
 * Incluye generación, procesamiento, upload y analytics.
 *
 * Basado en: docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const ShortsGenerator = require('../services/youtubeShorts/shortsGenerator');
const CaptionsService = require('../services/youtubeShorts/captionsService');
const TextOverlayService = require('../services/youtubeShorts/textOverlayService');
const ThumbnailGenerator = require('../services/youtubeShorts/thumbnailGenerator');
const YouTubeAPI = require('../services/youtubeShorts/youtubeAPI');
const ViralVideoBuilder = require('../services/veo3/viralVideoBuilder');

// Inicializar servicios
const shortsGenerator = new ShortsGenerator();
const captionsService = new CaptionsService();
const textOverlayService = new TextOverlayService();
const thumbnailGenerator = new ThumbnailGenerator();
const youtubeAPI = new YouTubeAPI();
const viralBuilder = new ViralVideoBuilder();

// ========================================
// ENDPOINTS DE TESTING Y CONFIGURACIÓN
// ========================================

/**
 * GET /api/youtube-shorts/test
 * Test de conectividad completa del sistema
 */
router.get('/test', async (req, res) => {
    try {
        logger.info('🧪 Testing YouTube Shorts system...');

        const tests = {
            shortsGenerator: shortsGenerator.getStats(),
            captionsService: await captionsService.getStats(),
            textOverlayService: textOverlayService.getStats(),
            thumbnailGenerator: await thumbnailGenerator.getStats(),
            youtubeAPI: youtubeAPI.getStats()
        };

        res.json({
            success: true,
            message: 'YouTube Shorts system operational',
            tests,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('❌ Error en test:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/youtube-shorts/config
 * Configuración actual del sistema
 */
router.get('/config', (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                shortsGenerator: shortsGenerator.config,
                captions: captionsService.config,
                overlays: textOverlayService.config,
                thumbnails: thumbnailGenerator.config,
                youtube: youtubeAPI.config
            }
        });
    } catch (error) {
        logger.error('❌ Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// GENERACIÓN DE SHORTS
// ========================================

/**
 * POST /api/youtube-shorts/generate
 * Genera configuración optimizada de Short (sin generar video aún)
 *
 * Body:
 * {
 *   "contentType": "chollo_viral" | "breaking_news" | "stats_impactantes" | "prediccion_jornada",
 *   "contentData": { playerName, price, etc... }
 * }
 */
router.post('/generate', async (req, res) => {
    try {
        const { contentType, contentData } = req.body;

        logger.info(`📱 Generando Short config: ${contentType}`);

        // Validar input
        if (!contentType || !contentData) {
            return res.status(400).json({
                success: false,
                error: 'contentType y contentData son requeridos'
            });
        }

        // Generar configuración optimizada
        const shortConfig = shortsGenerator.generateShort(contentData, contentType);

        // Validar calidad
        const validation = shortsGenerator.validateShortQuality(shortConfig);

        res.json({
            success: true,
            shortConfig,
            validation,
            message: 'Configuración generada. Usar /generate-video para crear video real con VEO3.'
        });
    } catch (error) {
        logger.error('❌ Error generando Short config:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/youtube-shorts/generate-video
 * Genera video REAL con VEO3 + subtítulos + overlays + thumbnail
 *
 * Body:
 * {
 *   "contentType": "chollo_viral",
 *   "contentData": { playerName, price, etc... },
 *   "autoUpload": false (opcional)
 * }
 */
router.post('/generate-video', async (req, res) => {
    try {
        const { contentType, contentData, autoUpload = false } = req.body;

        logger.info(`🎬 Generando Short COMPLETO: ${contentType}`);

        // 1. Generar configuración optimizada
        const shortConfig = shortsGenerator.generateShort(contentData, contentType);

        // 2. Generar video con VEO3 (3 segmentos)
        logger.info('🎥 Generando video base con VEO3...');
        const videoResult = await viralBuilder.generateViralVideo(contentData, contentType);

        if (!videoResult.success) {
            throw new Error('Error generando video con VEO3');
        }

        const baseVideoPath = videoResult.finalVideoPath;
        const videoDuration = videoResult.totalDuration;

        // 3. Generar subtítulos
        logger.info('📝 Generando subtítulos automáticos...');
        const captionsResult = await captionsService.generateFromVEO3Segments(
            shortConfig.segments,
            'ass'
        );

        // 4. Aplicar subtítulos al video
        if (captionsResult.success) {
            const videoWithCaptions = baseVideoPath.replace('.mp4', '_captions.mp4');
            await captionsService.applyCaptionsToVideo(
                baseVideoPath,
                captionsResult.captionsFile,
                videoWithCaptions
            );
            videoResult.finalVideoPath = videoWithCaptions;
        }

        // 5. Generar overlays de texto
        logger.info('📊 Generando overlays de datos...');
        const overlays = textOverlayService.generateOverlaysByContentType(
            contentType,
            contentData,
            videoDuration
        );

        // 6. Aplicar overlays al video
        if (overlays.length > 0) {
            const videoWithOverlays = videoResult.finalVideoPath.replace('.mp4', '_overlays.mp4');
            await textOverlayService.applyOverlaysToVideo(
                videoResult.finalVideoPath,
                overlays,
                videoDuration,
                videoWithOverlays
            );
            videoResult.finalVideoPath = videoWithOverlays;
        }

        // 7. Generar thumbnail automático
        logger.info('🖼️ Generando thumbnail...');
        const thumbnailResult = await thumbnailGenerator.generateThumbnail(
            contentType,
            contentData
        );

        // 8. Si autoUpload = true, subir a YouTube
        let uploadResult = null;
        if (autoUpload) {
            logger.info('📤 Subiendo a YouTube...');

            const metadata = {
                title: shortConfig.youtube.title,
                description: shortConfig.youtube.description,
                tags: shortConfig.youtube.tags,
                thumbnailPath: thumbnailResult.success ? thumbnailResult.thumbnailPath : null
            };

            uploadResult = await youtubeAPI.uploadShort(videoResult.finalVideoPath, metadata);
        }

        logger.info('✅ Short completo generado exitosamente');

        res.json({
            success: true,
            video: {
                path: videoResult.finalVideoPath,
                duration: videoDuration,
                segments: videoResult.segments
            },
            captions: captionsResult,
            overlays: {
                count: overlays.length,
                overlays
            },
            thumbnail: thumbnailResult,
            upload: uploadResult,
            shortConfig,
            message: autoUpload
                ? 'Short generado y subido a YouTube'
                : 'Short generado. Usar /upload para subir a YouTube.'
        });
    } catch (error) {
        logger.error('❌ Error generando Short completo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// SUBTÍTULOS
// ========================================

/**
 * POST /api/youtube-shorts/captions/generate
 * Genera subtítulos desde segmentos VEO3
 */
router.post('/captions/generate', async (req, res) => {
    try {
        const { segments, style = 'karaoke', outputFormat = 'ass' } = req.body;

        logger.info(`📝 Generando subtítulos ${style} formato ${outputFormat}...`);

        const result = await captionsService.generateCaptions(segments, style, outputFormat);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error generando subtítulos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/youtube-shorts/captions/apply
 * Aplica subtítulos a un video existente
 */
router.post('/captions/apply', async (req, res) => {
    try {
        const { videoPath, captionsFile, outputPath } = req.body;

        logger.info('🎬 Aplicando subtítulos a video...');

        const result = await captionsService.applyCaptionsToVideo(
            videoPath,
            captionsFile,
            outputPath
        );

        res.json(result);
    } catch (error) {
        logger.error('❌ Error aplicando subtítulos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// OVERLAYS DE TEXTO
// ========================================

/**
 * POST /api/youtube-shorts/overlays/generate
 * Genera overlays de texto
 */
router.post('/overlays/generate', async (req, res) => {
    try {
        const { contentType, contentData, videoDuration } = req.body;

        logger.info(`📊 Generando overlays para ${contentType}...`);

        const overlays = textOverlayService.generateOverlaysByContentType(
            contentType,
            contentData,
            videoDuration
        );

        res.json({
            success: true,
            overlays,
            count: overlays.length
        });
    } catch (error) {
        logger.error('❌ Error generando overlays:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/youtube-shorts/overlays/apply
 * Aplica overlays a un video existente
 */
router.post('/overlays/apply', async (req, res) => {
    try {
        const { videoPath, overlays, videoDuration, outputPath } = req.body;

        logger.info('🎬 Aplicando overlays a video...');

        const result = await textOverlayService.applyOverlaysToVideo(
            videoPath,
            overlays,
            videoDuration,
            outputPath
        );

        res.json(result);
    } catch (error) {
        logger.error('❌ Error aplicando overlays:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// THUMBNAILS
// ========================================

/**
 * POST /api/youtube-shorts/thumbnail/generate
 * Genera thumbnail automático
 */
router.post('/thumbnail/generate', async (req, res) => {
    try {
        const { contentType, contentData } = req.body;

        logger.info(`🖼️ Generando thumbnail para ${contentType}...`);

        const result = await thumbnailGenerator.generateThumbnail(contentType, contentData);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error generando thumbnail:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/youtube-shorts/thumbnail/variations
 * Genera múltiples variaciones para A/B testing
 */
router.post('/thumbnail/variations', async (req, res) => {
    try {
        const { contentType, contentData, count = 3 } = req.body;

        logger.info(`🎨 Generando ${count} variaciones de thumbnail...`);

        const result = await thumbnailGenerator.generateVariations(contentType, contentData, count);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error generando variaciones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// YOUTUBE UPLOAD Y GESTIÓN
// ========================================

/**
 * POST /api/youtube-shorts/upload
 * Sube Short a YouTube
 */
router.post('/upload', async (req, res) => {
    try {
        const { videoPath, metadata } = req.body;

        logger.info('📤 Subiendo Short a YouTube...');

        const result = await youtubeAPI.uploadShort(videoPath, metadata);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error subiendo Short:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/youtube-shorts/videos
 * Lista videos del canal
 */
router.get('/videos', async (req, res) => {
    try {
        const maxResults = parseInt(req.query.maxResults) || 10;

        logger.info(`📺 Listando ${maxResults} videos del canal...`);

        const result = await youtubeAPI.listChannelVideos(maxResults);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error listando videos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/youtube-shorts/video/:videoId/stats
 * Obtiene estadísticas de un video
 */
router.get('/video/:videoId/stats', async (req, res) => {
    try {
        const { videoId } = req.params;

        logger.info(`📊 Obteniendo stats de video ${videoId}...`);

        const result = await youtubeAPI.getVideoStats(videoId);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error obteniendo stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/youtube-shorts/video/:videoId
 * Elimina un video
 */
router.delete('/video/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;

        logger.info(`🗑️ Eliminando video ${videoId}...`);

        const result = await youtubeAPI.deleteVideo(videoId);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error eliminando video:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/youtube-shorts/video/:videoId/metadata
 * Actualiza metadata de un video
 */
router.put('/video/:videoId/metadata', async (req, res) => {
    try {
        const { videoId } = req.params;
        const metadata = req.body;

        logger.info(`📝 Actualizando metadata de video ${videoId}...`);

        const result = await youtubeAPI.updateVideoMetadata(videoId, metadata);

        res.json(result);
    } catch (error) {
        logger.error('❌ Error actualizando metadata:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/youtube-shorts/quota
 * Verifica uso de quota
 */
router.get('/quota', async (req, res) => {
    try {
        logger.info('📊 Verificando quota YouTube API...');

        const result = await youtubeAPI.checkQuotaUsage();

        res.json({
            success: true,
            quota: result
        });
    } catch (error) {
        logger.error('❌ Error verificando quota:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/youtube-shorts/youtube-test
 * Test conexión YouTube API
 */
router.get('/youtube-test', async (req, res) => {
    try {
        logger.info('🔍 Testeando conexión YouTube API...');

        const result = await youtubeAPI.testConnection();

        res.json(result);
    } catch (error) {
        logger.error('❌ Error en test YouTube:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// LIMPIEZA Y MANTENIMIENTO
// ========================================

/**
 * POST /api/youtube-shorts/cleanup
 * Limpia archivos temporales antiguos
 */
router.post('/cleanup', async (req, res) => {
    try {
        logger.info('🧹 Limpiando archivos temporales...');

        await Promise.all([
            captionsService.cleanupTempFiles(),
            textOverlayService.cleanupTempFiles(),
            thumbnailGenerator.cleanupOldThumbnails()
        ]);

        res.json({
            success: true,
            message: 'Limpieza completada correctamente'
        });
    } catch (error) {
        logger.error('❌ Error en limpieza:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
