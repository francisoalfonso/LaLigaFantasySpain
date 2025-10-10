# Contributing to Fantasy La Liga Pro

¡Gracias por tu interés en contribuir a Fantasy La Liga Pro! Este documento
proporciona las guías y estándares para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Empezar](#cómo-empezar)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Workflow de Git](#workflow-de-git)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

## 🤝 Código de Conducta

Este proyecto adhiere a un código de conducta profesional:

- **Respeto**: Trata a todos los colaboradores con respeto
- **Colaboración**: Trabaja en equipo y comparte conocimiento
- **Calidad**: Mantén altos estándares de código y documentación
- **Comunicación**: Sé claro y constructivo en tus comentarios

## 🚀 Cómo Empezar

### Requisitos Previos

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **Git**: Versión reciente
- **Editor**: VS Code recomendado (con ESLint + Prettier)

### Configuración Inicial

```bash
# 1. Fork el repositorio
# 2. Clone tu fork
git clone https://github.com/TU_USUARIO/LaLigaFantasySpain.git
cd LaLigaFantasySpain

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# 5. Inicializar base de datos (opcional)
npm run db:init

# 6. Ejecutar tests
npm test

# 7. Iniciar servidor de desarrollo
npm run dev
```

### Verificar Instalación

```bash
# Health check del servidor
curl http://localhost:3000/health

# Verificar calidad de código
npm run quality
```

## 🔄 Proceso de Desarrollo

### 1. Seleccionar una Tarea

- **Revisar**: `NEXT_TASK.md` para tareas prioritarias
- **Verificar**: `TAREAS_PENDIENTES.md` para tareas disponibles
- **Consultar**: Issues en GitHub si están disponibles

### 2. Crear Branch

```bash
# Branch naming convention:
# - feature/nombre-descriptivo
# - fix/descripcion-bug
# - docs/tipo-documentacion
# - refactor/area-refactorizada

git checkout -b feature/nueva-funcionalidad
```

### 3. Desarrollar

**ANTES de escribir código:**

1. ✅ Leer `CLAUDE.md` - Guías del proyecto
2. ✅ Revisar `CODE_STYLE.md` - Estándares de código
3. ✅ Consultar `API_GUIDELINES.md` - Uso de APIs
4. ✅ Verificar patrones existentes en el código

**Durante el desarrollo:**

1. ✅ Escribir código siguiendo estándares
2. ✅ Agregar logs usando Winston logger
3. ✅ Aplicar rate limiting apropiado
4. ✅ Validar inputs con Joi
5. ✅ Escribir tests para nueva funcionalidad

**Workflow típico:**

```bash
# Desarrollo con auto-reload
npm run dev

# Verificar calidad mientras desarrollas
npm run lint          # Verificar errores
npm run format:check  # Verificar formato

# Corregir automáticamente
npm run lint:fix      # Fix linting issues
npm run format        # Format code

# Testing
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Con cobertura
```

### 4. Testing

**Tests OBLIGATORIOS para:**

- ✅ Nuevas funcionalidades
- ✅ Fixes de bugs
- ✅ Cambios en lógica de negocio
- ✅ Integraciones con APIs externas

**Ubicación de tests:**

```
tests/
├── unit/           # Tests unitarios
├── integration/    # Tests de integración
└── e2e/           # Tests end-to-end
```

**Ejecutar tests:**

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- --testPathPattern=evolution

# Con cobertura (mínimo 70%)
npm run test:coverage
```

## 📝 Estándares de Código

### JavaScript Moderno

```javascript
// ✅ CORRECTO: Usar async/await
async function fetchPlayerData(playerId) {
    try {
        const response = await apiClient.getPlayer(playerId);
        return response.data;
    } catch (error) {
        logger.error('Error fetching player:', error);
        throw error;
    }
}

// ❌ INCORRECTO: Callbacks anidados
function fetchPlayerData(playerId, callback) {
    apiClient.getPlayer(playerId, (err, response) => {
        if (err) {
            console.log('Error:', err);
            return callback(err);
        }
        callback(null, response.data);
    });
}
```

### Logging Profesional

```javascript
// ✅ CORRECTO: Usar Winston logger
const logger = require('../utils/logger');

logger.info('Procesando jugador', { playerId, team });
logger.error('Error en API-Sports', { error: error.message, playerId });

// ❌ INCORRECTO: console.log
console.log('Procesando jugador:', playerId);
console.error('Error:', error);
```

### Rate Limiting

```javascript
// ✅ CORRECTO: Aplicar rate limiter apropiado
const { apiSportsLimiter } = require('../middleware/rateLimiter');

router.get('/players', apiSportsLimiter, async (req, res) => {
    // Tu código aquí
});

// ❌ INCORRECTO: Sin rate limiting
router.get('/players', async (req, res) => {
    // Tu código aquí
});
```

### Validación de Inputs

```javascript
// ✅ CORRECTO: Validar con Joi
const Joi = require('joi');

const playerSchema = Joi.object({
    playerId: Joi.number().required(),
    season: Joi.number().min(2020).max(2030).required()
});

const { error, value } = playerSchema.validate(req.body);
if (error) {
    return res.status(400).json({ error: error.message });
}

// ❌ INCORRECTO: Sin validación
const playerId = req.body.playerId; // Sin validar tipo ni existencia
```

### Comentarios en Español

```javascript
// ✅ CORRECTO: Comentarios claros en español
/**
 * Calcula puntos Fantasy según reglas oficiales La Liga
 * @param {Object} stats - Estadísticas del jugador
 * @param {string} position - Posición del jugador (GK, DEF, MID, FWD)
 * @returns {number} Puntos Fantasy calculados
 */
async function calculateFantasyPoints(stats, position) {
    // Puntos base por jugar
    let points = stats.minutesPlayed > 0 ? 2 : 0;

    // Goles según posición
    const goalsMultiplier = GOALS_POINTS[position];
    points += stats.goals * goalsMultiplier;

    return points;
}
```

## 🌿 Workflow de Git

### Commits

**Formato de commit messages:**

```
<tipo>: <descripción corta>

<descripción detallada opcional>

<footer opcional: referencias, breaking changes>
```

**Tipos de commits:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Mantenimiento (dependencias, etc.)

**Ejemplos:**

```bash
# Bueno
git commit -m "feat: agregar sistema de evolución de valor con datos reales"
git commit -m "fix: corregir cálculo de jornada actual en fantasyEvolution"
git commit -m "docs: actualizar CLAUDE.md con nuevas APIs"

# Malo
git commit -m "cambios"
git commit -m "fix"
git commit -m "update"
```

### Branches

**Nombrado:**

```bash
feature/nombre-descriptivo-kebab-case
fix/bug-especifico-a-corregir
docs/tipo-documentacion
refactor/area-refactorizada
```

**Ejemplos:**

```bash
git checkout -b feature/player-evolution-real-data
git checkout -b fix/evolution-fictitious-gameweek
git checkout -b docs/api-guidelines
git checkout -b refactor/fantasy-points-calculator
```

## 🔀 Pull Requests

### Antes de Crear PR

1. ✅ Tests pasan: `npm test`
2. ✅ Linting correcto: `npm run lint`
3. ✅ Formato correcto: `npm run format:check`
4. ✅ Calidad verificada: `npm run quality`
5. ✅ Branch actualizado con main

```bash
# Sincronizar con main
git checkout main
git pull origin main
git checkout tu-branch
git rebase main

# Resolver conflictos si los hay
# Verificar que todo funciona
npm run quality
```

### Crear Pull Request

**Título**: Descriptivo y claro

```
feat: Sistema de evolución de valor con datos reales
fix: Cálculo incorrecto de jornada actual
docs: Guías de contribución y estándares de código
```

**Descripción**: Template completo

```markdown
## 🎯 Descripción

Breve descripción de los cambios realizados.

## 📋 Tipo de Cambio

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causa breaking change)
- [ ] 📝 Documentación (cambios solo en documentación)
- [ ] 🎨 Estilo (formato, punto y coma, etc; sin cambio de código)
- [ ] ♻️ Refactor (código que no corrige bug ni agrega feature)
- [ ] ⚡️ Performance (cambio que mejora performance)
- [ ] ✅ Tests (agregar tests faltantes o corregir existentes)

## ✅ Checklist

- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código en áreas complejas
- [ ] He actualizado la documentación relevante
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests unitarios nuevos y existentes pasan localmente
- [ ] He actualizado CHANGELOG.md si aplica

## 🧪 Tests

Describe los tests que agregaste o modificaste.

## 📸 Screenshots (si aplica)

Agrega screenshots si hay cambios visuales.

## 🔗 Issues Relacionados

Fixes #123 Relates to #456
```

### Review Process

1. **Automático**: CI/CD ejecuta tests y linting
2. **Code Review**: Al menos 1 aprobación requerida
3. **Testing**: Verificar en ambiente de desarrollo
4. **Merge**: Squash and merge recomendado

## ✅ Testing

### Estructura de Tests

```javascript
// tests/unit/fantasyEvolution.test.js
const FantasyEvolution = require('../../backend/services/fantasyEvolution');

describe('FantasyEvolution', () => {
    let evolutionService;

    beforeEach(() => {
        evolutionService = new FantasyEvolution();
    });

    describe('calculateRealCurrentGameweek', () => {
        it('should calculate correct gameweek from fixtures', () => {
            const fixtures = [
                { round: 'Regular Season - 5' },
                { round: 'Regular Season - 7' }
            ];

            const result =
                evolutionService.calculateRealCurrentGameweek(fixtures);

            expect(result).toBe(7);
        });

        it('should return 0 for empty fixtures', () => {
            const result = evolutionService.calculateRealCurrentGameweek([]);
            expect(result).toBe(0);
        });
    });
});
```

### Coverage Mínimo

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

```bash
# Ver coverage
npm run test:coverage

# Coverage se genera en /coverage
open coverage/lcov-report/index.html
```

## 📚 Documentación

### Documentar SIEMPRE:

1. **Funciones públicas**: JSDoc completo
2. **APIs nuevas**: Agregar a CLAUDE.md
3. **Cambios breaking**: CHANGELOG.md
4. **Configuración**: Actualizar .env.example
5. **Workflows**: Diagramas si es necesario

### Ejemplo JSDoc

```javascript
/**
 * Genera evolución del valor Fantasy de un jugador basada en datos reales
 *
 * @async
 * @param {number} playerId - ID del jugador en API-Sports
 * @returns {Promise<Object>} Objeto con evolución completa
 * @returns {number} return.playerId - ID del jugador
 * @returns {string} return.playerName - Nombre del jugador
 * @returns {number} return.currentGameweek - Jornada actual (basada en fixtures reales)
 * @returns {Array<Object>} return.evolution - Array de evolución por jornada
 * @returns {string} return.dataSource - Fuente de datos ("API-Sports Real Data")
 *
 * @throws {Error} Si el jugador no existe en API-Sports
 *
 * @example
 * const evolution = await fantasyEvolution.generatePlayerEvolution(521);
 * console.log(evolution.currentGameweek); // 7
 * console.log(evolution.evolution.length); // 6 partidos jugados
 */
async function generatePlayerEvolution(playerId) {
    // Implementación
}
```

## 🚨 Errores Comunes a Evitar

### ❌ NO HACER:

1. **console.log** en producción (usar Winston logger)
2. **Datos hardcodeados** (usar config o .env)
3. **Secrets en código** (usar variables de entorno)
4. **Ignorar rate limiting** (aplicar limiters apropiados)
5. **Skip tests** (todos los tests deben pasar)
6. **Commits sin mensaje descriptivo**
7. **PRs sin descripción**
8. **Código sin comentarios en áreas complejas**
9. **Modificar archivos sin leerlos primero**
10. **Crear documentación sin verificar hechos**

### ✅ SÍ HACER:

1. **Winston logger** para todos los logs
2. **Configuración centralizada** (config/constants.js)
3. **.env y .env.example** actualizados
4. **Rate limiters** en todas las rutas API
5. **Tests completos** con buena cobertura
6. **Commits descriptivos** siguiendo convención
7. **PRs con template completo**
8. **Comentarios en español** para código complejo
9. **Leer archivos existentes** antes de modificar
10. **Documentación verificada** y actualizada

## 📞 Contacto y Ayuda

- **Email**: laligafantasyspainpro@gmail.com
- **GitHub Issues**: Para reportar bugs o solicitar features
- **Documentación**: `CLAUDE.md` para guía completa del proyecto

## 🎉 Reconocimientos

Todos los contribuidores son reconocidos en:

- README.md
- GitHub Contributors
- Commits con Co-Authored-By cuando aplique

---

**¡Gracias por contribuir a Fantasy La Liga Pro!** 🏆⚽
