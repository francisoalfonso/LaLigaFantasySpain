# 🎯 HITO: 11 Octubre 2025 - Sistema Instagram Funcionando

## ⚠️ REGLA DE ORO: NO TOCAR NADA DE LO QUE FUNCIONA

Este documento registra el **estado estable del sistema al 11 de octubre 2025**.
**PROHIBIDO modificar cualquier cosa documentada aquí sin autorización
explícita.**

---

## ✅ Sistema Instagram VEO3 - FLUJO COMPLETO FUNCIONANDO

### 📊 Arquitectura General

```
BargainAnalyzer (chollos)
    ↓
UnifiedScriptGenerator (guión 3 segmentos)
    ↓
Nano Banana (3 imágenes contextualizadas)
    ↓
Supabase Storage (signed URLs 24h)
    ↓
VEO3/KIE.ai (3 videos 8s cada uno)
    ↓
VideoConcatenator (FFmpeg unión)
    ↓
PlayerCardOverlay (tarjeta stats 3-6s, 40% transparency) ✅ NUEVO HOY
    ↓
ViralCaptionsGenerator (subtítulos karaoke)
    ↓
BlackFlashesEnhancer (flashes 70ms)
    ↓
Video Final 24s (Instagram Reels ready)
    ↓
n8n Workflows (publicación automática)
```

---

## 🎬 FASE 1: Identificación de Chollos

**Servicio**: `backend/services/bargainAnalyzer.js`

**Funcionamiento**:

- Analiza jugadores API-Sports (season 2025)
- Identifica chollos: `ratio > 1.2`, `precio <= 8.0`, `minutos >= 90`
- Output: Array de jugadores con `fantasyPoints`, `valueRatio`, `stats`

**Estado**: ✅ Funcionando perfectamente

---

## 🎬 FASE 2: Generación de Guión (UnifiedScriptGenerator)

**Servicio**: `backend/services/veo3/unifiedScriptGenerator.js`

**Características CRÍTICAS**:

1. **Variedad Léxica** ✅ IMPLEMENTADO HOY
    - Intro: "Misters" (fijo, identidad marca)
    - Middle: "Managers" / "Cracks" / "Jefes" (aleatorio)
    - Outro: "Tíos" / "Equipo" / "Gente" (aleatorio)
    - Código: líneas 32-40, 180, 188, 293-308

2. **3 Segmentos de 24-25 palabras** (8s audio cada uno)
    - Segmento 1 (intro): Hook + Revelación
    - Segmento 2 (middle): Validación con datos
    - Segmento 3 (outro): Urgencia + CTA

3. **Audio/Visual Split Strategy**
    - Audio: Datos vagos + nombre jugador (ej: "Milla está a precio de risa")
    - Visual: Player card muestra datos exactos (€6.5, ratio 4.38)
    - Resultado: Natural en audio + credibilidad en visual

**Estado**: ✅ Funcionando perfectamente

---

## 🎬 FASE 3A: Generación Imágenes Nano Banana

**Servicio**: `backend/services/nanoBanana/nanoBananaClient.js`

**Configuración CRÍTICA** (NO TOCAR):

```javascript
Seed: 12500 (fijo, identidad Ana)
Prompt strength: 0.75
Model: google/nano-banana-edit
Image size: "9:16" (vertical 576x1024)
Referencias: 5 imágenes
  - 4 vistas Ana (diferentes ángulos)
  - 1 estudio FLP
```

**Funcionamiento**:

- Genera 3 imágenes para 1 video
- **MISMA imagen base** para los 3 segmentos
- Seeds: 12500, 12501, 12502 (+0, +1, +2)
- Solo micro-variaciones naturales
- VEO3 controla planos de cámara (no Nano Banana)

**Costo**: $0.02/imagen × 3 = $0.06 por video

**Estado**: ✅ Funcionando perfectamente

---

## 🎬 FASE 3B: Subida a Supabase

**Servicio**: `backend/services/veo3/supabaseFrameUploader.js`

**Funcionamiento**:

- Descarga imágenes de Nano Banana (URLs temporales)
- Sube a Supabase bucket `ana-images` → subdirectorio `video-frames/`
- Genera **Signed URLs con 24h expiración** (VEO3 no puede acceder a URLs
  públicas)
- Limpieza automática de frames >24h

**Estado**: ✅ Funcionando perfectamente

---

## 🎬 FASE 3C: Generación Videos VEO3

**Servicio**: `backend/services/veo3/veo3Client.js`

**Configuración CRÍTICA** (NO TOCAR):

```javascript
Timeout inicial: 120000ms (120s)
Timeout status polling: 45000ms (45s)
Seed: 30001 (Ana character identity)
Model: veo3_fast
Aspect ratio: 9:16 (vertical)
```

**Características**:

- Genera 3 videos de 8s cada uno
- **Frame-to-frame continuity**: Último frame seg N = primer frame seg N+1
- Automatic player name removal (evita Error 422)
- Spanish from Spain accent: "speaks in Spanish from Spain" (lowercase)

**Costo**: $0.30/video × 3 = $0.90 por video completo

**Estado**: ✅ Funcionando perfectamente

---

## 🎬 FASE 4: Concatenación y Enhancements

### 4.1 Concatenación FFmpeg

**Servicio**: `backend/services/veo3/videoConcatenator.js`

- Une 3 videos de 8s → 24s total
- Sin crossfade (frame-to-frame perfecto)
- Añade logo FLP en outro (últimos 2s)

**Estado**: ✅ Funcionando

### 4.2 Player Card Overlay ✅ ACTUALIZADO HOY

**Servicio**: `backend/services/veo3/playerCardOverlay.js`

**Configuración ACTUAL**:

```javascript
Transparencia: 40% (rgba(255, 255, 255, 0.40)) ← CAMBIADO HOY
Timing: 3-6 segundos
Posición: Top-right
Puppeteer: omitBackground: true (canal alpha PNG)
```

**Contenido**:

- Foto jugador
- Stats: goles, asistencias, rating
- Precio, ratio, puntos fantasy
- Logo equipo

**Estado**: ✅ Funcionando con nueva transparencia

### 4.3 Subtítulos Virales

**Servicio**: `backend/services/veo3/viralCaptionsGenerator.js`

- Estilo karaoke (palabra por palabra)
- Formato ASS (Advanced SubStation Alpha)
- Tipografía: Impact, bold, outline
- ~74 subtítulos por video 24s

**Estado**: ✅ Funcionando

### 4.4 Black Flashes

**Servicio**: `backend/services/veo3/blackFlashesEnhancer.js`

- 70ms de duración
- Entre segmentos (8s y 16s)
- Efecto corte dramático

**Estado**: ✅ Funcionando

---

## 📱 FASE 5: Publicación Instagram

### Video Final Output

**Ubicación**:
`output/veo3/video-with-card-[timestamp]-with-captions-with-flashes.mp4`

**Especificaciones**:

- Duración: 24 segundos
- Formato: MP4 H.264
- Resolución: 1080x1920 (9:16)
- Audio: AAC
- Subtítulos: Quemados (burned-in)
- Player card: 3-6s con 40% transparencia
- Black flashes: 70ms entre segmentos

### n8n Workflows

**Estado**: 2 workflows activos (de 8 totales)

1. **Workflow Carruseles Top Chollos** (activo)
    - Trigger: Martes 10:00 AM
    - Endpoint: `/api/carousels/top-chollos`
    - ContentDrips API: Generación carrusel
    - Instagram Graph API: Publicación

2. **Workflow Videos Chollos** (pendiente activación)
    - Trigger: Diario 9:00 AM
    - Endpoint: `/api/veo3/generate-chollo-video` (a crear)
    - Output: Video 24s listo para Instagram

**Estado**: ✅ Arquitectura lista, pendiente activación producción

---

## 🎯 Métricas de Rendimiento (Test #51 - Pere Milla)

**Test ID**: `pere-milla-v1760210731693` **Fecha**: 11 Octubre 2025, 19:25 UTC
**Score**: 10.0/10 ⭐

### ✅ Elementos Técnicos Perfectos

1. **Player card**: 40% transparencia, 3-6s timing ✅
2. **Subtítulos**: 74 subtítulos karaoke ✅
3. **Black flashes**: 70ms duración ✅
4. **Frame-to-frame**: Transiciones invisibles ✅
5. **Duración**: 24s exactos ✅
6. **Acento**: Español castellano consistente ✅
7. **Workflow E2E**: ~12 minutos total ✅

### ⚠️ Issue Menor Detectado

**Problema**: "Repite 'misters' un par de veces" **Solución**: ✅ Variedad
léxica implementada hoy **Severidad**: Minor (0.2 puntos)

### 💰 Costos por Video

- Nano Banana: $0.06 (3 imágenes × $0.02)
- VEO3: $0.90 (3 videos × $0.30)
- **Total**: $0.96 por video de 24s

### ⏱️ Tiempo de Generación

- Nano Banana: ~123.8s (reutilización de imágenes)
- VEO3: ~275.3s (88.4s + 99s + 87.9s)
- Concatenación: ~21.2s
- Enhancements: ~59.4s (FFmpeg)
- **Total**: ~730.4s (~12.2 minutos)

---

## 📂 Archivos CRÍTICOS (NO MODIFICAR sin backup)

### Backend Services

```
backend/services/veo3/
├── unifiedScriptGenerator.js        ← Variedad léxica HOY
├── playerCardOverlay.js             ← Transparencia 40% HOY
├── nanoBananaVeo3Integrator.js      ← Integración NB→VEO3
├── veo3Client.js                    ← Cliente VEO3/KIE.ai
├── videoConcatenator.js             ← FFmpeg concatenación
├── viralCaptionsGenerator.js        ← Subtítulos karaoke
├── blackFlashesEnhancer.js          ← Flashes 70ms
└── supabaseFrameUploader.js         ← Upload signed URLs

backend/services/nanoBanana/
└── nanoBananaClient.js              ← Cliente Nano Banana

backend/services/
├── bargainAnalyzer.js               ← Chollos algorithm
└── creativeReferenceGenerator.js    ← Referencias jugadores
```

### Configuration

```
backend/config/veo3/
└── anaCharacter.js                  ← Ana character bible

data/
├── flp-nano-banana-config.json      ← Config Nano Banana refs
└── instagram-versions/              ← Test metadata + feedback
    └── pere-milla-v1760210731693.json
```

---

## 🚀 TAREA MAÑANA 12 OCTUBRE 2025

### Sistema de Vigilancia Canal Shorts

**Objetivo**: Monitorear rendimiento videos Instagram/YouTube automáticamente

**Alcance**:

- YouTube Data API v3 (analytics)
- Instagram Graph API (metrics)
- Dashboard métricas en tiempo real
- Alertas videos virales
- Informes automáticos

**IMPORTANTE**:

- ✅ NO tocar NADA del flujo actual de generación
- ✅ Crear servicios NUEVOS independientes
- ✅ Nueva ruta API: `/api/analytics/*`
- ✅ Nuevo módulo: `backend/services/analytics/`

**Prioridad**: Alta (mejora ROI decisiones contenido)

---

## 🎯 Backlog Futuro (NO Urgente)

### Variedad Visual Ana

- Generar fotos Ana en diferentes posturas
- Subir a Supabase (`assets/fotos-estudio/` preparado)
- Sistema rotación automática referencias Nano Banana

### Optimizaciones VEO3

- Implementar P0 fixes estrategia viral en script generator
- A/B testing automático formatos
- Generación thumbnails atractivos

---

## 📊 Estado General del Proyecto

**Última actualización**: 11 Octubre 2025, 22:00 UTC **Test más reciente**: #51
(Pere Milla) - 10.0/10 **Sistema**: ✅ Producción-ready **Próximo deploy**:
Pendiente activación n8n workflows

**Mantenido por**: Claude Code + Usuario **Versión sistema**: 2.3.0

---

## 🔒 Reglas de Modificación

1. **NUNCA modificar sin test previo**
2. **SIEMPRE hacer backup antes de cambios críticos**
3. **DOCUMENTAR todos los cambios en DECISIONS-LOG.md**
4. **MANTENER backwards compatibility**
5. **TEST en local antes de producción**

---

**FIN DEL HITO - 11 OCTUBRE 2025**
