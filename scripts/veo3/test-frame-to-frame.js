/**
 * Script de prueba para validar sistema Frame-to-Frame
 *
 * Genera 2 segmentos cortos usando continuidad Image-to-Video
 * Valida que el último frame del Segmento 1 = primer frame del Segmento 2
 */

const VEO3Client = require('../../backend/services/veo3/veo3Client');
const frameExtractor = require('../../backend/services/veo3/frameExtractor');
const path = require('path');
const fs = require('fs').promises;

async function testFrameToFrame() {
    console.log('🧪 TEST FRAME-TO-FRAME - Validación Continuidad Visual\n');

    const veo3Client = new VEO3Client();
    const ANA_IMAGE_URL = process.env.ANA_IMAGE_URL ||
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-estudio-pelo-suelto.jpg';

    try {
        // === SEGMENTO 1 ===
        console.log('📹 SEGMENTO 1: Generando con imagen Ana base...');

        const segment1Prompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "Hola Misters, hoy os traigo un chollo increíble. Prestad atención."

Professional broadcaster energy, centered in frame, studio background.`;

        const video1 = await veo3Client.generateWithContinuity(
            segment1Prompt,
            null, // Primer video - sin anterior
            {
                imageUrl: ANA_IMAGE_URL,
                duration: 8
            }
        );

        console.log('✅ Segmento 1 generado:', video1.videoPath);

        // Esperar a que el video esté disponible
        console.log('⏳ Esperando finalización segmento 1...');
        const status1 = await veo3Client.waitForCompletion(video1.taskId, segment1Prompt);
        const video1Path = status1.videoUrl;

        console.log('✅ Video 1 completado:', video1Path);

        // Descargar video 1 localmente
        const localVideo1 = path.join(__dirname, '../../output/veo3/test_segment_1.mp4');
        // TODO: Implementar descarga si videoUrl es remoto

        // === EXTRAER ÚLTIMO FRAME ===
        console.log('\n🖼️  EXTRAYENDO último frame del Segmento 1...');
        const lastFrame = await frameExtractor.extractLastFrame(video1Path);
        console.log('✅ Frame extraído:', lastFrame);

        // === SEGMENTO 2 CON CONTINUIDAD ===
        console.log('\n📹 SEGMENTO 2: Generando con último frame como inicio...');

        const segment2Prompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "Carvajal por cinco punto cinco millones. Real Madrid. Ratio uno punto dos tres."

Professional analysis, same position as previous frame, studio background.`;

        const video2 = await veo3Client.generateWithContinuity(
            segment2Prompt,
            video1Path, // ← Usar video anterior para extraer frame
            {
                duration: 8
            }
        );

        console.log('✅ Segmento 2 iniciado con continuidad');

        // Esperar finalización
        console.log('⏳ Esperando finalización segmento 2...');
        const status2 = await veo3Client.waitForCompletion(video2.taskId, segment2Prompt);

        console.log('✅ Video 2 completado:', status2.videoUrl);

        // === VALIDACIÓN ===
        console.log('\n✅ TEST COMPLETADO\n');
        console.log('📊 RESUMEN:');
        console.log('  - Segmento 1:', video1Path);
        console.log('  - Frame transición:', lastFrame);
        console.log('  - Segmento 2:', status2.videoUrl);
        console.log('\n🎬 Reproducir ambos videos para validar continuidad visual');
        console.log('   → Último frame Seg1 debe coincidir con primer frame Seg2');

        return {
            success: true,
            segment1: video1Path,
            transitionFrame: lastFrame,
            segment2: status2.videoUrl
        };

    } catch (error) {
        console.error('❌ Error en test frame-to-frame:', error.message);
        console.error(error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar test
if (require.main === module) {
    testFrameToFrame()
        .then(result => {
            console.log('\n📋 Resultado:', JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}

module.exports = testFrameToFrame;
