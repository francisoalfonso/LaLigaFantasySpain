/**
 * Test E2E completo: 3 escenas con VEO3
 *
 * Escenas:
 * 1. Intro: Portada + presentación Ana
 * 2. Stats Card: Tarjeta con overlay stats del jugador
 * 3. Outro: Logo FLP + CTA
 *
 * Flow completo:
 * - Llamada a BargainAnalyzer para obtener chollo
 * - Generación de 3 prompts
 * - Llamada a VEO3 para cada escena
 * - Concatenación final con FFmpeg
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = `session_${Date.now()}`;
const OUTPUT_DIR = path.join(__dirname, '../../output/veo3/sessions', SESSION_ID);

// Colores para logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    log('\n🎬 ========== TEST E2E COMPLETO VEO3 - 3 ESCENAS ==========\n', 'bright');
    log(`Session ID: ${SESSION_ID}`, 'cyan');
    log(`Output dir: ${OUTPUT_DIR}\n`, 'cyan');

    // Crear directorio de sesión
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    try {
        // ==========================================
        // PASO 1: Obtener chollo de BargainAnalyzer
        // ==========================================
        log('📊 PASO 1: Obteniendo chollo de BargainAnalyzer...', 'yellow');

        const bargainResponse = await axios.get(`${BASE_URL}/api/bargains/top`, {
            params: { limit: 1 }
        });

        if (!bargainResponse.data.success || !bargainResponse.data.data[0]) {
            throw new Error('No se pudo obtener chollo de BargainAnalyzer');
        }

        const chollo = bargainResponse.data.data[0];
        log(`✅ Chollo obtenido: ${chollo.name} (${chollo.team.name})`, 'green');
        log(`   Precio: ${chollo.analysis.estimatedPrice}M | Ratio: ${chollo.analysis.valueRatio} | Puntos: ${chollo.analysis.estimatedPoints}`, 'cyan');

        // Guardar datos del chollo
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'chollo-data.json'),
            JSON.stringify(chollo, null, 2)
        );

        // ==========================================
        // PASO 2: Generar prompts para 3 escenas
        // ==========================================
        log('\n✍️  PASO 2: Generando prompts para 3 escenas...', 'yellow');

        const prompts = {
            intro: `The person from the reference image speaks in Spanish from Spain: "¡Hola amigos! Hoy os traigo un CHOLLO de oro". She is energetic and smiling, with natural hand gestures. Clean, professional broadcasting style.`,

            statsCard: `The person from the reference image speaks in Spanish from Spain while presenting a player stats card overlay. She maintains professional posture, looking at camera. The card shows player photo, team logo, and key statistics. Modern, clean presentation style.`,

            outro: `The person from the reference image speaks in Spanish from Spain: "¡No olvides suscribirte!". She waves goodbye naturally. In the background, the Fantasy La Liga logo appears prominently. Professional closing shot.`
        };

        log('✅ Prompts generados:', 'green');
        log(`   Intro: ${prompts.intro.substring(0, 60)}...`, 'cyan');
        log(`   Stats Card: ${prompts.statsCard.substring(0, 60)}...`, 'cyan');
        log(`   Outro: ${prompts.outro.substring(0, 60)}...`, 'cyan');

        // Guardar prompts
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'prompts.json'),
            JSON.stringify(prompts, null, 2)
        );

        // ==========================================
        // PASO 3: Generar 3 videos con VEO3
        // ==========================================
        log('\n🎥 PASO 3: Generando 3 videos con VEO3...', 'yellow');

        const videos = {};
        const scenes = ['intro', 'statsCard', 'outro'];

        for (const scene of scenes) {
            log(`\n   → Generando escena: ${scene}...`, 'blue');

            const generateResponse = await axios.post(`${BASE_URL}/api/veo3/generate-ana`, {
                dialogue: prompts[scene],
                type: 'chollo',
                playerName: chollo.name,
                price: chollo.analysis.estimatedPrice,
                sessionId: SESSION_ID,
                scene: scene
            });

            if (!generateResponse.data.success) {
                throw new Error(`Error generando escena ${scene}: ${generateResponse.data.error}`);
            }

            const taskId = generateResponse.data.taskId;
            log(`     Task ID: ${taskId}`, 'cyan');

            // Polling para esperar el video
            let attempts = 0;
            const maxAttempts = 60; // 5 minutos máximo (60 * 5s)
            let videoReady = false;

            while (attempts < maxAttempts && !videoReady) {
                await sleep(5000); // Esperar 5 segundos
                attempts++;

                log(`     Polling (${attempts}/${maxAttempts})...`, 'cyan');

                const statusResponse = await axios.get(`${BASE_URL}/api/veo3/status/${taskId}`);

                if (statusResponse.data.status === 'completed') {
                    videos[scene] = statusResponse.data.videoUrl;
                    log(`     ✅ Video ${scene} generado: ${statusResponse.data.videoUrl}`, 'green');
                    videoReady = true;
                } else if (statusResponse.data.status === 'failed') {
                    throw new Error(`Video ${scene} falló: ${statusResponse.data.error}`);
                } else {
                    log(`     Estado: ${statusResponse.data.status}`, 'yellow');
                }
            }

            if (!videoReady) {
                throw new Error(`Timeout esperando video ${scene}`);
            }
        }

        // ==========================================
        // PASO 4: Concatenar videos
        // ==========================================
        log('\n🔗 PASO 4: Concatenando 3 videos...', 'yellow');

        const concatResponse = await axios.post(`${BASE_URL}/api/veo3/concatenate`, {
            videoUrls: [
                videos.intro,
                videos.statsCard,
                videos.outro
            ],
            sessionId: SESSION_ID,
            outputFileName: `chollo-${chollo.name.replace(/\s+/g, '-')}-complete.mp4`
        });

        if (!concatResponse.data.success) {
            throw new Error(`Error concatenando: ${concatResponse.data.error}`);
        }

        log(`✅ Video final generado: ${concatResponse.data.outputPath}`, 'green');

        // ==========================================
        // RESUMEN FINAL
        // ==========================================
        log('\n✅ ========== TEST E2E COMPLETADO ==========\n', 'bright');
        log(`Chollo: ${chollo.name} (${chollo.team.name})`, 'green');
        log(`Precio: ${chollo.analysis.estimatedPrice}M | Ratio: ${chollo.analysis.valueRatio}`, 'green');
        log(`\nVideos generados:`, 'cyan');
        log(`  1. Intro: ${videos.intro}`, 'cyan');
        log(`  2. Stats Card: ${videos.statsCard}`, 'cyan');
        log(`  3. Outro: ${videos.outro}`, 'cyan');
        log(`\nVideo final: ${concatResponse.data.outputPath}`, 'bright');
        log(`Duración total: ~${(3 * 5).toFixed(1)}s (estimado)\n`, 'cyan');

        // Guardar resumen
        const summary = {
            sessionId: SESSION_ID,
            chollo: {
                name: chollo.name,
                team: chollo.team.name,
                price: chollo.analysis.estimatedPrice,
                ratio: chollo.analysis.valueRatio,
                points: chollo.analysis.estimatedPoints
            },
            videos: videos,
            finalVideo: concatResponse.data.outputPath,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'summary.json'),
            JSON.stringify(summary, null, 2)
        );

        log('📄 Resumen guardado en summary.json\n', 'green');

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        if (error.response) {
            log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        }
        process.exit(1);
    }
}

main();
