/**
 * Test: Verificar scripts conversacionales sin pronunciar números
 */

const UnifiedScriptGenerator = require('../../backend/services/veo3/unifiedScriptGenerator');

const generator = new UnifiedScriptGenerator();

const playerData = {
    name: 'Pere Milla',
    team: 'Espanyol',
    price: 6.64,
    ratio: 1.42,
    stats: {
        goals: 3,
        assists: 0,
        games: 6,
        rating: 7.0
    }
};

console.log('\n📝 NUEVOS SCRIPTS CONVERSACIONALES (sin pronunciar números):\n');

const result = generator.generateUnifiedScript('chollo', playerData);

console.log('SEGMENTO 1 (INTRO):');
console.log('  "' + result.segments[0].dialogue + '"\n');

console.log('SEGMENTO 2 (STATS):');
console.log('  "' + result.segments[1].dialogue + '"\n');

console.log('SEGMENTO 3 (OUTRO):');
console.log('  "' + result.segments[2].dialogue + '"\n');

const seg0 = result.segments[0].dialogue;
const seg1 = result.segments[1].dialogue;

const hasNumbers = seg0.includes('seis punto') || seg1.includes('uno punto');
const hasPrecioRegalado = seg0.includes('precio regalado');
const hasExpresionesVirales = seg1.includes('dobla') || seg1.includes('espectaculares');

console.log('✅ VALIDACIÓN:');
console.log('  - NO contiene cifras numéricas: ' + !hasNumbers);
console.log('  - SÍ contiene "precio regalado": ' + hasPrecioRegalado);
console.log('  - SÍ contiene expresiones virales: ' + hasExpresionesVirales);
console.log('');

if (!hasNumbers && hasPrecioRegalado && hasExpresionesVirales) {
    console.log('✅ TODOS LOS CHECKS PASADOS - Script conversacional correcto\n');
    process.exit(0);
} else {
    console.log('❌ ALGUNOS CHECKS FALLARON - Revisar template\n');
    process.exit(1);
}
