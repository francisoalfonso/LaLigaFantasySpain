// Configuraciones y constantes para el proyecto Fantasy La Liga
// ⚠️ TEMPORADA 2025-26 - NO CAMBIAR SIN CONFIRMAR ⚠️
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

  // Sistema de puntos Fantasy La Liga
  FANTASY_POINTS: {
    // Puntos base por posición
    MATCH_PLAYED: 2,

    // Puntos por goles según posición
    GOALS: {
      GK: 10,   // Portero
      DEF: 6,   // Defensa
      MID: 5,   // Centrocampista
      FWD: 4    // Delantero
    },

    // Puntos por asistencias (todas las posiciones)
    ASSIST: 3,

    // Puntos específicos para porteros
    PENALTY_SAVED: 5,
    CLEAN_SHEET_GK: 4,
    GOAL_CONCEDED_GK: -1,

    // Puntos específicos para defensas
    CLEAN_SHEET_DEF: 4,
    GOALS_CONCEDED_DEF: -0.5, // -1 punto cada 2 goles

    // Penalizaciones (todas las posiciones)
    YELLOW_CARD: -1,
    RED_CARD: -3
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