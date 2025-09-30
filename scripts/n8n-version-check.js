#!/usr/bin/env node
/**
 * Script automatizado de verificación de versiones n8n
 * Compara MCP local vs VPS y genera alertas
 *
 * Uso:
 * node scripts/n8n-version-check.js
 *
 * Configurar cron para ejecutar diariamente:
 * 0 9 * * * cd /path/to/project && node scripts/n8n-version-check.js
 */

const N8nVersionControl = require('../backend/services/n8nVersionControl');
const logger = require('../backend/utils/logger');

async function checkVersions() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 N8N VERSION CHECK - Verificación automática');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    const versionControl = new N8nVersionControl();

    try {
        // Ejecutar comparación
        logger.info('Iniciando verificación de versiones n8n MCP vs VPS');

        const comparison = await versionControl.compareVersions();

        // Mostrar resumen
        console.log('\n📊 RESUMEN DE COMPARACIÓN:');
        console.log('-'.repeat(80));
        console.log(
            `Local MCP: ${comparison.local.version} (${comparison.local.workflowCount} workflows) - ${comparison.local.status}`
        );
        console.log(
            `VPS: ${comparison.vps.version} (${comparison.vps.workflowCount} workflows) - ${comparison.vps.status}`
        );
        console.log('-'.repeat(80));

        if (comparison.needsUpdate) {
            console.log(`\n⚠️  DESINCRONIZACIÓN DETECTADA - Severity: ${comparison.severity}`);
            console.log(`Total diferencias: ${comparison.differences.length}\n`);

            comparison.differences.forEach((diff, index) => {
                console.log(`${index + 1}. [${diff.severity}] ${diff.type}`);
                console.log(`   ${diff.message}`);
                if (diff.workflows && diff.workflows.length > 0) {
                    console.log(`   Workflows afectados: ${diff.workflows.slice(0, 3).join(', ')}${diff.workflows.length > 3 ? '...' : ''}`);
                }
            });

            console.log('\n🔧 ACCIONES RECOMENDADAS:');
            console.log('1. Revisar logs de n8n en VPS');
            console.log('2. Sincronizar workflows desactualizados');
            console.log('3. Actualizar versión de n8n si es necesario');
            console.log('4. Verificar estado de servicios en VPS\n');

            logger.warn('Desincronización n8n detectada en verificación automática', {
                severity: comparison.severity,
                differenceCount: comparison.differences.length,
                local: comparison.local,
                vps: comparison.vps
            });
        } else {
            console.log('\n✅ SISTEMAS SINCRONIZADOS');
            console.log('Local MCP y VPS están en sync. No se requieren acciones.\n');

            logger.success('Verificación n8n completada - Sistemas sincronizados', {
                local: comparison.local,
                vps: comparison.vps
            });
        }

        // Guardar snapshot
        console.log(`📁 Snapshot guardado en: logs/n8n-versions/`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ Verificación completada');
        console.log('='.repeat(80) + '\n');

        // Exit code basado en severidad
        if (comparison.severity === 'CRITICAL') {
            process.exit(2); // Critical issue
        } else if (comparison.needsUpdate) {
            process.exit(1); // Warning
        } else {
            process.exit(0); // Success
        }
    } catch (error) {
        console.error('\n❌ ERROR en verificación de versiones:');
        console.error(error.message);
        console.error(error.stack);

        logger.error('Error en verificación automática n8n', {
            error: error.message,
            stack: error.stack
        });

        process.exit(3); // Error
    }
}

// Ejecutar verificación
checkVersions();