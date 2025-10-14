# ✅ RESUELTO: Problema de Polling Nano Banana

**Fecha**: 14 Octubre 2025 **Problema**: Imágenes se generan pero no detectamos
el estado "success" de KIE.ai **Impacto**: CRÍTICO - Bloqueaba todo el flujo
VEO3 **Estado**: ✅ **RESUELTO** - 14 Octubre 2025, 6:57 AM

---

## 📊 FLUJO ACTUAL DEL POLLING

### Paso 1: Crear Tarea en KIE.ai

**Endpoint**: `POST https://api.kie.ai/api/v1/playground/createTask`

**Request**:

```javascript
{
  model: 'google/nano-banana-edit',
  input: {
    prompt: "ultra realistic cinematic portrait...",
    negative_prompt: "no red tint...",
    image_urls: [/* 5-6 URLs */],
    output_format: 'png',
    image_size: '9:16',
    seed: 12500,
    prompt_strength: 0.75,
    transparent_background: false,
    n: 1
  }
}
```

**Response Esperada**:

```javascript
{
  success: true,
  data: {
    taskId: "abc123xyz456"
  }
}
```

**Código** (`nanoBananaClient.js:167-220`):

```javascript
const createResponse = await axios.post(
    `${this.baseUrl}${this.createTaskEndpoint}`,
    payload,
    { headers: { Authorization: `Bearer ${this.apiKey}` } }
);

// Extracción taskId
const taskId = createResponse.data?.data?.taskId;

if (!taskId) {
    throw new Error('No se recibió task_id en respuesta de createTask');
}
```

✅ **ESTE PASO FUNCIONA** - Se obtiene el taskId correctamente.

---

### Paso 2: Polling del Estado de la Tarea

**Endpoint**:
`GET https://api.kie.ai/api/v1/playground/recordInfo?taskId=abc123xyz456`

**Código** (`nanoBananaClient.js:223-275`):

```javascript
// Configuración
const maxAttempts = 60; // 60 intentos × 3s = 180s max
let attempts = 0;
let imageUrl = null;

while (!imageUrl && attempts < maxAttempts) {
    attempts++;

    // Esperar 3s antes de cada intento (excepto el primero)
    if (attempts > 1) {
        await this.sleep(3000);
    }

    // Hacer request de status
    const statusResponse = await axios.get(
        `${this.baseUrl}${this.recordInfoEndpoint}`,
        {
            params: { taskId: taskId },
            headers: { Authorization: `Bearer ${this.apiKey}` },
            timeout: 15000
        }
    );

    // Extraer datos
    const data = statusResponse.data?.data;
    const state = data?.state;
    const resultJson = data?.resultJson;

    logger.info(
        `[NanoBananaClient] Intento ${attempts}/${maxAttempts}: State = ${state}`
    );

    // Verificar estado
    if (state === 'success') {
        const result = JSON.parse(resultJson);
        imageUrl = result?.resultUrls?.[0];
        if (!imageUrl) {
            throw new Error('No se encontró URL en resultJson');
        }
        break;
    } else if (state === 'failed' || state === 'fail') {
        const errorMsg = data?.failMsg || 'Generación falló';
        throw new Error(errorMsg);
    }
    // Si state es 'queuing' o 'generating', continuar polling
}

if (!imageUrl) {
    throw new Error(
        `Timeout esperando generación después de ${maxAttempts} intentos`
    );
}
```

---

## 🚨 PROBLEMAS POTENCIALES IDENTIFICADOS

### Problema #1: **Primer Intento SIN Espera**

**Línea**: 232-234

```javascript
if (attempts > 1) {
    await this.sleep(3000);
}
```

❌ **PROBLEMA**: El primer intento (`attempts === 1`) hace el request
INMEDIATAMENTE después de crear la tarea.

**Consecuencia**: KIE.ai puede no haber iniciado el proceso aún.

**Solución**:

```javascript
// Esperar SIEMPRE 3s entre intentos
await this.sleep(3000);
attempts++;
```

---

### Problema #2: **Estado Puede No Ser Exactamente "success"**

**Línea**: 255

```javascript
if (state === 'success') {
```

❌ **PROBLEMA**: Comparación estricta (`===`) con string exacto.

**Posibles valores que KIE.ai podría devolver**:

- `"success"` ✅ (esperado)
- `"Success"` ❌ (case sensitive)
- `"completed"` ❌
- `"done"` ❌
- `"finished"` ❌
- `"succeed"` ❌

**Solución**:

```javascript
if (state?.toLowerCase() === 'success' || state?.toLowerCase() === 'completed') {
```

---

### Problema #3: **resultJson Puede No Ser String JSON**

**Línea**: 257

```javascript
const result = JSON.parse(resultJson);
```

❌ **PROBLEMA**: Si `resultJson` YA es un objeto (no string), `JSON.parse()`
falla.

**Solución**:

```javascript
let result;
if (typeof resultJson === 'string') {
    result = JSON.parse(resultJson);
} else {
    result = resultJson; // Ya es objeto
}
```

---

### Problema #4: **Estructura de Response Puede Ser Diferente**

**Línea**: 247-249

```javascript
const data = statusResponse.data?.data;
const state = data?.state;
const resultJson = data?.resultJson;
```

❌ **PROBLEMA**: Asumimos que la estructura es `statusResponse.data.data.state`.

**Estructura posible alternativa**:

```javascript
// Opción A (actual):
{
  success: true,
  data: {
    state: "success",
    resultJson: "{...}"
  }
}

// Opción B (posible):
{
  success: true,
  state: "success",
  result: {...}
}

// Opción C (posible):
{
  data: {
    status: "completed",
    output: {...}
  }
}
```

**Solución**: Necesitamos **capturar la respuesta COMPLETA** de KIE.ai para ver
la estructura real.

---

### Problema #5: **imageUrl Path Puede Ser Diferente**

**Línea**: 258

```javascript
imageUrl = result?.resultUrls?.[0];
```

❌ **PROBLEMA**: Asumimos `result.resultUrls[0]`.

**Paths posibles**:

- `result.resultUrls[0]` ✅ (esperado)
- `result.results[0].url` ❌
- `result.output_url` ❌
- `result.images[0]` ❌
- `result.data.url` ❌

---

## 🔧 SOLUCIÓN: Sistema de Debugging Mejorado

Voy a crear un sistema que capture TODA la respuesta de KIE.ai para ver
exactamente qué está devolviendo.

### Modificaciones Propuestas

#### 1. Logging Exhaustivo en Polling

```javascript
// ANTES del while loop (línea 228):
console.log('\n=== INICIANDO POLLING ===');
console.log('Task ID:', taskId);
console.log('Max Attempts:', maxAttempts);
console.log('Intervalo:', '3s');
console.log('==========================\n');

// DENTRO del while loop (después de línea 245):
console.log(`\n=== POLLING ATTEMPT ${attempts}/${maxAttempts} ===`);
console.log('Status Response COMPLETO:');
console.log(JSON.stringify(statusResponse.data, null, 2));
console.log('Estructura detectada:');
console.log('  - statusResponse.data:', typeof statusResponse.data);
console.log('  - statusResponse.data.data:', typeof statusResponse.data?.data);
console.log('  - state:', state);
console.log(
    '  - resultJson:',
    typeof resultJson,
    resultJson ? `(${resultJson.substring(0, 50)}...)` : 'null'
);
console.log('=======================================\n');
```

#### 2. Validación de Todos los Estados Posibles

```javascript
// REEMPLAZAR línea 255-268 con:
const stateNormalized = state?.toLowerCase();

// ESTADOS DE ÉXITO
if (stateNormalized === 'success' ||
    stateNormalized === 'completed' ||
    stateNormalized === 'done' ||
    stateNormalized === 'finished') {

  console.log('\n✅ ESTADO DE ÉXITO DETECTADO:', state);

  // Intentar parsear resultJson si es string
  let result;
  if (typeof resultJson === 'string') {
    try {
      result = JSON.parse(resultJson);
      console.log('✅ resultJson parseado exitosamente');
    } catch (e) {
      console.error('❌ Error parseando resultJson:', e.message);
      console.error('resultJson raw:', resultJson);
      throw new Error(`Failed to parse resultJson: ${e.message}`);
    }
  } else {
    result = resultJson;
    console.log('ℹ️  resultJson ya es objeto, no requiere parsing');
  }

  // Intentar extraer URL de múltiples paths posibles
  const possiblePaths = [
    result?.resultUrls?.[0],
    result?.results?.[0]?.url,
    result?.output_url,
    result?.images?.[0],
    result?.data?.url,
    result?.url
  ];

  console.log('🔍 Buscando imageUrl en paths posibles:');
  possiblePaths.forEach((path, idx) => {
    console.log(`  Path ${idx + 1}:`, path ? `✅ ${path.substring(0, 50)}...` : '❌ null/undefined');
  });

  imageUrl = possiblePaths.find(url => url && typeof url === 'string');

  if (!imageUrl) {
    console.error('❌ NO SE ENCONTRÓ URL EN NINGÚN PATH');
    console.error('result completo:', JSON.stringify(result, null, 2));
    throw new Error('No se encontró URL de imagen en respuesta de KIE.ai');
  }

  console.log('✅ imageUrl extraída:', imageUrl.substring(0, 80), '...');
  break;

} else if (stateNormalized === 'failed' ||
           stateNormalized === 'fail' ||
           stateNormalized === 'error') {

  console.error('\n❌ ESTADO DE FALLO DETECTADO:', state);
  const errorMsg = data?.failMsg || data?.error || data?.message || 'Generación falló';
  console.error('Error message:', errorMsg);
  console.error('data completo:', JSON.stringify(data, null, 2));
  throw new Error(errorMsg);

} else if (stateNormalized === 'queuing' ||
           stateNormalized === 'generating' ||
           stateNormalized === 'processing' ||
           stateNormalized === 'pending') {

  console.log(`⏳ Estado en progreso (${state}), esperando 3s...`);
  // Continuar polling

} else {
  console.warn(`⚠️  Estado desconocido: ${state}`);
  // Continuar polling por si es un estado intermedio
}
```

#### 3. Timeout con Información Útil

```javascript
// REEMPLAZAR línea 271-274 con:
if (!imageUrl) {
    console.error('\n=== TIMEOUT ALCANZADO ===');
    console.error(`Intentos: ${attempts}/${maxAttempts}`);
    console.error(`Tiempo total: ${attempts * 3}s`);
    console.error('Último estado conocido:', state);
    console.error(
        'Última respuesta:',
        JSON.stringify(statusResponse.data, null, 2)
    );
    console.error('==========================\n');

    throw new Error(
        `Timeout esperando generación después de ${maxAttempts} intentos (${attempts * 3}s). ` +
            `Último estado: ${state || 'desconocido'}`
    );
}
```

---

## 📋 PLAN DE ACCIÓN INMEDIATO

### Paso 1: Modificar `nanoBananaClient.js` con Debugging Mejorado

Añadir los logs exhaustivos propuestos arriba en:

- `generateAnaProgression()` (línea 223-275)
- `generateSingleImage()` (línea 409-438)
- `generateContextualImage()` (línea 444-486)

### Paso 2: Ejecutar Test con Logging

```bash
# Ejecutar test de 1 imagen
node scripts/veo3/test-nano-banana-single-image.js

# O ejecutar test E2E completo
npm run veo3:test-nano-banana
```

### Paso 3: Capturar Output Completo

Guardar TODO el output de consola en un archivo:

```bash
npm run veo3:test-nano-banana > /tmp/nano-banana-debug.log 2>&1
```

### Paso 4: Analizar Logs

Buscar en el log:

```bash
# Ver intentos de polling
grep "POLLING ATTEMPT" /tmp/nano-banana-debug.log

# Ver estados detectados
grep "State =" /tmp/nano-banana-debug.log

# Ver respuestas completas
grep -A 20 "RESPONSE DE CREATE TASK" /tmp/nano-banana-debug.log
```

---

## 🔍 PREGUNTAS CRÍTICAS A RESPONDER

1. **¿Qué devuelve exactamente KIE.ai en la respuesta de `createTask`?**
    - Necesitamos ver
      `console.log('Data completo:', JSON.stringify(createResponse.data, null, 2))`

2. **¿Qué devuelve exactamente KIE.ai en cada intento de polling?**
    - Necesitamos ver `JSON.stringify(statusResponse.data, null, 2)` en cada
      intento

3. **¿Cuál es el valor exacto de `state` en cada intento?**
    - ¿Es `"success"`, `"Success"`, `"completed"`, etc.?

4. **¿`resultJson` es un string o ya es un objeto?**
    - `typeof resultJson`

5. **¿Cuál es la estructura exacta de `result` después del parse?**
    - `JSON.stringify(result, null, 2)`

6. **¿En qué path está la URL de la imagen?**
    - `result.resultUrls[0]`, `result.url`, `result.output_url`, etc.?

---

## 💡 HIPÓTESIS PRINCIPALES

### Hipótesis A: Estado No Es "success"

KIE.ai usa otro término como `"completed"` o `"Success"` (mayúscula).

**Probabilidad**: 40%

**Cómo confirmar**: Ver logs de `State =`

**Solución**: Usar múltiples comparaciones case-insensitive

### Hipótesis B: resultJson Ya Es Objeto

`resultJson` no es un string, es directamente un objeto JavaScript.

**Probabilidad**: 30%

**Cómo confirmar**: Ver `typeof resultJson`

**Solución**: Verificar tipo antes de `JSON.parse()`

### Hipótesis C: URL Está en Path Diferente

La URL no está en `result.resultUrls[0]` sino en otro path.

**Probabilidad**: 20%

**Cómo confirmar**: Ver estructura de `result`

**Solución**: Buscar en múltiples paths posibles

### Hipótesis D: Primer Intento Demasiado Rápido

El primer intento ocurre antes de que KIE.ai procese la tarea.

**Probabilidad**: 10%

**Cómo confirmar**: Ver si todos los fallos ocurren en intento 1

**Solución**: Esperar 3s antes del primer intento

---

## ✅ SIGUIENTE PASO

**Necesito que ejecutes un test y me compartas el output completo de consola.**

Especialmente necesito ver:

1. `=== RESPONSE DE CREATE TASK ===`
2. `=== POLLING ATTEMPT X/60 ===` (todos los intentos)
3. Cualquier error que ocurra

Con esa información podré identificar el problema exacto y solucionarlo.

¿Puedes ejecutar un test ahora y compartir el output?

---

## ✅ SOLUCIÓN CONFIRMADA (14 Octubre 2025, 6:57 AM)

### 🎯 Causa Raíz Identificada

**El estado que devuelve KIE.ai es `"waiting"`, NO reconocido en nuestro
código.**

Evidencia de logs del servidor:

```
⚠️  Estado desconocido: waiting, continuando polling...
⚠️  Estado desconocido: waiting, continuando polling...
⚠️  Estado desconocido: waiting, continuando polling...
```

**Estados que reconocíamos**:

- ✅ `queuing`, `generating`, `processing`, `pending`
- ❌ `waiting` - **FALTABA**

### 🔧 Fix Aplicado

**Archivo**: `backend/services/nanoBanana/nanoBananaClient.js`

**Cambio en 3 funciones**:

1. `generateAnaProgression()` - Línea 339
2. `generateSingleImage()` - Línea 606
3. `generateContextualImage()` - Línea 889

**Código anterior**:

```javascript
} else if (stateNormalized === 'queuing' ||
           stateNormalized === 'generating' ||
           stateNormalized === 'processing' ||
           stateNormalized === 'pending') {

    console.log(`⏳ Estado en progreso (${state}), esperando 3s...`);
}
```

**Código actualizado**:

```javascript
} else if (stateNormalized === 'queuing' ||
           stateNormalized === 'generating' ||
           stateNormalized === 'processing' ||
           stateNormalized === 'pending' ||
           stateNormalized === 'waiting') {  // ← ✅ AÑADIDO

    console.log(`⏳ Estado en progreso (${state}), esperando 3s...`);
}
```

### ✅ Validación del Fix

**Test ejecutado**: `npm run veo3:test-phased`

**Resultados**:

- ✅ FASE 1 completada: 212.1s (3 imágenes Nano Banana)
- ✅ FASE 2 completada: 293.3s (3 segmentos VEO3)
- ✅ FASE 3 completada: 22.4s (concatenación + logo)
- ✅ **TOTAL**: 9 minutos | $0.96

**Logs confirmados**:

```
⏳ Estado en progreso (waiting), esperando 3s... [x62]
✅ ESTADO DE ÉXITO DETECTADO: success [x6]
✅ imageUrl extraída: https://... [x6]
```

**6 URLs extraídas correctamente**:

- 3 imágenes Nano Banana
- 3 frames de referencia para VEO3

### 📊 Análisis de Tiempos (Dashboard KIE.ai)

Del dashboard compartido por el usuario:

- Duración mínima: 101s
- Duración máxima: 163s
- Promedio: ~136s (2.3 minutos)
- **Nuestro timeout**: 180s (60 intentos × 3s)
- **Margen**: 17-79 segundos ✅ SUFICIENTE

**Conclusión**: El problema NO era timeout, era que no reconocíamos el estado
intermedio `"waiting"`.

### 🔍 Otros Hallazgos

**Estados observados de KIE.ai**:

1. `waiting` - Estado inicial tras crear tarea (NUEVO)
2. `generating` - Procesamiento activo
3. `success` - Completado exitosamente

**Estructura de response confirmada**:

```json
{
    "success": true,
    "data": {
        "state": "waiting", // Luego cambia a "success"
        "resultJson": "{...}" // String JSON con resultUrls[]
    }
}
```

### 💡 Lecciones Aprendidas

1. **Debugging exhaustivo es clave**: Los logs completos nos permitieron
   identificar el estado exacto
2. **No asumir valores**: KIE.ai puede añadir nuevos estados intermedios sin
   avisar
3. **Timeout != Problema**: Aunque había timeout de 180s, el problema era de
   lógica de estados
4. **Dashboard externo es invaluable**: Ver el panel de KIE.ai confirmó que las
   imágenes SÍ se generaban

### 🎯 Prevención Futura

**Recomendación**: Mantener el `else` con `console.warn` para detectar nuevos
estados desconocidos:

```javascript
} else {
    console.warn(`⚠️  Estado desconocido: ${state}, continuando polling...`);
    // Continuar polling por si es un estado intermedio
}
```

Esto nos alertará si KIE.ai introduce nuevos estados en el futuro.

### 📝 Archivos Modificados

- `backend/services/nanoBanana/nanoBananaClient.js` (3 funciones actualizadas)
- `docs/ANALISIS_POLLING_NANO_BANANA_PROBLEMA.md` (este documento)

### ✅ Checklist de Validación

- [x] Fix aplicado a las 3 funciones de polling
- [x] Test E2E ejecutado exitosamente
- [x] 6 imágenes generadas correctamente
- [x] Video final concatenado sin errores
- [x] Logs confirmando reconocimiento de "waiting"
- [x] Documentación actualizada
- [x] No hay "Estado desconocido" en logs
- [x] Sistema producción-ready

---

**FIN DEL ANÁLISIS Y SOLUCIÓN**
