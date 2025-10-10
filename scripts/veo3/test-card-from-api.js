#!/usr/bin/env node

/**
 * TEST: Tarjeta usando endpoint del servidor (usa caché compartido)
 * Este script usa el servidor real, aprovechando el caché ya existente
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

// Configuración
const SERVER_URL = 'http://localhost:3000';
const PLAYER_NAME = 'Carvajal';  // Buscar por nombre

async function main() {
    console.log('🎬 TEST: Tarjeta desde API del servidor (usa caché compartido)\n');

    try {
        // 1. Obtener chollos del servidor (usa caché!)
        console.log(`📊 Obteniendo chollos desde ${SERVER_URL}/api/bargains/top...`);
        const bargainsResponse = await axios.get(`${SERVER_URL}/api/bargains/top?limit=50`);

        if (!bargainsResponse.data.success) {
            console.error('❌ Error obteniendo chollos:', bargainsResponse.data.error);
            process.exit(1);
        }

        // Buscar jugador por nombre
        const bargain = bargainsResponse.data.data.find(b =>
            b.name && b.name.toLowerCase().includes(PLAYER_NAME.toLowerCase())
        );

        if (!bargain) {
            console.error(`❌ Jugador no encontrado: ${PLAYER_NAME}`);
            console.log(`   Chollos disponibles: ${bargainsResponse.data.data.map(b => b.name).join(', ')}`);
            process.exit(1);
        }

        // Formatear datos
        const playerData = {
            id: bargain.id,
            name: bargain.name,
            photo: bargain.photo,
            team: bargain.team?.name || 'Unknown',
            position: bargain.position,
            stats: {
                games: bargain.stats?.games || 0,
                goals: bargain.stats?.goals || 0,
                rating: bargain.stats?.rating || '0.00'
            }
        };

        console.log('\n✅ Datos del chollo:');
        console.log(`   Nombre: ${playerData.name}`);
        console.log(`   Equipo: ${playerData.team}`);
        console.log(`   Partidos: ${playerData.stats.games}`);
        console.log(`   Goles: ${playerData.stats.goals}`);
        console.log(`   Rating: ${playerData.stats.rating}\n`);

        // 2. Generar tarjeta usando servicio del servidor
        console.log('🎨 Generando tarjeta...');
        const cardResponse = await axios.post(`${SERVER_URL}/api/veo3/generate-player-card`, {
            playerData
        });

        if (!cardResponse.data.success) {
            console.error('❌ Error generando tarjeta:', cardResponse.data.error);
            process.exit(1);
        }

        const cardImagePath = cardResponse.data.cardPath;
        console.log(`✅ Tarjeta generada: ${cardImagePath}\n`);

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

        console.log(`✅ Video encontrado: ${path.basename(testVideoPath)}\n`);

        // 4. Aplicar overlay
        console.log('⚙️  CONFIGURACIÓN DE ANIMACIÓN:');
        console.log('   - Posición final: y=950');
        console.log('   - Video: 720x1280, Tarjeta: 320x100');
        console.log('   - Animación: SLIDE-IN desde izquierda');
        console.log('   - Aparece: Segundo 3.0');
        console.log('   - Desaparece: Segundo 6.0\\n');

        const outputPath = path.join(__dirname, '../../output/veo3/test-card-from-api.mp4');

        const startTime = 3.0;
        const duration = 3.0;
        const slideInDuration = 0.5;
        const finalX = 20;
        const finalY = 950;
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
                    exec(`open "${outputPath}"`);
                    resolve();
                })
                .on('error', reject)
                .save(outputPath);
        });

        console.log('✅ TEST COMPLETADO');
        console.log('   Datos: REALES desde caché del servidor');
        console.log('   Tarjeta: Generada con foto local');
        console.log('   Animación: Slide-in desde izquierda');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
        process.exit(1);
    }
}

main();
