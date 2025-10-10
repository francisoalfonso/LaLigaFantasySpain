/**
 * TEST RÁPIDO - Un solo jugador con datos reales
 */

require('dotenv').config();
const BargainAnalyzer = require('../../backend/services/bargainAnalyzer');
const ApiFootballClient = require('../../backend/services/apiFootball');

async function main() {
  console.log('🧪 Test rápido BargainAnalyzer V2 - Datos reales\n');

  const apiClient = new ApiFootballClient();
  const analyzer = new BargainAnalyzer(apiClient);

  // Usar ID de Joselu (306) - jugador conocido
  const playerId = 306;
  console.log(`📥 Obteniendo datos de jugador ID ${playerId}...`);

  try {
    // Obtener stats del jugador
    const playerData = await apiClient.getPlayerStats(playerId);

    if (!playerData.success || !playerData.data || playerData.data.length === 0) {
      console.log(`❌ Error: ${playerData.error || 'Sin datos'}`);
      return;
    }

    const data = playerData.data[0];

    // Construir objeto player
    const player = {
      id: playerId,
      name: data.player?.name || 'Jugador',
      age: data.player?.age,
      position: 'FWD',
      team: {
        id: data.statistics?.[0]?.team?.id,
        name: data.statistics?.[0]?.team?.name
      },
      stats: {
        games: {
          appearences: data.statistics?.[0]?.games?.appearences || 0,
          minutes: data.statistics?.[0]?.games?.minutes || 0,
          rating: parseFloat(data.statistics?.[0]?.games?.rating) || 0
        },
        goals: data.statistics?.[0]?.goals?.total || 0,
        assists: data.statistics?.[0]?.goals?.assists || 0
      }
    };

    console.log(`✅ ${player.name} - ${player.stats.games.appearences} partidos, ${player.stats.goals} goles\n`);

    console.log(`📊 Estimando puntos (esto puede tardar ~10-15 segundos)...`);

    const startTime = Date.now();
    const estimatedPoints = await analyzer.estimateFantasyPoints(player);
    const endTime = Date.now();

    const estimatedPrice = analyzer.estimatePlayerPrice(player);
    const valueRatio = estimatedPoints / estimatedPrice;

    console.log(`\n✅ Estimación completada en ${((endTime - startTime) / 1000).toFixed(1)}s\n`);

    console.log(`📊 RESULTADOS:`);
    console.log(`   Jugador: ${player.name} (${player.position})`);
    console.log(`   Equipo: ${player.team.name}`);
    console.log(`   Partidos: ${player.stats.games.appearences}`);
    console.log(`   Goles: ${player.stats.goals} | Asistencias: ${player.stats.assists}`);
    console.log(`   Rating: ${player.stats.games.rating}\n`);

    console.log(`💰 ESTIMACIONES:`);
    console.log(`   Puntos: ${estimatedPoints.toFixed(2)} pts/partido`);
    console.log(`   Precio: €${estimatedPrice.toFixed(2)}M`);
    console.log(`   Value ratio: ${valueRatio.toFixed(2)}x\n`);

    // Verificar si los puntos son realistas (>2.0 indica que usa stats DAZN)
    if (estimatedPoints > 2.5) {
      console.log(`✅ Sistema V2 funcionando: puntos realistas (>${2.5})`);
      console.log(`✅ Stats DAZN de partidos individuales están siendo usadas`);
    } else {
      console.log(`⚠️  Puntos muy bajos (${estimatedPoints.toFixed(2)})`);
      console.log(`⚠️  Posible problema: stats DAZN no se están obteniendo`);
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
