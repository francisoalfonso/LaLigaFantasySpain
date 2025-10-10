#!/usr/bin/env node

/**
 * Script para subir imagen de Ana a Supabase Storage
 *
 * Uso:
 *   node scripts/supabase/upload-ana-image.js
 *
 * Requisitos:
 *   - .env.supabase configurado con SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY
 *   - Imagen de Ana en frontend/assets/ana-images/ana-estudio-01.jpeg
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function main() {
    try {
        log('\n🚀 SUBIENDO IMAGEN ANA A SUPABASE STORAGE', 'bright');
        log('='.repeat(60), 'cyan');

        // 1. Verificar configuración
        const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            log('\n❌ Error: Variables de entorno no configuradas', 'red');
            log('   Verifica .env.supabase con SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY', 'red');
            process.exit(1);
        }

        log('\n✅ Configuración Supabase OK', 'green');
        log(`   URL: ${supabaseUrl}`, 'cyan');

        // 2. Inicializar cliente Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);
        log('✅ Cliente Supabase inicializado', 'green');

        // 3. Verificar/Crear bucket 'ana-images'
        log('\n📦 Verificando bucket "ana-images"...', 'cyan');

        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            log(`❌ Error listando buckets: ${listError.message}`, 'red');
            throw listError;
        }

        const bucketExists = buckets.some(b => b.name === 'ana-images');

        if (!bucketExists) {
            log('📦 Creando bucket "ana-images"...', 'yellow');

            const { data: newBucket, error: createError } = await supabase.storage.createBucket('ana-images', {
                public: true, // ✅ Público para que VEO3 pueda acceder
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
            });

            if (createError) {
                log(`❌ Error creando bucket: ${createError.message}`, 'red');
                throw createError;
            }

            log('✅ Bucket "ana-images" creado', 'green');
        } else {
            log('✅ Bucket "ana-images" ya existe', 'green');
        }

        // 4. Leer imagen local
        const imagePath = path.join(__dirname, '../../frontend/assets/ana-images/ana-estudio-01.jpeg');

        if (!fs.existsSync(imagePath)) {
            log(`\n❌ Error: Imagen no encontrada en ${imagePath}`, 'red');
            log('   Ejecuta primero: curl -o frontend/assets/ana-images/ana-estudio-01.jpeg https://i.imgur.com/pO7caqX.jpeg', 'yellow');
            process.exit(1);
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const imageStats = fs.statSync(imagePath);
        log(`\n✅ Imagen cargada: ${(imageStats.size / 1024).toFixed(2)} KB`, 'green');

        // 5. Subir imagen a Supabase Storage
        log('\n📤 Subiendo imagen a Supabase...', 'cyan');

        const fileName = 'ana-estudio-01.jpeg';

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ana-images')
            .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600', // Cache 1 hora
                upsert: true // Sobrescribir si ya existe
            });

        if (uploadError) {
            log(`❌ Error subiendo imagen: ${uploadError.message}`, 'red');
            throw uploadError;
        }

        log('✅ Imagen subida exitosamente', 'green');

        // 6. Obtener URL pública
        const { data: publicUrlData } = supabase.storage
            .from('ana-images')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        log('\n' + '='.repeat(60), 'cyan');
        log('✅ IMAGEN ANA SUBIDA EXITOSAMENTE', 'bright');
        log('='.repeat(60), 'cyan');
        log('\n📋 URL PÚBLICA:', 'cyan');
        log(`   ${publicUrl}`, 'green');
        log('\n🔧 ACTUALIZA TU .env:', 'cyan');
        log(`   ANA_IMAGE_URL=${publicUrl}`, 'yellow');
        log('\n💡 PRÓXIMOS PASOS:', 'cyan');
        log('   1. Copia la URL pública arriba', 'cyan');
        log('   2. Actualiza .env con: ANA_IMAGE_URL=<URL>', 'cyan');
        log('   3. Reinicia el servidor: npm run dev', 'cyan');
        log('   4. Prueba VEO3: npm run veo3:generate-ana\n', 'cyan');

        // 7. Verificar que la imagen es accesible
        log('🔍 Verificando accesibilidad pública...', 'cyan');
        const axios = require('axios');

        try {
            const response = await axios.head(publicUrl);
            if (response.status === 200) {
                log('✅ Imagen accesible públicamente', 'green');
                log(`   Content-Type: ${response.headers['content-type']}`, 'cyan');
                log(`   Content-Length: ${(parseInt(response.headers['content-length']) / 1024).toFixed(2)} KB\n`, 'cyan');
            }
        } catch (error) {
            log('⚠️  No se pudo verificar accesibilidad (pero debería funcionar)', 'yellow');
        }

    } catch (error) {
        log('\n💥 ERROR FATAL', 'red');
        log(error.stack, 'red');
        process.exit(1);
    }
}

main();
