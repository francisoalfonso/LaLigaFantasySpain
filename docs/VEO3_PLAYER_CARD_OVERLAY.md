# VEO3 - Player Card Overlay System

**Fecha**: 6 Octubre 2025
**Estado**: ✅ Implementado
**Versión**: 1.0

---

## 🎯 Objetivo

Sistema de tarjetas de jugador superpuestas en videos de Ana con animación slide-in desde la izquierda, apareciendo en el segundo 3 del video para máximo impacto viral.

---

## 📐 Especificaciones Visuales

### Diseño de la Tarjeta

Basado en mockups del usuario (6 Oct 2025):

```
┌─────────────────────────────────────────┐
│  ┌───────┐                              │
│  │ FOTO  │  DANI CARVAJAL               │
│  │ 100px │                              │
│  │       │  6         0        6.93     │
│  └───────┘  Partidos  Goles    Rating   │
└─────────────────────────────────────────┘
  380px × 120px
```

**Elementos**:
1. **Foto del jugador**: 100x100px circular (izquierda)
2. **Nombre**: Fuente grande, bold, negro
3. **3 Estadísticas**:
   - Partidos (número grande + label)
   - Goles (número grande + label)
   - Rating (número grande + label)

**Colores**:
- Fondo: Gris claro semi-transparente (`#F5F5F5`)
- Texto: Negro (`#000000`)
- Números: Azul (`#3B82F6`)
- Bordes: Redondeados (12px radius)

---

## ⏱️ Timing y Animación

### Configuración por Defecto

```javascript
{
    startTime: 3.0,         // Aparece en el segundo 3
    duration: 4.0,          // Visible durante 4 segundos (hasta segundo 7)
    slideInDuration: 0.5    // Animación de entrada dura 0.5s
}
```

### Secuencia de Animación

1. **Segundo 0-3**: Tarjeta fuera de pantalla (izquierda)
2. **Segundo 3-3.5**: Animación slide-in desde izquierda (0.5s)
3. **Segundo 3.5-7**: Tarjeta estática visible
4. **Segundo 7+**: Tarjeta desaparece

**Razón del segundo 3**: Hook ya pasó (0-3s), ahora revelación del jugador. La tarjeta refuerza visualmente el nombre mencionado por Ana.

---

## 🏗️ Arquitectura

### Componentes Principales

1. **`PlayerCardOverlay`** (`backend/services/veo3/playerCardOverlay.js`)
   - Genera imagen PNG de la tarjeta
   - Aplica overlay con FFmpeg
   - Maneja animación slide-in

2. **`VideoConcatenator`** (integración)
   - Aplica tarjeta automáticamente si `playerCard.enabled: true`
   - Procesa tarjeta DESPUÉS de subtítulos virales
   - Aplica solo al primer segmento (donde se menciona al jugador)

### Flujo de Procesamiento

```
Video original (con subtítulos)
  ↓
PlayerCardOverlay.generateCardImage(playerData)
  ↓
Imagen PNG de tarjeta (380×120px)
  ↓
PlayerCardOverlay.applyCardOverlay(video, cardImage)
  ↓
FFmpeg overlay con animación slide-in
  ↓
Video final con tarjeta animada
```

---

## 💻 Uso

### Opción 1: Usar VideoConcatenator con playerData

```javascript
const videoConcatenator = new VideoConcatenator();

const options = {
    playerCard: {
        enabled: true,          // ✅ ACTIVAR tarjeta
        startTime: 3.0,         // Segundo 3
        duration: 4.0,          // Visible 4 segundos
        slideInDuration: 0.5,   // Animación 0.5s
        applyToFirstSegment: true // Solo primer segmento
    },
    playerData: {
        name: 'Dani Carvajal',
        stats: {
            games: 6,
            goals: 1,
            rating: '7.12'
        },
        photo: 'https://url-foto-jugador.com/carvajal.jpg' // Opcional
    }
};

const videoWithCard = await videoConcatenator.concatenateVideos(segments, options);
```

### Opción 2: Usar PlayerCardOverlay directamente

```javascript
const PlayerCardOverlay = require('./backend/services/veo3/playerCardOverlay');
const overlay = new PlayerCardOverlay();

// 1. Generar tarjeta
const cardImagePath = await overlay.generateCardImage({
    name: 'Dani Carvajal',
    stats: { games: 6, goals: 1, rating: '7.12' },
    photo: null // Usará placeholder
});

// 2. Aplicar overlay
const videoWithCard = await overlay.applyCardOverlay(
    'path/to/video.mp4',
    cardImagePath,
    {
        startTime: 3.0,
        duration: 4.0,
        slideInDuration: 0.5
    }
);
```

---

## 🧪 Testing

### Script de Test

```bash
node scripts/veo3/test-player-card-overlay.js
```

**Funcionalidad**:
1. Genera tarjeta de Dani Carvajal (ejemplo)
2. Busca video de test en `output/veo3/sessions/`
3. Aplica overlay con animación
4. Abre video automáticamente

**Validación Manual**:
- [ ] Tarjeta aparece en segundo 3
- [ ] Animación slide-in desde izquierda (0.5s)
- [ ] Tarjeta visible hasta segundo 7
- [ ] Posición: Inferior izquierda
- [ ] Datos correctos: Nombre, Partidos, Goles, Rating
- [ ] Foto del jugador (o placeholder si no hay URL)

---

## 📊 Datos del Jugador

### Fuente de Datos

Los datos del jugador provienen del **BargainAnalyzer** y están disponibles en la API:

```bash
GET /api/bargains/top?limit=1
```

**Respuesta** (ejemplo):

```json
{
    "name": "Dani Carvajal",
    "team": { "name": "Real Madrid" },
    "position": "DEF",
    "analysis": {
        "estimatedPrice": 5.5,
        "valueRatio": 1.23
    },
    "stats": {
        "games": 6,
        "minutes": 480,
        "goals": 1,
        "assists": 0,
        "rating": "7.12"
    },
    "photo": "https://media.api-sports.io/football/players/1479.png" // ⚠️ Verificar URL
}
```

**Mapeo a PlayerData**:

```javascript
const playerData = {
    name: chollo.name,
    stats: {
        games: chollo.stats.games,
        goals: chollo.stats.goals,
        rating: chollo.stats.rating
    },
    photo: chollo.photo || null
};
```

---

## 🎨 Limitaciones Actuales y Mejoras Futuras

### Limitaciones (v1.0)

1. **Tipografía**: Jimp usa fuentes bitmap limitadas
   - **Solución futura**: Migrar a `node-canvas` con fuentes custom

2. **Foto placeholder**: Cuando no hay foto, se usa fondo gris sólido
   - **Solución futura**: Generar inicial del jugador en círculo

3. **Posición fija**: Actualmente solo inferior izquierda
   - **Solución futura**: Configuración flexible de posición

4. **Sin sombras**: Jimp no soporta sombras nativas
   - **Solución futura**: Con node-canvas, agregar sombras para legibilidad

### Mejoras Planificadas (v2.0)

- [ ] **Fuentes custom** (Montserrat/Inter) con node-canvas
- [ ] **Foto con borde** circular blanco
- [ ] **Gradiente de fondo** (blanco → transparente)
- [ ] **Animación fade-out** (no solo desaparición abrupta)
- [ ] **Logo del equipo** junto a la foto del jugador
- [ ] **Precio Fantasy** adicional (ej: "5.5M")
- [ ] **Categoría visual** (etiqueta "CHOLLO" en esquina)

---

## 🔧 Configuración FFmpeg

### Filtro de Overlay Animado

```javascript
// Posición dinámica calculada con expresiones FFmpeg
const overlayFilter = `[0:v][1:v]overlay=` +
    // X: Animación lineal desde fuera de pantalla (-380px) hasta posición final (20px)
    `x='if(between(t,${startTime},${startTime + slideInDuration}),` +
    `${initialX}+((${finalX}-${initialX})*((t-${startTime})/${slideInDuration})),` +
    `if(between(t,${startTime + slideInDuration},${startTime + duration}),${finalX},-${cardWidth}))':` +
    // Y: Fijo en parte inferior (1650px desde arriba)
    `y=${finalY}:` +
    // Enable: Solo visible durante el rango de tiempo especificado
    `enable='between(t,${startTime},${startTime + duration})'`;
```

**Explicación**:
- `if(between(t,START,END), ...)`: Condicional basado en tiempo del video
- Animación lineal: `initialX + ((finalX - initialX) * progress)`
- `enable='between(...)'`: Solo renderizar durante el período visible

---

## 📁 Estructura de Archivos

```
backend/services/veo3/
├── playerCardOverlay.js       # ✅ Servicio principal
└── videoConcatenator.js       # ✅ Integración

scripts/veo3/
└── test-player-card-overlay.js # ✅ Script de test

docs/
└── VEO3_PLAYER_CARD_OVERLAY.md # ✅ Esta documentación

output/veo3/
└── temp/veo3/player-cards/     # Tarjetas temporales
    ├── player-card-dani-carvajal-1759569346240.png
    └── cache/                   # Cache de fotos descargadas
```

---

## 🎯 Casos de Uso

### 1. Video de Chollo (Instagram Reel)

**Contexto**: Ana presenta chollo de Dani Carvajal

**Timeline**:
- **0-3s**: Hook ("He encontrado el chollo absoluto...")
- **3s**: 🃏 TARJETA ENTRA (slide-in 0.5s) + Ana menciona "Carvajal"
- **3.5-7s**: Tarjeta visible mientras Ana detalla stats
- **7s**: Tarjeta desaparece
- **7-14s**: CTA ("Fichad a Carvajal ahora")

**Beneficio**: Refuerzo visual del jugador mencionado, stats concretas visibles

### 2. Video de Análisis (YouTube Short)

**Contexto**: Análisis detallado de rendimiento de jugador

**Timeline**:
- **0-3s**: Introducción del tema
- **3s**: 🃏 TARJETA ENTRA con stats completas
- **3-10s**: Tarjeta visible durante análisis detallado
- **10s**: Tarjeta desaparece

---

## 🚨 Troubleshooting

### Error: "Imagen de tarjeta no se genera"

**Causa**: Falta dependencia `jimp`

**Solución**:
```bash
npm install jimp
```

### Error: "FFmpeg overlay no funciona"

**Causa**: Sintaxis incorrecta del filtro FFmpeg

**Solución**: Verificar logs de FFmpeg en consola, validar expresiones de tiempo

### Warning: "Foto del jugador no se descarga"

**Causa**: URL de foto inválida o CORS

**Solución**:
- Verificar que `playerData.photo` tiene URL válida
- Sistema usa placeholder automáticamente si falla descarga

---

## 📚 Referencias

- **FFmpeg Overlay Filter**: https://ffmpeg.org/ffmpeg-filters.html#overlay-1
- **Jimp Documentation**: https://github.com/jimp-dev/jimp
- **node-canvas** (migración futura): https://github.com/Automattic/node-canvas
- **Mockups del usuario**: `/Users/fran/Desktop/Captura de pantalla 2025-10-06 a las 11.*.png`

---

## 📝 Changelog

### v1.0 (6 Oct 2025)

- ✅ Implementación inicial con Jimp
- ✅ Animación slide-in desde izquierda
- ✅ Integración con VideoConcatenator
- ✅ Script de test funcional
- ✅ Documentación completa

---

**Última actualización**: 6 Octubre 2025
**Mantenido por**: Claude Code
**Estado**: ✅ Producción (v1.0)
