/**
 * Rate Limiting Middleware
 * Protección contra abuso de API y ataques DDoS
 *
 * Configuraciones por tipo de endpoint:
 * - General API: 100 req/15min
 * - Auth: 5 req/15min (más restrictivo)
 * - Heavy Operations (VEO3): 10 req/hora
 * - Public: 50 req/15min
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Handler personalizado para cuando se excede el límite
 */
const rateLimitHandler = (req, res) => {
    logger.warn('Rate limit exceeded', {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent')
    });

    res.status(429).json({
        success: false,
        error: 'Demasiadas peticiones. Por favor, inténtalo más tarde.',
        retryAfter: res.getHeader('Retry-After'),
        message: 'Has excedido el límite de peticiones permitidas'
    });
};

/**
 * Rate limiter general para toda la API
 * 100 peticiones por 15 minutos por IP
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 peticiones
    message: 'Demasiadas peticiones desde esta IP, por favor inténtalo más tarde.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: rateLimitHandler,
    skip: (req) => {
        // Skip rate limiting para health checks
        return req.path === '/health' || req.path === '/api/info';
    }
});

/**
 * Rate limiter estricto para autenticación
 * 5 peticiones por 15 minutos por IP
 * Previene ataques de fuerza bruta
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos
    message: 'Demasiados intentos de autenticación. Por favor, espera antes de reintentar.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

/**
 * Rate limiter para operaciones pesadas
 * 10 peticiones por hora por IP
 * Usado para generación de videos VEO3, análisis complejos, etc.
 */
const heavyOperationsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 peticiones por hora
    message: 'Has excedido el límite de operaciones pesadas. Espera 1 hora.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

/**
 * Rate limiter para endpoints públicos
 * 50 peticiones por 15 minutos por IP
 * Balance entre accesibilidad y protección
 */
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 peticiones
    message: 'Demasiadas peticiones desde esta IP para este recurso público.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

/**
 * Rate limiter flexible para desarrollo
 * 500 peticiones por 15 minutos
 * Solo usar en desarrollo/testing
 */
const developmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Rate limit excedido (development mode)',
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter específico para API-Sports proxy
 * 75 peticiones por minuto (respetando plan Ultra 75k/día)
 * 75k/día = ~52 req/min promedio, usamos 75 para permitir bursts
 */
const apiSportsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 75, // 75 peticiones por minuto
    message: 'Límite de API-Sports alcanzado. Espera 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

/**
 * Rate limiter para endpoints de imágenes
 * 30 peticiones por 15 minutos
 * Balance entre generación de contenido y protección
 */
const imageGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Límite de generación de imágenes alcanzado.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

/**
 * Rate limiter para VEO3 (más restrictivo que heavy operations)
 * 5 peticiones por hora por IP
 * VEO3 es muy costoso ($0.30/video) y lento (4-6 min)
 */
const veo3Limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Solo 5 videos por hora
    message: 'Límite de generación de videos VEO3 alcanzado. Espera 1 hora.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

/**
 * Middleware para aplicar rate limiting basado en environment
 * En desarrollo usa límites más permisivos
 */
const adaptiveRateLimiter = (limiter) => {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
            logger.debug('Rate limiting deshabilitado en desarrollo');
            return next();
        }
        return limiter(req, res, next);
    };
};

// Log de inicialización
logger.info('Rate limiting middleware inicializado', {
    environment: process.env.NODE_ENV || 'development',
    generalLimit: '100 req/15min',
    authLimit: '5 req/15min',
    heavyOpsLimit: '10 req/hora',
    veo3Limit: '5 req/hora',
    apiSportsLimit: '75 req/min'
});

module.exports = {
    generalLimiter,
    authLimiter,
    heavyOperationsLimiter,
    publicLimiter,
    developmentLimiter,
    apiSportsLimiter,
    imageGenerationLimiter,
    veo3Limiter,
    adaptiveRateLimiter
};