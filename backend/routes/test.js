// Rutas de testing para validación del sistema
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const SportMonksClient = require('../services/sportmonks');
const FantasyDataProcessor = require('../services/dataProcessor');
const { FANTASY_POINTS } = require('../config/constants');

// Inicializar servicios
const sportmonks = new SportMonksClient();
const processor = new FantasyDataProcessor();

// GET /api/test/ping - Test básico
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/test/config - Verificar configuración
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      sportmonks_api_configured: !!process.env.SPORTMONKS_API_KEY,
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      fantasy_points_system: FANTASY_POINTS
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/test/samples - Listar muestras de datos guardadas
router.get('/samples', async (req, res) => {
  try {
    const samplesDir = path.join(__dirname, '../../data-samples');

    try {
      const files = await fs.readdir(samplesDir);
      const samples = files
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: `/api/test/samples/${file.replace('.json', '')}`
        }));

      res.json({
        success: true,
        count: samples.length,
        samples: samples,
        timestamp: new Date().toISOString()
      });
    } catch (dirError) {
      res.json({
        success: true,
        count: 0,
        samples: [],
        message: 'Directorio de muestras no existe aún',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/test/samples/:name - Ver muestra específica
router.get('/samples/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const filePath = path.join(__dirname, '../../data-samples', `${name}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const sample = JSON.parse(data);

      res.json({
        success: true,
        sample_name: name,
        data: sample,
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      res.status(404).json({
        success: false,
        error: 'Muestra no encontrada',
        available: `/api/test/samples`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/test/fantasy-points - Test del calculador de puntos
router.post('/fantasy-points', (req, res) => {
  try {
    const { player_stats, position } = req.body;

    if (!player_stats || !position) {
      return res.status(400).json({
        success: false,
        error: 'Requeridos: player_stats y position',
        example: {
          player_stats: {
            minutes_played: 90,
            goals: 1,
            assists: 1,
            yellow_cards: 0,
            red_cards: 0
          },
          position: 'FWD'
        },
        timestamp: new Date().toISOString()
      });
    }

    const fantasyPoints = processor.calculatePlayerPoints(player_stats, position);

    res.json({
      success: true,
      input: { player_stats, position },
      fantasy_points: fantasyPoints,
      calculation_details: 'Ver logs del servidor para detalles',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/test/mock-data - Generar datos de prueba
router.get('/mock-data', (req, res) => {
  const mockPlayer = {
    id: 12345,
    name: 'Test Player',
    position: 'FWD',
    stats: {
      minutes_played: 90,
      goals: 2,
      assists: 1,
      yellow_cards: 1,
      red_cards: 0,
      clean_sheet: false,
      goals_conceded: 0,
      penalties_saved: 0
    }
  };

  const mockMatch = {
    id: 67890,
    date: new Date().toISOString(),
    home_team: 'Real Madrid',
    away_team: 'Barcelona',
    score: { home: 2, away: 1 },
    players: [mockPlayer]
  };

  // Calcular puntos para el jugador mock
  mockPlayer.fantasy_points = processor.calculatePlayerPoints(mockPlayer.stats, 9); // 9 = FWD

  res.json({
    success: true,
    mock_data: {
      player: mockPlayer,
      match: mockMatch,
      insights: processor.generateInsights([mockMatch])
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/test/full-workflow - Test completo del flujo
router.get('/full-workflow', async (req, res) => {
  try {
    console.log('🚀 Iniciando test completo del flujo...');

    const results = {
      steps: [],
      success: true,
      errors: []
    };

    // Paso 1: Test de conexión
    try {
      console.log('📡 Paso 1: Test de conexión...');
      const connectionTest = await sportmonks.testConnection();
      results.steps.push({
        step: 1,
        name: 'Conexión SportMonks',
        success: connectionTest.success,
        data: connectionTest
      });
    } catch (error) {
      results.steps.push({
        step: 1,
        name: 'Conexión SportMonks',
        success: false,
        error: error.message
      });
      results.errors.push(`Paso 1: ${error.message}`);
    }

    // Paso 2: Obtener ligas
    try {
      console.log('📋 Paso 2: Obteniendo ligas...');
      const leagues = await sportmonks.getLeagues();
      results.steps.push({
        step: 2,
        name: 'Obtener ligas',
        success: Array.isArray(leagues),
        data: { count: leagues.length, sample: leagues.slice(0, 3) }
      });
    } catch (error) {
      results.steps.push({
        step: 2,
        name: 'Obtener ligas',
        success: false,
        error: error.message
      });
      results.errors.push(`Paso 2: ${error.message}`);
    }

    // Paso 3: Test calculador Fantasy
    try {
      console.log('🧮 Paso 3: Test calculador Fantasy...');
      const mockStats = {
        minutes_played: 90,
        goals: 1,
        assists: 1,
        yellow_cards: 0,
        red_cards: 0
      };
      const points = processor.calculatePlayerPoints(mockStats, 9); // FWD
      results.steps.push({
        step: 3,
        name: 'Calculador Fantasy',
        success: typeof points === 'number',
        data: { input: mockStats, points }
      });
    } catch (error) {
      results.steps.push({
        step: 3,
        name: 'Calculador Fantasy',
        success: false,
        error: error.message
      });
      results.errors.push(`Paso 3: ${error.message}`);
    }

    // Determinar éxito general
    results.success = results.errors.length === 0;

    console.log(`✅ Test completo finalizado. Éxito: ${results.success}`);

    res.json({
      success: results.success,
      workflow_test: results,
      summary: {
        total_steps: results.steps.length,
        successful_steps: results.steps.filter(s => s.success).length,
        failed_steps: results.errors.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en test completo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;