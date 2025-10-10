#!/usr/bin/env node

/**
 * TEST: Concatenar los 3 videos generados + Logo outro
 *
 * Usa los 3 videos de la sesión anterior y los concatena
 * con freeze frame + logo outro automático
 */

require('dotenv').config();

const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function main() {
    const startTime = Date.now();

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(78)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(
        `${colors.bright}${colors.blue}║  🔗 TEST: Concatenar Videos VEO3 + Logo Outro${' '.repeat(32)}║${colors.reset}`
    );
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(78)}╝${colors.reset}\n`);

    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);

    try {
        // Buscar la sesión más reciente
        const sessionsDir = path.join(process.cwd(), 'output', 'veo3', 'sessions');
        const sessions = fs
            .readdirSync(sessionsDir)
            .filter(dir => dir.startsWith('veo3_nano_'))
            .sort()
            .reverse();

        if (sessions.length === 0) {
            throw new Error('No se encontraron sesiones veo3_nano_* con videos');
        }

        const latestSession = sessions[0];
        const sessionDir = path.join(sessionsDir, latestSession);

        log('📂', `Usando sesión: ${latestSession}`, colors.cyan);

        // Buscar los 3 videos
        const videos = fs
            .readdirSync(sessionDir)
            .filter(file => file.endsWith('.mp4'))
            .sort();

        if (videos.length < 3) {
            throw new Error(`Solo se encontraron ${videos.length} videos. Se necesitan 3.`);
        }

        log('📹', `Videos encontrados: ${videos.length}`, colors.green);
        videos.forEach((video, idx) => {
            console.log(`   ${idx + 1}. ${video}`);
        });

        const videoPaths = videos.slice(0, 3).map(v => path.join(sessionDir, v));

        log('', '', colors.reset);
        log('🔗', 'Concatenando 3 videos + freeze frame + logo outro...', colors.yellow);

        const concatenator = new VideoConcatenator();

        const concatenatedPath = await concatenator.concatenateVideos(videoPaths, {
            outro: {
                enabled: true, // ✅ Agregar logo outro
                freezeFrame: {
                    enabled: true,
                    duration: 0.8
                }
            },
            viralCaptions: {
                enabled: false // Sin subtítulos por ahora
            }
        });

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        log('✅', `Concatenación completada en ${totalDuration}s`, colors.green);
        log('📹', `Video final: ${concatenatedPath}`, colors.green);

        // Obtener info del video final
        const stats = fs.statSync(concatenatedPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log(`\n${colors.cyan}📊 RESULTADO:${colors.reset}`);
        console.log(`   • Videos concatenados: 3`);
        console.log(`   • Freeze frame: ✅ 0.8s`);
        console.log(`   • Logo outro: ✅ Incluido`);
        console.log(`   • Tamaño final: ${sizeMB} MB`);
        console.log(`   • Tiempo total: ${totalDuration}s`);
        console.log(`   • Ubicación: ${concatenatedPath}`);

        console.log(`\n${colors.green}✅ TEST COMPLETADO EXITOSAMENTE${colors.reset}\n`);
    } catch (error) {
        console.error(`\n${colors.red}❌ ERROR:${colors.reset}`);
        console.error(`   ${error.message}`);

        if (error.stack) {
            console.error(`\n${colors.red}Stack trace:${colors.reset}`);
            console.error(error.stack);
        }

        process.exit(1);
    }
}

main();
