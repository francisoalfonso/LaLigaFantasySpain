# Code Style Guide - Fantasy La Liga Pro

Este documento define los estándares de código para mantener consistencia y
calidad en el proyecto.

## 📋 Tabla de Contenidos

- [Principios Generales](#principios-generales)
- [JavaScript Style](#javascript-style)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Comments & Documentation](#comments--documentation)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Testing](#testing)
- [Security](#security)

## 🎯 Principios Generales

### DRY (Don't Repeat Yourself)

```javascript
// ✅ CORRECTO: Extraer lógica repetida
function calculateFantasyPoints(stats, position) {
    const basePoints = getBasePoints(stats);
    const positionMultiplier = getPositionMultiplier(position);
    return basePoints * positionMultiplier;
}

// ❌ INCORRECTO: Código duplicado
if (position === 'FWD') {
    points = stats.goals * 4 + stats.assists * 3 + 2;
} else if (position === 'MID') {
    points = stats.goals * 5 + stats.assists * 3 + 2;
}
// ... más repetición
```

### KISS (Keep It Simple, Stupid)

```javascript
// ✅ CORRECTO: Simple y claro
function isPlayerActive(player) {
    return player.minutesPlayed > 0;
}

// ❌ INCORRECTO: Demasiado complejo
function isPlayerActive(player) {
    return player &&
        player.stats &&
        player.stats.games &&
        player.stats.games.minutes &&
        player.stats.games.minutes > 0
        ? true
        : false;
}
```

### SOLID Principles

- **Single Responsibility**: Una clase/función, una responsabilidad
- **Open/Closed**: Abierto para extensión, cerrado para modificación
- **Liskov Substitution**: Subtipos deben ser sustituibles por tipos base
- **Interface Segregation**: Interfaces específicas mejor que generales
- **Dependency Inversion**: Depender de abstracciones, no de concreciones

## 📝 JavaScript Style

### ES6+ Features

**Usar SIEMPRE:**

- `const` y `let` (NUNCA `var`)
- Arrow functions donde sea apropiado
- Template literals para strings
- Destructuring
- Async/await (NO callbacks)
- Spread operator
- Default parameters

```javascript
// ✅ CORRECTO: ES6+ moderno
const fetchPlayerData = async (
    playerId,
    { season = 2025, team = null } = {}
) => {
    const { data, error } = await apiClient.makeRequest('/players', {
        id: playerId,
        season,
        ...(team && { team })
    });

    if (error) throw new Error(`Failed to fetch player: ${error}`);

    return {
        ...data,
        fetchedAt: new Date().toISOString()
    };
};

// ❌ INCORRECTO: ES5 antiguo
var fetchPlayerData = function (playerId, options, callback) {
    options = options || {};
    var season = options.season || 2025;

    apiClient.makeRequest(
        '/players',
        {
            id: playerId,
            season: season
        },
        function (err, data) {
            if (err) return callback(err);
            callback(null, data);
        }
    );
};
```

### Async/Await Best Practices

```javascript
// ✅ CORRECTO: Error handling con try/catch
async function getPlayerEvolution(playerId) {
    try {
        const [playerInfo, fixtures] = await Promise.all([
            this.getPlayerInfo(playerId),
            this.getPlayerFixtures(playerId)
        ]);

        return this.buildEvolution(playerInfo, fixtures);
    } catch (error) {
        logger.error('[getPlayerEvolution] Error:', {
            playerId,
            error: error.message
        });
        throw new Error(`Failed to get evolution for player ${playerId}`);
    }
}

// ❌ INCORRECTO: Sin error handling
async function getPlayerEvolution(playerId) {
    const playerInfo = await this.getPlayerInfo(playerId);
    const fixtures = await this.getPlayerFixtures(playerId);
    return this.buildEvolution(playerInfo, fixtures);
}
```

### Array Methods

```javascript
// ✅ CORRECTO: Métodos funcionales
const topPlayers = players
    .filter(p => p.fantasyPoints > 50)
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, 10)
    .map(p => ({
        id: p.id,
        name: p.name,
        points: p.fantasyPoints
    }));

// ❌ INCORRECTO: Loops imperativos
const topPlayers = [];
for (let i = 0; i < players.length; i++) {
    if (players[i].fantasyPoints > 50) {
        topPlayers.push(players[i]);
    }
}
topPlayers.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
// ... más código imperativo
```

## 🏷️ Naming Conventions

### Variables y Funciones

```javascript
// ✅ CORRECTO: camelCase para variables y funciones
const currentGameweek = 7;
const playerFantasyPoints = 85;
const isPlayerActive = true;

function calculateFantasyPoints(stats) {}
async function fetchPlayerData(playerId) {}
const getPlayerTeam = player => player.team;

// ❌ INCORRECTO: Otros casos
const CurrentGameweek = 7; // PascalCase para variables
const player_fantasy_points = 85; // snake_case
const IsPlayerActive = true; // PascalCase para boolean

function CalculateFantasyPoints(stats) {} // PascalCase para función
function fetch_player_data(playerId) {} // snake_case
```

### Classes y Constructores

```javascript
// ✅ CORRECTO: PascalCase para clases
class FantasyEvolution {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.season = 2025;
    }

    async generatePlayerEvolution(playerId) {
        // ...
    }
}

class ApiFootballClient {
    constructor() {
        // ...
    }
}

// ❌ INCORRECTO: Otros casos
class fantasyEvolution {} // camelCase
class fantasy_evolution {} // snake_case
```

### Constants

```javascript
// ✅ CORRECTO: UPPER_SNAKE_CASE para constantes globales
const MAX_REQUESTS_PER_DAY = 75000;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 10000;

// ✅ CORRECTO: camelCase para constantes de configuración compleja
const FANTASY_POINTS = {
    matchPlayed: 2,
    goalFwd: 4,
    goalMid: 5,
    goalDef: 6,
    goalGk: 10,
    assist: 3,
    yellowCard: -1,
    redCard: -3
};

// ❌ INCORRECTO
const max_requests = 75000; // snake_case
const MaxRequests = 75000; // PascalCase
```

### Files y Folders

```javascript
// ✅ CORRECTO: Nombres descriptivos
backend / services / fantasyEvolution.js;
backend / services / apiFootball.js;
backend / routes / evolution.js;
backend / middleware / rateLimiter.js;
backend / config / constants.js;

// ❌ INCORRECTO
backend / services / fe.js; // Muy corto
backend / services / fantasy_evolution.js; // snake_case
backend / services / FantasyEvolution.js; // PascalCase en archivo
```

### Booleans

```javascript
// ✅ CORRECTO: is/has/should prefixes
const isActive = true;
const hasFixtures = false;
const shouldCache = true;
const canPlay = player.injured === false;

// ❌ INCORRECTO: Sin prefijo claro
const active = true;
const fixtures = false;
const cache = true;
```

## 📁 File Organization

### Service Files

```javascript
// ✅ CORRECTO: Estructura clara
// backend/services/fantasyEvolution.js

/**
 * Servicio para calcular evolución del valor Fantasy de jugadores
 * Versión 2.0 - Datos reales desde API-Sports
 */

// 1. Imports
const ApiFootballClient = require('./apiFootball');
const logger = require('../utils/logger');
const { API_SPORTS, FANTASY_POINTS } = require('../config/constants');

// 2. Class Definition
class FantasyEvolution {
    // 2.1 Constructor
    constructor() {
        this.apiClient = new ApiFootballClient();
        this.season = API_SPORTS.SEASON_2025_26;
    }

    // 2.2 Public Methods (alphabetically)
    async generatePlayerEvolution(playerId) {}

    // 2.3 Private Methods (prefixed with _)
    _calculateGameweek(fixtures) {}
    _estimateValue(stats) {}
}

// 3. Export
module.exports = FantasyEvolution;
```

### Route Files

```javascript
// ✅ CORRECTO: Estructura de routes
// backend/routes/evolution.js

const express = require('express');
const router = express.Router();
const FantasyEvolution = require('../services/fantasyEvolution');
const { heavyOperationsLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

// Service instance
const evolutionService = new FantasyEvolution();

/**
 * @route GET /api/evolution/test
 * @desc Test endpoint para sistema de evolución
 * @access Public
 */
router.get('/test', async (req, res) => {
    // Implementation
});

/**
 * @route GET /api/evolution/player/:id
 * @desc Obtener evolución de valor de un jugador
 * @access Public
 * @rateLimit heavyOperationsLimiter
 */
router.get('/player/:id', heavyOperationsLimiter, async (req, res) => {
    // Implementation
});

module.exports = router;
```

## 💬 Comments & Documentation

### JSDoc para Funciones Públicas

```javascript
/**
 * Calcula puntos Fantasy según reglas oficiales de La Liga
 *
 * @async
 * @param {Object} stats - Estadísticas del jugador en el partido
 * @param {number} stats.minutesPlayed - Minutos jugados
 * @param {number} stats.goals - Goles marcados
 * @param {number} stats.assists - Asistencias realizadas
 * @param {string} position - Posición del jugador (GK|DEF|MID|FWD)
 * @returns {Promise<number>} Puntos Fantasy calculados
 * @throws {Error} Si la posición no es válida
 *
 * @example
 * const points = await calculateFantasyPoints(
 *   { minutesPlayed: 90, goals: 2, assists: 1 },
 *   'FWD'
 * );
 * console.log(points); // 13 (2 base + 8 goles + 3 asistencia)
 */
async function calculateFantasyPoints(stats, position) {
    // Implementation
}
```

### Comentarios Inline

```javascript
// ✅ CORRECTO: Comentarios útiles y concisos
// Calcular puntos base por participación
const basePoints = stats.minutesPlayed > 0 ? 2 : 0;

// Multiplicador de goles según posición
const goalsMultiplier = POSITION_MULTIPLIERS[position];

// HACK: API-Sports a veces retorna null en rating
// TODO: Reportar este bug a API-Sports
const rating = stats.rating || calculateEstimatedRating(stats);

// ❌ INCORRECTO: Comentarios obvios o inútiles
// Sumar 2 a los puntos
points += 2;

// Variable de puntos
let points = 0;

// Loop
for (let i = 0; i < players.length; i++) {}
```

### Section Comments

```javascript
// ✅ CORRECTO: Secciones bien definidas
class FantasyEvolution {
    constructor() {
        // Configuration
        this.apiClient = new ApiFootballClient();
        this.season = API_SPORTS.SEASON_2025_26;
        this.leagueId = API_SPORTS.LA_LIGA_ID;
    }

    // ================================================================================
    // Public Methods - Player Evolution
    // ================================================================================

    async generatePlayerEvolution(playerId) {}
    async getPlayerInfo(playerId) {}

    // ================================================================================
    // Private Methods - Calculations
    // ================================================================================

    _calculateGameweek(fixtures) {}
    _estimateValue(stats) {}
}
```

## ⚠️ Error Handling

### Try/Catch Pattern

```javascript
// ✅ CORRECTO: Error handling completo
async function fetchPlayerData(playerId) {
    try {
        // Validar input
        if (!playerId || typeof playerId !== 'number') {
            throw new Error('Invalid playerId: must be a number');
        }

        // Operación principal
        const response = await apiClient.makeRequest('/players', {
            id: playerId,
            season: 2025
        });

        // Validar respuesta
        if (!response.success || !response.data) {
            throw new Error('Invalid response from API-Sports');
        }

        return response.data;
    } catch (error) {
        // Log estructurado
        logger.error('Failed to fetch player data', {
            playerId,
            error: error.message,
            stack: error.stack
        });

        // Re-throw con contexto
        throw new Error(`Failed to fetch player ${playerId}: ${error.message}`);
    }
}

// ❌ INCORRECTO: Errores silenciados o mal manejados
async function fetchPlayerData(playerId) {
    try {
        const response = await apiClient.makeRequest('/players', {
            id: playerId
        });
        return response.data;
    } catch (error) {
        console.log('Error:', error);
        return null; // ❌ Silenciar error
    }
}
```

### Custom Errors

```javascript
// ✅ CORRECTO: Errores personalizados
class ApiSportsError extends Error {
    constructor(message, statusCode, playerId) {
        super(message);
        this.name = 'ApiSportsError';
        this.statusCode = statusCode;
        this.playerId = playerId;
    }
}

// Uso
if (!response.success) {
    throw new ApiSportsError('Player not found in API-Sports', 404, playerId);
}
```

## 📊 Logging

### Winston Logger - SIEMPRE

```javascript
// ✅ CORRECTO: Winston logger con niveles apropiados
const logger = require('../utils/logger');

// Info: Operaciones normales
logger.info('Fetching player data', { playerId, season });

// Warn: Situaciones inusuales pero manejables
logger.warn('Using fallback calculation', { playerId, reason: 'API timeout' });

// Error: Errores que requieren atención
logger.error('Failed to fetch player data', {
    playerId,
    error: error.message,
    stack: error.stack
});

// Debug: Información de debugging
logger.debug('API response received', {
    playerId,
    dataSize: response.data.length
});

// ❌ INCORRECTO: console.log en producción
console.log('Fetching player:', playerId);
console.error('Error:', error);
console.warn('Warning:', message);
```

### Structured Logging

```javascript
// ✅ CORRECTO: Logs estructurados con contexto
logger.info('Player evolution generated', {
    playerId: 521,
    playerName: 'Lewandowski',
    gameweek: 7,
    gamesPlayed: 6,
    totalPoints: 32,
    dataSource: 'API-Sports Real Data',
    duration: 2340 // ms
});

// ❌ INCORRECTO: Logs sin estructura
logger.info('Evolution generated for Lewandowski');
logger.info(`Player 521 - 7 gameweeks - 32 points`);
```

## ✅ Testing

### Test Structure

```javascript
// ✅ CORRECTO: Tests bien organizados
describe('FantasyEvolution', () => {
    let evolutionService;
    let mockApiClient;

    beforeEach(() => {
        mockApiClient = {
            makeRequest: jest.fn()
        };
        evolutionService = new FantasyEvolution(mockApiClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generatePlayerEvolution', () => {
        it('should generate evolution with real data', async () => {
            // Arrange
            const playerId = 521;
            mockApiClient.makeRequest.mockResolvedValueOnce({
                success: true,
                data: [{ player: { id: 521, name: 'Lewandowski' } }]
            });

            // Act
            const result =
                await evolutionService.generatePlayerEvolution(playerId);

            // Assert
            expect(result).toBeDefined();
            expect(result.playerId).toBe(521);
            expect(result.currentGameweek).toBeGreaterThan(0);
            expect(mockApiClient.makeRequest).toHaveBeenCalledTimes(1);
        });

        it('should throw error for invalid playerId', async () => {
            // Arrange & Act & Assert
            await expect(
                evolutionService.generatePlayerEvolution(null)
            ).rejects.toThrow('Invalid playerId');
        });
    });
});
```

### Test Naming

```javascript
// ✅ CORRECTO: Nombres descriptivos
it('should calculate correct gameweek from fixtures');
it('should return 0 for empty fixtures array');
it('should throw error when player not found');
it('should handle API-Sports timeout gracefully');

// ❌ INCORRECTO: Nombres vagos
it('works');
it('test gameweek');
it('error case');
```

## 🔒 Security

### Input Validation

```javascript
// ✅ CORRECTO: Validar con Joi
const Joi = require('joi');

const evolutionSchema = Joi.object({
    playerId: Joi.number().integer().positive().required(),
    season: Joi.number().integer().min(2020).max(2030).optional()
});

const { error, value } = evolutionSchema.validate(req.params);
if (error) {
    return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.details
    });
}
```

### Environment Variables

```javascript
// ✅ CORRECTO: Variables de entorno validadas
const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
    throw new Error('API_FOOTBALL_KEY is required in .env');
}

// ❌ INCORRECTO: Secrets hardcodeados
const API_KEY = 'abc123def456'; // ❌ NUNCA hacer esto
```

### SQL Injection Prevention

```javascript
// ✅ CORRECTO: Parameterized queries
const result = await db.query('SELECT * FROM players WHERE id = $1', [
    playerId
]);

// ❌ INCORRECTO: String concatenation
const result = await db.query(
    `SELECT * FROM players WHERE id = ${playerId}` // ❌ SQL Injection risk
);
```

## 📋 Checklist de Calidad

Antes de hacer commit, verificar:

- [ ] ✅ ESLint pasa sin errores: `npm run lint`
- [ ] ✅ Prettier aplicado: `npm run format`
- [ ] ✅ Tests pasan: `npm test`
- [ ] ✅ Coverage adecuado: `npm run test:coverage`
- [ ] ✅ No `console.log` en código
- [ ] ✅ Winston logger usado correctamente
- [ ] ✅ Rate limiting aplicado donde corresponde
- [ ] ✅ Input validation con Joi
- [ ] ✅ Error handling completo
- [ ] ✅ Comentarios en español
- [ ] ✅ JSDoc para funciones públicas
- [ ] ✅ Naming conventions seguidas
- [ ] ✅ No secrets hardcodeados
- [ ] ✅ Documentación actualizada

---

**Mantener estos estándares asegura código de alta calidad, mantenible y
profesional.** 🎯
