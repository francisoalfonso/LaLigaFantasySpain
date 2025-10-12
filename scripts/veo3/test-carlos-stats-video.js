/**
 * Test Carlos González - Video de Stats Semanales
 *
 * Objetivo: Verificar que Carlos (seed 30002) genera videos correctamente con:
 * - Imagen fija de Supabase
 * - Character bible de analista de datos
 * - Tone analítico y profesional
 * - Contenido de estadísticas
 *
 * Uso:
 *   node scripts/veo3/test-carlos-stats-video.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  📊 TEST CARLOS GONZÁLEZ - Video Stats Semanales (Seed 30002)               ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\n`);

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE CARLOS
// ════════════════════════════════════════════════════════════════════════════════

const CARLOS_CONFIG = {
    seed: 30002, // ⚠️ SEED ÚNICO DE CARLOS - NUNCA CAMBIAR
    imageUrl:
        'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/carlos/carlos-gonzalez-01.jpg',
    characterBible:
        'A 38-year-old Spanish sports data analyst with short dark hair with gray streaks, brown eyes, athletic build, wearing a blue tech shirt with Fantasy La Liga logo. Confident analytical expression, professional posture, data-driven broadcaster energy'
};

// ════════════════════════════════════════════════════════════════════════════════
// CONTENIDO DE TEST: Stats Comparativa Semanal
// ════════════════════════════════════════════════════════════════════════════════

const TEST_CONTENT = {
    contentType: 'stats_weekly',
    presenter: 'carlos', // ⚠️ NUEVO: Selector de presentador
    title: 'Top 5 Mediocampistas Jornada 9',
    segments: [
        {
            duration: 8,
            script: 'Esta semana tenemos datos sorprendentes en el centro del campo. Los números no mienten.',
            emotion: 'analytical',
            camera: 'medium',
            studio: 'tech'
        },
        {
            duration: 14,
            script: 'El jugador con mejor rendimiento alcanzó 8.5 de rating promedio, con 2 goles y 3 asistencias en los últimos 3 partidos. Su eficiencia por millón es excepcional.',
            emotion: 'revealing',
            camera: 'analytical',
            studio: 'comparative'
        },
        {
            duration: 8,
            script: 'Basado en estas estadísticas, la mejor inversión Fantasy está clara. Los datos hablan por sí solos.',
            emotion: 'authoritative',
            camera: 'closeup',
            studio: 'tech'
        }
    ],
    playerData: {
        name: 'Test Player', // Nombre genérico para test
        team: 'Real Madrid',
        position: 'Midfielder',
        price: 6.5,
        rating: 8.5,
        stats: {
            goals: 2,
            assists: 3,
            rating: 8.5
        }
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════

async function main() {
    const startTime = Date.now();

    try {
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 1: VERIFICANDO SERVIDOR');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log('🔍 Verificando conexión al servidor...');
        const pingResponse = await axios.get(`${BASE_URL}/api/test/ping`, {
            timeout: 5000
        });

        if (!pingResponse.data.success) {
            throw new Error('Servidor no responde correctamente');
        }

        console.log('✅ Servidor activo\n');

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 2: VERIFICAR IMAGEN DE CARLOS
        // ════════════════════════════════════════════════════════════════════════════════

        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 2: VERIFICANDO IMAGEN DE CARLOS');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log(`🖼️  URL: ${CARLOS_CONFIG.imageUrl}`);
        console.log('🔍 Verificando accesibilidad...');

        const imageResponse = await axios.head(CARLOS_CONFIG.imageUrl, {
            timeout: 10000
        });

        if (imageResponse.status !== 200) {
            throw new Error(`Imagen no accesible: HTTP ${imageResponse.status}`);
        }

        const imageSizeMB = (
            parseInt(imageResponse.headers['content-length']) /
            (1024 * 1024)
        ).toFixed(2);
        console.log(`✅ Imagen accesible (${imageSizeMB} MB)\n`);

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 3: PREPARAR SESIÓN CON CARLOS
        // ════════════════════════════════════════════════════════════════════════════════

        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 3: PREPARANDO SESIÓN VEO3 CON CARLOS');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const preparePayload = {
            contentType: TEST_CONTENT.contentType,
            presenter: 'carlos', // ⚠️ SELECTOR DE PRESENTADOR
            playerData: TEST_CONTENT.playerData,
            customScript: TEST_CONTENT.segments,
            config: {
                seed: CARLOS_CONFIG.seed,
                imageUrl: CARLOS_CONFIG.imageUrl,
                characterBible: CARLOS_CONFIG.characterBible
            }
        };

        console.log('📦 Payload:');
        console.log(JSON.stringify(preparePayload, null, 2));
        console.log('\n🎬 Iniciando preparación (guión + Nano Banana)...\n');

        const prepareResponse = await axios.post(
            `${BASE_URL}/api/veo3/prepare-session`,
            preparePayload,
            {
                timeout: 600000 // 10 minutos
            }
        );

        if (!prepareResponse.data.success) {
            throw new Error(`Preparación falló: ${prepareResponse.data.message}`);
        }

        const sessionId = prepareResponse.data.data.sessionId;

        console.log('✅ PREPARACIÓN COMPLETADA');
        console.log(`📁 Session ID: ${sessionId}`);
        console.log(`📝 Guión: ${prepareResponse.data.data.script.segments.length} segmentos`);
        console.log(`🖼️  Imágenes: ${prepareResponse.data.data.nanoBananaImages.length}\n`);

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 4: GENERAR SEGMENTOS
        // ════════════════════════════════════════════════════════════════════════════════

        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 4: GENERANDO SEGMENTOS VEO3');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const segmentCount = prepareResponse.data.data.script.segments.length;

        for (let i = 0; i < segmentCount; i++) {
            console.log(`🎬 Generando segmento ${i + 1}/${segmentCount}...`);

            const segmentResponse = await axios.post(
                `${BASE_URL}/api/veo3/generate-segment`,
                {
                    sessionId: sessionId,
                    segmentIndex: i
                },
                {
                    timeout: 300000 // 5 minutos
                }
            );

            if (!segmentResponse.data.success) {
                throw new Error(`Segmento ${i + 1} falló: ${segmentResponse.data.message}`);
            }

            const segment = segmentResponse.data.data.segment;
            console.log(`✅ Segmento ${i + 1} completado - Task ID: ${segment.taskId}`);
            console.log(`   Progreso: ${segmentResponse.data.data.session.progress}\n`);

            // Delay entre segmentos
            if (i < segmentCount - 1) {
                console.log('⏱️  Esperando 10s antes del siguiente segmento...\n');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        console.log(`✅ ${segmentCount} SEGMENTOS COMPLETADOS\n`);

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 5: FINALIZAR SESIÓN
        // ════════════════════════════════════════════════════════════════════════════════

        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 5: FINALIZANDO SESIÓN');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const finalizeResponse = await axios.post(
            `${BASE_URL}/api/veo3/finalize-session`,
            {
                sessionId: sessionId
            },
            {
                timeout: 120000 // 2 minutos
            }
        );

        if (!finalizeResponse.data.success) {
            throw new Error(`Finalización falló: ${finalizeResponse.data.message}`);
        }

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        // ════════════════════════════════════════════════════════════════════════════════
        // RESUMEN FINAL
        // ════════════════════════════════════════════════════════════════════════════════

        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ TEST CARLOS COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log('📊 RESUMEN:\n');

        console.log('👤 PRESENTADOR:');
        console.log(`   Nombre:                   Carlos González`);
        console.log(`   Seed:                     ${CARLOS_CONFIG.seed}`);
        console.log(`   Imagen:                   ✅ Supabase (${imageSizeMB} MB)`);
        console.log(`   Character Bible:          ✅ Analista de datos\n`);

        console.log('🎬 VIDEO:');
        console.log(`   Contenido:                ${TEST_CONTENT.contentType}`);
        console.log(`   Segmentos:                ${segmentCount}`);
        console.log(`   Duración total:           ~${segmentCount * 8}s`);
        console.log(`   Video final:              ${finalizeResponse.data.data.finalVideo.url}\n`);

        console.log('⏱️  TIEMPO:');
        console.log(
            `   Total:                    ${totalDuration}s (${(totalDuration / 60).toFixed(1)} min)\n`
        );

        console.log('📂 ARCHIVOS:');
        console.log(`   Session:                  output/veo3/sessions/session_${sessionId}/`);
        console.log(`   Config:                   backend/config/veo3/carlosCharacter.js\n`);

        console.log('✅ VALIDACIONES:');
        console.log('   □ Carlos aparece consistente en todos los segmentos');
        console.log('   □ Tono analítico y profesional');
        console.log('   □ Acento español de España (Madrid)');
        console.log('   □ Camisa azul tech con logo visible');
        console.log('   □ Cabello corto oscuro con canas');
        console.log('   □ Postura profesional de broadcaster\n');

        console.log('💡 PRÓXIMOS PASOS:');
        console.log(`   1. Ver video: ${finalizeResponse.data.data.finalVideo.url}`);
        console.log('   2. Validar consistencia visual de Carlos');
        console.log('   3. Validar tone analítico vs viral de Ana');
        console.log('   4. Si OK → Integrar selector en viralVideoBuilder');
        console.log('   5. Crear script de stats semanales automáticas\n');

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN TEST CARLOS:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.code === 'ECONNABORTED') {
            console.error('\n💡 TIMEOUT - Posibles causas:');
            console.error('   - Nano Banana API está lenta');
            console.error('   - VEO3 generación tardó más de lo esperado');
            console.error('   - Problema con imagen de Carlos en Supabase');
        }

        console.error('\n📁 Para debug, revisa:');
        console.error('   - logs/veo3/');
        console.error('   - output/veo3/sessions/');
        console.error('   - backend/config/veo3/carlosCharacter.js');

        process.exit(1);
    }
}

main();
