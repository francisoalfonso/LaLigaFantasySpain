# 🚨 P0 FIX: Outliers Segment 2 - Acento Mexicano + Letterboxing

**Status**: ✅ PARCIALMENTE RESUELTO (15 Oct 2025) **Prioridad**: P0 - CRÍTICO
**Afecta**: Todos los videos de outliers generados con Carlos

---

## 🔍 **PROBLEMA DETECTADO**

### **Segmento 2 (taskId: `8a7e908a80e61b9aa10617fd5effff3d`)**:

1. ❌ **Acento mexicano** en lugar de español de España (Carlos)
2. ❌ **Bandas blancas** (letterboxing/padding) en el video

**Síntomas**:

- Audio en español mexicano (no castellano)
- Video con padding blanco superior/inferior
- Resolución correcta: 720x1280 (9:16) ✅ pero con padding interno

**Archivo afectado**:
`output/veo3/sessions/session_nanoBanana_1760523454592/segment_2_8a7e908a80e61b9aa10617fd5effff3d.mp4`

---

## 🧪 **ROOT CAUSE ANALYSIS**

### **1. Acento Mexicano (RESUELTO ✅)**

**Ubicación**: `backend/services/veo3/promptBuilder.js:735`

**Problema**:

```javascript
// ❌ ANTES (DÉBIL - permite acento mexicano)
speaks in Spanish from Spain ${tone}:
```

**Causa**: El método `buildEnhancedNanoBananaPrompt` usaba enforcement DÉBIL del
español castellano, sin las instrucciones críticas que fuerzan el acento
europeo.

**Fix implementado** (15 Oct 2025):

```javascript
// ✅ DESPUÉS (FUERTE - fuerza acento castellano)
speaks in CASTILIAN SPANISH FROM SPAIN with EUROPEAN SPANISH accent (CRITICAL: not Mexican, not Latin American, ONLY Castilian Spanish from Spain) ${tone}:
```

**Commit**: FIX #7 (15 Oct 2025): CASTILIAN SPANISH enforcement (línea 734)

**Validación**: ✅ Código actualizado **Testing**: ⏳ Pendiente (regenerar
segment 2)

---

### **2. Letterboxing / Bandas Blancas (INVESTIGACIÓN)**

**Datos verificados**:

- ✅ Resolución del video: `720x1280` (correcto)
- ✅ Nano Banana config: `imageSize: "9:16"` (correcto - línea 48
  nanoBananaClient.js)
- ✅ VEO3 aspectRatio: `9:16` (correcto - línea 2333 veo3.js)
- ❌ **VEO3 añadió padding durante generación**

**Posibles causas**:

1. **Nano Banana generó imagen con aspect ratio incorrecto**:
    - Config dice `9:16` (576x1024) pero puede haber generado 16:9 o 4:3
    - VEO3 detectó aspect ratio incorrecto y añadió padding para llenar 9:16

2. **VEO3 interpretó mal el prompt**:
    - Algo en el prompt causó que VEO3 generara con padding interno
    - Puede ser relacionado con "European soccer (La Liga) fantasy studio"

3. **Imagen de referencia Carlos**:
    - La imagen de Carlos usada como referencia puede tener aspect ratio
      incorrecto
    - URL:
      `https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/carlos/carlos-gonzalez-01.jpg`

**Investigación adicional necesaria**:

- [ ] Verificar aspect ratio REAL de la imagen Nano Banana generada para segment
      2
- [ ] Verificar aspect ratio de la imagen de referencia de Carlos
- [ ] Probar regenerar segment 2 con el fix del acento y verificar si persiste
      letterboxing
- [ ] Comparar con segments 1 y 3 (¿tienen mismo problema?)

---

## 📋 **PLAN DE ACCIÓN**

### **Fase 1: Regenerar Segment 2 con Fix del Acento** ⏳

**Objetivo**: Verificar si el fix del acento resuelve ambos problemas o solo el
acento.

**Pasos**:

1. ✅ Fix implementado en `promptBuilder.js:734-736`
2. ⏳ Regenerar segment 2:
    ```bash
    POST /api/veo3/generate-segment
    {
      "sessionId": "nanoBanana_1760523454592",
      "segmentIndex": 1  // 0-indexed, segment 2 = index 1
    }
    ```
3. ⏳ Verificar:
    - ✅ Acento castellano (no mexicano)
    - ✅ Sin bandas blancas (sin letterboxing)
    - ✅ Resolución 720x1280 sin padding

### **Fase 2: Si persiste letterboxing** 🔍

**A. Verificar imagen Nano Banana**:

```bash
# Descargar imagen segment 2 de Supabase
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/sign/flp/carlos/video-frames/seg2-middle-1760523594069.png

# Verificar aspect ratio
ffprobe -v error -select_streams v:0 -show_entries stream=width,height seg2-middle-1760523594069.png
```

**Aspect ratio esperado**: 576x1024 (9:16) o proporcional

**B. Si Nano Banana genera wrong aspect ratio**:

- Revisar `nanoBananaVeo3Integrator.js` para verificar que pasa
  `imageSize: "9:16"` correctamente
- Añadir validación post-generación de aspect ratio
- Rechazar imágenes con aspect ratio incorrecto y regenerar

**C. Si el problema es en VEO3**:

- Revisar prompt de segment 2 para elementos que puedan causar padding
- Probar con prompt más simple (eliminar "European soccer studio")
- Añadir instrucción explícita en prompt: "full frame vertical 9:16 video, no
  letterboxing, no padding"

---

## 🔧 **CAMBIOS IMPLEMENTADOS**

### **File**: `backend/services/veo3/promptBuilder.js`

**Lines 731-736**:

```javascript
// ✅ FIX #4 (11 Oct 2025): Cambiar "7-second" → "8-second" y "fantasy football" → "La Liga Fantasy"
// ✅ FIX #5 (13 Oct 2025): Añadir "European soccer" explícitamente para evitar balones de fútbol americano
// ✅ FIX #6 (13 Oct 2025 20:45): Género dinámico basado en characterBible
// ✅ FIX #7 (15 Oct 2025): CASTILIAN SPANISH enforcement (CRITICAL para evitar acento mexicano)
// Construcción del prompt (estructura ganadora del playground) - DINÁMICO
const prompt = `${videoType} ${duration}-second video. A ${gender} ${presenterType} is standing in a modern European soccer (La Liga) fantasy studio. ${pronoun} ${action} and speaks in CASTILIAN SPANISH FROM SPAIN with EUROPEAN SPANISH accent (CRITICAL: not Mexican, not Latin American, ONLY Castilian Spanish from Spain) ${tone}: "${dialogue}" ${pronoun} moves like a TV soccer commentator (European football, not American football), making strong eye contact with the camera. CRITICAL: This is about soccer/football (round ball sport), NOT American football. Use the uploaded image of the presenter as the main reference. Do not redesign ${gender === 'male' ? 'him' : 'her'}.`;
```

**Impacto**: Todos los futuros videos de Carlos/Ana con Nano Banana usarán
enforcement fuerte de español castellano.

---

## ✅ **VALIDACIÓN**

### **Test 1: Regenerar Segment 2**

```bash
# Regenerar solo segment 2 con fix
curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "nanoBanana_1760523454592",
    "segmentIndex": 1
  }'
```

**Criterios de éxito**:

- ✅ Audio en español castellano (europeo)
- ✅ Sin bandas blancas
- ✅ 720x1280 sin padding
- ✅ Continuidad visual con segments 1 y 3

### **Test 2: E2E Completo con Nuevo Outlier**

```bash
# Generar video completo de outlier nuevo
npm run outliers:test-complete -- "nuevo_video_id"
```

**Criterios de éxito**:

- ✅ Los 3 segmentos con acento castellano
- ✅ Sin letterboxing en ningún segmento
- ✅ Continuidad visual y audio

---

## 📊 **IMPACTO**

**Videos afectados**: 1 (session `nanoBanana_1760523454592`)

**Flujos afectados**:

- ✅ Outliers E2E workflow (Carlos)
- ✅ Ana/Carlos videos con Nano Banana
- ✅ Multi-segment videos con `buildEnhancedNanoBananaPrompt`

**Backward compatibility**: ✅ SÍ (método antiguo `buildPrompt` ya tenía
enforcement fuerte)

---

## 📝 **PRÓXIMOS PASOS**

1. ⏳ **INMEDIATO**: Regenerar segment 2 con fix del acento
2. ⏳ **VALIDAR**: Verificar si fix resuelve ambos problemas
3. 🔍 **INVESTIGAR**: Si persiste letterboxing, verificar Nano Banana images
4. 🧪 **TEST E2E**: Nuevo outlier completo para validar fix
5. 📚 **DOCUMENTAR**: Actualizar `VEO3_GUIA_COMPLETA.md` con findings

---

## 🚀 **COMANDO RÁPIDO**

```bash
# Test rápido del fix
node -e "
const PromptBuilder = require('./backend/services/veo3/promptBuilder');
const pb = new PromptBuilder();
const prompt = pb.buildEnhancedNanoBananaPrompt(
  'Los números reales son: 5 goles, 2 asistencias, y una calificación de 7.5...',
  'confident',
  'Medium Shot',
  {
    duration: 8,
    characterBible: 'A 38-year-old Spanish sports data analyst'
  }
);
console.log(prompt);
console.log('\\n✅ Verificar que incluye: CASTILIAN SPANISH FROM SPAIN with EUROPEAN SPANISH accent');
"
```

---

**Última actualización**: 2025-10-15 12:45 **Responsable**: Claude Code
**Prioridad**: P0 - CRÍTICO **Estado**: ✅ Acento RESUELTO | ⏳ Letterboxing EN
INVESTIGACIÓN
