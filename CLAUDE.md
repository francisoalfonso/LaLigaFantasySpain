# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# Development Debugging Commands
curl http://localhost:3000/api/test/ping                    # Basic server health
curl http://localhost:3000/api/test/config                 # Environment validation
curl http://localhost:3000/api/laliga/test                 # API-Sports connectivity
curl http://localhost:3000/api/bargains/test               # Bargain analyzer test
curl "http://localhost:3000/api/bargains/top?limit=5"      # Quick bargains test
curl http://localhost:3000/api/weather/test                # AEMET API test
curl http://localhost:3000/api/database/test               # Database connectivity
```

## Project Structure

```
Fantasy la liga/
├── backend/
│   ├── server.js                           # Servidor Express principal
│   ├── routes/
│   │   ├── apiFootball.js                 # Rutas para API-Sports/API-Football
│   │   ├── test.js                        # Rutas de testing y validación
│   │   ├── weather.js                     # Rutas para funcionalidad meteorológica
│   │   └── n8nMcp.js                      # Rutas para n8n MCP integration
│   ├── services/
│   │   ├── apiFootball.js                 # Cliente para API-Sports
│   │   ├── dataProcessor.js               # Procesador de datos Fantasy
│   │   ├── bargainAnalyzer.js             # Analizador de chollos Fantasy
│   │   ├── weatherService.js              # Servicio integración AEMET
│   │   ├── n8nMcpServer.js               # Servidor MCP para n8n
│   │   ├── competitiveIntelligenceAgent.js # Agente análisis competencia
│   │   └── teamContentManager.js          # Gestor contenido del equipo
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

## ⚠️ INFORMACIÓN CRÍTICA - TEMPORADA ⚠️

**🚨 OBLIGATORIO CONSULTAR ANTES DE CUALQUIER DESARROLLO O EDICIÓN 🚨**

- **Temporada actual**: 2025-26
- **Identificación API-Sports**: 2025 (NO 2024)
- **Configuración actual**: `CURRENT_SEASON: 2025` en `apiFootball.js`
- **Todas las funcionalidades deben construirse considerando temporada 25-26**
- **Fechas de partidos**: Agosto 2024 - Mayo 2025 para temporada 2025-26

### Important Constants (backend/config/constants.js)
- **La Liga ID**: 140 (API-Sports)
- **TEMPORADA ACTUAL**: 2025-26 (API-Sports usa 2025) ⚠️ **CRÍTICO** ⚠️
- **API-Sports Plan**: Ultra ($29/mes) - 75,000 requests/día
- **Sistema de puntos Fantasy**: Implementado según reglas oficiales
- **Server Config**: PORT=3000, HOST=localhost (configurable via env vars)
- **Weather Integration**: 20 stadiums with GPS coordinates (stadiumsWeatherConfig.js)
- **Database**: Supabase PostgreSQL con schema completo (database/supabase-schema.sql)

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
- **PredictorValor**: AI-driven player value prediction system
- **PlayersManager**: Centralized player data management and synchronization
- **ContentGenerator**: Automated content creation for social media integration

## Testing Strategy

Antes de proceder con avatar IA:
1. Validar calidad y completitud de datos API-Sports
2. Verificar cálculos de puntos Fantasy
3. Evaluar insights automáticos generados por competitiveIntelligenceAgent
4. Confirmar suficiente contenido para posts diarios
5. Test integración con teamContentManager para workflows

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