# VEO 3.1 - Análisis Profundo y Plan de Migración

**Fecha**: 16 Oct 2025 (Actualizado con pricing oficial KIE.ai) **Estado**:
Investigación completada + Pricing verificado **Prioridad**: P1 - Mejoras
significativas pero costo +33%

---

## 🎯 Executive Summary

VEO 3.1 fue lanzado por Google el 15 de octubre de 2025 con **mejoras
sustanciales** en:

1. ✅ **Audio nativo enriquecido** - Conversaciones naturales + efectos de
   sonido sincronizados
2. ✅ **Control de escenas avanzado** - First/last frame + scene extension
3. ✅ **3 imágenes de referencia** - Mayor consistencia de personajes
4. ✅ **Mayor adherencia a prompts** - Mejor comprensión de estilos
   cinematográficos
5. ✅ **Texturas realistas** - Mejora visual significativa

**Precio**: $0.40/8s Fast (+33%) | $2.00/8s Quality (+566%) via KIE.ai
**Disponibilidad**: KIE.ai (vía web), Gemini API, Vertex AI, Google AI Studio

---

## 📊 Comparación: VEO 3 (actual) vs VEO 3.1

| Feature                 | VEO 3 (Actual) | VEO 3.1 (Nuevo)             | Impacto para FLP                             |
| ----------------------- | -------------- | --------------------------- | -------------------------------------------- |
| **Audio nativo**        | ❌ No          | ✅ Sí (conversaciones + FX) | 🔥 **CRÍTICO** - Eliminamos TTS externa      |
| **Referencia imágenes** | ✅ 1 imagen    | ✅ Hasta 3 imágenes         | 🟡 Medio - Ya tenemos 1 imagen de Ana/Carlos |
| **First/Last frame**    | ❌ No          | ✅ Sí (transiciones suaves) | 🔥 **CRÍTICO** - Mejor frame-to-frame        |
| **Scene extension**     | ❌ No          | ✅ Sí (>1 min videos)       | 🟢 Bajo - Ya concatenamos 3 segmentos        |
| **Texturas realistas**  | ⚠️ Buenas      | ✅ Excelentes               | 🟡 Medio - Mejora calidad Ana/Carlos         |
| **Adherencia prompts**  | ⚠️ Buena       | ✅ Mejor                    | 🟡 Medio - Menos fallos Error 422            |
| **Camera controls**     | ❌ No          | ✅ Sí (framing preciso)     | 🟡 Medio - Más control cinematográfico       |
| **Aspectos ratio**      | ✅ 16:9, 9:16  | ✅ 16:9, 9:16               | ✅ Sin cambios                               |
| **Resolución**          | ✅ 720p, 1080p | ✅ 720p, 1080p              | ✅ Sin cambios                               |
| **Duración**            | ✅ 4s, 6s, 8s  | ✅ 4s, 6s, 8s               | ✅ Sin cambios                               |
| **Seed determinista**   | ✅ Sí          | ✅ Sí                       | ✅ Sin cambios                               |
| **Pricing**             | ✅ $0.30/8s    | ✅ $0.30/8s                 | ✅ Sin cambios                               |

---

## 🚀 Nuevas Capacidades VEO 3.1 (Detalle Técnico)

### 1. **Audio Nativo Enriquecido** 🔥 **GAME CHANGER**

**Problema actual (VEO 3)**:

- Generamos video mudo
- Usamos TTS externa (Google TTS API)
- Audio y video desincronizados frecuentemente
- Movimientos labiales no naturales

**Solución VEO 3.1**:

```javascript
// Audio generado NATIVAMENTE por VEO 3.1
{
  prompt: "Ana habla con emoción sobre Pere Milla...",
  generateAudio: true  // ✅ Audio sincronizado automático
}
```

**Ventajas**:

- ✅ **Audio perfectamente sincronizado** con movimientos labiales
- ✅ **Efectos de sonido** (ambiente de estudio, música de fondo)
- ✅ **Eliminación de TTS externa** (menos dependencias)
- ✅ **Conversaciones naturales** (entonación correcta)

**Implementación requerida**:

- ⚠️ Verificar si KIE.ai soporta `generateAudio: true`
- ⚠️ Si no, migrar a Gemini API o Vertex AI
- ✅ Actualizar `veo3Client.js` para incluir parámetro `generateAudio`

---

### 2. **First/Last Frame Control** 🔥 **CRÍTICO**

**Problema actual (VEO 3)**:

- Transiciones entre segmentos mediante concatenación FFmpeg
- No hay control del último frame de Segment N = primer frame de Segment N+1
- Dependemos de `cinematicProgressionSystem` para continuidad

**Solución VEO 3.1**:

```javascript
// Generar Segment 2 con first frame = last frame de Segment 1
operation = client.models.generate_videos({
    model: 'veo-3.1-generate-preview',
    prompt: segmentPrompt,
    image: lastFrameOfSegment1, // ✅ Continuidad garantizada
    config: {
        last_frame: firstFrameOfSegment3 // ✅ Transición suave
    }
});
```

**Ventajas**:

- ✅ **Transiciones invisibles** entre segmentos (mejora actual)
- ✅ **Control total** de continuidad visual
- ✅ **Eliminación de crossfades** (no necesarios)
- ✅ **Narrativa fluida** sin "saltos" visuales

**Implementación requerida**:

1. Extraer último frame de cada segmento con FFmpeg
2. Pasar como `image` al siguiente segmento
3. Actualizar `viralVideoBuilder.js` para incluir `first/last frame`

---

### 3. **3 Imágenes de Referencia** 🟡 **Mejora Incremental**

**Situación actual (VEO 3)**:

- Usamos 1 imagen de Ana/Carlos como referencia
- Nano Banana genera 3 imágenes contextualizadas
- VEO 3 usa SOLO 1 imagen contextualizada

**Solución VEO 3.1**:

```javascript
{
  prompt: "Ana habla con emoción...",
  reference_images: [
    anaImage1,  // ✅ Rostro
    anaImage2,  // ✅ Estudio TV
    anaImage3   // ✅ Logo FLP
  ]
}
```

**Ventajas**:

- ✅ **Mayor consistencia** facial
- ✅ **Mejor reconocimiento** de estilo (TV studio)
- ✅ **Logo/branding** más visible

**Implementación requerida**:

- Adaptar `nanoBananaVeo3Integrator.js` para generar 3 imágenes
- Pasar array de 3 imágenes a VEO 3.1

---

### 4. **Scene Extension** 🟢 **Bajo impacto (Ya tenemos)**

**Situación actual**:

- Generamos 3 segmentos de 8s cada uno
- Concatenamos con FFmpeg
- Resultado: 24s de video

**VEO 3.1 Scene Extension**:

```javascript
// Extender video anterior
{
  prompt: "Continuación de la narrativa...",
  video: previousVideoUri  // ✅ Extiende automáticamente
}
```

**Ventajas**:

- ✅ **Videos >60s** sin concatenación
- ✅ **Transiciones suaves** automáticas
- ⚠️ **No aplicable**: Ya tenemos 3 segmentos concatenados

**Decisión**: **NO MIGRAR** (nuestro sistema de 3 segmentos funciona bien)

---

### 5. **Camera Controls** 🟡 **Mejora cinematográfica**

**Situación actual**:

- Usamos `cinematicProgressionSystem.js` para mapear shots
- Confiamos en VEO 3 para interpretar "Close-Up", "Medium Shot"

**VEO 3.1 Camera Controls**:

```javascript
{
  prompt: "Ana en estudio TV",
  cameraControl: {
    framing: "close-up",
    movement: "static",
    angle: "eye-level"
  }
}
```

**Ventajas**:

- ✅ **Control preciso** de framing
- ✅ **Movimientos de cámara** específicos
- ✅ **Ángulos controlados**

**Implementación requerida**:

- ⚠️ Verificar si KIE.ai expone `cameraControl`
- Actualizar `cinematicProgressionSystem.js` para generar parámetros

---

## 📦 KIE.ai - Soporte VEO 3.1

### API Actual (KIE.ai)

**Endpoint**: `POST https://api.kie.ai/api/v1/veo/generate`

**Parámetros soportados**:

```javascript
{
  prompt: string,         // ✅ Soportado
  imageUrls: [string],    // ✅ Soportado (1 imagen)
  model: "veo3" | "veo3_fast",  // ✅ Soportado
  aspectRatio: "16:9" | "9:16",  // ✅ Soportado
  seeds: number (10000-99999),  // ✅ Soportado
  watermark: string,      // ✅ Soportado
  enableFallback: boolean,
  enableTranslation: boolean
}
```

**Parámetros NO documentados (VEO 3.1)**:

- ❌ `generateAudio` - **CRÍTICO**
- ❌ `reference_images` (array de 3)
- ❌ `last_frame` (first/last frame control)
- ❌ `cameraControl`
- ❌ `scene_extension`

**Acción requerida**:

1. ✅ **Contactar KIE.ai** para verificar soporte VEO 3.1
2. ⚠️ Si no soportan: **Migrar a Gemini API** o **Vertex AI**

---

## 🔄 Plan de Migración - 3 Opciones

### **Opción A: Esperar a KIE.ai** (Recomendada - Corto plazo)

**Pros**:

- ✅ Sin cambios en infraestructura
- ✅ Mismo pricing ($0.30/8s)
- ✅ API familiar

**Cons**:

- ⏳ Dependemos de roadmap KIE.ai
- ❌ No sabemos si soportarán VEO 3.1

**Timeline**: 1-2 semanas (contactar KIE.ai)

---

### **Opción B: Migrar a Gemini API** (Recomendada - Medio plazo)

**Pros**:

- ✅ **Soporte completo VEO 3.1**
- ✅ **Audio nativo** (game changer)
- ✅ **First/last frame control**
- ✅ **3 imágenes de referencia**
- ✅ **Documentación oficial**

**Cons**:

- ⚠️ **Pricing más alto**: $0.40/8s Fast (+33%) | $2.00/8s Quality (+566%)
- ⚠️ **Refactor de `veo3Client.js`** (si migramos a Gemini API directa)
- ⚠️ **Nueva autenticación** (Google Cloud - solo si migramos fuera de KIE.ai)

**Pricing comparison** (actualizado con info oficial KIE.ai):

```
Actual (KIE.ai VEO3):
- 3 segmentos × $0.30 = $0.90/video

KIE.ai VEO 3.1 Fast:
- 3 segmentos × $0.40 = $1.20/video (+33%) ⚠️

KIE.ai VEO 3.1 Quality:
- 3 segmentos × $2.00 = $6.00/video (+566%) ❌ DEMASIADO CARO
```

**Timeline**: 2-3 días (implementación + testing)

---

### **Opción C: Hybrid (KIE.ai + Gemini API)** (Experimental)

**Strategy**:

- Usar KIE.ai para generación inicial
- Usar Gemini API para audio post-procesamiento

**Pros**:

- ✅ Aprovechamos pricing KIE.ai
- ✅ Audio nativo VEO 3.1

**Cons**:

- ⚠️ Complejidad alta
- ⚠️ Doble API (más dependencias)

**Timeline**: 4-5 días

---

## 🎯 Recomendación Final

### **Fase 1 (Inmediato)**: Contactar KIE.ai

- Verificar roadmap VEO 3.1
- Preguntar por `generateAudio`, `reference_images`, `last_frame`
- Timeline: 1-2 días

### **Fase 2 (Corto plazo - si KIE.ai soporta VEO3.1)**: Migrar a VEO 3.1 Fast via KIE.ai

- **Modelo**: `veo3.1_fast` (via KIE.ai API)
- **Pricing**: $0.40/8s (+33% vs VEO3 actual) ⚠️
- **Features**: Audio nativo + Start/End Frame + Multi-Image Reference
- **Timeline**: 2-3 días (solo actualizar `veo3Client.js`)

### **Fase 2 Alternativa (si KIE.ai NO soporta)**: Migrar a Gemini API directa

- **Modelo**: `veo-3.1-fast-generate-preview`
- **Pricing**: Por confirmar (posiblemente similar a KIE.ai)
- **Features**: Audio nativo + first/last frame + 3 referencias
- **Timeline**: 1 semana (refactor completo + autenticación Google Cloud)

### **Fase 3 (Medio plazo)**: Optimizar prompts VEO 3.1

- Aprovechar mejor adherencia a prompts
- Usar camera controls
- Reducir tasa de Error 422
- **Timeline**: 1 semana

---

## 📝 Cambios Requeridos en Código

### 1. `backend/services/veo3/veo3Client.js`

**Actualización para audio nativo**:

```javascript
async generateVideo(prompt, imageUrl, config = {}) {
  const requestBody = {
    prompt,
    imageUrls: imageUrl ? [imageUrl] : undefined,
    model: config.model || 'veo3',
    aspectRatio: config.aspectRatio || '9:16',
    seeds: config.seed || this.defaultSeed,
    watermark: config.watermark || 'Fantasy La Liga Pro',

    // ✅ NUEVO - VEO 3.1
    generateAudio: true,  // ✅ Audio nativo
    referenceImages: config.referenceImages || [],  // ✅ Hasta 3 imágenes
    lastFrame: config.lastFrame || null  // ✅ First/last frame control
  };

  // ... rest of the code
}
```

### 2. `backend/services/veo3/viralVideoBuilder.js`

**Actualización para first/last frame**:

```javascript
async generateSegment(segmentIndex) {
  const segment = this.segments[segmentIndex];

  // ✅ NUEVO - Extraer último frame del segmento anterior
  let firstFrame = null;
  if (segmentIndex > 0) {
    const prevSegment = this.segments[segmentIndex - 1];
    firstFrame = await this.extractLastFrame(prevSegment.localPath);
  }

  const veo3Response = await this.veo3Client.generateVideo(
    enhancedPrompt,
    segment.imageContext.supabaseUrl,
    {
      model: this.presenter.model,
      aspectRatio: this.presenter.aspectRatio,
      seed: this.presenter.seed,
      watermark: this.presenter.waterMark,

      // ✅ NUEVO - First frame control
      firstFrame: firstFrame,

      // ✅ NUEVO - Last frame control (para penúltimo segmento)
      lastFrame: segmentIndex === this.segments.length - 2 ?
        await this.extractFirstFrame(this.segments[segmentIndex + 1].imageContext.supabaseUrl) :
        null
    }
  );
}

// ✅ NUEVO - Método para extraer frames
async extractLastFrame(videoPath) {
  const outputPath = `/tmp/last_frame_${Date.now()}.png`;
  await execPromise(
    `ffmpeg -sseof -1 -i "${videoPath}" -vframes 1 "${outputPath}"`
  );
  return outputPath;
}
```

### 3. `backend/services/veo3/nanoBananaVeo3Integrator.js`

**Actualización para 3 imágenes de referencia**:

```javascript
async generateContextualImages(segments, presenterConfig, playerName) {
  const images = [];

  for (const segment of segments) {
    // Generar 3 imágenes por segmento (rostro, estudio, logo)
    const contextImages = await Promise.all([
      this.generateImageForSegment(segment, 'face', presenterConfig),
      this.generateImageForSegment(segment, 'studio', presenterConfig),
      this.generateImageForSegment(segment, 'logo', presenterConfig)
    ]);

    images.push({
      role: segment.role,
      shot: segment.shot,
      emotion: segment.emotion,
      referenceImages: contextImages  // ✅ NUEVO - Array de 3 imágenes
    });
  }

  return images;
}
```

---

## 📊 Testing Plan

### Test 1: Audio Nativo

- Generar 1 segmento con `generateAudio: true`
- Verificar sincronización labios-audio
- Comparar con TTS externa

### Test 2: First/Last Frame

- Generar 2 segmentos consecutivos con frame control
- Verificar transición invisible
- Comparar con concatenación actual

### Test 3: 3 Imágenes de Referencia

- Generar 1 segmento con 3 imágenes (rostro, estudio, logo)
- Verificar consistencia facial
- Comparar con 1 imagen actual

### Test 4: Pricing

- Calcular costo real VEO 3.1 Fast
- Comparar con KIE.ai
- Proyectar costo mensual (20 videos)

---

## 💰 Cost Analysis

### Actual (KIE.ai VEO3)

```
3 segmentos × 8s × $0.30/8s = $0.90/video
20 videos/mes × $0.90 = $18/mes
```

### VEO 3.1 Standard (Gemini API)

```
3 segmentos × 8s × $0.40/8s = $1.20/video (+33%)
20 videos/mes × $1.20 = $24/mes (+$6)
```

### VEO 3.1 Fast (KIE.ai según web oficial) ⚠️ **ACTUALIZADO**

```
3 segmentos × 8s × $0.40/8s = $1.20/video (+33%)
20 videos/mes × $1.20 = $24/mes (+$6)
```

**Incremento anual**: +$72/año (+33%)

**NOTA**: Pricing de KIE.ai web oficial es $0.40/video Fast, NO $0.15 como
indicaban fuentes previas.

---

## 🎯 Próximos Pasos (Prioridad)

### P0 - Inmediato (Hoy)

- [ ] **Contactar KIE.ai** - Verificar roadmap VEO 3.1
- [ ] **Leer docs Gemini API** - Preparar migración

### P1 - Corto plazo (1-2 semanas)

- [ ] **Implementar Gemini API Fast** - Si KIE.ai no soporta
- [ ] **Test audio nativo** - Verificar calidad
- [ ] **Test first/last frame** - Comparar transiciones

### P2 - Medio plazo (3-4 semanas)

- [ ] **Optimizar prompts VEO 3.1** - Mejor adherencia
- [ ] **Implementar 3 imágenes de referencia** - Mayor consistencia
- [ ] **A/B testing** - VEO 3 vs VEO 3.1

---

## 📚 Referencias

- [Google Developers Blog - VEO 3.1 Announcement](https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/)
- [Vertex AI - VEO Video Generation API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation)
- [KIE.ai - VEO3 API Docs](https://docs.kie.ai/veo3-api/generate-veo-3-video)
- [Google AI Blog - VEO Updates in Flow](https://blog.google/technology/ai/veo-updates-flow/)

---

**Última actualización**: 16 Oct 2025 22:30 **Mantenido por**: Claude Code
**Status**: ✅ Investigación completada + Pricing verificado + Test fallido
veo3_fast

---

## 📋 ADDENDUM 1: Test VEO3 Current Version (16 Oct 2025 22:22)

### Test Ejecutado

```bash
npm run veo3:test-version
```

**Objetivo**: Verificar si `veo3_fast` ya incluye mejoras de VEO 3.1 (audio
nativo, multi-imagen).

### Resultado: ❌ VIDEO FALLÓ

**TaskId**: `2486ff6e30646ce257a14834e9a758dc` **Estado final**: `"failed"` (sin
errorCode ni errorMessage específico) **Duración**: ~7 minutos de polling (60+
intentos)

**Configuración del test**:

```javascript
{
  model: 'veo3_fast',
  imageUrl: 'https://ixfowlkuypnfbrwawxlx.supabase.co/.../ana-peinido2-03.png',
  aspectRatio: '9:16',
  watermark: 'Fantasy La Liga Pro',
  enableTranslation: false,
  prompt: 'Ana, una analista deportiva española de 32 años con pelo negro rizado,
           habla en español de España: "Hola Misters, este es un test rápido de
           Fantasy La Liga." La persona de la imagen de referencia habla en español
           de España.'
}
```

### Análisis del Fallo

**Posibles causas**:

1. ✅ **VEO 3.1 activado con validaciones más estrictas** - Prompt demasiado
   corto (12 palabras)
2. ⚠️ **Problema temporal de KIE.ai API** - Fallo aleatorio
3. ⚠️ **Cambios en parámetros requeridos** - VEO 3.1 requiere nuevos parámetros

**Evidencia de VEO 3.1 activo**:

- Según documentación de KIE.ai: `veo3_fast` = VEO 3.1 Fast
- Multi-imagen soportado (1-2 imágenes)
- No se probó multi-imagen ni audio nativo (video falló en generación inicial)

### Conclusiones

1. ❌ **No podemos confirmar si audio nativo está activo** - Video falló antes
   de completar
2. ❌ **No se probó multi-imagen** - Video falló en test inicial (1 imagen)
3. ⚠️ **Posible validación más estricta de prompts** - VEO 3.1 puede requerir
   prompts más largos
4. ✅ **Documentación de KIE.ai confirma VEO 3.1** - `veo3_fast` = VEO 3.1 Fast

### Próximos Pasos

1. ⏳ **Esperar 24h para estabilización de KIE.ai** (hasta 17 Oct 2025)
2. **Retry con prompt más largo** (40-45 palabras, como sistema actual)
3. **Test multi-imagen** (2 referencias)
4. **Contactar KIE.ai si persiste** - Verificar causas de fallo y requisitos VEO
   3.1

### Decisión: Esperar Estabilización

**Fecha**: 16 Oct 2025 22:30 **Decisión de**: Fran **Razón**: Darle 24h a KIE.ai
para estabilizar VEO 3.1 (modelo recién lanzado) **Próximo test**: 17 Oct 2025

---

## 📋 ADDENDUM 2: Verificación Pricing KIE.ai (16 Oct 2025)

Según web oficial KIE.ai (https://kie.ai/veo-3-1):

- VEO 3.1 Fast: **$0.40/video** (no $0.15 como fuentes previas)
- VEO 3.1 Quality: **$2.00/video**

**Impacto en costos FLP**:

```
Actual (VEO3 Fast):     $18/mes (20 videos)
VEO 3.1 Fast:           $24/mes (+$6/mes, +33%)
VEO 3.1 Quality:        $120/mes (+$102/mes, +566%) ❌ NO VIABLE
```

**Recomendación actualizada**:

- Contactar KIE.ai para confirmar si soportarán VEO 3.1
- Evaluar si +$6/mes justifica audio nativo + Start/End Frame
- Considerar migración solo si audio nativo elimina bugs de TTS
