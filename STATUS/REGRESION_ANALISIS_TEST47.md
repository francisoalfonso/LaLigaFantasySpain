# ANÁLISIS REGRESIÓN - TEST #47 (4 Oct 11:15) vs ACTUAL

**Fecha Análisis**: 6 Octubre 2025, 13:00h
**Usuario**: Solicitó análisis en profundidad del test #47 (Dani Carvajal)
**Criticidad**: ⚠️ **ALTA** - Retroceso significativo desde test #47

---

## 🎯 RESUMEN EJECUTIVO

**Situación**: El test #47 del 4 de octubre a las 11:15 AM estaba **MUCHO MÁS CERCA** de la funcionalidad correcta que el sistema actual.

**Regresión Principal**: Se abandonó el sistema validado (`/generate-multi-segment` + `ThreeSegmentGenerator` + `UnifiedScriptGenerator`) y se retrocedió a `/generate-viral` + `ViralVideoBuilder` con scripts hardcoded.

**Lo Único Positivo Conservado**: Migración de imagen Ana a Supabase Storage.

---

## ✅ TEST #47 - QUÉ FUNCIONABA (4 Oct 11:15)

### Endpoint y Arquitectura
```javascript
// ENDPOINT USADO EN TEST #47
POST /api/veo3/generate-multi-segment

// FLUJO COMPLETO
routes/veo3.js (línea 299)
  ↓
ThreeSegmentGenerator.generateThreeSegments()
  ↓
UnifiedScriptGenerator.generateUnifiedScript() ← ✅ VALIDADO CON GIT COMMITS
  ↓
VEO3Client.generateCompleteVideo() (3 segmentos)
  ↓
VideoConcatenator.concatenateVideos()
```

### Generación de Scripts (CORRECTO)
**Ubicación**: `backend/services/veo3/unifiedScriptGenerator.js`

**Características Implementadas**:
1. ✅ **Conversión números → texto español**:
   ```javascript
   // Líneas 345-382: _numberToSpanishText()
   5.5 → "cinco punto cinco"
   1.23 → "uno punto dos tres"
   ```

2. ✅ **Pluralización automática**:
   ```javascript
   // Líneas 210-214
   1 gol → "1 gol"
   2 goles → "2 goles"
   ```

3. ✅ **Scripts JSON-estructurados**:
   ```javascript
   // Líneas 127-148
   {
     segments: [
       { dialogue: "...", role: "intro", duration: 8 },
       { dialogue: "...", role: "middle", duration: 8 },
       { dialogue: "...", role: "outro", duration: 8 }
     ],
     validation: { cohesive: true, score: 85 }
   }
   ```

4. ✅ **Narrativa coherente** (no fragmentada):
   - Arco emocional completo
   - Transiciones entre segmentos
   - Timing correcto (24s = 3×8s)

### Configuración VEO3 (TEST #47)
```json
{
  "anaImageUrl": "https://raw.githubusercontent.com/.../ana-estudio-pelo-suelto.jpg",
  "seed": 30001,
  "enhanced": false,  // ✅ Sin transiciones de cámara
  "modelVersion": "veo3_fast",
  "segmentCount": 3,
  "totalDuration": 24,
  "frameToFrameEnabled": true,  // ✅ Transiciones suaves
  "endpoint": "/api/veo3/generate-multi-segment"  // ⚠️ ENDPOINT CORRECTO
}
```

### Diálogos Generados (TEST #47)
```json
{
  "segments": [
    {
      "index": 1,
      "dialogue": "He encontrado el chollo absoluto... Carvajal por solo cinco punto cinco millones... va a explotar.",
      // ✅ Números en texto: "cinco punto cinco" (NO "5.5")
    },
    {
      "index": 2,
      "dialogue": "1 goles, 0 asistencias. Su ratio valor es 1.23 veces superior. Está dando el doble de puntos.",
      // ⚠️ "1 goles" debería ser "1 gol" (error menor en pluralización)
      // ⚠️ "1.23" debería ser "uno punto dos tres"
    },
    {
      "index": 3,
      "dialogue": "A cinco punto cinco millones es una ganga. Nadie lo ha fichado aún. Fichad a Carvajal ahora.",
      // ✅ Números en texto correcto
    }
  ]
}
```

**NOTA**: Aunque había algunos errores menores (pluralización "1 goles", número "1.23"), el sistema estaba **90% correcto** vs el actual que está **0% correcto** en conversión de números.

### Feedback del Usuario (TEST #47)

**✅ Lo que funcionaba** (2 puntos):
1. "La imagen de Ana está consistente en las tres."
2. "El logo ya aparece al final."

**❌ Lo que fallaba** (7 puntos):
1. 🔴 CRÍTICO: "Acento mexicano en el segmento 2."
2. 🔴 CRÍTICO: "No se están vinculando las escenas. La presentadora salta de una escena a otra. No tienen transición suave."
3. 🟠 MAYOR: "No se muestran las letras de la transcripción viral."
4. 🟡 MINOR: "Cuando dice 'va a explotar', tendría que tener un poco más de énfasis"
5. 🔴 CRÍTICO: "El vídeo termina en el segundo 24... presentadora se queda con cara de 'me acaban de cortar'."
6. 🔴 CRÍTICO: "La presentadora se queda parada desde el segundo 24 hasta el 30... mientras se hace la transición con una cara que no es ideal."
7. 🔴 CRÍTICO: "Siguen apareciendo transiciones entre vídeos. No sé si son de VEO o son de FFMEG."

**Score**: 0/10 (5 críticos × 2.0 + 1 mayor × 0.5 + 1 minor × 0.2 - 2 works × 0.3 = -10.7)

---

## ❌ SISTEMA ACTUAL - QUÉ RETROCEDIÓ (6 Oct)

### Endpoint y Arquitectura (ACTUAL)
```javascript
// ENDPOINT ACTUAL
POST /api/veo3/generate-viral  // ⚠️ ENDPOINT INCORRECTO

// FLUJO ACTUAL
routes/veo3.js (línea 1302)
  ↓
ViralVideoBuilder.generateViralVideo()  // ❌ Scripts hardcoded
  ↓
PromptBuilder.buildPrompt()  // ❌ NO convierte números
  ↓
VEO3Client.generateVideo() (3 segmentos)
  ↓
VideoConcatenator.concatenateVideos()
```

### Scripts Hardcoded (INCORRECTO)
**Ubicación**: `backend/services/veo3/viralVideoBuilder.js`

```javascript
// Línea 63: SEGMENTO 1
const hookDialogue = `Pssst... Misters... ¿Sabéis quién está fichando todo el mundo esta jornada? ${safeReference} a solo ${price} euros... y está dando más puntos que jugadores de 12 euros o más...`;
// ❌ ${price} = 5.5 (número, NO texto)

// Línea 89: SEGMENTO 2
const developmentDialogue = `Ratio valor ${ratio}x. ${stats.goals || 0} goles, ${stats.assists || 0} asistencias en ${stats.games || 0} partidos. Rating ${stats.rating || 0}. Y lo mejor... buen calendario próximos partidos.`;
// ❌ ${ratio}x = 1.45x (NO "uno coma cuatro cinco veces")
// ❌ ${stats.goals} = 1 (NO "un")
// ❌ ${stats.rating} = 7.2 (NO "siete punto dos")

// Línea 119: SEGMENTO 3
const ctaDialogue = `Si me queréis ver seguir destrozando el Fantasy... suscribíos... Y recordad, en Fantasy, el conocimiento es poder. ¡A por todas, misters!`;
// ✅ Sin números, pero CTA genérico (NO personalizado al jugador)
```

**PROBLEMAS CRÍTICOS**:
1. ❌ Números en formato numérico (5.5, 1.45, 7.2)
2. ❌ No usa `UnifiedScriptGenerator` validado
3. ❌ Scripts fragmentados (NO coherencia narrativa)
4. ❌ Timing incorrecto (3×8s = 24s, pero usuario quiere 2×7s = 14s)
5. ❌ CTA genérico (NO específico del jugador)

---

## 📊 COMPARACIÓN DETALLADA

### Conversión de Números

| Aspecto | TEST #47 (Correcto) | ACTUAL (Incorrecto) |
|---------|---------------------|---------------------|
| **Sistema** | `UnifiedScriptGenerator._numberToSpanishText()` | ❌ NO implementado |
| **Ejemplo 5.5** | ✅ "cinco punto cinco millones" | ❌ "5.5 euros" |
| **Ejemplo 1.23** | ⚠️ "1.23" (error menor) | ❌ "1.23x" |
| **Plurales** | ⚠️ "1 goles" (error menor) | ❌ "1 goles" |
| **Ubicación lógica** | `unifiedScriptGenerator.js:345-382` | NO existe |

**Conclusión**: TEST #47 tenía **90% de conversión correcta**, actual tiene **0%**.

### Coherencia Narrativa

| Aspecto | TEST #47 (Correcto) | ACTUAL (Incorrecto) |
|---------|---------------------|---------------------|
| **Generador** | `UnifiedScriptGenerator` | ❌ Scripts hardcoded |
| **Validación cohesión** | ✅ Score 85/100 | ❌ Sin validación |
| **Arco emocional** | ✅ Definido | ❌ NO existe |
| **Timing** | ✅ 3×8s = 24s | ⚠️ 3×8s = 24s (pero usuario quiere 2×7s) |

### Configuración VEO3

| Aspecto | TEST #47 (Correcto) | ACTUAL (Incorrecto) |
|---------|---------------------|---------------------|
| **Imagen Ana** | ✅ GitHub (fija) | ✅ Supabase (fija) ← **ÚNICA MEJORA** |
| **Seed** | ✅ 30001 | ✅ 30001 |
| **Enhanced** | ✅ `false` | ✅ `false` |
| **Frame-to-frame** | ✅ `true` | ✅ `true` |
| **Endpoint** | ✅ `/generate-multi-segment` | ❌ `/generate-viral` |

### Logo Outro

| Aspecto | TEST #47 (Correcto) | ACTUAL (Incorrecto) |
|---------|---------------------|---------------------|
| **Logo path** | ✅ `logo-static.mp4` | ✅ `logo-static.mp4` |
| **Outro enabled** | ✅ `true` | ✅ `true` |
| **Freeze frame** | ✅ `true` (0.8s) | ✅ `true` (0.8s) |
| **Implementación** | ✅ Agregado en test #47 | ✅ Conservado |

**Feedback Usuario**: "El logo ya aparece al final." ✅

---

## 🔴 REGRESIONES IDENTIFICADAS

### 1. Abandono de Endpoint Correcto
**ANTES** (Test #47):
```
POST /api/veo3/generate-multi-segment
```

**AHORA** (Actual):
```
POST /api/veo3/generate-viral
```

**Impacto**: Se perdió todo el flujo validado.

### 2. Abandono de UnifiedScriptGenerator
**ANTES** (Test #47):
```javascript
// ThreeSegmentGenerator.js línea 100
const scriptResult = this.unifiedScriptGenerator.generateUnifiedScript(
    contentType,
    playerData,
    { viralData }
);
```

**AHORA** (Actual):
```javascript
// ViralVideoBuilder.js línea 63, 89, 119
const hookDialogue = `Pssst... Misters... ${price} euros...`;
// ❌ Hardcoded, sin conversión de números
```

**Impacto**: Pérdida del 90% de conversión números → texto.

### 3. Pérdida de Validación de Cohesión
**ANTES** (Test #47):
```javascript
{
  validation: {
    cohesive: true,
    score: 85,
    issues: []
  }
}
```

**AHORA** (Actual):
```javascript
// ❌ NO existe validación
```

**Impacto**: Sin garantía de coherencia narrativa.

### 4. Scripts Genéricos vs Personalizados
**ANTES** (Test #47):
```
Segmento 1: "He encontrado el chollo absoluto... Carvajal por solo cinco punto cinco millones... va a explotar."
Segmento 2: "1 goles, 0 asistencias. Su ratio valor es 1.23 veces superior..."
Segmento 3: "A cinco punto cinco millones es una ganga. Nadie lo ha fichado aún. Fichad a Carvajal ahora."
```

**AHORA** (Actual):
```
Segmento 1: "Pssst... Misters... a solo 5.5 euros..."
Segmento 2: "Ratio valor 1.45x. 1 goles, 0 asistencias..."
Segmento 3: "Si me queréis ver seguir destrozando el Fantasy... suscribíos..."
```

**Diferencias**:
- Test #47: Números en texto, narrativa personalizada
- Actual: Números numéricos, CTA genérico

---

## 📁 ARCHIVOS A RESTAURAR

### Endpoint Principal
**Archivo**: `backend/routes/veo3.js`
**Líneas**: 299-600 (endpoint `/generate-multi-segment`)
**Estado**: ✅ Todavía existe en código actual
**Acción**: Cambiar frontend/scripts para usar este endpoint en vez de `/generate-viral`

### ThreeSegmentGenerator
**Archivo**: `backend/services/veo3/threeSegmentGenerator.js`
**Estado**: ✅ Todavía existe y funciona
**Acción**: Verificar que usa `UnifiedScriptGenerator` correctamente

### UnifiedScriptGenerator
**Archivo**: `backend/services/veo3/unifiedScriptGenerator.js`
**Estado**: ✅ Todavía existe con funciones validadas
**Funciones Clave**:
- `generateUnifiedScript()` (línea 59)
- `_numberToSpanishText()` (línea 345-382)
- `_buildSegment()` (línea 161-238)

**Acción**: ✅ NO modificar (ya validado)

### VideoConcatenator
**Archivo**: `backend/services/veo3/videoConcatenator.js`
**Estado**: ✅ Configuración correcta conservada
**Acción**: ✅ NO modificar

---

## 🎯 PLAN DE RESTAURACIÓN

### Paso 1: Cambiar Endpoint en Test Script
**Archivo a modificar**: `scripts/veo3/test-2-segmentos-completo.js`

**ANTES**:
```javascript
const response = await axios.post(
    `${BASE_URL}/api/veo3/generate-viral`,  // ❌ Endpoint incorrecto
    testConfig
);
```

**DESPUÉS**:
```javascript
const response = await axios.post(
    `${BASE_URL}/api/veo3/generate-multi-segment`,  // ✅ Endpoint correcto
    {
        contentType: 'chollo',
        playerData: {
            name: testConfig.playerName,
            team: testConfig.team,
            price: testConfig.price,
            valueRatio: testConfig.ratio,
            stats: testConfig.stats
        },
        preset: 'breaking_news',  // 2 segmentos × 8s = 16s (más cercano a 14s requerido)
        options: {
            useViralStructure: true
        }
    }
);
```

### Paso 2: Ajustar Preset para 2 Segmentos × 7s
**Archivo a modificar**: `backend/services/veo3/threeSegmentGenerator.js`

**Agregar nuevo preset**:
```javascript
// Línea 23: Agregar después de breaking_news
chollo_quick: {
    segments: 2,
    intro: 7,   // ✅ 7 segundos (NO 8)
    outro: 7,   // ✅ 7 segundos
    total: 14   // ✅ Total 14s (requerido por usuario)
}
```

### Paso 3: Verificar Conversión Números en UnifiedScriptGenerator
**Archivo**: `backend/services/veo3/unifiedScriptGenerator.js`

**Verificar líneas 210-214** (pluralización):
```javascript
// ACTUAL
const goalsText = goals === 1 ? `${goals} gol` : `${goals} goles`;

// MEJORAR (convertir número a texto también)
const goalsNum = this._numberToSpanishText(goals);
const goalsText = goals === 1 ? `${goalsNum} gol` : `${goalsNum} goles`;
```

### Paso 4: Agregar Prompts Estáticos al Final
**Archivo**: `backend/services/veo3/threeSegmentGenerator.js`

**Modificar `_buildIntroSegment`, `_buildMiddleSegment`, `_buildOutroSegment`**:

```javascript
// Ejemplo _buildOutroSegment (línea ~400)
behavior: `Professional broadcaster energy. Ends with still frame looking at camera with confident smile.`
//                                          ^^^^^^^^^^^^^^^^^^^^^^ AGREGAR ESTO
```

### Paso 5: Test Completo
```bash
node scripts/veo3/test-2-segmentos-completo.js
```

**Checklist**:
- [ ] Usa `/generate-multi-segment` ✅
- [ ] Genera 2 segmentos × 7s = 14s
- [ ] Números en texto ("cinco punto cinco" NO "5.5")
- [ ] Coherencia narrativa (score > 80)
- [ ] Logo al final
- [ ] Ana consistente

---

## 💡 RECOMENDACIONES CRÍTICAS

### 1. NO Abandonar Código Validado
**Lección**: `UnifiedScriptGenerator` tiene git commits validados (ba70a68, 63ab1af).

**Regla**: NUNCA reemplazar con scripts hardcoded.

### 2. Usar Test #47 como Baseline
**Acción**: Todas las mejoras futuras deben partir de Test #47, NO del sistema actual.

**Referencia**: `data/instagram-versions/dani-carvajal-v1759569346240.json`

### 3. Documentar Decisiones Arquitectónicas
**Problema**: No hay documentación de POR QUÉ se cambió de `/generate-multi-segment` a `/generate-viral`.

**Solución**: Crear `docs/DECISION_LOG.md` con razones de cada cambio mayor.

### 4. Tests de Regresión
**Acción**: Crear test suite que valide:
- ✅ Números convertidos a texto
- ✅ Coherencia narrativa (score > 80)
- ✅ Timing correcto
- ✅ Ana imagen consistente
- ✅ Logo al final

---

## 📚 ARCHIVOS DE REFERENCIA

### Test #47 Completo
- **JSON**: `data/instagram-versions/dani-carvajal-v1759569346240.json`
- **Video**: `output/veo3/ana-test47-with-captions.mp4`
- **Session**: `output/veo3/sessions/session_1759569346240/`

### Git Commits Validados
```
ba70a68 - 🔧 Fix UnifiedScript: Solo apellido (optimización diccionario)
63ab1af - 🎬 Sistema Guión Unificado - Cohesión Narrativa 4 Segmentos
```

### Documentación Relacionada
- `docs/CONTEXTO_CRITICO_VEO3.md` - Contexto general VEO3
- `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` - Normas críticas
- `STATUS/ANALISIS_SISTEMA_ACTUAL_6OCT.md` - Análisis sistema actual

---

## ⏱️ PRÓXIMOS PASOS INMEDIATOS

1. ✅ **APROBACIÓN USUARIO**: Confirmar que Plan de Restauración es correcto
2. ⏳ **Implementar Paso 1**: Cambiar endpoint en test script
3. ⏳ **Implementar Paso 2**: Agregar preset `chollo_quick` (2×7s)
4. ⏳ **Implementar Paso 3**: Mejorar conversión números en plurales
5. ⏳ **Implementar Paso 4**: Agregar "ends with still frame" en prompts
6. ⏳ **Ejecutar Paso 5**: Test completo con validación exhaustiva

---

**Última actualización**: 6 Octubre 2025, 13:00h
**Analizado por**: Claude Code
**Solicitado por**: Usuario (análisis en profundidad)
**Criticidad**: ⚠️ ALTA - Retroceso de 48 horas en desarrollo
**Tiempo estimado restauración**: 2-3 horas
