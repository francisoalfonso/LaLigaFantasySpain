# Sistema de Automatización Centralizado

## Calendario/Cola de Generación de Videos

**Fecha**: 12 Octubre 2025 **Status**: ✅ Diseñado, ⏳ Pending aplicar schemas

---

## 🎯 Objetivo

Crear un **sistema centralizado de cola/calendario** que coordine TODAS las
automatizaciones de video para:

- Evitar saturar VEO3 API (max 2 videos simultáneos)
- Respetar rate limits de OpenAI, Instagram, etc.
- Priorizar contenido por urgencia y viralidad
- Prevenir conflictos y sobrecarga del sistema

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                    FUENTES DE CONTENIDO                       │
├──────────────────────────────────────────────────────────────┤
│  • RecommendationEngine (videos competidores)                 │
│  • BargainAnalyzer (chollos diarios)                          │
│  • Breaking News (urgencias)                                  │
│  • Manual (usuario crea contenido)                            │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Enqueue job
                 ▼
┌──────────────────────────────────────────────────────────────┐
│              AUTOMATION_QUEUE (Tabla Supabase)                │
├──────────────────────────────────────────────────────────────┤
│  📋 Cola centralizada de todos los trabajos                   │
│  🎯 Priorizada: P0 (crítico), P1, P2, P3                      │
│  ⏰ Deadlines y scheduling                                    │
│  📊 Tracking de costos y duración                             │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Poll cada 10s
                 ▼
┌──────────────────────────────────────────────────────────────┐
│             VIDEO ORCHESTRATOR (Servicio Node.js)             │
├──────────────────────────────────────────────────────────────┤
│  🎬 Consume cola respetando capacidades                       │
│  🚦 Rate limiting por proveedor:                              │
│     - VEO3: max 2 simultáneos, min 10s entre inicios          │
│     - OpenAI: max 5 simultáneos, min 1s entre inicios         │
│     - Instagram: max 3 simultáneos, min 5s entre inicios      │
│  🔄 Retry automático (max 3 intentos)                         │
│  🩺 Detección de trabajos stuck (>2x duración)                │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Execute job
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                      PROVEEDORES DE APIs                      │
├──────────────────────────────────────────────────────────────┤
│  • VEO3 (KIE.ai) - Generación videos                          │
│  • OpenAI (Whisper, GPT) - Transcripción, análisis            │
│  • Instagram Graph API - Publicación                          │
│  • TikTok API - Publicación                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Tablas Creadas

### 1. `competitive_recommendations`

Recomendaciones del Agente Analizador para crear contenido viral

**Campos clave**:

- `priority`: P0 (crítico 24h), P1 (alto 48h), P2 (medio 1 semana), P3 (bajo)
- `status`: pending → in_production → published
- `recommendation_type`: counter_argument, trend_jump, player_spotlight,
  viral_response
- `target_player`: Jugador sobre el que trata
- `our_data`: Datos de BargainAnalyzer/API-Sports para contrastar
- `urgency_deadline`: Deadline después del cual pierde relevancia

**Workflow**:

1. Agente Analizador crea recomendación → status: `pending`
2. VideoOrchestrator la encola en `automation_queue`
3. VEO3 genera video → status: `in_production`
4. Video publicado → status: `published`

### 2. `automation_queue`

Cola centralizada de automatizaciones

**Campos clave**:

- `priority`: P0, P1, P2, P3
- `status`: queued → processing → completed/failed
- `job_type`: veo3_chollo, veo3_competitive_response, veo3_player_spotlight,
  instagram_reel, etc.
- `job_config`: Configuración JSON del trabajo
- `api_provider`: veo3, openai, instagram (para rate limiting)
- `schedule_after`: No procesar antes de esta fecha
- `estimated_duration_seconds`: Para planning (VEO3: 300s, Instagram: 30s)

**Funciones SQL disponibles**:

- `enqueue_job()` - Encolar nuevo trabajo
- `start_job()` - Marcar como en proceso
- `complete_job()` - Marcar como completado
- `fail_job()` - Marcar como fallido (con retry automático)
- `get_available_capacity()` - Obtener capacidad disponible por proveedor

---

## 🔧 Servicios Creados

### 1. `RecommendationEngine` (`backend/services/contentAnalysis/recommendationEngine.js`)

Genera recomendaciones priorizadas desde análisis competitivo

**Métodos**:

- `generateRecommendations()` - Analiza videos competidores y genera
  recomendaciones
    - Detecta contraargumentos
    - Detecta jugadores trending
    - Detecta oportunidades virales urgentes
- `getStats()` - Estadísticas de recomendaciones

**Uso**:

```javascript
const recommendationEngine = require('./backend/services/contentAnalysis/recommendationEngine');

// Generar recomendaciones desde últimos 7 días
const recs = await recommendationEngine.generateRecommendations({
    lookbackDays: 7
});
// → Crea recomendaciones en competitive_recommendations table
```

### 2. `VideoOrchestrator` (`backend/services/videoOrchestrator.js`)

Orquestador maestro que consume la cola respetando capacidades

**Métodos**:

- `start()` - Iniciar orquestador (polling cada 10s)
- `stop()` - Detener orquestador
- `processQueue()` - Procesar cola (llamado cada 10s)
- `getStatus()` - Estado del orquestador

**Capacidades configuradas**:

```javascript
veo3: {
    maxConcurrent: 2,              // Max 2 videos simultáneos
    minIntervalMs: 10000,          // Mínimo 10s entre inicios
    estimatedDurationSeconds: 300  // ~5 min por video
}
```

**Uso**:

```javascript
const videoOrchestrator = require('./backend/services/videoOrchestrator');

// Iniciar orquestador
await videoOrchestrator.start();

// El orquestador procesará automáticamente automation_queue cada 10s

// Detener cuando sea necesario
videoOrchestrator.stop();
```

---

## 📋 Workflow Completo

### Ejemplo: Contraargumento a video competidor

```
1. VIDEO COMPETIDOR PUBLICADO
   José Carrasco: "Carlos Álvarez REGALADO en jornada 8"
   Views: 28K | Viral Potential: 7/10

2. AUTOMATIC VIDEO PROCESSOR
   ✅ Transcribe audio (Whisper)
   ✅ Analiza contenido (GPT)
   ✅ Normaliza nombres de jugadores
   ✅ Guarda en competitive_videos

3. RECOMMENDATION ENGINE (cada 1h)
   ✅ Detecta oportunidad de contraargumento
   ✅ Crea recomendación en competitive_recommendations:
      {
        priority: 'P0' (urgente 24h),
        recommendation_type: 'counter_argument',
        title: 'CONTRAARGUMENTO: Carlos Álvarez NO es el mejor chollo',
        our_data: { /* datos API-Sports */ },
        urgency_deadline: '2025-10-13T14:00:00Z'
      }

4. RECOMMENDATION ENGINE → ENQUEUE
   ✅ Encola trabajo en automation_queue:
      {
        job_type: 'veo3_competitive_response',
        priority: 'P0',
        api_provider: 'veo3',
        job_config: { player: 'Carlos Álvarez', data: {/*...*/} }
      }

5. VIDEO ORCHESTRATOR (polling cada 10s)
   ✅ Verifica capacidad VEO3: 0/2 en uso → disponible
   ✅ Obtiene trabajo P0 más antiguo
   ✅ Marca como 'processing'
   ✅ Ejecuta viralVideoBuilder.generate()

6. VEO3 GENERA VIDEO
   ⏱️  5 minutos de generación
   ✅ Video guardado en output/veo3/sessions/

7. VIDEO ORCHESTRATOR → COMPLETE
   ✅ Marca trabajo como 'completed'
   ✅ Actualiza recomendación a 'published'
   ✅ Publica en YouTube/Instagram (si configurado)

8. DASHBOARD MUESTRA
   ✅ Recomendación marcada como PUBLICADA
   ✅ Sacada de la lista de pendientes
   ✅ Métricas de performance post-publicación
```

---

## 🚀 Instrucciones de Instalación

### Paso 1: Aplicar Schemas en Supabase

**IMPORTANTE**: Los schemas deben aplicarse manualmente en Supabase SQL Editor

1. Ir a https://supabase.com/dashboard → Tu proyecto → SQL Editor

2. Copiar y ejecutar en orden:

    **a) Schema de Recomendaciones**

    ```
    database/competitive-recommendations-schema.sql
    ```

    **b) Schema de Cola de Automatización**

    ```
    database/automation-queue-schema.sql
    ```

3. Verificar que las tablas existan:
    ```sql
    SELECT * FROM competitive_recommendations LIMIT 1;
    SELECT * FROM automation_queue LIMIT 1;
    ```

### Paso 2: Iniciar Video Orchestrator

En `backend/server.js`, agregar:

```javascript
const videoOrchestrator = require('./services/videoOrchestrator');

// Después de iniciar el servidor
videoOrchestrator.start();
console.log('🎬 VideoOrchestrator iniciado');

// Graceful shutdown
process.on('SIGTERM', () => {
    videoOrchestrator.stop();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
```

### Paso 3: Generar Recomendaciones (Manual o Cron)

**Opción A: Manual**

```bash
node -e "require('./backend/services/contentAnalysis/recommendationEngine').generateRecommendations()"
```

**Opción B: Cron (cada hora)**

```javascript
// En server.js
const recommendationEngine = require('./services/contentAnalysis/recommendationEngine');

setInterval(
    async () => {
        await recommendationEngine.generateRecommendations({ lookbackDays: 7 });
    },
    60 * 60 * 1000
); // 1 hora
```

---

## 📊 Vistas y Consultas Útiles

### Ver cola pendiente priorizada

```sql
SELECT * FROM queue_pending LIMIT 10;
```

### Ver trabajos en progreso

```sql
SELECT * FROM queue_processing;
```

### Ver calendario próximas 24h

```sql
SELECT * FROM queue_calendar_24h;
```

### Ver recomendaciones pendientes

```sql
SELECT * FROM recommendations_queue LIMIT 10;
```

### Ver performance por tipo de trabajo

```sql
SELECT * FROM queue_performance_by_type;
```

### Capacidad disponible de VEO3

```sql
SELECT get_available_capacity('veo3');
```

---

## 🎛️ Configuración de Rate Limits

Editar en `backend/services/videoOrchestrator.js`:

```javascript
this.providerLimits = {
    veo3: {
        maxConcurrent: 2, // Ajustar según capacidad VEO3
        minIntervalMs: 10000, // 10s entre inicios
        estimatedDurationSeconds: 300 // 5 min por video
    },
    openai: {
        maxConcurrent: 5,
        minIntervalMs: 1000,
        estimatedDurationSeconds: 10
    },
    instagram: {
        maxConcurrent: 3,
        minIntervalMs: 5000,
        estimatedDurationSeconds: 30
    }
};
```

---

## 🔍 Monitoreo

### Logs del Orchestrator

```bash
# Ver logs en tiempo real
tail -f logs/combined.log | grep VideoOrchestrator
```

### Dashboard (TODO)

Próximamente se creará dashboard visual en `/automation-calendar` con:

- Cola en tiempo real
- Calendario de próximas 24h
- Métricas por proveedor
- Alertas de trabajos stuck

---

## 🧪 Testing

### Test manual: Encolar trabajo

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);

await supabase.rpc('enqueue_job', {
    job_priority: 'P2',
    job_type_param: 'veo3_chollo',
    job_title: 'Test: Video chollo Pepelu',
    job_config_param: {
        player: 'Pepelu',
        team: 'Valencia',
        price: 5.5,
        points_potential: 8.2
    },
    estimated_duration: 300,
    api_provider_param: 'veo3'
});
```

### Test manual: Verificar procesamiento

```bash
# Iniciar orchestrator
node -e "require('./backend/services/videoOrchestrator').start()"

# Ver en logs que procesa el trabajo
```

---

## 🔐 Seguridad

- ✅ Todos los trabajos tienen retry automático (max 3 intentos)
- ✅ Detección de trabajos stuck (>2x duración estimada)
- ✅ Rate limiting estricto por proveedor
- ✅ Logs detallados de cada operación
- ⚠️ **TODO**: Implementar autenticación para endpoints REST

---

## 📈 Próximos Pasos

1. ✅ Schemas creados
2. ✅ Servicios implementados
3. ⏳ Aplicar schemas en Supabase (MANUAL)
4. ⏳ Integrar VEO3 con orchestrator
5. ⏳ Crear dashboard visual
6. ⏳ Crear endpoints REST para gestión manual
7. ⏳ Agregar notificaciones (Slack/Discord) cuando trabajos completan
8. ⏳ Agregar métricas de performance (Grafana)

---

## 🆘 Troubleshooting

### Orchestrator no procesa trabajos

1. Verificar que orchestrator esté running:
   `videoOrchestrator.isRunning === true`
2. Verificar que haya trabajos queued: `SELECT * FROM queue_pending;`
3. Verificar capacidad disponible: `SELECT get_available_capacity('veo3');`
4. Ver logs: `tail -f logs/combined.log | grep VideoOrchestrator`

### Trabajos stuck

- El orchestrator detecta automáticamente trabajos stuck (>2x duración)
- Los marca como failed y reinicia automáticamente (max 3 intentos)
- Ver trabajos stuck: `SELECT * FROM queue_processing WHERE is_stuck = true;`

### Rate limits excedidos

- Ajustar `maxConcurrent` y `minIntervalMs` en `videoOrchestrator.js`
- Verificar logs de APIs (VEO3, OpenAI) para errores 429

---

**Autor**: Claude Code **Última actualización**: 12 Octubre 2025
