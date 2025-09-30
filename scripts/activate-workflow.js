/**
 * Script para activar un workflow en n8n
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.n8n') });

const N8N_API_TOKEN = process.env.N8N_API_TOKEN;
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-n8n.6ld9pv.easypanel.host';
const WORKFLOW_ID = process.argv[2] || 'YjvjMbHILQjUZjJz';

const axiosInstance = axios.create({
    baseURL: N8N_BASE_URL,
    headers: {
        'X-N8N-API-KEY': N8N_API_TOKEN,
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

async function activateWorkflow() {
    try {
        console.log(`🔄 Obteniendo workflow ${WORKFLOW_ID}...`);

        // 1. GET workflow actual
        const getResponse = await axiosInstance.get(`/api/v1/workflows/${WORKFLOW_ID}`);
        const workflow = getResponse.data;

        console.log(`📋 Workflow: ${workflow.name}`);
        console.log(`📊 Estado actual: ${workflow.active ? 'ACTIVE' : 'INACTIVE'}`);

        if (workflow.active) {
            console.log('✅ Workflow ya está activo');
            return { success: true, alreadyActive: true };
        }

        // 2. PUT workflow con active: true
        console.log('🚀 Activando workflow...');

        // Limpiar propiedades de solo lectura
        const cleanWorkflow = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
            active: true
        };

        const putResponse = await axiosInstance.put(`/api/v1/workflows/${WORKFLOW_ID}`, cleanWorkflow);
        const updatedWorkflow = putResponse.data;

        console.log('\n✅ WORKFLOW ACTIVADO EXITOSAMENTE\n');
        console.log('📋 Workflow ID:', updatedWorkflow.id);
        console.log('📝 Workflow Name:', updatedWorkflow.name);
        console.log('✅ Estado:', updatedWorkflow.active ? 'ACTIVE ✅' : 'INACTIVE ❌');
        console.log('📊 Nodos:', updatedWorkflow.nodes?.length || 0);

        return {
            success: true,
            workflowId: updatedWorkflow.id,
            workflowName: updatedWorkflow.name,
            active: updatedWorkflow.active
        };

    } catch (error) {
        console.error('\n❌ ERROR ACTIVANDO WORKFLOW');
        console.error('Mensaje:', error.message);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }

        return {
            success: false,
            error: error.message
        };
    }
}

if (require.main === module) {
    activateWorkflow()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 OPERACIÓN COMPLETADA');
                process.exit(0);
            } else {
                console.error('\n❌ OPERACIÓN FALLIDA');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Error inesperado:', error);
            process.exit(1);
        });
}

module.exports = { activateWorkflow };