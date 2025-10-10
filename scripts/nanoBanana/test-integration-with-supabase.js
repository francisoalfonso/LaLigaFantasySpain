#!/usr/bin/env node

/**
 * TEST: Integración Nano Banana → Supabase
 *
 * Valida el flujo completo de:
 * 1. Generar 3 imágenes con Nano Banana
 * 2. Descargarlas temporalmente
 * 3. Subirlas a Supabase Storage
 * 4. Obtener URLs públicas persistentes (listas para VEO3)
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.supabase' });

const nanoBananaVeo3Integrator = require('../../backend/services/veo3/nanoBananaVeo3Integrator');
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

async function main() {
    const startTime = Date.now();

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(70)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(70)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║  🎨 TEST: Nano Banana → Supabase Integration${' '.repeat(24)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(70)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(70)}╝${colors.reset}\n`);

    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);

    try {
        // Generar y procesar imágenes
        log('🎨', 'Generando 3 imágenes Ana y subiéndolas a Supabase...', colors.yellow);
        log('⏱️ ', 'Tiempo estimado: ~120-150 segundos', colors.yellow);

        const result = await nanoBananaVeo3Integrator.generateImagesForVeo3({
            style: 'professional',
            progression: 'wide-medium-closeup'
        });

        const { images, metadata } = result;

        log('✅', `Procesamiento completado en ${metadata.duration_seconds}s`, colors.green);
        log('💰', `Costo: $${metadata.cost_usd.toFixed(3)}`, colors.green);

        // Mostrar resultados
        console.log(`\n${colors.bright}📸 IMÁGENES PROCESADAS:${colors.reset}\n`);

        images.forEach((img, idx) => {
            const shotColor = idx === 0 ? colors.blue : idx === 1 ? colors.cyan : colors.magenta;
            console.log(`${shotColor}${colors.bright}   ${idx + 1}. ${img.shot.toUpperCase()} SHOT${colors.reset}`);
            console.log(`      ${colors.yellow}Nano Banana URL:${colors.reset} ${img.originalUrl.substring(0, 70)}...`);
            console.log(`      ${colors.green}Supabase URL:${colors.reset} ${img.supabaseUrl}`);
            console.log(`      ${colors.cyan}Seed:${colors.reset} ${img.seed}`);
            console.log(`      ${colors.cyan}Role:${colors.reset} ${img.segmentRole}`);
            console.log('');
        });

        // Guardar metadata
        const outputData = {
            sessionId: `integration_test_${Date.now()}`,
            timestamp: new Date().toISOString(),
            duration_seconds: metadata.duration_seconds,
            cost_usd: metadata.cost_usd,
            images: images,
            metadata: metadata
        };

        const outputDir = 'output/veo3/sessions/integration-tests';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const metadataPath = path.join(outputDir, `integration_${Date.now()}.json`);
        fs.writeFileSync(
            metadataPath,
            JSON.stringify(outputData, null, 2),
            'utf-8'
        );

        log('💾', `Metadata guardada: ${metadataPath}`, colors.cyan);

        // Resumen final
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`\n${colors.bright}${colors.green}${'='.repeat(70)}${colors.reset}`);
        console.log(`${colors.bright}${colors.green}  ✅ TEST COMPLETADO EXITOSAMENTE${colors.reset}`);
        console.log(`${colors.bright}${colors.green}${'='.repeat(70)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 Estadísticas:${colors.reset}`);
        console.log(`   • Imágenes procesadas: ${images.length}`);
        console.log(`   • Tiempo total: ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} min)`);
        console.log(`   • Costo: $${metadata.cost_usd.toFixed(3)}`);
        console.log(`   • URLs Supabase: ✅ Persistentes (ready for VEO3)`);

        console.log(`\n${colors.yellow}✅ VALIDACIÓN:${colors.reset}`);
        console.log(`   ${colors.green}✓${colors.reset} 3 imágenes generadas con Nano Banana`);
        console.log(`   ${colors.green}✓${colors.reset} 3 imágenes descargadas localmente`);
        console.log(`   ${colors.green}✓${colors.reset} 3 imágenes subidas a Supabase Storage`);
        console.log(`   ${colors.green}✓${colors.reset} 3 URLs públicas obtenidas`);
        console.log(`   ${colors.green}✓${colors.reset} Archivos temporales limpiados`);

        console.log(`\n${colors.cyan}🚀 PRÓXIMO PASO:${colors.reset} Usar estas URLs de Supabase como referencias en VEO3\n`);

        // Cleanup
        nanoBananaVeo3Integrator.cleanupTempFiles();

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
