/**
 * Script para eliminar imágenes problemáticas de Ana en Supabase
 *
 * Uso:
 *   node scripts/veo3/delete-problematic-ana-images.js
 *
 * Este script elimina las imágenes de Ana donde está mirando a los lados
 * o tiene expresiones que hacen que los videos se vean extraños.
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');
const logger = require('../../backend/utils/logger');

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Faltan variables de entorno de Supabase');
    console.error(
        '   Verifica que .env.supabase contenga SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Listado de imágenes problemáticas identificadas por el usuario
const PROBLEMATIC_IMAGES = [
    'seg3-outro-1760167077081',
    'seg1-intro-1760188396656',
    'seg1-intro-1760173526109',
    'seg1-intro-1760167019855',
    'seg2-end-1760076971059',
    'seg2-end-1760074735860',
    'ana-medium-seg2-1760087255876',
    'ana-wide-seg1-1760085739287',
    'ana-base-reference-1760083874056',
    'ana-close-up-seg3-1760085741757',
    'ana-close-up-seg3-1760086014725',
    'seg3-outro-1760173697139',
    'seg3-outro-1760180883708'
];

console.log('\\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  🗑️  Eliminación de Imágenes Problemáticas de Ana                           ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\\n');

console.log(`📋 Total de imágenes a eliminar: ${PROBLEMATIC_IMAGES.length}`);
console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\\n`);

async function main() {
    const startTime = Date.now();
    const results = {
        deleted: [],
        notFound: [],
        errors: []
    };

    try {
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('ELIMINANDO IMÁGENES DE SUPABASE STORAGE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        // Primero, listar todos los archivos en el bucket para verificar extensiones
        console.log('📂 Listando archivos en bucket ana-images...');
        const { data: files, error: listError } = await supabaseAdmin.storage
            .from('ana-images')
            .list('video-frames');

        if (listError) {
            throw new Error(`Error listando archivos: ${listError.message}`);
        }

        console.log(`✅ Encontrados ${files.length} archivos en total\\n`);

        // Para cada imagen problemática, buscar su archivo completo con extensión
        for (const imageRef of PROBLEMATIC_IMAGES) {
            console.log(`🔍 Buscando: ${imageRef}...`);

            // Buscar el archivo que coincida con el timestamp (puede ser .png, .jpg, .jpeg)
            const matchingFile = files.find(file => file.name.startsWith(imageRef));

            if (!matchingFile) {
                console.log(`   ⚠️  No encontrado en Supabase`);
                results.notFound.push(imageRef);
                continue;
            }

            const fullPath = `video-frames/${matchingFile.name}`;
            console.log(`   📄 Archivo: ${matchingFile.name}`);

            // Intentar eliminar
            try {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('ana-images')
                    .remove([fullPath]);

                if (deleteError) {
                    console.log(`   ❌ Error eliminando: ${deleteError.message}`);
                    results.errors.push({ ref: imageRef, error: deleteError.message });
                } else {
                    console.log(`   ✅ Eliminado exitosamente`);
                    results.deleted.push(matchingFile.name);

                    logger.info('[DeleteProblematicImages] Imagen eliminada', {
                        reference: imageRef,
                        filename: matchingFile.name,
                        path: fullPath
                    });
                }
            } catch (error) {
                console.log(`   ❌ Excepción: ${error.message}`);
                results.errors.push({ ref: imageRef, error: error.message });
            }

            console.log('');
        }

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(
            '\\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ PROCESO COMPLETADO');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        console.log('📊 RESUMEN:\\n');
        console.log(`✅ Eliminadas exitosamente: ${results.deleted.length}`);
        console.log(`⚠️  No encontradas:          ${results.notFound.length}`);
        console.log(`❌ Errores:                 ${results.errors.length}`);
        console.log(`⏱️  Tiempo total:            ${totalDuration}s\\n`);

        if (results.deleted.length > 0) {
            console.log('✅ ARCHIVOS ELIMINADOS:');
            results.deleted.forEach((filename, idx) => {
                console.log(`   ${idx + 1}. ${filename}`);
            });
            console.log('');
        }

        if (results.notFound.length > 0) {
            console.log('⚠️  NO ENCONTRADOS:');
            results.notFound.forEach((ref, idx) => {
                console.log(`   ${idx + 1}. ${ref}`);
            });
            console.log('');
        }

        if (results.errors.length > 0) {
            console.log('❌ ERRORES:');
            results.errors.forEach((item, idx) => {
                console.log(`   ${idx + 1}. ${item.ref}: ${item.error}`);
            });
            console.log('');
        }

        console.log('💡 PRÓXIMOS PASOS:');
        console.log(`   1. Verificar que las imágenes fueron eliminadas`);
        console.log(`   2. Generar nuevos videos para validar que ya no aparecen`);
        console.log(`   3. Si hay más imágenes problemáticas, añadirlas al script\\n`);

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\\n'
        );

        process.exit(results.errors.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('\\n❌ ERROR CRÍTICO:', error.message);
        console.error('\\nStack trace:', error.stack);
        process.exit(1);
    }
}

main();
