#!/usr/bin/env node

/**
 * TEST CRÍTICO: VEO3 Text-to-Video (SIN imagen) para verificar audio
 *
 * Prueba si VEO3 genera audio cuando NO usamos imagen de referencia.
 * Comparación: Text-to-Video vs Image-to-Video
 */

require('dotenv').config();

const VEO3Client = require('../../backend/services/veo3/veo3Client');
const path = require('path');
const fs = require('fs');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function main() {
    console.log(`\n${colors.blue}╔${'═'.repeat(70)}╗${colors.reset}`);
    console.log(
        `${colors.blue}║  🧪 TEST: VEO3 Text-to-Video (Audio Check)${' '.repeat(28)}║${colors.reset}`
    );
    console.log(`${colors.blue}╚${'═'.repeat(70)}╝${colors.reset}\n`);

    try {
        const veo3Client = new VEO3Client();
        const sessionId = `audio_test_${Date.now()}`;
        const sessionDir = path.join(process.cwd(), 'output', 'veo3', 'sessions', sessionId);

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Prompt simple con diálogo
        const prompt = `A 32-year-old Spanish sports analyst with short black curly hair in a professional ponytail speaks in Spanish from Spain: "¡Tengo un chollo brutal para la próxima jornada!". She is wearing a navy blue blazer in a modern studio setting.`;

        log('🎬', 'Generando video SIN imagen de referencia (text-to-video)...', colors.yellow);
        log('📝', `Prompt: "${prompt.substring(0, 80)}..."`, colors.cyan);
        log('⏱️ ', 'Tiempo estimado: 2-3 minutos', colors.yellow);

        // Generar SIN imageUrl (text-to-video puro)
        const initResult = await veo3Client.generateVideo(prompt, {
            model: 'veo3_fast',
            aspectRatio: '9:16'
            // ❌ NO imageUrl - text-to-video puro
        });

        if (initResult.code !== 200 || !initResult.data?.taskId) {
            throw new Error(`Error iniciando: ${initResult.msg || 'Unknown error'}`);
        }

        const taskId = initResult.data.taskId;
        log('📋', `Task ID: ${taskId}`, colors.cyan);
        log('⏳', 'Esperando completar...', colors.yellow);

        // Esperar 15s antes de empezar a comprobar
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Esperar completar
        const videoResult = await veo3Client.waitForCompletion(taskId, 300000, prompt);

        // Descargar
        const videoPath = path.join(sessionDir, 'text-to-video-audio-test.mp4');
        await veo3Client.downloadVideo(videoResult.url, videoPath);

        log('✅', `Video descargado: ${videoPath}`, colors.green);

        // Analizar streams con ffprobe
        log('', '', colors.reset);
        log('🔍', 'Analizando streams del video...', colors.cyan);

        const { execSync } = require('child_process');
        const ffprobeOutput = execSync(
            `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`,
            { encoding: 'utf-8' }
        );

        const streams = JSON.parse(ffprobeOutput).streams;
        const hasVideo = streams.some(s => s.codec_type === 'video');
        const hasAudio = streams.some(s => s.codec_type === 'audio');

        console.log(`\n${colors.cyan}📊 RESULTADO DEL TEST:${colors.reset}`);
        console.log(`   • Video stream: ${hasVideo ? '✅' : '❌'}`);
        console.log(`   • Audio stream: ${hasAudio ? '✅' : '❌'}`);
        console.log(`   • Total streams: ${streams.length}`);
        console.log(`   • Duración: ${streams[0].duration}s`);
        console.log(`   • Ubicación: ${videoPath}`);

        if (hasAudio) {
            const audioStream = streams.find(s => s.codec_type === 'audio');
            console.log(`\n${colors.green}✅ AUDIO DETECTADO:${colors.reset}`);
            console.log(`   • Codec: ${audioStream.codec_name}`);
            console.log(`   • Sample rate: ${audioStream.sample_rate} Hz`);
            console.log(`   • Channels: ${audioStream.channels}`);
        } else {
            console.log(`\n${colors.red}❌ NO HAY AUDIO${colors.reset}`);
            console.log(`   • VEO3 generó video sin stream de audio`);
        }

        console.log(`\n${colors.cyan}💡 CONCLUSIÓN:${colors.reset}`);
        if (hasAudio) {
            console.log(`   Text-to-Video ${colors.green}SÍ genera audio${colors.reset}`);
            console.log(`   → El problema está en Image-to-Video con Nano Banana`);
        } else {
            console.log(`   Text-to-Video ${colors.red}TAMPOCO genera audio${colors.reset}`);
            console.log(`   → Problema general de VEO3 o KIE.ai API`);
        }

        console.log('');
    } catch (error) {
        console.error(`\n${colors.red}❌ ERROR:${colors.reset}`);
        console.error(`   ${error.message}`);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }

        if (error.stack) {
            console.error(`\n${colors.red}Stack:${colors.reset}`);
            console.error(error.stack);
        }

        process.exit(1);
    }
}

main();
