#!/usr/bin/env node

/**
 * Test Comparativo: Google Vertex AI VEO3 vs KIE.ai
 *
 * Genera el mismo video con ambas APIs y compara:
 * - Éxito/fallos
 * - Calidad de video
 * - Tiempos de generación
 * - Manejo de imagen referencia (Ana)
 * - Costos
 */

require('dotenv').config();
const GoogleVertexAIClient = require('../../backend/services/veo3/googleVertexAIClient');
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    log('\n' + '='.repeat(80), 'cyan');
    log(`  ${title}`, 'bright');
    log('='.repeat(80), 'cyan');
}

/**
 * Test Google Vertex AI
 */
async function testGoogleVertexAI(prompt, anaImageUrl) {
    section('TEST 1: Google Vertex AI VEO3 (API Oficial)');

    const startTime = Date.now();
    const client = new GoogleVertexAIClient();

    try {
        log('📡 Iniciando generación con Google Vertex AI...', 'yellow');
        log(`   Prompt: ${prompt.substring(0, 100)}...`, 'cyan');
        log(`   Ana Image: ${anaImageUrl}`, 'cyan');

        const result = await client.generateVideo({
            prompt: prompt,
            referenceImageUrl: anaImageUrl,
            duration: 8,
            aspectRatio: '9:16',
            seed: 30001
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.success) {
            log('\n✅ Google Vertex AI - ÉXITO', 'green');
            log(`   Task ID: ${result.taskId}`, 'cyan');
            log(`   Status: ${result.status}`, 'cyan');
            log(`   Video URL: ${result.videoUrl || 'Generando...'}`, 'cyan');
            log(`   Tiempo: ${duration}s`, 'cyan');

            return {
                provider: 'Google Vertex AI',
                success: true,
                taskId: result.taskId,
                duration: duration,
                videoUrl: result.videoUrl,
                error: null
            };
        } else {
            log('\n❌ Google Vertex AI - FALLÓ', 'red');
            return {
                provider: 'Google Vertex AI',
                success: false,
                error: 'Generation failed',
                duration: duration
            };
        }

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('\n❌ Google Vertex AI - ERROR', 'red');
        log(`   Error: ${error.message}`, 'red');
        log(`   Tiempo: ${duration}s`, 'cyan');

        return {
            provider: 'Google Vertex AI',
            success: false,
            error: error.message,
            duration: duration
        };
    }
}

/**
 * Test KIE.ai
 */
async function testKIEai(prompt, anaImageUrl) {
    section('TEST 2: KIE.ai VEO3 (API Actual)');

    const startTime = Date.now();
    const client = new VEO3Client();

    try {
        log('📡 Iniciando generación con KIE.ai...', 'yellow');
        log(`   Prompt: ${prompt.substring(0, 100)}...`, 'cyan');
        log(`   Ana Image: ${anaImageUrl}`, 'cyan');

        const result = await client.generateVideo({
            prompt: prompt,
            image: anaImageUrl,
            aspectRatio: '9:16',
            duration: 8
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.success) {
            log('\n✅ KIE.ai - ÉXITO', 'green');
            log(`   Task ID: ${result.taskId}`, 'cyan');
            log(`   Status: ${result.status}`, 'cyan');
            log(`   Video URL: ${result.videoUrl || 'Generando...'}`, 'cyan');
            log(`   Tiempo: ${duration}s`, 'cyan');

            return {
                provider: 'KIE.ai',
                success: true,
                taskId: result.taskId,
                duration: duration,
                videoUrl: result.videoUrl,
                error: null
            };
        } else {
            log('\n❌ KIE.ai - FALLÓ', 'red');
            return {
                provider: 'KIE.ai',
                success: false,
                error: result.error || 'Generation failed',
                duration: duration
            };
        }

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('\n❌ KIE.ai - ERROR', 'red');
        log(`   Error: ${error.message}`, 'red');
        log(`   Tiempo: ${duration}s`, 'cyan');

        return {
            provider: 'KIE.ai',
            success: false,
            error: error.message,
            duration: duration
        };
    }
}

/**
 * Comparar resultados
 */
function compareResults(googleResult, kieResult) {
    section('COMPARATIVA DE RESULTADOS');

    log('\n📊 Resumen:', 'bright');

    // Tabla comparativa
    log('\n┌─────────────────────┬──────────────────────┬──────────────────────┐', 'cyan');
    log('│ Métrica             │ Google Vertex AI     │ KIE.ai               │', 'cyan');
    log('├─────────────────────┼──────────────────────┼──────────────────────┤', 'cyan');

    // Éxito
    const googleStatus = googleResult.success ? '✅ ÉXITO' : '❌ FALLÓ';
    const kieStatus = kieResult.success ? '✅ ÉXITO' : '❌ FALLÓ';
    log(`│ Status              │ ${googleStatus.padEnd(20)} │ ${kieStatus.padEnd(20)} │`, 'cyan');

    // Tiempo
    const googleTime = `${googleResult.duration}s`;
    const kieTime = `${kieResult.duration}s`;
    log(`│ Tiempo              │ ${googleTime.padEnd(20)} │ ${kieTime.padEnd(20)} │`, 'cyan');

    // Error
    const googleError = googleResult.error ? googleResult.error.substring(0, 18) + '..' : 'N/A';
    const kieError = kieResult.error ? kieResult.error.substring(0, 18) + '..' : 'N/A';
    log(`│ Error               │ ${googleError.padEnd(20)} │ ${kieError.padEnd(20)} │`, 'cyan');

    log('└─────────────────────┴──────────────────────┴──────────────────────┘', 'cyan');

    // Detalles de errores
    if (googleResult.error || kieResult.error) {
        log('\n📋 Detalles de Errores:', 'yellow');

        if (googleResult.error) {
            log(`\n   Google Vertex AI:`, 'red');
            log(`   ${googleResult.error}`, 'red');
        }

        if (kieResult.error) {
            log(`\n   KIE.ai:`, 'red');
            log(`   ${kieResult.error}`, 'red');
        }
    }

    // Recomendación
    log('\n💡 Recomendación:', 'bright');

    if (googleResult.success && !kieResult.success) {
        log('   → Migrar a Google Vertex AI (más estable, acepta imagen Ana)', 'green');
    } else if (!googleResult.success && kieResult.success) {
        log('   → Mantener KIE.ai (funciona correctamente)', 'green');
    } else if (googleResult.success && kieResult.success) {
        log('   → Ambas APIs funcionan - evaluar costos y calidad de video', 'yellow');
    } else {
        log('   → Ambas APIs fallan - problema con imagen Ana o configuración', 'red');
    }
}

/**
 * Main
 */
async function main() {
    log('\n🎬 TEST COMPARATIVO VEO3: Google Vertex AI vs KIE.ai', 'bright');
    log('🕐 ' + new Date().toLocaleString(), 'cyan');

    // Validar configuración
    section('VALIDACIÓN DE CONFIGURACIÓN');

    const anaImageUrl = process.env.ANA_IMAGE_URL;
    log(`Ana Image URL: ${anaImageUrl}`, 'cyan');

    if (!anaImageUrl) {
        log('❌ Error: ANA_IMAGE_URL no configurada', 'red');
        process.exit(1);
    }

    // Verificar credenciales Google
    const googleProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    log(`Google Cloud Project: ${googleProjectId || 'NO CONFIGURADO'}`, googleProjectId ? 'green' : 'red');

    // Verificar credenciales KIE.ai
    const kieApiKey = process.env.KIE_AI_API_KEY;
    log(`KIE.ai API Key: ${kieApiKey ? 'CONFIGURADA' : 'NO CONFIGURADA'}`, kieApiKey ? 'green' : 'red');

    // Prompt de test (simple para comparar)
    const promptBuilder = new PromptBuilder();
    const testPrompt = promptBuilder.buildPrompt({
        dialogue: "Hola, soy Ana Martínez y te traigo el mejor chollo de la jornada.",
        emotion: "confident",
        duration: 8
    });

    log(`\nPrompt de test: ${testPrompt.substring(0, 100)}...`, 'cyan');

    // Ejecutar tests
    const googleResult = await testGoogleVertexAI(testPrompt, anaImageUrl);

    // Esperar 10 segundos entre tests
    log('\n⏳ Esperando 10s antes del siguiente test...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const kieResult = await testKIEai(testPrompt, anaImageUrl);

    // Comparar resultados
    compareResults(googleResult, kieResult);

    // Exit code
    if (googleResult.success || kieResult.success) {
        log('\n✅ Al menos una API funcionó correctamente', 'green');
        process.exit(0);
    } else {
        log('\n❌ Ambas APIs fallaron', 'red');
        process.exit(1);
    }
}

// Ejecutar
main().catch(error => {
    log('\n💥 ERROR FATAL EN TEST', 'red');
    log(error.stack, 'red');
    process.exit(1);
});
