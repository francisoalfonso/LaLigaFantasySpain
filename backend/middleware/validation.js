/**
 * Middleware de Validación con Joi
 * Centraliza validación de entrada para todos los endpoints
 */

const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Middleware factory para validación con Joi
 * @param {Object} schema - Schema Joi con validaciones para body, query, params
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
    return (req, res, next) => {
        const validationOptions = {
            abortEarly: false, // Retornar todos los errores, no solo el primero
            allowUnknown: true, // Permitir campos no especificados en el schema
            stripUnknown: true  // Remover campos no especificados
        };

        // Objeto a validar (combina body, query, params)
        const toValidate = {
            body: req.body || {},
            query: req.query || {},
            params: req.params || {}
        };

        // Ejecutar validación
        const { error, value } = schema.validate(toValidate, validationOptions);

        if (error) {
            // Formatear errores para respuesta clara
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            logger.warn('Validation failed', {
                endpoint: req.originalUrl,
                method: req.method,
                errors: errors,
                received: toValidate
            });

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
                message: 'Los datos de entrada no cumplen con los requisitos'
            });
        }

        // Reemplazar req con valores validados y sanitizados
        req.body = value.body;
        req.query = value.query;
        req.params = value.params;

        next();
    };
};

/**
 * Schemas de validación reutilizables
 */
const commonSchemas = {
    // Validación de ID de jugador
    playerId: Joi.object({
        params: Joi.object({
            id: Joi.number().integer().positive().required()
                .messages({
                    'number.base': 'Player ID debe ser un número',
                    'number.integer': 'Player ID debe ser un entero',
                    'number.positive': 'Player ID debe ser positivo',
                    'any.required': 'Player ID es requerido'
                })
        })
    }),

    // Validación de ID de equipo
    teamId: Joi.object({
        params: Joi.object({
            id: Joi.number().integer().positive().required()
                .messages({
                    'number.base': 'Team ID debe ser un número',
                    'any.required': 'Team ID es requerido'
                })
        })
    }),

    // Validación de temporada
    season: Joi.object({
        query: Joi.object({
            season: Joi.number().integer().min(2020).max(2030).default(2025)
                .messages({
                    'number.min': 'Temporada debe ser 2020 o posterior',
                    'number.max': 'Temporada debe ser 2030 o anterior'
                })
        })
    }),

    // Validación de paginación
    pagination: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20)
        })
    }),

    // Validación de filtros de posición
    position: Joi.object({
        query: Joi.object({
            position: Joi.string().valid('GK', 'DEF', 'MID', 'FWD', 'all').default('all')
                .messages({
                    'any.only': 'Position debe ser: GK, DEF, MID, FWD o all'
                })
        })
    }),

    // Validación de precio máximo/mínimo
    priceRange: Joi.object({
        query: Joi.object({
            minPrice: Joi.number().min(0).max(20).default(0),
            maxPrice: Joi.number().min(0).max(20).default(20)
        })
    })
};

/**
 * Schemas específicos para endpoints
 */
const schemas = {
    // POST /api/bargains/analysis - Análisis personalizado chollos
    bargainAnalysis: Joi.object({
        body: Joi.object({
            maxPrice: Joi.number().min(1).max(20).default(10)
                .messages({
                    'number.min': 'Precio máximo debe ser al menos 1',
                    'number.max': 'Precio máximo debe ser máximo 20'
                }),
            minGames: Joi.number().integer().min(0).max(38).default(2),
            minMinutes: Joi.number().integer().min(0).max(3420).default(60),
            valueRatioMin: Joi.number().min(0).max(5).default(0.8),
            position: Joi.string().valid('GK', 'DEF', 'MID', 'FWD', 'all').default('all')
        })
    }),

    // POST /api/veo3/generate-ana - Generar video VEO3
    veo3Generate: Joi.object({
        body: Joi.object({
            type: Joi.string().valid('chollo', 'analysis', 'prediction', 'custom').required()
                .messages({
                    'any.required': 'Type es requerido',
                    'any.only': 'Type debe ser: chollo, analysis, prediction o custom'
                }),
            playerName: Joi.string().min(2).max(100).when('type', {
                is: Joi.valid('chollo', 'analysis'),
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            price: Joi.number().min(1).max(20).when('type', {
                is: 'chollo',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            customPrompt: Joi.string().min(10).max(500).when('type', {
                is: 'custom',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            duration: Joi.number().integer().valid(6, 8, 12, 16, 24).default(8)
        })
    }),

    // POST /api/images/generate - Generar imagen dinámica
    imageGenerate: Joi.object({
        body: Joi.object({
            type: Joi.string().valid('player_card', 'bargain', 'match_preview', 'weekly_stats').required(),
            playerId: Joi.number().integer().positive().when('type', {
                is: Joi.valid('player_card', 'bargain'),
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            matchId: Joi.number().integer().positive().when('type', {
                is: 'match_preview',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            format: Joi.string().valid('square', 'portrait', 'landscape', 'story').default('square'),
            quality: Joi.number().integer().min(1).max(100).default(90)
        })
    }),

    // POST /api/predictions/analyze - Análisis predicción jugador
    predictionAnalyze: Joi.object({
        body: Joi.object({
            playerId: Joi.number().integer().positive().required(),
            nextOpponentId: Joi.number().integer().positive().required(),
            includeHistory: Joi.boolean().default(true),
            includeWeather: Joi.boolean().default(false),
            seasons: Joi.array().items(Joi.number().integer().min(2020).max(2030)).default([2025])
        })
    }),

    // GET /api/evolution/player/:id - Evolución jugador
    evolutionPlayer: Joi.object({
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            season: Joi.number().integer().min(2020).max(2030).default(2025),
            includeProjection: Joi.boolean().default(false)
        })
    })
};

module.exports = {
    validate,
    commonSchemas,
    schemas
};