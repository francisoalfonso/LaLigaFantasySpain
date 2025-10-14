# YouTube Outliers - Uso Manual

**Estado actual**: Cron automático DESHABILITADO para conservar quota YouTube API.

---

## 📊 Quota YouTube API

- **Límite diario**: 10,000 unidades
- **Costo por búsqueda**: 100 unidades
- **Consumo por detección completa**: ~600 unidades (6 keywords)
- **Máximo diario**: ~16 detecciones completas

**Reseteo**: Medianoche UTC (1am España en verano, 2am en invierno)

---

## 🚀 Flujo Manual Completo

### FASE 1: Detección de Outliers

```bash
# Opción A: Usando curl
curl -X GET "http://localhost:3000/api/outliers/detect?hoursBack=48&maxResultsPerKeyword=50"

# Opción B: Usando el dashboard
# Ir a: http://localhost:3000/intel
# Hacer clic en "Detectar Outliers" (botón morado)
```

**Parámetros**:
- `hoursBack`: Videos publicados en últimas N horas (default: 24)
- `maxResultsPerKeyword`: Resultados por keyword (default: 50)

**Output**:
```json
{
  "success": true,
  "data": {
    "outliers": [...],
    "count": 15,
    "p0": 2,  // Alta prioridad (score > 70)
    "p1": 5,  // Media-alta (score 50-70)
    "p2": 8   // Media (score 30-50)
  }
}
```

**Costo**: 600 unidades (6 keywords × 100)

---

### FASE 2: Análisis de Outlier

**Elige un outlier P0/P1** del resultado anterior.

```bash
# Reemplaza VIDEO_ID con el id del outlier
curl -X POST "http://localhost:3000/api/outliers/analyze/VIDEO_ID"
```

**Proceso**:
1. Descarga audio del video con yt-dlp (2-3 min)
2. Transcribe con Whisper API (~$0.006)
3. Analiza contenido con GPT-4o-mini (~$0.001)
4. Guarda en DB con status 'analyzed'

**Output**:
```json
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "transcriptionLength": 4500,
    "contentAnalysis": {
      "thesis": "Lewandowski está sobrevalorado en Fantasy",
      "key_arguments": ["...", "..."],
      "players_mentioned": ["Lewandowski", "Pedri"],
      "viral_hooks": ["...", "..."],
      "response_angle": "rebatir",
      "emotional_tone": "crítico"
    },
    "totalCost": 0.007
  }
}
```

**Costo**: 0 quota YouTube (usa yt-dlp), $0.007 OpenAI

---

### FASE 3: Generación de Script

**Con outlier analizado**, genera script inteligente:

```bash
curl -X POST "http://localhost:3000/api/outliers/generate-script/VIDEO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "responseAngle": "rebatir",
    "presenter": "ana"
  }'
```

**Parámetros**:
- `responseAngle`: "rebatir" | "complementar" | "ampliar"
- `presenter`: "ana" | "carlos"

**Proceso**:
1. Lee outlier analyzed de DB
2. Enriquece con API-Sports (stats reales jugadores)
3. Genera script con GPT-4o (~$0.002)
4. Formatea para VEO3 3-phase workflow

**Output**:
```json
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "script": {
      "targetPlayer": "Lewandowski",
      "responseAngle": "rebatir",
      "segments": [
        {
          "role": "intro",
          "dialogue": "Misters, hoy rebatimos un viral que dice...",
          "duration": 8,
          "emotion": "curiosidad"
        },
        // ... 2 más
      ]
    },
    "veo3Format": {
      "contentType": "outlier_response",
      "playerData": {...},
      "customScript": [...]
    },
    "metadata": {
      "cost_usd": 0.002,
      "response_angle": "rebatir"
    },
    "nextStep": "POST /api/veo3/prepare-session with veo3Format"
  }
}
```

**Costo**: 0 quota YouTube, $0.002 OpenAI

---

### FASE 4: Generar Video VEO3

**Usa el `veo3Format` del paso anterior**:

```bash
# FASE 4.1: Preparar sesión (guión + imágenes Nano Banana)
curl -X POST "http://localhost:3000/api/veo3/prepare-session" \
  -H "Content-Type: application/json" \
  -d @veo3_script.json

# Output: { sessionId: "session_nanoBanana_123456789" }
```

```bash
# FASE 4.2: Generar 3 segmentos (llamar 3 veces)
curl -X POST "http://localhost:3000/api/veo3/generate-segment" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_nanoBanana_123456789",
    "segmentIndex": 0
  }'

# Repetir para segmentIndex: 1 y 2
```

```bash
# FASE 4.3: Finalizar (concatenar + logo)
curl -X POST "http://localhost:3000/api/veo3/finalize-session" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_nanoBanana_123456789"
  }'

# Output: { videoUrl: "output/veo3/sessions/.../final_video.mp4" }
```

**Costo**: ~$0.96 (Nano Banana $0.06 + VEO3 $0.90)

---

### FASE 5: Publicar a YouTube

```bash
curl -X POST "http://localhost:3000/api/youtube/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "output/veo3/sessions/.../final_video.mp4",
    "title": "Rebatiendo el viral sobre Lewandowski | Fantasy La Liga",
    "description": "...",
    "tags": ["fantasy laliga", "lewandowski", "biwenger"],
    "playlist": "outlier_responses"
  }'
```

**Output**:
```json
{
  "success": true,
  "videoId": "NEW_VIDEO_ID",
  "url": "https://youtube.com/watch?v=NEW_VIDEO_ID"
}
```

---

## 📈 Listar Outliers Existentes

```bash
# Listar todos (últimas 48h)
curl "http://localhost:3000/api/outliers/list?hoursBack=48"

# Filtrar por prioridad
curl "http://localhost:3000/api/outliers/list?priority=P0"

# Filtrar por status
curl "http://localhost:3000/api/outliers/list?status=analyzed"
```

---

## 📊 Ver Estadísticas

```bash
curl "http://localhost:3000/api/outliers/stats"
```

**Output**:
```json
{
  "success": true,
  "data": {
    "total": 42,
    "p0": 5,
    "p1": 12,
    "p2": 25,
    "detected": 30,
    "analyzing": 2,
    "analyzed": 8,
    "responded": 2,
    "avgOutlierScore": 45.3
  }
}
```

---

## 🎯 Workflow Recomendado

### Diario (1 vez/día, por la mañana)

1. **Detectar outliers de últimas 24-48h**:
   ```bash
   curl "http://localhost:3000/api/outliers/detect?hoursBack=48&maxResultsPerKeyword=50"
   ```

2. **Revisar P0/P1 en dashboard**: http://localhost:3000/intel

3. **Analizar top 2-3 outliers**:
   ```bash
   # Para cada outlier P0/P1
   curl -X POST "http://localhost:3000/api/outliers/analyze/VIDEO_ID"
   ```

4. **Generar scripts para los mejores**:
   ```bash
   curl -X POST "http://localhost:3000/api/outliers/generate-script/VIDEO_ID" \
     -d '{"responseAngle": "rebatir", "presenter": "ana"}'
   ```

5. **Producir 1 video diario** (el de mayor ROI esperado)

**Consumo diario**: ~1,200-1,800 unidades YouTube (12-18% de quota)

---

## 🔧 Troubleshooting

### Error 403 - Quota Excedida

```bash
# Verificar quota actual
node scripts/test-youtube-api.js
```

**Solución**: Esperar a medianoche UTC o reducir `maxResultsPerKeyword`.

### Error en Análisis (yt-dlp fails)

**Causa**: Video privado, eliminado o con restricciones geográficas.
**Solución**: Saltar ese outlier y probar con siguiente.

### Script Generation devuelve error

**Causa**: Outlier no tiene `content_analysis` (no fue analizado).
**Solución**: Ejecutar `/api/outliers/analyze/:videoId` primero.

---

## 📝 Scripts de Utilidad

```bash
# Script E2E completo
npm run outliers:test-e2e

# Limpiar outliers antiguos (>7 días)
npm run outliers:clean

# Test YouTube API
node scripts/test-youtube-api.js
```

---

## 💡 Tips de Optimización

1. **Búsquedas estratégicas**: Ejecutar detección en horarios clave:
   - Lunes mañana (post-jornada)
   - Miércoles mañana (mid-week analysis)
   - Viernes mañana (pre-jornada)

2. **Priorizar P0**: Solo analizar outliers con score > 70 (ROI más alto)

3. **Batch processing**: Analizar 3-5 outliers de una vez, luego elegir el mejor para video

4. **Cache inteligente**: El sistema guarda outliers en DB, no necesitas re-detectar diariamente

---

**Última actualización**: 14 Oct 2025
**Autor**: Claude Code
