/**
 * Script de test para FASE 4 (enhancements): Player Card + Subtítulos Virales + Black Flashes
 *
 * Uso:
 *   node scripts/veo3/test-phase4-enhancements.js <sessionId>
 *
 * Ejemplo:
 *   node scripts/veo3/test-phase4-enhancements.js nanoBanana_1760183659163
 *
 * Este script:
 * 1. Valida que la sesión esté finalizada (FASE 3 completa)
 * 2. Añade black flashes (70ms) entre segmentos
 * 3. Añade player card overlay (segundos 3-6)
 * 4. Añade subtítulos virales
 * 5. Muestra URL del video final mejorado
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = process.argv[2];

if (!SESSION_ID) {
    console.error('❌ Uso: node test-phase4-enhancements.js <sessionId>');
    console.error('   Ejemplo: node test-phase4-enhancements.js nanoBanana_1760183659163');
    process.exit(1);
}

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║  🎨 Test FASE 4 - Black Flashes + Player Card + Subtítulos Virales         ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`📋 Session ID: ${SESSION_ID}`);
console.log(`🕐 Inicio: ${new Date().toLocaleTimeString()}\n`);

async function main() {
    const startTime = Date.now();

    try {
        console.log(
            '════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('FASE 4: AÑADIENDO MEJORAS AL VIDEO FINAL');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        const phase4Start = Date.now();

        const response = await axios.post(
            `${BASE_URL}/api/veo3/add-enhancements`,
            {
                sessionId: SESSION_ID,
                playerData: {
                    name: 'Pere Milla',
                    stats: {
                        goals: 3,
                        assists: 2,
                        rating: 7.2
                    }
                },
                enhancements: {
                    blackFlashes: true,
                    playerCard: true,
                    viralSubtitles: true
                }
            },
            {
                timeout: 120000 // 2 minutos
            }
        );

        const phase4Duration = ((Date.now() - phase4Start) / 1000).toFixed(1);

        if (!response.data.success) {
            throw new Error(`FASE 4 falló: ${response.data.message}`);
        }

        console.log(`✅ FASE 4 COMPLETADA en ${phase4Duration}s\n`);

        const data = response.data.data;

        console.log(`📹 Video mejorado: ${data.enhancedVideo.url}\n`);

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

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(
            '\n════════════════════════════════════════════════════════════════════════════════'
        );
        console.log('✅ TEST FASE 4 COMPLETADO EXITOSAMENTE');
        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        console.log('📊 RESUMEN:\n');

        console.log(`Player: ${data.session.playerName}`);
        console.log(`Content: ${data.session.contentType} (${data.session.preset})\n`);

        console.log('⏱️  TIEMPOS:');
        console.log(`   FASE 4 (Mejoras):         ${phase4Duration}s`);
        console.log(`   TOTAL:                    ${totalDuration}s\n`);

        console.log('🎨 MEJORAS:');
        console.log(`   Aplicadas:                ${data.enhancements.successful.length}`);
        console.log(`   Fallidas:                 ${data.enhancements.failed.length}`);
        console.log(`   Total:                    ${data.enhancements.total}\n`);

        console.log('📂 VIDEOS:');
        console.log(`   Video base:               ${data.enhancedVideo.baseVideo}`);
        console.log(`   Video mejorado:           ${data.enhancedVideo.url}\n`);

        console.log('💡 PRÓXIMOS PASOS:');
        console.log(`   1. Visualizar video en: ${data.enhancedVideo.url}`);
        console.log(`   2. Validar black flashes (70ms entre segmentos)`);
        console.log(`   3. Validar player card (segundos 3-6)`);
        console.log(`   4. Validar subtítulos virales`);
        console.log(`   5. Publicar en Instagram/TikTok\n`);

        console.log(
            '════════════════════════════════════════════════════════════════════════════════\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR EN TEST FASE 4:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }

        console.error(`\n📁 Session ID con error: ${SESSION_ID}`);

        process.exit(1);
    }
}

main();
