/**
 * VEO 3.1 Discovery Test
 * Prueba diferentes variantes de nombre de modelo y parámetros
 */

// ✅ Cargar variables de entorno desde .env
require('dotenv').config();

const VEO3Client = require('../../backend/services/veo3/veo3Client');
const logger = require('../../backend/utils/logger');

async function testVEO31Discovery() {
    console.log('\n🔍 VEO 3.1 DISCOVERY TEST\n');

    const client = new VEO3Client();

    // Test prompts cortos para rapidez
    const testPrompt =
        'Ana, una analista deportiva española de 32 años con pelo negro rizado, habla en español de España: "Hola Misters, bienvenidos a Fantasy La Liga." La persona de la imagen de referencia habla en español de España.';
    const testImage =
        'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png';

    const modelsToTest = [
        'veo3.1_fast', // Variante 1: underscore + punto
        'veo3_1_fast', // Variante 2: solo underscore
        'veo-3.1-fast', // Variante 3: guiones + punto
        'veo-3-1-fast', // Variante 4: solo guiones
        'veo3.1', // Variante 5: sin sufijo fast
        'veo-3-1' // Variante 6: según web KIE.ai
    ];

    console.log('📋 Probando modelos:\n');
    const results = [];

    for (const modelName of modelsToTest) {
        console.log(`🧪 Test: ${modelName}`);

        try {
            const startTime = Date.now();

            // Intentar generar video
            const response = await client.generateVideo(testPrompt, {
                model: modelName,
                imageUrl: testImage,
                aspectRatio: '9:16',
                watermark: 'Fantasy La Liga Pro',
                enableTranslation: false
            });

            const duration = Date.now() - startTime;

            if (response.code === 200) {
                console.log(`   ✅ SUCCESS - taskId: ${response.data.taskId}`);
                console.log(`   ⏱️  Duration: ${duration}ms\n`);

                results.push({
                    model: modelName,
                    success: true,
                    taskId: response.data.taskId,
                    duration
                });

                // NO esperar a que complete (solo verificar que aceptó el request)
                break; // Si funciona, usar este
            } else {
                console.log(`   ❌ FAILED - code: ${response.code}, msg: ${response.msg}\n`);
                results.push({
                    model: modelName,
                    success: false,
                    error: response.msg
                });
            }
        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}\n`);
            results.push({
                model: modelName,
                success: false,
                error: error.message
            });
        }
    }

    console.log('\n📊 RESULTADOS:\n');
    console.log('─'.repeat(60));

    results.forEach(result => {
        if (result.success) {
            console.log(`✅ ${result.model.padEnd(20)} - FUNCIONA (taskId: ${result.taskId})`);
        } else {
            console.log(`❌ ${result.model.padEnd(20)} - ${result.error}`);
        }
    });

    console.log('─'.repeat(60));

    const successfulModel = results.find(r => r.success);

    if (successfulModel) {
        console.log(`\n🎉 MODELO CORRECTO: "${successfulModel.model}"\n`);
        console.log('💡 Actualizar .env:');
        console.log(`   VEO3_DEFAULT_MODEL=${successfulModel.model}\n`);

        // Test 2: Verificar soporte multi-imagen
        console.log('🧪 Test 2: Multi-image support (2 imágenes)...\n');

        try {
            const multiImageResponse = await client.generateVideo(testPrompt, {
                model: successfulModel.model,
                imageUrls: [
                    testImage,
                    'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-estudio.jpg'
                ],
                aspectRatio: '9:16',
                enableTranslation: false
            });

            if (multiImageResponse.code === 200) {
                console.log('   ✅ Multi-image soportado (2 imágenes)');
                console.log(`   taskId: ${multiImageResponse.data.taskId}\n`);
            } else {
                console.log('   ⚠️  Multi-image no soportado o rechazado');
                console.log(`   Error: ${multiImageResponse.msg}\n`);
            }
        } catch (error) {
            console.log('   ❌ Multi-image error:', error.message, '\n');
        }

        // Test 3: Verificar si audio es automático
        console.log('🧪 Test 3: Verificar si incluye audio nativo...\n');
        console.log('   ⏳ Esperando generación completa para verificar audio...');

        try {
            const video = await client.waitForCompletion(successfulModel.taskId, 300000);

            console.log(`   ✅ Video completado: ${video.url}`);
            console.log('   📝 Descargar y verificar manualmente si tiene audio\n');

            // Descargar video para análisis
            const outputPath = '/tmp/veo31_test_audio.mp4';
            await client.downloadVideo(video.url, outputPath);

            console.log(`   💾 Video descargado: ${outputPath}`);
            console.log('   🔊 Ejecutar para verificar audio:');
            console.log(
                `      ffprobe -i ${outputPath} -show_streams -select_streams a -loglevel error\n`
            );
        } catch (error) {
            console.log('   ⚠️  No se pudo completar verificación de audio:', error.message, '\n');
        }
    } else {
        console.log('\n❌ NINGÚN MODELO FUNCIONÓ\n');
        console.log('💡 Posibles causas:');
        console.log('   1. VEO 3.1 no disponible aún en API (solo playground)');
        console.log('   2. Nombre del modelo diferente (contactar KIE.ai)');
        console.log('   3. API key sin acceso a VEO 3.1\n');
    }
}

// Ejecutar test
testVEO31Discovery()
    .then(() => {
        console.log('✅ Discovery test completado\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error en discovery test:', error);
        process.exit(1);
    });
