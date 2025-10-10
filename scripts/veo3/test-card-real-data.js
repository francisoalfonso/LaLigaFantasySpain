#!/usr/bin/env node

/**
 * TEST: Tarjeta con datos reales del chollo
 * Datos sacados directamente del API endpoint que usa el dashboard
 */

require('dotenv').config();
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🎬 TEST: Tarjeta con datos REALES del chollo Carvajal\\n');

    try {
        // 1. Obtener chollos del servidor (mismo endpoint que usa el dashboard)
        console.log('📊 Obteniendo chollos desde http://localhost:3000/api/bargains/top...');
        const response = await axios.get('http://localhost:3000/api/bargains/top?limit=50');

        if (!response.data.success) {
            console.error('❌ Error obteniendo chollos');
            process.exit(1);
        }

        console.log(`✅ ${response.data.data.length} chollos obtenidos`);
        console.log(`   Caché usado: ${response.data.metadata?.cached ? 'SÍ' : 'NO'}\\n`);

        // Buscar Carvajal
        const carvajal = response.data.data.find(b =>
            b.name && b.name.toLowerCase().includes('carvajal')
        );

        if (!carvajal) {
            console.error('❌ Carvajal no encontrado en los chollos');
            process.exit(1);
        }

        // Formatear datos para la tarjeta
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

        console.log('✅ Datos REALES del chollo (temporada 2025-26):');
        console.log(`   Nombre: ${playerData.name}`);
        console.log(`   Equipo: ${playerData.team}`);
        console.log(`   Posición: ${playerData.position}`);
        console.log(`   Partidos: ${playerData.stats.games}`);
        console.log(`   Goles: ${playerData.stats.goals}`);
        console.log(`   Rating: ${playerData.stats.rating}\\n`);

        // 2. Generar tarjeta
        const playerCardOverlay = new PlayerCardOverlay();
        const cardImagePath = await playerCardOverlay.generateCardImage(playerData);
        console.log(`✅ Tarjeta generada: ${cardImagePath}\\n`);

        // 3. Buscar video de test
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

        console.log(`✅ Video encontrado: ${path.basename(testVideoPath)}\\n`);

        // 4. Aplicar overlay CON ANIMACIÓN SLIDE-IN
        console.log('⚙️  CONFIGURACIÓN DE ANIMACIÓN:');
        console.log('   - Posición final: INFERIOR IZQUIERDA (x=20, y=905) [+45px arriba total]');
        console.log('   - Video: 720x1280, Tarjeta: 320x100');
        console.log('   - Animación: SLIDE-IN desde izquierda');
        console.log('   - Aparece: Segundo 3.0');
        console.log('   - Desaparece: Segundo 6.0 (duración: 3s)');
        console.log('   - Fondo: 88% opacidad (12% transparente)');
        console.log('   - Border-radius: 10px\\n');

        const ffmpeg = require('fluent-ffmpeg');
        const outputPath = path.join(__dirname, '../../output/veo3/test-card-real-data.mp4');

        const startTime = 3.0;
        const duration = 3.0;
        const slideInDuration = 0.5;
        const finalX = 20;
        const finalY = 905;  // Ajustado +45px arriba total
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
                    console.log(`✅ Video generado: ${outputPath}\\n`);
                    console.log('🎬 Abriendo video...\\n');
                    const { exec } = require('child_process');
                    exec(`open "${outputPath}"`);
                    resolve();
                })
                .on('error', reject)
                .save(outputPath);
        });

        console.log('✅ TEST COMPLETADO');
        console.log('   ✓ Datos REALES desde servidor (mismo endpoint que dashboard)');
        console.log('   ✓ Tarjeta con foto real de Carvajal');
        console.log('   ✓ Slide-in desde izquierda en segundo 3');
        console.log('   ✓ Desaparece en segundo 6');
        console.log(`   ✓ Caché: ${response.data.metadata?.cached ? 'USADO (rápido)' : 'MISS (primera vez)'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
        process.exit(1);
    }
}

main().catch(console.error);
