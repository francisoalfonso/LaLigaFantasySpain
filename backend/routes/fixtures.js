// =================================================
// RUTAS FIXTURES Y ALINEACIONES LA LIGA
// =================================================
// Endpoints para sincronización y consulta de fixtures con alineaciones

const express = require('express');
const FixturesSync = require('../services/fixturesSync');

const router = express.Router();

// === SINCRONIZACIÓN DE FIXTURES ===

// Sincronizar fixtures del día actual
router.post('/sync/today', async (req, res) => {
  try {
    const fixturesSync = new FixturesSync();
    const result = await fixturesSync.syncTodayFixtures();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          synced: result.synced,
          total: result.total,
          errors: result.errors
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        data: {
          synced: result.synced,
          errors: result.errors
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sincronizar fixtures de un rango de fechas
router.post('/sync/range', async (req, res) => {
  try {
    const { from_date, to_date } = req.body;

    if (!from_date || !to_date) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren from_date y to_date (formato: YYYY-MM-DD)'
      });
    }

    const fixturesSync = new FixturesSync();
    const result = await fixturesSync.syncFixturesRange(from_date, to_date);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          synced: result.synced,
          total: result.total,
          errors: result.errors,
          date_range: { from_date, to_date }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        data: {
          synced: result.synced,
          errors: result.errors
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === CONSULTA DE FIXTURES ===

// Obtener fixtures desde base de datos local
router.get('/local', async (req, res) => {
  try {
    const date = req.query.date || null; // formato: YYYY-MM-DD

    const fixturesSync = new FixturesSync();
    const result = await fixturesSync.getLocalFixtures(date);

    if (result.success) {
      res.json({
        success: true,
        count: result.count,
        date_filter: date,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener fixtures de hoy desde base de datos local
router.get('/local/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const fixturesSync = new FixturesSync();
    const result = await fixturesSync.getLocalFixtures(today);

    if (result.success) {
      res.json({
        success: true,
        count: result.count,
        date: today,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === ALINEACIONES EN TIEMPO REAL ===

// Obtener alineaciones de una fecha específica
router.get('/lineups/date/:date', async (req, res) => {
  try {
    const targetDate = req.params.date;

    // Validar formato de fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    // Obtener datos directamente de API-Sports para la fecha específica
    const ApiFootballClient = require('../services/apiFootball');
    const apiFootball = new ApiFootballClient();

    const fixturesResult = await apiFootball.getLaLigaFixtures(targetDate, targetDate);

    if (!fixturesResult.success) {
      return res.status(400).json({
        success: false,
        error: `Error API-Sports: ${fixturesResult.error}`
      });
    }

    const fixtures = fixturesResult.data;

    if (fixtures.length === 0) {
      return res.json({
        success: true,
        date: targetDate,
        total_fixtures: 0,
        fixtures_with_lineups: 0,
        data: [],
        message: `No hay partidos programados para ${targetDate}`
      });
    }

    // Si hay fixtures, obtener alineaciones para cada uno
    const fixturesWithLineups = [];

    for (const fixture of fixtures) {
      try {
        const lineupsResult = await apiFootball.getFixtureLineups(fixture.id);

        if (lineupsResult.success && lineupsResult.data.length > 0) {
          fixturesWithLineups.push({
            api_fixture_id: fixture.id,
            date: fixture.date,
            status_long: fixture.status,
            round: `Jornada ${fixture.round || 'N/A'}`,
            home_team_id: fixture.home_team.id,
            home_team_name: fixture.home_team.name,
            home_team_logo: fixture.home_team.logo,
            away_team_id: fixture.away_team.id,
            away_team_name: fixture.away_team.name,
            away_team_logo: fixture.away_team.logo,
            venue_name: fixture.venue,
            goals_home: fixture.score.home,
            goals_away: fixture.score.away,
            lineups: lineupsResult.data.map(teamLineup => ({
              team_id: teamLineup.team.id,
              team_name: teamLineup.team.name,
              formation: teamLineup.formation,
              coach_name: teamLineup.coach?.name,
              lineup_players: [
                ...teamLineup.startXI.map(p => ({
                  player_id: p.player.id,
                  player_name: p.player.name,
                  player_number: p.player.number,
                  player_position: p.player.pos,
                  player_grid: p.player.grid,
                  player_type: 'starter'
                })),
                ...teamLineup.substitutes.map(p => ({
                  player_id: p.player.id,
                  player_name: p.player.name,
                  player_number: p.player.number,
                  player_position: p.player.pos,
                  player_type: 'substitute'
                }))
              ]
            }))
          });
        } else {
          // Incluir fixture sin alineaciones para mostrar que existió el partido
          fixturesWithLineups.push({
            api_fixture_id: fixture.id,
            date: fixture.date,
            status_long: fixture.status,
            round: `Jornada ${fixture.round || 'N/A'}`,
            home_team_id: fixture.home_team.id,
            home_team_name: fixture.home_team.name,
            home_team_logo: fixture.home_team.logo,
            away_team_id: fixture.away_team.id,
            away_team_name: fixture.away_team.name,
            away_team_logo: fixture.away_team.logo,
            venue_name: fixture.venue,
            goals_home: fixture.score.home,
            goals_away: fixture.score.away,
            lineups: []
          });
        }
      } catch (error) {
        console.log(`⚠️ Error obteniendo alineaciones para fixture ${fixture.id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      date: targetDate,
      total_fixtures: fixtures.length,
      fixtures_with_lineups: fixturesWithLineups.filter(f => f.lineups.length > 0).length,
      data: fixturesWithLineups
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener alineaciones en vivo (combinando API + local)
router.get('/lineups/live', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Primero intentar obtener datos directamente de API-Sports
    const ApiFootballClient = require('../services/apiFootball');
    const apiFootball = new ApiFootballClient();

    const fixturesResult = await apiFootball.getLaLigaFixtures(today, today);

    if (!fixturesResult.success) {
      return res.status(400).json({
        success: false,
        error: `Error API-Sports: ${fixturesResult.error}`
      });
    }

    const fixtures = fixturesResult.data;

    if (fixtures.length === 0) {
      // No hay partidos hoy, devolver respuesta vacía exitosa
      return res.json({
        success: true,
        date: today,
        total_fixtures: 0,
        fixtures_with_lineups: 0,
        data: [],
        message: 'No hay partidos programados para hoy'
      });
    }

    // Si hay fixtures, intentar obtener alineaciones para cada uno
    const fixturesWithLineups = [];

    for (const fixture of fixtures) {
      try {
        const lineupsResult = await apiFootball.getFixtureLineups(fixture.id);

        if (lineupsResult.success && lineupsResult.data.length > 0) {
          fixturesWithLineups.push({
            api_fixture_id: fixture.id,
            date: fixture.date,
            status_long: fixture.status,
            round: `Jornada ${fixture.round || 'N/A'}`,
            home_team_id: fixture.home_team.id,
            home_team_name: fixture.home_team.name,
            home_team_logo: fixture.home_team.logo,
            away_team_id: fixture.away_team.id,
            away_team_name: fixture.away_team.name,
            away_team_logo: fixture.away_team.logo,
            venue_name: fixture.venue,
            goals_home: fixture.score.home,
            goals_away: fixture.score.away,
            lineups: lineupsResult.data.map(teamLineup => ({
              team_id: teamLineup.team.id,
              team_name: teamLineup.team.name,
              formation: teamLineup.formation,
              coach_name: teamLineup.coach?.name,
              lineup_players: [
                ...teamLineup.startXI.map(p => ({
                  player_id: p.player.id,
                  player_name: p.player.name,
                  player_number: p.player.number,
                  player_position: p.player.pos,
                  player_grid: p.player.grid,
                  player_type: 'starter'
                })),
                ...teamLineup.substitutes.map(p => ({
                  player_id: p.player.id,
                  player_name: p.player.name,
                  player_number: p.player.number,
                  player_position: p.player.pos,
                  player_type: 'substitute'
                }))
              ]
            }))
          });
        }
      } catch (error) {
        console.log(`⚠️ Error obteniendo alineaciones para fixture ${fixture.id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      date: today,
      total_fixtures: fixtures.length,
      fixtures_with_lineups: fixturesWithLineups.length,
      data: fixturesWithLineups
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener alineación de un fixture específico
router.get('/lineups/fixture/:fixture_id', async (req, res) => {
  try {
    const fixture_id = req.params.fixture_id;
    const fixturesSync = new FixturesSync();

    // Buscar fixture en base de datos local
    const { data, error } = await fixturesSync.supabase
      .from('fixtures')
      .select(`
        *,
        lineups!lineups_fixture_api_id_fkey (
          *,
          lineup_players!lineup_players_fixture_api_id_fkey (*)
        )
      `)
      .eq('api_fixture_id', fixture_id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Fixture no encontrado en base de datos local'
      });
    }

    res.json({
      success: true,
      fixture_id: fixture_id,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === ESTADÍSTICAS ===

// Obtener estadísticas de sincronización
router.get('/stats', async (req, res) => {
  try {
    const fixturesSync = new FixturesSync();
    const result = await fixturesSync.getSyncStats();

    if (result.success) {
      res.json({
        success: true,
        data: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === AUTOMATIZACIÓN ===

// Endpoint para webhook/cron de sincronización automática
router.post('/sync/auto', async (req, res) => {
  try {
    const fixturesSync = new FixturesSync();

    // Sincronizar fixtures de hoy
    const todayResult = await fixturesSync.syncTodayFixtures();

    // Sincronizar próximos 7 días
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const rangeResult = await fixturesSync.syncFixturesRange(
      today.toISOString().split('T')[0],
      nextWeek.toISOString().split('T')[0]
    );

    res.json({
      success: true,
      message: 'Sincronización automática completada',
      data: {
        today: todayResult,
        next_week: rangeResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;