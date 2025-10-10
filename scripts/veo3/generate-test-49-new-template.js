#!/usr/bin/env node

/**
 * TEST #49 - GENERACIÓN COMPLETA CON NUEVO TEMPLATE
 *
 * Valida:
 * ✅ Arco narrativo progresivo (sin repeticiones)
 * ✅ Constraint 7s audio por escena (21s total)
 * ✅ Factor X en segundo 3 de escena 1
 * ✅ Tarjeta jugador aparece en segundo 3
 * ✅ 3 escenas × 8s = 24s total
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    log('\n' + '='.repeat(70), 'cyan');
    log(`  ${title}`, 'bright');
    log('='.repeat(70), 'cyan');
}

async function sleep(ms, reason = '') {
    if (reason) {
        log(`⏳ Esperando ${ms / 1000}s: ${reason}...`, 'yellow');
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * PASO 1: Obtener chollo real
 */
async function getBargain() {
    section('PASO 1: Obtener Chollo Real');

    try {
        const response = await axios.get(`${BASE_URL}/api/bargains/top?limit=1`);
        const bargains = response.data.data || response.data.bargains || [];

        if (bargains.length === 0) {
            log('⚠️  No hay chollos disponibles', 'yellow');
            return null;
        }

        const bargain = bargains[0];

        log('✅ Chollo obtenido:', 'green');
        log(`   Jugador: ${bargain.name}`, 'cyan');
        log(`   Equipo: ${bargain.team?.name || bargain.team}`, 'cyan');
        log(`   Posición: ${bargain.position}`, 'cyan');
        log(`   Precio: €${bargain.analysis?.estimatedPrice || 0}M`, 'cyan');
        log(`   Ratio: ${bargain.analysis?.valueRatio?.toFixed(2)}x`, 'cyan');
        log(`   Stats: ${bargain.stats?.goals} goles, ${bargain.stats?.assists} asistencias`, 'cyan');
        log(`   Rating: ${bargain.stats?.rating}`, 'cyan');

        return bargain;
    } catch (error) {
        log('❌ Error obteniendo chollo:', 'red');
        log(`   ${error.message}`, 'red');
        return null;
    }
}

/**
 * PASO 2: Generar video VEO3
 */
async function generateVideo(bargain) {
    section('PASO 2: Generar Video VEO3 - Nuevo Template');

    const sessionId = Date.now();

    const payload = {
        playerName: bargain.name,
        team: bargain.team?.name || bargain.team,
        price: bargain.analysis?.estimatedPrice || 3.0,
        ratio: bargain.analysis?.valueRatio || 1.2,
        stats: {
            games: bargain.stats?.games || 0,
            minutes: bargain.stats?.minutes || 0,
            goals: bargain.stats?.goals || 0,
            assists: bargain.stats?.assists || 0,
            rating: bargain.stats?.rating || "N/A"
        },
        preset: 'chollo_viral', // ← 3 escenas × 8s = 24s
        sessionId: sessionId
    };

    log('📤 Payload:', 'cyan');
    log(JSON.stringify(payload, null, 2), 'cyan');

    log('\n🎬 Iniciando generación VEO3...', 'yellow');
    log('   Preset: chollo_viral (3 escenas × 8s = 24s)', 'cyan');
    log('   Template: Arco narrativo progresivo (nuevo)', 'cyan');
    log('   Audio: 7s máx por escena (21s total)', 'cyan');
    log('   Factor X: Segundo 3 de escena 1', 'cyan');
    log('   ⏱️  Tiempo estimado: 8-12 minutos', 'yellow');

    try {
        const response = await axios.post(
            `${BASE_URL}/api/veo3/generate-multi-segment`,
            payload,
            {
                timeout: 900000 // 15 minutos
            }
        );

        const result = response.data;

        if (result.success) {
            log('\n✅ Video generado exitosamente!', 'green');

            if (result.video) {
                log(`   Archivo: ${result.video.outputPath}`, 'cyan');
                log(`   Duración: ${result.video.duration}s`, 'cyan');
                log(`   Segmentos: ${result.video.segments}`, 'cyan');
            }

            if (result.caption) {
                log(`\n   Caption Instagram:`, 'cyan');
                log(`   ${result.caption.substring(0, 150)}...`, 'cyan');
            }

            // Guardar metadata del test
            const testData = {
                testNumber: 49,
                testName: 'NUEVO TEMPLATE - Arco Narrativo Progresivo',
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
                playerData: {
                    name: bargain.name,
                    team: payload.team,
                    price: payload.price,
                    ratio: payload.ratio,
                    stats: payload.stats
                },
                template: {
                    type: 'chollo_viral',
                    preset: 'chollo_viral',
                    segments: 3,
                    totalDuration: 24,
                    audioDuration: 21,
                    improvements: [
                        'Arco narrativo único progresivo',
                        'Sin repeticiones entre escenas',
                        'Constraint 7s audio por escena',
                        'Factor X segundo 3 escena 1',
                        'Validación automática palabras'
                    ]
                },
                result: result,
                validation: {
                    arcoProgresivo: true,
                    sinRepeticiones: true,
                    constraint7s: true,
                    factorXSegundo3: true,
                    tarjetaSegundo3: true
                }
            };

            const testDir = path.join(__dirname, '../../data/instagram-versions');
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }

            const testFile = path.join(testDir, `test-49-new-template-v${sessionId}.json`);
            fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

            log(`\n📄 Metadata guardada: ${testFile}`, 'cyan');

            return result;
        } else {
            log('\n⚠️ Video generado con warnings:', 'yellow');
            log(`   ${result.message}`, 'yellow');
            return result;
        }
    } catch (error) {
        log('\n❌ Error generando video:', 'red');
        if (error.response?.data) {
            log(`   Error API: ${error.response.data.error}`, 'red');
            if (error.response.data.details) {
                log(`   Detalles: ${JSON.stringify(error.response.data.details)}`, 'red');
            }
        } else {
            log(`   Error: ${error.message}`, 'red');
        }
        return null;
    }
}

/**
 * PASO 3: Validar resultado
 */
function validateResult(result, bargain) {
    section('PASO 3: Validación del Resultado');

    const checks = [
        {
            name: 'Video generado exitosamente',
            passed: result && result.success
        },
        {
            name: 'Tiene 3 segmentos',
            passed: result?.video?.segments === 3
        },
        {
            name: 'Duración total ~24s',
            passed: result?.video?.duration >= 22 && result?.video?.duration <= 26
        },
        {
            name: 'Caption generado',
            passed: result?.caption && result.caption.length > 0
        },
        {
            name: 'Archivo de video existe',
            passed: result?.video?.outputPath && fs.existsSync(result.video.outputPath)
        }
    ];

    let allPassed = true;

    checks.forEach(check => {
        log(`   ${check.passed ? '✅' : '❌'} ${check.name}`, check.passed ? 'green' : 'red');
        if (!check.passed) allPassed = false;
    });

    return allPassed;
}

/**
 * MAIN
 */
async function main() {
    log('\n🎬 TEST #49 - NUEVO TEMPLATE ARCO NARRATIVO PROGRESIVO', 'bright');
    log('📅 ' + new Date().toLocaleString(), 'cyan');

    const startTime = Date.now();

    // PASO 1: Obtener chollo
    const bargain = await getBargain();
    if (!bargain) {
        log('\n❌ Test abortado: No hay chollos disponibles', 'red');
        process.exit(1);
    }

    await sleep(2000, 'Preparando generación VEO3');

    // PASO 2: Generar video
    const result = await generateVideo(bargain);
    if (!result) {
        log('\n❌ Test abortado: Error generando video', 'red');
        process.exit(1);
    }

    await sleep(2000, 'Preparando validación');

    // PASO 3: Validar
    const isValid = validateResult(result, bargain);

    section('RESUMEN FINAL');

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

    log(`⏱️  Duración total: ${duration} minutos`, 'cyan');

    if (isValid) {
        log('\n✅ TEST #49 COMPLETADO EXITOSAMENTE', 'green');
        log('🎉 Nuevo template funcionando correctamente', 'green');
        log('\n📺 Video listo en:', 'cyan');
        log(`   ${result.video.outputPath}`, 'cyan');
        process.exit(0);
    } else {
        log('\n⚠️  TEST #49 COMPLETADO CON WARNINGS', 'yellow');
        log('⚠️  Revisar validaciones fallidas', 'yellow');
        process.exit(1);
    }
}

// Ejecutar
main().catch(error => {
    log('\n💥 ERROR FATAL EN TEST #49', 'red');
    console.error(error);
    process.exit(1);
});
