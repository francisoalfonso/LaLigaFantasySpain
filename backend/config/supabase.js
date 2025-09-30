// =====================================================
// SUPABASE CLIENT CONFIGURATION
// =====================================================
// Client configuration for Supabase database connection
// Supports both client-side (anon) and server-side (service role) operations

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
require('dotenv').config({ path: '.env.supabase' });

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_PROJECT_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Supabase configuration
const supabaseConfig = {
  url: process.env.SUPABASE_PROJECT_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Database connection options
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'fantasy-laliga@1.0.0',
      },
    },
  }
};

// Create Supabase clients
const supabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  supabaseConfig.options
);

const supabaseAdmin = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey,
  {
    ...supabaseConfig.options,
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// =====================================================
// DATABASE UTILITY FUNCTIONS
// =====================================================

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const { data, error } = await supabaseClient
      .from('teams')
      .select('count')
      .limit(1);

    if (error) {
      logger.error('❌ Database connection failed:', error.message);
      return false;
    }

    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection error:', error.message);
    return false;
  }
}

/**
 * Get current database statistics
 * @returns {Promise<Object>} Database stats
 */
async function getDatabaseStats() {
  try {
    const stats = {};

    // Count records in main tables
    const tables = ['teams', 'players', 'matches', 'player_stats', 'fantasy_points', 'content_plans', 'social_posts'];

    for (const table of tables) {
      const { count, error } = await supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        stats[table] = count;
      }
    }

    return stats;
  } catch (error) {
    logger.error('Error getting database stats:', error.message);
    return {};
  }
}

/**
 * Execute raw SQL query (admin only)
 * @param {string} query - SQL query to execute
 * @returns {Promise<Object>} Query result
 */
async function executeRawQuery(query) {
  try {
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { query });

    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Raw query execution error:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// SPECIALIZED DATA ACCESS FUNCTIONS
// =====================================================

/**
 * Get all La Liga teams
 * @returns {Promise<Array>} Teams array
 */
async function getTeams() {
  try {
    const { data, error } = await supabaseClient
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching teams:', error.message);
    return [];
  }
}

/**
 * Get players by team and/or position
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Players array
 */
async function getPlayers(filters = {}) {
  try {
    let query = supabaseClient
      .from('players')
      .select(`
        *,
        teams (
          id,
          name,
          short_name,
          logo_url
        )
      `)
      .eq('is_active', true);

    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId);
    }

    if (filters.position) {
      query = query.eq('position', filters.position);
    }

    if (filters.maxPrice) {
      query = query.lte('fantasy_price', filters.maxPrice);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching players:', error.message);
    return [];
  }
}

/**
 * Get fantasy points for specific gameweek
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Array>} Fantasy points array
 */
async function getFantasyPoints(gameweek = null) {
  try {
    let query = supabaseClient
      .from('fantasy_points')
      .select(`
        *,
        players (
          id,
          name,
          position,
          fantasy_price,
          teams (
            name,
            short_name
          )
        )
      `);

    if (gameweek) {
      query = query.eq('gameweek', gameweek);
    } else {
      // Get latest gameweek
      const { data: latestGW } = await supabaseClient
        .from('fantasy_points')
        .select('gameweek')
        .order('gameweek', { ascending: false })
        .limit(1);

      if (latestGW && latestGW.length > 0) {
        query = query.eq('gameweek', latestGW[0].gameweek);
      }
    }

    const { data, error } = await query.order('total_points', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching fantasy points:', error.message);
    return [];
  }
}

/**
 * Insert or update team data
 * @param {Object} teamData - Team data object
 * @returns {Promise<Object>} Result object
 */
async function upsertTeam(teamData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .upsert(teamData, {
        onConflict: 'api_sports_id',
        returning: 'minimal'
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error upserting team:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Insert or update player data
 * @param {Object} playerData - Player data object
 * @returns {Promise<Object>} Result object
 */
async function upsertPlayer(playerData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('players')
      .upsert(playerData, {
        onConflict: 'api_sports_id',
        returning: 'minimal'
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error upserting player:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Insert match data
 * @param {Object} matchData - Match data object
 * @returns {Promise<Object>} Result object
 */
async function insertMatch(matchData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .upsert(matchData, {
        onConflict: 'api_sports_id',
        returning: 'minimal'
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error inserting match:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Insert player statistics
 * @param {Object} statsData - Player stats data object
 * @returns {Promise<Object>} Result object
 */
async function insertPlayerStats(statsData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .upsert(statsData, {
        onConflict: 'match_id,player_id',
        returning: 'minimal'
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error inserting player stats:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Insert fantasy points calculation
 * @param {Object} pointsData - Fantasy points data object
 * @returns {Promise<Object>} Result object
 */
async function insertFantasyPoints(pointsData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('fantasy_points')
      .upsert(pointsData, {
        onConflict: 'player_id,match_id',
        returning: 'minimal'
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error inserting fantasy points:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// CONTENT MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Create content plan
 * @param {Object} contentData - Content plan data
 * @returns {Promise<Object>} Result object
 */
async function createContentPlan(contentData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_plans')
      .insert(contentData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error creating content plan:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create social media post
 * @param {Object} postData - Social post data
 * @returns {Promise<Object>} Result object
 */
async function createSocialPost(postData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('social_posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error creating social post:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Log workflow execution
 * @param {Object} workflowData - Workflow execution data
 * @returns {Promise<Object>} Result object
 */
async function logWorkflowExecution(workflowData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error logging workflow:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Log API request for rate limiting
 * @param {Object} requestData - API request data
 * @returns {Promise<Object>} Result object
 */
async function logApiRequest(requestData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Error logging API request:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// MODULE EXPORTS
// =====================================================

module.exports = {
  // Client instances
  supabaseClient,
  supabaseAdmin,

  // Configuration
  supabaseConfig,

  // Utility functions
  testConnection,
  getDatabaseStats,
  executeRawQuery,

  // Data access functions
  getTeams,
  getPlayers,
  getFantasyPoints,

  // Data modification functions
  upsertTeam,
  upsertPlayer,
  insertMatch,
  insertPlayerStats,
  insertFantasyPoints,

  // Content management functions
  createContentPlan,
  createSocialPost,
  logWorkflowExecution,
  logApiRequest
};