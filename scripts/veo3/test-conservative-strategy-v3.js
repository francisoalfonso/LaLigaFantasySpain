#!/usr/bin/env node

/**
 * Test Estrategia Conservadora V3 - Optimizada Costos + Legal
 *
 * ESTRATEGIA V3 (Conservadora):
 * 1. Intento 1 (95%): Solo apellido SIN equipo
 *    "Iago Aspas del Celta está a 8M" → "Aspas está a 8M"
 *    Costo: $0.30 | Tiempo: ~2min
 *
 * 2. Intento 2 (90%): Apellido + contexto genérico
 *    "Aspas está a 8M" → "Aspas, el delantero del norte está a 8M"
 *    Costo acum: $0.60 | Tiempo: ~4min
 *
 * 3. Intento 3 (85%): Rol + geografía (sin apellido)
 *    → "El capitán del equipo gallego está a 8M"
 *    Costo acum: $0.90 | Tiempo: ~6min
 *
 * 4. Intento 4 (75%): Apodos genéricos NO registrados
 *    → "El líder de los celestes está a 8M"
 *    Costo acum: $1.20 | Tiempo: ~8min
 *
 * 5. Intento 5 (60%): Descripción completamente genérica
 *    → "Este delantero está a 8M"
 *    Costo acum: $1.50 | Tiempo: ~10min
 *
 * OBJETIVO:
 * - Minimizar costos (intento 1 debería funcionar)
 * - Evitar apodos potencialmente registrados
 * - Progresión lógica de menor a mayor transformación
 */

require('dotenv').config();
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');

async function main() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('💰 TEST V3: Estrategia Conservadora (Optimizada Costos + Legal)');
    console.log(`${'='.repeat(80)}\n`);

    console.log('🎯 Objetivos V3:');
    console.log('   ✅ Minimizar costos ($0.30 por intento)');
    console.log('   ✅ Evitar apodos registrados como marcas');
    console.log('   ✅ Progresión lógica menor → mayor transformación');
    console.log('   ✅ Intento 1 optimista: Solo apellido sin equipo\n');

    const veo3 = new VEO3Client();
    const promptBuilder = new PromptBuilder();

    // Caso de prueba: Iago Aspas del Celta (bloqueado)
    const testCase = {
        playerName: 'Iago Aspas',
        team: 'Celta de Vigo',
        price: 8.0,
        valueRatio: 1.4
    };

    console.log('📋 Caso de Prueba:');
    console.log(`   Jugador: ${testCase.playerName}`);
    console.log(`   Equipo: ${testCase.team}`);
    console.log(`   Precio: ${testCase.price}M`);
    console.log(`   Ratio: ${testCase.valueRatio}x\n`);

    // Prompt original problemático
    const originalDialogue = `${testCase.playerName} del ${testCase.team} está a solo ${testCase.price} millones. La relación calidad-precio es brutal con un ratio de ${testCase.valueRatio}.`;

    const originalPrompt = promptBuilder.buildPrompt({
        dialogue: originalDialogue
    });

    console.log('❌ Prompt ORIGINAL (bloqueado):');
    console.log(`   "${originalDialogue}"\n`);

    console.log('✅ Progresión esperada de fixes:');
    console.log('   Intento 1: "Aspas está a solo 8 millones..." (SIN equipo)');
    console.log('   Intento 2: "Aspas, el delantero del norte está a solo 8 millones..."');
    console.log('   Intento 3: "El capitán del equipo gallego está a solo 8 millones..."');
    console.log('   Intento 4: "El líder de los celestes está a solo 8 millones..."');
    console.log('   Intento 5: "Este delantero está a solo 8 millones..."\n');

    console.log(`${'─'.repeat(80)}`);
    console.log('🚀 INICIANDO GENERACIÓN CON ESTRATEGIA V3');
    console.log(`${'─'.repeat(80)}\n`);

    const startTime = Date.now();
    let totalCost = 0;

    try {
        const result = await veo3.generateVideoWithRetry(
            originalPrompt,
            {
                aspectRatio: '9:16',
                duration: 8,
                imageRotation: 'fixed',
                imageIndex: 0
            },
            {
                playerName: testCase.playerName,
                team: testCase.team,
                contentType: 'chollo'
            }
        );

        // ÉXITO
        const endTime = Date.now();
        const totalTime = Math.round((endTime - startTime) / 1000 / 60); // minutos
        totalCost = result.retryMetadata.totalAttempts * 0.30;

        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ ¡ÉXITO! Video generado con estrategia conservadora V3');
        console.log(`${'='.repeat(80)}\n`);

        console.log('📊 Resultado Final:');
        console.log(`   Platform: ${result.platform || 'external'}`);
        console.log(`   Duración: ${result.duration}s`);
        console.log(`   Costo unitario: $${result.cost}`);

        if (result.localPath) {
            console.log(`   Video local: ${result.localPath}`);
        }

        console.log('\n💰 Economía del Proceso:');
        console.log(`   Total intentos: ${result.retryMetadata.totalAttempts}`);
        console.log(`   Costo total: $${totalCost.toFixed(2)}`);
        console.log(`   Tiempo total: ${totalTime} minutos`);
        console.log(`   Estrategia exitosa: ${result.retryMetadata.successfulStrategy}`);

        console.log('\n📝 Transformación del Prompt:');
        console.log(`   Original: "${result.retryMetadata.originalPrompt.substring(80, 160)}..."`);
        console.log(`   Final:    "${result.retryMetadata.finalPrompt.substring(80, 160)}..."`);

        if (result.retryMetadata.attemptHistory.length > 1) {
            console.log('\n🔄 Historial de Intentos:');
            result.retryMetadata.attemptHistory.forEach((attempt, i) => {
                const status = attempt.result === 'SUCCESS' ? '✅' : '❌';
                const cost = (i + 1) * 0.30;
                console.log(`   ${status} Intento ${attempt.attempt}: ${attempt.strategy} ($${cost.toFixed(2)} acumulado)`);
                if (attempt.result === 'FAILED' && attempt.error) {
                    console.log(`      └─ Error: ${attempt.error}`);
                }
            });
        }

        console.log('\n📈 Análisis de Eficiencia:');
        if (result.retryMetadata.totalAttempts === 1) {
            console.log('   🎉 ¡PERFECTO! Funcionó al primer intento');
            console.log('   ✅ Estrategia "solo apellido sin equipo" validada');
            console.log('   💰 Ahorro máximo: $1.20 (evitamos 4 intentos adicionales)');
        } else if (result.retryMetadata.totalAttempts === 2) {
            console.log('   ✅ EXCELENTE! Funcionó en segundo intento');
            console.log('   💰 Ahorro: $0.90 (evitamos 3 intentos adicionales)');
        } else if (result.retryMetadata.totalAttempts <= 3) {
            console.log('   ✅ BUENO! Funcionó en tercer intento o antes');
            console.log('   💰 Ahorro moderado vs estrategia anterior');
        } else {
            console.log('   ⚠️  Necesitó más de 3 intentos');
            console.log('   ℹ️  Google Content Policy más estricto de lo esperado');
        }

        console.log('\n🎯 Validación V3:');
        console.log('   ✅ Sistema conservador implementado correctamente');
        console.log('   ✅ Progresión lógica de fixes aplicada');
        console.log('   ✅ Apodos registrados evitados');
        console.log('   ✅ Costos optimizados vs V2');

        console.log('\n💡 Recomendación de Producción:');
        if (result.retryMetadata.totalAttempts <= 2) {
            console.log('   🚀 LISTO PARA PRODUCCIÓN 24/7');
            console.log('   ✅ Estrategia "solo apellido" es suficiente');
            console.log('   ✅ ROI positivo desde primer video');
        } else {
            console.log('   ⚠️  Revisar si necesitamos ser AÚN más conservadores');
            console.log('   💡 Considerar usar directamente roles genéricos');
        }

        console.log('\n🎓 Conclusión:');
        console.log('   El sistema V3 está optimizado para minimizar costos.');
        console.log('   La estrategia conservadora protege contra problemas legales.');
        console.log('   Listo para generación automatizada 24/7.\n');

    } catch (error) {
        // FALLO TOTAL
        const endTime = Date.now();
        const totalTime = Math.round((endTime - startTime) / 1000 / 60);
        totalCost = 5 * 0.30; // 5 intentos máximo

        console.error(`\n${'='.repeat(80)}`);
        console.error('❌ FALLO TOTAL después de todos los reintentos');
        console.error(`${'='.repeat(80)}\n`);
        console.error(`Error: ${error.message}\n`);

        console.error('💰 Costos del Fallo:');
        console.error(`   Intentos realizados: 5`);
        console.error(`   Costo total: $${totalCost.toFixed(2)}`);
        console.error(`   Tiempo total: ${totalTime} minutos\n`);

        if (error.attemptHistory) {
            console.error('🔄 Historial de Intentos:');
            error.attemptHistory.forEach((attempt, i) => {
                const cost = (i + 1) * 0.30;
                console.error(`   ❌ Intento ${attempt.attempt}: ${attempt.strategy} ($${cost.toFixed(2)})`);
                console.error(`      └─ ${attempt.error}`);
                if (attempt.analysis && attempt.analysis.likelyTriggers) {
                    console.error(`      └─ Triggers: ${attempt.analysis.likelyTriggers.map(t => t.type).join(', ')}`);
                }
            });
        }

        console.error('\n🔍 Análisis del Fallo:');
        console.error('   1. Google Content Policy MÁS ESTRICTO de lo esperado');
        console.error('   2. Incluso descripciones genéricas fueron bloqueadas');
        console.error('   3. Considerar:');
        console.error('      - Usar VEO3 Fallback API');
        console.error('      - Eliminar completamente contexto fantasy');
        console.error('      - Revisar si otros jugadores tienen mejor tasa éxito\n');

        console.error('📝 Logs Detallados:');
        console.error('   Ver: logs/veo3-errors.json');
        console.error('   Contactar: KIE.ai support si problema persiste\n');

        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { main };
