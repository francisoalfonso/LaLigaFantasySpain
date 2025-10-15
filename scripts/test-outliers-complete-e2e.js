#!/usr/bin/env node

/**
 * Test E2E COMPLETO del Sistema de Outliers → Video Final
 *
 * Flujo completo:
 * 1. Detección de outliers virales en YouTube
 * 2. Análisis con Whisper + GPT-4o-mini
 * 3. Enriquecimiento con API-Sports
 * 4. Generación de script inteligente con GPT-4o
 * 5. Preparar sesión VEO3 con Carlos + Nano Banana
 * 6. Generar 3 segmentos de video con VEO3
 * 7. Finalizar video con subtítulos karaoke + logo
 *
 * IMPORTANTE: Requiere servidor corriendo (npm run dev)
 * IMPORTANTE: Requiere todas las APIs configuradas (OpenAI, YouTube, VEO3, Nano Banana)
 *
 * Usage:
 *   node scripts/test-outliers-complete-e2e.js [videoId]
 *
 * Si no se proporciona videoId, detecta automáticamente un nuevo outlier.
 */

const axios = require('axios');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOutliersCompleteE2E(providedVideoId = null) {
    const startTime = Date.now();
    const baseURL = 'http://localhost:3000/api';
    let testVideoId = providedVideoId;
    let sessionId = null;

    console.log(`\n${colors.bright}${colors.blue}${'═'.repeat(80)}${colors.reset}`);
    log('🚀', 'TEST E2E COMPLETO: Outlier → Video Final con Carlos', colors.bright + colors.blue);
    console.log(`${colors.bright}${colors.blue}${'═'.repeat(80)}${colors.reset}\n`);

    try {
        // ========================================================================
        // FASE 1: Detectar/Seleccionar Outlier
        // ========================================================================
        if (!testVideoId) {
            log('🔍', 'FASE 1: Detectando outliers virales...', colors.cyan);

            const detectResponse = await axios.get(`${baseURL}/outliers/detect`, {
                params: {
                    hoursBack: 48,
                    maxResultsPerKeyword: 10
                },
                timeout: 60000
            });

            if (!detectResponse.data.success || detectResponse.data.data.outliers.length === 0) {
                log('⚠️', 'No se encontraron outliers. Test abortado.', colors.yellow);
                return;
            }

            const outliers = detectResponse.data.data.outliers;
            const topOutlier = outliers[0];
            testVideoId = topOutlier.videoId; // ✅ camelCase

            log('✅', `Outliers detectados: ${outliers.length}`, colors.green);
            log('', `   - Top outlier: "${topOutlier.title}"`, colors.cyan);
            log('', `   - Canal: ${topOutlier.channelTitle}`, colors.cyan);
            log('', `   - Views: ${topOutlier.views.toLocaleString()}`, colors.cyan);
            log('', `   - Score: ${topOutlier.outlierScore}`, colors.cyan);
            log('', `   - Priority: ${topOutlier.priority}`, colors.cyan);
            log('', `   - Video ID: ${testVideoId}`, colors.cyan);
        } else {
            log('📺', `FASE 1: Usando outlier provisto: ${testVideoId}`, colors.cyan);
        }

        const phase1Time = ((Date.now() - startTime) / 1000).toFixed(1);

        // ========================================================================
        // FASE 2: Analizar Outlier (Transcription + GPT Analysis)
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        log('🎙️', 'FASE 2: Analizando outlier con Whisper + GPT...', colors.cyan);
        log('', '   (Esto puede tardar 1-2 minutos)', colors.yellow);

        const phase2Start = Date.now();

        const analyzeResponse = await axios.post(
            `${baseURL}/outliers/analyze/${testVideoId}`,
            {},
            { timeout: 180000 }
        );

        if (!analyzeResponse.data.success) {
            throw new Error(`Analysis failed: ${analyzeResponse.data.error}`);
        }

        const analysisData = analyzeResponse.data.data;
        const phase2Time = ((Date.now() - phase2Start) / 1000).toFixed(1);

        log('✅', `Análisis completado en ${phase2Time}s`, colors.green);
        log('', `   - Transcripción: ${analysisData.transcriptionLength} caracteres`, colors.cyan);
        log(
            '',
            `   - Jugadores: ${analysisData.contentAnalysis.players_mentioned?.length || 0}`,
            colors.cyan
        );
        log('', `   - Cost: $${analysisData.totalCost}`, colors.cyan);

        // ========================================================================
        // FASE 3: Generar Script Inteligente
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        log('📝', 'FASE 3: Generando script inteligente con GPT-4o...', colors.cyan);

        const phase3Start = Date.now();

        const scriptResponse = await axios.post(
            `${baseURL}/outliers/generate-script/${testVideoId}`,
            {
                responseAngle: 'rebatir',
                presenter: 'carlos' // ✅ Usar Carlos
            },
            { timeout: 60000 }
        );

        if (!scriptResponse.data.success) {
            throw new Error(`Script generation failed: ${scriptResponse.data.error}`);
        }

        const scriptData = scriptResponse.data.data;
        const veo3Format = scriptData.veo3Format;
        const phase3Time = ((Date.now() - phase3Start) / 1000).toFixed(1);

        log('✅', `Script generado en ${phase3Time}s`, colors.green);
        log('', `   - Segments: ${scriptData.script.segments.length}`, colors.cyan);
        log(
            '',
            `   - Total words: ${scriptData.script.segments.reduce((sum, s) => sum + s.dialogue.split(/\s+/).length, 0)}`,
            colors.cyan
        );

        // Mostrar segmentos
        console.log(`\n${colors.yellow}📄 Script VEO3:${colors.reset}\n`);
        scriptData.script.segments.forEach((seg, i) => {
            const wordCount = seg.dialogue.split(/\s+/).length;
            console.log(`${colors.bright}Segmento ${i + 1}${colors.reset} (${seg.role})`);
            console.log(`   "${seg.dialogue}"`);
            console.log(`   ${colors.cyan}[${wordCount} palabras]${colors.reset}\n`);
        });

        // Obtener enriched_data del outlier (guardado durante generate-script)
        const outliersResponse = await axios.get(`${baseURL}/outliers/list`, {
            timeout: 10000
        });
        const outlier = outliersResponse.data.data.outliers.find(o => o.video_id === testVideoId);
        const enrichedData = outlier?.enriched_data || null;

        // ========================================================================
        // FASE 4: Preparar Sesión VEO3 (Script + Nano Banana Images)
        // ========================================================================
        console.log(`${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        log('🎨', 'FASE 4: Preparando sesión VEO3 con Carlos...', colors.magenta);
        log('', '   (Generando 3 imágenes Nano Banana contextualizadas)', colors.yellow);

        const phase4Start = Date.now();

        const prepareResponse = await axios.post(
            `${baseURL}/veo3/prepare-session`,
            {
                contentType: 'outlier_response',
                playerData: {
                    name: scriptData.script.targetPlayer || 'jugador viral'
                },
                presenter: 'carlos',
                customScript: veo3Format.segments,
                enrichedData: enrichedData // ✅ Pasar datos enriquecidos para player card
            },
            { timeout: 600000 } // ✅ 10 minutos (aumentado de 5 min para Nano Banana)
        );

        if (!prepareResponse.data.success) {
            throw new Error(`Prepare session failed: ${prepareResponse.data.message}`);
        }

        sessionId = prepareResponse.data.data.sessionId;
        const phase4Time = ((Date.now() - phase4Start) / 1000).toFixed(1);

        log('✅', `Sesión preparada en ${phase4Time}s`, colors.green);
        log('', `   - Session ID: ${sessionId}`, colors.cyan);
        log(
            '',
            `   - Imágenes Nano Banana: ${prepareResponse.data.data.nanoBananaImages?.length || 0}`,
            colors.cyan
        );
        log(
            '',
            `   - Costo Nano Banana: $${prepareResponse.data.data.costs?.nanoBanana?.toFixed(3) || 0}`,
            colors.cyan
        );

        // ========================================================================
        // FASE 5: Generar 3 Segmentos VEO3
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        log('🎬', 'FASE 5: Generando 3 segmentos de video con VEO3...', colors.magenta);
        log('', '   (Esto puede tardar 4-5 minutos por segmento)', colors.yellow);

        const phase5Start = Date.now();

        for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
            const segNum = segmentIndex + 1;
            console.log(`\n${colors.cyan}   🎥 Generando segmento ${segNum}/3...${colors.reset}`);

            const segStart = Date.now();

            const segmentResponse = await axios.post(
                `${baseURL}/veo3/generate-segment`,
                {
                    sessionId: sessionId,
                    segmentIndex: segmentIndex
                },
                { timeout: 300000 }
            );

            if (!segmentResponse.data.success) {
                throw new Error(`Segment ${segNum} failed: ${segmentResponse.data.message}`);
            }

            const segTime = ((Date.now() - segStart) / 1000).toFixed(1);
            const segment = segmentResponse.data.data.segment;

            log('', `   ✅ Segmento ${segNum} completado en ${segTime}s`, colors.green);
            log('', `      - File: ${segment.filename}`, colors.cyan);
            log('', `      - Size: ${(segment.size / 1024 / 1024).toFixed(2)} MB`, colors.cyan);

            // Delay entre segmentos (excepto el último)
            if (segmentIndex < 2) {
                log('', `      ⏳ Esperando 10s antes del siguiente...`, colors.yellow);
                await sleep(10000);
            }
        }

        const phase5Time = ((Date.now() - phase5Start) / 1000).toFixed(1);
        log(
            '✅',
            `3 segmentos generados en ${phase5Time}s (${(phase5Time / 60).toFixed(1)} min)`,
            colors.green
        );

        // ========================================================================
        // FASE 6: Finalizar Video (Concatenar + Logo Outro)
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        log('🎞️', 'FASE 6: Finalizando video (concatenación + logo outro)...', colors.magenta);

        const phase6Start = Date.now();

        const finalizeResponse = await axios.post(
            `${baseURL}/veo3/finalize-session`,
            {
                sessionId: sessionId
            },
            { timeout: 120000 }
        );

        if (!finalizeResponse.data.success) {
            throw new Error(`Finalize failed: ${finalizeResponse.data.message}`);
        }

        const phase6Time = ((Date.now() - phase6Start) / 1000).toFixed(1);
        const finalVideo = finalizeResponse.data.data.finalVideo;

        log('✅', `Video concatenado en ${phase6Time}s`, colors.green);
        log('', `   - URL: ${finalVideo.url}`, colors.cyan);
        log('', `   - Duration: ${finalVideo.duration}s`, colors.cyan);

        // ========================================================================
        // FASE 7: Añadir Subtítulos Karaoke ASS
        // ========================================================================
        console.log(`\n${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        log('💬', 'FASE 7: Añadiendo subtítulos karaoke (igual que Ana)...', colors.magenta);

        const phase7Start = Date.now();

        // Ejecutar script de subtítulos (actualizar SESSION_ID en el script primero)
        log('', '   ℹ️  Ejecutar manualmente: npm run veo3:add-captions-carlos', colors.yellow);
        log('', `   Con SESSION_ID: ${sessionId.replace('nanoBanana_', '')}`, colors.yellow);

        const phase7Time = ((Date.now() - phase7Start) / 1000).toFixed(1);

        // ========================================================================
        // RESUMEN FINAL
        // ========================================================================
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`\n${colors.bright}${colors.green}${'═'.repeat(80)}${colors.reset}`);
        log('🎉', 'TEST E2E COMPLETO EXITOSO', colors.bright + colors.green);
        console.log(`${colors.bright}${colors.green}${'═'.repeat(80)}${colors.reset}\n`);

        console.log(`${colors.cyan}⏱️  TIEMPOS:${colors.reset}`);
        console.log(`   Fase 1 (Detección):        ${phase1Time}s`);
        console.log(`   Fase 2 (Análisis):         ${phase2Time}s`);
        console.log(`   Fase 3 (Script):           ${phase3Time}s`);
        console.log(`   Fase 4 (Preparación):      ${phase4Time}s`);
        console.log(
            `   Fase 5 (VEO3 3 videos):    ${phase5Time}s (${(phase5Time / 60).toFixed(1)} min)`
        );
        console.log(`   Fase 6 (Finalización):     ${phase6Time}s`);
        console.log(`   ${'─'.repeat(45)}`);
        console.log(
            `   TOTAL:                     ${totalTime}s (${(totalTime / 60).toFixed(1)} min)\n`
        );

        console.log(`${colors.cyan}💰 COSTOS:${colors.reset}`);
        console.log(`   Whisper (transcripción):   $0.006`);
        console.log(`   GPT-4o-mini (análisis):    $0.001`);
        console.log(`   GPT-4o (script):           $0.002`);
        console.log(`   Nano Banana (3 imágenes):  $0.06`);
        console.log(`   VEO3 (3 segmentos):        $0.90`);
        console.log(`   ${'─'.repeat(45)}`);
        console.log(`   TOTAL POR VIDEO:           $0.969\n`);

        console.log(`${colors.yellow}✅ FASES VALIDADAS:${colors.reset}`);
        console.log(`   1. ✅ Detección de outliers virales`);
        console.log(`   2. ✅ Análisis con Whisper + GPT`);
        console.log(`   3. ✅ Generación de script inteligente`);
        console.log(`   4. ✅ Preparación sesión VEO3`);
        console.log(`   5. ✅ Generación 3 segmentos VEO3`);
        console.log(`   6. ✅ Concatenación + logo outro`);
        console.log(`   7. 🔄 Subtítulos karaoke (manual)\n`);

        console.log(`${colors.yellow}🎬 VIDEO FINAL:${colors.reset}`);
        console.log(`   ${finalVideo.url}\n`);

        console.log(`${colors.yellow}💡 PRÓXIMO PASO:${colors.reset}`);
        console.log(`   Añadir subtítulos karaoke con:`);
        console.log(`   npm run veo3:add-captions-carlos\n`);

        process.exit(0);
    } catch (error) {
        log('❌', 'ERROR en test E2E:', colors.red);

        if (error.code === 'ECONNREFUSED') {
            log('', 'Servidor no está corriendo. Ejecuta: npm run dev', colors.yellow);
        } else if (error.response) {
            log('', `   Status: ${error.response.status}`, colors.red);
            log('', `   Error: ${error.response.data.error || error.message}`, colors.red);
            if (error.response.data.details) {
                log(
                    '',
                    `   Details: ${JSON.stringify(error.response.data.details, null, 2)}`,
                    colors.red
                );
            }
        } else {
            log('', `   ${error.message}`, colors.red);
        }

        console.error(`\n${colors.red}Stack trace:${colors.reset}`);
        console.error(error.stack);

        if (sessionId) {
            log('\n📁', `Session ID con error: ${sessionId}`, colors.yellow);
            log('', '   Puedes intentar continuar desde donde falló', colors.yellow);
        }

        process.exit(1);
    }
}

// Ejecutar test
const videoId = process.argv[2] || null;
if (videoId) {
    console.log(`\n${colors.cyan}📺 Usando outlier provisto: ${videoId}${colors.reset}`);
}

testOutliersCompleteE2E(videoId);
