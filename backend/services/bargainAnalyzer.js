/**
 * @fileoverview Analizador de Chollos Fantasy - Sistema predictivo de valor
 * @module services/bargainAnalyzer
 * @description Motor de análisis avanzado que identifica jugadores infravalorados
 * con alta probabilidad de obtener puntos Fantasy. Utiliza:
 * - Análisis de rendimiento histórico
 * - Evaluación de forma actual (últimos 5 partidos)
 * - Dificultad de próximos rivales
 * - Ratio puntos/precio optimizado
 * - Sistema de caché inteligente
 */

const ApiFootballClient = require('./apiFootball');
const logger = require('../utils/logger');
const FantasyDataProcessor = require('./dataProcessor');
const BargainCache = require('./bargainCache');
const FixtureAnalyzer = require('./fixtureAnalyzer');
const { THRESHOLDS } = require('../config/constants');

/**
 * Clase principal del sistema de análisis de chollos
 * @class BargainAnalyzer
 * @description Implementa algoritmos de análisis de valor para Fantasy La Liga
 */
class BargainAnalyzer {
  /**
   * Constructor del analizador de chollos
   * Inicializa clientes API, procesadores de datos y configuración
   */
  constructor() {
    this.apiClient = new ApiFootballClient();
    this.dataProcessor = new FantasyDataProcessor();
    this.cache = new BargainCache();
    this.fixtureAnalyzer = new FixtureAnalyzer();

    // Configuración para análisis de chollos
    this.config = {
      MAX_PRICE: 10.0,         // Precio máximo para considerar "chollo"
      MIN_GAMES: 2,            // Mínimo de partidos jugados
      MIN_MINUTES: 60,         // Mínimos minutos totales
      FORM_GAMES: 5,           // Partidos para calcular forma actual
      HIGH_SCORE_THRESHOLD: 8, // Puntuación alta para un partido
      VALUE_RATIO_MIN: 0.8     // Ratio mínimo puntos/precio
    };
  }

  // Obtener todos los jugadores de La Liga con sus estadísticas
  async getAllPlayersWithStats() {
    logger.info('🔄 Obteniendo TODOS los jugadores de La Liga (base completa)...');

    const allPlayers = [];
    let page = 1;
    let hasMorePages = true;
    let totalAvailable = 0;

    try {
      while (hasMorePages && page <= 50) { // Límite de seguridad ampliado para toda La Liga
        const result = await this.apiClient.getLaLigaPlayers(page);

        if (result.success && result.data.length > 0) {
          allPlayers.push(...result.data);

          // Capturar total disponible de la primera página
          if (page === 1 && result.pagination) {
            totalAvailable = result.pagination.total * 20; // Aproximado
            logger.info(`📊 Base de datos: ~${totalAvailable} jugadores disponibles en ${result.pagination.total} páginas`);
          }

          logger.info(`📄 Página ${page}/${result.pagination?.total || '?'}: ${result.data.length} jugadores obtenidos`);

          // Verificar si hay más páginas
          hasMorePages = result.pagination && page < result.pagination.total;
          page++;
        } else {
          hasMorePages = false;
        }
      }

      logger.info(`✅ ANÁLISIS EXPANDIDO: ${allPlayers.length} jugadores obtenidos de La Liga 25-26`);
      logger.info(`📈 Mejora: ${allPlayers.length > 200 ? '+' + (allPlayers.length - 200) : '0'} jugadores adicionales vs anterior`);

      return allPlayers;

    } catch (error) {
      logger.error('❌ Error obteniendo jugadores:', error.message);
      throw error;
    }
  }

  // Calcular ratio de valor de un jugador
  calculateValueRatio(player) {
    const stats = player.stats;
    if (!stats || !stats.games) return 0;

    // Puntos Fantasy estimados basados en estadísticas actuales
    const estimatedPoints = this.estimateFantasyPoints(player);

    // Precio simulado basado en estadísticas (en Fantasy real vendría de la API)
    const estimatedPrice = this.estimatePlayerPrice(player);

    // Ratio puntos por precio
    const valueRatio = estimatedPrice > 0 ? estimatedPoints / estimatedPrice : 0;

    return {
      estimatedPoints,
      estimatedPrice,
      valueRatio
    };
  }

  // Calcular ratio de valor mejorado que incluye análisis de fixtures
  async calculateEnhancedValueRatio(player, fixtureData = null) {
    const basicValue = this.calculateValueRatio(player);

    // Si no hay datos de fixtures, usar valor básico
    if (!fixtureData || !player.team) {
      return {
        ...basicValue,
        fixtureAdjusted: false,
        fixtureDifficulty: null,
        fixtureAnalysis: 'Análisis de fixtures no disponible'
      };
    }

    // Ajustar valor basado en dificultad de próximos partidos
    const adjustedPoints = this.fixtureAnalyzer.adjustBargainValueByFixtures(
      basicValue.estimatedPoints,
      fixtureData.averageDifficulty
    );

    const adjustedValueRatio = basicValue.estimatedPrice > 0 ?
      adjustedPoints / basicValue.estimatedPrice : 0;

    return {
      estimatedPoints: adjustedPoints,
      estimatedPrice: basicValue.estimatedPrice,
      valueRatio: adjustedValueRatio,
      fixtureAdjusted: true,
      fixtureDifficulty: fixtureData.averageDifficulty,
      fixtureAnalysis: fixtureData.analysis,
      nextGames: fixtureData.nextGames?.slice(0, 3) || [] // Solo próximos 3 partidos
    };
  }

  // Estimar puntos Fantasy basados en estadísticas de temporada
  estimateFantasyPoints(player) {
    const stats = player.stats;
    if (!stats || !stats.games) return 0;

    const gamesPlayed = stats.games.appearences || 0;
    if (gamesPlayed === 0) return 0;

    // Calcular puntos promedio por partido
    let avgPoints = 0;

    // Puntos base por jugar
    avgPoints += 2; // Asumiendo que juega

    // Puntos por goles (según posición)
    const goals = stats.goals?.total || 0;
    const position = this.getPositionFromPlayerData(player);
    const goalMultiplier = this.getGoalMultiplier(position);
    avgPoints += (goals / gamesPlayed) * goalMultiplier;

    // Puntos por asistencias
    const assists = stats.goals?.assists || 0;
    avgPoints += (assists / gamesPlayed) * 3;

    // Penalizaciones por tarjetas
    const yellowCards = stats.cards?.yellow || 0;
    const redCards = stats.cards?.red || 0;
    avgPoints -= (yellowCards / gamesPlayed) * 1;
    avgPoints -= (redCards / gamesPlayed) * 3;

    // Bonus para porteros y defensas por porterías a cero
    if (position === 'GK' || position === 'DEF') {
      const cleanSheets = this.estimateCleanSheets(player);
      avgPoints += (cleanSheets / gamesPlayed) * 4;
    }

    return Math.max(0, avgPoints);
  }

  // Estimar precio del jugador basado en rendimiento
  estimatePlayerPrice(player) {
    const stats = player.stats;
    if (!stats) return 5.0; // Precio base

    const goals = stats.goals?.total || 0;
    const assists = stats.goals?.assists || 0;
    const games = stats.games?.appearences || 1;
    const minutes = stats.games?.minutes || 0;
    const rating = parseFloat(stats.games?.rating) || 6.0;

    // Fórmula simplificada para estimar precio
    let price = 3.0; // Precio base

    // Bonus por goles y asistencias
    price += (goals + assists) * 0.3;

    // Bonus por rating alto
    if (rating > 7.0) price += (rating - 7.0) * 2;

    // Bonus por minutos jugados (titular vs suplente)
    const minutesPerGame = minutes / games;
    if (minutesPerGame > 70) price += 1.0;

    // Ajuste por edad (jugadores jóvenes más caros)
    const age = player.age || 25;
    if (age < 23) price += 0.5;
    if (age > 30) price -= 0.3;

    return Math.min(15.0, Math.max(1.0, price)); // Entre 1.0 y 15.0
  }

  // Obtener multiplicador de goles según posición
  getGoalMultiplier(position) {
    const multipliers = {
      'GK': 10,
      'DEF': 6,
      'MID': 5,
      'FWD': 4
    };
    return multipliers[position] || 4;
  }

  // Determinar posición del jugador
  getPositionFromPlayerData(player) {
    const position = player.position || '';

    if (position.includes('Goalkeeper')) return 'GK';
    if (position.includes('Defender') || position.includes('Centre-Back') || position.includes('Left-Back') || position.includes('Right-Back')) return 'DEF';
    if (position.includes('Midfielder') || position.includes('Attacking Midfield') || position.includes('Defensive Midfield')) return 'MID';
    if (position.includes('Attacker') || position.includes('Centre-Forward') || position.includes('Left Winger') || position.includes('Right Winger')) return 'FWD';

    // Fallback basado en estadísticas
    const stats = player.stats;
    if (stats && stats.goals && stats.goals.total > 5) return 'FWD';

    return 'MID'; // Default
  }

  // Estimar porterías a cero (simplificado)
  estimateCleanSheets(player) {
    if (!player.team) return 0;

    // Estimación basada en la calidad defensiva del equipo
    // En implementación real, esto vendría de estadísticas del equipo
    const teamId = player.team.id;
    const defensiveQuality = this.getTeamDefensiveQuality(teamId);

    const games = player.stats?.games?.appearences || 0;
    return Math.floor(games * defensiveQuality);
  }

  // Calidad defensiva estimada por equipo
  getTeamDefensiveQuality(teamId) {
    // Estimaciones basadas en rendimiento histórico
    const defensiveRatings = {
      541: 0.45, // Real Madrid
      529: 0.40, // Barcelona
      530: 0.35, // Atlético Madrid
      548: 0.30, // Real Sociedad
      533: 0.25, // Villarreal
    };

    return defensiveRatings[teamId] || 0.20; // 20% por defecto
  }

  // Identificar chollos de la jornada
  async identifyBargains(limit = 10, options = {}) {
    logger.info('🔍 Analizando chollos de la jornada...');

    // Generar clave de caché basada en parámetros
    const cacheKey = this.cache.generateCacheKey({ limit, ...options });

    // Intentar obtener del caché primero
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      logger.info(`⚡ Devolviendo resultado desde caché (${cachedResult.data.length} chollos)`);
      return cachedResult;
    }

    try {
      // Obtener todos los jugadores
      const allPlayers = await this.getAllPlayersWithStats();

      // Filtrar jugadores elegibles
      const eligiblePlayers = allPlayers.filter(player => {
        const stats = player.stats;
        if (!stats || !stats.games) return false;

        const games = stats.games.appearences || 0;
        const minutes = stats.games.minutes || 0;

        return games >= this.config.MIN_GAMES && minutes >= this.config.MIN_MINUTES;
      });

      logger.info(`✅ Jugadores elegibles: ${eligiblePlayers.length}`);

      // Calcular valor para cada jugador
      const playersWithValue = eligiblePlayers.map(player => {
        const valueData = this.calculateValueRatio(player);
        const position = this.getPositionFromPlayerData(player);

        return {
          ...player,
          position,
          estimatedPoints: valueData.estimatedPoints,
          estimatedPrice: valueData.estimatedPrice,
          valueRatio: valueData.valueRatio,
          isEligibleBargain: valueData.estimatedPrice <= this.config.MAX_PRICE &&
                            valueData.valueRatio >= this.config.VALUE_RATIO_MIN
        };
      });

      // Filtrar duplicados por ID y elegibilidad, luego ordenar chollos
      const uniquePlayers = {};
      playersWithValue.forEach(player => {
        if (player.isEligibleBargain) {
          // Si ya existe este ID, mantener el que tenga datos más actuales (más partidos en temporada actual)
          if (!uniquePlayers[player.id]) {
            uniquePlayers[player.id] = player;
          } else {
            const existing = uniquePlayers[player.id];
            const currentGames = player.stats?.games?.appearences || 0;
            const existingGames = existing.stats?.games?.appearences || 0;
            const currentMinutes = player.stats?.games?.minutes || 0;
            const existingMinutes = existing.stats?.games?.minutes || 0;

            // Priorizar: 1) Más partidos jugados, 2) Más minutos, 3) Mejor ratio de valor
            if (currentGames > existingGames ||
                (currentGames === existingGames && currentMinutes > existingMinutes) ||
                (currentGames === existingGames && currentMinutes === existingMinutes && player.valueRatio > existing.valueRatio)) {
              uniquePlayers[player.id] = player;
              logger.info(`🔄 Duplicado resuelto: ${player.name} - Manteniendo ${player.team?.name} (${currentGames} partidos, ${currentMinutes} min) sobre ${existing.team?.name} (${existingGames} partidos, ${existingMinutes} min)`);
            }
          }
        }
      });

      const bargains = Object.values(uniquePlayers)
        .sort((a, b) => b.valueRatio - a.valueRatio)
        .slice(0, limit);

      logger.info(`🎯 Chollos identificados: ${bargains.length}`);

      return {
        success: true,
        data: bargains.map(player => ({
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          age: player.age,
          nationality: player.nationality,
          photo: player.photo,
          stats: {
            games: player.stats.games?.appearences || 0,
            minutes: player.stats.games?.minutes || 0,
            goals: player.stats.goals?.total || 0,
            assists: player.stats.goals?.assists || 0,
            rating: player.stats.games?.rating || 'N/A'
          },
          analysis: {
            estimatedPrice: Math.round(player.estimatedPrice * 100) / 100,
            estimatedPoints: Math.round(player.estimatedPoints * 100) / 100,
            valueRatio: Math.round(player.valueRatio * 100) / 100,
            recommendation: this.generateRecommendation(player)
          }
        })),
        metadata: {
          totalAnalyzed: allPlayers.length,
          eligible: eligiblePlayers.length,
          bargainsFound: bargains.length,
          analysisDate: new Date().toISOString(),
          criteria: {
            maxPrice: this.config.MAX_PRICE,
            minGames: this.config.MIN_GAMES,
            minMinutes: this.config.MIN_MINUTES,
            minValueRatio: this.config.VALUE_RATIO_MIN
          }
        }
      };

      // Guardar resultado en caché antes de devolverlo
      this.cache.set(cacheKey, result);
      logger.info(`💾 Resultado guardado en caché: ${bargains.length} chollos`);

      return result;

    } catch (error) {
      logger.error('❌ Error analizando chollos:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Generar recomendación personalizada
  generateRecommendation(player) {
    const rating = parseFloat(player.stats.games?.rating) || 6.0;
    const valueRatio = player.valueRatio;
    const position = player.position;

    let recommendation = '';

    if (valueRatio > 2.0) {
      recommendation = `🔥 EXCELENTE CHOLLO - ${player.name} ofrece gran valor por su precio. `;
    } else if (valueRatio > 1.5) {
      recommendation = `⭐ BUEN CHOLLO - ${player.name} es una opción sólida para tu presupuesto. `;
    } else {
      recommendation = `💡 CHOLLO INTERESANTE - ${player.name} podría dar sorpresas. `;
    }

    if (rating > 7.0) {
      recommendation += `Su rating de ${rating} indica gran forma actual.`;
    } else if (rating > 6.5) {
      recommendation += `Rendimiento consistente con rating de ${rating}.`;
    } else {
      recommendation += `Opción de riesgo pero con potencial upside.`;
    }

    return recommendation;
  }

  // Obtener chollos por posición
  async getBargainsByPosition(position, limit = 5) {
    const allBargains = await this.identifyBargains(50);

    if (!allBargains.success) return allBargains;

    const positionBargains = allBargains.data
      .filter(player => player.position === position)
      .slice(0, limit);

    return {
      success: true,
      data: positionBargains,
      metadata: {
        ...allBargains.metadata,
        filteredPosition: position,
        positionBargainsFound: positionBargains.length
      }
    };
  }

  // Comparar jugadores similares
  async comparePlayerValue(playerId1, playerId2) {
    try {
      const player1Data = await this.apiClient.getPlayerStats(playerId1);
      const player2Data = await this.apiClient.getPlayerStats(playerId2);

      if (!player1Data.success || !player2Data.success) {
        return {
          success: false,
          error: 'No se pudieron obtener datos de uno o ambos jugadores'
        };
      }

      // Simular datos completos para comparación
      const player1 = {
        id: playerId1,
        name: player1Data.data.player.name,
        age: player1Data.data.player.age,
        stats: player1Data.data,
        team: player1Data.data.team
      };

      const player2 = {
        id: playerId2,
        name: player2Data.data.player.name,
        age: player2Data.data.player.age,
        stats: player2Data.data,
        team: player2Data.data.team
      };

      const value1 = this.calculateValueRatio(player1);
      const value2 = this.calculateValueRatio(player2);

      return {
        success: true,
        data: {
          player1: {
            name: player1.name,
            team: player1.team.name,
            value: value1,
            recommendation: this.generateRecommendation({...player1, valueRatio: value1.valueRatio})
          },
          player2: {
            name: player2.name,
            team: player2.team.name,
            value: value2,
            recommendation: this.generateRecommendation({...player2, valueRatio: value2.valueRatio})
          },
          winner: value1.valueRatio > value2.valueRatio ? 'player1' : 'player2',
          difference: Math.abs(value1.valueRatio - value2.valueRatio)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BargainAnalyzer;