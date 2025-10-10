/**
 * Concatenar 3 segmentos descargados con sistema completo
 */

const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, '../../output/veo3/sessions/session_final_1760023037191');
const PREVIEW_DIR = path.join(__dirname, '../../frontend/assets/preview');

const TEST_DATA = {
    playerData: {
        id: 40637,
        name: 'Pere Milla',
        team: 'Espanyol',
        price: 6.64,
        stats: { goals: 3, assists: 0, games: 6, rating: '7.0' },
        ratio: 1.42,
        position: 'DEL',
        photo: 'https://media.api-sports.io/football/players/40637.png'
    },
    dialogues: {
        intro: 'He encontrado el chollo absoluto... Milla por solo seis punto seis cuatro millones... va a explotar.',
        middle: '3 goles, 0 asistencias. uno punto cuatro dos veces superior. Está dando el doble de puntos.',
        outro: 'Es una ganga total. Nadie lo ha fichado aún. Fichadlo ahora antes que suba.'
    }
};

async function main() {
    console.log('\n🔗 CONCATENANDO 3 SEGMENTOS CON SISTEMA COMPLETO...\n');

    const concatenator = new VideoConcatenator();

    const segments = ['intro', 'middle', 'outro'].map(name => ({
        videoPath: path.join(SESSION_DIR, `${name}.mp4`),
        dialogue: TEST_DATA.dialogues[name]
    }));

    const concatenatedVideo = await concatenator.concatenateVideos(segments, {
        outro: {
            enabled: true,
            freezeFrame: { enabled: true, duration: 0.8 }
        },
        audio: {
            fadeInOut: false
        },
        viralCaptions: {
            enabled: true,
            applyBeforeConcatenation: true
        },
        playerCard: {
            enabled: true,
            applyToFirstSegment: true,
            startTime: 3.0,
            duration: 4.0,
            slideInDuration: 0.5
        },
        playerData: TEST_DATA.playerData
    });

    console.log(`\n✅ Video final: ${concatenatedVideo}\n`);

    // Copiar a preview
    if (!fs.existsSync(PREVIEW_DIR)) {
        fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    }
    const previewPath = path.join(PREVIEW_DIR, 'latest-chollo-viral-3seg.mp4');
    fs.copyFileSync(concatenatedVideo, previewPath);

    console.log(`📋 Preview: ${previewPath}\n`);
    console.log('🌐 Abre: http://localhost:3000/test-history.html\n');

    // Verificar duración audio
    console.log('📊 Verificando duración de audio/video...\n');
}

main().catch(err => {
    console.error(`\n❌ ERROR: ${err.message}\n`);
    process.exit(1);
});
