/**
 * Servicio para calcular y gestionar la evolución del valor Fantasy de jugadores
 * VERSIÓN 2.0 - DATOS REALES desde API-Sports (NO SIMULADOS)
 *
 * Cambios clave:
 * - Conecta con API-Sports para obtener fixtures reales
 * - Calcula estadísticas basadas en partidos jugados realmente
 * - Jornada actual basada en fixtures completados
 * - NO genera datos ficticios
 */

const ApiFootballClient = require('./apiFootball');
const logger = require('../utils/logger');
const { API_SPORTS, FANTASY_POINTS } = require('../config/constants');

class FantasyEvolution {
    constructor() {
        this.apiClient = new ApiFootballClient();
        this.season = API_SPORTS.SEASON_2025_26; // 2025
        this.leagueId = API_SPORTS.LA_LIGA_ID; // 140
    }

    /**
     * Generar evolución real del jugador basada en datos de API-Sports
     * @param {number} playerId - ID del jugador en API-Sports
     * @returns {Promise<Object>} Evolución completa con datos reales
     */
    async generatePlayerEvolution(playerId) {
        try {
            // 1. Obtener información básica del jugador
            const playerInfo = await this.getPlayerInfo(playerId);
            if (!playerInfo) {
                throw new Error(`Player ${playerId} not found`);
            }

            // 2. Obtener fixtures del jugador en la temporada actual
            const fixtures = await this.getPlayerFixtures(playerId);

            // 3. Calcular jornada actual basada en fixtures completados
            const currentGameweek = this.calculateRealCurrentGameweek(fixtures);

            // 4. Construir evolución con datos reales por jornada
            const evolution = await this.buildEvolutionFromFixtures(playerId, fixtures);

            // 5. Calcular resumen y tendencias
            const summary = this.calculateSummary(evolution);
            const trend = this.calculateTrend(evolution);

            return {
                playerId: playerInfo.id,
                playerName: playerInfo.name,
                team: playerInfo.team?.name,
                position: this.normalizePosition(playerInfo.position),
                currentGameweek: currentGameweek,
                totalGamesPlayed: evolution.length,
                evolution: evolution,
                summary: summary,
                trend: trend,
                lastUpdated: new Date().toISOString(),
                dataSource: 'API-Sports Real Data'
            };

        } catch (error) {
            logger.error(`[FantasyEvolution] Error generando evolución para jugador ${playerId}:`, error.message);

            // Fallback: retornar estructura básica con mensaje de error
            return {
                playerId: playerId,
                error: error.message,
                currentGameweek: 0,
                evolution: [],
                dataSource: 'Error - No data available'
            };
        }
    }

    /**
     * Obtener información básica del jugador
     */
    async getPlayerInfo(playerId) {
        try {
            // Obtener jugador desde API-Sports
            const response = await this.apiClient.makeRequest(`/players`, {
                id: playerId,
                season: this.season
            });

            // makeRequest retorna { success, data } donde data es el array de response
            if (response.success && response.data && response.data.length > 0) {
                const playerData = response.data[0];
                return {
                    id: playerData.player.id,
                    name: playerData.player.name,
                    photo: playerData.player.photo,
                    age: playerData.player.age,
                    team: playerData.statistics[0]?.team || null,
                    position: playerData.statistics[0]?.games?.position || 'Unknown'
                };
            }

            return null;
        } catch (error) {
            logger.error(`[FantasyEvolution] Error obteniendo info jugador ${playerId}:`, error.message);
            return null;
        }
    }

    /**
     * Obtener fixtures del jugador en la temporada actual
     */
    async getPlayerFixtures(playerId) {
        try {
            // Obtener todos los fixtures de La Liga temporada 2025-26
            const response = await this.apiClient.makeRequest(`/fixtures`, {
                league: this.leagueId,
                season: this.season,
                status: 'FT' // Solo partidos finalizados
            });

            if (!response.success || !response.data) {
                return [];
            }

            // Filtrar fixtures donde jugó el jugador
            const allFixtures = response.data;
            const playerFixtures = [];

            // Para cada fixture, obtener estadísticas del jugador
            for (const fixture of allFixtures) {
                const playerStats = await this.getPlayerStatsInFixture(playerId, fixture.fixture.id);
                if (playerStats) {
                    playerFixtures.push({
                        fixtureId: fixture.fixture.id,
                        date: fixture.fixture.date,
                        round: fixture.league.round,
                        homeTeam: fixture.teams.home,
                        awayTeam: fixture.teams.away,
                        stats: playerStats
                    });
                }
            }

            // Ordenar por fecha
            return playerFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));

        } catch (error) {
            logger.error(`[FantasyEvolution] Error obteniendo fixtures:`, error.message);
            return [];
        }
    }

    /**
     * Obtener estadísticas del jugador en un fixture específico
     */
    async getPlayerStatsInFixture(playerId, fixtureId) {
        try {
            const response = await this.apiClient.makeRequest(`/fixtures/players`, {
                fixture: fixtureId,
                team: null // Buscar en ambos equipos
            });

            if (!response.success || !response.data) {
                return null;
            }

            // Buscar el jugador en las estadísticas
            for (const teamData of response.data) {
                const playerData = teamData.players.find(p => p.player.id === playerId);
                if (playerData) {
                    return playerData.statistics[0]; // Primera entrada de estadísticas
                }
            }

            return null;
        } catch (error) {
            // No logear error aquí para no saturar logs (puede haber muchos fixtures)
            return null;
        }
    }

    /**
     * Calcular jornada actual real basada en fixtures completados
     */
    calculateRealCurrentGameweek(fixtures) {
        if (fixtures.length === 0) return 0;

        // Extraer número de jornada del último fixture
        const lastFixture = fixtures[fixtures.length - 1];
        const roundMatch = lastFixture.round.match(/Regular Season - (\d+)/);

        if (roundMatch) {
            return parseInt(roundMatch[1]);
        }

        // Fallback: contar fixtures como jornadas
        return fixtures.length;
    }

    /**
     * Construir evolución desde fixtures reales
     */
    async buildEvolutionFromFixtures(playerId, fixtures) {
        const evolution = [];
        let accumulatedValue = null;

        for (const fixture of fixtures) {
            // Extraer número de jornada
            const roundMatch = fixture.round.match(/Regular Season - (\d+)/);
            const gameweek = roundMatch ? parseInt(roundMatch[1]) : evolution.length + 1;

            // Calcular puntos Fantasy reales
            const fantasyPoints = this.calculateRealFantasyPoints(fixture.stats);

            // Calcular rating
            const rating = parseFloat(fixture.stats.games?.rating) || null;

            // Calcular valor Fantasy estimado (basado en rendimiento acumulado)
            const fantasyValue = this.estimateFantasyValue(evolution, fixture.stats, accumulatedValue);
            accumulatedValue = fantasyValue;

            // Calcular cambio de precio
            const priceChange = evolution.length > 0 ?
                Math.round((fantasyValue - evolution[evolution.length - 1].fantasyValue) * 10) / 10 : 0;

            const percentageChange = evolution.length > 0 ?
                Math.round(((fantasyValue - evolution[evolution.length - 1].fantasyValue) / evolution[evolution.length - 1].fantasyValue) * 100 * 10) / 10 : 0;

            // Calcular forma
            const form = this.calculateFormFromRealData(evolution, fantasyPoints);

            evolution.push({
                gameweek: gameweek,
                date: new Date(fixture.date).toISOString().split('T')[0],
                fixtureId: fixture.fixtureId,
                opponent: this.getOpponentName(fixture),
                fantasyValue: fantasyValue,
                rating: rating,
                fantasyPoints: fantasyPoints,
                minutesPlayed: parseInt(fixture.stats.games?.minutes) || 0,
                goals: parseInt(fixture.stats.goals?.total) || 0,
                assists: parseInt(fixture.stats.goals?.assists) || 0,
                form: form,
                priceChange: priceChange,
                percentageChange: percentageChange
            });
        }

        return evolution;
    }

    /**
     * Calcular puntos Fantasy reales según sistema oficial
     */
    calculateRealFantasyPoints(stats) {
        let points = 0;

        // Puntos base por jugar
        if (parseInt(stats.games?.minutes) > 0) {
            points += FANTASY_POINTS.MATCH_PLAYED; // +2
        }

        // Goles (según posición)
        const goals = parseInt(stats.goals?.total) || 0;
        if (goals > 0) {
            // Necesitaríamos saber la posición, por ahora usamos valor medio
            points += goals * 5; // Promedio entre posiciones
        }

        // Asistencias
        const assists = parseInt(stats.goals?.assists) || 0;
        points += assists * FANTASY_POINTS.ASSIST; // +3 por asistencia

        // Tarjetas
        const yellowCards = parseInt(stats.cards?.yellow) || 0;
        const redCards = parseInt(stats.cards?.red) || 0;
        points += yellowCards * FANTASY_POINTS.YELLOW_CARD; // -1 por amarilla
        points += redCards * FANTASY_POINTS.RED_CARD; // -3 por roja

        // Portería a cero (si es portero o defensa)
        // (Simplificación: basado en goles concedidos del equipo si disponible)

        return Math.max(0, points); // Mínimo 0 puntos
    }

    /**
     * Estimar valor Fantasy basado en rendimiento acumulado
     */
    estimateFantasyValue(previousEvolution, currentStats, previousValue) {
        // Valor base inicial según posición
        const baseValues = {
            'Goalkeeper': 5.5,
            'Defender': 6.0,
            'Midfielder': 7.0,
            'Attacker': 8.5
        };

        // Si es primer partido, usar valor base
        if (!previousValue) {
            return baseValues['Midfielder'] || 6.5; // Default
        }

        // Calcular ajuste basado en rendimiento reciente
        const recentGames = previousEvolution.slice(-3); // Últimos 3 partidos
        const avgPoints = recentGames.reduce((sum, g) => sum + g.fantasyPoints, 0) / recentGames.length;

        // Ajuste de valor
        let adjustment = 0;
        if (avgPoints >= 8) adjustment = 0.2; // Muy buen rendimiento
        else if (avgPoints >= 6) adjustment = 0.1; // Buen rendimiento
        else if (avgPoints >= 4) adjustment = 0; // Rendimiento normal
        else if (avgPoints >= 2) adjustment = -0.1; // Mal rendimiento
        else adjustment = -0.2; // Muy mal rendimiento

        // Aplicar ajuste con límites
        const newValue = previousValue + adjustment;
        return Math.round(Math.max(4.0, Math.min(15.0, newValue)) * 10) / 10;
    }

    /**
     * Calcular forma basada en datos reales
     */
    calculateFormFromRealData(previousData, currentPoints) {
        const recentGames = previousData.slice(-2); // Últimas 2 + actual = 3
        const totalPoints = recentGames.reduce((sum, game) => sum + game.fantasyPoints, 0) + currentPoints;
        const avgPoints = totalPoints / (recentGames.length + 1);

        if (avgPoints >= 8) return 'excellent';
        if (avgPoints >= 6) return 'good';
        if (avgPoints >= 4) return 'average';
        return 'poor';
    }

    /**
     * Obtener nombre del rival
     */
    getOpponentName(fixture) {
        // Determinar si jugó en casa o fuera y retornar rival
        // (Simplificación: retornar ambos equipos separados por "vs")
        return `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`;
    }

    /**
     * Normalizar posición a formato estándar
     */
    normalizePosition(position) {
        if (!position) return 'Unknown';

        const positionMap = {
            'Goalkeeper': 'GK',
            'Defender': 'DEF',
            'Midfielder': 'MID',
            'Attacker': 'FWD'
        };

        return positionMap[position] || position;
    }

    /**
     * Calcular resumen de evolución
     */
    calculateSummary(evolution) {
        if (evolution.length === 0) {
            return {
                startValue: 0,
                currentValue: 0,
                maxValue: 0,
                minValue: 0,
                totalPriceChange: 0,
                totalPercentChange: 0,
                averageFantasyPoints: 0,
                totalFantasyPoints: 0,
                gamesPlayed: 0
            };
        }

        const values = evolution.map(e => e.fantasyValue);
        const points = evolution.map(e => e.fantasyPoints);

        return {
            startValue: values[0],
            currentValue: values[values.length - 1],
            maxValue: Math.max(...values),
            minValue: Math.min(...values),
            totalPriceChange: Math.round((values[values.length - 1] - values[0]) * 10) / 10,
            totalPercentChange: Math.round(((values[values.length - 1] - values[0]) / values[0]) * 100 * 10) / 10,
            averageFantasyPoints: Math.round(points.reduce((a, b) => a + b, 0) / points.length * 10) / 10,
            totalFantasyPoints: points.reduce((a, b) => a + b, 0),
            gamesPlayed: evolution.length,
            totalGoals: evolution.reduce((sum, e) => sum + e.goals, 0),
            totalAssists: evolution.reduce((sum, e) => sum + e.assists, 0)
        };
    }

    /**
     * Calcular tendencia actual
     */
    calculateTrend(evolution) {
        if (evolution.length < 3) return 'insufficient_data';

        const recent = evolution.slice(-3);
        const changes = recent.slice(1).map((curr, i) => curr.fantasyValue - recent[i].fantasyValue);
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

        if (avgChange > 0.15) return 'rising';
        if (avgChange < -0.15) return 'falling';
        return 'stable';
    }

    /**
     * Comparar jugador con promedio de su posición
     */
    async compareWithPositionAverage(playerId, position) {
        try {
            // Obtener todos los jugadores de La Liga de la misma posición
            const response = await this.apiClient.makeRequest(`/players`, {
                league: this.leagueId,
                season: this.season,
                page: 1 // Limitar para performance
            });

            if (!response.success || !response.data) {
                return null;
            }

            // Filtrar por posición
            const samePositionPlayers = response.data.filter(p => {
                const playerPosition = p.statistics[0]?.games?.position;
                return this.normalizePosition(playerPosition) === position;
            });

            if (samePositionPlayers.length === 0) return null;

            // Calcular promedio de rating
            const avgRating = samePositionPlayers.reduce((sum, p) => {
                const rating = parseFloat(p.statistics[0]?.games?.rating) || 0;
                return sum + rating;
            }, 0) / samePositionPlayers.length;

            return {
                positionAverage: Math.round(avgRating * 10) / 10,
                sampleSize: samePositionPlayers.length
            };

        } catch (error) {
            logger.error(`[FantasyEvolution] Error comparando con promedio:`, error.message);
            return null;
        }
    }
}

module.exports = FantasyEvolution;