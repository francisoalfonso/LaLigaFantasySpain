# Sistema de Outliers Optimizado - Documentación Completa

**Última actualización**: 14 Octubre 2025 **Versión**: 1.0.0 **Estado**: ✅
Producción

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Workflow Completo](#workflow-completo)
6. [Servicios Principales](#servicios-principales)
7. [Costos y Presupuesto](#costos-y-presupuesto)
8. [Usage & Testing](#usage--testing)
9. [Troubleshooting](#troubleshooting)
10. [Roadmap & Futuras Mejoras](#roadmap--futuras-mejoras)

---

## 🎯 Resumen Ejecutivo

### ¿Qué es el Sistema de Outliers?

Sistema automatizado de **inteligencia competitiva** que:

1. **Detecta** videos virales de competidores en YouTube
2. **Analiza** su contenido con Whisper + GPT-4o
3. **Enriquece** con datos reales de API-Sports
4. **Genera** scripts VEO3 inteligentes para responder con datos

### Problema que Resuelve

**Antes**: Responder a competidores era manual, lento, y sin datos.

**Ahora**: Respuesta automatizada en 5 minutos con script VEO3 listo, basado en
datos reales.

### Valor Agregado

- ✅ **Velocidad**: 5 minutos de detección → script VEO3 (vs 2+ horas manual)
- ✅ **Datos reales**: API-Sports enriquecimiento automático
- ✅ **Inteligencia**: GPT-4o analiza tesis, argumentos, hooks virales
- ✅ **Costo bajo**: $0.009 por outlier procesado
- ✅ **Escalable**: Procesar 100+ outliers/mes sin fricción

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE OUTLIERS OPTIMIZADO                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   YouTube    │ ────▶ 1. Detección (YouTube Data API v3)
│   Videos     │       Keywords: "fantasy laliga", "chollo", etc.
└──────────────┘       Outlier Score: (views / (subscribers^0.5)) > 3.0

        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  YOUTUBE_OUTLIERS TABLE (Supabase PostgreSQL)                       │
│  Status: detected → analyzing → analyzed → scripted → producing     │
└──────────────────────────────────────────────────────────────────────┘

        │
        ▼
2. Análisis de Contenido
   ├─ Download audio (yt-dlp, audio-only, 10x faster)
   ├─ Transcribe (Whisper API, $0.006)
   └─ Analyze (GPT-4o-mini, $0.001)
      - Tesis principal
      - Argumentos clave
      - Jugadores mencionados
      - Hooks virales
      - Tono emocional

        │
        ▼
3. Enriquecimiento (API-Sports)
   ├─ Search jugadores mencionados
   ├─ Season stats (goals, assists, rating)
   ├─ Recent form (últimos 5 partidos)
   └─ Injury status

        │
        ▼
4. Generación de Script Inteligente
   ├─ intelligentScriptGenerator.js (GPT-4o, $0.002)
   ├─ 3 ángulos: rebatir / complementar / ampliar
   ├─ 3 segmentos × 24-25 palabras (8s audio c/u)
   ├─ Auto-evita nombres de jugadores (VEO3 Error 422)
   └─ Formato VEO3 listo para prepare-session

        │
        ▼
5. VEO3 3-Phase Generation (existing)
   ├─ POST /api/veo3/prepare-session
   ├─ POST /api/veo3/generate-segment (×3)
   └─ POST /api/veo3/finalize-session
```

### Stack Tecnológico

| Componente            | Tecnología          | Propósito                                     |
| --------------------- | ------------------- | --------------------------------------------- |
| **API Detection**     | YouTube Data API v3 | Buscar videos recientes por keywords          |
| **Transcription**     | OpenAI Whisper API  | Transcribir audio a texto ($0.006/min)        |
| **Content Analysis**  | GPT-4o-mini         | Extraer tesis, argumentos, jugadores ($0.001) |
| **Data Enrichment**   | API-Sports          | Stats reales de jugadores mencionados         |
| **Script Generation** | GPT-4o-mini         | Scripts VEO3 inteligentes ($0.002)            |
| **Database**          | Supabase PostgreSQL | Persistencia + analytics                      |
| **Video Download**    | yt-dlp              | Audio-only extraction (10x faster)            |

---

## 🗄️ Database Schema

### Tabla: `youtube_outliers`

```sql
CREATE TABLE youtube_outliers (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  channel_name VARCHAR(255),
  channel_id VARCHAR(50),
  published_at TIMESTAMP,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  subscribers INTEGER DEFAULT 0,
  outlier_score FLOAT,
  priority VARCHAR(10), -- 'P0' | 'P1' | 'P2'

  -- FASE 2: Content Analysis
  transcription TEXT,
  content_analysis JSONB, -- { thesis, key_arguments, players_mentioned, viral_hooks, emotional_tone }
  mentioned_players JSONB, -- ["Pedri", "Lewandowski"]

  -- FASE 3: Enrichment
  enriched_data JSONB, -- API-Sports stats for mentioned players

  -- FASE 4: Script Generation
  generated_script JSONB, -- { segments, targetPlayer, responseAngle, dataUsed }

  -- FASE 5: VEO3 Production
  response_video_id VARCHAR(50), -- ID del video publicado
  published_at_response TIMESTAMP,
  platform VARCHAR(20), -- 'youtube' | 'instagram'

  -- Status tracking
  processing_status VARCHAR(20) DEFAULT 'detected',
  -- Estados: detected → analyzing → analyzed → enriched → scripted → producing → published → failed

  detected_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX idx_outliers_video_id ON youtube_outliers(video_id);
CREATE INDEX idx_outliers_status ON youtube_outliers(processing_status);
CREATE INDEX idx_outliers_priority ON youtube_outliers(priority);
CREATE INDEX idx_outliers_score ON youtube_outliers(outlier_score DESC);
CREATE INDEX idx_outliers_response_video ON youtube_outliers(response_video_id);
CREATE INDEX idx_outliers_platform ON youtube_outliers(platform);
```

### Tabla: `youtube_outliers_responses` (Tracking)

```sql
CREATE TABLE youtube_outliers_responses (
  id SERIAL PRIMARY KEY,
  outlier_id INTEGER REFERENCES youtube_outliers(id) ON DELETE CASCADE,
  response_video_id VARCHAR(50) UNIQUE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  presenter VARCHAR(20) NOT NULL CHECK (presenter IN ('carlos', 'ana')),
  script_used JSONB,
  production_cost FLOAT DEFAULT 0.97, -- VEO3 cost
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Métricas 24h
  views_24h INTEGER DEFAULT 0,
  likes_24h INTEGER DEFAULT 0,
  comments_24h INTEGER DEFAULT 0,
  engagement_rate_24h FLOAT DEFAULT 0,

  -- Métricas 48h
  views_48h INTEGER DEFAULT 0,
  engagement_rate_48h FLOAT DEFAULT 0,

  -- Métricas 7 días
  views_7d INTEGER DEFAULT 0,
  engagement_rate_7d FLOAT DEFAULT 0,

  -- ROI
  roi_24h FLOAT, -- (views_24h / production_cost) / 1000
  roi_48h FLOAT,
  roi_7d FLOAT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Vista: `outliers_performance_analysis`

```sql
CREATE VIEW outliers_performance_analysis AS
SELECT
    o.id AS outlier_id,
    o.video_id AS outlier_video_id,
    o.title AS outlier_title,
    o.channel_name AS outlier_channel,
    o.views AS outlier_views,
    o.outlier_score,
    o.priority,

    r.response_video_id,
    r.platform,
    r.presenter,
    r.published_at,

    -- Tiempo de respuesta
    EXTRACT(EPOCH FROM (r.published_at - o.detected_at)) / 3600 AS response_time_hours,

    -- ROI
    r.roi_24h,
    r.roi_7d,

    -- Ratio viral respuesta vs original
    CASE
        WHEN o.views > 0 THEN (r.views_7d::FLOAT / o.views::FLOAT) * 100
        ELSE 0
    END AS capture_rate_percentage

FROM youtube_outliers o
LEFT JOIN youtube_outliers_responses r ON o.id = r.outlier_id
WHERE o.processing_status = 'published';
```

---

## 🔌 API Endpoints

### GET `/api/outliers/detect`

Detectar outliers virales en YouTube.

**Query Params**:

- `hoursBack` (default: 24) - Ventana de tiempo en horas
- `maxResultsPerKeyword` (default: 50) - Límite por keyword

**Response**:

```json
{
    "success": true,
    "data": {
        "outliers": [
            {
                "video_id": "dQw4w9WgXcQ",
                "title": "PEDRI a 4.5M es el CHOLLO del año",
                "channel_name": "Fantasy Kings",
                "views": 50000,
                "outlier_score": 95.3,
                "priority": "P0"
            }
        ],
        "count": 10,
        "p0": 3,
        "p1": 5,
        "p2": 2
    }
}
```

---

### GET `/api/outliers/list`

Listar outliers desde base de datos.

**Query Params**:

- `priority` - Filtrar por prioridad (P0, P1, P2)
- `hoursBack` (default: 48)
- `status` - Filtrar por processing_status

**Response**:

```json
{
  "success": true,
  "data": {
    "outliers": [...],
    "count": 15
  }
}
```

---

### GET `/api/outliers/stats`

Estadísticas del sistema.

**Response**:

```json
{
    "success": true,
    "data": {
        "total": 127,
        "p0Count": 23,
        "p1Count": 54,
        "p2Count": 50,
        "analyzedCount": 45,
        "scriptedCount": 12,
        "publishedCount": 5
    }
}
```

---

### POST `/api/outliers/analyze/:videoId`

Analizar outlier con Whisper + GPT-4o-mini.

**Flujo**:

1. Download audio (yt-dlp, audio-only)
2. Transcribe con Whisper API ($0.006)
3. Analyze con GPT-4o-mini ($0.001)
4. Guardar en DB
5. Update status: `analyzing` → `analyzed`

**Response**:

```json
{
    "success": true,
    "message": "Outlier analyzed successfully",
    "data": {
        "videoId": "dQw4w9WgXcQ",
        "transcriptionLength": 2847,
        "contentAnalysis": {
            "thesis": "Pedri es el mejor chollo de la jornada",
            "key_arguments": [
                "Precio bajo de 4.5M",
                "Forma reciente excelente",
                "Rival fácil (Cádiz)"
            ],
            "players_mentioned": ["Pedri"],
            "viral_hooks": ["CHOLLO del año", "REGALADO"],
            "response_angle": "rebatir",
            "emotional_tone": "entusiasta"
        },
        "totalCost": 0.007,
        "status": "analyzed"
    }
}
```

---

### POST `/api/outliers/generate-script/:videoId`

Generar script VEO3 inteligente.

**Body**:

```json
{
    "responseAngle": "rebatir", // 'rebatir' | 'complementar' | 'ampliar'
    "presenter": "ana" // 'ana' | 'carlos'
}
```

**Flujo**:

1. Obtener outlier (debe estar `analyzed`)
2. Enriquecer con API-Sports si no está hecho
3. Generar script con GPT-4o ($0.002)
4. Guardar en DB
5. Update status: `analyzed` → `scripted`

**Response**:

```json
{
  "success": true,
  "message": "Script generated successfully",
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "script": {
      "targetPlayer": "Pedri",
      "responseAngle": "rebatir",
      "segments": [
        {
          "role": "intro",
          "duration": 8,
          "dialogue": "Misters, acabo de ver el video de Fantasy Kings sobre el centrocampista del Barcelona... y hay datos que NO os están contando.",
          "emotion": "mysterious",
          "narrativeFunction": "Hook + intriga"
        },
        {
          "role": "middle",
          "duration": 8,
          "dialogue": "Los números reales son: dos goles, tres asistencias, rating seis punto ocho... muy diferente a lo que están vendiendo por ahí.",
          "emotion": "confident",
          "narrativeFunction": "Prueba con datos"
        },
        {
          "role": "outro",
          "duration": 8,
          "dialogue": "Ahora vosotros decidís: confiar en hype... o en datos reales. Yo ya os lo he dicho.",
          "emotion": "urgent",
          "narrativeFunction": "FOMO + CTA"
        }
      ],
      "dataUsed": [
        "goals: 2",
        "assists: 3",
        "rating: 6.8"
      ],
      "competitorClaimChallenged": "Claim de que Pedri es el mejor chollo, cuando hay mejores opciones con más puntos por euro"
    },
    "veo3Format": {
      "contentType": "outlier_response",
      "presenter": "ana",
      "segments": [...],
      "metadata": {
        "source": "intelligent_script_generator",
        "outlier_video_id": "dQw4w9WgXcQ",
        "response_angle": "rebatir"
      }
    },
    "metadata": {
      "outlier_video_id": "dQw4w9WgXcQ",
      "competitor_channel": "Fantasy Kings",
      "response_angle": "rebatir",
      "presenter": "ana",
      "generated_at": "2025-10-14T10:30:00Z",
      "processing_time_ms": 2847,
      "cost_usd": 0.002
    },
    "totalCost": 0.002,
    "status": "scripted",
    "nextStep": "POST /api/veo3/prepare-session with veo3Format"
  }
}
```

---

### PUT `/api/outliers/:videoId/status`

Actualizar status de un outlier manualmente.

**Body**:

```json
{
    "status": "analyzed" // 'detected' | 'analyzing' | 'analyzed' | 'responded'
}
```

---

## 📊 Workflow Completo

### 1. Detección Automática (Cron)

```javascript
// Ejecutar cada hora
GET /api/outliers/detect?hoursBack=2

// Sistema detecta videos con:
// - Outlier Score > 3.0
// - Views significativas
// - Keywords relevantes

// Priorización:
// - P0: Score > 5.0 (URGENTE)
// - P1: Score 3.5-5.0 (ALTA)
// - P2: Score 3.0-3.5 (MEDIA)
```

### 2. Análisis Manual (Bajo Demanda)

```bash
# Analizar outlier específico
curl -X POST http://localhost:3000/api/outliers/analyze/VIDEO_ID

# Duración: ~90-120 segundos
# Cost: $0.007 (Whisper + GPT)
```

### 3. Generación de Script

```bash
# Generar script VEO3 (rebatir con datos)
curl -X POST http://localhost:3000/api/outliers/generate-script/VIDEO_ID \
  -H "Content-Type: application/json" \
  -d '{
    "responseAngle": "rebatir",
    "presenter": "ana"
  }'

# Duración: ~5-10 segundos
# Cost: $0.002 (GPT-4o-mini)
```

### 4. Producción VEO3 (3-Phase System)

```bash
# 4.1 Preparar sesión
curl -X POST http://localhost:3000/api/veo3/prepare-session \
  -H "Content-Type: application/json" \
  -d @veo3Format.json

# 4.2 Generar 3 segmentos
curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -d '{"sessionId": "...", "segmentIndex": 0}'

curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -d '{"sessionId": "...", "segmentIndex": 1}'

curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -d '{"sessionId": "...", "segmentIndex": 2}'

# 4.3 Finalizar (concatenar)
curl -X POST http://localhost:3000/api/veo3/finalize-session \
  -d '{"sessionId": "..."}'

# Duración total: ~12-15 minutos
# Cost: ~$0.96 (VEO3 + Nano Banana)
```

### 5. Publicación (YouTube / Instagram)

```bash
# Publicar en YouTube
curl -X POST http://localhost:3000/api/youtube/publish \
  -d '{
    "videoPath": "...",
    "metadata": {...}
  }'

# O publicar en Instagram
curl -X POST http://localhost:3000/api/instagram/publish \
  -d '{
    "videoPath": "...",
    "caption": "..."
  }'
```

---

## 🛠️ Servicios Principales

### 1. `youtubeOutlierDetector.js`

**Responsabilidad**: Detectar videos virales usando YouTube Data API.

**Métodos**:

- `detectOutliers(options)` - Buscar outliers por keywords
- `getOutliers(filters)` - Listar desde DB
- `getOutlierStats()` - Estadísticas del sistema
- `updateOutlierStatus(videoId, status)` - Cambiar status

**Algoritmo de Score**:

```javascript
outlierScore = (views / Math.sqrt(subscribers || 1000)) * 100;

// Ejemplo:
// Video: 50,000 views
// Canal: 10,000 subs
// Score = (50000 / √10000) * 100 = 50000 / 100 * 100 = 50.0

// Priorización:
// P0: score > 5.0 → URGENTE
// P1: score 3.5-5.0 → ALTA
// P2: score 3.0-3.5 → MEDIA
```

---

### 2. `transcriptionService.js`

**Responsabilidad**: Transcribir audio con Whisper API.

**Métodos**:

- `transcribeAudio(audioPath)` - Transcribir archivo local

**Cost**: $0.006 per minute (Whisper API pricing)

---

### 3. `contentAnalyzer.js`

**Responsabilidad**: Analizar contenido transcrito con GPT-4o-mini.

**Métodos**:

- `analyze(transcription, metadata)` - Extraer tesis, argumentos, jugadores
- `analyzeContent(prompt)` - Wrapper genérico para GPT

**Estructura de Análisis**:

```javascript
{
  "thesis": "Tesis principal del video en 1 frase",
  "key_arguments": ["Argumento 1", "Argumento 2"],
  "players_mentioned": ["Pedri", "Lewandowski"],
  "viral_hooks": ["CHOLLO del año", "REGALADO"],
  "response_angle": "rebatir", // 'rebatir' | 'complementar' | 'ampliar'
  "suggested_data_points": ["Goles últimos 5 partidos", "Rating promedio"],
  "emotional_tone": "entusiasta", // 'neutral' | 'entusiasta' | 'crítico' | 'alarmista'
  "target_audience": "Managers de Fantasy que buscan chollos"
}
```

**Cost**: $0.001 per analysis (GPT-4o-mini cached)

---

### 4. `apiFootball.js` → `getPlayerStatsForOutlier()`

**Responsabilidad**: Enriquecer outlier con stats reales de API-Sports.

**Input**: `["Pedri", "Lewandowski"]`

**Output**:

```javascript
{
  "success": true,
  "players": [
    {
      "name": "Pedri",
      "found": true,
      "player": {
        "id": 12345,
        "name": "Pedro González López",
        "age": 21,
        "injured": false
      },
      "season_stats": {
        "games": 8,
        "goals": 2,
        "assists": 3,
        "rating": "7.2"
      },
      "recent_form": {
        "matches": 5,
        "goals": 1,
        "avg_rating": "7.4"
      },
      "injuries": []
    }
  ],
  "totalFound": 1
}
```

---

### 5. `intelligentScriptGenerator.js` ⭐ CORE

**Responsabilidad**: Generar scripts VEO3 inteligentes con GPT-4o.

**Métodos**:

- `generateResponseScript(outlierData, options)` - Script principal
- `generateAllAngles(outlierData)` - 3 scripts (rebatir, complementar, ampliar)
- `formatForVEO3(script)` - Formato listo para VEO3
- `calculateCost(count)` - Calcular costo de N scripts

**Features Clave**:

1. **Validación estricta** de word count (24-25 palabras por segmento)
2. **Detección de player names** (VEO3 Error 422)
3. **3 ángulos de respuesta**:
    - `rebatir` - Contradicir con datos
    - `complementar` - Añadir info que faltó
    - `ampliar` - Profundizar con contexto
4. **Prompts optimizados** por presentador (Ana vs Carlos)
5. **JSON forzado** en respuestas GPT

**Constraints**:

```javascript
{
  segments: 3,
  duration: 8, // segundos por segmento
  wordsPerSegment: { min: 24, max: 25 },
  speechRate: 3.43 // palabras/segundo (medido en test E2E)
}
```

**Cost**: $0.002 per script (GPT-4o-mini cached)

---

## 💰 Costos y Presupuesto

### Cost Breakdown por Outlier Procesado

| Fase                  | Servicio         | Cost           | Duración  |
| --------------------- | ---------------- | -------------- | --------- |
| **Detección**         | YouTube Data API | $0 (free tier) | <1s       |
| **Transcripción**     | Whisper API      | $0.006         | 60-90s    |
| **Análisis**          | GPT-4o-mini      | $0.001         | 3-5s      |
| **Enriquecimiento**   | API-Sports       | $0 (included)  | 2-3s      |
| **Script Generation** | GPT-4o-mini      | $0.002         | 5-10s     |
| **TOTAL**             | -                | **$0.009**     | **~120s** |

### Cost Breakdown por Video Publicado

| Fase                         | Cost       |
| ---------------------------- | ---------- |
| Outlier Analysis             | $0.009     |
| VEO3 Generation (3 segments) | $0.90      |
| Nano Banana (3 images)       | $0.06      |
| **TOTAL**                    | **$0.969** |

### Proyección Mensual

**Escenario Conservador**:

- 100 outliers detectados/mes
- 20 analizados (P0 + P1 top)
- 5 videos publicados

```
Costos:
- 100 detecciones: $0 (free tier)
- 20 análisis: 20 × $0.009 = $0.18
- 5 videos publicados: 5 × $0.969 = $4.85

TOTAL MENSUAL: ~$5.00
```

**Escenario Agresivo**:

- 300 outliers detectados/mes
- 50 analizados
- 15 videos publicados

```
Costos:
- 50 análisis: 50 × $0.009 = $0.45
- 15 videos publicados: 15 × $0.969 = $14.54

TOTAL MENSUAL: ~$15.00
```

---

## 🚀 Usage & Testing

### Instalación

```bash
# 1. Aplicar schema (primera vez)
npm run outliers:migrate

# 2. Verificar que el schema se aplicó correctamente
npm run db:verify-competitive
```

### Uso Manual

```bash
# 1. Detectar outliers
npm run outliers:detect

# 2. Listar outliers detectados
npm run outliers:list

# 3. Analizar outlier específico (reemplazar VIDEO_ID)
curl -X POST http://localhost:3000/api/outliers/analyze/VIDEO_ID

# 4. Generar script
curl -X POST http://localhost:3000/api/outliers/generate-script/VIDEO_ID \
  -H "Content-Type: application/json" \
  -d '{
    "responseAngle": "rebatir",
    "presenter": "ana"
  }'

# 5. Ver estadísticas
npm run outliers:stats
```

### Test E2E Completo

```bash
# Ejecutar test E2E (requiere servidor corriendo)
npm run dev  # Terminal 1
npm run outliers:test-e2e  # Terminal 2
```

**Output esperado**:

```
🚀 TEST E2E: Sistema de Outliers Optimizado

🔍 FASE 1: Detectando outliers virales...
✅ Outliers detectados: 12
   - Top outlier: "PEDRI a 4.5M es el CHOLLO del año"
   - Canal: Fantasy Kings
   - Views: 50,000
   - Score: 95.3

🎙️ FASE 2: Analizando outlier con Whisper + GPT...
✅ Análisis completado
   - Transcripción: 2847 caracteres
   - Jugadores mencionados: 1
   - Tesis: Pedri es el mejor chollo...
   - Cost: $0.007

📝 FASE 3: Generando script inteligente con GPT-4o...
✅ Script generado exitosamente
   - Target player: Pedri
   - Segments: 3
   - Response angle: rebatir

📄 Script VEO3 Generado:

Segmento 1 (intro - mysterious)
   "Misters, acabo de ver el video de Fantasy Kings sobre el centrocampista del Barcelona... y hay datos que NO os están contando."
   [25 palabras, ~8s]

Segmento 2 (middle - confident)
   "Los números reales son: dos goles, tres asistencias, rating seis punto ocho... muy diferente a lo que están vendiendo por ahí."
   [24 palabras, ~8s]

Segmento 3 (outro - urgent)
   "Ahora vosotros decidís: confiar en hype... o en datos reales. Yo ya os lo he dicho."
   [25 palabras, ~8s]

🎉 TEST E2E COMPLETADO EXITOSAMENTE

⏱️  Duración total: 127.3s
💰 Costo total del flujo: $0.009 (por outlier procesado)
```

---

## 🐛 Troubleshooting

### Error: "Outlier not found"

**Causa**: El outlier no existe en la base de datos.

**Solución**:

```bash
# 1. Verificar que existe
npm run outliers:list

# 2. Si no existe, detectar primero
npm run outliers:detect
```

---

### Error: "Outlier must be analyzed first"

**Causa**: Intentaste generar script sin analizar primero.

**Solución**:

```bash
# 1. Analizar el outlier
curl -X POST http://localhost:3000/api/outliers/analyze/VIDEO_ID

# 2. Luego generar script
curl -X POST http://localhost:3000/api/outliers/generate-script/VIDEO_ID \
  -d '{"responseAngle": "rebatir", "presenter": "ana"}'
```

---

### Error: "OPENAI_API_KEY no configurada"

**Causa**: Falta la API key de OpenAI en `.env`.

**Solución**:

```bash
# Añadir a .env
OPENAI_API_KEY=sk-...
```

---

### Error: "Script validation failed: Word count out of range"

**Causa**: GPT-4o generó segmentos con <24 o >25 palabras.

**Solución**:

- Automático: El sistema reintenta con prompt ajustado
- Manual: Editar el script generado antes de pasar a VEO3

---

### Error: "Contains player name" (VEO3 Error 422)

**Causa**: El script tiene nombres de jugadores explícitos.

**Solución**:

- Automático: `intelligentScriptGenerator` usa referencias genéricas
- Manual: Verificar que no hay nombres en dialogues

---

### Audio download timeout

**Causa**: yt-dlp tardó más de 2 minutos.

**Solución**:

```bash
# Aumentar timeout en outliers.js:218
timeout: 180000  // 3 min
```

---

## 🗺️ Roadmap & Futuras Mejoras

### Q4 2025

- [ ] **Detección automática con cron** (cada hora)
- [ ] **Dashboard de outliers** (frontend React)
- [ ] **Auto-publicación** de videos de respuesta
- [ ] **A/B Testing** de ángulos (rebatir vs complementar)
- [ ] **Tracking de ROI** por outlier respondido

### Q1 2026

- [ ] **Multi-idioma** (inglés, portugués)
- [ ] **Detección en TikTok** (además de YouTube)
- [ ] **Webhooks** para notificaciones Slack
- [ ] **Analytics dashboard** con Metabase
- [ ] **Machine Learning** para predecir viral potential

### Q2 2026

- [ ] **Auto-generación de thumbnails** con DALL-E 3
- [ ] **Voice cloning** para Ana/Carlos (ElevenLabs)
- [ ] **Integraciones** con n8n para workflows complejos

---

## 📚 Referencias

- [VEO3_GUIA_COMPLETA.md](./VEO3_GUIA_COMPLETA.md) - Sistema VEO3 3-Phase
- [INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md](./INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md) -
  Estrategia 70/20/10
- [NORMAS_DESARROLLO_IMPRESCINDIBLES.md](./NORMAS_DESARROLLO_IMPRESCINDIBLES.md) -
  Reglas de desarrollo

---

**Última actualización**: 14 Octubre 2025 **Mantenido por**: Claude Code + @fran
**Versión**: 1.0.0
