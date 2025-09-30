/**
 * @fileoverview Constructor de Workflows n8n para Fantasy La Liga
 * @module services/n8nWorkflowBuilder
 * @description Servicio especializado para crear workflows n8n programáticamente
 * usando las mejores prácticas y estructura oficial de n8n.
 *
 * @author Claude (Director de Workflows n8n)
 * @created 2025-09-30
 */

const logger = require('../utils/logger');
const N8nMcpServer = require('./n8nMcpServer');
const crypto = require('crypto');

class N8nWorkflowBuilder {
    constructor() {
        this.n8nMcp = new N8nMcpServer();
        logger.info('🏗️ N8nWorkflowBuilder inicializado');
    }

    /**
     * Generar UUID para nodos de n8n
     */
    generateNodeId() {
        return crypto.randomUUID();
    }

    /**
     * Crear Workflow #1: Sincronización Diaria de Datos
     *
     * Flujo:
     * 1. Schedule Trigger (8:00 AM diario)
     * 2. HTTP Request → API-Sports (fixtures día actual)
     * 3. Function → Procesar datos y calcular puntos
     * 4. HTTP Request → POST /api/fixtures/sync/today
     * 5. IF → Verificar éxito
     * 6. Email notification (resumen o error)
     */
    async createDailySyncWorkflow() {
        logger.info('🔨 Creando Workflow #1: Sincronización Diaria de Datos');

        const workflow = {
            name: 'Fantasy La Liga - Sync Daily Data',
            active: true,
            nodes: [
                // 1. Schedule Trigger (cada día 8:00 AM)
                {
                    parameters: {
                        rule: {
                            interval: [
                                {
                                    field: 'cronExpression',
                                    expression: '0 8 * * *' // 8:00 AM todos los días
                                }
                            ]
                        }
                    },
                    id: 'schedule-trigger',
                    name: 'Daily 8AM Trigger',
                    type: 'n8n-nodes-base.scheduleTrigger',
                    typeVersion: 1.1,
                    position: [240, 300]
                },

                // 2. HTTP Request → API-Sports (fixtures del día)
                {
                    parameters: {
                        url: 'https://v3.football.api-sports.io/fixtures',
                        authentication: 'genericCredentialType',
                        genericAuthType: 'httpHeaderAuth',
                        qs: {
                            league: 140, // La Liga
                            season: 2025,
                            date: '={{ $today.format("yyyy-MM-dd") }}'
                        },
                        options: {
                            timeout: 30000,
                            response: {
                                response: {
                                    fullResponse: false
                                }
                            }
                        }
                    },
                    id: 'http-api-sports',
                    name: 'Get Fixtures from API-Sports',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 4.2,
                    position: [460, 300],
                    credentials: {
                        httpHeaderAuth: {
                            id: 'api-sports-header',
                            name: 'API-Sports Auth'
                        }
                    }
                },

                // 3. Function → Procesar datos y calcular puntos Fantasy
                {
                    parameters: {
                        functionCode: `
// Procesar fixtures de API-Sports y calcular puntos Fantasy
const fixtures = items[0].json.response || [];

// Función para calcular puntos Fantasy según posición
function calculateFantasyPoints(playerStats, position) {
    let points = 0;

    // Puntos base por jugar
    if (playerStats.minutes >= 60) points += 2;

    // Goles según posición
    const goalPoints = {
        'Goalkeeper': 10,
        'Defender': 6,
        'Midfielder': 5,
        'Attacker': 4
    };
    points += (playerStats.goals || 0) * (goalPoints[position] || 4);

    // Asistencias
    points += (playerStats.assists || 0) * 3;

    // Tarjetas
    points -= (playerStats.yellowCards || 0) * 1;
    points -= (playerStats.redCards || 0) * 3;

    // Portería a cero (GK y DEF)
    if ((position === 'Goalkeeper' || position === 'Defender') &&
        playerStats.conceded === 0 && playerStats.minutes >= 60) {
        points += 4;
    }

    return points;
}

// Procesar cada fixture
const processedData = fixtures.map(fixture => {
    const fixtureData = {
        fixtureId: fixture.fixture.id,
        date: fixture.fixture.date,
        status: fixture.fixture.status.short,
        homeTeam: {
            id: fixture.teams.home.id,
            name: fixture.teams.home.name,
            logo: fixture.teams.home.logo
        },
        awayTeam: {
            id: fixture.teams.away.id,
            name: fixture.teams.away.name,
            logo: fixture.teams.away.logo
        },
        score: {
            home: fixture.goals.home,
            away: fixture.goals.away
        },
        venue: fixture.fixture.venue.name
    };

    return fixtureData;
});

// Preparar respuesta
return [{
    json: {
        syncDate: new Date().toISOString(),
        fixturesCount: processedData.length,
        fixtures: processedData,
        metadata: {
            league: 'La Liga',
            season: 2025,
            source: 'API-Sports'
        }
    }
}];
`
                    },
                    id: 'function-process-data',
                    name: 'Process Fixtures Data',
                    type: 'n8n-nodes-base.function',
                    typeVersion: 1,
                    position: [680, 300]
                },

                // 4. HTTP Request → POST al backend local
                {
                    parameters: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/fixtures/sync/today',
                        authentication: 'none',
                        bodyParametersJson: '={{ JSON.stringify($json) }}',
                        options: {
                            timeout: 60000
                        }
                    },
                    id: 'http-local-sync',
                    name: 'Sync to Local Backend',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 4.2,
                    position: [900, 300]
                },

                // 5. IF → Verificar éxito de sincronización
                {
                    parameters: {
                        conditions: {
                            options: {
                                caseSensitive: true,
                                leftValue: '',
                                typeValidation: 'strict'
                            },
                            conditions: [
                                {
                                    id: 'success-check',
                                    leftValue: '={{ $json.success }}',
                                    rightValue: true,
                                    operator: {
                                        type: 'boolean',
                                        operation: 'equals'
                                    }
                                }
                            ],
                            combinator: 'and'
                        },
                        options: {}
                    },
                    id: 'if-success',
                    name: 'Check Sync Success',
                    type: 'n8n-nodes-base.if',
                    typeVersion: 2,
                    position: [1120, 300]
                },

                // 6a. Email Success (rama TRUE del IF)
                {
                    parameters: {
                        fromEmail: 'laligafantasyspainpro@gmail.com',
                        toEmail: 'laligafantasyspainpro@gmail.com',
                        subject: '✅ Fantasy La Liga - Sync Diaria Exitosa',
                        emailFormat: 'html',
                        html: `
<h2>✅ Sincronización Diaria Completada</h2>
<p><strong>Fecha:</strong> {{ $now.format("dd/MM/yyyy HH:mm") }}</p>
<p><strong>Fixtures sincronizados:</strong> {{ $json.fixturesCount }}</p>
<p><strong>Estado:</strong> Exitoso</p>

<h3>Detalles:</h3>
<ul>
    <li>Liga: La Liga (2025-26)</li>
    <li>Fuente: API-Sports</li>
    <li>Endpoint: /api/fixtures/sync/today</li>
</ul>

<p style="color: green;">Todos los datos se han sincronizado correctamente.</p>
`,
                        options: {}
                    },
                    id: 'email-success',
                    name: 'Email - Sync Success',
                    type: 'n8n-nodes-base.emailSend',
                    typeVersion: 2.1,
                    position: [1340, 200]
                },

                // 6b. Email Error (rama FALSE del IF)
                {
                    parameters: {
                        fromEmail: 'laligafantasyspainpro@gmail.com',
                        toEmail: 'laligafantasyspainpro@gmail.com',
                        subject: '❌ Fantasy La Liga - ERROR en Sync Diaria',
                        emailFormat: 'html',
                        html: `
<h2 style="color: red;">❌ Error en Sincronización Diaria</h2>
<p><strong>Fecha:</strong> {{ $now.format("dd/MM/yyyy HH:mm") }}</p>
<p><strong>Estado:</strong> Error</p>

<h3>Detalles del Error:</h3>
<pre>{{ JSON.stringify($json, null, 2) }}</pre>

<h3>Acción Requerida:</h3>
<p>Por favor, revisar logs del servidor y reintentar manualmente.</p>
<p><a href="http://localhost:3000/api/fixtures/sync/today">Ejecutar sync manual</a></p>
`,
                        options: {}
                    },
                    id: 'email-error',
                    name: 'Email - Sync Error',
                    type: 'n8n-nodes-base.emailSend',
                    typeVersion: 2.1,
                    position: [1340, 400]
                }
            ],

            // Conexiones entre nodos
            connections: {
                'Daily 8AM Trigger': {
                    main: [
                        [
                            {
                                node: 'Get Fixtures from API-Sports',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Get Fixtures from API-Sports': {
                    main: [
                        [
                            {
                                node: 'Process Fixtures Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Process Fixtures Data': {
                    main: [
                        [
                            {
                                node: 'Sync to Local Backend',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Sync to Local Backend': {
                    main: [
                        [
                            {
                                node: 'Check Sync Success',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Check Sync Success': {
                    main: [
                        [
                            {
                                node: 'Email - Sync Success',
                                type: 'main',
                                index: 0
                            }
                        ],
                        [
                            {
                                node: 'Email - Sync Error',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            },

            settings: {
                executionOrder: 'v1',
                saveDataErrorExecution: 'all',
                saveDataSuccessExecution: 'all',
                saveManualExecutions: true,
                callerPolicy: 'workflowsFromSameOwner',
                errorWorkflow: ''
            },

            staticData: null,
            tags: [
                'fantasy-laliga',
                'sync',
                'daily',
                'api-sports',
                'critical'
            ],
            triggerCount: 1,
            updatedAt: new Date().toISOString(),
            versionId: '1'
        };

        try {
            // Crear workflow en n8n usando la API
            const response = await this.n8nMcp.axiosInstance.post('/api/v1/workflows', workflow);

            logger.info('✅ Workflow #1 creado exitosamente', {
                workflowId: response.data.data.id,
                name: response.data.data.name
            });

            return {
                success: true,
                workflow: response.data.data,
                message: 'Workflow de sincronización diaria creado y activado'
            };

        } catch (error) {
            logger.error('❌ Error creando workflow #1:', error.message);
            return {
                success: false,
                error: error.message,
                details: error.response?.data
            };
        }
    }

    /**
     * Test manual del workflow (ejecutar una vez para validar)
     */
    async testDailySyncWorkflow(workflowId) {
        logger.info('🧪 Testeando Workflow #1:', workflowId);

        try {
            const execution = await this.n8nMcp.executeWorkflow(workflowId, {});

            logger.info('✅ Test ejecutado', {
                executionId: execution.executionId
            });

            return execution;
        } catch (error) {
            logger.error('❌ Error en test:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = N8nWorkflowBuilder;