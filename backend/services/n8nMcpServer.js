/**
 * Servidor MCP oficial para n8n
 * Integración oficial con Model Context Protocol para Claude Code
 *
 * Basado en la documentación oficial de n8n MCP Server Trigger
 * https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/
 */

const axios = require('axios');
const logger = require('../utils/logger');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.n8n') });

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
                'X-N8N-API-KEY': this.apiToken,
                'Content-Type': 'application/json'
            },
            timeout: 30000, // 30 segundos timeout
            validateStatus: (status) => status < 500 // No lanzar error en 4xx
        });

        logger.info(`🚀 N8n MCP Server inicializado con base URL: ${this.baseUrl}`);
    }

    /**
     * Configuración oficial del MCP Server según documentación n8n
     * SEGURIDAD: No expone el API token, solo la estructura de configuración
     */
    getMcpServerConfig() {
        const path = require('path');
        const serverPath = path.resolve(__dirname, 'n8nMcpServer.js');

        return {
            "mcpServers": {
                "n8n": {
                    "command": "node",
                    "args": [serverPath],
                    "env": {
                        "N8N_API_TOKEN": "<YOUR_N8N_API_TOKEN>",  // Usuario debe reemplazar
                        "N8N_BASE_URL": this.baseUrl || "<YOUR_N8N_BASE_URL>"
                    }
                }
            },
            "_security_note": "Reemplazar <YOUR_N8N_API_TOKEN> con tu token real de n8n",
            "_config_file": "Guardar en tu archivo de configuración Claude Code MCP"
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
            logger.error('Error listando workflows:', error.message);
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
            logger.error(`Error ejecutando workflow ${workflowId}:`, error.message);
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
            logger.error(`Error obteniendo estado de ejecución ${executionId}:`, error.message);
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
            logger.error('Error creando workflow webhook:', error.message);
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
    logger.info('🔧 Iniciando N8n MCP Server...');

    const server = new N8nMcpServer();

    // Test de conexión inicial
    server.testConnection().then(result => {
        logger.info('Test de conexión:', result);
    });

    logger.info('📋 Herramientas MCP disponibles:', server.getMcpTools().map(tool => tool.name));
    logger.info('⚙️  Configuración MCP para Claude Code:', JSON.stringify(server.getMcpServerConfig(), null, 2));
}