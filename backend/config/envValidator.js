/**
 * Validador de Variables de Entorno
 * Valida todas las variables de entorno requeridas al inicio de la aplicación
 * Utiliza Joi para esquemas de validación robustos
 */

const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Schema de validación para variables de entorno
 */
const envSchema = Joi.object({
    // Node Environment
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development')
        .description('Entorno de ejecución'),

    // Server Configuration
    PORT: Joi.number().port().default(3000).description('Puerto del servidor'),

    HOST: Joi.string().hostname().default('localhost').description('Host del servidor'),

    // API-Sports Configuration (CRÍTICO)
    API_FOOTBALL_KEY: Joi.string()
        .required()
        .min(32)
        .description('API Key de API-Sports (Ultra Plan)')
        .messages({
            'any.required': 'API_FOOTBALL_KEY es obligatoria - Obtener en https://www.api-sports.io/',
            'string.min': 'API_FOOTBALL_KEY debe tener al menos 32 caracteres'
        }),

    // AEMET API (Opcional - gratuita)
    AEMET_API_KEY: Joi.string()
        .optional()
        .allow('')
        .description('API Key AEMET para datos meteorológicos'),

    // OpenAI Configuration (CRÍTICO para contenido IA)
    OPENAI_API_KEY: Joi.string()
        .required()
        .pattern(/^sk-/)
        .description('API Key de OpenAI para GPT-5 Mini')
        .messages({
            'any.required': 'OPENAI_API_KEY es obligatoria para generación de contenido',
            'string.pattern.base': 'OPENAI_API_KEY debe empezar con "sk-"'
        }),

    // VEO3 KIE.ai Configuration (CRÍTICO para videos)
    KIE_AI_API_KEY: Joi.string()
        .required()
        .min(20)
        .description('API Key de KIE.ai para generación de videos VEO3')
        .messages({
            'any.required': 'KIE_AI_API_KEY es obligatoria para generación de videos'
        }),

    ANA_IMAGE_URL: Joi.string()
        .uri()
        .required()
        .description('URL de imagen de referencia de Ana')
        .messages({
            'any.required': 'ANA_IMAGE_URL es obligatoria para consistencia de personaje'
        }),

    ANA_CHARACTER_SEED: Joi.number().integer().default(30001).description('Seed de Ana'),

    VEO3_DEFAULT_MODEL: Joi.string()
        .valid('veo3_fast', 'veo3_standard')
        .default('veo3_fast')
        .description('Modelo VEO3 por defecto'),

    VEO3_DEFAULT_ASPECT: Joi.string()
        .valid('9:16', '16:9', '1:1')
        .default('9:16')
        .description('Aspect ratio VEO3'),

    VEO3_WATERMARK: Joi.string()
        .optional()
        .allow('')
        .default('Fantasy La Liga Pro')
        .description('Marca de agua VEO3'),

    ANA_VOICE_LOCALE: Joi.string().default('es-ES').description('Locale de voz Ana'),

    ANA_VOICE_GENDER: Joi.string()
        .valid('female', 'male')
        .default('female')
        .description('Género de voz'),

    ANA_VOICE_STYLE: Joi.string()
        .default('professional')
        .description('Estilo de voz'),

    // Bunny.net Stream (CRÍTICO para hosting videos)
    BUNNY_STREAM_API_KEY: Joi.string()
        .required()
        .min(20)
        .description('API Key de Bunny.net Stream')
        .messages({
            'any.required': 'BUNNY_STREAM_API_KEY es obligatoria para hosting de videos'
        }),

    BUNNY_STREAM_LIBRARY_ID: Joi.number()
        .integer()
        .required()
        .description('Library ID de Bunny.net')
        .messages({
            'any.required': 'BUNNY_STREAM_LIBRARY_ID es obligatorio'
        }),

    BUNNY_STREAM_CDN_URL: Joi.string()
        .uri()
        .required()
        .description('CDN URL de Bunny.net')
        .messages({
            'any.required': 'BUNNY_STREAM_CDN_URL es obligatorio'
        }),

    // GitHub Configuration (Opcional)
    GITHUB_PERSONAL_ACCESS_TOKEN: Joi.string()
        .optional()
        .allow('')
        .pattern(/^ghp_/)
        .description('GitHub Personal Access Token'),

    GITHUB_USERNAME: Joi.string().optional().allow('').description('GitHub username'),

    GITHUB_REPOSITORY: Joi.string().optional().allow('').description('GitHub repository'),

    // HeyGen API (Opcional - para futuro)
    HEYGEN_API_KEY: Joi.string().optional().allow('').description('HeyGen API Key'),

    // Debug y Logging
    DEBUG: Joi.boolean().default(false).description('Modo debug'),

    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'http', 'debug')
        .default('info')
        .description('Nivel de logging Winston'),

    DISABLE_RATE_LIMIT: Joi.boolean()
        .default(false)
        .description('Deshabilitar rate limiting (solo dev)'),

    // Project Info
    PROJECT_EMAIL: Joi.string()
        .email()
        .optional()
        .allow('')
        .description('Email del proyecto'),

    PROJECT_DOMAIN: Joi.string()
        .hostname()
        .optional()
        .allow('')
        .description('Dominio del proyecto')
})
    .unknown(true) // Permitir variables adicionales no definidas
    .messages({
        'any.required': '{{#label}} es una variable de entorno obligatoria'
    });

/**
 * Valida las variables de entorno del proceso
 */
function validateEnv() {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false, // Mostrar todos los errores
        stripUnknown: false // Mantener variables no definidas
    });

    if (error) {
        // Formatear errores para logging
        const errors = error.details.map((detail) => ({
            variable: detail.path.join('.'),
            message: detail.message,
            type: detail.type
        }));

        logger.error('❌ ERROR: Variables de entorno inválidas', {
            errorCount: errors.length,
            errors: errors
        });

        console.error('\n' + '='.repeat(80));
        console.error('❌ ERRORES EN VARIABLES DE ENTORNO');
        console.error('='.repeat(80));

        errors.forEach((err, index) => {
            console.error(`${index + 1}. ${err.variable}: ${err.message}`);
        });

        console.error('\n📖 GUÍA DE CONFIGURACIÓN:');
        console.error('1. Revisar archivo .env.example para variables requeridas');
        console.error('2. Crear archivo .env con todas las variables obligatorias');
        console.error('3. Verificar que las API Keys tengan el formato correcto');
        console.error('='.repeat(80) + '\n');

        throw new Error(
            `Validación de variables de entorno fallida: ${errors.length} errores encontrados`
        );
    }

    // Log de éxito
    logger.success('✅ Variables de entorno validadas correctamente', {
        environment: value.NODE_ENV,
        port: value.PORT,
        host: value.HOST,
        apiSportsConfigured: !!value.API_FOOTBALL_KEY,
        openAIConfigured: !!value.OPENAI_API_KEY,
        veo3Configured: !!value.KIE_AI_API_KEY,
        bunnyStreamConfigured: !!value.BUNNY_STREAM_API_KEY,
        aemetConfigured: !!value.AEMET_API_KEY,
        logLevel: value.LOG_LEVEL
    });

    return value;
}

/**
 * Valida variables de entorno específicas de Supabase (.env.supabase)
 */
function validateSupabaseEnv() {
    const supabaseSchema = Joi.object({
        SUPABASE_PROJECT_URL: Joi.string()
            .uri()
            .required()
            .description('URL del proyecto Supabase')
            .messages({
                'any.required': 'SUPABASE_PROJECT_URL es obligatoria en .env.supabase'
            }),

        SUPABASE_SERVICE_ROLE_KEY: Joi.string()
            .required()
            .min(100)
            .description('Service Role Key de Supabase')
            .messages({
                'any.required': 'SUPABASE_SERVICE_ROLE_KEY es obligatoria',
                'string.min': 'SUPABASE_SERVICE_ROLE_KEY parece inválida (muy corta)'
            }),

        SUPABASE_ANON_KEY: Joi.string()
            .optional()
            .allow('')
            .description('Anon Key de Supabase'),

        DATABASE_URL: Joi.string().uri().optional().allow('').description('Database connection URL')
    })
        .unknown(true)
        .messages({
            'any.required': '{{#label}} es obligatoria en .env.supabase'
        });

    const { error, value } = supabaseSchema.validate(process.env, {
        abortEarly: false
    });

    if (error) {
        const errors = error.details.map((d) => ({
            variable: d.path.join('.'),
            message: d.message
        }));

        logger.warn('⚠️ Configuración Supabase incompleta', {
            errors: errors
        });

        return null;
    }

    logger.success('✅ Variables Supabase validadas', {
        projectUrl: value.SUPABASE_PROJECT_URL
    });

    return value;
}

/**
 * Valida variables de entorno de n8n (.env.n8n)
 */
function validateN8nEnv() {
    const n8nSchema = Joi.object({
        N8N_API_TOKEN: Joi.string().required().min(20).description('N8N API Token local'),

        N8N_BASE_URL: Joi.string()
            .uri()
            .default('http://localhost:5678')
            .description('N8N base URL local'),

        N8N_VPS_API_TOKEN: Joi.string()
            .optional()
            .allow('')
            .description('N8N API Token VPS'),

        N8N_VPS_BASE_URL: Joi.string().uri().optional().allow('').description('N8N VPS URL'),

        N8N_MCP_PORT: Joi.number().port().default(3001).description('MCP Port'),

        N8N_MCP_HOST: Joi.string().hostname().default('localhost').description('MCP Host')
    })
        .unknown(true)
        .messages({
            'any.required': '{{#label}} es obligatoria en .env.n8n'
        });

    const { error, value } = n8nSchema.validate(process.env, {
        abortEarly: false
    });

    if (error) {
        const errors = error.details.map((d) => ({
            variable: d.path.join('.'),
            message: d.message
        }));

        logger.warn('⚠️ Configuración n8n incompleta', {
            errors: errors
        });

        return null;
    }

    logger.success('✅ Variables n8n validadas', {
        baseUrl: value.N8N_BASE_URL,
        vpsConfigured: !!value.N8N_VPS_API_TOKEN
    });

    return value;
}

/**
 * Validación completa de todos los archivos .env
 */
function validateAllEnv() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VALIDANDO CONFIGURACIÓN DE VARIABLES DE ENTORNO');
    console.log('='.repeat(80) + '\n');

    // Validar .env principal
    const env = validateEnv();

    // Validar .env.supabase (opcional)
    const supabaseEnv = validateSupabaseEnv();

    // Validar .env.n8n (opcional)
    const n8nEnv = validateN8nEnv();

    console.log('\n' + '='.repeat(80));
    console.log('✅ VALIDACIÓN COMPLETADA');
    console.log('='.repeat(80) + '\n');

    return {
        main: env,
        supabase: supabaseEnv,
        n8n: n8nEnv
    };
}

module.exports = {
    validateEnv,
    validateSupabaseEnv,
    validateN8nEnv,
    validateAllEnv,
    envSchema
};