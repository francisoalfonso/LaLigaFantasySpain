// Cliente para API-Football (RapidAPI)
// ⚠️ CONFIGURADO PARA TEMPORADA 2025-26 ⚠️
const axios = require('axios');
const logger = require('../utils/logger');
const recentMatchesCache = require('./recentMatchesCache');

class ApiFootballClient {
    constructor() {
        this.apiKey = process.env.API_FOOTBALL_KEY;
        this.baseURL = 'https://v3.football.api-sports.io';
        this.rateLimitDelay = 1000; // 1 segundo entre llamadas para plan Pro
        this.lastRequestTime = 0;

        // Headers requeridos por API-Sports
        this.headers = {
            'x-apisports-key': this.apiKey
        };

        // IDs de La Liga para diferentes temporadas
        // ⚠️ TEMPORADA ACTUAL: 2025-26 ⚠️
        this.LEAGUES = {
            LA_LIGA: 140,
            LA_LIGA_FEMENINA: 142,
            SEASON_2024: 2024,
            SEASON_2025: 2025,
            SEASON_2026: 2026,
            CURRENT_SEASON: 2025 // ✅ CONFIRMADO: 2025 = temporada 2025-26 en API-Sports
        };
    }

    // Control de rate limiting
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            logger.debug('Rate limiting delay', { waitTime: `${waitTime}ms` });
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    // Realizar petición a la API
    async makeRequest(endpoint, params = {}, includeTimezone = false) {
        await this.waitForRateLimit();

        try {
            const requestUrl = `${this.baseURL}${endpoint}`;
            const requestParams = { ...params };

            // Solo añadir timezone para endpoints que lo soporten (como fixtures)
            if (includeTimezone) {
                requestParams.timezone = 'Europe/Madrid';
            }

            logger.info(`🔄 API-Football: ${endpoint}`, requestParams);

            const response = await axios.get(requestUrl, {
                headers: this.headers,
                params: requestParams,
                timeout: 10000
            });

            logger.info(`✅ API-Football: ${response.data.results} resultados`);

            return {
                success: true,
                data: response.data.response,
                pagination: response.data.paging || null,
                count: response.data.results || 0
            };
        } catch (error) {
            logger.error(`❌ Error API-Football ${endpoint}:`, error.message);

            return {
                success: false,
                error: error.message,
                status: error.response?.status,
                data: null
            };
        }
    }

    // Test de conexión
    async testConnection() {
        logger.info('🔄 Testeando conexión API-Football...');

        try {
            const result = await this.makeRequest('/status');

            if (result.success && result.data) {
                return {
                    success: true,
                    message: 'Conexión exitosa con API-Football',
                    data: {
                        requests_remaining: result.data.requests?.current || 'N/A',
                        plan: result.data.subscription?.plan || 'N/A'
                    }
                };
            }

            return {
                success: false,
                message: 'Error en respuesta de API-Football'
            };
        } catch (error) {
            return {
                success: false,
                message: `Error de conexión: ${error.message}`
            };
        }
    }

    // Obtener información de La Liga
    async getLaLigaInfo() {
        const result = await this.makeRequest('/leagues', {
            id: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON
        });

        if (result.success && result.data) {
            return {
                success: true,
                data: result.data[0] || null,
                league_name: result.data[0]?.league?.name || 'La Liga',
                season: result.data[0]?.seasons?.[0] || null
            };
        }

        return result;
    }

    // Obtener todas las ligas españolas (incluye Liga Femenina)
    async getSpanishLeagues() {
        const result = await this.makeRequest('/leagues', {
            country: 'Spain'
        });

        if (result.success) {
            return {
                success: true,
                data: result.data.map(item => ({
                    id: item.league.id,
                    name: item.league.name,
                    type: item.league.type,
                    logo: item.league.logo,
                    country: item.country.name,
                    seasons: item.seasons?.map(s => s.year) || []
                })),
                count: result.count
            };
        }

        return result;
    }

    // Obtener equipos de La Liga
    async getLaLigaTeams() {
        const result = await this.makeRequest('/teams', {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON
        });

        if (result.success) {
            return {
                success: true,
                data: result.data.map(team => ({
                    id: team.team.id,
                    name: team.team.name,
                    code: team.team.code,
                    logo: team.team.logo,
                    venue: team.venue?.name
                })),
                count: result.count
            };
        }

        return result;
    }

    // Obtener jugadores de La Liga
    async getLaLigaPlayers(page = 1, team_id = null) {
        const params = {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON,
            page: page
        };

        if (team_id) {
            params.team = team_id;
        }

        const result = await this.makeRequest('/players', params);

        if (result.success) {
            return {
                success: true,
                data: result.data.map(item => ({
                    id: item.player.id,
                    name: item.player.name,
                    firstname: item.player.firstname,
                    lastname: item.player.lastname,
                    age: item.player.age,
                    nationality: item.player.nationality,
                    height: item.player.height,
                    weight: item.player.weight,
                    photo: item.player.photo,
                    injured: item.player.injured || false, // ✅ Añadir campo de lesión
                    position: item.statistics?.[0]?.games?.position,
                    team: {
                        id: item.statistics?.[0]?.team?.id,
                        name: item.statistics?.[0]?.team?.name,
                        logo: item.statistics?.[0]?.team?.logo
                    },
                    stats: item.statistics?.[0] || null
                })),
                count: result.count,
                pagination: result.pagination
            };
        }

        return result;
    }

    // Obtener TODOS los jugadores de La Liga (todas las páginas)
    async getAllLaLigaPlayers(team_id = null) {
        try {
            logger.info('📋 Iniciando carga completa de jugadores de La Liga...');

            const allPlayers = [];
            let currentPage = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                logger.info(`📄 Obteniendo página ${currentPage}...`);

                const pageResult = await this.getLaLigaPlayers(currentPage, team_id);

                if (pageResult.success && pageResult.data.length > 0) {
                    allPlayers.push(...pageResult.data);

                    // Verificar si hay más páginas
                    hasMorePages =
                        pageResult.pagination &&
                        pageResult.pagination.current < pageResult.pagination.total;

                    currentPage++;

                    // Rate limiting entre páginas
                    if (hasMorePages) {
                        await this.sleep(1000); // 1 segundo entre páginas
                    }
                } else {
                    hasMorePages = false;
                }
            }

            logger.info(`✅ Carga completa: ${allPlayers.length} jugadores obtenidos`);

            return {
                success: true,
                data: allPlayers,
                totalPages: currentPage - 1
            };
        } catch (error) {
            logger.error('❌ Error obteniendo todos los jugadores:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener fixtures de La Liga
    async getLaLigaFixtures(from_date = null, to_date = null) {
        const params = {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON
        };

        if (from_date) {
            params.from = from_date;
        }
        if (to_date) {
            params.to = to_date;
        }

        const result = await this.makeRequest('/fixtures', params);

        if (result.success) {
            return {
                success: true,
                data: result.data.map(fixture => ({
                    id: fixture.fixture.id,
                    date: fixture.fixture.date,
                    status: fixture.fixture.status.short,
                    minute: fixture.fixture.status.elapsed,
                    venue: fixture.fixture.venue?.name,
                    home_team: {
                        id: fixture.teams.home.id,
                        name: fixture.teams.home.name,
                        logo: fixture.teams.home.logo
                    },
                    away_team: {
                        id: fixture.teams.away.id,
                        name: fixture.teams.away.name,
                        logo: fixture.teams.away.logo
                    },
                    score: {
                        home: fixture.goals.home,
                        away: fixture.goals.away
                    }
                })),
                count: result.count
            };
        }

        return result;
    }

    // Obtener fixtures de un equipo específico
    async getTeamFixtures(team_id, options = {}) {
        const params = {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON,
            team: team_id
        };

        if (options.from) {
            params.from = options.from;
        }
        if (options.to) {
            params.to = options.to;
        }
        if (options.season) {
            params.season = options.season;
        }

        const result = await this.makeRequest('/fixtures', params);

        if (result.success) {
            return {
                success: true,
                data: result.data.map(fixture => ({
                    fixture: {
                        id: fixture.fixture.id,
                        date: fixture.fixture.date,
                        status: fixture.fixture.status,
                        venue: fixture.fixture.venue
                    },
                    teams: {
                        home: {
                            id: fixture.teams.home.id,
                            name: fixture.teams.home.name,
                            logo: fixture.teams.home.logo
                        },
                        away: {
                            id: fixture.teams.away.id,
                            name: fixture.teams.away.name,
                            logo: fixture.teams.away.logo
                        }
                    },
                    goals: {
                        home: fixture.goals.home,
                        away: fixture.goals.away
                    }
                })),
                count: result.count
            };
        }

        return result;
    }

    // Obtener estadísticas detalladas de un jugador
    async getPlayerStats(player_id, season = null) {
        const params = {
            id: player_id,
            season: season || this.LEAGUES.CURRENT_SEASON
        };

        const result = await this.makeRequest('/players', params);

        if (result.success && result.data.length > 0) {
            const playerData = result.data[0];
            const stats = playerData.statistics.find(s => s.league.id === this.LEAGUES.LA_LIGA);

            if (stats) {
                return {
                    success: true,
                    data: {
                        player: playerData.player,
                        team: stats.team,
                        games: stats.games,
                        goals: stats.goals,
                        passes: stats.passes,
                        tackles: stats.tackles,
                        duels: stats.duels,
                        dribbles: stats.dribbles,
                        fouls: stats.fouls,
                        cards: stats.cards,
                        penalty: stats.penalty
                    }
                };
            }
        }

        return {
            success: false,
            message: 'No se encontraron estadísticas para este jugador'
        };
    }

    // Obtener información completa de un jugador (datos + estadísticas + lesiones)
    async getPlayerDetails(player_id, season = null) {
        try {
            logger.info(`🔍 Obteniendo detalles completos del jugador ${player_id}...`);

            // Obtener datos básicos y estadísticas
            const statsResult = await this.getPlayerStats(player_id, season);
            if (!statsResult.success) {
                return statsResult;
            }

            // Obtener información de lesiones
            const injuriesResult = await this.getPlayerInjuries(player_id);

            // Obtener últimos partidos del jugador
            const recentGamesResult = await this.getPlayerRecentFixtures(player_id);

            return {
                success: true,
                data: {
                    ...statsResult.data,
                    injuries: injuriesResult.success ? injuriesResult.data : [],
                    recentGames: recentGamesResult.success ? recentGamesResult.data : []
                }
            };
        } catch (error) {
            logger.error(`❌ Error obteniendo detalles del jugador ${player_id}:`, error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Obtener lesiones de un jugador
    async getPlayerInjuries(player_id) {
        try {
            const result = await this.makeRequest('/injuries', {
                player: player_id,
                league: this.LEAGUES.LA_LIGA,
                season: this.LEAGUES.CURRENT_SEASON
            });

            if (result.success) {
                return {
                    success: true,
                    data: result.data.map(injury => ({
                        type: injury.player.type,
                        reason: injury.player.reason,
                        date: injury.fixture.date,
                        fixture_id: injury.fixture.id
                    }))
                };
            }

            return { success: true, data: [] }; // Sin lesiones
        } catch (error) {
            logger.error(`Error obteniendo lesiones del jugador ${player_id}:`, error.message);
            return { success: false, data: [] };
        }
    }

    // Obtener últimos partidos de un jugador
    async getPlayerRecentFixtures(player_id, last = 5) {
        try {
            const result = await this.makeRequest('/fixtures/players', {
                player: player_id,
                league: this.LEAGUES.LA_LIGA,
                season: this.LEAGUES.CURRENT_SEASON,
                last: last
            });

            if (result.success) {
                return {
                    success: true,
                    data: result.data.map(fixture => ({
                        fixture: {
                            id: fixture.fixture.id,
                            date: fixture.fixture.date,
                            status: fixture.fixture.status
                        },
                        teams: fixture.teams,
                        goals: fixture.goals,
                        player_stats: fixture.players[0]?.statistics[0] || null
                    }))
                };
            }

            return { success: true, data: [] };
        } catch (error) {
            logger.error(
                `Error obteniendo partidos recientes del jugador ${player_id}:`,
                error.message
            );
            return { success: false, data: [] };
        }
    }

    // Obtener clasificación actual de La Liga
    async getLaLigaStandings() {
        const result = await this.makeRequest('/standings', {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON
        });

        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: result.data[0].league.standings[0].map(team => ({
                    position: team.rank,
                    team: {
                        id: team.team.id,
                        name: team.team.name,
                        logo: team.team.logo
                    },
                    points: team.points,
                    played: team.all.played,
                    won: team.all.win,
                    drawn: team.all.draw,
                    lost: team.all.lose,
                    goals_for: team.all.goals.for,
                    goals_against: team.all.goals.against,
                    goal_difference: team.goalsDiff
                }))
            };
        }

        return result;
    }

    // Obtener equipos de La Liga Femenina
    async getLigaFemeninaTeams() {
        const result = await this.makeRequest('/teams', {
            league: this.LEAGUES.LA_LIGA_FEMENINA,
            season: this.LEAGUES.CURRENT_SEASON
        });

        if (result.success) {
            return {
                success: true,
                data: result.data.map(team => ({
                    id: team.team.id,
                    name: team.team.name,
                    code: team.team.code,
                    logo: team.team.logo,
                    venue: team.venue?.name,
                    founded: team.team.founded
                })),
                count: result.count
            };
        }

        return result;
    }

    // Obtener jugadoras de La Liga Femenina
    async getLigaFemeninaPlayers(page = 1, team_id = null, season = null) {
        const params = {
            league: this.LEAGUES.LA_LIGA_FEMENINA,
            season: season || this.LEAGUES.CURRENT_SEASON,
            page: page
        };

        if (team_id) {
            params.team = team_id;
        }

        const result = await this.makeRequest('/players', params);

        if (result.success) {
            return {
                success: true,
                data: result.data.map(item => ({
                    id: item.player.id,
                    name: item.player.name,
                    firstname: item.player.firstname,
                    lastname: item.player.lastname,
                    age: item.player.age,
                    nationality: item.player.nationality,
                    height: item.player.height,
                    weight: item.player.weight,
                    photo: item.player.photo,
                    position: item.statistics?.[0]?.games?.position,
                    team: {
                        id: item.statistics?.[0]?.team?.id,
                        name: item.statistics?.[0]?.team?.name,
                        logo: item.statistics?.[0]?.team?.logo
                    },
                    stats: item.statistics?.[0] || null
                })),
                count: result.count,
                pagination: result.pagination
            };
        }

        return result;
    }

    // Obtener clasificación Liga Femenina
    async getLigaFemeninaStandings() {
        const result = await this.makeRequest('/standings', {
            league: this.LEAGUES.LA_LIGA_FEMENINA,
            season: this.LEAGUES.CURRENT_SEASON
        });

        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: result.data[0].league.standings[0].map(team => ({
                    position: team.rank,
                    team: {
                        id: team.team.id,
                        name: team.team.name,
                        logo: team.team.logo
                    },
                    points: team.points,
                    played: team.all.played,
                    won: team.all.win,
                    drawn: team.all.draw,
                    lost: team.all.lose,
                    goals_for: team.all.goals.for,
                    goals_against: team.all.goals.against,
                    goal_difference: team.goalsDiff
                }))
            };
        }

        return result;
    }

    // === MÉTODOS PARA ALINEACIONES EN TIEMPO REAL ===

    // Obtener partidos de La Liga de una fecha específica con alineaciones
    async getLiveLaLigaLineups(date) {
        const result = await this.makeRequest('/fixtures', {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON,
            date: date
        });

        if (result.success && result.data.length > 0) {
            const fixturesWithLineups = [];

            for (const fixture of result.data) {
                try {
                    const lineupsResult = await this.getFixtureLineups(fixture.fixture.id);
                    fixturesWithLineups.push({
                        fixture: {
                            id: fixture.fixture.id,
                            date: fixture.fixture.date,
                            status: fixture.fixture.status,
                            venue: fixture.fixture.venue,
                            referee: fixture.fixture.referee
                        },
                        teams: {
                            home: fixture.teams.home,
                            away: fixture.teams.away
                        },
                        score: {
                            home: fixture.goals.home,
                            away: fixture.goals.away
                        },
                        lineups: lineupsResult.success ? lineupsResult.data : null
                    });
                } catch (error) {
                    logger.info(
                        `Error obteniendo alineaciones para fixture ${fixture.fixture.id}: ${error.message}`
                    );
                    fixturesWithLineups.push({
                        fixture: {
                            id: fixture.fixture.id,
                            date: fixture.fixture.date,
                            status: fixture.fixture.status,
                            venue: fixture.fixture.venue,
                            referee: fixture.fixture.referee
                        },
                        teams: {
                            home: fixture.teams.home,
                            away: fixture.teams.away
                        },
                        score: {
                            home: fixture.goals.home,
                            away: fixture.goals.away
                        },
                        lineups: null
                    });
                }
            }

            return {
                success: true,
                data: fixturesWithLineups,
                count: fixturesWithLineups.length
            };
        }

        return {
            success: false,
            error: 'No se encontraron partidos para la fecha especificada',
            data: [],
            count: 0
        };
    }

    // Obtener alineaciones de un partido específico
    async getFixtureLineups(fixture_id) {
        const result = await this.makeRequest('/fixtures/lineups', {
            fixture: fixture_id
        });

        if (result.success && result.data.length > 0) {
            const lineupsData = [];

            for (const team of result.data) {
                let coachDetails = null;

                // Obtener detalles completos del entrenador incluyendo foto
                if (team.coach && team.coach.id) {
                    try {
                        const coachResult = await this.getCoachDetails(team.coach.id);
                        if (coachResult.success) {
                            coachDetails = coachResult.data;
                        }
                    } catch (error) {
                        logger.info(
                            `⚠️ No se pudo obtener foto del entrenador ${team.coach.name}:`,
                            error.message
                        );
                        coachDetails = team.coach; // Fallback a datos básicos
                    }
                }

                lineupsData.push({
                    team: {
                        id: team.team.id,
                        name: team.team.name,
                        logo: team.team.logo,
                        colors: team.team.colors
                    },
                    formation: team.formation,
                    startXI: team.startXI.map(player => ({
                        player: {
                            id: player.player.id,
                            name: player.player.name,
                            number: player.player.number,
                            pos: player.player.pos,
                            grid: player.player.grid
                        }
                    })),
                    substitutes: team.substitutes.map(player => ({
                        player: {
                            id: player.player.id,
                            name: player.player.name,
                            number: player.player.number,
                            pos: player.player.pos
                        }
                    })),
                    coach: {
                        id: coachDetails?.id || team.coach?.id,
                        name: coachDetails?.name || team.coach?.name,
                        photo: coachDetails?.photo || null,
                        age: coachDetails?.age || null,
                        nationality: coachDetails?.nationality || null
                    }
                });
            }

            return {
                success: true,
                data: lineupsData
            };
        }

        return {
            success: false,
            error: 'No se encontraron alineaciones para este partido'
        };
    }

    // Obtener partidos en vivo de La Liga
    async getLiveLaLigaMatches() {
        const result = await this.makeRequest('/fixtures', {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON,
            live: 'all'
        });

        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: result.data.map(fixture => ({
                    id: fixture.fixture.id,
                    date: fixture.fixture.date,
                    status: {
                        long: fixture.fixture.status.long,
                        short: fixture.fixture.status.short,
                        elapsed: fixture.fixture.status.elapsed
                    },
                    venue: fixture.fixture.venue,
                    teams: {
                        home: fixture.teams.home,
                        away: fixture.teams.away
                    },
                    score: {
                        home: fixture.goals.home,
                        away: fixture.goals.away,
                        halftime: fixture.score.halftime,
                        fulltime: fixture.score.fulltime
                    }
                })),
                count: result.data.length
            };
        }

        return {
            success: false,
            error: 'No hay partidos en vivo actualmente',
            data: [],
            count: 0
        };
    }

    // === MÉTODOS PARA ENTRENADORES ===

    // Obtener entrenadores de La Liga con fotos
    async getLaLigaCoaches(teamId = null) {
        const params = {
            league: this.LEAGUES.LA_LIGA,
            season: this.LEAGUES.CURRENT_SEASON
        };

        if (teamId) {
            params.team = teamId;
        }

        const result = await this.makeRequest('/coachs', params);

        if (result.success) {
            return {
                success: true,
                data: result.data.map(coach => ({
                    id: coach.id,
                    name: coach.name,
                    firstname: coach.firstname,
                    lastname: coach.lastname,
                    age: coach.age,
                    nationality: coach.nationality,
                    photo: coach.photo,
                    team: {
                        id: coach.team?.id,
                        name: coach.team?.name,
                        logo: coach.team?.logo
                    },
                    career: coach.career || []
                })),
                count: result.count
            };
        }

        return result;
    }

    // Obtener información específica de un entrenador
    async getCoachDetails(coachId) {
        const result = await this.makeRequest('/coachs', {
            id: coachId
        });

        if (result.success && result.data.length > 0) {
            const coach = result.data[0];
            return {
                success: true,
                data: {
                    id: coach.id,
                    name: coach.name,
                    firstname: coach.firstname,
                    lastname: coach.lastname,
                    age: coach.age,
                    nationality: coach.nationality,
                    photo: coach.photo,
                    birth: coach.birth,
                    team: coach.team,
                    career: coach.career || []
                }
            };
        }

        return {
            success: false,
            error: 'No se encontró información del entrenador'
        };
    }

    // === MÉTODO PARA HISTORIAL JUGADOR VS EQUIPO RIVAL ===

    // Obtener historial de un jugador contra un equipo específico
    async getPlayerVsTeamHistory(
        playerId,
        opponentTeamId,
        seasons = [this.LEAGUES.CURRENT_SEASON],
        maxFixtures = 10
    ) {
        try {
            logger.info(
                `🔍 Obteniendo historial del jugador ${playerId} vs equipo ${opponentTeamId}...`
            );

            const historyData = [];

            // Recorrer las temporadas especificadas (por defecto solo temporada actual)
            for (const season of seasons) {
                try {
                    // Obtener estadísticas del jugador en esa temporada
                    const playerStatsResult = await this.getPlayerStats(playerId, season);

                    if (!playerStatsResult.success) {
                        logger.info(
                            `ℹ️ Sin estadísticas para jugador ${playerId} en temporada ${season}`
                        );
                        continue;
                    }

                    const playerTeamId = playerStatsResult.data.team?.id;
                    if (!playerTeamId) {
                        logger.info(
                            `ℹ️ No se pudo determinar equipo del jugador en temporada ${season}`
                        );
                        continue;
                    }

                    // Obtener fixtures del equipo del jugador contra el rival
                    const teamFixturesResult = await this.getTeamFixtures(playerTeamId, {
                        season: season
                    });

                    if (!teamFixturesResult.success) {
                        logger.info(
                            `ℹ️ Sin fixtures para equipo ${playerTeamId} en temporada ${season}`
                        );
                        continue;
                    }

                    // Filtrar solo partidos contra el rival específico que ya hayan terminado
                    const matchesVsOpponent = teamFixturesResult.data.filter(fixture => {
                        const isVsOpponent =
                            fixture.teams.home.id === opponentTeamId ||
                            fixture.teams.away.id === opponentTeamId;

                        const isFinished =
                            fixture.fixture.status?.short === 'FT' ||
                            fixture.fixture.status?.short === 'AET' ||
                            fixture.fixture.status?.short === 'PEN';

                        return isVsOpponent && isFinished;
                    });

                    logger.info(
                        `📊 Encontrados ${matchesVsOpponent.length} partidos vs rival en temporada ${season}`
                    );

                    // Obtener estadísticas del jugador en cada partido específico
                    for (const match of matchesVsOpponent.slice(-maxFixtures)) {
                        try {
                            // Rate limiting optimizado para historiales (menos crítico)
                            await this.sleep(100); // Reducido de 200ms a 100ms para datos históricos

                            // Obtener estadísticas del jugador en este partido específico
                            const playerFixtureStatsResult = await this.getPlayerFixtureStats(
                                playerId,
                                match.fixture.id
                            );

                            historyData.push({
                                fixture: {
                                    id: match.fixture.id,
                                    date: match.fixture.date,
                                    season: season,
                                    status: match.fixture.status
                                },
                                teams: match.teams,
                                result: {
                                    home_goals: match.goals.home,
                                    away_goals: match.goals.away,
                                    outcome: this.getMatchOutcome(match, playerTeamId)
                                },
                                playerStats: playerFixtureStatsResult.success
                                    ? playerFixtureStatsResult.data
                                    : null,
                                playerTeam: {
                                    id: playerTeamId,
                                    isHome: match.teams.home.id === playerTeamId
                                }
                            });
                        } catch (error) {
                            logger.info(
                                `⚠️ Error procesando partido ${match.fixture.id}: ${error.message}`
                            );
                        }
                    }
                } catch (error) {
                    logger.error(`Error procesando temporada ${season}:`, error.message);
                }
            }

            // Ordenar por fecha descendente (más recientes primero)
            historyData.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

            logger.info(`✅ Historial obtenido: ${historyData.length} partidos encontrados`);

            return {
                success: true,
                data: historyData,
                totalGames: historyData.length,
                playerId: playerId,
                opponentTeamId: opponentTeamId,
                seasonsAnalyzed: seasons
            };
        } catch (error) {
            logger.error(`❌ Error obteniendo historial jugador vs equipo:`, error.message);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    // Obtener estadísticas de un jugador en un partido específico (versión optimizada)
    async getPlayerFixtureStats(playerId, fixtureId) {
        try {
            // Intentar obtener estadísticas específicas del partido
            const result = await this.makeRequest('/fixtures/players', {
                fixture: fixtureId,
                team: 'all'
            });

            if (result.success && result.data.length > 0) {
                // Buscar las estadísticas específicas del jugador
                for (const team of result.data) {
                    if (team.players) {
                        for (const playerData of team.players) {
                            if (playerData.player.id === playerId) {
                                const stats = playerData.statistics[0];
                                return {
                                    success: true,
                                    data: {
                                        player: playerData.player,
                                        team: team.team,
                                        games: stats.games,
                                        goals: stats.goals,
                                        assists: stats.assists,
                                        rating: stats.rating,
                                        minutes: stats.games?.minutes || 0,
                                        substitute: stats.games?.substitute || false,
                                        cards: {
                                            yellow: stats.cards?.yellow || 0,
                                            red: stats.cards?.red || 0
                                        },
                                        shots: stats.shots,
                                        passes: stats.passes,
                                        duels: stats.duels
                                    }
                                };
                            }
                        }
                    }
                }
            }

            // Fallback: retornar datos básicos estimados
            logger.info(
                `ℹ️ Stats específicas no disponibles para partido ${fixtureId}, usando estimación`
            );
            return {
                success: true,
                data: {
                    player: { id: playerId },
                    team: null,
                    games: { minutes: 90 }, // Asumimos participación completa
                    goals: { total: 0 }, // Estimación conservadora
                    assists: { total: 0 },
                    rating: '6.5', // Rating promedio
                    minutes: 90,
                    substitute: false,
                    cards: { yellow: 0, red: 0 },
                    estimated: true // Marcar como estimado
                }
            };
        } catch (error) {
            logger.error(
                `Error obteniendo stats del jugador ${playerId} en partido ${fixtureId}:`,
                error.message
            );
            return {
                success: true,
                data: {
                    player: { id: playerId },
                    team: null,
                    games: { minutes: 90 },
                    goals: { total: 0 },
                    assists: { total: 0 },
                    rating: '6.5',
                    minutes: 90,
                    substitute: false,
                    cards: { yellow: 0, red: 0 },
                    estimated: true,
                    error: error.message
                }
            };
        }
    }

    // Determinar resultado del partido desde perspectiva del equipo
    getMatchOutcome(match, teamId) {
        const isHome = match.teams.home.id === teamId;
        const homeGoals = match.result?.home_goals || match.goals?.home || 0;
        const awayGoals = match.result?.away_goals || match.goals?.away || 0;

        if (homeGoals === awayGoals) {
            return 'draw';
        }

        if (isHome) {
            return homeGoals > awayGoals ? 'win' : 'loss';
        } else {
            return awayGoals > homeGoals ? 'win' : 'loss';
        }
    }

    // ============================================
    // FASE 1.3: OBTENER PARTIDOS RECIENTES JUGADOR
    // Para stats DAZN reales + forma reciente
    // ============================================

    /**
     * Obtener partidos recientes de un jugador con stats detalladas
     * @param {number} playerId - ID del jugador
     * @param {number} last - Número de partidos recientes (default: 5)
     * @returns {Object} Stats agregadas de últimos partidos
     */
    async getPlayerRecentMatches(playerId, last = 5) {
        // Verificar cache primero
        const cached = recentMatchesCache.get(playerId, last);
        if (cached) {
            logger.debug(`[ApiFootball] Cache HIT: Jugador ${playerId} últimos ${last} partidos`);
            return cached;
        }

        logger.info(`🔄 Obteniendo últimos ${last} partidos del jugador ${playerId}...`);

        try {
            // Obtener fixtures donde jugó el jugador (temporada actual)
            const result = await this.makeRequest('/fixtures/players', {
                player: playerId,
                season: this.LEAGUES.CURRENT_SEASON,
                league: this.LEAGUES.LA_LIGA
            });

            if (!result.success || !result.data || result.data.length === 0) {
                logger.warn(`⚠️ No se encontraron partidos para jugador ${playerId}`);
                return {
                    success: false,
                    matchesFound: 0,
                    stats: null
                };
            }

            // Ordenar por fecha más reciente y tomar últimos N partidos
            const sortedMatches = result.data
                .sort((a, b) => new Date(b.fixture?.date) - new Date(a.fixture?.date))
                .slice(0, last);

            logger.info(`✅ ${sortedMatches.length} partidos recientes encontrados`);

            // Agregar stats de todos los partidos
            const aggregatedStats = this._aggregatePlayerMatchStats(sortedMatches);

            const response = {
                success: true,
                matchesFound: sortedMatches.length,
                stats: aggregatedStats,
                matches: sortedMatches.map(m => ({
                    fixtureId: m.fixture?.id,
                    date: m.fixture?.date,
                    opponent: m.opponent?.name,
                    minutes: m.player?.statistics?.[0]?.games?.minutes || 0,
                    rating: m.player?.statistics?.[0]?.games?.rating || null,
                    goals: m.player?.statistics?.[0]?.goals?.total || 0,
                    assists: m.player?.statistics?.[0]?.goals?.assists || 0
                }))
            };

            // Guardar en cache
            recentMatchesCache.set(playerId, last, response);

            return response;
        } catch (error) {
            logger.error(
                `❌ Error obteniendo partidos recientes jugador ${playerId}:`,
                error.message
            );
            return {
                success: false,
                error: error.message,
                matchesFound: 0,
                stats: null
            };
        }
    }

    /**
     * Agregar stats de múltiples partidos
     * @private
     */
    _aggregatePlayerMatchStats(matches) {
        const totalMatches = matches.length;
        if (totalMatches === 0) {
            return null;
        }

        // Inicializar contadores
        const aggregated = {
            matches: totalMatches,
            minutes: 0,
            goals: 0,
            assists: 0,
            shotsTotal: 0,
            shotsOn: 0,
            dribblesAttempts: 0,
            dribblesSuccess: 0,
            tacklesTotal: 0,
            tacklesBlocks: 0,
            tacklesInterceptions: 0,
            duelsTotal: 0,
            duelsWon: 0,
            passesTotal: 0,
            passesKey: 0,
            passesAccuracy: 0, // Será promedio
            foulsDrawn: 0,
            foulsCommitted: 0,
            yellowCards: 0,
            redCards: 0,
            // Goalkeeper specific
            saveTotal: 0,
            goalsConceded: 0,
            // Ratings
            ratings: [],
            avgRating: 0
        };

        // Sumar stats de cada partido
        matches.forEach(match => {
            const stats = match.player?.statistics?.[0];
            if (!stats) {
                return;
            }

            aggregated.minutes += stats.games?.minutes || 0;
            aggregated.goals += stats.goals?.total || 0;
            aggregated.assists += stats.goals?.assists || 0;

            aggregated.shotsTotal += stats.shots?.total || 0;
            aggregated.shotsOn += stats.shots?.on || 0;

            aggregated.dribblesAttempts += stats.dribbles?.attempts || 0;
            aggregated.dribblesSuccess += stats.dribbles?.success || 0;

            aggregated.tacklesTotal += stats.tackles?.total || 0;
            aggregated.tacklesBlocks += stats.tackles?.blocks || 0;
            aggregated.tacklesInterceptions += stats.tackles?.interceptions || 0;

            aggregated.duelsTotal += stats.duels?.total || 0;
            aggregated.duelsWon += stats.duels?.won || 0;

            aggregated.passesTotal += stats.passes?.total || 0;
            aggregated.passesKey += stats.passes?.key || 0;

            // Passes accuracy (acumular para promediar después)
            if (stats.passes?.accuracy) {
                aggregated.passesAccuracy += parseFloat(stats.passes.accuracy) || 0;
            }

            aggregated.foulsDrawn += stats.fouls?.drawn || 0;
            aggregated.foulsCommitted += stats.fouls?.committed || 0;

            aggregated.yellowCards += stats.cards?.yellow || 0;
            aggregated.redCards += stats.cards?.red || 0;

            // Goalkeeper stats
            aggregated.saveTotal += stats.goals?.saves || 0;
            aggregated.goalsConceded += stats.goals?.conceded || 0;

            // Rating
            const rating = parseFloat(stats.games?.rating);
            if (rating && !isNaN(rating)) {
                aggregated.ratings.push(rating);
            }
        });

        // Calcular promedios
        aggregated.avgRating =
            aggregated.ratings.length > 0
                ? (
                      aggregated.ratings.reduce((sum, r) => sum + r, 0) / aggregated.ratings.length
                  ).toFixed(2)
                : 0;

        aggregated.passesAccuracy =
            totalMatches > 0 ? (aggregated.passesAccuracy / totalMatches).toFixed(1) : 0;

        // Calcular ratios
        aggregated.dribblesSuccessRate =
            aggregated.dribblesAttempts > 0
                ? ((aggregated.dribblesSuccess / aggregated.dribblesAttempts) * 100).toFixed(1)
                : 0;

        aggregated.duelsWonRate =
            aggregated.duelsTotal > 0
                ? ((aggregated.duelsWon / aggregated.duelsTotal) * 100).toFixed(1)
                : 0;

        aggregated.shotsAccuracy =
            aggregated.shotsTotal > 0
                ? ((aggregated.shotsOn / aggregated.shotsTotal) * 100).toFixed(1)
                : 0;

        return aggregated;
    }

    /**
     * Obtener stats de jugadores para sistema de outliers
     *
     * @param {Array<string>} playerNames - Array de nombres de jugadores mencionados
     * @returns {Object} Stats agregadas de los jugadores encontrados
     */
    async getPlayerStatsForOutlier(playerNames) {
        try {
            logger.info(`[Outliers] Enriqueciendo con API-Sports: ${playerNames.length} jugadores`);

            const playersData = [];

            // Buscar cada jugador por nombre
            for (const playerName of playerNames) {
                try {
                    // Buscar jugador por nombre en La Liga actual
                    const searchResult = await this.makeRequest('/players', {
                        league: this.LEAGUES.LA_LIGA,
                        season: this.LEAGUES.CURRENT_SEASON,
                        search: playerName
                    });

                    if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
                        const playerInfo = searchResult.data[0];
                        const stats = playerInfo.statistics?.[0];

                        if (stats) {
                            playersData.push({
                                name: playerInfo.player.name,
                                team: stats.team.name,
                                position: stats.games.position,
                                stats: {
                                    appearances: stats.games.appearences,
                                    minutes: stats.games.minutes,
                                    goals: stats.goals.total || 0,
                                    assists: stats.goals.assists || 0,
                                    rating: stats.games.rating || 'N/A'
                                }
                            });

                            logger.info(`[Outliers] ✅ ${playerName} encontrado en API-Sports`);
                        }
                    } else {
                        logger.warn(`[Outliers] ⚠️ ${playerName} no encontrado en API-Sports`);
                    }
                } catch (error) {
                    logger.error(`[Outliers] Error buscando ${playerName}:`, error.message);
                }
            }

            return {
                success: true,
                players: playersData,
                totalFound: playersData.length
            };
        } catch (error) {
            logger.error('[Outliers] Error obteniendo stats para outliers:', error.message);
            return {
                success: false,
                error: error.message,
                players: [],
                totalFound: 0
            };
        }
    }

    // Utilidad para pausas
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ApiFootballClient;
