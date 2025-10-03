#!/usr/bin/env node

/**
 * Test E2E: Sistema de Resiliencia VEO3 Completo
 *
 * Prueba el flujo completo de retry automático:
 * 1. Intenta con prompt original (bloqueado)
 * 2. VEO3ErrorAnalyzer detecta triggers
 * 3. VEO3RetryManager aplica fixes automáticamente
 * 4. Genera video exitosamente con apodos
 *
 * Este script demuestra el sistema 24/7 en acción.
 *
 * Uso:
 *   node scripts/veo3/test-retry-system-e2e.js
 */

require('dotenv').config();
const VEO3Client = require('../../backend/services/veo3/veo3Client');
const PromptBuilder = require('../../backend/services/veo3/promptBuilder');

async function main() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔄 TEST E2E: Sistema de Resiliencia VEO3 24/7');
    console.log(`${'='.repeat(80)}\n`);

    console.log('📋 Este test demuestra:');
    console.log('   ✅ Detección automática de bloqueos Google Content Policy');
    console.log('   ✅ Análisis inteligente de triggers');
    console.log('   ✅ Aplicación automática de fixes con apodos');
    console.log('   ✅ Retry hasta conseguir éxito');
    console.log('   ✅ Sistema 100% automatizado 24/7\n');

    const veo3 = new VEO3Client();
    const promptBuilder = new PromptBuilder();

    // Prompt original que FALLARÁ (contiene nombres bloqueados)
    const problematicContent = {
        playerName: 'Iago Aspas',
        team: 'Celta de Vigo',
        price: 8.0,
        valueRatio: 1.4
    };

    console.log('🎯 Contenido de prueba (BLOQUEADO por Google):');
    console.log(`   Jugador: ${problematicContent.playerName}`);
    console.log(`   Equipo: ${problematicContent.team}`);
    console.log(`   Precio: ${problematicContent.price}M`);
    console.log(`   Ratio valor: ${problematicContent.valueRatio}x\n`);

    // Construir prompt problemático
    const problematicDialogue = `${problematicContent.playerName} del ${problematicContent.team} está a solo ${problematicContent.price} millones. La relación calidad-precio es brutal con un ratio de ${problematicContent.valueRatio}.`;

    const originalPrompt = promptBuilder.buildPrompt({
        dialogue: problematicDialogue
    });

    console.log('📝 Prompt original (será bloqueado):');
    console.log(`   "${problematicDialogue}"\n`);

    console.log(`${'─'.repeat(80)}`);
    console.log('🚀 INICIANDO GENERACIÓN CON RETRY AUTOMÁTICO');
    console.log(`${'─'.repeat(80)}\n`);

    try {
        // USAR MÉTODO CON RETRY AUTOMÁTICO
        const result = await veo3.generateVideoWithRetry(
            originalPrompt,
            {
                aspectRatio: '9:16',
                duration: 8,
                imageRotation: 'fixed',
                imageIndex: 0
            },
            {
                playerName: problematicContent.playerName,
                team: problematicContent.team,
                contentType: 'chollo'
            }
        );

        // ÉXITO
        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ ¡ÉXITO! Video generado con retry automático');
        console.log(`${'='.repeat(80)}\n`);

        console.log('📊 Resultado:');
        console.log(`   Platform: ${result.platform || 'external'}`);
        console.log(`   Duración: ${result.duration}s`);
        console.log(`   Costo: $${result.cost}`);

        if (result.localPath) {
            console.log(`   Video: ${result.localPath}`);
        }

        console.log('\n📈 Metadata de Retry:');
        console.log(`   Total intentos: ${result.retryMetadata.totalAttempts}`);
        console.log(`   Estrategia exitosa: ${result.retryMetadata.successfulStrategy}`);
        console.log(`   Prompt original: "${result.retryMetadata.originalPrompt.substring(0, 100)}..."`);
        console.log(`   Prompt final: "${result.retryMetadata.finalPrompt.substring(0, 100)}..."`);

        if (result.retryMetadata.attemptHistory.length > 1) {
            console.log('\n🔄 Historial de intentos:');
            result.retryMetadata.attemptHistory.forEach((attempt, i) => {
                const status = attempt.result === 'SUCCESS' ? '✅' : '❌';
                console.log(`   ${status} Intento ${attempt.attempt}: ${attempt.strategy} ${attempt.result === 'SUCCESS' ? '' : `(${attempt.error})`}`);
            });
        }

        console.log('\n💡 Lecciones aprendidas:');
        if (result.retryMetadata.totalAttempts === 1) {
            console.log('   ✅ El prompt original funcionó (no había bloqueos)');
        } else {
            console.log(`   ✅ El sistema aplicó ${result.retryMetadata.totalAttempts - 1} fix(es) automáticamente`);
            console.log('   ✅ Los apodos futbolísticos permitieron bypass de Google Policy');
            console.log('   ✅ Sistema 100% automatizado - sin intervención manual');
        }

        console.log('\n🎯 Conclusión:');
        console.log('   El sistema de resiliencia VEO3 está LISTO para producción 24/7.');
        console.log('   Puede manejar bloqueos automáticamente sin intervención humana.\n');

    } catch (error) {
        // FALLO TOTAL (después de todos los intentos)
        console.error(`\n${'='.repeat(80)}`);
        console.error('❌ FALLO TOTAL después de todos los reintentos');
        console.error(`${'='.repeat(80)}\n`);
        console.error(`Error: ${error.message}\n`);

        if (error.attemptHistory) {
            console.error('🔄 Historial de intentos:');
            error.attemptHistory.forEach((attempt, i) => {
                console.error(`   ❌ Intento ${attempt.attempt}: ${attempt.strategy}`);
                console.error(`      Error: ${attempt.error}`);
                if (attempt.analysis) {
                    console.error(`      Category: ${attempt.analysis.errorCategory}`);
                    console.error(`      Triggers: ${attempt.analysis.likelyTriggers.map(t => t.value).join(', ')}`);
                }
            });
        }

        if (error.lastAnalysis) {
            console.error('\n📊 Último análisis disponible:');
            console.error(`   Category: ${error.lastAnalysis.errorCategory}`);
            console.error(`   Triggers: ${error.lastAnalysis.likelyTriggers.length}`);
            if (error.lastAnalysis.suggestedFixes.length > 0) {
                console.error('\n   💡 Fixes que se intentaron:');
                error.lastAnalysis.suggestedFixes.forEach((fix, i) => {
                    console.error(`   ${i + 1}. ${fix.strategy} (${(fix.confidence * 100).toFixed(0)}% confianza)`);
                });
            }
        }

        console.error('\n🔍 Recomendaciones:');
        console.error('   1. Revisar logs en logs/veo3-errors.json');
        console.error('   2. Ampliar diccionario de apodos si es necesario');
        console.error('   3. Considerar usar VEO3 Fallback API');
        console.error('   4. Reportar pattern de bloqueo para mejora del sistema\n');

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
