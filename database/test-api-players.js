/**
 * Script de prueba para diagnosticar por qué API-Sports retorna 0 jugadores
 */

const ApiFootballClient = require('../backend/services/apiFootball');
const logger = require('../backend/utils/logger');

async function testApiPlayers() {
    console.log('🔍 Diagnosticando carga de jugadores desde API-Sports...\n');

    const apiClient = new ApiFootballClient();

    // Test 1: Verificar conexión con API
    console.log('='.repeat(60));
    console.log('TEST 1: Verificando conexión con API-Sports');
    console.log('='.repeat(60));

    try {
        const connectionTest = await apiClient.testConnection();
        console.log('✅ Conexión:', connectionTest);
        console.log('');
    } catch (error) {
        console.error('❌ Error en conexión:', error.message);
        process.exit(1);
    }

    // Test 2: Obtener info de La Liga 2025
    console.log('='.repeat(60));
    console.log('TEST 2: Información de La Liga 2025-26');
    console.log('='.repeat(60));

    try {
        const laLigaInfo = await apiClient.getLaLigaInfo();
        console.log('Liga:', laLigaInfo);
        console.log('');
    } catch (error) {
        console.error('❌ Error obteniendo info de La Liga:', error.message);
    }

    // Test 3: Obtener equipos de La Liga 2025
    console.log('='.repeat(60));
    console.log('TEST 3: Equipos de La Liga 2025-26');
    console.log('='.repeat(60));

    try {
        const teamsResult = await apiClient.getLaLigaTeams();
        console.log(`✅ Equipos encontrados: ${teamsResult.count}`);
        if (teamsResult.success && teamsResult.data.length > 0) {
            console.log('\nPrimeros 5 equipos:');
            teamsResult.data.slice(0, 5).forEach(team => {
                console.log(`  - ${team.name} (ID: ${team.id})`);
            });
        }
        console.log('');
    } catch (error) {
        console.error('❌ Error obteniendo equipos:', error.message);
    }

    // Test 4: Obtener jugadores (página 1) de La Liga 2025
    console.log('='.repeat(60));
    console.log('TEST 4: Jugadores La Liga 2025-26 (Página 1)');
    console.log('='.repeat(60));

    try {
        const playersResult = await apiClient.getLaLigaPlayers(1);
        console.log(`✅ Jugadores encontrados en página 1: ${playersResult.count}`);
        console.log(`Paginación:`, playersResult.pagination);

        if (playersResult.success && playersResult.data.length > 0) {
            console.log('\nPrimeros 5 jugadores:');
            playersResult.data.slice(0, 5).forEach(player => {
                console.log(
                    `  - ${player.name} (${player.team?.name || 'Sin equipo'}) - ${player.position || 'Sin posición'}`
                );
            });
        } else {
            console.error('⚠️ No se encontraron jugadores en la página 1');
        }
        console.log('');
    } catch (error) {
        console.error('❌ Error obteniendo jugadores página 1:', error.message);
    }

    // Test 5: Probar con temporada 2024 (por si 2025 no está disponible aún)
    console.log('='.repeat(60));
    console.log('TEST 5: Probar con temporada 2024 (fallback)');
    console.log('='.repeat(60));

    try {
        const params = {
            league: 140,
            season: 2024,
            page: 1
        };

        const result = await apiClient.makeRequest('/players', params);
        console.log(`✅ Jugadores temporada 2024: ${result.count}`);

        if (result.success && result.data.length > 0) {
            console.log('\nPrimeros 3 jugadores de temporada 2024:');
            result.data.slice(0, 3).forEach(player => {
                console.log(`  - ${player.player.name} (${player.team?.name || 'Sin equipo'})`);
            });
        }
        console.log('');
    } catch (error) {
        console.error('❌ Error obteniendo jugadores temporada 2024:', error.message);
    }

    // Test 6: Obtener todos los jugadores (usando método getAllLaLigaPlayers)
    console.log('='.repeat(60));
    console.log('TEST 6: Método getAllLaLigaPlayers() completo');
    console.log('='.repeat(60));

    try {
        console.log('⏳ Este proceso puede tardar varios minutos...');
        const allPlayersResult = await apiClient.getAllLaLigaPlayers();

        console.log(`✅ Total jugadores cargados: ${allPlayersResult.data?.length || 0}`);
        console.log(`Páginas procesadas: ${allPlayersResult.totalPages || 0}`);

        if (allPlayersResult.success && allPlayersResult.data.length > 0) {
            console.log('\n📊 Estadísticas:');

            // Contar por posición
            const positions = {};
            allPlayersResult.data.forEach(player => {
                const pos = player.position || 'Sin posición';
                positions[pos] = (positions[pos] || 0) + 1;
            });

            console.log('Jugadores por posición:');
            Object.entries(positions).forEach(([pos, count]) => {
                console.log(`  - ${pos}: ${count}`);
            });

            // Contar por equipo (top 5)
            const teams = {};
            allPlayersResult.data.forEach(player => {
                const team = player.team?.name || 'Sin equipo';
                teams[team] = (teams[team] || 0) + 1;
            });

            const topTeams = Object.entries(teams)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            console.log('\nTop 5 equipos con más jugadores:');
            topTeams.forEach(([team, count]) => {
                console.log(`  - ${team}: ${count} jugadores`);
            });
        } else {
            console.error('❌ getAllLaLigaPlayers() retornó 0 jugadores');
            console.error('Respuesta:', allPlayersResult);
        }
        console.log('');
    } catch (error) {
        console.error('❌ Error en getAllLaLigaPlayers():', error.message);
        console.error(error.stack);
    }

    console.log('='.repeat(60));
    console.log('✅ Diagnóstico completado');
    console.log('='.repeat(60));
}

// Ejecutar
testApiPlayers()
    .then(() => {
        console.log('\n✅ Pruebas completadas');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error fatal:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
