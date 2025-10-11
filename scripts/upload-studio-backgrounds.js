#!/usr/bin/env node

/**
 * Script para subir fondos de estudio a Supabase
 *
 * USAGE:
 *   node scripts/upload-studio-backgrounds.js
 *
 * Este script:
 * 1. Lee todas las imágenes de assets/fotos-estudio/
 * 2. Las sube a Supabase bucket 'ana-images'
 * 3. Genera URLs públicas
 * 4. Muestra las URLs para agregar a anaCharacter.js
 */

const { supabaseAdmin } = require('../backend/config/supabase');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/fotos-estudio');
const BUCKET_NAME = 'ana-images';
const SUPABASE_PREFIX = 'studio-backgrounds/'; // Subdirectorio en Supabase

async function uploadStudioBackgrounds() {
    console.log('📸 Subiendo fondos de estudio a Supabase...\n');

    try {
        // Verificar que existe la carpeta
        if (!fs.existsSync(ASSETS_DIR)) {
            console.error(`❌ Error: Carpeta no encontrada: ${ASSETS_DIR}`);
            console.error('   Por favor, copia tus imágenes de estudio a assets/fotos-estudio/');
            process.exit(1);
        }

        // Leer archivos de la carpeta
        const files = fs.readdirSync(ASSETS_DIR).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png'].includes(ext);
        });

        if (files.length === 0) {
            console.error('❌ No hay imágenes en assets/fotos-estudio/');
            console.error('   Formatos aceptados: .jpg, .jpeg, .png');
            process.exit(1);
        }

        console.log(`📂 Encontradas ${files.length} imágenes:`);
        files.forEach((file, i) => {
            console.log(`   ${i + 1}. ${file}`);
        });
        console.log('');

        // Subir cada imagen
        const uploadedUrls = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const localPath = path.join(ASSETS_DIR, file);

            console.log(`⬆️  Subiendo ${i + 1}/${files.length}: ${file}...`);

            // Leer archivo
            const fileBuffer = fs.readFileSync(localPath);
            const fileExt = path.extname(file);

            // Nombre en Supabase: ana-estudio-01.jpg, ana-estudio-02.jpg, etc.
            const supabaseFileName = `${SUPABASE_PREFIX}ana-estudio-${String(i + 1).padStart(2, '0')}${fileExt}`;

            // Subir a Supabase
            const { error: uploadError } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .upload(supabaseFileName, fileBuffer, {
                    contentType: `image/${fileExt === '.png' ? 'png' : 'jpeg'}`,
                    cacheControl: '3600',
                    upsert: true // Sobrescribir si ya existe
                });

            if (uploadError) {
                console.error(`   ❌ Error: ${uploadError.message}`);
                continue;
            }

            // Obtener URL pública
            const { data: publicUrlData } = supabaseAdmin.storage
                .from(BUCKET_NAME)
                .getPublicUrl(supabaseFileName);

            const publicUrl = publicUrlData.publicUrl;
            uploadedUrls.push(publicUrl);

            console.log(`   ✅ Subida exitosa`);
            console.log(`   📍 URL: ${publicUrl}\n`);
        }

        // Resumen
        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ UPLOAD COMPLETO\n');
        console.log(`${uploadedUrls.length}/${files.length} imágenes subidas exitosamente\n`);

        console.log('📋 Agrega estas URLs a backend/config/veo3/anaCharacter.js:\n');
        console.log('const ANA_IMAGE_URLS = {');
        console.log(`    fixed: "${uploadedUrls[0]}",`);
        console.log('');
        console.log('    // ✨ Variantes de estudio para rotación');
        console.log('    studio: [');
        uploadedUrls.forEach(url => {
            console.log(`        "${url}",`);
        });
        console.log('    ],');
        console.log('    // ... resto del código');
        console.log('};');
        console.log('');
        console.log('const ALL_ANA_IMAGES = [');
        console.log('    ...ANA_IMAGE_URLS.studio  // ✨ Usa todas las variantes');
        console.log('];');
        console.log(`\n${'='.repeat(80)}`);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar
uploadStudioBackgrounds();
