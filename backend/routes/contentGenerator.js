// =====================================================
// CONTENT GENERATOR ROUTES
// =====================================================
// Express routes para generación automática de contenido Fantasy La Liga

const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const ContentGenerator = require('../services/contentGenerator');

// Instancia del generador de contenido
const contentGen = new ContentGenerator();

// =====================================================
// CONTENT GENERATION ENDPOINTS
// =====================================================

/**
 * Generar contenido diario automático
 * POST /api/content/generate/daily
 */
router.post('/generate/daily', async (req, res) => {
  try {
    logger.info('🎯 Generando contenido diario automático...');

    const { platform = 'instagram', gameweek } = req.body;

    // Generar insights diarios
    const content = await contentGen.generateDailyInsights(platform, gameweek);

    res.json({
      success: true,
      content_type: 'daily_insights',
      platform: platform,
      gameweek: gameweek || 'current',
      content: content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error generando contenido diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando contenido diario',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generar spotlight de jugador
 * POST /api/content/generate/player-spotlight
 */
router.post('/generate/player-spotlight', async (req, res) => {
  try {
    logger.info('⭐ Generando spotlight de jugador...');

    const { player_id, platform = 'instagram' } = req.body;

    if (!player_id) {
      return res.status(400).json({
        success: false,
        message: 'player_id es requerido'
      });
    }

    const content = await contentGen.generatePlayerSpotlight(player_id, platform);

    res.json({
      success: true,
      content_type: 'player_spotlight',
      platform: platform,
      player_id: player_id,
      content: content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error generando player spotlight:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando player spotlight',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generar análisis de equipo
 * POST /api/content/generate/team-analysis
 */
router.post('/generate/team-analysis', async (req, res) => {
  try {
    logger.info('🏟️ Generando análisis de equipo...');

    const { team_id, platform = 'instagram' } = req.body;

    if (!team_id) {
      return res.status(400).json({
        success: false,
        message: 'team_id es requerido'
      });
    }

    const content = await contentGen.generateTeamAnalysis(team_id, platform);

    res.json({
      success: true,
      content_type: 'team_analysis',
      platform: platform,
      team_id: team_id,
      content: content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error generando team analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando team analysis',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generar tips Fantasy
 * POST /api/content/generate/fantasy-tips
 */
router.post('/generate/fantasy-tips', async (req, res) => {
  try {
    logger.info('💡 Generando tips Fantasy...');

    const { platform = 'instagram', gameweek } = req.body;

    const content = await contentGen.generateDailyInsights(platform, gameweek);

    res.json({
      success: true,
      content_type: 'fantasy_tips',
      platform: platform,
      gameweek: gameweek || 'current',
      content: content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error generando fantasy tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando fantasy tips',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// WORKFLOW AUTOMATION ENDPOINTS
// =====================================================

/**
 * Ejecutar workflow completo de contenido
 * POST /api/content/workflow/complete
 */
router.post('/workflow/complete', async (req, res) => {
  try {
    logger.info('🔄 Ejecutando workflow completo de contenido...');

    const { platforms = ['instagram'], gameweek } = req.body;
    const results = [];

    // Generar contenido para cada plataforma
    for (const platform of platforms) {
      logger.info(`📱 Generando contenido para ${platform}...`);

      // 1. Insights diarios
      const dailyContent = await contentGen.generateDailyInsights(platform, gameweek);
      results.push({
        type: 'daily_insights',
        platform: platform,
        content: dailyContent
      });

      // 2. Player Spotlight
      const spotlightContent = await contentGen.generatePlayerSpotlight(null, platform);
      results.push({
        type: 'player_spotlight',
        platform: platform,
        content: spotlightContent
      });

      // Pequeña pausa entre generaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.json({
      success: true,
      workflow: 'complete_content_generation',
      platforms: platforms,
      gameweek: gameweek || 'current',
      generated_content: results,
      total_pieces: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error en workflow completo:', error);
    res.status(500).json({
      success: false,
      message: 'Error en workflow completo',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Programa contenido automático
 * POST /api/content/workflow/schedule
 */
router.post('/workflow/schedule', async (req, res) => {
  try {
    logger.info('📅 Programando contenido automático...');

    const {
      schedule_type = 'daily',
      platforms = ['instagram'],
      content_types = ['daily_insights', 'fantasy_tips']
    } = req.body;

    // Por ahora simulamos la programación
    const scheduledTasks = [];

    content_types.forEach(contentType => {
      platforms.forEach(platform => {
        scheduledTasks.push({
          id: `${contentType}_${platform}_${Date.now()}`,
          content_type: contentType,
          platform: platform,
          schedule_type: schedule_type,
          next_execution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
          status: 'scheduled'
        });
      });
    });

    res.json({
      success: true,
      workflow: 'content_scheduling',
      schedule_type: schedule_type,
      platforms: platforms,
      content_types: content_types,
      scheduled_tasks: scheduledTasks,
      total_scheduled: scheduledTasks.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error programando contenido:', error);
    res.status(500).json({
      success: false,
      message: 'Error programando contenido automático',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// ANALYTICS AND MONITORING
// =====================================================

/**
 * Obtener estadísticas de contenido generado
 * GET /api/content/analytics/stats
 */
router.get('/analytics/stats', async (req, res) => {
  try {
    logger.info('📊 Obteniendo estadísticas de contenido...');

    const { supabaseClient } = require('../config/supabase');

    // Obtener estadísticas de content_plans
    const { data: contentStats, error } = await supabaseClient
      .from('content_plans')
      .select('plan_type, status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 30 días

    if (error) {
      throw error;
    }

    // Calcular estadísticas
    const stats = {
      total_content_pieces: contentStats.length,
      by_type: {},
      by_status: {},
      last_30_days: contentStats.length
    };

    // Agrupar por tipo
    contentStats.forEach(item => {
      stats.by_type[item.plan_type] = (stats.by_type[item.plan_type] || 0) + 1;
      stats.by_status[item.status] = (stats.by_status[item.status] || 0) + 1;
    });

    res.json({
      success: true,
      analytics: stats,
      period: 'last_30_days',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de contenido',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test del generador de contenido
 * GET /api/content/test
 */
router.get('/test', async (req, res) => {
  try {
    logger.info('🧪 Testeando generador de contenido...');

    // Test básico de conexión y funcionalidad
    const testResult = await contentGen.testConnection();

    res.json({
      success: true,
      test: 'content_generator',
      result: testResult,
      available_methods: [
        'generateDailyInsights',
        'generatePlayerSpotlight',
        'generateTeamAnalysis',
        'generateFantasyTips'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error test contenido:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test del generador',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;