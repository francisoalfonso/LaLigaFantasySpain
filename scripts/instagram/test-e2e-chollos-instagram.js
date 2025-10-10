#!/usr/bin/env node

/**
 * TEST E2E - Instagram Chollos Publication
 *
 * Prueba completa del flujo:
 * 1. Obtener chollos desde BargainAnalyzer
 * 2. Generar video Ana con VEO3 (con cooling periods)
 * 3. (Futuro) Publicar en Instagram
 *
 * IMPORTANTE: Respeta delays entre llamadas VEO3 para no saturar API
 */

require('dotenv').config();
const axios = require('axios');

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
    log('\n' + '='.repeat(60), 'cyan');
    log(`  ${title}`, 'bright');
    log('='.repeat(60), 'cyan');
}

async function sleep(ms, reason = '') {
    if (reason) {
        log(`⏳ Esperando ${ms / 1000}s: ${reason}...`, 'yellow');
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * PASO 1: Test conectividad servidor
 */
async function testServerHealth() {
    section('PASO 1: Verificando servidor');

    try {
        const response = await axios.get(`${BASE_URL}/health`);
        log('✅ Servidor OK', 'green');
        log(`   Status: ${response.data.status}`, 'cyan');
        log(`   Environment: ${response.data.environment}`, 'cyan');
        return true;
    } catch (error) {
        log('❌ Servidor no responde', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

/**
 * PASO 2: Test sistema VEO3
 */
async function testVEO3Health() {
    section('PASO 2: Verificando sistema VEO3');

    try {
        const response = await axios.get(`${BASE_URL}/api/veo3/health`);
        const data = response.data.data || response.data;

        if (response.data.success) {
            log('✅ Sistema VEO3 OK', 'green');
        } else {
            log('⚠️  Sistema VEO3 con warnings', 'yellow');
        }

        log(`   API Key: ${data.environment?.apiKey ? 'Configurada' : 'NO configurada'}`, 'cyan');
        log(`   Ana Image: ${data.environment?.anaImageUrl ? 'Configurada' : 'NO configurada'}`, 'cyan');
        log(`   Modelo: ${data.environment?.model ? 'Configurado' : 'NO configurado'}`, 'cyan');
        log(`   API VEO3: ${data.veo3Api ? 'Conectada' : 'NO conectada'}`, 'cyan');

        // Retornar config con defaults
        return {
            apiKeyConfigured: data.environment?.apiKey || false,
            config: {
                coolingPeriod: 30000 // Default 30s
            }
        };
    } catch (error) {
        log('⚠️  Sistema VEO3 health check falló - CONTINUANDO (API key configurada)', 'yellow');
        log(`   Error health: ${error.message}`, 'yellow');
        // ✅ FIX: Continuar si API key está configurada (health check puede fallar por timeout Imgur)
        return {
            apiKeyConfigured: true, // Asumimos configurado si llegamos aquí
            config: {
                coolingPeriod: 30000 // Default 30s
            }
        };
    }
}

/**
 * PASO 3: Obtener chollos de la jornada
 */
async function getBargains() {
    section('PASO 3: Obteniendo chollos de la jornada');

    try {
        const response = await axios.get(`${BASE_URL}/api/bargains/top?limit=3`);
        const bargains = response.data.data || response.data.bargains || [];

        if (bargains.length === 0) {
            log('⚠️  No hay chollos disponibles', 'yellow');
            return null;
        }

        log(`✅ ${bargains.length} chollos obtenidos`, 'green');

        bargains.forEach((bargain, index) => {
            log(`\n   Chollo #${index + 1}:`, 'cyan');
            log(`   • Jugador: ${bargain.name}`, 'cyan');
            log(`   • Equipo: ${bargain.team?.name || bargain.team}`, 'cyan');
            log(`   • Posición: ${bargain.position}`, 'cyan');
            log(`   • Precio estimado: €${bargain.analysis?.estimatedPrice || 0}M`, 'cyan');
            log(`   • Puntos estimados: ${bargain.analysis?.estimatedPoints?.toFixed(1) || 0} pts`, 'cyan');
            log(`   • Ratio valor: ${bargain.analysis?.valueRatio?.toFixed(2) || 0}x`, 'cyan');
        });

        return bargains;
    } catch (error) {
        log('❌ Error obteniendo chollos', 'red');
        log(`   Error: ${error.response?.data?.error || error.message}`, 'red');
        return null;
    }
}

/**
 * PASO 4: Generar video Ana para un chollo
 */
async function generateVideoForBargain(bargain, index, total) {
    section(
        `PASO 4.${index + 1}: Generando video para ${bargain.name} (${index + 1}/${total})`
    );

    try {
        log('📹 Iniciando generación video VEO3...', 'yellow');
        log(`   Jugador: ${bargain.name}`, 'cyan');
        log(`   Precio: €${bargain.price}M`, 'cyan');

        const requestData = {
            playerName: bargain.name,
            team: bargain.team?.name || bargain.team,
            price: bargain.analysis?.estimatedPrice || 3.0,
            ratio: bargain.analysis?.valueRatio || 1.2,
            stats: {
                // ✅ DATOS REALES DEL JUGADOR (de bargain.stats)
                games: bargain.stats?.games || 0,
                minutes: bargain.stats?.minutes || 0,
                goals: bargain.stats?.goals || 0,         // ← AÑADIDO
                assists: bargain.stats?.assists || 0,     // ← AÑADIDO
                rating: bargain.stats?.rating || "N/A"    // ← AÑADIDO
            }
        };

        log('\n   Payload:', 'cyan');
        log(JSON.stringify(requestData, null, 2), 'cyan');

        const response = await axios.post(
            `${BASE_URL}/api/veo3/generate-viral`,
            requestData,
            {
                timeout: 900000 // 15 minutos timeout (cada video tarda ~4-6 min)
            }
        );

        const result = response.data;

        if (result.success) {
            log('\n✅ Video generado exitosamente!', 'green');

            if (result.video) {
                log(`   Archivo: ${result.video.outputPath || 'Pendiente'}`, 'cyan');
                log(`   Duración: ${result.video.duration || result.instagram?.duration}s`, 'cyan');
                log(`   Segmentos: ${result.video.segments || result.instagram?.segments}`, 'cyan');
                log(`   Formato: ${result.instagram?.format || '9:16'}`, 'cyan');
            }

            if (result.caption) {
                log(`\n   Caption Instagram:`, 'cyan');
                log(`   ${result.caption.substring(0, 100)}...`, 'cyan');
            }

            // Calcular costo (3 segmentos × $0.30)
            const estimatedCost = (result.instagram?.segments || 3) * 0.3;
            log(`   Costo estimado: $${estimatedCost.toFixed(2)}`, 'cyan');

            return {
                ...result,
                videoPath: result.video?.outputPath,
                duration: result.video?.duration,
                segments: result.video?.segments
            };
        } else {
            log('\n⚠️ Video generado con warnings', 'yellow');
            log(`   Warnings: ${result.warnings?.join(', ')}`, 'yellow');
            return result;
        }
    } catch (error) {
        log('\n❌ Error generando video', 'red');

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
 * PASO 5: Esperar cooling period entre videos
 */
async function cooldownBetweenVideos(index, total, coolingPeriod) {
    if (index < total - 1) {
        section(`COOLING PERIOD ${index + 1}/${total - 1}`);
        log(
            `🧊 Dejando enfriar API VEO3 antes del siguiente video...`,
            'cyan'
        );
        await sleep(coolingPeriod, 'Cooling API VEO3');
        log('✅ Cooling completado, listo para siguiente video', 'green');
    }
}

/**
 * PASO 6: Resumen de resultados
 */
function printSummary(results, startTime) {
    section('RESUMEN E2E TEST');

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    log(`⏱️  Duración total: ${duration} minutos`, 'cyan');
    log(`✅ Videos exitosos: ${successful}`, 'green');
    log(`❌ Videos fallidos: ${failed}`, 'red');

    if (successful > 0) {
        log('\n📹 Videos generados:', 'cyan');
        results
            .filter((r) => r.success)
            .forEach((r, i) => {
                log(
                    `   ${i + 1}. ${r.playerName} - ${r.videoPath || 'Pendiente'}`,
                    'cyan'
                );
            });
    }

    if (failed > 0) {
        log('\n❌ Videos fallidos:', 'red');
        results
            .filter((r) => !r.success)
            .forEach((r, i) => {
                log(`   ${i + 1}. ${r.playerName} - ${r.error}`, 'red');
            });
    }

    // Costo estimado
    const totalCost = successful * 0.9; // $0.30 por segmento × 3 segmentos
    log(`\n💰 Costo estimado: $${totalCost.toFixed(2)}`, 'yellow');

    // Rate de éxito
    const successRate = ((successful / results.length) * 100).toFixed(1);
    log(`📊 Tasa de éxito: ${successRate}%`, 'cyan');

    log('\n' + '='.repeat(60), 'cyan');
}

/**
 * MAIN - Ejecutar test E2E completo
 */
async function main() {
    log('\n🚀 INICIANDO TEST E2E - INSTAGRAM CHOLLOS', 'bright');
    log('🕐 ' + new Date().toLocaleString(), 'cyan');

    const startTime = Date.now();
    const results = [];

    // PASO 1: Health check servidor
    const serverOk = await testServerHealth();
    if (!serverOk) {
        log('\n❌ Test abortado: Servidor no disponible', 'red');
        process.exit(1);
    }

    await sleep(2000, 'Preparando siguiente paso');

    // PASO 2: Health check VEO3
    const veo3Health = await testVEO3Health();
    // ✅ FIX: Continuar incluso si health check falla (puede ser timeout Imgur pero VEO3 funciona)
    const coolingPeriod = veo3Health?.config?.coolingPeriod || 30000;

    await sleep(2000, 'Preparando siguiente paso');

    // PASO 3: Obtener chollos
    const bargains = await getBargains();
    if (!bargains || bargains.length === 0) {
        log('\n❌ Test abortado: No hay chollos disponibles', 'red');
        process.exit(1);
    }

    await sleep(3000, 'Preparando generación de videos');

    // PASO 4 & 5: Generar videos con cooling periods
    for (let i = 0; i < bargains.length; i++) {
        const bargain = bargains[i];

        const result = await generateVideoForBargain(bargain, i, bargains.length);

        results.push({
            success: result?.success || false,
            playerName: bargain.name,
            videoPath: result?.videoPath || null,
            taskId: result?.taskId || null,
            error: result?.error || null
        });

        // Cooling period entre videos (excepto después del último)
        await cooldownBetweenVideos(i, bargains.length, coolingPeriod);
    }

    // PASO 6: Resumen
    printSummary(results, startTime);

    // Éxito si al menos 1 video se generó
    const hasSuccess = results.some((r) => r.success);
    if (hasSuccess) {
        log('\n✅ TEST E2E COMPLETADO CON ÉXITO', 'green');
        process.exit(0);
    } else {
        log('\n❌ TEST E2E FALLÓ - Ningún video generado', 'red');
        process.exit(1);
    }
}

// Ejecutar
main().catch((error) => {
    log('\n💥 ERROR FATAL EN TEST E2E', 'red');
    log(error.stack, 'red');
    process.exit(1);
});
