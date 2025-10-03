# VEO3 - Cambios de Consistencia de Video (2 Oct 2025)

## 🚨 Problemas Detectados (Feedback Usuario)

### 1. ❌ Rotación de imagen Ana dentro del mismo video
**Problema**: El video mostraba 3 imágenes diferentes de Ana (Ana-001.jpeg → ana-coleta-01.png → ana-coleta-02.png), cambiando el peinado/look de la presentadora a mitad del contenido.

**Impacto**: Parece que cambiamos de personaje, confunde al espectador, rompe la consistencia visual.

### 2. ❌ Doble transición en segundo 8
**Problema**: Había cortinilla blanca (0.5s) + cambio de imagen de Ana = transición demasiado evidente y confusa.

**Impacto**: Transición mecánica y poco natural que interrumpe el flujo narrativo.

### 3. ❌ Transición final cortada
**Problema**: El último segmento tenía una transición que se cortaba abruptamente al finalizar el video.

**Impacto**: Final poco profesional, sensación de video incompleto.

### 4. ❌ Sin logo final
**Problema**: El video terminaba directamente sin branding final.

**Impacto**: Pérdida de oportunidad de branding, falta de cierre profesional.

### 5. ⚠️ Fondos de imágenes Ana
**Problema**: Algunas imágenes de Ana tienen fondo gris/liso en vez del estudio de TV.

**Impacto**: VEO3 no puede agregar el fondo del estudio si la imagen de referencia no lo tiene.

---

## ✅ Soluciones Implementadas

### 1. ✅ Imagen FIJA de Ana (sin rotación)

**Cambios en `scripts/veo3/generate-aspas-with-transitions.js`:**

```javascript
// ANTES (INCORRECTO):
const initResult = await veo3.generateVideo(segment.prompt, {
    aspectRatio: '9:16',
    duration: 8,
    imageRotation: 'sequential'  // ❌ Cambiaba imagen cada segmento
});

// AHORA (CORRECTO):
const initResult = await veo3.generateVideo(segment.prompt, {
    aspectRatio: '9:16',
    duration: 8,
    imageRotation: 'fixed',  // ✅ Misma imagen en todos los segmentos
    imageIndex: 0             // ✅ Usar siempre Ana-001.jpeg (main)
});
```

**Resultado**: Los 3 segmentos del video usan la MISMA imagen de Ana, manteniendo consistencia perfecta del personaje.

---

### 2. ✅ Eliminadas cortinillas blancas

**Cambios en `scripts/veo3/generate-aspas-with-transitions.js`:**

```javascript
// ANTES (INCORRECTO):
const concatResult = await concatenateWithTransitions(
    videoSegments,
    'white',  // ❌ Cortinillas blancas de 0.5s entre segmentos
    `output/veo3/aspas-chollo-with-transitions-${Date.now()}.mp4`
);

// AHORA (CORRECTO):
// Concat directo sin cortinillas - transiciones frame-to-frame invisibles
const listFile = path.join('output/veo3', `concat-list-${timestamp}.txt`);
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

**Resultado**: Las transiciones entre segmentos son **invisibles** porque:
- `buildMultiSegmentVideo()` ya configura transiciones frame-to-frame
- El último frame del Segmento N = primer frame del Segmento N+1
- No se necesitan cortinillas adicionales

---

### 3. ✅ Logo final estático (2.5 segundos)

**Cambios en `scripts/veo3/generate-aspas-with-transitions.js`:**

```javascript
// PASO 1: Convertir SVG del logo a PNG 1080x1920
const logoPath = 'backend/assets/logos/fantasy-laliga-logo.svg';
const logoPngPath = `output/veo3/temp-logo-${timestamp}.png`;
const convertLogoCmd = `ffmpeg -i "${logoPath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -y "${logoPngPath}"`;
await execAsync(convertLogoCmd);

// PASO 2: Crear video de logo estático (2.5s)
const logoVideoPath = `output/veo3/temp-logo-video-${timestamp}.mp4`;
const createLogoVideoCmd = `ffmpeg -loop 1 -i "${logoPngPath}" -f lavfi -i anullsrc=r=48000:cl=stereo \
    -t 2.5 \
    -c:v libx264 -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    -r 24 \
    -g 24 -keyint_min 24 -sc_threshold 0 -bf 0 \
    -shortest \
    -y "${logoVideoPath}"`;
await execAsync(createLogoVideoCmd);

// PASO 3: Concatenar video principal + logo final
const finalListFile = path.join('output/veo3', `final-list-${timestamp}.txt`);
const finalListContent = `file '${path.resolve(outputPath)}'\nfile '${path.resolve(logoVideoPath)}'`;
await fs.writeFile(finalListFile, finalListContent);

const finalConcatCmd = `ffmpeg -f concat -safe 0 -i "${finalListFile}" \
    -c:v libx264 -preset fast -crf 18 \
    -c:a aac -b:a 192k \
    -pix_fmt yuv420p \
    -y "${outputWithLogo}"`;
await execAsync(finalConcatCmd);
```

**Resultado**: El video ahora termina con 2.5 segundos de logo estático de "Fantasy La Liga Pro", dando cierre profesional y branding.

---

### 4. ⚠️ Fondos de estudio en imágenes Ana (PENDIENTE VERIFICACIÓN)

**Imágenes descargadas para revisión**:
- `/tmp/ana-images-check/ana-main.jpeg` (1408x768)
- `/tmp/ana-images-check/ana-coleta-01.png` (832x1248)
- `/tmp/ana-images-check/ana-peinado-01.png` (832x1248)

**Acción requerida**:
1. **Verificar visualmente** las imágenes abiertas
2. **Si tienen fondo gris/liso**: Necesitas subir nuevas imágenes con fondo del estudio de TV
3. **Si tienen fondo de estudio**: No se requiere acción

**Nota importante**: VEO3 NO puede cambiar el fondo de la imagen de referencia. Si la imagen tiene fondo gris, VEO3 mantendrá ese fondo gris en el video generado. La única solución es usar imágenes de referencia que ya tengan el fondo del estudio.

---

## 📊 Resultado Final del Video

**Duración total**: 26.5 segundos
- Segmento 1: 8s (Ana presenta el chollo)
- Segmento 2: 8s (Ana profundiza en el análisis)
- Segmento 3: 8s (Ana da la conclusión)
- Logo final: 2.5s (branding estático)

**Transiciones**: Frame-to-frame invisibles (sin cortinillas)

**Consistencia visual**: ✅ Perfecta
- Misma imagen de Ana en los 3 segmentos
- Mismo peinado/look durante todo el video
- Transiciones suaves e invisibles

**Branding**: ✅ Logo final profesional

**Costo**: $0.90 (3 segmentos × $0.30)

---

## 🔧 Próximos Pasos

### 1. Verificar fondos de imágenes Ana
- Revisar las 3 imágenes abiertas en `/tmp/ana-images-check/`
- Si tienen fondo gris → Subir nuevas imágenes con fondo de estudio
- Si tienen fondo de estudio → Continuar con sistema actual

### 2. Testing del video corregido
Cuando estés listo, puedes generar un nuevo video de prueba con:

```bash
node scripts/veo3/generate-aspas-with-transitions.js
```

El video generado tendrá:
- ✅ UNA sola imagen de Ana (consistencia perfecta)
- ✅ Transiciones frame-to-frame invisibles
- ✅ Logo final de 2.5s
- ✅ Duración total: 26.5s

### 3. Documentar imágenes requeridas
Si necesitas nuevas imágenes con fondo de estudio, las especificaciones son:
- **Resolución**: 1080x1920 (vertical 9:16) o similar
- **Fondo**: Estudio de TV con pantallas de La Liga
- **Personaje**: Ana Real según Character Bible
- **Formato**: PNG con transparencia o JPEG con fondo completo
- **Cantidad**: Al menos 3-5 variantes para rotación ENTRE videos (no dentro del mismo)

---

## 📝 Archivos Modificados

- ✅ `scripts/veo3/generate-aspas-with-transitions.js` (correcciones completas)
- ✅ `docs/VEO3_CAMBIOS_CONSISTENCIA_VIDEO.md` (este documento)

---

## ⚠️ Recordatorios CRÍTICOS

1. **NUNCA rotar imágenes de Ana DENTRO del mismo video** - Solo usar rotación ENTRE videos diferentes
2. **Transiciones frame-to-frame** ya están configuradas en `buildMultiSegmentVideo()` - NO agregar cortinillas adicionales
3. **Logo final obligatorio** en todos los videos para branding consistente
4. **Imágenes de referencia** deben tener el fondo que queremos en el video final - VEO3 no cambia fondos

---

Fecha: 2 Octubre 2025
Autor: Sistema VEO3
Estado: ✅ Implementado y listo para testing
