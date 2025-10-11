/**
 * E2E COMPLETO: Chollo Dinámico → Video Viral Instagram
 *
 * Flujo completo desde identificación de chollo hasta video final con:
 * - Datos dinámicos del endpoint /api/bargains/top
 * - Registro automático en diccionario (si no existe)
 * - Generación de guiones con terminología futbolística
 * - Imágenes Nano Banana contextualizadas
 * - Videos VEO3 con progresión cinematográfica
 * - Enhancements: Black flashes (70ms) + Player card + Subtítulos virales
 *
 * Uso:
 *   node scripts/veo3/test-e2e-complete-chollo-viral.js
 */

const axios = require('axios');
const CreativeReferenceGenerator = require('../../backend/services/creativeReferenceGenerator');

const BASE_URL = 'http://localhost:3000';

console.log('\\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  🎬 E2E COMPLETO - Chollo Dinámico → Video Viral Instagram                  ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\\n');

console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\\n`);

async function main() {
    const startTime = Date.now();

    try {
        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 0: IDENTIFICAR CHOLLO TOP
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 0: IDENTIFICANDO CHOLLO TOP');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        console.log('📊 Llamando a /api/bargains/top...');
        const bargainsResponse = await axios.get(`${BASE_URL}/api/bargains/top`, {
            timeout: 120000 // 2 minutos (31 páginas API-Sports)
        });

        if (
            !bargainsResponse.data.success ||
            !bargainsResponse.data.data ||
            bargainsResponse.data.data.length === 0
        ) {
            throw new Error('No se encontraron chollos');
        }

        const topBargain = bargainsResponse.data.data[0];
        console.log(`\\n✅ CHOLLO IDENTIFICADO: ${topBargain.name}`);
        console.log(`   Equipo: ${topBargain.team.name}`);
        console.log(`   Posición: ${topBargain.position}`);
        console.log(`   Precio: €${topBargain.analysis.estimatedPrice}M`);
        console.log(`   Rating: ${topBargain.stats.rating}`);
        console.log(`   Puntos Fantasy: ${topBargain.analysis.estimatedPoints}`);
        console.log(`   Ratio Valor: ${topBargain.analysis.valueRatio.toFixed(2)}\\n`);

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 1: VERIFICAR Y ACTUALIZAR DICCIONARIO
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 1: VERIFICANDO DICCIONARIO DE JUGADORES');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const refGenerator = new CreativeReferenceGenerator();
        const dictionary = refGenerator.dictionary;

        const playerCount = Object.keys(dictionary.players || {}).length;
        console.log(`📖 Diccionario cargado: ${playerCount} jugadores registrados`);

        // Verificar si el jugador ya existe
        const playerExists = dictionary.players && dictionary.players[topBargain.name];

        if (!playerExists) {
            console.log(`\\n⚠️  ${topBargain.name} NO está en el diccionario`);
            console.log('📝 Generando referencias creativas automáticas...\\n');

            // Usar CreativeReferenceGenerator para crear entrada completa
            const playerEntry = refGenerator.updatePlayerInDictionary(topBargain.name, {
                team: topBargain.team.name,
                position: topBargain.position,
                number: topBargain.number || null
            });

            console.log(`✅ Entrada creada para ${topBargain.name}`);
            console.log(`   Referencias generadas: ${playerEntry.safeReferences.length}`);
            console.log(`   → ${playerEntry.safeReferences.slice(0, 5).join(', ')}...\\n`);
        } else {
            console.log(`✅ ${topBargain.name} ya está en el diccionario`);
            const refs = dictionary.players[topBargain.name].safeReferences || [];
            console.log(`   Referencias disponibles: ${refs.length}`);
            console.log(`   → ${refs.slice(0, 5).join(', ')}${refs.length > 5 ? '...' : ''}\\n`);
        }

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 2: PREPARAR DATOS PARA GENERACIÓN
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 2: PREPARANDO WORKFLOW NANO BANANA → VEO3');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const workflowPayload = {
            playerName: topBargain.name,
            contentType: 'chollo',
            preset: 'chollo_viral',
            playerData: {
                name: topBargain.name,
                team: topBargain.team.name,
                position: topBargain.position,
                price: topBargain.analysis.estimatedPrice,
                rating: topBargain.stats.rating,
                stats: {
                    goals: topBargain.stats.goals || 0,
                    assists: topBargain.stats.assists || 0,
                    rating: topBargain.stats.rating
                },
                fantasyPoints: topBargain.analysis.estimatedPoints,
                valueRatio: topBargain.analysis.valueRatio
            }
        };

        console.log('📦 Payload preparado:');
        console.log(JSON.stringify(workflowPayload, null, 2));
        console.log('');

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 3: GENERAR VIDEO COMPLETO (3 sub-fases)
        // ════════════════════════════════════════════════════════════════════════════════
        const phase3Start = Date.now();
        let sessionId = null;

        // ────────────────────────────────────────────────────────────────────────────────
        // FASE 3A: PREPARAR SESIÓN (guión + 3 imágenes Nano Banana)
        // ────────────────────────────────────────────────────────────────────────────────
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 3A: PREPARANDO SESIÓN (guión + Nano Banana)');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const prepareResponse = await axios.post(
            `${BASE_URL}/api/veo3/prepare-session`,
            {
                contentType: 'chollo',
                playerData: workflowPayload.playerData,
                preset: 'chollo_viral'
            },
            {
                timeout: 600000 // 10 minutos (script + 3 imágenes Nano Banana)
            }
        );

        if (!prepareResponse.data.success) {
            throw new Error(`FASE 3A falló: ${prepareResponse.data.message}`);
        }

        sessionId = prepareResponse.data.data.sessionId;

        console.log(`✅ FASE 3A COMPLETADA`);
        console.log(`📁 Session ID: ${sessionId}`);
        console.log(`📝 Guión: ${prepareResponse.data.data.script.segments.length} segmentos`);
        console.log(
            `🖼️  Imágenes Nano Banana: ${prepareResponse.data.data.nanoBananaImages.length}`
        );
        console.log(
            `💰 Costo Nano Banana: $${prepareResponse.data.data.costs.nanoBanana.toFixed(3)}\\n`
        );

        // ────────────────────────────────────────────────────────────────────────────────
        // FASE 3B: GENERAR SEGMENTOS INDIVIDUALES (3 veces)
        // ────────────────────────────────────────────────────────────────────────────────
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 3B: GENERANDO 3 SEGMENTOS DE VIDEO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
            console.log(`🎬 Generando segmento ${segmentIndex + 1}/3...`);

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

            if (!segmentResponse.data.success) {
                throw new Error(
                    `Segmento ${segmentIndex + 1} falló: ${segmentResponse.data.message}`
                );
            }

            const segment = segmentResponse.data.data.segment;
            console.log(`✅ Segmento ${segmentIndex + 1} completado - Task ID: ${segment.taskId}`);
            console.log(`   Progreso: ${segmentResponse.data.data.session.progress}\\n`);

            // Delay entre segmentos (excepto el último)
            if (segmentIndex < 2) {
                console.log('⏱️  Esperando 10s antes del siguiente segmento...\\n');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        console.log('✅ FASE 3B COMPLETADA - 3/3 segmentos generados\\n');

        // ────────────────────────────────────────────────────────────────────────────────
        // FASE 3C: FINALIZAR SESIÓN (concatenación + logo outro)
        // ────────────────────────────────────────────────────────────────────────────────
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 3C: FINALIZANDO SESIÓN (concatenación)');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
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
            throw new Error(`FASE 3C falló: ${finalizeResponse.data.message}`);
        }

        const phase3Duration = ((Date.now() - phase3Start) / 1000).toFixed(1);

        console.log(`✅ FASE 3C COMPLETADA`);
        console.log(`📹 Video concatenado: ${finalizeResponse.data.data.finalVideo.url}`);
        console.log(
            `\\n✅ FASE 3 COMPLETA en ${phase3Duration}s (${(phase3Duration / 60).toFixed(1)} min)\\n`
        );

        // ════════════════════════════════════════════════════════════════════════════════
        // FASE 4: AÑADIR ENHANCEMENTS (Black Flashes + Player Card + Subtítulos)
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 4: AÑADIENDO ENHANCEMENTS AL VIDEO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        const phase4Start = Date.now();

        const enhancementsResponse = await axios.post(
            `${BASE_URL}/api/veo3/add-enhancements`,
            {
                sessionId: sessionId,
                playerData: {
                    name: topBargain.name,
                    stats: {
                        goals: topBargain.stats.goals || 0,
                        assists: topBargain.stats.assists || 0,
                        rating: topBargain.stats.rating
                    }
                },
                enhancements: {
                    blackFlashes: true, // 70ms entre segmentos
                    playerCard: true, // Overlay 3-6s
                    viralSubtitles: true // Karaoke style
                }
            },
            {
                timeout: 120000 // 2 minutos
            }
        );

        const phase4Duration = ((Date.now() - phase4Start) / 1000).toFixed(1);

        if (!enhancementsResponse.data.success) {
            throw new Error(`Enhancements fallaron: ${enhancementsResponse.data.message}`);
        }

        console.log(`\\n✅ FASE 4 COMPLETADA en ${phase4Duration}s\\n`);

        const finalData = enhancementsResponse.data.data;
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        // ════════════════════════════════════════════════════════════════════════════════
        // RESUMEN FINAL
        // ════════════════════════════════════════════════════════════════════════════════
        console.log(
            '\\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ E2E COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        console.log('📊 RESUMEN:\\n');

        console.log('🎯 CHOLLO:');
        console.log(`   Jugador:                  ${topBargain.name}`);
        console.log(`   Equipo:                   ${topBargain.team.name}`);
        console.log(`   Posición:                 ${topBargain.position}`);
        console.log(`   Precio:                   €${topBargain.analysis.estimatedPrice}M`);
        console.log(`   Ratio Valor:              ${topBargain.analysis.valueRatio.toFixed(2)}\\n`);

        console.log('⏱️  TIEMPOS:');
        console.log(`   FASE 3 (Video):           ${phase3Duration}s`);
        console.log(`   FASE 4 (Enhancements):    ${phase4Duration}s`);
        console.log(`   TOTAL:                    ${totalDuration}s\\n`);

        console.log('🎨 ENHANCEMENTS:');
        console.log(
            `   Aplicadas:                ${finalData.enhancements.successful.length}/${finalData.enhancements.total}`
        );
        if (finalData.enhancements.successful.length > 0) {
            finalData.enhancements.successful.forEach((enh, idx) => {
                console.log(`   ${idx + 1}. ${enh.type}`);
            });
        }
        console.log('');

        console.log('📹 VIDEO FINAL:');
        console.log(`   URL: ${finalData.enhancedVideo.url}`);
        console.log(`   Base: ${finalData.enhancedVideo.baseVideo}`);
        console.log(`   Session ID: ${sessionId}\\n`);

        console.log('📂 ARCHIVOS:');
        console.log(`   Diccionario: data/player-dictionary.json`);
        console.log(`   Session: output/veo3/sessions/session_${sessionId}/\\n`);

        console.log('💡 PRÓXIMOS PASOS:');
        console.log(`   1. Ver video en: ${finalData.enhancedVideo.url}`);
        console.log(`   2. Validar black flashes (70ms entre segmentos)`);
        console.log(`   3. Validar player card (segundos 3-6, top-right)`);
        console.log(`   4. Validar subtítulos virales (karaoke style)`);
        console.log(`   5. Si hay términos futbolísticos específicos de ${topBargain.name}:`);
        console.log(`      → Editar data/player-dictionary.json manualmente`);
        console.log(`      → Añadir apodos, referencias, contexto específico`);
        console.log(`   6. Publicar en Instagram/TikTok\\n`);

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\\n❌ ERROR EN E2E:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.code === 'ECONNABORTED') {
            console.error('\\n💡 TIMEOUT - Posibles causas:');
            console.error('   - API-Sports tardó mucho en responder');
            console.error('   - Nano Banana API está lenta');
            console.error('   - VEO3 generación tardó más de lo esperado');
        }

        console.error('\\n📁 Para debug, revisa:');
        console.error('   - logs/veo3/');
        console.error('   - output/veo3/sessions/');

        process.exit(1);
    }
}

main();
