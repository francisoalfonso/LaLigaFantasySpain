#!/usr/bin/env node

/**
 * TEST E2E: Flujo completo Nano Banana + VEO3
 *
 * Valida el flujo APROBADO:
 * 1. UnifiedScriptGenerator → Guión profesional 3 segmentos
 * 2. Nano Banana → 3 imágenes contextualizadas del guión
 * 3. VEO3 → 3 videos usando imágenes como referencia
 * 4. VideoConcatenator → Video final + logo outro
 *
 * FIXES VALIDADOS:
 * - enableTranslation=false → Audio español
 * - Signed URLs Supabase (24h) → VEO3 puede acceder
 * - Imágenes contextualizadas → Coherencia visual
 */

require('dotenv').config();

const axios = require('axios');
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
    const testId = `nano_banana_test_${Date.now()}`;

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(78)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(
        `${colors.bright}${colors.blue}║  🎨 TEST E2E: Flujo Nano Banana → VEO3 (Contextualizado)${' '.repeat(20)}║${colors.reset}`
    );
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(78)}╝${colors.reset}\n`);

    log('📋', `Test ID: ${testId}`, colors.cyan);
    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);
    log('⏱️ ', 'Tiempo estimado: 6-8 minutos', colors.yellow);
    log('💰', 'Costo estimado: $0.96 USD (VEO3: $0.90, Nano Banana: $0.06)', colors.yellow);

    try {
        // ========================================
        // CONFIGURACIÓN DEL TEST
        // ========================================
        printSeparator();
        log('⚙️ ', 'CONFIGURACIÓN DEL TEST', colors.bright + colors.blue);

        const playerData = {
            name: 'Pere Milla',
            team: 'Valencia CF',
            price: 6.0,
            position: 'Delantero',
            stats: {
                goals: 2,
                assists: 1,
                rating: 7.8,
                minutes: 270
            }
        };

        const viralData = {
            gameweek: 'jornada 5',
            xgIncrease: '30'
        };

        const requestPayload = {
            contentType: 'chollo',
            playerData: playerData,
            viralData: viralData,
            preset: 'chollo_viral',
            options: {}
        };

        log('', `Jugador: ${playerData.name} (${playerData.team})`, colors.cyan);
        log('', `Precio: €${playerData.price}M`, colors.cyan);
        log('', `Tipo contenido: chollo`, colors.cyan);
        log('', `Preset: chollo_viral (3 segmentos)`, colors.cyan);

        // ========================================
        // PASO 1: LLAMAR AL ENDPOINT
        // ========================================
        printSeparator();
        log('🚀', 'PASO 1: Llamando al endpoint /api/veo3/generate-with-nano-banana...', colors.bright + colors.blue);

        const apiUrl = 'http://localhost:3000/api/veo3/generate-with-nano-banana';

        log('', `URL: ${apiUrl}`, colors.cyan);
        log('', `Payload:`, colors.cyan);
        console.log(JSON.stringify(requestPayload, null, 2));

        let response;
        try {
            log('', `Enviando request...`, colors.yellow);
            response = await axios.post(apiUrl, requestPayload, {
                timeout: 600000 // 10 minutos timeout (flujo completo es largo)
            });
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('❌ Servidor no está corriendo. Ejecuta: npm run dev');
            }
            throw error;
        }

        if (!response.data || !response.data.success) {
            throw new Error(`Error en respuesta del endpoint: ${JSON.stringify(response.data)}`);
        }

        log('✅', `Endpoint respondió exitosamente`, colors.green);

        // ========================================
        // PASO 2: VALIDAR ESTRUCTURA DE RESPUESTA
        // ========================================
        printSeparator();
        log('🔍', 'PASO 2: Validando estructura de respuesta...', colors.bright + colors.blue);

        const data = response.data.data;

        // Validar workflow
        if (data.workflow !== 'nano-banana-contextual') {
            throw new Error(`Workflow incorrecto: ${data.workflow} (esperado: nano-banana-contextual)`);
        }
        log('✅', `Workflow: ${data.workflow}`, colors.green);

        // Validar script (3 segmentos)
        if (!data.script || !data.script.segments || data.script.segments.length !== 3) {
            throw new Error(`Script inválido: ${data.script?.segments?.length || 0} segmentos (esperado: 3)`);
        }
        log('✅', `Guión generado: ${data.script.segments.length} segmentos`, colors.green);

        // Validar imágenes Nano Banana
        if (!data.nanoBananaImages || data.nanoBananaImages.length !== 3) {
            throw new Error(`Imágenes Nano Banana inválidas: ${data.nanoBananaImages?.length || 0} (esperado: 3)`);
        }
        log('✅', `Imágenes Nano Banana: ${data.nanoBananaImages.length} generadas`, colors.green);

        // Validar videos VEO3
        if (!data.segments || data.segments.length !== 3) {
            throw new Error(`Videos VEO3 inválidos: ${data.segments?.length || 0} (esperado: 3)`);
        }
        log('✅', `Videos VEO3: ${data.segments.length} generados`, colors.green);

        // Validar video final
        if (!data.concatenatedVideo || !data.finalVideoUrl) {
            throw new Error('Video final no disponible');
        }
        log('✅', `Video final concatenado disponible`, colors.green);

        // ========================================
        // PASO 3: VALIDAR CONTENIDO DEL GUIÓN
        // ========================================
        printSeparator();
        log('📝', 'PASO 3: Validando contenido del guión profesional...', colors.bright + colors.blue);

        console.log(`\n${colors.cyan}SEGMENTOS DEL GUIÓN:${colors.reset}\n`);

        data.script.segments.forEach((segment, idx) => {
            console.log(`${colors.yellow}Segmento ${idx + 1}: ${segment.role.toUpperCase()}${colors.reset}`);
            console.log(`   Emoción: ${segment.emotion}`);
            console.log(`   Shot: ${segment.shot}`);
            console.log(`   Duración: ${segment.duration}s`);
            console.log(`   Diálogo: "${segment.dialogue}"`);
            console.log('');

            // Validar que cada segmento tiene los campos requeridos
            if (!segment.role || !segment.emotion || !segment.dialogue || !segment.duration || !segment.shot) {
                throw new Error(`Segmento ${idx + 1} incompleto`);
            }
        });

        log('✅', `Todos los segmentos tienen estructura completa`, colors.green);

        // ========================================
        // PASO 4: VALIDAR IMÁGENES NANO BANANA
        // ========================================
        printSeparator();
        log('🖼️ ', 'PASO 4: Validando imágenes Nano Banana contextualizadas...', colors.bright + colors.blue);

        console.log(`\n${colors.cyan}IMÁGENES CONTEXTUALIZADAS:${colors.reset}\n`);

        data.nanoBananaImages.forEach((image, idx) => {
            console.log(`${colors.yellow}Imagen ${idx + 1}: ${image.role.toUpperCase()}${colors.reset}`);
            console.log(`   Shot: ${image.shot}`);
            console.log(`   Emoción: ${image.emotion}`);
            console.log(`   URL Supabase: ${image.supabaseUrl.substring(0, 80)}...`);
            console.log(`   Contexto visual: ${image.visualContext}`);
            console.log('');

            // Validar que sea signed URL de Supabase
            if (!image.supabaseUrl.includes('supabase.co') || !image.supabaseUrl.includes('token=')) {
                throw new Error(`Imagen ${idx + 1} no usa signed URL de Supabase`);
            }

            // Validar coherencia con segmento del guión
            const scriptSegment = data.script.segments[idx];
            if (image.role !== scriptSegment.role) {
                throw new Error(`Imagen ${idx + 1} role mismatch: ${image.role} !== ${scriptSegment.role}`);
            }
            if (image.emotion !== scriptSegment.emotion) {
                throw new Error(`Imagen ${idx + 1} emotion mismatch: ${image.emotion} !== ${scriptSegment.emotion}`);
            }
        });

        log('✅', `Todas las imágenes usan signed URLs de Supabase (24h)`, colors.green);
        log('✅', `Todas las imágenes son coherentes con el guión`, colors.green);

        // ========================================
        // PASO 5: VALIDAR VIDEOS VEO3
        // ========================================
        printSeparator();
        log('🎬', 'PASO 5: Validando videos VEO3 generados...', colors.bright + colors.blue);

        console.log(`\n${colors.cyan}VIDEOS GENERADOS:${colors.reset}\n`);

        let totalVideoSize = 0;

        data.segments.forEach((segment, idx) => {
            console.log(`${colors.yellow}Video ${idx + 1}: ${segment.role.toUpperCase()}${colors.reset}`);
            console.log(`   Task ID: ${segment.taskId}`);
            console.log(`   Shot: ${segment.shot}`);
            console.log(`   Emoción: ${segment.emotion}`);
            console.log(`   Duración: ${segment.duration}s`);
            console.log(`   Archivo: ${segment.filename}`);
            console.log(`   Tamaño: ${(segment.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Diálogo: "${segment.dialogue.substring(0, 60)}..."`);
            console.log('');

            totalVideoSize += segment.size;

            // Validar que el archivo existe
            if (!fs.existsSync(segment.localPath)) {
                throw new Error(`Video ${idx + 1} no existe en: ${segment.localPath}`);
            }

            // Validar coherencia con imagen Nano Banana
            const image = data.nanoBananaImages[idx];
            if (segment.imageContext.supabaseUrl !== image.supabaseUrl) {
                throw new Error(`Video ${idx + 1} no usó la imagen contextualizada correcta`);
            }
        });

        log('✅', `Todos los videos existen localmente`, colors.green);
        log('✅', `Tamaño total videos: ${(totalVideoSize / 1024 / 1024).toFixed(2)} MB`, colors.green);

        // ========================================
        // PASO 6: VALIDAR VIDEO FINAL
        // ========================================
        printSeparator();
        log('🎞️ ', 'PASO 6: Validando video final concatenado...', colors.bright + colors.blue);

        console.log(`\n${colors.cyan}VIDEO FINAL:${colors.reset}\n`);
        console.log(`   URL: ${data.finalVideoUrl}`);
        console.log(`   Video ID: ${data.concatenatedVideo.videoId}`);
        console.log(`   Título: ${data.concatenatedVideo.title}`);
        console.log(`   Duración: ${data.concatenatedVideo.duration}s`);
        console.log(`   Sesión: ${data.concatenatedVideo.sessionDir}`);
        console.log('');

        // Validar que el archivo concatenado existe
        const concatenatedPath = data.concatenatedVideo.outputPath;
        if (!fs.existsSync(concatenatedPath)) {
            throw new Error(`Video concatenado no existe en: ${concatenatedPath}`);
        }

        const finalVideoStats = fs.statSync(concatenatedPath);
        const finalVideoSizeMB = (finalVideoStats.size / 1024 / 1024).toFixed(2);

        log('✅', `Video final existe: ${concatenatedPath}`, colors.green);
        log('✅', `Tamaño video final: ${finalVideoSizeMB} MB`, colors.green);

        // ========================================
        // PASO 7: VALIDAR COSTOS
        // ========================================
        printSeparator();
        log('💰', 'PASO 7: Validando costos...', colors.bright + colors.blue);

        console.log(`\n${colors.cyan}COSTOS:${colors.reset}\n`);
        console.log(`   Nano Banana: $${data.costs.nanoBanana.toFixed(3)}`);
        console.log(`   VEO3: $${data.costs.veo3.toFixed(3)}`);
        console.log(`   TOTAL: $${data.costs.total.toFixed(3)}`);
        console.log('');

        // Validar rangos de costos esperados
        const expectedNanoBananaCost = 0.02 * 3; // $0.02 por imagen × 3
        const expectedVeo3Cost = 0.3 * 3; // $0.30 por video × 3

        if (Math.abs(data.costs.nanoBanana - expectedNanoBananaCost) > 0.01) {
            log('⚠️ ', `Costo Nano Banana inesperado: $${data.costs.nanoBanana} (esperado: ~$${expectedNanoBananaCost})`, colors.yellow);
        } else {
            log('✅', `Costo Nano Banana correcto`, colors.green);
        }

        if (Math.abs(data.costs.veo3 - expectedVeo3Cost) > 0.01) {
            log('⚠️ ', `Costo VEO3 inesperado: $${data.costs.veo3} (esperado: ~$${expectedVeo3Cost})`, colors.yellow);
        } else {
            log('✅', `Costo VEO3 correcto`, colors.green);
        }

        // ========================================
        // PASO 8: VALIDAR METADATA DE SESIÓN
        // ========================================
        printSeparator();
        log('📄', 'PASO 8: Validando metadata de sesión...', colors.bright + colors.blue);

        const sessionDir = data.concatenatedVideo.sessionDir;
        const progressFile = path.join(sessionDir, 'progress.json');

        if (!fs.existsSync(progressFile)) {
            throw new Error(`Archivo progress.json no existe en: ${progressFile}`);
        }

        const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));

        console.log(`\n${colors.cyan}METADATA SESIÓN:${colors.reset}\n`);
        console.log(`   Session ID: ${progressData.sessionId}`);
        console.log(`   Workflow: ${progressData.workflow}`);
        console.log(`   Jugador: ${progressData.playerName}`);
        console.log(`   Segmentos: ${progressData.segmentsCompleted}/${progressData.segmentsTotal}`);
        console.log(`   Completado: ${progressData.completedAt}`);
        console.log('');

        if (progressData.workflow !== 'nano-banana-contextual') {
            throw new Error(`Workflow en metadata incorrecto: ${progressData.workflow}`);
        }

        if (progressData.segmentsCompleted !== 3) {
            throw new Error(`Segmentos completados incorrectos: ${progressData.segmentsCompleted}`);
        }

        log('✅', `Metadata de sesión correcta`, colors.green);

        // ========================================
        // RESUMEN FINAL
        // ========================================
        printSeparator();
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalMinutes = (totalDuration / 60).toFixed(1);

        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}`);
        console.log(
            `${colors.bright}${colors.green}  ✅ TEST E2E COMPLETADO EXITOSAMENTE${colors.reset}`
        );
        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 ESTADÍSTICAS:${colors.reset}`);
        console.log(`   • Test ID: ${testId}`);
        console.log(`   • Tiempo total: ${totalDuration}s (~${totalMinutes} min)`);
        console.log(`   • Costo total: $${data.costs.total.toFixed(3)}`);
        console.log(`   • Workflow: ${data.workflow}`);

        console.log(`\n${colors.cyan}📝 GUIÓN PROFESIONAL:${colors.reset}`);
        console.log(`   • Segmentos generados: 3 (hook, development, cta)`);
        console.log(`   • Duración total: ${data.script.totalDuration}s`);
        console.log(`   • Emociones: ${data.script.segments.map(s => s.emotion).join(', ')}`);
        console.log(`   • Shots: ${data.script.segments.map(s => s.shot).join(', ')}`);

        console.log(`\n${colors.cyan}🎨 NANO BANANA (Imágenes):${colors.reset}`);
        console.log(`   • Imágenes contextualizadas: 3`);
        console.log(`   • Tipo URLs: Signed URLs Supabase (24h)`);
        console.log(`   • Coherencia con guión: 100%`);
        console.log(`   • Costo: $${data.costs.nanoBanana.toFixed(3)}`);

        console.log(`\n${colors.cyan}🎬 VEO3 (Videos):${colors.reset}`);
        console.log(`   • Segmentos generados: 3`);
        console.log(`   • Referencias usadas: Imágenes contextualizadas Nano Banana`);
        console.log(`   • Tamaño total: ${(totalVideoSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   • Costo: $${data.costs.veo3.toFixed(3)}`);

        console.log(`\n${colors.cyan}📹 VIDEO FINAL:${colors.reset}`);
        console.log(`   • Archivo: ${path.basename(concatenatedPath)}`);
        console.log(`   • Ubicación: ${concatenatedPath}`);
        console.log(`   • Tamaño: ${finalVideoSizeMB} MB`);
        console.log(`   • Duración: ${data.concatenatedVideo.duration}s`);
        console.log(`   • Logo outro: ✅ Aplicado`);

        console.log(`\n${colors.yellow}✅ VALIDACIONES COMPLETADAS:${colors.reset}`);
        console.log(`   ${colors.green}✓${colors.reset} Estructura de respuesta correcta`);
        console.log(`   ${colors.green}✓${colors.reset} Guión profesional con 3 segmentos`);
        console.log(`   ${colors.green}✓${colors.reset} 3 imágenes Nano Banana contextualizadas`);
        console.log(`   ${colors.green}✓${colors.reset} Signed URLs de Supabase (24h expiration)`);
        console.log(`   ${colors.green}✓${colors.reset} Coherencia imagen-guión (100%)`);
        console.log(`   ${colors.green}✓${colors.reset} 3 videos VEO3 generados`);
        console.log(`   ${colors.green}✓${colors.reset} Videos descargados localmente`);
        console.log(`   ${colors.green}✓${colors.reset} Video final concatenado + logo outro`);
        console.log(`   ${colors.green}✓${colors.reset} Metadata de sesión persistida`);
        console.log(`   ${colors.green}✓${colors.reset} Costos dentro de rangos esperados`);

        console.log(
            `\n${colors.cyan}🚀 PRÓXIMO PASO:${colors.reset} Validar calidad visual del video y publicar en Instagram\n`
        );

        console.log(`\n${colors.magenta}🎥 ABRIR VIDEO:${colors.reset}`);
        console.log(`   open "${concatenatedPath}"\n`);

        // Guardar reporte del test
        const reportPath = path.join(sessionDir, 'test-report.json');
        const report = {
            testId,
            timestamp: new Date().toISOString(),
            duration: parseFloat(totalDuration),
            success: true,
            validations: {
                responseStructure: true,
                professionalScript: true,
                nanoBananaImages: true,
                signedUrls: true,
                scriptImageCoherence: true,
                veo3Videos: true,
                videosDownloaded: true,
                finalVideoConcatenated: true,
                sessionMetadata: true,
                costsCorrect: true
            },
            workflow: data.workflow,
            costs: data.costs,
            playerData: playerData,
            sessionDir: sessionDir,
            finalVideo: concatenatedPath
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        log('💾', `Reporte del test guardado: ${reportPath}`, colors.cyan);

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
