const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Cargar configuración de Supabase desde .env.supabase
require('dotenv').config({ path: '.env.supabase' });

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env.supabase');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Servicio para obtener chollos directamente desde Supabase
 * Usa datos de temporada 2025-26 almacenados en la base de datos
 */
class SupabaseBargainsService {
    /**
     * Obtener chollos desde Supabase (temporada actual)
     * @param {number} limit - Número de chollos a obtener
     * @returns {Promise<Array>} - Array de chollos con datos completos
     */
    async getBargains(limit = 10) {
        try {
            logger.info(`[SupabaseBargains] Obteniendo ${limit} chollos desde Supabase...`);

            // Query a tabla de jugadores con join a stats
            const { data, error } = await supabase
                .from('players')
                .select(`
                    id,
                    name,
                    photo,
                    team_id,
                    position,
                    player_stats!inner (
                        games_appearences,
                        goals_total,
                        games_rating
                    )
                `)
                .not('player_stats', 'is', null)
                .limit(limit);

            if (error) {
                throw new Error(`Supabase error: ${error.message}`);
            }

            logger.info(`[SupabaseBargains] ✅ ${data.length} jugadores obtenidos`);

            // Transformar a formato esperado
            return data.map(player => ({
                id: player.id,
                name: player.name,
                photo: player.photo,
                stats: {
                    games: player.player_stats[0]?.games_appearences || 0,
                    goals: player.player_stats[0]?.goals_total || 0,
                    rating: player.player_stats[0]?.games_rating || '0.00'
                }
            }));

        } catch (error) {
            logger.error(`[SupabaseBargains] Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Buscar un jugador específico por nombre
     * @param {string} playerName - Nombre del jugador
     * @returns {Promise<object|null>} - Datos del jugador o null
     */
    async getPlayerByName(playerName) {
        try {
            logger.info(`[SupabaseBargains] Buscando jugador: ${playerName}`);

            const { data, error } = await supabase
                .from('players')
                .select(`
                    id,
                    name,
                    photo,
                    player_stats (
                        games_appearences,
                        goals_total,
                        games_rating
                    )
                `)
                .ilike('name', `%${playerName}%`)
                .limit(1)
                .single();

            if (error) {
                logger.warn(`[SupabaseBargains] Jugador no encontrado: ${playerName}`);
                return null;
            }

            logger.info(`[SupabaseBargains] ✅ Jugador encontrado: ${data.name}`);

            return {
                id: data.id,
                name: data.name,
                photo: data.photo,
                stats: {
                    games: data.player_stats?.[0]?.games_appearences || 0,
                    goals: data.player_stats?.[0]?.goals_total || 0,
                    rating: data.player_stats?.[0]?.games_rating || '0.00'
                }
            };

        } catch (error) {
            logger.error(`[SupabaseBargains] Error buscando jugador: ${error.message}`);
            return null;
        }
    }
}

module.exports = SupabaseBargainsService;
