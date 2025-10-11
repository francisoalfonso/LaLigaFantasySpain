/**
 * Script de test para Black Flashes (70ms entre segmentos)
 *
 * Uso:
 *   node scripts/veo3/test-black-flashes.js <sessionId>
 *
 * Ejemplo:
 *   node scripts/veo3/test-black-flashes.js nanoBanana_1760188257300
 *
 * Este script:
 * 1. Valida que la sesión esté finalizada
 * 2. Añade flashes negros de 70ms entre segmentos
 * 3. Muestra URL del video final con flashes
 *
 * Efecto:
 * - 70ms (0.07s) de negro entre cada segmento
 * - Crea sensación de "corte dramático" estilo trailer/cortometraje
 * - Ejemplo: Si hay 3 segmentos, habrá 2 flashes (entre seg1-seg2, seg2-seg3)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = process.argv[2];

if (!SESSION_ID) {
    console.error('❌ Uso: node test-black-flashes.js <sessionId>');
    console.error('   Ejemplo: node test-black-flashes.js nanoBanana_1760188257300');
    process.exit(1);
}

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  ⚡ Test Black Flashes - Transiciones Dramáticas (70ms)                     ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`📋 Session ID: ${SESSION_ID}`);
console.log(`⚡ Duración flash: 70ms (0.07 segundos)`);
console.log(`🎬 Efecto: Corte dramático estilo trailer/cortometraje`);
console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\n`);

async function main() {
    const startTime = Date.now();

    try {
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('AÑADIENDO BLACK FLASHES AL VIDEO FINAL');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const response = await axios.post(
            `${BASE_URL}/api/veo3/add-enhancements`,
            {
                sessionId: SESSION_ID,
                enhancements: {
                    blackFlashes: true // Solo flashes, sin player card ni subtítulos
                }
            },
            {
                timeout: 120000 // 2 minutos
            }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!response.data.success) {
            throw new Error(`Operación falló: ${response.data.message}`);
        }

        console.log(`✅ BLACK FLASHES AÑADIDOS en ${duration}s\n`);

        const data = response.data.data;

        console.log(`📹 Video con flashes: ${data.enhancedVideo.url}\n`);

        console.log('✅ MEJORAS APLICADAS:');
        if (data.enhancements.successful.length > 0) {
            data.enhancements.successful.forEach((enh, idx) => {
                console.log(`   ${idx + 1}. ${enh.type}`);
                if (enh.details) {
                    Object.keys(enh.details).forEach(key => {
                        console.log(`      - ${key}: ${enh.details[key]}`);
                    });
                }
            });
        } else {
            console.log('   (ninguna)');
        }

        if (data.enhancements.failed.length > 0) {
            console.log('\n❌ MEJORAS FALLIDAS:');
            data.enhancements.failed.forEach((enh, idx) => {
                console.log(`   ${idx + 1}. ${enh.type}: ${enh.error}`);
            });
        }

        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ TEST BLACK FLASHES COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log('📊 RESUMEN:\n');

        console.log(`Player: ${data.session.playerName}`);
        console.log(`Content: ${data.session.contentType} (${data.session.preset})\n`);

        console.log('⚡ BLACK FLASHES:');
        const flashEnhancement = data.enhancements.successful.find(e => e.type === 'blackFlashes');
        if (flashEnhancement) {
            console.log(`   Cantidad:                 ${flashEnhancement.details.flashCount}`);
            console.log(`   Duración:                 ${flashEnhancement.details.duration}`);
            console.log(`   Efecto:                   ${flashEnhancement.details.effect}\n`);
        }

        console.log('⏱️  TIEMPOS:');
        console.log(`   Procesamiento:            ${duration}s\n`);

        console.log('📂 VIDEOS:');
        console.log(`   Video base:               ${data.enhancedVideo.baseVideo}`);
        console.log(`   Video con flashes:        ${data.enhancedVideo.url}\n`);

        console.log('💡 PRÓXIMOS PASOS:');
        console.log(`   1. Visualizar video en: ${data.enhancedVideo.url}`);
        console.log(`   2. Validar flashes (deben aparecer entre segmentos, NO al final)`);
        console.log(`   3. Si se ven bien, añadir player card y subtítulos (re-ejecutar FASE 4)`);
        console.log(`   4. Comando para añadir todo: npm run veo3:test-phase4 ${SESSION_ID}\n`);

        console.log('🎬 DETALLES TÉCNICOS:');
        console.log(`   - Flash: 70ms (0.07 segundos) de negro puro`);
        console.log(`   - Posición: Al FINAL de cada segmento (antes del siguiente)`);
        console.log(
            `   - Cantidad: ${flashEnhancement ? flashEnhancement.details.flashCount : 'N/A'} flashes (segmentos - 1)`
        );
        console.log(
            `   - FFmpeg: drawbox filter con enable='between(t,start,end)' para timing preciso\n`
        );

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN TEST BLACK FLASHES:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        console.error(`\n📁 Session ID con error: ${SESSION_ID}`);
        console.error(`\n💡 TROUBLESHOOTING:`);
        console.error(`   1. Verifica que la sesión esté finalizada (status: "finalized")`);
        console.error(`   2. Ejecuta primero: npm run veo3:test-phased`);
        console.error(`   3. Si el error persiste, revisa logs en logs/veo3/black-flashes.log\n`);

        process.exit(1);
    }
}

main();
