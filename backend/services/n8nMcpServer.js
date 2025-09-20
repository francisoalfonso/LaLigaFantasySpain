/**
 * Servidor MCP oficial para n8n
 * Integración oficial con Model Context Protocol para Claude Code
 *
 * Basado en la documentación oficial de n8n MCP Server Trigger
 * https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.n8n' });

class N8nMcpServer {
    constructor() {
        this.apiToken = process.env.N8N_API_TOKEN;
        this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
        this.mcpPort = process.env.N8N_MCP_PORT || 3001;
        this.mcpHost = process.env.N8N_MCP_HOST || 'localhost';

        if (!this.apiToken) {
            throw new Error('N8N_API_TOKEN no está configurado en .env.n8n');
        }

        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`🚀 N8n MCP Server inicializado con base URL: ${this.baseUrl}`);
    }

    /**
     * Configuración oficial del MCP Server según documentación n8n
     */
    getMcpServerConfig() {
        return {
            "mcpServers": {
                "n8n": {
                    "command": "node",
                    "args": [
                        "/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/services/n8nMcpServer.js"
                    ],
                    "env": {
                        "N8N_API_TOKEN": this.apiToken,
                        "N8N_BASE_URL": this.baseUrl
                    }
                }
            }
        };
    }

    /**
     * Listar todos los workflows disponibles
     */
    async listWorkflows() {
        try {
            const response = await this.axiosInstance.get('/api/v1/workflows');
            return {
                success: true,
                workflows: response.data.data.map(workflow => ({
                    id: workflow.id,
                    name: workflow.name,
                    active: workflow.active,
                    nodes: workflow.nodes?.length || 0,
                    tags: workflow.tags,
                    createdAt: workflow.createdAt,
                    updatedAt: workflow.updatedAt
                }))
            };
        } catch (error) {
            console.error('Error listando workflows:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Ejecutar un workflow específico
     */
    async executeWorkflow(workflowId, inputData = {}) {
        try {
            const response = await this.axiosInstance.post(`/api/v1/workflows/${workflowId}/execute`, {
                data: inputData
            });

            return {
                success: true,
                executionId: response.data.data.executionId,
                data: response.data.data
            };
        } catch (error) {
            console.error(`Error ejecutando workflow ${workflowId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener estado de una ejecución
     */
    async getExecutionStatus(executionId) {
        try {
            const response = await this.axiosInstance.get(`/api/v1/executions/${executionId}`);
            return {
                success: true,
                execution: response.data.data
            };
        } catch (error) {
            console.error(`Error obteniendo estado de ejecución ${executionId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Crear webhook para integración con Claude Code
     */
    async createWebhookWorkflow(name, claudeCodeEndpoint) {
        const workflowData = {
            name: name,
            nodes: [
                {
                    parameters: {
                        httpMethod: "POST",
                        path: `claude-code-${Date.now()}`,
                        responseMode: "responseNode",
                        options: {}
                    },
                    id: "webhook-trigger",
                    name: "Claude Code Webhook",
                    type: "n8n-nodes-base.webhook",
                    typeVersion: 1,
                    position: [240, 300]
                },
                {
                    parameters: {
                        values: {
                            string: [
                                {
                                    name: "claudeResponse",
                                    value: "={{ $json.body }}"
                                }
                            ]
                        },
                        options: {}
                    },
                    id: "set-data",
                    name: "Process Claude Data",
                    type: "n8n-nodes-base.set",
                    typeVersion: 1,
                    position: [460, 300]
                },
                {
                    parameters: {
                        respondWith: "json",
                        responseBody: "={{ { \"success\": true, \"processed\": $json.claudeResponse } }}"
                    },
                    id: "respond-to-webhook",
                    name: "Respond",
                    type: "n8n-nodes-base.respondToWebhook",
                    typeVersion: 1,
                    position: [680, 300]
                }
            ],
            connections: {
                "Claude Code Webhook": {
                    main: [
                        [
                            {
                                node: "Process Claude Data",
                                type: "main",
                                index: 0
                            }
                        ]
                    ]
                },
                "Process Claude Data": {
                    main: [
                        [
                            {
                                node: "Respond",
                                type: "main",
                                index: 0
                            }
                        ]
                    ]
                }
            },
            active: true,
            settings: {},
            tags: ["claude-code", "mcp", "fantasy-laliga"]
        };

        try {
            const response = await this.axiosInstance.post('/api/v1/workflows', workflowData);
            return {
                success: true,
                workflow: response.data.data,
                webhookUrl: `${this.baseUrl}/webhook/${workflowData.nodes[0].parameters.path}`
            };
        } catch (error) {
            console.error('Error creando workflow webhook:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test de conexión con la instancia n8n
     */
    async testConnection() {
        try {
            const response = await this.axiosInstance.get('/api/v1/workflows');
            return {
                success: true,
                message: 'Conexión exitosa con n8n',
                workflowCount: response.data.data.length,
                serverInfo: {
                    baseUrl: this.baseUrl,
                    authenticated: true
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error conectando con n8n',
                error: error.message,
                serverInfo: {
                    baseUrl: this.baseUrl,
                    authenticated: false
                }
            };
        }
    }

    /**
     * Obtener herramientas MCP disponibles para Claude
     */
    getMcpTools() {
        return [
            {
                name: "list_workflows",
                description: "Lista todos los workflows disponibles en n8n",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "execute_workflow",
                description: "Ejecuta un workflow específico con datos de entrada",
                inputSchema: {
                    type: "object",
                    properties: {
                        workflowId: {
                            type: "string",
                            description: "ID del workflow a ejecutar"
                        },
                        inputData: {
                            type: "object",
                            description: "Datos de entrada para el workflow"
                        }
                    },
                    required: ["workflowId"]
                }
            },
            {
                name: "get_execution_status",
                description: "Obtiene el estado de una ejecución de workflow",
                inputSchema: {
                    type: "object",
                    properties: {
                        executionId: {
                            type: "string",
                            description: "ID de la ejecución"
                        }
                    },
                    required: ["executionId"]
                }
            },
            {
                name: "create_webhook_workflow",
                description: "Crea un workflow con webhook para integración con Claude Code",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Nombre del workflow"
                        },
                        claudeCodeEndpoint: {
                            type: "string",
                            description: "Endpoint de Claude Code para integración"
                        }
                    },
                    required: ["name"]
                }
            },
            {
                name: "test_connection",
                description: "Prueba la conexión con la instancia n8n",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ];
    }
}

// Exportar la clase para uso en otros módulos
module.exports = N8nMcpServer;

// Si se ejecuta directamente, inicializar el servidor MCP
if (require.main === module) {
    console.log('🔧 Iniciando N8n MCP Server...');

    const server = new N8nMcpServer();

    // Test de conexión inicial
    server.testConnection().then(result => {
        console.log('Test de conexión:', result);
    });

    console.log('📋 Herramientas MCP disponibles:', server.getMcpTools().map(tool => tool.name));
    console.log('⚙️  Configuración MCP para Claude Code:', JSON.stringify(server.getMcpServerConfig(), null, 2));
}