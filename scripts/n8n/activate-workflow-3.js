/**
 * Script para activar Workflow #3: Fantasy La Liga - Ana VEO3 Video Generation
 *
 * n8n requiere actualizar el workflow completo para cambiar el estado active
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.n8n' });

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_TOKEN = process.env.N8N_API_TOKEN;
const WORKFLOW_ID = '7pVHQO4CcjiE20Yo';

if (!N8N_BASE_URL || !N8N_API_TOKEN) {
    console.error('❌ Error: N8N_BASE_URL y N8N_API_TOKEN son requeridos en .env.n8n');
    process.exit(1);
}

const n8nClient = axios.create({
    baseURL: N8N_BASE_URL,
    headers: {
        'X-N8N-API-KEY': N8N_API_TOKEN,
        'Content-Type': 'application/json'
    }
});

async function activateWorkflow3() {
    try {
        console.log('🚀 Activando Workflow #3: Ana VEO3 Video Generation\n');

        // 1. Obtener workflow actual
        console.log('📥 Obteniendo workflow actual...');
        const response = await n8nClient.get(`/api/v1/workflows/${WORKFLOW_ID}`);
        const workflow = response.data;

        console.log(`   - ID: ${workflow.id}`);
        console.log(`   - Name: ${workflow.name}`);
        console.log(`   - Current status: ${workflow.active ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   - Nodes: ${workflow.nodes.length}`);

        if (workflow.active) {
            console.log('\n✅ Workflow ya está activo. No es necesario activarlo.');
            return {
                success: true,
                message: 'Workflow ya estaba activo',
                workflowId: workflow.id
            };
        }

        // 2. Preparar payload para activación
        console.log('\n⚙️  Preparando activación...');
        const updatePayload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData || null,
            active: true
        };

        // 3. Actualizar workflow con active: true
        console.log('🔄 Actualizando workflow...');
        const updateResponse = await n8nClient.put(`/api/v1/workflows/${WORKFLOW_ID}`, updatePayload);
        const updatedWorkflow = updateResponse.data;

        console.log('\n✅ Workflow activado exitosamente');
        console.log(`   - Status: ${updatedWorkflow.active ? 'ACTIVE ✅' : 'INACTIVE ❌'}`);
        console.log(`   - Webhook URL: ${N8N_BASE_URL}/webhook/generate-ana-video`);

        console.log('\n📋 Información del workflow:');
        console.log(`   - ID: ${updatedWorkflow.id}`);
        console.log(`   - Name: ${updatedWorkflow.name}`);
        console.log(`   - Total nodos: ${updatedWorkflow.nodes.length}`);
        console.log(`   - Última actualización: ${new Date().toISOString()}`);

        console.log('\n🔗 Webhook activo en:');
        console.log(`   ${N8N_BASE_URL}/webhook/generate-ana-video`);

        console.log('\n💡 Testing comando:');
        console.log(`   curl -X POST "${N8N_BASE_URL}/webhook/generate-ana-video" \\`);
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"type":"chollo","playerData":{"name":"Pedri","price":8.5}}\'');

        return {
            success: true,
            workflowId: updatedWorkflow.id,
            active: updatedWorkflow.active,
            webhookUrl: `${N8N_BASE_URL}/webhook/generate-ana-video`
        };

    } catch (error) {
        console.error('❌ Error activando workflow:', error.message);

        if (error.response) {
            console.error('📋 Respuesta n8n:', error.response.status);
            console.error('📝 Detalles:', JSON.stringify(error.response.data, null, 2));
        }

        throw error;
    }
}

// Ejecutar script
if (require.main === module) {
    activateWorkflow3()
        .then(() => {
            console.log('\n🎉 Workflow #3 activado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Error activando workflow:', error.message);
            process.exit(1);
        });
}

module.exports = { activateWorkflow3 };