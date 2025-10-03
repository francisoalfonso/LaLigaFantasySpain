/**
 * Test E2E - Pepelu (Valencia) - 4 Segmentos
 * Verificar todos los fixes aplicados
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

const TEST_CONFIG = {
    playerName: 'Pepelu',
    team: 'Valencia',
    price: 6.0,
    stats: {
        goals: 1,
        assists: 2,
        games: 5
    },
    valueRatio: 1.3
};

async function main() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🧪 TEST E2E: PEPELU - 4 SEGMENTOS (32s)');
    console.log(`${'='.repeat(80)}\n`);

    console.log('📋 Configuración Test:');
    console.log(`   Jugador: ${TEST_CONFIG.playerName} (${TEST_CONFIG.team})`);
    console.log(`   Precio: ${TEST_CONFIG.price}M`);
    console.log(`   Stats: ${TEST_CONFIG.stats.goals}G + ${TEST_CONFIG.stats.assists}A`);
    console.log(`   Ratio valor: ${TEST_CONFIG.valueRatio}x\n`);

    try {
        console.log('⏳ Generando video chollo 4 segmentos...\n');

        const response = await axios.post(`${API_BASE}/api/veo3/generate-multi-segment`, {
            contentType: 'chollo',
            preset: 'chollo_viral',
            playerData: {
                name: TEST_CONFIG.playerName,
                team: TEST_CONFIG.team,
                price: TEST_CONFIG.price,
                stats: TEST_CONFIG.stats,
                valueRatio: TEST_CONFIG.valueRatio
            }
        }, {
            timeout: 1800000
        });

        if (response.data.success) {
            console.log('\n✅ TEST EXITOSO!\n');
            console.log('📹 Video generado:', response.data.data.videoUrl);
            console.log('⏱️  Duración:', response.data.data.duration, 's');
            console.log('💰 Costo:', '$' + response.data.data.totalCost);
        } else {
            console.log('\n❌ TEST FALLÓ\n');
            console.log('Error:', response.data.message);
        }
    } catch (error) {
        console.log('\n❌ ERROR EN TEST:\n');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message);
        console.log('Error:', error.response?.data?.error);
        process.exit(1);
    }
}

main();
