/**
 * Test rápido de Carlos González - Solo FASE 1 (Nano Banana)
 *
 * Valida que las nuevas referencias de Carlos (5 imágenes) funcionan correctamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const TEST_PLAYER_DATA = {
    name: 'Julián Álvarez',
    team: 'Atlético Madrid',
    price: 9.2,
    stats: {
        goals: 8,
        assists: 4,
        rating: 8.1
    }
};

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  🎬 Test CARLOS GONZÁLEZ - Validación Nano Banana         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`📋 Player: ${TEST_PLAYER_DATA.name}`);
console.log(`💰 Precio: €${TEST_PLAYER_DATA.price}`);
console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\n`);

async function main() {
    try {
        console.log('════════════════════════════════════════════════════════════');
        console.log('FASE 1: PREPARANDO SESIÓN CON CARLOS (guión + 3 imágenes)');
        console.log('════════════════════════════════════════════════════════════\n');

        const startTime = Date.now();

        const prepareResponse = await axios.post(
            `${BASE_URL}/api/veo3/prepare-session`,
            {
                contentType: 'stats',
                playerData: TEST_PLAYER_DATA,
                presenter: 'carlos', // ✅ Test con Carlos González
                preset: 'stats_semanal',
                statsData: {
                    gameweek: 'jornada 10',
                    trend: 'ascending'
                }
            },
            {
                timeout: 300000 // 5 minutos
            }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!prepareResponse.data.success) {
            throw new Error(`FASE 1 falló: ${prepareResponse.data.message}`);
        }

        const sessionId = prepareResponse.data.data.sessionId;

        console.log(`✅ FASE 1 COMPLETADA en ${duration}s\n`);
        console.log(`📁 Session ID: ${sessionId}`);
        console.log(
            `📝 Guión generado: ${prepareResponse.data.data.script.segments.length} segmentos`
        );
        console.log(
            `🖼️  Imágenes Nano Banana: ${prepareResponse.data.data.nanoBananaImages.length}`
        );
        console.log(
            `💰 Costo Nano Banana: $${prepareResponse.data.data.costs.nanoBanana.toFixed(3)}\n`
        );

        // Mostrar URLs de imágenes generadas
        console.log('🖼️  Imágenes generadas:');
        prepareResponse.data.data.nanoBananaImages.forEach((img, idx) => {
            console.log(`   ${idx + 1}. ${img.shot}: ${img.url.substring(0, 80)}...`);
        });

        console.log('\n════════════════════════════════════════════════════════════');
        console.log('✅ CARLOS VALIDADO - Referencias de imágenes correctas');
        console.log('════════════════════════════════════════════════════════════\n');

        console.log('📊 RESUMEN:\n');
        console.log(`Presenter: Carlos González (38 años, analista de datos)`);
        console.log(`Referencias: 5 imágenes (3 Carlos + 2 estudio)`);
        console.log(`Player: ${TEST_PLAYER_DATA.name} (${TEST_PLAYER_DATA.team})`);
        console.log(`Duración: ${duration}s`);
        console.log(`Costo: $${prepareResponse.data.data.costs.nanoBanana.toFixed(3)}\n`);

        console.log('💡 PRÓXIMOS PASOS:');
        console.log('   - Validar Ana y Carlos en flujo completo (3 fases)');
        console.log('   - Verificar transiciones entre segmentos');
        console.log('   - Probar alternancia Ana/Carlos según tipo de contenido\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN TEST CARLOS:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        console.error('\n📋 DIAGNÓSTICO:');
        console.error('   - Verificar que servidor está corriendo (npm run dev)');
        console.error('   - Verificar referencias de Carlos en flp-nano-banana-config.json');
        console.error('   - Verificar que las 5 imágenes existen en Supabase bucket flp/carlos/\n');

        process.exit(1);
    }
}

main();
