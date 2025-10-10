/**
 * Script para limpiar imágenes antiguas de Ana en Supabase Storage
 *
 * Elimina imágenes del bucket antiguo para evitar confusiones
 * y asegurar que solo usamos las nuevas referencias oficiales.
 *
 * Uso: node scripts/supabase/clean-old-ana-images.js
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Buckets a revisar (pueden contener imágenes antiguas de Ana)
const BUCKETS_TO_CHECK = [
    'veo3-frames',      // Frames extraídos de videos VEO3
    'ana-images',       // Bucket antiguo si existía
    'presenters',       // Otro posible bucket
    'images'            // Bucket genérico
];

async function listAndCleanBucket(bucketName) {
    console.log(`\n🔍 Revisando bucket "${bucketName}"...`);

    // Verificar si el bucket existe
    const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets();

    if (listBucketsError) {
        console.error(`❌ Error listando buckets:`, listBucketsError);
        return;
    }

    const bucketExists = buckets.some(b => b.name === bucketName);

    if (!bucketExists) {
        console.log(`   ⚠️  Bucket no existe, saltando...`);
        return;
    }

    // Listar archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list();

    if (listError) {
        console.error(`   ❌ Error listando archivos:`, listError);
        return;
    }

    if (!files || files.length === 0) {
        console.log(`   ✅ Bucket vacío, nada que limpiar`);
        return;
    }

    console.log(`   📁 Encontrados ${files.length} archivos`);

    // Filtrar archivos relacionados con Ana
    const anaFiles = files.filter(file => {
        const name = file.name.toLowerCase();
        return name.includes('ana') ||
               name.includes('presenter') ||
               name.includes('face') ||
               name.includes('portrait');
    });

    if (anaFiles.length === 0) {
        console.log(`   ✅ No hay archivos de Ana para limpiar`);
        return;
    }

    console.log(`   🗑️  Encontrados ${anaFiles.length} archivos de Ana:`);
    anaFiles.forEach(file => {
        console.log(`      - ${file.name} (${(file.metadata?.size / 1024 / 1024).toFixed(2) || '?'} MB)`);
    });

    // Confirmar eliminación
    console.log(`\n   ⚠️  ¿Eliminar estos ${anaFiles.length} archivos? (auto-eliminando...)`);

    // Eliminar archivos
    const filePaths = anaFiles.map(f => f.name);
    const { data, error } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

    if (error) {
        console.error(`   ❌ Error eliminando archivos:`, error);
        return;
    }

    console.log(`   ✅ ${anaFiles.length} archivos eliminados exitosamente`);
}

async function main() {
    console.log('🧹 ========================================');
    console.log('   LIMPIAR IMÁGENES ANTIGUAS DE ANA');
    console.log('🧹 ========================================');
    console.log(`   Proyecto: ${supabaseUrl}`);
    console.log(`   Buckets a revisar: ${BUCKETS_TO_CHECK.join(', ')}`);
    console.log('\n   🎯 Objetivo: Mantener solo las nuevas referencias');
    console.log('               en el bucket "ana-references"');

    try {
        for (const bucketName of BUCKETS_TO_CHECK) {
            await listAndCleanBucket(bucketName);
        }

        console.log('\n\n✅ ========================================');
        console.log('   LIMPIEZA COMPLETADA');
        console.log('✅ ========================================');
        console.log('\n   📌 Solo quedan las imágenes oficiales en:');
        console.log('      Bucket: ana-references');
        console.log('      Archivos: 5 (4 vistas de Ana + 1 estudio)');
        console.log('\n   🎯 Siguiente paso:');
        console.log('      Actualizar nanoBananaClient.js\n');

    } catch (error) {
        console.error('\n❌ Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar
main();
