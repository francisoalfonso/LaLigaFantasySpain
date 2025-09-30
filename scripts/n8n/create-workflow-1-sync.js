/**
 * Script para crear Workflow #1: Sincronización Diaria de Datos
 * Ejecutar: node scripts/n8n/create-workflow-1-sync.js
 */

const N8nWorkflowBuilder = require('../../backend/services/n8nWorkflowBuilder');

async function main() {
    console.log('🚀 Iniciando creación de Workflow #1: Sincronización Diaria');
    console.log('━'.repeat(60));

    const builder = new N8nWorkflowBuilder();

    try {
        // Crear workflow
        console.log('\n📝 Creando workflow en n8n...');
        const result = await builder.createDailySyncWorkflow();

        if (result.success) {
            console.log('\n✅ ÉXITO: Workflow creado correctamente');
            console.log('━'.repeat(60));
            console.log('📊 Detalles del Workflow:');
            console.log(`   ID: ${result.workflow.id}`);
            console.log(`   Nombre: ${result.workflow.name}`);
            console.log(`   Estado: ${result.workflow.active ? 'ACTIVO ✅' : 'INACTIVO ❌'}`);
            console.log(`   Nodos: ${result.workflow.nodes.length}`);
            console.log(`   Tags: ${result.workflow.tags.join(', ')}`);
            console.log('━'.repeat(60));

            console.log('\n🔗 Acceso al workflow:');
            console.log(`   URL: https://n8n-n8n.6ld9pv.easypanel.host/workflow/${result.workflow.id}`);

            console.log('\n⏰ Programación:');
            console.log('   Ejecuta automáticamente cada día a las 8:00 AM');
            console.log('   Cron: 0 8 * * * (diario)');

            console.log('\n📧 Notificaciones:');
            console.log('   Email de éxito: laligafantasyspainpro@gmail.com');
            console.log('   Email de error: laligafantasyspainpro@gmail.com');

            console.log('\n🧪 Test Manual:');
            console.log(`   Ejecuta: node scripts/n8n/test-workflow-1.js ${result.workflow.id}`);

            console.log('\n✨ Workflow listo para usar!\n');

        } else {
            console.error('\n❌ ERROR: No se pudo crear el workflow');
            console.error('━'.repeat(60));
            console.error('Error:', result.error);
            if (result.details) {
                console.error('Detalles:', JSON.stringify(result.details, null, 2));
            }
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();