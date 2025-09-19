// Procesador de datos Fantasy - Calcula puntos según sistema oficial La Liga Fantasy
const { FANTASY_POINTS, POSITIONS } = require('../config/constants');

class FantasyDataProcessor {
  constructor() {
    this.points = FANTASY_POINTS;
    this.positions = POSITIONS;
  }

  // Calcular puntos Fantasy para un jugador en un partido
  calculatePlayerPoints(playerStats, playerPosition) {
    let totalPoints = 0;
    const position = this.getPlayerPosition(playerPosition);

    console.log(`📊 Calculando puntos para jugador (${position}):`, playerStats);

    // Puntos base por jugar
    if (playerStats.minutes_played > 0) {
      totalPoints += this.points.MATCH_PLAYED;
      console.log(`  ✅ Partido jugado: +${this.points.MATCH_PLAYED} pts`);
    }

    // Puntos por goles (depende de la posición)
    if (playerStats.goals > 0) {
      const goalPoints = playerStats.goals * this.points.GOALS[position];
      totalPoints += goalPoints;
      console.log(`  ⚽ ${playerStats.goals} gol(es): +${goalPoints} pts`);
    }

    // Puntos por asistencias
    if (playerStats.assists > 0) {
      const assistPoints = playerStats.assists * this.points.ASSIST;
      totalPoints += assistPoints;
      console.log(`  🎯 ${playerStats.assists} asistencia(s): +${assistPoints} pts`);
    }

    // Puntos específicos para porteros
    if (position === 'GK') {
      // Penaltis parados
      if (playerStats.penalties_saved > 0) {
        const penaltyPoints = playerStats.penalties_saved * this.points.PENALTY_SAVED;
        totalPoints += penaltyPoints;
        console.log(`  🥅 ${playerStats.penalties_saved} penalti(s) parado(s): +${penaltyPoints} pts`);
      }

      // Portería a cero
      if (playerStats.clean_sheet === true) {
        totalPoints += this.points.CLEAN_SHEET_GK;
        console.log(`  🛡️ Portería a cero: +${this.points.CLEAN_SHEET_GK} pts`);
      }

      // Goles encajados
      if (playerStats.goals_conceded > 0) {
        const concededPoints = playerStats.goals_conceded * this.points.GOAL_CONCEDED_GK;
        totalPoints += concededPoints;
        console.log(`  ⚠️ ${playerStats.goals_conceded} gol(es) encajado(s): ${concededPoints} pts`);
      }
    }

    // Puntos específicos para defensas
    if (position === 'DEF') {
      // Portería a cero
      if (playerStats.clean_sheet === true) {
        totalPoints += this.points.CLEAN_SHEET_DEF;
        console.log(`  🛡️ Portería a cero: +${this.points.CLEAN_SHEET_DEF} pts`);
      }

      // Goles encajados (cada 2 goles = -1 punto)
      if (playerStats.goals_conceded > 0) {
        const concededPoints = Math.floor(playerStats.goals_conceded / 2) * -1;
        totalPoints += concededPoints;
        console.log(`  ⚠️ ${playerStats.goals_conceded} gol(es) encajado(s): ${concededPoints} pts`);
      }
    }

    // Penalizaciones (todas las posiciones)
    if (playerStats.yellow_cards > 0) {
      const yellowPoints = playerStats.yellow_cards * this.points.YELLOW_CARD;
      totalPoints += yellowPoints;
      console.log(`  🟨 ${playerStats.yellow_cards} tarjeta(s) amarilla(s): ${yellowPoints} pts`);
    }

    if (playerStats.red_cards > 0) {
      const redPoints = playerStats.red_cards * this.points.RED_CARD;
      totalPoints += redPoints;
      console.log(`  🟥 ${playerStats.red_cards} tarjeta(s) roja(s): ${redPoints} pts`);
    }

    console.log(`  📈 TOTAL: ${totalPoints} puntos`);
    return totalPoints;
  }

  // Determinar posición del jugador
  getPlayerPosition(positionId) {
    return this.positions[positionId] || 'MID'; // Default a centrocampista
  }

  // Procesar datos de un partido completo
  processMatchData(matchData) {
    const processedMatch = {
      id: matchData.id,
      date: matchData.starting_at,
      home_team: matchData.participants?.find(p => p.meta?.location === 'home')?.name || 'Home',
      away_team: matchData.participants?.find(p => p.meta?.location === 'away')?.name || 'Away',
      score: {
        home: matchData.scores?.find(s => s.description === 'CURRENT')?.score?.participant || 0,
        away: matchData.scores?.find(s => s.description === 'CURRENT')?.score?.opponent || 0
      },
      players: []
    };

    // Procesar estadísticas de jugadores si están disponibles
    if (matchData.statistics) {
      matchData.statistics.forEach(teamStats => {
        if (teamStats.details) {
          teamStats.details.forEach(playerStat => {
            const player = {
              id: playerStat.player?.id,
              name: playerStat.player?.display_name || 'Unknown',
              position: this.getPlayerPosition(playerStat.player?.position_id),
              stats: this.extractPlayerStats(playerStat),
              fantasy_points: 0
            };

            // Calcular puntos Fantasy
            player.fantasy_points = this.calculatePlayerPoints(player.stats, playerStat.player?.position_id);
            processedMatch.players.push(player);
          });
        }
      });
    }

    return processedMatch;
  }

  // Extraer estadísticas relevantes de un jugador
  extractPlayerStats(playerStatData) {
    const stats = {
      minutes_played: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      clean_sheet: false,
      goals_conceded: 0,
      penalties_saved: 0
    };

    // Mapear estadísticas según la estructura de SportMonks
    if (playerStatData.value !== undefined) {
      switch (playerStatData.type?.name?.toLowerCase()) {
        case 'goals':
          stats.goals = parseInt(playerStatData.value) || 0;
          break;
        case 'assists':
          stats.assists = parseInt(playerStatData.value) || 0;
          break;
        case 'yellow cards':
          stats.yellow_cards = parseInt(playerStatData.value) || 0;
          break;
        case 'red cards':
          stats.red_cards = parseInt(playerStatData.value) || 0;
          break;
        case 'minutes played':
          stats.minutes_played = parseInt(playerStatData.value) || 0;
          break;
        case 'clean sheet':
          stats.clean_sheet = playerStatData.value === 1 || playerStatData.value === true;
          break;
        case 'goals conceded':
          stats.goals_conceded = parseInt(playerStatData.value) || 0;
          break;
        case 'penalties saved':
          stats.penalties_saved = parseInt(playerStatData.value) || 0;
          break;
      }
    }

    return stats;
  }

  // Identificar jugadores destacados de una jornada
  identifyStandoutPlayers(players, threshold = 10) {
    const standoutPlayers = players
      .filter(player => player.fantasy_points >= threshold)
      .sort((a, b) => b.fantasy_points - a.fantasy_points);

    return {
      mvp: standoutPlayers[0] || null,
      top_performers: standoutPlayers.slice(0, 5),
      total_analyzed: players.length
    };
  }

  // Generar insights automáticos para contenido
  generateInsights(matchesData) {
    const allPlayers = [];
    const insights = {
      total_matches: matchesData.length,
      total_players: 0,
      avg_score: 0,
      mvp_match: null,
      top_scorers: [],
      surprises: [], // Jugadores poco conocidos con buena puntuación
      disasters: []  // Jugadores con puntuación muy baja
    };

    // Recopilar todos los jugadores
    matchesData.forEach(match => {
      allPlayers.push(...match.players);
    });

    insights.total_players = allPlayers.length;

    if (allPlayers.length > 0) {
      // Calcular puntuación promedio
      const totalPoints = allPlayers.reduce((sum, player) => sum + player.fantasy_points, 0);
      insights.avg_score = (totalPoints / allPlayers.length).toFixed(2);

      // Top scorers
      insights.top_scorers = allPlayers
        .sort((a, b) => b.fantasy_points - a.fantasy_points)
        .slice(0, 10);

      // MVP del partido
      insights.mvp_match = insights.top_scorers[0];

      // Sorpresas (jugadores con muy buena puntuación)
      insights.surprises = allPlayers
        .filter(player => player.fantasy_points >= 15)
        .slice(0, 5);

      // Desastres (jugadores con puntuación negativa)
      insights.disasters = allPlayers
        .filter(player => player.fantasy_points < 0)
        .sort((a, b) => a.fantasy_points - b.fantasy_points)
        .slice(0, 5);
    }

    return insights;
  }
}

module.exports = FantasyDataProcessor;