/**
 * Content Type Rules Engine
 *
 * Sistema que determina automáticamente qué features aplicar según el tipo de contenido.
 *
 * FEATURES DISPONIBLES:
 * - playerCard: Tarjeta de jugador overlay (segundos 3-7)
 * - viralCaptions: Subtítulos karaoke ASS
 * - outro: Logo outro + freeze frame
 * - transitions: Crossfade entre segmentos
 *
 * CONTENT TYPES:
 * - outlier_response: Respuesta a video viral (necesita player card)
 * - chollo: Análisis de chollo (necesita player card)
 * - player_stats: Estadísticas de jugador (necesita player card)
 * - breaking_news: Noticia urgente (NO necesita player card)
 * - jornada_preview: Preview de jornada (NO necesita player card)
 *
 * Created: 15 Oct 2025
 */

const logger = require('../../utils/logger');

/**
 * Reglas por tipo de contenido
 *
 * Cada tipo define:
 * - needsPlayerCard: Si debe mostrar tarjeta de jugador
 * - needsPlayerData: Si requiere datos de jugador (stats, photo, etc.)
 * - cardTiming: Cuándo mostrar la card (null = default 3-7s)
 * - captionsEnabled: Si debe incluir subtítulos virales
 * - description: Descripción del tipo de contenido
 */
const CONTENT_TYPE_RULES = {
    // 🎯 OUTLIERS: Respuesta a video viral
    outlier_response: {
        needsPlayerCard: true,
        needsPlayerData: true,
        cardTiming: {
            startTime: 3.0,
            duration: 5.0, // Más tiempo porque estamos rebatiendo
            position: 'bottom-left'
        },
        captionsEnabled: true,
        outro: true,
        description: 'Respuesta a video viral de competidor'
    },

    // 💰 CHOLLOS: Análisis de chollo
    chollo: {
        needsPlayerCard: true,
        needsPlayerData: true,
        cardTiming: {
            startTime: 2.0, // Más temprano para chollos
            duration: 4.0,
            position: 'bottom-left'
        },
        captionsEnabled: true,
        outro: true,
        description: 'Análisis de jugador chollo (precio bajo, alto valor)'
    },

    // 📊 PLAYER STATS: Análisis de jugador específico
    player_stats: {
        needsPlayerCard: true,
        needsPlayerData: true,
        cardTiming: {
            startTime: 3.0,
            duration: 4.0,
            position: 'bottom-left'
        },
        captionsEnabled: true,
        outro: true,
        description: 'Análisis de estadísticas de jugador'
    },

    // ⚡ BREAKING NEWS: Noticias urgentes
    breaking_news: {
        needsPlayerCard: false,
        needsPlayerData: false,
        cardTiming: null,
        captionsEnabled: true,
        outro: true,
        description: 'Noticia urgente (lesión, convocatoria, etc.)'
    },

    // 📅 JORNADA PREVIEW: Preview de jornada
    jornada_preview: {
        needsPlayerCard: false,
        needsPlayerData: false,
        cardTiming: null,
        captionsEnabled: true,
        outro: true,
        description: 'Análisis de jornada completa (múltiples jugadores)'
    },

    // 🎬 GENERIC: Contenido genérico (default)
    generic: {
        needsPlayerCard: false,
        needsPlayerData: false,
        cardTiming: null,
        captionsEnabled: true,
        outro: true,
        description: 'Contenido genérico sin tipo específico'
    }
};

/**
 * Obtener reglas para un tipo de contenido
 * @param {string} contentType - Tipo de contenido
 * @returns {object} - Reglas del contenido
 */
function getRulesForContentType(contentType) {
    const rules = CONTENT_TYPE_RULES[contentType] || CONTENT_TYPE_RULES.generic;

    logger.info(`[ContentTypeRules] Reglas para "${contentType}":`, {
        needsPlayerCard: rules.needsPlayerCard,
        needsPlayerData: rules.needsPlayerData,
        captionsEnabled: rules.captionsEnabled
    });

    return rules;
}

/**
 * Determinar si un contenido necesita player card
 * @param {string} contentType - Tipo de contenido
 * @returns {boolean}
 */
function needsPlayerCard(contentType) {
    const rules = getRulesForContentType(contentType);
    return rules.needsPlayerCard;
}

/**
 * Determinar si un contenido necesita datos de jugador
 * @param {string} contentType - Tipo de contenido
 * @returns {boolean}
 */
function needsPlayerData(contentType) {
    const rules = getRulesForContentType(contentType);
    return rules.needsPlayerData;
}

/**
 * Generar configuración completa de VideoConcatenator basada en content type
 *
 * EJEMPLOS:
 * - outlier_response → playerCard: enabled, viralCaptions: enabled, outro: enabled
 * - breaking_news → playerCard: disabled, viralCaptions: enabled, outro: enabled
 *
 * @param {string} contentType - Tipo de contenido
 * @param {object} playerData - Datos del jugador (opcional)
 * @returns {object} - Configuración para VideoConcatenator.concatenateVideos()
 */
function generateConcatenatorConfig(contentType, playerData = null) {
    const rules = getRulesForContentType(contentType);

    // Validar: si necesita player card, debe tener playerData
    if (rules.needsPlayerCard && !playerData) {
        logger.warn(
            `[ContentTypeRules] ⚠️ Content type "${contentType}" requires player data but none provided`
        );
        logger.warn(`[ContentTypeRules] ⚠️ Player card will be disabled`);
    }

    const config = {
        // Player Card Overlay
        playerCard: {
            enabled: rules.needsPlayerCard && playerData !== null,
            startTime: rules.cardTiming?.startTime || 3.0,
            duration: rules.cardTiming?.duration || 4.0,
            slideInDuration: 0.5,
            applyToFirstSegment: true
        },

        // Viral Captions
        viralCaptions: {
            enabled: rules.captionsEnabled,
            applyBeforeConcatenation: true
        },

        // Outro
        outro: {
            enabled: rules.outro,
            freezeFrame: {
                enabled: true,
                duration: 0.8
            }
        },

        // Transiciones (generalmente desactivadas para frame-to-frame)
        transition: {
            enabled: false
        },

        // Audio (desactivado para evitar crossfades no deseados)
        audio: {
            fadeInOut: false
        }
    };

    // Si hay playerData, incluirlo en config
    if (playerData) {
        config.playerData = playerData;
    }

    logger.info(`[ContentTypeRules] ✅ Config generada para "${contentType}":`, {
        playerCardEnabled: config.playerCard.enabled,
        viralCaptionsEnabled: config.viralCaptions.enabled,
        outroEnabled: config.outro.enabled,
        hasPlayerData: !!playerData
    });

    return config;
}

/**
 * Obtener player data desde outlier enriched_data
 *
 * FORMATO enriched_data (desde API-Sports):
 * {
 *   players: [
 *     {
 *       id: 12345,
 *       name: "Lewandowski",
 *       team: "Barcelona",
 *       photo: "https://...",
 *       stats: {
 *         games: 10,
 *         goals: 5,
 *         assists: 2,
 *         rating: "7.5"
 *       }
 *     }
 *   ],
 *   totalFound: 1
 * }
 *
 * @param {object} enrichedData - Datos enriquecidos del outlier
 * @param {string} targetPlayer - Nombre del jugador objetivo (opcional) ✅ NUEVO
 * @returns {object|null} - Player data en formato PlayerCardOverlay
 */
function extractPlayerDataFromOutlier(enrichedData, targetPlayer = null) {
    if (!enrichedData || !enrichedData.players || enrichedData.players.length === 0) {
        logger.warn('[ContentTypeRules] ⚠️ No player data in enrichedData');
        return null;
    }

    let player = null;

    // ✅ NUEVO: Si hay targetPlayer, buscar específicamente ese jugador
    if (targetPlayer) {
        const targetPlayerLower = targetPlayer.toLowerCase();

        player = enrichedData.players.find(
            p =>
                p.name.toLowerCase().includes(targetPlayerLower) ||
                targetPlayerLower.includes(p.name.toLowerCase())
        );

        if (player) {
            logger.info(`[ContentTypeRules] 🎯 Target player encontrado: ${player.name}`, {
                targetPlayerRequested: targetPlayer,
                playerFound: player.name,
                team: player.team
            });
        } else {
            logger.warn(
                `[ContentTypeRules] ⚠️ Target player "${targetPlayer}" NO encontrado en enrichedData`
            );
            logger.warn('[ContentTypeRules] ⚠️ Usando fallback a players[0]');
        }
    }

    // Fallback: usar primer jugador si no se encontró target o no se especificó
    if (!player) {
        player = enrichedData.players[0];
        logger.info(`[ContentTypeRules] ✅ Player data extraído (fallback): ${player.name}`, {
            id: player.id,
            team: player.team,
            hasPhoto: !!player.photo,
            hasStats: !!player.stats
        });
    }

    // Formatear para PlayerCardOverlay
    return {
        id: player.id,
        name: player.name,
        team: player.team,
        photo: player.photo,
        teamLogo: player.teamLogo || null,
        position: player.position || null,
        stats: {
            games: player.stats?.games || 0,
            goals: player.stats?.goals || 0,
            rating: player.stats?.rating ? parseFloat(player.stats.rating).toFixed(1) : '0.0'
        }
    };
}

/**
 * Listar todos los content types disponibles
 * @returns {Array} - Array de objetos {type, description, needsPlayerCard}
 */
function listContentTypes() {
    return Object.entries(CONTENT_TYPE_RULES).map(([type, rules]) => ({
        type,
        description: rules.description,
        needsPlayerCard: rules.needsPlayerCard,
        needsPlayerData: rules.needsPlayerData,
        captionsEnabled: rules.captionsEnabled
    }));
}

module.exports = {
    getRulesForContentType,
    needsPlayerCard,
    needsPlayerData,
    generateConcatenatorConfig,
    extractPlayerDataFromOutlier,
    listContentTypes,
    CONTENT_TYPE_RULES
};
