/**
 * Video Routes - Servir videos locales y gestión completa
 * Sistema robusto que no depende de URLs externas
 */

const express = require('express');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const videoManager = require('../services/videoManager');

const router = express.Router();

/**
 * Servir video local por filename
 * GET /api/videos/:filename
 */
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Verificar que el archivo existe
        const videoExists = await videoManager.videoExists(filename);
        if (!videoExists) {
            return res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }

        // Obtener path del video
        const videoPath = await videoManager.getVideoPath(filename);

        // Configurar headers para streaming de video
        const stat = await fs.stat(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Streaming por chunks para videos grandes
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            const file = require('fs').createReadStream(videoPath, { start, end });

            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            // Servir archivo completo
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(200, head);
            require('fs').createReadStream(videoPath).pipe(res);
        }

    } catch (error) {
        logger.error('❌ Error sirviendo video:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * Listar videos disponibles
 * GET /api/videos
 */
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const videos = await videoManager.listVideos(limit);

        res.json({
            success: true,
            data: {
                videos: videos,
                total: videos.length
            }
        });

    } catch (error) {
        logger.error('❌ Error listando videos:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo lista de videos'
        });
    }
});

/**
 * Obtener información de video específico
 * GET /api/videos/info/:videoId
 */
router.get('/info/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await videoManager.getVideo(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }

        res.json({
            success: true,
            data: video
        });

    } catch (error) {
        logger.error('❌ Error obteniendo info de video:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo información del video'
        });
    }
});

/**
 * Concatenar múltiples videos
 * POST /api/videos/concatenate
 */
router.post('/concatenate', async (req, res) => {
    try {
        const { videoIds, metadata = {} } = req.body;

        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere array de videoIds'
            });
        }

        logger.info('🔗 Concatenando videos:', videoIds);

        const result = await videoManager.concatenateVideos(videoIds, metadata);

        res.json({
            success: true,
            message: 'Videos concatenados exitosamente',
            data: result
        });

    } catch (error) {
        logger.error('❌ Error concatenando videos:', error.message);
        res.status(500).json({
            success: false,
            error: `Error concatenando videos: ${error.message}`
        });
    }
});

/**
 * Limpiar videos antiguos
 * POST /api/videos/cleanup
 */
router.post('/cleanup', async (req, res) => {
    try {
        const { maxAgeDays = 7 } = req.body;

        const result = await videoManager.cleanupOldVideos(maxAgeDays);

        res.json({
            success: true,
            message: 'Limpieza completada',
            data: result
        });

    } catch (error) {
        logger.error('❌ Error en limpieza:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error en limpieza de videos'
        });
    }
});

/**
 * Test del sistema de videos
 * GET /api/videos/test
 */
router.get('/test', async (req, res) => {
    try {
        const videos = await videoManager.listVideos(5);

        res.json({
            success: true,
            message: 'Sistema de videos funcionando correctamente',
            data: {
                videosDisponibles: videos.length,
                ultimosVideos: videos.map(v => ({
                    id: v.id,
                    filename: v.filename,
                    url: v.publicUrl,
                    createdAt: v.downloadedAt || v.createdAt
                }))
            },
            debug: {
                timestamp: new Date().toISOString(),
                videoDir: path.join(__dirname, '../../output/videos')
            }
        });

    } catch (error) {
        logger.error('❌ Error en test de videos:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error en sistema de videos'
        });
    }
});

module.exports = router;