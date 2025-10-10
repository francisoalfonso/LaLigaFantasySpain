/**
 * Validación rápida de los 3 fixes aplicados
 * 9 Oct 2025 - Pre-E2E validation
 */

const UnifiedScriptGenerator = require('../../backend/services/veo3/unifiedScriptGenerator');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');

// Test data - Pere Milla
const TEST_PLAYER = {
    name: 'Pere Milla',
    team: 'Espanyol',
    price: 6.64,
    valueRatio: 1.42,
    stats: {
        goals: 3,
        assists: 0,
        games: 6,
        rating: 7.0
    },
    position: 'DEL'
};

console.log('\n🔬 VALIDACIÓN DE FIXES PRE-E2E\n');
console.log('='.repeat(60));

// ====================================
// Fix #1: Prompt reforzado español
// ====================================
console.log('\n✅ FIX #1: PROMPT ESPAÑOL REFORZADO\n');

const promptBuilder = new PromptBuilder();
const testPrompt = promptBuilder.buildPrompt({
    dialogue: 'Test de acento español',
    emotion: 'curiosidad'
});

console.log('Prompt generado:');
console.log(testPrompt.substring(0, 200) + '...\n');

const hasCASTILLIAN = testPrompt.includes('CASTILIAN SPANISH');
const hasEUROPEAN = testPrompt.includes('EUROPEAN SPANISH accent');
const hasCRITICAL = testPrompt.includes('CRITICAL');

console.log('Validaciones:');
console.log(`  - Contiene "CASTILIAN SPANISH": ${hasCASTILLIAN ? '✅' : '❌'}`);
console.log(`  - Contiene "EUROPEAN SPANISH accent": ${hasEUROPEAN ? '✅' : '❌'}`);
console.log(`  - Contiene "CRITICAL": ${hasCRITICAL ? '✅' : '❌'}`);

const fix1Status = hasCASTILLIAN && hasEUROPEAN && hasCRITICAL;
console.log(`\nFix #1: ${fix1Status ? '✅ CORRECTO' : '❌ FALLIDO'}`);

// ====================================
// Fix #2: UnifiedScriptGenerator integrado
// ====================================
console.log('\n='.repeat(60));
console.log('\n✅ FIX #2: UNIFIED SCRIPT GENERATOR\n');

const scriptGenerator = new UnifiedScriptGenerator();
const unifiedScript = scriptGenerator.generateUnifiedScript('chollo', TEST_PLAYER);

console.log(`Script generado para: ${TEST_PLAYER.name}`);
console.log(`Total segmentos: ${unifiedScript.segments.length}\n`);

unifiedScript.segments.forEach((seg, idx) => {
    console.log(`Segmento ${idx + 1}:`);
    console.log(`  Rol: ${seg.role}`);
    console.log(`  Emoción: ${seg.emotion}`);
    console.log(`  Duración: ${seg.duration}s`);
    console.log(`  Diálogo: "${seg.dialogue.substring(0, 70)}..."`);
    console.log('');
});

// Validar número conversión
const hasNumberConversion = unifiedScript.segments.some(seg =>
    seg.dialogue.includes('seis punto seis cuatro') ||
    seg.dialogue.includes('uno punto cuatro')
);

console.log('Validaciones:');
console.log(`  - 3 segmentos generados: ${unifiedScript.segments.length === 3 ? '✅' : '❌'}`);
console.log(`  - Emociones detectadas: ${unifiedScript.segments.every(s => s.emotion) ? '✅' : '❌'}`);
console.log(`  - Conversión de números: ${hasNumberConversion ? '✅' : '❌'}`);
console.log(`  - Duración validada: ${unifiedScript.segments.every(s => s.duration > 0) ? '✅' : '❌'}`);

const fix2Status =
    unifiedScript.segments.length === 3 &&
    unifiedScript.segments.every(s => s.emotion) &&
    hasNumberConversion &&
    unifiedScript.segments.every(s => s.duration > 0);

console.log(`\nFix #2: ${fix2Status ? '✅ CORRECTO' : '❌ FALLIDO'}`);

// ====================================
// Fix #3: Sistema emociones conectado
// ====================================
console.log('\n='.repeat(60));
console.log('\n✅ FIX #3: SISTEMA EMOCIONES CONECTADO\n');

const testDialogue = unifiedScript.segments[0].dialogue;
const testEmotion = unifiedScript.segments[0].emotion;

console.log(`Emoción detectada: "${testEmotion}"`);
console.log(`Diálogo: "${testDialogue.substring(0, 70)}..."\n`);

const emotionalPrompt = promptBuilder.buildPrompt({
    dialogue: testDialogue,
    emotion: testEmotion
});

console.log('Prompt emocional generado:');
console.log(emotionalPrompt.substring(0, 300) + '...\n');

// Verificar que el prompt usa la emoción (debería tener tono específico)
const hasEmotionalTone =
    emotionalPrompt.includes('conspiratorial') ||
    emotionalPrompt.includes('whisper') ||
    emotionalPrompt.includes('authority') ||
    emotionalPrompt.includes('urgency') ||
    emotionalPrompt.includes('energy and emotion');

console.log('Validaciones:');
console.log(`  - Emoción pasada al prompt: ${testEmotion ? '✅' : '❌'}`);
console.log(`  - Tono emocional en prompt: ${hasEmotionalTone ? '✅' : '❌'}`);

const fix3Status = testEmotion && hasEmotionalTone;
console.log(`\nFix #3: ${fix3Status ? '✅ CORRECTO' : '❌ FALLIDO'}`);

// ====================================
// RESUMEN FINAL
// ====================================
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMEN VALIDACIÓN\n');

console.log(`Fix #1 (Prompt español reforzado):      ${fix1Status ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Fix #2 (UnifiedScript integrado):       ${fix2Status ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Fix #3 (Emociones conectadas):          ${fix3Status ? '✅ PASS' : '❌ FAIL'}`);

const allFixed = fix1Status && fix2Status && fix3Status;

console.log('\n' + '='.repeat(60));

if (allFixed) {
    console.log('\n✅ TODOS LOS FIXES VALIDADOS - SISTEMA LISTO PARA E2E\n');
    console.log('Probabilidad de éxito estimada: ~90%');
    console.log('\nPróximo paso: Lanzar E2E con 3 segmentos Pere Milla\n');
    process.exit(0);
} else {
    console.log('\n❌ ALGUNOS FIXES FALLARON - REVISAR ANTES DE E2E\n');
    process.exit(1);
}
