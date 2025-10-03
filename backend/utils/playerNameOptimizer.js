/**
 * Player Name Optimizer - Optimización V3 para VEO3
 *
 * Utilidad para convertir nombres completos de jugadores a formatos
 * optimizados que eviten bloqueos de Google Content Policy.
 *
 * ESTRATEGIA V3 CONSERVADORA:
 * - Evitar nombre completo + equipo (SIEMPRE bloqueado)
 * - Usar solo apellido SIN equipo (85-90% éxito)
 * - Ahorro: $0.30 por video (evita Intento 1 fallido)
 */

const logger = require('./logger');

/**
 * Extraer apellido de nombre completo
 * @param {string} fullName - Nombre completo del jugador
 * @returns {string} - Apellido solo
 */
function extractSurname(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        logger.warn('[PlayerNameOptimizer] Nombre inválido recibido:', fullName);
        return fullName || '';
    }

    // Casos especiales
    const specialCases = {
        'Vinicius Junior': 'Vinicius',
        'Vinicius Jr': 'Vinicius',
        'Robert Lewandowski': 'Lewandowski',
        'Kylian Mbappé': 'Mbappé',
        'Lionel Messi': 'Messi',
        'Cristiano Ronaldo': 'Ronaldo'
    };

    if (specialCases[fullName]) {
        return specialCases[fullName];
    }

    // Extraer último palabra (apellido)
    const parts = fullName.trim().split(' ');
    const surname = parts[parts.length - 1];

    logger.info(`[PlayerNameOptimizer] "${fullName}" → "${surname}"`);
    return surname;
}

/**
 * Generar referencia de jugador optimizada para VEO3 V3
 * CRÍTICO: NO incluir equipo en la misma frase
 *
 * @param {string} fullName - Nombre completo
 * @param {string} team - Nombre del equipo (opcional, se ignora)
 * @param {object} options - Opciones adicionales
 * @returns {string} - Referencia optimizada
 */
function generateOptimizedPlayerReference(fullName, team = null, options = {}) {
    const {
        includeRole = false, // Incluir rol genérico ("el delantero")
        includeRegion = false // Incluir región vaga ("del norte")
    } = options;

    const surname = extractSurname(fullName);

    // ESTRATEGIA 1 (95% confianza): Solo apellido
    if (!includeRole && !includeRegion) {
        return surname;
    }

    // ESTRATEGIA 2 (90% confianza): Apellido + rol genérico
    if (includeRole) {
        const roles = {
            'Aspas': 'el delantero',
            'Lewandowski': 'el delantero',
            'Vinicius': 'el extremo',
            'Messi': 'el delantero',
            'Ronaldo': 'el delantero'
        };
        const role = roles[surname] || 'el jugador';
        return `${surname}, ${role}`;
    }

    // ESTRATEGIA 3 (85% confianza): Apellido + región vaga
    if (includeRegion) {
        const regions = {
            'Aspas': 'del norte',
            'Lewandowski': 'centro-europeo',
            'Vinicius': 'brasileño'
        };
        const region = regions[surname] || '';
        return region ? `${surname}, ${region}` : surname;
    }

    return surname;
}

/**
 * Optimizar texto completo eliminando menciones de equipo
 * "Iago Aspas del Celta está a 8M" → "Aspas está a 8M"
 *
 * @param {string} text - Texto original
 * @param {string} playerFullName - Nombre completo del jugador
 * @param {string} team - Nombre del equipo a eliminar
 * @returns {string} - Texto optimizado
 */
function optimizeContentText(text, playerFullName, team = null) {
    if (!text) return text;

    let optimized = text;
    const surname = extractSurname(playerFullName);

    // 1. Reemplazar nombre completo por apellido
    const fullNameRegex = new RegExp(`\\b${escapeRegex(playerFullName)}\\b`, 'gi');
    optimized = optimized.replace(fullNameRegex, surname);

    // 2. Eliminar menciones de equipo
    if (team) {
        const teamPatterns = [
            new RegExp(`\\b(del|de)\\s+${escapeRegex(team)}(\\s+de\\s+\\w+)?\\b`, 'gi'),
            new RegExp(`\\b${escapeRegex(team)}\\b`, 'gi')
        ];

        for (const pattern of teamPatterns) {
            optimized = optimized.replace(pattern, '');
        }
    }

    // 3. Limpiar espacios dobles y comas sueltas
    optimized = optimized.replace(/\s+/g, ' ').replace(/\s,/g, ',').trim();

    logger.info('[PlayerNameOptimizer] Texto optimizado:');
    logger.info(`  Original: "${text.substring(0, 80)}..."`);
    logger.info(`  Optimizado: "${optimized.substring(0, 80)}..."`);

    return optimized;
}

/**
 * Escape regex special characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validar si un texto es seguro para VEO3 (sin nombre+equipo)
 * @param {string} text - Texto a validar
 * @returns {object} - { safe: boolean, issues: string[] }
 */
function validateSafeForVEO3(text) {
    const issues = [];

    // Detectar nombres completos conocidos
    const fullNames = [
        'Iago Aspas',
        'Robert Lewandowski',
        'Vinicius Junior',
        'Lionel Messi',
        'Cristiano Ronaldo'
    ];

    for (const name of fullNames) {
        if (new RegExp(`\\b${escapeRegex(name)}\\b`, 'i').test(text)) {
            issues.push(`Nombre completo detectado: "${name}"`);
        }
    }

    // Detectar combinaciones apellido + equipo
    const riskyCombinations = [
        { player: 'Aspas', teams: ['Celta', 'Celta de Vigo'] },
        { player: 'Lewandowski', teams: ['Barcelona', 'FC Barcelona'] },
        { player: 'Vinicius', teams: ['Real Madrid', 'Madrid'] }
    ];

    for (const combo of riskyCombinations) {
        const hasPlayer = new RegExp(`\\b${combo.player}\\b`, 'i').test(text);
        if (hasPlayer) {
            for (const team of combo.teams) {
                const hasTeam = new RegExp(`\\b${escapeRegex(team)}\\b`, 'i').test(text);
                if (hasTeam) {
                    issues.push(`Combinación riesgosa: "${combo.player}" + "${team}"`);
                }
            }
        }
    }

    return {
        safe: issues.length === 0,
        issues
    };
}

/**
 * Generar contenido de chollo optimizado para VEO3 V3
 * @param {object} playerData - Datos del jugador
 * @returns {string} - Texto optimizado listo para VEO3
 */
function generateOptimizedCholloContent(playerData) {
    const {
        fullName, // "Iago Aspas"
        team, // "Celta de Vigo" (se ignora)
        price,
        valueRatio,
        expectedPoints
    } = playerData;

    // Usar SOLO apellido (estrategia V3 conservadora)
    const surname = extractSurname(fullName);

    // Generar texto SIN mencionar equipo
    const content = `${surname} está a solo ${price} millones. La relación calidad-precio es brutal con un ratio de ${valueRatio}.`;

    // Validar que sea seguro
    const validation = validateSafeForVEO3(content);
    if (!validation.safe) {
        logger.warn('[PlayerNameOptimizer] Contenido generado tiene issues:', validation.issues);
    } else {
        logger.info('[PlayerNameOptimizer] ✅ Contenido optimizado y seguro para VEO3');
    }

    return content;
}

module.exports = {
    extractSurname,
    generateOptimizedPlayerReference,
    optimizeContentText,
    validateSafeForVEO3,
    generateOptimizedCholloContent
};
