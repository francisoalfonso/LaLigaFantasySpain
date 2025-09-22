// =====================================================
// DATA SYNC ROUTES - API-SPORTS TO SUPABASE
// =====================================================
// Direct sync routes for Fantasy La Liga data between API-Sports and Supabase
// Used as backup when n8n workflows are not available

const express = require('express');
const router = express.Router();
const ApiFootballClient = require('../services/apiFootball');
const apiFootballService = new ApiFootballClient();
const {
  upsertTeam,
  upsertPlayer,
  insertMatch,
  insertPlayerStats,
  logApiRequest,
  supabaseAdmin
} = require('../config/supabase');

// =====================================================
// DIRECT SYNC ENDPOINTS
// =====================================================

/**
 * Sync teams from API-Sports to Supabase
 * POST /api/sync/teams
 */
router.post('/teams', async (req, res) => {
  try {
    console.log('🔄 Starting teams sync from API-Sports to Supabase...');
    const startTime = Date.now();

    // Get teams from API-Sports
    const teamsResponse = await apiFootballService.getLaLigaTeams();

    if (!teamsResponse.success) {
      throw new Error(`API-Sports error: ${teamsResponse.error}`);
    }

    const teams = teamsResponse.data || [];
    console.log(`📊 Found ${teams.length} teams to sync`);

    let successCount = 0;
    let errors = [];

    // Process each team
    for (const teamData of teams) {
      try {
        const team = teamData;
        const venue = { name: teamData.venue };

        // Transform API-Sports data to Supabase format
        const supabaseTeam = {
          api_sports_id: team.id,
          name: team.name,
          short_name: team.code || team.name.substring(0, 3).toUpperCase(),
          logo_url: team.logo,
          stadium: venue?.name,
          city: venue?.city,
          founded: team.founded,
          colors: {
            primary: team.colors?.primary || null,
            secondary: team.colors?.secondary || null
          },
          national: team.national || true,
          is_active: true,
          updated_at: new Date().toISOString()
        };

        // Upsert to Supabase
        const result = await upsertTeam(supabaseTeam);

        if (result.success) {
          successCount++;
          console.log(`✅ Synced team: ${team.name}`);
        } else {
          errors.push(`Failed to sync ${team.name}: ${result.error}`);
          console.error(`❌ Failed to sync team ${team.name}:`, result.error);
        }

      } catch (error) {
        errors.push(`Error processing team: ${error.message}`);
        console.error('❌ Team processing error:', error);
      }
    }

    const executionTime = Date.now() - startTime;

    // Log API request
    await logApiRequest({
      api_provider: 'api-sports',
      endpoint: '/teams',
      success: errors.length === 0,
      response_time_ms: executionTime,
      records_processed: teams.length,
      records_success: successCount,
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    res.json({
      success: true,
      message: 'Teams sync completed',
      statistics: {
        total_teams: teams.length,
        success_count: successCount,
        error_count: errors.length,
        execution_time_ms: executionTime
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Teams sync failed:', error);

    // Log failed API request
    await logApiRequest({
      api_provider: 'api-sports',
      endpoint: '/teams',
      success: false,
      error_message: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Teams sync failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Sync players from API-Sports to Supabase
 * POST /api/sync/players
 */
router.post('/players', async (req, res) => {
  try {
    console.log('🔄 Starting players sync from API-Sports to Supabase...');
    const startTime = Date.now();

    // Get all pages of players
    let allPlayers = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages && page <= 30) { // Limit to 30 pages max
      console.log(`📄 Fetching players page ${page}...`);

      const playersResponse = await apiFootballService.getLaLigaPlayers(page);

      if (!playersResponse.success) {
        throw new Error(`API-Sports error on page ${page}: ${playersResponse.error}`);
      }

      console.log(`🔍 API Response structure:`, Object.keys(playersResponse.data));

      const pageData = playersResponse.data || [];

      console.log(`📊 Page ${page}: Found ${pageData.length} players`);
      if (pageData.length > 0) {
        console.log(`🔍 First player structure:`, JSON.stringify(pageData[0], null, 2));
      }

      if (pageData.length === 0) {
        hasMorePages = false;
        break;
      }

      allPlayers = allPlayers.concat(pageData);
      page++;

      // Respect API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait 1.1 seconds
    }

    console.log(`📊 Found ${allPlayers.length} players total to sync`);

    let successCount = 0;
    let errors = [];

    // Get team mappings from Supabase
    const { data: teams } = await supabaseAdmin
      .from('teams')
      .select('id, api_sports_id');

    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.api_sports_id] = team.id;
    });

    // Process each player
    for (const playerData of allPlayers) {
      try {
        const player = playerData; // Data is already in the correct format
        const statistics = playerData.stats || {};

        // Map position from API-Sports to our format
        const positionMap = {
          'Goalkeeper': 'DEF', // Temporal: usando DEF hasta que se agregue GK al constraint
          'Defender': 'DEF',
          'Midfielder': 'MID',
          'Attacker': 'FWD'
        };

        const position = positionMap[player.position] || 'MID';

        // Get team_id from our mapping
        const team_id = teamMap[player.team?.id];

        if (!team_id) {
          console.warn(`⚠️ Team not found for player ${player.name}, team ID: ${player.team?.id}`);
          continue;
        }

        // Transform API-Sports data to Supabase format
        const supabasePlayer = {
          api_sports_id: player.id,
          team_id: team_id,
          name: player.name,
          firstname: player.firstname,
          lastname: player.lastname,
          age: player.age,
          birth_date: null, // Birth date not provided in this API format
          birth_place: null,
          nationality: player.nationality,
          height: player.height ? parseInt(player.height) : null,
          weight: player.weight ? parseInt(player.weight) : null,
          photo_url: player.photo,
          position: position,
          fantasy_price: Math.floor(Math.random() * 8) + 4, // Random price 4-12M for now
          is_active: true,
          updated_at: new Date().toISOString()
        };

        // Upsert to Supabase
        const result = await upsertPlayer(supabasePlayer);

        if (result.success) {
          successCount++;
          if (successCount % 50 === 0) {
            console.log(`✅ Synced ${successCount} players so far...`);
          }
        } else {
          errors.push(`Failed to sync ${player.name}: ${result.error}`);
          console.error(`❌ Failed to sync player ${player.name}:`, result.error);
        }

      } catch (error) {
        errors.push(`Error processing player: ${error.message}`);
        console.error('❌ Player processing error:', error);
      }
    }

    const executionTime = Date.now() - startTime;

    // Log API request
    await logApiRequest({
      api_provider: 'api-sports',
      endpoint: '/players',
      success: errors.length === 0,
      response_time_ms: executionTime,
      records_processed: allPlayers.length,
      records_success: successCount,
      error_message: errors.length > 0 ? errors.slice(0, 10).join('; ') : null // Limit error message length
    });

    console.log(`🎉 Players sync completed! ${successCount}/${allPlayers.length} successful`);

    res.json({
      success: true,
      message: 'Players sync completed',
      statistics: {
        total_players: allPlayers.length,
        success_count: successCount,
        error_count: errors.length,
        execution_time_ms: executionTime,
        pages_processed: page - 1
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit response size
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Players sync failed:', error);

    // Log failed API request
    await logApiRequest({
      api_provider: 'api-sports',
      endpoint: '/players',
      success: false,
      error_message: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Players sync failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Sync current season fixtures
 * POST /api/sync/fixtures
 */
router.post('/fixtures', async (req, res) => {
  try {
    console.log('🔄 Starting fixtures sync from API-Sports to Supabase...');
    const startTime = Date.now();

    // Get fixtures from API-Sports
    const fixturesResponse = await apiFootballService.getLaLigaFixtures();

    if (!fixturesResponse.success) {
      throw new Error(`API-Sports error: ${fixturesResponse.error}`);
    }

    const fixtures = fixturesResponse.data.response || [];
    console.log(`📊 Found ${fixtures.length} fixtures to sync`);

    let successCount = 0;
    let errors = [];

    // Get team mappings from Supabase
    const { data: teams } = await supabaseAdmin
      .from('teams')
      .select('id, api_sports_id');

    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.api_sports_id] = team.id;
    });

    // Process each fixture
    for (const fixtureData of fixtures) {
      try {
        const fixture = fixtureData.fixture;
        const league = fixtureData.league;
        const teams = fixtureData.teams;
        const goals = fixtureData.goals;
        const score = fixtureData.score;

        const home_team_id = teamMap[teams.home.id];
        const away_team_id = teamMap[teams.away.id];

        if (!home_team_id || !away_team_id) {
          console.warn(`⚠️ Teams not found for fixture ${fixture.id}`);
          continue;
        }

        // Transform API-Sports data to Supabase format
        const supabaseMatch = {
          api_sports_id: fixture.id,
          season: league.season,
          gameweek: league.round?.match(/\d+/)?.[0] ? parseInt(league.round.match(/\d+/)[0]) : null,
          home_team_id: home_team_id,
          away_team_id: away_team_id,
          match_date: new Date(fixture.date).toISOString(),
          status: fixture.status.long,
          home_goals: goals.home,
          away_goals: goals.away,
          halftime_home: score.halftime?.home,
          halftime_away: score.halftime?.away,
          fulltime_home: score.fulltime?.home,
          fulltime_away: score.fulltime?.away,
          venue: fixture.venue?.name,
          referee: fixture.referee,
          is_finished: fixture.status.short === 'FT',
          updated_at: new Date().toISOString()
        };

        // Insert to Supabase
        const result = await insertMatch(supabaseMatch);

        if (result.success) {
          successCount++;
        } else {
          errors.push(`Failed to sync fixture ${fixture.id}: ${result.error}`);
          console.error(`❌ Failed to sync fixture ${fixture.id}:`, result.error);
        }

      } catch (error) {
        errors.push(`Error processing fixture: ${error.message}`);
        console.error('❌ Fixture processing error:', error);
      }
    }

    const executionTime = Date.now() - startTime;

    // Log API request
    await logApiRequest({
      api_provider: 'api-sports',
      endpoint: '/fixtures',
      success: errors.length === 0,
      response_time_ms: executionTime,
      records_processed: fixtures.length,
      records_success: successCount,
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    res.json({
      success: true,
      message: 'Fixtures sync completed',
      statistics: {
        total_fixtures: fixtures.length,
        success_count: successCount,
        error_count: errors.length,
        execution_time_ms: executionTime
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fixtures sync failed:', error);

    // Log failed API request
    await logApiRequest({
      api_provider: 'api-sports',
      endpoint: '/fixtures',
      success: false,
      error_message: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Fixtures sync failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Full sync - Teams, Players, and Fixtures
 * POST /api/sync/full
 */
router.post('/full', async (req, res) => {
  try {
    console.log('🚀 Starting FULL sync from API-Sports to Supabase...');
    const startTime = Date.now();

    const results = {
      teams: null,
      players: null,
      fixtures: null
    };

    // Step 1: Sync Teams
    console.log('📝 Step 1: Syncing teams...');
    try {
      const teamsReq = await fetch(`${req.protocol}://${req.get('host')}/api/sync/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.teams = await teamsReq.json();
    } catch (error) {
      results.teams = { success: false, error: error.message };
    }

    // Wait between steps
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Sync Players (only if teams succeeded)
    if (results.teams.success) {
      console.log('👥 Step 2: Syncing players...');
      try {
        const playersReq = await fetch(`${req.protocol}://${req.get('host')}/api/sync/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        results.players = await playersReq.json();
      } catch (error) {
        results.players = { success: false, error: error.message };
      }

      // Wait between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 3: Sync Fixtures
    console.log('⚽ Step 3: Syncing fixtures...');
    try {
      const fixturesReq = await fetch(`${req.protocol}://${req.get('host')}/api/sync/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.fixtures = await fixturesReq.json();
    } catch (error) {
      results.fixtures = { success: false, error: error.message };
    }

    const executionTime = Date.now() - startTime;

    // Calculate overall success
    const overallSuccess = results.teams?.success && results.players?.success && results.fixtures?.success;

    console.log(`🎉 Full sync completed in ${executionTime}ms`);

    res.json({
      success: overallSuccess,
      message: 'Full sync completed',
      execution_time_ms: executionTime,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Full sync failed:', error);

    res.status(500).json({
      success: false,
      message: 'Full sync failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get sync status and statistics
 * GET /api/sync/status
 */
router.get('/status', async (req, res) => {
  try {
    // Get database statistics
    const { data: dbStats } = await supabaseAdmin
      .rpc('execute_sql', {
        query: `
          SELECT
            'teams' as table_name, COUNT(*) as count FROM teams WHERE is_active = true
          UNION ALL
          SELECT 'players' as table_name, COUNT(*) as count FROM players WHERE is_active = true
          UNION ALL
          SELECT 'matches' as table_name, COUNT(*) as count FROM matches
          UNION ALL
          SELECT 'recent_syncs' as table_name, COUNT(*) as count
          FROM api_requests
          WHERE requested_at >= NOW() - INTERVAL '24 hours'
        `
      });

    // Get latest sync info
    const { data: latestSync } = await supabaseAdmin
      .from('api_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(1);

    const stats = {};
    if (dbStats) {
      dbStats.forEach(stat => {
        stats[stat.table_name] = stat.count;
      });
    }

    res.json({
      success: true,
      database_statistics: stats,
      latest_sync: latestSync?.[0] || null,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sync status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;