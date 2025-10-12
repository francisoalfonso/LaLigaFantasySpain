/**
 * Verificar estructura exacta de la respuesta de jugadores
 */

const axios = require('axios');
require('dotenv').config();

async function testPlayerStructure() {
    console.log('🔍 Analizando estructura de respuesta de jugadores...\n');

    const apiKey = process.env.API_FOOTBALL_KEY;

    try {
        const response = await axios.get('https://v3.football.api-sports.io/players', {
            headers: {
                'x-apisports-key': apiKey
            },
            params: {
                league: 140,
                season: 2025,
                page: 1
            },
            timeout: 10000
        });

        console.log(`✅ Total jugadores en página 1: ${response.data.results}`);
        console.log(`📄 Paginación:`, response.data.paging);
        console.log('');

        if (response.data.response && response.data.response.length > 0) {
            console.log('📊 Estructura del primer jugador:');
            console.log(JSON.stringify(response.data.response[0], null, 2));

            console.log(`\n${'='.repeat(60)}`);
            console.log('🎯 Mapeo de campos importantes:');
            console.log('='.repeat(60));

            const player = response.data.response[0];
            console.log('player.id:', player.player?.id);
            console.log('player.name:', player.player?.name);
            console.log('player.firstname:', player.player?.firstname);
            console.log('player.lastname:', player.player?.lastname);
            console.log('player.age:', player.player?.age);
            console.log('player.photo:', player.player?.photo);
            console.log('');
            console.log('team:', player.statistics?.[0]?.team);
            console.log('team.id:', player.statistics?.[0]?.team?.id);
            console.log('team.name:', player.statistics?.[0]?.team?.name);
            console.log('team.logo:', player.statistics?.[0]?.team?.logo);
            console.log('');
            console.log('position:', player.statistics?.[0]?.games?.position);
            console.log('games:', player.statistics?.[0]?.games);

            console.log(`\n${'='.repeat(60)}`);
            console.log('🔍 Primeros 10 jugadores con info completa:');
            console.log('='.repeat(60));

            response.data.response.slice(0, 10).forEach((p, idx) => {
                console.log(`${idx + 1}. ${p.player.name}`);
                console.log(`   Team: ${p.statistics?.[0]?.team?.name || 'N/A'}`);
                console.log(`   Position: ${p.statistics?.[0]?.games?.position || 'N/A'}`);
                console.log(`   Age: ${p.player.age || 'N/A'}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

// Ejecutar
testPlayerStructure()
    .then(() => {
        console.log('✅ Análisis completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal:', error.message);
        process.exit(1);
    });
