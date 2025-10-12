/**
 * Script de prueba detallada para ver respuesta exacta de API-Sports
 */

const axios = require('axios');
require('dotenv').config();

async function testApiDetailed() {
    console.log('🔍 Test detallado de API-Sports...\n');

    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
        console.error('❌ API_FOOTBALL_KEY no encontrada en .env');
        process.exit(1);
    }

    console.log(`✅ API Key encontrada (primeros 10 chars): ${apiKey.substring(0, 10)}...`);
    console.log(`✅ API Key longitud: ${apiKey.length} caracteres\n`);

    // Test 1: /status endpoint
    console.log('='.repeat(60));
    console.log('TEST 1: /status - Verificar cuota y plan');
    console.log('='.repeat(60));

    try {
        const statusResponse = await axios.get('https://v3.football.api-sports.io/status', {
            headers: {
                'x-apisports-key': apiKey
            },
            timeout: 10000
        });

        console.log('✅ Status Response:');
        console.log(JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
        console.error('❌ Error en /status:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Headers:', error.response?.headers);
    }

    console.log('');

    // Test 2: /leagues endpoint
    console.log('='.repeat(60));
    console.log('TEST 2: /leagues - Info de La Liga');
    console.log('='.repeat(60));

    try {
        const leaguesResponse = await axios.get('https://v3.football.api-sports.io/leagues', {
            headers: {
                'x-apisports-key': apiKey
            },
            params: {
                id: 140,
                season: 2025
            },
            timeout: 10000
        });

        console.log('✅ Leagues Response:');
        console.log(JSON.stringify(leaguesResponse.data, null, 2));
    } catch (error) {
        console.error('❌ Error en /leagues:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('');

    // Test 3: /players endpoint con temporada 2024
    console.log('='.repeat(60));
    console.log('TEST 3: /players - Temporada 2024 (fallback)');
    console.log('='.repeat(60));

    try {
        const playersResponse = await axios.get('https://v3.football.api-sports.io/players', {
            headers: {
                'x-apisports-key': apiKey
            },
            params: {
                league: 140,
                season: 2024,
                page: 1
            },
            timeout: 10000
        });

        console.log('✅ Players Response (temporada 2024):');
        console.log(`Results: ${playersResponse.data.results}`);
        console.log(`Paging:`, playersResponse.data.paging);

        if (playersResponse.data.response && playersResponse.data.response.length > 0) {
            console.log('\nPrimeros 3 jugadores:');
            playersResponse.data.response.slice(0, 3).forEach(p => {
                console.log(`  - ${p.player.name} (${p.team?.name || 'N/A'})`);
            });
        }
    } catch (error) {
        console.error('❌ Error en /players (2024):');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('');

    // Test 4: /players endpoint con temporada 2025
    console.log('='.repeat(60));
    console.log('TEST 4: /players - Temporada 2025 (actual)');
    console.log('='.repeat(60));

    try {
        const playersResponse = await axios.get('https://v3.football.api-sports.io/players', {
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

        console.log('✅ Players Response (temporada 2025):');
        console.log(`Results: ${playersResponse.data.results}`);
        console.log(`Paging:`, playersResponse.data.paging);

        if (playersResponse.data.response && playersResponse.data.response.length > 0) {
            console.log('\nPrimeros 3 jugadores:');
            playersResponse.data.response.slice(0, 3).forEach(p => {
                console.log(`  - ${p.player.name} (${p.team?.name || 'N/A'})`);
            });
        }
    } catch (error) {
        console.error('❌ Error en /players (2025):');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Test detallado completado');
    console.log('='.repeat(60));
}

// Ejecutar
testApiDetailed()
    .then(() => {
        console.log('\n✅ Pruebas completadas');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error fatal:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
