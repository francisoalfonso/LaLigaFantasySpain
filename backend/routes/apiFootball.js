// Rutas para API-Sports - La Liga Fantasy Dashboard
const express = require('express');
const ApiFootballClient = require('../services/apiFootball');
const DataProcessor = require('../services/dataProcessor');

const router = express.Router();
const apiFootball = new ApiFootballClient();
const dataProcessor = new DataProcessor();

// Test de conexión API-Football
router.get('/test', async (req, res) => {
  try {
    const result = await apiFootball.testConnection();

    res.json({
      success: result.success,
      message: result.message,
      provider: 'API-Football',
      data: result.data || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Información general de La Liga
router.get('/laliga/info', async (req, res) => {
  try {
    const result = await apiFootball.getLaLigaInfo();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        data: {
          league: result.data?.league,
          season: result.season,
          country: result.data?.country
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Equipos de La Liga
router.get('/laliga/teams', async (req, res) => {
  try {
    const result = await apiFootball.getLaLigaTeams();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Jugadores de La Liga
router.get('/laliga/players', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const team_id = req.query.team_id || null;

    const result = await apiFootball.getLaLigaPlayers(page, team_id);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        page: page,
        has_more: result.pagination?.current < result.pagination?.total,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Fixtures de La Liga
router.get('/laliga/fixtures', async (req, res) => {
  try {
    const from_date = req.query.from || null;
    const to_date = req.query.to || null;

    const result = await apiFootball.getLaLigaFixtures(from_date, to_date);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        filters: { from_date, to_date },
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Clasificación de La Liga
router.get('/laliga/standings', async (req, res) => {
  try {
    const result = await apiFootball.getLaLigaStandings();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Estadísticas detalladas de un jugador
router.get('/laliga/player/:id', async (req, res) => {
  try {
    const player_id = req.params.id;
    const season = req.query.season || null;

    const result = await apiFootball.getPlayerStats(player_id, season);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Obtener todas las ligas españolas (incluye Liga Femenina)
router.get('/spain/leagues', async (req, res) => {
  try {
    const result = await apiFootball.getSpanishLeagues();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// === LIGA FEMENINA ENDPOINTS ===

// Equipos de La Liga Femenina
router.get('/femenina/teams', async (req, res) => {
  try {
    const result = await apiFootball.getLigaFemeninaTeams();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        league: 'Liga Femenina',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Jugadoras de La Liga Femenina
router.get('/femenina/players', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const team_id = req.query.team_id || null;
    const season = req.query.season || null;

    const result = await apiFootball.getLigaFemeninaPlayers(page, team_id, season);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        page: page,
        league: 'Liga Femenina',
        has_more: result.pagination?.current < result.pagination?.total,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Clasificación Liga Femenina
router.get('/femenina/standings', async (req, res) => {
  try {
    const result = await apiFootball.getLigaFemeninaStandings();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        league: 'Liga Femenina',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        provider: 'API-Football'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});

// Calcular puntos Fantasy con datos API-Football
router.post('/laliga/fantasy-points', async (req, res) => {
  try {
    const { player_stats, position } = req.body;

    if (!player_stats || !position) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren player_stats y position'
      });
    }

    // Convertir stats de API-Football al formato esperado por dataProcessor
    const normalizedStats = {
      minutes_played: player_stats.games?.minutes || 0,
      goals: player_stats.goals?.total || 0,
      assists: player_stats.goals?.assists || 0,
      yellow_cards: player_stats.cards?.yellow || 0,
      red_cards: player_stats.cards?.red || 0,
      clean_sheet: player_stats.goals?.conceded === 0 && player_stats.games?.minutes >= 60,
      goals_conceded: player_stats.goals?.conceded || 0,
      penalties_saved: player_stats.penalty?.saved || 0
    };

    const fantasyPoints = dataProcessor.calculatePlayerPoints(normalizedStats, position);

    res.json({
      success: true,
      provider: 'API-Football',
      fantasy_points: fantasyPoints,
      calculation_details: {
        stats_used: normalizedStats,
        position: position,
        points_breakdown: dataProcessor.getPointsBreakdown(normalizedStats, position)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football'
    });
  }
});


module.exports = router;