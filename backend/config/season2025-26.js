// ⚠️ CONFIGURACIÓN TEMPORADA 2025-26 - LA LIGA ⚠️
// Este archivo contiene la configuración definitiva de la temporada actual
// NO MODIFICAR sin confirmación oficial de La Liga

module.exports = {
  // INFORMACIÓN OFICIAL DE LA TEMPORADA
  SEASON_INFO: {
    NAME: "2025-26",
    FULL_NAME: "La Liga EA Sports 2025-26",
    NUMBER: 95, // 95ª temporada de La Liga
    START_DATE: "2025-08-15",
    END_DATE: "2026-05-24",
    DEFENDING_CHAMPION: "Barcelona", // 28º título
    API_SPORTS_ID: 2025 // ✅ CONFIRMADO: API-Sports usa 2025 para temporada 2025-26
  },

  // EQUIPOS OFICIALES 2025-26 (20 EQUIPOS)
  TEAMS: {
    // Equipos que continúan de 2024-25 (17 equipos)
    CONTINUING: [
      "Alaves", "Athletic Club", "Atletico Madrid", "Barcelona",
      "Celta Vigo", "Espanyol", "Getafe", "Girona", "Mallorca",
      "Osasuna", "Rayo Vallecano", "Real Betis", "Real Madrid",
      "Real Sociedad", "Sevilla", "Valencia", "Villarreal"
    ],

    // Equipos promovidos para 2025-26 (3 equipos)
    PROMOTED: [
      { name: "Levante", id: 539, status: "Promovido primero" },
      { name: "Elche", id: 797, status: "Promovido último día" },
      { name: "Real Oviedo", id: 718, status: "Ganó playoff ascenso" }
    ],

    // Equipos relegados de 2024-25 (NO DEBEN APARECER)
    RELEGATED: [
      { name: "Valladolid", reason: "Relegado tras 1-5 vs Real Betis" },
      { name: "Las Palmas", reason: "Relegado tras 0-1 vs Sevilla" },
      { name: "Leganés", reason: "Relegado - Espanyol sobrevivió" }
    ],

    TOTAL_COUNT: 20 // OBLIGATORIO: Siempre 20 equipos
  },

  // VALIDACIÓN DE DATOS
  VALIDATION: {
    // Si estos equipos aparecen en datos = ERROR
    SHOULD_NOT_EXIST: ["Valladolid", "Las Palmas", "Leganés"],

    // Estos equipos DEBEN existir siempre
    MUST_EXIST: ["Levante", "Elche", "Real Oviedo"],

    // Número exacto de equipos esperado
    EXPECTED_TEAM_COUNT: 20,

    // Número aproximado de jugadores (30 por equipo)
    EXPECTED_PLAYER_COUNT: 600
  },

  // RECORDATORIOS PARA CLAUDE CODE
  REMINDERS: {
    SEASON: "2025-26",
    API_SEASON_ID: 2025,
    TEAMS_COUNT: 20,
    NEW_TEAMS: "Levante, Elche, Real Oviedo",
    REMOVED_TEAMS: "Valladolid, Las Palmas, Leganés"
  }
};