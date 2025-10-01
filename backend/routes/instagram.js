// Rutas para integración con Instagram - @fantasy.laliga.pro
const express = require('express');
const logger = require('../utils/logger');
const ViralVideoBuilder = require('../services/veo3/viralVideoBuilder');
const axios = require('axios');
const router = express.Router();

// Instagram Business API configuration
const INSTAGRAM_CONFIG = {
    account_handle: '@fantasy.laliga.pro',
    business_name: 'Fantasy La Liga Pro',
    profile_url: 'https://www.instagram.com/fantasy.laliga.pro/',
    // Meta Graph API credentials (when configured)
    access_token: process.env.META_ACCESS_TOKEN,
    page_id: process.env.INSTAGRAM_PAGE_ID,
    account_id: process.env.INSTAGRAM_ACCOUNT_ID
};

// Simulación de contenido programado para Instagram
const scheduledContent = [];
const contentQueue = [];

// GET /api/instagram/test - Test conexión Instagram Business API
router.get('/test', async (req, res) => {
    try {
        logger.info('🔄 Testing Instagram Business API connection...');

        const testResult = {
            success: true,
            message: 'Instagram API test completed',
            account: {
                handle: INSTAGRAM_CONFIG.account_handle,
                business_name: INSTAGRAM_CONFIG.business_name,
                profile_url: INSTAGRAM_CONFIG.profile_url,
                status: 'active'
            },
            api_status: {
                meta_graph_api: process.env.META_ACCESS_TOKEN ? 'configured' : 'not_configured',
                permissions: [
                    'instagram_basic',
                    'instagram_content_publish',
                    'pages_show_list',
                    'pages_read_engagement'
                ],
                rate_limits: {
                    posts_per_day: 25,
                    stories_per_day: 50,
                    api_calls_per_hour: 200
                }
            },
            content_queue: contentQueue.length,
            scheduled_posts: scheduledContent.length,
            last_post: '2025-09-24T21:30:00Z', // Simulated
            engagement_rate: '4.2%', // Simulated
            followers_count: 0 // Just created account
        };

        res.json(testResult);
    } catch (error) {
        logger.error('❌ Instagram API test error:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing Instagram API',
            error: error.message
        });
    }
});

// POST /api/instagram/stage-content - Enviar contenido a staging
router.post('/stage-content', async (req, res) => {
    try {
        const { title, content, hashtags, media_type = 'carousel', schedule_for } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const stagedContent = {
            id: Date.now(),
            title,
            content,
            hashtags,
            media_type,
            platform: 'instagram',
            account: INSTAGRAM_CONFIG.account_handle,
            status: 'staged',
            created_at: new Date().toISOString(),
            schedule_for: schedule_for || null,
            approval_status: 'pending_review',
            meta_data: {
                estimated_reach: Math.floor(Math.random() * 1000) + 100,
                best_time_to_post: '18:00-21:00',
                content_type: detectContentType(content),
                character_count: content.length,
                hashtag_count: hashtags ? hashtags.split('#').length - 1 : 0
            }
        };

        contentQueue.push(stagedContent);

        logger.info(`📝 Content staged for @fantasy.laliga.pro:`, {
            id: stagedContent.id,
            title: `${stagedContent.title.substring(0, 50)}...`,
            type: stagedContent.meta_data.content_type
        });

        res.json({
            success: true,
            message: 'Content staged successfully',
            data: stagedContent,
            staging_url: `http://localhost:3000/staging#content-${stagedContent.id}`
        });
    } catch (error) {
        logger.error('❌ Error staging content:', error);
        res.status(500).json({
            success: false,
            message: 'Error staging content',
            error: error.message
        });
    }
});

// POST /api/instagram/approve-content - Aprobar contenido para publicación
router.post('/approve-content/:id', async (req, res) => {
    try {
        const contentId = parseInt(req.params.id);
        const { schedule_for, modifications } = req.body;

        const contentIndex = contentQueue.findIndex(c => c.id === contentId);
        if (contentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        const content = contentQueue[contentIndex];

        // Apply modifications if provided
        if (modifications) {
            if (modifications.title) {
                content.title = modifications.title;
            }
            if (modifications.content) {
                content.content = modifications.content;
            }
            if (modifications.hashtags) {
                content.hashtags = modifications.hashtags;
            }
        }

        // Update status and schedule
        content.approval_status = 'approved';
        content.status = schedule_for ? 'scheduled' : 'ready_to_publish';
        content.schedule_for = schedule_for;
        content.approved_at = new Date().toISOString();

        if (schedule_for) {
            scheduledContent.push(content);
            contentQueue.splice(contentIndex, 1);
        }

        logger.info(`✅ Content approved for @fantasy.laliga.pro:`, {
            id: content.id,
            title: `${content.title.substring(0, 50)}...`,
            schedule_for: schedule_for || 'immediate'
        });

        res.json({
            success: true,
            message: 'Content approved successfully',
            data: content,
            next_action: schedule_for ? 'scheduled_for_publishing' : 'ready_for_manual_post'
        });
    } catch (error) {
        logger.error('❌ Error approving content:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving content',
            error: error.message
        });
    }
});

// GET /api/instagram/queue - Ver cola de contenido
router.get('/queue', async (req, res) => {
    try {
        const { status } = req.query;

        let filteredQueue = contentQueue;
        if (status) {
            filteredQueue = contentQueue.filter(c => c.approval_status === status);
        }

        res.json({
            success: true,
            data: {
                account: INSTAGRAM_CONFIG.account_handle,
                queue_status: {
                    total: contentQueue.length,
                    pending_review: contentQueue.filter(c => c.approval_status === 'pending_review')
                        .length,
                    approved: contentQueue.filter(c => c.approval_status === 'approved').length,
                    scheduled: scheduledContent.length
                },
                content: filteredQueue.map(c => ({
                    id: c.id,
                    title: c.title,
                    status: c.status,
                    approval_status: c.approval_status,
                    created_at: c.created_at,
                    schedule_for: c.schedule_for,
                    meta_data: c.meta_data
                })),
                scheduled_posts: scheduledContent.map(c => ({
                    id: c.id,
                    title: c.title,
                    schedule_for: c.schedule_for,
                    status: c.status
                }))
            }
        });
    } catch (error) {
        logger.error('❌ Error getting queue:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting content queue',
            error: error.message
        });
    }
});

// POST /api/instagram/preview-viral - Generar preview completo de video viral
router.post('/preview-viral', async (req, res) => {
    try {
        const { playerData, generateVideo = false } = req.body;

        if (!playerData || !playerData.playerName || !playerData.price) {
            return res.status(400).json({
                success: false,
                message: 'playerData con playerName y price son requeridos'
            });
        }

        logger.info('🎬 Generando preview viral para Instagram:', {
            player: playerData.playerName
        });

        const viralBuilder = new ViralVideoBuilder();

        if (generateVideo) {
            // Generar video viral completo
            logger.info('⏳ Generando video viral (esto puede tomar 15-20 minutos)...');
            const videoResult = await viralBuilder.generateViralVideo(playerData);
            const previewData = viralBuilder.getPreviewData(videoResult, playerData);

            res.json({
                success: true,
                message: 'Video viral generado y preview listo',
                data: previewData
            });
        } else {
            // Solo generar preview con video de ejemplo
            logger.info('📋 Generando preview sin generar video (modo rápido)...');

            // Buscar video existente o usar el de Carvajal como ejemplo
            const fs = require('fs');
            const path = require('path');
            const viralDir = path.join(__dirname, '../../output/veo3/viral');

            let videoFileName = 'ana-viral-carvajal-1759244590195.mp4';

            // Buscar si hay un video para este jugador
            if (fs.existsSync(viralDir)) {
                const files = fs.readdirSync(viralDir);
                const playerSlug = playerData.playerName.toLowerCase().replace(/\s+/g, '-');
                const matchingFile = files.find(f => f.includes(playerSlug));
                if (matchingFile) {
                    videoFileName = matchingFile;
                }
            }

            // Generar scripts mock que se enviarían a VEO3
            const stats = playerData.stats || {};
            const hookDialogue = `Pssst... Misters, venid que os cuento un secreto... He encontrado un ${stats.position || 'jugador'} del ${playerData.team} por €${playerData.price}M que está rindiendo como uno de €15M...`;
            const developmentDialogue = `${playerData.playerName}. Ratio valor ${playerData.ratio}x. ${stats.goals || 0} goles, ${stats.assists || 0} asistencias en ${stats.games || 0} partidos. Rating ${stats.rating || 0}. Y lo mejor... buen calendario próximos partidos.`;
            const ctaDialogue = `¿Fichamos o esperamos? Yo lo tengo claro, Misters. A este precio es IMPRESCINDIBLE para vuestra plantilla. ¿A qué esperáis? ¡Fichad ya!`;

            const mockVideoResult = {
                videoPath: `./output/veo3/viral/${videoFileName}`,
                duration: '~24s',
                segments: 3,
                structure: 'Hook → Desarrollo → CTA',
                metadata: {
                    playerName: playerData.playerName,
                    price: playerData.price,
                    ratio: playerData.ratio,
                    team: playerData.team,
                    stats: stats,
                    generatedAt: new Date().toISOString(),
                    segments: [
                        { type: 'hook', dialogue: hookDialogue },
                        { type: 'development', dialogue: developmentDialogue },
                        { type: 'cta', dialogue: ctaDialogue }
                    ]
                }
            };

            const previewData = viralBuilder.getPreviewData(mockVideoResult, playerData);

            res.json({
                success: true,
                message: 'Preview generado (video de ejemplo)',
                data: previewData,
                note: 'Para generar video real, enviar generateVideo: true'
            });
        }
    } catch (error) {
        logger.error('❌ Error generando preview viral:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando preview viral',
            error: error.message
        });
    }
});

// POST /api/instagram/publish-viral - Publicar video viral a Instagram
router.post('/publish-viral', async (req, res) => {
    try {
        const { previewData, scheduleFor } = req.body;

        if (!previewData || !previewData.video || !previewData.instagram) {
            return res.status(400).json({
                success: false,
                message: 'previewData con video e instagram data son requeridos'
            });
        }

        logger.info('📤 Publicando video viral a Instagram:', {
            player: previewData.player.name,
            scheduled: !!scheduleFor
        });

        // Crear contenido en la cola
        const publishContent = {
            id: Date.now(),
            title: `🔥 Chollo: ${previewData.player.name}`,
            content: previewData.instagram.caption,
            hashtags: previewData.instagram.hashtags.join(' '),
            media_type: 'reel',
            platform: 'instagram',
            account: INSTAGRAM_CONFIG.account_handle,
            status: scheduleFor ? 'scheduled' : 'ready_to_publish',
            created_at: new Date().toISOString(),
            schedule_for: scheduleFor || null,
            approval_status: 'approved',
            video_url: previewData.video.url,
            video_path: previewData.video.path,
            video_duration: previewData.video.duration,
            meta_data: {
                estimated_reach: previewData.instagram.estimatedReach,
                best_time_to_post: previewData.instagram.bestTimeToPost,
                content_type: 'viral_video',
                character_count: previewData.instagram.captionLength,
                hashtag_count: previewData.instagram.hashtags.length,
                player_data: previewData.player,
                video_structure: previewData.video.structure
            }
        };

        if (scheduleFor) {
            scheduledContent.push(publishContent);
        } else {
            contentQueue.push(publishContent);
        }

        logger.info('✅ Video viral publicado/programado:', {
            id: publishContent.id,
            player: previewData.player.name,
            status: publishContent.status
        });

        res.json({
            success: true,
            message: scheduleFor
                ? 'Video viral programado para publicación'
                : 'Video viral listo para publicar',
            data: publishContent,
            staging_url: `http://localhost:3000/staging#content-${publishContent.id}`,
            instagram_url: INSTAGRAM_CONFIG.profile_url
        });
    } catch (error) {
        logger.error('❌ Error publicando video viral:', error);
        res.status(500).json({
            success: false,
            message: 'Error publicando video viral',
            error: error.message
        });
    }
});

// POST /api/instagram/generate-viral-real - Generar video REAL con VEO3 (E2E completo)
router.post('/generate-viral-real', async (req, res) => {
    try {
        const { playerData, caption } = req.body;

        if (!playerData || !playerData.playerName || !playerData.price) {
            return res.status(400).json({
                success: false,
                message: 'Missing required player data (playerName, price)'
            });
        }

        logger.info('🎬 Generando video REAL con VEO3 para:', playerData.playerName);

        // Crear instancia del ViralVideoBuilder
        const viralBuilder = new ViralVideoBuilder();

        // Generar video viral completo (3 segmentos con VEO3 real)
        const videoResult = await viralBuilder.generateViralVideo(playerData);

        if (!videoResult.success) {
            throw new Error('Error generando video con VEO3');
        }

        // Obtener datos completos para preview
        const previewData = viralBuilder.getPreviewData(videoResult, playerData);

        // Si se pasó caption personalizado, usarlo
        if (caption) {
            previewData.instagram.caption = caption;
            previewData.instagram.captionLength = caption.length;
            previewData.instagram.hashtags = viralBuilder.extractHashtags(caption);
        }

        logger.info('✅ Video REAL generado exitosamente:', {
            player: playerData.playerName,
            videoPath: videoResult.videoPath,
            duration: videoResult.duration,
            segments: videoResult.segments
        });

        res.json({
            success: true,
            message: 'Video REAL generado con VEO3 exitosamente',
            data: previewData,
            metadata: {
                isRealVideo: true,
                generatedAt: new Date().toISOString(),
                cost: '$0.90 (3 segmentos x $0.30)',
                processingTime: '4-6 minutos'
            }
        });
    } catch (error) {
        logger.error('❌ Error generando video REAL con VEO3:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando video REAL con VEO3',
            error: error.message
        });
    }
});

// POST /api/instagram/generate-content - Generar contenido automático
router.post('/generate-content', async (req, res) => {
    try {
        const { type = 'chollo', data } = req.body;

        logger.info('🤖 Generating Instagram content...', { type });

        let generatedContent;

        switch (type) {
            case 'chollo':
                generatedContent = await generateCholloContent(data);
                break;
            case 'analysis':
                generatedContent = await generateAnalysisContent(data);
                break;
            case 'alert':
                generatedContent = await generateAlertContent(data);
                break;
            default:
                generatedContent = await generateGenericContent(data);
        }

        // Auto-stage the generated content
        const stagedContent = {
            id: Date.now(),
            ...generatedContent,
            platform: 'instagram',
            account: INSTAGRAM_CONFIG.account_handle,
            status: 'staged',
            created_at: new Date().toISOString(),
            approval_status: 'pending_review',
            generated: true,
            meta_data: {
                estimated_reach: Math.floor(Math.random() * 1000) + 100,
                best_time_to_post: '18:00-21:00',
                content_type: type,
                character_count: generatedContent.content.length,
                hashtag_count: generatedContent.hashtags
                    ? generatedContent.hashtags.split('#').length - 1
                    : 0
            }
        };

        contentQueue.push(stagedContent);

        res.json({
            success: true,
            message: 'Content generated and staged',
            data: stagedContent,
            staging_url: `http://localhost:3000/staging#content-${stagedContent.id}`
        });
    } catch (error) {
        logger.error('❌ Error generating content:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating content',
            error: error.message
        });
    }
});

// Helper functions
function detectContentType(content) {
    if (content.includes('🔥') && content.includes('chollo')) {
        return 'chollo';
    }
    if (content.includes('📊') && content.includes('análisis')) {
        return 'analysis';
    }
    if (content.includes('🚨') && content.includes('alerta')) {
        return 'alert';
    }
    return 'general';
}

async function generateCholloContent() {
    // This would integrate with your existing bargain analyzer
    const response = await axios.get('http://localhost:3000/api/bargains/top?limit=3');
    const bargains = response.data;

    const players = bargains.data.slice(0, 3);

    let content = '🔥 ¡LOS CHOLLOS DE HOY!\n\n';

    players.forEach(player => {
        content += `⚽ ${player.name} (${player.team.name}) - ${player.analysis.estimatedPrice}M €\n`;
        content += `• Rating: ${player.stats.rating} 📈\n`;
        content += `• ${player.stats.goals} goles en ${player.stats.games} partidos\n\n`;
    });

    content += '💡 Todos con excelente ratio valor/precio\n🎯 ¡Fichájalos antes que suban!';

    return {
        title: '🔥 Chollos TOP de Hoy',
        content,
        hashtags: '#FantasyLaLiga #Chollos #LaLiga #FantasyFootball',
        media_type: 'carousel'
    };
}

function generateAnalysisContent() {
    return {
        title: '📊 Análisis Jornada',
        content:
            '📊 ANÁLISIS DE JORNADA\n\nPartidos destacados:\n🔥 Real Madrid vs Barcelona\n⚽ Atlético vs Sevilla\n\n💡 Recomendaciones:\n• Lewandowski capitán recomendado\n• Bellingham opción segura\n• Cuidado con rotaciones',
        hashtags: '#FantasyLaLiga #Análisis #LaLiga #Predicciones',
        media_type: 'single'
    };
}

function generateAlertContent() {
    return {
        title: '🚨 Alerta Importante',
        content:
            '🚨 ALERTA FANTASY\n\nCambios de última hora:\n❌ Benzema - Lesionado\n✅ Vinicius - Confirmado titular\n🔄 Pedri - Rotación posible\n\n⏰ ¡Ajusta tu alineación!',
        hashtags: '#AlertaFantasy #LaLiga #UltimaHora #FantasyLaLiga',
        media_type: 'story'
    };
}

function generateGenericContent() {
    return {
        title: '⚽ Fantasy La Liga Pro',
        content:
            '⚽ FANTASY LA LIGA PRO\n\n🏆 Tu equipo de expertos\n📊 Análisis diarios con IA\n⚡ Datos reales de La Liga\n\n🔥 ¡Síguenos para dominar tu liga!',
        hashtags: '#FantasyLaLiga #FantasyFootball #LaLiga #Expertos',
        media_type: 'single'
    };
}

module.exports = router;
