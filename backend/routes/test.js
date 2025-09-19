// Rutas de testing para validación del sistema API-Sports
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const APIFootballClient = require('../services/apiFootball');
const FantasyDataProcessor = require('../services/dataProcessor');
const { FANTASY_POINTS } = require('../config/constants');

// Inicializar servicios
const apiFootball = new APIFootballClient();
const processor = new FantasyDataProcessor();

// GET /api/test/ping - Test básico
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

// GET /api/test/config - Información de configuración
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      api_sports_configured: !!process.env.API_FOOTBALL_KEY,
      node_env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000
    }
  });
});

// POST /api/test/fantasy-points - Test calculadora Fantasy
router.post('/fantasy-points', (req, res) => {
  try {
    const { player_stats, position } = req.body;

    console.log(`📊 Calculando puntos para jugador (${position}):`, player_stats);

    if (!player_stats || !position) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos: player_stats y position son requeridos'
      });
    }

    // Calcular puntos Fantasy
    const fantasyPoints = processor.calculatePlayerPoints(player_stats, position);

    res.json({
      success: true,
      fantasy_points: fantasyPoints,
      position,
      player_stats
    });

  } catch (error) {
    console.error('❌ Error calculando puntos Fantasy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/test/samples - Obtener muestras de datos disponibles
router.get('/samples', async (req, res) => {
  try {
    res.json({
      success: true,
      count: 0,
      samples: [],
      message: 'Samples no disponibles - usando API-Sports en tiempo real'
    });
  } catch (error) {
    console.error('❌ Error obteniendo samples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;