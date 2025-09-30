/**
 * Rutas oficiales para n8n MCP (Model Context Protocol)
 * Integración oficial con n8n usando MCP Server Trigger
 *
 * Endpoints para gestión de workflows y ejecuciones n8n
 * Compatible con Claude Code MCP framework
 */

const express = require('express');
const logger = require('../utils/logger');
const { asyncHandler, ValidationError, AppError } = require('../middleware/errorHandler');
const router = express.Router();
const N8nMcpServer = require('../services/n8nMcpServer');

// Inicializar servidor MCP
let n8nMcp;

try {
    n8nMcp = new N8nMcpServer();
} catch (error) {
    logger.error('❌ Error inicializando N8n MCP Server:', error.message);
    logger.info('💡 Asegúrate de configurar .env.n8n con tu token de n8n');
}

/**
 * GET /api/n8n-mcp/test
 * Test de conexión con la instancia n8n
 */
router.get('/test', asyncHandler(async (req, res) => {
    if (!n8nMcp) {
        throw new AppError('MCP Server no inicializado. Verificar configuración .env.n8n', 503);
    }

    const result = await n8nMcp.testConnection();
    res.json(result);
}));

/**
 * GET /api/n8n-mcp/workflows
 * Listar todos los workflows disponibles
 */
router.get('/workflows', asyncHandler(async (req, res) => {
    if (!n8nMcp) {
        throw new AppError('MCP Server no inicializado', 503);
    }

    const result = await n8nMcp.listWorkflows();
    res.json(result);
}));

/**
 * POST /api/n8n-mcp/workflows/:id/execute
 * Ejecutar un workflow específico
 * SEGURIDAD: Validación de input data
 */
router.post('/workflows/:id/execute', asyncHandler(async (req, res) => {
    if (!n8nMcp) {
        throw new AppError('MCP Server no inicializado', 503);
    }

    const { id } = req.params;
    const inputData = req.body;

    // Validación básica de input
    if (!id || typeof id !== 'string') {
        throw new ValidationError('ID de workflow inválido');
    }

    if (inputData && typeof inputData !== 'object') {
        throw new ValidationError('Input data debe ser un objeto JSON válido');
    }

    const result = await n8nMcp.executeWorkflow(id, inputData);
    res.json(result);
}));

/**
 * GET /api/n8n-mcp/executions/:id/status
 * Obtener estado de una ejecución
 */
router.get('/executions/:id/status', asyncHandler(async (req, res) => {
    if (!n8nMcp) {
        throw new AppError('MCP Server no inicializado', 503);
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        throw new ValidationError('ID de ejecución inválido');
    }

    const result = await n8nMcp.getExecutionStatus(id);
    res.json(result);
}));

/**
 * POST /api/n8n-mcp/webhooks/create
 * Crear workflow con webhook para Claude Code
 */
router.post('/webhooks/create', asyncHandler(async (req, res) => {
    if (!n8nMcp) {
        throw new AppError('MCP Server no inicializado', 503);
    }

    const { name, claudeCodeEndpoint } = req.body;

    if (!name) {
        throw new ValidationError('Nombre del workflow es requerido');
    }

    const result = await n8nMcp.createWebhookWorkflow(name, claudeCodeEndpoint);
    res.json(result);
}));

/**
 * GET /api/n8n-mcp/tools
 * Obtener herramientas MCP disponibles para Claude
 */
router.get('/tools', (req, res) => {
    try {
        if (!n8nMcp) {
            return res.status(500).json({
                success: false,
                error: 'MCP Server no inicializado'
            });
        }

        const tools = n8nMcp.getMcpTools();
        res.json({
            success: true,
            tools: tools,
            count: tools.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/n8n-mcp/config
 * Obtener configuración MCP para Claude Code
 */
router.get('/config', (req, res) => {
    try {
        if (!n8nMcp) {
            return res.status(500).json({
                success: false,
                error: 'MCP Server no inicializado'
            });
        }

        const config = n8nMcp.getMcpServerConfig();
        res.json({
            success: true,
            config: config,
            instructions: {
                step1: 'Copiar la configuración MCP',
                step2: 'Agregar a tu archivo de configuración Claude Code',
                step3: 'Reiniciar Claude Code para aplicar cambios',
                step4: 'Usar comandos MCP en Claude Code'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/n8n-mcp/fantasy/workflow
 * Crear workflow específico para Fantasy La Liga
 */
router.post('/fantasy/workflow', async (req, res) => {
    try {
        if (!n8nMcp) {
            return res.status(500).json({
                success: false,
                error: 'MCP Server no inicializado'
            });
        }

        // Workflow específico para procesamiento de datos Fantasy La Liga
        const fantasyWorkflow = {
            name: 'Fantasy La Liga - Data Processing',
            description: 'Procesamiento automático de datos para Fantasy La Liga',
            nodes: [
                {
                    name: 'Fantasy Data Trigger',
                    type: 'n8n-nodes-base.webhook',
                    parameters: {
                        httpMethod: 'POST',
                        path: 'fantasy-laliga-data',
                        responseMode: 'responseNode'
                    }
                },
                {
                    name: 'Process Fantasy Points',
                    type: 'n8n-nodes-base.function',
                    parameters: {
                        functionCode: `
                            // Procesar datos de Fantasy La Liga
                            const fantasyData = items[0].json;

                            // Calcular puntos Fantasy
                            let totalPoints = 0;
                            if (fantasyData.goals) totalPoints += fantasyData.goals * 4;
                            if (fantasyData.assists) totalPoints += fantasyData.assists * 3;
                            if (fantasyData.yellowCards) totalPoints -= fantasyData.yellowCards * 1;
                            if (fantasyData.redCards) totalPoints -= fantasyData.redCards * 3;

                            return [{
                                json: {
                                    ...fantasyData,
                                    calculatedPoints: totalPoints,
                                    processedAt: new Date().toISOString()
                                }
                            }];
                        `
                    }
                },
                {
                    name: 'Save to Database',
                    type: 'n8n-nodes-base.webhook',
                    parameters: {
                        url: 'http://localhost:3000/api/fantasy/save',
                        httpMethod: 'POST'
                    }
                }
            ],
            tags: ['fantasy', 'laliga', 'automation', 'claude-code']
        };

        // En una implementación real, aquí crearías el workflow en n8n
        res.json({
            success: true,
            message: 'Workflow Fantasy La Liga configurado',
            workflow: fantasyWorkflow,
            webhookUrl: `${process.env.N8N_BASE_URL}/webhook/fantasy-laliga-data`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;