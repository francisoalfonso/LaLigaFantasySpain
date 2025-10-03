/**
 * Script para generar video del logo outro (1.5s)
 * Crea video simple con fondo negro y logo blanco usando FFmpeg
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const LOGO_SVG_PATH = path.join(__dirname, '../../backend/assets/logos/fantasy-laliga-logo.svg');
const OUTPUT_DIR = path.join(__dirname, '../../output/veo3');
const LOGO_VIDEO_PATH = path.join(OUTPUT_DIR, 'logo-static.mp4');

async function generateLogoOutro() {
    console.log('================================================================================');
    console.log('🎬 GENERANDO VIDEO LOGO OUTRO');
    console.log('================================================================================\n');

    try {
        // Verificar que existe el SVG
        if (!fs.existsSync(LOGO_SVG_PATH)) {
            throw new Error(`Logo SVG no encontrado: ${LOGO_SVG_PATH}`);
        }

        console.log('📋 Configuración:');
        console.log(`   Logo SVG: ${LOGO_SVG_PATH}`);
        console.log(`   Duración: 1.5 segundos`);
        console.log(`   Resolución: 1080x1920 (9:16)`);
        console.log(`   Fondo: Negro (#000000)`);
        console.log(`   Output: ${LOGO_VIDEO_PATH}\n`);

        // Crear video directo con FFmpeg (fondo negro + logo SVG overlay)
        console.log('⏳ Generando video MP4 con logo...');

        await new Promise((resolve, reject) => {
            ffmpeg()
                // Input 1: Video negro de fondo (generado on-the-fly)
                .input('color=black:s=1080x1920:d=1.5:r=30')
                .inputFormat('lavfi')
                // Input 2: Logo SVG
                .input(LOGO_SVG_PATH)
                // Complex filter: overlay logo en el centro
                .complexFilter([
                    // Escalar logo a 600px de ancho máximo manteniendo aspect ratio
                    '[1:v]scale=600:-1:force_original_aspect_ratio=decrease[logo]',
                    // Overlay logo en el centro del video negro
                    '[0:v][logo]overlay=(W-w)/2:(H-h)/2:shortest=1[out]'
                ], 'out')
                // Output options
                .outputOptions([
                    '-c:v libx264',      // Codec H.264
                    '-pix_fmt yuv420p',  // Pixel format compatible
                    '-r 30',             // 30 FPS
                    '-b:v 2M',           // Bitrate 2Mbps
                    '-preset fast',      // Preset rápido
                    '-t 1.5'             // Duración exacta 1.5s
                ])
                // No audio
                .noAudio()
                // Output
                .output(LOGO_VIDEO_PATH)
                // Sobrescribir si existe
                .on('start', (cmd) => {
                    console.log(`   FFmpeg comando: ${cmd.substring(0, 100)}...`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r   Progreso: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    console.log('\n✅ Video logo generado exitosamente\n');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('\n❌ Error generando video:', err.message);
                    reject(err);
                })
                .run();
        });

        // Verificar video final
        const stats = fs.statSync(LOGO_VIDEO_PATH);
        console.log('================================================================================');
        console.log('✅ LOGO OUTRO GENERADO EXITOSAMENTE');
        console.log('================================================================================\n');
        console.log('📊 Información del archivo:');
        console.log(`   Ruta: ${LOGO_VIDEO_PATH}`);
        console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Duración: 1.5 segundos`);
        console.log(`   Resolución: 1080x1920 (9:16)\n`);
        console.log('🎯 El logo outro está listo para ser usado en concatenación de videos.');
        console.log('   Se agregará automáticamente al final de todos los videos multi-segmento.\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

// Ejecutar
generateLogoOutro();
