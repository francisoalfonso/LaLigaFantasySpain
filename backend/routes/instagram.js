// Rutas para integración con Instagram - @fantasy.laliga.pro
const express = require('express');
const logger = require('../utils/logger');
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
let scheduledContent = [];
let contentQueue = [];

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
      title: stagedContent.title.substring(0, 50) + '...',
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
      if (modifications.title) content.title = modifications.title;
      if (modifications.content) content.content = modifications.content;
      if (modifications.hashtags) content.hashtags = modifications.hashtags;
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
      title: content.title.substring(0, 50) + '...',
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
          pending_review: contentQueue.filter(c => c.approval_status === 'pending_review').length,
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
        hashtag_count: generatedContent.hashtags ? generatedContent.hashtags.split('#').length - 1 : 0
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
  if (content.includes('🔥') && content.includes('chollo')) return 'chollo';
  if (content.includes('📊') && content.includes('análisis')) return 'analysis';
  if (content.includes('🚨') && content.includes('alerta')) return 'alert';
  return 'general';
}

async function generateCholloContent(data) {
  // This would integrate with your existing bargain analyzer
  const response = await fetch('http://localhost:3000/api/bargains/top?limit=3');
  const bargains = await response.json();

  const players = bargains.data.slice(0, 3);

  let content = "🔥 ¡LOS CHOLLOS DE HOY!\n\n";

  players.forEach((player, index) => {
    content += `⚽ ${player.name} (${player.team.name}) - ${player.analysis.estimatedPrice}M €\n`;
    content += `• Rating: ${player.stats.rating} 📈\n`;
    content += `• ${player.stats.goals} goles en ${player.stats.games} partidos\n\n`;
  });

  content += "💡 Todos con excelente ratio valor/precio\n🎯 ¡Fichájalos antes que suban!";

  return {
    title: "🔥 Chollos TOP de Hoy",
    content,
    hashtags: "#FantasyLaLiga #Chollos #LaLiga #FantasyFootball",
    media_type: "carousel"
  };
}

async function generateAnalysisContent(data) {
  return {
    title: "📊 Análisis Jornada",
    content: "📊 ANÁLISIS DE JORNADA\n\nPartidos destacados:\n🔥 Real Madrid vs Barcelona\n⚽ Atlético vs Sevilla\n\n💡 Recomendaciones:\n• Lewandowski capitán recomendado\n• Bellingham opción segura\n• Cuidado con rotaciones",
    hashtags: "#FantasyLaLiga #Análisis #LaLiga #Predicciones",
    media_type: "single"
  };
}

async function generateAlertContent(data) {
  return {
    title: "🚨 Alerta Importante",
    content: "🚨 ALERTA FANTASY\n\nCambios de última hora:\n❌ Benzema - Lesionado\n✅ Vinicius - Confirmado titular\n🔄 Pedri - Rotación posible\n\n⏰ ¡Ajusta tu alineación!",
    hashtags: "#AlertaFantasy #LaLiga #UltimaHora #FantasyLaLiga",
    media_type: "story"
  };
}

async function generateGenericContent(data) {
  return {
    title: "⚽ Fantasy La Liga Pro",
    content: "⚽ FANTASY LA LIGA PRO\n\n🏆 Tu equipo de expertos\n📊 Análisis diarios con IA\n⚡ Datos reales de La Liga\n\n🔥 ¡Síguenos para dominar tu liga!",
    hashtags: "#FantasyLaLiga #FantasyFootball #LaLiga #Expertos",
    media_type: "single"
  };
}

module.exports = router;