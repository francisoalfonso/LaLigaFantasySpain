// Rutas para integración con YouTube Shorts
const express = require('express');
const logger = require('../utils/logger');
const youtubePublisher = require('../services/youtubePublisher');
const router = express.Router();

// GET /api/youtube/health - Health check de YouTube API
router.get('/health', async (req, res) => {
    try {
        logger.info('🔄 [YouTube] Health check...');

        const healthResult = await youtubePublisher.healthCheck();

        res.json(healthResult);
    } catch (error) {
        logger.error('❌ [YouTube] Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error ejecutando health check',
            error: error.message
        });
    }
});

// GET /api/youtube/auth - Obtener URL de autorización OAuth2
router.get('/auth', async (req, res) => {
    try {
        const authUrl = youtubePublisher.getAuthUrl();

        res.json({
            success: true,
            authUrl,
            message: 'Abre esta URL en tu navegador para autorizar la aplicación',
            instructions: [
                '1. Abre la URL en tu navegador',
                '2. Inicia sesión con tu cuenta de YouTube',
                '3. Autoriza los permisos',
                '4. Copia el código de autorización',
                '5. Usa POST /api/youtube/token con el código'
            ]
        });
    } catch (error) {
        logger.error('❌ [YouTube] Error generando auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando URL de autorización',
            error: error.message
        });
    }
});

// POST /api/youtube/token - Intercambiar código por tokens
router.post('/token', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'code es requerido'
            });
        }

        const tokens = await youtubePublisher.getTokensFromCode(code);

        res.json({
            success: true,
            message: 'Tokens obtenidos exitosamente',
            tokens: {
                access_token: tokens.access_token ? 'OK' : 'MISSING',
                refresh_token: tokens.refresh_token || 'MISSING',
                expiry_date: tokens.expiry_date
            },
            instructions: [
                '1. Copia el refresh_token',
                '2. Agrégalo a .env como YOUTUBE_REFRESH_TOKEN',
                '3. Reinicia el servidor',
                '4. Verifica con GET /api/youtube/health'
            ]
        });
    } catch (error) {
        logger.error('❌ [YouTube] Error obteniendo tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo tokens',
            error: error.message
        });
    }
});

// POST /api/youtube/publish - Publicar Short directamente
router.post('/publish', async (req, res) => {
    try {
        const { videoPath, title, description, tags, category, privacyStatus, scheduledPublishTime } = req.body;

        if (!videoPath || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'videoPath, title y description son requeridos'
            });
        }

        logger.info('📤 [YouTube] Publicando Short...', {
            videoPath,
            title: title.substring(0, 50) + '...',
            scheduled: !!scheduledPublishTime
        });

        // Publicar con YouTube API
        const result = await youtubePublisher.publishShort({
            videoPath,
            title,
            description,
            tags: tags || [],
            category,
            privacyStatus,
            scheduledPublishTime
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Error publicando en YouTube',
                error: result.error,
                details: result.details
            });
        }

        if (scheduledPublishTime) {
            logger.info('🎉 [YouTube] ¡Short programado!', {
                videoId: result.videoId,
                scheduledFor: scheduledPublishTime
            });
        } else {
            logger.info('🎉 [YouTube] ¡Short publicado!', {
                videoId: result.videoId,
                url: result.url
            });
        }

        res.json({
            success: true,
            message: scheduledPublishTime ? 'Short programado exitosamente' : 'Short publicado exitosamente',
            data: result
        });
    } catch (error) {
        logger.error('❌ [YouTube] Error en /publish:', error);
        res.status(500).json({
            success: false,
            message: 'Error publicando Short',
            error: error.message
        });
    }
});

// GET /api/youtube/channel - Obtener info del canal
router.get('/channel', async (req, res) => {
    try {
        const channelInfo = await youtubePublisher.getChannelInfo();

        res.json({
            success: true,
            data: channelInfo
        });
    } catch (error) {
        logger.error('❌ [YouTube] Error obteniendo info de canal:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo información del canal',
            error: error.message
        });
    }
});

// POST /api/youtube/upload - Upload completo con thumbnails y playlists automáticas
router.post('/upload', async (req, res) => {
    try {
        const {
            videoPath,
            title,
            description,
            tags,
            platform,
            sessionId,
            playerData,
            autoGenerateThumbnail,
            autoAssignPlaylists,
            playlistCategory,
            teamLogoPath,
            category,
            privacyStatus,
            scheduledPublishTime
        } = req.body;

        if (!videoPath || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'videoPath, title y description son requeridos'
            });
        }

        logger.info('📤 [YouTube] Upload completo iniciado...', {
            videoPath,
            title: title.substring(0, 50) + '...',
            platform,
            autoGenerateThumbnail,
            autoAssignPlaylists,
            scheduled: !!scheduledPublishTime
        });

        // Publicar con YouTube API (con todas las features automáticas)
        const result = await youtubePublisher.publishShort({
            videoPath,
            title,
            description,
            tags: tags || [],
            playerData,
            category,
            privacyStatus,
            scheduledPublishTime,
            autoGenerateThumbnail: autoGenerateThumbnail !== false, // Default true
            teamLogoPath,
            autoAssignPlaylists: autoAssignPlaylists !== false // Default true
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Error en upload a YouTube',
                error: result.error,
                details: result.details
            });
        }

        logger.info('🎉 [YouTube] Upload completo exitoso:', {
            videoId: result.videoId,
            url: result.url,
            thumbnail: result.thumbnail?.uploaded ? '✅' : '❌',
            playlists: result.playlists?.assigned ? '✅' : '❌'
        });

        res.json({
            success: true,
            message: scheduledPublishTime ? 'Video programado exitosamente' : 'Video publicado exitosamente',
            ...result
        });
    } catch (error) {
        logger.error('❌ [YouTube] Error en /upload:', error);
        res.status(500).json({
            success: false,
            message: 'Error en upload completo',
            error: error.message
        });
    }
});

module.exports = router;
