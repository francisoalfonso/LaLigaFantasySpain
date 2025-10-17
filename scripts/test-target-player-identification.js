/**
 * Test rápido: Verificar identificación de target player
 *
 * Solo ejecuta:
 * - FASE 1: Detección del outlier
 * - FASE 2: Análisis con content analyzer (debe identificar target_player)
 * - FASE 3: Generación de script (debe usar target_player en el hook)
 */

const axios = require('axios');

const VIDEO_ID = '-rgSwypNvtw';
const BASE_URL = 'http://localhost:3000/api';

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║  🎯 TEST: Identificación de Target Player                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // FASE 1: Obtener outlier de la base de datos
        // ═══════════════════════════════════════════════════════════════════════════
        console.log('📺 FASE 1: Obteniendo outlier de la base de datos...\n');

        const outliersResponse = await axios.get(`${BASE_URL}/outliers/list`, {
            timeout: 10000
        });

        const outlier = outliersResponse.data.data.outliers.find(o => o.video_id === VIDEO_ID);

        if (!outlier) {
            throw new Error(`Outlier ${VIDEO_ID} no encontrado en la base de datos`);
        }

        console.log(`✅ Outlier encontrado: ${outlier.title}`);
        console.log(`   Canal: ${outlier.channel_name}`);
        console.log(`   Views: ${outlier.views.toLocaleString()}\n`);

        // ═══════════════════════════════════════════════════════════════════════════
        // FASE 2: Analizar contenido (aquí se debe identificar target_player)
        // ═══════════════════════════════════════════════════════════════════════════
        console.log('════════════════════════════════════════════════════════════════════════');
        console.log('🔍 FASE 2: Analizando contenido (Content Analyzer)');
        console.log('════════════════════════════════════════════════════════════════════════\n');

        // Verificar si ya tiene análisis
        const content_analysis = outlier.content_analysis;

        if (!content_analysis) {
            console.log('⚠️  Outlier no tiene content_analysis. Necesita análisis previo.');
            process.exit(1);
        }

        // ✅ VERIFICAR: ¿Se identificó target_player?
        console.log('📊 ANÁLISIS DE CONTENIDO:\n');
        console.log(`   - Jugadores mencionados: ${content_analysis.players?.length || 0}`);

        if (content_analysis.players && content_analysis.players.length > 0) {
            console.log('\n   📋 Jugadores encontrados:');
            content_analysis.players.forEach((player, idx) => {
                console.log(
                    `      ${idx + 1}. ${player.name} (${player.team || 'N/A'}) - ${player.mentioned_count || 0} menciones`
                );
            });
        }

        console.log('\n   🎯 TARGET PLAYER IDENTIFICADO:');
        if (content_analysis.target_player) {
            console.log(`      ✅ ${content_analysis.target_player}`);
        } else {
            console.log('      ❌ NO SE IDENTIFICÓ TARGET PLAYER');
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // FASE 3: Generar script (debe usar target_player en el hook)
        // ═══════════════════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════════════════');
        console.log('📝 FASE 3: Generando script (Outlier Script Generator)');
        console.log('════════════════════════════════════════════════════════════════════════\n');

        const scriptResponse = await axios.post(
            `${BASE_URL}/outliers/generate-script`,
            {
                videoId: VIDEO_ID,
                presenter: 'carlos',
                platform: 'instagram'
            },
            { timeout: 30000 }
        );

        const scriptData = scriptResponse.data.data;

        console.log('📊 SCRIPT GENERADO:\n');
        console.log(`   - Segmentos: ${scriptData.script.segments.length}`);
        console.log(
            `   - Target Player en metadata: ${scriptData.script.metadata.targetPlayer || 'N/A'}`
        );

        console.log('\n   📝 HOOK (Segmento 1):');
        const segment1 = scriptData.script.segments[0];
        console.log(`      "${segment1.dialogue.substring(0, 100)}..."`);

        // ✅ VERIFICAR: ¿El hook menciona al target_player?
        const targetPlayer =
            scriptData.script.metadata.targetPlayer || content_analysis.target_player;

        if (targetPlayer) {
            const hookMentionsPlayer = segment1.dialogue
                .toLowerCase()
                .includes(targetPlayer.toLowerCase());
            console.log(`\n   ✅ VERIFICACIÓN:`);
            console.log(`      - Target player: ${targetPlayer}`);
            console.log(
                `      - Hook menciona al jugador: ${hookMentionsPlayer ? '✅ SÍ' : '❌ NO'}`
            );

            if (hookMentionsPlayer) {
                console.log(
                    `\n   🎉 ¡ÉXITO! El hook usa el nombre específico del jugador objetivo.`
                );
            } else {
                console.log(
                    `\n   ⚠️  WARNING: El hook usa referencia genérica en lugar del nombre específico.`
                );
            }
        } else {
            console.log(`\n   ⚠️  No hay target player identificado en el sistema.`);
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // RESUMEN FINAL
        // ═══════════════════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════════════════');
        console.log('📊 RESUMEN DEL TEST');
        console.log('════════════════════════════════════════════════════════════════════════\n');

        const summary = {
            outlierFound: !!outlier,
            contentAnalyzed: !!content_analysis,
            targetPlayerIdentified: !!content_analysis.target_player,
            targetPlayerName: content_analysis.target_player || 'N/A',
            scriptGenerated: !!scriptData,
            scriptUsesTargetPlayer:
                scriptData.script.metadata.targetPlayer === content_analysis.target_player,
            playersFound: content_analysis.players?.length || 0
        };

        console.log('   Outlier encontrado:', summary.outlierFound ? '✅' : '❌');
        console.log('   Contenido analizado:', summary.contentAnalyzed ? '✅' : '❌');
        console.log('   Target player identificado:', summary.targetPlayerIdentified ? '✅' : '❌');
        console.log(`   Target player: ${summary.targetPlayerName}`);
        console.log('   Script generado:', summary.scriptGenerated ? '✅' : '❌');
        console.log('   Script usa target player:', summary.scriptUsesTargetPlayer ? '✅' : '❌');
        console.log(`   Total jugadores encontrados: ${summary.playersFound}\n`);

        // Resultado final
        if (summary.targetPlayerIdentified && summary.scriptUsesTargetPlayer) {
            console.log(
                '🎉 ¡TEST EXITOSO! El sistema de identificación de target player funciona correctamente.\n'
            );
        } else {
            console.log('⚠️  TEST PARCIALMENTE EXITOSO. Revisa los warnings arriba.\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}

main();
