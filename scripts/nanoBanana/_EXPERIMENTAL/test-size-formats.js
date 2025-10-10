#!/usr/bin/env node

/**
 * Script para probar diferentes formatos de tamaño/ratio en Nano Banana
 * Objetivo: Encontrar el formato correcto para obtener imágenes 9:16 verticales
 */

const axios = require('axios');

const API_KEY = process.env.KIE_AI_API_KEY;
const BASE_URL = 'https://api.kie.ai/api/v1';

// URLs de referencia de Ana desde Supabase
const REFERENCE_URLS = [
    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png',
    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-04.png',
    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-06.png',
    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-07.png',
    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/estudio/estudio-FLP.jpg'
];

const PROMPT =
    'ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, same face with black hair in ponytail (no red tones in hair, pure black hair), red FLP polo shirt, medium shot';

const NEGATIVE_PROMPT = 'no 3D render, no red hair, no blonde hair, no reddish hair tones';

// Formatos a probar
const SIZE_FORMATS_TO_TEST = [
    // Intento 1: aspect_ratio (ya probado, falló)
    { name: 'aspect_ratio_9:16', params: { aspect_ratio: '9:16' } },

    // Intento 2: ratio (alternativa)
    { name: 'ratio_9:16', params: { ratio: '9:16' } },

    // Intento 3: size como string de ratio
    { name: 'size_9:16', params: { size: '9:16' } },

    // Intento 4: width y height separados
    { name: 'width_height_576x1024', params: { width: 576, height: 1024 } },

    // Intento 5: width y height como strings
    { name: 'width_height_strings', params: { width: '576', height: '1024' } },

    // Intento 6: image_width e image_height
    { name: 'image_width_height', params: { image_width: 576, image_height: 1024 } },

    // Intento 7: output_size
    { name: 'output_size', params: { output_size: '576x1024' } },

    // Intento 8: SIN parámetro de tamaño (ver cuál es el default)
    { name: 'no_size_param', params: {} }
];

async function testSizeFormat(format) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Probando formato: ${format.name}`);
    console.log(`📋 Parámetros: ${JSON.stringify(format.params)}`);
    console.log('='.repeat(60));

    try {
        const payload = {
            model: 'google/nano-banana-edit',
            input: {
                prompt: PROMPT,
                negative_prompt: NEGATIVE_PROMPT,
                image_urls: REFERENCE_URLS,
                output_format: 'png',
                seed: 12500,
                prompt_strength: 0.8,
                transparent_background: false,
                n: 1,
                ...format.params // Agregar parámetros específicos del formato
            }
        };

        console.log('\n📤 Enviando request...');

        const createResponse = await axios.post(`${BASE_URL}/playground/createTask`, payload, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log(`✅ Status: ${createResponse.status}`);
        console.log(`📋 Response:`, JSON.stringify(createResponse.data, null, 2));

        if (createResponse.data.code === 200) {
            const taskId = createResponse.data.data.taskId;
            console.log(`\n✅ Tarea creada exitosamente: ${taskId}`);
            console.log(`⏳ Esperando generación (este formato funcionó sin error)...`);

            // Polling simple
            let attempts = 0;
            let imageUrl = null;

            while (!imageUrl && attempts < 30) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 3000));

                const statusResponse = await axios.get(`${BASE_URL}/playground/recordInfo`, {
                    params: { taskId },
                    headers: { Authorization: `Bearer ${API_KEY}` },
                    timeout: 15000
                });

                const state = statusResponse.data?.data?.state;
                console.log(`   Intento ${attempts}/30: ${state}`);

                if (state === 'success') {
                    const result = JSON.parse(statusResponse.data.data.resultJson);
                    imageUrl = result?.resultUrls?.[0];
                    break;
                } else if (state === 'failed') {
                    console.log(`❌ Generación falló:`, statusResponse.data.data.failMsg);
                    break;
                }
            }

            if (imageUrl) {
                console.log(`\n🖼️  IMAGEN GENERADA:`);
                console.log(`   ${imageUrl}`);

                // Intentar detectar dimensiones del nombre del archivo
                const match = imageUrl.match(/(\d+)x(\d+)/);
                if (match) {
                    console.log(`   📐 Dimensiones detectadas en URL: ${match[1]}x${match[2]}`);
                    const ratio = (parseInt(match[1]) / parseInt(match[2])).toFixed(2);
                    console.log(`   📊 Ratio: ${ratio} ${ratio === '0.56' ? '✅ (9:16)' : '❌'}`);
                }

                return {
                    format: format.name,
                    success: true,
                    imageUrl: imageUrl,
                    taskId: taskId
                };
            }
        } else {
            console.log(`❌ Error: ${createResponse.data.msg}`);
            return {
                format: format.name,
                success: false,
                error: createResponse.data.msg
            };
        }
    } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }

        return {
            format: format.name,
            success: false,
            error: error.message
        };
    }
}

async function main() {
    console.log('\n🚀 NANO BANANA - TEST DE FORMATOS DE TAMAÑO\n');
    console.log('Objetivo: Encontrar formato correcto para 9:16 vertical\n');

    if (!API_KEY) {
        console.error('❌ KIE_AI_API_KEY no configurada');
        process.exit(1);
    }

    const results = [];

    for (const format of SIZE_FORMATS_TO_TEST) {
        const result = await testSizeFormat(format);
        results.push(result);

        // Pausa entre tests para evitar rate limiting
        if (results.length < SIZE_FORMATS_TO_TEST.length) {
            console.log('\n⏸️  Pausa 5s antes del siguiente test...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // Resumen final
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log(`${'='.repeat(60)}\n`);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Exitosos: ${successful.length}`);
    successful.forEach(r => {
        console.log(`   - ${r.format}`);
        if (r.imageUrl) {
            console.log(`     URL: ${r.imageUrl}`);
        }
    });

    console.log(`\n❌ Fallidos: ${failed.length}`);
    failed.forEach(r => {
        console.log(`   - ${r.format}: ${r.error}`);
    });

    console.log(`\n${'='.repeat(60)}`);
}

main().catch(console.error);
