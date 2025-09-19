# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fantasy La Liga Dashboard** - Dashboard de validación para un influencer virtual automatizado de Instagram que publicará contenido sobre La Liga Fantasy de fútbol. Este proyecto valida la calidad de los datos de SportMonks API antes de invertir en el avatar IA y automatización completa.

## Development Commands

```bash
# Instalar dependencias
npm install

# Iniciar servidor en modo desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Ejecutar tests
npm test
```

## Project Structure

```
fantasy-dashboard/
├── backend/
│   ├── server.js              # Servidor Express principal
│   ├── routes/
│   │   ├── sportmonks.js     # Rutas para endpoints SportMonks
│   │   └── test.js            # Rutas de testing y validación
│   ├── services/
│   │   ├── sportmonks.js     # Cliente para API SportMonks
│   │   └── dataProcessor.js  # Procesador de datos Fantasy
│   └── config/
│       └── constants.js      # IDs y configuraciones de La Liga
├── frontend/
│   ├── index.html            # Dashboard principal
│   ├── style.css             # Estilos personalizados
│   └── app.js                # Lógica Alpine.js
├── n8n-flows/                # Flujos de automatización n8n
├── data-samples/             # Muestras JSON de respuestas API
└── .env                      # Variables de entorno
```

## API Endpoints

### Testing
- `GET /api/test/ping` - Test básico del servidor
- `GET /api/test/config` - Verificar configuración
- `GET /api/test/full-workflow` - Test completo del flujo
- `POST /api/test/fantasy-points` - Test calculadora de puntos

### SportMonks Integration
- `GET /api/sportmonks/test` - Prueba de conexión
- `GET /api/sportmonks/leagues` - Ligas disponibles
- `GET /api/sportmonks/teams` - Equipos de La Liga
- `GET /api/sportmonks/matches/date/:date` - Partidos por fecha (YYYY-MM-DD)
- `GET /api/sportmonks/matches/live` - Partidos en vivo
- `GET /api/sportmonks/player/:id` - Estadísticas de jugador
- `GET /api/sportmonks/fixture/:id` - Detalles completos de partido
- `POST /api/sportmonks/fantasy/calculate` - Calcular puntos Fantasy

## Configuration

### Environment Variables (.env)
```bash
SPORTMONKS_API_KEY=your_api_key_here
NODE_ENV=development
PORT=3000
HOST=localhost
DEBUG=true
```

### Important Constants (backend/config/constants.js)
- **La Liga ID**: 564
- **Temporada 2024/25 ID**: 23476
- **Plan gratuito**: Scottish Premiership (501), Danish Superliga (271)
- **Sistema de puntos Fantasy**: Implementado según reglas oficiales

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

1. **SportMonks API** → Datos en tiempo real de La Liga
2. **dataProcessor.js** → Calcula puntos Fantasy según sistema oficial
3. **Dashboard** → Visualiza datos y insights
4. **data-samples/** → Guarda respuestas para análisis
5. **Futuro**: n8n → HeyGen → Instagram

## Development Notes

- Todo el código comentado en español
- Usar async/await para llamadas asíncronas
- Rate limiting implementado (3s entre llamadas plan gratuito)
- Manejo de errores con try/catch
- Logs detallados para debugging
- Responses guardadas automáticamente en data-samples/

## Testing Strategy

Antes de proceder con avatar IA:
1. Validar calidad y completitud de datos SportMonks
2. Verificar cálculos de puntos Fantasy
3. Evaluar insights automáticos generados
4. Confirmar suficiente contenido para posts diarios

## Future Phases

- **Fase 2**: Procesamiento avanzado de datos e insights
- **Fase 3**: Integración con n8n para automatización
- **Fase 4**: HeyGen avatar + Instagram API para publicación