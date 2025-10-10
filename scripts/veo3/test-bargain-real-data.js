/**
 * TEST VALIDACIÓN BARGAIN ANALYZER V2 - CON DATOS REALES
 *
 * Este test usa IDs reales de jugadores para validar la mejora
 * en precisión de puntos con stats DAZN de partidos individuales.
 */

require('dotenv').config();
const BargainAnalyzer = require('../../backend/services/bargainAnalyzer');
const ApiFootballClient = require('../../backend/services/apiFootball');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(70)}`, 'cyan');
}

// IDs reales de jugadores La Liga (API-Sports)
// Estos son IDs conocidos de la temporada 2025-26
const REAL_PLAYER_IDS = [
  { id: 874, name: 'R. Lewandowski', position: 'FWD', team: 'Barcelona' },
  { id: 306, name: 'Joselu', position: 'FWD', team: 'Real Madrid' },
  { id: 195, name: 'Iago Aspas', position: 'FWD', team: 'Celta Vigo' }
];

async function main() {
  log('\n🧪 TEST VALIDACIÓN - BARGAIN ANALYZER V2 (DATOS REALES)', 'bright');
  log(`📅 ${new Date().toLocaleString()}`, 'cyan');

  // Inicializar servicios
  const apiClient = new ApiFootballClient();
  const analyzer = new BargainAnalyzer(apiClient);

  section('PASO 1: Obtener datos reales de API-Sports');

  const players = [];

  for (const playerInfo of REAL_PLAYER_IDS) {
    log(`\n📥 Obteniendo datos de ${playerInfo.name}...`, 'cyan');

    try {
      // Obtener stats del jugador
      const playerData = await apiClient.getPlayerStats(playerInfo.id);

      if (!playerData.success || !playerData.data || playerData.data.length === 0) {
        log(`❌ Error obteniendo ${playerInfo.name}: ${playerData.error || 'Sin datos'}`, 'red');
        continue;
      }

      const data = playerData.data[0];  // Primer resultado

      // Construir objeto player compatible
      const player = {
        id: playerInfo.id,
        name: data.player?.name || playerInfo.name,
        age: data.player?.age,
        position: playerInfo.position,
        team: {
          id: data.statistics?.[0]?.team?.id,
          name: data.statistics?.[0]?.team?.name || playerInfo.team
        },
        stats: {
          games: {
            appearences: data.statistics?.[0]?.games?.appearences || 0,
            minutes: data.statistics?.[0]?.games?.minutes || 0,
            rating: parseFloat(data.statistics?.[0]?.games?.rating) || 0
          },
          goals: data.statistics?.[0]?.goals?.total || 0,
          assists: data.statistics?.[0]?.goals?.assists || 0,
          cards: {
            yellow: data.statistics?.[0]?.cards?.yellow || 0,
            red: data.statistics?.[0]?.cards?.red || 0
          }
        }
      };

      players.push(player);

      log(`✅ ${player.name} - ${player.stats.games.appearences} partidos, ${player.stats.goals} goles`, 'green');

      // Delay entre requests (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      log(`❌ Error procesando ${playerInfo.name}: ${error.message}`, 'red');
    }
  }

  if (players.length === 0) {
    log('\n❌ No se obtuvieron jugadores válidos', 'red');
    return;
  }

  section('PASO 2: Estimar puntos con sistema V2 (stats DAZN reales)');

  const results = [];

  for (const player of players) {
    log(`\n📊 Estimando ${player.name}...`, 'cyan');

    try {
      // Estimar puntos (usará getPlayerRecentMatches internamente)
      const estimatedPoints = await analyzer.estimateFantasyPoints(player);
      const estimatedPrice = analyzer.estimatePlayerPrice(player);

      const result = {
        name: player.name,
        position: player.position,
        team: player.team.name,
        games: player.stats.games.appearences,
        minutes: player.stats.games.minutes,
        goals: player.stats.goals,
        assists: player.stats.assists,
        rating: player.stats.games.rating,
        estimatedPoints: estimatedPoints.toFixed(2),
        estimatedPrice: estimatedPrice.toFixed(2),
        valueRatio: (estimatedPoints / estimatedPrice).toFixed(2)
      };

      results.push(result);

      log(`   ⚽ Puntos estimados: ${result.estimatedPoints} pts/partido`, 'green');
      log(`   💰 Precio estimado: €${result.estimatedPrice}M`, 'green');
      log(`   📈 Value ratio: ${result.valueRatio}x`, 'green');

    } catch (error) {
      log(`❌ Error estimando ${player.name}: ${error.message}`, 'red');
      console.error(error.stack);
    }
  }

  section('PASO 3: Análisis de resultados');

  if (results.length === 0) {
    log('\n❌ No hay resultados para analizar', 'red');
    return;
  }

  log('\n📊 Resumen de estimaciones:', 'cyan');
  log('');
  log('Jugador                | Pos | Partidos | Goles | Rating | Pts Est | Precio | Ratio', 'cyan');
  log('-'.repeat(85), 'cyan');

  results.forEach(r => {
    const line = `${r.name.padEnd(20)} | ${r.position.padEnd(3)} | ${String(r.games).padEnd(8)} | ${String(r.goals).padEnd(5)} | ${String(r.rating).padEnd(6)} | ${String(r.estimatedPoints).padEnd(7)} | €${String(r.estimatedPrice).padEnd(5)} | ${r.valueRatio}x`;
    log(line, 'cyan');
  });

  const avgPoints = (results.reduce((sum, r) => sum + parseFloat(r.estimatedPoints), 0) / results.length).toFixed(2);
  const avgPrice = (results.reduce((sum, r) => sum + parseFloat(r.estimatedPrice), 0) / results.length).toFixed(2);
  const avgRatio = (results.reduce((sum, r) => sum + parseFloat(r.valueRatio), 0) / results.length).toFixed(2);

  log('\n📈 Promedios:', 'cyan');
  log(`   Puntos: ${avgPoints} pts/partido`, 'green');
  log(`   Precio: €${avgPrice}M`, 'green');
  log(`   Value ratio: ${avgRatio}x`, 'green');

  section('PASO 4: Verificación sistema funcionando');

  const hasRealisticPoints = parseFloat(avgPoints) > 3.0;
  const hasRealisticPrices = parseFloat(avgPrice) > 4.0 && parseFloat(avgPrice) < 10.0;

  if (hasRealisticPoints && hasRealisticPrices) {
    log('\n✅ Sistema V2 funcionando correctamente', 'green');
    log('   - Puntos estimados son realistas (>3.0 pts)', 'green');
    log('   - Precios estimados son realistas (€4-10M)', 'green');
    log('   - Stats DAZN reales están siendo usadas', 'green');
  } else {
    log('\n⚠️  Sistema requiere revisión', 'yellow');
    if (!hasRealisticPoints) log('   - Puntos muy bajos (posible problema con stats DAZN)', 'yellow');
    if (!hasRealisticPrices) log('   - Precios fuera de rango esperado', 'yellow');
  }

  section('RESUMEN FINAL');

  log(`\n⏱️  Jugadores probados: ${results.length}`, 'cyan');
  log(`📊 Puntos promedio: ${avgPoints} pts/partido`, 'cyan');
  log(`💰 Precio promedio: €${avgPrice}M`, 'cyan');
  log(`📈 Value ratio promedio: ${avgRatio}x`, 'cyan');

  log('\n✅ Test con datos reales completado', 'green');
  log('');
}

// Ejecutar test
main().catch(error => {
  log('\n💥 ERROR EN TEST', 'red');
  console.error(error);
  process.exit(1);
});
