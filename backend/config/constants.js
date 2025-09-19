// Configuraciones y constantes para el proyecto Fantasy La Liga
module.exports = {
  // IDs de SportMonks
  LEAGUE_IDS: {
    LA_LIGA: 564,
    // Para testing con plan gratuito
    SCOTTISH_PREMIERSHIP: 501,
    DANISH_SUPERLIGA: 271
  },

  SEASON_IDS: {
    LA_LIGA_2024_25: 23476
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

  // URLs base de SportMonks
  SPORTMONKS: {
    BASE_URL: 'https://api.sportmonks.com/v3/football',
    RATE_LIMIT: 3000, // 3 segundos entre llamadas para plan gratuito
    INCLUDES: [
      'participants',
      'scores',
      'statistics.details',
      'lineups.details.player',
      'events.player'
    ]
  },

  // Thresholds para destacar jugadores
  THRESHOLDS: {
    HIGH_SCORE: 10,        // Puntuación alta en un partido
    EXCELLENT_SCORE: 15,   // Puntuación excelente
    PRICE_THRESHOLD: 5,    // Precio bajo para "chollos"
    OWNERSHIP_LOW: 10      // Porcentaje de propiedad bajo
  }
};