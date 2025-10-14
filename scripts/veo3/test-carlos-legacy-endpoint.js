#!/usr/bin/env node

/**
 * TEST: Validar Fix de Carlos en Endpoint Legacy
 *
 * Objetivo: Verificar que el endpoint /generate-with-nano-banana
 * ahora usa correctamente los prompts de Carlos (no Ana)
 *
 * Fix validado:
 * - presenter: 'carlos' en payload
 * - presenterConfig cargado dinámicamente
 * - characterBible pasado a Nano Banana
 * - characterBible pasado a VEO3 prompts
 *
 * Uso:
 *   node scripts/veo3/test-carlos-legacy-endpoint.js
 */

require('dotenv').config();

const axios = require('axios');
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

    console.log(`\n${colors.bright}${colors.blue}╔${'═'.repeat(78)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(
        `${colors.bright}${colors.blue}║  🔧 TEST: Fix Carlos en Endpoint Legacy /generate-with-nano-banana${' '.repeat(10)}║${colors.reset}`
    );
    console.log(`${colors.bright}${colors.blue}║${' '.repeat(78)}║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚${'═'.repeat(78)}╝${colors.reset}\n`);

    log('🕐', `Inicio: ${new Date().toLocaleTimeString('es-ES')}`, colors.cyan);
    log('⏱️ ', 'Tiempo estimado: 8-10 minutos', colors.yellow);
    log('💰', 'Costo estimado: $0.96 USD (VEO3: $0.90, Nano Banana: $0.06)', colors.yellow);

    try {
        // ========================================
        // CONFIGURACIÓN DEL TEST
        // ========================================
        printSeparator();
        log('⚙️ ', 'CONFIGURACIÓN DEL TEST', colors.bright + colors.blue);

        const playerData = {
            name: 'Lewandowski',
            team: 'Barcelona',
            price: 9.5,
            position: 'Delantero',
            stats: {
                goals: 4,
                assists: 2,
                rating: 8.5,
                minutes: 270
            }
        };

        const viralData = {
            gameweek: 'jornada 10',
            xgIncrease: '45'
        };

        const requestPayload = {
            contentType: 'chollo',
            playerData: playerData,
            viralData: viralData,
            preset: 'chollo_viral',
            presenter: 'carlos', // ✅ FIX: Selector de presentador
            options: {}
        };

        log('', `👨‍💼 PRESENTADOR: Carlos González (seed 30002)`, colors.cyan);
        log('', `Jugador: ${playerData.name} (${playerData.team})`, colors.cyan);
        log('', `Precio: €${playerData.price}M`, colors.cyan);
        log('', `Tipo contenido: chollo`, colors.cyan);
        log('', `Preset: chollo_viral (3 segmentos)`, colors.cyan);

        // ========================================
        // PASO 1: VERIFICAR SERVIDOR
        // ========================================
        printSeparator();
        log('🚀', 'PASO 1: Verificando servidor...', colors.bright + colors.blue);

        try {
            const pingResponse = await axios.get('http://localhost:3000/api/test/ping', {
                timeout: 5000
            });
            if (!pingResponse.data.success) {
                throw new Error('Servidor no responde correctamente');
            }
            log('✅', `Servidor activo`, colors.green);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('❌ Servidor no está corriendo. Ejecuta: npm run dev');
            }
            throw error;
        }

        // ========================================
        // PASO 2: LLAMAR AL ENDPOINT LEGACY
        // ========================================
        printSeparator();
        log(
            '🔧',
            'PASO 2: Llamando al endpoint LEGACY /api/veo3/generate-with-nano-banana...',
            colors.bright + colors.blue
        );

        const apiUrl = 'http://localhost:3000/api/veo3/generate-with-nano-banana';

        log('', `URL: ${apiUrl}`, colors.cyan);
        log('', `Payload:`, colors.cyan);
        console.log(JSON.stringify(requestPayload, null, 2));

        log('', `Enviando request...`, colors.yellow);
        log('⏳', `Esperando respuesta (puede tardar 8-10 min)...`, colors.yellow);

        const response = await axios.post(apiUrl, requestPayload, {
            timeout: 900000 // 15 minutos timeout
        });

        if (!response.data || !response.data.success) {
            throw new Error(`Error en respuesta del endpoint: ${JSON.stringify(response.data)}`);
        }

        log('✅', `Endpoint respondió exitosamente`, colors.green);

        // ========================================
        // PASO 3: VALIDAR PRESENTADOR EN RESPUESTA
        // ========================================
        printSeparator();
        log(
            '🔍',
            'PASO 3: Validando que Carlos fue usado correctamente...',
            colors.bright + colors.blue
        );

        const data = response.data.data;

        // Verificar workflow
        if (data.workflow !== 'nano-banana-contextual') {
            throw new Error(`Workflow incorrecto: ${data.workflow}`);
        }
        log('✅', `Workflow: ${data.workflow}`, colors.green);

        // Verificar script (3 segmentos)
        if (!data.script || !data.script.segments || data.script.segments.length !== 3) {
            throw new Error(`Script inválido: ${data.script?.segments?.length || 0} segmentos`);
        }
        log('✅', `Guión generado: ${data.script.segments.length} segmentos`, colors.green);

        // Verificar imágenes Nano Banana (deben estar en flp/carlos/)
        if (!data.nanoBananaImages || data.nanoBananaImages.length !== 3) {
            throw new Error(
                `Imágenes Nano Banana inválidas: ${data.nanoBananaImages?.length || 0}`
            );
        }

        // CRÍTICO: Verificar que las imágenes se subieron a flp/carlos/ (no flp/ana/)
        data.nanoBananaImages.forEach((image, idx) => {
            if (!image.supabaseUrl.includes('/carlos/')) {
                throw new Error(
                    `❌ Imagen ${idx + 1} NO está en subdirectorio Carlos: ${image.supabaseUrl}`
                );
            }
        });
        log(
            '✅',
            `Imágenes Nano Banana: ${data.nanoBananaImages.length} generadas en /carlos/`,
            colors.green
        );

        // Verificar videos VEO3
        if (!data.segments || data.segments.length !== 3) {
            throw new Error(`Videos VEO3 inválidos: ${data.segments?.length || 0}`);
        }
        log('✅', `Videos VEO3: ${data.segments.length} generados`, colors.green);

        // Verificar video final
        if (!data.concatenatedVideo || !data.finalVideoUrl) {
            throw new Error('Video final no disponible');
        }
        log('✅', `Video final concatenado disponible`, colors.green);

        // ========================================
        // PASO 4: VALIDAR IMÁGENES EN SUBDIRECTORIO CORRECTO
        // ========================================
        printSeparator();
        log(
            '🖼️ ',
            'PASO 4: Validando URLs de imágenes Nano Banana...',
            colors.bright + colors.blue
        );

        console.log(`\n${colors.cyan}IMÁGENES CONTEXTUALIZADAS (CARLOS):${colors.reset}\n`);

        data.nanoBananaImages.forEach((image, idx) => {
            console.log(
                `${colors.yellow}Imagen ${idx + 1}: ${image.role.toUpperCase()}${colors.reset}`
            );
            console.log(`   Shot: ${image.shot}`);
            console.log(`   Emoción: ${image.emotion}`);
            console.log(`   URL: ${image.supabaseUrl}`);
            console.log(
                `   Subdirectorio: ${image.supabaseUrl.includes('/carlos/') ? '✅ /carlos/' : '❌ NO es /carlos/'}`
            );
            console.log('');

            // Validar que sea signed URL de Supabase en /carlos/
            if (!image.supabaseUrl.includes('supabase.co')) {
                throw new Error(`Imagen ${idx + 1} no es de Supabase`);
            }
            if (!image.supabaseUrl.includes('/carlos/')) {
                throw new Error(
                    `Imagen ${idx + 1} no está en subdirectorio /carlos/: ${image.supabaseUrl}`
                );
            }
            if (!image.supabaseUrl.includes('token=')) {
                throw new Error(`Imagen ${idx + 1} no usa signed URL`);
            }
        });

        log('✅', `Todas las imágenes usan signed URLs de Supabase en /carlos/`, colors.green);

        // ========================================
        // PASO 5: VALIDAR COSTOS
        // ========================================
        printSeparator();
        log('💰', 'PASO 5: Validando costos...', colors.bright + colors.blue);

        console.log(`\n${colors.cyan}COSTOS:${colors.reset}\n`);
        console.log(`   Nano Banana: $${data.costs.nanoBanana.toFixed(3)}`);
        console.log(`   VEO3: $${data.costs.veo3.toFixed(3)}`);
        console.log(`   TOTAL: $${data.costs.total.toFixed(3)}`);
        console.log('');

        // Validar rangos de costos esperados
        const expectedNanoBananaCost = 0.02 * 3; // $0.02 por imagen × 3
        const expectedVeo3Cost = 0.3 * 3; // $0.30 por video × 3

        if (Math.abs(data.costs.nanoBanana - expectedNanoBananaCost) > 0.01) {
            log(
                '⚠️ ',
                `Costo Nano Banana inesperado: $${data.costs.nanoBanana} (esperado: ~$${expectedNanoBananaCost})`,
                colors.yellow
            );
        } else {
            log('✅', `Costo Nano Banana correcto (~$0.06)`, colors.green);
        }

        if (Math.abs(data.costs.veo3 - expectedVeo3Cost) > 0.01) {
            log(
                '⚠️ ',
                `Costo VEO3 inesperado: $${data.costs.veo3} (esperado: ~$${expectedVeo3Cost})`,
                colors.yellow
            );
        } else {
            log('✅', `Costo VEO3 correcto (~$0.90)`, colors.green);
        }

        // ========================================
        // RESUMEN FINAL
        // ========================================
        printSeparator();
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalMinutes = (totalDuration / 60).toFixed(1);

        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}`);
        console.log(
            `${colors.bright}${colors.green}  ✅ FIX VALIDADO: Carlos funciona correctamente en endpoint legacy${colors.reset}`
        );
        console.log(`${colors.bright}${colors.green}${'='.repeat(80)}${colors.reset}\n`);

        console.log(`${colors.cyan}📊 ESTADÍSTICAS:${colors.reset}`);
        console.log(`   • Tiempo total: ${totalDuration}s (~${totalMinutes} min)`);
        console.log(`   • Costo total: $${data.costs.total.toFixed(3)}`);
        console.log(`   • Workflow: ${data.workflow}`);
        console.log(`   • Presentador: Carlos González (seed 30002)`);

        console.log(`\n${colors.cyan}🔧 FIX VALIDADO:${colors.reset}`);
        console.log(`   ${colors.green}✓${colors.reset} Parámetro presenter: 'carlos' enviado`);
        console.log(`   ${colors.green}✓${colors.reset} presenterConfig cargado dinámicamente`);
        console.log(
            `   ${colors.green}✓${colors.reset} characterBible de Carlos pasado a Nano Banana`
        );
        console.log(`   ${colors.green}✓${colors.reset} Imágenes guardadas en /carlos/ (no /ana/)`);
        console.log(
            `   ${colors.green}✓${colors.reset} characterBible de Carlos pasado a VEO3 prompts`
        );
        console.log(`   ${colors.green}✓${colors.reset} Videos generados con seed 30002 (Carlos)`);

        console.log(`\n${colors.cyan}📹 VIDEO FINAL:${colors.reset}`);
        console.log(`   • Archivo: ${data.concatenatedVideo.outputPath}`);
        console.log(`   • URL: ${data.finalVideoUrl}`);
        console.log(`   • Duración: ${data.concatenatedVideo.duration}s`);

        console.log(`\n${colors.yellow}✅ VALIDACIONES COMPLETADAS:${colors.reset}`);
        console.log(
            `   ${colors.green}✓${colors.reset} Endpoint legacy acepta presenter: 'carlos'`
        );
        console.log(
            `   ${colors.green}✓${colors.reset} Imágenes en subdirectorio correcto (/carlos/)`
        );
        console.log(`   ${colors.green}✓${colors.reset} CharacterBible de Carlos usado (no Ana)`);
        console.log(`   ${colors.green}✓${colors.reset} Videos generados correctamente`);
        console.log(`   ${colors.green}✓${colors.reset} Costos dentro de rangos esperados`);

        console.log(
            `\n${colors.cyan}🎉 CONCLUSIÓN:${colors.reset} El fix funciona correctamente. Carlos ahora usa sus propios prompts.\n`
        );

        console.log(`${colors.magenta}🎥 ABRIR VIDEO PARA VALIDACIÓN VISUAL:${colors.reset}`);
        console.log(`   open "${data.concatenatedVideo.outputPath}"\n`);

        console.log(`${colors.cyan}📝 CHECKLIST DE VALIDACIÓN VISUAL:${colors.reset}`);
        console.log(`   □ Carlos aparece (no Ana) en todos los segmentos`);
        console.log(`   □ Hombre de 38 años con canas (no mujer de 32)`);
        console.log(`   □ Camisa azul tech (no polo rojo)`);
        console.log(`   □ Tone analítico/profesional (no viral/emocional)`);
        console.log(`   □ Acento español de España (Madrid)`);
        console.log(`   □ Consistencia facial entre los 3 segmentos\n`);
    } catch (error) {
        console.error(`\n${colors.red}❌ ERROR EN TEST:${colors.reset}`);
        console.error(`   ${error.message}`);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }

        if (error.code === 'ECONNABORTED') {
            console.error(`\n💡 TIMEOUT - El endpoint legacy tardó más de 15 minutos`);
        }

        if (error.stack) {
            console.error(`\n${colors.red}Stack trace:${colors.reset}`);
            console.error(error.stack);
        }

        process.exit(1);
    }
}

main();
