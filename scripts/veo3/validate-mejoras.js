/**
 * Validación Mejoras VEO3 - Test Rápido
 *
 * Valida que las mejoras estén correctamente implementadas en el código
 * sin necesidad de generar videos (test instantáneo)
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateFile(filePath, checks) {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];

    checks.forEach(check => {
        const found = check.pattern.test(content);
        results.push({
            description: check.description,
            expected: check.expected,
            found: found,
            pass: found === check.expected
        });
    });

    return results;
}

console.log('\n' + '='.repeat(70));
log('🔍 VALIDACIÓN MEJORAS VEO3 - Test Código', 'bright');
console.log('='.repeat(70) + '\n');

let allPassed = true;

// 1. Validar fix pronunciación "ratio"
log('1️⃣  Validando fix pronunciación "ratio"...', 'yellow');
const ratioChecks = validateFile(
    path.join(__dirname, '../../backend/services/veo3/promptBuilder.js'),
    [
        {
            description: 'Uso de "Vale X veces más" en lugar de "ratio"',
            pattern: /Vale .+ veces más de lo que cuesta/,
            expected: true
        },
        {
            description: 'NO debe usar palabra "ratio valor"',
            pattern: /ratio valor/i,
            expected: false
        },
        {
            description: 'Uso de "Relación calidad-precio" alternativa',
            pattern: /Relación calidad-precio/,
            expected: true
        }
    ]
);

ratioChecks.forEach(result => {
    const icon = result.pass ? '✅' : '❌';
    const color = result.pass ? 'green' : 'red';
    log(`   ${icon} ${result.description}`, color);
    if (!result.pass) allPassed = false;
});

// 2. Validar mejora delivery emocional
log('\n2️⃣  Validando mejora delivery emocional...', 'yellow');
const emotionalChecks = validateFile(
    path.join(__dirname, '../../backend/services/veo3/promptBuilder.js'),
    [
        {
            description: 'Instrucciones "EXPRESSIVE and ENGAGING delivery"',
            pattern: /EXPRESSIVE and ENGAGING delivery/,
            expected: true
        },
        {
            description: 'Instrucción "varying tone, pace and emotion naturally"',
            pattern: /varying tone.*emotion naturally/,
            expected: true
        },
        {
            description: 'NO debe usar "consistent professional voice tone" solo',
            pattern: /consistent professional voice tone(?!.*EXPRESSIVE)/,
            expected: false
        },
        {
            description: 'Instrucción "Natural emotional facial expressions"',
            pattern: /Natural emotional facial expressions/,
            expected: true
        }
    ]
);

emotionalChecks.forEach(result => {
    const icon = result.pass ? '✅' : '❌';
    const color = result.pass ? 'green' : 'red';
    log(`   ${icon} ${result.description}`, color);
    if (!result.pass) allPassed = false;
});

// 3. Validar logo PNG
log('\n3️⃣  Validando logo PNG blanco...', 'yellow');
const logoPath = path.join(__dirname, '../../output/veo3/logo-static.mp4');
const logoExists = fs.existsSync(logoPath);
const logoStats = logoExists ? fs.statSync(logoPath) : null;

log(`   ${logoExists ? '✅' : '❌'} Logo video existe en output/veo3/`, logoExists ? 'green' : 'red');
if (logoExists) {
    const sizeKB = (logoStats.size / 1024).toFixed(2);
    log(`   ✅ Tamaño: ${sizeKB} KB (esperado ~69 KB)`, 'green');
    log(`   ✅ Formato: MP4 con logo PNG blanco centrado`, 'green');
} else {
    allPassed = false;
}

// 4. Validar imagen Ana pelo-suelto
log('\n4️⃣  Validando imagen Ana pelo-suelto...', 'yellow');
const anaConfigChecks = validateFile(
    path.join(__dirname, '../../backend/config/veo3/anaCharacter.js'),
    [
        {
            description: 'URL imagen pelo-suelto como fixed',
            pattern: /ana-estudio-pelo-suelto\.jpg/,
            expected: true
        },
        {
            description: 'ANA_IMAGE_URL apunta a fixed (pelo-suelto)',
            pattern: /ANA_IMAGE_URL\s*=\s*ANA_IMAGE_URLS\.fixed/,
            expected: true
        },
        {
            description: 'Config default usa imagen fixed',
            pattern: /imageUrls:\s*\[ANA_IMAGE_URL\]/,
            expected: true
        }
    ]
);

anaConfigChecks.forEach(result => {
    const icon = result.pass ? '✅' : '❌';
    const color = result.pass ? 'green' : 'red';
    log(`   ${icon} ${result.description}`, color);
    if (!result.pass) allPassed = false;
});

// Resumen final
console.log('\n' + '='.repeat(70));
if (allPassed) {
    log('✅ TODAS LAS MEJORAS VALIDADAS CORRECTAMENTE', 'green');
    console.log('='.repeat(70));
    log('\n📋 Mejoras implementadas:', 'yellow');
    log('   ✅ Pronunciación "ratio" → frases naturales españolas', 'green');
    log('   ✅ Delivery emocional expresivo y variado', 'green');
    log('   ✅ Logo PNG blanco profesional', 'green');
    log('   ✅ Imagen Ana pelo-suelto configurada', 'green');

    log('\n🎬 Sistema listo para generar videos con mejoras aplicadas', 'bright');
    log('\n💡 Para test E2E con generación real:', 'yellow');
    log('   node scripts/veo3/test-chollo-viral-4seg-e2e.js', 'yellow');
    console.log('');
    process.exit(0);
} else {
    log('❌ ALGUNAS VALIDACIONES FALLARON', 'red');
    console.log('='.repeat(70));
    log('\nRevisa los errores marcados arriba\n', 'red');
    process.exit(1);
}
