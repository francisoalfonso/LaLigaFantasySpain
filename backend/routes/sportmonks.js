// Rutas para endpoints de SportMonks API
const express = require('express');
const router = express.Router();

const SportMonksClient = require('../services/sportmonks');
const FantasyDataProcessor = require('../services/dataProcessor');

// Inicializar servicios
const sportmonks = new SportMonksClient();
const processor = new FantasyDataProcessor();

// GET /api/sportmonks/test - Prueba de conexión
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Iniciando test de conexión SportMonks...');
    const result = await sportmonks.testConnection();

    res.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (error) {
    console.error('Error en test de conexión:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sportmonks/leagues - Obtener ligas disponibles
router.get('/leagues', async (req, res) => {
  try {
    console.log('📋 Obteniendo ligas disponibles...');
    const leagues = await sportmonks.getLeagues();

    res.json({
      success: true,
      count: leagues.length,
      data: leagues,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo ligas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sportmonks/teams - Obtener equipos de La Liga
router.get('/teams', async (req, res) => {
  try {
    const { league_id } = req.query;
    console.log('👥 Obteniendo equipos...', { league_id });

    const teams = await sportmonks.getTeams(league_id);

    res.json({
      success: true,
      count: teams.length,
      data: teams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sportmonks/matches/date/:date - Partidos por fecha
router.get('/matches/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { league_id } = req.query;

    console.log('📅 Obteniendo partidos por fecha...', { date, league_id });

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido. Usar YYYY-MM-DD',
        timestamp: new Date().toISOString()
      });
    }

    const matches = await sportmonks.getMatchesByDate(date, league_id);

    res.json({
      success: true,
      date: date,
      count: matches.length,
      data: matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo partidos por fecha:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sportmonks/matches/live - Partidos en vivo
router.get('/matches/live', async (req, res) => {
  try {
    const { league_id } = req.query;
    console.log('🔴 Obteniendo partidos en vivo...', { league_id });

    const liveMatches = await sportmonks.getLiveMatches(league_id);

    res.json({
      success: true,
      count: liveMatches.length,
      data: liveMatches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo partidos en vivo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sportmonks/player/:id - Estadísticas de jugador
router.get('/player/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { season_id } = req.query;

    console.log('👤 Obteniendo estadísticas de jugador...', { id, season_id });

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de jugador inválido',
        timestamp: new Date().toISOString()
      });
    }

    const playerStats = await sportmonks.getPlayerStats(parseInt(id), season_id);

    if (!playerStats) {
      return res.status(404).json({
        success: false,
        error: 'Jugador no encontrado',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: playerStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de jugador:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sportmonks/fixture/:id - Detalles completos de un partido
router.get('/fixture/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⚽ Obteniendo detalles del fixture...', { id });

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de fixture inválido',
        timestamp: new Date().toISOString()
      });
    }

    const fixtureDetails = await sportmonks.getFixtureDetails(parseInt(id));

    if (!fixtureDetails) {
      return res.status(404).json({
        success: false,
        error: 'Fixture no encontrado',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: fixtureDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo detalles del fixture:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/sportmonks/fantasy/calculate - Calcular puntos Fantasy
router.post('/fantasy/calculate', async (req, res) => {
  try {
    const { matches } = req.body;

    console.log('🧮 Calculando puntos Fantasy...', { matches_count: matches?.length });

    if (!matches || !Array.isArray(matches)) {
      return res.status(400).json({
        success: false,
        error: 'Datos de partidos requeridos',
        timestamp: new Date().toISOString()
      });
    }

    // Procesar cada partido
    const processedMatches = matches.map(match => processor.processMatchData(match));

    // Generar insights
    const insights = processor.generateInsights(processedMatches);

    res.json({
      success: true,
      matches: processedMatches,
      insights: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculando puntos Fantasy:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;