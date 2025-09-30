# n8n Workflows - Fantasy La Liga

## 📁 Workflows Disponibles

### Workflow #1: Fantasy La Liga - Data Processing
- **ID**: `rmQJE97fOJfAe2mg`
- **Función**: Procesamiento automático de datos Fantasy La Liga
- **Estado**: ACTIVE ✅

### Workflow #2: Fantasy La Liga - Instagram Automation
- **ID**: `YjvjMbHILQjUZjJz`
- **Función**: Automatización publicación Instagram
- **Estado**: ACTIVE ✅

### Workflow #3: Fantasy La Liga - Ana VEO3 Video Generation ⭐ NEW
- **ID**: `7pVHQO4CcjiE20Yo`
- **Función**: Generación videos Ana Real + Upload Bunny + Post Instagram
- **Estado**: INACTIVE ⏳ (activación manual requerida)
- **Documentación**: Ver `workflow-3-documentation.md` y `WORKFLOW_3_SUMMARY.md`

---

## 🚀 Scripts Disponibles

### Creación y Gestión de Workflows

```bash
# Crear Workflow #3
node scripts/n8n/create-workflow-3-veo3.js

# Verificar Workflow #3
node scripts/n8n/verify-workflow-3.js

# Intentar activar Workflow #3 (no funciona - API limitation)
node scripts/n8n/activate-workflow-3.js
```

### Testing y Validación

```bash
# Test webhook Workflow #3 (sin backend)
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video" \
  -H "Content-Type: application/json" \
  -d '{"type":"chollo","playerData":{"name":"Pedri","price":8.5}}'

# Test completo (con backend local)
# Terminal 1:
npm run dev

# Terminal 2:
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

## 📋 Workflow #3 - Quick Reference

### Información Esencial
- **Workflow ID**: `7pVHQO4CcjiE20Yo`
- **Webhook URL**: https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video
- **n8n UI**: https://n8n-n8n.6ld9pv.easypanel.host/workflow/7pVHQO4CcjiE20Yo
- **Total Nodos**: 14
- **Timeouts**: VEO3 (400s), Bunny (120s), Instagram (90s)

### INPUT Format
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

### OUTPUT Format

**Success (200)**:
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

**Error (500)**:
```json
{
  "success": false,
  "error": "Video generation timeout or failed",
  "taskId": "veo3-task-abc123",
  "attempts": 10
}
```

---

## ⚠️ Activación Manual Requerida

El campo `active` en n8n API es **read-only**. Para activar Workflow #3:

1. Ir a: https://n8n-n8n.6ld9pv.easypanel.host
2. Login con credenciales n8n
3. Workflows → "Fantasy La Liga - Ana VEO3 Video Generation"
4. Toggle "Active" → ON (esquina superior derecha)
5. Verificar que webhook URL aparezca como activo

---

## 🔍 Verificación Post-Activación

```bash
# Verificar estado del workflow
node scripts/n8n/verify-workflow-3.js

# Test webhook (debería retornar error si backend no está ejecutándose)
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/generate-ana-video" \
  -H "Content-Type: application/json" \
  -d '{"type":"chollo","playerData":{"name":"Test","price":5.0}}'
```

**Resultado esperado**:
- Si backend NO ejecutándose → Timeout error (esperado)
- Si backend SÍ ejecutándose → Inicio generación video

---

## 📊 Sistema de Retry

- **Polling automático**: Cada 30 segundos
- **Max intentos**: 10 (5 minutos total)
- **Loop back**: Automático si video no listo
- **Error response**: Después de 10 intentos

**Flujo completo**:
```
Generar video (400s timeout)
  ↓
Wait 6 minutos
  ↓
Poll status cada 30s (max 10x)
  ↓
Upload Bunny.net (120s timeout)
  ↓
Post Instagram (90s timeout)
  ↓
Success response
```

---

## 💰 Economía

- **Costo por video**: ~$0.31 (VEO3 $0.30 + Bunny $0.01)
- **Tiempo estimado**: 7-8 minutos por video
- **Estimación mensual**:
  - 3 videos/día = $27.90/mes
  - 5 videos/día = $46.50/mes
  - 10 videos/día = $93/mes

---

## 📁 Documentación Completa

- **Resumen ejecutivo**: `WORKFLOW_3_SUMMARY.md`
- **Documentación técnica**: `workflow-3-documentation.md`
- **Script creación**: `create-workflow-3-veo3.js`
- **Script verificación**: `verify-workflow-3.js`
- **Script activación**: `activate-workflow-3.js` (no funciona - API limitation)

---

## 🎬 Ana Character Configuration

### Character Bible (NUNCA CAMBIAR)
```
A 32-year-old Spanish sports analyst with short black curly hair styled in a
professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports
blazer with subtle La Liga branding. Confident posture, natural hand gestures for
emphasis, professional broadcaster energy.
```

### VEO3 Config
- **Modelo**: veo3_fast
- **Seed**: 30001 (fijo para consistencia)
- **Aspect ratio**: 9:16 (vertical para redes sociales)
- **Duración**: 8 segundos
- **Imagen ref**: GitHub URL (Ana-001.jpeg)

---

## 🔧 Prerequisitos

- ✅ Backend ejecutándose en `localhost:3000`
- ✅ `KIE_AI_API_KEY` en `.env`
- ✅ Bunny.net API configurada
- ✅ Instagram API configurada
- ✅ Workflow ACTIVO en n8n UI

---

## 🐛 Troubleshooting

### Workflow no inicia
- Verificar que está **ACTIVE** en n8n UI
- Verificar webhook URL correcta
- Verificar formato JSON del input

### Video generation timeout
- Backend ejecutándose en localhost:3000?
- `KIE_AI_API_KEY` configurada?
- Ver logs backend para errores VEO3

### Upload Bunny falla
- Endpoint `/api/bunny/upload` funcional?
- Credenciales Bunny.net correctas?
- Video URL de VEO3 válida?

### Instagram post falla
- Endpoint `/api/instagram/reel` funcional?
- Tokens Instagram API válidos?
- Video en formato compatible? (9:16, MP4)

---

## 📞 Soporte

- **n8n UI**: https://n8n-n8n.6ld9pv.easypanel.host
- **API Docs**: https://docs.n8n.io/api/
- **Workflow #3 ID**: `7pVHQO4CcjiE20Yo`

---

**Última actualización**: 2025-09-30
**Versión**: 1.0
**Estado**: Workflow #3 creado exitosamente, activación manual pendiente