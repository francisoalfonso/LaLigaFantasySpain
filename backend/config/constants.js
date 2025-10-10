/**
 * @fileoverview Configuraciones y constantes centralizadas para Fantasy La Liga 2025-26
 * @module config/constants
 * @description Contiene todas las configuraciones críticas del proyecto:
 * - API-Sports (temporada 2025-26)
 * - Sistema de puntos Fantasy oficial
 * - Configuración OpenAI GPT-5 Mini
 * - Límites y thresholds del sistema
 *
 * ⚠️ TEMPORADA 2025-26 - NO CAMBIAR SIN CONFIRMAR ⚠️
 */

module.exports = {
  // API-Sports La Liga TEMPORADA 2025-26
  API_SPORTS: {
    LA_LIGA_ID: 140,
    SEASON_2025_26: 2025, // CONFIRMADO: API-Sports usa 2025 para temporada 2025-26
    BASE_URL: 'https://v3.football.api-sports.io'
  },

  // OpenAI GPT-5 Mini para generación de contenido
  OPENAI_GPT5_MINI: {
    MODEL_NAME: 'gpt-5-mini',
    PRICING: {
      INPUT_PER_1M: 0.25,  // $0.25 per 1M tokens
      OUTPUT_PER_1M: 2.00, // $2.00 per 1M tokens
      CACHE_DISCOUNT: 0.90 // 90% descuento en contenido repetido
    },
    LIMITS: {
      MAX_INPUT_TOKENS: 272000,
      MAX_OUTPUT_TOKENS: 128000,
      RECOMMENDED_OUTPUT: 4000 // Para contenido Fantasy
    },
    TEMPERATURE: 0.7, // Balance creatividad/consistencia
    SELECTED_REASON: "Mejor relación calidad/precio para Fantasy La Liga 2025-26"
  },

  // Sistema de puntos Fantasy La Liga 2025-26 (DAZN Points completo)
  FANTASY_POINTS: {
    // ============================================
    // PUNTOS BASE
    // ============================================
    MATCH_PLAYED: 2,

    // ============================================
    // OFFENSIVE STATS
    // ============================================
    // Puntos por goles según posición
    GOALS: {
      GK: 10,   // Portero
      DEF: 6,   // Defensa
      MID: 5,   // Centrocampista
      FWD: 4    // Delantero
    },

    // Puntos por asistencias (todas las posiciones)
    ASSIST: 3,

    // Remates (shots)
    SHOT_ON_TARGET: 0.5,   // Remate a puerta
    SHOT_OFF_TARGET: 0,    // Remate fuera (no puntúa)

    // ============================================
    // POSSESSION STATS (DAZN 2025-26)
    // ============================================
    DRIBBLE_SUCCESS: 1,     // Regate completado con éxito
    DRIBBLE_FAILED: -0.5,   // Regate fallido

    KEY_PASS: 1,            // Pase clave (oportunidad de gol)
    ACCURATE_CROSS: 0.5,    // Centro al área completado

    PASS_ACCURACY_BONUS: {  // Bonus por % pases completados
      ABOVE_90: 2,          // >90% precisión
      ABOVE_85: 1,          // >85% precisión
      BELOW_70: -1          // <70% precisión (pérdida posesión)
    },

    // ============================================
    // DEFENSIVE STATS (DAZN 2025-26)
    // ============================================
    TACKLE_SUCCESS: 1,      // Entrada exitosa
    INTERCEPTION: 1,        // Intercepción
    CLEARANCE: 0.5,         // Despeje
    BLOCK: 0.5,             // Bloqueo de remate

    DUEL_WON: 0.3,          // Duelo ganado (aéreo o terrestre)
    DUEL_LOST: -0.2,        // Duelo perdido

    BALL_RECOVERY: 0.5,     // Balón recuperado

    // ============================================
    // GOALKEEPER SPECIFIC
    // ============================================
    SAVE: 1,                // Parada
    SAVE_DIFFICULT: 2,      // Parada difícil (estimado por rating)
    PENALTY_SAVED: 5,       // Penalti parado
    CLEAN_SHEET_GK: 4,      // Portería a cero
    GOAL_CONCEDED_GK: -1,   // Gol encajado

    // ============================================
    // DEFENDER SPECIFIC
    // ============================================
    CLEAN_SHEET_DEF: 4,     // Portería a cero
    GOALS_CONCEDED_DEF: -0.5, // -1 punto cada 2 goles

    // ============================================
    // DISCIPLINE (Penalizaciones)
    // ============================================
    YELLOW_CARD: -1,
    RED_CARD: -3,
    FOUL_COMMITTED: -0.2,   // Falta cometida (acumulativo)
    PENALTY_CONCEDED: -2,   // Penalti cometido

    // ============================================
    // NEGATIVE STATS
    // ============================================
    POSSESSION_LOST: -0.1,  // Balón perdido
    PENALTY_MISSED: -3,     // Penalti fallado
    OWN_GOAL: -5,           // Gol en propia puerta
    OFFSIDE: -0.2           // Fuera de juego (acumulativo)
  },

  // Mapeo de posiciones
  POSITIONS: {
    1: 'GK',   // Portero
    2: 'DEF',  // Defensa
    3: 'DEF',  // Defensa central
    4: 'DEF',  // Lateral
    5: 'MID',  // Centrocampista
    6: 'MID',  // Centrocampista defensivo
    7: 'MID',  // Centrocampista ofensivo
    8: 'MID',  // Media punta
    9: 'FWD',  // Delantero centro
    10: 'FWD', // Extremo
    11: 'FWD'  // Segundo delantero
  },

  // Configuración del servidor
  SERVER: {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'localhost'
  },


  // Thresholds para destacar jugadores
  THRESHOLDS: {
    HIGH_SCORE: 10,        // Puntuación alta en un partido
    EXCELLENT_SCORE: 15,   // Puntuación excelente
    PRICE_THRESHOLD: 5,    // Precio bajo para "chollos"
    OWNERSHIP_LOW: 10      // Porcentaje de propiedad bajo
  }
};