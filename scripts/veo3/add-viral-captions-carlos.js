/**
 * Añade subtítulos virales al video de Carlos
 *
 * 1. Lee los segmentos y diálogos del progress.json
 * 2. Añade subtítulos karaoke ASS (igual que Ana) a cada segmento
 * 3. Vuelve a concatenar con logo outro
 */

const CaptionsService = require('../../backend/services/youtubeShorts/captionsService');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const SESSION_ID = 'nanoBanana_1760519873793';
const SESSION_DIR = `/Users/fran/Desktop/CURSOR/Fantasy la liga/output/veo3/sessions/session_${SESSION_ID}`;

async function main() {
    console.log(
        '\n╔══════════════════════════════════════════════════════════════════════════════╗'
    );
    console.log('║                                                                              ║');
    console.log('║  🎬 Añadiendo Subtítulos Virales al Video de Carlos                        ║');
    console.log('║                                                                              ║');
    console.log(
        '╚══════════════════════════════════════════════════════════════════════════════╝\n'
    );

    // Leer progress.json
    const progressPath = path.join(SESSION_DIR, 'progress.json');
    console.log(`📖 Leyendo: ${progressPath}\n`);

    if (!fs.existsSync(progressPath)) {
        console.error(`❌ No se encontró progress.json en: ${SESSION_DIR}`);
        process.exit(1);
    }

    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    const segments = progress.segments;

    console.log(`✅ Sesión cargada: ${SESSION_ID}`);
    console.log(`👨‍💼 Presentador: ${progress.presenter.name}`);
    console.log(`📊 Segmentos: ${segments.length}\n`);

    // ============================================================================
    // PASO 1: Concatenar segmentos sin subtítulos
    // ============================================================================
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('PASO 1: CONCATENANDO SEGMENTOS (SIN SUBTÍTULOS)');
    console.log(
        '════════════════════════════════════════════════════════════════════════════════\n'
    );

    const step1Start = Date.now();
    const concatenator = new VideoConcatenator();

    const segmentPaths = segments.map(s => s.localPath);
    console.log('📂 Segmentos a concatenar:');
    segmentPaths.forEach((seg, idx) => {
        console.log(`   ${idx + 1}. ${path.basename(seg)}`);
    });

    try {
        const videoWithoutCaptions = await concatenator.concatenateVideos(segmentPaths, {
            transition: { enabled: false },
            audio: { fadeInOut: false },
            outro: { enabled: false } // Sin logo outro todavía
        });

        const step1Duration = ((Date.now() - step1Start) / 1000).toFixed(1);
        console.log(`\n✅ PASO 1 COMPLETADO en ${step1Duration}s`);
        console.log(`📹 Video sin subtítulos: ${videoWithoutCaptions}`);

        // ============================================================================
        // PASO 2: Generar subtítulos karaoke ASS (igual que Ana)
        // ============================================================================
        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('PASO 2: GENERANDO SUBTÍTULOS KARAOKE ASS');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const step2Start = Date.now();
        const captionsService = new CaptionsService();

        // Preparar segmentos con startTime correcto
        const segmentsForCaptions = segments.map((seg, idx) => ({
            dialogue: seg.dialogue,
            duration: seg.duration,
            startTime: idx * 8 // 0, 8, 16 segundos
        }));

        console.log('📝 Generando archivo .ass con subtítulos karaoke...');
        const result = await captionsService.generateCaptions(
            segmentsForCaptions,
            'karaoke',
            'ass'
        );

        if (!result.success) {
            throw new Error(`Error generando subtítulos: ${result.error}`);
        }

        console.log(`✅ Subtítulos generados: ${result.captionsFile}`);
        console.log(`   - Total subtítulos: ${result.metadata.totalSubtitles}`);
        console.log(`   - Duración total: ${result.metadata.totalDuration}s`);
        console.log(`   - Estilo: ${result.style}\n`);

        // ============================================================================
        // PASO 3: Aplicar subtítulos al video con FFmpeg
        // ============================================================================
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('PASO 3: APLICANDO SUBTÍTULOS AL VIDEO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const step3Start = Date.now();
        const videoWithCaptionsPath = videoWithoutCaptions.replace('.mp4', '-with-captions.mp4');

        console.log('🎨 Aplicando subtítulos al video con FFmpeg...');
        const ffmpegCommand = `ffmpeg -i "${videoWithoutCaptions}" -vf "ass=${result.captionsFile}" -c:a copy "${videoWithCaptionsPath}" -y`;
        console.log(`Comando: ${ffmpegCommand.substring(0, 100)}...\n`);

        await execPromise(ffmpegCommand);

        const step3Duration = ((Date.now() - step3Start) / 1000).toFixed(1);
        console.log(`\n✅ PASO 3 COMPLETADO en ${step3Duration}s`);
        console.log(`📹 Video con subtítulos: ${videoWithCaptionsPath}`);

        // ============================================================================
        // PASO 4: Añadir logo outro
        // ============================================================================
        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('PASO 4: AÑADIENDO LOGO OUTRO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const step4Start = Date.now();

        const finalVideoPath = await concatenator.concatenateVideos([videoWithCaptionsPath], {
            transition: { enabled: false },
            audio: { fadeInOut: false },
            outro: {
                enabled: true,
                freezeFrame: { enabled: true, duration: 0.8 }
            }
        });

        const step4Duration = ((Date.now() - step4Start) / 1000).toFixed(1);

        console.log(`\n✅ PASO 4 COMPLETADO en ${step4Duration}s`);
        console.log(`📹 Video final: ${finalVideoPath}`);

        // Verificar archivo
        if (fs.existsSync(finalVideoPath)) {
            const stats = fs.statSync(finalVideoPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`📊 Tamaño: ${sizeMB} MB`);
        }

        // ============================================================================
        // RESUMEN FINAL
        // ============================================================================
        const totalDuration = ((Date.now() - step1Start) / 1000).toFixed(1);

        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log('📊 RESUMEN:\n');
        console.log(`👨‍💼 Presentador:        ${progress.presenter.name}`);
        console.log(`🎬 Segmentos:           ${segments.length}`);
        console.log(`⏱️  Duración total:      ${progress.script.totalDuration}s`);
        console.log(`📹 Video final:         ${path.basename(finalVideoPath)}`);
        console.log(`💰 Costo subtítulos:    $0 (procesamiento local FFmpeg + ASS)`);

        console.log('\n⏱️  TIEMPOS:');
        console.log(`   Paso 1 (Concatenación):  ${step1Duration}s`);
        console.log(
            `   Paso 2 (Gen. ASS):       ${((Date.now() - step2Start) / 1000).toFixed(1)}s`
        );
        console.log(`   Paso 3 (Aplicar subs):   ${step3Duration}s`);
        console.log(`   Paso 4 (Logo outro):     ${step4Duration}s`);
        console.log(`   ──────────────────────────────────`);
        console.log(
            `   TOTAL:                 ${totalDuration}s (${(totalDuration / 60).toFixed(1)} min)\n`
        );

        console.log('🎯 CARACTERÍSTICAS DE LOS SUBTÍTULOS (IGUAL QUE ANA):');
        console.log('   • Estilo: Karaoke word-by-word (ASS format)');
        console.log('   • Fuente: Arial Black 80px');
        console.log('   • Color: Blanco → Dorado (#FFD700) al destacar');
        console.log('   • Borde negro 6px + sombra 4px');
        console.log('   • Posición: 410px desde borde inferior (zona segura apps)');
        console.log('   • Cada palabra aparece/desaparece individualmente');
        console.log('   • Sincronización perfecta con audio VEO3');

        console.log('\n💡 PARA VISUALIZAR:');
        console.log(`   open "${finalVideoPath}"`);
        console.log('\n💡 URL LOCAL:');
        console.log(`   http://localhost:3000/output/veo3/${path.basename(finalVideoPath)}`);

        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN CONCATENACIÓN:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
