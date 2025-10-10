# ANÁLISIS SISTEMA ACTUAL - 6 Octubre 2025

**Fecha**: 6 Octubre 2025, 11:15h
**Propósito**: Documentar estado actual del sistema de generación de videos VEO3 antes de implementar mejoras

---

## 🔍 FLUJO ACTUAL COMPLETO

### Endpoint Principal
**`POST /api/veo3/generate-viral`** (`backend/routes/veo3.js:1302`)

```javascript
router.post('/generate-viral', async (req, res) => {
    const { playerName, price, ratio, team, stats } = req.body;

    // Genera video viral
    const result = await viralBuilder.generateViralVideo({
        playerName, price, ratio, team, stats
    });

    // Retorna resultado
    res.json({ success: true, video: result, caption });
});
```

### Instancias de Servicios
```javascript
// routes/veo3.js:20-26
const veo3Client = new VEO3Client();
const promptBuilder = new PromptBuilder();
const concatenator = new VideoConcatenator();
const viralBuilder = new ViralVideoBuilder();
const multiSegmentGenerator = new ThreeSegmentGenerator(); // ❓ NO se usa
```

---

## 📊 SERVICIOS UTILIZADOS

### 1. ViralVideoBuilder
**Ubicación**: `backend/services/veo3/viralVideoBuilder.js`

**Función**: Genera videos virales de 3 segmentos (Hook → Desarrollo → CTA)

**Configuración Actual**:
- ✅ `useImageReference: true` (líneas 75, 101, 126) - Ana aparece
- ✅ `useFrameToFrame: true` (línea 40) - Transiciones suaves
- ✅ Validación diccionario jugadores (líneas 42-55)

**Scripts Generados** (HARDCODED):
```javascript
// Segmento 1: HOOK (línea 63)
const hookDialogue = `Pssst... Misters... ¿Sabéis quién está fichando todo el mundo esta jornada? ${safeReference} a solo ${price} euros... y está dando más puntos que jugadores de 12 euros o más...`;

// Segmento 2: DESARROLLO (línea 89)
const developmentDialogue = `Ratio valor ${ratio}x. ${stats.goals || 0} goles, ${stats.assists || 0} asistencias en ${stats.games || 0} partidos. Rating ${stats.rating || 0}. Y lo mejor... buen calendario próximos partidos.`;

// Segmento 3: CTA (línea 119)
const ctaDialogue = `Si me queréis ver seguir destrozando el Fantasy... suscribíos... Y recordad, en Fantasy, el conocimiento es poder. ¡A por todas, misters!`;
```

**⚠️ PROBLEMAS IDENTIFICADOS**:

1. **❌ Números en formato numérico**: `${price}`, `${ratio}x`, `${stats.goals}`, etc.
   - VEO3 no pronuncia bien "7.2" o "1.45x"
   - Necesita: "siete punto dos", "uno coma cuatro cinco veces"

2. **❌ Timing incorrecto**: 3 segmentos × 8s = 24s total
   - Usuario requiere: **2 segmentos × 7s = 14s total**

3. **❌ No usa UnifiedScriptGenerator**: Scripts hardcoded, sin coherencia narrativa JSON-estructurada

4. **✅ Frame-to-frame activado**: Línea 40

---

### 2. PromptBuilder
**Ubicación**: `backend/services/veo3/promptBuilder.js`

**Función**: Genera prompts optimizados para VEO3

**Prompt Generado** (línea 183):
```javascript
const prompt = `The person from the reference image speaks in SPANISH FROM SPAIN (not Mexican Spanish) with energy and emotion: "${dialogue}". Maintain the exact appearance and style from the reference image.`;
```

**✅ CORRECTO**:
- Español de España (lowercase "speaks")
- Preservación explícita de apariencia
- Energía y emoción para evitar voz robótica

**❌ LIMITACIÓN**:
- No convierte números a palabras (recibe dialogue como string)
- No valida timing de texto

---

### 3. VideoConcatenator
**Ubicación**: `backend/services/veo3/videoConcatenator.js`

**Función**: Concatena segmentos y agrega logo outro

**Configuración Actual** (líneas 27-62):

```javascript
transition: {
    type: 'crossfade',
    duration: 0.5,
    enabled: false  // ✅ DESACTIVADO - sin crossfade
},

outro: {
    enabled: true,  // ✅ ACTIVADO
    logoPath: null,
    duration: 1.5,
    freezeFrame: {
        enabled: true,  // ✅ ACTIVADO
        duration: 0.8
    }
},

viralCaptions: {
    enabled: true,  // ✅ Subtítulos virales activados
    applyBeforeConcatenation: true
}
```

**Logo Path** (línea 18):
```javascript
this.logoOutroPath = path.join(this.outputDir, 'logo-static.mp4');
// Resuelve a: ./output/veo3/logo-static.mp4
```

**✅ CORRECTO**:
- Crossfade desactivado (cortes secos)
- Logo outro activado
- Freeze frame antes del logo (0.8s)
- Subtítulos virales integrados

---

## 🔧 SERVICIOS NO UTILIZADOS (PERO VALIDADOS)

### UnifiedScriptGenerator
**Ubicación**: `backend/services/veo3/unifiedScriptGenerator.js`

**Estado**: ✅ **VALIDADO Y FUNCIONANDO** (git commits ba70a68, 63ab1af)

**Características**:
- Conversión números → texto español: `_numberToSpanishText()` (líneas 345-382)
- Pluralización: "gol/goles", "asistencia/asistencias" (líneas 210-214)
- Scripts JSON-estructurados (líneas 127-148)
- Narrativa coherente completa (4 segmentos)

**Ejemplo de conversión**:
```javascript
// 7.2 → "siete punto dos"
// 1.45 → "uno coma cuatro cinco"
```

**⚠️ NO SE USA ACTUALMENTE**: `ViralVideoBuilder` no lo importa ni lo llama

---

### ThreeSegmentGenerator
**Ubicación**: `backend/services/veo3/threeSegmentGenerator.js`

**Estado**: Importado en routes (línea 14) pero NO se usa en endpoint

---

## 📋 COMPARACIÓN: ACTUAL vs REQUERIDO

### Punto 1: Script Coherente y Timing

| Aspecto | Actual | Requerido |
|---------|--------|-----------|
| **Generador** | `ViralVideoBuilder` hardcoded | `UnifiedScriptGenerator` JSON |
| **Segmentos** | 3 × 8s = 24s | 2 × 7s = 14s |
| **Coherencia** | Fragmentado | Narrativa completa |
| **Números** | ❌ Formato numérico | ✅ Texto español |

### Punto 2: Transiciones VEO3

| Aspecto | Actual | Requerido |
|---------|--------|-----------|
| **Crossfade** | ✅ Desactivado | ✅ OK |
| **Frame-to-frame** | ✅ Activado | ✅ OK |
| **Prompts estáticos** | ❓ No verificado | "ends with still frame" |

### Punto 3: Textos Simples

| Aspecto | Actual | Requerido |
|---------|--------|-----------|
| **Conversión números** | ❌ No implementada | ✅ `_numberToSpanishText()` |
| **Ubicación lógica** | `UnifiedScriptGenerator` | Ya existe, no se usa |

### Punto 4: Logo Final

| Aspecto | Actual | Requerido |
|---------|--------|-----------|
| **Logo path** | ✅ `./output/veo3/logo-static.mp4` | ✅ OK |
| **Outro enabled** | ✅ `true` | ✅ OK |
| **Freeze frame** | ✅ `true` (0.8s) | ✅ OK |
| **Transición desde último frame** | ❓ No verificado | Revisar implementación |

### Punto 5: Formato JSON

| Aspecto | Actual | Requerido |
|---------|--------|-----------|
| **Scripts JSON** | `UnifiedScriptGenerator` | Ya existe, no se usa |
| **Uso actual** | ❌ `ViralVideoBuilder` strings | Cambiar a JSON |

---

## ✅ SOLUCIÓN PROPUESTA

### Opción 1: Modificar ViralVideoBuilder (Mínimo Cambio)

**Cambios necesarios**:
1. Importar `UnifiedScriptGenerator`
2. Llamar a `generateScript()` en lugar de strings hardcoded
3. Ajustar configuración a 2 segmentos × 7s
4. Usar scripts con números convertidos

**Archivos afectados**:
- `backend/services/veo3/viralVideoBuilder.js` (modificar)

**Riesgo**: Bajo (solo modificar lógica de scripts)

### Opción 2: Cambiar Endpoint a ThreeSegmentGenerator (Mayor Cambio)

**Cambios necesarios**:
1. Modificar `/api/veo3/generate-viral` para usar `multiSegmentGenerator`
2. Verificar compatibilidad con `UnifiedScriptGenerator`
3. Ajustar configuración a 2 segmentos × 7s

**Archivos afectados**:
- `backend/routes/veo3.js` (cambiar instancia)
- `backend/services/veo3/threeSegmentGenerator.js` (configurar)

**Riesgo**: Medio (cambiar flujo completo)

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Paso 1: Verificar Funcionamiento Actual
```bash
node scripts/veo3/test-2-segmentos-completo.js
```
**Objetivo**: Confirmar qué genera actualmente el sistema

### Paso 2: Implementar Conversión Números (Prioridad Alta)

**Crear**: `backend/utils/numberToSpanish.js` con función extraída de `UnifiedScriptGenerator`

**Modificar**: `ViralVideoBuilder` líneas 63, 89, 119:
```javascript
// ANTES
const hookDialogue = `... a solo ${price} euros...`;

// DESPUÉS
const priceText = convertirNumeroATexto(price); // "siete punto dos"
const hookDialogue = `... a solo ${priceText} euros...`;
```

### Paso 3: Ajustar Timing (2 segmentos × 7s)

**Modificar**: `ViralVideoBuilder.generateViralVideo()`
- Eliminar segmento 3 (CTA)
- Reducir diálogos para 7s cada uno
- Verificar timing con contador de palabras

### Paso 4: Verificar Prompts Estáticos

**Modificar**: `ViralVideoBuilder` líneas 65-70, 91-96
```javascript
// AGREGAR en behavior:
behavior: `... Professional broadcaster energy. Ends with still frame.`
```

### Paso 5: Verificar Logo Transition

**Revisar**: `VideoConcatenator` implementación actual de `freezeFrame` + `logoOutro`

**Test**: Verificar que último frame de segmento 2 se mantiene antes del logo

---

## 📁 ARCHIVOS CLAVE A MODIFICAR

### Modificación Directa (Opción 1)
1. ✅ **`viralVideoBuilder.js`**
   - Importar función conversión números
   - Ajustar scripts a 2 segmentos
   - Convertir números a texto español
   - Agregar "ends with still frame" en prompts

2. ✅ **`promptBuilder.js`**
   - Validar que prompts incluyan "still frame"
   - Mantener actual configuración (ya correcto)

3. ⏳ **`videoConcatenator.js`**
   - Verificar implementación freeze frame
   - Confirmar transición a logo funciona

### Servicios Validados a Integrar (Opción 2)
1. ⚠️ **`unifiedScriptGenerator.js`**
   - Ya validado, solo necesita ser llamado
   - Extrae `_numberToSpanishText()` a utils

2. ⚠️ **`threeSegmentGenerator.js`**
   - Revisar si usa `UnifiedScriptGenerator`
   - Configurar para 2 segmentos

---

## 🚨 PRECAUCIONES CRÍTICAS

1. **NO desconectar código validado**:
   - `UnifiedScriptGenerator` tiene git commits aprobados
   - Extraer funcionalidad, no reescribir

2. **NO cambiar configuraciones que funcionan**:
   - `.env` → `ANA_CHARACTER_SEED=30001` (NUNCA cambiar)
   - `.env` → `ANA_IMAGE_URL` (ya migrado a Supabase)
   - `videoConcatenator.js` → `transition.enabled: false` (ya correcto)
   - `viralVideoBuilder.js` → `useImageReference: true` (ya corregido)

3. **Validar cada cambio con test**:
   - Ejecutar `test-2-segmentos-completo.js` después de cada modificación
   - Verificar manualmente los 5 puntos críticos

---

## 📚 REFERENCIAS

- **Contexto Crítico**: `docs/CONTEXTO_CRITICO_VEO3.md`
- **Normas Desarrollo**: `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md`
- **Git Commits Validados**:
  - `ba70a68` - Fix UnifiedScript: Solo apellido
  - `63ab1af` - Sistema Guión Unificado - Cohesión Narrativa

---

**Última actualización**: 6 Octubre 2025, 11:15h
**Mantenido por**: Claude Code
**Próximo paso**: Consultar con usuario qué opción prefiere (Opción 1 o 2)
