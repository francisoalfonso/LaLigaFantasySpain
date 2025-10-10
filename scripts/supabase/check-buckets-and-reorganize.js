#!/usr/bin/env node

/**
 * Script para verificar buckets existentes y reorganizar según nueva estructura
 * Estructura objetivo:
 * - flp/ana/ (4 imágenes de Ana)
 * - flp/estudio/ (1 imagen del estudio)
 * - flp/kits/ (13 camisetas de equipos)
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.supabase' });

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_PROJECT_URL o SUPABASE_SERVICE_ROLE_KEY no están configurados');
    console.error('Verifica tu archivo .env.supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentBuckets() {
    console.log('\n🔍 Verificando buckets existentes...\n');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error al listar buckets:', error);
        return [];
    }

    console.log(`✅ Encontrados ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });

    return buckets;
}

async function listBucketContents(bucketName) {
    console.log(`\n📂 Contenido del bucket "${bucketName}":\n`);

    const { data: files, error } = await supabase
        .storage
        .from(bucketName)
        .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
        });

    if (error) {
        console.error(`❌ Error al listar archivos de "${bucketName}":`, error);
        return [];
    }

    if (files.length === 0) {
        console.log('  (vacío)');
        return [];
    }

    files.forEach(file => {
        console.log(`  - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
    });

    return files;
}

async function createFlpBucket() {
    console.log('\n🪣 Creando bucket "flp" (público)...\n');

    const { data, error } = await supabase.storage.createBucket('flp', {
        public: true,
        fileSizeLimit: 10485760, // 10 MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  El bucket "flp" ya existe');
            return true;
        }
        console.error('❌ Error al crear bucket "flp":', error);
        return false;
    }

    console.log('✅ Bucket "flp" creado exitosamente');
    return true;
}

async function uploadToFlp() {
    console.log('\n📤 Subiendo archivos a estructura flp/...\n');

    const baseDir = 'docs/presentadores-BASE ANA - NANOBANANA';

    // Definir archivos a subir
    const uploads = [
        // Ana images
        { local: `${baseDir}/ana-peinido2-03.png`, remote: 'ana/ana-peinido2-03.png', desc: 'Ana - Cuerpo completo / outfit' },
        { local: `${baseDir}/ana-peinido2-04.png`, remote: 'ana/ana-peinido2-04.png', desc: 'Ana - Rostro frontal' },
        { local: `${baseDir}/ana-peinido2-06.png`, remote: 'ana/ana-peinido2-06.png', desc: 'Ana - Perfil derecho' },
        { local: `${baseDir}/ana-peinido2-07.png`, remote: 'ana/ana-peinido2-07.png', desc: 'Ana - Perfil izquierdo' },
        // Studio
        { local: `${baseDir}/estudio/estudio-FLP.jpg`, remote: 'estudio/estudio-FLP.jpg', desc: 'Estudio FLP' },
        // Kits
        { local: `${baseDir}/kits/Bilbao.png`, remote: 'kits/Bilbao.png', desc: 'Kit Athletic Bilbao' },
        { local: `${baseDir}/kits/Villarreal.png`, remote: 'kits/Villarreal.png', desc: 'Kit Villarreal' },
        { local: `${baseDir}/kits/alaves.png`, remote: 'kits/alaves.png', desc: 'Kit Alavés' },
        { local: `${baseDir}/kits/atletico.png`, remote: 'kits/atletico.png', desc: 'Kit Atlético Madrid' },
        { local: `${baseDir}/kits/betis.png`, remote: 'kits/betis.png', desc: 'Kit Betis' },
        { local: `${baseDir}/kits/celta.png`, remote: 'kits/celta.png', desc: 'Kit Celta' },
        { local: `${baseDir}/kits/espanol.png`, remote: 'kits/espanol.png', desc: 'Kit Español' },
        { local: `${baseDir}/kits/getafe.png`, remote: 'kits/getafe.png', desc: 'Kit Getafe' },
        { local: `${baseDir}/kits/mallorca.png`, remote: 'kits/mallorca.png', desc: 'Kit Mallorca' },
        { local: `${baseDir}/kits/oviedo.png`, remote: 'kits/oviedo.png', desc: 'Kit Oviedo' },
        { local: `${baseDir}/kits/real-sociedad.png`, remote: 'kits/real-sociedad.png', desc: 'Kit Real Sociedad' },
        { local: `${baseDir}/kits/sevilla.png`, remote: 'kits/sevilla.png', desc: 'Kit Sevilla' },
        { local: `${baseDir}/kits/valencia.png`, remote: 'kits/valencia.png', desc: 'Kit Valencia' }
    ];

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (const upload of uploads) {
        const localPath = path.join(process.cwd(), upload.local);

        // Verificar si el archivo existe
        if (!fs.existsSync(localPath)) {
            console.log(`⏭️  Omitido: ${upload.desc} (archivo no encontrado: ${upload.local})`);
            results.skipped.push(upload);
            continue;
        }

        // Leer archivo
        const fileBuffer = fs.readFileSync(localPath);
        const contentType = upload.local.endsWith('.jpg') || upload.local.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png';

        // Subir a Supabase
        const { data, error } = await supabase.storage
            .from('flp')
            .upload(upload.remote, fileBuffer, {
                contentType: contentType,
                upsert: true // Sobrescribir si ya existe
            });

        if (error) {
            console.error(`❌ Error al subir ${upload.desc}:`, error.message);
            results.failed.push(upload);
        } else {
            console.log(`✅ Subido: ${upload.desc} → flp/${upload.remote}`);
            results.success.push(upload);
        }
    }

    console.log(`\n📊 Resultados:`);
    console.log(`  ✅ Exitosos: ${results.success.length}`);
    console.log(`  ❌ Fallidos: ${results.failed.length}`);
    console.log(`  ⏭️  Omitidos: ${results.skipped.length}`);

    return results;
}

async function generateNewConfig(uploadResults) {
    console.log('\n📝 Generando nueva configuración...\n');

    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    const baseUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/flp`;

    const config = {
        updated_at: new Date().toISOString(),
        bucket: 'flp',
        structure: {
            ana: 4,
            estudio: 1,
            kits: 13
        },
        total_images: 18,
        ana_references: [
            {
                role: 'body-outfit',
                description: 'Cuerpo completo / outfit (polo FLP)',
                url: `${baseUrl}/ana/ana-peinido2-03.png`,
                path: 'ana/ana-peinido2-03.png'
            },
            {
                role: 'face-frontal',
                description: 'Rostro frontal (Face ID principal)',
                url: `${baseUrl}/ana/ana-peinido2-04.png`,
                path: 'ana/ana-peinido2-04.png'
            },
            {
                role: 'face-right-profile',
                description: 'Perfil derecho (volumen lateral)',
                url: `${baseUrl}/ana/ana-peinido2-06.png`,
                path: 'ana/ana-peinido2-06.png'
            },
            {
                role: 'face-left-profile',
                description: 'Perfil izquierdo (equilibrio facial)',
                url: `${baseUrl}/ana/ana-peinido2-07.png`,
                path: 'ana/ana-peinido2-07.png'
            }
        ],
        estudio: {
            url: `${baseUrl}/estudio/estudio-FLP.jpg`,
            path: 'estudio/estudio-FLP.jpg',
            description: 'Entorno del estudio (luces neón + pantallas)'
        },
        kits: uploadResults.success
            .filter(u => u.remote.startsWith('kits/'))
            .map(u => ({
                team: path.basename(u.remote, path.extname(u.remote)),
                url: `${baseUrl}/${u.remote}`,
                path: u.remote,
                description: u.desc
            })),
        // Parámetros de generación (CORREGIDOS según pruebas)
        model: 'google/nano-banana-edit', // ✅ Modelo correcto
        seed: 12500,
        prompt_strength: 0.8,
        size: '9:16', // ✅ CRÍTICO: ratio, NO pixels
        output_format: 'png',
        transparent_background: false
    };

    // Guardar configuración
    const configPath = path.join(process.cwd(), 'data/flp-nano-banana-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    console.log(`✅ Configuración guardada en: ${configPath}`);
    console.log(`\n📋 URLs base de Ana (para image_urls):`);
    config.ana_references.forEach((ref, idx) => {
        console.log(`  ${idx + 1}. ${ref.url}`);
    });
    console.log(`  5. ${config.estudio.url} (estudio)`);

    return config;
}

async function main() {
    console.log('🚀 Reorganización de Supabase Storage para Nano Banana\n');
    console.log('═'.repeat(60));

    // 1. Verificar buckets existentes
    const buckets = await checkCurrentBuckets();

    // 2. Listar contenido de buckets existentes
    for (const bucket of buckets) {
        await listBucketContents(bucket.name);
    }

    // 3. Crear bucket "flp" si no existe
    const bucketCreated = await createFlpBucket();
    if (!bucketCreated) {
        console.error('\n❌ No se pudo crear el bucket "flp". Abortando.');
        process.exit(1);
    }

    // 4. Subir archivos a nueva estructura
    const uploadResults = await uploadToFlp();

    // 5. Generar nueva configuración JSON
    const config = await generateNewConfig(uploadResults);

    console.log('\n✅ Reorganización completada exitosamente\n');
    console.log('📌 Próximos pasos:');
    console.log('  1. Actualizar nanoBananaClient.js para usar data/flp-nano-banana-config.json');
    console.log('  2. Probar generación con nueva configuración');
    console.log('  3. (Opcional) Eliminar bucket "ana-references" antiguo si ya no se usa');
}

main().catch(console.error);
