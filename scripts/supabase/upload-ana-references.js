/**
 * Script para subir las imágenes de referencia de Ana Martínez a Supabase Storage
 *
 * Sube 5 imágenes:
 * - ana-peinido2-03.png (cuerpo/outfit)
 * - ana-peinido2-04.png (rostro frontal - Face ID principal)
 * - ana-peinido2-06.png (perfil derecho)
 * - ana-peinido2-07.png (perfil izquierdo)
 * - estudio-FLP.jpg (entorno del estudio)
 *
 * Uso: node scripts/supabase/upload-ana-references.js
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    console.error('   Verifica que .env.supabase esté configurado correctamente');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Bucket de Supabase Storage
const BUCKET_NAME = 'ana-references';

// Imágenes a subir
const IMAGES = [
    {
        localPath: 'docs/presentadores-BASE ANA - NANOBANANA/ana-peinido2-03.png',
        storagePath: 'ana-peinido2-03.png',
        description: 'Cuerpo completo / outfit (polo FLP)',
        role: 'body-outfit'
    },
    {
        localPath: 'docs/presentadores-BASE ANA - NANOBANANA/ana-peinido2-04.png',
        storagePath: 'ana-peinido2-04.png',
        description: 'Rostro frontal (Face ID principal)',
        role: 'face-frontal'
    },
    {
        localPath: 'docs/presentadores-BASE ANA - NANOBANANA/ana-peinido2-06.png',
        storagePath: 'ana-peinido2-06.png',
        description: 'Perfil derecho (volumen lateral)',
        role: 'face-right-profile'
    },
    {
        localPath: 'docs/presentadores-BASE ANA - NANOBANANA/ana-peinido2-07.png',
        storagePath: 'ana-peinido2-07.png',
        description: 'Perfil izquierdo (equilibrio facial)',
        role: 'face-left-profile'
    },
    {
        localPath: 'docs/presentadores-BASE ANA - NANOBANANA/estudio-FLP.jpg',
        storagePath: 'estudio-FLP.jpg',
        description: 'Entorno del estudio (luces neón + pantallas)',
        role: 'environment'
    }
];

async function createBucketIfNotExists() {
    console.log(`\n🗂️  Verificando bucket "${BUCKET_NAME}"...`);

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Error listando buckets:', listError);
        throw listError;
    }

    const bucketExists = buckets.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
        console.log(`📦 Creando bucket "${BUCKET_NAME}"...`);

        const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true, // URLs públicas para Nano Banana
            fileSizeLimit: 10485760, // 10MB máximo por imagen
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
        });

        if (error) {
            console.error('❌ Error creando bucket:', error);
            throw error;
        }

        console.log('✅ Bucket creado exitosamente');
    } else {
        console.log('✅ Bucket ya existe');
    }
}

async function uploadImage(imageConfig) {
    const { localPath, storagePath, description, role } = imageConfig;

    console.log(`\n📤 Subiendo: ${description}`);
    console.log(`   Archivo: ${localPath}`);

    // Verificar que el archivo existe
    const fullPath = path.join(__dirname, '../..', localPath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Archivo no encontrado: ${fullPath}`);
    }

    // Leer archivo
    const fileBuffer = fs.readFileSync(fullPath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`   Tamaño: ${fileSize} MB`);

    // Determinar content type
    const ext = path.extname(localPath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
            contentType: contentType,
            upsert: true // Sobrescribir si ya existe
        });

    if (error) {
        console.error(`❌ Error subiendo ${storagePath}:`, error);
        throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

    console.log(`✅ Subido exitosamente`);
    console.log(`   URL pública: ${urlData.publicUrl}`);

    return {
        role,
        description,
        url: urlData.publicUrl,
        path: storagePath
    };
}

async function main() {
    console.log('🎬 ========================================');
    console.log('   SUBIR REFERENCIAS DE ANA A SUPABASE');
    console.log('🎬 ========================================');
    console.log(`   Proyecto: ${supabaseUrl}`);
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Imágenes: ${IMAGES.length}`);

    try {
        // 1. Crear bucket si no existe
        await createBucketIfNotExists();

        // 2. Subir cada imagen
        const uploadedImages = [];
        for (const imageConfig of IMAGES) {
            const result = await uploadImage(imageConfig);
            uploadedImages.push(result);
        }

        // 3. Generar resumen con URLs
        console.log('\n\n✅ ========================================');
        console.log('   TODAS LAS IMÁGENES SUBIDAS EXITOSAMENTE');
        console.log('✅ ========================================\n');

        console.log('📋 URLs para copiar a .env:\n');

        uploadedImages.forEach((img, index) => {
            console.log(`# ${img.description}`);
            console.log(`ANA_${img.role.toUpperCase().replace(/-/g, '_')}_URL="${img.url}"`);
            console.log('');
        });

        console.log('\n📄 Array para nanoBananaClient.js:\n');
        console.log('const ANA_REFERENCE_IMAGES = [');
        uploadedImages.forEach((img, index) => {
            const comma = index < uploadedImages.length - 1 ? ',' : '';
            console.log(`  "${img.url}"${comma}  // ${img.description}`);
        });
        console.log('];\n');

        console.log('💾 Guardando configuración en archivo...');

        const config = {
            uploaded_at: new Date().toISOString(),
            bucket: BUCKET_NAME,
            total_images: uploadedImages.length,
            images: uploadedImages,
            seed: 12500,
            prompt_strength: 0.8,
            model: 'nano-banana-latest',
            size: '1536x864'
        };

        const configPath = path.join(__dirname, '../../data/ana-references-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        console.log(`✅ Configuración guardada en: ${configPath}`);

        console.log('\n🎯 Próximos pasos:');
        console.log('   1. Copiar las URLs a .env');
        console.log('   2. Actualizar nanoBananaClient.js con el array de URLs');
        console.log('   3. Reiniciar el servidor');
        console.log('   4. Ejecutar test de generación de imágenes\n');

    } catch (error) {
        console.error('\n❌ Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar
main();
