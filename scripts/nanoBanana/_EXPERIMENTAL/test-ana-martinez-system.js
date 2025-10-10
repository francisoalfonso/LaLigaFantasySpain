/**
 * Test Script: Ana Martínez Character System (Nano Banana)
 *
 * Valida la nueva configuración con 5 referencias múltiples:
 * - 4 vistas de Ana Martínez
 * - 1 imagen del estudio FLP
 *
 * Este script prueba:
 * 1. Health check del cliente
 * 2. Generación de 1 imagen individual (test rápido)
 * 3. Generación de 3 imágenes con progresión cinematográfica (test completo)
 *
 * Uso:
 *   node scripts/nanoBanana/test-ana-martinez-system.js
 *   node scripts/nanoBanana/test-ana-martinez-system.js --single    # Solo 1 imagen
 *   node scripts/nanoBanana/test-ana-martinez-system.js --full      # 3 imágenes
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.supabase' });

const NanoBananaClient = require('../../backend/services/nanoBanana/nanoBananaClient');

// Parsear argumentos
const args = process.argv.slice(2);
const mode = args[0] || '--health'; // --health | --single | --full

async function runHealthCheck() {
    console.log('\n🏥 ========================================');
    console.log('   HEALTH CHECK - ANA MARTÍNEZ SYSTEM');
    console.log('🏥 ========================================\n');

    try {
        const client = new NanoBananaClient();
        const health = await client.healthCheck();

        console.log('📊 Configuración del Cliente:\n');
        console.log(`   ✅ Estado: ${health.configured ? 'CONFIGURADO' : 'ERROR'}`);
        console.log(`   🎨 Modelo: ${health.model}`);
        console.log(`   🎲 Seed: ${health.seed}`);
        console.log(`   📸 Referencias: ${health.references} imágenes`);
        console.log(`   💪 Prompt Strength: ${health.promptStrength}`);
        console.log(`   📐 Tamaño: ${health.size}`);
        console.log(`   💰 Precio: ${health.pricing}`);

        if (!health.configured) {
            console.error(`\n   ❌ Error: ${health.error}`);
            process.exit(1);
        }

        // Mostrar detalles de configuración
        const config = client.getConfig();
        console.log('\n📋 Detalles de Referencias:\n');
        config.references.forEach((url, index) => {
            const filename = url.split('/').pop();
            console.log(`   ${index + 1}. ${filename}`);
        });

        console.log('\n✅ Health check completado exitosamente\n');
        return true;
    } catch (error) {
        console.error('\n❌ Error en health check:', error.message);
        process.exit(1);
    }
}

async function runSingleImageTest() {
    console.log('\n📸 ========================================');
    console.log('   TEST: IMAGEN INDIVIDUAL');
    console.log('📸 ========================================\n');

    try {
        const client = new NanoBananaClient();

        console.log('🎬 Generando imagen de prueba (medium shot)...\n');

        const startTime = Date.now();
        const result = await client.generateSingleImage({
            shot: 'medium',
            expression: 'professional confident smile'
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n✅ ========================================');
        console.log('   IMAGEN GENERADA EXITOSAMENTE');
        console.log('✅ ========================================\n');

        console.log(`📊 Resultados:\n`);
        console.log(`   Shot: ${result.shot}`);
        console.log(`   Seed: ${result.seed}`);
        console.log(`   Duración: ${duration}s`);
        console.log(`   Costo: $0.020`);
        console.log(`\n   🖼️  URL:`);
        console.log(`   ${result.url}\n`);

        console.log('🎯 Próximos pasos:');
        console.log('   1. Abrir URL en navegador para verificar imagen');
        console.log('   2. Validar que Ana es consistente con referencias');
        console.log('   3. Verificar integración con estudio FLP');
        console.log(
            '   4. Ejecutar test completo: node scripts/nanoBanana/test-ana-martinez-system.js --full\n'
        );

        return result;
    } catch (error) {
        console.error('\n❌ Error generando imagen:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

async function runFullProgressionTest() {
    console.log('\n🎬 ========================================');
    console.log('   TEST: PROGRESIÓN CINEMATOGRÁFICA');
    console.log('🎬 ========================================\n');

    try {
        const client = new NanoBananaClient();

        console.log('🎨 Generando 3 imágenes con progresión:\n');
        console.log('   1. Wide Shot (Hook)');
        console.log('   2. Medium Shot (Desarrollo)');
        console.log('   3. Close-Up (CTA)\n');

        console.log('⏱️  Tiempo estimado: ~60-90 segundos\n');
        console.log('─'.repeat(80));

        const startTime = Date.now();
        const images = await client.generateAnaProgression({
            style: 'professional',
            progression: 'wide-medium-closeup'
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalCost = images.length * 0.02;

        console.log('\n✅ ========================================');
        console.log('   PROGRESIÓN GENERADA EXITOSAMENTE');
        console.log('✅ ========================================\n');

        console.log(`📊 Resultados Generales:\n`);
        console.log(`   Imágenes generadas: ${images.length}`);
        console.log(`   Duración total: ${duration}s`);
        console.log(`   Costo total: $${totalCost.toFixed(3)}`);
        console.log(`   Referencias usadas: ${images[0].referenceCount}`);
        console.log(`\n📸 Detalles por Imagen:\n`);

        images.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.shot.toUpperCase()} SHOT (${img.segmentRole})`);
            console.log(`      Seed: ${img.seed}`);
            console.log(`      URL: ${img.url}`);
            console.log('');
        });

        console.log('🎯 Checklist de Validación:\n');
        console.log('   [ ] Ana mantiene identidad visual en las 3 imágenes');
        console.log('   [ ] Piel realista sin aspecto 3D/plástico');
        console.log('   [ ] Integración con estudio FLP (neón rojo + pantallas)');
        console.log('   [ ] Progresión cinematográfica natural');
        console.log('   [ ] Polo rojo FLP visible y consistente');
        console.log('   [ ] Expresiones profesionales y naturales\n');

        console.log('💾 Guardando resultados en archivo...');

        const fs = require('fs');
        const path = require('path');

        const testResults = {
            test_date: new Date().toISOString(),
            test_type: 'full_progression',
            duration_seconds: parseFloat(duration),
            total_cost_usd: totalCost,
            images: images,
            validation_checklist: {
                identity_consistency: null,
                realistic_skin: null,
                studio_integration: null,
                cinematic_progression: null,
                flp_branding: null,
                professional_expressions: null
            }
        };

        const resultsPath = path.join(
            __dirname,
            '../../output/veo3/test-results-ana-martinez.json'
        );
        fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));

        console.log(`✅ Resultados guardados: ${resultsPath}\n`);

        return images;
    } catch (error) {
        console.error('\n❌ Error generando progresión:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

async function main() {
    console.log('\n🎬 ========================================');
    console.log('   ANA MARTÍNEZ CHARACTER SYSTEM TEST');
    console.log('🎬 ========================================');
    console.log(`   Modo: ${mode}`);
    console.log(`   Sistema: Nano Banana (KIE.ai)`);
    console.log(`   Referencias: 5 imágenes (4 Ana + 1 estudio)`);
    console.log('🎬 ========================================');

    try {
        switch (mode) {
            case '--health':
                await runHealthCheck();
                console.log('💡 Para generar imágenes:');
                console.log('   --single : Generar 1 imagen de prueba (~15s, $0.02)');
                console.log('   --full   : Generar 3 imágenes progresión (~90s, $0.06)\n');
                break;

            case '--single':
                await runHealthCheck();
                await runSingleImageTest();
                break;

            case '--full':
                await runHealthCheck();
                await runFullProgressionTest();
                break;

            default:
                console.error('\n❌ Modo desconocido:', mode);
                console.error('   Modos válidos: --health | --single | --full\n');
                process.exit(1);
        }

        console.log('🎉 Test completado exitosamente!\n');
    } catch (error) {
        console.error('\n💥 Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar
main();
