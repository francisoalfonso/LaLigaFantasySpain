#!/usr/bin/env node

/**
 * GENERACIÓN TEST #48 - END-TO-END COMPLETO
 *
 * Sistema restaurado del Test #47 con mejoras:
 * ✅ Endpoint: /api/veo3/generate-multi-segment
 * ✅ UnifiedScriptGenerator (números → texto)
 * ✅ Preset: chollo_quick (2×7s = 14s)
 * ✅ Imagen Ana: Supabase
 * ✅ Cooling period: 60s entre segmentos (validado)
 * ✅ Guarda JSON en instagram-versions/
 * ✅ Actualiza contador
 * ✅ Muestra en test-history.html
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_NUMBER = 48;

// Colores
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
    log('\n🎬 GENERACIÓN TEST #48 - END-TO-END COMPLETO', 'bright');
    log('═'.repeat(70), 'cyan');

    const generationStartTime = Date.now();

    section('📋 PASO 1: Obtener Chollo Real');

    let topChollo;
    try {
        const response = await axios.get(`${BASE_URL}/api/bargains/top?limit=1`);
        topChollo = response.data.data[0];

        log('✅ Chollo obtenido:', 'green');
        log(`   Jugador: ${topChollo.name}`, 'cyan');
        log(`   Equipo: ${topChollo.team.name}`, 'cyan');
        log(`   Posición: ${topChollo.position}`, 'cyan');
        log(`   Precio estimado: €${topChollo.analysis.estimatedPrice}M`, 'cyan');
        log(`   Ratio valor: ${topChollo.analysis.valueRatio}x`, 'cyan');
        log(`   Rating: ${topChollo.stats.rating}`, 'cyan');

    } catch (error) {
        log('❌ Error obteniendo chollos', 'red');
        log(error.message, 'red');
        process.exit(1);
    }

    section('📋 PASO 2: Preparar Datos del Test');

    const playerData = {
        name: topChollo.name,
        team: topChollo.team.name,
        price: topChollo.analysis.estimatedPrice,
        valueRatio: topChollo.analysis.valueRatio,
        position: topChollo.position,
        stats: {
            games: topChollo.stats.games,
            minutes: topChollo.stats.minutes,
            goals: topChollo.stats.goals,
            assists: topChollo.stats.assists,
            rating: topChollo.stats.rating
        }
    };

    const testConfig = {
        contentType: 'chollo',
        playerData: playerData,
        preset: 'chollo_quick',  // ✅ 2×7s = 14s
        options: {
            useViralStructure: true,  // ✅ UnifiedScriptGenerator
            anaImageIndex: 0  // ✅ Imagen fija Supabase
        }
    };

    log('Configuración del test:', 'yellow');
    log(`   Preset: chollo_quick (2 segmentos × 7s = 14s)`, 'cyan');
    log(`   Endpoint: /api/veo3/generate-multi-segment`, 'cyan');
    log(`   UnifiedScriptGenerator: ACTIVADO`, 'green');
    log(`   Imagen Ana: Supabase (fija)`, 'green');
    log(`   Cooling period: 60s entre segmentos`, 'green');

    section('🎬 PASO 3: Generar Video VEO3');

    log('📤 Enviando request...', 'yellow');
    log('⏱️  Tiempo estimado: 6-8 minutos', 'cyan');
    log('⏱️  Cooling period: 60s entre segmentos (NO modificar)', 'yellow');
    log('', 'reset');

    let videoResponse;
    try {
        videoResponse = await axios.post(
            `${BASE_URL}/api/veo3/generate-multi-segment`,
            testConfig,
            { timeout: 900000 }  // 15 minutos
        );

        if (!videoResponse.data.success) {
            throw new Error('Generación falló: ' + JSON.stringify(videoResponse.data));
        }

        const generationTime = ((Date.now() - generationStartTime) / 1000 / 60).toFixed(2);

        log('✅ Video generado exitosamente', 'green');
        log(`⏱️  Tiempo total: ${generationTime} minutos`, 'cyan');
        log('', 'reset');

    } catch (error) {
        log('❌ Error generando video:', 'red');
        log(error.response?.data || error.message, 'red');
        process.exit(1);
    }

    section('📋 PASO 4: Guardar Metadata del Test');

    const timestamp = Date.now();
    const testId = `${playerData.name.toLowerCase().replace(/\s+/g, '-')}-v${timestamp}`;

    const testMetadata = {
        id: testId,
        version: TEST_NUMBER,
        timestamp: new Date().toISOString(),
        playerData: playerData,
        testMetadata: {
            testDate: new Date().toISOString(),
            testNumber: TEST_NUMBER,
            fixesApplied: [
                'sistema-restaurado-test47',
                'preset-chollo-quick-14s',
                'imagen-ana-supabase',
                'unified-script-generator',
                'cooling-period-60s'
            ],
            testPurpose: 'TEST #48 SISTEMA RESTAURADO - Validar sistema Test #47 + preset chollo_quick (2×7s)',
            generationDetails: {
                sessionId: videoResponse.data.sessionId,
                totalTimeMinutes: ((Date.now() - generationStartTime) / 1000 / 60).toFixed(2),
                segmentsGenerated: videoResponse.data.segmentsCompleted,
                preset: 'chollo_quick',
                endpoint: '/api/veo3/generate-multi-segment',
                coolingPeriodSeconds: 60,
                segments: videoResponse.data.segments || []
            },
            feedback: {
                whatWorks: [],
                whatFails: [],
                severity: { critical: 0, major: 0, minor: 0 },
                reviewedBy: null,
                reviewDate: null,
                reviewNotes: 'Pendiente validación usuario'
            },
            qualityScore: {
                videoQuality: null,
                audioQuality: null,
                viralPotential: null,
                technicalScore: null,
                overallScore: null
            }
        },
        veo3Config: {
            anaImageUrl: process.env.ANA_IMAGE_URL,
            seed: 30001,
            enhanced: false,
            modelVersion: 'veo3_fast',
            segmentCount: 2,
            totalDuration: 14,
            frameToFrameEnabled: true,
            endpoint: '/api/veo3/generate-multi-segment',
            coolingPeriodSeconds: 60
        },
        videoUrl: videoResponse.data.finalVideoUrl,
        localPath: videoResponse.data.concatenatedVideo?.outputPath || '',
        isRealVideo: true,
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'system',
            status: 'pending_validation'
        }
    };

    const versionsDir = path.join(__dirname, '../../data/instagram-versions');
    const filename = path.join(versionsDir, `${testId}.json`);

    fs.writeFileSync(filename, JSON.stringify(testMetadata, null, 2));
    log(`✅ Metadata guardado: ${filename}`, 'green');

    section('📋 PASO 5: Actualizar Contador de Tests');

    try {
        const counterFile = path.join(versionsDir, '_TEST_COUNTER.json');
        let counter;

        if (fs.existsSync(counterFile)) {
            counter = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
        } else {
            counter = {
                lastTestNumber: 0,
                totalTests: 0
            };
        }

        counter.lastTestNumber = TEST_NUMBER;
        counter.lastTestDate = new Date().toISOString();
        counter.lastTestId = testId;
        counter.totalTests = (counter.totalTests || 0) + 1;

        fs.writeFileSync(counterFile, JSON.stringify(counter, null, 2));
        log(`✅ Contador actualizado: Test #${TEST_NUMBER}`, 'green');

    } catch (error) {
        log(`⚠️  No se pudo actualizar contador: ${error.message}`, 'yellow');
    }

    section('✅ TEST #48 COMPLETADO');

    log('', 'reset');
    log('📹 Video generado:', 'cyan');
    log(`   ${videoResponse.data.concatenatedVideo?.outputPath || 'N/A'}`, 'yellow');
    log('', 'reset');
    log('🌐 Ver en preview:', 'cyan');
    log(`   http://localhost:3000/test-history.html`, 'yellow');
    log('', 'reset');
    log('📊 Datos generados:', 'cyan');
    if (videoResponse.data.segments) {
        videoResponse.data.segments.forEach((seg, idx) => {
            log(`   Seg ${idx + 1}: "${seg.dialogue}"`, 'white');
        });
    }
    log('', 'reset');
    log('🎯 Próximo paso:', 'cyan');
    log('   1. Abre http://localhost:3000/test-history.html', 'yellow');
    log('   2. Selecciona Test #48', 'yellow');
    log('   3. Valida todos los puntos críticos', 'yellow');
    log('   4. Agrega feedback en la interfaz', 'yellow');
    log('', 'reset');

    // Abrir video automáticamente
    if (videoResponse.data.concatenatedVideo?.outputPath) {
        const { exec } = require('child_process');
        exec(`open "${videoResponse.data.concatenatedVideo.outputPath}"`);
        log('✅ Video abierto automáticamente\n', 'green');
    }
}

main().catch(error => {
    log('\n❌ ERROR FATAL:', 'red');
    log(error.message, 'red');
    process.exit(1);
});
