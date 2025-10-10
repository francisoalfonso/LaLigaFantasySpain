# 🎬 Uso del Framework Viral Integrado - VEO3 + PromptBuilder

**Versión**: 1.0
**Fecha**: 30 Septiembre 2025
**Integración**: GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md v3.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen)
2. [Actualización PromptBuilder.js](#promptbuilder)
3. [Uso Básico](#uso-basico)
4. [Uso Avanzado: Estructura Viral Completa](#uso-avanzado)
5. [Validación de Convergencia](#convergencia)
6. [Arcos Emocionales Disponibles](#arcos-emocionales)
7. [Ejemplos Prácticos](#ejemplos)
8. [Testing](#testing)

---

## 🎯 RESUMEN EJECUTIVO {#resumen}

El sistema VEO3 ahora incluye **Framework Viral Comprobado** (1,350M visitas) integrado directamente en `PromptBuilder.js`.

**Nuevas funcionalidades**:
- ✅ **4 arcos emocionales** predefinidos (chollo, prediccion, breaking, analisis)
- ✅ **Estructura 7 elementos** automática (hook → contexto → conflicto → inflexión → resolución → moraleja → CTA)
- ✅ **Validación convergencia 70/30** (general/nicho)
- ✅ **Metadata viral automática** (duración, emociones, validaciones)
- ✅ **Compatibilidad backward** con métodos legacy

---

## 🔧 ACTUALIZACIÓN PromptBuilder.js {#promptbuilder}

### Constantes Exportadas

```javascript
const PromptBuilder = require('./backend/services/veo3/promptBuilder');
const { EMOCIONES_POR_ELEMENTO, ARCOS_EMOCIONALES } = require('./backend/services/veo3/promptBuilder');

// EMOCIONES_POR_ELEMENTO
{
  hook: { chollo: 'conspiratorial_whisper', prediccion: 'professional_authority', ... },
  contexto: { chollo: 'building_tension', ... },
  inflexion: { chollo: 'explosive_revelation', ... },
  // ... 7 elementos totales
}

// ARCOS_EMOCIONALES
{
  chollo: { nombre: 'Chollo Revelation', duracion: '10-12s', secuencia: [...] },
  prediccion: { nombre: 'Data Confidence', duracion: '12-15s', secuencia: [...] },
  breaking: { nombre: 'Breaking News', duracion: '8-10s', secuencia: [...] },
  analisis: { nombre: 'Professional Analysis', duracion: '12-15s', secuencia: [...] }
}
```

### Nuevos Métodos

#### 1. `buildViralStructuredPrompt(type, data, options)`
Construye prompt con estructura viral completa.

```javascript
const builder = new PromptBuilder();

const result = builder.buildViralStructuredPrompt('chollo', {
    hook: '¿Listos para un secreto?',
    contexto: 'Mientras todos gastan en caros delanteros...',
    conflicto: '',  // implícito
    inflexion: 'Pere Milla a 4.8€ es...',
    resolucion: '¡92% probabilidad de GOL!',
    moraleja: 'Los chollos están donde nadie mira.',
    cta: '¡Fichalo AHORA!'
});

// Resultado:
{
    prompt: "The person in the reference image speaking in Spanish: ...",
    arcoEmocional: { nombre: 'Chollo Revelation', duracion: '10-12s', secuencia: [...] },
    dialogueParts: { hook: '...', contexto: '...', ... },
    metadata: {
        type: 'chollo',
        duracionEstimada: '10-12s',
        elementosEstructura: 7
    }
}
```

#### 2. `getEmotionForElement(elemento, type)`
Obtiene emoción recomendada para un elemento específico.

```javascript
const emocion = builder.getEmotionForElement('hook', 'chollo');
// Resultado: 'conspiratorial_whisper'
```

#### 3. `getEmotionalArc(type)`
Obtiene arco emocional completo para un tipo de contenido.

```javascript
const arco = builder.getEmotionalArc('prediccion');
// Resultado: { nombre: 'Data Confidence', duracion: '12-15s', secuencia: [...] }
```

#### 4. `validateViralConvergence(dialogue, options)`
Valida que el contenido cumpla con la regla 70% general / 30% nicho.

```javascript
const validation = builder.validateViralConvergence('¿Listos para un secreto? Pere Milla a 4.8€...');
// Resultado:
{
    valid: true,
    convergenceRatio: { general: 60, niche: 40 },
    warnings: []
}
```

#### 5. `generateViralMetadata(type, dialogue)`
Genera metadata completa para un video viral.

```javascript
const metadata = builder.generateViralMetadata('chollo', 'Pere Milla a 4.8€...');
// Resultado:
{
    contentType: 'chollo',
    emotionalArc: 'Chollo Revelation',
    estimatedDuration: '10-12s',
    structureElements: 7,
    convergenceRatio: { general: 60, niche: 40 },
    dialogueLength: 125,
    wordsCount: 21,
    validations: { convergence: true, arcComplete: true }
}
```

---

## 🚀 USO BÁSICO {#uso-basico}

### Modo Legacy (Sin cambios)

Los métodos existentes siguen funcionando igual:

```javascript
const builder = new PromptBuilder();

// Chollo simple
const prompt1 = builder.buildCholloPrompt('Pedri', 8.5);

// Análisis simple
const prompt2 = builder.buildAnalysisPrompt('Lewandowski', 10.5, { goals: 2 });

// Breaking news simple
const prompt3 = builder.buildBreakingNewsPrompt('Benzema lesionado');
```

---

## 🎯 USO AVANZADO: Estructura Viral Completa {#uso-avanzado}

### Activar Modo Viral

Para usar estructura viral completa, pasar `useViralStructure: true`:

```javascript
const builder = new PromptBuilder();

// Preparar contenido con estructura 7 elementos
const cholloData = {
    hook: '¿Listos para un secreto?',
    contexto: 'Mientras todos gastan en caros delanteros...',
    conflicto: '',  // implícito - puede estar vacío
    inflexion: 'Pere Milla a 4.8€ es...',
    resolucion: '¡92% probabilidad de GOL esta jornada!',
    moraleja: 'Los chollos están donde nadie mira.',
    cta: '¡Fichalo AHORA antes que suba!'
};

// Construir con estructura viral
const result = builder.buildCholloPrompt('Pere Milla', 4.8, {
    useViralStructure: true,
    structuredData: cholloData
});

// Ahora result contiene:
// - result.prompt (string)
// - result.arcoEmocional (objeto con secuencia de emociones)
// - result.dialogueParts (objeto con cada elemento separado)
// - result.metadata (duración, tipo, etc)
```

---

## 🔍 VALIDACIÓN DE CONVERGENCIA {#convergencia}

### Teoría Convergencia Viral

**70% contenido general emocional** + **30% contenido nicho específico** = Viralidad + Conversión

### Validar Contenido

```javascript
const builder = new PromptBuilder();

const dialogue = '¿Listos para un secreto increíble? Pere Milla a 4.8€ tiene 92% probabilidad de gol.';
const validation = builder.validateViralConvergence(dialogue);

console.log(`General: ${validation.convergenceRatio.general}%`);
console.log(`Nicho: ${validation.convergenceRatio.niche}%`);

if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
}
```

### Keywords Detectadas

**General (70% esperado)**:
- `secreto`, `descubrir`, `increíble`, `espectacular`, `mira`
- `sorpresa`, `nadie`, `todos`, `ahora`, `urgente`
- `atención`, `misters`, `preparaos`, `explosivo`

**Nicho (30% esperado)**:
- `€`, `precio`, `puntos`, `fantasy`, `chollo`, `jornada`
- `gol`, `asistencia`, `rating`, `equipo`, `fichaje`
- `stats`, `probabilidad`, `valor`

---

## 🎭 ARCOS EMOCIONALES DISPONIBLES {#arcos-emocionales}

### 1. Chollo Revelation (10-12s)

**Uso**: Revelar jugadores baratos con alta probabilidad de puntos.

**Secuencia**:
1. **Hook** (0-2s): `conspiratorial_whisper` → "¿Listos para un secreto?"
2. **Contexto** (2-4s): `building_tension` → "Mientras todos gastan..."
3. **Conflicto** (4-5s): `implicit_tension` → [implícito]
4. **Inflexión** (5-7s): `explosive_revelation` → "Pere Milla a 4.8€ es..."
5. **Resolución** (7-9s): `explosive_excitement` → "¡92% probabilidad GOL!"
6. **Moraleja** (9-10s): `knowing_wisdom` → "Chollos donde nadie mira"
7. **CTA** (10-12s): `urgent_call_to_action` → "¡Fichalo AHORA!"

### 2. Data Confidence (12-15s)

**Uso**: Predicciones basadas en datos y análisis.

**Secuencia**:
1. **Hook** (0-2s): `professional_authority`
2. **Contexto** (2-5s): `analytical_calm`
3. **Conflicto** (5-7s): `data_confrontation`
4. **Inflexión** (7-9s): `eureka_moment`
5. **Resolución** (9-12s): `confident_conclusion`
6. **Moraleja** (12-13s): `expert_advice`
7. **CTA** (13-15s): `expert_recommendation`

### 3. Breaking News (8-10s)

**Uso**: Noticias urgentes que requieren acción inmediata.

**Secuencia**:
1. **Hook** (0-1s): `urgent_alert_max_energy`
2. **Contexto** (1-3s): `rising_urgency`
3. **Inflexión** (3-5s): `breaking_news_announcement`
4. **Resolución** (5-7s): `impact_explanation`
5. **Moraleja** (7-8s): `urgent_warning`
6. **CTA** (8-10s): `immediate_action_required`

**Nota**: Breaking news tiene 6 elementos (sin conflicto explícito).

### 4. Professional Analysis (12-15s)

**Uso**: Análisis táctico profesional de jugadores.

**Secuencia**:
1. **Hook** (0-2s): `confident_expert`
2. **Contexto** (2-4s): `establishing_credibility`
3. **Conflicto** (4-6s): `problem_identification`
4. **Inflexión** (6-9s): `key_insight_discovery`
5. **Resolución** (9-12s): `solution_presentation`
6. **Moraleja** (12-13s): `professional_takeaway`
7. **CTA** (13-15s): `informed_suggestion`

---

## 💡 EJEMPLOS PRÁCTICOS {#ejemplos}

### Ejemplo 1: Chollo Simple (Legacy)

```javascript
const builder = new PromptBuilder();
const prompt = builder.buildCholloPrompt('Pere Milla', 4.8);
// Resultado: prompt simple sin estructura viral
```

### Ejemplo 2: Chollo con Estructura Viral Completa

```javascript
const builder = new PromptBuilder();

const cholloData = {
    hook: '¿Listos para un secreto?',
    contexto: 'Mientras todos gastan en caros delanteros...',
    inflexion: 'Pere Milla a 4.8€ tiene...',
    resolucion: '¡92% probabilidad de gol esta jornada!',
    moraleja: 'Los chollos están donde nadie mira.',
    cta: '¡Fichalo AHORA!'
};

const result = builder.buildCholloPrompt('Pere Milla', 4.8, {
    useViralStructure: true,
    structuredData: cholloData
});

// Enviar a VEO3
const veo3Client = new VEO3Client();
const video = await veo3Client.generateVideo({
    prompt: result.prompt,
    duration: 10,  // basado en result.metadata.duracionEstimada
    aspectRatio: '9:16'
});
```

### Ejemplo 3: Validar Convergencia Antes de Generar

```javascript
const builder = new PromptBuilder();

const dialogue = '¿Listos para un secreto? Pere Milla a 4.8€ tiene 92% probabilidad de gol.';
const validation = builder.validateViralConvergence(dialogue);

if (validation.convergenceRatio.general < 60) {
    console.log('⚠️  Contenido muy técnico - agregar elementos emocionales');
} else if (validation.convergenceRatio.niche < 20) {
    console.log('⚠️  Contenido muy genérico - agregar datos específicos Fantasy');
} else {
    console.log('✅ Convergencia óptima - proceder con generación');
}
```

### Ejemplo 4: Generar Metadata Completa

```javascript
const builder = new PromptBuilder();

const dialogue = '¿Listos para un secreto? Pere Milla a 4.8€ tiene 92% probabilidad de gol.';
const metadata = builder.generateViralMetadata('chollo', dialogue);

console.log(`Duración estimada: ${metadata.estimatedDuration}`);
console.log(`Arco emocional: ${metadata.emotionalArc}`);
console.log(`Convergencia: ${metadata.convergenceRatio.general}% / ${metadata.convergenceRatio.niche}%`);
console.log(`Validaciones: convergencia=${metadata.validations.convergence}, arco=${metadata.validations.arcComplete}`);
```

---

## 🧪 TESTING {#testing}

### Test Completo del Framework

```bash
npm run veo3:test-framework
```

**Ejecuta**:
- ✅ Validación de constantes exportadas
- ✅ Construcción de prompts con estructura viral
- ✅ Validación de convergencia (casos buenos y malos)
- ✅ Obtención de emociones por elemento
- ✅ Generación de metadata viral
- ✅ Compatibilidad con métodos legacy
- ✅ Validación de arcos emocionales completos

### Test Individual

```javascript
const PromptBuilder = require('./backend/services/veo3/promptBuilder');
const builder = new PromptBuilder();

// Test arcos emocionales
console.log('Arcos disponibles:', Object.keys(builder.arcosEmocionales));

// Test emociones
const emocion = builder.getEmotionForElement('hook', 'chollo');
console.log('Emoción hook chollo:', emocion);

// Test convergencia
const validation = builder.validateViralConvergence('Tu contenido aquí');
console.log('Convergencia:', validation.convergenceRatio);
```

---

## 📊 MÉTRICAS ESPERADAS

Con framework viral integrado:

- **Completion Rate**: 80%+ (vs 45% sin framework)
- **Shares**: 3-5x aumento
- **Saves**: 2-3x aumento
- **CTR**: 2x aumento
- **Conversión a leads**: Mantener >30% (nicho Fantasy)

---

## 🚨 RECORDATORIOS IMPORTANTES

1. **Ana Character Bible**: NUNCA modificar (SEED: 30001)
2. **Voice Locale**: Siempre `es-ES` (España, NO mexicano)
3. **Convergencia 70/30**: Validar antes de generar
4. **Arco emocional**: Elegir correcto según tipo contenido
5. **Compatibilidad**: Métodos legacy siguen funcionando

---

## 🔗 REFERENCIAS

- **Guía Maestra**: `GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md` v3.0
- **Framework Detallado**: `FRAMEWORK_GUIONES_VIRALES_ANA.md`
- **Código Fuente**: `backend/services/veo3/promptBuilder.js`
- **Script Testing**: `scripts/veo3/test-viral-framework.js`

---

✅ **Sistema listo para producción de contenido viral**