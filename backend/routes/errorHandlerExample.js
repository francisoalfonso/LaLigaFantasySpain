/**
 * Ejemplo de uso del Error Handler centralizado
 * Este archivo muestra cómo refactorizar rutas existentes
 * para usar el nuevo sistema de manejo de errores
 */

const express = require('express');
const router = express.Router();
const {
    asyncHandler,
    NotFoundError,
    ValidationError,
    ExternalAPIError,
    handleExternalAPIError
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ❌ ANTES: Ruta con try/catch tradicional
 */
router.get('/old-style/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID es requerido'
            });
        }

        // Simular búsqueda en base de datos
        const data = await someDatabase.findById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Recurso no encontrado'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        logger.error('Error en old-style route:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * ✅ DESPUÉS: Ruta refactorizada con asyncHandler
 * - No necesita try/catch
 * - Errores automáticamente manejados por errorHandler middleware
 * - Logging estructurado automático
 */
router.get(
    '/new-style/:id',
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Validación - lanza ValidationError automáticamente
        if (!id) {
            throw new ValidationError('ID es requerido');
        }

        // Simular búsqueda en base de datos
        const data = await someDatabase.findById(id);

        // NotFoundError se maneja automáticamente
        if (!data) {
            throw new NotFoundError('Recurso', id);
        }

        // Respuesta exitosa
        res.json({
            success: true,
            data: data
        });
    })
);

/**
 * ✅ Ejemplo: Manejo de errores de API externa
 */
router.get(
    '/external-api/:playerId',
    asyncHandler(async (req, res) => {
        const { playerId } = req.params;

        try {
            // Llamada a API externa (ej: API-Sports)
            const response = await axios.get(`https://api-sports.io/player/${playerId}`);

            res.json({
                success: true,
                data: response.data
            });
        } catch (error) {
            // Helper automático para errores de API externa
            handleExternalAPIError('API-Sports', error);
        }
    })
);

/**
 * ✅ Ejemplo: Validación con múltiples errores
 */
router.post(
    '/create-player',
    asyncHandler(async (req, res) => {
        const { name, age, position } = req.body;

        // Validación con detalles
        const errors = [];

        if (!name || name.length < 3) {
            errors.push({
                field: 'name',
                message: 'Nombre debe tener al menos 3 caracteres'
            });
        }

        if (!age || age < 18 || age > 45) {
            errors.push({
                field: 'age',
                message: 'Edad debe estar entre 18 y 45 años'
            });
        }

        if (!['GK', 'DEF', 'MID', 'FWD'].includes(position)) {
            errors.push({
                field: 'position',
                message: 'Posición inválida'
            });
        }

        // Si hay errores, lanzar ValidationError con detalles
        if (errors.length > 0) {
            throw new ValidationError('Validación fallida', errors);
        }

        // Crear jugador
        const newPlayer = await database.createPlayer({ name, age, position });

        res.status(201).json({
            success: true,
            data: newPlayer
        });
    })
);

/**
 * ✅ Ejemplo: Manejo de errores de base de datos
 */
router.get(
    '/players',
    asyncHandler(async (req, res) => {
        try {
            const players = await database.query('SELECT * FROM players');

            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            // Helper para errores de base de datos
            const { handleDatabaseError } = require('../middleware/errorHandler');
            handleDatabaseError('SELECT players', error);
        }
    })
);

/**
 * 📝 GUÍA DE MIGRACIÓN:
 *
 * 1. Reemplazar función async tradicional con asyncHandler:
 *    ANTES: router.get('/ruta', async (req, res) => { ... })
 *    DESPUÉS: router.get('/ruta', asyncHandler(async (req, res) => { ... }))
 *
 * 2. Eliminar try/catch externo:
 *    - asyncHandler captura errores automáticamente
 *    - Solo usar try/catch para errores de API externa o DB
 *
 * 3. Reemplazar res.status(400).json() con throw new Error:
 *    ANTES: return res.status(400).json({ error: 'mensaje' })
 *    DESPUÉS: throw new ValidationError('mensaje')
 *
 * 4. Usar clases de error apropiadas:
 *    - ValidationError: Errores de validación (400)
 *    - NotFoundError: Recursos no encontrados (404)
 *    - UnauthorizedError: No autorizado (401)
 *    - ForbiddenError: Prohibido (403)
 *    - ExternalAPIError: Error en API externa (502)
 *    - DatabaseError: Error en DB (500)
 *
 * 5. Logging automático:
 *    - No necesitas logger.error() manualmente
 *    - errorHandler middleware lo hace automáticamente
 */

module.exports = router;