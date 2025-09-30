# 🔄 Arquitectura Workflows n8n - Fantasy La Liga

## 📋 Índice
1. [Workflows Prioritarios](#workflows-prioritarios)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Workflows Detallados](#workflows-detallados)
4. [Integración MCP](#integración-mcp)
5. [Monitoreo y Logs](#monitoreo-y-logs)

---

## 🎯 Workflows Prioritarios

### **FASE 1: Workflows Fundamentales (Semana 1)**

#### 1. **Sincronización Diaria de Datos** ⭐⭐⭐
**Objetivo**: Mantener datos actualizados de API-Sports automáticamente

**Trigger**: Schedule (cada día 8:00 AM)
**Frecuencia**: Diaria
**Duración estimada**: ~10 minutos

**Flujo**:
```
Schedule Trigger (8:00 AM)
    ↓
HTTP Request → API-Sports (fixtures día actual)
    ↓
Function → Procesar datos y calcular puntos Fantasy
    ↓
HTTP Request → POST /api/fixtures/sync/today (local)
    ↓
IF → ¿Datos procesados correctamente?
    ├─ SÍ → Email notification (resumen datos)
    └─ NO → Telegram alert (error crítico)
```

**Nodos**:
- Schedule Trigger
- HTTP Request (API-Sports)
- Function (procesamiento datos)
- HTTP Request (endpoint local)
- IF conditional
- Email/Telegram notification

---

#### 2. **Detección de Chollos Automática** ⭐⭐⭐
**Objetivo**: Identificar chollos cada jornada y generar contenido

**Trigger**: Webhook (POST desde backend cuando se detectan chollos)
**Frecuencia**: Por evento
**Duración estimada**: ~5 minutos

**Flujo**:
```
Webhook Trigger (/webhook/chollos-detected)
    ↓
Receive Data (array de chollos)
    ↓
LOOP → Por cada chollo:
    ├─ HTTP Request → GPT-5 Mini (generar texto análisis)
    ├─ HTTP Request → POST /api/images/generate (player card)
    └─ Set Variables (preparar post Instagram)
    ↓
HTTP Request → POST /api/instagram/post (publicar)
    ↓
Function → Log results
    ↓
Email → Resumen publicaciones exitosas
```

**Nodos**:
- Webhook Trigger
- Loop Over Items
- HTTP Request (GPT-5 Mini)
- HTTP Request (image generation)
- Set node
- HTTP Request (Instagram API)
- Function (logging)
- Email notification

---

#### 3. **Generación Videos Ana Real - VEO3** ⭐⭐⭐
**Objetivo**: Crear videos automatizados con Ana para chollos y análisis

**Trigger**: Webhook (POST desde backend con datos jugador)
**Frecuencia**: Por evento
**Duración estimada**: ~8 minutos (VEO3 generation)

**Flujo**:
```
Webhook Trigger (/webhook/generate-ana-video)
    ↓
Receive Data (tipo: chollo/analysis/prediction, playerData)
    ↓
Function → Construir prompt optimizado VEO3
    ↓
HTTP Request → POST /api/veo3/generate-ana
    ↓
Wait → 6 minutos (VEO3 processing)
    ↓
HTTP Request → GET /api/veo3/status/:taskId (polling cada 30s)
    ↓
IF → ¿Video generado?
    ├─ SÍ → HTTP Request POST /api/bunny/upload (hosting)
    └─ NO → Retry (max 3 intentos)
    ↓
Set Variables → Preparar metadata video
    ↓
HTTP Request → POST /api/instagram/reel (publicar)
    ↓
Telegram → Notificación video publicado
```

**Nodos**:
- Webhook Trigger
- Function (prompt building)
- HTTP Request (VEO3 generation)
- Wait node
- HTTP Request (status polling)
- IF conditional
- HTTP Request (Bunny upload)
- Set node
- HTTP Request (Instagram reel)
- Telegram notification

---

### **FASE 2: Workflows Avanzados (Semana 2)**

#### 4. **Pipeline Contenido Semanal** ⭐⭐
**Objetivo**: Planificar y ejecutar estrategia contenido semanal

**Trigger**: Schedule (Lunes 6:00 AM)
**Frecuencia**: Semanal
**Duración estimada**: ~30 minutos

**Flujo**:
```
Schedule Trigger (Lunes 6:00 AM)
    ↓
HTTP Request → GET /api/fixtures (próxima jornada)
    ↓
HTTP Request → GET /api/bargains/top (chollos semana)
    ↓
HTTP Request → POST /api/content-ai/plan-week (generar plan)
    ↓
Function → Crear calendario contenido (7 días)
    ↓
LOOP → Por cada día:
    ├─ Set Variables → Contenido del día
    ├─ Schedule Future → Programar publicación
    └─ Google Sheets → Guardar en calendario
    ↓
Email → Plan semanal completo
```

**Nodos**:
- Schedule Trigger
- HTTP Request (múltiples endpoints)
- Function (calendar creation)
- Loop Over Items
- Set node
- Schedule Future (n8n native)
- Google Sheets integration
- Email notification

---

#### 5. **Monitor Lesiones y Alertas** ⭐⭐
**Objetivo**: Detectar lesiones/sanciones y notificar inmediatamente

**Trigger**: Schedule (cada 2 horas durante temporada)
**Frecuencia**: Cada 2 horas
**Duración estimada**: ~3 minutos

**Flujo**:
```
Schedule Trigger (cada 2 horas)
    ↓
HTTP Request → API-Sports (injuries últimas 24h)
    ↓
Function → Comparar con lesiones previas (cache)
    ↓
IF → ¿Nuevas lesiones detectadas?
    ├─ NO → End workflow
    └─ SÍ → Continue
        ↓
        LOOP → Por cada lesión nueva:
            ├─ HTTP Request → GPT-5 Mini (análisis impacto Fantasy)
            ├─ Telegram → Alert urgente usuarios
            └─ HTTP Request → POST /api/instagram/story
        ↓
        Function → Update cache lesiones
        ↓
        Email → Resumen lesiones del día
```

**Nodos**:
- Schedule Trigger
- HTTP Request (API-Sports)
- Function (comparison logic)
- IF conditional
- Loop Over Items
- HTTP Request (GPT-5 Mini)
- Telegram notification
- HTTP Request (Instagram story)
- Function (cache update)
- Email notification

---

#### 6. **Análisis Post-Jornada Automático** ⭐⭐
**Objetivo**: Generar análisis completo tras finalizar jornada

**Trigger**: Webhook (POST cuando finaliza última partido jornada)
**Frecuencia**: Por jornada (38 veces/temporada)
**Duración estimada**: ~20 minutos

**Flujo**:
```
Webhook Trigger (/webhook/gameweek-finished)
    ↓
HTTP Request → GET /api/laliga/laliga/players (stats jornada)
    ↓
Function → Calcular top performers y decepciones
    ↓
PARALLEL EXECUTION:
    ├─ Branch 1: Generar infografía top 11 jornada
    │   └─ HTTP Request → POST /api/images/generate
    ├─ Branch 2: Generar video resumen Ana
    │   └─ HTTP Request → POST /api/veo3/generate-ana
    └─ Branch 3: Generar análisis textual GPT-5
        └─ HTTP Request → POST /api/content-ai/analysis
    ↓
Merge branches
    ↓
HTTP Request → POST /api/instagram/carousel (múltiples imágenes)
    ↓
HTTP Request → POST /api/instagram/reel (video Ana)
    ↓
Email → Resumen jornada completo
```

**Nodos**:
- Webhook Trigger
- HTTP Request (stats retrieval)
- Function (top performers calculation)
- Split In Batches (parallel execution)
- HTTP Request (múltiples para cada branch)
- Merge node
- HTTP Request (Instagram carousel)
- HTTP Request (Instagram reel)
- Email notification

---

### **FASE 3: Workflows Estratégicos (Semana 3)**

#### 7. **Optimización Plantilla Usuario** ⭐
**Objetivo**: Analizar plantilla usuario y sugerir mejoras

**Trigger**: Manual (desde dashboard) o Schedule (Viernes 10:00 AM)
**Frecuencia**: Semanal
**Duración estimada**: ~10 minutos

**Flujo**:
```
Manual Trigger / Schedule
    ↓
HTTP Request → GET /api/user/squad (plantilla actual)
    ↓
HTTP Request → GET /api/bargains/top (alternativas baratas)
    ↓
Function → Análisis SWOT plantilla
    ↓
HTTP Request → POST /api/content-ai/squad-optimization
    ↓
Function → Generar recomendaciones específicas
    ↓
PARALLEL:
    ├─ HTTP Request → POST /api/images/generate (comparativas)
    └─ Email → Reporte optimización detallado
    ↓
Google Sheets → Guardar histórico optimizaciones
```

**Nodos**:
- Manual/Schedule Trigger
- HTTP Request (squad data)
- HTTP Request (bargains)
- Function (SWOT analysis)
- HTTP Request (AI optimization)
- Function (recommendations)
- Split In Batches (parallel)
- HTTP Request (image generation)
- Email notification
- Google Sheets integration

---

#### 8. **Sistema de Backup Automático** ⭐
**Objetivo**: Backup diario de datos críticos

**Trigger**: Schedule (cada día 3:00 AM)
**Frecuencia**: Diaria
**Duración estimada**: ~5 minutos

**Flujo**:
```
Schedule Trigger (3:00 AM)
    ↓
PARALLEL EXECUTION:
    ├─ Branch 1: Backup workflows n8n
    │   └─ HTTP Request → GET /api/n8n-mcp/workflows
    ├─ Branch 2: Backup datos Fantasy
    │   └─ HTTP Request → GET /api/database/export
    └─ Branch 3: Backup configuración
        └─ HTTP Request → GET /api/config/export
    ↓
Merge branches
    ↓
Function → Compress data (ZIP)
    ↓
Google Drive → Upload backup file
    ↓
IF → ¿Backup exitoso?
    ├─ SÍ → Function → Delete old backups (>30 días)
    └─ NO → Telegram → Alert error crítico
    ↓
Email → Confirmación backup diario
```

**Nodos**:
- Schedule Trigger
- Split In Batches (parallel)
- HTTP Request (múltiples endpoints)
- Merge node
- Function (compression)
- Google Drive integration
- IF conditional
- Function (cleanup)
- Telegram notification
- Email notification

---

## 🏗️ Arquitectura Técnica

### **Principios de Diseño**

1. **Idempotencia**: Todos los workflows deben ser ejecutables múltiples veces sin efectos adversos
2. **Error Handling**: Cada workflow tiene manejo de errores robusto y notificaciones
3. **Logging**: Todos los pasos críticos escriben logs para debugging
4. **Timeouts**: Timeouts configurados para evitar workflows colgados
5. **Rate Limiting**: Respetar límites de APIs externas (API-Sports, GPT-5, VEO3)

### **Estructura de Datos Estándar**

```json
{
  "workflowId": "fantasy-laliga-sync-001",
  "executionId": "uuid-v4",
  "timestamp": "2025-09-30T12:00:00Z",
  "status": "success|error|pending",
  "data": {
    "input": {},
    "output": {},
    "errors": []
  },
  "metadata": {
    "duration": 123,
    "retries": 0,
    "source": "schedule|webhook|manual"
  }
}
```

---

## 🔗 Integración MCP

### **Endpoints MCP Disponibles**

Ya implementados en `backend/routes/n8nMcp.js`:

- `GET /api/n8n-mcp/test` - Test conexión
- `GET /api/n8n-mcp/workflows` - Listar workflows
- `POST /api/n8n-mcp/workflows/:id/execute` - Ejecutar workflow
- `GET /api/n8n-mcp/executions/:id/status` - Estado ejecución
- `POST /api/n8n-mcp/webhooks/create` - Crear webhook

### **Crear Workflows Programáticamente**

```javascript
// Ejemplo desde backend Fantasy La Liga
const n8nMcp = require('./services/n8nMcpServer');

// Crear workflow
const workflow = await n8nMcp.createWorkflow({
  name: 'Fantasy Sync Daily',
  nodes: [...],
  connections: {...},
  settings: {...}
});

// Ejecutar workflow
const execution = await n8nMcp.executeWorkflow(workflow.id, {
  playerData: {...}
});

// Monitorear estado
const status = await n8nMcp.getExecutionStatus(execution.id);
```

---

## 📊 Monitoreo y Logs

### **Dashboard de Monitoreo**

Crear página en frontend: `frontend/n8n-monitor.html`

**Métricas a mostrar**:
- Workflows activos vs inactivos
- Última ejecución de cada workflow
- Tasa de éxito/error por workflow
- Duración promedio de ejecución
- Alertas pendientes

### **Logs Centralizados**

Todos los workflows escriben a:
- `logs/n8n-workflows.log` (Winston logger)
- Google Sheets (histórico ejecuciones)
- Base de datos (métricas agregadas)

---

## 🚀 Implementación

### **Orden de Creación Workflows**

1. **Día 1**: Workflow #1 (Sincronización Diaria) ⭐⭐⭐
2. **Día 2**: Workflow #2 (Chollos Automática) ⭐⭐⭐
3. **Día 3**: Workflow #3 (Videos Ana VEO3) ⭐⭐⭐
4. **Día 4**: Workflow #8 (Backup Automático) ⭐
5. **Día 5**: Workflow #5 (Monitor Lesiones) ⭐⭐
6. **Semana 2**: Workflows #4, #6, #7

### **Testing de Workflows**

Cada workflow debe pasar:
- ✅ Test unitario (cada nodo individualmente)
- ✅ Test integración (flujo completo)
- ✅ Test error handling (forzar errores)
- ✅ Test performance (medir duración)
- ✅ Test producción (ejecutar en real 1 vez)

---

## 📝 Notas Importantes

- **API-Sports Rate Limit**: 75k requests/día (Plan Ultra)
- **GPT-5 Mini Cost**: $0.29/mes estimado
- **VEO3 Cost**: $0.30 por video (~$9/mes con 30 videos)
- **n8n Self-Hosted**: Ilimitadas ejecuciones (gratis)

**Costo mensual total workflows**: ~$10-15 (solo APIs externas)

---

## ✅ Próxima Acción

**Empezar con Workflow #1: Sincronización Diaria de Datos**

¿Quieres que proceda a crear este primer workflow ahora?