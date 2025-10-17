/**
 * Añade subtítulos virales + player card al video de outliers
 *
 * 1. Lee el video concatenado del outlier
 * 2. Detecta contenType y determina si necesita player card
 * 3. Genera subtítulos karaoke ASS basándose en el progress.json
 * 4. Aplica subtítulos con FFmpeg
 * 5. Aplica player card si contentType lo requiere (outlier_response, chollo)
 * 6. Añade logo outro
 *
 * USO:
 * - Con contentType: node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID outlier_response
 * - Sin contentType (default generic): node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID
 */

const CaptionsService = require('../../backend/services/youtubeShorts/captionsService');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const ContentTypeRules = require('../../backend/services/veo3/contentTypeRules');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Obtener SESSION_ID y contentType de argumentos
const SESSION_ID = process.argv[2] || 'nanoBanana_1760523454592';
const CONTENT_TYPE = process.argv[3] || 'outlier_response'; // Default: outlier_response
const SESSION_DIR = `/Users/fran/Desktop/CURSOR/Fantasy la liga/output/veo3/sessions/session_${SESSION_ID}`;

async function main() {
    console.log(
        '\n╔══════════════════════════════════════════════════════════════════════════════╗'
    );
    console.log('║                                                                              ║');
    console.log('║  🎬 Añadiendo Subtítulos Virales al Video de Outliers                      ║');
    console.log('║                                                                              ║');
    console.log(
        '╚══════════════════════════════════════════════════════════════════════════════╝\n'
    );

    try {
        // ============================================================================
        // PASO 0: Cargar progress.json
        // ============================================================================
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
        console.log(`📊 Segmentos: ${segments.length}`);
        console.log(`🎯 Outlier: ${progress.playerName}`);
        console.log(`📹 Video concatenado: ${progress.concatenatedVideo.outputPath}\n`);

        // Verificar que existe el video concatenado
        const videoWithoutCaptions = path.join(
            __dirname,
            '../../',
            progress.concatenatedVideo.outputPath
        );

        if (!fs.existsSync(videoWithoutCaptions)) {
            console.error(`❌ No se encontró el video concatenado en: ${videoWithoutCaptions}`);
            process.exit(1);
        }

        // ============================================================================
        // PASO 1: Generar subtítulos karaoke ASS (igual que Ana/Carlos)
        // ============================================================================
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('PASO 1: GENERANDO SUBTÍTULOS KARAOKE ASS');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const step1Start = Date.now();
        const captionsService = new CaptionsService();

        // Preparar segmentos con startTime correcto
        const segmentsForCaptions = segments.map((seg, idx) => ({
            dialogue: seg.dialogue,
            duration: seg.duration,
            startTime: idx * 8 // 0, 8, 16 segundos
        }));

        console.log('📝 Diálogos a subtitular:\n');
        segmentsForCaptions.forEach((seg, idx) => {
            console.log(`   ${idx + 1}. [${seg.startTime}s] "${seg.dialogue.substring(0, 60)}..."`);
        });

        console.log('\n📝 Generando archivo .ass con subtítulos karaoke...');
        const result = await captionsService.generateCaptions(
            segmentsForCaptions,
            'karaoke',
            'ass'
        );

        if (!result.success) {
            throw new Error(`Error generando subtítulos: ${result.error}`);
        }

        const step1Duration = ((Date.now() - step1Start) / 1000).toFixed(1);
        console.log(`\n✅ PASO 1 COMPLETADO en ${step1Duration}s`);
        console.log(`✅ Subtítulos generados: ${result.captionsFile}`);
        console.log(`   - Total subtítulos: ${result.metadata.totalSubtitles}`);
        console.log(`   - Duración total: ${result.metadata.totalDuration}s`);
        console.log(`   - Estilo: ${result.style}\n`);

        // ============================================================================
        // PASO 2: Aplicar subtítulos al video con FFmpeg
        // ============================================================================
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('PASO 2: APLICANDO SUBTÍTULOS AL VIDEO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const step2Start = Date.now();
        const videoWithCaptionsPath = videoWithoutCaptions.replace('.mp4', '-with-captions.mp4');

        console.log('🎨 Aplicando subtítulos al video con FFmpeg...');
        const ffmpegCommand = `ffmpeg -i "${videoWithoutCaptions}" -vf "ass=${result.captionsFile}" -c:a copy "${videoWithCaptionsPath}" -y`;
        console.log(`Comando: ${ffmpegCommand.substring(0, 100)}...\n`);

        await execPromise(ffmpegCommand);

        const step2Duration = ((Date.now() - step2Start) / 1000).toFixed(1);
        console.log(`\n✅ PASO 2 COMPLETADO en ${step2Duration}s`);
        console.log(`📹 Video con subtítulos: ${videoWithCaptionsPath}`);

        // ============================================================================
        // PASO 3: Aplicar Player Card (si contentType lo requiere)
        // ============================================================================
        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('PASO 3: EVALUANDO PLAYER CARD');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const step3Start = Date.now();
        let videoWithCard = videoWithCaptionsPath;

        // Determinar si necesita player card según contentType
        const rules = ContentTypeRules.getRulesForContentType(CONTENT_TYPE);
        console.log(`📋 Content Type: ${CONTENT_TYPE}`);
        console.log(`📊 Necesita Player Card: ${rules.needsPlayerCard ? 'SÍ' : 'NO'}`);

        if (rules.needsPlayerCard) {
            // ✅ NUEVO: Extraer targetPlayer del metadata del script
            const targetPlayer = progress.script?.metadata?.targetPlayer || null;

            if (targetPlayer) {
                console.log(`\n🎯 Target Player identificado: ${targetPlayer}`);
            }

            // Extraer playerData desde progress.json (enriched_data)
            const playerData = progress.enriched_data
                ? ContentTypeRules.extractPlayerDataFromOutlier(
                      progress.enriched_data,
                      targetPlayer
                  ) // ✅ Pasar targetPlayer
                : null;

            if (playerData) {
                console.log(`\n🃏 Aplicando Player Card para: ${playerData.name}`);
                console.log(`   Team: ${playerData.team}`);
                console.log(
                    `   Stats: ${playerData.stats.games} partidos, ${playerData.stats.goals} goles`
                );

                const playerCardOverlay = new PlayerCardOverlay();

                try {
                    videoWithCard = await playerCardOverlay.generateAndApplyCard(
                        videoWithCaptionsPath,
                        playerData,
                        {
                            startTime: rules.cardTiming.startTime,
                            duration: rules.cardTiming.duration,
                            slideInDuration: 0.5,
                            cleanup: true
                        }
                    );
                    console.log(`✅ Player Card aplicada: ${videoWithCard}`);
                } catch (error) {
                    console.error(`❌ Error aplicando player card: ${error.message}`);
                    console.warn(`⚠️  Continuando sin player card...`);
                    videoWithCard = videoWithCaptionsPath;
                }
            } else {
                console.warn(
                    `⚠️  Content type "${CONTENT_TYPE}" requiere player card pero no hay datos de jugador`
                );
                console.warn(`⚠️  Asegúrate de que progress.json tenga enriched_data`);
            }
        } else {
            console.log(`ℹ️  Content type "${CONTENT_TYPE}" no requiere player card`);
        }

        const step3Duration = ((Date.now() - step3Start) / 1000).toFixed(1);
        console.log(`\n✅ PASO 3 COMPLETADO en ${step3Duration}s`);

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
        const concatenator = new VideoConcatenator();

        const finalVideoPath = await concatenator.concatenateVideos([videoWithCard], {
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
        console.log(`🎯 Outlier:             ${progress.playerName}`);
        console.log(`🎬 Segmentos:           ${segments.length}`);
        console.log(`⏱️  Duración total:      ${progress.script.totalDuration}s`);
        console.log(`📹 Video final:         ${path.basename(finalVideoPath)}`);
        console.log(`💰 Costo subtítulos:    $0 (procesamiento local FFmpeg + ASS)`);

        console.log('\n⏱️  TIEMPOS:');
        console.log(`   Paso 1 (Gen. ASS):       ${step1Duration}s`);
        console.log(`   Paso 2 (Aplicar subs):   ${step2Duration}s`);
        console.log(`   Paso 3 (Player Card):    ${step3Duration}s`);
        console.log(`   Paso 4 (Logo outro):     ${step4Duration}s`);
        console.log(`   ──────────────────────────────────`);
        console.log(
            `   TOTAL:                 ${totalDuration}s (${(totalDuration / 60).toFixed(1)} min)\n`
        );

        console.log('🎯 CARACTERÍSTICAS:');
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
        console.error('\n❌ ERROR EN PROCESO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
