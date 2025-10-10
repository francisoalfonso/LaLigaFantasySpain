# KIE.ai VEO3 API - Documentación Oficial

**Fuente**: https://docs.kie.ai/veo3-api/generate-veo-3-video
**Fecha descarga**: 2025-10-04
**Última actualización**: 2025-10-04

---

## 🔑 Autenticación

**Bearer Token** obtenido desde: https://kie.ai/api-key

```bash
Authorization: Bearer YOUR_API_KEY_HERE
```

---

## 📡 Endpoint Principal

### POST /api/v1/veo/generate
**URL completa**: `https://api.kie.ai/api/v1/veo/generate`

Genera videos usando los modelos Veo 3 de Google (calidad) o Veo 3 Fast.

---

## 📋 Parámetros de Request

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `prompt` | string | ✅ **Sí** | Descripción detallada del contenido del video. Debe ser específica. |
| `imageUrls` | array | ❌ No | Array de URLs de imágenes para image-to-video. **Solo 1 imagen soportada actualmente**. |
| `model` | string | ❌ No | `"veo3"` (calidad) o `"veo3_fast"` (rápido). Default: `"veo3"` |
| `aspectRatio` | string | ❌ No | `"16:9"` (landscape), `"9:16"` (portrait), `"Auto"`. Default: `"16:9"`. Solo 16:9 soporta 1080P HD. |
| `seeds` | integer | ❌ No | Valor entre 10000-99999. Controla aleatoriedad del contenido. Mismo seed genera contenido similar. |
| `callBackUrl` | string | ❌ No | URL para recibir actualizaciones de estado de generación. **Recomendado para producción**. |
| `enableFallback` | boolean | ❌ No | Habilita modelo de respaldo si falla la generación. Default: `false` |
| `enableTranslation` | boolean | ❌ No | Traduce automáticamente prompt a inglés. Default: `true` |
| `watermark` | string | ❌ No | Texto a agregar como marca de agua en el video. |

---

## ⚠️ IMPORTANTE - Parámetros NO Soportados

La API de KIE.ai VEO3 **NO incluye** los siguientes parámetros:

- ❌ **`voice`** - No existe objeto de configuración de voz
- ❌ **`voice.locale`** - Control de idioma/acento NO disponible vía API
- ❌ **`voice.gender`** - NO disponible
- ❌ **`voice.style`** - NO disponible
- ❌ **`duration`** - NO configurable (videos generados tienen duración fija)

### 🔧 Implicaciones para Nuestro Código

**Problema identificado**: En `veo3Client.js` líneas 137-141 enviamos:
```javascript
voice: {
    locale: process.env.ANA_VOICE_LOCALE || 'es-ES',
    gender: process.env.ANA_VOICE_GENDER || 'female',
    style: process.env.ANA_VOICE_STYLE || 'professional'
}
```

**Realidad**: La API **ignora completamente** estos parámetros porque no existen en la especificación oficial.

**Solución aplicada**: Controlar idioma/acento mediante el **texto del prompt**:
- ✅ `"CASTILIAN SPANISH FROM SPAIN (España peninsular accent, NOT Mexican or Latin American)"`
- Ver `promptBuilder.js` líneas 160 y 175
- Documentado en `NORMAS_DESARROLLO_IMPRESCINDIBLES.md` NORMA #3

---

## 📤 Request Example

```json
{
  "prompt": "A dog playing in a park",
  "imageUrls": ["http://example.com/image1.jpg"],
  "model": "veo3",
  "aspectRatio": "16:9",
  "seeds": 30001,
  "watermark": "Fantasy La Liga Pro"
}
```

---

## 📥 Response Example

### Success Response (200)

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "veo_task_abcdef123456"
  }
}
```

### Error Response

```json
{
  "code": 400,
  "msg": "Invalid parameter: imageUrls must be valid URLs",
  "data": null
}
```

---

## 🔍 Obtener Estado de Generación

### GET /api/v1/veo/record-info

**Parámetro**: `taskId` (query string)

```bash
GET https://api.kie.ai/api/v1/veo/record-info?taskId=veo_task_abcdef123456
```

**Response** (cuando completado):
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "veo_task_abcdef123456",
    "status": "completed",
    "resultUrls": [
      "https://cdn.kie.ai/videos/video_id_here.mp4"
    ],
    "duration": 8.5,
    "createdAt": "2025-10-04T14:00:00Z"
  }
}
```

**Estados posibles**:
- `"pending"` - En cola
- `"processing"` - Generando
- `"completed"` - Finalizado exitosamente
- `"failed"` - Error en generación

---

## 📥 Descargar Video 1080P

### GET /api/v1/veo/get-1080p-video

**Parámetro**: `taskId` (query string)

**Nota**: Solo disponible para videos con `aspectRatio: "16:9"`

---

## 🎨 Image-to-Video (Image Conditioning)

VEO3 soporta **image-to-video** mediante el parámetro `imageUrls`:

```json
{
  "prompt": "The person in the reference image speaking in Spanish...",
  "imageUrls": ["https://example.com/ana-reference.jpg"],
  "model": "veo3_fast",
  "aspectRatio": "9:16"
}
```

**Limitaciones**:
- ✅ Solo **1 imagen** soportada actualmente
- ✅ Imagen debe ser URL pública accesible
- ✅ Formatos: JPG, PNG
- ⚠️ **NO HAY parámetro de "peso" de imagen** - la imagen se usa al 100%

### 🔗 Frame-to-Frame Continuity

Para continuidad entre segmentos:

1. Generar Segmento 1 con `imageUrls: [ana_base_image]`
2. Esperar completar
3. Descargar video Segmento 1
4. Extraer último frame con FFmpeg (ver `frameExtractor.js`)
5. Subir frame a servidor público
6. Generar Segmento 2 con `imageUrls: [last_frame_url]`

**Implementado en**: `veo3Client.js` método `generateWithContinuity()` líneas 675-705

---

## 💰 Pricing (Octubre 2025)

- **Veo 3 Quality**: $0.40/video (8s)
- **Veo 3 Fast**: $0.30/video (8s)

**Plan actual**: Veo 3 Fast ($0.30/video)

---

## ⚡ Rate Limiting

**No especificado en documentación oficial**

**Observado en práctica**:
- ~10 requests/minuto
- Usar delays de 6 segundos entre requests (implementado en `veo3Client.js`)

---

## 🔧 Mejores Prácticas (según docs)

1. **Prompts detallados**: "Should be detailed and specific in describing video content"
2. **Callbacks para producción**: Usar `callBackUrl` en lugar de polling
3. **Fallback habilitado**: `enableFallback: true` para mayor confiabilidad
4. **Seeds consistentes**: Usar mismo seed para resultados similares (Ana: 30001)
5. **Image URLs válidas**: Asegurar URLs públicas y accesibles

---

## 📝 Notas de Implementación en Nuestro Código

### ✅ Correcto
- `seeds: 30001` (Ana consistency)
- `aspectRatio: "9:16"` (Instagram Reels)
- `model: "veo3_fast"` (balance calidad/costo)
- `imageUrls: [ana_reference]` (image-to-video)
- `watermark: "Fantasy La Liga Pro"`

### ❌ Innecesario (API ignora)
- `voice: { locale, gender, style }` - NO existe en API
- `duration: 8` - NO configurable (siempre ~8s)
- `referenceImageWeight: 1.0` - NO existe en API
- `characterConsistency: true` - NO existe en API

### 🔧 A Implementar
- `callBackUrl` para production (actualmente polling)
- `enableFallback: true` para mayor confiabilidad

---

**Última actualización**: 2025-10-04 16:30
**Responsable**: Claude Code AI
**Fuente oficial**: https://docs.kie.ai/veo3-api/generate-veo-3-video
