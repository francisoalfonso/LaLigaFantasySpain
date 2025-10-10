#!/usr/bin/env node

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { exec } = require('child_process');

const baseVideo = path.join(__dirname, '../../output/veo3/ana-test47-with-captions.mp4');
const cardImage = path.join(__dirname, '../../temp/veo3/player-card-dani-carvajal-1759749137409.png');
const outputVideo = path.join(__dirname, '../../output/veo3/test-card-real-data.mp4');

console.log('🎬 Aplicando tarjeta a Test #47 CON subtítulos...\n');

const startTime = 3.0;
const duration = 3.0;
const slideInDuration = 0.5;
const finalX = 0;    // Pegado al borde izquierdo
const finalY = 870;  // +20px más arriba (870 en vez de 890)
const initialX = -320;
const cardWidth = 320;

const overlayFilter = `[0:v][1:v]overlay=` +
    `x='if(between(t,${startTime},${startTime + slideInDuration}),` +
    `${initialX}+((${finalX}-${initialX})*((t-${startTime})/${slideInDuration})),` +
    `if(between(t,${startTime + slideInDuration},${startTime + duration}),${finalX},-${cardWidth}))':` +
    `y=${finalY}:` +
    `enable='between(t,${startTime},${startTime + duration})'`;

ffmpeg()
    .input(baseVideo)
    .input(cardImage)
    .complexFilter([overlayFilter])
    .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a copy'
    ])
    .on('end', () => {
        console.log(`✅ Video generado: ${outputVideo}\n`);
        console.log('🎬 Abriendo...\n');
        exec(`open "${outputVideo}"`);
    })
    .on('error', (err) => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    })
    .save(outputVideo);
