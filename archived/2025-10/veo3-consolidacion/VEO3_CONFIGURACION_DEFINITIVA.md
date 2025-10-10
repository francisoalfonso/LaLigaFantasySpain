# VEO3 - Configuración Definitiva Acordada (3 Oct 2025)

## 🚨 ACUERDOS CRÍTICOS - NO MODIFICAR

### ⭐ NORMA #1 - CONSISTENCIA DE ANA (CRÍTICA)

**Ana debe ser SIEMPRE la misma persona en todos los segmentos del mismo video.**

#### Configuración Obligatoria

```javascript
// 1. SEED FIJO - NUNCA CAMBIAR
const ANA_CHARACTER_SEED = 30001;

// 2. IMAGEN FIJA - Misma imagen en todos los segmentos
const imageConfig = {
    imageRotation: 'fixed',  // NO usar 'random' o 'sequential'
    imageIndex: 0            // Siempre Ana-001.jpeg
};

// 3. CHARACTER BIBLE - Con negativas explícitas
const ANA_CHARACTER_BIBLE = `A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. NO watch, NO jewelry, NO accessories. Confident posture, natural hand gestures for emphasis, professional broadcaster energy`;
```

**Verificación:** Todos los segmentos deben mostrar:
- ✅ Mismo peinado (coleta profesional)
- ✅ Mismo vestuario (blazer azul marino)
- ✅ NO accesorios (sin reloj, sin joyas)
- ✅ Misma iluminación y fondo

---

### ⭐ NORMA #2 - AUDIO ESPAÑOL DE ESPAÑA (CRÍTICA)

**TODOS los prompts DEBEN incluir "SPANISH FROM SPAIN (not Mexican Spanish)" para evitar acento mexicano.**

```javascript
// ✅ CORRECTO - SIEMPRE incluir en el texto del prompt
const prompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}". Exact appearance from reference image.`;

// ❌ INCORRECTO - NO confiar solo en voice.locale
const voice = {
    locale: 'es-ES',  // ⚠️ ESTO SOLO NO BASTA
    gender: 'female'
};
```

---

### ⭐ NORMA #3 - PROMPTS SIMPLES SIN TRANSICIONES (CRÍTICA)

**NUNCA usar `buildMultiSegmentVideo()` o mencionar transiciones frame-to-frame en prompts.**

#### ❌ PROHIBIDO - Genera diferentes Anas

```javascript
// ❌ NO USAR
const segments = promptBuilder.buildMultiSegmentVideo('chollo', contentData, 3);

// ❌ NO USAR - Prompts con transiciones
const prompt = `[FRAME INICIAL 0-1s - TRANSITION FROM PREVIOUS SEGMENT]
Ana Martínez, 32-year-old Spanish sports analyst...`;
```

#### ✅ CORRECTO - Prompts simples

```javascript
// ✅ USAR SIEMPRE
const segments = [
    {
        prompt: promptBuilder.buildCholloPrompt(playerName, price, {
            team: 'Celta',
            ratio: 1.4,
            dialogue: `¡Misters! Vamos con un chollo que no puedes dejar pasar...`
        })
    },
    {
        prompt: promptBuilder.buildCholloPrompt(playerName, price, {
            team: 'Celta',
            ratio: 1.4,
            dialogue: `${playerName} del Celta está a solo ${price} millones.`
        })
    }
];
```

**Por qué:** VEO3 interpreta "TRANSITION FROM PREVIOUS SEGMENT" como instrucción para generar efecto visual de transición, lo que resulta en Anas diferentes entre segmentos.

---

### ⭐ NORMA #4 - CONCATENACIÓN SIMPLE (CRÍTICA)

**NO usar cortinillas blancas/azules ni efectos de transición en FFmpeg.**

#### ✅ Concatenación Correcta

```javascript
// Concat directo con cortes limpios
const listFile = path.join('output/veo3', 'concat-list.txt');
let listContent = '';

for (const videoPath of videoSegments) {
    listContent += `file '${path.resolve(videoPath)}'\n`;
}

await fs.writeFile(listFile, listContent);

const concatCmd = `ffmpeg -f concat -safe 0 -i "${listFile}" \
    -c:v libx264 -preset fast -crf 18 \
    -c:a aac -b:a 192k \
    -pix_fmt yuv420p \
    -y "${outputPath}"`;

await execAsync(concatCmd);
```

#### ❌ NO Usar

```javascript
// ❌ NO agregar cortinillas blancas
// ❌ NO usar crossfade
// ❌ NO usar efectos de transición
```

---

## 📝 SCRIPT CORRECTO DE REFERENCIA

**Archivo:** `scripts/veo3/generate-aspas-clean.js`

Este script implementa TODAS las normas acordadas:

1. ✅ Imagen Ana fija (imageIndex: 0)
2. ✅ Prompts simples sin transiciones
3. ✅ Concatenación directa sin cortinillas
4. ✅ Character Bible con negativas

**Uso:**
```bash
node scripts/veo3/generate-aspas-clean.js
```

---

## 🚫 SCRIPTS OBSOLETOS - NO USAR

- ❌ `generate-aspas-with-transitions.js` - Usa buildMultiSegmentVideo()
- ❌ `test-frame-to-frame-transition.js` - Sistema de transiciones obsoleto

---

## ⭐ NORMA #5 - SOLO APELLIDOS DE JUGADORES (CRÍTICA) 🆕

**NUNCA usar nombres completos de futbolistas en los prompts de VEO3.**

KIE.ai **rechaza prompts con nombres completos de jugadores** por derechos de imagen (Error 422).

#### ❌ PROHIBIDO - Causa error 422

```javascript
const dialogue = "Iago Aspas del Celta está a solo 8 millones...";  // ❌ Error 422
```

#### ✅ CORRECTO - Funciona

```javascript
const dialogue = "Aspas del Celta está a solo 8 millones...";  // ✅ OK
```

**Regla**: Usar solo apellidos o apodos (Aspas, Lewa, Vini, Pedri, etc.)

Ver documentación completa: `docs/VEO3_NOMBRES_BLOQUEADOS.md`

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de generar cualquier video multi-segmento, verificar:

- [ ] **Imagen fija:** `imageRotation: 'fixed', imageIndex: 0`
- [ ] **Prompts simples:** Usando `buildCholloPrompt()` directamente
- [ ] **NO transiciones:** Ningún prompt menciona "TRANSITION" o "FRAME INICIAL"
- [ ] **Character Bible:** Incluye "NO watch, NO jewelry, NO accessories"
- [ ] **Español España:** Todos los prompts incluyen "SPANISH FROM SPAIN (not Mexican Spanish)"
- [ ] **Solo apellidos:** NUNCA usar nombres completos (Aspas, NO "Iago Aspas") 🆕
- [ ] **Concatenación limpia:** FFmpeg concat simple sin cortinillas

---

## 📊 RESULTADOS ESPERADOS

Con esta configuración correcta:

- ✅ **Consistencia Ana:** 100% - Misma apariencia en todos los segmentos
- ✅ **Audio correcto:** Español de España sin acento mexicano
- ✅ **Transiciones invisibles:** Cortes directos limpios
- ✅ **Sin efectos visuales:** No aparecen cortinillas azules/blancas
- ✅ **Costo:** $0.30 por segmento de 8s
- ✅ **Tiempo:** 4-6 minutos por segmento

---

## 🔧 TROUBLESHOOTING

### Problema: Ana diferente entre segmentos

**Causa:** Prompts usando buildMultiSegmentVideo() con descripciones de transición.

**Solución:** Usar solo buildCholloPrompt() simple.

### Problema: Aparecen cortinillas azules/visuales

**Causa:** Prompts mencionan "TRANSITION FROM PREVIOUS SEGMENT".

**Solución:** Eliminar toda mención de transiciones en prompts.

### Problema: Acento mexicano en audio

**Causa:** Falta "SPANISH FROM SPAIN (not Mexican Spanish)" en prompt.

**Solución:** Agregar explícitamente en TODOS los prompts.

---

Fecha: 3 Octubre 2025
Estado: ✅ Configuración definitiva acordada
Próxima revisión: Después de validar video con generate-aspas-clean.js
