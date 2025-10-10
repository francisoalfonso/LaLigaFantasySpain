# ANÁLISIS EXHAUSTIVO - FLUJO COMPLETO VEO3 GENERATE-VIRAL-CHOLLO

**Fecha**: 8 Oct 2025
**Objetivo**: Mapear TODO el flujo de ejecución real para entender dónde están los problemas

---

## 🎯 PUNTO DE ENTRADA

**Script**: `scripts/veo3/test-viral-chollo-e2e.js` línea 128
```javascript
const response = await axios.post(`${BASE_URL}/api/veo3/generate-viral-chollo`, {
    playerData: {
        name: 'Pere Milla',
        price: 6.64,
        team: 'Espanyol',
        stats: { goals: 3, assists: 0, games: 6, rating: 7.0 },
        ratio: 1.42
    }
});
```

---

## 📍 FLUJO DE EJECUCIÓN REAL

### PASO 1: Endpoint `/api/veo3/generate-viral-chollo`
**Archivo**: `backend/routes/veo3.js` línea 124

```javascript
router.post('/generate-viral-chollo', async (req, res) => {
    // Línea 139: Generar estructura con ThreeSegmentGenerator
    const segmentStructure = multiSegmentGenerator.generateThreeSegments(
        'chollo',
        playerData,
        viralData,
        {
            preset: options.preset || 'chollo_viral', // ✅ PRESET = 'chollo_viral'
            useViralStructure: true,
            ...options
        }
    );

    // Línea 164-192: Loop para generar cada segmento
    for (const [segmentName, segmentData] of Object.entries(segmentStructure.segments)) {
        // Línea 169: Generar video con VEO3
        const result = await veo3Client.generateVideo(segmentData.prompt, {
            aspectRatio: segmentData.veo3Config.aspectRatio || '9:16',
            useImageReference: true
        });

        segmentTaskIds[segmentName] = result.data.taskId;
    }
});
```

**❓ PREGUNTAS CRÍTICAS**:
1. ¿Qué prompt exactamente tiene `segmentData.prompt`?
2. ¿Quién generó ese prompt?
3. ¿Usa el código que arreglé o código diferente?

---

### PASO 2: ThreeSegmentGenerator.generateThreeSegments()
**Archivo**: `backend/services/veo3/threeSegmentGenerator.js` línea 76

```javascript
generateThreeSegments(contentType, playerData, viralData, options = {}) {
    const { preset = 'chollo_viral' } = options;
    const durations = this.durationPresets[preset]; // ✅ chollo_viral = 3 segmentos × 7s (CORREGIDO HOY)

    // Línea 104-145: Generar guión unificado
    if (segmentCount >= 3 && useViralStructure) {
        const scriptResult = this.unifiedScriptGenerator.generateUnifiedScript(
            contentType,
            playerData,
            { viralData }
        );
        unifiedScript = scriptResult;
    }

    // Línea 167-202: Generar 3 segmentos (intro, middle, outro)
    if (segmentCount === 3) {
        const segment1 = unifiedScript?.segments[0] || null;
        const segment2 = unifiedScript?.segments[1] || null;
        const segment3 = unifiedScript?.segments[2] || null;

        // Línea 174-180: INTRO
        segments.intro = this._buildIntroSegment(contentType, playerData, viralData, {
            duration: durations.intro, // ✅ 7s (CORREGIDO)
            useViralStructure,
            anaImageIndex: fixedAnaImageIndex,
            customDialogue: segment1?.dialogue || null,
            segment: segment1 // ✅ Incluye emotion
        });

        // Línea 183-189: MIDDLE
        segments.middle = this._buildMiddleSegment(contentType, playerData, viralData, {
            duration: durations.stats, // ✅ 7s (CORREGIDO)
            useViralStructure,
            anaImageIndex: fixedAnaImageIndex,
            customDialogue: segment2?.dialogue || null,
            segment: segment2 // ✅ Incluye emotion
        });

        // Línea 191-197: OUTRO
        segments.outro = this._buildOutroSegment(contentType, playerData, viralData, {
            duration: durations.outro, // ✅ 7s (CORREGIDO)
            useViralStructure,
            anaImageIndex: fixedAnaImageIndex,
            customDialogue: segment3?.dialogue || null,
            segment: segment3 // ✅ Incluye emotion
        });
    }
}
```

**✅ CONFIRMACIÓN**: Este código USA los fixes de duración (7s) y pasa `segment` (con emotion).

---

### PASO 3: UnifiedScriptGenerator.generateUnifiedScript()
**Archivo**: `backend/services/veo3/unifiedScriptGenerator.js` línea 87

```javascript
generateUnifiedScript(contentType, playerData, options = {}) {
    // Línea 98: Construir guión completo con datos reales
    const fullScript = this._buildFullScript(template, playerData, viralData);

    // Línea 101: Dividir en segmentos
    const segments = this._divideIntoSegments(fullScript, arc);

    return {
        fullScript,
        segments,  // ✅ Array con 3 objetos { role, dialogue, emotion, ... }
        arc,
        validation,
        metadata
    };
}
```

**🔍 INVESTIGAR**: ¿Qué contiene exactamente cada `segment`? Necesito ver `_divideIntoSegments()`.

---

### PASO 4: _buildIntroSegment() / _buildMiddleSegment() / _buildOutroSegment()
**Archivo**: `backend/services/veo3/threeSegmentGenerator.js` líneas 297, 447, 557

**INTRO (línea 297)**:
```javascript
_buildIntroSegment(contentType, playerData, viralData, options) {
    const { customDialogue, segment } = options;

    if (customDialogue) {
        dialogue = customDialogue;

        // Línea 312-320: GENERAR PROMPT
        prompt = this.promptBuilder.buildPrompt({
            dialogue,
            emotion: segment?.emotion || 'curiosidad', // ✅ USA emotion del segment
            enhanced: cinematography ? true : false,
            cinematography,
            behavior: cinematography ? null : 'Brief pause before speaking (0.5 seconds)...'
        });
    }
}
```

**MIDDLE (línea 447)**:
```javascript
_buildMiddleSegment(contentType, playerData, viralData, options) {
    const { customDialogue, segment } = options;

    if (customDialogue) {
        dialogue = customDialogue;

        // Línea 461-466: GENERAR PROMPT
        prompt = this.promptBuilder.buildPrompt({
            dialogue,
            emotion: segment.emotion || 'validacion', // ❓ ¿segment o segment?.emotion?
            enhanced: cinematography ? true : false,
            cinematography
        });
    }
}
```

**⚠️ PROBLEMA POTENCIAL**: Línea 463 usa `segment.emotion` (SIN `?`) → Si `segment` es `undefined`, crashea.

**OUTRO (línea 557)**:
```javascript
_buildOutroSegment(contentType, playerData, viralData, options) {
    const { customDialogue, segment } = options;

    if (customDialogue) {
        dialogue = customDialogue;

        // Línea 571-576: GENERAR PROMPT
        prompt = this.promptBuilder.buildPrompt({
            dialogue,
            emotion: segment.emotion || 'urgencia', // ❓ ¿segment o segment?.emotion?
            enhanced: cinematography ? true : false,
            cinematography
        });
    }
}
```

**⚠️ PROBLEMA POTENCIAL**: Línea 573 usa `segment.emotion` (SIN `?`) → Si `segment` es `undefined`, crashea.

---

### PASO 5: PromptBuilder.buildPrompt()
**Archivo**: `backend/services/veo3/promptBuilder.js` línea 142

```javascript
buildPrompt(config) {
    const { dialogue, enhanced, behavior, cinematography, role, emotion } = config;

    // Línea 235-254: Determinar tono
    let tone;
    if (emotion && emotionalCatalog[emotion]) {
        tone = emotionalCatalog[emotion]; // ✅ USA emotion si existe
    } else if (role) {
        // Backward compatibility
        const roleToEmotion = { intro: 'curiosidad', middle: 'autoridad', outro: 'urgencia' };
        const inferredEmotion = roleToEmotion[role];
        tone = emotionalCatalog[inferredEmotion] || 'with energy and emotion';
    } else {
        tone = 'with energy and emotion'; // ⚠️ FALLBACK SIN DIALECTO
    }

    // Línea 256: CONSTRUIR PROMPT FINAL
    const prompt = `The person from the reference image with long blonde wavy hair and green-hazel eyes speaks in SPANISH FROM SPAIN (not Mexican Spanish) ${tone}: "${dialogue}". Maintain the exact appearance and style from the reference image.`;

    return prompt;
}
```

**✅ CONFIRMACIÓN**: El prompt SIEMPRE tiene "SPANISH FROM SPAIN (not Mexican Spanish)" en línea 256.

---

## 🔴 ANÁLISIS DE PROBLEMAS

### PROBLEMA 1: Acento mexicano en segmento 2

**HIPÓTESIS ACTUAL**:
- Los fixes que apliqué en `veo3Client.js` (líneas 383, 397, 562) son métodos **LEGACY** que NO se usan en el flujo actual.
- El flujo real usa `promptBuilder.buildPrompt()` que YA tenía el fix correcto.

**ENTONCES, ¿POR QUÉ HABÍA ACENTO MEXICANO?**

Opciones:
1. ❓ `segment.emotion` era `undefined` → cayó en fallback línea 253
2. ❓ Pero el fallback TAMBIÉN tiene "SPANISH FROM SPAIN" en línea 256
3. ❓ **O el problema NO está en los prompts sino en VEO3 API** (puede ignorar la instrucción a veces)

**🔍 NECESITO VERIFICAR**:
- Ver el prompt EXACTO que se envió a VEO3 para el segmento 2
- Ver los logs del servidor cuando se generó

---

### PROBLEMA 2: Cara rara al final

**FIX APLICADO**: Duración reducida de 8s a 7s en `chollo_viral` preset.

**✅ ESTE FIX ES CORRECTO** y SÍ aplica al flujo real (línea 52-57 de `threeSegmentGenerator.js`).

---

## 🎯 PRÓXIMAS ACCIONES

1. ✅ **REVERTIR cambios en veo3Client.js** → No se usan en el flujo real
2. ✅ **MANTENER cambio de duración** 8s→7s → SÍ aplica
3. 🔍 **INVESTIGAR**: ¿Por qué hubo acento mexicano si el prompt tenía "SPANISH FROM SPAIN"?
   - Ver logs del servidor
   - Ver prompts exactos enviados
   - Verificar si VEO3 API a veces ignora la instrucción

---

## 📝 CÓDIGO LEGACY IDENTIFICADO (NO SE USA)

**Archivo**: `backend/services/veo3/veo3Client.js`
- Línea 381-386: `createCholloPrompt()` - NO se usa (legacy)
- Línea 395-400: `createAnalysisPrompt()` - NO se usa (legacy)
- Línea 562: `testConnection()` - Se usa solo para health check

**ACCIÓN**: Marcar como legacy o comentar para evitar confusión.

---

## ✅ CÓDIGO ACTIVO CONFIRMADO

1. `backend/routes/veo3.js` línea 124: `/api/veo3/generate-viral-chollo`
2. `backend/services/veo3/threeSegmentGenerator.js` línea 76: `generateThreeSegments()`
3. `backend/services/veo3/unifiedScriptGenerator.js` línea 87: `generateUnifiedScript()`
4. `backend/services/veo3/promptBuilder.js` línea 142: `buildPrompt()`
5. `backend/services/veo3/veo3Client.js` línea 121: `generateVideo()`

**ESTE es el flujo real que se ejecuta.**
