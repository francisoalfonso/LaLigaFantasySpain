/**
 * Script de test E2E para el flujo en 3 fases (FASE 1, 2, 3)
 *
 * Uso:
 *   node scripts/veo3/test-phased-workflow.js
 *
 * Este script:
 * 1. Ejecuta FASE 1: prepare-session (guión + 3 imágenes Nano Banana)
 * 2. Ejecuta FASE 2: generate-segment 3 veces (segmentos 0, 1, 2)
 * 3. Ejecuta FASE 3: finalize-session (concatenación + logo outro)
 * 4. Muestra resumen completo con URLs y costos
 *
 * Ventajas:
 * - Sesiones cortas (2-4 min cada una, sin timeouts)
 * - Permite reintentar segmentos individuales si fallan
 * - Progreso visible en tiempo real
 */

const axios = require('axios');
const _fs = require('fs');
const _path = require('path');

const BASE_URL = 'http://localhost:3000';

// Datos del jugador para test
const TEST_PLAYER_DATA = {
    name: 'Pere Milla',
    team: 'Valencia CF',
    price: 5.8,
    stats: {
        goals: 3,
        assists: 2,
        rating: 7.2
    }
};

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  🎬 Test E2E - Flujo en 3 Fases (Nano Banana → VEO3 → Concatenación)      ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`📋 Player: ${TEST_PLAYER_DATA.name}`);
console.log(`💰 Precio: €${TEST_PLAYER_DATA.price}`);
console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\n`);

async function main() {
    const startTime = Date.now();
    let sessionId = null;

    try {
        // ============================================================================
        // FASE 1: PREPARAR SESIÓN (guión + 3 imágenes Nano Banana)
        // ============================================================================
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 1: PREPARANDO SESIÓN (guión + 3 imágenes Nano Banana)');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const phase1Start = Date.now();

        const prepareResponse = await axios.post(
            `${BASE_URL}/api/veo3/prepare-session`,
            {
                contentType: 'chollo',
                playerData: TEST_PLAYER_DATA,
                preset: 'chollo_viral',
                viralData: {
                    gameweek: 'jornada 5',
                    xgIncrease: '30'
                }
            },
            {
                timeout: 300000 // 5 minutos
            }
        );

        const phase1Duration = ((Date.now() - phase1Start) / 1000).toFixed(1);

        if (!prepareResponse.data.success) {
            throw new Error(`FASE 1 falló: ${prepareResponse.data.message}`);
        }

        sessionId = prepareResponse.data.data.sessionId;

        console.log(`✅ FASE 1 COMPLETADA en ${phase1Duration}s\n`);
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

        // Mostrar segmentos del guión
        console.log('📝 Segmentos del guión:');
        prepareResponse.data.data.script.segments.forEach((seg, idx) => {
            console.log(`   ${idx + 1}. ${seg.role}: "${seg.dialogue.substring(0, 60)}..."`);
            console.log(
                `      Emotion: ${seg.emotion}, Shot: ${seg.shot}, Duration: ${seg.duration}s`
            );
        });

        console.log('\n⏱️  Esperando 5s antes de FASE 2...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // ============================================================================
        // FASE 2: GENERAR SEGMENTOS INDIVIDUALES (3 veces)
        // ============================================================================
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 2: GENERANDO SEGMENTOS INDIVIDUALES');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const phase2Start = Date.now();
        const segmentResults = [];

        for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
            const segmentNum = segmentIndex + 1;

            console.log(`\n🎬 Generando segmento ${segmentNum}/3...`);

            const segmentStart = Date.now();

            const segmentResponse = await axios.post(
                `${BASE_URL}/api/veo3/generate-segment`,
                {
                    sessionId: sessionId,
                    segmentIndex: segmentIndex
                },
                {
                    timeout: 300000 // 5 minutos
                }
            );

            const segmentDuration = ((Date.now() - segmentStart) / 1000).toFixed(1);

            if (!segmentResponse.data.success) {
                throw new Error(`Segmento ${segmentNum} falló: ${segmentResponse.data.message}`);
            }

            const segment = segmentResponse.data.data.segment;

            console.log(`✅ Segmento ${segmentNum} completado en ${segmentDuration}s`);
            console.log(`   Task ID: ${segment.taskId}`);
            console.log(`   File: ${segment.filename}`);
            console.log(
                `   Size: ${segment.size ? (segment.size / 1024 / 1024).toFixed(2) : 'N/A'} MB`
            );
            console.log(`   Progreso: ${segmentResponse.data.data.session.progress}`);

            segmentResults.push({
                index: segmentIndex,
                number: segmentNum,
                taskId: segment.taskId,
                filename: segment.filename,
                duration: segmentDuration
            });

            // Delay entre segmentos (excepto el último)
            if (segmentIndex < 2) {
                console.log('\n⏱️  Esperando 10s antes del siguiente segmento...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        const phase2Duration = ((Date.now() - phase2Start) / 1000).toFixed(1);

        console.log(`\n✅ FASE 2 COMPLETADA en ${phase2Duration}s`);
        console.log(`📊 Segmentos generados: ${segmentResults.length}/3`);

        console.log('\n⏱️  Esperando 5s antes de FASE 3...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // ============================================================================
        // FASE 3: FINALIZAR SESIÓN (concatenación + logo outro)
        // ============================================================================
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 3: FINALIZANDO SESIÓN (concatenación + logo outro)');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const phase3Start = Date.now();

        const finalizeResponse = await axios.post(
            `${BASE_URL}/api/veo3/finalize-session`,
            {
                sessionId: sessionId
            },
            {
                timeout: 120000 // 2 minutos
            }
        );

        const phase3Duration = ((Date.now() - phase3Start) / 1000).toFixed(1);

        if (!finalizeResponse.data.success) {
            throw new Error(`FASE 3 falló: ${finalizeResponse.data.message}`);
        }

        console.log(`✅ FASE 3 COMPLETADA en ${phase3Duration}s\n`);
        console.log(`📹 Video final: ${finalizeResponse.data.data.finalVideo.url}`);
        console.log(`📁 Output path: ${finalizeResponse.data.data.finalVideo.outputPath}`);
        console.log(`⏱️  Duración total: ${finalizeResponse.data.data.finalVideo.duration}s`);

        // ============================================================================
        // RESUMEN FINAL
        // ============================================================================
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ TEST E2E COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log('📊 RESUMEN DEL FLUJO:\n');

        console.log(`Player: ${TEST_PLAYER_DATA.name} (${TEST_PLAYER_DATA.team})`);
        console.log(`Precio: €${TEST_PLAYER_DATA.price}\n`);

        console.log('⏱️  TIEMPOS:');
        console.log(`   FASE 1 (Preparación):     ${phase1Duration}s`);
        console.log(`   FASE 2 (Generación):      ${phase2Duration}s`);
        console.log(`   FASE 3 (Finalización):    ${phase3Duration}s`);
        console.log(`   ──────────────────────────────────`);
        console.log(
            `   TOTAL:                    ${totalDuration}s (${(totalDuration / 60).toFixed(1)} min)\n`
        );

        console.log('💰 COSTOS:');
        console.log(
            `   Nano Banana:              $${prepareResponse.data.data.costs.nanoBanana.toFixed(3)}`
        );
        console.log(`   VEO3 (3 segmentos):       $${(0.3 * 3).toFixed(3)}`);
        console.log(`   ──────────────────────────────────`);
        console.log(
            `   TOTAL:                    $${(prepareResponse.data.data.costs.nanoBanana + 0.9).toFixed(3)}\n`
        );

        console.log('📂 ARCHIVOS GENERADOS:');
        console.log(`   Session ID:               ${sessionId}`);
        console.log(
            `   Session Dir:              ${prepareResponse.data.data.sessionDir || finalizeResponse.data.data.sessionDir}`
        );
        console.log(`   Video final:              ${finalizeResponse.data.data.finalVideo.url}\n`);

        console.log('🎬 SEGMENTOS:');
        segmentResults.forEach(seg => {
            console.log(`   ${seg.number}. ${seg.filename} (${seg.duration}s)`);
        });

        console.log('\n💡 PRÓXIMOS PASOS:');
        console.log(`   1. Visualizar video en: ${finalizeResponse.data.data.finalVideo.url}`);
        console.log(`   2. Añadir subtítulos virales (opcional)`);
        console.log(`   3. Añadir player card overlay (opcional)`);
        console.log(`   4. Publicar en Instagram/TikTok\n`);

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN TEST E2E:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (sessionId) {
            console.error(`\n📁 Session ID con error: ${sessionId}`);
            console.error(
                `   Puedes intentar continuar desde donde falló usando los endpoints individuales.`
            );
        }

        process.exit(1);
    }
}

main();
