const logger = require('../utils/logger');

// Predictor de Valor Fantasy La Liga
// Sistema de predicción inteligente basado en múltiples factores

class PredictorValor {
  constructor(fixtureAnalyzer, apiFootball) {
    this.fixtureAnalyzer = fixtureAnalyzer;
    this.apiFootball = apiFootball;

    // Pesos del algoritmo de predicción
    this.weights = {
      RECENT_PERFORMANCE: 0.40,    // Rendimiento últimos 3-5 partidos
      OPPONENT_DIFFICULTY: 0.25,   // Dificultad próximo rival
      HOME_AWAY: 0.15,             // Ventaja de local/visitante
      HISTORICAL_VS_OPPONENT: 0.10, // Historial vs próximo rival
      MARKET_CONTEXT: 0.10         // Contexto del mercado (lesiones, rotaciones)
    };

    // Configuración de precios base por posición
    this.basePrices = {
      'GK': { min: 1.0, max: 6.0, avg: 2.5 },
      'DEF': { min: 1.5, max: 8.0, avg: 4.0 },
      'MID': { min: 2.0, max: 12.0, avg: 6.0 },
      'FWD': { min: 2.5, max: 15.0, avg: 7.5 }
    };

    // Cache para historiales vs rival (datos cambian poco)
    this.historicalCache = new Map();
    this.HISTORICAL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

    logger.info('🔮 PredictorValor inicializado - Sistema de predicción inteligente');
  }

  // Predecir valor de un jugador para la próxima jornada
  async predictPlayerValue(player, nextFixture = null) {
    try {
      logger.info(`🎯 Analizando predicción para ${player.name}...`);

      // 1. Análisis rendimiento reciente
      const recentPerformance = this.analyzeRecentPerformance(player);

      // 2. Análisis dificultad próximo rival
      const opponentDifficulty = await this.analyzeOpponentDifficulty(player, nextFixture);

      // 3. Factor local/visitante
      const homeAwayFactor = this.analyzeHomeAwayFactor(nextFixture);

      // 4. Historial vs próximo rival
      const historicalFactor = await this.analyzeHistoricalVsOpponent(player, nextFixture);

      // 5. Contexto de mercado
      const marketContext = this.analyzeMarketContext(player);

      // Calcular predicción final
      const prediction = this.calculateFinalPrediction(
        player,
        recentPerformance,
        opponentDifficulty,
        homeAwayFactor,
        historicalFactor,
        marketContext
      );

      return prediction;

    } catch (error) {
      logger.error(`❌ Error prediciendo valor para ${player.name}:`, error.message);
      return this.getDefaultPrediction(player);
    }
  }

  // Análisis del rendimiento reciente (últimos 3-5 partidos)
  analyzeRecentPerformance(player) {
    const stats = player.stats || {};
    const games = stats.games || 0;
    const rating = parseFloat(stats.rating) || 6.0;
    const goals = stats.goals || 0;
    const assists = stats.assists || 0;
    const minutes = stats.minutes || 0;

    // Calcular tendencia basada en estadísticas
    let performanceScore = 0;

    // Factor rating (más peso)
    if (rating >= 7.5) performanceScore += 3;
    else if (rating >= 7.0) performanceScore += 2;
    else if (rating >= 6.5) performanceScore += 1;
    else performanceScore -= 1;

    // Factor goles y asistencias
    const goalContribution = goals + assists;
    if (games > 0) {
      const avgContribution = goalContribution / games;
      if (avgContribution >= 0.8) performanceScore += 2;
      else if (avgContribution >= 0.5) performanceScore += 1;
      else if (avgContribution >= 0.3) performanceScore += 0.5;
    }

    // Factor minutos (continuidad)
    if (games > 0) {
      const avgMinutes = minutes / games;
      if (avgMinutes >= 80) performanceScore += 1;
      else if (avgMinutes >= 60) performanceScore += 0.5;
      else if (avgMinutes < 30) performanceScore -= 1;
    }

    return {
      score: Math.max(-3, Math.min(6, performanceScore)), // Normalizar entre -3 y 6
      factors: [
        `📊 Rating promedio: ${rating.toFixed(1)}`,
        `⚽ Goles + Asistencias: ${goalContribution}`,
        `⏱️ Minutos promedio: ${games > 0 ? Math.round(minutes/games) : 0}min`
      ]
    };
  }

  // Análisis dificultad del próximo rival
  async analyzeOpponentDifficulty(player, nextFixture) {
    if (!nextFixture || !this.fixtureAnalyzer) {
      return { score: 0, factors: ['ℹ️ Sin información de próximo rival'] };
    }

    try {
      // Obtener dificultad del rival usando nuestro FixtureAnalyzer
      const teamId = player.team?.id;
      if (!teamId) {
        return { score: 0, factors: ['⚠️ No se pudo determinar el equipo'] };
      }

      // Determinar equipo rival
      const isHome = nextFixture.teams?.home?.id === teamId;
      const opponent = isHome ? nextFixture.teams?.away : nextFixture.teams?.home;

      if (!opponent) {
        return { score: 0, factors: ['⚠️ No se pudo determinar el rival'] };
      }

      // Usar el rating de dificultad existente
      const difficulty = this.fixtureAnalyzer.getTeamDifficulty(opponent.id);

      // Convertir dificultad a score para predicción
      let difficultyScore = 0;
      let difficultyLabel = '';

      if (difficulty >= 4.0) {
        difficultyScore = -2; // Muy difícil
        difficultyLabel = 'Muy difícil';
      } else if (difficulty >= 3.5) {
        difficultyScore = -1; // Difícil
        difficultyLabel = 'Difícil';
      } else if (difficulty >= 2.5) {
        difficultyScore = 0; // Normal
        difficultyLabel = 'Normal';
      } else if (difficulty >= 2.0) {
        difficultyScore = 1; // Fácil
        difficultyLabel = 'Fácil';
      } else {
        difficultyScore = 2; // Muy fácil
        difficultyLabel = 'Muy fácil';
      }

      return {
        score: difficultyScore,
        factors: [
          `🎯 Rival: ${opponent.name}`,
          `📈 Dificultad: ${difficultyLabel} (${difficulty.toFixed(1)})`,
          `🏠 Localización: ${isHome ? 'Casa' : 'Visitante'}`
        ]
      };

    } catch (error) {
      logger.error('Error analizando dificultad rival:', error.message);
      return { score: 0, factors: ['❌ Error analizando rival'] };
    }
  }

  // Análisis factor local/visitante
  analyzeHomeAwayFactor(nextFixture) {
    if (!nextFixture) {
      return { score: 0, factors: ['ℹ️ Sin información de localización'] };
    }

    // Determinar si juega en casa (factor positivo) o visitante
    const isHome = true; // Simplificado por ahora
    const score = isHome ? 0.5 : -0.3;

    return {
      score,
      factors: [
        `🏠 ${isHome ? 'Juega en casa (+)' : 'Juega visitante (-)'}`
      ]
    };
  }


  // Análisis historial vs próximo rival (con cache optimizado)
  async analyzeHistoricalVsOpponent(player, nextFixture) {
    if (!nextFixture || !this.apiFootball) {
      return {
        score: 0,
        factors: ['📚 Sin información de próximo rival']
      };
    }

    try {
      // Determinar equipo rival
      const playerTeamId = player.team?.id;
      if (!playerTeamId) {
        return {
          score: 0,
          factors: ['📚 No se pudo determinar equipo del jugador']
        };
      }

      const isHome = nextFixture.teams?.home?.id === playerTeamId;
      const opponent = isHome ? nextFixture.teams?.away : nextFixture.teams?.home;

      if (!opponent) {
        return {
          score: 0,
          factors: ['📚 No se pudo determinar rival']
        };
      }

      // Verificar cache primero (datos históricos cambian poco)
      const cacheKey = `historical_${player.id}_vs_${opponent.id}`;
      const cached = this.historicalCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.HISTORICAL_CACHE_TTL) {
        logger.info(`⚡ Cache HIT: Historial ${player.name} vs ${opponent.name}`);
        return cached.data;
      }

      logger.info(`📚 Analizando historial de ${player.name} vs ${opponent.name}...`);

      // OPTIMIZACIÓN: Solo buscar 1-2 temporadas más recientes para acelerar
      const historyResult = await this.apiFootball.getPlayerVsTeamHistory(
        player.id,
        opponent.id,
        [2024, this.apiFootball.LEAGUES.CURRENT_SEASON], // Reducido a 2 temporadas
        5 // Reducido a máximo 5 partidos
      );

      if (!historyResult.success || historyResult.totalGames === 0) {
        const result = {
          score: 0,
          factors: [`📚 Historial vs ${opponent.name}: Sin enfrentamientos previos`]
        };

        // Cache resultado negativo también
        this.historicalCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      // Analizar los datos del historial
      const matches = historyResult.data;
      const analysisData = this.calculateHistoricalAnalysis(matches, opponent.name);

      // Convertir análisis a score numérico para predicción
      const score = this.convertHistoricalToScore(analysisData);

      // Generar factores informativos
      const factors = this.generateHistoricalFactors(analysisData, opponent.name);

      const result = {
        score: score,
        factors: factors
      };

      // Guardar en cache
      this.historicalCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      logger.error(`Error analizando historial vs rival:`, error.message);
      return {
        score: 0,
        factors: ['📚 Error obteniendo historial vs rival']
      };
    }
  }

  // Análisis contexto de mercado
  analyzeMarketContext(player) {
    const position = player.position;
    const age = player.age || 25;

    let contextScore = 0;
    const factors = [];

    // Factor edad
    if (age <= 23) {
      contextScore += 0.3;
      factors.push('🌟 Jugador joven (+)');
    } else if (age >= 33) {
      contextScore -= 0.2;
      factors.push('👴 Jugador veterano (-)');
    }

    // Factor posición (delanteros más volátiles)
    if (position === 'FWD') {
      contextScore += 0.2;
      factors.push('⚽ Delantero: mayor potencial (+)');
    } else if (position === 'GK') {
      contextScore -= 0.1;
      factors.push('🥅 Portero: menor volatilidad (-)');
    }

    return {
      score: contextScore,
      factors
    };
  }

  // Calcular predicción final combinando todos los factores
  calculateFinalPrediction(player, recent, opponent, homeAway, historical, market) {
    const currentPrice = player.analysis?.estimatedPrice || this.getEstimatedPrice(player);

    // Calcular score ponderado
    const totalScore =
      (recent.score * this.weights.RECENT_PERFORMANCE) +
      (opponent.score * this.weights.OPPONENT_DIFFICULTY) +
      (homeAway.score * this.weights.HOME_AWAY) +
      (historical.score * this.weights.HISTORICAL_VS_OPPONENT) +
      (market.score * this.weights.MARKET_CONTEXT);

    // Convertir score a cambio de precio
    const priceChange = this.scoreToPriceChange(totalScore, currentPrice);
    const predictedPrice = Math.max(0.5, currentPrice + priceChange);

    // Calcular confianza basada en disponibilidad de datos
    const confidence = this.calculateConfidence(recent, opponent, homeAway, historical, market);

    // Determinar recomendación
    const recommendation = this.getRecommendation(priceChange, confidence);

    // Reunir todos los factores
    const allFactors = [
      ...recent.factors,
      ...opponent.factors,
      ...homeAway.factors,
      ...historical.factors,
      ...market.factors
    ];

    return {
      playerId: player.id,
      playerName: player.name,
      currentPrice: currentPrice,
      predictedPrice: Math.round(predictedPrice * 10) / 10,
      priceChange: Math.round(priceChange * 10) / 10,
      changePercentage: Math.round((priceChange / currentPrice) * 100),
      confidence: confidence,
      trend: priceChange > 0.1 ? 'rising' : priceChange < -0.1 ? 'falling' : 'stable',
      recommendation: recommendation,
      factors: allFactors,
      scores: {
        recent: recent.score,
        opponent: opponent.score,
        homeAway: homeAway.score,
        historical: historical.score,
        market: market.score,
        total: Math.round(totalScore * 100) / 100
      },
      generatedAt: new Date().toISOString()
    };
  }

  // Convertir score a cambio de precio
  scoreToPriceChange(score, currentPrice) {
    // Score típico va de -3 a +6, convertir a cambio de precio
    const maxChange = currentPrice * 0.25; // Máximo 25% de cambio
    const normalizedScore = Math.max(-3, Math.min(6, score));

    // Función no lineal para cambios más realistas
    const changeRatio = Math.tanh(normalizedScore / 3) * 0.15; // Máximo ±15%

    return currentPrice * changeRatio;
  }

  // Calcular nivel de confianza
  calculateConfidence(recent, opponent, homeAway, historical, market) {
    let confidence = 50; // Base 50%

    // Añadir confianza basada en datos disponibles
    if (recent.factors.length > 1) confidence += 15;
    if (opponent.factors.length > 1) confidence += 15;
    if (homeAway.factors.length > 0) confidence += 10;
    if (historical.factors.length > 0) confidence += 5;
    if (market.factors.length > 0) confidence += 5;

    return Math.min(95, Math.max(20, confidence));
  }

  // Obtener recomendación de trading
  getRecommendation(priceChange, confidence) {
    const absChange = Math.abs(priceChange);

    if (confidence < 60) {
      return {
        action: 'HOLD',
        reason: 'Confianza insuficiente para recomendar cambios',
        urgency: 'low'
      };
    }

    if (priceChange > 0.3) {
      return {
        action: 'BUY',
        reason: `Subida probable +${priceChange.toFixed(1)}M`,
        urgency: absChange > 0.5 ? 'high' : 'medium'
      };
    } else if (priceChange < -0.3) {
      return {
        action: 'SELL',
        reason: `Bajada probable ${priceChange.toFixed(1)}M`,
        urgency: absChange > 0.5 ? 'high' : 'medium'
      };
    } else {
      return {
        action: 'HOLD',
        reason: 'Precio estable esperado',
        urgency: 'low'
      };
    }
  }

  // Obtener precio estimado si no está disponible
  getEstimatedPrice(player) {
    const position = player.position || 'MID';
    const basePrice = this.basePrices[position]?.avg || 5.0;

    // Ajustar basado en rating si está disponible
    const rating = parseFloat(player.stats?.rating) || 6.5;
    const ratingMultiplier = Math.max(0.5, Math.min(2.0, rating / 6.5));

    return Math.round(basePrice * ratingMultiplier * 10) / 10;
  }

  // Predicción por defecto en caso de error
  getDefaultPrediction(player) {
    const currentPrice = this.getEstimatedPrice(player);

    return {
      playerId: player.id,
      playerName: player.name,
      currentPrice: currentPrice,
      predictedPrice: currentPrice,
      priceChange: 0,
      changePercentage: 0,
      confidence: 20,
      trend: 'stable',
      recommendation: {
        action: 'HOLD',
        reason: 'Datos insuficientes para predicción',
        urgency: 'low'
      },
      factors: ['⚠️ Predicción limitada por falta de datos'],
      scores: { total: 0 },
      generatedAt: new Date().toISOString()
    };
  }

  // Predecir valores para lista de jugadores
  async predictMultiplePlayers(players, nextFixtures = {}) {
    logger.info(`🔮 Iniciando predicción para ${players.length} jugadores...`);

    const predictions = [];

    for (const player of players) {
      try {
        const nextFixture = nextFixtures[player.team?.id] || null;
        const prediction = await this.predictPlayerValue(player, nextFixture);
        predictions.push(prediction);

        // Rate limiting para no saturar
        await this.sleep(100);

      } catch (error) {
        logger.error(`Error prediciendo ${player.name}:`, error.message);
        predictions.push(this.getDefaultPrediction(player));
      }
    }

    logger.info(`✅ Predicciones completadas: ${predictions.length} jugadores`);
    return predictions;
  }

  // === MÉTODOS AUXILIARES PARA ANÁLISIS HISTÓRICO ===

  // Calcular análisis estadístico del historial vs rival
  calculateHistoricalAnalysis(matches, opponentName) {
    const validMatches = matches.filter(match => match.playerStats);

    if (validMatches.length === 0) {
      return {
        totalGames: matches.length,
        validGames: 0,
        averageRating: 0,
        totalGoals: 0,
        totalAssists: 0,
        averageMinutes: 0,
        wins: 0,
        draws: 0,
        losses: 0
      };
    }

    // Calcular estadísticas acumuladas
    let totalRating = 0;
    let totalGoals = 0;
    let totalAssists = 0;
    let totalMinutes = 0;
    let ratingCount = 0;
    let wins = 0, draws = 0, losses = 0;

    for (const match of validMatches) {
      const stats = match.playerStats;
      const outcome = match.result?.outcome;

      // Rating (solo si existe y es válido)
      if (stats.rating && stats.rating > 0) {
        totalRating += parseFloat(stats.rating);
        ratingCount++;
      }

      // Goles y asistencias
      totalGoals += stats.goals?.total || 0;
      totalAssists += stats.assists?.total || 0;

      // Minutos
      totalMinutes += stats.minutes || 0;

      // Resultados del equipo
      if (outcome === 'win') wins++;
      else if (outcome === 'draw') draws++;
      else if (outcome === 'loss') losses++;
    }

    return {
      totalGames: matches.length,
      validGames: validMatches.length,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      totalGoals: totalGoals,
      totalAssists: totalAssists,
      averageMinutes: validMatches.length > 0 ? totalMinutes / validMatches.length : 0,
      wins: wins,
      draws: draws,
      losses: losses,
      winRate: validMatches.length > 0 ? wins / validMatches.length : 0,
      goalsPerGame: validMatches.length > 0 ? totalGoals / validMatches.length : 0,
      assistsPerGame: validMatches.length > 0 ? totalAssists / validMatches.length : 0
    };
  }

  // Convertir análisis histórico a score numérico
  convertHistoricalToScore(analysis) {
    if (analysis.validGames === 0) return 0;

    let score = 0;

    // Factor rating promedio vs rival
    if (analysis.averageRating > 0) {
      if (analysis.averageRating >= 8.0) score += 2;
      else if (analysis.averageRating >= 7.5) score += 1.5;
      else if (analysis.averageRating >= 7.0) score += 1;
      else if (analysis.averageRating >= 6.5) score += 0.5;
      else if (analysis.averageRating < 6.0) score -= 0.5;
    }

    // Factor productividad vs rival
    const productivity = analysis.goalsPerGame + analysis.assistsPerGame;
    if (productivity >= 1.0) score += 1.5;
    else if (productivity >= 0.5) score += 1;
    else if (productivity >= 0.3) score += 0.5;

    // Factor resultado del equipo vs rival
    if (analysis.winRate >= 0.7) score += 0.5;
    else if (analysis.winRate <= 0.3) score -= 0.5;

    // Factor continuidad (minutos jugados)
    if (analysis.averageMinutes >= 80) score += 0.5;
    else if (analysis.averageMinutes < 45) score -= 0.5;

    // Bonus por muestra significativa
    if (analysis.validGames >= 3) score += 0.3;

    return Math.max(-2, Math.min(3, score)); // Normalizar entre -2 y +3
  }

  // Generar factores informativos del historial
  generateHistoricalFactors(analysis, opponentName) {
    const factors = [];

    if (analysis.validGames === 0) {
      factors.push(`📚 Historial vs ${opponentName}: Sin datos de rendimiento`);
      return factors;
    }

    // Información básica de enfrentamientos
    const gamesSummary = analysis.validGames === 1 ?
      '1 partido' :
      `${analysis.validGames} partidos`;

    factors.push(`📚 Historial vs ${opponentName}:`);

    // Estadísticas ofensivas
    if (analysis.totalGoals > 0 || analysis.totalAssists > 0) {
      factors.push(`   • Últimos ${gamesSummary}: ${analysis.totalGoals} goles, ${analysis.totalAssists} asistencias`);
    } else {
      factors.push(`   • Últimos ${gamesSummary}: Sin goles ni asistencias`);
    }

    // Rating comparativo si está disponible
    if (analysis.averageRating > 0) {
      const ratingText = analysis.averageRating.toFixed(1);
      factors.push(`   • Rating promedio: ${ratingText} vs rival`);
    }

    // Análisis de tendencia
    const tendency = this.getHistoricalTendency(analysis);
    factors.push(`   • Análisis: ${tendency}`);

    return factors;
  }

  // Determinar tendencia histórica vs rival
  getHistoricalTendency(analysis) {
    if (analysis.validGames === 0) return 'Sin datos suficientes';

    const productivity = analysis.goalsPerGame + analysis.assistsPerGame;
    const rating = analysis.averageRating;

    // Casos especiales
    if (analysis.validGames === 1) {
      if (productivity >= 1.0 || rating >= 8.0) return 'Buen debut contra este rival';
      else if (productivity === 0 && rating < 6.5) return 'Debut complicado vs rival';
      else return 'Primer enfrentamiento registrado';
    }

    // Múltiples partidos
    if (productivity >= 0.8 && rating >= 7.5) return 'Rival fetiche - suele destacar';
    else if (productivity >= 0.5 && rating >= 7.0) return 'Buen rendimiento histórico';
    else if (productivity >= 0.3 || rating >= 6.5) return 'Rendimiento estándar vs rival';
    else if (productivity <= 0.1 && rating <= 6.0) return 'Rival complicado - historial difícil';
    else return 'Rendimiento variable vs rival';
  }

  // Limpiar cache de historiales (útil para mantenimiento)
  clearHistoricalCache() {
    const size = this.historicalCache.size;
    this.historicalCache.clear();
    logger.info(`🗑️ Cache histórico limpiado: ${size} entradas eliminadas`);
  }

  // Estadísticas del cache
  getCacheStats() {
    return {
      historicalCacheSize: this.historicalCache.size,
      cacheTTL: this.HISTORICAL_CACHE_TTL / (60 * 60 * 1000) + ' horas'
    };
  }

  // Utilidad para pausas
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PredictorValor;