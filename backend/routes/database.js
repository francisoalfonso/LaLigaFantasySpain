// =====================================================
// DATABASE MANAGEMENT ROUTES
// =====================================================
// Express routes for database management, monitoring, and admin operations

const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const {
  testConnection,
  getDatabaseStats,
  getTeams,
  getPlayers,
  getFantasyPoints,
  supabaseConfig
} = require('../config/supabase');

// =====================================================
// DATABASE STATUS AND MONITORING
// =====================================================

/**
 * Test database connection
 * GET /api/database/test
 */
router.get('/test', async (req, res) => {
  try {
    logger.info('🔍 Testing database connection...');

    const isConnected = await testConnection();

    if (isConnected) {
      const stats = await getDatabaseStats();

      res.json({
        success: true,
        message: 'Database connection successful',
        connection: true,
        timestamp: new Date().toISOString(),
        database_url: supabaseConfig.url,
        statistics: stats
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        connection: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('❌ Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get database statistics and health info
 * GET /api/database/stats
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('📊 Fetching database statistics...');

    const stats = await getDatabaseStats();

    // Calculate some health metrics
    const totalRecords = Object.values(stats).reduce((sum, count) => sum + (count || 0), 0);

    const healthInfo = {
      total_records: totalRecords,
      tables_with_data: Object.entries(stats).filter(([_, count]) => count > 0).length,
      tables_empty: Object.entries(stats).filter(([_, count]) => count === 0).length,
      last_checked: new Date().toISOString()
    };

    res.json({
      success: true,
      statistics: stats,
      health: healthInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Database stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get database configuration info (non-sensitive)
 * GET /api/database/config
 */
router.get('/config', async (req, res) => {
  try {
    const configInfo = {
      database_url: supabaseConfig.url,
      has_anon_key: !!supabaseConfig.anonKey,
      has_service_key: !!supabaseConfig.serviceRoleKey,
      auto_refresh_token: supabaseConfig.options.auth.autoRefreshToken,
      persist_session: supabaseConfig.options.auth.persistSession,
      schema: supabaseConfig.options.db.schema,
      client_info: supabaseConfig.options.global.headers['X-Client-Info']
    };

    res.json({
      success: true,
      config: configInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Database config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database configuration',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// DATA ACCESS ROUTES
// =====================================================

/**
 * Get all La Liga teams
 * GET /api/database/teams
 */
router.get('/teams', async (req, res) => {
  try {
    logger.info('🏟️  Fetching teams from database...');

    const teams = await getTeams();

    res.json({
      success: true,
      count: teams.length,
      teams: teams,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Teams fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get players with optional filters
 * GET /api/database/players?team_id=1&position=FWD&max_price=10
 */
router.get('/players', async (req, res) => {
  try {
    logger.info('👥 Fetching players from database...');

    const filters = {
      teamId: req.query.team_id ? parseInt(req.query.team_id) : null,
      position: req.query.position || null,
      maxPrice: req.query.max_price ? parseFloat(req.query.max_price) : null
    };

    // Remove null filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null) {
        delete filters[key];
      }
    });

    const players = await getPlayers(filters);

    res.json({
      success: true,
      count: players.length,
      filters: filters,
      players: players,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Players fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch players',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get fantasy points for specific gameweek
 * GET /api/database/fantasy-points?gameweek=1
 */
router.get('/fantasy-points', async (req, res) => {
  try {
    logger.info('⚽ Fetching fantasy points from database...');

    const gameweek = req.query.gameweek ? parseInt(req.query.gameweek) : null;
    const points = await getFantasyPoints(gameweek);

    res.json({
      success: true,
      count: points.length,
      gameweek: gameweek || 'latest',
      points: points,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Fantasy points fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fantasy points',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get top performers by position
 * GET /api/database/top-performers?position=FWD&limit=10
 */
router.get('/top-performers', async (req, res) => {
  try {
    logger.info('🏆 Fetching top performers from database...');

    const position = req.query.position || null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const { supabaseClient } = require('../config/supabase');

    let query = supabaseClient
      .from('top_performers_by_position')
      .select('*')
      .limit(limit);

    if (position) {
      query = query.eq('position', position);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      position: position || 'all',
      limit: limit,
      top_performers: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Top performers fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performers',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get current gameweek performance
 * GET /api/database/current-gameweek
 */
router.get('/current-gameweek', async (req, res) => {
  try {
    logger.info('📅 Fetching current gameweek performance...');

    const { supabaseClient } = require('../config/supabase');

    const { data, error } = await supabaseClient
      .from('current_gameweek_performance')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      current_gameweek_performance: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Current gameweek fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current gameweek performance',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// CONTENT MANAGEMENT ROUTES
// =====================================================

/**
 * Get recent content plans
 * GET /api/database/content-plans?limit=20&status=draft
 */
router.get('/content-plans', async (req, res) => {
  try {
    logger.info('📝 Fetching content plans from database...');

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const status = req.query.status || null;

    const { supabaseClient } = require('../config/supabase');

    let query = supabaseClient
      .from('content_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      status: status || 'all',
      limit: limit,
      content_plans: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Content plans fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content plans',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get recent social posts
 * GET /api/database/social-posts?platform=instagram&limit=20
 */
router.get('/social-posts', async (req, res) => {
  try {
    logger.info('📱 Fetching social posts from database...');

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const platform = req.query.platform || null;

    const { supabaseClient } = require('../config/supabase');

    let query = supabaseClient
      .from('social_posts')
      .select(`
        *,
        content_plans (
          id,
          title,
          plan_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      platform: platform || 'all',
      limit: limit,
      social_posts: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Social posts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social posts',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get content performance metrics
 * GET /api/database/content-performance
 */
router.get('/content-performance', async (req, res) => {
  try {
    logger.info('📊 Fetching content performance metrics...');

    const { supabaseClient } = require('../config/supabase');

    const { data, error } = await supabaseClient
      .from('content_performance')
      .select('*')
      .order('avg_engagement', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      content_performance: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Content performance fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content performance',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// WORKFLOW AND API TRACKING ROUTES
// =====================================================

/**
 * Get recent workflow executions
 * GET /api/database/workflows?limit=20&status=success
 */
router.get('/workflows', async (req, res) => {
  try {
    logger.info('🔄 Fetching workflow executions from database...');

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const status = req.query.status || null;

    const { supabaseClient } = require('../config/supabase');

    let query = supabaseClient
      .from('workflows')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      status: status || 'all',
      limit: limit,
      workflows: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Workflows fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get API request statistics
 * GET /api/database/api-stats?provider=api-sports&hours=24
 */
router.get('/api-stats', async (req, res) => {
  try {
    logger.info('📡 Fetching API request statistics...');

    const provider = req.query.provider || null;
    const hours = req.query.hours ? parseInt(req.query.hours) : 24;

    const { supabaseClient } = require('../config/supabase');

    let query = supabaseClient
      .from('api_requests')
      .select('*')
      .gte('requested_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('requested_at', { ascending: false });

    if (provider) {
      query = query.eq('api_provider', provider);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics
    const totalRequests = data.length;
    const successfulRequests = data.filter(req => req.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0;
    const avgResponseTime = data.length > 0 ?
      (data.reduce((sum, req) => sum + (req.response_time_ms || 0), 0) / data.length).toFixed(2) : 0;

    res.json({
      success: true,
      provider: provider || 'all',
      hours: hours,
      statistics: {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        failed_requests: failedRequests,
        success_rate_percentage: parseFloat(successRate),
        average_response_time_ms: parseFloat(avgResponseTime)
      },
      recent_requests: data.slice(0, 10), // Return 10 most recent
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ API stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;