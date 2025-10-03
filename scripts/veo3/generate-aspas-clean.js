#!/usr/bin/env node

/**
 * Generar video Iago Aspas SIN transiciones frame-to-frame
 *
 * Script LIMPIO que usa solo buildCholloPrompt() simple.
 * NO usa buildMultiSegmentVideo() para evitar que VEO3 genere diferentes Anas.
 *
 * Uso:
 *   node scripts/veo3/generate-aspas-clean.js
 */

require('dotenv').config();
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');
const logger = require('../../backend/utils/logger');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración
const CONFIG = {
    contentType: 'chollo',
    targetSegments: 3,
    contentData: {
        playerName: 'Iago Aspas',  // Nombre completo para logs
        playerDisplayName: 'Aspas', // CRÍTICO: Solo apellido para VEO3 (evita error 422)
        team: 'Celta',
        price: 8.0,
        valueRatio: 1.4
    }
};

async function main() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎬 GENERANDO VIDEO LIMPIO: Iago Aspas SIN Transiciones Frame-to-Frame');
    console.log(`${'='.repeat(80)}\n`);

    console.log('📋 Configuración:');
    console.log(`   Jugador: ${CONFIG.contentData.playerName}`);
    console.log(`   Equipo: ${CONFIG.contentData.team}`);
    console.log(`   Precio: ${CONFIG.contentData.price}M`);
    console.log(`   Segmentos: ${CONFIG.targetSegments}`);
    console.log(`   Duración total: ${CONFIG.targetSegments * 8}s`);
    console.log(`   ✅ Imagen Ana: FIJA (Ana-001.jpeg en todos los segmentos)`);
    console.log(`   ✅ Prompts: SIMPLES (sin mencionar transiciones)`);

    // Verificar VEO3 configurado
    if (!process.env.KIE_AI_API_KEY) {
        throw new Error('VEO3 no está configurado. Verifica KIE_AI_API_KEY en .env');
    }

    const veo3 = new VEO3Client();
    const promptBuilder = new PromptBuilder();

    // Generar prompts SIMPLES sin mencionar transiciones
    console.log(`\n📝 Construyendo prompts SIMPLES (sin transiciones frame-to-frame)...`);

    // CRÍTICO: Usar playerDisplayName (solo apellido) para evitar error 422 de KIE.ai
    const playerName = CONFIG.contentData.playerDisplayName || CONFIG.contentData.playerName;

    // Usar prompts MÍNIMOS directos (sin buildCholloPrompt que agrega estructura viral compleja)
    const segments = [
        {
            label: "Segmento 1/3 - Hook inicial",
            prompt: promptBuilder.buildPrompt({
                dialogue: `¡Misters! Vamos con un chollo que no puedes dejar pasar...`
            })
        },
        {
            label: "Segmento 2/3 - Análisis",
            prompt: promptBuilder.buildPrompt({
                dialogue: `${playerName} del ${CONFIG.contentData.team} está a solo ${CONFIG.contentData.price} millones. La relación calidad-precio es brutal.`
            })
        },
        {
            label: "Segmento 3/3 - CTA",
            prompt: promptBuilder.buildPrompt({
                dialogue: `Un ratio de valor de ${CONFIG.contentData.valueRatio}. No lo dejes pasar, que se va a poner más caro.`
            })
        }
    ];

    console.log(`   ✅ ${segments.length} segmentos preparados`);
    console.log(`   ✅ Prompts simples sin mencionar transiciones`);

    // Generar cada segmento
    const videoSegments = [];
    const startTime = Date.now();

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📹 SEGMENTO ${i + 1}/${segments.length}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`   ${segment.label}`);
        console.log(`   Prompt: "${segment.prompt.substring(0, 100)}..."`);

        // Generar video con VEO3
        console.log(`\n⏳ Iniciando generación (4-6 minutos)...`);

        const initResult = await veo3.generateVideo(segment.prompt, {
            aspectRatio: '9:16',
            duration: 8,
            imageRotation: 'fixed',  // Usar SIEMPRE la misma imagen
            imageIndex: 0            // Ana-001.jpeg
        });

        if (initResult.code !== 200 || !initResult.data?.taskId) {
            throw new Error(`Error iniciando segmento ${i + 1}: ${initResult.msg || 'Unknown error'}`);
        }

        const taskId = initResult.data.taskId;
        console.log(`   ✅ Video iniciado, taskId: ${taskId}`);

        // Esperar completar (pasar prompt para análisis de errores)
        console.log(`   ⏳ Esperando completar video...`);
        const video = await veo3.waitForCompletion(taskId, undefined, segment.prompt);

        console.log(`\n✅ Segmento ${i + 1} generado:`);
        console.log(`   Platform: ${video.platform || 'external'}`);
        console.log(`   Duración: ${video.duration}s`);
        console.log(`   Costo: $${video.cost}`);

        // Usar localPath si existe, sino descargar
        if (video.localPath) {
            console.log(`   Local path: ${video.localPath}`);
            videoSegments.push(video.localPath);
        } else if (video.bunnyUrl) {
            // Descargar de Bunny
            const tempPath = path.join('output/veo3', `temp_segment_${i + 1}_${Date.now()}.mp4`);
            console.log(`   ⚠️ Descargando desde Bunny: ${video.bunnyUrl}`);

            const response = await axios.get(video.bunnyUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(tempPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`   ✅ Descargado a: ${tempPath}`);
            videoSegments.push(tempPath);
        } else if (video.url) {
            // Descargar de URL original
            const tempPath = path.join('output/veo3', `temp_segment_${i + 1}_${Date.now()}.mp4`);
            console.log(`   ⚠️ Descargando desde URL: ${video.url}`);

            const response = await axios.get(video.url, { responseType: 'stream' });
            const writer = fs.createWriteStream(tempPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`   ✅ Descargado a: ${tempPath}`);
            videoSegments.push(tempPath);
        } else {
            throw new Error(`Segmento ${i + 1}: No se encontró ruta de video válida`);
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n⏱️  Tiempo total generación: ${totalTime} minutos`);

    // Concatenar SIN cortinillas (cortes directos)
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔗 CONCATENANDO VIDEOS (cortes directos, sin cortinillas)');
    console.log(`${'='.repeat(80)}`);

    const timestamp = Date.now();
    const listFile = path.join('output/veo3', `concat-list-${timestamp}.txt`);
    let listContent = '';

    for (const videoPath of videoSegments) {
        listContent += `file '${path.resolve(videoPath)}'\n`;
    }

    await fs.promises.writeFile(listFile, listContent);
    console.log(`\n📄 Lista de concatenación creada: ${listFile}`);

    const outputPath = `output/veo3/aspas-clean-${timestamp}.mp4`;
    const concatCmd = `ffmpeg -f concat -safe 0 -i "${listFile}" \
        -c:v libx264 -preset fast -crf 18 \
        -c:a aac -b:a 192k \
        -pix_fmt yuv420p \
        -y "${outputPath}"`;

    await execAsync(concatCmd);
    await fs.promises.unlink(listFile);

    console.log(`\n✅ Videos concatenados: ${outputPath}`);

    const concatResult = {
        outputPath,
        segments: videoSegments.length,
        transitions: 'cortes directos (sin cortinillas)',
        totalDuration: `${videoSegments.length * 8}s`,
        cost: `$${(CONFIG.targetSegments * 0.30).toFixed(2)}`
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ COMPLETADO');
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Resultados finales:`);
    console.log(`   ✅ Video final: ${concatResult.outputPath}`);
    console.log(`   📏 Segmentos: ${concatResult.segments}`);
    console.log(`   🔗 Transiciones: ${concatResult.transitions}`);
    console.log(`   ⏱️  Duración total: ${concatResult.totalDuration}`);
    console.log(`   🎨 Imagen Ana: Ana-001.jpeg FIJA (sin rotación)`);
    console.log(`   📝 Prompts: SIMPLES (sin transiciones frame-to-frame)`);
    console.log(`   💰 Costo total: ${concatResult.cost}`);
    console.log(`\n🎥 Abrir video:`);
    console.log(`   open "${concatResult.outputPath}"`);
    console.log('');
}

// Ejecutar
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}

module.exports = { main };
