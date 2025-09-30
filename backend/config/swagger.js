/**
 * Configuración Swagger/OpenAPI
 * Documentación automática de la API Fantasy La Liga
 */

const swaggerJsdoc = require('swagger-jsdoc');
const logger = require('../utils/logger');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fantasy La Liga API',
            version: '1.0.0',
            description: `
# Fantasy La Liga Dashboard API

API completa para datos en tiempo real de La Liga Fantasy 2025-26.

## Características

- **Datos en tiempo real** de La Liga vía API-Sports
- **Sistema de chollos** - Identificación predictiva de jugadores infravalorados
- **Generación de videos** con VEO3 (Ana Real)
- **Predicciones de valor** - IA para estimar rendimiento
- **Control de versiones n8n** - Sincronización MCP vs VPS
- **Rate limiting** - Protección contra abuso
- **Logging estructurado** - Winston con rotación diaria

## Autenticación

Actualmente la API es pública. Futuras versiones incluirán autenticación JWT.

## Rate Limiting

- **General API**: 100 requests/15min
- **API-Sports**: 75 requests/min
- **Heavy Operations**: 10 requests/hora
- **VEO3**: 5 requests/hora
- **Image Generation**: 30 requests/15min

## Temporada

- **Temporada actual**: 2025-26
- **API-Sports Season**: 2025
- **Equipos**: 20 equipos de La Liga
- **Plan API-Sports**: Ultra (75,000 requests/día)
            `,
            contact: {
                name: 'Fantasy La Liga Pro',
                email: 'laligafantasyspainpro@gmail.com',
                url: 'https://laligafantasyspain.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://api.laligafantasyspain.com',
                description: 'Production server (futuro)'
            }
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health checks y status del servidor'
            },
            {
                name: 'La Liga',
                description: 'Datos de La Liga (equipos, jugadores, partidos)'
            },
            {
                name: 'Bargains',
                description: 'Sistema predictivo de chollos Fantasy'
            },
            {
                name: 'Evolution',
                description: 'Evolución de valor de jugadores'
            },
            {
                name: 'VEO3',
                description: 'Generación de videos con Ana Real'
            },
            {
                name: 'n8n Versions',
                description: 'Control de versiones n8n MCP vs VPS'
            },
            {
                name: 'Images',
                description: 'Generación de imágenes dinámicas'
            },
            {
                name: 'AI Content',
                description: 'Generación de contenido con GPT-5 Mini'
            },
            {
                name: 'Weather',
                description: 'Datos meteorológicos AEMET'
            },
            {
                name: 'Database',
                description: 'Operaciones de base de datos'
            }
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    example: 'Error message'
                                },
                                statusCode: {
                                    type: 'integer',
                                    example: 500
                                },
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2025-09-30T12:00:00.000Z'
                                }
                            }
                        }
                    }
                },
                Player: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 521
                        },
                        name: {
                            type: 'string',
                            example: 'Pedri'
                        },
                        team: {
                            type: 'string',
                            example: 'Barcelona'
                        },
                        position: {
                            type: 'string',
                            enum: ['GK', 'DEF', 'MID', 'FWD'],
                            example: 'MID'
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            example: 8.5
                        },
                        fantasyPoints: {
                            type: 'integer',
                            example: 45
                        }
                    }
                },
                Bargain: {
                    type: 'object',
                    properties: {
                        player: {
                            $ref: '#/components/schemas/Player'
                        },
                        valueRatio: {
                            type: 'number',
                            format: 'float',
                            description: 'Ratio puntos/precio (mayor = mejor valor)',
                            example: 1.35
                        },
                        estimatedPrice: {
                            type: 'number',
                            format: 'float',
                            example: 11.5
                        },
                        savings: {
                            type: 'number',
                            format: 'float',
                            description: 'Diferencia entre precio estimado y real',
                            example: 3.0
                        }
                    }
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'OK'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        environment: {
                            type: 'string',
                            example: 'development'
                        },
                        version: {
                            type: 'string',
                            example: '1.0.0'
                        }
                    }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Bad Request - Validación fallida',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Recurso no encontrado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                InternalError: {
                    description: 'Error interno del servidor',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                RateLimitExceeded: {
                    description: 'Rate limit excedido',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [
        './backend/routes/*.js', // Escanear todas las rutas
        './backend/server.js' // Escanear servidor principal
    ]
};

const swaggerSpec = swaggerJsdoc(options);

logger.info('Swagger/OpenAPI configurado', {
    endpoints: swaggerSpec.paths ? Object.keys(swaggerSpec.paths).length : 0,
    version: swaggerSpec.info.version
});

module.exports = swaggerSpec;