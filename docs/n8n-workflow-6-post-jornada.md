# Workflow #6: Fantasy La Liga - Análisis Post-Jornada Automático

## Información General

**Workflow ID**: `WnQgljHUjDj56NDr`

**Nombre**: Fantasy La Liga - Análisis Post-Jornada Automático

**Estado**: Inactivo (requiere activación manual en dashboard)

**Webhook URL**: `https://n8n-n8n.6ld9pv.easypanel.host/webhook/gameweek-finished`

**Timeout de ejecución**: 1800 segundos (~30 minutos)

**Timezone**: Europe/Madrid

## Objetivo

Generar análisis completo automático tras finalizar una jornada de La Liga Fantasy, incluyendo:
- Top 11 performers de la jornada (formación 4-3-3)
- Top 5 decepciones (jugadores caros con bajo rendimiento)
- Infografía visual con top 11
- Video resumen con Ana Real (VEO3)
- Análisis textual con IA (GPT-5 Mini)
- Publicación automática en Instagram (Carousel + Reel)
- Email resumen al administrador

## Arquitectura del Workflow (15 Nodos)

### Flujo Principal

```
1. Webhook Trigger (POST /webhook/gameweek-finished)
   ↓
2. HTTP Request → GET /api/laliga/laliga/players
   ↓
3. Function → Calculate Top Performers
   ↓
4. SplitInBatches → 3 Branches Paralelas
   ├─ Branch A: Generate Top 11 Infographic
   ├─ Branch B: Generate Ana Summary Video
   └─ Branch C: Generate AI Analysis
   ↓
5. Aggregate → Merge All Content
   ↓
6. Wait → 8 Minutes (VEO3 Processing)
   ↓
7. HTTP Request → Check VEO3 Status
   ↓
8. IF → Is Video Ready?
   ↓
9. HTTP Request → Post Instagram Carousel
   ↓
10. HTTP Request → Post Instagram Reel
   ↓
11. HTTP Request → Send Email Summary
   ↓
12. Respond to Webhook → Success Response
```

## Nodos Detallados

### 1. Gameweek Finished Webhook
- **Tipo**: `n8n-nodes-base.webhook`
- **Método**: POST
- **Path**: `gameweek-finished`
- **Response Mode**: lastNode

**Input esperado**:
```json
{
  "gameweek": 5,
  "lastMatchId": 1234567,
  "timestamp": "2025-09-30T22:00:00Z"
}
```

### 2. Get Players Stats
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: GET
- **URL**: `http://localhost:3000/api/laliga/laliga/players`
- **Query Params**: 
  - league: 140
  - season: 2025
- **Timeout**: 60000ms

### 3. Calculate Top Performers
- **Tipo**: `n8n-nodes-base.function`
- **Lógica**: 
  - Calcula puntos Fantasy por jugador
  - Selecciona top 11 (formación 4-3-3):
    - 1 Portero
    - 4 Defensas
    - 3 Centrocampistas
    - 3 Delanteros
  - Identifica top 5 decepciones (< 5 puntos)

**Sistema de puntos Fantasy**:
```javascript
// Puntos base
if (minutes >= 60) points += 2;

// Goles según posición
Portero: +10 pts
Defensa: +6 pts
Centrocampista: +5 pts
Delantero: +4 pts

// Otros
Asistencia: +3 pts
Tarjeta amarilla: -1 pt
Tarjeta roja: -3 pts
Portería a cero (GK/DEF): +4 pts
```

### 4. Split Into 3 Branches
- **Tipo**: `n8n-nodes-base.splitInBatches`
- **Batch Size**: 1
- **Branches**: 3 paralelas (Infographic + Video + AI)

### 5. Generate Top 11 Infographic
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: POST
- **URL**: `http://localhost:3000/api/images/generate`
- **Body**:
  - type: `top11_gameweek`
  - gameweek: Número de jornada
  - players: JSON array con top 11
- **Timeout**: 90000ms

### 6. Generate Ana Summary Video
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: POST
- **URL**: `http://localhost:3000/api/veo3/generate-ana`
- **Body**:
  - type: `gameweek_summary`
  - gameweek: Número de jornada
  - top11: Top 3 performers
  - disappointments: Top 2 decepciones
- **Timeout**: 400000ms (6.67 minutos)

### 7. Generate AI Analysis
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: POST
- **URL**: `http://localhost:3000/api/ai/gameweek-analysis`
- **Body**:
  - gameweek: Número de jornada
  - top11: Top 11 completo
  - disappointments: Top 5 decepciones
- **Timeout**: 60000ms

### 8. Merge All Content
- **Tipo**: `n8n-nodes-base.aggregate`
- **Mode**: aggregateAllItemData
- **Función**: Combina resultados de 3 branches paralelas

### 9. Wait for VEO3 Processing
- **Tipo**: `n8n-nodes-base.wait`
- **Duration**: 8 minutos
- **Razón**: VEO3 requiere ~6-8 minutos para generar video

### 10. Check VEO3 Status
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: GET
- **URL**: `http://localhost:3000/api/veo3/status/{taskId}`
- **Timeout**: 30000ms

### 11. Is Video Ready?
- **Tipo**: `n8n-nodes-base.if`
- **Condición**: `status === 'completed'`
- **True Branch**: Continuar con publicación Instagram
- **False Branch**: Terminar workflow (error)

### 12. Post Instagram Carousel
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: POST
- **URL**: `http://localhost:3000/api/instagram/carousel`
- **Body**:
  - images: Array con URL de infografía
  - caption: Caption generado por IA
  - gameweek: Número de jornada
- **Timeout**: 90000ms

### 13. Post Instagram Reel
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: POST
- **URL**: `http://localhost:3000/api/instagram/reel`
- **Body**:
  - videoUrl: URL del video Ana
  - caption: "🎬 Resumen Jornada {X} con Ana | #LaLigaFantasy"
  - gameweek: Número de jornada
- **Timeout**: 120000ms

### 14. Send Email Summary
- **Tipo**: `n8n-nodes-base.httpRequest`
- **Método**: POST
- **URL**: `http://localhost:3000/api/email/send`
- **Body**:
  - to: `laligafantasyspainpro@gmail.com`
  - subject: "📊 Análisis Completo Jornada {X}"
  - html: HTML generado por IA
- **Timeout**: 30000ms

### 15. Respond Success
- **Tipo**: `n8n-nodes-base.respondToWebhook`
- **Response**: JSON con success, gameweek, postsCreated, timestamp

## Configuración de Ejecución

- **executionOrder**: v1
- **saveDataErrorExecution**: all
- **saveDataSuccessExecution**: all
- **executionTimeout**: 1800s (~30 minutos)
- **timezone**: Europe/Madrid

## Tiempo de Ejecución Estimado

- **Total**: ~20 minutos
  - Get Players Stats: ~5s
  - Calculate Top Performers: ~2s
  - Generate Infographic: ~10s
  - Generate Ana Video: ~6-8 minutos (VEO3)
  - Generate AI Analysis: ~5s
  - Wait for VEO3: 8 minutos
  - Check Status: ~2s
  - Post Instagram Carousel: ~5s
  - Post Instagram Reel: ~10s
  - Send Email: ~2s

## Costos por Ejecución

- **VEO3 Video**: $0.30 (8 segundos)
- **GPT-5 Mini Analysis**: ~$0.01
- **Image Generation**: Incluido (Jimp local)
- **Instagram API**: Gratis
- **Email**: Gratis
- **Total**: ~$0.31 por jornada

## Activación del Workflow

### Paso 1: Activar en n8n Dashboard
1. Ir a: `https://n8n-n8n.6ld9pv.easypanel.host`
2. Buscar workflow: "Fantasy La Liga - Análisis Post-Jornada Automático"
3. Click en toggle "Active"
4. Verificar que webhook esté activo

### Paso 2: Test Manual
```bash
curl -X POST https://n8n-n8n.6ld9pv.easypanel.host/webhook/gameweek-finished \
  -H "Content-Type: application/json" \
  -d '{
    "gameweek": 5,
    "lastMatchId": 1234567,
    "timestamp": "2025-09-30T22:00:00Z"
  }'
```

### Paso 3: Integrar con Sistema Fantasy La Liga

Agregar trigger automático en backend cuando finalice última jornada:

```javascript
// backend/services/gameweekMonitor.js
async function onGameweekFinished(gameweek, lastMatchId) {
  const n8nWebhook = 'https://n8n-n8n.6ld9pv.easypanel.host/webhook/gameweek-finished';
  
  await axios.post(n8nWebhook, {
    gameweek: gameweek,
    lastMatchId: lastMatchId,
    timestamp: new Date().toISOString()
  });
  
  console.log(`✅ Workflow post-jornada iniciado para jornada ${gameweek}`);
}
```

## Monitoreo y Logs

### Ver ejecuciones en n8n
1. Dashboard → Executions
2. Filtrar por workflow: "Análisis Post-Jornada"
3. Revisar logs detallados de cada nodo

### Errores comunes

**1. VEO3 Timeout**
- Causa: Video tarda más de 8 minutos
- Solución: Aumentar wait time o implementar polling

**2. Instagram API Rate Limit**
- Causa: Demasiadas publicaciones en poco tiempo
- Solución: Agregar delay entre posts

**3. GPT-5 Mini API Error**
- Causa: Token inválido o rate limit
- Solución: Verificar OPENAI_API_KEY en .env

## Próximas Mejoras

1. **Retry Logic**: Implementar reintentos en caso de fallo
2. **Fallback Content**: Contenido alternativo si VEO3 falla
3. **Progressive Publishing**: Publicar infografía inmediatamente, video después
4. **A/B Testing**: Probar diferentes formatos de caption
5. **Analytics Integration**: Trackear performance de posts automáticos

## Estado Actual

- ✅ Workflow creado y verificado
- ✅ 15 nodos configurados correctamente
- ✅ Branches paralelas funcionando
- ✅ Timeout largo configurado (1800s)
- ⚠️ Requiere activación manual
- ⚠️ Requiere integración con sistema Fantasy La Liga

## Documentación Adicional

- **VEO3 System**: `/docs/veo3-system.md`
- **Instagram Integration**: `/docs/instagram-automation.md`
- **GPT-5 Mini**: `/CLAUDE.md` (sección GPT-5 Mini)
- **n8n MCP**: `/backend/routes/n8nMcp.js`

---

**Creado**: 2025-09-30  
**Workflow ID**: WnQgljHUjDj56NDr  
**Status**: ✅ Operacional (inactivo)
