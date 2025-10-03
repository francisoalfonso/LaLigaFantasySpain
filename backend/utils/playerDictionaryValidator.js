/**
 * Player Dictionary Validator - Validación Progresiva Automática
 *
 * Sistema que valida si jugadores/equipos están en diccionario antes de generar videos.
 * Si NO están, ejecuta investigación automática y completa el diccionario.
 *
 * FLUJO:
 * API da resultados → ¿Jugador en diccionario?
 *   → SÍ: Avanzar a construcción video
 *   → NO: Investigación automática → Completar diccionario → Seguir secuencia
 */

const logger = require('./logger');
const path = require('path');
const fs = require('fs').promises;

// Path al diccionario JSON
const DICTIONARY_PATH = path.join(__dirname, '../../data/player-dictionary.json');

/**
 * Estructura del diccionario
 * {
 *   "players": {
 *     "Iago Aspas": {
 *       "surname": "Aspas",
 *       "team": "Celta de Vigo",
 *       "safeReferences": ["Aspas", "el capitán", "el delantero gallego"],
 *       "avoidCombinations": ["Aspas del Celta", "Aspas Celta"],
 *       "registeredNicknames": ["El Príncipe de las Bateas"],
 *       "safeNicknames": ["el capitán celeste", "el goleador del norte"],
 *       "testedSuccessRate": 0.90, // % éxito en VEO3
 *       "lastTested": "2025-10-03",
 *       "totalVideos": 5
 *     }
 *   },
 *   "teams": {
 *     "Celta de Vigo": {
 *       "safeReferences": ["equipo gallego", "los celestes", "el club de Vigo"],
 *       "registeredNicknames": [],
 *       "safeNicknames": ["los celestes", "el equipo del norte"]
 *     }
 *   }
 * }
 */

/**
 * Verificar si jugador existe en diccionario
 * @param {string} playerFullName - Nombre completo jugador
 * @returns {Promise<{exists: boolean, data?: object}>}
 */
async function checkPlayerInDictionary(playerFullName) {
    try {
        const dictionary = await loadDictionary();

        if (dictionary.players && dictionary.players[playerFullName]) {
            logger.info(`[DictionaryValidator] ✅ Jugador "${playerFullName}" encontrado en diccionario`);
            return {
                exists: true,
                data: dictionary.players[playerFullName]
            };
        }

        logger.warn(`[DictionaryValidator] ⚠️ Jugador "${playerFullName}" NO encontrado en diccionario`);
        return { exists: false };
    } catch (error) {
        logger.error('[DictionaryValidator] Error verificando jugador:', error);
        return { exists: false };
    }
}

/**
 * Verificar si equipo existe en diccionario
 * @param {string} teamName - Nombre del equipo
 * @returns {Promise<{exists: boolean, data?: object}>}
 */
async function checkTeamInDictionary(teamName) {
    try {
        const dictionary = await loadDictionary();

        if (dictionary.teams && dictionary.teams[teamName]) {
            logger.info(`[DictionaryValidator] ✅ Equipo "${teamName}" encontrado en diccionario`);
            return {
                exists: true,
                data: dictionary.teams[teamName]
            };
        }

        logger.warn(`[DictionaryValidator] ⚠️ Equipo "${teamName}" NO encontrado en diccionario`);
        return { exists: false };
    } catch (error) {
        logger.error('[DictionaryValidator] Error verificando equipo:', error);
        return { exists: false };
    }
}

/**
 * Investigación automática de jugador
 * Busca alternativas seguras para VEO3
 * @param {string} playerFullName - Nombre completo jugador
 * @param {string} team - Nombre del equipo
 * @returns {Promise<object>} - Datos investigados
 */
async function investigatePlayer(playerFullName, team) {
    logger.info(`[DictionaryValidator] 🔍 Investigando jugador "${playerFullName}"...`);

    // Extraer apellido
    const parts = playerFullName.trim().split(' ');
    const surname = parts[parts.length - 1];

    // Investigación automática básica (expandible con APIs externas)
    const playerData = {
        surname,
        team,
        safeReferences: [
            surname, // Apellido solo (prioridad 1)
            `el jugador`, // Genérico
        ],
        avoidCombinations: [
            `${surname} del ${team}`,
            `${surname} ${team}`,
            `${playerFullName} del ${team}`,
            `${playerFullName} ${team}`
        ],
        registeredNicknames: [], // Por defecto vacío - requiere verificación manual
        safeNicknames: [], // Por defecto vacío - se completará con uso
        testedSuccessRate: 0, // Sin datos aún
        lastTested: null,
        totalVideos: 0
    };

    logger.info(`[DictionaryValidator] ✅ Investigación completada para "${playerFullName}"`);
    logger.info(`  - Apellido: ${surname}`);
    logger.info(`  - Referencias seguras: ${playerData.safeReferences.join(', ')}`);
    logger.info(`  - Combinaciones a evitar: ${playerData.avoidCombinations.join(', ')}`);

    return playerData;
}

/**
 * Investigación automática de equipo
 * @param {string} teamName - Nombre del equipo
 * @returns {Promise<object>} - Datos investigados
 */
async function investigateTeam(teamName) {
    logger.info(`[DictionaryValidator] 🔍 Investigando equipo "${teamName}"...`);

    // Investigación básica - expandible con datos reales
    const teamData = {
        safeReferences: [
            `el equipo`, // Genérico
            `el club`
        ],
        registeredNicknames: [], // Por defecto vacío - requiere verificación manual
        safeNicknames: [] // Por defecto vacío - se completará con uso
    };

    logger.info(`[DictionaryValidator] ✅ Investigación completada para equipo "${teamName}"`);
    return teamData;
}

/**
 * Agregar jugador al diccionario
 * @param {string} playerFullName - Nombre completo jugador
 * @param {object} playerData - Datos del jugador
 */
async function addPlayerToDictionary(playerFullName, playerData) {
    try {
        const dictionary = await loadDictionary();

        if (!dictionary.players) {
            dictionary.players = {};
        }

        dictionary.players[playerFullName] = {
            ...playerData,
            addedAt: new Date().toISOString()
        };

        await saveDictionary(dictionary);
        logger.info(`[DictionaryValidator] ✅ Jugador "${playerFullName}" agregado al diccionario`);
    } catch (error) {
        logger.error('[DictionaryValidator] Error agregando jugador:', error);
        throw error;
    }
}

/**
 * Agregar equipo al diccionario
 * @param {string} teamName - Nombre del equipo
 * @param {object} teamData - Datos del equipo
 */
async function addTeamToDictionary(teamName, teamData) {
    try {
        const dictionary = await loadDictionary();

        if (!dictionary.teams) {
            dictionary.teams = {};
        }

        dictionary.teams[teamName] = {
            ...teamData,
            addedAt: new Date().toISOString()
        };

        await saveDictionary(dictionary);
        logger.info(`[DictionaryValidator] ✅ Equipo "${teamName}" agregado al diccionario`);
    } catch (error) {
        logger.error('[DictionaryValidator] Error agregando equipo:', error);
        throw error;
    }
}

/**
 * Actualizar tasa de éxito de jugador después de test
 * @param {string} playerFullName - Nombre completo jugador
 * @param {boolean} success - Si el video fue exitoso
 */
async function updatePlayerSuccessRate(playerFullName, success) {
    try {
        const dictionary = await loadDictionary();

        if (!dictionary.players || !dictionary.players[playerFullName]) {
            logger.warn(`[DictionaryValidator] Jugador "${playerFullName}" no encontrado para actualizar`);
            return;
        }

        const player = dictionary.players[playerFullName];
        const currentTotal = player.totalVideos || 0;
        const currentSuccesses = (player.testedSuccessRate || 0) * currentTotal;

        const newTotal = currentTotal + 1;
        const newSuccesses = currentSuccesses + (success ? 1 : 0);
        const newSuccessRate = newSuccesses / newTotal;

        player.totalVideos = newTotal;
        player.testedSuccessRate = newSuccessRate;
        player.lastTested = new Date().toISOString();

        await saveDictionary(dictionary);

        logger.info(`[DictionaryValidator] ✅ Actualizado "${playerFullName}": ${(newSuccessRate * 100).toFixed(1)}% éxito (${newTotal} videos)`);
    } catch (error) {
        logger.error('[DictionaryValidator] Error actualizando tasa de éxito:', error);
    }
}

/**
 * Validación completa: jugador + equipo
 * Si NO existen, ejecuta investigación automática
 * @param {string} playerFullName - Nombre completo jugador
 * @param {string} team - Nombre del equipo
 * @returns {Promise<{player: object, team: object}>}
 */
async function validateAndPrepare(playerFullName, team) {
    logger.info(`[DictionaryValidator] 📋 Validando "${playerFullName}" del "${team}"...`);

    // 1. Verificar jugador
    let playerCheck = await checkPlayerInDictionary(playerFullName);
    let playerData;

    if (!playerCheck.exists) {
        logger.info(`[DictionaryValidator] ⚙️ Iniciando investigación automática de jugador...`);
        playerData = await investigatePlayer(playerFullName, team);
        await addPlayerToDictionary(playerFullName, playerData);
    } else {
        playerData = playerCheck.data;
    }

    // 2. Verificar equipo
    let teamCheck = await checkTeamInDictionary(team);
    let teamData;

    if (!teamCheck.exists) {
        logger.info(`[DictionaryValidator] ⚙️ Iniciando investigación automática de equipo...`);
        teamData = await investigateTeam(team);
        await addTeamToDictionary(team, teamData);
    } else {
        teamData = teamCheck.data;
    }

    logger.info(`[DictionaryValidator] ✅ Validación completada - Listo para construir video`);

    return {
        player: playerData,
        team: teamData
    };
}

/**
 * Cargar diccionario desde JSON
 * @returns {Promise<object>}
 */
async function loadDictionary() {
    try {
        // Crear archivo si no existe
        try {
            await fs.access(DICTIONARY_PATH);
        } catch {
            const initialDictionary = { players: {}, teams: {} };
            await fs.mkdir(path.dirname(DICTIONARY_PATH), { recursive: true });
            await fs.writeFile(DICTIONARY_PATH, JSON.stringify(initialDictionary, null, 2));
            return initialDictionary;
        }

        const data = await fs.readFile(DICTIONARY_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('[DictionaryValidator] Error cargando diccionario:', error);
        return { players: {}, teams: {} };
    }
}

/**
 * Guardar diccionario a JSON
 * @param {object} dictionary - Diccionario completo
 */
async function saveDictionary(dictionary) {
    try {
        await fs.writeFile(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2));
        logger.info('[DictionaryValidator] ✅ Diccionario guardado exitosamente');
    } catch (error) {
        logger.error('[DictionaryValidator] Error guardando diccionario:', error);
        throw error;
    }
}

/**
 * Obtener estadísticas del diccionario
 * @returns {Promise<object>}
 */
async function getDictionaryStats() {
    const dictionary = await loadDictionary();

    const playerCount = Object.keys(dictionary.players || {}).length;
    const teamCount = Object.keys(dictionary.teams || {}).length;

    const players = Object.values(dictionary.players || {});
    const avgSuccessRate = players.length > 0
        ? players.reduce((sum, p) => sum + (p.testedSuccessRate || 0), 0) / players.length
        : 0;

    const totalVideos = players.reduce((sum, p) => sum + (p.totalVideos || 0), 0);

    return {
        playerCount,
        teamCount,
        avgSuccessRate,
        totalVideos,
        lastUpdated: new Date().toISOString()
    };
}

module.exports = {
    checkPlayerInDictionary,
    checkTeamInDictionary,
    investigatePlayer,
    investigateTeam,
    addPlayerToDictionary,
    addTeamToDictionary,
    updatePlayerSuccessRate,
    validateAndPrepare,
    getDictionaryStats
};
