#!/usr/bin/env node

/**
 * Test del segundo prompt sugerido por el usuario
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.KIE_AI_API_KEY;
const BASE_URL = 'https://api.kie.ai/api/v1';

const payload = {
    model: 'google/nano-banana-edit',
    input: {
        output_format: "png",
        seed: 12502,
        image_size: "9:16",
        prompt_strength: 0.75,
        prompt: "ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, same face, hairstyle and red FLP polo shirt, integrated with the studio lighting and reflections, very soft red neon glow from the FLP sign behind her, reflecting faintly on the right edge of her face only, no red color cast on hair, maintain natural blonde hair color, balanced neutral white balance, gentle blue monitor reflections on left side, realistic soft shadows and light diffusion, cinematic tone, Canon EOS R5 85mm f1.4 lens, shallow depth of field, film grain, authentic human skin texture, no CGI, no render, no plastic skin, confident professional expression",
        negative_prompt: "no red tint on hair, no red highlights on hair, no strong color reflections, no magenta tone on face, no HDR, no 3D render, no composite lighting mismatch, no overexposed red areas, no fake reflections",
        image_urls: [
            "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png",
            "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-04.png",
            "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-06.png",
            "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-07.png",
            "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/estudio/estudio-FLP.jpg"
        ],
        transparent_background: false,
        n: 1
    }
};

async function main() {
    console.log('\n🧪 TEST: Prompt usuario v2 (sin asteriscos)\n');
    console.log('📋 Config:');
    console.log(`   - image_size: "9:16"`);
    console.log(`   - prompt_strength: 0.75`);
    console.log(`   - seed: 12502`);
    console.log(`   - Orden refs: 4 Ana + 1 estudio (estudio al final)\n`);

    try {
        console.log('📤 Enviando request...');
        const createResponse = await axios.post(
            `${BASE_URL}/playground/createTask`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ Response:', JSON.stringify(createResponse.data, null, 2));

        const taskId = createResponse.data?.data?.taskId;
        if (!taskId) {
            console.error('❌ No taskId recibido');
            process.exit(1);
        }

        console.log(`\n✅ Task: ${taskId}`);
        console.log('⏳ Esperando generación...\n');

        let imageUrl = null;
        let attempts = 0;
        const maxAttempts = 40;

        while (!imageUrl && attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 3000));

            const statusResponse = await axios.get(
                `${BASE_URL}/playground/recordInfo`,
                {
                    params: { taskId },
                    headers: { 'Authorization': `Bearer ${API_KEY}` },
                    timeout: 15000
                }
            );

            const state = statusResponse.data?.data?.state;
            process.stdout.write(`\r   ${attempts}/${maxAttempts}: ${state}     `);

            if (state === 'success') {
                const result = JSON.parse(statusResponse.data.data.resultJson);
                imageUrl = result?.resultUrls?.[0];
                break;
            } else if (state === 'failed') {
                console.error(`\n❌ Falló:`, statusResponse.data.data.failMsg);
                process.exit(1);
            }
        }

        if (!imageUrl) {
            console.error('\n❌ Timeout');
            process.exit(1);
        }

        console.log('\n\n✅ ¡IMAGEN GENERADA!\n');
        console.log('🖼️  URL:', imageUrl);

        const match = imageUrl.match(/(\d+)x(\d+)/);
        if (match) {
            console.log(`📐 Dimensiones: ${match[1]}x${match[2]}`);
            const ratio = (parseInt(match[1]) / parseInt(match[2])).toFixed(2);
            console.log(`📊 Ratio: ${ratio} ${ratio === '0.56' || ratio === '0.57' ? '✅ (9:16)' : '⚠️'}`);
        } else {
            console.log('⚠️  No se detectaron dimensiones en URL');
        }

        console.log('\n🎯 Validar:');
        console.log('   [ ] Formato vertical');
        console.log('   [ ] Pelo rubio sin reflejos rojizos fuertes');
        console.log('   [ ] Neón rojo suave solo en borde derecho');
        console.log('   [ ] Identidad Ana consistente');

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
