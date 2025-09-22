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

# Test API connectivity
curl http://localhost:3000/health
curl http://localhost:3000/api/info
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
│   │   ├── weatherService.js              # Servicio integración OpenWeatherMap
│   │   ├── n8nMcpServer.js               # Servidor MCP para n8n
│   │   ├── competitiveIntelligenceAgent.js # Agente análisis competencia
│   │   └── teamContentManager.js          # Gestor contenido del equipo
│   └── config/
│       ├── constants.js                   # IDs y configuraciones de La Liga
│       ├── stadiumsWeatherConfig.js       # Configuración estadios + coordenadas GPS
│       └── reporterTeam.js                # Configuración equipo reporteros
├── frontend/
│   ├── index.html                         # Dashboard principal
│   ├── style.css                          # Estilos personalizados
│   └── app.js                             # Lógica Alpine.js
├── .env                                   # Variables de entorno
└── .env.example                           # Template configuración entorno
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

### Weather Integration (Phase 2)
- `GET /api/weather/test` - Test conexión OpenWeatherMap
- `GET /api/weather/stadiums` - Lista estadios La Liga con coordenadas
- `GET /api/weather/stadium/:teamId` - Clima actual estadio específico
- `GET /api/weather/match/:matchId` - Clima para partido específico
- `POST /api/weather/avatar-config` - Configuración avatar según clima

## Configuration

### Environment Variables (.env)
```bash
# API-Sports (La Liga Real Data)
API_FOOTBALL_KEY=your_api_sports_key_here

# OpenWeatherMap API (Weather functionality)
OPENWEATHER_API_KEY=your_openweathermap_key_here

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
4. **Dashboard** → Visualiza datos y insights
5. **Futuro**: teamContentManager.js → HeyGen → Instagram

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

- **Fase 2**: Procesamiento avanzado de datos e insights (competitiveIntelligenceAgent)
- **Fase 3**: Integración completa teamContentManager + HeyGen + n8n MCP
- **Fase 4**: Automatización Instagram API con workflows n8n
- **Fase 5**: Expansión a otras ligas y competiciones