# ✅ Workflow #2: Fantasy La Liga - Chollos Detection

## 📋 INFORMACIÓN DEL WORKFLOW

- **Workflow ID**: `YjvjMbHILQjUZjJz`
- **Workflow Name**: Fantasy La Liga - Chollos Detection
- **Estado**: ✅ **ACTIVE** (activado exitosamente)
- **Nodos totales**: 14
- **Trigger Count**: 1 (webhook configurado)
- **Fecha creación**: 2025-09-30 10:42:22 UTC

## 🔗 WEBHOOK URL

```
https://n8n-n8n.6ld9pv.easypanel.host/webhook/chollos-detected
```

**Método HTTP**: POST
**Content-Type**: application/json

## 📥 ESTRUCTURA INPUT ESPERADA

```json
{
  "chollos": [
    {
      "playerId": 162686,
      "name": "Pedri",
      "team": "Barcelona",
      "position": "MID",
      "price": 8.5,
      "valueRatio": 1.45,
      "estimatedPoints": 12.3
    },
    {
      "playerId": 47422,
      "name": "Pere Milla",
      "team": "Espanyol",
      "position": "FWD",
      "price": 4.0,
      "valueRatio": 1.25,
      "estimatedPoints": 5.0
    }
  ]
}
```

### Campos Obligatorios por Chollo:
- `playerId` (number) - ID del jugador en API-Sports
- `name` (string) - Nombre del jugador
- `team` (string) - Equipo del jugador
- `position` (string) - Posición (GK, DEF, MID, FWD)
- `price` (number) - Precio Fantasy actual
- `valueRatio` (number) - Ratio valor (puntos estimados / precio)
- `estimatedPoints` (number) - Puntos estimados próxima jornada

## 🏗️ ARQUITECTURA DEL WORKFLOW

### Nodos Principales:

1. **Webhook Chollos Trigger** - Recibe array de chollos
2. **Validate Chollos Input** - Valida que chollos array no esté vacío
3. **Loop Over Chollos** - Itera sobre cada chollo individualmente
4. **Extract Chollo Data** - Extrae datos del chollo actual
5. **GPT-5 Mini Analysis** - Genera análisis textual del chollo
   - Endpoint: `http://localhost:3000/api/content-ai/player-analysis`
6. **Generate Player Card** - Genera imagen player card
   - Endpoint: `http://localhost:3000/api/images/generate`
7. **Prepare Instagram Post** - Combina texto + imagen
8. **Instagram Post** - Publica en Instagram
   - Endpoint: `http://localhost:3000/api/instagram/post`
9. **Log Results** - Registra resultado de publicación
10. **Loop Back** - Vuelve al loop si hay más chollos
11. **Aggregate Results** - Agrega resultados de todos los chollos
12. **Format Response** - Formatea respuesta final del webhook
13. **Respond to Webhook** - Retorna resumen de publicaciones
14. **Error - Invalid Input** - Manejo de input inválido

### Flujo de Datos:

```
Webhook → Validate → Loop → Extract → GPT-5 Analysis → Image Generation
  → Prepare Post → Instagram Post → Log → Loop Back → Aggregate
  → Format Response → Respond
```

## 📤 ESTRUCTURA RESPUESTA ESPERADA

### Respuesta Exitosa:
```json
{
  "success": true,
  "totalChollos": 2,
  "successfulPosts": 2,
  "failedPosts": 0,
  "details": [
    {
      "playerName": "Pedri",
      "success": true,
      "postId": "instagram_post_id_123"
    },
    {
      "playerName": "Pere Milla",
      "success": true,
      "postId": "instagram_post_id_124"
    }
  ],
  "timestamp": "2025-09-30T10:50:00.000Z",
  "workflowName": "Fantasy La Liga - Chollos Detection"
}
```

### Respuesta Error (Input Inválido):
```json
{
  "error": true,
  "message": "Invalid input: chollos array is required and must not be empty",
  "timestamp": "2025-09-30T10:50:00.000Z"
}
```

## 🧪 COMANDO DE TEST

```bash
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/chollos-detected" \
  -H "Content-Type: application/json" \
  -d '{
    "chollos": [
      {
        "playerId": 162686,
        "name": "Pedri",
        "team": "Barcelona",
        "position": "MID",
        "price": 8.5,
        "valueRatio": 1.45,
        "estimatedPoints": 12.3
      }
    ]
  }'
```

### Test con Múltiples Chollos:

```bash
curl -X POST "https://n8n-n8n.6ld9pv.easypanel.host/webhook/chollos-detected" \
  -H "Content-Type: application/json" \
  -d '{
    "chollos": [
      {
        "playerId": 162686,
        "name": "Pedri",
        "team": "Barcelona",
        "position": "MID",
        "price": 8.5,
        "valueRatio": 1.45,
        "estimatedPoints": 12.3
      },
      {
        "playerId": 47422,
        "name": "Pere Milla",
        "team": "Espanyol",
        "position": "FWD",
        "price": 4.0,
        "valueRatio": 1.25,
        "estimatedPoints": 5.0
      },
      {
        "playerId": 190871,
        "name": "Lamine Yamal",
        "team": "Barcelona",
        "position": "FWD",
        "price": 7.0,
        "valueRatio": 1.35,
        "estimatedPoints": 9.5
      }
    ]
  }'
```

## 🔧 INTEGRACIÓN CON BACKEND LOCAL

El workflow hace llamadas a los siguientes endpoints locales:

1. **GPT-5 Mini Analysis**:
   - `POST http://localhost:3000/api/content-ai/player-analysis`
   - Genera análisis textual del chollo usando GPT-5 Mini

2. **Image Generation**:
   - `POST http://localhost:3000/api/images/generate`
   - Genera player card dinámico con Jimp

3. **Instagram Post**:
   - `POST http://localhost:3000/api/instagram/post`
   - Publica contenido en Instagram automáticamente

**⚠️ IMPORTANTE**: El backend local (`http://localhost:3000`) debe estar ejecutándose para que el workflow funcione correctamente.

## 📊 VALIDACIÓN ESTADO

```bash
# Verificar estado del workflow
curl -X GET "https://n8n-n8n.6ld9pv.easypanel.host/api/v1/workflows/YjvjMbHILQjUZjJz" \
  -H "X-N8N-API-KEY: $N8N_API_TOKEN"
```

**Estado actual verificado**:
- ✅ Workflow creado correctamente
- ✅ Webhook configurado y activo
- ✅ 14 nodos implementados según especificación
- ✅ Conexiones validadas
- ✅ Workflow activado exitosamente

## 🚀 PRÓXIMOS PASOS

1. **Test End-to-End**: Probar workflow completo con chollos reales
2. **Validar Endpoints Locales**: Asegurar que backend local responde correctamente
3. **Monitoreo**: Configurar alertas en n8n para ejecuciones fallidas
4. **Optimización**: Ajustar timeouts y manejo de errores según resultados reales

## 📝 NOTAS IMPORTANTES

- El workflow procesa chollos **secuencialmente** (uno por uno) para evitar rate limits
- Cada publicación Instagram se registra con log detallado
- El webhook responde solo después de procesar **todos** los chollos
- Manejo de errores implementado para input inválido
- Sistema de loop robusto que vuelve a procesar si hay más chollos pendientes

## ✅ VALIDACIÓN COMPLETADA

**Fecha**: 2025-09-30
**Workflow ID**: YjvjMbHILQjUZjJz
**Estado**: ACTIVE
**Resultado**: ✅ EXITOSO

---

**Creado programáticamente usando n8n API**
Script: `/scripts/create-workflow-chollos.js`