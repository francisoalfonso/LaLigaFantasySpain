# 🔍 Análisis Completo: Test #49 Nano Banana + VEO3

**Fecha**: 2025-10-10 **Propósito**: Documentar hallazgos del Test #49 SIN
modificar sistemas validados **Estado**: ⚠️ ANÁLISIS - NO IMPLEMENTAR SIN
APROBACIÓN

---

## 📋 Resumen Ejecutivo

El Test #49 fue un experimento para validar **Nano Banana → VEO3** con imágenes
en Supabase Storage. Se descubrieron 4 problemas críticos que requieren revisión
antes de implementar soluciones.

**CRÍTICO**: El sistema completo con `ThreeSegmentGenerator`,
`UnifiedScriptGenerator`, `PromptBuilder` y diccionario **YA ESTABA VALIDADO**.
Este test usó prompts simples experimentales.

**⚠️ DESCUBRIMIENTO ADICIONAL**: El flujo correcto **APROBADO** era:

1. `UnifiedScriptGenerator` → Guión profesional dividido en 3 segmentos
2. `Nano Banana` → Genera 3 imágenes BASADAS EN cada segmento del guión
3. `VEO3` → Usa cada imagen como referencia para su segmento

**Estado Actual**: El `nanoBananaVeo3Integrator.js` NO recibe el guión. Solo
genera imágenes genéricas sin contexto del script. **Requiere implementación
completa**.

---

## ✅ Sistema Validado (NO TOCAR)

### Endpoint: `/api/veo3/generate-multi-segment`

**Ubicación**: `backend/routes/veo3.js` líneas 247-262

**Componentes**:

```javascript
// 1. Validación de diccionario (líneas 72-74)
dictionaryData = await validateAndPrepare(playerData.name, playerData.team);

// 2. Generación de estructura viral (líneas 85-93)
const structure = multiSegmentGenerator.generateThreeSegments(
    contentType,
    playerData,
    viralData,
    { preset, ...options }
);

// 3. Generación secuencial VEO3 con retry (líneas 116-222)
for (let i = 0; i < structure.generationOrder.length; i++) {
    const videoResult = await veo3Client.generateCompleteVideo(
        segment.prompt,
        veo3Options
    );
}

// 4. Concatenación con logo outro (líneas 234-261)
const outputPath = await concatenator.concatenateVideos(localPaths, {
    outro: { enabled: true }
});
```

**Estado**: ✅ **VALIDADO Y FUNCIONANDO** - NO MODIFICAR

**Características**:

- ✅ Usa `UnifiedScriptGenerator` para guiones cohesivos
- ✅ Usa `PromptBuilder` con framework viral
- ✅ Valida diccionario de jugadores
- ✅ Sistema de retry inteligente
- ✅ Concatenación automática con logo
- ✅ Transiciones frame-to-frame

---

## ⚠️ Test Experimental #49

### Script: `scripts/nanoBanana/test-veo3-with-existing-images.js`

**Propósito**: Validar integración Nano Banana (imágenes) → VEO3 (videos)

**Diferencias con Sistema Validado**:

| Aspecto           | Sistema Validado                | Test #49              |
| ----------------- | ------------------------------- | --------------------- |
| **Guiones**       | UnifiedScriptGenerator          | Diálogos hardcodeados |
| **Prompts**       | PromptBuilder + viral framework | Prompts simples       |
| **Diccionario**   | Validación automática           | ❌ NO usa diccionario |
| **Retry**         | Sistema inteligente con cooling | ❌ NO tiene retry     |
| **Concatenación** | Automática con logo             | Manual después        |

**Código del Test** (líneas 64-86):

```javascript
const images = [
    {
        shot: 'wide',
        dialogue: '¡Tengo un chollo brutal para la próxima jornada!', // ❌ Hardcoded
        supabaseUrl: 'https://ixfowlkuypnfbrwawxlx.supabase.co/...'
    }
    // ...
];

// Línea 104: Prompt simple (NO usa PromptBuilder)
const prompt = `The person from the reference image speaks in Spanish from Spain: "${segment.dialogue}". Maintain the exact appearance and style from the reference image.`;
```

**Conclusión**: ⚠️ **EXPERIMENTAL** - No representa el sistema completo

---

## 🐛 Problemas Detectados

### Problema #1: Nano Banana NO Recibe el Guión Profesional

**Estado**: 🔴 **CRÍTICO - Flujo Incompleto**

**Análisis**:

El flujo correcto **YA APROBADO** es:

```
1. UnifiedScriptGenerator
   ↓
   Genera guión profesional cohesivo dividido en 3 segmentos
   Cada segmento tiene: diálogo específico, emoción, contexto
   ↓
2. Nano Banana
   ↓
   Genera 3 imágenes BASADAS EN cada segmento del guión
   Prompt de imagen incluye: contexto del segmento, emoción, acción específica
   ↓
3. VEO3
   ↓
   Usa cada imagen como referencia inicial
   Mantiene continuidad visual + audio del guión
```

**Estado Actual**:

El `nanoBananaVeo3Integrator.js` (líneas 72-79) hace esto:

```javascript
async generateImagesForVeo3(options = {}) {
    // 1. Generar 3 imágenes con Nano Banana
    const nanoBananaImages = await this.nanoBananaClient.generateAnaProgression(options);
    // ...
}
```

**Problema**:

- ❌ NO recibe el guión de `UnifiedScriptGenerator`
- ❌ NO recibe los 3 segmentos con diálogos/emociones/contexto
- ❌ Genera imágenes **genéricas** (Wide, Medium, Close-up) sin contexto
- ❌ NO hay conexión entre el script profesional y las imágenes

**Ejemplo de lo que debería recibir**:

```javascript
// Segmento 1 (Hook)
{
  dialogue: "¡Pere Milla ha marcado 2 goles en los últimos 3 partidos!",
  emotion: "excitement",
  visualContext: "Ana con expresión sorprendida y emocionada",
  shot: "wide"
}

// Segmento 2 (Development)
{
  dialogue: "Su ratio calidad-precio de 1.42 es brutal para solo 6 millones",
  emotion: "intrigue",
  visualContext: "Ana analizando datos con expresión concentrada",
  shot: "medium"
}

// Segmento 3 (CTA)
{
  dialogue: "No lo dejes escapar. ¡Fichalo antes de que suba de precio!",
  emotion: "urgency",
  visualContext: "Ana apuntando a cámara con urgencia",
  shot: "close-up"
}
```

**Solución Propuesta**:

1. **Modificar `nanoBananaVeo3Integrator.js`** para recibir los 3 segmentos del
   script:

```javascript
async generateImagesForVeo3(scriptSegments, options = {}) {
    // scriptSegments = array de 3 segmentos con dialogue, emotion, visualContext

    const processedImages = [];

    for (let i = 0; i < scriptSegments.length; i++) {
        const segment = scriptSegments[i];

        // Construir prompt contextualizado para Nano Banana
        const imagePrompt = this.buildContextualImagePrompt(segment);

        // Generar imagen específica para este segmento
        const nanoImage = await this.nanoBananaClient.generateWithPrompt(imagePrompt);

        // Procesar y subir a Supabase
        // ...
    }
}
```

2. **Nuevo método** en `nanoBananaClient.js`:

```javascript
async generateWithPrompt(customPrompt) {
    // Usar prompt personalizado que incluya:
    // - Contexto del segmento
    // - Emoción específica
    // - Acción/gesto de Ana
}
```

**Estado**: 🔴 **NO IMPLEMENTADO** - Requiere desarrollo completo

---

### Problema #2: Video Sin Audio

**Video Afectado**: `90514b7bf3b9327575bfe9463f297806`

**Evidencia de la API**:

```json
{
    "taskId": "90514b7bf3b9327575bfe9463f297806",
    "status": "completed",
    "hasAudioList": [false], // ⚠️ VEO3 generó sin audio
    "videoUrl": "https://..."
}
```

**Análisis**:

- ✅ El prompt incluía "speaks in Spanish from Spain"
- ✅ El diálogo estaba presente: "¡Tengo un chollo brutal..."
- ❌ VEO3 API confirmó `hasAudioList: [false]`
- ❌ No es problema de procesamiento local

**Posibles Causas**:

1. **Imagen de Supabase no accesible**: VEO3 no pudo descargar la imagen de
   referencia
2. **Primer segmento**: Posible bug en VEO3 con primer video de secuencia
3. **Limitación image-to-video**: VEO3 puede tener limitaciones con imágenes
   externas

**Estado**: 🔴 **NO RESUELTO** - Requiere investigación adicional

---

### Problema #2: Audio en Inglés

**Video Afectado**: `46cd45b2567f9d7212a58c50bb0a1dbc`

**Evidencia**:

```json
// Prompt original enviado:
"The person from the reference image speaks in Spanish from Spain: \"Por solo 6 millones, es la mejor inversión que puedes hacer. ¡No lo dejes escapar!\". Maintain the exact appearance and style from the reference image."

// Prompt después de "traducción" por KIE.ai:
"\"Por solo 6 millones, es la mejor inversión que puedes hacer. ¡No lo dejes escapar!\""
```

**Root Cause Identificado**:

**Archivo**: `backend/services/veo3/veo3Client.js` línea 90

```javascript
enableTranslation: options.enableTranslation !== false,  // ❌ BUG
```

**Qué hace `enableTranslation: true`**:

- KIE.ai "traduce" el prompt
- Elimina la instrucción "speaks in Spanish from Spain"
- VEO3 genera audio en inglés por defecto

**Solución Propuesta** (NO IMPLEMENTADA):

```javascript
enableTranslation: false,  // Nunca traducir - rompe instrucción de idioma
```

**Impacto**:

- ⚠️ Afecta TODOS los prompts de VEO3
- ⚠️ Puede haber razón histórica para tenerlo en `true`
- ⚠️ Necesita testing completo antes de cambiar

**Estado**: 🟡 **SOLUCIÓN IDENTIFICADA** - Requiere aprobación para implementar

---

### Problema #3: VEO3 No Puede Acceder a Supabase Storage

**Evidencia**:

Durante pruebas adicionales, VEO3 falló al intentar acceder a imágenes de
Supabase:

```json
{
    "code": 500,
    "msg": "Task generation failed",
    "data": {
        "errorMessage": "Image fetch failed. Check access settings or use our File Upload API instead."
    }
}
```

**Imágenes Usadas**:

```
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg1-wide-1760097275312.png
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg2-medium-1760097276265.png
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/video-frames/seg3-close-up-1760097277647.png
```

**Análisis**:

- ✅ URLs accesibles desde navegador
- ✅ Bucket configurado como público
- ❌ VEO3/KIE.ai API no puede descargar las imágenes

**Posibles Soluciones**:

1. **Signed URLs de Supabase** (con expiración larga):

```javascript
const { data, error } = await supabase.storage
    .from('ana-images')
    .createSignedUrl('video-frames/seg1-wide.png', 3600); // 1 hora
```

2. **GitHub Raw** (método anterior que funcionaba):

```
https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg
```

3. **File Upload API de KIE.ai**:

```javascript
// Subir imagen a KIE.ai primero
const uploadResult = await kieClient.uploadFile(imageBuffer);
// Usar el fileId de KIE.ai en lugar de URL
```

4. **CDN Público** (Cloudflare, Vercel, etc.)

**Estado**: 🔴 **NO RESUELTO** - Requiere decisión arquitectónica

---

## 🔍 Comparación: Sistema Validado vs Test #49

### Flujo del Sistema Validado

```
Usuario → /api/veo3/generate-multi-segment
           ↓
        Dictionary Validation (playerNameOptimizer)
           ↓
        ThreeSegmentGenerator (3 segmentos con emociones)
           ↓
        UnifiedScriptGenerator (guión viral cohesivo)
           ↓
        PromptBuilder (framework viral + genéricos)
           ↓
        VEO3Client (generación con retry inteligente)
           ↓
        VideoConcatenator (concatenar + logo outro)
           ↓
        Video Final Listo
```

**Características**:

- ✅ Validación de diccionario para éxito de jugadores
- ✅ Arco emocional cohesivo (hook → tensión → resolución)
- ✅ Framework viral (18 emociones, 4 algoritmos)
- ✅ Referencias genéricas ("el jugador", "el centrocampista")
- ✅ Sistema de retry con cooling periods
- ✅ Concatenación automática

### Flujo del Test #49

```
Script → Imágenes Nano Banana (Supabase)
          ↓
       Diálogos Hardcodeados
          ↓
       Prompts Simples (sin framework)
          ↓
       VEO3Client (directo, sin retry)
          ↓
       3 Videos Separados
```

**Diferencias**:

- ❌ NO usa diccionario
- ❌ NO usa UnifiedScriptGenerator
- ❌ NO usa PromptBuilder
- ❌ NO usa framework viral
- ❌ NO tiene retry inteligente
- ❌ Concatenación manual posterior

---

## 📊 Tabla de Hallazgos

| Hallazgo                                    | Ubicación                     | Estado          | Acción Recomendada              |
| ------------------------------------------- | ----------------------------- | --------------- | ------------------------------- |
| **Nano Banana NO recibe guión profesional** | `nanoBananaVeo3Integrator.js` | 🔴 CRÍTICO      | Implementar flujo Script→Images |
| **enableTranslation: true** causa inglés    | `veo3Client.js:90`            | 🟡 Identificado | Cambiar a `false` + testing E2E |
| **VEO3 audio faltante**                     | Test #49 seg1                 | 🔴 Investigar   | Relacionar con acceso Supabase  |
| **Supabase no accesible**                   | Imágenes públicas             | 🔴 Investigar   | Probar signed URLs o GitHub Raw |
| **Test #49 no usa sistema completo**        | Script experimental           | ✅ Documentado  | Usar endpoint validado          |

---

## 💡 Recomendaciones (Requieren Aprobación)

### Recomendación #0: Implementar Flujo Script→Images (PRIORIDAD MÁXIMA)

**Estado**: 🔴 **CRÍTICO - Flujo Aprobado Sin Implementar**

**Objetivo**: Conectar `UnifiedScriptGenerator` → `Nano Banana` → `VEO3` con
contexto completo

**Archivos a Modificar**:

#### 1. `backend/services/veo3/nanoBananaVeo3Integrator.js`

**Cambios**:

```javascript
/**
 * Generar 3 imágenes contextualizadas basadas en el guión profesional
 * @param {Array} scriptSegments - Array de 3 segmentos del UnifiedScriptGenerator
 * @param {object} options - Opciones adicionales
 * @returns {Promise<Array>} - Array de 3 objetos con URLs de Supabase
 */
async generateImagesFromScript(scriptSegments, options = {}) {
    try {
        logger.info('[NanoBananaVeo3Integrator] 🎨 Generando 3 imágenes contextualizadas...');

        if (!scriptSegments || scriptSegments.length !== 3) {
            throw new Error('Se requieren exactamente 3 segmentos del script');
        }

        const processedImages = [];

        for (let i = 0; i < scriptSegments.length; i++) {
            const segment = scriptSegments[i];

            logger.info(`[NanoBananaVeo3Integrator] 🖼️  Generando imagen ${i + 1}/3 (${segment.role})...`);

            // Construir prompt contextualizado para Nano Banana
            const imagePrompt = this.buildContextualImagePrompt(segment);

            logger.info(`[NanoBananaVeo3Integrator] 📝 Prompt: "${imagePrompt.substring(0, 100)}..."`);

            // Generar imagen con Nano Banana usando el contexto del segmento
            const nanoImage = await this.nanoBananaClient.generateContextualImage(
                imagePrompt,
                segment.cinematography.shot, // wide, medium, close-up
                options
            );

            // Descargar y subir a Supabase
            const fileName = `ana-${segment.role}-${Date.now()}.png`;
            const localPath = await this.downloadImage(nanoImage.url, fileName);

            const segmentName = `seg${i + 1}-${segment.role}`;
            const supabaseUrl = await supabaseFrameUploader.uploadFrame(localPath, segmentName);

            fs.unlinkSync(localPath); // Limpiar archivo local

            processedImages.push({
                index: i + 1,
                role: segment.role,
                shot: segment.cinematography.shot,
                emotion: segment.emotion,
                dialogue: segment.dialogue,
                visualContext: segment.visualContext,
                supabaseUrl: supabaseUrl,
                generatedAt: new Date().toISOString()
            });

            logger.info(`[NanoBananaVeo3Integrator] ✅ Imagen ${i + 1} procesada: ${supabaseUrl.substring(0, 80)}...`);
        }

        return {
            images: processedImages,
            metadata: {
                cost_usd: processedImages.length * 0.02,
                processedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        logger.error('[NanoBananaVeo3Integrator] ❌ Error generando imágenes:', error);
        throw error;
    }
}

/**
 * Construir prompt contextualizado para Nano Banana
 * @param {object} segment - Segmento del UnifiedScriptGenerator
 * @returns {string} - Prompt para Nano Banana
 */
buildContextualImagePrompt(segment) {
    // Base: Ana character
    let prompt = "Ana, 32-year-old Spanish sports analyst with short black curly hair in professional ponytail, ";
    prompt += "warm brown eyes, athletic build, navy blue blazer with La Liga branding. ";

    // Contexto emocional del segmento
    const emotionMap = {
        excitement: "excited expression with wide smile and raised eyebrows",
        intrigue: "focused analytical expression looking at data",
        urgency: "pointing at camera with urgent expression",
        confidence: "confident smile with direct eye contact",
        surprise: "surprised expression with open mouth",
        // ... otras emociones
    };

    prompt += emotionMap[segment.emotion] || "professional expression";
    prompt += ". ";

    // Shot type
    prompt += `${segment.cinematography.shot} shot. `;

    // Contexto visual específico del segmento
    if (segment.visualContext) {
        prompt += segment.visualContext;
    }

    return prompt;
}
```

#### 2. `backend/services/nanoBanana/nanoBananaClient.js`

**Nuevo Método**:

```javascript
/**
 * Generar imagen contextualizada con prompt personalizado
 * @param {string} customPrompt - Prompt con contexto del segmento
 * @param {string} shotType - wide, medium, close-up
 * @param {object} options - Opciones adicionales
 * @returns {Promise<object>} - Imagen generada
 */
async generateContextualImage(customPrompt, shotType, options = {}) {
    try {
        logger.info(`[NanoBananaClient] 🎨 Generando imagen contextualizada (${shotType})...`);

        const payload = {
            model: 'google/nano-banana-edit',
            prompt: customPrompt,
            width: 576,
            height: 1024,
            num_outputs: 1,
            output_format: 'png',
            seed: options.seed || null
        };

        const response = await axios.post(
            'https://api.kie.ai/v1/image/generations',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        if (response.data.code !== 200) {
            throw new Error(`Nano Banana error: ${response.data.msg}`);
        }

        const imageUrl = response.data.data.output[0];

        logger.info(`[NanoBananaClient] ✅ Imagen generada: ${imageUrl.substring(0, 80)}...`);

        return {
            url: imageUrl,
            shot: shotType,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        logger.error('[NanoBananaClient] ❌ Error generando imagen:', error);
        throw error;
    }
}
```

#### 3. `backend/routes/veo3.js`

**Nuevo Endpoint** (o modificar `/api/veo3/generate-multi-segment`):

```javascript
router.post('/generate-with-nano-banana', async (req, res) => {
    try {
        const { playerData, contentType, options } = req.body;

        // 1. Validar diccionario
        const dictionaryData = await validateAndPrepare(
            playerData.name,
            playerData.team
        );

        // 2. Generar estructura con UnifiedScriptGenerator
        const structure = multiSegmentGenerator.generateThreeSegments(
            contentType,
            playerData,
            viralData,
            options
        );

        // ✅ 3. Generar imágenes Nano Banana BASADAS EN el guión
        logger.info(
            '[VEO3 Routes] 🎨 Generando imágenes Nano Banana con contexto del guión...'
        );

        const imagesResult =
            await nanoBananaVeo3Integrator.generateImagesFromScript(
                structure.segments,
                options
            );

        // 4. Generar videos VEO3 usando imágenes como referencia
        const videoSegments = [];

        for (let i = 0; i < structure.generationOrder.length; i++) {
            const segmentKey = structure.generationOrder[i];
            const segment = structure.segments[segmentKey];
            const image = imagesResult.images[i];

            const videoResult = await veo3Client.generateCompleteVideo(
                segment.prompt,
                {
                    imageUrl: image.supabaseUrl, // ✅ Imagen contextualizada
                    model: 'veo3_fast',
                    aspectRatio: '9:16',
                    enableTranslation: false // ✅ FIX
                }
            );

            // Descargar video
            const videoPath = path.join(
                sessionDir,
                `seg${i + 1}-${segment.role}.mp4`
            );
            await veo3Client.downloadVideo(videoResult.url, videoPath);

            videoSegments.push(videoPath);
        }

        // 5. Concatenar con logo outro
        const finalVideo = await concatenator.concatenateVideos(videoSegments, {
            outro: { enabled: true }
        });

        res.json({
            success: true,
            data: {
                sessionId,
                finalVideo,
                structure,
                images: imagesResult.images
            }
        });
    } catch (error) {
        logger.error('[VEO3 Routes] ❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**Testing Plan**:

```bash
# Test E2E completo
curl -X POST http://localhost:3000/api/veo3/generate-with-nano-banana \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {
      "name": "Pere Milla",
      "team": "Espanyol",
      "price": 6.64,
      "stats": { "goals": 3, "assists": 0, "games": 6, "rating": 7.0 },
      "ratio": 1.42
    },
    "contentType": "chollo"
  }'

# Validar:
# 1. UnifiedScriptGenerator genera 3 segmentos cohesivos
# 2. Nano Banana genera 3 imágenes con contexto del guión
# 3. VEO3 genera 3 videos usando imágenes contextualizadas
# 4. Audio en español en los 3 videos
# 5. Concatenación con logo outro
```

**Tiempo Estimado**: 4-6 horas desarrollo + 2 horas testing

**Riesgo**: 🟡 Medio (nueva funcionalidad pero bien definida)

---

### Recomendación #1: Fix `enableTranslation`

**Archivo**: `backend/services/veo3/veo3Client.js`

**Cambio Propuesto**:

```javascript
// Línea 90
// ANTES:
enableTranslation: options.enableTranslation !== false,

// DESPUÉS:
enableTranslation: false,  // NEVER translate - breaks language instruction
```

**Impacto**:

- ✅ Fix audio en inglés
- ⚠️ Afecta TODOS los prompts de VEO3
- ⚠️ Requiere testing completo del sistema validado

**Testing Requerido**:

1. Generar 3 videos con `/api/veo3/generate-multi-segment`
2. Validar audio en español en los 3 segmentos
3. Validar que no rompe otras funcionalidades

**Estado**: ⏳ **PENDIENTE APROBACIÓN**

---

### Recomendación #2: Investigar Acceso Supabase

**Opciones a Probar**:

#### Opción A: Signed URLs

```javascript
// En nanoBananaVeo3Integrator.js
async uploadToSupabase(imageBuffer, filename) {
  // Upload
  const { data: uploadData } = await supabase.storage
    .from('ana-images')
    .upload(`video-frames/${filename}`, imageBuffer);

  // Crear signed URL (1 hora)
  const { data: signedData } = await supabase.storage
    .from('ana-images')
    .createSignedUrl(`video-frames/${filename}`, 3600);

  return signedData.signedUrl; // Usar esto en VEO3
}
```

#### Opción B: Volver a GitHub Raw

```javascript
// Usar sistema anterior (Ana-001.jpeg, Ana-002.jpeg, etc.)
const imageUrl =
    'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg';
```

**Pros/Cons**:

| Solución        | Pros                     | Cons                             |
| --------------- | ------------------------ | -------------------------------- |
| Signed URLs     | ✅ Privacidad controlada | ⚠️ Expiran (necesita renovación) |
| GitHub Raw      | ✅ Funciona actualmente  | ❌ Menos flexible                |
| File Upload API | ✅ Nativo de KIE.ai      | ⚠️ Requiere integración nueva    |

**Estado**: ⏳ **PENDIENTE DECISIÓN**

---

### Recomendación #3: Documentar Uso Correcto

**Crear Guía**:

```markdown
# Cómo Generar Videos VEO3 Correctamente

## ✅ CORRECTO: Usar Sistema Validado

curl -X POST http://localhost:3000/api/veo3/generate-multi-segment \
 -H "Content-Type: application/json" \
 -d '{ "playerData": { "name": "Pere Milla", "team": "Espanyol", "price": 6.64,
"stats": {...} }, "contentType": "chollo" }'

## ❌ INCORRECTO: Scripts Experimentales

No usar scripts en /scripts/nanoBanana/ para producción. Estos son pruebas
técnicas que omiten el sistema completo.
```

**Estado**: ✅ **LISTO PARA IMPLEMENTAR**

---

## 🎯 Próximos Pasos Propuestos

### Paso 0: Implementar Flujo Script→Images (MÁXIMA PRIORIDAD)

- [ ] Modificar `nanoBananaVeo3Integrator.js` con método
      `generateImagesFromScript()`
- [ ] Añadir método `buildContextualImagePrompt()` con mapeo de emociones
- [ ] Crear método `generateContextualImage()` en `nanoBananaClient.js`
- [ ] Crear endpoint `/api/veo3/generate-with-nano-banana` en `veo3.js`
- [ ] Testing E2E: UnifiedScript → Nano Banana → VEO3 → Concatenación
- [ ] Validar que imágenes reflejan contexto del guión
- [ ] Documentar en `docs/VEO3_NANO_BANANA_FLUJO_COMPLETO.md`

**Tiempo**: 4-6h desarrollo + 2h testing **Riesgo**: 🟡 Medio **Impacto**: 🔴
CRÍTICO - Flujo aprobado sin implementar

---

### Paso 1: Fix `enableTranslation` (Crítico)

- [ ] Cambiar `veo3Client.js:90` a `enableTranslation: false`
- [ ] Testing E2E con `/api/veo3/generate-multi-segment`
- [ ] Validar 10 videos (no regresión)
- [ ] Documentar en `VEO3_CAMBIOS_*.md`

**Tiempo**: 30 min cambio + 2h testing **Riesgo**: 🟡 Medio (afecta todos los
prompts)

---

### Paso 2: Resolver Acceso Supabase (Crítico)

- [ ] Probar signed URLs de Supabase
- [ ] Si falla, revertir a GitHub Raw
- [ ] Documentar solución final
- [ ] Actualizar `nanoBananaVeo3Integrator.js`

**Tiempo**: 1-2h investigación + testing **Riesgo**: 🟢 Bajo (cambio aislado)

---

### Paso 3: Deprecar Scripts Experimentales

- [ ] Mover `/scripts/nanoBanana/` a `/scripts/experimental/`
- [ ] Añadir README.md con advertencias
- [ ] Actualizar NORMAS_DESARROLLO_IMPRESCINDIBLES.md
- [ ] Documentar endpoint oficial único

**Tiempo**: 20 min **Riesgo**: 🟢 Bajo (organizativo)

---

### Paso 4: Testing E2E Completo

- [ ] Generar 5 videos con sistema validado
- [ ] Validar audio español en todos
- [ ] Validar concatenación + logo
- [ ] Publicar en test history para feedback

**Tiempo**: 1h **Riesgo**: 🟢 Bajo (validación)

---

## 📝 Notas Finales

**IMPORTANTE**: Este documento NO modifica ningún código del sistema validado.
Todas las recomendaciones requieren aprobación explícita antes de implementar.

**Sistema Validado**: `/api/veo3/generate-multi-segment` con
`ThreeSegmentGenerator`, `UnifiedScriptGenerator`, `PromptBuilder` y diccionario
→ **NO TOCAR SIN APROBAR**

**Test #49**: Experimento exitoso en concepto (Nano Banana + VEO3), pero con
bugs detectados que no representan el sistema completo.

**Decisión Pendiente**: ¿Implementar fixes propuestos o seguir con sistema
validado actual?

---

**Documentado por**: Claude Code **Fecha**: 2025-10-10 **Versión**: 1.0
