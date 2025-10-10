const BargainAnalyzer = require('./bargainAnalyzer');
const logger = require('../utils/logger');

/**
 * Servicio para obtener datos de chollos ya procesados
 * OPTIMIZADO: Usa el caché de BargainAnalyzer (30min TTL)
 * - Primera llamada: 30s (calcula todos los chollos)
 * - Siguientes llamadas: <1s (usa caché)
 */
class BargainsDataService {
    constructor() {
        this.analyzer = new BargainAnalyzer();
    }

    /**
     * Obtener un chollo específico por nombre de jugador
     * @param {string} playerName - Nombre del jugador
     * @returns {Promise<object|null>} - Datos del chollo formateados para tarjeta
     */
    async getBargainByPlayerName(playerName) {
        try {
            logger.info(`[BargainsData] Buscando chollo para: ${playerName}`);

            // Obtener chollos (usa caché automáticamente si disponible)
            const result = await this.analyzer.identifyBargains(50);

            if (!result.success) {
                logger.error(`[BargainsData] Error obteniendo chollos: ${result.error}`);
                return null;
            }

            // Buscar el jugador en los resultados
            const bargain = result.data.find(b =>
                b.player &&
                b.player.name &&
                b.player.name.toLowerCase().includes(playerName.toLowerCase())
            );

            if (!bargain) {
                logger.warn(`[BargainsData] Jugador no encontrado: ${playerName}`);
                return null;
            }

            // Formatear datos para la tarjeta
            const formatted = {
                id: bargain.player.id,
                name: bargain.player.name,
                photo: bargain.player.photo,
                team: bargain.player.team?.name || 'Unknown',
                position: bargain.player.position,
                stats: {
                    games: bargain.player.stats?.games?.appearences || 0,
                    goals: bargain.player.stats?.goals?.total || 0,
                    rating: bargain.player.stats?.games?.rating
                        ? parseFloat(bargain.player.stats.games.rating).toFixed(2)
                        : '0.00'
                }
            };

            logger.info(`[BargainsData] ✅ Chollo encontrado (desde ${result.metadata?.cached ? 'CACHÉ' : 'API'}): ${formatted.name} - ${formatted.stats.games}J, ${formatted.stats.goals}G, ${formatted.stats.rating}R`);

            return formatted;

        } catch (error) {
            logger.error(`[BargainsData] Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Obtener el primer chollo disponible
     * @returns {Promise<object|null>} - Datos del primer chollo
     */
    async getTopBargain() {
        try {
            logger.info(`[BargainsData] Obteniendo top chollo...`);

            const result = await this.analyzer.identifyBargains(1);

            if (!result.success || result.data.length === 0) {
                logger.warn(`[BargainsData] No hay chollos disponibles`);
                return null;
            }

            const bargain = result.data[0];

            const formatted = {
                id: bargain.player.id,
                name: bargain.player.name,
                photo: bargain.player.photo,
                team: bargain.player.team?.name || 'Unknown',
                position: bargain.player.position,
                stats: {
                    games: bargain.player.stats?.games?.appearences || 0,
                    goals: bargain.player.stats?.goals?.total || 0,
                    rating: bargain.player.stats?.games?.rating
                        ? parseFloat(bargain.player.stats.games.rating).toFixed(2)
                        : '0.00'
                }
            };

            logger.info(`[BargainsData] ✅ Top chollo (desde ${result.metadata?.cached ? 'CACHÉ' : 'API'}): ${formatted.name}`);

            return formatted;

        } catch (error) {
            logger.error(`[BargainsData] Error: ${error.message}`);
            return null;
        }
    }
}

module.exports = BargainsDataService;
