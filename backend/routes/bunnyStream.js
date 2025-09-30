/**
 * Bunny.net Stream Routes - Gestión profesional de videos
 * Sistema completo de hosting, analytics y distribución de videos
 */

const express = require('express');
const logger = require('../utils/logger');
const axios = require('axios');
const BunnyStreamManager = require('../services/bunnyStreamManager');

const router = express.Router();
const bunnyStream = new BunnyStreamManager();

/**
 * @route GET /api/bunny/test
 * @desc Test de conectividad con Bunny.net Stream
 */
router.get('/test', async (req, res) => {
    try {
        logger.info('[Bunny Routes] Test de conectividad iniciado...');

        const result = await bunnyStream.testConnection();

        if (result.success) {
            res.json({
                success: true,
                message: 'Bunny.net Stream conectado exitosamente',
                data: {
                    library: result.library,
                    libraryId: bunnyStream.libraryId,
                    cdnUrl: bunnyStream.cdnUrl
                },
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'No se pudo conectar con Bunny.net Stream',
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('[Bunny Routes] Error en test:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno en test Bunny.net',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/bunny/upload-from-veo3
 * @desc Subir video desde URL de VEO3 a Bunny.net
 */
router.post('/upload-from-veo3', async (req, res) => {
    try {
        const { veo3Url, title, metadata = {} } = req.body;

        if (!veo3Url) {
            return res.status(400).json({
                success: false,
                message: 'veo3Url requerido'
            });
        }

        logger.info('[Bunny Routes] Subiendo video desde VEO3:', veo3Url);

        const videoData = await bunnyStream.uploadFromVeo3Url(veo3Url, {
            title: title || `Fantasy Video ${Date.now()}`,
            ...metadata
        });

        res.json({
            success: true,
            message: 'Video subido exitosamente a Bunny.net',
            data: videoData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error subiendo video:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error subiendo video a Bunny.net',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/videos
 * @desc Listar videos en Bunny.net con filtros
 */
router.get('/videos', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            dateFrom,
            source = 'local' // 'local' o 'bunny'
        } = req.query;

        logger.info(`[Bunny Routes] Listando videos (source: ${source})`);

        let videos;

        if (source === 'bunny') {
            // Obtener desde Bunny.net directamente
            const bunnyData = await bunnyStream.listVideos(page, limit);

            // Transformar datos de Bunny.net al formato esperado por el frontend
            const transformedVideos = (bunnyData.items || []).map(video => ({
                id: video.guid,
                title: video.title,
                dateUploaded: video.dateUploaded,
                uploadedAt: video.dateUploaded,
                status: video.status, // 4 = Ready for playback
                duration: video.length,
                size: video.storageSize,
                views: video.views,
                // URLs para reproducción (usando nuestro proxy)
                directUrl: `http://localhost:3000/api/bunny/videos/${video.guid}/stream`,
                embedUrl: `${bunnyStream.cdnUrl}/${video.guid}/iframe`,
                thumbnailUrl: video.thumbnailFileName ? `${bunnyStream.cdnUrl}/${video.guid}/${video.thumbnailFileName}` : null,
                bunnyUrl: `${bunnyStream.cdnUrl}/${video.guid}/playlist.m3u8`,
                // Metadata
                metadata: {
                    type: 'veo3_generated',
                    source: 'bunny_net',
                    width: video.width,
                    height: video.height,
                    framerate: video.framerate,
                    availableResolutions: video.availableResolutions
                }
            }));

            videos = {
                videos: transformedVideos,
                total: bunnyData.totalItems || 0,
                page: parseInt(page),
                totalPages: Math.ceil((bunnyData.totalItems || 0) / limit)
            };
        } else {
            // Obtener desde metadata local con filtros
            const localVideos = await bunnyStream.getLocalVideos({
                type,
                dateFrom,
                limit: parseInt(limit)
            });

            videos = {
                videos: localVideos,
                total: localVideos.length,
                page: 1,
                totalPages: 1
            };
        }

        res.json({
            success: true,
            data: videos,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error listando videos:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo lista de videos',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/videos/:videoId
 * @desc Obtener información detallada de un video
 */
router.get('/videos/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { source = 'bunny' } = req.query;

        logger.info(`[Bunny Routes] Obteniendo info de video: ${videoId}`);

        let videoInfo;

        if (source === 'bunny') {
            videoInfo = await bunnyStream.getVideoInfo(videoId);
        } else {
            const localVideos = await bunnyStream.getLocalVideos();
            videoInfo = localVideos.find(v => v.id === videoId);
        }

        if (!videoInfo) {
            return res.status(404).json({
                success: false,
                message: 'Video no encontrado'
            });
        }

        res.json({
            success: true,
            data: videoInfo,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error obteniendo video:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo información del video',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/videos/:videoId/analytics
 * @desc Obtener analytics de un video específico
 */
router.get('/videos/:videoId/analytics', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { dateFrom, dateTo } = req.query;

        logger.info(`[Bunny Routes] Obteniendo analytics de video: ${videoId}`);

        const analytics = await bunnyStream.getVideoAnalytics(videoId, dateFrom, dateTo);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                message: 'Analytics no disponibles para este video'
            });
        }

        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error obteniendo analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo analytics del video',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route DELETE /api/bunny/videos/:videoId
 * @desc Eliminar video de Bunny.net
 */
router.delete('/videos/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;

        logger.info(`[Bunny Routes] Eliminando video: ${videoId}`);

        const success = await bunnyStream.deleteVideo(videoId);

        if (success) {
            res.json({
                success: true,
                message: 'Video eliminado exitosamente',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error eliminando video'
            });
        }

    } catch (error) {
        logger.error('[Bunny Routes] Error eliminando video:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error eliminando video',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/videos/:videoId/embed
 * @desc Generar código de embed para un video
 */
router.get('/videos/:videoId/embed', async (req, res) => {
    try {
        const { videoId } = req.params;
        const {
            width = '100%',
            height = '400px',
            autoplay = false,
            controls = true
        } = req.query;

        logger.info(`[Bunny Routes] Generando embed para video: ${videoId}`);

        const embedCode = bunnyStream.generateEmbedCode(videoId, {
            width,
            height,
            autoplay: autoplay === 'true',
            controls: controls !== 'false'
        });

        res.json({
            success: true,
            data: {
                embedCode,
                videoId,
                options: { width, height, autoplay, controls }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error generando embed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error generando código de embed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/bunny/videos/:videoId/make-public
 * @desc Hacer un video público en Bunny.net
 */
router.post('/videos/:videoId/make-public', async (req, res) => {
    try {
        const { videoId } = req.params;
        logger.info(`[Bunny Routes] Haciendo público el video: ${videoId}`);

        const result = await bunnyStream.makeVideoPublic(videoId);

        if (result) {
            res.json({
                success: true,
                message: 'Video hecho público exitosamente',
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error haciendo video público',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('[Bunny Routes] Error haciendo video público:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/videos/:videoId/stream
 * @desc Redirigir a CDN de Bunny.net directamente para streaming público
 */
router.get('/videos/:videoId/stream', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { quality = '720p' } = req.query;

        logger.info(`[Bunny Routes] Redirigiendo a streaming directo: ${videoId} (${quality})`);

        // Usar playlist.m3u8 para streaming adaptativo o URL directa del CDN
        const streamUrl = `${bunnyStream.cdnUrl}/${videoId}/playlist.m3u8`;

        // También intentar con URL directa de video
        const directVideoUrl = `${bunnyStream.cdnUrl}/${videoId}/play_${quality}.mp4`;

        // Primero intentar verificar que el video existe
        try {
            const testResponse = await axios.head(streamUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Fantasy-LaLiga-Player/1.0'
                }
            });

            logger.info(`[Bunny Routes] ✅ Video accesible, redirigiendo a: ${streamUrl}`);

            // Redirigir directamente al CDN de Bunny.net
            res.redirect(302, streamUrl);

        } catch (headError) {
            logger.info(`[Bunny Routes] Playlist no accesible, intentando video directo: ${directVideoUrl}`);

            // Intentar con video directo
            try {
                const directTestResponse = await axios.head(directVideoUrl, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Fantasy-LaLiga-Player/1.0'
                    }
                });

                logger.info(`[Bunny Routes] ✅ Video directo accesible, redirigiendo`);
                res.redirect(302, directVideoUrl);

            } catch (directError) {
                logger.error(`[Bunny Routes] ❌ Video no accesible en CDN:`, directError.message);

                res.status(404).json({
                    success: false,
                    message: 'Video no disponible públicamente',
                    suggestions: {
                        makePublic: `POST /api/bunny/videos/${videoId}/make-public`,
                        directCdnUrl: streamUrl,
                        directVideoUrl: directVideoUrl
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }

    } catch (error) {
        logger.error('[Bunny Routes] Error en streaming redirect:', error.message);

        res.status(500).json({
            success: false,
            message: 'Error configurando streaming',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/dashboard
 * @desc Obtener datos completos para el dashboard de videos
 */
router.get('/dashboard', async (req, res) => {
    try {
        logger.info('[Bunny Routes] Obteniendo datos completos del dashboard');

        const [localVideos, bunnyVideos, analytics] = await Promise.all([
            bunnyStream.getLocalVideos({ limit: 10 }),
            bunnyStream.listVideos(1, 10),
            bunnyStream.getVideoAnalytics()
        ]);

        const dashboardData = {
            summary: {
                totalVideos: bunnyVideos.totalItems || 0,
                recentVideos: localVideos.length,
                totalViews: analytics?.totalViews || 0,
                totalBandwidth: analytics?.totalBandwidth || 0
            },
            recentVideos: localVideos.slice(0, 5),
            topPerforming: localVideos
                .filter(v => v.metadata?.views > 0)
                .sort((a, b) => (b.metadata?.views || 0) - (a.metadata?.views || 0))
                .slice(0, 3),
            byType: {
                veo3_generated: localVideos.filter(v => v.metadata?.type === 'veo3_generated').length,
                chollos: localVideos.filter(v => v.metadata?.type === 'chollos').length,
                analysis: localVideos.filter(v => v.metadata?.type === 'analysis').length
            },
            storage: {
                used: bunnyVideos.items?.reduce((acc, video) => acc + (video.storageSize || 0), 0) || 0,
                videos: bunnyVideos.totalItems || 0
            }
        };

        res.json({
            success: true,
            data: dashboardData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error obteniendo dashboard:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo datos del dashboard',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/bunny/config
 * @desc Obtener configuración actual de Bunny.net Stream
 */
router.get('/config', (req, res) => {
    try {
        const config = {
            configured: !!(bunnyStream.apiKey && bunnyStream.libraryId),
            libraryId: bunnyStream.libraryId || 'No configurado',
            cdnUrl: bunnyStream.cdnUrl || 'No configurado',
            baseUrl: bunnyStream.baseUrl,
            features: {
                upload: !!(bunnyStream.apiKey && bunnyStream.libraryId),
                analytics: !!(bunnyStream.apiKey && bunnyStream.libraryId),
                streaming: !!(bunnyStream.cdnUrl),
                embed: !!(bunnyStream.cdnUrl)
            }
        };

        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('[Bunny Routes] Error obteniendo configuración:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo configuración',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;