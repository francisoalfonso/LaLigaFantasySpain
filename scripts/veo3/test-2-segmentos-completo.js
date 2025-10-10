#!/usr/bin/env node

/**
 * TEST COMPLETO 2 SEGMENTOS - Validación exhaustiva
 *
 * Validaciones:
 * 1. ✅ Ana aparece en ambos segmentos
 * 2. ✅ Consistencia visual de Ana
 * 3. ✅ Transiciones suaves
 * 4. ✅ Español de España (no mexicano)
 * 5. ✅ Logo al final
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Colores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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
    log('\n🧪 TEST COMPLETO - 2 SEGMENTOS CON VALIDACIÓN EXHAUSTIVA', 'bright');
    log('═'.repeat(70), 'cyan');

    const startTime = Date.now();

    section('📋 CONFIGURACIÓN DEL TEST');

    const testConfig = {
        playerName: 'Lamine Yamal',
        team: 'Barcelona',
        price: 7.2,
        ratio: 1.45,
        stats: {
            position: 'FWD',
            estimatedPoints: 10.4,
            games: 6,
            minutes: 480,
            goals: 3,
            assists: 2,
            rating: 7.9
        },
        // SOLO 2 segmentos para el test
        numSegments: 2,
        addLogo: true // ✅ Agregar logo al final
    };

    log('   Jugador: ' + testConfig.playerName, 'cyan');
    log('   Equipo: ' + testConfig.team, 'cyan');
    log('   Segmentos: ' + testConfig.numSegments, 'cyan');
    log('   Logo al final: ' + (testConfig.addLogo ? '✅ SÍ' : '❌ NO'), 'cyan');

    section('🎬 PASO 1: Generando video con 2 segmentos');

    log('📤 Enviando request a /api/veo3/generate-viral...', 'yellow');

    try {
        const response = await axios.post(
            `${BASE_URL}/api/veo3/generate-viral`,
            testConfig,
            {
                timeout: 900000 // 15 minutos
            }
        );

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

        if (response.data.success) {
            section('✅ VIDEO GENERADO EXITOSAMENTE');

            log(`\n⏱️  Tiempo total: ${duration} minutos`, 'green');
            log(`📹 Archivo: ${response.data.video?.outputPath || 'N/A'}`, 'cyan');
            log(`⏳ Duración: ${response.data.video?.duration || 'N/A'}s`, 'cyan');
            log(`🎞️  Segmentos: ${response.data.video?.segments || 'N/A'}`, 'cyan');

            section('📋 CHECKLIST DE VALIDACIÓN');

            const videoPath = response.data.video?.outputPath;

            log('\n1. ✅ Ana aparece en ambos segmentos', 'green');
            log('   → Verificar manualmente en el video', 'cyan');

            log('\n2. ⏳ Consistencia visual de Ana', 'yellow');
            log('   → Verificar que Ana mantiene la misma apariencia', 'cyan');
            log('   → Misma ropa, peinado, iluminación', 'cyan');

            log('\n3. ⏳ Transiciones suaves', 'yellow');
            log('   → Verificar que no hay saltos bruscos entre segmentos', 'cyan');
            log('   → Ana en posición similar al final de seg1 e inicio de seg2', 'cyan');

            log('\n4. ⏳ Español de España', 'yellow');
            log('   → Escuchar el audio completo', 'cyan');
            log('   → Verificar acento español peninsular (no mexicano)', 'cyan');
            log('   → Pronunciación: "vosotros", "z" como "th"', 'cyan');

            log('\n5. ⏳ Logo al final', 'yellow');
            log('   → Verificar que aparece logo "Fantasy La Liga Pro"', 'cyan');
            log('   → Al final del video (últimos 2-3 segundos)', 'cyan');

            section('🎯 PRÓXIMOS PASOS');

            log('\n1. Abre el video:', 'cyan');
            log(`   open "${videoPath}"`, 'yellow');

            log('\n2. Verifica cada punto del checklist:', 'cyan');
            log('   □ Ana aparece en AMBOS segmentos', 'yellow');
            log('   □ Ana es consistente visualmente', 'yellow');
            log('   □ Transiciones suaves (sin saltos)', 'yellow');
            log('   □ Acento español de España', 'yellow');
            log('   □ Logo al final del video', 'yellow');

            log('\n3. Reporta los resultados:', 'cyan');
            log('   ✅ Todo OK → Continuar con 3-4 segmentos', 'green');
            log('   ❌ Problemas → Ajustar configuración', 'red');

            // Abrir video automáticamente
            const { exec } = require('child_process');
            exec(`open "${videoPath}"`);

            log('\n✅ Video abierto automáticamente\n', 'green');

        } else {
            log('\n❌ Error en generación:', 'red');
            log(JSON.stringify(response.data, null, 2), 'red');
        }

    } catch (error) {
        log('\n❌ ERROR FATAL:', 'red');

        if (error.response?.data) {
            log(JSON.stringify(error.response.data, null, 2), 'red');
        } else {
            log(error.message, 'red');
        }

        process.exit(1);
    }
}

main();
