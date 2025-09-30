/**
 * Script para crear Workflow #5: Fantasy La Liga - Monitor Lesiones y Alertas
 *
 * ARQUITECTURA: 12 nodos con monitoreo cada 2 horas
 * - Trigger schedule cada 2h
 * - Detección lesiones API-Sports
 * - Comparación con cache previo
 * - Análisis impacto GPT-5 Mini
 * - Alertas Telegram + Instagram stories
 * - Email summary final
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.n8n') });

const N8N_API_TOKEN = process.env.N8N_API_TOKEN;
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-n8n.6ld9pv.easypanel.host';

if (!N8N_API_TOKEN) {
    console.error('❌ N8N_API_TOKEN no encontrado en .env.n8n');
    process.exit(1);
}

// Configuración workflow completo
const workflowData = {
    name: "Fantasy La Liga - Monitor Lesiones y Alertas",
    nodes: [
        // 1. Schedule Trigger (cada 2 horas)
        {
            parameters: {
                rule: {
                    interval: [{
                        field: "cronExpression",
                        expression: "0 */2 * * *"
                    }]
                }
            },
            id: "schedule-trigger",
            name: "Every 2 Hours Trigger",
            type: "n8n-nodes-base.scheduleTrigger",
            typeVersion: 1.1,
            position: [240, 300]
        },

        // 2. HTTP Request - Get Previous Cache
        {
            parameters: {
                method: "GET",
                url: "http://localhost:3000/api/cache/injuries",
                options: {
                    timeout: 10000
                }
            },
            id: "get-cache",
            name: "Get Previous Cache",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [460, 400]
        },

        // 3. HTTP Request - API-Sports Injuries
        {
            parameters: {
                method: "GET",
                url: "https://v3.football.api-sports.io/injuries",
                authentication: "genericCredentialType",
                genericAuthType: "httpHeaderAuth",
                sendQuery: true,
                queryParameters: {
                    parameters: [
                        { name: "league", value: "140" },
                        { name: "season", value: "2025" },
                        { name: "date", value: "={{ $today.format('yyyy-MM-dd') }}" }
                    ]
                },
                options: {
                    timeout: 30000
                }
            },
            id: "get-injuries",
            name: "Get Injuries API-Sports",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [460, 300],
            credentials: {
                httpHeaderAuth: {
                    id: "api-sports-header",
                    name: "API-Sports Auth"
                }
            }
        },

        // 4. Function - Compare with Cache
        {
            parameters: {
                functionCode: `// Comparar lesiones actuales con cache previo
const currentInjuries = items[0].json.response || [];
const cachedData = $node["Get Previous Cache"].json;
const cachedInjuries = cachedData?.injuries || [];

// Detectar nuevas lesiones
const newInjuries = currentInjuries.filter(injury => {
    return !cachedInjuries.find(cached =>
        cached.player.id === injury.player.id &&
        cached.fixture.id === injury.fixture.id
    );
});

console.log(\`Lesiones actuales: \${currentInjuries.length}\`);
console.log(\`Lesiones en cache: \${cachedInjuries.length}\`);
console.log(\`Nuevas lesiones detectadas: \${newInjuries.length}\`);

return [{
    json: {
        hasNewInjuries: newInjuries.length > 0,
        newInjuries: newInjuries,
        currentInjuries: currentInjuries,
        newInjuriesCount: newInjuries.length
    }
}];`
            },
            id: "compare-cache",
            name: "Compare with Cache",
            type: "n8n-nodes-base.function",
            typeVersion: 1,
            position: [680, 300]
        },

        // 5. IF - Check New Injuries
        {
            parameters: {
                conditions: {
                    boolean: [{
                        value1: "={{ $json.hasNewInjuries }}",
                        operation: "equal",
                        value2: true
                    }]
                }
            },
            id: "check-injuries",
            name: "Has New Injuries?",
            type: "n8n-nodes-base.if",
            typeVersion: 2,
            position: [900, 300]
        },

        // 6. SplitInBatches - Loop Injuries
        {
            parameters: {
                batchSize: 1,
                options: {}
            },
            id: "loop-injuries",
            name: "Loop Each New Injury",
            type: "n8n-nodes-base.splitInBatches",
            typeVersion: 3,
            position: [1120, 200]
        },

        // 7. HTTP Request - GPT-5 Mini Analysis
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/ai/injury-impact",
                sendBody: true,
                contentType: "json",
                body: {
                    playerName: "={{ $json.player.name }}",
                    team: "={{ $json.team.name }}",
                    injuryType: "={{ $json.player.reason }}",
                    position: "={{ $json.player.position }}"
                },
                options: {
                    timeout: 30000
                }
            },
            id: "analyze-impact",
            name: "Analyze Impact GPT-5",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [1340, 100]
        },

        // 8. HTTP Request - Telegram Alert
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/telegram/alert",
                sendBody: true,
                contentType: "json",
                body: {
                    title: "🚨 Nueva Lesión Detectada",
                    player: "={{ $json.player.name }}",
                    team: "={{ $json.team.name }}",
                    injury: "={{ $json.player.reason }}",
                    analysis: "={{ $node['Analyze Impact GPT-5'].json.analysis }}"
                },
                options: {
                    timeout: 15000
                }
            },
            id: "telegram-alert",
            name: "Send Telegram Alert",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [1340, 200]
        },

        // 9. HTTP Request - Instagram Story
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/instagram/story",
                sendBody: true,
                contentType: "json",
                body: {
                    type: "injury_alert",
                    playerData: "={{ $json }}"
                },
                options: {
                    timeout: 30000
                }
            },
            id: "instagram-story",
            name: "Post Instagram Story",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [1340, 300]
        },

        // 10. Aggregate Results
        {
            parameters: {
                aggregate: "aggregateAllItemData",
                options: {}
            },
            id: "aggregate",
            name: "Aggregate All Results",
            type: "n8n-nodes-base.aggregate",
            typeVersion: 1,
            position: [1560, 200]
        },

        // 11. Function - Update Cache
        {
            parameters: {
                functionCode: `// Actualizar cache con lesiones actuales
const currentInjuries = $node["Compare with Cache"].json.currentInjuries;
const newInjuriesCount = $node["Compare with Cache"].json.newInjuriesCount;

return [{
    json: {
        action: 'update_cache',
        timestamp: new Date().toISOString(),
        injuries: currentInjuries,
        injuriesCount: currentInjuries.length,
        newInjuriesProcessed: newInjuriesCount,
        status: 'completed'
    }
}];`
            },
            id: "update-cache",
            name: "Update Cache Function",
            type: "n8n-nodes-base.function",
            typeVersion: 1,
            position: [1780, 200]
        },

        // 12. HTTP Request - Email Summary
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/email/send",
                sendBody: true,
                contentType: "json",
                body: {
                    to: "laligafantasyspainpro@gmail.com",
                    subject: "📊 Resumen Lesiones - {{ $now.format('dd/MM/yyyy HH:mm') }}",
                    body: "={{ JSON.stringify($json, null, 2) }}"
                },
                options: {
                    timeout: 15000
                }
            },
            id: "email-summary",
            name: "Send Email Summary",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [2000, 200]
        }
    ],

    // Conexiones entre nodos
    connections: {
        "Every 2 Hours Trigger": {
            main: [
                [
                    { node: "Get Previous Cache", type: "main", index: 0 },
                    { node: "Get Injuries API-Sports", type: "main", index: 0 }
                ]
            ]
        },
        "Get Previous Cache": {
            main: [[{ node: "Compare with Cache", type: "main", index: 0 }]]
        },
        "Get Injuries API-Sports": {
            main: [[{ node: "Compare with Cache", type: "main", index: 0 }]]
        },
        "Compare with Cache": {
            main: [[{ node: "Has New Injuries?", type: "main", index: 0 }]]
        },
        "Has New Injuries?": {
            main: [
                [{ node: "Loop Each New Injury", type: "main", index: 0 }],
                [{ node: "Update Cache Function", type: "main", index: 0 }]
            ]
        },
        "Loop Each New Injury": {
            main: [
                [
                    { node: "Analyze Impact GPT-5", type: "main", index: 0 },
                    { node: "Send Telegram Alert", type: "main", index: 0 },
                    { node: "Post Instagram Story", type: "main", index: 0 }
                ],
                [{ node: "Aggregate All Results", type: "main", index: 0 }]
            ]
        },
        "Analyze Impact GPT-5": {
            main: [[{ node: "Loop Each New Injury", type: "main", index: 0 }]]
        },
        "Send Telegram Alert": {
            main: [[{ node: "Loop Each New Injury", type: "main", index: 0 }]]
        },
        "Post Instagram Story": {
            main: [[{ node: "Loop Each New Injury", type: "main", index: 0 }]]
        },
        "Aggregate All Results": {
            main: [[{ node: "Update Cache Function", type: "main", index: 0 }]]
        },
        "Update Cache Function": {
            main: [[{ node: "Send Email Summary", type: "main", index: 0 }]]
        }
    },

    // Metadata
    settings: {
        executionOrder: "v1",
        saveDataErrorExecution: "all",
        saveDataSuccessExecution: "all",
        executionTimeout: 600,
        timezone: "Europe/Madrid"
    }
};

// Función principal para crear el workflow
async function createWorkflow() {
    try {
        console.log('🚀 Creando Workflow #5: Monitor Lesiones y Alertas...\n');
        console.log(`📡 Base URL: ${N8N_BASE_URL}`);
        console.log(`🔑 Token: ${N8N_API_TOKEN.substring(0, 20)}...`);
        console.log(`📊 Nodos a crear: ${workflowData.nodes.length}`);
        console.log(`🔗 Conexiones: ${Object.keys(workflowData.connections).length}\n`);

        const response = await axios.post(
            `${N8N_BASE_URL}/api/v1/workflows`,
            workflowData,
            {
                headers: {
                    'X-N8N-API-KEY': N8N_API_TOKEN,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        // n8n puede retornar data directamente o data.data
        const workflow = response.data.data || response.data;

        console.log('✅ Workflow creado exitosamente!\n');
        console.log('📋 INFORMACIÓN DEL WORKFLOW:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`ID: ${workflow.id}`);
        console.log(`Nombre: ${workflow.name}`);
        console.log(`Estado: ${workflow.active ? '🟢 Activo' : '🔴 Inactivo'}`);
        console.log(`Nodos: ${workflow.nodes.length}`);
        console.log(`Creado: ${new Date(workflow.createdAt).toLocaleString('es-ES')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🔧 ARQUITECTURA DEL WORKFLOW:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        workflow.nodes.forEach((node, index) => {
            console.log(`${index + 1}. ${node.name} (${node.type})`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('⏰ CONFIGURACIÓN SCHEDULE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Frecuencia: Cada 2 horas (0 */2 * * *)');
        console.log('Próxima ejecución: En las próximas 2 horas');
        console.log('Timezone: Europe/Madrid');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎯 FUNCIONALIDADES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Detección automática lesiones API-Sports');
        console.log('✅ Comparación con cache previo');
        console.log('✅ Análisis impacto GPT-5 Mini');
        console.log('✅ Alertas Telegram instantáneas');
        console.log('✅ Instagram stories automáticas');
        console.log('✅ Email summary completo');
        console.log('✅ Loop procesamiento por lesión');
        console.log('✅ Actualización cache persistente');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🔔 PRÓXIMOS PASOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Activar workflow en n8n: PATCH /api/v1/workflows/' + workflow.id);
        console.log('2. Configurar credencial API-Sports en n8n');
        console.log('3. Implementar endpoints backend:');
        console.log('   - POST /api/cache/injuries (guardar cache)');
        console.log('   - GET /api/cache/injuries (leer cache)');
        console.log('   - POST /api/ai/injury-impact (análisis GPT-5)');
        console.log('   - POST /api/telegram/alert (envío Telegram)');
        console.log('   - POST /api/instagram/story (Instagram story)');
        console.log('   - POST /api/email/send (email summary)');
        console.log('4. Test ejecución manual del workflow');
        console.log('5. Monitorear logs primeras ejecuciones');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            success: true,
            workflowId: workflow.id,
            workflowName: workflow.name,
            nodesCount: workflow.nodes.length,
            active: workflow.active
        };

    } catch (error) {
        console.error('❌ Error creando workflow:\n');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));

            // Análisis específico del error
            if (error.response.status === 401) {
                console.error('\n🔐 ERROR DE AUTENTICACIÓN:');
                console.error('- Verificar N8N_API_TOKEN en .env.n8n');
                console.error('- Token debe ser válido y no expirado');
                console.error('- Regenerar token en n8n si es necesario');
            } else if (error.response.status === 400) {
                console.error('\n⚠️ ERROR DE VALIDACIÓN:');
                console.error('- Revisar estructura de nodos y conexiones');
                console.error('- Verificar tipos de nodos compatibles con versión n8n');
                console.error('- Validar parámetros requeridos en cada nodo');
            } else if (error.response.status === 404) {
                console.error('\n🔍 ERROR DE ENDPOINT:');
                console.error('- Verificar N8N_BASE_URL está correcto');
                console.error('- Endpoint actual:', N8N_BASE_URL);
                console.error('- API debe estar en /api/v1/workflows');
            }
        } else if (error.request) {
            console.error('No response received:', error.message);
            console.error('\n🌐 ERROR DE CONEXIÓN:');
            console.error('- Verificar n8n está accesible en:', N8N_BASE_URL);
            console.error('- Revisar conectividad de red');
            console.error('- Validar CORS si es cross-origin');
        } else {
            console.error('Error:', error.message);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar
createWorkflow().then(result => {
    if (result.success) {
        console.log('🎉 Workflow #5 creado y listo para usar!');
        process.exit(0);
    } else {
        console.error('💥 Falló la creación del workflow');
        process.exit(1);
    }
});