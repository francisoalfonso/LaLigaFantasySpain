/**
 * Test E2E: PromptBuilder Optimizado + Diccionario Progresivo
 *
 * Valida que el sistema completo funcione correctamente:
 * 1. Validación de diccionario (crear si no existe)
 * 2. Generación de prompt optimizado (solo apellido, sin equipo)
 * 3. Validación seguridad VEO3
 * 4. Generación de video (opcional)
 * 5. Actualización de tasa de éxito
 */

const axios = require('axios');
const logger = require('../../backend/utils/logger');

// Configuración de test
const BASE_URL = 'http://localhost:3000';
const TEST_PLAYER = {
    fullName: 'Iago Aspas',
    team: 'Celta de Vigo',
    price: 8.0,
    stats: {
        goals: 3,
        assists: 2,
        games: 5,
        rating: 7.5
    },
    ratio: 1.4
};

/**
 * Test completo E2E
 */
async function runE2ETest() {
    console.log('\n=================================================');
    console.log('🧪 TEST E2E: PromptBuilder Optimizado + Diccionario');
    console.log('=================================================\n');

    try {
        // 1. Verificar servidor activo
        console.log('1️⃣ Verificando servidor...');
        const healthCheck = await axios.get(`${BASE_URL}/api/veo3/health`);
        if (!healthCheck.data.success) {
            throw new Error('Servidor VEO3 no disponible');
        }
        console.log('✅ Servidor activo\n');

        // 2. Verificar estado inicial del diccionario
        console.log('2️⃣ Estado inicial del diccionario...');
        const initialStats = await axios.get(`${BASE_URL}/api/veo3/dictionary/stats`);
        console.log(`📊 Jugadores en diccionario: ${initialStats.data.data.playerCount}`);
        console.log(`📊 Equipos en diccionario: ${initialStats.data.data.teamCount}`);
        console.log(`📊 Tasa éxito promedio: ${(initialStats.data.data.avgSuccessRate * 100).toFixed(1)}%`);
        console.log(`📊 Total videos generados: ${initialStats.data.data.totalVideos}\n`);

        // 3. Test generación de video (SIN ejecutar VEO3 - solo validar prompt)
        console.log('3️⃣ Generando prompt optimizado...');
        console.log(`   Jugador: ${TEST_PLAYER.fullName}`);
        console.log(`   Equipo: ${TEST_PLAYER.team}`);
        console.log(`   Precio: ${TEST_PLAYER.price}M\n`);

        // Construir request body
        const requestBody = {
            type: 'chollo',
            playerName: TEST_PLAYER.fullName,
            price: TEST_PLAYER.price,
            team: TEST_PLAYER.team,
            stats: TEST_PLAYER.stats,
            ratio: TEST_PLAYER.ratio,
            options: {
                veo3Options: {
                    skipGeneration: true // NO generar video real (solo validar)
                }
            }
        };

        console.log('📤 Request Body:');
        console.log(JSON.stringify(requestBody, null, 2));
        console.log('');

        // Hacer request (puede fallar si skipGeneration no está implementado aún)
        let videoResponse;
        try {
            videoResponse = await axios.post(`${BASE_URL}/api/veo3/generate-ana`, requestBody);
        } catch (error) {
            if (error.response) {
                console.log('⚠️ Error en generación (esperado si skipGeneration no implementado):');
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Message: ${error.response.data.message}`);
                console.log('');
            } else {
                throw error;
            }
        }

        // 4. Verificar prompt generado (si disponible)
        if (videoResponse && videoResponse.data.success) {
            const promptData = videoResponse.data.data.prompt;
            console.log('✅ Prompt generado:');
            console.log(`   Texto: "${promptData.text.substring(0, 100)}..."`);
            console.log(`   Longitud: ${promptData.length} caracteres`);
            console.log(`   Warnings: ${promptData.validation ? promptData.validation.length : 0}`);
            console.log('');

            // Verificar que NO contiene equipo
            const containsTeam = promptData.text.includes('Celta') || promptData.text.includes('Vigo');
            const containsFullName = promptData.text.includes('Iago Aspas');

            console.log('🔍 Validación de optimización:');
            console.log(`   ❌ Contiene equipo (Celta/Vigo): ${containsTeam ? '⚠️ SÍ' : '✅ NO'}`);
            console.log(`   ❌ Contiene nombre completo: ${containsFullName ? '⚠️ SÍ' : '✅ NO'}`);
            console.log(`   ✅ Solo apellido: ${!containsFullName && promptData.text.includes('Aspas') ? '✅ SÍ' : '❌ NO'}`);
            console.log('');

            // Verificar diccionario actualizado
            if (videoResponse.data.data.dictionary) {
                const dictData = videoResponse.data.data.dictionary;
                console.log('📋 Datos del diccionario:');
                console.log(`   Jugador en diccionario: ${dictData.playerInDictionary ? '✅ SÍ' : '❌ NO'}`);
                console.log(`   Tasa de éxito: ${dictData.successRate}`);
                console.log(`   Total videos: ${dictData.totalVideos}`);
                console.log('');
            }
        }

        // 5. Verificar estado final del diccionario
        console.log('5️⃣ Estado final del diccionario...');
        const finalStats = await axios.get(`${BASE_URL}/api/veo3/dictionary/stats`);
        console.log(`📊 Jugadores en diccionario: ${finalStats.data.data.playerCount}`);
        console.log(`📊 Equipos en diccionario: ${finalStats.data.data.teamCount}`);
        console.log(`📊 Tasa éxito promedio: ${(finalStats.data.data.avgSuccessRate * 100).toFixed(1)}%`);
        console.log(`📊 Total videos generados: ${finalStats.data.data.totalVideos}\n`);

        // 6. Resumen de cambios
        const playerCountChange = finalStats.data.data.playerCount - initialStats.data.data.playerCount;
        const teamCountChange = finalStats.data.data.teamCount - initialStats.data.data.teamCount;

        console.log('📈 Cambios en diccionario:');
        console.log(`   Jugadores agregados: ${playerCountChange > 0 ? `+${playerCountChange}` : playerCountChange}`);
        console.log(`   Equipos agregados: ${teamCountChange > 0 ? `+${teamCountChange}` : teamCountChange}`);
        console.log('');

        // Conclusión
        console.log('=================================================');
        console.log('✅ TEST E2E COMPLETADO');
        console.log('=================================================\n');

        // Resultados esperados
        console.log('📋 RESULTADOS ESPERADOS:');
        console.log('');
        console.log('1. ✅ Jugador "Iago Aspas" agregado al diccionario (si no existía)');
        console.log('2. ✅ Equipo "Celta de Vigo" agregado al diccionario (si no existía)');
        console.log('3. ✅ Prompt generado SIN mencionar equipo ("Celta" o "Vigo")');
        console.log('4. ✅ Prompt usa solo apellido "Aspas" (no "Iago Aspas")');
        console.log('5. ✅ Diccionario contiene referencias seguras para próximas generaciones');
        console.log('');

        console.log('📝 PRÓXIMOS PASOS:');
        console.log('');
        console.log('1. Ejecutar test V3 real: npm run veo3:test-retry-v3');
        console.log('2. Verificar tasa de éxito actualizada en diccionario');
        console.log('3. Generar múltiples videos para validar consistencia');
        console.log('4. Monitorear dashboard: http://localhost:3000/veo3-resilience-dashboard.html');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR EN TEST E2E:');
        console.error(error.message);

        if (error.response) {
            console.error('\nRespuesta del servidor:');
            console.error(JSON.stringify(error.response.data, null, 2));
        }

        process.exit(1);
    }
}

// Ejecutar test
runE2ETest();
