# 🔍 Análisis: Carlos Videos Usando Prompts de Ana

**Fecha**: 14 Octubre 2025 **Status**: ✅ **PROBLEMA IDENTIFICADO**

---

## 🎯 Resumen Ejecutivo

**Problema**: Los videos de Carlos se estaban generando con los prompts de Ana,
resultando en descripción incorrecta del presentador.

**Causa Raíz**: El endpoint legacy `/api/veo3/generate-with-nano-banana` NO pasa
`characterBible` al método `buildEnhancedNanoBananaPrompt()`, causando que use
el default de Ana.

**Impacto**: Solo afecta al endpoint monolítico legacy. El nuevo sistema 3-phase
(`/prepare-session` + `/generate-segment`) funciona correctamente.

**Solución**: Añadir soporte multi-presentador al endpoint legacy.

---

## 🔍 Investigación Técnica

### 1. Flujo de CharacterBible

**Configuración inicial** (`backend/routes/veo3.js`):

```javascript
// Líneas 1817-1847 en /prepare-session
const presenter = req.body.presenter || 'ana';

let presenterConfig;
if (presenter === 'carlos') {
    const carlosChar = require('../config/veo3/carlosCharacter');
    presenterConfig = {
        name: 'Carlos González',
        seed: carlosChar.CARLOS_DEFAULT_CONFIG.seed,
        imageUrl: carlosChar.CARLOS_IMAGE_URL,
        characterBible: carlosChar.CARLOS_CHARACTER_BIBLE, // ✅ Cargado correctamente
        model: carlosChar.CARLOS_DEFAULT_CONFIG.model,
        aspectRatio: carlosChar.CARLOS_DEFAULT_CONFIG.aspectRatio,
        waterMark: carlosChar.CARLOS_DEFAULT_CONFIG.waterMark
    };
}
```

**Almacenamiento en progress.json** (líneas 2030-2038):

```javascript
presenter: {
    name: presenterConfig.name,
    seed: presenterConfig.seed,
    imageUrl: presenterConfig.imageUrl,
    characterBible: presenterConfig.characterBible,  // ✅ Guardado en progress.json
    model: presenterConfig.model,
    aspectRatio: presenterConfig.aspectRatio,
    waterMark: presenterConfig.waterMark
},
```

**Uso en Nano Banana**
(`backend/services/veo3/nanoBananaVeo3Integrator.js:196-200`):

```javascript
// Construir prompt contextualizado para Nano Banana con characterBible
const imagePrompt = this.buildContextualImagePrompt(
    segment,
    options.characterBible // ✅ Pasa characterBible correctamente
);
```

**Uso en VEO3 prompts** (`backend/services/veo3/promptBuilder.js:654-656`):

```javascript
buildEnhancedNanoBananaPrompt(dialogue, emotion, shot, options = {}) {
    const duration = options.duration || 8;
    const characterBible = options.characterBible;  // ✅ Recibe characterBible

    // ... detecta género y construye prompt
}
```

### 2. Comparación de Endpoints

#### ✅ Endpoint 3-Phase (CORRECTO)

**POST /api/veo3/generate-segment** (líneas 2266-2274):

```javascript
// Construir prompt Enhanced Nano Banana
const nanoBananaPrompt = promptBuilder.buildEnhancedNanoBananaPrompt(
    segment.dialogue,
    segment.emotion,
    segment.shot,
    {
        duration: segment.duration || 8,
        characterBible: progressData.presenter?.characterBible // ✅ Pasa characterBible desde progress.json
    }
);
```

**Resultado**: Videos de Carlos usan correctamente su character bible.

---

#### ❌ Endpoint Legacy (PROBLEMA)

**POST /api/veo3/generate-with-nano-banana** (líneas 1475-1480):

```javascript
const nanoBananaPrompt = promptBuilder.buildEnhancedNanoBananaPrompt(
    segment.dialogue,
    segment.emotion,
    image.shot,
    { duration: segment.duration || 8 } // ❌ NO pasa characterBible!
);
```

**Resultado**: Videos de Carlos usan el default de Ana porque characterBible es
`undefined`.

---

### 3. Detectar Género en PromptBuilder

**Lógica de detección** (`backend/services/veo3/promptBuilder.js:658-680`):

```javascript
// ✅ FIX (13 Oct 2025 20:45): Detectar género dinámicamente del characterBible
let gender = 'female'; // Default: Ana
let pronoun = 'She';

if (characterBible) {
    const lowerBible = characterBible.toLowerCase();

    // Buscar indicadores masculinos
    const maleIndicators = [
        '38-year-old', // Carlos específico
        'analyst',
        'he ',
        'his '
    ];

    const isMale = maleIndicators.some(indicator =>
        lowerBible.includes(indicator)
    );

    if (isMale) {
        gender = 'male';
        pronoun = 'He';
    }
}
```

**Character Bibles**:

- **Ana** (30001):
  `"A 32-year-old Spanish sports analyst Ana Martínez with short black curly hair..."`
- **Carlos** (30002):
  `"A 38-year-old Spanish sports data analyst with short dark hair with gray streaks..."`

**Detección**: `"38-year-old"` identifica a Carlos → `gender = 'male'`

---

## 🐛 Problema Identificado

### Endpoint Afectado

**POST /api/veo3/generate-with-nano-banana** (línea 1340)

### Síntomas

1. Endpoint legacy no recibe parámetro `presenter` en req.body
2. No carga `presenterConfig` con characterBible
3. Llama a `buildEnhancedNanoBananaPrompt()` sin `characterBible` en options
4. PromptBuilder usa default de Ana:
   `"A 32-year-old Spanish sports analyst Ana Martínez..."`
5. Videos de Carlos salen con descripción de Ana

### Afectado vs No Afectado

| Endpoint                              | Línea | CharacterBible | Status   |
| ------------------------------------- | ----- | -------------- | -------- |
| `/prepare-session` (Phase 1)          | 1789  | ✅ Pasa        | Correcto |
| `/generate-segment` (Phase 2)         | 2181  | ✅ Pasa        | Correcto |
| `/generate-with-nano-banana` (Legacy) | 1340  | ❌ NO pasa     | Problema |

---

## 🔧 Solución

### Cambios Necesarios

**Archivo**: `backend/routes/veo3.js`

**Línea**: ~1340-1480

**Modificaciones**:

1. Añadir `presenter = 'ana'` a req.body destructuring
2. Cargar `presenterConfig` dinámicamente (igual que prepare-session)
3. Pasar `characterBible` a
   `nanoBananaVeo3Integrator.generateImagesFromScript()`
4. Pasar `characterBible` a `buildEnhancedNanoBananaPrompt()`

### Código Propuesto

```javascript
// Línea 1340 - Añadir presenter
router.post('/generate-with-nano-banana', async (req, res) => {
    try {
        const {
            contentType = 'chollo',
            playerData,
            viralData = {},
            preset = 'chollo_viral',
            options = {},
            presenter = 'ana'  // ✨ NUEVO
        } = req.body;

        // ... validaciones ...

        // ✅ NUEVO: Cargar configuración del presentador
        let presenterConfig;
        if (presenter === 'carlos') {
            const carlosChar = require('../config/veo3/carlosCharacter');
            presenterConfig = {
                name: 'Carlos González',
                seed: carlosChar.CARLOS_DEFAULT_CONFIG.seed,
                imageUrl: carlosChar.CARLOS_IMAGE_URL,
                characterBible: carlosChar.CARLOS_CHARACTER_BIBLE,
                model: carlosChar.CARLOS_DEFAULT_CONFIG.model,
                aspectRatio: carlosChar.CARLOS_DEFAULT_CONFIG.aspectRatio,
                waterMark: carlosChar.CARLOS_DEFAULT_CONFIG.waterMark
            };
        } else {
            const anaChar = require('../config/veo3/anaCharacter');
            presenterConfig = {
                name: 'Ana Martínez',
                seed: anaChar.ANA_DEFAULT_CONFIG.seed,
                imageUrl: anaChar.ANA_IMAGE_URL,
                characterBible: anaChar.ANA_CHARACTER_BIBLE,
                model: anaChar.ANA_DEFAULT_CONFIG.model,
                aspectRatio: anaChar.ANA_DEFAULT_CONFIG.aspectRatio,
                waterMark: anaChar.ANA_DEFAULT_CONFIG.waterMark
            };
        }

        logger.info(
            `[VEO3 Routes] 👨‍💼 Presentador: ${presenterConfig.name} (seed: ${presenterConfig.seed})`
        );

        // ... generar guión ...

        // ✅ PASO 3: Pasar characterBible a Nano Banana
        const optionsWithPresenter = {
            ...options,
            presenter: presenter,
            seed: presenterConfig.seed,
            characterBible: presenterConfig.characterBible,  // ✅ AÑADIR
            ...(presenter !== 'ana' && { imageUrl: presenterConfig.imageUrl })
        };

        const imagesResult = await nanoBananaVeo3Integrator.generateImagesFromScript(
            scriptSegments,
            optionsWithPresenter  // ✅ Pasa characterBible
        );

        // ... loop de generación de videos ...

        // Línea 1475 - Pasar characterBible a buildEnhancedNanoBananaPrompt
        const nanoBananaPrompt = promptBuilder.buildEnhancedNanoBananaPrompt(
            segment.dialogue,
            segment.emotion,
            image.shot,
            {
                duration: segment.duration || 8,
                characterBible: presenterConfig.characterBible  // ✅ AÑADIR
            }
        );
```

---

## ✅ Validación

### Test Manual

```bash
# Test con Ana (default)
curl -X POST http://localhost:3000/api/veo3/generate-with-nano-banana \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "chollo",
    "playerData": {"name": "Pedri", "team": "Barcelona", "price": 6.5},
    "preset": "chollo_viral"
  }'
# Esperado: Videos con Ana Martínez (seed 30001)

# Test con Carlos
curl -X POST http://localhost:3000/api/veo3/generate-with-nano-banana \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "chollo",
    "playerData": {"name": "Lewandowski", "team": "Barcelona", "price": 9.5},
    "preset": "chollo_viral",
    "presenter": "carlos"
  }'
# Esperado: Videos con Carlos González (seed 30002)
```

### Verificar en Logs

```
[VEO3 Routes] 👨‍💼 Presentador: Carlos González (seed: 30002)
[VEO3 Routes] 🎬 Prompt Enhanced Nano Banana (hook): ...38-year-old Spanish sports data analyst...
[PromptBuilder] 🔍 Gender detected: male (from characterBible)
```

---

## 📊 Tabla Comparativa: Antes vs Después

| Escenario                                | Antes       | Después                  |
| ---------------------------------------- | ----------- | ------------------------ |
| `/prepare-session` + `/generate-segment` | ✅ Correcto | ✅ Correcto (sin cambio) |
| `/generate-with-nano-banana` con Ana     | ✅ Funciona | ✅ Funciona (sin cambio) |
| `/generate-with-nano-banana` con Carlos  | ❌ Usa Ana  | ✅ Usa Carlos            |
| Test E2E 3-phase con Carlos              | ✅ Correcto | ✅ Correcto (sin cambio) |

---

## 🎯 Conclusión

**Root Cause**: Endpoint legacy no implementó soporte multi-presentador cuando
se añadió Carlos.

**Impacto**: Bajo - solo afecta endpoint legacy que no se usa en producción
(sistema 3-phase es el oficial).

**Fix**: Añadir 20 líneas de código para cargar presenterConfig y pasar
characterBible.

**Prioridad**: P1 - No crítico (3-phase funciona), pero debe corregirse para
consistencia.

---

## 📝 Referencias

- **Config Carlos**: `backend/config/veo3/carlosCharacter.js`
- **Config Ana**: `backend/config/veo3/anaCharacter.js`
- **PromptBuilder**: `backend/services/veo3/promptBuilder.js:654-680`
- **Nano Banana Integrator**:
  `backend/services/veo3/nanoBananaVeo3Integrator.js:293-325`
- **VEO3 Routes**: `backend/routes/veo3.js`

---

**Status**: ✅ **ANÁLISIS COMPLETO - READY TO FIX**
