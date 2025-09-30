const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para concatenar los 3 segmentos del video viral de Dani Carvajal
 */

const logger = console;

const videoURLs = [
    'https://tempfile.aiquickdraw.com/p/dfa7d72c91324200ad242b6ba5ae7690_1759240389.mp4', // HOOK
    'https://tempfile.aiquickdraw.com/p/5831e07b2d6b62384fffb1707d1a84e4_1759240397.mp4', // DESARROLLO
    'https://tempfile.aiquickdraw.com/s/64f48a21-8ed8-4b75-86c2-30b075645efc_watermarked.mp4' // CTA
];

const tempDir = path.join(__dirname, '../../temp/veo3');
const outputDir = path.join(__dirname, '../../output/veo3/viral');

// Asegurar que existan los directorios
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function downloadVideo(url, filename) {
    logger.log(`📥 Descargando ${filename}...`);
    const filepath = path.join(tempDir, filename);

    const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            logger.log(`✅ ${filename} descargado`);
            resolve(filepath);
        });
        writer.on('error', reject);
    });
}

async function concatenateVideos(videoPaths) {
    logger.log('🎬 Concatenando videos...');

    // Crear archivo de lista para FFmpeg
    const listFile = path.join(tempDir, 'concat-list.txt');
    const listContent = videoPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(listFile, listContent);

    // Output final
    const outputFile = path.join(outputDir, `ana-viral-carvajal-${Date.now()}.mp4`);

    // Concatenar con FFmpeg (con transiciones crossfade)
    // Para simplificar, usamos concat simple primero
    try {
        execSync(
            `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`,
            { stdio: 'inherit' }
        );

        logger.log(`✅ Video viral generado: ${outputFile}`);
        return outputFile;
    } catch (error) {
        // Si falla con -c copy, intentar con re-encoding
        logger.log('⚠️ Reintentando con re-encoding...');
        execSync(
            `ffmpeg -f concat -safe 0 -i "${listFile}" -c:v libx264 -c:a aac "${outputFile}"`,
            { stdio: 'inherit' }
        );

        logger.log(`✅ Video viral generado: ${outputFile}`);
        return outputFile;
    }
}

async function main() {
    try {
        logger.log('\n🚀 Iniciando concatenación video viral Dani Carvajal...\n');

        // Descargar los 3 videos
        const downloadedPaths = [];
        for (let i = 0; i < videoURLs.length; i++) {
            const filename = `segment-${i + 1}-${Date.now()}.mp4`;
            const filepath = await downloadVideo(videoURLs[i], filename);
            downloadedPaths.push(filepath);
        }

        // Concatenar
        const finalVideo = await concatenateVideos(downloadedPaths);

        logger.log('\n✅ ¡VIDEO VIRAL COMPLETADO!');
        logger.log(`📁 Ubicación: ${finalVideo}`);
        logger.log('\n📊 Detalles:');
        logger.log('- Duración: ~24 segundos');
        logger.log('- Segmentos: 3 (Hook → Desarrollo → CTA)');
        logger.log('- Jugador: Dani Carvajal');
        logger.log('- Estructura: Viral Instagram/TikTok');

        // Limpiar archivos temporales
        logger.log('\n🧹 Limpiando archivos temporales...');
        downloadedPaths.forEach(p => {
            if (fs.existsSync(p)) {
                fs.unlinkSync(p);
            }
        });

        const listFile = path.join(tempDir, 'concat-list.txt');
        if (fs.existsSync(listFile)) {
            fs.unlinkSync(listFile);
        }

        logger.log('✅ Limpieza completada\n');

        // Abrir video
        logger.log('🎬 Abriendo video...');
        execSync(`open "${finalVideo}"`);

    } catch (error) {
        logger.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();