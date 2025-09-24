// Analizador de Fixtures - Evalúa dificultad de próximos rivales para chollos
const ApiFootballClient = require('./apiFootball');

class FixtureAnalyzer {
  constructor() {
    this.apiClient = new ApiFootballClient();

    // Ratings de dificultad de equipos de La Liga (1-5, donde 5 = más difícil)
    this.teamDifficultyRatings = {
      541: 5,   // Real Madrid
      529: 5,   // Barcelona
      530: 4.5, // Atlético Madrid
      548: 4,   // Real Sociedad
      533: 4,   // Villarreal
      536: 3.5, // Sevilla
      531: 3.5, // Athletic Club
      532: 3.5, // Valencia
      546: 3,   // Getafe
      727: 3,   // Osasuna
      540: 3,   // Espanyol
      539: 2.5, // Levante
      797: 2.5, // Elche
      538: 2.5, // Celta Vigo
      542: 2,   // Alavés
      // Agregar más equipos según sea necesario
    };

    console.log('🏆 FixtureAnalyzer inicializado - Ratings de dificultad configurados');
  }

  // Obtener próximos partidos para un equipo
  async getNextFixtures(teamId, gamesCount = 5) {
    try {
      console.log(`🔍 Obteniendo próximos ${gamesCount} partidos para equipo ${teamId}...`);

      // Obtener fixtures futuros del equipo
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const result = await this.apiClient.getTeamFixtures(teamId, {
        from: today.toISOString().split('T')[0],
        to: nextMonth.toISOString().split('T')[0],
        season: 2025
      });

      if (!result.success || !result.data) {
        console.log(`⚠️ No se pudieron obtener fixtures para equipo ${teamId}`);
        return [];
      }

      // Ordenar por fecha y tomar los próximos N partidos
      const upcomingFixtures = result.data
        .filter(fixture => new Date(fixture.fixture.date) > today)
        .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
        .slice(0, gamesCount);

      console.log(`✅ ${upcomingFixtures.length} próximos fixtures obtenidos para equipo ${teamId}`);
      return upcomingFixtures;

    } catch (error) {
      console.error(`❌ Error obteniendo fixtures para equipo ${teamId}:`, error.message);
      return [];
    }
  }

  // Calcular dificultad de un rival específico
  calculateOpponentDifficulty(opponentId, isHome = true) {
    const baseDifficulty = this.teamDifficultyRatings[opponentId] || 3.0; // Default medio

    // Ajuste por jugar en casa vs fuera (ventaja local)
    const homeAdvantage = isHome ? -0.3 : 0.3;

    return Math.max(1, Math.min(5, baseDifficulty + homeAdvantage));
  }

  // Analizar dificultad de próximos partidos para un equipo
  async analyzeFixtureDifficulty(teamId, gamesCount = 5) {
    const fixtures = await this.getNextFixtures(teamId, gamesCount);

    if (fixtures.length === 0) {
      return {
        averageDifficulty: 3.0, // Default medio
        nextGames: [],
        analysis: 'No hay datos de próximos partidos disponibles'
      };
    }

    const difficulties = [];
    const nextGames = [];

    for (const fixture of fixtures) {
      const isHome = fixture.teams.home.id === teamId;
      const opponentId = isHome ? fixture.teams.away.id : fixture.teams.home.id;
      const opponentName = isHome ? fixture.teams.away.name : fixture.teams.home.name;

      const difficulty = this.calculateOpponentDifficulty(opponentId, isHome);
      difficulties.push(difficulty);

      nextGames.push({
        date: fixture.fixture.date,
        opponent: opponentName,
        opponentId: opponentId,
        isHome: isHome,
        difficulty: difficulty,
        venue: fixture.fixture.venue?.name || 'TBD'
      });
    }

    const averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;

    // Generar análisis textual
    let analysis = '';
    if (averageDifficulty >= 4.0) {
      analysis = '🔴 Calendario MUY DIFÍCIL - Rivales complicados próximamente';
    } else if (averageDifficulty >= 3.5) {
      analysis = '🟡 Calendario DIFÍCIL - Algunos rivales complicados';
    } else if (averageDifficulty >= 2.5) {
      analysis = '🟢 Calendario FAVORABLE - Rivales asequibles';
    } else {
      analysis = '🟢 Calendario MUY FAVORABLE - Rivales débiles';
    }

    return {
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      nextGames: nextGames,
      analysis: analysis,
      gamesAnalyzed: fixtures.length
    };
  }

  // Ajustar valor de chollo basado en dificultad de fixtures
  adjustBargainValueByFixtures(baseValue, fixtureDifficulty) {
    // Calendario fácil = mayor valor (multiplica por factor > 1)
    // Calendario difícil = menor valor (multiplica por factor < 1)

    const difficultyFactor = this.getDifficultyMultiplier(fixtureDifficulty);
    const adjustedValue = baseValue * difficultyFactor;

    console.log(`📊 Ajuste por fixtures: ${baseValue.toFixed(2)} → ${adjustedValue.toFixed(2)} (factor: ${difficultyFactor})`);

    return adjustedValue;
  }

  // Obtener multiplicador basado en dificultad
  getDifficultyMultiplier(averageDifficulty) {
    if (averageDifficulty >= 4.0) return 0.85;      // Muy difícil: -15%
    if (averageDifficulty >= 3.5) return 0.92;      // Difícil: -8%
    if (averageDifficulty >= 2.5) return 1.0;       // Normal: sin cambio
    if (averageDifficulty >= 2.0) return 1.08;      // Fácil: +8%
    return 1.15;                                     // Muy fácil: +15%
  }

  // Obtener análisis completo de fixtures para múltiples equipos
  async analyzeMultipleTeams(teamIds, gamesCount = 5) {
    const results = {};

    for (const teamId of teamIds) {
      try {
        results[teamId] = await this.analyzeFixtureDifficulty(teamId, gamesCount);

        // Rate limiting básico
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error analizando fixtures para equipo ${teamId}:`, error.message);
        results[teamId] = {
          averageDifficulty: 3.0,
          nextGames: [],
          analysis: 'Error obteniendo datos de fixtures',
          gamesAnalyzed: 0
        };
      }
    }

    return results;
  }

  // Obtener rating de dificultad de un equipo específico
  getTeamDifficulty(teamId) {
    return this.teamDifficultyRatings[teamId] || 3.0; // Default medio si no está en el mapping
  }

  // Actualizar ratings de dificultad basado en forma reciente de equipos
  updateTeamDifficultyRatings(teamPerformanceData) {
    // Esta función podría usar datos de forma reciente para ajustar ratings
    // Por ahora usamos ratings estáticos, pero se puede mejorar dinámicamente
    console.log('📈 Actualizando ratings de dificultad basado en forma reciente...');

    // TODO: Implementar lógica para ajustar ratings según forma reciente
    // Ejemplo: equipo con 5 victorias consecutivas → aumentar dificultad

    return this.teamDifficultyRatings;
  }
}

module.exports = FixtureAnalyzer;