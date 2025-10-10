/**
 * Agregar subtítulos karaoke al TEST #47
 *
 * Toma el video ana-concatenated-1759569786307.mp4 y genera versión con subtítulos
 */

const path = require('path');
const CaptionsService = require('../../backend/services/youtubeShorts/captionsService');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Segmentos TEST #47 desde el JSON
const segments = [
    {
        index: 1,
        dialogue: "He encontrado el chollo absoluto... Carvajal por solo cinco punto cinco millones... va a explotar.",
        duration: 8,
        startTime: 0
    },
    {
        index: 2,
        dialogue: "1 goles, 0 asistencias. Su ratio valor es 1.23 veces superior. Está dando el doble de puntos.",
        duration: 8,
        startTime: 8
    },
    {
        index: 3,
        dialogue: "A cinco punto cinco millones es una ganga. Nadie lo ha fichado aún. Fichad a Carvajal ahora.",
        duration: 8,
        startTime: 16
    }
];

async function addCaptionsToTest47() {
    console.log('🎬 Agregando subtítulos karaoke a TEST #47...\n');

    const captionsService = new CaptionsService();

    // Paths
    const videoInput = path.join(__dirname, '../../output/veo3/ana-concatenated-1759569786307.mp4');
    const videoOutput = path.join(__dirname, '../../output/veo3/ana-test47-with-captions.mp4');

    try {
        // 1. Generar archivo de subtítulos .ass (karaoke)
        console.log('📝 Generando archivo .ass con subtítulos karaoke...');
        const result = await captionsService.generateCaptions(segments, 'karaoke', 'ass');

        if (!result.success) {
            throw new Error(`Error generando subtítulos: ${result.error}`);
        }

        console.log(`✅ Subtítulos generados: ${result.captionsFile}`);
        console.log(`   - Total subtítulos: ${result.metadata.totalSubtitles}`);
        console.log(`   - Duración total: ${result.metadata.totalDuration}s`);
        console.log(`   - Estilo: ${result.style}\n`);

        // 2. Aplicar subtítulos al video con FFmpeg
        console.log('🎨 Aplicando subtítulos al video con FFmpeg...');

        const ffmpegCommand = `ffmpeg -i "${videoInput}" -vf "ass=${result.captionsFile}" -c:a copy "${videoOutput}" -y`;

        console.log(`Comando: ${ffmpegCommand}\n`);

        const { stdout, stderr } = await execPromise(ffmpegCommand);

        console.log('✅ Video con subtítulos generado correctamente\n');
        console.log(`📍 Ubicación: ${videoOutput}`);
        console.log(`🌐 URL: http://localhost:3000/output/veo3/ana-test47-with-captions.mp4\n`);

        // 3. Resumen
        console.log('═══════════════════════════════════════════════');
        console.log('✅ SUBTÍTULOS KARAOKE AGREGADOS EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════');
        console.log('📊 Estadísticas:');
        console.log(`   - Segmentos procesados: ${segments.length}`);
        console.log(`   - Subtítulos generados: ${result.metadata.totalSubtitles}`);
        console.log(`   - Estilo: Karaoke word-by-word`);
        console.log(`   - Formato: Advanced SubStation Alpha (.ass)`);
        console.log(`   - Color highlighting: Dorado (#FFD700)`);
        console.log('');
        console.log('🎥 Reproduce el video para ver los subtítulos en acción:');
        console.log(`   http://localhost:3000/output/veo3/ana-test47-with-captions.mp4`);
        console.log('═══════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
addCaptionsToTest47();
