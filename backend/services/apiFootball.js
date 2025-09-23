// Cliente para API-Football (RapidAPI)
const axios = require('axios');

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
    this.LEAGUES = {
      LA_LIGA: 140,
      LA_LIGA_FEMENINA: 142,
      SEASON_2024: 2024,
      SEASON_2025: 2025,
      CURRENT_SEASON: 2025  // Temporada actual La Liga 2025-2026 (API usa 2025)
    };
  }

  // Control de rate limiting
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: esperando ${waitTime}ms`);
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

      console.log(`🔄 API-Football: ${endpoint}`, requestParams);

      const response = await axios.get(requestUrl, {
        headers: this.headers,
        params: requestParams,
        timeout: 10000
      });

      console.log(`✅ API-Football: ${response.data.results} resultados`);

      return {
        success: true,
        data: response.data.response,
        pagination: response.data.paging || null,
        count: response.data.results || 0
      };

    } catch (error) {
      console.error(`❌ Error API-Football ${endpoint}:`, error.message);

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
    console.log('🔄 Testeando conexión API-Football...');

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
      console.log('📋 Iniciando carga completa de jugadores de La Liga...');

      const allPlayers = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`📄 Obteniendo página ${currentPage}...`);

        const pageResult = await this.getLaLigaPlayers(currentPage, team_id);

        if (pageResult.success && pageResult.data.length > 0) {
          allPlayers.push(...pageResult.data);

          // Verificar si hay más páginas
          hasMorePages = pageResult.pagination &&
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

      console.log(`✅ Carga completa: ${allPlayers.length} jugadores obtenidos`);

      return {
        success: true,
        data: allPlayers,
        totalPages: currentPage - 1
      };

    } catch (error) {
      console.error('❌ Error obteniendo todos los jugadores:', error.message);
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

    if (from_date) params.from = from_date;
    if (to_date) params.to = to_date;

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
      console.log(`🔍 Obteniendo detalles completos del jugador ${player_id}...`);

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
      console.error(`❌ Error obteniendo detalles del jugador ${player_id}:`, error.message);
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
      console.error(`Error obteniendo lesiones del jugador ${player_id}:`, error.message);
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
      console.error(`Error obteniendo partidos recientes del jugador ${player_id}:`, error.message);
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
          console.log(`Error obteniendo alineaciones para fixture ${fixture.fixture.id}: ${error.message}`);
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
            console.log(`⚠️ No se pudo obtener foto del entrenador ${team.coach.name}:`, error.message);
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

  // Utilidad para pausas
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ApiFootballClient;