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

    console.log('🔮 PredictorValor inicializado - Sistema de predicción inteligente');
  }

  // Predecir valor de un jugador para la próxima jornada
  async predictPlayerValue(player, nextFixture = null) {
    try {
      console.log(`🎯 Analizando predicción para ${player.name}...`);

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
      console.error(`❌ Error prediciendo valor para ${player.name}:`, error.message);
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
      console.error('Error analizando dificultad rival:', error.message);
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

  // Análisis historial vs próximo rival
  async analyzeHistoricalVsOpponent(player, nextFixture) {
    // Por ahora simplificado - en futuras versiones consultar historial
    return {
      score: 0,
      factors: ['📚 Historial vs rival: Análisis básico']
    };
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
    console.log(`🔮 Iniciando predicción para ${players.length} jugadores...`);

    const predictions = [];

    for (const player of players) {
      try {
        const nextFixture = nextFixtures[player.team?.id] || null;
        const prediction = await this.predictPlayerValue(player, nextFixture);
        predictions.push(prediction);

        // Rate limiting para no saturar
        await this.sleep(100);

      } catch (error) {
        console.error(`Error prediciendo ${player.name}:`, error.message);
        predictions.push(this.getDefaultPrediction(player));
      }
    }

    console.log(`✅ Predicciones completadas: ${predictions.length} jugadores`);
    return predictions;
  }

  // Utilidad para pausas
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PredictorValor;