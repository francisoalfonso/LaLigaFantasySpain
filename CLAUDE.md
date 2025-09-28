# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 NORMAS CRÍTICAS VEO3 - ANA REAL

### ⭐ **NORMA #1 - CONSISTENCIA DE ANA (CRÍTICA)**
**Ana debe ser SIEMPRE la misma persona en todos los videos. NUNCA debe cambiar.**

- **SEED FIJO**: `ANA_CHARACTER_SEED=30001` (NUNCA CAMBIAR)
- **IMAGEN FIJA**: `ANA_IMAGE_URL` debe apuntar siempre a la misma imagen
- **VOICE LOCALE**: `es-ES` (Español de España, NO mexicano)
- **CHARACTER BIBLE**: Nunca modificar el `ANA_CHARACTER_BIBLE`

### 🗣️ **NORMA #2 - AUDIO ESPAÑOL DE ESPAÑA**
- Configuración: `voice.locale: 'es-ES'`
- Prompt debe especificar: "SPANISH FROM SPAIN (not Mexican)"
- Verificar que no suene con acento mexicano

### 📝 **APLICACIÓN EN CÓDIGO:**
```javascript
// VEO3Client - SEED SIEMPRE FIJO
seed: this.characterSeed, // NO usar options.seed

// Voice configuration
voice: {
    locale: 'es-ES',
    gender: 'female',
    style: 'professional'
}
```

### 🔧 **SOLUCIÓN PROMPT MINIMALISTA**
**Si Ana sigue cambiando con prompts complejos, usar endpoint especial:**

```bash
# Endpoint para máxima fidelidad a imagen
POST /api/veo3/test-minimal-prompt
{
  "dialogue": "Texto que debe decir Ana"
}
```

**Prompt generado**: `"The person in the reference image speaking in Spanish: '[dialogue]'. Exact appearance from reference image."`

**⚠️ Este prompt FUERZA que VEO3 use EXACTAMENTE la persona de la imagen de referencia.**

## 🚀 PRÓXIMA TAREA PRIORITARIA

**Al retomar el proyecto, comenzar inmediatamente con:**

### 🚨 Fix Sistema Evolución de Valor - CRÍTICO

**CONTEXTO**: ✅ **ANÁLISIS HISTORIAL VS RIVAL COMPLETADO** - El sistema de evolución de valor está generando **38 jornadas de datos FICTICIOS** cuando solo llevamos pocas jornadas reales.

**PROBLEMA CRÍTICO**:
- Sistema muestra jornada 38 cuando solo llevamos ~3-5 jornadas reales
- Todos los datos (precios, rating, puntos) son completamente simulados
- Fecha inicio incorrecta: usa agosto 2024 en lugar de inicio real temporada

**ARCHIVOS A MODIFICAR**:
- `backend/services/fantasyEvolution.js` - **REESCRITURA COMPLETA necesaria**
- `backend/routes/evolution.js` - Validación entrada datos reales
- Frontend - Gráficos adaptados para pocos puntos de datos

**OBJETIVO**: Mostrar evolución real con jornada actual correcta:
```
{
  "currentGameweek": 3-5,  // NO 38
  "evolution": [
    // Solo datos hasta jornada actual real
  ]
}
```

**PLAN**: Ver archivo `NEXT_TASK.md` para análisis completo y plan de implementación detallado.

---

## Project Overview

**Fantasy La Liga Dashboard** - Dashboard de validación para un influencer virtual automatizado de Instagram que publicará contenido sobre La Liga Fantasy de fútbol. Este proyecto utiliza API-Sports para obtener datos reales de La Liga y está preparado para integración con avatares AI de HeyGen.

## Development Commands

```bash
# Instalar dependencias
npm install

# Iniciar servidor en modo desarrollo (with nodemon)
npm run dev

# Iniciar servidor en producción
npm start

# Ejecutar tests (runs test routes)
npm test

# Base de datos (Supabase PostgreSQL)
npm run db:init         # Inicializar schema completo de la base de datos
npm run db:test         # Test completo de conexión y funcionalidad
npm run db:test:quick   # Test rápido de conexión básica
npm run db:migrate      # Alias para db:init

# Test API connectivity
curl http://localhost:3000/health
curl http://localhost:3000/api/info

# Code Quality (No lint/typecheck - manual review only)
# Note: Project uses vanilla JS with manual code review
# Check recent changes with: git status && git diff

# Development Debugging Commands
curl http://localhost:3000/api/test/ping                    # Basic server health
curl http://localhost:3000/api/test/config                 # Environment validation
curl http://localhost:3000/api/laliga/test                 # API-Sports connectivity
curl http://localhost:3000/api/bargains/test               # Bargain analyzer test
curl "http://localhost:3000/api/bargains/top?limit=5"      # Quick bargains test
curl http://localhost:3000/api/weather/test                # AEMET API test
curl http://localhost:3000/api/database/test               # Database connectivity
curl http://localhost:3000/api/images/test                 # Image generation test
curl http://localhost:3000/api/instagram/test              # Instagram integration test
curl http://localhost:3000/api/content-ai/test             # AI content generation test
curl http://localhost:3000/api/evolution/test              # ⚠️ Evolution system test (shows broken data)
curl http://localhost:3000/api/veo3/health                 # VEO3 system health check
curl http://localhost:3000/api/veo3/config                 # VEO3 configuration details
```

**Note**: This project uses vanilla JavaScript (no TypeScript), no ESLint/Prettier, and no build process. Frontend uses CDN dependencies (Alpine.js, Tailwind) served directly. Code quality is maintained through manual review and comprehensive testing infrastructure.

## Tech Stack

### Backend Dependencies
- **express**: ^4.18.2 - Main web framework
- **axios**: ^1.12.2 - HTTP client for API calls
- **cors**: ^2.8.5 - Cross-origin resource sharing
- **helmet**: ^7.1.0 - Security middleware
- **morgan**: ^1.10.0 - HTTP request logger
- **@supabase/supabase-js**: ^2.57.4 - Database client
- **pg**: ^8.16.3 - PostgreSQL client
- **dotenv**: ^16.3.1 - Environment variable management
- **jimp**: ^1.6.0 - Image processing and manipulation
- **node-html-to-image**: ^5.0.0 - HTML to image conversion for dynamic content

### Development Dependencies
- **nodemon**: ^3.0.1 - Development server with auto-reload

### Frontend (CDN-based)
- **Alpine.js**: Frontend reactivity framework
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No build process required

## Critical Development Notes

### Working with API-Sports Data
- **ALWAYS check the current season**: API-Sports uses 2025 for the 2025-26 season
- **Rate limiting**: 75k requests/day on Ultra plan - use existing cache mechanisms
- **Error handling**: All API calls use try/catch with detailed logging
- **Testing first**: Always run `curl http://localhost:3000/api/laliga/test` before data work
- **Season validation**: If date conflicts arise, always use season 2025 for API calls

### Database Operations
- **Required setup**: Must have `.env.supabase` configured before database operations
- **Initialization**: Run `npm run db:init` after any schema changes
- **Testing**: Use `npm run db:test:quick` for connectivity verification

### Development Workflow
1. Start server: `npm run dev` (uses nodemon for auto-reload)
2. Test API connectivity: `curl http://localhost:3000/api/test/ping`
3. Verify database: `npm run db:test:quick`
4. Test specific functionality with appropriate `/api/*/test` endpoint
5. **Before implementing features**: Check NEXT_TASK.md for priority tasks
6. **After changes**: Run `git status` to review modified files

## Project Structure

```
Fantasy la liga/
├── backend/
│   ├── server.js                           # Servidor Express principal
│   ├── routes/
│   │   ├── apiFootball.js                 # Rutas para API-Sports/API-Football
│   │   ├── test.js                        # Rutas de testing y validación
│   │   ├── weather.js                     # Rutas para funcionalidad meteorológica
│   │   ├── n8nMcp.js                      # Rutas para n8n MCP integration
│   │   ├── database.js                    # Rutas de base de datos
│   │   ├── dataSync.js                    # Rutas de sincronización de datos
│   │   ├── contentGenerator.js            # Rutas de generación de contenido
│   │   ├── fixtures.js                    # Rutas de fixtures/partidos
│   │   ├── debug.js                       # Rutas de debugging
│   │   ├── bargains.js                    # Rutas sistema de chollos
│   │   ├── predictions.js                 # Rutas de predicciones
│   │   ├── evolution.js                   # Rutas evolución valor jugadores (⚠️ CRÍTICO - necesita fix)
│   │   ├── contentAI.js                   # Rutas generación contenido IA
│   │   ├── imageGenerator.js              # Rutas generación imágenes dinámicas
│   │   └── instagram.js                   # Rutas automatización Instagram
│   ├── services/
│   │   ├── apiFootball.js                 # Cliente para API-Sports
│   │   ├── dataProcessor.js               # Procesador de datos Fantasy
│   │   ├── bargainAnalyzer.js             # Analizador de chollos Fantasy
│   │   ├── weatherService.js              # Servicio integración AEMET
│   │   ├── n8nMcpServer.js               # Servidor MCP para n8n
│   │   ├── competitiveIntelligenceAgent.js # Agente análisis competencia
│   │   ├── teamContentManager.js          # Gestor contenido del equipo
│   │   ├── contentGenerator.js            # Generador automático de contenido
│   │   ├── fixturesSync.js                # Sincronización de fixtures
│   │   ├── bargainCache.js                # Cache sistema de chollos
│   │   ├── fixtureAnalyzer.js             # Analizador de fixtures
│   │   ├── cacheRefreshScheduler.js       # Programador actualización cache
│   │   ├── predictorValor.js              # Predictor de valor de jugadores
│   │   ├── playersCache.js                # Cache de jugadores
│   │   ├── playersManager.js              # Gestor de jugadores
│   │   ├── fantasyEvolution.js            # Servicio evolución valor (⚠️ CRÍTICO - datos ficticios)
│   │   └── imageGenerator.js              # Generador imágenes dinámicas Instagram
│   └── config/
│       ├── constants.js                   # IDs y configuraciones de La Liga
│       ├── stadiumsWeatherConfig.js       # Configuración estadios + coordenadas GPS
│       └── reporterTeam.js                # Configuración equipo reporteros
├── frontend/
│   ├── index.html                         # Dashboard principal
│   ├── lineups-live.html                  # Visualización alineaciones en vivo
│   ├── bargains.html                      # Chollos de la jornada - análisis predictivo
│   ├── grid-debug.html                    # Debug posicionamiento grid
│   ├── ai-generator.html                  # Generador de contenido IA
│   ├── architecture.html                  # Documentación arquitectura
│   ├── player-detail.html                 # Páginas detalle individual jugador
│   ├── players-agenda.html                # Sistema agenda/calendario jugadores
│   ├── content-strategy-matrix.html       # Matriz estrategia contenido
│   ├── content-staging.html               # Área staging y preview contenido
│   ├── style.css                          # Estilos personalizados
│   └── app.js                             # Lógica Alpine.js
├── database/
│   ├── init-database.js                   # Script inicialización Supabase
│   ├── test-database.js                   # Tests base de datos
│   └── supabase-schema.sql                # Schema PostgreSQL completo
├── .env                                   # Variables de entorno
├── .env.example                           # Template configuración entorno
└── .env.supabase                          # Configuración Supabase (crear desde example)
```

## API Endpoints

### Testing
- `GET /api/test/ping` - Test básico del servidor
- `GET /api/test/config` - Verificar configuración
- `GET /api/test/full-workflow` - Test completo del flujo
- `POST /api/test/fantasy-points` - Test calculadora de puntos

### API-Sports/API-Football Integration
- `GET /api/laliga/test` - Prueba de conexión API-Sports
- `GET /api/laliga/laliga/info` - Información de La Liga
- `GET /api/laliga/laliga/teams` - Equipos de La Liga
- `GET /api/laliga/laliga/players` - Jugadores de La Liga
- `GET /api/laliga/laliga/standings` - Clasificación actual
- `POST /api/laliga/laliga/fantasy-points` - Calcular puntos Fantasy

### Chollos de la Jornada (Sistema Predictivo)
- `GET /api/bargains/test` - Test del analizador de chollos
- `GET /api/bargains/top` - Mejores chollos de la jornada
- `GET /api/bargains/position/:position` - Chollos por posición (GK, DEF, MID, FWD)
- `GET /api/bargains/compare/:id1/:id2` - Comparar valor de dos jugadores
- `POST /api/bargains/analysis` - Análisis personalizado con parámetros avanzados

### Weather Integration (AEMET API - Phase 2)
- `GET /api/weather/test` - Test conexión AEMET (Agencia Estatal Meteorología)
- `GET /api/weather/stadiums` - Lista estadios La Liga con coordenadas GPS
- `GET /api/weather/stadium/:teamId` - Clima actual estadio específico
- `GET /api/weather/match/:matchId` - Clima para partido específico
- `POST /api/weather/avatar-config` - Configuración avatar según clima

### Instagram Content Automation
- `GET /api/images/test` - Test generador imágenes dinámicas
- `POST /api/images/generate` - Generar imagen personalizada para Instagram
- `GET /api/instagram/test` - Test integración Instagram API
- `POST /api/instagram/post` - Publicar contenido automático Instagram
- `GET /api/content-ai/test` - Test generación contenido IA personalizado

### Player Evolution System (⚠️ CRITICAL - Currently Broken)
- `GET /api/evolution/player/:id` - Evolución valor jugador (genera datos ficticios)
- `GET /api/evolution/test` - Test sistema evolución (muestra jornada 38 ficticia)

## Configuration

### Environment Variables (.env)
```bash
# API-Sports (La Liga Real Data)
API_FOOTBALL_KEY=your_api_sports_key_here

# AEMET OpenData API (Meteorología Oficial España - GRATUITA)
# Obtener en: https://opendata.aemet.es/centrodedescargas/obtencionAPIKey
AEMET_API_KEY=your_aemet_api_key_here

# Servidor
NODE_ENV=development
PORT=3000
HOST=localhost

# Debug
DEBUG=true

# GitHub (Para MCP y deployment)
GITHUB_PERSONAL_ACCESS_TOKEN=tu_github_token_aqui
GITHUB_USERNAME=laligafantasyspainpro-ux
GITHUB_REPOSITORY=LaLigaFantasySpain

# HeyGen API (Cuando se configure)
HEYGEN_API_KEY=tu_heygen_api_key_aqui

# Project Information
PROJECT_EMAIL=laligafantasyspainpro@gmail.com
PROJECT_DOMAIN=laligafantasyspain.com
```

### Database Configuration (.env.supabase)

El proyecto utiliza Supabase PostgreSQL como base de datos principal. Crear archivo `.env.supabase`:

```bash
# Supabase Configuration
SUPABASE_PROJECT_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui

# Database Connection
DATABASE_URL=postgresql://postgres:[password]@db.tu-proyecto.supabase.co:5432/postgres
```

## 🚨 INFORMACIÓN CRÍTICA - TEMPORADA 2025-26 🚨

**⚠️ LEER OBLIGATORIAMENTE ANTES DE CUALQUIER DESARROLLO ⚠️**

### 🏆 TEMPORADA ACTUAL: 2025-26

**CONFIGURACIÓN DEFINITIVA (NO CAMBIAR):**
- **Temporada**: 2025-26 (95ª temporada de La Liga)
- **API-Sports Season ID**: `2025` (confirmado - API usa 2025 para temporada 2025-26)
- **Configuración**: `SEASON_2025_26: 2025` en `backend/config/constants.js`
- **Fechas**: 15 Agosto 2025 - 24 Mayo 2026
- **Campeón defensor**: Barcelona (28º título)

### 🏟️ EQUIPOS OFICIALES 2025-26 (20 EQUIPOS)

**ASCENSOS (3 nuevos equipos):**
- ✅ **Levante** (ID: 539) - Promovido primero
- ✅ **Elche** (ID: 797) - Promovido último día
- ✅ **Real Oviedo** (ID: 718) - Ganó playoff ascenso

**DESCENSOS 2024-25 (equipos que YA NO ESTÁN):**
- ❌ **Valladolid** - Relegado
- ❌ **Las Palmas** - Relegado
- ❌ **Leganés** - Relegado

**IMPORTANTE**: Si aparecen Valladolid, Las Palmas o Leganés en datos, ES ERROR de configuración.

### 🔧 CONFIGURACIÓN TÉCNICA

- **Liga ID**: 140 (La Liga)
- **Season Parameter**: 2025 (para temporada 2025-26)
- **Total equipos**: 20 (obligatorio)
- **Jugadores aproximados**: ~600 (30 por equipo)

### ⚠️ RECORDATORIO PARA CLAUDE CODE ⚠️

**CADA VEZ QUE INICIES O TE RECARGUES:**
1. **TEMPORADA**: Siempre 2025-26
2. **API-Sports Season**: Siempre 2025
3. **Equipos**: Siempre 20 (con Levante, Elche, Oviedo)
4. **NO incluir**: Valladolid, Las Palmas, Leganés
- **API-Sports Plan**: Ultra ($29/mes) - 75,000 requests/día
- **Sistema de puntos Fantasy**: Implementado según reglas oficiales
- **Server Config**: PORT=3000, HOST=localhost (configurable via env vars)
- **Weather Integration**: 20 stadiums with GPS coordinates (stadiumsWeatherConfig.js)
- **Database**: Supabase PostgreSQL con schema completo (database/supabase-schema.sql)
- **AI Content Generation**: GPT-5 Mini para avatares ($0.29/mes)

## Fantasy Points System

Sistema oficial de La Liga Fantasy implementado en `dataProcessor.js`:

**Todas las posiciones:**
- Partido jugado: +2 pts
- Asistencia: +3 pts
- Tarjeta amarilla: -1 pt
- Tarjeta roja: -3 pts

**Goles (por posición):**
- Portero: +10 pts
- Defensa: +6 pts
- Centrocampista: +5 pts
- Delantero: +4 pts

**Específico porteros:**
- Portería a cero: +4 pts
- Penalti parado: +5 pts
- Gol encajado: -1 pt

**Específico defensas:**
- Portería a cero: +4 pts
- Cada 2 goles encajados: -1 pt

## Data Flow

1. **API-Sports** → Datos en tiempo real de La Liga (75k requests/día)
2. **apiFootball.js** → Cliente API con rate limiting implementado
3. **dataProcessor.js** → Calcula puntos Fantasy según sistema oficial
4. **Supabase PostgreSQL** → Almacenamiento persistente (teams, players, matches, stats)
5. **Dashboard** → Visualiza datos y insights
6. **Futuro**: teamContentManager.js → HeyGen → Instagram

## Database Architecture (Supabase PostgreSQL)

### Core Tables Schema

El proyecto utiliza Supabase PostgreSQL con las siguientes tablas principales:

- **`teams`** - Equipos de La Liga (20 equipos)
- **`players`** - Jugadores activos (600+ jugadores)
- **`matches`** - Partidos de la temporada
- **`player_stats`** - Estadísticas detalladas por jornada
- **`fantasy_points`** - Puntos Fantasy calculados
- **`content_plans`** - Planificación de contenido
- **`social_posts`** - Posts generados para redes sociales

### Database Operations

```bash
# Inicialización completa de la base de datos
npm run db:init

# Verificar conexión y estructura
npm run db:test

# Test rápido de conectividad
npm run db:test:quick
```

### Database Configuration

1. **Crear proyecto en Supabase**: [https://supabase.com](https://supabase.com)
2. **Obtener credenciales**: Project URL y Service Role Key
3. **Configurar `.env.supabase`**:
   ```bash
   SUPABASE_PROJECT_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```
4. **Ejecutar inicialización**: `npm run db:init`

### Architecture Notes

- **PostgreSQL 15+** con extensiones activadas
- **Row Level Security (RLS)** configurado
- **Funciones automáticas** para cálculo de puntos Fantasy
- **Triggers** para actualización de estadísticas
- **Índices optimizados** para consultas frecuentes

## Sistema de Chollos Fantasy (BargainAnalyzer)

### Funcionalidad Principal

El `BargainAnalyzer` identifica jugadores con alto potencial de puntos Fantasy a precios bajos usando algoritmos de análisis de valor.

### Criterios de Análisis

```javascript
// Configuración por defecto
{
  MAX_PRICE: 8.0,          // Precio máximo para considerar "chollo"
  MIN_GAMES: 3,            // Mínimo de partidos jugados
  MIN_MINUTES: 90,         // Mínimos minutos totales
  VALUE_RATIO_MIN: 1.2     // Ratio mínimo puntos/precio
}
```

### Algoritmo de Cálculo

1. **Puntos estimados**: Basado en goles, asistencias, rating y posición
2. **Precio estimado**: Algoritmo que considera rendimiento, edad, minutos
3. **Ratio de valor**: Puntos estimados / Precio estimado
4. **Filtrado**: Solo jugadores que cumplen criterios mínimos

### Endpoints Disponibles

- **GET /bargains**: Página web interactiva con filtros
- **GET /api/bargains/top**: Top chollos con parámetros opcionales
- **POST /api/bargains/analysis**: Análisis personalizado con criterios custom
- **GET /api/bargains/position/GK|DEF|MID|FWD**: Chollos por posición

### Casos de Uso

```bash
# Chollos generales (máximo 10)
curl "http://localhost:3000/api/bargains/top?limit=10"

# Solo delanteros baratos
curl "http://localhost:3000/api/bargains/position/FWD?limit=5"

# Análisis personalizado
curl -X POST "/api/bargains/analysis" \
  -H "Content-Type: application/json" \
  -d '{"maxPrice": 6, "minValueRatio": 1.5}'
```

### Integración Frontend

La página `/bargains` incluye:
- **Filtros dinámicos** por posición, precio, ratio
- **Tarjetas interactivas** con análisis detallado
- **Estadísticas en tiempo real** y recomendaciones IA
- **Responsive design** optimizado para mobile y desktop

## Development Notes

- Todo el código comentado en español
- Usar async/await para llamadas asíncronas
- Rate limiting implementado para API-Sports Plan Ultra
- Manejo de errores con try/catch
- Logs detallados para debugging
- Integración con reporterTeam.js para gestión contenido
- competitiveIntelligenceAgent.js para análisis de competencia
- **Architecture**: Express.js server with modular route structure
- **Security**: Helmet middleware, CORS configuration, environment variables
- **Logging**: Morgan middleware for HTTP requests, custom logging for debugging
- **Static Files**: Frontend served from backend/server.js at root path
- **Health Checks**: `/health` and `/api/info` endpoints for monitoring
- **Database**: Supabase PostgreSQL integration with @supabase/supabase-js client
- **Dependencies**: Core dependencies include axios, cors, express, helmet, morgan, pg, dotenv

## Core Architecture Patterns

### Service Layer Architecture
- **ApiFootballClient** (`backend/services/apiFootball.js`): Centralized API-Sports client with rate limiting
- **BargainAnalyzer** (`backend/services/bargainAnalyzer.js`): Complex algorithm for identifying undervalued players
- **DataProcessor** (`backend/services/dataProcessor.js`): Fantasy points calculation engine following official La Liga rules
- **Cache Management**: Multi-layer caching with BargainCache, PlayersCache for performance optimization
- **Weather Integration**: AEMET API integration for stadium weather data

### Route Organization
- Routes are modular and feature-based (not RESTful resources)
- Each route module handles a specific domain: `/api/laliga/*`, `/api/bargains/*`, `/api/weather/*`
- Frontend routes served directly from Express server at root level
- All API routes prefixed with `/api/` for clear separation

### Data Flow Architecture
1. **API-Sports Data Ingestion**: Rate-limited requests (75k/day Ultra plan)
2. **Processing Pipeline**: Raw data → DataProcessor → Fantasy points calculation
3. **Caching Strategy**: Redis-like caching with BargainCache and PlayersCache
4. **Frontend Consumption**: Direct API calls from HTML pages using Alpine.js

### Key System Components
- **FixtureAnalyzer**: Analyzes match difficulty and fixture congestion
- **PredictorValor**: AI-driven player value prediction system (✅ Historial vs rival analysis completed)
- **PlayersManager**: Centralized player data management and synchronization
- **ContentGenerator**: Automated content creation for social media integration
- **ImageGenerator**: Dynamic Instagram image generation from HTML templates with Jimp processing
- **FantasyEvolution**: Player value evolution tracking (⚠️ **CRITICAL** - currently showing fictitious data)

## Code Architecture Guidelines

### Adding New Features
1. **Check NEXT_TASK.md first**: Prioritize pending tasks before new features
2. **Always use existing patterns**: Check similar functionality in existing routes/services
3. **Rate limiting awareness**: New API-Sports calls must respect the 75k/day limit
4. **Error handling**: Follow the try/catch + detailed logging pattern seen in all services
5. **Testing routes**: Every new feature should have a corresponding `/test` endpoint
6. **Database changes**: Update both schema and init-database.js when adding tables
7. **Manual code review**: No automated linting - maintain quality through careful review

### Service Layer Patterns
- **Client initialization**: All external APIs use centralized client pattern (see apiFootball.js)
- **Cache integration**: Use existing BargainCache/PlayersCache patterns for performance
- **Data transformation**: Process raw API data through dataProcessor.js before storage
- **Modular routes**: Each domain gets its own route file (apiFootball.js, bargains.js, etc.)

### Frontend Integration
- **Alpine.js**: All frontend reactivity uses Alpine.js, avoid vanilla DOM manipulation
- **API calls**: Frontend makes direct calls to `/api/*` endpoints
- **Static serving**: All frontend files served from `backend/server.js` static middleware
- **No build process**: Frontend is vanilla HTML/CSS/JS with CDN dependencies

## Testing Strategy

Antes de proceder con avatar IA:
1. Validar calidad y completitud de datos API-Sports
2. Verificar cálculos de puntos Fantasy
3. Evaluar insights automáticos generados por competitiveIntelligenceAgent
4. Confirmar suficiente contenido para posts diarios
5. Test integración con teamContentManager para workflows

## 👥 Equipo de Reporteros Virtuales (reporterTeam.js)

El proyecto incluye un equipo profesional de 4 reporteros virtuales especializados, cada uno con personalidades únicas y especialidades específicas.

### 🎯 Equipo Principal

#### 1. **Ana Martínez** ("Ana Fantasy") - Analista Táctica Principal
- **Especialidades**: Análisis táctico, preview partidos, post-match analysis
- **Personalidad**: Profesional cercana, energía media-alta
- **Avatar**: Femenino, 28 años, estilo profesional deportivo
- **Calendario**: Martes, jueves, sábado
- **Tono de voz**: Confiable experta, español neutro

#### 2. **Carlos González** ("Carlos Stats") - Especialista en Estadísticas
- **Especialidades**: Estadísticas jugadores, consejos Fantasy, alineaciones optimales
- **Personalidad**: Dinámico entusiasta, energía alta
- **Avatar**: Masculino, 32 años, deportivo moderno
- **Calendario**: Lunes, miércoles, viernes
- **Tono de voz**: Entusiasta experto, velocidad media-rápida

#### 3. **Lucía Rodríguez** ("Lucía Femenina") - Fútbol Femenino y Cantera
- **Especialidades**: Liga femenina, jugadores emergentes, cantera La Liga
- **Personalidad**: Fresca moderna, energía alta
- **Avatar**: Femenino, 26 años, moderno deportivo
- **Calendario**: Domingo, miércoles
- **Tono de voz**: Moderna inspiradora

#### 4. **Pablo Martín** ("Pablo GenZ") - Especialista Gen Z
- **Especialidades**: Fantasy hacks, jugadores sorpresa, memes fútbol, trends TikTok
- **Personalidad**: Joven conectado, energía muy alta
- **Avatar**: Masculino, 19 años, estilo joven profesional casual
- **Calendario**: Jueves, viernes, domingo
- **Plataformas**: TikTok viral, Twitch streaming, stories rápidas

### ⚙️ Sistema de Distribución de Contenido

**Rotación Diaria Automática**:
- **Lunes**: Carlos (stats inicio semana)
- **Martes**: Ana (análisis táctico)
- **Miércoles**: Lucía (liga femenina + cantera)
- **Jueves**: Ana + Pablo (preview + hacks jóvenes)
- **Viernes**: Carlos + Pablo (fantasy tips + contenido viral)
- **Sábado**: Ana (análisis pre-partidos)
- **Domingo**: Pablo + Lucía (reacciones Gen Z + resumen femenina)

**Especialistas por Plataforma**:
- **YouTube análisis profundo**: Ana Martínez
- **TikTok contenido viral**: Pablo GenZ
- **Instagram infografías**: Carlos González
- **Twitch streaming en vivo**: Pablo GenZ

### 🎨 Identidad Visual Uniforme

**Inspirado en modelo DAZN**:
- **Uniforme**: Polo azul profesional (#0066cc) con logo en pecho izquierdo
- **Estudio**: Setup deportivo profesional con overlays estadísticas
- **Colores**: Azul deportivo (#0066cc), blanco (#ffffff), rojo accento (#ff3333)

### 🔧 Funciones Técnicas

**Asignación Automática**: `selectReporterForContent(contentType, date)`
**Configuración Avatar**: `getAvatarConfig(reporterId)`
**Scripts Personalizados**: `generatePersonalizedScript(reporterId, contentData)`

### 📊 Casos de Uso

```javascript
// Ejemplo asignación automática
const reporter = TEAM_FUNCTIONS.selectReporterForContent('tactical_analysis', new Date());
// Resultado: 'ana_martinez'

// Configuración avatar personalizada
const avatarConfig = TEAM_FUNCTIONS.getAvatarConfig('pablo_teen');
// Resultado: configuración voz joven + apariencia Gen Z
```

## 🤖 GPT-5 Mini - Generación de Contenido IA

Este proyecto utiliza **GPT-5 Mini** como modelo principal para la generación de contenido de avatares IA.

### ✅ Modelo Seleccionado: GPT-5 Mini

**Razones de la selección:**
- **Precio**: $0.25/1M input, $2.00/1M output ($0.29/mes estimado)
- **Calidad**: 80% del rendimiento de GPT-5 completo
- **Contexto**: 272K tokens input, 128K output
- **Cache**: 90% descuento en contenido repetitivo
- **Mejor relación calidad/precio** para Fantasy Football

### 📊 Comparativa con Otros Modelos

| Modelo | Coste Mensual | Calidad | Seleccionado |
|--------|---------------|---------|-------------|
| GPT-4o mini | $0.11 | ⭐⭐⭐⭐ | ❌ |
| **GPT-5 mini** | **$0.29** | **⭐⭐⭐⭐⭐** | **✅** |
| o4-mini | $0.28 | ⭐⭐⭐⭐ | ❌ |
| GPT-4o | $3.57 | ⭐⭐⭐⭐⭐ | ❌ Caro |

### 🎯 Funcionalidades Implementadas

#### **Endpoints Disponibles:**
- `GET /api/ai/test` - Test de conexión GPT-5 Mini
- `POST /api/ai/player-analysis` - Análisis de jugadores para avatar
- `POST /api/ai/matchday-prediction` - Predicciones de jornada
- `POST /api/ai/social-post` - Contenido para redes sociales
- `POST /api/ai/bulk-analysis` - Análisis masivo (optimizado con cache)
- `GET /api/ai/stats` - Estadísticas de uso y costes

#### **Tipos de Contenido:**
1. **Análisis de jugadores** (150-200 palabras)
2. **Predicciones de jornada** (300-400 palabras)
3. **Posts redes sociales** (50-100 palabras)
4. **Comentarios contextuales** (con clima)

### ⚙️ Configuración Técnica

```javascript
// Configuración en backend/config/constants.js
OPENAI_GPT5_MINI: {
  MODEL_NAME: 'gpt-5-mini',
  PRICING: {
    INPUT_PER_1M: 0.25,  // $0.25 per 1M tokens
    OUTPUT_PER_1M: 2.00, // $2.00 per 1M tokens
    CACHE_DISCOUNT: 0.90 // 90% descuento
  },
  TEMPERATURE: 0.7, // Balance creatividad/consistencia
}
```

### 🔧 Variables de Entorno Requeridas

```bash
# .env
OPENAI_API_KEY=tu_openai_api_key_aqui
```

### 📈 Estimaciones de Coste

- **Diario**: ~50 análisis = $0.01
- **Mensual**: ~1,500 análisis = $0.29
- **Anual**: Temporada completa = $3.48

### 🚀 Casos de Uso

```bash
# Análisis de jugador con contexto clima
curl -X POST "/api/ai/player-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {
      "name": "Lewandowski",
      "team": "Barcelona",
      "position": "FWD",
      "stats": {"goals": 2, "games": 4}
    },
    "includeWeather": true,
    "teamKey": "barcelona"
  }'

# Post para redes sociales
curl -X POST "/api/ai/social-post" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chollo",
    "data": {
      "name": "Pere Milla",
      "team": "Espanyol",
      "price": 4.0,
      "valueRatio": 1.25
    }
  }'
```

### 🎯 Integración con HeyGen

El contenido generado está optimizado para:
- **Avatares IA**: Tono profesional pero cercano
- **Duración**: Textos de 30-60 segundos de lectura
- **Contexto**: Integración con datos clima y estadísticas
- **Personalización**: Adaptado por equipo/jugador

### ⚠️ Consideraciones Importantes

1. **Rate Limiting**: 100ms entre peticiones
2. **Coste**: Monitorear uso con `/api/ai/stats`
3. **Cache**: Aprovechar 90% descuento en contenido similar
4. **Fallback**: Sistema de respaldo si GPT-5 Mini falla

## n8n MCP Integration (Oficial)

Este proyecto incluye integración oficial con n8n usando Model Context Protocol (MCP) para automatización de workflows.

### Configuración n8n MCP

1. **Variables de entorno**: Crear `.env.n8n` con tu configuración:
```bash
N8N_API_TOKEN=tu_token_n8n_aqui
N8N_BASE_URL=https://tu-instancia.n8n.cloud
N8N_MCP_PORT=3001
N8N_MCP_HOST=localhost
```

2. **Configuración Claude Code**: Agregar a tu configuración MCP:
```json
{
  "mcpServers": {
    "n8n-fantasy-laliga": {
      "command": "node",
      "args": ["/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/services/n8nMcpServer.js"]
    }
  }
}
```

### Endpoints n8n MCP

- `GET /api/n8n-mcp/test` - Test conexión n8n
- `GET /api/n8n-mcp/workflows` - Listar workflows
- `POST /api/n8n-mcp/workflows/:id/execute` - Ejecutar workflow
- `GET /api/n8n-mcp/executions/:id/status` - Estado ejecución
- `POST /api/n8n-mcp/webhooks/create` - Crear webhook
- `GET /api/n8n-mcp/tools` - Herramientas MCP disponibles
- `GET /api/n8n-mcp/config` - Configuración MCP
- `POST /api/n8n-mcp/fantasy/workflow` - Workflow Fantasy específico

### Herramientas MCP Disponibles

1. **list_workflows** - Lista workflows n8n
2. **execute_workflow** - Ejecuta workflow con datos
3. **get_execution_status** - Estado de ejecución
4. **create_webhook_workflow** - Crea webhook para Claude Code
5. **test_connection** - Test conexión n8n

### Configuración Segura

- Token n8n en `.env.n8n` (incluido en .gitignore)
- Validación de autenticación en todas las llamadas
- Rate limiting implementado
- Logs detallados para debugging

### Workflow Fantasy La Liga

Workflow automático incluido para:
- Procesamiento datos Fantasy La Liga
- Cálculo puntos automático
- Integración con API-Sports
- Webhook para Claude Code

## 🎨 Sistema de Generación de Imágenes Dinámicas (imageGenerator.js)

El proyecto incluye un sistema avanzado de generación automática de imágenes para contenido de Instagram utilizando plantillas HTML y procesamiento con Jimp.

### 🔧 Arquitectura Técnica

**Tecnologías Utilizadas**:
- **node-html-to-image**: Conversión HTML a imagen
- **Jimp**: Procesamiento y optimización de imágenes
- **Plantillas HTML**: Templates dinámicos con datos reales

### 📊 Tipos de Contenido Visual

1. **Player Cards**: Tarjetas individuales de jugadores con stats
2. **Bargain Analysis**: Visualización de chollos Fantasy
3. **Match Previews**: Análisis pre-partido con datos contextuales
4. **Weekly Stats**: Resúmenes estadísticos semanales
5. **Team Formations**: Alineaciones visuales con ratings

### ⚙️ Endpoints Disponibles

```bash
# Test sistema generación imágenes
curl http://localhost:3000/api/images/test

# Generar imagen personalizada
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "player_card", "playerId": 162686}'
```

### 🎯 Integración con Equipo de Reporteros

- **Estilo visual consistente** con identidad DAZN-inspired
- **Personalización por reportero**: Cada avatar tiene su estilo visual
- **Automatización completa**: Generación basada en calendario de contenido
- **Optimización redes sociales**: Formatos específicos para Instagram/TikTok

### 📈 Flujo de Producción

1. **Obtención datos**: API-Sports + Análisis IA
2. **Selección plantilla**: Basada en tipo contenido y reportero asignado
3. **Generación HTML**: Template con datos reales insertados
4. **Conversión imagen**: HTML → PNG/JPG optimizado
5. **Post-procesado**: Jimp para ajustes finales y compresión
6. **Distribución**: Integración con Instagram API

## 🎬 Sistema de Videos VEO3 - Ana Real (Implementado)

El proyecto incluye un sistema completo de generación de videos usando VEO3 (kie.ai) con Ana Martínez como reportera virtual.

### 🚀 Funcionalidades Implementadas

#### **Generación de Videos Ana Real**
- **Videos de chollos**: Ana revela jugadores baratos con alta probabilidad de puntos
- **Análisis de jugadores**: Análisis táctico profesional con estadísticas
- **Predicciones de jornada**: Preview y predicciones para próximos partidos
- **Videos personalizados**: Prompts custom para cualquier contenido

#### **Player Cards Overlay**
- **Tarjetas dinámicas**: Overlay de información de jugadores sobre videos
- **Múltiples jugadores**: Sistema para agregar varias tarjetas en secuencia
- **Diseño profesional**: Tarjetas con estadísticas, precios y ratings
- **Timing configurable**: Control preciso de cuándo aparecen/desaparecen

#### **Concatenación de Videos**
- **Videos largos**: Combinar múltiples segmentos de 8s en videos >24s
- **Transiciones suaves**: Crossfade entre segmentos para continuidad perfecta
- **Generación automática**: Crear videos largos a partir de prompts temáticos
- **Audio sincronizado**: Mezcla de audio profesional entre segmentos

### 🎯 Ana Real - Character Consistency

**Ana Character Bible** (NUNCA CAMBIAR):
```
A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy.
```

**Configuración Técnica**:
- **Modelo**: veo3_fast (más estable)
- **Imagen referencia**: GitHub URL para consistencia perfecta
- **Seed**: 30001 (fijo para Ana)
- **Aspect ratio**: 9:16 (optimizado para redes sociales)
- **Duración**: 8 segundos por segmento
- **Costo**: $0.30 por video

### 📋 Comandos VEO3 Disponibles

```bash
# Generación de videos Ana
npm run veo3:generate-ana           # Generar video Ana Real
npm run veo3:test-ana               # Test generación básica

# Player cards overlay
npm run veo3:add-player-card        # Agregar tarjeta jugador
npm run veo3:test-cards             # Test player cards

# Concatenación de videos
npm run veo3:concatenate            # Concatenar múltiples videos
npm run veo3:test-concat            # Test concatenación

# Testing completo
npm run veo3:test-all               # Ejecutar todos los tests VEO3
```

### 🔧 API Endpoints VEO3

```bash
# Sistema de salud y configuración
GET  /api/veo3/health               # Health check completo sistema
GET  /api/veo3/config               # Configuración actual VEO3
GET  /api/veo3/test                 # Test conectividad API

# Generación de videos
POST /api/veo3/generate-ana         # Generar video Ana (chollo/analysis/prediction)
GET  /api/veo3/status/:taskId       # Estado de generación de video

# Post-procesamiento
POST /api/veo3/add-player-card      # Agregar player card a video
POST /api/veo3/concatenate          # Concatenar múltiples videos
POST /api/veo3/generate-long-video  # Generar video largo automático
```

### 💡 Casos de Uso Principales

#### **1. Video Chollo Individual**
```bash
# Generar video de chollo para Pedri
curl -X POST http://localhost:3000/api/veo3/generate-ana \
  -H "Content-Type: application/json" \
  -d '{"type": "chollo", "playerName": "Pedri", "price": 8.5}'
```

#### **2. Análisis Táctico de Jugador**
```bash
# Script command line
node scripts/veo3/generate-ana-video.js --analysis --player "Lewandowski" --price 10.5
```

#### **3. Video Largo Multi-Segmento**
```bash
# Video largo tema "chollos" con 3 segmentos
curl -X POST http://localhost:3000/api/veo3/generate-long-video \
  -H "Content-Type: application/json" \
  -d '{"theme": "chollos", "segmentCount": 3}'
```

#### **4. Player Card Overlay**
```bash
# Agregar tarjeta de jugador a video existente
npm run veo3:add-player-card --video "ana-chollo-pedri.mp4" --player "Pedri" --price 8.5
```

### ⚙️ Variables de Entorno VEO3

```bash
# KIE.ai VEO3 API (PRINCIPAL)
KIE_AI_API_KEY=tu_api_key_kie_ai
VEO3_DEFAULT_MODEL=veo3_fast
VEO3_MAX_DURATION=8
VEO3_DEFAULT_ASPECT=9:16
VEO3_WATERMARK=Fantasy La Liga Pro

# Ana Real Configuration
ANA_IMAGE_URL=https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg
ANA_CHARACTER_SEED=30001

# Paths y Performance
VEO3_OUTPUT_DIR=./output/veo3
VEO3_TEMP_DIR=./temp/veo3
VEO3_LOGS_DIR=./logs/veo3
VEO3_MAX_CONCURRENT=3
VEO3_REQUEST_DELAY=6000
VEO3_TIMEOUT=300000

# Costs & Limits
VEO3_COST_PER_VIDEO=0.30
VEO3_DAILY_LIMIT=50.00
VEO3_MONTHLY_LIMIT=500.00
```

### 🎭 Arcos Emocionales Implementados

- **Chollo Revelation**: (susurro conspirativo) → (tensión) → (revelación explosiva) → (urgencia)
- **Data Confidence**: (confianza analítica) → (construcción convicción) → (conclusión autoritaria)
- **Breaking News**: (alerta urgente) → (construcción urgencia) → (anuncio explosivo) → (acción inmediata)
- **Professional Analysis**: (autoridad profesional) → (insight construcción) → (realización explosiva)

### 🔍 Estructura de Archivos VEO3

```
backend/
├── services/veo3/
│   ├── veo3Client.js              # Cliente API VEO3 principal
│   ├── promptBuilder.js           # Constructor prompts optimizados
│   ├── playerCardsOverlay.js      # Sistema overlay tarjetas
│   └── videoConcatenator.js       # Sistema concatenación videos
├── routes/veo3.js                 # API routes completas VEO3
└── config/veo3/
    └── anaCharacter.js            # Character Bible y configuración Ana

scripts/veo3/
├── generate-ana-video.js          # Script generación videos Ana
├── add-player-cards.js            # Script overlay player cards
└── concatenate-videos.js          # Script concatenación videos

output/veo3/                       # Videos generados finales
temp/veo3/                         # Archivos temporales
logs/veo3/                         # Logs de operaciones
```

### 💰 Economía del Sistema

- **Video individual**: $0.30 (8 segundos)
- **Video con player card**: $0.30 + procesamiento FFmpeg
- **Video largo (3 segmentos)**: $0.90 + concatenación
- **Tiempo generación**: 4-6 minutos por segmento
- **Rate limiting**: 10 requests/minuto (API KIE.ai)

### ⚠️ Consideraciones Importantes

1. **Ana Character Bible**: NUNCA modificar para mantener consistencia perfecta
2. **Prompts optimizados**: Máximo 500 caracteres por limitaciones VEO3
3. **FFmpeg requerido**: Necesario para player cards y concatenación
4. **Rate limiting**: Respetar 10 req/min de KIE.ai API
5. **Costos monitoreados**: Sistema tracking automático de gastos
6. **Transiciones suaves**: Setup neutral position para concatenación perfecta

### 🚨 Testing y Validación

```bash
# Health check completo
curl http://localhost:3000/api/veo3/health

# Test generación Ana Real
npm run veo3:test-ana

# Test player cards overlay
npm run veo3:test-cards

# Test concatenación videos
npm run veo3:test-concat

# Validación completa sistema
npm run veo3:test-all
```

El sistema VEO3 está completamente integrado y listo para producción de contenido automatizado con Ana Real.

## Future Phases

### **Fase 2: Sistema Predictivo y Análisis Avanzado** (2-4 semanas)
- **Chollos de la jornada**: Jugadores baratos con alta probabilidad de puntos
- **Predictor de puntos**: IA que estima puntuación próxima jornada
- **Análisis de rivales**: Dificultad del enfrentamiento por equipo
- **Alertas de alineación**: Notificaciones de jugadores que no jugarán
- **Capitanes recomendados**: Sugerencias IA para mejor capitán
- **Optimizador de plantilla**: Análisis automático y mejoras sugeridas

### **Fase 3: Sistema de Alertas y Notificaciones** (1-2 meses)
- **Webhook integrations**: Notificaciones push en tiempo real
- **Suscripciones a jugadores**: Seguimiento personalizado de rendimiento
- **Alertas de mercado**: Subidas/bajadas importantes de precio
- **Notificaciones de forma**: Jugadores en racha vs declive
- **Alertas de lesiones**: Información médica relevante para Fantasy

### **Fase 4: IA Conversacional y Mentoría** (2-3 meses)
- **Avatar HeyGen Fantasy Coach**: Consultor virtual personalizado
- **Tutorial interactivo**: Onboarding gamificado para nuevos usuarios
- **Tips personalizados**: Consejos basados en historial del usuario
- **Simulador de estrategias**: Probar enfoques sin riesgo
- **Explicación de decisiones**: Por qué la IA recomienda X jugador

### **Fase 5: Bienestar y Comunidad** (3-4 meses)
- **Herramientas de bienestar**: Límites de tiempo y pausas mindfulness
- **Comunidad positiva**: Enfoque en diversión vs competencia tóxica
- **Sistema de logros**: Gamificación saludable del progreso
- **Perspectiva de resultados**: Recordatorios de que es entretenimiento
- **Análisis de comportamiento**: Detección de patrones problemáticos

### **Fase 6: Integración Completa y Automatización** (4-6 meses)
- **teamContentManager**: Gestión automática de contenido
- **Integración completa HeyGen**: Avatar IA para redes sociales
- **Automatización Instagram API**: Workflows n8n para posts automáticos
- **Sistema de suscripciones**: Monetización del servicio premium
- **API pública**: Permitir integraciones de terceros

### **Fase 7: Expansión Multi-Liga** (6+ meses)
- **Premier League**: Integración con Fantasy Premier League
- **Champions League**: Fantasy para competiciones europeas
- **Mercado de fichajes**: Análisis y predicciones de traspasos
- **Análisis histórico**: Tendencias y patrones multi-temporada
- **Comparativas inter-ligas**: Análisis cruzado de rendimientos

---

## Critical Development Instructions

### Core Development Principles
- **Modification over Creation**: Always prefer editing existing files to creating new ones
- **Minimal Scope**: Do exactly what's asked, nothing more, nothing less
- **No Proactive Documentation**: Never create .md or README files unless explicitly requested
- **Follow Existing Patterns**: Study similar functionality before implementing new features

### Fantasy La Liga Specific Rules
- **Season Consistency**: Always use 2025 for API-Sports calls (represents 2025-26 season)
- **Team Validation**: Verify 20 teams total, must include Levante, Elche, Real Oviedo (promoted)
- **Team Exclusions**: Never include Valladolid, Las Palmas, or Leganés (relegated)
- **API Rate Limiting**: Respect 75k requests/day limit with existing cache mechanisms
- **Error Handling**: Follow try/catch + detailed logging pattern seen throughout codebase
- **Spanish Comments**: All code comments should be in Spanish to match existing codebase

### Database Operations
- **Required Setup**: `.env.supabase` must be configured before any database operations
- **Schema Changes**: Always update both supabase-schema.sql and init-database.js for database modifications
- **Testing First**: Always run `npm run db:test:quick` before database operations

### API Integration Patterns
- **Service Layer**: Use centralized client pattern (see apiFootball.js) for external APIs
- **Cache Integration**: Leverage existing BargainCache/PlayersCache patterns
- **Data Processing**: Always process raw API data through dataProcessor.js before storage
- **Testing Endpoints**: Every new feature requires a corresponding `/test` endpoint

### Frontend Development
- **Alpine.js Only**: All frontend reactivity uses Alpine.js, avoid vanilla DOM manipulation
- **CDN Dependencies**: Frontend uses CDN dependencies (Alpine.js, Tailwind) served directly
- **No Build Process**: Frontend is vanilla HTML/CSS/JS with CDN dependencies
- **API Calls**: Frontend makes direct calls to `/api/*` endpoints

### Error Handling Standards
- **Consistent Pattern**: All services use try/catch with detailed console.log statements
- **Graceful Degradation**: Always provide fallback responses when external services fail
- **Rate Limit Awareness**: Implement delays between API calls (see apiFootball.js patterns)
- **User-Friendly Messages**: Error responses should be informative but not expose internal details

### Security Practices
- **Environment Variables**: Never commit API keys or sensitive data to git
- **CORS Configuration**: Properly configured for development and production environments
- **Helmet Middleware**: Security headers are properly configured in server.js
- **Input Validation**: Validate all user inputs and API parameters

### Testing Requirements
- **Before Implementation**: Always test existing functionality with `/api/*/test` endpoints before changes
- **New Features**: Every new route or service must have corresponding test endpoint
- **Database Testing**: Use `npm run db:test:quick` before database operations
- **API Connectivity**: Test API-Sports connection with `curl http://localhost:3000/api/laliga/test` before data operations