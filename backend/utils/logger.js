/**
 * Winston Logger Configuration
 * Sistema profesional de logging con rotación diaria
 * Reemplaza los 645 console.log del proyecto
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Niveles de log personalizados (opcional)
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue'
    }
};

// Formato para consola (desarrollo) - con colores y emojis
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Mapeo de emojis por nivel
        const emojiMap = {
            error: '❌',
            warn: '⚠️',
            info: '✅',
            http: '📨',
            debug: '🔍'
        };

        const levelName = level.split(' ')[1] || 'info'; // Extraer nivel sin color
        const emoji = emojiMap[levelName] || '📋';

        let metaString = '';
        if (Object.keys(meta).length > 0) {
            // Filtrar stack traces muy largos para consola
            const filteredMeta = { ...meta };
            if (filteredMeta.stack && filteredMeta.stack.length > 200) {
                filteredMeta.stack = `${filteredMeta.stack.substring(0, 200)}...`;
            }
            metaString = `\n${JSON.stringify(filteredMeta, null, 2)}`;
        }

        return `${emoji} ${timestamp} [${level}]: ${message}${metaString}`;
    })
);

// Formato para archivos (producción) - JSON estructurado
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Transport: Console (siempre activo)
const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
});

// Transport: Logs generales con rotación diaria
const generalFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Mantener 14 días
    format: fileFormat,
    level: 'info'
});

// Transport: Errores con rotación diaria (retención más larga)
const errorFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d', // Mantener 30 días para errores
    format: fileFormat
});

// Transport: HTTP requests (opcional, separado)
const httpFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d', // HTTP logs solo 7 días
    format: fileFormat
});

// Crear logger principal
const logger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    transports: [consoleTransport, generalFileTransport, errorFileTransport, httpFileTransport],
    // No exit on error
    exitOnError: false
});

// Agregar colores personalizados
winston.addColors(customLevels.colors);

// Métodos helper para mantener compatibilidad con console.log
logger.success = (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'success' });
};

logger.api = (message, meta = {}) => {
    logger.http(message, { ...meta, type: 'api' });
};

logger.database = (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'database' });
};

logger.cache = (message, meta = {}) => {
    logger.debug(message, { ...meta, type: 'cache' });
};

// Log de inicio del sistema
logger.info('Winston Logger initialized', {
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    logsDirectory: path.resolve('logs')
});

module.exports = logger;
