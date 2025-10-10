#!/usr/bin/env node

/**
 * Aplicar tarjeta del jugador al video Test #47 COMPLETO (con subtítulos)
 */

require('dotenv').config();
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🎬 Aplicando tarjeta a Test #47 (CON subtítulos virales)\n');

    try {
        // 1. Obtener datos del chollo desde servidor
        console.log('📊 Obteniendo datos del chollo de Carvajal...');
        const response = await axios.get('http://localhost:3000/api/bargains/top?limit=50');

        if (!response.data.success) {
            console.error('❌ Error obteniendo chollos');
            process.exit(1);
        }

        const carvajal = response.data.data.find(b =>
            b.name && b.name.toLowerCase().includes('carvajal')
        );

        if (!carvajal) {
            console.error('❌ Carvajal no encontrado');
            process.exit(1);
        }

        const playerData = {
            id: carvajal.id,
            name: carvajal.name,
            photo: carvajal.photo,
            team: carvajal.team?.name || 'Unknown',
            teamLogo: carvajal.team?.logo || null,
            position: carvajal.position,
            stats: {
                games: carvajal.stats?.games || 0,
                goals: carvajal.stats?.goals || 0,
                rating: carvajal.stats?.rating || '0.00'
            }
        };

        console.log('✅ Datos del chollo (temporada 2025-26):');
        console.log(`   ${playerData.name} - ${playerData.team}`);
        console.log(`   ${playerData.stats.games}J | ${playerData.stats.goals}G | ${playerData.stats.rating}R\n`);

        // 2. Generar tarjeta
        const playerCardOverlay = new PlayerCardOverlay();
        const cardImagePath = await playerCardOverlay.generateCardImage(playerData);
        console.log(`✅ Tarjeta generada: ${cardImagePath}\n`);

        // 3. Video base: Test #47 COMPLETO con subtítulos
        const baseVideoPath = path.join(__dirname, '../../output/veo3/ana-test47-with-captions.mp4');

        if (!fs.existsSync(baseVideoPath)) {
            console.error('❌ Video Test #47 no encontrado:', baseVideoPath);
            process.exit(1);
        }

        console.log(`✅ Video base (CON subtítulos): ${path.basename(baseVideoPath)}\n`);

        // 4. Aplicar overlay de tarjeta
        console.log('⚙️  CONFIGURACIÓN:');
        console.log('   - Video base: Test #47 CON subtítulos virales');
        console.log('   - Tarjeta: Aparece segundo 3-6');
        console.log('   - Posición: x=20, y=905');
        console.log('   - Animación: Slide-in desde izquierda\n');

        const ffmpeg = require('fluent-ffmpeg');
        const outputPath = path.join(__dirname, '../../output/veo3/test47-final-with-card-and-captions.mp4');

        const startTime = 3.0;
        const duration = 3.0;
        const slideInDuration = 0.5;
        const finalX = 20;
        const finalY = 905;
        const initialX = -320;
        const cardWidth = 320;

        const overlayFilter = `[0:v][1:v]overlay=` +
            `x='if(between(t,${startTime},${startTime + slideInDuration}),` +
            `${initialX}+((${finalX}-${initialX})*((t-${startTime})/${slideInDuration})),` +
            `if(between(t,${startTime + slideInDuration},${startTime + duration}),${finalX},-${cardWidth}))':` +
            `y=${finalY}:` +
            `enable='between(t,${startTime},${startTime + duration})'`;

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(baseVideoPath)
                .input(cardImagePath)
                .complexFilter([overlayFilter])
                .outputOptions([
                    '-c:v libx264',
                    '-preset fast',
                    '-crf 23',
                    '-c:a copy'
                ])
                .on('end', () => {
                    console.log(`✅ Video final generado: ${outputPath}\n`);
                    console.log('🎬 Abriendo video...\n');
                    const { exec } = require('child_process');
                    exec(`open "${outputPath}"`);
                    resolve();
                })
                .on('error', reject)
                .save(outputPath);
        });

        console.log('✅ COMPLETADO');
        console.log('   ✓ Subtítulos virales: TODO el video');
        console.log('   ✓ Tarjeta jugador: Segundo 3-6');
        console.log('   ✓ Ambos elementos visibles simultáneamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
