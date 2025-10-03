#!/usr/bin/env node

/**
 * Concatenar videos VEO3 con cortinilla de transición
 *
 * Uso:
 *   node scripts/veo3/concatenate-with-transition.js
 *
 * Este script concatena múltiples segmentos de video usando una cortinilla
 * de transición entre cada segmento para evitar saltos visuales.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const CONFIG = {
    // Cortinillas disponibles
    transitions: {
        red: 'output/veo3/transitions/cortina-red-1080x1920.png',
        white: 'output/veo3/transitions/cortina-white-1080x1920.png'
    },

    // Duración de la cortinilla (segundos)
    transitionDuration: 0.5,

    // Fade in/out de la cortinilla (segundos)
    fadeDuration: 0.15,

    // Directorio de salida
    outputDir: 'output/veo3'
};

/**
 * Crear video de cortinilla desde imagen estática
 */
async function createTransitionVideo(transitionImage, outputPath) {
    console.log(`\n🎬 Creando video de cortinilla desde ${transitionImage}...`);

    const duration = CONFIG.transitionDuration;
    const fade = CONFIG.fadeDuration;

    // FFmpeg: Imagen estática → Video SIN fades (corte directo)
    // IMPORTANTE: Sin B-frames para evitar referencias futuras
    const cmd = `ffmpeg -loop 1 -i "${transitionImage}" -f lavfi -i anullsrc=r=48000:cl=stereo \
        -t ${duration} \
        -c:v libx264 -pix_fmt yuv420p \
        -c:a aac -b:a 192k \
        -r 24 \
        -g 24 -keyint_min 24 -sc_threshold 0 -bf 0 \
        -shortest \
        -y "${outputPath}"`;

    try {
        const { stdout, stderr } = await execAsync(cmd);
        console.log(`   ✅ Cortinilla creada: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error(`   ❌ Error creando cortinilla:`, error.message);
        throw error;
    }
}

/**
 * Concatenar múltiples videos con cortinillas entre ellos
 */
async function concatenateWithTransitions(videoSegments, transitionType = 'red', outputFilename = null) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔗 CONCATENACIÓN CON CORTINILLAS');
    console.log(`${'='.repeat(80)}\n`);

    console.log(`📋 Configuración:`);
    console.log(`   Segmentos: ${videoSegments.length}`);
    console.log(`   Cortinilla: ${transitionType}`);
    console.log(`   Duración cortinilla: ${CONFIG.transitionDuration}s`);
    console.log(`   Fade: ${CONFIG.fadeDuration}s`);

    // 1. Crear video de cortinilla
    const transitionImage = CONFIG.transitions[transitionType];
    const transitionVideoPath = path.join(CONFIG.outputDir, `transition-${transitionType}.mp4`);

    await createTransitionVideo(transitionImage, transitionVideoPath);

    // 2. Construir comando filter_complex para concatenación precisa
    const timestamp = Date.now();
    const outputFile = outputFilename || path.join(CONFIG.outputDir, `final-with-transition-${timestamp}.mp4`);

    console.log(`\n🔗 Concatenando videos con filter_complex (precisión frame-level)...`);
    console.log(`   MÉTODO: Concat filter garantiza timing exacto de cortinilla`);

    // Construir inputs: -i video1 -i cortinilla -i video2 -i cortinilla -i video3 ...
    let inputsCmd = '';
    let filterChain = '';
    let inputCount = 0;

    for (let i = 0; i < videoSegments.length; i++) {
        inputsCmd += `-i "${videoSegments[i]}" `;
        inputCount++;

        // Agregar cortinilla input (excepto después del último segmento)
        if (i < videoSegments.length - 1) {
            inputsCmd += `-i "${transitionVideoPath}" `;
            inputCount++;
        }
    }

    // MÉTODO MÁS SIMPLE: Primero normalizar cada video a archivos intermedios, luego concat con demuxer
    console.log(`\n📋 Inputs: ${inputCount} (${videoSegments.length} segmentos + ${videoSegments.length - 1} cortinillas)`);
    console.log(`📋 Método: Pre-normalización + concat demuxer`);

    // Paso 1: Normalizar cada input a archivos intermedios
    const normalizedFiles = [];
    for (let i = 0; i < videoSegments.length; i++) {
        const normalizedPath = path.join(CONFIG.outputDir, `normalized_${i}_${timestamp}.mp4`);
        normalizedFiles.push(normalizedPath);

        const normalizeCmd = `ffmpeg -i "${videoSegments[i]}" \
            -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24" \
            -af "aformat=sample_rates=48000:channel_layouts=stereo" \
            -c:v libx264 -preset fast -crf 18 \
            -c:a aac -b:a 192k \
            -pix_fmt yuv420p \
            -g 24 -keyint_min 24 -sc_threshold 0 -bf 0 \
            -y "${normalizedPath}"`;

        console.log(`\n📹 Normalizando segmento ${i + 1}...`);
        await execAsync(normalizeCmd);
    }

    // La cortinilla ya está normalizada en createTransitionVideo()

    // Paso 2: Crear lista concat con archivos normalizados
    const listFile = path.join(CONFIG.outputDir, `concat-list-${timestamp}.txt`);
    let listContent = '';

    for (let i = 0; i < normalizedFiles.length; i++) {
        listContent += `file '${path.resolve(normalizedFiles[i])}'\n`;
        if (i < normalizedFiles.length - 1) {
            listContent += `file '${path.resolve(transitionVideoPath)}'\n`;
        }
    }

    await fs.writeFile(listFile, listContent);
    console.log(`\n📝 Lista concat: ${listContent}`);

    // Paso 3: Concat con RE-ENCODE sin B-frames (evita GOP artifacts)
    const concatCmd = `ffmpeg -f concat -safe 0 -i "${listFile}" \
        -c:v libx264 -preset fast -crf 18 \
        -c:a aac -b:a 192k \
        -pix_fmt yuv420p \
        -g 24 -keyint_min 24 -sc_threshold 0 -bf 0 \
        -y "${outputFile}"`;

    try {
        const { stdout, stderr } = await execAsync(concatCmd);
        console.log(`\n✅ Video final creado: ${outputFile}`);

        // Limpiar archivos temporales
        await fs.unlink(listFile);
        for (const normalizedFile of normalizedFiles) {
            await fs.unlink(normalizedFile);
        }

        return {
            success: true,
            outputPath: outputFile,
            segments: videoSegments.length,
            transitions: videoSegments.length - 1,
            totalDuration: `~${videoSegments.length * 8 + (videoSegments.length - 1) * CONFIG.transitionDuration}s`
        };
    } catch (error) {
        console.error(`\n❌ Error concatenando:`, error.message);
        throw error;
    }
}

/**
 * Script principal
 */
async function main() {
    // Ejemplo: Concatenar los 2 segmentos del test frame-to-frame
    const segmentsDir = 'output/videos';

    // Buscar los 2 videos más recientes (del test)
    const files = await fs.readdir(segmentsDir);
    const mp4Files = files
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({
            name: f,
            path: path.join(segmentsDir, f),
            time: parseInt(f.split('_')[1]) || 0
        }))
        .sort((a, b) => b.time - a.time)
        .slice(0, 2)
        .reverse(); // Orden cronológico

    if (mp4Files.length < 2) {
        console.error('❌ No se encontraron suficientes segmentos para concatenar');
        process.exit(1);
    }

    console.log(`\n📹 Segmentos encontrados:`);
    mp4Files.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.name}`);
    });

    const videoSegments = mp4Files.map(f => f.path);

    // Probar con ambas cortinillas
    console.log(`\n🎨 Generando versión con cortinilla ROJA...`);
    const resultRed = await concatenateWithTransitions(
        videoSegments,
        'red',
        'output/veo3/final-transition-red.mp4'
    );

    console.log(`\n🎨 Generando versión con cortinilla BLANCA...`);
    const resultWhite = await concatenateWithTransitions(
        videoSegments,
        'white',
        'output/veo3/final-transition-white.mp4'
    );

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ COMPLETADO');
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Resultados:`);
    console.log(`   ✅ Versión ROJA: ${resultRed.outputPath}`);
    console.log(`   ✅ Versión BLANCA: ${resultWhite.outputPath}`);
    console.log(`   📏 Segmentos: ${resultRed.segments}`);
    console.log(`   🔗 Transiciones: ${resultRed.transitions}`);
    console.log(`   ⏱️  Duración: ${resultRed.totalDuration}`);
    console.log(`\n🎥 Comandos para visualizar:`);
    console.log(`   open "${resultRed.outputPath}"`);
    console.log(`   open "${resultWhite.outputPath}"`);
    console.log('');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}

module.exports = { concatenateWithTransitions, createTransitionVideo };
