// Rutas para API-Sports - La Liga Fantasy Dashboard
const express = require('express');
const logger = require('../utils/logger');
const ApiFootballClient = require('../services/apiFootball');
const DataProcessor = require('../services/dataProcessor');
const PlayersManager = require('../services/playersManager');

const router = express.Router();
const apiFootball = new ApiFootballClient();
const dataProcessor = new DataProcessor();
const playersManager = new PlayersManager();

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

// Jugadores de La Liga con Cache Inteligente
router.get('/laliga/players', async (req, res) => {
  try {
    const pageParam = req.query.page;
    const team_id = req.query.team_id || null;
    const position = req.query.position || null;
    const status = req.query.status || null;
    const search = req.query.search || null;
    const sortBy = req.query.sortBy || null;
    const useCache = req.query.cache !== 'false'; // Por defecto usa cache

    // Si pide todos los jugadores (sin filtros específicos)
    if (pageParam === 'all' && !position && !status && !search && !team_id) {
      logger.info('📋 Solicitando TODOS los jugadores de La Liga con cache...');
      const result = await playersManager.getAllPlayers(useCache);

      if (result.success) {
        res.json({
          success: true,
          provider: 'API-Football',
          count: result.totalPlayers,
          total_pages: 'all',
          cached: result.cached,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          provider: 'API-Football',
          cached: result.cached
        });
      }
    } else if (pageParam === 'all' || position || status || search || team_id || sortBy) {
      // Jugadores con filtros - usar sistema de filtros con cache
      logger.info('🔍 Solicitando jugadores filtrados con cache...');
      const filters = {
        team: team_id,
        position,
        status,
        search,
        sortBy
      };

      const result = await playersManager.getFilteredPlayers(filters);

      if (result.success) {
        res.json({
          success: true,
          provider: 'API-Football',
          count: result.totalPlayers,
          total_pages: 'all',
          cached: result.cached,
          sourceCache: result.sourceCache,
          filters: result.filters,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          provider: 'API-Football',
          cached: result.cached
        });
      }
    } else {
      // Paginación normal (fallback al método original)
      const page = parseInt(pageParam) || 1;
      const result = await apiFootball.getLaLigaPlayers(page, team_id);

      if (result.success) {
        res.json({
          success: true,
          provider: 'API-Football',
          count: result.count,
          page: page,
          has_more: result.pagination?.current < result.pagination?.total,
          cached: false,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          provider: 'API-Football',
          cached: false
        });
      }
    }
  } catch (error) {
    logger.error('❌ Error en endpoint de jugadores:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football',
      cached: false
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

// Información completa de un jugador con Cache (estadísticas + lesiones + partidos recientes)
router.get('/laliga/player/:id/details', async (req, res) => {
  try {
    const player_id = req.params.id;
    const season = req.query.season || null;
    const useCache = req.query.cache !== 'false'; // Por defecto usa cache

    logger.info(`🎯 Solicitando detalles completos del jugador ${player_id} con cache...`);

    const result = await playersManager.getPlayerDetails(player_id);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        cached: result.cached,
        data: result.data,
        metadata: {
          playerId: player_id,
          season: season || apiFootball.LEAGUES.CURRENT_SEASON,
          requestTime: new Date().toISOString(),
          cached: result.cached,
          sections: {
            basicInfo: true,
            statistics: true,
            injuries: result.data.injuries?.length > 0,
            recentGames: result.data.recentGames?.length > 0
          }
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        provider: 'API-Football',
        cached: result.cached || false
      });
    }
  } catch (error) {
    logger.error(`❌ Error en detalles del jugador ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'API-Football',
      cached: false
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

// === ENTRENADORES ===

// Obtener entrenadores de La Liga
router.get('/laliga/coaches', async (req, res) => {
  try {
    const team_id = req.query.team_id || null;
    const result = await apiFootball.getLaLigaCoaches(team_id);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        count: result.count,
        filters: { team_id },
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

// Obtener detalles específicos de un entrenador
router.get('/laliga/coach/:id', async (req, res) => {
  try {
    const coach_id = req.params.id;
    const result = await apiFootball.getCoachDetails(coach_id);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        data: result.data
      });
    } else {
      res.status(404).json({
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

// === ALINEACIONES EN TIEMPO REAL ===

// Obtener partidos de hoy con alineaciones
router.get('/laliga/lineups/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await apiFootball.getLiveLaLigaLineups(today);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        date: today,
        fixtures_count: result.count,
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

// Obtener alineaciones de un partido específico
router.get('/laliga/lineups/fixture/:fixture_id', async (req, res) => {
  try {
    const fixture_id = req.params.fixture_id;
    const result = await apiFootball.getFixtureLineups(fixture_id);

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        fixture_id: fixture_id,
        data: result.data
      });
    } else {
      res.status(404).json({
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

// Obtener partidos en vivo de La Liga
router.get('/laliga/live', async (req, res) => {
  try {
    const result = await apiFootball.getLiveLaLigaMatches();

    if (result.success) {
      res.json({
        success: true,
        provider: 'API-Football',
        live_matches: result.count,
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

// === GESTIÓN DE CACHE ===

// Estadísticas del cache de jugadores
router.get('/cache/players/stats', async (req, res) => {
  try {
    const stats = playersManager.getCacheStats();

    res.json({
      success: true,
      provider: 'PlayersCache',
      timestamp: new Date().toISOString(),
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'PlayersCache'
    });
  }
});

// Invalidar cache de jugadores
router.post('/cache/players/invalidate', async (req, res) => {
  try {
    const pattern = req.body.pattern || 'all';
    const invalidated = playersManager.invalidateCache(pattern);

    res.json({
      success: true,
      provider: 'PlayersCache',
      message: `Cache invalidated: ${invalidated} entries removed`,
      pattern: pattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'PlayersCache'
    });
  }
});

// Limpiar todo el cache de jugadores
router.post('/cache/players/clear', async (req, res) => {
  try {
    playersManager.clearCache();

    res.json({
      success: true,
      provider: 'PlayersCache',
      message: 'Cache cleared completely',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'PlayersCache'
    });
  }
});

// Forzar actualización del cache desde API
router.post('/cache/players/refresh', async (req, res) => {
  try {
    logger.info('🔄 Forzando actualización del cache de jugadores...');
    const result = await playersManager.forceRefresh();

    res.json({
      success: result.success,
      provider: 'PlayersCache',
      message: 'Cache refreshed from API',
      totalPlayers: result.totalPlayers,
      cached: result.cached,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'PlayersCache'
    });
  }
});

// Precalentar cache de jugadores
router.post('/cache/players/warmup', async (req, res) => {
  try {
    logger.info('🔥 Precalentando cache de jugadores...');
    await playersManager.warmupCache();

    res.json({
      success: true,
      provider: 'PlayersCache',
      message: 'Cache warmup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'PlayersCache'
    });
  }
});


module.exports = router;