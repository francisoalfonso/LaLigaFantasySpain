/**
 * Test para verificar si ya estamos usando VEO3.1
 * (KIE.ai puede haber actualizado veo3_fast silenciosamente)
 */

require('dotenv').config();

const VEO3Client = require('../../backend/services/veo3/veo3Client');
const logger = require('../../backend/utils/logger');

async function testCurrentVEO3Version() {
    console.log('\n🔍 TEST: ¿Estamos usando VEO3 o VEO3.1?\n');

    const client = new VEO3Client();

    const testPrompt =
        'Ana, una analista deportiva española de 32 años con pelo negro rizado, habla en español de España: "Hola Misters, este es un test rápido de Fantasy La Liga." La persona de la imagen de referencia habla en español de España.';
    const testImage =
        'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png';

    console.log('📹 Generando video de prueba con veo3_fast...\n');

    try {
        const startTime = Date.now();

        // Generar video con modelo actual
        const response = await client.generateVideo(testPrompt, {
            model: 'veo3_fast',
            imageUrl: testImage,
            aspectRatio: '9:16',
            watermark: 'Fantasy La Liga Pro',
            enableTranslation: false
        });

        const requestDuration = Date.now() - startTime;

        if (response.code === 200) {
            console.log(`✅ Video iniciado exitosamente`);
            console.log(`   TaskId: ${response.data.taskId}`);
            console.log(`   Request duration: ${requestDuration}ms\n`);

            // Esperar a que complete
            console.log('⏳ Esperando generación completa (5-6 min)...\n');
            const video = await client.waitForCompletion(response.data.taskId, 600000);

            console.log(`✅ Video completado: ${video.url}\n`);

            // Descargar para análisis
            const outputPath = '/tmp/veo3_version_test.mp4';
            await client.downloadVideo(video.url, outputPath);

            console.log(`💾 Video descargado: ${outputPath}\n`);

            // Analizar audio con FFprobe
            console.log('🔊 Analizando audio...\n');
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execPromise = promisify(exec);

            try {
                const { stdout } = await execPromise(
                    `ffprobe -i "${outputPath}" -show_streams -select_streams a -loglevel error`
                );

                if (stdout && stdout.trim().length > 0) {
                    console.log('✅ EL VIDEO TIENE AUDIO NATIVO\n');
                    console.log('🎉 ¡Esto confirma que estás usando VEO3.1!\n');
                    console.log('Detalles del audio:');
                    console.log(stdout);
                    console.log(
                        '\n📊 CONCLUSIÓN: KIE.ai actualizó veo3_fast a VEO3.1 automáticamente\n'
                    );
                } else {
                    console.log('❌ El video NO tiene audio\n');
                    console.log('📊 CONCLUSIÓN: Aún estás usando VEO3 (sin audio nativo)\n');
                }
            } catch (error) {
                console.log('❌ No se pudo analizar audio (probablemente no tiene)');
                console.log('📊 CONCLUSIÓN: Aún estás usando VEO3 (sin audio nativo)\n');
            }

            // Test 2: Multi-imagen (feature de VEO3.1)
            console.log('\n🧪 Test 2: Multi-imagen (feature VEO3.1)...\n');

            const multiImageResponse = await client.generateVideo(testPrompt, {
                model: 'veo3_fast',
                imageUrls: [
                    testImage,
                    'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-estudio.jpg'
                ],
                aspectRatio: '9:16',
                enableTranslation: false
            });

            if (multiImageResponse.code === 200) {
                console.log('✅ Multi-imagen aceptado por API');
                console.log(`   TaskId: ${multiImageResponse.data.taskId}\n`);
                console.log('📊 Esto sugiere VEO3.1 (VEO3 solo acepta 1 imagen)\n');
            } else {
                console.log('❌ Multi-imagen rechazado');
                console.log(`   Error: ${multiImageResponse.msg}\n`);
                console.log('📊 Esto sugiere VEO3 (sin soporte multi-imagen)\n');
            }

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('📝 RESUMEN:\n');
            console.log('   Video URL:', video.url);
            console.log('   Local path:', outputPath);
            console.log('\n   Verifica manualmente:');
            console.log('   1. Abre el video y reproduce');
            console.log('   2. ¿Ana habla con audio sincronizado?');
            console.log('   3. Si SÍ → VEO3.1 activo ✅');
            console.log('   4. Si NO → VEO3 todavía ❌\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log(`❌ Error generando video: ${response.msg}\n`);
        }
    } catch (error) {
        console.error('❌ Error en test:', error.message);
    }
}

testCurrentVEO3Version()
    .then(() => {
        console.log('✅ Test completado\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
