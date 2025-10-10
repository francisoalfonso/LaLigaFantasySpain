#!/usr/bin/env node
/**
 * Test E2E: Generar video viral de chollo con 3 segmentos cohesivos
 *
 * Flow:
 * 1. Llamar a /api/veo3/generate-viral-chollo con datos de Pere Milla
 * 2. Obtener taskIds de los 3 segmentos
 * 3. Hacer polling hasta que todos terminen
 * 4. Concatenar los 3 videos en uno solo
 * 5. Guardar resultado final
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Colores para logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkSegmentStatus(taskId, segmentName) {
    try {
        const response = await axios.get(`${BASE_URL}/api/veo3/status/${taskId}`);

        if (response.data.success) {
            const { status, videoUrl } = response.data.data;

            if (status === 'completed' && videoUrl) {
                log(`✅ ${segmentName} COMPLETADO - URL: ${videoUrl}`, 'green');
                return { completed: true, videoUrl };
            } else if (status === 'failed') {
                log(`❌ ${segmentName} FALLÓ`, 'red');
                return { completed: true, failed: true };
            } else {
                log(`⏳ ${segmentName} en progreso (${status})...`, 'yellow');
                return { completed: false };
            }
        }

        return { completed: false };
    } catch (error) {
        log(`⚠️  Error verificando ${segmentName}: ${error.message}`, 'red');
        return { completed: false };
    }
}

async function waitForAllSegments(taskIds) {
    const segmentUrls = {};
    const pendingSegments = new Set(Object.keys(taskIds));

    log('\n⏳ Esperando a que todos los segmentos terminen...', 'cyan');
    log('   (Esto puede tardar 15-20 minutos)', 'cyan');

    let iteration = 0;

    while (pendingSegments.size > 0) {
        iteration++;
        log(`\n🔄 Revisión #${iteration} (${new Date().toLocaleTimeString()})`, 'blue');

        for (const segmentName of Array.from(pendingSegments)) {
            const taskId = taskIds[segmentName];
            const result = await checkSegmentStatus(taskId, segmentName);

            if (result.completed) {
                if (result.failed) {
                    throw new Error(`Segmento ${segmentName} falló`);
                }

                segmentUrls[segmentName] = result.videoUrl;
                pendingSegments.delete(segmentName);
            }

            await sleep(1000); // 1s entre checks
        }

        if (pendingSegments.size > 0) {
            log(`\n⏸️  Esperando 30s antes de siguiente revisión...`, 'yellow');
            log(`   Pendientes: ${Array.from(pendingSegments).join(', ')}`, 'yellow');
            await sleep(30000); // 30s entre iteraciones
        }
    }

    return segmentUrls;
}

async function main() {
    log('\n🎬 ========== TEST E2E: VIDEO VIRAL CHOLLO 3-SEGMENTOS ==========\n', 'bright');

    try {
        // ==========================================
        // PASO 1: Iniciar generación de 3 segmentos
        // ==========================================
        log('📊 PASO 1: Iniciando generación de 3 segmentos con guión unificado...', 'yellow');

        const playerData = {
            name: 'Pere Milla',
            price: 6.64,
            team: 'Espanyol',
            stats: {
                goals: 3,
                assists: 0,
                games: 6,
                rating: 7.0
            },
            ratio: 1.42
        };

        log(`   Jugador: ${playerData.name} (${playerData.team})`, 'cyan');
        log(`   Precio: ${playerData.price}M | Ratio: ${playerData.ratio}x | Rating: ${playerData.stats.rating}`, 'cyan');

        const response = await axios.post(`${BASE_URL}/api/veo3/generate-viral-chollo`, {
            playerData
        });

        if (!response.data.success) {
            throw new Error('Error iniciando generación');
        }

        const { sessionId, taskIds, structure, prompts } = response.data.data;

        log(`\n✅ Generación iniciada - Session: ${sessionId}`, 'green');
        log(`   Virality Score: ${structure.metadata.viralityScore}/100`, 'cyan');
        log(`   Arco emocional: ${structure.metadata.emotionalJourney.join(' → ')}`, 'cyan');

        // Mostrar diálogos
        log('\n📝 Diálogos generados:', 'bright');
        for (const [segmentName, segmentData] of Object.entries(structure.segments)) {
            log(`\n   ${segmentName.toUpperCase()}:`, 'cyan');
            log(`   "${segmentData.dialogue}"`, 'white');
        }

        log('\n📋 TaskIDs:', 'bright');
        for (const [segmentName, taskId] of Object.entries(taskIds)) {
            log(`   ${segmentName}: ${taskId}`, 'cyan');
        }

        // ==========================================
        // PASO 2: Esperar a que todos los segmentos terminen
        // ==========================================
        log('\n📊 PASO 2: Monitoreando progreso de los 3 segmentos...', 'yellow');

        const segmentUrls = await waitForAllSegments(taskIds);

        log('\n✅ ¡Todos los segmentos completados!', 'green');
        log('\n📹 URLs de videos:', 'bright');
        for (const [segmentName, url] of Object.entries(segmentUrls)) {
            log(`   ${segmentName}: ${url}`, 'cyan');
        }

        // ==========================================
        // PASO 3: Concatenar videos (TODO: implementar)
        // ==========================================
        log('\n📊 PASO 3: Concatenación de videos...', 'yellow');
        log('   ⚠️  TODO: Implementar concatenación con videoConcatenator.js', 'yellow');
        log('   Por ahora, los 3 videos están disponibles por separado ⬆️', 'yellow');

        // ==========================================
        // RESUMEN FINAL
        // ==========================================
        log('\n🎉 ========== TEST COMPLETADO EXITOSAMENTE ==========\n', 'bright');
        log(`✅ Sesión: ${sessionId}`, 'green');
        log(`✅ Jugador: ${playerData.name}`, 'green');
        log(`✅ Segmentos generados: ${Object.keys(segmentUrls).length}/3`, 'green');
        log(`✅ Virality Score: ${structure.metadata.viralityScore}/100`, 'green');
        log(`✅ Guión unificado: SÍ`, 'green');
        log(`✅ Arco emocional: ${structure.metadata.emotionalJourney.join(' → ')}`, 'green');

        log('\n📁 Videos disponibles:', 'cyan');
        for (const [segmentName, url] of Object.entries(segmentUrls)) {
            log(`   ${segmentName}: ${url}`, 'white');
        }

        log('\n💡 Próximos pasos:', 'yellow');
        log('   1. Descargar los 3 videos', 'white');
        log('   2. Concatenarlos manualmente o implementar videoConcatenator', 'white');
        log('   3. Añadir subtítulos virales (viralCaptionsGenerator)', 'white');
        log('   4. Publicar en Instagram', 'white');

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        if (error.response?.data) {
            log(`   Detalles: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        }
        process.exit(1);
    }
}

main();
