const axios = require('axios');
const logger = require('../utils/logger');

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE_URL = 'https://v3.football.api-sports.io';
const SEASON = 2024; // Usar 2024 hasta que API-Sports tenga datos de 2025-26
const LEAGUE_ID = 140; // La Liga

/**
 * PlayerStatsService
 *
 * Obtiene estadísticas REALES de jugadores desde API-Sports
 * Para tarjetas de jugador en videos
 */
class PlayerStatsService {
    /**
     * Obtener estadísticas de un jugador por ID
     * @param {number} playerId - ID del jugador en API-Sports
     * @returns {Promise<object>} - Datos del jugador { id, name, photo, stats: { games, goals, rating } }
     */
    async getPlayerStats(playerId) {
        try {
            logger.info(`[PlayerStatsService] Obteniendo stats para player ID: ${playerId}`);

            const response = await axios.get(`${API_BASE_URL}/players`, {
                headers: { 'x-apisports-key': API_FOOTBALL_KEY },
                params: {
                    id: playerId,
                    season: SEASON,
                    league: LEAGUE_ID
                },
                timeout: 10000
            });

            if (!response.data || !response.data.response || response.data.response.length === 0) {
                throw new Error(`Player ${playerId} no encontrado en API-Sports`);
            }

            const playerData = response.data.response[0];
            const player = playerData.player;
            const statistics = playerData.statistics[0]; // Primera estadística (La Liga)

            const result = {
                id: player.id,
                name: player.name,
                photo: player.photo,
                stats: {
                    games: statistics.games.appearences || 0,
                    goals: statistics.goals.total || 0,
                    rating: statistics.games.rating
                        ? parseFloat(statistics.games.rating).toFixed(2)
                        : '0.00'
                }
            };

            logger.info(`[PlayerStatsService] ✅ Stats obtenidas: ${player.name} - ${result.stats.games} partidos, ${result.stats.goals} goles, ${result.stats.rating} rating`);

            return result;

        } catch (error) {
            logger.error(`[PlayerStatsService] Error obteniendo stats: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de un jugador por nombre
     * @param {string} playerName - Nombre del jugador
     * @returns {Promise<object>} - Datos del jugador
     */
    async getPlayerStatsByName(playerName) {
        try {
            logger.info(`[PlayerStatsService] Buscando player por nombre: ${playerName}`);

            // 1. Buscar jugador por nombre
            const searchResponse = await axios.get(`${API_BASE_URL}/players`, {
                headers: { 'x-apisports-key': API_FOOTBALL_KEY },
                params: {
                    search: playerName,
                    season: SEASON,
                    league: LEAGUE_ID
                },
                timeout: 10000
            });

            if (!searchResponse.data || !searchResponse.data.response || searchResponse.data.response.length === 0) {
                throw new Error(`Player "${playerName}" no encontrado`);
            }

            // 2. Tomar el primer resultado (mejor match)
            const firstResult = searchResponse.data.response[0];
            const playerId = firstResult.player.id;

            logger.info(`[PlayerStatsService] Player encontrado: ${firstResult.player.name} (ID: ${playerId})`);

            // 3. Obtener estadísticas completas
            return await this.getPlayerStats(playerId);

        } catch (error) {
            logger.error(`[PlayerStatsService] Error buscando por nombre: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PlayerStatsService;
