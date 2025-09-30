/**
 * Middleware centralizado de manejo de errores
 * Reemplaza try/catch dispersos con manejo consistente
 * Integrado con Winston Logger para logging estructurado
 */

const logger = require('../utils/logger');

/**
 * Clases de errores personalizados
 */
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400);
        this.name = 'ValidationError';
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource, identifier) {
        super(`${resource} no encontrado${identifier ? `: ${identifier}` : ''}`, 404);
        this.name = 'NotFoundError';
        this.resource = resource;
        this.identifier = identifier;
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Acceso prohibido') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

class ConflictError extends AppError {
    constructor(message, conflictingResource) {
        super(message, 409);
        this.name = 'ConflictError';
        this.conflictingResource = conflictingResource;
    }
}

class ExternalAPIError extends AppError {
    constructor(service, message, originalError = null) {
        super(`Error en ${service}: ${message}`, 502);
        this.name = 'ExternalAPIError';
        this.service = service;
        this.originalError = originalError;
    }
}

class DatabaseError extends AppError {
    constructor(operation, message, originalError = null) {
        super(`Error en operación de base de datos (${operation}): ${message}`, 500);
        this.name = 'DatabaseError';
        this.operation = operation;
        this.originalError = originalError;
    }
}

class RateLimitError extends AppError {
    constructor(limit, windowMs) {
        super(`Límite de peticiones excedido: ${limit} req/${windowMs}ms`, 429);
        this.name = 'RateLimitError';
        this.limit = limit;
        this.windowMs = windowMs;
    }
}

/**
 * Middleware principal de manejo de errores
 * Debe colocarse al final de toda la cadena de middlewares
 */
const errorHandler = (error, req, res, next) => {
    // Si no hay error, continuar
    if (!error) {
        return next();
    }

    // Determinar si es error operacional o programático
    const isOperational = error.isOperational || error instanceof AppError;

    // Status code por defecto
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Error interno del servidor';

    // Mapear errores de librerías externas a errores operacionales
    if (error.name === 'CastError') {
        // MongoDB/Mongoose CastError
        statusCode = 400;
        message = `ID inválido: ${error.value}`;
    } else if (error.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        message = 'Recurso duplicado';
    } else if (error.name === 'JsonWebTokenError') {
        // JWT error
        statusCode = 401;
        message = 'Token inválido';
    } else if (error.name === 'TokenExpiredError') {
        // JWT expired
        statusCode = 401;
        message = 'Token expirado';
    } else if (error.name === 'MulterError') {
        // File upload error
        statusCode = 400;
        message = `Error en upload: ${error.message}`;
    }

    // Logging según severidad
    const logData = {
        error: message,
        statusCode: statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        isOperational: isOperational,
        errorName: error.name,
        timestamp: new Date().toISOString()
    };

    // Log adicional para errores de API externa
    if (error instanceof ExternalAPIError) {
        logData.service = error.service;
        logData.originalError = error.originalError?.message;
    }

    // Log adicional para errores de base de datos
    if (error instanceof DatabaseError) {
        logData.operation = error.operation;
        logData.originalError = error.originalError?.message;
    }

    // Log adicional para errores de validación
    if (error instanceof ValidationError) {
        logData.validationDetails = error.details;
    }

    // Log según severidad
    if (statusCode >= 500) {
        // Errores del servidor - CRITICAL
        logger.error('Error crítico del servidor', {
            ...logData,
            stack: error.stack
        });
    } else if (statusCode >= 400) {
        // Errores del cliente - WARNING
        logger.warn('Error de cliente', logData);
    } else {
        // Otros errores - INFO
        logger.info('Error manejado', logData);
    }

    // En desarrollo, incluir stack trace
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Construir respuesta
    const errorResponse = {
        success: false,
        error: {
            message: message,
            statusCode: statusCode,
            timestamp: new Date().toISOString()
        }
    };

    // Agregar detalles adicionales en desarrollo
    if (isDevelopment) {
        errorResponse.error.stack = error.stack;
        errorResponse.error.name = error.name;
    }

    // Agregar detalles específicos por tipo de error
    if (error instanceof ValidationError && error.details.length > 0) {
        errorResponse.error.validationErrors = error.details;
    }

    if (error instanceof NotFoundError) {
        errorResponse.error.resource = error.resource;
        if (error.identifier) {
            errorResponse.error.identifier = error.identifier;
        }
    }

    if (error instanceof ExternalAPIError) {
        errorResponse.error.service = error.service;
        if (isDevelopment && error.originalError) {
            errorResponse.error.originalError = error.originalError.message;
        }
    }

    if (error instanceof RateLimitError) {
        errorResponse.error.retryAfter = Math.ceil(error.windowMs / 1000);
    }

    // Enviar respuesta
    res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rutas 404
 * Debe colocarse después de todas las rutas definidas
 */
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError('Endpoint', req.originalUrl);
    next(error);
};

/**
 * Wrapper async para rutas que evita try/catch
 * Uso: router.get('/ruta', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Helper para lanzar errores de API externa con contexto
 */
const handleExternalAPIError = (service, error) => {
    const message = error.response?.data?.message || error.message || 'Error desconocido';
    throw new ExternalAPIError(service, message, error);
};

/**
 * Helper para lanzar errores de base de datos con contexto
 */
const handleDatabaseError = (operation, error) => {
    const message = error.message || 'Error desconocido';
    throw new DatabaseError(operation, message, error);
};

// Log de inicialización
logger.info('Error Handler middleware inicializado', {
    features: [
        'Clases de error personalizadas',
        'Logging estructurado con Winston',
        'asyncHandler para evitar try/catch',
        'NotFound handler automático',
        'Stack traces en desarrollo'
    ]
});

module.exports = {
    // Middleware
    errorHandler,
    notFoundHandler,
    asyncHandler,
    // Clases de error
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    ExternalAPIError,
    DatabaseError,
    RateLimitError,
    // Helpers
    handleExternalAPIError,
    handleDatabaseError
};