# Workflow #3: Fantasy La Liga - Ana VEO3 Video Generation

## ✅ Estado: CREADO Y LISTO (Activación manual pendiente)

### 📋 Información General

- **Workflow ID**: `7pVHQO4CcjiE20Yo`
- **Nombre**: Fantasy La Liga - Ana VEO3 Video Generation
- **Estado actual**: INACTIVE (requiere activación manual en n8n UI)
- **Total nodos**: 14 nodos
- **n8n URL**: https://n8n-n8n.6ld9pv.easypanel.host
- **Webhook URL**: https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video

### 🎯 Objetivo del Workflow

Generar videos con Ana Real usando VEO3, subirlos a Bunny.net y publicarlos automáticamente en Instagram.

## 🏗️ Arquitectura de Nodos (14 nodos totales)

### Flujo Principal

1. **Webhook Trigger** → Recibe POST requests en `/webhook/generate-ana-video`
2. **Validate Input** → Verifica que `type` y `playerData` existan
3. **Function - Build VEO3 Prompt** → Construye prompt optimizado según tipo de contenido
4. **HTTP Request - Generate Ana Video (VEO3)** → POST a backend VEO3 (timeout: 400s)
5. **Wait 6 Minutes** → Espera 360s para que VEO3 procese
6. **Function - Extract Task ID** → Extrae taskId de respuesta
7. **HTTP Request - Poll VEO3 Status** → GET status cada 30s
8. **IF - Video Generated?** → Verifica si status es 'completed'
   - **TRUE** → Continúa a upload Bunny
   - **FALSE** → Retry loop (máx 10 intentos)
9. **HTTP Request - Upload to Bunny** → Sube video a Bunny.net
10. **HTTP Request - Post Instagram Reel** → Publica en Instagram
11. **Respond to Webhook - Success** → Retorna JSON exitoso
12. **Respond to Webhook - Error** → Retorna JSON error (timeout)

### Sistema de Retry (Loop)

- **Function - Retry Logic** → Verifica contador de intentos (máx 10)
- **Wait 30 Seconds** → Espera entre polling attempts
- **Loop back** → Vuelve a nodo 7 (Poll VEO3 Status)

## ⏱️ Configuración de Timeouts

| Operación | Timeout | Descripción |
|-----------|---------|-------------|
| VEO3 generation | 400s (6.6 min) | Llamada inicial generación video |
| Wait inicial | 360s (6 min) | Espera después de iniciar VEO3 |
| Polling interval | 30s | Tiempo entre checks de status |
| Max polling attempts | 10 intentos | 5 minutos total de polling |
| Bunny upload | 120s (2 min) | Subida a Bunny.net |
| Instagram post | 90s (1.5 min) | Publicación Instagram |

**Tiempo total estimado**: ~7-8 minutos por video completo

## 📥 INPUT Esperado

```json
{
  "type": "chollo",
  "playerData": {
    "playerId": 162686,
    "name": "Pedri",
    "team": "Barcelona",
    "position": "MID",
    "price": 8.5,
    "valueRatio": 1.45,
    "estimatedPoints": 12.3,
    "stats": {
      "goals": 2,
      "assists": 3,
      "rating": 8.2
    }
  }
}
```

**Tipos válidos**:
- `"chollo"` - Revelación chollo con arco emocional conspiratorio
- `"analysis"` - Análisis táctico profesional autoritario
- `"prediction"` - Predicción con arco de urgencia

## 📤 OUTPUT Esperado

### Success Response (200)
```json
{
  "success": true,
  "videoUrl": "https://kie.ai/output/video.mp4",
  "bunnyUrl": "https://video.bunny.net/embed/xyz",
  "instagramPostId": "123456789",
  "taskId": "veo3-task-abc123",
  "type": "chollo",
  "playerName": "Pedri",
  "message": "Video generado, subido y publicado exitosamente"
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Video generation timeout or failed",
  "taskId": "veo3-task-abc123",
  "attempts": 10,
  "message": "VEO3 no completó el video en 5 minutos (10 intentos)"
}
```

## 🔄 Sistema de Retry Robusto

### Lógica de Polling

1. Después de iniciar generación VEO3, espera 6 minutos
2. Extrae taskId de respuesta inicial
3. Inicia polling cada 30 segundos:
   - GET `/api/veo3/status/:taskId`
   - Si status === 'completed' → SUCCESS branch
   - Si status !== 'completed' → Incrementa contador
4. Máximo 10 intentos (5 minutos total de polling)
5. Si alcanza 10 intentos sin éxito → ERROR response

### Condiciones de Éxito

El workflow continúa al SUCCESS branch si:
- `status === "completed"` OR
- `status === "success"`

### Condiciones de Error

El workflow falla y retorna error si:
- Después de 10 intentos de polling (5 minutos) el video no está listo
- Cualquier error HTTP en los nodos intermedios

## 🧪 Testing del Workflow

### 1. Test básico webhook (sin backend)
```bash
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chollo",
    "playerData": {
      "name": "Pedri",
      "price": 8.5
    }
  }'
```

**Resultado esperado**: Error 500/timeout (backend no está ejecutándose)

### 2. Test completo con backend local
```bash
# Terminal 1: Iniciar backend
cd /Users/fran/Desktop/CURSOR/Fantasy\ la\ liga
npm run dev

# Terminal 2: Trigger workflow
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chollo",
    "playerData": {
      "playerId": 162686,
      "name": "Pedri",
      "team": "Barcelona",
      "position": "MID",
      "price": 8.5,
      "valueRatio": 1.45,
      "estimatedPoints": 12.3,
      "stats": {
        "goals": 2,
        "assists": 3,
        "rating": 8.2
      }
    }
  }'
```

**Resultado esperado**: Video generado, subido a Bunny.net y publicado en Instagram (si todas las APIs están configuradas)

### 3. Verificar workflow en n8n UI
```
URL: https://n8n-n8n.6ld9pv.easypanel.host/workflow/7pVHQO4CcjiE20Yo
```

## ⚠️ Prerequisitos para Testing Completo

1. **Backend ejecutándose**: `npm run dev` en localhost:3000
2. **VEO3 API configurada**: `KIE_AI_API_KEY` en `.env`
3. **Bunny.net API configurada**: Endpoint `/api/bunny/upload` funcional
4. **Instagram API configurada**: Endpoint `/api/instagram/reel` funcional
5. **n8n workflow ACTIVO**: Activar manualmente en n8n UI

## 🎬 Detalles de Generación VEO3

### Ana Character Bible (NUNCA CAMBIAR)
```
A 32-year-old Spanish sports analyst with short black curly hair styled in a
professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports
blazer with subtle La Liga branding. Confident posture, natural hand gestures for
emphasis, professional broadcaster energy
```

### Configuración VEO3
- **Modelo**: veo3_fast
- **Imagen referencia**: GitHub URL (Ana-001.jpeg)
- **Seed**: 30001 (fijo para consistencia)
- **Aspect ratio**: 9:16 (vertical para redes sociales)
- **Duración**: 8 segundos por video
- **Costo**: $0.30 por video

### Arcos Emocionales por Tipo

#### Tipo: "chollo"
```javascript
(whispers conspiratorially) → (building tension) → (explosive excitement) → (urgent command)
```
- Audio: "Dynamic sports broadcast ambiance with tension-building audio cues, rising musical sting"
- Camera: "Medium shot with dramatic tension building"
- Visual: "dynamic professional broadcast style"

#### Tipo: "analysis"
```javascript
(professional analysis) → (data buildup) → (building conviction) → (authoritative conclusion)
```
- Audio: "Professional studio ambiance with data processing sounds building to statistical triumph"
- Camera: "Close-up shot"
- Visual: "analytical tactical broadcast style"

#### Tipo: "prediction"
```javascript
(professional alert) → (rising urgency) → (explosive anticipation) → (command to action)
```
- Audio: "Urgent news broadcast ambiance with alert tones"
- Camera: "Close-up shot"
- Visual: "dynamic professional broadcast style"

## 📊 Estadísticas del Workflow

### Distribución de Nodos
- **HTTP Request**: 4 nodos (29%)
- **Function**: 3 nodos (21%)
- **Wait**: 2 nodos (14%)
- **IF**: 2 nodos (14%)
- **Webhook**: 1 nodo (7%)
- **Respond**: 2 nodos (14%)

### Endpoints Backend Utilizados
1. `POST http://localhost:3000/api/veo3/generate-ana` - Generación video
2. `GET http://localhost:3000/api/veo3/status/:taskId` - Polling status
3. `POST http://localhost:3000/api/bunny/upload` - Upload Bunny.net
4. `POST http://localhost:3000/api/instagram/reel` - Post Instagram

## 🚀 Activación del Workflow

### ⚠️ IMPORTANTE: Activación Manual Requerida

El campo `active` en la API de n8n es **read-only**. No se puede activar programáticamente mediante la API pública.

### Pasos para Activar

1. **Acceder a n8n UI**: https://n8n-n8n.6ld9pv.easypanel.host
2. **Ir a Workflows**: Menú lateral → Workflows
3. **Abrir Workflow #3**: Click en "Fantasy La Liga - Ana VEO3 Video Generation"
4. **Verificar configuración**: Revisar que todos los nodos estén correctamente conectados
5. **Activar**: Toggle en la parte superior derecha → **Active: ON**
6. **Verificar webhook**: Debería aparecer webhook URL activo

### Verificación Post-Activación
```bash
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video" \
  -H "Content-Type: application/json" \
  -d '{"type":"chollo","playerData":{"name":"Test","price":5.0}}'
```

**Resultado esperado**:
- Si backend NO está ejecutándose → Error timeout
- Si backend SÍ está ejecutándose → Inicio de generación video

## 💰 Economía del Sistema

### Costos por Ejecución
- **VEO3 video generation**: $0.30
- **Bunny.net hosting**: ~$0.01/video
- **Instagram API**: Gratis (Graph API)
- **n8n hosting**: Ya incluido

**Total por video**: ~$0.31

### Estimación Mensual
- **10 videos/día**: $93/mes
- **5 videos/día**: $46.50/mes
- **3 videos/día**: $27.90/mes

## 🔍 Debugging y Troubleshooting

### Workflow no inicia
- ✅ Verificar que workflow esté **ACTIVE** en n8n UI
- ✅ Verificar webhook URL correcta
- ✅ Verificar formato JSON del input

### Video generation timeout
- ✅ Verificar backend ejecutándose en localhost:3000
- ✅ Verificar `KIE_AI_API_KEY` configurada en `.env`
- ✅ Verificar logs de VEO3 en backend
- ✅ Aumentar número de polling attempts si necesario

### Upload a Bunny.net falla
- ✅ Verificar endpoint `/api/bunny/upload` funcional
- ✅ Verificar credenciales Bunny.net
- ✅ Verificar que video URL de VEO3 sea válida

### Instagram post falla
- ✅ Verificar endpoint `/api/instagram/reel` funcional
- ✅ Verificar tokens Instagram API válidos
- ✅ Verificar que video esté en formato compatible (9:16, MP4)

## 📝 Notas Técnicas

### Limitaciones Actuales

1. **Activación manual**: n8n API no permite activar workflows programáticamente
2. **Localhost dependency**: Backend debe ejecutarse en localhost:3000 (no production URL)
3. **Timeout fijo**: No se puede ajustar dinámicamente según complejidad del video
4. **Sin error recovery**: Si falla upload Bunny o Instagram, no hay retry automático

### Mejoras Futuras Sugeridas

1. **Dynamic timeout**: Ajustar polling time según duración video solicitada
2. **Error recovery**: Implementar retry logic para upload y post Instagram
3. **Notification system**: Webhooks de notificación en caso de error
4. **Queue system**: Cola de videos pendientes para generación masiva
5. **Production backend URL**: Usar URL pública en lugar de localhost

## 🎉 Estado Final

✅ **Workflow creado exitosamente**
✅ **14 nodos configurados correctamente**
✅ **Sistema de retry robusto implementado**
✅ **Timeouts optimizados para VEO3**
⏳ **Activación manual pendiente en n8n UI**

---

**Creado**: 2025-09-30
**Script**: `/scripts/n8n/create-workflow-3-veo3.js`
**Workflow ID**: `7pVHQO4CcjiE20Yo`