#!/usr/bin/env node

/**
 * TEST: Solo generación de imágenes con Nano Banana
 *
 * Test simplificado para validar la configuración definitiva:
 * - Formato vertical 9:16 ✅
 * - Pelo rubio sin reflejos rojizos ✅
 * - Identidad Ana consistente ✅
 * - Contacto visual directo ✅
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
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function main() {
    const startTime = Date.now();
    const sessionId = `nano_test_${Date.now()}`;

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(58)}║${colors.reset}`);
    console.log(
        `${colors.bright}${colors.blue}║  🎨 TEST: Nano Banana - Configuración Definitiva${' '.repeat(7)}║${colors.reset}`
    );
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(58)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}\n`);

    log('📋', `Session ID: ${sessionId}`, colors.cyan);
    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);

    try {
        // Generar 3 imágenes con Nano Banana
        log('🎨', 'Generando 3 imágenes de Ana (Wide, Medium, Close-up)...', colors.yellow);
        log('⏱️ ', 'Tiempo estimado: ~90-120 segundos', colors.yellow);

        const nanoBananaStart = Date.now();

        const response = await axios.post(
            `${BASE_URL}/api/nano-banana/generate-progression`,
            {
                style: 'professional',
                progression: 'wide-medium-closeup'
            },
            {
                timeout: 300000 // 5 minutos
            }
        );

        const duration = ((Date.now() - nanoBananaStart) / 1000).toFixed(1);

        if (!response.data.success) {
            throw new Error('Generación falló');
        }

        const images = response.data.images;
        const metadata = response.data.metadata;

        log('✅', `3 imágenes generadas en ${duration}s`, colors.green);
        log('💰', `Costo: $${metadata.cost_usd.toFixed(3)}`, colors.green);

        // Mostrar URLs de imágenes
        console.log(`\n${colors.bright}📸 IMÁGENES GENERADAS:${colors.reset}\n`);

        images.forEach((img, idx) => {
            const shotColor = idx === 0 ? colors.blue : idx === 1 ? colors.cyan : colors.magenta;
            console.log(
                `${shotColor}${colors.bright}   ${idx + 1}. ${img.shot.toUpperCase()} SHOT${colors.reset}`
            );
            console.log(`      ${colors.cyan}URL:${colors.reset} ${img.url}`);
            console.log(`      ${colors.yellow}Seed:${colors.reset} ${img.seed}`);
            console.log(`      ${colors.green}Role:${colors.reset} ${img.segmentRole}`);

            // Extraer dimensiones del nombre del archivo
            const match = img.url.match(/(\\d+)x(\\d+)/);
            if (match) {
                const width = match[1];
                const height = match[2];
                const ratio = (parseInt(width) / parseInt(height)).toFixed(2);
                const is916 = ratio === '0.56' || ratio === '0.57';
                const ratioIcon = is916 ? '✅' : '⚠️';
                console.log(
                    `      ${colors.blue}Dimensiones:${colors.reset} ${width}x${height} (ratio ${ratio}) ${ratioIcon}`
                );
            }
            console.log('');
        });

        // Checklist de validación
        console.log(`${colors.bright}${colors.yellow}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.bright}${colors.yellow}  CHECKLIST DE VALIDACIÓN${colors.reset}`);
        console.log(`${colors.bright}${colors.yellow}${'='.repeat(60)}${colors.reset}\n`);

        console.log(`${colors.cyan}Verifica visualmente cada imagen:${colors.reset}\n`);
        console.log(`   [ ] ${colors.green}Formato vertical${colors.reset} (9:16 = 576x1024)`);
        console.log(
            `   [ ] ${colors.green}Pelo rubio natural${colors.reset} sin reflejos rojizos fuertes`
        );
        console.log(
            `   [ ] ${colors.green}Identidad de Ana${colors.reset} consistente con referencias`
        );
        console.log(`   [ ] ${colors.green}Contacto visual directo${colors.reset} con cámara`);
        console.log(`   [ ] ${colors.green}Integración realista${colors.reset} con estudio FLP`);
        console.log(
            `   [ ] ${colors.green}Progresión cinematográfica${colors.reset} clara (Wide→Medium→Close)`
        );

        // Guardar metadata
        const outputData = {
            sessionId,
            timestamp: new Date().toISOString(),
            duration_seconds: parseFloat(duration),
            cost_usd: metadata.cost_usd,
            config: {
                model: 'google/nano-banana-edit',
                seed: 12500,
                promptStrength: 0.75,
                imageSize: '9:16'
            },
            images: images.map(img => ({
                index: img.index,
                shot: img.shot,
                role: img.segmentRole,
                url: img.url,
                seed: img.seed,
                generatedAt: img.generatedAt
            })),
            validationChecklist: {
                formatVertical: null,
                hairColor: null,
                identity: null,
                eyeContact: null,
                studioIntegration: null,
                cinematicProgression: null
            }
        };

        const outputDir = `output/veo3/sessions/${sessionId}`;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const metadataPath = path.join(outputDir, 'nano_banana_test.json');
        fs.writeFileSync(metadataPath, JSON.stringify(outputData, null, 2), 'utf-8');

        console.log(`\n${colors.cyan}💾 Metadata guardada: ${metadataPath}${colors.reset}`);

        // Resumen final
        console.log(`\n${colors.bright}${colors.green}${'='.repeat(60)}${colors.reset}`);
        console.log(
            `${colors.bright}${colors.green}  ✅ TEST COMPLETADO EXITOSAMENTE${colors.reset}`
        );
        console.log(`${colors.bright}${colors.green}${'='.repeat(60)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 Estadísticas:${colors.reset}`);
        console.log(`   • Imágenes generadas: ${images.length}`);
        console.log(`   • Tiempo total: ${duration}s (~${(duration / 60).toFixed(1)} min)`);
        console.log(`   • Costo: $${metadata.cost_usd.toFixed(3)}`);
        console.log(`   • Promedio por imagen: ${(duration / images.length).toFixed(1)}s`);

        console.log(
            `\n${colors.yellow}👁️  PRÓXIMO PASO: Revisar las imágenes visualmente${colors.reset}`
        );
        console.log(`   Abre las URLs en un navegador y verifica el checklist\n`);
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
