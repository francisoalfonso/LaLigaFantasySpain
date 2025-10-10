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
    // ✅ CORREGIDO: Criterios más estrictos para evitar falsos positivos
    this.config = {
      MAX_PRICE: 8.0,          // ← REDUCIDO de 10.0 (chollos verdaderos son <8€)
      MIN_GAMES: 3,            // ← AUMENTADO de 2 (mínimo 3 partidos para validez estadística)
      MIN_MINUTES: 90,         // ← AUMENTADO de 60 (al menos 1 partido completo jugado)
      FORM_GAMES: 5,           // Partidos para calcular forma actual
      HIGH_SCORE_THRESHOLD: 8, // Puntuación alta para un partido
      VALUE_RATIO_MIN: 1.2     // ← AUMENTADO de 0.8 (chollo real debe tener +20% valor mínimo)
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

  // Calcular ratio de valor de un jugador (async por Fase 1.3)
  async calculateValueRatio(player) {
    const stats = player.stats;
    if (!stats || !stats.games) return 0;

    // Puntos Fantasy estimados basados en estadísticas actuales (ahora async)
    const estimatedPoints = await this.estimateFantasyPoints(player);

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
    const basicValue = await this.calculateValueRatio(player);

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

  // ============================================
  // FASE 1.1 + 1.3: ESTIMACIÓN DE PUNTOS V2.0
  // Sistema DAZN Points completo con stats reales de partidos
  // ============================================
  async estimateFantasyPoints(player) {
    const stats = player.stats;
    if (!stats || !stats.games) return 0;

    const gamesPlayed = stats.games.appearences || 0;
    if (gamesPlayed === 0) return 0;

    const position = this.getPositionFromPlayerData(player);

    // ============================================
    // FASE 1.3: OBTENER STATS REALES DE PARTIDOS
    // ============================================
    let recentStats = null;
    let formMultiplier = 1.0;
    let avgPoints = 0;

    // Intentar obtener stats de últimos 5 partidos (datos DAZN reales)
    if (player.id) {
      const recentMatches = await this.apiClient.getPlayerRecentMatches(player.id, 5);

      if (recentMatches.success && recentMatches.stats) {
        recentStats = recentMatches.stats;
        const matchesPlayed = recentStats.matches;

        logger.info(`[BargainAnalyzer] ${player.name}: Usando stats reales de ${matchesPlayed} partidos recientes`);

        // Calcular forma reciente basada en ratings
        if (recentStats.avgRating > 0) {
          formMultiplier = this._calculateFormMultiplier(recentStats.avgRating);
          logger.debug(`[BargainAnalyzer] ${player.name}: Form multiplier ${formMultiplier.toFixed(2)}x (rating ${recentStats.avgRating})`);
        }
      } else {
        logger.warn(`[BargainAnalyzer] ${player.name}: No hay stats recientes, usando agregadas de temporada`);
      }
    }

    // ============================================
    // 1. BASE POINTS (minutos jugados)
    // ============================================
    const totalMinutes = stats.games.minutes || 0;
    const minutesPerGame = totalMinutes / gamesPlayed;

    if (minutesPerGame >= 60) {
      avgPoints += 2;  // Titular (juega >60 min/partido)
    } else if (minutesPerGame >= 30) {
      avgPoints += 1;  // Suplente con minutos significativos
    } else {
      avgPoints += 0.5;  // Suplente marginal
    }

    logger.debug(`[BargainAnalyzer] ${player.name}: ${minutesPerGame.toFixed(0)} min/partido → Base ${avgPoints} pts`);

    // ============================================
    // 2. OFFENSIVE STATS (usar datos reales si disponibles)
    // ============================================
    const useRecentStats = recentStats !== null;
    const effectiveMatches = useRecentStats ? recentStats.matches : gamesPlayed;

    // Goles
    const goals = useRecentStats ? recentStats.goals : (stats.goals?.total || 0);
    if (position !== 'GK') {
      const goalMultiplier = this.getGoalMultiplier(position);
      avgPoints += (goals / effectiveMatches) * goalMultiplier;
    }

    // Asistencias
    const assists = useRecentStats ? recentStats.assists : (stats.goals?.assists || 0);
    avgPoints += (assists / effectiveMatches) * 3;

    // Remates a puerta (DAZN - solo en stats recientes)
    const shotsOnTarget = useRecentStats ? recentStats.shotsOn : (stats.shots?.on || 0);
    if (shotsOnTarget > 0) {
      avgPoints += (shotsOnTarget / effectiveMatches) * 0.5;
    }

    // ============================================
    // 3. POSSESSION STATS (DAZN 2025-26 - stats reales)
    // ============================================
    // Regates exitosos
    const dribblesSuccess = useRecentStats ? recentStats.dribblesSuccess : (stats.dribbles?.success || 0);
    if (dribblesSuccess > 0) {
      avgPoints += (dribblesSuccess / effectiveMatches) * 1.0;
    }

    // Pases clave (key passes)
    const keyPasses = useRecentStats ? recentStats.passesKey : (stats.passes?.key || 0);
    if (keyPasses > 0) {
      avgPoints += (keyPasses / effectiveMatches) * 1.0;
    }

    // Bonus por precisión de pases (solo stats recientes)
    if (useRecentStats && recentStats.passesAccuracy) {
      const passAccuracy = parseFloat(recentStats.passesAccuracy);
      if (passAccuracy > 90) {
        avgPoints += 2;
      } else if (passAccuracy > 85) {
        avgPoints += 1;
      } else if (passAccuracy < 70) {
        avgPoints -= 1;
      }
    }

    // ============================================
    // 4. DEFENSIVE STATS (DAZN 2025-26 - stats reales)
    // ============================================
    // Entradas exitosas (tackles)
    const tacklesTotal = useRecentStats ? recentStats.tacklesTotal : (stats.tackles?.total || 0);
    if (tacklesTotal > 0) {
      avgPoints += (tacklesTotal / effectiveMatches) * 1.0;
    }

    // Intercepciones
    const interceptions = useRecentStats ? recentStats.tacklesInterceptions : (stats.tackles?.interceptions || 0);
    if (interceptions > 0) {
      avgPoints += (interceptions / effectiveMatches) * 1.0;
    }

    // Despejes (blocks)
    const blocks = useRecentStats ? recentStats.tacklesBlocks : (stats.tackles?.blocks || 0);
    if (blocks > 0) {
      avgPoints += (blocks / effectiveMatches) * 0.5;
    }

    // Duelos ganados/perdidos
    const duelsWon = useRecentStats ? recentStats.duelsWon : (stats.duels?.won || 0);
    const duelsTotal = useRecentStats ? recentStats.duelsTotal : (stats.duels?.total || 0);
    const duelsLost = duelsTotal - duelsWon;

    if (duelsWon > 0) {
      avgPoints += (duelsWon / effectiveMatches) * 0.3;
    }
    if (duelsLost > 0) {
      avgPoints -= (duelsLost / effectiveMatches) * 0.2;
    }

    // ============================================
    // 5. GOALKEEPER SPECIFIC
    // ============================================
    if (position === 'GK') {
      // Paradas (usar stats reales si disponibles)
      const saves = useRecentStats ? recentStats.saveTotal : (stats.goals?.saves || 0);
      if (saves > 0) {
        avgPoints += (saves / effectiveMatches) * 1.0;
      }

      // Paradas difíciles (estimado: si rating >7.0 y saves >3 por partido)
      const avgSavesPerGame = saves / effectiveMatches;
      const rating = useRecentStats ? parseFloat(recentStats.avgRating) : parseFloat(stats.games?.rating) || 0;
      if (avgSavesPerGame > 3 && rating > 7.0) {
        avgPoints += 2; // Bonus por actuación destacada
      }

      // Portería a cero
      const cleanSheets = this.estimateCleanSheets(player);
      avgPoints += (cleanSheets / gamesPlayed) * 4; // Usar gamesPlayed de temporada para clean sheets

      // Goles encajados
      const goalsConceded = useRecentStats ? recentStats.goalsConceded : (stats.goals?.conceded || 0);
      if (goalsConceded > 0) {
        avgPoints -= (goalsConceded / effectiveMatches) * 1;
      }
    }

    // ============================================
    // 6. DEFENDER SPECIFIC
    // ============================================
    if (position === 'DEF') {
      // Portería a cero
      const cleanSheets = this.estimateCleanSheets(player);
      avgPoints += (cleanSheets / gamesPlayed) * 4;

      // Goles encajados (cada 2 goles = -1 punto)
      const goalsConceded = stats.goals?.conceded || 0;
      avgPoints -= (goalsConceded / gamesPlayed) * 0.5;
    }

    // ============================================
    // 7. DISCIPLINE (Penalizaciones)
    // ============================================
    const yellowCards = stats.cards?.yellow || 0;
    const redCards = stats.cards?.red || 0;

    avgPoints -= (yellowCards / gamesPlayed) * 1;
    avgPoints -= (redCards / gamesPlayed) * 3;

    // Faltas cometidas (nuevo DAZN)
    const fouls = stats.fouls?.committed || 0;
    avgPoints -= (fouls / gamesPlayed) * 0.2;

    // ============================================
    // 8. NEGATIVE STATS (DAZN 2025-26)
    // ============================================
    // Penaltis fallados
    const penaltiesMissed = stats.penalty?.missed || 0;
    avgPoints -= (penaltiesMissed / gamesPlayed) * 3;

    // Fueras de juego (offsides)
    const offsides = stats.games?.offsides || 0;
    avgPoints -= (offsides / gamesPlayed) * 0.2;

    // ============================================
    // 9. APLICAR MULTIPLICADOR DE FORMA (Fase 1.3)
    // ============================================
    avgPoints *= formMultiplier;

    // ============================================
    // 10. FIXTURE DIFFICULTY MULTIPLIER (FASE 1.4)
    // ============================================
    let fixtureMultiplier = 1.0;

    // Solo aplicar si tenemos teamId
    if (player.team?.id) {
      const fixtureData = await this.fixtureAnalyzer.analyzeFixtureDifficulty(player.team.id, 3);

      if (fixtureData && fixtureData.averageDifficulty) {
        // Escala dificultad (1-5) a multiplicador (0.85-1.15)
        // Dificultad 1 (fácil) → 1.15x más puntos esperados
        // Dificultad 3 (medio) → 1.0x neutral
        // Dificultad 5 (difícil) → 0.85x menos puntos esperados
        fixtureMultiplier = 1.3 - (fixtureData.averageDifficulty * 0.09);
        fixtureMultiplier = Math.max(0.85, Math.min(1.15, fixtureMultiplier));

        avgPoints *= fixtureMultiplier;

        logger.debug(`[BargainAnalyzer] ${player.name}: Fixture difficulty ${fixtureData.averageDifficulty.toFixed(1)} → ${fixtureMultiplier.toFixed(2)}x`);
      }
    }

    // ============================================
    // TOTAL
    // ============================================
    const finalPoints = Math.max(0, avgPoints);

    logger.debug(`[BargainAnalyzer] ${player.name} TOTAL: ${finalPoints.toFixed(2)} pts/partido (form: ${formMultiplier.toFixed(2)}x, fixtures: ${fixtureMultiplier.toFixed(2)}x)`);

    return finalPoints;
  }

  // ============================================
  // FASE 1.3: CALCULAR MULTIPLICADOR DE FORMA
  // ============================================
  /**
   * Calcular multiplicador basado en forma reciente (rating promedio últimos partidos)
   * @param {number} avgRating - Rating promedio últimos partidos
   * @returns {number} Multiplicador 0.8x - 1.3x
   */
  _calculateFormMultiplier(avgRating) {
    // Escala de forma basada en rating:
    // <6.0 = Muy mala forma (0.8x)
    // 6.0-6.5 = Mala forma (0.9x)
    // 6.5-7.0 = Forma normal (1.0x)
    // 7.0-7.5 = Buena forma (1.15x)
    // 7.5-8.0 = Muy buena forma (1.25x)
    // >8.0 = Forma excepcional (1.3x)

    if (avgRating < 6.0) return 0.8;
    if (avgRating < 6.5) return 0.9;
    if (avgRating < 7.0) return 1.0;
    if (avgRating < 7.5) return 1.15;
    if (avgRating < 8.0) return 1.25;
    return 1.3;
  }

  // ============================================
  // FASE 1.2: ESTIMACIÓN DE PRECIO V2.0
  // Sistema market-aware con team tier
  // ============================================
  estimatePlayerPrice(player) {
    const stats = player.stats;
    if (!stats) return 5.0; // Precio base

    const goals = stats.goals?.total || 0;
    const assists = stats.goals?.assists || 0;
    const games = stats.games?.appearences || 1;
    const minutes = stats.games?.minutes || 0;
    const rating = parseFloat(stats.games?.rating) || 6.0;
    const position = this.getPositionFromPlayerData(player);

    // ============================================
    // 1. BASE PRICE (posición + team tier)
    // ============================================
    const teamId = player.team?.id;
    const teamTier = this.getTeamTier(teamId);

    // Precio base por posición y tier de equipo
    // CALIBRADO: Reducido GK/DEF top para evitar sobreestimación
    const priceMatrix = {
      'GK': { top: 4.5, mid: 4.0, low: 3.0 },    // top: 5.0 → 4.5
      'DEF': { top: 5.0, mid: 4.5, low: 3.5 },   // top: 5.5 → 5.0
      'MID': { top: 6.0, mid: 5.0, low: 4.0 },
      'FWD': { top: 6.5, mid: 5.5, low: 4.5 }
    };

    let price = priceMatrix[position]?.[teamTier] || 4.5;

    logger.debug(`[BargainAnalyzer] ${player.name}: ${position} ${teamTier} → Base ${price.toFixed(2)}€`);

    // ============================================
    // 2. PERFORMANCE PREMIUM (stats actuales)
    // ============================================
    // Bonus no lineal por contribuciones (goles + asistencias)
    const contributions = goals + assists;
    if (contributions > 0) {
      // Raíz cuadrada suaviza, pero con multiplicador por tier
      // CALIBRADO: Reducido multiplicador top (1.2 → 1.1) para evitar inflación
      const tierMultiplier = { top: 1.1, mid: 1.0, low: 0.85 }[teamTier];
      price += Math.sqrt(contributions) * 0.9 * tierMultiplier;
    }

    // ============================================
    // 3. RATING PREMIUM (excelencia)
    // ============================================
    // Bonus cuadrático por rating (excelencia tiene premio exponencial)
    if (rating > 6.0) {
      const ratingBonus = Math.pow((rating - 6.0), 1.5) * 0.7;
      price += ratingBonus;
    }

    // Star player bonus (rating muy alto + equipo top)
    // CALIBRADO: Aumentado a 3.0€ para capturar valor estrellas
    // Rating >7.5 en equipos top son jugadores elite (Lewandowski €11.5M, Vinicius €12M)
    // EXCLUIDO GK: Los porteros tienen precios diferentes (Courtois €6.5M vs Lewandowski €11.5M)
    if (rating > 7.5 && teamTier === 'top' && position !== 'GK') {
      price += 3.0; // Premium por "estrella"
      logger.debug(`[BargainAnalyzer] ${player.name}: Star player bonus +3.0€`);
    } else if (rating > 7.2 && teamTier === 'top' && position !== 'GK') {
      price += 1.5; // Bonus menor para jugadores muy buenos
      logger.debug(`[BargainAnalyzer] ${player.name}: Very good player bonus +1.5€`);
    }

    // ============================================
    // 4. MINUTES SECURITY (titularidad)
    // ============================================
    const minutesPerGame = minutes / games;
    const minutesRatio = Math.min(minutesPerGame / 90, 1.0);  // 0-1

    // Bonus gradual por minutos (titulares valen más)
    price += minutesRatio * 1.8;  // 0-1.8€ según minutos

    // Bonus extra por titularidad asegurada (>75 min/partido)
    if (minutesPerGame > 75) {
      price += 0.8; // Premium seguridad
    }

    // ============================================
    // 5. AGE CURVE (potencial vs experiencia)
    // ============================================
    const age = player.age || 25;

    if (age < 21) {
      price += 1.0; // Joven promesa
    } else if (age < 24) {
      price += 0.5; // Joven en desarrollo
    } else if (age > 32) {
      price -= 0.8; // Veterano en declive
    } else if (age > 30) {
      price -= 0.4; // Peak pasado
    }

    // ============================================
    // 6. ADVANCED STATS BONUS (DAZN points)
    // ============================================
    // Bonus por stats defensivas (tackles, interceptions)
    const tackles = stats.tackles?.total || 0;
    const interceptions = stats.tackles?.interceptions || 0;

    if (['DEF', 'MID'].includes(position) && (tackles + interceptions) > 0) {
      price += Math.min(1.0, (tackles + interceptions) / games * 0.05);
    }

    // Bonus por creatividad (key passes, dribbles)
    const keyPasses = stats.passes?.key || 0;
    const dribbles = stats.dribbles?.success || 0;

    if (['MID', 'FWD'].includes(position) && (keyPasses + dribbles) > 0) {
      price += Math.min(1.2, (keyPasses + dribbles) / games * 0.06);
    }

    // Bonus por paradas (porteros)
    if (position === 'GK') {
      const saves = stats.goals?.saves || 0;
      price += Math.min(1.5, saves / games * 0.08);
    }

    // ============================================
    // TOTAL
    // ============================================
    const finalPrice = Math.min(15.0, Math.max(1.0, price));

    logger.debug(`[BargainAnalyzer] ${player.name} PRECIO FINAL: ${finalPrice.toFixed(2)}€ (tier: ${teamTier})`);

    return finalPrice;
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

  // ============================================
  // FASE 1.2: CLASIFICACIÓN DE EQUIPOS POR TIER
  // ============================================
  getTeamTier(teamId) {
    const tierClassification = {
      // TIER 1: Top teams (Champions League contenders)
      top: [541, 529, 530], // Real Madrid, Barcelona, Atlético Madrid

      // TIER 2: Europa League / top-mid table
      mid: [548, 533, 532, 536, 531, 728], // Real Sociedad, Villarreal, Valencia, Sevilla, Athletic Club, Rayo Vallecano

      // TIER 3: Mid-table / relegation fighters
      low: [546, 538, 547, 727, 539, 797, 718] // Getafe, Celta Vigo, Girona, Osasuna, Levante, Elche, Real Oviedo
    };

    if (tierClassification.top.includes(teamId)) return 'top';
    if (tierClassification.mid.includes(teamId)) return 'mid';
    return 'low'; // Default
  }

  // Calidad defensiva estimada por equipo
  getTeamDefensiveQuality(teamId) {
    // ✅ CORREGIDO: Porcentajes basados en datos reales temporada 2024-25
    // Fuente: Análisis de porterías a cero La Liga 2024-25
    const defensiveRatings = {
      541: 0.32, // Real Madrid (12/38 partidos = 31.6%) ← REDUCIDO de 0.45
      529: 0.28, // Barcelona (10-11/38 = 28%) ← REDUCIDO de 0.40
      530: 0.35, // Atlético Madrid (mantiene buen nivel defensivo)
      548: 0.25, // Real Sociedad ← REDUCIDO de 0.30
      533: 0.22, // Villarreal ← REDUCIDO de 0.25
      // Equipos medianos
      532: 0.20, // Valencia
      536: 0.18, // Sevilla
      531: 0.22, // Athletic Club
      // Equipos pequeños/recién ascendidos
      539: 0.15, // Levante
      797: 0.15, // Elche
      718: 0.15  // Real Oviedo
    };

    // ✅ CORREGIDO: Default 15% (no 20%) para equipos sin datos
    return defensiveRatings[teamId] || 0.15;
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

      // Calcular valor para cada jugador (ASYNC)
      const playersWithValue = await Promise.all(eligiblePlayers.map(async player => {
        const valueData = await this.calculateValueRatio(player);
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
      }));

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

      const value1 = await this.calculateValueRatio(player1);
      const value2 = await this.calculateValueRatio(player2);

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