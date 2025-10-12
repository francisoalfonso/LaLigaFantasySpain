/**
 * Player Name Normalizer
 *
 * Normaliza nombres de jugadores transcritos (con errores fonéticos)
 * a nombres oficiales de La Liga usando API-Sports
 *
 * Ejemplo:
 * "Bryce Méndez" → "Brais Méndez" (Real Sociedad)
 * "Lewandoski" → "Robert Lewandowski" (Barcelona)
 */

const logger = require('../../utils/logger');
const PlayersManager = require('../playersManager');

class PlayerNameNormalizer {
    constructor() {
        this.playersManager = new PlayersManager();
    }

    /**
     * Normalizar lista de jugadores
     *
     * @param {Array} players - Lista de jugadores con nombres incorrectos
     * @returns {Promise<Array>} Lista con nombres corregidos
     */
    async normalizePlayers(players) {
        if (!players || !Array.isArray(players) || players.length === 0) {
            return [];
        }

        try {
            logger.info('[PlayerNormalizer] Normalizando jugadores', {
                count: players.length
            });

            // Obtener jugadores de La Liga (con cache)
            const allPlayers = await this._getLaLigaPlayers();

            const normalized = players.map(player => {
                const name = player.name || player;
                const position = player.position || null;

                // Buscar mejor match
                const match = this._findBestMatch(name, position, allPlayers);

                if (match) {
                    return {
                        name: match.name,
                        originalName: name,
                        team: match.team,
                        position: match.position,
                        playerId: match.id,
                        photo: match.photo,
                        confidence: match.confidence,
                        mentioned_count: player.mentioned_count || 1
                    };
                }

                // No match encontrado, retornar original con warning
                logger.warn('[PlayerNormalizer] No se encontró match', { name });
                return {
                    name: name,
                    originalName: name,
                    team: 'Unknown',
                    position: position || 'Unknown',
                    playerId: null,
                    photo: null,
                    confidence: 0,
                    mentioned_count: player.mentioned_count || 1
                };
            });

            const corrected = normalized.filter(p => p.playerId !== null).length;
            logger.info('[PlayerNormalizer] ✅ Normalización completada', {
                total: players.length,
                corrected,
                failed: players.length - corrected
            });

            return normalized;
        } catch (error) {
            logger.error('[PlayerNormalizer] Error normalizando jugadores', {
                error: error.message
            });
            // Retornar jugadores originales en caso de error
            return players.map(p => ({
                name: p.name || p,
                originalName: p.name || p,
                team: 'Unknown',
                position: p.position || 'Unknown',
                playerId: null,
                photo: null,
                confidence: 0,
                mentioned_count: p.mentioned_count || 1
            }));
        }
    }

    /**
     * Obtener jugadores de La Liga (usando PlayersManager con cache)
     *
     * @private
     * @returns {Promise<Array>} Jugadores de La Liga
     */
    async _getLaLigaPlayers() {
        logger.info('[PlayerNormalizer] Cargando jugadores desde PlayersManager');

        try {
            // Usar PlayersManager que tiene cache automático de 2 horas
            const result = await this.playersManager.getAllPlayers();

            if (!result.success || !result.data || result.data.length === 0) {
                logger.warn('[PlayerNormalizer] No se pudieron cargar jugadores, usando fallback');
                return await this._getFallbackPlayers();
            }

            // PlayersManager ya devuelve datos aplanados, no necesitamos acceder a .player
            const players = result.data
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    team: p.team?.name,
                    position: this._normalizePosition(p.position),
                    photo: p.photo,
                    age: p.age
                }))
                // Filtrar jugadores sin nombre (datos incompletos)
                .filter(p => p.name && typeof p.name === 'string');

            logger.info('[PlayerNormalizer] ✅ Jugadores cargados desde PlayersManager', {
                count: players.length,
                cached: result.cached
            });

            return players;
        } catch (error) {
            logger.error('[PlayerNormalizer] Error cargando jugadores desde PlayersManager', {
                error: error.message
            });
            return this._getFallbackPlayers();
        }
    }

    /**
     * Buscar mejor match usando fuzzy matching + contexto
     *
     * @private
     * @param {string} name - Nombre transcrito
     * @param {string} position - Posición del jugador
     * @param {Array} allPlayers - Lista de todos los jugadores
     * @returns {Object|null} Mejor match encontrado
     */
    _findBestMatch(name, position, allPlayers) {
        if (!name || typeof name !== 'string') {
            return null;
        }

        const nameLower = name.toLowerCase().trim();

        // 1. Buscar coincidencia exacta
        const exactMatch = allPlayers.find(
            p => p.name && typeof p.name === 'string' && p.name.toLowerCase() === nameLower
        );
        if (exactMatch) {
            return { ...exactMatch, confidence: 1.0 };
        }

        // 2. Fuzzy matching
        const matches = allPlayers
            .filter(p => p.name && typeof p.name === 'string')
            .map(player => {
                const similarity = this._calculateSimilarity(nameLower, player.name.toLowerCase());

                // Bonus si la posición coincide
                let positionBonus = 0;
                if (position && player.position) {
                    if (
                        position.toLowerCase().includes(player.position.toLowerCase()) ||
                        player.position.toLowerCase().includes(position.toLowerCase())
                    ) {
                        positionBonus = 0.1;
                    }
                }

                return {
                    ...player,
                    confidence: Math.min(similarity + positionBonus, 1.0)
                };
            });

        // Ordenar por confidence
        matches.sort((a, b) => b.confidence - a.confidence);

        // Retornar mejor match si confidence > 0.6
        if (matches[0] && matches[0].confidence > 0.6) {
            return matches[0];
        }

        return null;
    }

    /**
     * Calcular similitud entre dos strings (Levenshtein distance normalizado)
     *
     * @private
     * @param {string} s1 - String 1
     * @param {string} s2 - String 2
     * @returns {number} Similitud 0-1
     */
    _calculateSimilarity(s1, s2) {
        // Implementación simple de Levenshtein distance
        const len1 = s1.length;
        const len2 = s2.length;

        if (len1 === 0) {
            return len2 === 0 ? 1 : 0;
        }
        if (len2 === 0) {
            return 0;
        }

        const matrix = [];

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return 1 - distance / maxLen;
    }

    /**
     * Normalizar posición
     *
     * @private
     * @param {string} position - Posición raw
     * @returns {string} Posición normalizada
     */
    _normalizePosition(position) {
        if (!position) {
            return 'Unknown';
        }

        const pos = position.toLowerCase();

        if (pos.includes('goalkeeper') || pos.includes('portero')) {
            return 'Portero';
        }
        if (pos.includes('defender') || pos.includes('defensa')) {
            return 'Defensa';
        }
        if (pos.includes('midfielder') || pos.includes('centro') || pos.includes('medio')) {
            return 'Centrocampista';
        }
        if (pos.includes('attacker') || pos.includes('forward') || pos.includes('delantero')) {
            return 'Delantero';
        }

        return position;
    }

    /**
     * Obtener jugadores de fallback (lista hardcoded top players)
     *
     * @private
     * @returns {Promise<Array>} Lista de jugadores fallback
     */
    async _getFallbackPlayers() {
        logger.warn('[PlayerNormalizer] Usando lista fallback de jugadores La Liga');

        // Lista extendida de jugadores La Liga 2025-26 (top 50)
        return [
            // Barcelona
            {
                id: 1,
                name: 'Robert Lewandowski',
                team: 'Barcelona',
                position: 'Delantero',
                photo: null
            },
            { id: 2, name: 'Raphinha', team: 'Barcelona', position: 'Delantero', photo: null },
            { id: 3, name: 'Pedri', team: 'Barcelona', position: 'Centrocampista', photo: null },
            { id: 4, name: 'Gavi', team: 'Barcelona', position: 'Centrocampista', photo: null },
            {
                id: 5,
                name: 'Marc-André ter Stegen',
                team: 'Barcelona',
                position: 'Portero',
                photo: null
            },
            { id: 6, name: 'Jules Koundé', team: 'Barcelona', position: 'Defensa', photo: null },
            { id: 7, name: 'Ronald Araújo', team: 'Barcelona', position: 'Defensa', photo: null },

            // Real Madrid
            {
                id: 10,
                name: 'Vinícius Júnior',
                team: 'Real Madrid',
                position: 'Delantero',
                photo: null
            },
            {
                id: 11,
                name: 'Kylian Mbappé',
                team: 'Real Madrid',
                position: 'Delantero',
                photo: null
            },
            {
                id: 12,
                name: 'Jude Bellingham',
                team: 'Real Madrid',
                position: 'Centrocampista',
                photo: null
            },
            {
                id: 13,
                name: 'Luka Modrić',
                team: 'Real Madrid',
                position: 'Centrocampista',
                photo: null
            },
            {
                id: 14,
                name: 'Federico Valverde',
                team: 'Real Madrid',
                position: 'Centrocampista',
                photo: null
            },
            {
                id: 15,
                name: 'Thibaut Courtois',
                team: 'Real Madrid',
                position: 'Portero',
                photo: null
            },
            {
                id: 16,
                name: 'Antonio Rüdiger',
                team: 'Real Madrid',
                position: 'Defensa',
                photo: null
            },
            {
                id: 17,
                name: 'Dani Carvajal',
                team: 'Real Madrid',
                position: 'Defensa',
                photo: null
            },

            // Atlético Madrid
            {
                id: 20,
                name: 'Antoine Griezmann',
                team: 'Atlético Madrid',
                position: 'Delantero',
                photo: null
            },
            {
                id: 21,
                name: 'Álvaro Morata',
                team: 'Atlético Madrid',
                position: 'Delantero',
                photo: null
            },
            {
                id: 22,
                name: 'Ángel Correa',
                team: 'Atlético Madrid',
                position: 'Delantero',
                photo: null
            },
            {
                id: 23,
                name: 'Koke',
                team: 'Atlético Madrid',
                position: 'Centrocampista',
                photo: null
            },
            {
                id: 24,
                name: 'Jan Oblak',
                team: 'Atlético Madrid',
                position: 'Portero',
                photo: null
            },

            // Real Sociedad
            {
                id: 30,
                name: 'Brais Méndez',
                team: 'Real Sociedad',
                position: 'Centrocampista',
                photo: null
            },
            {
                id: 31,
                name: 'Mikel Oyarzabal',
                team: 'Real Sociedad',
                position: 'Delantero',
                photo: null
            },
            {
                id: 32,
                name: 'Alexander Sørloth',
                team: 'Real Sociedad',
                position: 'Delantero',
                photo: null
            },
            {
                id: 33,
                name: 'Martín Zubimendi',
                team: 'Real Sociedad',
                position: 'Centrocampista',
                photo: null
            },

            // Villarreal
            { id: 40, name: 'Ayoze Pérez', team: 'Villarreal', position: 'Delantero', photo: null },
            {
                id: 41,
                name: 'Gerard Moreno',
                team: 'Villarreal',
                position: 'Delantero',
                photo: null
            },
            {
                id: 42,
                name: 'Álex Baena',
                team: 'Villarreal',
                position: 'Centrocampista',
                photo: null
            },

            // Athletic Bilbao
            {
                id: 50,
                name: 'Iñaki Williams',
                team: 'Athletic Bilbao',
                position: 'Delantero',
                photo: null
            },
            {
                id: 51,
                name: 'Nico Williams',
                team: 'Athletic Bilbao',
                position: 'Delantero',
                photo: null
            },
            {
                id: 52,
                name: 'Oihan Sancet',
                team: 'Athletic Bilbao',
                position: 'Centrocampista',
                photo: null
            },

            // Sevilla
            {
                id: 60,
                name: 'Youssef En-Nesyri',
                team: 'Sevilla',
                position: 'Delantero',
                photo: null
            },
            {
                id: 61,
                name: 'Lucas Ocampos',
                team: 'Sevilla',
                position: 'Centrocampista',
                photo: null
            },
            { id: 62, name: 'Isaac Romero', team: 'Sevilla', position: 'Delantero', photo: null },

            // Valencia
            { id: 70, name: 'Hugo Duro', team: 'Valencia', position: 'Delantero', photo: null },
            { id: 71, name: 'Pepelu', team: 'Valencia', position: 'Centrocampista', photo: null },
            {
                id: 72,
                name: 'Javi Guerra',
                team: 'Valencia',
                position: 'Centrocampista',
                photo: null
            },

            // Betis
            {
                id: 80,
                name: 'Borja Iglesias',
                team: 'Real Betis',
                position: 'Delantero',
                photo: null
            },
            { id: 81, name: 'Isco', team: 'Real Betis', position: 'Centrocampista', photo: null },
            {
                id: 82,
                name: 'Nabil Fekir',
                team: 'Real Betis',
                position: 'Centrocampista',
                photo: null
            },

            // Celta de Vigo
            {
                id: 90,
                name: 'Iago Aspas',
                team: 'Celta de Vigo',
                position: 'Delantero',
                photo: null
            },
            {
                id: 91,
                name: 'Jørgen Strand Larsen',
                team: 'Celta de Vigo',
                position: 'Delantero',
                photo: null
            },

            // Girona
            { id: 100, name: 'Artem Dovbyk', team: 'Girona', position: 'Delantero', photo: null },
            {
                id: 101,
                name: 'Yangel Herrera',
                team: 'Girona',
                position: 'Centrocampista',
                photo: null
            },
            { id: 102, name: 'Sávio', team: 'Girona', position: 'Delantero', photo: null }
        ];
    }
}

module.exports = new PlayerNameNormalizer();
