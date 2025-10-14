/**
 * Test E2E - Documentary Pipeline
 *
 * PROPÓSITO:
 * Probar el flujo completo end-to-end del sistema de documentales automatizado.
 *
 * FLUJO TESTEADO:
 * 1. Detectar trending topics (Google Trends - gratis)
 * 2. Seleccionar top topic con mayor documentary potential
 * 3. Generar script documental con GPT-4o
 * 4. Generar video con VEO3 3-Phase System
 * 5. Agregar subtítulos con FFmpeg
 * 6. Guardar metadata y resultado
 *
 * USO:
 * node scripts/test-docu-pipeline.js
 *
 * REQUISITOS .env:
 * - OPENAI_API_KEY (GPT-4o para scripts)
 * - KIE_AI_API_KEY (VEO3 para videos)
 * - NEWSAPI_KEY (opcional, fallback a Google Trends)
 * - YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN (opcional, solo para publicar)
 *
 * COST: ~$0.96 por video
 */

const docuPipeline = require('../backend/services/documentales/docuPipeline');
const logger = require('../backend/utils/logger');
require('dotenv').config();

async function testDocuPipeline() {
    console.log('🎬 Test E2E: Documentary Pipeline\n');
    console.log('='.repeat(60));
    console.log('\n');

    try {
        // Verificar .env
        console.log('1️⃣ Verificando configuración...\n');

        const requiredEnvVars = ['OPENAI_API_KEY', 'KIE_AI_API_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error(`❌ Variables de entorno faltantes: ${missingVars.join(', ')}`);
            console.error('\nConfigura las variables en .env:');
            missingVars.forEach(varName => {
                console.error(`   ${varName}=your_api_key_here`);
            });
            process.exit(1);
        }

        console.log('✅ Configuración verificada\n');
        console.log('-'.repeat(60));
        console.log('\n');

        // Ejecutar pipeline completo con 1 video
        console.log('2️⃣ Ejecutando pipeline completo...\n');
        console.log('   - Detectando trending topics (Google Trends)');
        console.log('   - Generando script documental (GPT-4o)');
        console.log('   - Generando video (VEO3 3-Phase)');
        console.log('   - Agregando subtítulos (FFmpeg)');
        console.log('\n⏳ Esto puede tomar 10-15 minutos...\n');

        const startTime = Date.now();

        const result = await docuPipeline.run({
            limit: 1, // Solo 1 video para test
            autoPublish: false, // NO publicar automáticamente en test
            method: 'google_trends' // Gratis
        });

        const duration = Math.round((Date.now() - startTime) / 1000);

        console.log('\n');
        console.log('='.repeat(60));
        console.log('\n');

        // Mostrar resultados
        if (result.success) {
            console.log('✅ PIPELINE COMPLETADO EXITOSAMENTE\n');
            console.log('📊 RESULTADOS:\n');
            console.log(`   Topics detectados:     ${result.topicsDetected}`);
            console.log(`   Videos producidos:     ${result.videosProduced}`);
            console.log(`   Videos publicados:     ${result.videosPublished}`);
            console.log(`   Errores:               ${result.errors.length}`);
            console.log(`   Duración total:        ${duration}s (${Math.round(duration / 60)} min)`);
            console.log(`   Costo total:           $${result.totalCost?.toFixed(2) || '0.96'}`);
            console.log('\n');

            if (result.videos && result.videos.length > 0) {
                console.log('🎥 VIDEOS GENERADOS:\n');
                result.videos.forEach((video, i) => {
                    console.log(`   Video ${i + 1}:`);
                    console.log(`      Tema:       ${video.tema}`);
                    console.log(`      Path:       ${video.videoPath}`);
                    console.log(`      Publicado:  ${video.published ? 'Sí' : 'No (autoPublish=false)'}`);
                    if (video.youtubeUrl) {
                        console.log(`      YouTube:    ${video.youtubeUrl}`);
                    }
                    console.log(`      Costo:      $${video.cost}`);
                    console.log('\n');
                });
            }

            if (result.errors.length > 0) {
                console.log('⚠️ ERRORES:\n');
                result.errors.forEach((err, i) => {
                    console.log(`   Error ${i + 1}:`);
                    console.log(`      Topic: ${err.topic}`);
                    console.log(`      Error: ${err.error}`);
                    console.log('\n');
                });
            }

            console.log('📈 PROYECCIÓN DE INGRESOS:\n');
            const projection = docuPipeline.calculateRevenueProjection('realistic');
            console.log(`   Escenario:              Realistic (80% de Chisme Express MX)`);
            console.log(`   Videos por día:         ${projection.dailyVideos}`);
            console.log(`   Videos por mes:         ${projection.monthlyVideos}`);
            console.log(`   Views promedio/video:   ${projection.avgViewsPerVideo.toLocaleString()}`);
            console.log(`   RPM España:             $${projection.rpmSpain}`);
            console.log(`   Ingresos mensuales:     ${projection.formatted.monthly}`);
            console.log(`   Ingresos anuales:       ${projection.formatted.yearly}`);
            console.log('\n');

            console.log('✅ TEST COMPLETADO CON ÉXITO\n');
            process.exit(0);
        } else {
            console.log('❌ PIPELINE FALLÓ\n');
            console.log(`   Error: ${result.error}`);
            console.log('\n');
            process.exit(1);
        }
    } catch (error) {
        console.log('\n');
        console.error('❌ ERROR EN TEST E2E:\n');
        console.error(`   ${error.message}`);
        console.error('\n');
        console.error('Stack trace:');
        console.error(error.stack);
        console.error('\n');
        process.exit(1);
    }
}

// Ejecutar test
testDocuPipeline();
