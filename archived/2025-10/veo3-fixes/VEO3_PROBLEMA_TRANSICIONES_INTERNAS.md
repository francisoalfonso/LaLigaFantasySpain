# VEO3 - Problema Transiciones Internas (2 Oct 2025 23:15h)

## 🚨 Problema Detectado

**Captura segundo 24**: Video muestra transición azul con texto "ASTA LA LIGA" entre segmentos.

### Causa Raíz

Las transiciones NO son cortinillas agregadas por FFmpeg. Son **transiciones generadas internamente por VEO3** cuando usamos el sistema de "frame-to-frame transitions".

**Por qué sucede:**
1. `buildMultiSegmentVideo()` describe "transiciones frame-to-frame" en los prompts
2. VEO3 interpreta esto como "crear efecto visual de transición"
3. VEO3 genera efectos azules/animaciones entre segmentos
4. El resultado es una transición VISIBLE en vez de invisible

### Evidencia del Problema

```javascript
// promptBuilder.js - buildSegmentWithTransition()
const transitionFrame = `
[FRAME INICIAL 0-1s - TRANSITION FROM PREVIOUS SEGMENT]
Ana Martínez, 32-year-old Spanish sports analyst, in professional Fantasy La Liga studio...
`;
```

VEO3 lee "TRANSITION FROM PREVIOUS SEGMENT" y crea un efecto visual.

## ❌ Lo Que NO Funciona

### Intento 1: Frame-to-frame transitions
- **Método**: Describir último frame del segmento N y usarlo como primer frame del segmento N+1
- **Resultado**: VEO3 genera transiciones visuales azules/animaciones
- **Estado**: ❌ NO funciona - transiciones visibles

### Intento 2: Cortinillas blancas FFmpeg
- **Método**: Agregar videos blancos de 0.5s entre segmentos
- **Resultado**: Doble transición (cortinilla + frame-to-frame)
- **Estado**: ❌ NO funciona - muy evidente

### Intento 3: Imagen específica con fondo de estudio
- **Método**: Usar ana-estudio.jpg / ana-estudio-1024.jpg
- **Resultado**: VEO3 rechaza con error "failed"
- **Estado**: ❌ NO funciona - imagen rechazada

### Intento 4: Ana-001.jpeg fija
- **Método**: Usar Ana-001.jpeg en los 3 segmentos
- **Resultado**: VEO3 rechaza con error "failed"
- **Estado**: ❌ NO funciona - prompt rechazado

## ✅ Solución Correcta

### Usar Prompts Simples SIN Mencionar Transiciones

**Eliminar completamente:**
- ❌ "TRANSITION FROM PREVIOUS SEGMENT"
- ❌ "FRAME INICIAL"
- ❌ "FRAME FINAL"
- ❌ Descripciones de posición neutral
- ❌ buildMultiSegmentVideo()

**Usar únicamente:**
- ✅ buildCholloPrompt() simple
- ✅ buildAnalysisPrompt() simple
- ✅ buildPredictionPrompt() simple

### Implementación

```javascript
// CORRECTO - Prompts simples sin transiciones
const segments = [
    {
        prompt: promptBuilder.buildCholloPrompt(
            CONFIG.contentData.playerName,
            CONFIG.contentData.price,
            {
                team: CONFIG.contentData.team,
                ratio: CONFIG.contentData.valueRatio,
                dialogue: `¿Buscas un chollo en Fantasy? Mira esto...`
            }
        )
    },
    {
        prompt: promptBuilder.buildCholloPrompt(
            CONFIG.contentData.playerName,
            CONFIG.contentData.price,
            {
                team: CONFIG.contentData.team,
                ratio: CONFIG.contentData.valueRatio,
                dialogue: `${CONFIG.contentData.playerName} está a solo ${CONFIG.contentData.price}M.`
            }
        )
    },
    {
        prompt: promptBuilder.buildCholloPrompt(
            CONFIG.contentData.playerName,
            CONFIG.contentData.price,
            {
                team: CONFIG.contentData.team,
                ratio: CONFIG.contentData.valueRatio,
                dialogue: `No lo dejes pasar. Calidad-precio brutal.`
            }
        )
    }
];
```

### Concatenación Simple

```javascript
// Concat directo sin cortinillas
const listFile = path.join('output/veo3', `concat-list-${timestamp}.txt`);
let listContent = '';

for (const videoPath of videoSegments) {
    listContent += `file '${path.resolve(videoPath)}'\\n`;
}

await fs.writeFile(listFile, listContent);

const concatCmd = `ffmpeg -f concat -safe 0 -i "${listFile}" \\
    -c:v libx264 -preset fast -crf 18 \\
    -c:a aac -b:a 192k \\
    -pix_fmt yuv420p \\
    -y "${outputPath}"`;

await execAsync(concatCmd);
```

## 🎯 Configuración Final Correcta

1. **Prompts**: buildCholloPrompt() SIN transiciones
2. **Imagen**: Sistema de rotación normal (sin forzar específica)
3. **Concatenación**: FFmpeg concat simple
4. **Logo**: Agregar 3s estáticos al final
5. **Character Bible**: Mantener "NO watch, NO jewelry, NO accessories"

## 📝 Próxima Acción

Modificar `generate-aspas-with-transitions.js` para:
1. Eliminar mención de transiciones frame-to-frame
2. Usar prompts simples buildCholloPrompt()
3. Permitir rotación automática de imágenes (funciona mejor que forzar)
4. Confiar en que los cortes directos sean suficientes

---

Fecha: 2 Octubre 2025 23:15h
Estado: ⚠️ Problema identificado - Solución pendiente implementación
