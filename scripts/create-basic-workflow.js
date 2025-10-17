/**
 * Script simple para crear un workflow básico de prueba en n8n
 */

require('dotenv').config({ path: '.env.n8n' });
const axios = require('axios');

const n8nUrl = process.env.N8N_BASE_URL;
const apiKey = process.env.N8N_API_TOKEN;

console.log('🚀 Creando workflow de prueba en n8n local...\n');

const workflowData = {
    name: 'Test Workflow - Fantasy La Liga',
    nodes: [
        {
            parameters: {},
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300]
        },
        {
            parameters: {
                values: {
                    string: [
                        {
                            name: 'message',
                            value: '✅ n8n está funcionando correctamente!'
                        }
                    ]
                }
            },
            name: 'Set Message',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300]
        }
    ],
    connections: {
        Start: {
            main: [[{ node: 'Set Message', type: 'main', index: 0 }]]
        }
    },
    settings: {}
};

axios
    .post(`${n8nUrl}/api/v1/workflows`, workflowData, {
        headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('✅ Workflow creado exitosamente!');
        console.log(`   ID: ${response.data.id}`);
        console.log(`   Nombre: ${response.data.name}`);
        console.log(`\n🎉 ¡n8n está listo para usar!`);
        console.log(`\nAbre: ${n8nUrl}/workflow/${response.data.id}`);
    })
    .catch(error => {
        console.error('❌ Error:', error.response?.data || error.message);
    });
