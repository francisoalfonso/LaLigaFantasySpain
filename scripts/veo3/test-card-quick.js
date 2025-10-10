#!/usr/bin/env node

/**
 * TEST RÁPIDO: Tarjeta con datos mock + animación completa
 * Para demostrar funcionamiento sin esperar análisis completo
 */

require('dotenv').config();
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const BargainsDataService = require('../../backend/services/bargainsDataService');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🎬 TEST: Tarjeta con datos REALES del sistema de chollos\n');

    const playerCardOverlay = new PlayerCardOverlay();
    const bargainsService = new BargainsDataService();

    // Obtener datos REALES del sistema de chollos
    console.log('📊 Obteniendo datos del chollo de Carvajal...');
    let playerData = await bargainsService.getBargainByPlayerName('Carvajal');

    if (!playerData) {
        console.log('⚠️  Carvajal no encontrado, usando top chollo disponible...');
        playerData = await bargainsService.getTopBargain();
    }

    if (!playerData) {
        console.error('❌ No se pudo obtener ningún chollo');
        process.exit(1);
    }

    console.log('\n✅ Datos REALES del chollo (temporada 2025-26):');
    console.log(`   Nombre: ${playerData.name}`);
    console.log(`   Equipo: ${playerData.team}`);
    console.log(`   Posición: ${playerData.position}`);
    console.log(`   Partidos: ${playerData.stats.games}`);
    console.log(`   Goles: ${playerData.stats.goals}`);
    console.log(`   Rating: ${playerData.stats.rating}\n`);

    // Generar tarjeta
    const cardImagePath = await playerCardOverlay.generateCardImage(playerData);
    console.log(`✅ Tarjeta generada: ${cardImagePath}\n`);

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

    console.log(`✅ Video encontrado: ${path.basename(testVideoPath)}\n`);

    // 3. Aplicar overlay CON ANIMACIÓN SLIDE-IN
    console.log('⚙️  CONFIGURACIÓN DE ANIMACIÓN:');
    console.log('   - Posición final: INFERIOR IZQUIERDA (x=20, y=950) [+100px arriba total]');
    console.log('   - Video: 720x1280, Tarjeta: 320x100');
    console.log('   - Animación: SLIDE-IN desde izquierda');
    console.log('   - Aparece: Segundo 3.0');
    console.log('   - Desaparece: Segundo 6.0 (duración: 3s)');
    console.log('   - Slide duration: 0.5s\n');

    const ffmpeg = require('fluent-ffmpeg');
    const outputPath = path.join(__dirname, '../../output/veo3/test-card-animated.mp4');

    // Configuración de animación
    const startTime = 3.0;
    const duration = 3.0;
    const slideInDuration = 0.5;
    const finalX = 20;
    const finalY = 950;  // Ajustado: +100px arriba total (era 1050)
    const initialX = -320;
    const cardWidth = 320;

    // Filtro FFmpeg con animación slide-in
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
    console.log('⚠️  Verifica:');
    console.log('   - Tarjeta con datos REALES de Carvajal');
    console.log('   - Foto real de Carvajal (local)');
    console.log('   - Slide-in desde izquierda en segundo 3');
    console.log('   - Desaparece en segundo 6');
}

main().catch(console.error);
