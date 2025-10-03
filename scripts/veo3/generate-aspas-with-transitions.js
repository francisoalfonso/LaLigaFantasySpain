#!/usr/bin/env node

/**
 * Generar video Iago Aspas con cortinillas de transición
 *
 * Script para generar video de 3 segmentos (24s) con cortinillas entre cada segmento.
 *
 * Uso:
 *   node scripts/veo3/generate-aspas-with-transitions.js
 */

require('dotenv').config();
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');
const logger = require('../../backend/utils/logger');

// Configuración
const CONFIG = {
    contentType: 'chollo',
    targetSegments: 3,
    contentData: {
        playerName: 'Iago Aspas',
        team: 'Celta',
        price: 8.0,
        valueRatio: 1.4
    }
};

async function main() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎬 GENERANDO VIDEO: Iago Aspas con Cortinillas');
    console.log(`${'='.repeat(80)}\n`);

    console.log('📋 Configuración:');
    console.log(`   Jugador: ${CONFIG.contentData.playerName}`);
    console.log(`   Equipo: ${CONFIG.contentData.team}`);
    console.log(`   Precio: ${CONFIG.contentData.price}M`);
    console.log(`   Segmentos: ${CONFIG.targetSegments}`);
    console.log(`   Duración total: ${CONFIG.targetSegments * 8}s`);
    console.log(`   Cortinillas: ${CONFIG.targetSegments - 1}`);

    // Verificar VEO3 configurado
    if (!process.env.KIE_AI_API_KEY) {
        throw new Error('VEO3 no está configurado. Verifica KIE_AI_API_KEY en .env');
    }

    const veo3 = new VEO3Client();
    const promptBuilder = new PromptBuilder();

    // Generar prompts simples SIN transiciones frame-to-frame
    console.log(`\n📝 Construyendo prompts simples (sin transiciones frame-to-frame)...`);

    // Crear 3 segmentos con prompts simples de chollo
    const segments = [
        {
            label: "Segmento 1/3 - Hook inicial",
            prompt: promptBuilder.buildCholloPrompt(
                CONFIG.contentData.playerName,
                CONFIG.contentData.price,
                {
                    team: CONFIG.contentData.team,
                    ratio: CONFIG.contentData.valueRatio,
                    dialogue: `¿Buscas un chollo en Fantasy? Mira esto...`
                }
            )
        },
        {
            label: "Segmento 2/3 - Análisis",
            prompt: promptBuilder.buildCholloPrompt(
                CONFIG.contentData.playerName,
                CONFIG.contentData.price,
                {
                    team: CONFIG.contentData.team,
                    ratio: CONFIG.contentData.valueRatio,
                    dialogue: `${CONFIG.contentData.playerName} del ${CONFIG.contentData.team} está a solo ${CONFIG.contentData.price} millones.`
                }
            )
        },
        {
            label: "Segmento 3/3 - CTA",
            prompt: promptBuilder.buildCholloPrompt(
                CONFIG.contentData.playerName,
                CONFIG.contentData.price,
                {
                    team: CONFIG.contentData.team,
                    ratio: CONFIG.contentData.valueRatio,
                    dialogue: `Una relación calidad-precio brutal. No lo dejes pasar.`
                }
            )
        }
    ];

    console.log(`   ✅ ${segments.length} segmentos preparados`);
    console.log(`   ✅ Cortes directos (sin transiciones)`);

    // Generar cada segmento
    const videoSegments = [];
    const startTime = Date.now();

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📹 SEGMENTO ${i + 1}/${segments.length}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`   ${segment.label}`);

        // Generar video con VEO3 (solo iniciar)
        console.log(`\n⏳ Iniciando generación (4-6 minutos)...`);

        const initResult = await veo3.generateVideo(segment.prompt, {
            aspectRatio: '9:16',
            duration: 8,
            imageRotation: 'fixed',  // Usar SIEMPRE la misma imagen (primera del pool)
            imageIndex: 0            // Ana-001.jpeg
        });

        if (initResult.code !== 200 || !initResult.data?.taskId) {
            throw new Error(`Error iniciando segmento ${i + 1}: ${initResult.msg || 'Unknown error'}`);
        }

        const taskId = initResult.data.taskId;
        console.log(`   ✅ Video iniciado, taskId: ${taskId}`);

        // Esperar completar
        console.log(`   ⏳ Esperando completar video...`);
        const video = await veo3.waitForCompletion(taskId);

        console.log(`\n✅ Segmento ${i + 1} generado:`);
        console.log(`   Platform: ${video.platform || 'external'}`);
        console.log(`   URL: ${video.url || video.bunnyUrl || 'N/A'}`);
        console.log(`   Local: ${video.localPath || 'N/A'}`);
        console.log(`   Duración: ${video.duration}s`);
        console.log(`   Costo: $${video.cost}`);

        // Usar localPath si existe, sino intentar descargar de Bunny/URL
        if (video.localPath) {
            videoSegments.push(video.localPath);
        } else if (video.bunnyUrl) {
            // Descargar de Bunny a archivo local temporal
            const tempPath = `output/veo3/temp_segment_${i + 1}_${Date.now()}.mp4`;
            console.log(`   ⚠️ Descargando desde Bunny: ${video.bunnyUrl}`);

            const response = await require('axios').get(video.bunnyUrl, { responseType: 'stream' });
            const writer = require('fs').createWriteStream(tempPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`   ✅ Descargado a: ${tempPath}`);
            videoSegments.push(tempPath);
        } else if (video.url) {
            // Último recurso: descargar de URL original
            const tempPath = `output/veo3/temp_segment_${i + 1}_${Date.now()}.mp4`;
            console.log(`   ⚠️ Descargando desde URL original: ${video.url}`);

            const response = await require('axios').get(video.url, { responseType: 'stream' });
            const writer = require('fs').createWriteStream(tempPath);
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

    // Concatenar SIN cortinillas (transiciones frame-to-frame invisibles)
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔗 CONCATENANDO VIDEOS (frame-to-frame, sin cortinillas)');
    console.log(`${'='.repeat(80)}`);

    // Usar concat simple sin cortinillas
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const fs = require('fs').promises;
    const path = require('path');
    const execAsync = promisify(exec);

    // Crear lista de concat
    const timestamp = Date.now();
    const listFile = path.join('output/veo3', `concat-list-${timestamp}.txt`);
    let listContent = '';

    for (const videoPath of videoSegments) {
        listContent += `file '${path.resolve(videoPath)}'\n`;
    }

    await fs.writeFile(listFile, listContent);

    const outputPath = `output/veo3/aspas-chollo-${timestamp}.mp4`;
    const concatCmd = `ffmpeg -f concat -safe 0 -i "${listFile}" \
        -c:v libx264 -preset fast -crf 18 \
        -c:a aac -b:a 192k \
        -pix_fmt yuv420p \
        -y "${outputPath}"`;

    await execAsync(concatCmd);
    await fs.unlink(listFile);

    console.log(`\n✅ Videos concatenados: ${outputPath}`);

    // AGREGAR LOGO FINAL (3 segundos)
    console.log(`\n📸 Agregando logo final (3s)...`);

    const logoVideoPath = 'output/veo3/logo-static.mp4';
    const outputWithLogo = `output/veo3/aspas-chollo-with-logo-${timestamp}.mp4`;

    // Concatenar video principal + logo final
    const finalListFile = path.join('output/veo3', `final-list-${timestamp}.txt`);
    const finalListContent = `file '${path.resolve(outputPath)}'\nfile '${path.resolve(logoVideoPath)}'`;
    await fs.writeFile(finalListFile, finalListContent);

    const finalConcatCmd = `ffmpeg -f concat -safe 0 -i "${finalListFile}" \
        -c:v libx264 -preset fast -crf 18 \
        -c:a aac -b:a 192k \
        -pix_fmt yuv420p \
        -y "${outputWithLogo}"`;

    await execAsync(finalConcatCmd);

    // Limpiar archivos temporales
    await fs.unlink(finalListFile);
    await fs.unlink(logoPngPath);
    await fs.unlink(logoVideoPath);
    await fs.unlink(outputPath); // Eliminar versión sin logo

    const concatResult = {
        outputPath: outputWithLogo,
        segments: videoSegments.length,
        transitions: 'frame-to-frame (invisible)',
        totalDuration: `${videoSegments.length * 8 + 2.5}s (con logo final)`
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ COMPLETADO');
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Resultados finales:`);
    console.log(`   ✅ Video final: ${concatResult.outputPath}`);
    console.log(`   📏 Segmentos: ${concatResult.segments}`);
    console.log(`   🔗 Transiciones: ${concatResult.transitions}`);
    console.log(`   ⏱️  Duración total: ${concatResult.totalDuration}`);
    console.log(`   📸 Logo final: 2.5s estático`);
    console.log(`   🎨 Imagen Ana: FIJA (sin rotación - consistencia perfecta)`);
    console.log(`   💰 Costo total: $${(CONFIG.targetSegments * 0.30).toFixed(2)}`);
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
