# Sistema de Tarjetas de Jugador - VEO3 Player Card Overlay

**Fecha de implementación**: 6 de octubre de 2025
**Estado**: ✅ VALIDADO Y FUNCIONANDO
**Versión**: 1.0

---

## 📋 Descripción

Sistema de overlay de tarjetas de jugador para videos de Instagram Reels generados con VEO3. Las tarjetas muestran información del jugador (foto, nombre, stats) con animación slide-in y se superponen sobre los subtítulos virales existentes.

---

## ✨ Características

### Diseño Visual
- **Dimensiones**: 320x100px
- **Fondo**: Blanco con 78% opacidad (22% transparente - se ve el fondo de Ana)
- **Border-radius**: 10px
- **Sombra**: `0 4px 12px rgba(0, 0, 0, 0.15)`

### Contenido de la Tarjeta
1. **Foto del jugador**: Circular, 80x80px (izquierda)
2. **Nombre del jugador**: Fuente bold, 18px
3. **Logo del equipo**: 20x20px (junto al nombre)
4. **Badge de posición**: Esquina superior derecha (DEF, MID, FWD, GK)
5. **3 Stats principales**:
   - Partidos jugados
   - Goles
   - Rating

### Posicionamiento
- **Posición X**: 0 (pegado al borde izquierdo del video)
- **Posición Y**: 870px (para videos 720x1280)
- **Cálculo**: `y = 1280 - 100 - 310 = 870px`
- **Margen desde el fondo**: 310px

### Animación
- **Tipo**: Slide-in desde la izquierda
- **Inicio**: Segundo 3.0
- **Duración**: 3.0 segundos (visible hasta segundo 6.0)
- **Slide-in duration**: 0.5 segundos
- **Posición inicial**: x = -320 (fuera de pantalla)
- **Posición final**: x = 0 (borde izquierdo)

---

## 🎨 Diseño de Colores

### Badge de Posición
- **Fondo**: `#3B82F6` (azul)
- **Texto**: Blanco
- **Padding**: 4px 8px
- **Font-size**: 10px
- **Font-weight**: 700

### Stats
- **Valores**: `#3B82F6` (azul) - 22px bold
- **Labels**: `#666666` (gris) - 9px uppercase

---

## 📂 Arquitectura del Sistema

### Archivos Principales

```
backend/services/veo3/
├── playerCardOverlay.js          # Servicio principal
└── ...

scripts/veo3/
├── apply-card-quick.js            # Aplicar tarjeta a video existente
├── test-card-real-data.js         # Test completo con datos reales
└── ...

data/
└── player-photos/                 # Fotos locales de jugadores (por ID)
    └── {player_id}.jpg
```

### Servicio: `playerCardOverlay.js`

**Clase**: `PlayerCardOverlay`

**Métodos principales**:
- `generateCardImage(playerData)` - Genera PNG de la tarjeta usando Puppeteer
- `getPlayerPhoto(playerData)` - Obtiene foto (local → API → placeholder)
- `getTeamLogo(playerData)` - Obtiene logo del equipo como data URI
- `generateCardHTML(playerData)` - Genera HTML de la tarjeta
- `applyCardOverlay(videoPath, cardImagePath, options)` - Aplica overlay con FFmpeg

---

## 🔧 Configuración Técnica

### Parámetros de Posición (playerCardOverlay.js)

```javascript
this.cardWidth = 320;   // Ancho de la tarjeta
this.cardHeight = 100;  // Alto de la tarjeta

this.cardPosition = {
    x: 0,   // Pegado al borde izquierdo (sin margen)
    y: 870  // 870px desde arriba (310px desde el fondo)
};

this.animation = {
    startTime: 3.0,      // Aparece en el segundo 3
    duration: 3.0,       // Visible durante 3 segundos
    slideInDuration: 0.5 // Animación de entrada dura 0.5s
};
```

### HTML/CSS (Transparencia)

```css
body {
    background: rgba(255, 255, 255, 0.78); /* 78% opacidad */
}
```

### FFmpeg Overlay Filter

```javascript
const overlayFilter = `[0:v][1:v]overlay=` +
    `x='if(between(t,3.0,3.5),` +
    `-320+((0-(-320))*((t-3.0)/0.5)),` +
    `if(between(t,3.5,6.0),0,-320))':` +
    `y=870:` +
    `enable='between(t,3.0,6.0)'`;
```

---

## 📊 Fuente de Datos

### Sistema de Chollos (BargainsDataService)

Las tarjetas obtienen datos del sistema de chollos existente:

**Endpoint**: `GET /api/bargains/top?limit=50`

**Estructura de datos**:
```javascript
{
    id: 733,                          // ID del jugador (API-Sports)
    name: "Dani Carvajal",
    photo: "https://...",             // URL de la foto
    team: "Real Madrid",
    teamLogo: "https://...",          // URL del logo del equipo
    position: "DEF",
    stats: {
        games: 6,
        goals: 0,
        rating: "6.93"
    }
}
```

### Sistema de Caché

- **TTL**: 30 minutos
- **Primera llamada**: ~30 segundos (calcula todos los chollos)
- **Siguientes llamadas**: <1 segundo (usa caché)
- **Servicio**: `BargainAnalyzer` con `BargainCache`

---

## 🎬 Workflow de Generación

### Proceso Completo

1. **Obtener datos del chollo** desde `/api/bargains/top`
2. **Generar tarjeta PNG** con Puppeteer (HTML → PNG)
   - Descarga foto del jugador (local → API → placeholder)
   - Descarga logo del equipo
   - Renderiza HTML con todos los datos
3. **Aplicar overlay al video** con FFmpeg
   - Video base: Test #47 CON subtítulos virales
   - Tarjeta: PNG generado
   - Animación: Slide-in desde izquierda

### Comando de Ejecución

```bash
# Aplicar tarjeta al video Test #47 (con subtítulos)
node scripts/veo3/apply-card-quick.js
```

**Resultado**:
- Video: `/output/veo3/test-card-real-data.mp4`
- Duración total: ~24 segundos
- Subtítulos virales: Todo el video
- Tarjeta jugador: Segundo 3-6

---

## ✅ Validación Final

### Test #47 - Dani Carvajal

**Video base**: `ana-test47-with-captions.mp4`
**Video final**: `test-card-real-data.mp4`
**Preview móvil**: `http://localhost:3000/test-history.html`

**Elementos validados**:
- ✅ Subtítulos virales visibles todo el video
- ✅ Tarjeta aparece en segundo 3 con slide-in
- ✅ Tarjeta pegada al borde izquierdo (x=0)
- ✅ Tarjeta NO tapa el nombre del perfil (y=870)
- ✅ Fondo semi-transparente (78% opacidad)
- ✅ Logo del Real Madrid visible
- ✅ Badge "DEF" en esquina superior derecha
- ✅ Datos reales: 6 partidos, 0 goles, 6.93 rating
- ✅ Foto real de Carvajal
- ✅ Ambos overlays conviven sin solaparse

---

## 🎯 Casos de Uso

### 1. Videos de Chollos
- Mostrar tarjeta del jugador chollo en segundo 3-6
- Stats actualizados de la temporada 2025-26
- Logo del equipo para identificación visual

### 2. Videos de Análisis
- Mostrar stats del jugador analizado
- Badge de posición para contexto
- Foto oficial del jugador

### 3. Videos de Breaking News
- Tarjeta del jugador protagonista
- Stats actuales para comparación
- Identificación rápida del equipo

---

## 🔄 Integración con VEO3

### Compatibilidad

El sistema de tarjetas es **100% compatible** con:
- ✅ Subtítulos virales karaoke (word-by-word)
- ✅ Sistema frame-to-frame de VEO3
- ✅ Preset `chollo_quick` (2×7s = 14s)
- ✅ Logo outro automático
- ✅ Sistema de concatenación sin crossfade

### Orden de Overlays

1. **Video base VEO3**: Ana hablando
2. **Subtítulos virales**: Superior/centro (todo el video)
3. **Tarjeta jugador**: Inferior izquierda (segundo 3-6)
4. **Logo outro**: Final del video

---

## 📝 Notas Técnicas

### Puppeteer
- Headless mode: `'new'`
- Viewport: 320x100 @ 2x (Retina)
- Timeout: 10 segundos
- Screenshot: PNG sin background

### FFmpeg
- Codec: libx264
- Preset: fast
- CRF: 23
- Audio: copy (sin recodificar)

### Data URIs
- Fotos de jugadores convertidas a base64
- Logos de equipos convertidos a base64
- Evita problemas de CORS en Puppeteer

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Animación de salida**: Fade out en vez de desaparición abrupta
2. **Tarjeta dinámica**: Cambiar stats en tiempo real durante el video
3. **Múltiples jugadores**: Comparación lado a lado
4. **Personalización por tipo**: Diferentes diseños para chollos vs análisis
5. **Cache de tarjetas**: Guardar PNGs generados para reutilización

---

## 📚 Referencias

- **Documentación VEO3**: `docs/VEO3_GUIA_COMPLETA.md`
- **Sistema de chollos**: `backend/services/bargainAnalyzer.js`
- **Subtítulos virales**: `docs/VEO3_SUBTITULOS_VIRALES_INSTAGRAM.md`
- **Test History**: `data/instagram-versions/dani-carvajal-v1759569346240.json`

---

## 🎉 Estado Final

**✅ SISTEMA COMPLETAMENTE FUNCIONAL Y VALIDADO**

- Posición perfecta (no tapa nombre del perfil)
- Transparencia adecuada (se ve el fondo)
- Datos reales de la temporada 2025-26
- Compatible con subtítulos virales
- Preview móvil validado

**Desarrollado**: 6 de octubre de 2025
**Validado por**: Usuario
**Última actualización**: 6 de octubre de 2025, 13:15h
