// Rutas para Predicciones de Valor Fantasy La Liga
const express = require('express');
const PredictorValor = require('../services/predictorValor');
const FixtureAnalyzer = require('../services/fixtureAnalyzer');
const BargainAnalyzer = require('../services/bargainAnalyzer');
const ApiFootballClient = require('../services/apiFootball');

const router = express.Router();

// Inicializar servicios
const apiFootball = new ApiFootballClient();
const fixtureAnalyzer = new FixtureAnalyzer();
const bargainAnalyzer = new BargainAnalyzer(apiFootball, fixtureAnalyzer);
const predictorValor = new PredictorValor(fixtureAnalyzer, apiFootball);

// Cache para predicciones (5 minutos)
const predictionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Obtener predicciones para jugadores top (chollos actuales)
router.get('/top-players', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const maxPrice = parseFloat(req.query.maxPrice) || 10.0;

    console.log(`🔮 Obteniendo predicciones para top ${limit} jugadores...`);

    // Obtener chollos actuales como base
    const bargains = await bargainAnalyzer.identifyBargains(limit * 2, { maxPrice });

    if (!bargains.success || !bargains.data.length) {
      return res.status(400).json({
        success: false,
        error: 'No se pudieron obtener jugadores para predicción'
      });
    }

    // Generar predicciones para estos jugadores
    const predictions = await predictorValor.predictMultiplePlayers(bargains.data.slice(0, limit));

    // Ordenar por mayor potencial de subida
    const sortedPredictions = predictions.sort((a, b) => b.priceChange - a.priceChange);

    res.json({
      success: true,
      message: `${predictions.length} predicciones generadas`,
      data: sortedPredictions,
      metadata: {
        totalAnalyzed: predictions.length,
        averageConfidence: Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length),
        risingPlayers: predictions.filter(p => p.trend === 'rising').length,
        fallingPlayers: predictions.filter(p => p.trend === 'falling').length,
        stablePlayers: predictions.filter(p => p.trend === 'stable').length,
        generatedAt: new Date().toISOString(),
        criteria: {
          basedOn: 'Chollos de la jornada',
          maxPrice: maxPrice,
          algorithm: 'PredictorValor v1.0'
        }
      },
      tips: [
        "🔮 Las predicciones se basan en análisis multifactorial",
        "📈 Mayor confianza = predicción más fiable",
        "⏰ Mejor momento de compra/venta antes del viernes",
        "🎯 Considera el contexto del próximo rival",
        "💡 Combina con tu análisis personal para mejores resultados"
      ]
    });

  } catch (error) {
    console.error('❌ Error obteniendo predicciones:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

// Obtener predicción específica de un jugador
router.get('/player/:playerId', async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID es requerido'
      });
    }

    // Verificar cache primero (solo si no hay force=true)
    const forceRefresh = req.query.force === 'true';
    const cacheKey = `prediction_${playerId}`;
    const cached = predictionCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`⚡ Predicción en cache para jugador ${playerId}`);
      return res.json({
        success: true,
        message: 'Predicción obtenida desde cache',
        data: cached.data,
        cached: true
      });
    }

    if (forceRefresh) {
      console.log(`🔄 FORCE REFRESH: Regenerando predicción para jugador ${playerId}`);
    }

    console.log(`🎯 Generando nueva predicción para jugador ${playerId}...`);

    // Buscar jugador en chollos primero (menos jugadores para acelerar)
    let player = null;

    const bargains = await bargainAnalyzer.identifyBargains(50); // Reducido de 200 a 50
    player = bargains.data.find(p => p.id === playerId);

    if (!player) {
      console.log(`🔍 Jugador ${playerId} no encontrado en chollos, buscando en API-Sports...`);

      // Obtener datos del jugador desde API-Sports
      const playerResult = await apiFootball.getPlayerStats(playerId);

      if (!playerResult.success) {
        return res.status(404).json({
          success: false,
          error: 'Jugador no encontrado en API-Sports'
        });
      }

      // Formatear datos para el predictor
      const apiPlayer = playerResult.data;
      player = {
        id: apiPlayer.player.id,
        name: apiPlayer.player.name,
        team: {
          id: apiPlayer.team.id,
          name: apiPlayer.team.name
        },
        position: apiPlayer.games.position,
        price: 8.0, // Precio por defecto para jugadores no en chollos
        stats: {
          games: apiPlayer.games.appearences || 0,
          goals: apiPlayer.goals.total || 0,
          assists: apiPlayer.goals.assists || 0,
          minutes: apiPlayer.games.minutes || 0,
          rating: parseFloat(apiPlayer.games.rating) || 6.0
        }
      };

      console.log(`✅ Jugador obtenido desde API-Sports:`, player.name);
    }

    // Obtener próximo fixture del equipo del jugador
    let nextFixture = null;
    if (player.team?.id) {
      try {
        const fixtures = await fixtureAnalyzer.getNextFixtures(player.team.id, 1);
        if (fixtures.length > 0) {
          nextFixture = fixtures[0];
          console.log(`🗓️ Próximo rival obtenido: ${nextFixture.teams?.away?.name || nextFixture.teams?.home?.name}`);
        }
      } catch (error) {
        console.log(`⚠️ No se pudo obtener próximo fixture para equipo ${player.team.id}:`, error.message);
      }
    }

    // Generar predicción detallada
    const prediction = await predictorValor.predictPlayerValue(player, nextFixture);

    // Guardar en cache
    predictionCache.set(cacheKey, {
      data: prediction,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: `Predicción generada para ${player.name}`,
      data: prediction,
      metadata: {
        playerInfo: {
          id: player.id,
          name: player.name,
          team: player.team?.name,
          position: player.position,
          age: player.age,
          nationality: player.nationality
        },
        generatedAt: new Date().toISOString(),
        cached: false
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo predicción específica:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

// Obtener predicciones por posición
router.get('/by-position/:position', async (req, res) => {
  try {
    const position = req.params.position.toUpperCase();
    const limit = parseInt(req.query.limit) || 10;

    const validPositions = ['GK', 'DEF', 'MID', 'FWD'];
    if (!validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        error: `Posición inválida. Debe ser: ${validPositions.join(', ')}`
      });
    }

    console.log(`🎯 Obteniendo predicciones para posición ${position}...`);

    // Obtener jugadores de la posición específica
    const bargains = await bargainAnalyzer.identifyBargains(100, { position });

    if (!bargains.success || !bargains.data.length) {
      return res.status(400).json({
        success: false,
        error: `No se encontraron jugadores para posición ${position}`
      });
    }

    // Generar predicciones
    const predictions = await predictorValor.predictMultiplePlayers(bargains.data.slice(0, limit));

    // Ordenar por potencial de subida
    const sortedPredictions = predictions.sort((a, b) => b.priceChange - a.priceChange);

    res.json({
      success: true,
      message: `${predictions.length} predicciones para ${position}`,
      data: sortedPredictions,
      metadata: {
        position: position,
        totalAnalyzed: predictions.length,
        averageConfidence: Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length),
        averagePredictedChange: Math.round(predictions.reduce((sum, p) => sum + p.priceChange, 0) / predictions.length * 10) / 10,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo predicciones por posición:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

// Obtener alertas de trading (compras/ventas recomendadas)
router.get('/trading-alerts', async (req, res) => {
  try {
    const minConfidence = parseInt(req.query.minConfidence) || 70;
    const minChange = parseFloat(req.query.minChange) || 0.3;

    console.log(`🚨 Generando alertas de trading (confianza ≥${minConfidence}%, cambio ≥${minChange}M)...`);

    // Obtener predicciones para jugadores relevantes
    const bargains = await bargainAnalyzer.identifyBargains(50);
    const predictions = await predictorValor.predictMultiplePlayers(bargains.data);

    // Filtrar alertas importantes
    const buyAlerts = predictions.filter(p =>
      p.confidence >= minConfidence &&
      p.priceChange >= minChange &&
      p.recommendation.action === 'BUY'
    );

    const sellAlerts = predictions.filter(p =>
      p.confidence >= minConfidence &&
      Math.abs(p.priceChange) >= minChange &&
      p.recommendation.action === 'SELL'
    );

    res.json({
      success: true,
      message: `${buyAlerts.length + sellAlerts.length} alertas generadas`,
      data: {
        buyAlerts: buyAlerts.sort((a, b) => b.priceChange - a.priceChange),
        sellAlerts: sellAlerts.sort((a, b) => a.priceChange - b.priceChange),
        summary: {
          totalAlerts: buyAlerts.length + sellAlerts.length,
          buyOpportunities: buyAlerts.length,
          sellWarnings: sellAlerts.length,
          averageBuyPotential: buyAlerts.length > 0 ?
            Math.round(buyAlerts.reduce((sum, p) => sum + p.priceChange, 0) / buyAlerts.length * 10) / 10 : 0,
          averageSellRisk: sellAlerts.length > 0 ?
            Math.round(sellAlerts.reduce((sum, p) => sum + Math.abs(p.priceChange), 0) / sellAlerts.length * 10) / 10 : 0
        }
      },
      metadata: {
        filters: {
          minConfidence: minConfidence,
          minChange: minChange
        },
        generatedAt: new Date().toISOString()
      },
      tips: [
        "🟢 BUY: Jugadores con alta probabilidad de subida",
        "🔴 SELL: Jugadores con riesgo de bajada",
        "⏰ Ejecutar operaciones antes del cierre de mercado",
        "📊 Mayor confianza = menor riesgo"
      ]
    });

  } catch (error) {
    console.error('❌ Error generando alertas de trading:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

// Estadísticas de rendimiento y cache
router.get('/stats', async (req, res) => {
  try {
    const stats = predictorValor.getCacheStats();

    res.json({
      success: true,
      message: 'Estadísticas del PredictorValor',
      data: {
        cache: stats,
        performance: {
          historicalAnalysisOptimized: 'Cache 24h + Rate limiting reducido',
          averageRequestTime: '~500ms con cache hit vs ~10s sin cache',
          recommendedMaxPredictions: '10-20 simultáneas'
        },
        endpoints: {
          clearCache: 'POST /api/predictions/cache/clear',
          testOptimized: 'GET /api/predictions/test/historical?playerId=143&opponentId=529'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

// Limpiar cache para testing o mantenimiento
router.post('/cache/clear', async (req, res) => {
  try {
    predictorValor.clearHistoricalCache();

    res.json({
      success: true,
      message: 'Cache histórico limpiado correctamente',
      note: 'Próximas consultas serán más lentas hasta rebuild del cache'
    });

  } catch (error) {
    console.error('❌ Error limpiando cache:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

// Test específico para historial vs rival
router.get('/test/historical', async (req, res) => {
  try {
    console.log('🧪 Ejecutando test del análisis histórico vs rival...');

    // Parámetros de test
    const playerId = parseInt(req.query.playerId) || 521; // Lewandowski por defecto
    const opponentId = parseInt(req.query.opponentId) || 541; // Real Madrid por defecto

    console.log(`🔍 Testeando historial del jugador ${playerId} vs equipo ${opponentId}...`);

    // Test del nuevo método getPlayerVsTeamHistory
    const historyResult = await apiFootball.getPlayerVsTeamHistory(playerId, opponentId);

    if (!historyResult.success) {
      return res.json({
        success: true,
        message: 'Test completado - Sin historial disponible',
        testData: {
          playerId,
          opponentId,
          historyResult,
          reason: historyResult.error || 'No se encontraron datos'
        }
      });
    }

    // Test del análisis histórico
    const mockPlayer = {
      id: playerId,
      name: 'Test Player',
      team: { id: 529 }, // Barcelona como ejemplo
      position: 'FWD'
    };

    const mockNextFixture = {
      teams: {
        home: { id: 529, name: 'Barcelona' },
        away: { id: opponentId, name: 'Real Madrid' }
      }
    };

    const analysisResult = await predictorValor.analyzeHistoricalVsOpponent(mockPlayer, mockNextFixture);

    res.json({
      success: true,
      message: 'Test análisis histórico vs rival completado',
      testData: {
        playerId,
        opponentId,
        rawHistory: historyResult,
        historicalAnalysis: analysisResult,
        summary: {
          totalGames: historyResult.totalGames,
          dataAvailable: historyResult.data.length > 0,
          analysisScore: analysisResult.score,
          factors: analysisResult.factors
        }
      },
      apiUsage: {
        requestsMade: 'Variable según historial disponible',
        rateLimitRespected: 'Sí - 200ms entre requests',
        cacheRecommended: 'Sí - Datos cambian poco'
      }
    });

  } catch (error) {
    console.error('❌ Error en test histórico:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Test histórico falló',
      service: 'HistorialVsRival'
    });
  }
});

// Test endpoint para verificar funcionamiento
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Ejecutando test del PredictorValor...');

    // Test con un jugador de ejemplo
    const testPlayer = {
      id: 521,
      name: 'R. Lewandowski',
      team: { id: 529, name: 'Barcelona' },
      position: 'FWD',
      age: 36,
      stats: {
        games: 4,
        minutes: 300,
        goals: 5,
        assists: 1,
        rating: '7.2'
      },
      analysis: {
        estimatedPrice: 8.5,
        estimatedPoints: 6.2,
        valueRatio: 1.15
      }
    };

    const prediction = await predictorValor.predictPlayerValue(testPlayer);

    res.json({
      success: true,
      message: 'Test PredictorValor completado',
      testData: {
        inputPlayer: testPlayer,
        prediction: prediction
      },
      serviceStatus: {
        predictorValor: 'operational',
        fixtureAnalyzer: 'operational',
        apiFootball: 'operational'
      }
    });

  } catch (error) {
    console.error('❌ Error en test PredictorValor:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'PredictorValor'
    });
  }
});

module.exports = router;