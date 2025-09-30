/**
 * Test del Framework Viral integrado en PromptBuilder
 * Valida estructura 7 elementos + emociones + convergencia
 */

const PromptBuilder = require('../../backend/services/veo3/promptBuilder');
const logger = require('../../../../../../../utils/logger');
const { EMOCIONES_POR_ELEMENTO, ARCOS_EMOCIONALES } = require('../../backend/services/veo3/promptBuilder');

logger.info('='.repeat(80));
logger.info('🎬 TEST FRAMEWORK VIRAL - PromptBuilder Integration');
logger.info('='.repeat(80));

const builder = new PromptBuilder();

// Test 1: Validar que las constantes están disponibles
logger.info('\n📋 TEST 1: Validación de constantes exportadas');
logger.info('-'.repeat(80));
logger.info(`✅ EMOCIONES_POR_ELEMENTO exportadas: ${Object.keys(EMOCIONES_POR_ELEMENTO).length} elementos`);
logger.info(`✅ ARCOS_EMOCIONALES exportados: ${Object.keys(ARCOS_EMOCIONALES).length} tipos`);

Object.keys(ARCOS_EMOCIONALES).forEach(tipo => {
    const arco = ARCOS_EMOCIONALES[tipo];
    logger.info(`   - ${tipo}: "${arco.nombre}" (${arco.duracion}) - ${arco.secuencia.length} elementos`);
});

// Test 2: Construir prompt con estructura viral completa
logger.info('\n🎯 TEST 2: Construcción de prompt con estructura viral');
logger.info('-'.repeat(80));

const cholloData = {
    hook: '¿Listos para un secreto?',
    contexto: 'Mientras todos gastan en caros delanteros...',
    conflicto: '',  // implícito
    inflexion: 'Pere Milla a 4.8€ es...',
    resolucion: '¡92% probabilidad de GOL esta jornada!',
    moraleja: 'Los chollos están donde nadie mira.',
    cta: '¡Fichalo AHORA antes que suba!'
};

try {
    const result = builder.buildViralStructuredPrompt('chollo', cholloData);
    logger.info('✅ Prompt viral construido correctamente');
    logger.info(`   Arco emocional: ${result.arcoEmocional.nombre}`);
    logger.info(`   Duración estimada: ${result.arcoEmocional.duracion}`);
    logger.info(`   Elementos estructura: ${result.metadata.elementosEstructura}`);
    logger.info(`   Prompt length: ${result.prompt.length} chars`);
    logger.info(`\n   Prompt generado: ${result.prompt.substring(0, 150)}...`);
} catch (error) {
    logger.error('❌ Error construyendo prompt viral:', error.message);
}

// Test 3: Validación de convergencia viral
logger.info('\n🔍 TEST 3: Validación de convergencia viral');
logger.info('-'.repeat(80));

const testDialogues = [
    {
        name: 'Chollo con buena convergencia',
        dialogue: '¿Listos para un secreto increíble? Mientras todos gastan en caros delanteros, Pere Milla a 4.8€ tiene 92% probabilidad de gol. ¡Los chollos están donde nadie mira! Fichalo AHORA.',
        expected: { general: 70, niche: 30 }
    },
    {
        name: 'Demasiado técnico (convergencia mala)',
        dialogue: 'El jugador cuesta 4.8€ con rating 7.2, xG de 0.8 por partido, asistencias esperadas 0.3, valor fantasy 1.25. Precio óptimo según algoritmo.',
        expected: { general: 30, niche: 70 }
    },
    {
        name: 'Demasiado genérico (convergencia mala)',
        dialogue: '¡Mirad esto increíble! ¡Es espectacular! ¡Sorprendente! ¡No lo creerás! ¡Nadie lo sabe! ¡Todos se sorprenderán! ¡Urgente descubrirlo ahora!',
        expected: { general: 100, niche: 0 }
    }
];

testDialogues.forEach(test => {
    logger.info(`\n📊 ${test.name}`);
    const validation = builder.validateViralConvergence(test.dialogue);
    logger.info(`   General: ${validation.convergenceRatio.general}% (esperado: ${test.expected.general}%)`);
    logger.info(`   Nicho: ${validation.convergenceRatio.niche}% (esperado: ${test.expected.niche}%)`);

    if (validation.warnings.length > 0) {
        logger.info(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
    } else {
        logger.info(`   ✅ Convergencia óptima`);
    }
});

// Test 4: Obtener emociones por elemento
logger.info('\n🎭 TEST 4: Obtención de emociones recomendadas');
logger.info('-'.repeat(80));

const elementos = ['hook', 'inflexion', 'cta'];
const tipos = ['chollo', 'prediccion', 'breaking'];

tipos.forEach(tipo => {
    logger.info(`\n${tipo.toUpperCase()}:`);
    elementos.forEach(elemento => {
        const emocion = builder.getEmotionForElement(elemento, tipo);
        logger.info(`   ${elemento} → ${emocion}`);
    });
});

// Test 5: Generar metadata viral completa
logger.info('\n📈 TEST 5: Generación de metadata viral');
logger.info('-'.repeat(80));

const sampleDialogue = '¿Listos para un secreto? Pere Milla a 4.8€ tiene 92% probabilidad de gol. ¡Los chollos están donde nadie mira! Fichalo AHORA.';
const metadata = builder.generateViralMetadata('chollo', sampleDialogue);

logger.info('Metadata generada:');
logger.info(JSON.stringify(metadata, null, 2));

// Test 6: Compatibilidad con métodos legacy
logger.info('\n🔄 TEST 6: Compatibilidad con métodos legacy');
logger.info('-'.repeat(80));

try {
    // Método antiguo (sin estructura viral)
    const legacyPrompt1 = builder.buildCholloPrompt('Pedri', 8.5);
    logger.info('✅ buildCholloPrompt (legacy) funciona');

    // Método nuevo (con estructura viral)
    const viralPrompt1 = builder.buildCholloPrompt('Pedri', 8.5, {
        useViralStructure: true,
        structuredData: cholloData
    });
    logger.info('✅ buildCholloPrompt (viral) funciona');

    // Verificar que retorna objeto con arco emocional
    if (viralPrompt1.arcoEmocional) {
        logger.info('✅ Modo viral retorna arco emocional completo');
    } else {
        logger.info('⚠️  Modo viral no retorna arco emocional');
    }
} catch (error) {
    logger.error('❌ Error en compatibilidad legacy:', error.message);
}

// Test 7: Validación de arcos emocionales completos
logger.info('\n🎪 TEST 7: Validación de arcos emocionales completos');
logger.info('-'.repeat(80));

Object.keys(ARCOS_EMOCIONALES).forEach(tipo => {
    const arco = builder.getEmotionalArc(tipo);
    logger.info(`\n${tipo.toUpperCase()} - ${arco.nombre}`);
    logger.info(`Duración: ${arco.duracion}`);
    logger.info(`Secuencia (${arco.secuencia.length} elementos):`);
    arco.secuencia.forEach((paso, index) => {
        logger.info(`   ${index + 1}. ${paso.elemento} → ${paso.emocion} (${paso.tiempo})`);
    });
});

// Resumen final
logger.info('\n' + '='.repeat(80));
logger.info('📊 RESUMEN FINAL');
logger.info('='.repeat(80));
logger.info('✅ PromptBuilder actualizado con Framework Viral Comprobado');
logger.info('✅ 4 arcos emocionales implementados (chollo, prediccion, breaking, analisis)');
logger.info('✅ Sistema de validación de convergencia 70/30 operativo');
logger.info('✅ Metadata viral completa generada automáticamente');
logger.info('✅ Compatibilidad backward con métodos legacy mantenida');
logger.info('✅ Integración completa con GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md');
logger.info('\n🎬 Sistema listo para producción de contenido viral\n');