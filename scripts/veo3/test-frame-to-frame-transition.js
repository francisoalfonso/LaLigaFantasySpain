#!/usr/bin/env node

/**
 * Test Frame-to-Frame Transition Technique
 *
 * Script para validar la técnica de transiciones invisibles entre segmentos VEO3.
 *
 * Este test genera un video de 2 segmentos (16s totales) usando la descripción
 * frame-to-frame matching para garantizar continuidad visual perfecta.
 *
 * Validaciones:
 * - Segmento 1 termina con transition frame
 * - Segmento 2 inicia con MISMO transition frame
 * - Concatenación sin crossfade
 * - Transición invisible para el espectador
 *
 * Uso:
 *   node scripts/veo3/test-frame-to-frame-transition.js
 *
 * Basado en: docs/VEO3_TRANSICIONES_FRAME_TO_FRAME.md
 */

require('dotenv').config();
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const logger = require('../../backend/utils/logger');

// Configuración del test
const TEST_CONFIG = {
    contentType: 'chollo',
    targetSegments: 2,
    contentData: {
        playerName: 'Pere Milla',
        team: 'Espanyol',
        price: 4.0,
        valueRatio: 1.35
    }
};

async function runFrameToFrameTest() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🧪 TEST: Frame-to-Frame Transition Technique');
    console.log(`${'='.repeat(80)}\n`);

    console.log('📋 Configuración del test:');
    console.log(`   Tipo contenido: ${TEST_CONFIG.contentType}`);
    console.log(`   Segmentos: ${TEST_CONFIG.targetSegments}`);
    console.log(`   Duración total: ${TEST_CONFIG.targetSegments * 8}s`);
    console.log(
        `   Jugador: ${TEST_CONFIG.contentData.playerName} (${TEST_CONFIG.contentData.team})\n`
    );

    try {
        // Paso 1: Inicializar servicios
        console.log('🔧 Paso 1: Inicializando servicios VEO3...');
        const veo3 = new VEO3Client();
        const promptBuilder = new PromptBuilder();
        const concatenator = new VideoConcatenator();

        const healthCheck = veo3.getHealth();
        if (!healthCheck.configured) {
            throw new Error(
                'VEO3 no está configurado correctamente. Verifica variables de entorno.'
            );
        }

        console.log('   ✅ VEO3Client inicializado');
        console.log('   ✅ PromptBuilder inicializado');
        console.log('   ✅ VideoConcatenator inicializado\n');

        // Paso 2: Construir video multi-segmento con frame-to-frame
        console.log('📝 Paso 2: Construyendo prompts con transiciones frame-to-frame...');

        const multiSegmentVideo = promptBuilder.buildMultiSegmentVideo(
            TEST_CONFIG.contentType,
            TEST_CONFIG.contentData,
            TEST_CONFIG.targetSegments
        );

        console.log(`   ✅ ${multiSegmentVideo.segments.length} segmentos construidos`);
        console.log(`   ✅ Arco emocional: ${multiSegmentVideo.metadata.emotionalArc}`);
        console.log(`   ✅ Método transición: ${multiSegmentVideo.metadata.transitionMethod}\n`);

        // Mostrar estructura de transiciones
        console.log('🔗 Estructura de transiciones:');
        multiSegmentVideo.segments.forEach((seg, idx) => {
            console.log(`   Segmento ${idx + 1}:`);
            console.log(
                `      - Inicio: ${seg.metadata.hasTransitionStart ? '🔗 TRANSITION FRAME' : '▶️  Intro natural'}`
            );
            console.log(`      - Contenido: "${seg.metadata.elementos.join(', ')}"`);
            console.log(
                `      - Final: ${seg.metadata.hasTransitionEnd ? '🔗 TRANSITION FRAME' : '⏹️  Cierre natural'}`
            );
        });
        console.log('');

        // Mostrar prompts generados (primeros 300 chars de cada uno)
        console.log('📜 Prompts generados (preview):');
        multiSegmentVideo.segments.forEach((seg, idx) => {
            console.log(`\n   Segmento ${idx + 1}:`);
            console.log(`   ${'-'.repeat(75)}`);
            const preview = seg.prompt.substring(0, 300).replace(/\n/g, '\n   ');
            console.log(`   ${preview}...`);
        });
        console.log('\n');

        // Paso 3: Generar videos con VEO3
        console.log('🎬 Paso 3: Generando videos con VEO3...');
        console.log('   ⚠️  Esto tomará ~8-12 minutos (4-6 min por segmento)\n');

        const videoPaths = [];
        const startTime = Date.now();

        for (let i = 0; i < multiSegmentVideo.segments.length; i++) {
            const segment = multiSegmentVideo.segments[i];

            console.log(
                `   🎥 Generando segmento ${i + 1}/${multiSegmentVideo.segments.length}...`
            );
            console.log(`      Elementos: [${segment.metadata.elementos.join(', ')}]`);
            console.log(
                `      Transition start: ${segment.metadata.hasTransitionStart ? 'YES' : 'NO'}`
            );
            console.log(
                `      Transition end: ${segment.metadata.hasTransitionEnd ? 'YES' : 'NO'}`
            );

            try {
                const segmentStart = Date.now();

                const video = await veo3.generateCompleteVideo(segment.prompt, {
                    duration: 8,
                    seed: 30001, // Ana's fixed seed
                    aspectRatio: '9:16'
                });

                const segmentTime = ((Date.now() - segmentStart) / 1000).toFixed(1);

                videoPaths.push(video.localPath);

                console.log(`      ✅ Completado en ${segmentTime}s`);
                console.log(`      📍 Path: ${video.localPath}\n`);
            } catch (error) {
                console.log(`      ❌ Error en segmento ${i + 1}: ${error.message}\n`);
                throw error;
            }

            // Rate limiting: 6s entre peticiones (10 req/min)
            if (i < multiSegmentVideo.segments.length - 1) {
                console.log(`      ⏳ Esperando 6s antes del siguiente segmento...\n`);
                await new Promise(resolve => setTimeout(resolve, 6000));
            }
        }

        const generationTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`   ✅ Todos los segmentos generados en ${generationTime} minutos\n`);

        // Paso 4: Concatenar sin crossfade
        console.log('🔗 Paso 4: Concatenando videos SIN crossfade...');
        console.log('   NOTA: Frame-to-frame transitions hacen crossfade innecesario\n');

        const concatStart = Date.now();

        const finalVideo = await concatenator.concatenateVideos(videoPaths, {
            transition: {
                enabled: false // ⚠️ CRÍTICO - NO crossfade
            },
            audio: {
                normalize: true,
                fadeInOut: false // ⚠️ CRÍTICO - NO fade
            }
        });

        const concatTime = ((Date.now() - concatStart) / 1000).toFixed(1);

        console.log(`   ✅ Concatenación completada en ${concatTime}s`);
        console.log(`   📍 Video final: ${finalVideo}\n`);

        // Paso 5: Resultados y validación
        console.log('✅ TEST COMPLETADO EXITOSAMENTE\n');
        console.log('='.repeat(80));
        console.log('📊 RESULTADOS:');
        console.log('='.repeat(80));
        console.log(`✅ Segmentos generados: ${videoPaths.length}`);
        console.log(`✅ Video final: ${finalVideo}`);
        console.log(`✅ Duración total: ${multiSegmentVideo.totalDuration}s`);
        console.log(`✅ Tiempo generación: ${generationTime} minutos`);
        console.log(`✅ Tiempo concatenación: ${concatTime}s`);
        console.log(`✅ Método transición: frame-to-frame (sin crossfade)`);
        console.log('');
        console.log('🎯 VALIDACIÓN MANUAL REQUERIDA:');
        console.log('   1. Abrir video final en reproductor');
        console.log('   2. Revisar frame en segundo 8 (transición seg1→seg2)');
        console.log('   3. Validar que Ana mantiene posición idéntica');
        console.log('   4. Confirmar que transición es invisible/imperceptible');
        console.log('   5. Verificar que iluminación y fondo son consistentes');
        console.log('');
        console.log(`   Comando: open "${finalVideo}"`);
        console.log('');
        console.log('📋 CRITERIOS DE ÉXITO:');
        console.log('   ✅ Ana en posición idéntica en frames 7.5s-8.5s');
        console.log('   ✅ No se nota corte visual entre segmentos');
        console.log('   ✅ Iluminación consistente');
        console.log('   ✅ Fondo estático sin cambios');
        console.log('   ✅ Narrativa fluida sin interrupciones');
        console.log('');
        console.log('📚 Documentación: docs/VEO3_TRANSICIONES_FRAME_TO_FRAME.md');
        console.log(`${'='.repeat(80)}\n`);

        // Resumen económico
        const costPerVideo = 0.3;
        const totalCost = videoPaths.length * costPerVideo;

        console.log('💰 COSTES:');
        console.log(
            `   VEO3 generación: $${totalCost.toFixed(2)} (${videoPaths.length} × $${costPerVideo})`
        );
        console.log(`   FFmpeg procesamiento: ${concatTime}s CPU`);
        console.log(`   Total: $${totalCost.toFixed(2)}\n`);

        // Retornar resultados para testing programático
        return {
            success: true,
            finalVideo,
            segments: videoPaths.length,
            totalDuration: multiSegmentVideo.totalDuration,
            generationTime: parseFloat(generationTime),
            concatTime: parseFloat(concatTime),
            totalCost
        };
    } catch (error) {
        console.error('\n❌ TEST FALLÓ:\n');
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}\n`);

        logger.error('[Test Frame-to-Frame] Test falló:', error);

        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar test si se llama directamente
if (require.main === module) {
    runFrameToFrameTest()
        .then(result => {
            if (result.success) {
                console.log('✅ Test finalizado con éxito');
                process.exit(0);
            } else {
                console.error('❌ Test falló');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Error crítico:', error);
            process.exit(1);
        });
}

module.exports = { runFrameToFrameTest };
