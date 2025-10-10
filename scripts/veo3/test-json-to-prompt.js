/**
 * Test: Convertir JSON estructurado a prompt de texto para VEO3 API
 *
 * Objetivo: Validar si el control granular del JSON se puede traducir
 * a un prompt de texto que la API entienda similar al playground
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Convertir JSON estructurado a prompt de texto optimizado
 */
function jsonToPrompt(jsonConfig) {
    const { character, speech, scene, action } = jsonConfig;

    // Construir descripción de personaje (mínima - imagen hace el trabajo)
    const characterDesc = `${character.appearance}, ${character.outfit}`;

    // Construir instrucciones de audio (lo más importante)
    let audioInstructions = '';

    if (speech.volumeControl) {
        const volumePhases = Object.values(speech.volumeControl);

        // Extraer pattern de volumen dominante
        const hasWhisper = volumePhases.some(p => p.toLowerCase().includes('whisper'));
        const hasLoud = volumePhases.some(p => p.toLowerCase().includes('loud'));
        const hasNormal = volumePhases.some(p => p.toLowerCase().includes('normal'));

        if (hasWhisper && hasLoud) {
            audioInstructions = 'speaking in Spanish whisper building to emphatic loud finish';
        } else if (hasWhisper) {
            audioInstructions = 'speaking in Spanish whisper';
        } else if (hasLoud) {
            audioInstructions = 'speaking with emphatic loud energy';
        } else {
            audioInstructions = 'speaking in natural Spanish tone';
        }
    }

    // Construir acción principal
    const actionDesc = action.bodyLanguage || action.gestures || 'natural presenter gestures';

    // Construir escena
    const sceneDesc = `${scene.setting}, ${scene.lighting}`;

    // Ensamblar prompt final
    const prompt = `Professional sports analysis video. ${characterDesc}, ${actionDesc}, ${audioInstructions}: "${speech.dialogue}", ${speech.language}, ${sceneDesc}, no subtitles.`;

    return prompt;
}

/**
 * Generar video usando prompt convertido desde JSON
 */
async function testJsonToPrompt() {
    console.log('🧪 TEST: JSON → Prompt de Texto → VEO3 API\n');
    console.log('='.repeat(60));

    try {
        // 1. Leer JSON de prueba (Pere Milla replica)
        const jsonPath = path.join(__dirname, '../../temp/segmento-REPLICA-pere-milla-8s.json');
        const jsonContent = await fs.readFile(jsonPath, 'utf8');
        const jsonConfig = JSON.parse(jsonContent);

        console.log('\n📄 JSON original cargado:');
        console.log(`   Diálogo: "${jsonConfig.speech.dialogue}"`);
        console.log(`   Control volumen: ${Object.keys(jsonConfig.speech.volumeControl).length} fases`);

        // 2. Convertir a prompt de texto
        const prompt = jsonToPrompt(jsonConfig);

        console.log('\n🔄 Prompt generado desde JSON:');
        console.log(`   "${prompt}"`);
        console.log(`   Longitud: ${prompt.length} chars`);

        // 3. Preparar payload para API
        const payload = {
            prompt: prompt,
            aspectRatio: '9:16',
            referenceImageUrl: 'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg'
        };

        // 4. Guardar payload para inspección
        const payloadPath = path.join(__dirname, '../../temp/test-json-converted-payload.json');
        await fs.writeFile(payloadPath, JSON.stringify(payload, null, 2));

        console.log(`\n💾 Payload guardado: ${payloadPath}`);

        // 5. Comando curl para ejecutar
        const curlCommand = `curl -X POST "http://localhost:3000/api/veo3/generate" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;

        console.log('\n🚀 Comando para generar video:');
        console.log(curlCommand);

        console.log('\n📊 COMPARATIVA:');
        console.log('   JSON original: Control granular de audio (whisper/normal/loud)');
        console.log('   Prompt texto:  "speaking in Spanish whisper building to emphatic loud finish"');
        console.log('   Expectativa:   Audio similar al playground con JSON');

        console.log('\n✅ Test preparado. Ejecuta el comando curl arriba para generar el video.');
        console.log('   Compara resultado con video playground para validar conversión.');

    } catch (error) {
        console.error('❌ Error en test:', error.message);
        process.exit(1);
    }
}

// Ejecutar test
testJsonToPrompt();
