#!/usr/bin/env node

/**
 * Script V2: Subir fondos de estudio con metadata de postura
 *
 * USAGE:
 *   node scripts/upload-studio-backgrounds-v2.js
 *
 * ESTRUCTURA DE CARPETAS:
 *   assets/fotos-estudio/
 *   ├── 01-sentada-silla/
 *   ├── 02-de-pie/
 *   └── 03-sentada-mesa/
 *
 * Este script:
 * 1. Lee imágenes organizadas por postura
 * 2. Sube a Supabase con metadata (postura + fondo)
 * 3. Genera configuración completa para anaCharacter.js
 */

const { supabaseAdmin } = require('../backend/config/supabase');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/fotos-estudio');
const BUCKET_NAME = 'ana-images';
const SUPABASE_PREFIX = 'studio-backgrounds/';

// Mapeo de carpetas a metadata
const POSTURE_MAPPING = {
    '01-sentada-silla': {
        posture: 'sentada_silla',
        displayName: 'Sentada en silla',
        description: 'Ana sentada en silla junto a la mesa, postura profesional y relajada',
        cameraHints: 'Medium shot from chest up, sitting posture'
    },
    '02-de-pie': {
        posture: 'de_pie',
        displayName: 'De pie',
        description: 'Ana de pie junto a la mesa, postura dinámica y energética',
        cameraHints: 'Medium to full shot, standing posture with dynamic energy'
    },
    '03-sentada-mesa': {
        posture: 'sentada_mesa',
        displayName: 'Sentada en mesa',
        description: 'Ana sentada sobre la mesa, postura casual y cercana',
        cameraHints: 'Medium close-up shot, casual sitting posture on desk'
    }
};

// Detectar tipo de fondo por nombre de archivo
function detectBackgroundType(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('neutro') || lower.includes('neutral')) {
        return { type: 'neutral', displayName: 'Fondo Neutro' };
    }
    if (lower.includes('dramatico') || lower.includes('dramatic')) {
        return { type: 'dramatic', displayName: 'Fondo Dramático' };
    }
    if (lower.includes('tactico') || lower.includes('tactical')) {
        return { type: 'tactical', displayName: 'Fondo Táctico' };
    }
    if (lower.includes('breaking')) {
        return { type: 'breaking', displayName: 'Fondo Breaking News' };
    }
    return { type: 'generic', displayName: 'Fondo Genérico' };
}

async function uploadStudioBackgroundsV2() {
    console.log('📸 Subiendo fondos de estudio con metadata de postura...\n');

    try {
        // Verificar carpeta principal
        if (!fs.existsSync(ASSETS_DIR)) {
            console.error(`❌ Error: Carpeta no encontrada: ${ASSETS_DIR}`);
            console.error('   Crea la carpeta y organiza las imágenes por postura');
            process.exit(1);
        }

        // Leer carpetas de postura
        const posturesFolders = fs.readdirSync(ASSETS_DIR).filter(item => {
            const fullPath = path.join(ASSETS_DIR, item);
            return fs.statSync(fullPath).isDirectory();
        });

        if (posturesFolders.length === 0) {
            console.error('❌ No hay carpetas de postura en assets/fotos-estudio/');
            console.error('   Crea carpetas: 01-sentada-silla, 02-de-pie, 03-sentada-mesa');
            process.exit(1);
        }

        console.log(`📂 Carpetas de postura encontradas: ${posturesFolders.length}`);
        posturesFolders.forEach(folder => {
            const metadata = POSTURE_MAPPING[folder] || { posture: folder, displayName: folder };
            console.log(`   - ${folder} (${metadata.displayName})`);
        });
        console.log('');

        // Array para almacenar todas las imágenes con metadata
        const imagesWithMetadata = [];

        // Procesar cada carpeta de postura
        for (const postureFolder of posturesFolders) {
            const posturePath = path.join(ASSETS_DIR, postureFolder);
            const postureMetadata = POSTURE_MAPPING[postureFolder] || {
                posture: postureFolder,
                displayName: postureFolder,
                description: `Ana en postura: ${postureFolder}`,
                cameraHints: 'Standard medium shot'
            };

            console.log(`\n📁 Procesando: ${postureMetadata.displayName}`);
            console.log(`   ${postureMetadata.description}`);

            // Leer imágenes de esta postura
            const files = fs.readdirSync(posturePath).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png'].includes(ext);
            });

            if (files.length === 0) {
                console.log(`   ⚠️  No hay imágenes en esta carpeta`);
                continue;
            }

            console.log(`   Imágenes encontradas: ${files.length}`);

            // Subir cada imagen
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const localPath = path.join(posturePath, file);
                const backgroundInfo = detectBackgroundType(file);

                console.log(
                    `   ⬆️  ${i + 1}/${files.length}: ${file} (${backgroundInfo.displayName})`
                );

                // Leer archivo
                const fileBuffer = fs.readFileSync(localPath);
                const fileExt = path.extname(file);

                // Nombre único en Supabase
                const supabaseFileName = `${SUPABASE_PREFIX}${postureMetadata.posture}-${backgroundInfo.type}-${Date.now()}${fileExt}`;

                // Subir a Supabase
                const { error: uploadError } = await supabaseAdmin.storage
                    .from(BUCKET_NAME)
                    .upload(supabaseFileName, fileBuffer, {
                        contentType: `image/${fileExt === '.png' ? 'png' : 'jpeg'}`,
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`      ❌ Error: ${uploadError.message}`);
                    continue;
                }

                // Obtener URL pública
                const { data: publicUrlData } = supabaseAdmin.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(supabaseFileName);

                const publicUrl = publicUrlData.publicUrl;

                // Guardar con metadata
                imagesWithMetadata.push({
                    url: publicUrl,
                    posture: postureMetadata.posture,
                    postureDisplay: postureMetadata.displayName,
                    postureDescription: postureMetadata.description,
                    cameraHints: postureMetadata.cameraHints,
                    background: backgroundInfo.type,
                    backgroundDisplay: backgroundInfo.displayName,
                    filename: supabaseFileName
                });

                console.log(`      ✅ Subida exitosa`);
            }
        }

        // Resumen
        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ UPLOAD COMPLETO: ${imagesWithMetadata.length} imágenes subidas\n`);

        // Agrupar por postura para mostrar estadísticas
        const byPosture = imagesWithMetadata.reduce((acc, img) => {
            if (!acc[img.posture]) {
                acc[img.posture] = [];
            }
            acc[img.posture].push(img);
            return acc;
        }, {});

        console.log('📊 Distribución por postura:');
        Object.entries(byPosture).forEach(([posture, images]) => {
            console.log(`   ${images[0].postureDisplay}: ${images.length} imágenes`);
        });

        // Generar código para anaCharacter.js
        console.log(`\n${'='.repeat(80)}`);
        console.log('📋 CÓDIGO PARA backend/config/veo3/anaCharacter.js:\n');

        console.log('// ✨ Pool de imágenes con metadata de postura y fondo');
        console.log('const ANA_IMAGES_POOL = [');
        imagesWithMetadata.forEach((img, i) => {
            console.log(`    {`);
            console.log(`        url: "${img.url}",`);
            console.log(`        posture: "${img.posture}",`);
            console.log(`        postureDisplay: "${img.postureDisplay}",`);
            console.log(`        background: "${img.background}",`);
            console.log(`        cameraHints: "${img.cameraHints}"`);
            console.log(`    }${i < imagesWithMetadata.length - 1 ? ',' : ''}`);
        });
        console.log('];');

        console.log('\n// ✨ Selector inteligente de imagen');
        console.log('function selectAnaImage(options = {}) {');
        console.log('    const { posture, background, contentType } = options;');
        console.log('    ');
        console.log('    // Filtrar por criterios');
        console.log('    let filtered = ANA_IMAGES_POOL;');
        console.log('    if (posture) filtered = filtered.filter(img => img.posture === posture);');
        console.log(
            '    if (background) filtered = filtered.filter(img => img.background === background);'
        );
        console.log('    ');
        console.log('    // Si no hay coincidencias, usar todas');
        console.log('    if (filtered.length === 0) filtered = ANA_IMAGES_POOL;');
        console.log('    ');
        console.log('    // Seleccionar aleatoriamente');
        console.log('    const randomIndex = Math.floor(Math.random() * filtered.length);');
        console.log('    return filtered[randomIndex];');
        console.log('}');

        console.log(`\n${'='.repeat(80)}`);

        // Guardar JSON con metadata
        const metadataFile = path.join(__dirname, '../data/ana-images-metadata.json');
        fs.writeFileSync(metadataFile, JSON.stringify({ images: imagesWithMetadata }, null, 2));
        console.log(`\n💾 Metadata guardada en: data/ana-images-metadata.json`);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar
uploadStudioBackgroundsV2();
