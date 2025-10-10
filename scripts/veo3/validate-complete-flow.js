/**
 * SCRIPT DE VALIDACIÓN COMPLETO - VEO3 CHOLLO VIRAL
 *
 * Flujo completo de post-procesamiento:
 * 1. Verificar estado de videos en KIE.ai
 * 2. Descargar los 3 segmentos completados
 * 3. Concatenar con VideoConcatenator + transición logo
 * 4. Añadir subtítulos virales (karaoke style)
 * 5. Integrar tarjeta de jugador (segundo 3)
 * 6. Guardar en output + copiar a preview web
 *
 * NOTA: Este es el flujo oficial de validación definido por el usuario (8 Oct 2025)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const ViralCaptionsGenerator = require('../../backend/services/veo3/viralCaptionsGenerator');
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../../output/veo3');
const SESSION_DIR = path.join(OUTPUT_DIR, 'sessions');
const PREVIEW_DIR = path.join(__dirname, '../../frontend/assets/preview');

// TaskIDs del último test (Pere Milla)
const TASK_IDS = {
    intro: 'a4073222e2cc2652be4c3b8a0ccf766a',
    middle: '7c00315e43dcaa5a4cc6aae26d59fb0c',
    outro: '1e4cc87c336a5274de7e55129d4fca4d'
};

// URLs directas (fallback si hay rate limiting)
const VIDEO_URLS = {
    intro: 'https://tempfile.aiquickdraw.com/s/670de8c1-4776-4266-8453-794425754691_watermarked.mp4',
    middle: 'https://tempfile.aiquickdraw.com/s/c4e5d428-b2c6-4f67-af02-bd1454546067_watermarked.mp4',
    outro: null // Se obtendrá cuando esté disponible
};

// Metadata del test
const TEST_METADATA = {
    playerData: {
        name: 'Pere Milla',
        team: 'Espanyol',
        price: 6.64,
        stats: {
            goals: 3,
            assists: 0,
            games: 6,
            rating: 7.0
        },
        ratio: 1.42,
        position: 'DEL' // Delantero
    },
    dialogues: {
        intro: "He encontrado el chollo absoluto... Milla por solo seis punto seis cuatro millones... va a explotar.",
        middle: "3 goles, 0 asistencias. uno punto cuatro dos veces superior. Está dando el doble de puntos.",
        outro: "Es una ganga total. Nadie lo ha fichado aún. Fichadlo ahora antes que suba."
    },
    sessionId: `session_${Date.now()}`
};

console.log('');
console.log('🎬 ========== VALIDACIÓN COMPLETA: CHOLLO VIRAL PERE MILLA ==========');
console.log('');

/**
 * Verificar estado de un video en KIE.ai
 */
async function checkVideoStatus(taskId, segmentName) {
    try {
        console.log(`📊 Verificando estado de ${segmentName}...`);
        const response = await axios.get(`${BASE_URL}/api/veo3/status/${taskId}`);

        // Manejar estructura de respuesta de KIE.ai
        let status, progress;

        if (response.data.success && response.data.data) {
            // Estructura de respuesta correcta
            status = response.data.data.status; // 0 = pending, 1 = completed, -1 = failed
            progress = status === 1 ? 100 : (status === 0 ? 50 : 0);

            const statusText = status === 1 ? 'completed' : (status === 0 ? 'in_progress' : 'failed');
            console.log(`   Estado: ${statusText} (status code: ${status})`);
        } else {
            // Fallback
            status = response.data.status || 'unknown';
            progress = response.data.progress || 0;
            console.log(`   Estado: ${status} (${progress}% completado)`);
        }

        return {
            taskId,
            segmentName,
            status,
            progress,
            data: response.data
        };
    } catch (error) {
        if (error.response?.status === 429 || error.response?.data?.error?.includes('Demasiadas peticiones')) {
            console.log(`   ⚠️  Rate limit - asumiendo completado si hay URL directa`);
            return {
                taskId,
                segmentName,
                status: VIDEO_URLS[segmentName] ? 1 : 'in_progress',
                progress: VIDEO_URLS[segmentName] ? 100 : 0
            };
        }
        throw error;
    }
}

/**
 * Descargar video desde KIE.ai
 */
async function downloadVideo(taskId, segmentName, sessionDir) {
    try {
        console.log(`📥 Descargando ${segmentName}...`);

        let videoUrl = null;

        // Intentar obtener URL desde API
        try {
            const statusResponse = await axios.get(`${BASE_URL}/api/veo3/status/${taskId}`);

            if (statusResponse.data.success && statusResponse.data.data.status === 1) {
                videoUrl = statusResponse.data.data.result.resultUrls[0];
                console.log(`   URL desde API: ${videoUrl.substring(0, 50)}...`);
            } else if (statusResponse.data.status !== 'completed') {
                throw new Error(`Video ${segmentName} no está completado (status: ${statusResponse.data.status})`);
            }
        } catch (apiError) {
            // Si hay rate limiting o error, usar URL directa si está disponible
            if (apiError.response?.status === 429 || apiError.response?.data?.error?.includes('Demasiadas peticiones')) {
                console.log(`   ⚠️  Rate limit - usando URL directa`);
                videoUrl = VIDEO_URLS[segmentName];
                if (!videoUrl) {
                    throw new Error(`Rate limit y no hay URL directa disponible para ${segmentName}`);
                }
            } else {
                throw apiError;
            }
        }

        console.log(`   Descargando desde: ${videoUrl.substring(0, 60)}...`);

        // Descargar video
        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60s timeout para descarga
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Guardar en directorio de sesión
        const videoPath = path.join(sessionDir, `${segmentName}.mp4`);
        fs.writeFileSync(videoPath, videoResponse.data);

        const fileSizeMB = (videoResponse.data.length / 1024 / 1024).toFixed(2);
        console.log(`   ✅ Descargado: ${videoPath} (${fileSizeMB} MB)`);
        return videoPath;

    } catch (error) {
        console.error(`   ❌ Error descargando ${segmentName}: ${error.message}`);
        throw error;
    }
}

/**
 * Concatenar videos con logo
 */
async function concatenateWithLogo(segments, sessionDir) {
    try {
        console.log('');
        console.log('🔗 PASO: Concatenar videos con transición logo...');
        console.log('');

        const concatenator = new VideoConcatenator();

        // Preparar segmentos con diálogos para subtítulos
        const segmentsWithDialogue = segments.map(segment => ({
            videoPath: segment.videoPath,
            dialogue: segment.dialogue
        }));

        // Concatenar con logo outro automático
        const concatenatedVideo = await concatenator.concatenateVideos(segmentsWithDialogue, {
            // Logo outro activado (automático en VideoConcatenator)
            outro: {
                enabled: true,
                freezeFrame: {
                    enabled: true,
                    duration: 0.8
                }
            },
            // Audio crossfade desactivado (frame-to-frame transitions)
            audio: {
                fadeInOut: false
            },
            // ⚠️ SUBTÍTULOS VIRALES DESACTIVADOS AQUÍ
            // Los aplicaremos después de la concatenación para mejor control
            viralCaptions: {
                enabled: false
            },
            // ⚠️ TARJETA DE JUGADOR DESACTIVADA AQUÍ
            // La aplicaremos al video final después
            playerCard: {
                enabled: false
            }
        });

        console.log(`✅ Video concatenado: ${concatenatedVideo}`);
        return concatenatedVideo;

    } catch (error) {
        console.error(`❌ Error concatenando videos: ${error.message}`);
        throw error;
    }
}

/**
 * Añadir subtítulos virales al video completo
 */
async function addViralCaptions(videoPath, fullDialogue, sessionDir) {
    try {
        console.log('');
        console.log('📝 PASO: Añadir subtítulos virales...');
        console.log('');
        console.log(`💬 Diálogo completo: "${fullDialogue}"`);

        const captionsGenerator = new ViralCaptionsGenerator();

        // Detectar duración del video
        const ffmpeg = require('fluent-ffmpeg');
        const videoDuration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration);
            });
        });

        console.log(`⏱️  Duración del video: ${videoDuration.toFixed(2)}s`);

        // Generar subtítulos virales
        const outputPath = path.join(sessionDir, `final-with-captions-${Date.now()}.mp4`);
        const videoWithCaptions = await captionsGenerator.generateViralCaptions(
            videoPath,
            fullDialogue,
            {
                videoDuration,
                outputPath
            }
        );

        console.log(`✅ Subtítulos aplicados: ${videoWithCaptions}`);
        return videoWithCaptions;

    } catch (error) {
        console.error(`❌ Error añadiendo subtítulos: ${error.message}`);
        throw error;
    }
}

/**
 * Integrar tarjeta de jugador
 */
async function addPlayerCard(videoPath, playerData, sessionDir) {
    try {
        console.log('');
        console.log('🃏 PASO: Integrar tarjeta de jugador...');
        console.log('');
        console.log(`👤 Jugador: ${playerData.name} (${playerData.team})`);
        console.log(`📊 Stats: ${playerData.stats.goals} goles, ${playerData.stats.games} partidos, rating ${playerData.stats.rating}`);

        const playerCardOverlay = new PlayerCardOverlay();

        // Aplicar tarjeta con animación slide-in en segundo 3
        const outputPath = path.join(sessionDir, `final-complete-${Date.now()}.mp4`);
        const videoWithCard = await playerCardOverlay.generateAndApplyCard(
            videoPath,
            playerData,
            {
                startTime: 3.0,
                duration: 4.0,
                slideInDuration: 0.5,
                cleanup: true,
                outputPath
            }
        );

        console.log(`✅ Tarjeta aplicada: ${videoWithCard}`);
        return videoWithCard;

    } catch (error) {
        console.error(`❌ Error añadiendo tarjeta: ${error.message}`);
        throw error;
    }
}

/**
 * Copiar video final a directorio de preview
 */
async function copyToPreview(videoPath) {
    try {
        console.log('');
        console.log('📋 PASO: Copiar a directorio de preview web...');
        console.log('');

        // Crear directorio de preview si no existe
        if (!fs.existsSync(PREVIEW_DIR)) {
            fs.mkdirSync(PREVIEW_DIR, { recursive: true });
        }

        const previewPath = path.join(PREVIEW_DIR, 'latest-chollo-viral.mp4');
        fs.copyFileSync(videoPath, previewPath);

        console.log(`✅ Copiado a: ${previewPath}`);
        console.log(`🌐 URL preview: http://localhost:3000/viral-preview`);
        return previewPath;

    } catch (error) {
        console.error(`❌ Error copiando a preview: ${error.message}`);
        throw error;
    }
}

/**
 * Main
 */
async function main() {
    try {
        // PASO 1: Crear directorio de sesión
        const sessionDir = path.join(SESSION_DIR, TEST_METADATA.sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        console.log(`📁 Directorio de sesión: ${sessionDir}`);
        console.log('');

        // PASO 2: Verificar estado de videos
        console.log('📊 PASO 1: Verificar estado de videos en KIE.ai...');
        console.log('');

        const statuses = await Promise.all([
            checkVideoStatus(TASK_IDS.intro, 'intro'),
            checkVideoStatus(TASK_IDS.middle, 'middle'),
            checkVideoStatus(TASK_IDS.outro, 'outro')
        ]);

        // Verificar que todos estén completados o tengan URL directa
        const allReady = statuses.every(s =>
            s.status === 'completed' ||
            s.status === 'succeeded' ||
            s.status === 1 ||
            s.status === 'in_progress' && VIDEO_URLS[s.segmentName] // Rate limit pero tenemos URL
        );

        if (!allReady) {
            console.log('');
            console.log('⚠️  ALERTA: No todos los videos están completados aún');
            console.log('');
            statuses.forEach(s => {
                const hasUrl = VIDEO_URLS[s.segmentName];
                const icon = (s.status === 'completed' || s.status === 1 || hasUrl) ? '✅' : '⏳';
                const statusText = hasUrl ? `${s.status} (URL directa disponible)` : s.status;
                console.log(`   ${icon} ${s.segmentName}: ${statusText} (${s.progress}%)`);
            });
            console.log('');
            console.log('💡 Espera unos minutos y vuelve a ejecutar este script');
            console.log('   O revisa manualmente en: https://kie.ai/es/logs');
            process.exit(0);
        }

        console.log('✅ Todos los videos están completados');
        console.log('');

        // PASO 3: Descargar videos
        console.log('📥 PASO 2: Descargar videos...');
        console.log('');

        const downloadedSegments = [];
        for (const segment of ['intro', 'middle', 'outro']) {
            const videoPath = await downloadVideo(TASK_IDS[segment], segment, sessionDir);
            downloadedSegments.push({
                name: segment,
                videoPath,
                dialogue: TEST_METADATA.dialogues[segment]
            });
        }

        console.log('✅ Todos los videos descargados');
        console.log('');

        // PASO 4: Concatenar con logo
        const concatenatedVideo = await concatenateWithLogo(downloadedSegments, sessionDir);

        // PASO 5: Añadir subtítulos virales
        const fullDialogue = [
            TEST_METADATA.dialogues.intro,
            TEST_METADATA.dialogues.middle,
            TEST_METADATA.dialogues.outro
        ].join(' ');

        const videoWithCaptions = await addViralCaptions(concatenatedVideo, fullDialogue, sessionDir);

        // PASO 6: Añadir tarjeta de jugador
        const finalVideo = await addPlayerCard(videoWithCaptions, TEST_METADATA.playerData, sessionDir);

        // PASO 7: Copiar a preview
        await copyToPreview(finalVideo);

        // RESUMEN FINAL
        console.log('');
        console.log('🎉 ========== VALIDACIÓN COMPLETA ==========');
        console.log('');
        console.log(`✅ Video final: ${finalVideo}`);
        console.log(`📁 Sesión: ${sessionDir}`);
        console.log(`🌐 Preview web: http://localhost:3000/viral-preview`);
        console.log('');
        console.log('📋 PASOS COMPLETADOS:');
        console.log('   ✅ Verificación de estado en KIE.ai');
        console.log('   ✅ Descarga de 3 segmentos');
        console.log('   ✅ Concatenación con transición logo');
        console.log('   ✅ Subtítulos virales aplicados');
        console.log('   ✅ Tarjeta de jugador integrada (segundo 3)');
        console.log('   ✅ Disponible en preview web');
        console.log('');
        console.log('🔍 VALIDACIONES PENDIENTES:');
        console.log('   ⏳ Acento español (NO mexicano) en todos los segmentos');
        console.log('   ⏳ Timing correcto (NO "cara rara" al final)');
        console.log('');
        console.log('💡 Abre el navegador y revisa el video en la web de preview');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ ERROR EN VALIDACIÓN COMPLETA:');
        console.error(`   ${error.message}`);
        console.error('');
        process.exit(1);
    }
}

// Ejecutar
main();
