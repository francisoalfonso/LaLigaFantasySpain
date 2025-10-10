#!/usr/bin/env node

/**
 * TEST: Player Card Overlay
 *
 * Valida el sistema de tarjetas de jugador superpuestas en videos
 * Genera tarjeta con animación slide-in desde la izquierda
 *
 * Ejecutar: node scripts/veo3/test-player-card-overlay.js
 */

require('dotenv').config();
const PlayerCardOverlay = require('../../backend/services/veo3/playerCardOverlay');
const path = require('path');
const fs = require('fs');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    log('\n' + '═'.repeat(70), 'cyan');
    log(`  ${title}`, 'bright');
    log('═'.repeat(70), 'cyan');
}

async function main() {
    log('\n🃏 TEST: PLAYER CARD OVERLAY', 'bright');
    log('═'.repeat(70), 'cyan');

    section('📋 PASO 1: Datos del Jugador (ejemplo: Dani Carvajal)');

    const playerData = {
        name: 'Dani Carvajal',
        stats: {
            games: 6,
            goals: 1,
            rating: '7.12'
        },
        photo: null // Usaremos placeholder por ahora
    };

    log('   Nombre: ' + playerData.name, 'cyan');
    log('   Partidos: ' + playerData.stats.games, 'cyan');
    log('   Goles: ' + playerData.stats.goals, 'cyan');
    log('   Rating: ' + playerData.stats.rating, 'cyan');

    section('📋 PASO 2: Generar Imagen de Tarjeta');

    const playerCardOverlay = new PlayerCardOverlay();

    let cardImagePath;
    try {
        cardImagePath = await playerCardOverlay.generateCardImage(playerData);
        log(`✅ Tarjeta generada: ${cardImagePath}`, 'green');
    } catch (error) {
        log(`❌ Error generando tarjeta: ${error.message}`, 'red');
        process.exit(1);
    }

    section('📋 PASO 3: Buscar Video de Test');

    // Buscar un video de test existente en output/veo3/sessions
    const sessionsDir = path.join(__dirname, '../../output/veo3/sessions');
    let testVideoPath = null;

    if (fs.existsSync(sessionsDir)) {
        const sessions = fs.readdirSync(sessionsDir)
            .filter(name => name.startsWith('session_'))
            .sort()
            .reverse(); // Más reciente primero

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
        log('⚠️  No se encontró video de test en output/veo3/sessions/', 'yellow');
        log('   Creando video de test placeholder...', 'yellow');

        // OPCIÓN: Podríamos crear un video de test con FFmpeg
        // Por ahora, indicamos al usuario que ejecute primero un test de VEO3
        log('', 'reset');
        log('❌ ERROR: No hay videos de test disponibles', 'red');
        log('', 'reset');
        log('Para probar el overlay de tarjeta:', 'cyan');
        log('   1. Ejecuta primero: node scripts/veo3/test-restaurado-2seg-14s.js', 'yellow');
        log('   2. Luego ejecuta este script de nuevo', 'yellow');
        log('', 'reset');
        process.exit(1);
    }

    log(`✅ Video de test encontrado: ${path.basename(testVideoPath)}`, 'green');
    log(`   Ruta completa: ${testVideoPath}`, 'cyan');

    section('📋 PASO 4: Aplicar Overlay de Tarjeta');

    log('⚠️  CONFIGURACIÓN DEL OVERLAY:', 'yellow');
    log('   - Posición: Inferior izquierda (20px, 1650px)', 'cyan');
    log('   - Animación: Slide-in desde izquierda', 'cyan');
    log('   - Inicio: Segundo 3.0', 'cyan');
    log('   - Duración: 4.0 segundos (visible hasta segundo 7)', 'cyan');
    log('   - Slide-in: 0.5 segundos', 'cyan');
    log('', 'reset');

    try {
        const videoWithCard = await playerCardOverlay.applyCardOverlay(
            testVideoPath,
            cardImagePath,
            {
                startTime: 3.0,
                duration: 4.0,
                slideInDuration: 0.5,
                cleanup: false // Mantener imagen para inspección
            }
        );

        section('✅ TEST COMPLETADO');

        log('', 'reset');
        log('📹 Video con tarjeta:', 'green');
        log(`   ${videoWithCard}`, 'yellow');
        log('', 'reset');
        log('🖼️  Imagen de tarjeta:', 'green');
        log(`   ${cardImagePath}`, 'yellow');
        log('', 'reset');
        log('🎬 Abrir video:', 'cyan');
        log(`   open "${videoWithCard}"`, 'yellow');
        log('', 'reset');

        // Abrir video automáticamente
        const { exec } = require('child_process');
        exec(`open "${videoWithCard}"`);
        log('✅ Video abierto automáticamente\n', 'green');

        section('📊 VALIDACIÓN');

        log('', 'reset');
        log('Verifica en el video:', 'cyan');
        log('   □ Tarjeta aparece en segundo 3', 'yellow');
        log('   □ Animación slide-in desde izquierda (0.5s)', 'yellow');
        log('   □ Tarjeta visible hasta segundo 7', 'yellow');
        log('   □ Posición: Inferior izquierda', 'yellow');
        log('   □ Datos correctos: Dani Carvajal, 6 Partidos, 1 Goles, 7.12 Rating', 'yellow');
        log('   □ Foto del jugador (o placeholder)', 'yellow');
        log('', 'reset');

    } catch (error) {
        log(`❌ Error aplicando overlay: ${error.message}`, 'red');
        log(error.stack, 'red');
        process.exit(1);
    }
}

main().catch(error => {
    log('\n❌ ERROR FATAL:', 'red');
    log(error.message, 'red');
    log(error.stack, 'red');
    process.exit(1);
});
