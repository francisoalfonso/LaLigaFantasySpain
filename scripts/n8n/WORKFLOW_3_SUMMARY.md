# Workflow #3 - Resumen Ejecutivo

## ✅ CREACIÓN COMPLETADA EXITOSAMENTE

### 📋 Información Esencial

| Campo | Valor |
|-------|-------|
| **Workflow ID** | `7pVHQO4CcjiE20Yo` |
| **Nombre** | Fantasy La Liga - Ana VEO3 Video Generation |
| **Estado** | INACTIVE (activación manual requerida) |
| **Total Nodos** | 14 nodos |
| **Webhook URL** | https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video |
| **n8n UI URL** | https://n8n-n8n.6ld9pv.easypanel.host/workflow/7pVHQO4CcjiE20Yo |

---

## 🎯 Funcionalidad

**Pipeline completo de video automation**:
1. Recibe request con datos de jugador + tipo de contenido
2. Genera video con Ana Real usando VEO3 (~6 minutos)
3. Sube video a Bunny.net para hosting
4. Publica automáticamente en Instagram
5. Retorna URLs y IDs de post publicado

---

## ⏱️ Timeouts Configurados

| Operación | Timeout | Descripción |
|-----------|---------|-------------|
| VEO3 generation | 400s (6.6 min) | Generación inicial video |
| Wait inicial | 360s (6 min) | Espera post-generación |
| Polling interval | 30s | Check status cada 30s |
| Max polling | 10 intentos | 5 minutos total polling |
| Bunny upload | 120s (2 min) | Upload a CDN |
| Instagram post | 90s (1.5 min) | Publicación Instagram |

**⏳ Tiempo total estimado**: 7-8 minutos por video completo

---

## 🔄 Sistema de Retry Robusto

✅ **Polling automático** cada 30 segundos
✅ **Máximo 10 intentos** antes de timeout
✅ **Loop back automático** si video no está listo
✅ **Error response** después de 10 intentos fallidos

**Lógica**:
```
Generar video → Wait 6min → Poll status cada 30s (max 10x) → Upload → Instagram → Success
```

---

## 📥 INPUT Format

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

**Tipos válidos**: `"chollo"`, `"analysis"`, `"prediction"`

---

## 📤 OUTPUT Format

### ✅ Success (200)
```json
{
  "success": true,
  "videoUrl": "https://kie.ai/output/video.mp4",
  "bunnyUrl": "https://video.bunny.net/embed/xyz",
  "instagramPostId": "123456789",
  "taskId": "veo3-task-abc123",
  "type": "chollo",
  "playerName": "Pedri"
}
```

### ❌ Error (500)
```json
{
  "success": false,
  "error": "Video generation timeout or failed",
  "taskId": "veo3-task-abc123",
  "attempts": 10,
  "message": "VEO3 no completó el video en 5 minutos"
}
```

---

## 🚀 Pasos para Activación

### ⚠️ ACTIVACIÓN MANUAL REQUERIDA

El campo `active` es **read-only** en n8n API. Debe activarse manualmente:

1. **Acceder a n8n UI**: https://n8n-n8n.6ld9pv.easypanel.host
2. **Abrir Workflows**: Menú lateral → Workflows
3. **Seleccionar Workflow #3**: "Fantasy La Liga - Ana VEO3 Video Generation"
4. **Activar**: Toggle superior derecha → **Active: ON**
5. **Verificar**: Webhook URL debe mostrarse como activo

---

## 🧪 Testing Sugerido

### 1. Test webhook básico
```bash
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video" \
  -H "Content-Type: application/json" \
  -d '{"type":"chollo","playerData":{"name":"Pedri","price":8.5}}'
```

### 2. Test completo (requiere backend local)
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
      "stats": {"goals": 2, "assists": 3, "rating": 8.2}
    }
  }'
```

---

## ⚠️ Prerequisitos para Testing Completo

- ✅ Backend ejecutándose en `localhost:3000`
- ✅ `KIE_AI_API_KEY` configurada en `.env`
- ✅ Endpoint `/api/bunny/upload` funcional
- ✅ Endpoint `/api/instagram/reel` funcional
- ✅ Workflow ACTIVADO en n8n UI

---

## 💰 Costos por Ejecución

- **VEO3 video**: $0.30
- **Bunny.net**: ~$0.01
- **Instagram API**: Gratis
- **Total**: ~$0.31/video

**Estimación mensual**:
- 3 videos/día = $27.90/mes
- 5 videos/día = $46.50/mes
- 10 videos/día = $93/mes

---

## 📊 Endpoints Backend Utilizados

1. `POST http://localhost:3000/api/veo3/generate-ana`
2. `GET http://localhost:3000/api/veo3/status/:taskId`
3. `POST http://localhost:3000/api/bunny/upload`
4. `POST http://localhost:3000/api/instagram/reel`

---

## 🎬 Detalles VEO3

### Ana Character Bible (NUNCA CAMBIAR)
```
A 32-year-old Spanish sports analyst with short black curly hair styled in a
professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports
blazer with subtle La Liga branding. Confident posture, natural hand gestures for
emphasis, professional broadcaster energy.
```

### Configuración VEO3
- **Modelo**: veo3_fast
- **Seed**: 30001 (fijo para consistencia)
- **Aspect ratio**: 9:16 (vertical)
- **Duración**: 8 segundos
- **Imagen referencia**: GitHub URL (Ana-001.jpeg)

---

## 📁 Archivos Relacionados

- **Script creación**: `/scripts/n8n/create-workflow-3-veo3.js`
- **Script activación**: `/scripts/n8n/activate-workflow-3.js`
- **Documentación completa**: `/scripts/n8n/workflow-3-documentation.md`
- **Resumen ejecutivo**: `/scripts/n8n/WORKFLOW_3_SUMMARY.md` (este archivo)

---

## ✅ Estado Final

| Item | Status |
|------|--------|
| Workflow creado | ✅ DONE |
| 14 nodos configurados | ✅ DONE |
| Timeouts optimizados | ✅ DONE |
| Sistema retry implementado | ✅ DONE |
| Webhook URL generado | ✅ DONE |
| **Activación manual** | ⏳ PENDIENTE |

---

## 🔍 Consideraciones Importantes

### ⚠️ Limitación Actual
- **Localhost dependency**: Backend debe ejecutarse en `localhost:3000`
- En producción, cambiar URLs a dominio público del backend

### 💡 Mejora Futura Sugerida
```javascript
// En lugar de:
url: "http://localhost:3000/api/veo3/generate-ana"

// Usar variable de entorno:
url: "{{ $env.BACKEND_URL }}/api/veo3/generate-ana"
```

### 🎯 Testing Recomendado
1. Test con video tipo "chollo" (más complejo, arco emocional conspiratorio)
2. Verificar que polling funcione correctamente (esperar ~6-7 minutos)
3. Confirmar que video se suba a Bunny.net
4. Validar publicación en Instagram

---

**Creado**: 2025-09-30
**Estado**: ✅ Workflow creado exitosamente, activación manual pendiente
**Próximo paso**: Activar workflow en n8n UI y realizar test completo