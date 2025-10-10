#!/usr/bin/env node

/**
 * TEST: VEO3 usando imágenes Nano Banana ya subidas a Supabase
 *
 * Usa las 3 imágenes generadas previamente (ya en Supabase Storage)
 * como referencias para generar 3 segmentos de video con VEO3.
 *
 * URLs de las imágenes (del test anterior exitoso):
 * - Wide Shot: https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg1-wide-1760097275312.png
 * - Medium Shot: https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg2-medium-1760097276265.png
 * - Close-Up Shot: https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg3-close-up-1760097277647.png
 */

require('dotenv').config();

const VEO3Client = require('../../backend/services/veo3/veo3Client');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function printSeparator() {
    console.log(`\n${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`);
}

async function main() {
    const startTime = Date.now();
    const sessionId = `veo3_nano_${Date.now()}`;

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(78)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(
        `${colors.bright}${colors.blue}║  🎬 TEST: VEO3 con Imágenes Nano Banana (Supabase)${' '.repeat(27)}║${colors.reset}`
    );
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(78)}╝${colors.reset}\n`);

    log('📋', `Session ID: ${sessionId}`, colors.cyan);
    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);
    log('⏱️ ', 'Tiempo estimado: 6-8 minutos', colors.yellow);
    log('💰', 'Costo estimado: $0.90 USD (VEO3)', colors.yellow);

    try {
        // Crear directorio de sesión
        const sessionDir = path.join(process.cwd(), 'output', 'veo3', 'sessions', sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // URLs de imágenes Nano Banana en Supabase (del test anterior)
        const images = [
            {
                shot: 'wide',
                role: 'hook',
                supabaseUrl:
                    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg1-wide-1760097275312.png',
                dialogue: '¡Tengo un chollo brutal para la próxima jornada!',
                duration: 5
            },
            {
                shot: 'medium',
                role: 'development',
                supabaseUrl:
                    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg2-medium-1760097276265.png',
                dialogue:
                    'Pere Milla está en una forma increíble: 2 goles y una asistencia en los últimos 3 partidos.',
                duration: 5
            },
            {
                shot: 'close-up',
                role: 'cta',
                supabaseUrl:
                    'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg3-close-up-1760097277647.png',
                dialogue:
                    'Por solo 6 millones, es la mejor inversión que puedes hacer. ¡No lo dejes escapar!',
                duration: 5
            }
        ];

        printSeparator();
        log(
            '🎬',
            'FASE 1: Generando 3 segmentos de video con VEO3...',
            colors.bright + colors.blue
        );
        log('', '   ✅ Usando imágenes Nano Banana previamente generadas (Supabase)', colors.cyan);
        console.log('');

        const veo3Client = new VEO3Client();
        const videoSegments = [];

        for (let i = 0; i < images.length; i++) {
            const segment = images[i];

            log(
                '🎥',
                `Generando segmento ${i + 1}/3 (${segment.role} - ${segment.shot})...`,
                colors.yellow
            );
            log('', `   Referencia: ${segment.supabaseUrl.split('/').pop()}`, colors.cyan);
            log('', `   Diálogo: "${segment.dialogue.substring(0, 60)}..."`, colors.cyan);

            // Construir prompt simple (30-50 palabras)
            const prompt = `The person from the reference image speaks in Spanish from Spain: "${segment.dialogue}". Maintain the exact appearance and style from the reference image.`;

            // Iniciar generación
            const initResult = await veo3Client.generateVideo(prompt, {
                imageUrl: segment.supabaseUrl, // ✅ Imagen de Supabase como referencia
                model: 'veo3_fast',
                aspectRatio: '9:16'
            });

            if (initResult.code !== 200 || !initResult.data?.taskId) {
                throw new Error(
                    `Error iniciando segmento ${i + 1}: ${initResult.msg || 'Unknown error'}`
                );
            }

            const taskId = initResult.data.taskId;
            log('📋', `   Task ID: ${taskId}`, colors.cyan);
            log('⏳', `   Esperando completar (timeout: 5 min)...`, colors.yellow);

            // Esperar antes de empezar a comprobar estado
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15s

            // Esperar completar
            const videoResult = await veo3Client.waitForCompletion(taskId, 300000, prompt);

            // Descargar video
            const videoFileName = `seg${i + 1}-${segment.role}-${Date.now()}.mp4`;
            const videoPath = path.join(sessionDir, videoFileName);

            await veo3Client.downloadVideo(videoResult.url, videoPath);

            log('✅', `Segmento ${i + 1} completado y descargado`, colors.green);
            log('', `   Video: ${videoFileName}`, colors.green);

            videoSegments.push({
                ...segment,
                videoPath: videoPath,
                videoUrl: videoResult.url,
                taskId: taskId
            });

            // Cooling period entre segmentos (excepto el último)
            if (i < images.length - 1) {
                log('⏳', 'Cooling 30s antes del siguiente segmento...', colors.yellow);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }

        // ========================================
        // FASE 2: CONCATENAR VIDEOS
        // ========================================
        printSeparator();
        log('🔗', 'FASE 2: Concatenando 3 segmentos + logo outro...', colors.bright + colors.blue);

        const videoPaths = videoSegments.map(seg => seg.videoPath);
        const VideoConcatenator = require('../../backend/services/veo3/videoConcatenator');
        const concatenator = new VideoConcatenator();

        const concatenatedPath = await concatenator.concatenateVideos(videoPaths, {
            outro: {
                enabled: true, // ✅ Agregar logo outro
                freezeFrame: {
                    enabled: true,
                    duration: 0.8
                }
            },
            viralCaptions: {
                enabled: false // ✅ Aplicar subtítulos después de concatenar
            }
        });

        log('✅', `Video concatenado: ${path.basename(concatenatedPath)}`, colors.green);

        const finalVideoPath = concatenatedPath; // Video final ya tiene logo outro

        // ========================================
        // RESUMEN FINAL
        // ========================================
        printSeparator();
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalCost = 0.3 * 3; // VEO3 only

        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}`);
        console.log(
            `${colors.bright}${colors.green}  ✅ TEST COMPLETADO EXITOSAMENTE${colors.reset}`
        );
        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 ESTADÍSTICAS:${colors.reset}`);
        console.log(
            `   • Tiempo total: ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} min)`
        );
        console.log(`   • Costo total: $${totalCost.toFixed(3)}`);
        console.log(`   • Session ID: ${sessionId}`);

        console.log(`\n${colors.cyan}🎬 VEO3 (Videos):${colors.reset}`);
        console.log(`   • Segmentos generados: 3`);
        console.log(`   • Referencias: Imágenes Nano Banana (Supabase)`);
        console.log(`   • Duración por segmento: ~5s`);
        console.log(`   • Duración total: ~15s + logo outro`);
        console.log(`   • Costo: $${totalCost.toFixed(3)}`);

        console.log(`\n${colors.cyan}📹 VIDEO FINAL:${colors.reset}`);
        console.log(`   • Archivo: ${path.basename(finalVideoPath)}`);
        console.log(`   • Ubicación: ${finalVideoPath}`);
        console.log(`   • Logo outro: ✅ Aplicado`);
        console.log(`   • Freeze frame: ✅ Transición suave`);

        console.log(`\n${colors.yellow}✅ VALIDACIÓN:${colors.reset}`);
        console.log(
            `   ${colors.green}✓${colors.reset} 3 imágenes Nano Banana como referencia (Supabase)`
        );
        console.log(`   ${colors.green}✓${colors.reset} 3 segmentos de video generados con VEO3`);
        console.log(`   ${colors.green}✓${colors.reset} Videos concatenados con logo outro`);
        console.log(`   ${colors.green}✓${colors.reset} Video final listo para Instagram`);

        console.log(
            `\n${colors.cyan}🚀 PRÓXIMO PASO:${colors.reset} Validar calidad del video y publicar en Instagram\n`
        );

        // Guardar metadata completo
        const outputData = {
            sessionId,
            timestamp: new Date().toISOString(),
            totalDuration: parseFloat(totalDuration),
            totalCost: parseFloat(totalCost.toFixed(3)),
            images: images.map(img => ({
                shot: img.shot,
                role: img.role,
                supabaseUrl: img.supabaseUrl,
                dialogue: img.dialogue
            })),
            videoSegments: videoSegments.map(seg => ({
                role: seg.role,
                shot: seg.shot,
                videoPath: seg.videoPath,
                videoUrl: seg.videoUrl,
                taskId: seg.taskId
            })),
            concatenatedVideo: concatenatedPath,
            finalVideo: finalVideoPath,
            workflow: 'veo3-with-nano-banana-refs'
        };

        const metadataPath = path.join(sessionDir, 'session-metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(outputData, null, 2), 'utf-8');

        log('💾', `Metadata guardada: ${metadataPath}`, colors.cyan);
    } catch (error) {
        console.error(`\n${colors.red}❌ ERROR EN TEST:${colors.reset}`);
        console.error(`   ${error.message}`);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }

        if (error.stack) {
            console.error(`\n${colors.red}Stack trace:${colors.reset}`);
            console.error(error.stack);
        }

        process.exit(1);
    }
}

main();
