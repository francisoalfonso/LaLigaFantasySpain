/**
 * Test Subtítulos Virales - Demo Rápido
 *
 * Toma un video existente y le añade subtítulos estilo viral
 */

const ViralCaptionsGenerator = require('../../backend/services/veo3/viralCaptionsGenerator');
const path = require('path');
const fs = require('fs');

async function testViralCaptions() {
    console.log('\n🎬 TEST SUBTÍTULOS VIRALES ESTILO TIKTOK/INSTAGRAM\n');
    console.log('=' .repeat(60));

    const captionsGen = new ViralCaptionsGenerator();

    // Buscar el video de Pere Milla más reciente
    const outputDir = path.join(__dirname, '../../output/veo3');
    const files = fs.readdirSync(outputDir)
        .filter(f => f.includes('pere-milla') && f.endsWith('.mp4') && !f.includes('with-captions'))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.log('\n❌ No se encontró ningún video de Pere Milla');
        console.log('   Ejecuta primero: node scripts/veo3/test-chollo-viral-4seg-e2e.js');
        return;
    }

    const testVideo = path.join(outputDir, files[0]);
    console.log(`\n📹 Video de prueba: ${files[0]}`);

    // Diálogo de ejemplo (debe coincidir con el video)
    const testDialogue = "Pere Milla solo cuesta 4.5 millones. Vale 2 veces más de lo que cuesta.";

    console.log(`💬 Diálogo: "${testDialogue}"`);
    console.log(`\n⏳ Generando subtítulos virales...`);

    try {
        const videoWithCaptions = await captionsGen.generateViralCaptions(
            testVideo,
            testDialogue,
            { videoDuration: 8 }
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ SUBTÍTULOS VIRALES GENERADOS EXITOSAMENTE\n');
        console.log(`📁 Video con subtítulos: ${path.basename(videoWithCaptions)}`);
        console.log(`📂 Ruta completa: ${videoWithCaptions}`);

        console.log('\n🎯 Características de los subtítulos:');
        console.log('   • Fuente grande (48px) para visibilidad');
        console.log('   • Borde negro para contraste');
        console.log('   • Box semi-transparente de fondo');
        console.log('   • Palabras importantes en AMARILLO');
        console.log('   • Sincronización palabra por palabra');
        console.log('   • Posición al 75% (evita UI de apps)');

        console.log('\n💡 Para ver el video:');
        console.log(`   open "${videoWithCaptions}"`);
        console.log('');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    }
}

// Ejecutar test
testViralCaptions();
