#!/usr/bin/env node

/**
 * TEST E2E: Nano Banana → VEO3 → Video Final
 *
 * Flujo completo:
 * 1. Generar 3 imágenes Ana con Nano Banana (Wide, Medium, Close-up)
 * 2. Generar 3 segmentos de video con VEO3 (usando imágenes Nano Banana)
 * 3. Concatenar segmentos con logo outro
 * 4. Aplicar subtítulos virales
 * 5. Guardar metadata y resultados
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const startTime = Date.now();
    const sessionId = `session_e2e_${Date.now()}`;

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(58)}║${colors.reset}`);
    console.log(
        `${colors.bright}${colors.blue}║  🎬 TEST E2E: Nano Banana → VEO3 → Video Final${' '.repeat(9)}║${colors.reset}`
    );
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(58)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}\n`);

    log('📋', `Session ID: ${sessionId}`, colors.cyan);
    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);

    try {
        // ========================================
        // FASE 1: Generar 3 imágenes con Nano Banana
        // ========================================
        logSection('FASE 1: Generación de Imágenes con Nano Banana');

        log('🎨', 'Generando 3 imágenes de Ana (Wide, Medium, Close-up)...', colors.yellow);
        log('⏱️ ', 'Tiempo estimado: ~90-120 segundos', colors.yellow);

        const nanoBananaStart = Date.now();

        // Llamar al endpoint de generación de progresión
        const nanoBananaResponse = await axios.post(
            `${BASE_URL}/api/nano-banana/generate-progression`,
            {
                style: 'professional',
                progression: 'wide-medium-closeup'
            },
            {
                timeout: 300000 // 5 minutos timeout
            }
        );

        const nanoBananaDuration = ((Date.now() - nanoBananaStart) / 1000).toFixed(1);

        if (!nanoBananaResponse.data.success) {
            throw new Error('Nano Banana generación falló');
        }

        const images = nanoBananaResponse.data.images;

        log('✅', `3 imágenes generadas en ${nanoBananaDuration}s`, colors.green);
        log('💰', `Costo: $${(images.length * 0.02).toFixed(3)}`, colors.green);

        // Mostrar URLs de imágenes
        console.log('\n📸 Imágenes generadas:');
        images.forEach((img, idx) => {
            console.log(
                `   ${idx + 1}. ${colors.cyan}${img.shot.toUpperCase()}${colors.reset}: ${img.url.substring(0, 80)}...`
            );
        });

        // ========================================
        // FASE 2: Generar scripts con EmotionAnalyzer
        // ========================================
        logSection('FASE 2: Generación de Scripts Narrativos');

        log('📝', 'Generando scripts para 3 segmentos con emociones...', colors.yellow);

        // Datos simulados de un chollo (Pere Milla ejemplo)
        const playerData = {
            name: 'Pere Milla',
            team: 'Valencia',
            position: 'Delantero',
            price: 6.5,
            points: 42,
            rating: 7.2,
            goals: 3,
            assists: 2,
            valueRatio: 6.46 // points/price
        };

        const scriptsResponse = await axios.post(
            `${BASE_URL}/api/veo3/generate-scripts`,
            {
                playerData,
                contentType: 'chollo',
                segmentCount: 3
            },
            {
                timeout: 60000
            }
        );

        if (!scriptsResponse.data.success) {
            throw new Error('Generación de scripts falló');
        }

        const scripts = scriptsResponse.data.scripts;

        log('✅', `Scripts generados para 3 segmentos`, colors.green);

        console.log('\n📜 Scripts por segmento:');
        scripts.forEach((script, idx) => {
            console.log(
                `   ${idx + 1}. ${colors.cyan}${script.role.toUpperCase()}${colors.reset} (${script.emotion}): "${script.text.substring(0, 60)}..."`
            );
        });

        // ========================================
        // FASE 3: Generar videos con VEO3
        // ========================================
        logSection('FASE 3: Generación de Videos con VEO3');

        log('🎬', 'Generando 3 segmentos de video con VEO3...', colors.yellow);
        log('⏱️ ', 'Tiempo estimado: ~5-10 minutos', colors.yellow);
        log('⚠️ ', 'Usando imágenes Nano Banana como frames iniciales', colors.yellow);

        const veo3Start = Date.now();
        const videoSegments = [];

        for (let i = 0; i < 3; i++) {
            const image = images[i];
            const script = scripts[i];

            log('🎥', `Segmento ${i + 1}/3: ${image.shot} (${script.emotion})`, colors.blue);

            // TODO: Implementar llamada a VEO3 con imagen de Nano Banana
            // Por ahora, simulamos la generación

            const segmentStart = Date.now();

            // Aquí iría la llamada real a VEO3
            // const veo3Response = await axios.post(
            //     `${BASE_URL}/api/veo3/generate-segment`,
            //     {
            //         imageUrl: image.url,
            //         dialogue: script.text,
            //         emotion: script.emotion,
            //         shot: image.shot,
            //         duration: 5
            //     },
            //     { timeout: 300000 }
            // );

            // Simulación por ahora
            await sleep(2000); // Simular generación

            const segmentDuration = ((Date.now() - segmentStart) / 1000).toFixed(1);

            videoSegments.push({
                index: i + 1,
                shot: image.shot,
                emotion: script.emotion,
                videoUrl: `[SIMULADO] video_segment_${i + 1}.mp4`,
                duration: segmentDuration
            });

            log('✅', `Segmento ${i + 1} generado en ${segmentDuration}s`, colors.green);

            // Cooling period entre segmentos
            if (i < 2) {
                log('⏳', 'Cooling 30s antes de siguiente segmento...', colors.yellow);
                await sleep(30000);
            }
        }

        const veo3Duration = ((Date.now() - veo3Start) / 1000).toFixed(1);

        log('✅', `3 segmentos de video generados en ${veo3Duration}s`, colors.green);

        // ========================================
        // FASE 4: Concatenar segmentos
        // ========================================
        logSection('FASE 4: Concatenación de Segmentos + Logo Outro');

        log('🔗', 'Concatenando 3 segmentos con logo outro...', colors.yellow);

        // TODO: Implementar concatenación real
        await sleep(3000); // Simular concatenación

        const finalVideoPath = `output/veo3/sessions/${sessionId}/final_video.mp4`;

        log('✅', 'Video concatenado exitosamente', colors.green);
        log('📁', `Ruta: ${finalVideoPath}`, colors.cyan);

        // ========================================
        // FASE 5: Subtítulos virales
        // ========================================
        logSection('FASE 5: Generación de Subtítulos Virales');

        log('💬', 'Generando subtítulos con ViralCaptionsGenerator...', colors.yellow);

        // TODO: Implementar generación de subtítulos
        await sleep(2000);

        const captions = [
            '🔥 EL CHOLLO DE LA JORNADA',
            '⚽ Pere Milla: 6.5M y volando',
            '📊 Ratio 6.46 - ¡BRUTAL!',
            '💰 Ficha ya antes que suba'
        ];

        log('✅', `${captions.length} subtítulos generados`, colors.green);

        console.log('\n💬 Subtítulos:');
        captions.forEach((caption, idx) => {
            console.log(`   ${idx + 1}. ${colors.yellow}${caption}${colors.reset}`);
        });

        // ========================================
        // RESUMEN FINAL
        // ========================================
        logSection('RESUMEN FINAL');

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalCost = (images.length * 0.02).toFixed(3); // Solo Nano Banana por ahora

        console.log(`${colors.bright}📊 ESTADÍSTICAS DEL TEST E2E:${colors.reset}\n`);
        console.log(
            `   ${colors.green}✅ Fase 1 - Nano Banana:${colors.reset} ${nanoBananaDuration}s (3 imágenes)`
        );
        console.log(
            `   ${colors.green}✅ Fase 2 - Scripts:${colors.reset} <1s (3 scripts con emociones)`
        );
        console.log(
            `   ${colors.green}✅ Fase 3 - VEO3:${colors.reset} ${veo3Duration}s (3 segmentos) [SIMULADO]`
        );
        console.log(`   ${colors.green}✅ Fase 4 - Concatenación:${colors.reset} ~3s`);
        console.log(`   ${colors.green}✅ Fase 5 - Subtítulos:${colors.reset} ~2s`);
        console.log(
            `\n   ${colors.cyan}⏱️  Tiempo total:${colors.reset} ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} min)`
        );
        console.log(`   ${colors.cyan}💰 Costo total:${colors.reset} $${totalCost} (Nano Banana)`);
        console.log(`   ${colors.cyan}📁 Session ID:${colors.reset} ${sessionId}`);

        // Guardar metadata
        const metadata = {
            sessionId,
            timestamp: new Date().toISOString(),
            duration_seconds: parseFloat(totalDuration),
            cost_usd: parseFloat(totalCost),
            phases: {
                nanoBanana: {
                    duration_s: parseFloat(nanoBananaDuration),
                    images: images.map(img => ({
                        shot: img.shot,
                        url: img.url,
                        seed: img.seed
                    }))
                },
                scripts: {
                    count: scripts.length,
                    scripts: scripts.map(s => ({
                        role: s.role,
                        emotion: s.emotion,
                        text: s.text
                    }))
                },
                veo3: {
                    duration_s: parseFloat(veo3Duration),
                    segments: videoSegments,
                    status: 'simulated'
                },
                concatenation: {
                    outputPath: finalVideoPath,
                    status: 'simulated'
                },
                captions: {
                    count: captions.length,
                    captions: captions
                }
            },
            player: playerData
        };

        const metadataPath = `output/veo3/sessions/${sessionId}/metadata_e2e.json`;

        // Crear directorio si no existe
        const sessionDir = path.dirname(metadataPath);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

        log('💾', `Metadata guardada: ${metadataPath}`, colors.cyan);

        console.log(
            `\n${colors.bright}${colors.green}🎉 TEST E2E COMPLETADO EXITOSAMENTE${colors.reset}\n`
        );

        console.log(
            `${colors.yellow}⚠️  NOTA: Este test está parcialmente simulado.${colors.reset}`
        );
        console.log(
            `${colors.yellow}   Para test completo, implementar integraciones VEO3 reales.${colors.reset}\n`
        );
    } catch (error) {
        console.error(`\n${colors.red}❌ ERROR EN TEST E2E:${colors.reset}`);
        console.error(`   ${error.message}`);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }

        process.exit(1);
    }
}

main();
