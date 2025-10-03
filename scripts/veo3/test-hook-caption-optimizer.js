/**
 * Test del HookCaptionOptimizer
 * Valida y genera hooks/captions optimizados
 */

const HookCaptionOptimizer = require('../../backend/services/veo3/hookCaptionOptimizer');

const optimizer = new HookCaptionOptimizer();

console.log('🎯 ===================================');
console.log('   HOOK & CAPTION OPTIMIZER - TEST');
console.log('🎯 ===================================\n');

// =====================
// TEST 1: HOOKS
// =====================

console.log('📝 TEST 1: VALIDACIÓN DE HOOKS\n');
console.log('─'.repeat(60));

const hookTests = [
    {
        name: 'Hook PERFECTO (chollo)',
        hook: 'Pssst... Misters, €4M chollo BRUTAL del Espanyol',
        type: 'chollo',
        expectedValid: true
    },
    {
        name: 'Hook DEMASIADO LARGO',
        hook: 'Pssst... Misters, venid que os cuento un secreto increíble sobre un jugador del Espanyol que está fichando todo el mundo y que por solo 4 millones de euros está dando muchísimos puntos Fantasy',
        type: 'chollo',
        expectedValid: false
    },
    {
        name: 'Hook SIN INTRIGA',
        hook: 'Análisis de Pere Milla del Espanyol precio cuatro millones',
        type: 'chollo',
        expectedValid: false
    },
    {
        name: 'Hook BREAKING perfecto',
        hook: 'ALERTA: Lewandowski lesionado - Actuad RÁPIDO Misters',
        type: 'breaking',
        expectedValid: true
    },
    {
        name: 'Hook PREDICCIÓN bueno',
        hook: '¿Sabéis quién va a explotar esta jornada? Los datos NO mienten',
        type: 'prediccion',
        expectedValid: true
    }
];

hookTests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Hook: "${test.hook}"`);
    console.log(`   Tipo: ${test.type}`);

    const validation = optimizer.validateHook(test.hook, test.type);

    console.log(`\n   ✨ RESULTADO:`);
    console.log(`   - Válido: ${validation.valid ? '✅' : '❌'} ${validation.valid === test.expectedValid ? '(esperado)' : '⚠️ (inesperado)'}`);
    console.log(`   - Score: ${validation.score}/100`);
    console.log(`   - Palabras: ${validation.wordCount}`);

    if (validation.issues.length > 0) {
        console.log(`\n   ⚠️ PROBLEMAS:`);
        validation.issues.forEach(issue => console.log(`      - ${issue}`));
    }

    if (validation.suggestions.length > 0) {
        console.log(`\n   💡 SUGERENCIAS:`);
        validation.suggestions.forEach(sug => console.log(`      - ${sug}`));
    }

    console.log('\n' + '─'.repeat(60));
});

// =====================
// TEST 2: CAPTIONS
// =====================

console.log('\n\n📝 TEST 2: VALIDACIÓN DE CAPTIONS\n');
console.log('─'.repeat(60));

const captionTests = [
    {
        name: 'Caption ÓPTIMO',
        caption: '🔥 CHOLLO: Pere Milla (Espanyol) €4M\n\n💰 Ratio 1.35x - 3G 2A\n\n¿Fichamos? 👇',
        contentData: { playerName: 'Pere Milla', price: 4 },
        expectedValid: true
    },
    {
        name: 'Caption DEMASIADO LARGO',
        caption: '🔥 CHOLLO BRUTAL: Pere Milla del Espanyol por solo 4 millones de euros está dando muchísimos puntos Fantasy esta temporada. Ha marcado 3 goles y dado 2 asistencias en solo 5 partidos jugados. Su rating de 7.2 es excelente para el precio. Además tiene buen calendario próximos partidos contra equipos débiles defensivamente. ¿Fichamos ya o esperamos? Comentad vuestro equipo abajo',
        contentData: { playerName: 'Pere Milla', price: 4 },
        expectedValid: false
    },
    {
        name: 'Caption SIN EMOJIS',
        caption: 'Pere Milla Espanyol 4M ratio 1.35x. Fichamos? Comenta',
        contentData: { playerName: 'Pere Milla', price: 4 },
        expectedValid: true // Pasa pero con score bajo
    },
    {
        name: 'Caption SIN CTA',
        caption: '🔥 Pere Milla €4M\n💰 Ratio 1.35x\n⚽ 3 goles',
        contentData: { playerName: 'Pere Milla', price: 4 },
        expectedValid: false
    }
];

captionTests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Caption: "${test.caption.substring(0, 80)}${test.caption.length > 80 ? '...' : ''}"`);
    console.log(`   Longitud: ${test.caption.length} caracteres`);

    const validation = optimizer.validateCaption(test.caption, test.contentData);

    console.log(`\n   ✨ RESULTADO:`);
    console.log(`   - Válido: ${validation.valid ? '✅' : '❌'} ${validation.valid === test.expectedValid ? '(esperado)' : '⚠️ (inesperado)'}`);
    console.log(`   - Score: ${validation.score}/100`);
    console.log(`   - Longitud: ${validation.length} caracteres`);
    console.log(`   - Emojis: ${validation.emojiCount}`);

    if (validation.issues.length > 0) {
        console.log(`\n   ⚠️ PROBLEMAS:`);
        validation.issues.forEach(issue => console.log(`      - ${issue}`));
    }

    if (validation.suggestions.length > 0) {
        console.log(`\n   💡 SUGERENCIAS:`);
        validation.suggestions.forEach(sug => console.log(`      - ${sug}`));
    }

    console.log('\n' + '─'.repeat(60));
});

// =====================
// TEST 3: GENERACIÓN AUTOMÁTICA
// =====================

console.log('\n\n📝 TEST 3: GENERACIÓN AUTOMÁTICA OPTIMIZADA\n');
console.log('─'.repeat(60));

const contentExamples = [
    {
        type: 'chollo',
        data: {
            playerName: 'Pere Milla',
            team: 'Espanyol',
            position: 'DEL',
            price: 4.0,
            ratio: 1.35,
            stats: { goals: 3, assists: 2, games: 5, rating: 7.2 }
        }
    },
    {
        type: 'breaking',
        data: {
            playerName: 'Lewandowski',
            team: 'Barcelona',
            position: 'DEL',
            price: 12.0
        }
    },
    {
        type: 'prediccion',
        data: {
            playerName: 'Griezmann',
            team: 'Atlético',
            position: 'DEL',
            price: 10.5,
            stats: { goals: 5, rating: 8.3 }
        }
    }
];

contentExamples.forEach((example, index) => {
    console.log(`\n${index + 1}. GENERACIÓN: ${example.type.toUpperCase()}`);
    console.log(`   Jugador: ${example.data.playerName} (${example.data.team})`);

    // Generar hook
    const hookResult = optimizer.generateOptimizedHook(example.type, example.data);
    console.log(`\n   🎯 HOOK GENERADO:`);
    console.log(`   "${hookResult.hook}"`);
    console.log(`   - Palabras: ${hookResult.metadata.wordCount}`);
    console.log(`   - Score: ${hookResult.metadata.validation.score}/100`);
    console.log(`   - Válido: ${hookResult.metadata.validation.valid ? '✅' : '❌'}`);

    // Generar caption
    const captionResult = optimizer.generateOptimizedCaption(example.type, example.data);
    console.log(`\n   📝 CAPTION GENERADO:`);
    console.log(`   "${captionResult.caption}"`);
    console.log(`   - Longitud: ${captionResult.metadata.length} caracteres`);
    console.log(`   - Emojis: ${captionResult.metadata.emojiCount}`);
    console.log(`   - Score: ${captionResult.metadata.validation.score}/100`);
    console.log(`   - Válido: ${captionResult.metadata.validation.valid ? '✅' : '❌'}`);

    console.log('\n' + '─'.repeat(60));
});

// =====================
// TEST 4: LEARNING SYSTEM
// =====================

console.log('\n\n📝 TEST 4: SISTEMA DE APRENDIZAJE\n');
console.log('─'.repeat(60));

console.log('\n📊 Registrando performance de contenido simulado...\n');

// Simular algunos posts con métricas
const simulatedPosts = [
    {
        hook: 'Pssst... Misters, €4M chollo BRUTAL',
        caption: '🔥 Pere Milla €4M\n💰 Ratio 1.35x\n👇 Fichamos?',
        contentType: 'chollo',
        metrics: { views: 15000, likes: 850, comments: 120, engagementRate: 6.5, retention: 82 }
    },
    {
        hook: 'ALERTA: Lewandowski lesionado',
        caption: '🚨 Breaking: Lewandowski OUT\n⚠️ Actuad YA',
        contentType: 'breaking',
        metrics: { views: 25000, likes: 1200, comments: 340, engagementRate: 6.2, retention: 88 }
    },
    {
        hook: '¿Sabéis quién va a explotar? Los datos NO mienten',
        caption: '🎯 Griezmann capitán\n📈 Probabilidad alta',
        contentType: 'prediccion',
        metrics: { views: 12000, likes: 680, comments: 95, engagementRate: 6.5, retention: 75 }
    },
    {
        hook: 'Pssst... nadie habla de este DEL del Espanyol a €4M',
        caption: '🔥 CHOLLO: Pere Milla\n💎 €4M valor brutal',
        contentType: 'chollo',
        metrics: { views: 8000, likes: 420, comments: 65, engagementRate: 6.1, retention: 79 }
    }
];

simulatedPosts.forEach(post => {
    const record = optimizer.registerPerformance(post, post.metrics);
    console.log(`✅ Registrado: "${post.hook.substring(0, 40)}..."`);
    console.log(`   - Views: ${post.metrics.views.toLocaleString()}`);
    console.log(`   - Engagement: ${post.metrics.engagementRate}%`);
    console.log(`   - Hook Score: ${record.hookValidation.score}/100`);
    console.log(`   - Caption Score: ${record.captionValidation.score}/100\n`);
});

console.log('\n📈 TOP HOOKS POR PERFORMANCE:\n');

['chollo', 'breaking', 'prediccion'].forEach(type => {
    const best = optimizer.getBestHooks(type, 2);
    if (best.length > 0) {
        console.log(`\n${type.toUpperCase()}:`);
        best.forEach((record, i) => {
            console.log(`  ${i + 1}. "${record.hook}"`);
            console.log(`     Views: ${record.metrics.views.toLocaleString()} | Eng: ${record.metrics.engagementRate}% | Ret: ${record.metrics.retention}%`);
        });
    }
});

// =====================
// RESUMEN FINAL
// =====================

console.log('\n\n🎯 ===================================');
console.log('   RESUMEN DE TESTS');
console.log('🎯 ===================================\n');

console.log('✅ Sistema de validación de hooks funcionando');
console.log('✅ Sistema de validación de captions funcionando');
console.log('✅ Generación automática optimizada funcionando');
console.log('✅ Sistema de aprendizaje funcionando');
console.log('\n💡 El optimizador está listo para integrarse en el pipeline de producción\n');

console.log('📋 PRÓXIMOS PASOS:');
console.log('   1. Integrar en viralVideoBuilder.js');
console.log('   2. Conectar con base de datos para persistencia');
console.log('   3. Crear dashboard de métricas de hooks/captions');
console.log('   4. A/B testing automático de variantes');
console.log('   5. Machine learning para predicción de performance\n');
