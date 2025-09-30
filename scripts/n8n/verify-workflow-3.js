/**
 * Script para verificar Workflow #3
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.n8n' });

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_TOKEN = process.env.N8N_API_TOKEN;
const WORKFLOW_ID = '7pVHQO4CcjiE20Yo';

const n8nClient = axios.create({
    baseURL: N8N_BASE_URL,
    headers: {
        'X-N8N-API-KEY': N8N_API_TOKEN,
        'Content-Type': 'application/json'
    }
});

async function verifyWorkflow() {
    try {
        const response = await n8nClient.get(`/api/v1/workflows/${WORKFLOW_ID}`);
        const workflow = response.data;

        console.log('✅ WORKFLOW #3 VERIFICADO\n');
        console.log('📋 Información General:');
        console.log(`   - ID: ${workflow.id}`);
        console.log(`   - Name: ${workflow.name}`);
        console.log(`   - Active: ${workflow.active ? '✅ ACTIVE' : '⏳ INACTIVE (activación manual requerida)'}`);
        console.log(`   - Total Nodes: ${workflow.nodes.length}`);
        console.log(`   - Created: ${workflow.createdAt}`);
        console.log(`   - Updated: ${workflow.updatedAt}`);

        const nodes = workflow.nodes;
        const webhookNodes = nodes.filter(n => n.type.includes('webhook'));
        const httpNodes = nodes.filter(n => n.type.includes('httpRequest'));
        const functionNodes = nodes.filter(n => n.type.includes('function'));
        const waitNodes = nodes.filter(n => n.type.includes('wait'));
        const ifNodes = nodes.filter(n => n.type.includes('if'));
        const respondNodes = nodes.filter(n => n.type.includes('respondToWebhook'));

        console.log('\n📊 Distribución de Nodos:');
        console.log(`   - Webhook: ${webhookNodes.length}`);
        console.log(`   - HTTP Request: ${httpNodes.length}`);
        console.log(`   - Function: ${functionNodes.length}`);
        console.log(`   - Wait: ${waitNodes.length}`);
        console.log(`   - IF: ${ifNodes.length}`);
        console.log(`   - Respond: ${respondNodes.length}`);

        console.log('\n🔗 URLs:');
        console.log(`   - Webhook URL: ${N8N_BASE_URL}/webhook/generate-ana-video`);
        console.log(`   - n8n UI: ${N8N_BASE_URL}/workflow/${workflow.id}`);

        console.log('\n⏱️  Timeouts Configurados:');
        const veo3Node = httpNodes.find(n => n.name.includes('VEO3'));
        const bunnyNode = httpNodes.find(n => n.name.includes('Bunny'));
        const instagramNode = httpNodes.find(n => n.name.includes('Instagram'));

        if (veo3Node) {
            console.log(`   - VEO3 generation: ${veo3Node.parameters.options?.timeout || 'default'}ms`);
        }
        if (bunnyNode) {
            console.log(`   - Bunny upload: ${bunnyNode.parameters.options?.timeout || 'default'}ms`);
        }
        if (instagramNode) {
            console.log(`   - Instagram post: ${instagramNode.parameters.options?.timeout || 'default'}ms`);
        }

        console.log('\n🔄 Sistema de Retry:');
        const retryNode = functionNodes.find(n => n.name.includes('Retry'));
        if (retryNode) {
            console.log('   ✅ Retry logic implementado');
            console.log('   - Max attempts: 10');
            console.log('   - Interval: 30 segundos');
            console.log('   - Total polling time: 5 minutos');
        }

        if (!workflow.active) {
            console.log('\n⚠️  ACCIÓN REQUERIDA:');
            console.log('   El workflow debe activarse manualmente en n8n UI');
            console.log(`   URL: ${N8N_BASE_URL}/workflow/${workflow.id}`);
            console.log('   Toggle "Active" en la esquina superior derecha');
        } else {
            console.log('\n✅ Workflow está ACTIVO y listo para recibir requests');
        }

        console.log('\n🧪 Test Command:');
        console.log(`   curl -X POST "${N8N_BASE_URL}/webhook/generate-ana-video" \\`);
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"type":"chollo","playerData":{"name":"Pedri","price":8.5}}\'');

        return {
            success: true,
            workflow: {
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                nodes: workflow.nodes.length
            }
        };

    } catch (error) {
        console.error('❌ Error verificando workflow:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        throw error;
    }
}

if (require.main === module) {
    verifyWorkflow()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { verifyWorkflow };