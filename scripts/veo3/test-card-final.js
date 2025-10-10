#!/usr/bin/env node

/**
 * TEST FINAL: Tarjeta con animación y posición ajustada
 * Datos hardcoded para test rápido
 */

require('dotenv').config();
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🎬 TEST FINAL: Tarjeta con animación (posición y=950)\n');

    const playerCardOverlay = new PlayerCardOverlay();

    // Datos de ejemplo (simula lo que vendría del sistema de chollos)
    const playerData = {
        id: 276,  // Vinícius Jr
        name: 'Vinícius José Paixão',
        photo: null,
        stats: {
            games: 5,
            goals: 8,
            rating: '7.80'
        }
    };

    console.log('✅ Datos del jugador:');
    console.log(`   Nombre: ${playerData.name}`);
    console.log(`   Partidos: ${playerData.stats.games}`);
    console.log(`   Goles: ${playerData.stats.goals}`);
    console.log(`   Rating: ${playerData.stats.rating}\n`);

    // Generar tarjeta
    const cardImagePath = await playerCardOverlay.generateCardImage(playerData);
    console.log(`✅ Tarjeta generada: ${cardImagePath}\n`);

    // Buscar video de test
    const sessionsDir = path.join(__dirname, '../../output/veo3/sessions');
    let testVideoPath = null;

    if (fs.existsSync(sessionsDir)) {
        const sessions = fs.readdirSync(sessionsDir)
            .filter(name => name.startsWith('session_'))
            .sort()
            .reverse();

        for (const sessionName of sessions) {
            const sessionPath = path.join(sessionsDir, sessionName);
            const files = fs.readdirSync(sessionPath)
                .filter(f => f.endsWith('.mp4') && f.includes('segment'));

            if (files.length > 0) {
                testVideoPath = path.join(sessionPath, files[0]);
                break;
            }
        }
    }

    if (!testVideoPath) {
        console.error('❌ No se encontró video de test');
        process.exit(1);
    }

    console.log(`✅ Video encontrado: ${path.basename(testVideoPath)}\n`);

    // Aplicar overlay CON ANIMACIÓN SLIDE-IN
    console.log('⚙️  CONFIGURACIÓN DE ANIMACIÓN:');
    console.log('   - Posición final: y=950 (+100px arriba del original)');
    console.log('   - Video: 720x1280, Tarjeta: 320x100');
    console.log('   - Animación: SLIDE-IN desde izquierda');
    console.log('   - Aparece: Segundo 3.0');
    console.log('   - Desaparece: Segundo 6.0\n');

    const ffmpeg = require('fluent-ffmpeg');
    const outputPath = path.join(__dirname, '../../output/veo3/test-card-final.mp4');

    // Configuración
    const startTime = 3.0;
    const duration = 3.0;
    const slideInDuration = 0.5;
    const finalX = 20;
    const finalY = 950;  // AJUSTADO: +100px arriba
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
            .input(testVideoPath)
            .input(cardImagePath)
            .complexFilter([overlayFilter])
            .outputOptions([
                '-c:v libx264',
                '-preset fast',
                '-crf 23',
                '-c:a copy'
            ])
            .on('end', () => {
                console.log(`✅ Video generado: ${outputPath}\n`);
                console.log('🎬 Abriendo video...\n');
                const { exec } = require('child_process');
                exec(`open "${outputPath}"`);
                resolve();
            })
            .on('error', reject)
            .save(outputPath);
    });

    console.log('✅ TEST COMPLETADO');
    console.log('   Verifica que la tarjeta aparece en la posición correcta');
}

main().catch(console.error);
