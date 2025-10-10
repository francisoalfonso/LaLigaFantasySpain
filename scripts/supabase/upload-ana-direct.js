#!/usr/bin/env node

/**
 * Subir imagen Ana a Supabase usando REST API directa (sin SDK)
 */

require('dotenv').config({ path: '.env.supabase' });
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function uploadImage() {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('\n🚀 Subiendo imagen Ana a Supabase Storage...\n');

    // 1. Leer imagen
    const imagePath = path.join(__dirname, '../../frontend/assets/ana-images/ana-estudio-01.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);

    console.log(`✅ Imagen cargada: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // 2. Subir usando REST API de Supabase Storage
    const bucketName = 'ana-images';
    const fileName = 'ana-estudio-01.jpeg';
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

    console.log(`📤 Subiendo a: ${uploadUrl}\n`);

    try {
        const response = await axios.post(uploadUrl, imageBuffer, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true' // Sobrescribir si existe
            },
            timeout: 30000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('✅ Imagen subida exitosamente!');

        // 3. Obtener URL pública
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;

        console.log('\n' + '='.repeat(60));
        console.log('✅ ÉXITO!');
        console.log('='.repeat(60));
        console.log('\n📋 URL PÚBLICA:');
        console.log(`   ${publicUrl}`);
        console.log('\n🔧 ACTUALIZA TU .env:');
        console.log(`   ANA_IMAGE_URL=${publicUrl}`);
        console.log('\n');

        // 4. Verificar acceso
        console.log('🔍 Verificando acceso...');
        const checkResponse = await axios.head(publicUrl);
        console.log(`✅ Imagen accesible: ${checkResponse.status}\n`);

        return publicUrl;

    } catch (error) {
        if (error.response?.status === 404) {
            console.log('⚠️  Bucket no existe. Creándolo primero...\n');

            // Crear bucket primero
            const createBucketUrl = `${supabaseUrl}/storage/v1/bucket`;

            try {
                await axios.post(createBucketUrl, {
                    name: bucketName,
                    public: true,
                    file_size_limit: 10485760,
                    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
                }, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });

                console.log('✅ Bucket creado. Reintentando subida...\n');

                // Reintentar subida
                const retryResponse = await axios.post(uploadUrl, imageBuffer, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'image/jpeg',
                        'x-upsert': 'true'
                    },
                    timeout: 30000
                });

                const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;

                console.log('✅ Imagen subida exitosamente!');
                console.log('\n📋 URL PÚBLICA:');
                console.log(`   ${publicUrl}\n`);

                return publicUrl;

            } catch (createError) {
                console.error('❌ Error creando bucket:', createError.message);
                throw createError;
            }
        } else {
            console.error('❌ Error subiendo imagen:', error.response?.data || error.message);
            throw error;
        }
    }
}

uploadImage().catch(error => {
    console.error('\n💥 ERROR FATAL:', error.message);
    process.exit(1);
});
