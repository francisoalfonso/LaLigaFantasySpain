/**
 * SCRIPT DE VALIDACIÓN PARCIAL (2 SEGMENTOS) - VEO3 CHOLLO VIRAL
 *
 * Test simplificado con solo intro + middle mientras esperamos outro
 *
 * Flujo:
 * 1. Descargar intro + middle
 * 2. Concatenar con VideoConcatenator + logo
 * 3. Añadir subtítulos virales
 * 4. Integrar tarjeta de jugador
 * 5. Preview web
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');

// Config
const OUTPUT_DIR = path.join(__dirname, '../../output/veo3');
const SESSION_DIR = path.join(OUTPUT_DIR, `sessions/session_validation_${Date.now()}`);
const PREVIEW_DIR = path.join(__dirname, '../../frontend/assets/preview');

// URLs directas de los 2 primeros videos
const VIDEO_URLS = {
    intro: 'https://tempfile.aiquickdraw.com/s/670de8c1-4776-4266-8453-794425754691_watermarked.mp4',
    middle: 'https://tempfile.aiquickdraw.com/s/c4e5d428-b2c6-4f67-af02-bd1454546067_watermarked.mp4'
};

// Metadata
const TEST_DATA = {
    playerData: {
        id: 40637,  // ID de Pere Milla en API-Sports (necesario para foto)
        name: 'Pere Milla',
        team: 'Espanyol',
        price: 6.64,
        stats: { goals: 3, assists: 0, games: 6, rating: '7.0' },
        ratio: 1.42,
        position: 'DEL',
        // Foto desde API-Sports (se descargará automáticamente)
        photo: 'https://media.api-sports.io/football/players/40637.png'
    },
    dialogues: {
        intro: "He encontrado el chollo absoluto... Milla por solo seis punto seis cuatro millones... va a explotar.",
        middle: "3 goles, 0 asistencias. uno punto cuatro dos veces superior. Está dando el doble de puntos."
    }
};

console.log('\n🎬 ========== VALIDACIÓN PARCIAL (2 SEGMENTOS) ==========\n');

async function main() {
    try {
        // Crear directorio de sesión
        if (!fs.existsSync(SESSION_DIR)) {
            fs.mkdirSync(SESSION_DIR, { recursive: true });
        }
        console.log(`📁 Sesión: ${SESSION_DIR}\n`);

        // PASO 1: Descargar videos
        console.log('📥 PASO 1: Descargar videos...\n');
        const segments = [];

        for (const [name, url] of Object.entries(VIDEO_URLS)) {
            console.log(`   Descargando ${name}...`);
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 60000
            });

            const videoPath = path.join(SESSION_DIR, `${name}.mp4`);
            fs.writeFileSync(videoPath, response.data);

            const sizeMB = (response.data.length / 1024 / 1024).toFixed(2);
            console.log(`   ✅ ${name}: ${sizeMB} MB\n`);

            segments.push({
                name,
                videoPath,
                dialogue: TEST_DATA.dialogues[name]
            });
        }

        // PASO 2: Concatenar con logo
        console.log('🔗 PASO 2: Concatenar con logo...\n');
        const concatenator = new VideoConcatenator();

        const segmentsWithDialogue = segments.map(s => ({
            videoPath: s.videoPath,
            dialogue: s.dialogue
        }));

        const concatenatedVideo = await concatenator.concatenateVideos(segmentsWithDialogue, {
            outro: {
                enabled: true,
                freezeFrame: { enabled: true, duration: 0.8 }
            },
            audio: {
                fadeInOut: false
            },
            viralCaptions: {
                enabled: true,                    // ✅ ACTIVADO - formato aprobado Test #47
                applyBeforeConcatenation: true    // 🔧 FIX: Aplicar ANTES de concatenar
            },
            playerCard: {
                enabled: true,                    // ✅ ACTIVADO - integración automática
                applyToFirstSegment: true,        // 🔧 FIX: Aplicar a primer segmento (índice 0)
                startTime: 3.0,                   // Aparece en segundo 3
                duration: 4.0,                    // Visible durante 4 segundos
                slideInDuration: 0.5              // Animación de entrada
            },
            playerData: TEST_DATA.playerData      // ✅ Datos del jugador para tarjeta
        });

        console.log(`✅ Video completo (con subtítulos + tarjeta integrados): ${concatenatedVideo}\n`);

        // ℹ️ NOTA: Subtítulos virales y tarjeta de jugador ya están integrados por VideoConcatenator
        // No es necesario aplicarlos manualmente (formato aprobado Test #47)

        // PASO 3: Preview
        console.log('📋 PASO 3: Copiar a preview...\n');
        if (!fs.existsSync(PREVIEW_DIR)) {
            fs.mkdirSync(PREVIEW_DIR, { recursive: true });
        }

        const previewPath = path.join(PREVIEW_DIR, 'latest-chollo-viral.mp4');
        fs.copyFileSync(concatenatedVideo, previewPath);

        console.log(`✅ Preview: ${previewPath}\n`);

        // RESUMEN
        console.log('\n🎉 ========== VALIDACIÓN COMPLETA ==========\n');
        console.log(`✅ Video final: ${concatenatedVideo}`);
        console.log(`🌐 Preview: http://localhost:3000/test-history.html\n`);
        console.log('📋 COMPLETADO:');
        console.log('   ✅ Descarga de 2 segmentos (intro + middle, 8s cada uno)');
        console.log('   ✅ Análisis de audio (AudioAnalyzer con threshold -60dB)');
        console.log('   ✅ Recorte al fin de audio (con margin 0.3s)');
        console.log('   ✅ Concatenación + transición logo');
        console.log('   ✅ Subtítulos virales (integrados automáticamente)');
        console.log('   ✅ Tarjeta de jugador (integrada automáticamente)');
        console.log('   ✅ Preview web disponible\n');
        console.log('🔍 VALIDAR EN TEST-HISTORY:');
        console.log('   ⏳ Duración correcta (~14-16s esperados)');
        console.log('   ⏳ Acento español (NO mexicano)');
        console.log('   ⏳ Timing (NO cara rara)');
        console.log('   ⏳ Formato subtítulos aprobado Test #47\n');
        console.log('💡 Abre http://localhost:3000/test-history.html para ver el resultado\n');

    } catch (error) {
        console.error(`\n❌ ERROR: ${error.message}\n`);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
