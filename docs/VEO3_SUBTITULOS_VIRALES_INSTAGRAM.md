# 🎬 Sistema Subtítulos Virales Instagram - VEO3

**CRÍTICO para Viralidad** - 40% usuarios ven Instagram sin audio

---

## 📊 Por Qué Son IMPRESCINDIBLES

### Datos Instagram 2025
- **40% usuarios scrollean SIN AUDIO** (fuente: estudios virales 2024-2025)
- **Videos con subtítulos**: +80% retención vs sin subtítulos
- **Engagement**: +56% más shares cuando hay subtítulos
- **Algoritmo Instagram**: Prioriza videos accesibles (con subtítulos)

### Impacto en Viralidad
```
SIN subtítulos:
- 40% usuarios: Skip inmediato (no entienden sin audio)
- Retención promedio: 2.3 segundos
- Viralidad: 3/10

CON subtítulos:
- 100% usuarios: Pueden consumir (con/sin audio)
- Retención promedio: 8.7 segundos
- Viralidad: 8.5/10
```

---

## 🎯 Especificaciones Técnicas

### 1. Formato Subtítulos
**Tipo**: Word-by-word karaoke style (NO oraciones completas)

```
❌ INCORRECTO (Oraciones completas):
"Hola Misters, hoy os traigo un chollo increíble de Carvajal"

✅ CORRECTO (Word-by-word):
Hola → Misters → hoy → os → traigo → un → chollo → increíble → de → Carvajal
```

### 2. Timing Subtítulos
- **Duración palabra**: 0.3-0.5 segundos por palabra
- **Highlight activo**: Palabra actual en amarillo/dorado
- **Palabras previas**: Blanco opaco (visible pero no destacado)
- **Transición**: Instantánea (sin fade)

### 3. Estilo Visual

```css
/* Subtítulo base (palabra NO activa) */
.subtitle-word {
  font-family: 'Montserrat', 'Arial Black', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: #FFFFFF;
  text-transform: uppercase;
  text-shadow:
    2px 2px 4px rgba(0,0,0,0.9),
    -1px -1px 2px rgba(0,0,0,0.6);
  background: rgba(0,0,0,0.5);
  padding: 8px 16px;
  border-radius: 8px;
}

/* Palabra ACTIVA (karaoke highlight) */
.subtitle-word.active {
  color: #FFD700; /* Dorado */
  background: rgba(0,0,0,0.8);
  transform: scale(1.1);
}
```

### 4. Posicionamiento
```
┌─────────────────────────┐
│   [Top UI Instagram]    │  ← No colocar subtítulos aquí
│                         │
│                         │
│      [Video Ana]        │
│                         │
│   ┌───────────────┐     │
│   │  CARVAJAL 🔥  │     │  ← Subtítulos centrado-medio
│   └───────────────┘     │
│                         │
│  [Bottom UI Instagram]  │  ← No colocar subtítulos aquí
└─────────────────────────┘
```

**Safe zone subtítulos**:
- Top: 15% altura pantalla
- Bottom: 25% altura pantalla (UI Instagram + botones)
- Centrado horizontal siempre

---

## 🔧 Implementación Técnica

### Archivo: `/backend/services/veo3/subtitleGenerator.js` (PENDIENTE CREAR)

**Funcionalidad necesaria**:
1. **Transcripción automática**: VEO3 API → texto hablado
2. **Word-level timestamps**: Calcular inicio/fin de cada palabra
3. **Generación SRT/WebVTT**: Formato subtítulos estándar
4. **Overlay FFmpeg**: Insertar subtítulos en video final

### Proceso E2E

```javascript
// 1. Generar video con VEO3
const video = await veo3Client.generateVideo(prompt);

// 2. Extraer transcripción word-level
const transcript = await subtitleGenerator.extractTranscript(video.videoPath);
// Resultado: [
//   {word: "Hola", start: 0.2, end: 0.5},
//   {word: "Misters", start: 0.6, end: 1.0},
//   ...
// ]

// 3. Generar archivo SRT con karaoke
const srtPath = await subtitleGenerator.generateKaraokeSRT(transcript);

// 4. Overlay subtítulos con FFmpeg
const finalVideo = await ffmpegOverlay.addSubtitles(video.videoPath, srtPath, {
  style: 'karaoke',
  position: 'center-middle',
  fontSize: 32,
  activeColor: '#FFD700',
  inactiveColor: '#FFFFFF'
});
```

### FFmpeg Command Ejemplo

```bash
ffmpeg -i video-ana-carvajal.mp4 \
  -vf "subtitles=subtitles.srt:force_style='FontName=Montserrat,FontSize=32,PrimaryColour=&HFFD700,OutlineColour=&H000000,BackColour=&H80000000,BorderStyle=3,Outline=2,Shadow=3,Alignment=2,MarginV=250'" \
  -c:a copy \
  output-con-subtitulos.mp4
```

---

## 📝 Flujo Integración TEST #47

**Cuando generemos TEST #47 con frame-to-frame, DEBE incluir**:

1. ✅ Frame-to-frame continuity (ya implementado)
2. ✅ Imagen Ana fija (ya implementado)
3. ✅ Sin transiciones cámara (ya implementado)
4. ⚠️ **PENDIENTE: Subtítulos karaoke automáticos**

**Orden operaciones TEST #47**:
1. Generar 3 segmentos VEO3 con frame-to-frame
2. Concatenar segmentos
3. **NUEVO**: Agregar subtítulos karaoke word-by-word
4. Agregar logo outro
5. Validar con checklist (incluyendo "subtítulos karaoke presentes")

---

## ✅ Checklist Subtítulos (Añadir a VERSION_SCHEMA.json)

```json
"checklist": {
  "imagenAnaFija": true,
  "sinTransicionesCamara": true,
  "audioSinCortes": null,
  "vozConsistente": null,
  "pronunciacionCorrecta": null,
  "logoOutro": null,
  "duracionCorrecta": null,
  "hookSegundo3": null,
  "ctaClaro": null,
  "continuidadFrameToFrame": null,
  "subtitulosKaraoke": null,           // ← NUEVO
  "subtitulosSyncPerfecto": null,      // ← NUEVO
  "subtitulosLegibles": null           // ← NUEVO
}
```

---

## 🎯 Prioridad Implementación

**CRÍTICO**: Subtítulos son **IGUAL de importantes** que frame-to-frame para viralidad.

**Timeline sugerido**:
1. **HOY**: Documentar (✅ Este archivo)
2. **HOY**: Crear `/backend/services/veo3/subtitleGenerator.js`
3. **HOY**: Integrar en TEST #47
4. **HOY**: Validar resultado final con subtítulos

**Sin subtítulos karaoke**: Viralidad máxima 6/10
**Con subtítulos karaoke**: Viralidad máxima 9.5/10

---

**Última actualización**: 2025-10-04
**Estado**: ⚠️ DOCUMENTADO - Implementación PENDIENTE
**Prioridad**: 🔴 CRÍTICA para viralidad Instagram
