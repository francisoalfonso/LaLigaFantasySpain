/**
 * Script para crear Workflow #3: Fantasy La Liga - Ana VEO3 Video Generation
 *
 * Este workflow genera videos con Ana Real usando VEO3, los sube a Bunny.net
 * y los publica automáticamente en Instagram.
 *
 * Arquitectura: 11 nodos con sistema de retry robusto para polling VEO3
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.n8n' });

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_TOKEN = process.env.N8N_API_TOKEN;

if (!N8N_BASE_URL || !N8N_API_TOKEN) {
    console.error('❌ Error: N8N_BASE_URL y N8N_API_TOKEN son requeridos en .env.n8n');
    process.exit(1);
}

// Cliente axios configurado para n8n API
const n8nClient = axios.create({
    baseURL: N8N_BASE_URL,
    headers: {
        'X-N8N-API-KEY': N8N_API_TOKEN,
        'Content-Type': 'application/json'
    }
});

// Definición completa del Workflow #3
const workflow3Definition = {
    name: "Fantasy La Liga - Ana VEO3 Video Generation",
    nodes: [
        // NODO 1: Webhook Trigger
        {
            parameters: {
                httpMethod: "POST",
                path: "generate-ana-video",
                responseMode: "responseNode",
                options: {}
            },
            name: "Webhook Trigger",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1.1,
            position: [240, 300],
            webhookId: "veo3-ana-video-gen"
        },

        // NODO 2: Validate Input
        {
            parameters: {
                conditions: {
                    options: {
                        combineOperation: "all"
                    },
                    conditions: [
                        {
                            id: "type-exists",
                            leftValue: "={{ $json.type }}",
                            rightValue: "",
                            operator: {
                                type: "string",
                                operation: "exists"
                            }
                        },
                        {
                            id: "playerdata-exists",
                            leftValue: "={{ $json.playerData }}",
                            rightValue: "",
                            operator: {
                                type: "object",
                                operation: "exists"
                            }
                        }
                    ]
                },
                options: {}
            },
            name: "Validate Input",
            type: "n8n-nodes-base.if",
            typeVersion: 2,
            position: [460, 300]
        },

        // NODO 3: Function - Build VEO3 Prompt
        {
            parameters: {
                functionCode: `// Build VEO3 Prompt optimizado para Ana Real

const ANA_CHARACTER_BIBLE = "A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponyton, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy";

const type = $input.item.json.type;
const playerData = $input.item.json.playerData;

let prompt = "";
let audioEnvironment = "";

// Construir prompt según tipo de contenido
if (type === "chollo") {
    // Chollo revelation - Arco emocional conspiratorio
    const whisperIntro = \`(whispers conspiratorially) Escucha... tengo datos que no puedes ignorar sobre \${playerData.name}\`;
    const tensionBuild = \`(building tension) Cuesta solo \${playerData.price}M... pero mira estos números...\`;
    const explosiveReveal = \`(explosive excitement) ¡RATIO DE VALOR \${playerData.valueRatio}! ¡Puntos estimados \${playerData.estimatedPoints}!\`;
    const urgentClose = \`(urgent command) Fichalo AHORA antes de que suba su precio. Este chollo no durará.\`;

    prompt = \`\${ANA_CHARACTER_BIBLE} in modern Fantasy La Liga studio. \${whisperIntro} \${tensionBuild} \${explosiveReveal} \${urgentClose}\`;
    audioEnvironment = "Dynamic sports broadcast ambiance with tension-building audio cues, rising musical sting";

} else if (type === "analysis") {
    // Análisis táctico - Arco profesional autoritario
    const professionalIntro = \`Analicemos \${playerData.name} con datos reales.\`;
    const dataBuildup = \`\${playerData.stats.goals} goles, \${playerData.stats.assists} asistencias, rating \${playerData.stats.rating}.\`;
    const insightReveal = \`(building conviction) Los números no mienten: este jugador está en forma ASCENDENTE.\`;
    const authoritativeClose = \`(authoritative conclusion) Mi recomendación es clara: incluirlo en tu plantilla.\`;

    prompt = \`\${ANA_CHARACTER_BIBLE} in tactical analysis studio. \${professionalIntro} \${dataBuildup} \${insightReveal} \${authoritativeClose}\`;
    audioEnvironment = "Professional studio ambiance with data processing sounds building to statistical triumph";

} else if (type === "prediction") {
    // Predicción - Arco de autoridad + anticipación
    const alertIntro = \`(professional alert) Predicción para la jornada: \${playerData.team} enfrenta a \${playerData.opponent}.\`;
    const urgencyBuild = \`(rising urgency) Probabilidad de victoria: \${playerData.winProbability}%. Puntos esperados: \${playerData.estimatedPoints}.\`;
    const explosiveAnticipation = \`(explosive anticipation) Este partido puede cambiar tu jornada Fantasy.\`;
    const actionCall = \`(command to action) Ajusta tu alineación. El momento es AHORA.\`;

    prompt = \`\${ANA_CHARACTER_BIBLE} in breaking news studio. \${alertIntro} \${urgencyBuild} \${explosiveAnticipation} \${actionCall}\`;
    audioEnvironment = "Urgent news broadcast ambiance with alert tones";
}

// Limitar prompt a 500 caracteres por limitaciones VEO3
if (prompt.length > 500) {
    prompt = prompt.substring(0, 497) + "...";
}

return {
    json: {
        type,
        playerData,
        veo3Prompt: prompt,
        audioEnvironment,
        cameraShot: type === "chollo" ? "Medium shot with dramatic tension building" : "Close-up shot",
        visualStyle: type === "analysis" ? "analytical tactical broadcast style" : "dynamic professional broadcast style"
    }
};`
            },
            name: "Function - Build VEO3 Prompt",
            type: "n8n-nodes-base.function",
            typeVersion: 1,
            position: [680, 300]
        },

        // NODO 4: HTTP Request - Generate Ana Video (VEO3)
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/veo3/generate-ana",
                authentication: "none",
                sendBody: true,
                bodyParameters: {
                    parameters: [
                        {
                            name: "type",
                            value: "={{ $json.type }}"
                        },
                        {
                            name: "playerData",
                            value: "={{ $json.playerData }}"
                        },
                        {
                            name: "customPrompt",
                            value: "={{ $json.veo3Prompt }}"
                        }
                    ]
                },
                options: {
                    timeout: 400000, // 400 segundos - 6.6 minutos
                    redirect: {
                        redirect: {
                            followRedirects: true
                        }
                    }
                }
            },
            name: "HTTP Request - Generate Ana Video (VEO3)",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [900, 300]
        },

        // NODO 5: Wait Node (6 minutos)
        {
            parameters: {
                amount: 360,
                unit: "seconds"
            },
            name: "Wait 6 Minutes",
            type: "n8n-nodes-base.wait",
            typeVersion: 1.1,
            position: [1120, 300]
        },

        // NODO 6: Function - Extract Task ID
        {
            parameters: {
                functionCode: `// Extraer taskId de respuesta VEO3
const response = $input.item.json;

if (!response.taskId && !response.task_id) {
    throw new Error('No taskId encontrado en respuesta VEO3');
}

const taskId = response.taskId || response.task_id;

return {
    json: {
        taskId,
        originalRequest: $input.item.json,
        attemptCount: 0,
        maxAttempts: 10
    }
};`
            },
            name: "Function - Extract Task ID",
            type: "n8n-nodes-base.function",
            typeVersion: 1,
            position: [1340, 300]
        },

        // NODO 7: HTTP Request - Poll VEO3 Status (Loop Start)
        {
            parameters: {
                method: "GET",
                url: "=http://localhost:3000/api/veo3/status/{{ $json.taskId }}",
                authentication: "none",
                options: {
                    timeout: 30000 // 30 segundos timeout
                }
            },
            name: "HTTP Request - Poll VEO3 Status",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [1560, 300]
        },

        // NODO 8: IF - Video Generated?
        {
            parameters: {
                conditions: {
                    options: {
                        combineOperation: "any"
                    },
                    conditions: [
                        {
                            id: "status-completed",
                            leftValue: "={{ $json.status }}",
                            rightValue: "completed",
                            operator: {
                                type: "string",
                                operation: "equals"
                            }
                        },
                        {
                            id: "status-success",
                            leftValue: "={{ $json.status }}",
                            rightValue: "success",
                            operator: {
                                type: "string",
                                operation: "equals"
                            }
                        }
                    ]
                },
                options: {}
            },
            name: "IF - Video Generated?",
            type: "n8n-nodes-base.if",
            typeVersion: 2,
            position: [1780, 300]
        },

        // NODO 8B: Function - Retry Logic (FALSE branch)
        {
            parameters: {
                functionCode: `// Retry logic - esperar 30s y reintentar
const currentAttempt = $input.item.json.attemptCount || 0;
const maxAttempts = 10;

if (currentAttempt >= maxAttempts) {
    throw new Error(\`VEO3 video generation timeout after \${maxAttempts} attempts (5 minutes)\`);
}

// Incrementar contador y esperar 30 segundos
return {
    json: {
        ...$input.item.json,
        attemptCount: currentAttempt + 1,
        waitSeconds: 30,
        shouldRetry: true
    }
};`
            },
            name: "Function - Retry Logic",
            type: "n8n-nodes-base.function",
            typeVersion: 1,
            position: [2000, 480]
        },

        // NODO 8C: Wait 30 Seconds (Retry loop)
        {
            parameters: {
                amount: 30,
                unit: "seconds"
            },
            name: "Wait 30 Seconds",
            type: "n8n-nodes-base.wait",
            typeVersion: 1.1,
            position: [2220, 480]
        },

        // NODO 9: HTTP Request - Upload to Bunny (TRUE branch)
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/bunny/upload",
                authentication: "none",
                sendBody: true,
                bodyParameters: {
                    parameters: [
                        {
                            name: "videoUrl",
                            value: "={{ $json.videoUrl }}"
                        },
                        {
                            name: "metadata",
                            value: "={{ { type: $json.type, playerName: $json.playerData?.name, taskId: $json.taskId } }}"
                        }
                    ]
                },
                options: {
                    timeout: 120000 // 2 minutos para upload
                }
            },
            name: "HTTP Request - Upload to Bunny",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [2000, 120]
        },

        // NODO 10: HTTP Request - Post Instagram Reel
        {
            parameters: {
                method: "POST",
                url: "http://localhost:3000/api/instagram/reel",
                authentication: "none",
                sendBody: true,
                bodyParameters: {
                    parameters: [
                        {
                            name: "videoUrl",
                            value: "={{ $json.bunnyUrl }}"
                        },
                        {
                            name: "caption",
                            value: "={{ $json.caption || '🎯 Análisis Fantasy La Liga con Ana Real' }}"
                        },
                        {
                            name: "playerData",
                            value: "={{ $json.playerData }}"
                        }
                    ]
                },
                options: {
                    timeout: 90000 // 90 segundos para Instagram
                }
            },
            name: "HTTP Request - Post Instagram Reel",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [2220, 120]
        },

        // NODO 11: Respond to Webhook (SUCCESS)
        {
            parameters: {
                respondWith: "json",
                responseBody: `={
  "success": true,
  "videoUrl": {{ $json.videoUrl }},
  "bunnyUrl": {{ $json.bunnyUrl }},
  "instagramPostId": {{ $json.instagramPostId }},
  "taskId": {{ $json.taskId }},
  "type": {{ $json.type }},
  "playerName": {{ $json.playerData?.name }},
  "message": "Video generado, subido y publicado exitosamente"
}`,
                options: {}
            },
            name: "Respond to Webhook - Success",
            type: "n8n-nodes-base.respondToWebhook",
            typeVersion: 1,
            position: [2440, 120]
        },

        // NODO 11B: Respond to Webhook (ERROR)
        {
            parameters: {
                respondWith: "json",
                responseBody: `={
  "success": false,
  "error": "Video generation timeout or failed",
  "taskId": {{ $json.taskId }},
  "attempts": {{ $json.attemptCount }},
  "message": "VEO3 no completó el video en 5 minutos (10 intentos)"
}`,
                options: {
                    responseCode: 500
                }
            },
            name: "Respond to Webhook - Error",
            type: "n8n-nodes-base.respondToWebhook",
            typeVersion: 1,
            position: [2440, 480]
        }
    ],

    // Conexiones entre nodos
    connections: {
        "Webhook Trigger": {
            main: [[{ node: "Validate Input", type: "main", index: 0 }]]
        },
        "Validate Input": {
            main: [
                [{ node: "Function - Build VEO3 Prompt", type: "main", index: 0 }],
                [{ node: "Respond to Webhook - Error", type: "main", index: 0 }]
            ]
        },
        "Function - Build VEO3 Prompt": {
            main: [[{ node: "HTTP Request - Generate Ana Video (VEO3)", type: "main", index: 0 }]]
        },
        "HTTP Request - Generate Ana Video (VEO3)": {
            main: [[{ node: "Wait 6 Minutes", type: "main", index: 0 }]]
        },
        "Wait 6 Minutes": {
            main: [[{ node: "Function - Extract Task ID", type: "main", index: 0 }]]
        },
        "Function - Extract Task ID": {
            main: [[{ node: "HTTP Request - Poll VEO3 Status", type: "main", index: 0 }]]
        },
        "HTTP Request - Poll VEO3 Status": {
            main: [[{ node: "IF - Video Generated?", type: "main", index: 0 }]]
        },
        "IF - Video Generated?": {
            main: [
                [{ node: "HTTP Request - Upload to Bunny", type: "main", index: 0 }], // TRUE
                [{ node: "Function - Retry Logic", type: "main", index: 0 }] // FALSE
            ]
        },
        "Function - Retry Logic": {
            main: [[{ node: "Wait 30 Seconds", type: "main", index: 0 }]]
        },
        "Wait 30 Seconds": {
            main: [[{ node: "HTTP Request - Poll VEO3 Status", type: "main", index: 0 }]] // Loop back
        },
        "HTTP Request - Upload to Bunny": {
            main: [[{ node: "HTTP Request - Post Instagram Reel", type: "main", index: 0 }]]
        },
        "HTTP Request - Post Instagram Reel": {
            main: [[{ node: "Respond to Webhook - Success", type: "main", index: 0 }]]
        }
    },

    settings: {
        executionOrder: "v1"
    }
};

async function createWorkflow3() {
    try {
        console.log('🚀 Creando Workflow #3: Fantasy La Liga - Ana VEO3 Video Generation\n');

        // Crear workflow en n8n
        const response = await n8nClient.post('/api/v1/workflows', workflow3Definition);

        const workflow = response.data;
        console.log('✅ Workflow creado exitosamente');
        console.log('📋 Workflow ID:', workflow.id);
        console.log('📝 Nombre:', workflow.name);
        console.log('🔗 Webhook URL:', `${N8N_BASE_URL}/webhook/generate-ana-video`);
        console.log('⚙️  Estado:', workflow.active ? 'ACTIVE' : 'INACTIVE');

        console.log('\n📊 Estadísticas del workflow:');
        console.log('   - Total nodos:', workflow.nodes.length);
        console.log('   - Nodos HTTP:', workflow.nodes.filter(n => n.type === 'n8n-nodes-base.httpRequest').length);
        console.log('   - Nodos Function:', workflow.nodes.filter(n => n.type === 'n8n-nodes-base.function').length);
        console.log('   - Nodos Wait:', workflow.nodes.filter(n => n.type === 'n8n-nodes-base.wait').length);
        console.log('   - Nodos IF:', workflow.nodes.filter(n => n.type === 'n8n-nodes-base.if').length);

        console.log('\n⏱️  Configuración de timeouts:');
        console.log('   - VEO3 generation: 400 segundos (6.6 minutos)');
        console.log('   - Wait inicial: 360 segundos (6 minutos)');
        console.log('   - Polling interval: 30 segundos');
        console.log('   - Max polling attempts: 10 (5 minutos total)');
        console.log('   - Bunny upload: 120 segundos (2 minutos)');
        console.log('   - Instagram post: 90 segundos (1.5 minutos)');

        console.log('\n🔄 Sistema de Retry:');
        console.log('   - Polling automático cada 30 segundos');
        console.log('   - Máximo 10 intentos antes de timeout');
        console.log('   - Loop back automático si video no está listo');
        console.log('   - Error response después de 10 intentos fallidos');

        console.log('\n📥 INPUT esperado:');
        console.log(JSON.stringify({
            type: "chollo",
            playerData: {
                playerId: 162686,
                name: "Pedri",
                team: "Barcelona",
                position: "MID",
                price: 8.5,
                valueRatio: 1.45,
                estimatedPoints: 12.3,
                stats: {
                    goals: 2,
                    assists: 3,
                    rating: 8.2
                }
            }
        }, null, 2));

        console.log('\n📤 OUTPUT esperado:');
        console.log(JSON.stringify({
            success: true,
            videoUrl: "https://kie.ai/output/video.mp4",
            bunnyUrl: "https://video.bunny.net/embed/xyz",
            instagramPostId: "123456789",
            taskId: "veo3-task-abc123",
            type: "chollo",
            playerName: "Pedri"
        }, null, 2));

        console.log('\n💡 Testing sugerido:');
        console.log('\n1. Test básico webhook:');
        console.log(`   curl -X POST "${N8N_BASE_URL}/webhook/generate-ana-video" \\`);
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"type":"chollo","playerData":{"name":"Pedri","price":8.5}}\'');

        console.log('\n2. Test completo desde backend:');
        console.log('   curl -X POST "http://localhost:3000/api/veo3/generate-ana" \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"type":"chollo","playerName":"Pedri","price":8.5}\'');

        console.log('\n3. Verificar workflow en n8n UI:');
        console.log(`   ${N8N_BASE_URL}/workflow/${workflow.id}`);

        console.log('\n⚠️  IMPORTANTE:');
        console.log('   - Workflow creado en estado INACTIVE');
        console.log('   - Activar manualmente en n8n UI después de validar');
        console.log('   - Asegurar que backend esté ejecutándose en localhost:3000');
        console.log('   - Verificar que VEO3 API key esté configurada');
        console.log('   - Confirmar que Bunny.net y Instagram API estén configurados');

        console.log('\n✅ Workflow #3 creado exitosamente\n');

        return {
            workflowId: workflow.id,
            webhookUrl: `${N8N_BASE_URL}/webhook/generate-ana-video`,
            active: workflow.active,
            nodeCount: workflow.nodes.length
        };

    } catch (error) {
        console.error('❌ Error creando Workflow #3:', error.message);

        if (error.response) {
            console.error('📋 Respuesta n8n:', error.response.status);
            console.error('📝 Detalles:', JSON.stringify(error.response.data, null, 2));
        }

        throw error;
    }
}

// Ejecutar script
if (require.main === module) {
    createWorkflow3()
        .then(() => {
            console.log('🎉 Script completado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Script falló:', error.message);
            process.exit(1);
        });
}

module.exports = { createWorkflow3, workflow3Definition };