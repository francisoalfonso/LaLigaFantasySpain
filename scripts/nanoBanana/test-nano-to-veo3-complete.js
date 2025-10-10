#!/usr/bin/env node

/**
 * TEST: Flujo Completo Nano Banana → VEO3
 *
 * Flujo E2E:
 * 1. Generar 3 imágenes Ana con Nano Banana (Wide, Medium, Close-up)
 * 2. Subir imágenes a Supabase Storage (URLs persistentes)
 * 3. Usar imágenes como referencias iniciales en VEO3
 * 4. Generar 3 segmentos de video (5s cada uno)
 * 5. Concatenar videos con logo outro
 * 6. Aplicar subtítulos virales automáticos
 *
 * Tiempo estimado: 8-12 minutos
 * Costo estimado: $1.00 USD (Nano Banana $0.06 + VEO3 $0.90)
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.supabase' });

const nanoBananaVeo3Integrator = require('../../backend/services/veo3/nanoBananaVeo3Integrator');
const veo3Client = require('../../backend/services/veo3/veo3Client');
const videoConcatenator = require('../../backend/services/veo3/videoConcatenator');
const viralCaptionsGenerator = require('../../backend/services/veo3/viralCaptionsGenerator');
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
    const sessionId = `nano_veo3_${Date.now()}`;

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(78)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║  🎬 TEST E2E: Nano Banana → VEO3 → Video Completo${' '.repeat(28)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(78)}╝${colors.reset}\n`);

    log('📋', `Session ID: ${sessionId}`, colors.cyan);
    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);
    log('⏱️ ', 'Tiempo estimado total: 8-12 minutos', colors.yellow);
    log('💰', 'Costo estimado: $1.00 USD', colors.yellow);

    try {
        // ========================================
        // FASE 1: GENERAR IMÁGENES CON NANO BANANA
        // ========================================
        printSeparator();
        log('🎨', 'FASE 1: Generando 3 imágenes Ana con Nano Banana...', colors.bright + colors.blue);
        log('', '   • Wide Shot (hook)', colors.blue);
        log('', '   • Medium Shot (development)', colors.blue);
        log('', '   • Close-Up Shot (CTA)', colors.blue);
        console.log('');

        const imagesResult = await nanoBananaVeo3Integrator.generateImagesForVeo3({
            style: 'professional',
            progression: 'wide-medium-closeup'
        });

        const { images, metadata: imagesMetadata } = imagesResult;

        log('✅', `3 imágenes generadas y subidas a Supabase (${imagesMetadata.duration_seconds}s)`, colors.green);
        log('💰', `Costo Nano Banana: $${imagesMetadata.cost_usd.toFixed(3)}`, colors.green);

        console.log(`\n${colors.cyan}📸 Imágenes procesadas:${colors.reset}`);
        images.forEach((img, idx) => {
            console.log(`   ${idx + 1}. ${img.shot.toUpperCase()}: ${img.supabaseUrl.substring(0, 90)}...`);
        });

        // ========================================
        // FASE 2: GENERAR VIDEOS CON VEO3
        // ========================================
        printSeparator();
        log('🎬', 'FASE 2: Generando 3 segmentos de video con VEO3...', colors.bright + colors.blue);
        log('⏱️ ', 'Tiempo estimado: 5-8 minutos', colors.yellow);
        console.log('');

        // Crear directorio de sesión
        const sessionDir = path.join(process.cwd(), 'output', 'veo3', 'sessions', sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Diálogo para el video (ejemplo: chollo Pere Milla)
        const segments = [
            {
                index: 1,
                role: 'hook',
                dialogue: "¡Tengo un chollo brutal para la próxima jornada!",
                image: images[0], // Wide shot
                duration: 5
            },
            {
                index: 2,
                role: 'development',
                dialogue: "Pere Milla está en una forma increíble: 2 goles y una asistencia en los últimos 3 partidos.",
                image: images[1], // Medium shot
                duration: 5
            },
            {
                index: 3,
                role: 'cta',
                dialogue: "Por solo 6 millones, es la mejor inversión que puedes hacer. ¡No lo dejes escapar!",
                image: images[2], // Close-up shot
                duration: 5
            }
        ];

        const videoSegments = [];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            log('🎥', `Generando segmento ${i + 1}/3 (${segment.role})...`, colors.yellow);
            log('', `   Referencia: ${segment.image.shot} shot (Supabase)`, colors.cyan);
            log('', `   Diálogo: "${segment.dialogue.substring(0, 60)}..."`, colors.cyan);

            // Construir prompt simple (30-50 palabras)
            const prompt = `The person from the reference image speaks in Spanish from Spain: "${segment.dialogue}". Maintain the exact appearance and style from the reference image.`;

            // Iniciar generación
            const initResult = await veo3Client.generateVideo(prompt, {
                imageUrl: segment.image.supabaseUrl, // ✅ Imagen de Supabase como referencia
                model: 'veo3_fast',
                aspectRatio: '9:16'
            });

            if (initResult.code !== 200 || !initResult.data?.taskId) {
                throw new Error(`Error iniciando segmento ${i + 1}: ${initResult.msg || 'Unknown error'}`);
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

            videoSegments.push({
                ...segment,
                videoPath: videoPath,
                videoUrl: videoResult.url,
                taskId: taskId
            });

            // Cooling period entre segmentos (excepto el último)
            if (i < segments.length - 1) {
                log('⏳', 'Cooling 30s antes del siguiente segmento...', colors.yellow);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }

        // ========================================
        // FASE 3: CONCATENAR VIDEOS
        // ========================================
        printSeparator();
        log('🔗', 'FASE 3: Concatenando 3 segmentos + logo outro...', colors.bright + colors.blue);

        const videoPaths = videoSegments.map(seg => seg.videoPath);
        const concatenatedPath = await videoConcatenator.concatenateWithLogo(videoPaths, sessionId);

        log('✅', `Video concatenado: ${concatenatedPath}`, colors.green);

        // ========================================
        // FASE 4: SUBTÍTULOS VIRALES
        // ========================================
        printSeparator();
        log('📝', 'FASE 4: Aplicando subtítulos virales automáticos...', colors.bright + colors.blue);

        const finalVideoPath = await viralCaptionsGenerator.applyViralCaptions(
            concatenatedPath,
            segments.map(s => s.dialogue),
            sessionId
        );

        log('✅', `Video final con subtítulos: ${finalVideoPath}`, colors.green);

        // ========================================
        // RESUMEN FINAL
        // ========================================
        printSeparator();
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalCost = imagesMetadata.cost_usd + (0.30 * 3); // Nano Banana + VEO3

        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}`);
        console.log(`${colors.bright}${colors.green}  ✅ TEST E2E COMPLETADO EXITOSAMENTE${colors.reset}`);
        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 ESTADÍSTICAS GENERALES:${colors.reset}`);
        console.log(`   • Tiempo total: ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} min)`);
        console.log(`   • Costo total: $${totalCost.toFixed(3)}`);
        console.log(`   • Session ID: ${sessionId}`);

        console.log(`\n${colors.cyan}🎨 NANO BANANA (Imágenes):${colors.reset}`);
        console.log(`   • Imágenes generadas: 3`);
        console.log(`   • Formato: 576×1024 (9:16 vertical)`);
        console.log(`   • Costo: $${imagesMetadata.cost_usd.toFixed(3)}`);
        console.log(`   • Tiempo: ${imagesMetadata.duration_seconds}s`);

        console.log(`\n${colors.cyan}🎬 VEO3 (Videos):${colors.reset}`);
        console.log(`   • Segmentos generados: 3`);
        console.log(`   • Duración por segmento: 5s`);
        console.log(`   • Duración total: 15s + logo outro`);
        console.log(`   • Costo estimado: $0.90`);

        console.log(`\n${colors.cyan}📹 VIDEO FINAL:${colors.reset}`);
        console.log(`   • Archivo: ${path.basename(finalVideoPath)}`);
        console.log(`   • Ubicación: ${finalVideoPath}`);
        console.log(`   • Subtítulos: ✅ Virales automáticos`);
        console.log(`   • Logo outro: ✅ Aplicado`);

        console.log(`\n${colors.yellow}✅ VALIDACIÓN COMPLETA:${colors.reset}`);
        console.log(`   ${colors.green}✓${colors.reset} 3 imágenes Ana generadas con Nano Banana`);
        console.log(`   ${colors.green}✓${colors.reset} 3 imágenes subidas a Supabase Storage`);
        console.log(`   ${colors.green}✓${colors.reset} 3 segmentos de video generados con VEO3`);
        console.log(`   ${colors.green}✓${colors.reset} Videos concatenados con logo outro`);
        console.log(`   ${colors.green}✓${colors.reset} Subtítulos virales aplicados`);
        console.log(`   ${colors.green}✓${colors.reset} Video final listo para Instagram`);

        console.log(`\n${colors.cyan}🚀 PRÓXIMO PASO:${colors.reset} Validar calidad del video y publicar en Instagram\n`);

        // Guardar metadata completo
        const outputData = {
            sessionId,
            timestamp: new Date().toISOString(),
            totalDuration: parseFloat(totalDuration),
            totalCost: parseFloat(totalCost.toFixed(3)),
            images: {
                data: images,
                metadata: imagesMetadata
            },
            videoSegments: videoSegments,
            finalVideo: finalVideoPath,
            workflow: 'nano-banana-to-veo3-complete'
        };

        const metadataPath = path.join(sessionDir, 'session-metadata.json');
        fs.writeFileSync(
            metadataPath,
            JSON.stringify(outputData, null, 2),
            'utf-8'
        );

        log('💾', `Metadata guardada: ${metadataPath}`, colors.cyan);

    } catch (error) {
        console.error(`\n${colors.red}❌ ERROR EN TEST E2E:${colors.reset}`);
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
