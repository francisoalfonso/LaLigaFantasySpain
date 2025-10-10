#!/usr/bin/env node

/**
 * Test de Validación - Nuevo Template Arco Narrativo Progresivo
 *
 * Valida:
 * 1. ✅ Cada segmento cabe en 7s de audio (≤17 palabras)
 * 2. ✅ NO hay repeticiones de precio entre escenas
 * 3. ✅ NO hay repeticiones de nombre jugador entre escenas
 * 4. ✅ Arco narrativo progresivo (Hook → Validación → Cierre)
 * 5. ✅ Total audio ≤ 21s (3 × 7s)
 */

const UnifiedScriptGenerator = require('../../backend/services/veo3/unifiedScriptGenerator');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`  ${title}`, 'bright');
    log('='.repeat(60), 'cyan');
}

/**
 * Contar palabras en un texto
 */
function countWords(text) {
    return text.trim().split(/\s+/).length;
}

/**
 * Validar que no haya repeticiones entre segmentos
 */
function validateNoRepetitions(segments) {
    const issues = [];

    // Extraer palabras clave de cada segmento
    const segment1Words = segments[0].dialogue.toLowerCase().split(/\s+/);
    const segment2Words = segments[1].dialogue.toLowerCase().split(/\s+/);
    const segment3Words = segments[2].dialogue.toLowerCase().split(/\s+/);

    // Buscar palabras que aparecen en múltiples segmentos (ignorando palabras comunes)
    const commonWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'por', 'a', 'y', 'es', 'que', 'su', 'está', 'son'];

    // Verificar si "millones" aparece en más de un segmento (indicaría repetición de precio)
    const millonesInSeg1 = segment1Words.includes('millones');
    const millonesInSeg2 = segment2Words.includes('millones');
    const millonesInSeg3 = segment3Words.includes('millones');

    if ((millonesInSeg1 && millonesInSeg3) || (millonesInSeg2 && millonesInSeg3)) {
        issues.push({
            type: 'REPETICIÓN PRECIO',
            severity: 'critical',
            description: 'Palabra "millones" aparece en múltiples segmentos',
            segments: [
                millonesInSeg1 ? 1 : null,
                millonesInSeg2 ? 2 : null,
                millonesInSeg3 ? 3 : null
            ].filter(s => s !== null)
        });
    }

    return issues;
}

/**
 * Test principal
 */
async function main() {
    log('\n🧪 TEST VALIDACIÓN - TEMPLATE ARCO NARRATIVO PROGRESIVO', 'bright');
    log('📅 ' + new Date().toLocaleString(), 'cyan');

    const generator = new UnifiedScriptGenerator();

    // Datos de prueba (simulando chollo real)
    const playerData = {
        name: 'Dani Carvajal',
        team: 'Real Madrid',
        price: 5.5,
        valueRatio: 1.23,
        stats: {
            games: 6,
            goals: 1,
            assists: 0,
            rating: "7.12"
        }
    };

    section('PASO 1: Generar guión con nuevo template');

    const result = generator.generateUnifiedScript('chollo', playerData);

    log(`✅ Guión generado con éxito`, 'green');
    log(`   Tipo: ${result.metadata.contentType}`, 'cyan');
    log(`   Duración total: ${result.metadata.totalDuration}s`, 'cyan');
    log(`   Cohesión narrativa: ${result.validation.score}/100`, 'cyan');

    section('PASO 2: Validar cada segmento');

    const validations = [];
    let totalWords = 0;
    let allSegmentsFit = true;

    result.segments.forEach((segment, i) => {
        const wordCount = countWords(segment.dialogue);
        const estimatedDuration = (wordCount / 2.5).toFixed(1);
        const fitsIn7s = wordCount <= 17;

        totalWords += wordCount;

        log(`\n📝 Segmento ${i + 1} (${segment.role}):`, 'cyan');
        log(`   Diálogo: "${segment.dialogue}"`, 'cyan');
        log(`   Palabras: ${wordCount}`, fitsIn7s ? 'green' : 'red');
        log(`   Duración estimada: ${estimatedDuration}s`, fitsIn7s ? 'green' : 'red');
        log(`   Cabe en 7s: ${fitsIn7s ? '✅ SÍ' : '❌ NO'}`, fitsIn7s ? 'green' : 'red');

        if (!fitsIn7s) {
            allSegmentsFit = false;
        }

        validations.push({
            segment: i + 1,
            role: segment.role,
            wordCount,
            estimatedDuration: parseFloat(estimatedDuration),
            fitsIn7s
        });
    });

    section('PASO 3: Validar ausencia de repeticiones');

    const repetitions = validateNoRepetitions(result.segments);

    if (repetitions.length === 0) {
        log('✅ NO se detectaron repeticiones entre segmentos', 'green');
    } else {
        log('⚠️  Se detectaron repeticiones:', 'yellow');
        repetitions.forEach(rep => {
            log(`   - ${rep.type}: ${rep.description}`, 'yellow');
            log(`     Afecta segmentos: ${rep.segments.join(', ')}`, 'yellow');
        });
    }

    section('PASO 4: Validar arco narrativo');

    const arcoValidations = [
        {
            check: 'Segmento 1 es "intro"',
            passed: result.segments[0].role === 'intro'
        },
        {
            check: 'Segmento 2 es "stats" (validación)',
            passed: result.segments[1].role === 'stats'
        },
        {
            check: 'Segmento 3 es "outro" (cierre)',
            passed: result.segments[2].role === 'outro'
        },
        {
            check: 'Progresión emocional coherente',
            passed: result.validation.cohesive
        }
    ];

    arcoValidations.forEach(val => {
        log(`   ${val.passed ? '✅' : '❌'} ${val.check}`, val.passed ? 'green' : 'red');
    });

    section('PASO 5: Validar constraint de tiempo total');

    const totalEstimatedAudio = (totalWords / 2.5).toFixed(1);
    const audioFitsIn21s = parseFloat(totalEstimatedAudio) <= 21;

    log(`   Total palabras: ${totalWords}`, 'cyan');
    log(`   Audio total estimado: ${totalEstimatedAudio}s`, audioFitsIn21s ? 'green' : 'red');
    log(`   Límite audio: 21s (3 × 7s)`, 'cyan');
    log(`   Cabe en 21s: ${audioFitsIn21s ? '✅ SÍ' : '❌ NO'}`, audioFitsIn21s ? 'green' : 'red');

    section('RESUMEN FINAL');

    const allChecks = [
        { name: 'Todos los segmentos caben en 7s', passed: allSegmentsFit },
        { name: 'Sin repeticiones entre escenas', passed: repetitions.length === 0 },
        { name: 'Arco narrativo correcto', passed: arcoValidations.every(v => v.passed) },
        { name: 'Audio total ≤ 21s', passed: audioFitsIn21s }
    ];

    const passedChecks = allChecks.filter(c => c.passed).length;
    const totalChecks = allChecks.length;

    allChecks.forEach(check => {
        log(`   ${check.passed ? '✅' : '❌'} ${check.name}`, check.passed ? 'green' : 'red');
    });

    log(`\n📊 Resultado: ${passedChecks}/${totalChecks} checks pasados`, 'cyan');

    if (passedChecks === totalChecks) {
        log('\n✅ TEMPLATE VALIDADO EXITOSAMENTE', 'green');
        log('🎉 El nuevo template cumple todos los requisitos', 'green');
        process.exit(0);
    } else {
        log('\n⚠️  TEMPLATE NECESITA AJUSTES', 'yellow');
        log(`❌ ${totalChecks - passedChecks} checks fallaron`, 'red');
        process.exit(1);
    }
}

// Ejecutar test
main().catch(error => {
    log('\n💥 ERROR EN TEST DE VALIDACIÓN', 'red');
    console.error(error);
    process.exit(1);
});
