/**
 * Competitive Channels Routes
 *
 * CRUD para gestión de canales de competencia YouTube
 * Permite añadir/eliminar/configurar canales a monitorizar
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/competitive/channels
 *
 * Listar todos los canales monitorizados
 */
router.get('/channels', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitive_channels')
            .select('*')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] Canales listados', {
            count: data.length
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error listando canales', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/channels/:id
 *
 * Obtener canal específico con stats
 */
router.get('/channels/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener canal
        const { data: channel, error: channelError } = await supabase
            .from('competitive_channels')
            .select('*')
            .eq('id', id)
            .single();

        if (channelError) {
            throw channelError;
        }

        // Obtener videos del canal
        const { data: videos, error: videosError } = await supabase
            .from('competitive_videos')
            .select('*')
            .eq('channel_id', id)
            .order('detected_at', { ascending: false })
            .limit(20);

        if (videosError) {
            throw videosError;
        }

        res.json({
            success: true,
            data: {
                channel,
                videos,
                stats: {
                    totalVideos: videos.length,
                    processed: videos.filter(v => v.processed).length,
                    pending: videos.filter(v => !v.processed).length,
                    avgQuality:
                        videos.reduce((sum, v) => sum + (v.quality_score || 0), 0) /
                        (videos.length || 1)
                }
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error obteniendo canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/channels
 *
 * Añadir nuevo canal a monitorizar
 */
router.post('/channels', async (req, res) => {
    try {
        const {
            channel_url,
            channel_id,
            channel_name,
            priority = 3,
            content_type = 'general',
            monitoring_frequency = '1h'
        } = req.body;

        // Validaciones
        if (!channel_url) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere channel_url'
            });
        }

        // Extraer channel ID de URL si no se proporciona
        let finalChannelId = channel_id;
        if (!finalChannelId) {
            // Intentar extraer de URL
            if (channel_url.includes('/channel/')) {
                finalChannelId = channel_url.split('/channel/')[1].split('/')[0];
            } else if (channel_url.includes('/@')) {
                finalChannelId = channel_url.split('/@')[1].split('/')[0];
            }
        }

        // Insertar canal
        const { data, error } = await supabase
            .from('competitive_channels')
            .insert([
                {
                    channel_url,
                    channel_id: finalChannelId,
                    channel_name,
                    priority,
                    content_type,
                    monitoring_frequency,
                    is_active: true,
                    videos_processed: 0
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Canal añadido', {
            id: data.id,
            channelName: data.channel_name,
            priority: data.priority
        });

        res.json({
            success: true,
            message: 'Canal añadido correctamente',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error añadiendo canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/competitive/channels/:id
 *
 * Actualizar configuración de canal
 */
router.put('/channels/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Campos permitidos para actualización
        const allowedFields = [
            'is_active',
            'priority',
            'content_type',
            'monitoring_frequency',
            'channel_name'
        ];

        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        filteredUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('competitive_channels')
            .update(filteredUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Canal actualizado', {
            id: data.id,
            updates: Object.keys(filteredUpdates)
        });

        res.json({
            success: true,
            message: 'Canal actualizado correctamente',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error actualizando canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/competitive/channels/:id
 *
 * Eliminar canal (soft delete: is_active = false)
 */
router.delete('/channels/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('competitive_channels')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Canal desactivado', {
            id: data.id
        });

        res.json({
            success: true,
            message: 'Canal desactivado correctamente',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error eliminando canal', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/videos/pending
 *
 * Obtener videos pendientes de procesar
 */
router.get('/videos/pending', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitive_videos')
            .select(
                `
                *,
                competitive_channels (
                    channel_name,
                    priority
                )
            `
            )
            .eq('processed', false)
            .order('detected_at', { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] Videos pendientes listados', {
            count: data.length
        });

        res.json({
            success: true,
            data: data.map(v => ({
                ...v,
                channel_name: v.competitive_channels?.channel_name
            }))
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error listando videos pendientes', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/competitive/videos/processed
 *
 * Obtener historial de videos procesados
 */
router.get('/videos/processed', async (req, res) => {
    try {
        const { channel_id, limit = 20 } = req.query;

        let query = supabase
            .from('competitive_videos')
            .select(
                `
                *,
                competitive_channels (
                    channel_name
                )
            `
            )
            .eq('processed', true)
            .order('detected_at', { ascending: false })
            .limit(parseInt(limit));

        if (channel_id) {
            query = query.eq('channel_id', channel_id);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data.map(v => ({
                ...v,
                channel_name: v.competitive_channels?.channel_name
            }))
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error listando videos procesados', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/videos/:id/process
 *
 * Procesar video manualmente (generar respuesta)
 */
router.post('/videos/:id/process', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener video
        const { data: video, error: videoError } = await supabase
            .from('competitive_videos')
            .select('*')
            .eq('id', id)
            .single();

        if (videoError) {
            throw videoError;
        }

        // Marcar como processing
        await supabase
            .from('competitive_videos')
            .update({ processing_status: 'processing' })
            .eq('id', id);

        logger.info('[CompetitiveChannels] Video marcado para procesamiento', {
            videoId: video.video_id
        });

        // TODO: Aquí iría la lógica de procesamiento completo
        // Por ahora solo marcamos el estado

        res.json({
            success: true,
            message: 'Video en cola de procesamiento',
            data: {
                videoId: video.video_id,
                status: 'processing'
            }
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error procesando video', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/competitive/videos/:id/skip
 *
 * Marcar video como skip (no interesante)
 */
router.post('/videos/:id/skip', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Manual skip' } = req.body;

        const { data, error } = await supabase
            .from('competitive_videos')
            .update({
                processed: true,
                processing_status: 'skipped',
                analysis: { skip_reason: reason }
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logger.info('[CompetitiveChannels] ✅ Video marcado como skip', {
            videoId: data.video_id,
            reason
        });

        res.json({
            success: true,
            message: 'Video marcado como skip',
            data
        });
    } catch (error) {
        logger.error('[CompetitiveChannels] Error marcando skip', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
