/**
 * Script para crear Workflow #2: Fantasy La Liga - Chollos Detection
 * Crea workflow programáticamente usando n8n API
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.n8n') });

const N8N_API_TOKEN = process.env.N8N_API_TOKEN;
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-n8n.6ld9pv.easypanel.host';

if (!N8N_API_TOKEN) {
    console.error('❌ N8N_API_TOKEN no configurado en .env.n8n');
    process.exit(1);
}

const axiosInstance = axios.create({
    baseURL: N8N_BASE_URL,
    headers: {
        'X-N8N-API-KEY': N8N_API_TOKEN,
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

/**
 * Workflow #2: Fantasy La Liga - Chollos Detection
 * Detecta chollos automáticamente y genera contenido para Instagram
 */
const workflowData = {
    name: "Fantasy La Liga - Chollos Detection",
    nodes: [
        // 1. Webhook Trigger
        {
            parameters: {
                httpMethod: "POST",
                path: "webhook/chollos-detected",
                responseMode: "responseNode",
                options: {}
            },
            id: "webhook-chollos-trigger",
            name: "Webhook Chollos Trigger",
            type: "n8n-nodes-base.webhook",
            typeVersion: 2,
            position: [240, 300],
            webhookId: `chollos-${Date.now()}`
        },

        // 2. Validate Input
        {
            parameters: {
                conditions: {
                    options: {
                        caseSensitive: true,
                        leftValue: "",
                        multipleConditions: "all"
                    },
                    conditions: [
                        {
                            id: "chollos-array-exists",
                            leftValue: "={{ $json.chollos }}",
                            rightValue: "",
                            operator: {
                                type: "array",
                                operation: "notEmpty"
                            }
                        }
                    ]
                }
            },
            id: "validate-chollos-input",
            name: "Validate Chollos Input",
            type: "n8n-nodes-base.if",
            typeVersion: 2,
            position: [460, 300]
        },

        // 3. Loop Over Items (chollos)
        {
            parameters: {
                batchSize: 1,
                options: {}
            },
            id: "loop-chollos",
            name: "Loop Over Chollos",
            type: "n8n-nodes-base.splitInBatches",
            typeVersion: 3,
            position: [680, 200]
        },

        // 4. Extract Chollo Data
        {
            parameters: {
                jsCode: `// Extraer datos del chollo individual
const chollos = $input.first().json.chollos || [];
const currentIndex = $('Loop Over Chollos').context.currentRunIndex || 0;
const chollo = chollos[currentIndex];

console.log('🎯 Procesando chollo:', chollo.name);

return {
    playerId: chollo.playerId,
    name: chollo.name,
    team: chollo.team,
    price: chollo.price,
    valueRatio: chollo.valueRatio,
    estimatedPoints: chollo.estimatedPoints,
    position: chollo.position || 'Unknown',
    currentIndex: currentIndex
};`
            },
            id: "extract-chollo-data",
            name: "Extract Chollo Data",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [900, 200]
        },

        // 5. HTTP Request - GPT-5 Mini (generar análisis textual)
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/content-ai/player-analysis",
                sendBody: true,
                bodyContentType: "json",
                jsonBody: `{
  "playerData": {
    "playerId": "={{ $json.playerId }}",
    "name": "={{ $json.name }}",
    "team": "={{ $json.team }}",
    "position": "={{ $json.position }}",
    "price": {{ $json.price }},
    "estimatedPoints": {{ $json.estimatedPoints }},
    "valueRatio": {{ $json.valueRatio }}
  },
  "contentType": "chollo",
  "includeWeather": false
}`,
                options: {}
            },
            id: "gpt5-analysis",
            name: "GPT-5 Mini Analysis",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4,
            position: [1120, 200]
        },

        // 6. HTTP Request - Image Generation (player card)
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/images/generate",
                sendBody: true,
                bodyContentType: "json",
                jsonBody: `{
  "type": "player_card",
  "playerId": "={{ $('Extract Chollo Data').item.json.playerId }}",
  "playerData": {
    "name": "={{ $('Extract Chollo Data').item.json.name }}",
    "team": "={{ $('Extract Chollo Data').item.json.team }}",
    "position": "={{ $('Extract Chollo Data').item.json.position }}",
    "price": {{ $('Extract Chollo Data').item.json.price }},
    "estimatedPoints": {{ $('Extract Chollo Data').item.json.estimatedPoints }},
    "valueRatio": {{ $('Extract Chollo Data').item.json.valueRatio }}
  }
}`,
                options: {}
            },
            id: "image-generation",
            name: "Generate Player Card",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4,
            position: [1340, 200]
        },

        // 7. Set Variables (preparar post Instagram)
        {
            parameters: {
                assignments: {
                    assignments: [
                        {
                            id: "instagram-caption",
                            name: "caption",
                            value: "={{ $('GPT-5 Mini Analysis').item.json.analysis || $('GPT-5 Mini Analysis').item.json.content }}",
                            type: "string"
                        },
                        {
                            id: "instagram-image",
                            name: "imageUrl",
                            value: "={{ $('Generate Player Card').item.json.imageUrl || $('Generate Player Card').item.json.url }}",
                            type: "string"
                        },
                        {
                            id: "player-name",
                            name: "playerName",
                            value: "={{ $('Extract Chollo Data').item.json.name }}",
                            type: "string"
                        },
                        {
                            id: "player-team",
                            name: "playerTeam",
                            value: "={{ $('Extract Chollo Data').item.json.team }}",
                            type: "string"
                        },
                        {
                            id: "timestamp",
                            name: "timestamp",
                            value: "={{ $now }}",
                            type: "string"
                        }
                    ]
                },
                options: {}
            },
            id: "prepare-instagram-post",
            name: "Prepare Instagram Post",
            type: "n8n-nodes-base.set",
            typeVersion: 3,
            position: [1560, 200]
        },

        // 8. HTTP Request - Instagram Post
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/instagram/post",
                sendBody: true,
                bodyContentType: "json",
                jsonBody: `{
  "caption": "={{ $json.caption }}",
  "imageUrl": "={{ $json.imageUrl }}",
  "playerName": "={{ $json.playerName }}",
  "playerTeam": "={{ $json.playerTeam }}"
}`,
                options: {}
            },
            id: "instagram-post",
            name: "Instagram Post",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4,
            position: [1780, 200]
        },

        // 9. Function - Log Results
        {
            parameters: {
                jsCode: `// Log resultado de publicación Instagram
const result = $input.first().json;
const playerName = $('Prepare Instagram Post').first().json.playerName;

console.log('=== ✅ INSTAGRAM POST PUBLICADO ===');
console.log('👤 Jugador:', playerName);
console.log('📱 Estado:', result.success ? 'SUCCESS' : 'FAILED');
console.log('🔗 Post ID:', result.postId || 'N/A');
console.log('🕐 Timestamp:', new Date().toISOString());
console.log('===================================');

return {
    success: result.success || false,
    playerName: playerName,
    postId: result.postId || null,
    timestamp: new Date().toISOString()
};`
            },
            id: "log-results",
            name: "Log Results",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [2000, 200]
        },

        // 10. Loop Back (si hay más chollos)
        {
            parameters: {},
            id: "loop-back",
            name: "Loop Back",
            type: "n8n-nodes-base.noOp",
            typeVersion: 1,
            position: [2220, 200]
        },

        // 11. Aggregate Results (después del loop)
        {
            parameters: {
                aggregate: "aggregateAllItemData",
                options: {}
            },
            id: "aggregate-results",
            name: "Aggregate Results",
            type: "n8n-nodes-base.aggregate",
            typeVersion: 1,
            position: [2440, 300]
        },

        // 12. Format Response
        {
            parameters: {
                jsCode: `// Formatear respuesta final del webhook
const items = $input.all();
const totalChollos = items.length;
const successfulPosts = items.filter(item => item.json.success).length;
const failedPosts = totalChollos - successfulPosts;

console.log('🎯 RESUMEN WORKFLOW CHOLLOS');
console.log('Total chollos procesados:', totalChollos);
console.log('Posts exitosos:', successfulPosts);
console.log('Posts fallidos:', failedPosts);

return {
    success: true,
    totalChollos: totalChollos,
    successfulPosts: successfulPosts,
    failedPosts: failedPosts,
    details: items.map(item => ({
        playerName: item.json.playerName,
        success: item.json.success,
        postId: item.json.postId
    })),
    timestamp: new Date().toISOString(),
    workflowName: 'Fantasy La Liga - Chollos Detection'
};`
            },
            id: "format-response",
            name: "Format Response",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [2660, 300]
        },

        // 13. Respond to Webhook
        {
            parameters: {
                respondWith: "json",
                responseBody: "={{ $json }}"
            },
            id: "respond-to-webhook",
            name: "Respond to Webhook",
            type: "n8n-nodes-base.respondToWebhook",
            typeVersion: 1,
            position: [2880, 300]
        },

        // 14. Error Handler - Invalid Input
        {
            parameters: {
                assignments: {
                    assignments: [
                        {
                            id: "error-flag",
                            name: "error",
                            value: "true",
                            type: "boolean"
                        },
                        {
                            id: "error-message",
                            name: "message",
                            value: "Invalid input: chollos array is required and must not be empty",
                            type: "string"
                        },
                        {
                            id: "timestamp",
                            name: "timestamp",
                            value: "={{ $now }}",
                            type: "string"
                        }
                    ]
                },
                options: {}
            },
            id: "error-invalid-input",
            name: "Error - Invalid Input",
            type: "n8n-nodes-base.set",
            typeVersion: 3,
            position: [680, 450]
        }
    ],

    connections: {
        "Webhook Chollos Trigger": {
            main: [
                [
                    {
                        node: "Validate Chollos Input",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Validate Chollos Input": {
            main: [
                [
                    {
                        node: "Loop Over Chollos",
                        type: "main",
                        index: 0
                    }
                ],
                [
                    {
                        node: "Error - Invalid Input",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Loop Over Chollos": {
            main: [
                [
                    {
                        node: "Extract Chollo Data",
                        type: "main",
                        index: 0
                    }
                ],
                [
                    {
                        node: "Aggregate Results",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Extract Chollo Data": {
            main: [
                [
                    {
                        node: "GPT-5 Mini Analysis",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "GPT-5 Mini Analysis": {
            main: [
                [
                    {
                        node: "Generate Player Card",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Generate Player Card": {
            main: [
                [
                    {
                        node: "Prepare Instagram Post",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Prepare Instagram Post": {
            main: [
                [
                    {
                        node: "Instagram Post",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Instagram Post": {
            main: [
                [
                    {
                        node: "Log Results",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Log Results": {
            main: [
                [
                    {
                        node: "Loop Back",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Loop Back": {
            main: [
                [
                    {
                        node: "Loop Over Chollos",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Aggregate Results": {
            main: [
                [
                    {
                        node: "Format Response",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Format Response": {
            main: [
                [
                    {
                        node: "Respond to Webhook",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Error - Invalid Input": {
            main: [
                [
                    {
                        node: "Respond to Webhook",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        }
    },

    settings: {
        executionOrder: "v1"
    },
    staticData: null
};

/**
 * Crear workflow en n8n
 */
async function createWorkflow() {
    console.log('🚀 Creando Workflow #2: Fantasy La Liga - Chollos Detection');
    console.log('📡 N8N URL:', N8N_BASE_URL);

    try {
        const response = await axiosInstance.post('/api/v1/workflows', workflowData);

        // Manejo flexible de la respuesta
        const workflow = response.data?.data || response.data;
        const webhookPath = workflowData.nodes[0].parameters.path;
        const webhookUrl = `${N8N_BASE_URL}/${webhookPath}`;

        console.log('\n✅ WORKFLOW CREADO EXITOSAMENTE\n');
        console.log('📋 Workflow ID:', workflow?.id || 'N/A');
        console.log('📝 Workflow Name:', workflow?.name || workflowData.name);
        console.log('🔗 Webhook URL:', webhookUrl);
        console.log('✅ Estado:', workflow?.active ? 'ACTIVE' : 'INACTIVE');
        console.log('📊 Nodos totales:', workflow?.nodes?.length || workflowData.nodes.length);
        console.log('🏷️  Tags:', workflow?.tags?.join(', ') || 'No tags');

        console.log('\n📥 ESTRUCTURA INPUT ESPERADA:');
        console.log(JSON.stringify({
            chollos: [
                {
                    playerId: 162686,
                    name: "Pedri",
                    team: "Barcelona",
                    position: "MID",
                    price: 8.5,
                    valueRatio: 1.45,
                    estimatedPoints: 12.3
                }
            ]
        }, null, 2));

        console.log('\n🧪 COMANDO DE TEST:');
        console.log(`curl -X POST "${webhookUrl}" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"chollos":[{"playerId":162686,"name":"Pedri","team":"Barcelona","position":"MID","price":8.5,"valueRatio":1.45,"estimatedPoints":12.3}]}'`);

        return {
            success: true,
            workflowId: workflow?.id || 'N/A',
            workflowName: workflow?.name || workflowData.name,
            webhookUrl: webhookUrl,
            active: workflow?.active || false,
            nodesCount: workflow?.nodes?.length || workflowData.nodes.length
        };

    } catch (error) {
        console.error('\n❌ ERROR CREANDO WORKFLOW');
        console.error('Mensaje:', error.message);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }

        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createWorkflow()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 WORKFLOW #2 DESPLEGADO Y LISTO PARA USAR');
                process.exit(0);
            } else {
                console.error('\n❌ FALLO EN CREACIÓN DE WORKFLOW');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Error inesperado:', error);
            process.exit(1);
        });
}

module.exports = { createWorkflow };