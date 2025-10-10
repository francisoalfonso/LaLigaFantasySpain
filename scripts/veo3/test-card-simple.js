#!/usr/bin/env node

/**
 * TEST SIMPLE: Tarjeta visible todo el tiempo en centro
 * Para verificar que el overlay FFmpeg funciona
 */

require('dotenv').config();
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const BargainAnalyzer = require('../../backend/services/bargainAnalyzer');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🎬 TEST: Tarjeta con datos REALES del sistema de chollos + animación slide-in');

    const playerCardOverlay = new PlayerCardOverlay();
    const bargainAnalyzer = new BargainAnalyzer();

    // 1. Obtener chollos (Carvajal debería estar ahí)
    console.log('\n📊 Obteniendo chollos actuales...');
    const bargains = await bargainAnalyzer.identifyBargains(20);

    // Buscar Carvajal
    const carvajal = bargains.find(b => b.player && b.player.name && b.player.name.toLowerCase().includes('carvajal'));

    if (!carvajal) {
        console.error('\n❌ Carvajal no encontrado en chollos. Usando primer chollo disponible...');
        const firstBargain = bargains[0];
        var playerData = {
            id: firstBargain.player.id,
            name: firstBargain.player.name,
            photo: firstBargain.player.photo,
            stats: {
                games: firstBargain.player.stats.games.appearences || 0,
                goals: firstBargain.player.stats.goals.total || 0,
                rating: firstBargain.player.stats.games.rating || '0.00'
            }
        };
    } else {
        var playerData = {
            id: carvajal.player.id,
            name: carvajal.player.name,
            photo: carvajal.player.photo,
            stats: {
                games: carvajal.player.stats.games.appearences || 0,
                goals: carvajal.player.stats.goals.total || 0,
                rating: carvajal.player.stats.games.rating || '0.00'
            }
        };
    }

    console.log(`\n✅ Datos obtenidos del chollo:`);
    console.log(`   Nombre: ${playerData.name}`);
    console.log(`   Partidos: ${playerData.stats.games}`);
    console.log(`   Goles: ${playerData.stats.goals}`);
    console.log(`   Rating: ${playerData.stats.rating}\n`);

    const cardImagePath = await playerCardOverlay.generateCardImage(playerData);
    console.log(`✅ Tarjeta generada: ${cardImagePath}`);

    // 2. Buscar video de test
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

    console.log(`✅ Video encontrado: ${path.basename(testVideoPath)}`);

    // 3. Aplicar overlay CON ANIMACIÓN SLIDE-IN
    console.log('\n⚠️  CONFIGURACIÓN DE ANIMACIÓN:');
    console.log('   - Posición final: INFERIOR IZQUIERDA (x=20, y=1050)');
    console.log('   - Video: 720x1280, Tarjeta: 320x100');
    console.log('   - Animación: SLIDE-IN desde izquierda');
    console.log('   - Aparece: Segundo 3.0');
    console.log('   - Desaparece: Segundo 6.0 (duración: 3s)');
    console.log('   - Slide duration: 0.5s\n');

    const ffmpeg = require('fluent-ffmpeg');
    const outputPath = path.join(__dirname, '../../output/veo3/test-card-visible.mp4');

    // Configuración de animación
    const startTime = 3.0;           // Aparece en segundo 3
    const duration = 3.0;            // Visible durante 3 segundos (hasta segundo 6)
    const slideInDuration = 0.5;     // Slide-in dura 0.5s
    const finalX = 20;               // Posición final X
    const finalY = 1050;             // Posición final Y
    const initialX = -320;           // Fuera de pantalla (ancho de la tarjeta)
    const cardWidth = 320;

    // Filtro FFmpeg con animación slide-in
    const overlayFilter = `[0:v][1:v]overlay=` +
        // Animación X: slide-in de -320 a 20 durante primeros 0.5s, luego fijo en 20
        `x='if(between(t,${startTime},${startTime + slideInDuration}),` +
        `${initialX}+((${finalX}-${initialX})*((t-${startTime})/${slideInDuration})),` +
        `if(between(t,${startTime + slideInDuration},${startTime + duration}),${finalX},-${cardWidth}))':` +
        // Y siempre fijo
        `y=${finalY}:` +
        // Visible solo entre startTime y startTime+duration
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
                console.log(`✅ Video generado: ${outputPath}`);
                console.log('\n🎬 Abriendo video...');
                const { exec } = require('child_process');
                exec(`open "${outputPath}"`);
                resolve();
            })
            .on('error', reject)
            .save(outputPath);
    });

    console.log('\n✅ TEST COMPLETADO');
    console.log('⚠️  Si NO ves la tarjeta en el centro del video, hay un problema con FFmpeg overlay');
}

main().catch(console.error);
