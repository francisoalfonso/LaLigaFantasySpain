#!/usr/bin/env node

/**
 * Test diagnóstico de Bunny.net Upload
 * Identifica el problema exacto del timeout
 */

require('dotenv').config();
const axios = require('axios');

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_CDN_URL = process.env.BUNNY_STREAM_CDN_URL;
const BASE_URL = 'https://video.bunnycdn.com';

// URL de video de prueba (pequeño, público)
const TEST_VIDEO_URL = 'https://tempfile.aiquickdraw.com/s/d6372246-f0d9-49e8-b5c5-f7d7021dc465.mp4';

async function testBunnyUpload() {
    console.log('\n' + '='.repeat(80));
    console.log('🐰 TEST DIAGNÓSTICO: BUNNY.NET UPLOAD');
    console.log('='.repeat(80) + '\n');

    console.log('📋 Configuración:');
    console.log(`   API Key: ${BUNNY_API_KEY ? '✅ Configurada' : '❌ NO configurada'}`);
    console.log(`   Library ID: ${BUNNY_LIBRARY_ID || 'N/A'}`);
    console.log(`   CDN URL: ${BUNNY_CDN_URL || 'N/A'}`);
    console.log(`   Test video: ${TEST_VIDEO_URL}\n`);

    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
        console.error('❌ ERROR: Credenciales Bunny.net faltantes');
        process.exit(1);
    }

    try {
        // PASO 1: Crear video en Bunny.net
        console.log('─'.repeat(80));
        console.log('📹 PASO 1: Crear video en Bunny.net');
        console.log('─'.repeat(80) + '\n');

        const createResponse = await axios.post(
            `${BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos`,
            {
                title: `Test Upload ${Date.now()}`
            },
            {
                headers: {
                    'AccessKey': BUNNY_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const videoId = createResponse.data.guid;
        console.log(`✅ Video creado: ${videoId}`);
        console.log(`   Title: ${createResponse.data.title}`);
        console.log(`   Status inicial: ${createResponse.data.status}\n`);

        // PASO 2: Método fetch desde URL externa
        console.log('─'.repeat(80));
        console.log('📥 PASO 2: Upload con método FETCH desde URL');
        console.log('─'.repeat(80) + '\n');

        try {
            const fetchResponse = await axios.post(
                `${BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/fetch`,
                {
                    url: TEST_VIDEO_URL,
                    headers: {
                        'User-Agent': 'Test-Bot/1.0'
                    }
                },
                {
                    headers: {
                        'AccessKey': BUNNY_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ Fetch iniciado correctamente`);
            console.log(`   Response status: ${fetchResponse.status}`);
            console.log(`   Response data:`, JSON.stringify(fetchResponse.data, null, 2));
        } catch (fetchError) {
            console.error(`❌ ERROR en fetch:`);
            console.error(`   Status: ${fetchError.response?.status}`);
            console.error(`   Data:`, fetchError.response?.data);
            console.error(`   Message: ${fetchError.message}\n`);
        }

        // PASO 3: Monitorear estado cada 3 segundos
        console.log('\n' + '─'.repeat(80));
        console.log('⏳ PASO 3: Monitorear estado del video');
        console.log('─'.repeat(80) + '\n');

        const STATUS_NAMES = {
            0: 'Uploading',
            1: 'Processing',
            2: 'Ready',
            3: 'Failed',
            4: 'AwaitingUpload',
            5: 'AwaitingProcessing'
        };

        let attempts = 0;
        const maxAttempts = 20; // 1 minuto total
        let finalStatus = null;

        while (attempts < maxAttempts) {
            attempts++;

            const statusResponse = await axios.get(
                `${BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
                {
                    headers: {
                        'AccessKey': BUNNY_API_KEY
                    }
                }
            );

            const videoInfo = statusResponse.data;
            const statusName = STATUS_NAMES[videoInfo.status] || `Unknown (${videoInfo.status})`;

            console.log(`[${attempts}/${maxAttempts}] Estado: ${statusName} (${videoInfo.status})`);
            console.log(`         Length: ${videoInfo.length}s`);
            console.log(`         Size: ${videoInfo.storageSize || 0} bytes`);
            console.log(`         Views: ${videoInfo.views}`);

            if (videoInfo.status === 2) {
                finalStatus = videoInfo;
                console.log(`\n✅ Video procesado exitosamente!`);
                break;
            } else if (videoInfo.status === 3) {
                console.log(`\n❌ Video falló en processing`);
                console.log(`   Mensaje: ${videoInfo.statusMessage || 'N/A'}`);
                finalStatus = videoInfo;
                break;
            } else if (videoInfo.status === 4 && attempts > 5) {
                console.log(`\n⚠️  PROBLEMA DETECTADO: Video se quedó en estado 4 (AwaitingUpload)`);
                console.log(`   Esto significa que Bunny.net NO recibió el video desde la URL`);
                console.log(`   Posible causa: El método fetch NO funciona o URL inaccesible`);
                finalStatus = videoInfo;
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // PASO 4: Resumen final
        console.log('\n' + '='.repeat(80));
        console.log('📊 RESUMEN DIAGNÓSTICO');
        console.log('='.repeat(80) + '\n');

        console.log(`Estado final: ${STATUS_NAMES[finalStatus?.status] || 'N/A'} (${finalStatus?.status})`);
        console.log(`Intentos: ${attempts}/${maxAttempts}`);
        console.log(`Video ID: ${videoId}`);
        console.log(`CDN URL: ${BUNNY_CDN_URL}/${videoId}/playlist.m3u8\n`);

        if (finalStatus?.status === 4) {
            console.log('🔍 DIAGNÓSTICO:');
            console.log('   ❌ El método FETCH de Bunny.net NO está funcionando');
            console.log('   ❌ El video se queda en "AwaitingUpload" indefinidamente');
            console.log('   ✅ SOLUCIÓN: Usar método PUT directo en lugar de FETCH\n');

            console.log('💡 ALTERNATIVAS:');
            console.log('   1. Descargar video localmente primero');
            console.log('   2. Hacer PUT directo del buffer a Bunny.net');
            console.log('   3. Evitar método fetch() por completo\n');
        }

        // Cleanup: Borrar video de prueba
        try {
            await axios.delete(
                `${BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
                {
                    headers: {
                        'AccessKey': BUNNY_API_KEY
                    }
                }
            );
            console.log(`🗑️  Video de prueba eliminado: ${videoId}`);
        } catch (deleteError) {
            console.log(`⚠️  No se pudo eliminar video de prueba: ${deleteError.message}`);
        }

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:');
        console.error(`   ${error.message}`);
        if (error.response?.data) {
            console.error(`   Bunny response:`, error.response.data);
        }
        process.exit(1);
    }
}

// Ejecutar test
if (require.main === module) {
    testBunnyUpload();
}

module.exports = { testBunnyUpload };
