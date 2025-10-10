#!/usr/bin/env node

/**
 * Test rápido del prompt sugerido por el usuario para suavizar reflejos en pelo
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.KIE_AI_API_KEY;
const BASE_URL = 'https://api.kie.ai/api/v1';

const payload = {
    model: 'google/nano-banana-edit',
    input: {
        output_format: 'png',
        seed: 12502,
        image_size: '9:16',
        image_urls: [
            'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png',
            'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-04.png',
            'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-06.png',
            'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-07.png',
            'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/estudio/estudio-FLP.jpg'
        ],
        prompt_strength: 0.8,
        prompt: 'ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, head and shoulders close-up, red FLP polo shirt, fully integrated with studio lighting, **subtle and soft red neon rim light only on the right edge of the face**, **no red color cast on hair**, **keep natural medium-blonde hair color**, gentle blue monitor glow on the far side, balanced exposure and neutral white balance, realistic soft shadows, Canon EOS R5 85mm f1.4 lens, shallow depth of field, cinematic film grain, authentic human skin texture, no CGI, no render, no plastic skin, intense direct eye contact, warm confident expression, engaging the viewer',
        negative_prompt:
            'no strong red rim light, no red color bleed on hair, no color shift of blonde hair, no 3D render, no compositing, no mismatched lighting, no HDR, no over-smooth face, no fake reflections, no morphing, no new identity',
        transparent_background: false,
        n: 1
    }
};

async function main() {
    console.log('\n🧪 TEST: Prompt optimizado para pelo rubio sin reflejos rojizos\n');
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    try {
        // 1. Crear task
        console.log('\n📤 Enviando request a KIE.ai...');
        const createResponse = await axios.post(`${BASE_URL}/playground/createTask`, payload, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Response:', JSON.stringify(createResponse.data, null, 2));

        const taskId = createResponse.data?.data?.taskId;
        if (!taskId) {
            console.error('❌ No se recibió taskId');
            process.exit(1);
        }

        console.log(`\n✅ Task creada: ${taskId}`);
        console.log('⏳ Esperando generación (40 intentos × 3s = 120s max)...\n');

        // 2. Polling
        let imageUrl = null;
        let attempts = 0;
        const maxAttempts = 40;

        while (!imageUrl && attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 3000));

            const statusResponse = await axios.get(`${BASE_URL}/playground/recordInfo`, {
                params: { taskId },
                headers: { Authorization: `Bearer ${API_KEY}` },
                timeout: 15000
            });

            const state = statusResponse.data?.data?.state;
            process.stdout.write(`\r   Intento ${attempts}/${maxAttempts}: ${state}     `);

            if (state === 'success') {
                const result = JSON.parse(statusResponse.data.data.resultJson);
                imageUrl = result?.resultUrls?.[0];
                break;
            } else if (state === 'failed') {
                console.error(`\n❌ Generación falló:`, statusResponse.data.data.failMsg);
                process.exit(1);
            }
        }

        if (!imageUrl) {
            console.error('\n❌ Timeout esperando generación');
            process.exit(1);
        }

        console.log('\n\n✅ ¡IMAGEN GENERADA!\n');
        console.log('🖼️  URL:', imageUrl);

        // Extraer dimensiones del nombre del archivo
        const match = imageUrl.match(/(\d+)x(\d+)/);
        if (match) {
            console.log(`📐 Dimensiones: ${match[1]}x${match[2]}`);
            const ratio = (parseInt(match[1]) / parseInt(match[2])).toFixed(2);
            console.log(
                `📊 Ratio: ${ratio} ${ratio === '0.56' ? '✅ (9:16)' : ratio === '0.57' ? '✅ (~9:16)' : '⚠️'}`
            );
        }

        console.log('\n🎯 Checklist de validación:');
        console.log('   [ ] Pelo rubio natural (medium-blonde)');
        console.log('   [ ] Sin reflejos rojizos en pelo');
        console.log('   [ ] Neón rojo solo en borde derecho de cara');
        console.log('   [ ] Formato vertical correcto');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

main();
