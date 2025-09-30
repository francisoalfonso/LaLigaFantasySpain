// Analizador de Fixtures - Evalúa dificultad de próximos rivales para chollos
const ApiFootballClient = require('./apiFootball');
const logger = require('../utils/logger');

class FixtureAnalyzer {
  constructor() {
    this.apiClient = new ApiFootballClient();

    // Ratings de dificultad de equipos de La Liga (1-5, donde 5 = más difícil)
    this.teamDifficultyRatings = {
      541: 5,   // Real Madrid
      529: 5,   // Barcelona
      530: 4.5, // Atlético Madrid
      548: 4,   // Real Sociedad
      533: 4,   // Villarreal
      536: 3.5, // Sevilla
      531: 3.5, // Athletic Club
      532: 3.5, // Valencia
      546: 3,   // Getafe
      727: 3,   // Osasuna
      540: 3,   // Espanyol
      539: 2.5, // Levante
      797: 2.5, // Elche
      538: 2.5, // Celta Vigo
      542: 2,   // Alavés
      // Agregar más equipos según sea necesario
    };

    logger.info('🏆 FixtureAnalyzer inicializado - Ratings de dificultad configurados');
  }

  // Obtener próximos partidos para un equipo
  async getNextFixtures(teamId, gamesCount = 5) {
    try {
      logger.info(`🔍 Obteniendo próximos ${gamesCount} partidos para equipo ${teamId}...`);

      // Obtener fixtures futuros del equipo
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const result = await this.apiClient.getTeamFixtures(teamId, {
        from: today.toISOString().split('T')[0],
        to: nextMonth.toISOString().split('T')[0],
        season: 2025
      });

      if (!result.success || !result.data) {
        logger.info(`⚠️ No se pudieron obtener fixtures para equipo ${teamId}`);
        return [];
      }

      // Ordenar por fecha y tomar los próximos N partidos
      const upcomingFixtures = result.data
        .filter(fixture => new Date(fixture.fixture.date) > today)
        .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
        .slice(0, gamesCount);

      logger.info(`✅ ${upcomingFixtures.length} próximos fixtures obtenidos para equipo ${teamId}`);
      return upcomingFixtures;

    } catch (error) {
      logger.error(`❌ Error obteniendo fixtures para equipo ${teamId}:`, error.message);
      return [];
    }
  }

  // Calcular dificultad de un rival específico
  calculateOpponentDifficulty(opponentId, isHome = true) {
    const baseDifficulty = this.teamDifficultyRatings[opponentId] || 3.0; // Default medio

    // Ajuste por jugar en casa vs fuera (ventaja local)
    const homeAdvantage = isHome ? -0.3 : 0.3;

    return Math.max(1, Math.min(5, baseDifficulty + homeAdvantage));
  }

  // Analizar dificultad de próximos partidos para un equipo
  async analyzeFixtureDifficulty(teamId, gamesCount = 5) {
    const fixtures = await this.getNextFixtures(teamId, gamesCount);

    if (fixtures.length === 0) {
      return {
        averageDifficulty: 3.0, // Default medio
        nextGames: [],
        analysis: 'No hay datos de próximos partidos disponibles'
      };
    }

    const difficulties = [];
    const nextGames = [];

    for (const fixture of fixtures) {
      const isHome = fixture.teams.home.id === teamId;
      const opponentId = isHome ? fixture.teams.away.id : fixture.teams.home.id;
      const opponentName = isHome ? fixture.teams.away.name : fixture.teams.home.name;

      const difficulty = this.calculateOpponentDifficulty(opponentId, isHome);
      difficulties.push(difficulty);

      nextGames.push({
        date: fixture.fixture.date,
        opponent: opponentName,
        opponentId: opponentId,
        isHome: isHome,
        difficulty: difficulty,
        venue: fixture.fixture.venue?.name || 'TBD'
      });
    }

    const averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;

    // Generar análisis textual
    let analysis = '';
    if (averageDifficulty >= 4.0) {
      analysis = '🔴 Calendario MUY DIFÍCIL - Rivales complicados próximamente';
    } else if (averageDifficulty >= 3.5) {
      analysis = '🟡 Calendario DIFÍCIL - Algunos rivales complicados';
    } else if (averageDifficulty >= 2.5) {
      analysis = '🟢 Calendario FAVORABLE - Rivales asequibles';
    } else {
      analysis = '🟢 Calendario MUY FAVORABLE - Rivales débiles';
    }

    return {
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      nextGames: nextGames,
      analysis: analysis,
      gamesAnalyzed: fixtures.length
    };
  }

  // Ajustar valor de chollo basado en dificultad de fixtures
  adjustBargainValueByFixtures(baseValue, fixtureDifficulty) {
    // Calendario fácil = mayor valor (multiplica por factor > 1)
    // Calendario difícil = menor valor (multiplica por factor < 1)

    const difficultyFactor = this.getDifficultyMultiplier(fixtureDifficulty);
    const adjustedValue = baseValue * difficultyFactor;

    logger.info(`📊 Ajuste por fixtures: ${baseValue.toFixed(2)} → ${adjustedValue.toFixed(2)} (factor: ${difficultyFactor})`);

    return adjustedValue;
  }

  // Obtener multiplicador basado en dificultad
  getDifficultyMultiplier(averageDifficulty) {
    if (averageDifficulty >= 4.0) return 0.85;      // Muy difícil: -15%
    if (averageDifficulty >= 3.5) return 0.92;      // Difícil: -8%
    if (averageDifficulty >= 2.5) return 1.0;       // Normal: sin cambio
    if (averageDifficulty >= 2.0) return 1.08;      // Fácil: +8%
    return 1.15;                                     // Muy fácil: +15%
  }

  // Obtener análisis completo de fixtures para múltiples equipos
  async analyzeMultipleTeams(teamIds, gamesCount = 5) {
    const results = {};

    for (const teamId of teamIds) {
      try {
        results[teamId] = await this.analyzeFixtureDifficulty(teamId, gamesCount);

        // Rate limiting básico
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error(`❌ Error analizando fixtures para equipo ${teamId}:`, error.message);
        results[teamId] = {
          averageDifficulty: 3.0,
          nextGames: [],
          analysis: 'Error obteniendo datos de fixtures',
          gamesAnalyzed: 0
        };
      }
    }

    return results;
  }

  // Obtener rating de dificultad de un equipo específico
  getTeamDifficulty(teamId) {
    return this.teamDifficultyRatings[teamId] || 3.0; // Default medio si no está en el mapping
  }

  /**
   * Actualizar ratings de dificultad basado en forma reciente de equipos
   * Ajusta dinámicamente los ratings según:
   * - Victorias/derrotas recientes
   * - Goles anotados/encajados
   * - Racha actual (winning/losing streak)
   * @param {Object} teamPerformanceData - Datos de rendimiento por equipo ID
   * @returns {Object} Ratings actualizados
   */
  updateTeamDifficultyRatings(teamPerformanceData) {
    logger.info('📈 Actualizando ratings de dificultad basado en forma reciente...');

    if (!teamPerformanceData || typeof teamPerformanceData !== 'object') {
      logger.warn('⚠️ Datos de rendimiento inválidos, usando ratings estáticos');
      return this.teamDifficultyRatings;
    }

    const updatedRatings = { ...this.teamDifficultyRatings };
    let adjustmentsCount = 0;

    // Iterar sobre cada equipo con datos de rendimiento
    Object.entries(teamPerformanceData).forEach(([teamId, performance]) => {
      const baseRating = updatedRatings[teamId];
      if (!baseRating) {
        logger.debug(`Team ${teamId} no tiene rating base definido, ignorando`);
        return;
      }

      let adjustment = 0;

      // Factor 1: Racha de victorias/derrotas (máximo impacto: ±0.8)
      if (performance.streak) {
        if (performance.streak.type === 'win' && performance.streak.count >= 3) {
          // 3+ victorias consecutivas: aumentar dificultad
          adjustment += Math.min(0.8, performance.streak.count * 0.15);
          logger.debug(`Team ${teamId}: +${(performance.streak.count * 0.15).toFixed(2)} por ${performance.streak.count} victorias consecutivas`);
        } else if (performance.streak.type === 'loss' && performance.streak.count >= 3) {
          // 3+ derrotas consecutivas: reducir dificultad
          adjustment -= Math.min(0.8, performance.streak.count * 0.15);
          logger.debug(`Team ${teamId}: -${(performance.streak.count * 0.15).toFixed(2)} por ${performance.streak.count} derrotas consecutivas`);
        }
      }

      // Factor 2: Ratio goles anotados vs encajados últimos 5 partidos (±0.5)
      if (performance.recentGames) {
        const goalsScored = performance.recentGames.scored || 0;
        const goalsConceded = performance.recentGames.conceded || 0;
        const gamesPlayed = performance.recentGames.played || 1;

        const goalRatio = goalsScored / (goalsConceded + 1); // +1 para evitar división por 0

        if (goalRatio > 2) {
          // Excelente ataque/defensa: +0.3 a +0.5
          adjustment += 0.3 + Math.min(0.2, (goalRatio - 2) * 0.1);
        } else if (goalRatio < 0.5) {
          // Pobre ataque/defensa: -0.3 a -0.5
          adjustment -= 0.3 + Math.min(0.2, (0.5 - goalRatio) * 0.4);
        }
      }

      // Factor 3: Puntos obtenidos últimos 5 partidos (±0.4)
      if (performance.recentPoints !== undefined) {
        const avgPoints = performance.recentPoints / 5; // Promedio por partido
        if (avgPoints >= 2.5) {
          // Excelente forma: +0.4
          adjustment += 0.4;
        } else if (avgPoints <= 0.8) {
          // Mala forma: -0.4
          adjustment -= 0.4;
        } else if (avgPoints >= 2.0) {
          // Buena forma: +0.2
          adjustment += 0.2;
        } else if (avgPoints <= 1.2) {
          // Forma mediocre: -0.2
          adjustment -= 0.2;
        }
      }

      // Aplicar ajuste limitado entre -1.5 y +1.5
      adjustment = Math.max(-1.5, Math.min(1.5, adjustment));

      if (Math.abs(adjustment) > 0.1) {
        updatedRatings[teamId] = Math.max(1, Math.min(5, baseRating + adjustment));
        adjustmentsCount++;
        logger.info(
          `Team ${teamId}: Rating ${baseRating.toFixed(1)} → ${updatedRatings[teamId].toFixed(1)} (ajuste: ${adjustment > 0 ? '+' : ''}${adjustment.toFixed(2)})`
        );
      }
    });

    logger.info(`✅ ${adjustmentsCount} ratings actualizados basado en forma reciente`);
    return updatedRatings;
  }
}

module.exports = FixtureAnalyzer;