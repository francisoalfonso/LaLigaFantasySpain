/**
 * @fileoverview Configuración oficial de La Liga Temporada 2025-26
 * @module config/season2025-26
 * @description Contiene toda la información oficial de la temporada actual:
 * - Información temporal (fechas inicio/fin)
 * - Equipos oficiales (20 equipos: 17 continuos + 3 promovidos)
 * - Equipos relegados (Valladolid, Las Palmas, Leganés)
 * - Validación de datos para asegurar consistencia
 * - Recordatorios para Claude Code sobre configuración correcta
 *
 * ⚠️ CRÍTICO: NO MODIFICAR sin confirmación oficial de La Liga
 *
 * @constant {Object} SEASON_INFO - Información oficial de la temporada
 * @constant {Object} TEAMS - Equipos oficiales 2025-26
 * @constant {Object} VALIDATION - Reglas de validación de datos
 * @constant {Object} REMINDERS - Recordatorios rápidos para desarrollo
 *
 * @example
 * const { SEASON_INFO, VALIDATION } = require('./config/season2025-26');
 *
 * // Verificar temporada correcta
 * console.log(SEASON_INFO.API_SPORTS_ID); // 2025
 *
 * // Validar equipos en datos
 * if (VALIDATION.SHOULD_NOT_EXIST.includes(teamName)) {
 *   throw new Error('Equipo relegado - no debe existir');
 * }
 */

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