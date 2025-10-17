# Endpoints API - Fantasy La Liga Pro

## 🎯 Endpoints Principales

### Test & Health

```bash
GET  /api/test/ping           # Health check servidor
GET  /api/test/database       # Test conexión BD
GET  /api/test/veo3           # Test sistema VEO3
GET  /api/test/apis           # Test APIs externas
```

### Instagram Viral

```bash
POST /api/instagram/preview-viral     # Generar preview viral
POST /api/instagram/generate-viral-real # Generar video real
GET  /api/instagram/versions          # Obtener versiones
PUT  /api/instagram/versions/:id       # Actualizar versión
```

### VEO3 Sistema (3-Phase Architecture) ⭐ RECOMENDADO

```bash
# Phase 1: Preparation (2-3 min)
POST /api/veo3/prepare-session       # Generar script + imágenes Nano Banana

# Phase 2: Individual Generation (3-4 min × 3)
POST /api/veo3/generate-segment      # Generar 1 segmento (call 3x)

# Phase 3: Finalization (1 min)
POST /api/veo3/finalize-session      # Concatenar + añadir logo

# Legacy (Single-Phase - puede timeout)
POST /api/veo3/generate-ana          # Generar video Ana (monolítico)
POST /api/veo3/generate-with-nano-banana  # Generar con Nano Banana (monolítico)

# Monitoring
GET  /api/veo3/status/:taskId        # Estado generación
GET  /api/veo3/sessions              # Listar sesiones
GET  /api/veo3/sessions/:id          # Detalles sesión
GET  /api/veo3/sessions/:id/progress # Progress.json de sesión
```

### API-Sports (Datos La Liga)

```bash
GET  /api/sports/players             # Jugadores temporada 2025
GET  /api/sports/teams               # Equipos La Liga
GET  /api/sports/fixtures            # Partidos temporada
GET  /api/sports/player/:id          # Jugador específico
GET  /api/sports/player/:id/stats    # Estadísticas jugador
```

### Competitive Intelligence (NEW - Oct 2025)

```bash
# Channel Management
POST /api/competitive/onboard         # Onboard new competitor channel
GET  /api/competitive/channels        # List all tracked channels
GET  /api/competitive/channels/:id    # Channel details
DELETE /api/competitive/channels/:id  # Remove channel

# Content Analysis
POST /api/content-analysis/analyze   # Analyze specific video
GET  /api/content-analysis/videos    # List analyzed videos
GET  /api/content-analysis/recommendations  # Get content recommendations

# Outlier Detection
POST /api/outliers/detect            # Manually trigger outlier detection
GET  /api/outliers/recent            # Get recent outliers
GET  /api/outliers/list              # List all outliers
GET  /api/outliers/stats             # Outlier statistics
POST /api/outliers/generate-script   # Generate VEO3 script from outlier
```

### Fantasy Evolution

```bash
GET  /api/evolution/test             # Test sistema evolución
GET  /api/evolution/player/:id        # Evolución jugador
POST /api/evolution/calculate         # Calcular evolución
```

### Bargains (Chollos)

```bash
GET  /api/bargains/test              # Test bargain analyzer
GET  /api/bargains/top               # Top chollos disponibles
GET  /api/bargains/position/:pos     # Chollos por posición
POST /api/bargains/analyze           # Analizar jugador específico
```

### Test History

```bash
GET  /api/test-history               # Historial tests
POST /api/test-history               # Crear nuevo test
PUT  /api/test-history/:id           # Actualizar test
GET  /api/test-history/:id           # Detalles test
```

## 🔧 Endpoints de Desarrollo

### Debugging

```bash
GET  /api/debug/logs                 # Logs recientes
GET  /api/debug/metrics              # Métricas sistema
GET  /api/debug/veo3-status         # Estado VEO3
```

### Configuration

```bash
GET  /api/config/constants          # Constantes sistema
GET  /api/config/rate-limits        # Rate limits config
GET  /api/config/veo3               # Config VEO3
```

## 📊 Rate Limiting

### Endpoints con Rate Limiting

- **Heavy Operations**: `/api/evolution/*`, `/api/veo3/*`
- **API-Sports**: `/api/sports/*`
- **Instagram**: `/api/instagram/*`

### Configuración

```javascript
// Heavy operations: 1 request/10 segundos
heavyOperationsLimiter: 10000ms

// API-Sports: 1 request/1 segundo
apiSportsLimiter: 1000ms

// VEO3: 1 request/6 segundos
veo3Limiter: 6000ms
```

## 🔍 Parámetros Comunes

### Temporada La Liga

```javascript
// SIEMPRE usar season=2025 para temporada 2025-26
{
  "season": 2025,
  "league": 140  // La Liga ID
}
```

### VEO3 Parameters

```javascript
{
  "type": "chollo",           // Tipo contenido
  "playerData": {             // Datos jugador
    "name": "Pedri",
    "price": 8.5,
    "points": 32
  },
  "segments": 3               // Número segmentos
}
```

### Instagram Preview

```javascript
{
  "playerData": {
    "name": "Pedri",
    "team": "Barcelona",
    "price": 8.5,
    "points": 32,
    "goals": 3,
    "assists": 2
  },
  "contentType": "chollo"     // Tipo contenido
}
```

## ⚠️ Error Responses

### Formato Estándar

```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error"
  }
}
```

### Códigos de Error Comunes

- `VALIDATION_ERROR`: Parámetros inválidos
- `RATE_LIMIT_EXCEEDED`: Rate limit excedido
- `API_ERROR`: Error API externa
- `VEO3_FAILED`: Generación VEO3 falló
- `DATABASE_ERROR`: Error base de datos

## 🔐 Autenticación

### Headers Requeridos

```javascript
// API-Sports
"x-apisports-key": "your_api_key"

// VEO3
"Authorization": "Bearer your_kie_ai_key"

// Supabase
"Authorization": "Bearer your_supabase_key"
```

## 📝 Ejemplos de Uso

### Generar Preview Instagram

```bash
curl -X POST http://localhost:3000/api/instagram/preview-viral \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {
      "name": "Pedri",
      "team": "Barcelona",
      "price": 8.5,
      "points": 32
    },
    "contentType": "chollo"
  }'
```

### Generar Video VEO3

```bash
curl -X POST http://localhost:3000/api/veo3/generate-ana \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chollo",
    "playerData": {
      "name": "Pedri",
      "price": 8.5,
      "points": 32
    }
  }'
```

### Obtener Jugador API-Sports

```bash
curl "http://localhost:3000/api/sports/player/521?season=2025"
```

### VEO3 3-Phase Workflow (RECOMMENDED)

```bash
# Phase 1: Prepare Session
curl -X POST http://localhost:3000/api/veo3/prepare-session \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {
      "name": "Pedri",
      "team": "Barcelona",
      "price": 8.5,
      "points": 32
    },
    "contentType": "chollo_viral",
    "preset": "chollo_viral"
  }'

# Response: { "sessionId": "session_nanoBanana_1760173416197", ... }

# Phase 2: Generate Segments (call 3 times: segment 0, 1, 2)
curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_nanoBanana_1760173416197",
    "segmentIndex": 0
  }'

# Phase 3: Finalize Session
curl -X POST http://localhost:3000/api/veo3/finalize-session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_nanoBanana_1760173416197"
  }'
```

### Outlier Detection Flow

```bash
# 1. Trigger outlier detection
curl -X POST "http://localhost:3000/api/outliers/detect?hoursBack=24"

# 2. Get recent outliers
curl "http://localhost:3000/api/outliers/recent?limit=10"

# 3. Generate script from outlier
curl -X POST http://localhost:3000/api/outliers/generate-script \
  -H "Content-Type: application/json" \
  -d '{
    "outlierId": "outlier_id_here"
  }'
```

---

**Última actualización**: 2025-10-16 **Total endpoints**: 35+ **Rate limited**:
12 endpoints **3-Phase VEO3**: ✅ Recommended for all video generation
