// Rutas para análisis de chollos Fantasy
const express = require('express');
const router = express.Router();
const BargainAnalyzer = require('../services/bargainAnalyzer');

// Inicializar analizador de chollos
const bargainAnalyzer = new BargainAnalyzer();

// Test de conexión del analizador
router.get('/test', async (req, res) => {
  try {
    console.log('🔄 Test del analizador de chollos...');

    res.json({
      success: true,
      message: 'Analizador de chollos funcionando correctamente',
      service: 'BargainAnalyzer',
      timestamp: new Date().toISOString(),
      endpoints: {
        '/api/bargains/top': 'Mejores chollos de la jornada',
        '/api/bargains/position/:position': 'Chollos por posición (GK, DEF, MID, FWD)',
        '/api/bargains/compare/:id1/:id2': 'Comparar valor de dos jugadores',
        '/api/bargains/analysis': 'Análisis detallado con parámetros personalizados'
      }
    });

  } catch (error) {
    console.error('❌ Error en test de bargains:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener los mejores chollos de la jornada
router.get('/top', async (req, res) => {
  try {
    console.log('🔍 Obteniendo mejores chollos de la jornada...');

    // Parámetros opcionales
    const limit = parseInt(req.query.limit) || 10;
    const maxPrice = parseFloat(req.query.maxPrice) || undefined;

    console.log(`📊 Parámetros: limit=${limit}, maxPrice=${maxPrice}`);

    // Obtener chollos
    const options = { maxPrice };
    const result = await bargainAnalyzer.identifyBargains(limit, options);

    if (result.success) {
      // Filtrar por precio máximo si se especifica
      let filteredData = result.data;
      if (maxPrice) {
        filteredData = result.data.filter(player => player.analysis.estimatedPrice <= maxPrice);
      }

      res.json({
        success: true,
        message: `${filteredData.length} chollos identificados`,
        data: filteredData,
        metadata: {
          ...result.metadata,
          requestParams: { limit, maxPrice },
          filteredCount: filteredData.length
        },
        tips: [
          '💡 Los chollos se basan en ratio puntos/precio estimado',
          '⚡ Considera la forma actual y próximos rivales',
          '🎯 Jugadores con rating >7.0 tienen mejor consistencia',
          '📈 El ratio >1.5 indica excelente valor por precio'
        ]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error analizando chollos',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo chollos:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener chollos por posición específica
router.get('/position/:position', async (req, res) => {
  try {
    const position = req.params.position.toUpperCase();
    const limit = parseInt(req.query.limit) || 5;

    console.log(`🔍 Obteniendo chollos para posición: ${position}`);

    // Validar posición
    const validPositions = ['GK', 'DEF', 'MID', 'FWD'];
    if (!validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        error: 'Posición inválida',
        validPositions: validPositions
      });
    }

    const result = await bargainAnalyzer.getBargainsByPosition(position, limit);

    if (result.success) {
      res.json({
        success: true,
        message: `${result.data.length} chollos encontrados para ${position}`,
        data: result.data,
        metadata: result.metadata,
        positionInfo: {
          position: position,
          description: getPositionDescription(position),
          fantasyTips: getPositionTips(position)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo chollos por posición',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo chollos por posición:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Comparar valor entre dos jugadores
router.get('/compare/:id1/:id2', async (req, res) => {
  try {
    const playerId1 = parseInt(req.params.id1);
    const playerId2 = parseInt(req.params.id2);

    console.log(`🔍 Comparando jugadores: ${playerId1} vs ${playerId2}`);

    if (!playerId1 || !playerId2) {
      return res.status(400).json({
        success: false,
        error: 'IDs de jugadores inválidos'
      });
    }

    if (playerId1 === playerId2) {
      return res.status(400).json({
        success: false,
        error: 'No puedes comparar un jugador consigo mismo'
      });
    }

    const result = await bargainAnalyzer.comparePlayerValue(playerId1, playerId2);

    if (result.success) {
      res.json({
        success: true,
        message: 'Comparación completada',
        data: result.data,
        analysis: {
          summary: `${result.data.winner === 'player1' ? result.data.player1.name : result.data.player2.name} ofrece mejor valor`,
          difference: `Diferencia de ratio: ${result.data.difference.toFixed(3)}`,
          recommendation: result.data.difference > 0.5 ?
            'Diferencia significativa - clara ventaja' :
            'Ambos jugadores tienen valor similar'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error comparando jugadores',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error comparando jugadores:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Análisis personalizado con parámetros avanzados
router.post('/analysis', async (req, res) => {
  try {
    console.log('🔍 Análisis personalizado de chollos...');

    const {
      maxPrice = 8.0,
      minGames = 3,
      minMinutes = 90,
      minValueRatio = 1.2,
      positions = ['GK', 'DEF', 'MID', 'FWD'],
      limit = 15
    } = req.body;

    console.log('📊 Parámetros personalizados:', {
      maxPrice, minGames, minMinutes, minValueRatio, positions, limit
    });

    // Actualizar configuración temporal
    const originalConfig = { ...bargainAnalyzer.config };
    bargainAnalyzer.config.MAX_PRICE = maxPrice;
    bargainAnalyzer.config.MIN_GAMES = minGames;
    bargainAnalyzer.config.MIN_MINUTES = minMinutes;
    bargainAnalyzer.config.VALUE_RATIO_MIN = minValueRatio;

    // Obtener chollos con nueva configuración
    const result = await bargainAnalyzer.identifyBargains(limit * 2);

    // Restaurar configuración original
    bargainAnalyzer.config = originalConfig;

    if (result.success) {
      // Filtrar por posiciones si se especifica
      let filteredData = result.data;
      if (positions && positions.length > 0) {
        filteredData = result.data.filter(player => positions.includes(player.position));
      }

      // Limitar resultados
      filteredData = filteredData.slice(0, limit);

      res.json({
        success: true,
        message: `Análisis personalizado completado - ${filteredData.length} chollos encontrados`,
        data: filteredData,
        metadata: {
          ...result.metadata,
          customParams: {
            maxPrice, minGames, minMinutes, minValueRatio, positions, limit
          },
          filteredCount: filteredData.length
        },
        insights: generateCustomInsights(filteredData, {
          maxPrice, minGames, minMinutes, minValueRatio
        })
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error en análisis personalizado',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error en análisis personalizado:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper: Descripción de posiciones
function getPositionDescription(position) {
  const descriptions = {
    'GK': 'Porteros - Puntos por paradas, penaltis detenidos y porterías a cero',
    'DEF': 'Defensas - Puntos por goles, asistencias y porterías a cero',
    'MID': 'Centrocampistas - Equilibrio entre creación y finalización',
    'FWD': 'Delanteros - Especializados en goles y asistencias'
  };
  return descriptions[position] || 'Posición no especificada';
}

// Helper: Tips por posición
function getPositionTips(position) {
  const tips = {
    'GK': [
      'Busca porteros de equipos defensivamente sólidos',
      'Considera rivales en próximas jornadas',
      'Los penaltis parados dan +5 puntos extra'
    ],
    'DEF': [
      'Defensas que atacan corner y libres indirectos',
      'Equipos con buena defensa = más porterías a cero',
      'Laterales suelen dar más asistencias'
    ],
    'MID': [
      'Centrocampistas box-to-box ofrecen más versatilidad',
      'Busca jugadores con llegada al área',
      'Considera rol en set pieces (corners, libres)'
    ],
    'FWD': [
      'Prioriza delanteros titulares indiscutibles',
      'Revisa rachas goleadoras recientes',
      'Extremos pueden aportar goles y asistencias'
    ]
  };
  return tips[position] || ['Analiza estadísticas recientes', 'Considera próximos rivales'];
}

// Helper: Generar insights personalizados
function generateCustomInsights(players, params) {
  const insights = [];

  if (players.length === 0) {
    insights.push('❌ No se encontraron chollos con estos parámetros');
    insights.push('💡 Intenta relajar los criterios (aumentar precio máximo o reducir ratio mínimo)');
    return insights;
  }

  const avgValueRatio = players.reduce((sum, p) => sum + p.analysis.valueRatio, 0) / players.length;
  const avgPrice = players.reduce((sum, p) => sum + p.analysis.estimatedPrice, 0) / players.length;

  insights.push(`📊 Ratio promedio de valor: ${avgValueRatio.toFixed(2)}`);
  insights.push(`💰 Precio promedio: ${avgPrice.toFixed(2)}M`);

  const positionCounts = players.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1;
    return acc;
  }, {});

  const mostCommonPosition = Object.keys(positionCounts).reduce((a, b) =>
    positionCounts[a] > positionCounts[b] ? a : b
  );

  insights.push(`🎯 Posición con más chollos: ${mostCommonPosition} (${positionCounts[mostCommonPosition]} jugadores)`);

  if (avgValueRatio > 2.0) {
    insights.push('🔥 Excelente selección de chollos - ratios muy altos');
  } else if (avgValueRatio > 1.5) {
    insights.push('⭐ Buena selección de chollos - ratios sólidos');
  } else {
    insights.push('💡 Chollos conservadores - menor riesgo, menor reward');
  }

  return insights;
}

module.exports = router;