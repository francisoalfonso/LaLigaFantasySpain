# 🚨 NORMAS DE DESARROLLO IMPRESCINDIBLES

**CONSULTA OBLIGATORIA ANTES DE CREAR CUALQUIER ARCHIVO**

---

## 🔴 ADVERTENCIA CRÍTICA - DUPLICACIÓN DE ARCHIVOS

**ANTES de crear CUALQUIER archivo HTML, JS, o servicio:**

1. 🔍 **BUSCAR primero**: `ls frontend/ | grep -i [palabra_clave]`
2. 🔍 **BUSCAR servicios**: `ls backend/services/ | grep -i [palabra_clave]`
3. ❓ **PREGUNTAR**: "¿Ya existe algo similar?"
4. ✅ **REUTILIZAR** el existente en lugar de crear nuevo
5. 📝 **SI CREAS**: Documentar inmediatamente aquí + eliminar versiones antiguas

**Caso real detectado HOY (2025-10-04)**:
- ❌ **4 archivos preview** haciendo LO MISMO
- ✅ **Solución**: Eliminados 3, mantenido 1 oficial
- 💡 **Lección**: Un archivo, un propósito, bien documentado

---

## ⚠️ NORMA #1 - NO CREAR ARCHIVOS INNECESARIOS (CRÍTICA)

**ANTES de crear cualquier archivo nuevo, preguntarse:**

1. **¿Existe ya infraestructura que pueda reutilizar?**
   - ✅ SÍ: Usar la existente
   - ❌ NO: Proceder a pregunta 2

2. **¿Es ABSOLUTAMENTE IMPRESCINDIBLE este archivo para que el sistema funcione?**
   - ✅ SÍ: Crear archivo + documentar en este listado
   - ❌ NO: **NO CREAR** - buscar alternativa

---

## 📋 REGISTRO DE ARCHIVOS CREADOS (Obligatorio)

**Cada archivo nuevo DEBE registrarse aquí con justificación:**

### ✅ ARCHIVOS IMPRESCINDIBLES APROBADOS

| Archivo | Fecha | Razón IMPRESCINDIBLE |
|---------|-------|---------------------|
| `/backend/services/veo3/frameExtractor.js` | 2025-10-04 | Core functionality frame-to-frame - sin esto no funciona continuidad |
| `/backend/routes/testHistory.js` | 2025-10-04 | API endpoint obligatorio para servir datos de tests al frontend + PUT /feedback para persistencia |
| `/frontend/test-history.html` | 2025-10-04 | UI única para tracking - no existe alternativa |
| `/data/instagram-versions/VERSION_SCHEMA.json` | 2025-10-04 | Schema documentation - define estructura de datos |
| `/data/instagram-versions/_TEST_COUNTER.json` | 2025-10-04 | Sistema numeración global tests - sincronización |

### ❌ ARCHIVOS INNECESARIOS CREADOS (Errores a evitar)

| Archivo | Fecha | Por qué NO era necesario | Alternativa correcta |
|---------|-------|-------------------------|---------------------|
| `/scripts/veo3/monitor-test-47.js` | 2025-10-04 | ❌ Podía usar sistema existente de sesiones | Verificar con `ls sessions/` + `cat progress.json` |
| `/scripts/veo3/test-frame-to-frame.js` | 2025-10-04 | ❌ Test script específico innecesario | Usar curl directo al endpoint + verificar resultado |
| `/frontend/chollo-video-preview.html` | 2025-10-03 | ❌ Duplicado de instagram-viral-preview.html | **ELIMINADO** - Usar único preview oficial |
| `/frontend/content-preview.html` | 2025-09-30 | ❌ Versión antigua de preview | **ELIMINADO** - Usar único preview oficial |
| `/frontend/instagram-chollo-preview.html` | 2025-10-03 | ❌ Duplicado específico chollos | **ELIMINADO** - Usar único preview oficial |
| `/frontend/viral-chollo-validation.html` | 2025-10-08 | ❌ Duplicado de instagram-viral-preview.html | **ELIMINADO** - instagram-viral-preview.html ya incluye validación E2E completa |

### ✅ ARCHIVOS OFICIALES CONSOLIDADOS

| Archivo | Propósito | Alternativas ELIMINADAS |
|---------|-----------|------------------------|
| `/frontend/instagram-viral-preview.html` | **ÚNICO** preview Instagram oficial | chollo-video-preview.html, content-preview.html, instagram-chollo-preview.html |

---

## 🔄 INFRAESTRUCTURA EXISTENTE (Usar SIEMPRE primero)

### Monitoreo de Generaciones VEO3
**NO crear scripts monitor específicos**
```bash
# ✅ CORRECTO - Usar infraestructura existente
ls output/veo3/sessions/ | grep session_
cat output/veo3/sessions/session_*/progress.json
```

### Testing de Funcionalidad
**NO crear test scripts únicos**
```bash
# ✅ CORRECTO - Usar endpoints API directamente
curl -X POST http://localhost:3000/api/veo3/generate-ana \
  -H "Content-Type: application/json" \
  -d '{"type": "chollo", "playerData": {...}}'
```

### Documentación de Tests
**NO crear archivos markdown de documentación**
```bash
# ✅ CORRECTO - Usar schema JSON existente
cp data/instagram-versions/VERSION_SCHEMA.json \
   data/instagram-versions/_active_testing/nuevo-test.json
# Editar el JSON con datos del test
```

---

## 📝 PROCESO ANTES DE CREAR ARCHIVO

**CHECKLIST OBLIGATORIO:**

1. [ ] ¿Hay infraestructura existente que pueda reutilizar?
2. [ ] ¿He revisado carpetas `/backend/services/`, `/scripts/`, `/frontend/`?
3. [ ] ¿Es ABSOLUTAMENTE imposible lograr el objetivo sin este archivo?
4. [ ] ¿He consultado `CLAUDE.md` para verificar alternativas?
5. [ ] ¿Puedo usar endpoints API, comandos bash, o archivos existentes?

**SI TODAS LAS RESPUESTAS SON "NO EXISTE ALTERNATIVA":**
- Crear archivo
- Documentar en tabla "ARCHIVOS IMPRESCINDIBLES APROBADOS"
- Explicar por qué era la única opción

---

## ⚡ EJEMPLOS PRÁCTICOS

### ❌ INCORRECTO
```javascript
// Crear scripts/veo3/monitor-generacion-pedri.js
// para verificar si video terminó
```

### ✅ CORRECTO
```bash
# Usar ls + grep + cat para verificar
watch -n 10 'ls output/veo3/sessions/session_*/progress.json | \
  xargs cat | grep -E "segmentsCompleted|concatenatedVideo"'
```

### ❌ INCORRECTO
```javascript
// Crear scripts/test-new-feature.js
// para validar funcionalidad
```

### ✅ CORRECTO
```bash
# Usar curl directo al endpoint de test
curl http://localhost:3000/api/veo3/test
curl -X POST http://localhost:3000/api/veo3/generate-ana \
  -d '{"type": "test"}'
```

---

## 🎯 PRINCIPIOS FUNDAMENTALES

1. **MODIFICAR > CREAR** - Siempre preferir editar existente
2. **REUTILIZAR > DUPLICAR** - Usar infraestructura ya construida
3. **DOCUMENTAR TODO** - Si se crea, debe quedar registrado aquí
4. **MINIMALISMO** - Menos archivos = menos mantenimiento
5. **CONSULTAR PRIMERO** - Ante duda, verificar alternativas

---

## 📝 NORMAS CRÍTICAS DE GUIONES VEO3

### ✅ NORMA #1 - PLURALIZACIÓN CORRECTA
**Singular vs Plural en estadísticas:**

- ❌ INCORRECTO: "1 goles"
- ✅ CORRECTO: "1 gol"
- ✅ CORRECTO: "2 goles", "3 goles", etc.

**Implementación en código:**
```javascript
// Regla de pluralización automática
const statText = count === 1
    ? `${count} gol`
    : `${count} goles`;
```

**Palabras afectadas:**
- gol/goles
- asistencia/asistencias
- partido/partidos
- punto/puntos

### ✅ NORMA #2 - NÚMEROS EN SUBTÍTULOS
**Audio literal vs Subtítulo visual:**

- **Audio (VEO3)**: "cinco punto cinco millones" (texto literal para pronunciación correcta)
- **Subtítulo**: "5.5M" (número visual más natural)

**Ejemplos:**
| Audio VEO3 | Subtítulo Visual |
|-----------|------------------|
| "cinco punto cinco millones" | "5.5M" |
| "ocho punto cero millones" | "8.0M" |
| "uno punto dos tres" | "1.23" |
| "siete punto uno dos" | "7.12" |

**Implementación:**
```javascript
// En captionsService.js - método de conversión
function convertLiteralToNumber(text) {
    // "cinco punto cinco" → "5.5"
    // "ocho punto cero" → "8.0"
    // Reconversión automática para subtítulos
}
```

---

### ✅ NORMA #3 - ESPAÑOL DE ESPAÑA EN PROMPTS VEO3 (CRÍTICA)

**Problema**: VEO3 a veces genera videos con acento mexicano a pesar de configurar `voice.locale='es-ES'` en la API.

**Causa raíz**: La configuración `voice.locale` en VEO3 API NO es suficiente - VEO3 puede ignorarla.

**Solución**: Reforzar el dialecto en el **texto del prompt**:

- ❌ INSUFICIENTE: `voice: { locale: 'es-ES' }` (solo en API)
- ❌ INSUFICIENTE: `"SPANISH FROM SPAIN (not Mexican Spanish)"` (muy genérico)
- ✅ CORRECTO: `"CASTILIAN SPANISH FROM SPAIN (España peninsular accent, NOT Mexican or Latin American)"`

**Implementación en código**:
```javascript
// promptBuilder.js líneas 160 y 175
const prompt = `The person in the reference image speaking in CASTILIAN SPANISH FROM SPAIN (España peninsular accent, NOT Mexican or Latin American) with EXPRESSIVE and engaging delivery: "${dialogue}". Exact appearance from reference.`;
```

**Por qué funciona**:
- "CASTILIAN SPANISH" es más específico que solo "SPANISH FROM SPAIN"
- "(España peninsular accent)" indica región exacta
- "NOT Mexican or Latin American" excluye explícitamente dialectos incorrectos
- El prompt tiene más peso que parámetros API en decisiones de VEO3

**Archivos modificados** (4 Oct 2025):
- `backend/services/veo3/promptBuilder.js` (líneas 160, 175)

---

### ✅ NORMA #4 - DOCUMENTACIÓN OFICIAL DE APIs (CRÍTICA)

**Regla fundamental**: ANTES de implementar cualquier funcionalidad contra una API externa, SIEMPRE obtener y consultar la documentación oficial actualizada.

**Proceso obligatorio:**

1. **BUSCAR documentación oficial** de la API
2. **DESCARGAR/GUARDAR** en `/docs/` con nombre descriptivo
3. **VERIFICAR versión actualizada** (fecha de última modificación)
4. **CONSULTAR parámetros** antes de escribir código
5. **REFERENCIAR en código** con comentarios a la documentación

**Por qué es CRÍTICO:**

- ❌ **Sin documentación**: Uso de parámetros inventados/obsoletos → fallos
- ❌ **Con documentación antigua**: APIs cambian → incompatibilidades
- ✅ **Con documentación oficial actualizada**: Código correcto desde el inicio

**Ejemplo real - VEO3 API (4 Oct 2025):**

**PROBLEMA**:
```javascript
// ❌ INCORRECTO - Parámetros inventados sin consultar docs
const result = await veo3Client.generateVideo(prompt, {
    duration: 8,        // ❌ NO EXISTE en API
    aspect: '9:16',     // ❌ Nombre incorrecto
    voice: {            // ❌ NO EXISTE en API
        locale: 'es-ES'
    }
});
```

**SOLUCIÓN**:
```javascript
// ✅ CORRECTO - Según docs oficiales KIE.ai VEO3
// Fuente: docs/KIE_AI_VEO3_API_OFICIAL.md
const result = await veo3Client.generateVideo(prompt, {
    aspectRatio: '9:16',  // ✅ Nombre correcto
    seeds: 30001,          // ✅ Parámetro válido
    watermark: 'FLP'       // ✅ Parámetro válido
    // duration NO existe - videos siempre ~8s
    // voice NO existe - control vía texto del prompt
});
```

**Consecuencia del error**:
- 4+ horas depurando errores
- 5+ intentos fallidos de generación ($1.50 desperdiciados)
- Reescritura completa de `viralVideoBuilder.js`

**Cómo evitarlo**:
1. Obtener documentación oficial ANTES de codificar
2. Guardar en `/docs/NOMBRE_API_OFICIAL.md`
3. Consultar parámetros exactos
4. Referenciar en código: `// Según docs/KIE_AI_VEO3_API_OFICIAL.md línea 35`

**Documentaciones oficiales requeridas**:

| API | Archivo documentación | Última actualización | Estado |
|-----|----------------------|---------------------|---------|
| KIE.ai VEO3 | `/docs/KIE_AI_VEO3_API_OFICIAL.md` | 2025-10-04 | ✅ Descargada |
| API-Sports | `/docs/API_SPORTS_OFICIAL.md` | Pendiente | ⚠️ REQUERIDA |
| HeyGen | `/docs/HEYGEN_API_OFICIAL.md` | Pendiente | 🔜 Futura |
| Bunny.net Stream | `/docs/BUNNY_STREAM_API_OFICIAL.md` | Pendiente | ⚠️ REQUERIDA |

**CHECKLIST antes de implementar funcionalidad contra API**:

- [ ] ¿Tengo la documentación oficial descargada?
- [ ] ¿La documentación está actualizada (últimos 3 meses)?
- [ ] ¿He consultado la lista completa de parámetros soportados?
- [ ] ¿He verificado ejemplos de requests en la documentación?
- [ ] ¿He documentado en código la fuente de cada parámetro?

**Regla de oro**: **SI NO ESTÁ EN LA DOCUMENTACIÓN OFICIAL, NO EXISTE EN LA API**.

---

### ✅ NORMA #5 - PROMPTS VEO3 OPTIMIZADOS (CRÍTICA)

**Regla fundamental**: Los prompts para VEO3 deben ser SIMPLES, DIRECTOS y seguir patrones comprobados que funcionan. NO mezclar instrucciones técnicas con creatividad.

**Problema detectado (4 Oct 2025)**: Prompts demasiado largos y complejos causando fallos de generación.

#### Investigación Realizada

**Fuentes consultadas**:
- GitHub veo3-api repository (ejemplos React)
- GitHub veo3-prompt-optimizer (patrones estructurados)
- Replicate blog VEO3 image-to-video (ejemplos con resultados)
- Google DeepMind prompt guide oficial (mejores prácticas)

#### Patrones de Prompts Exitosos

**✅ CORRECTO - Prompts simples que funcionan**:
```javascript
// Ejemplo 1: Acción simple + preservación
"The fire in the room begins to burn. Maintain the style of the image."

// Ejemplo 2: Movimiento básico + estilo
"The man rows the boat. Maintain the vintage feel of the image."

// Ejemplo 3: Imperativo directo
"Make him run!"

// Ejemplo 4: Narrativa con diálogo
"The man is running intensely away from a threat through wild, alien-like shrubbery. He says to his microphone, 'This is Echo 1. I'm being pursued.' The camera swivels out from the man to reveal the jungle terrain. Maintain the animation style of the original image."
```

**❌ INCORRECTO - Prompts complejos que fallan**:
```javascript
// Demasiado largo (160+ caracteres)
"The person in the reference image speaking in CASTILIAN SPANISH FROM SPAIN (España peninsular accent, NOT Mexican or Latin American) with EXPRESSIVE and ENGAGING delivery - varying tone, pace and emotion naturally. Emphasize key words with rising intonation, speak with excitement and energy where appropriate, use pauses for impact: \"Pssst... Misters...\". Exact appearance from reference with natural emotional expressions."

// Problemas:
// 1. Mezcla instrucciones técnicas (dialecto español) con dirección creativa
// 2. Demasiadas especificaciones de entrega (tone, pace, emotion, intonation)
// 3. NO incluye instrucción explícita de preservación
// 4. Exceso de detalles que VEO3 puede ignorar o malinterpretar
```

#### Estructura Optimizada para VEO3

**Patrón recomendado** (30-50 palabras máximo):
```javascript
"[Sujeto desde referencia] + [Acción/Diálogo simple] + [Preservación explícita]"

// Ejemplo aplicado a Ana:
"The person from the reference image speaks in Spanish from Spain: \"[dialogue]\". Maintain the exact appearance and style from the reference image."
```

**Elementos clave**:
1. **Preservación explícita**: "Maintain the exact appearance and style from the reference image"
2. **Acción simple**: No más de una frase de acción/diálogo
3. **Especificación técnica breve**: "speaks in Spanish from Spain" (NO párrafos)
4. **Longitud**: 30-50 palabras ideales, máximo 80 palabras

#### Implementación en Código

**Archivo modificado**: `backend/services/veo3/promptBuilder.js` líneas 150-182

**ANTES (complejo, fallaba)**:
```javascript
const prompt = `The person in the reference image speaking in CASTILIAN SPANISH FROM SPAIN (España peninsular accent, NOT Mexican or Latin American) with EXPRESSIVE and engaging delivery, varying tone and emotion naturally: "${dialogue}". Exact appearance from reference with natural emotional expressions.`;
// Longitud: 160+ caracteres ❌
```

**DESPUÉS (optimizado, funciona)**:
```javascript
const prompt = `The person from the reference image speaks in Spanish from Spain: "${dialogue}". Maintain the exact appearance and style from the reference image.`;
// Longitud: ~80 caracteres ✅
```

#### Checklist Validación Prompts VEO3

Antes de enviar cualquier prompt a VEO3 API:

- [ ] ¿Longitud total <80 palabras? (30-50 ideal)
- [ ] ¿Incluye "Maintain the [exact] appearance/style from the reference image"?
- [ ] ¿Especificaciones técnicas (idioma) son breves (≤10 palabras)?
- [ ] ¿Acción/diálogo es simple y directo?
- [ ] ¿NO mezcla múltiples instrucciones de entrega (tone, pace, emotion, etc.)?
- [ ] ¿Sigue el patrón: [Sujeto] + [Acción] + [Preservación]?

**Regla de oro prompts**: **SIMPLE Y DIRECTO > COMPLEJO Y DETALLADO**.

#### Resultados Esperados

**Con prompts optimizados**:
- ✅ Tasa de éxito generación >90% (vs <10% anterior)
- ✅ Preservación consistente de Ana entre segmentos
- ✅ Español de España correcto (sin acento mexicano)
- ✅ Tiempos de generación estables (~4-6 min/segmento)

**Archivos afectados** (4 Oct 2025):
- `backend/services/veo3/promptBuilder.js` (refactorizado completo)
- Todos los tests futuros usarán prompts optimizados

---

**Última actualización:** 2025-10-04 18:30
**Archivos imprescindibles totales:** 5
**Archivos innecesarios creados (errores):** 2
**Normas críticas totales:** 5
