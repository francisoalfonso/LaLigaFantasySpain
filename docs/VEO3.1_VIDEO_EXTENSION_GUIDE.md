# VEO 3.1 - Guía Completa: Video Extension & Nuevas Funcionalidades

**Fecha**: Octubre 2025 **Versión**: VEO 3.1 (anunciada Oct 15, 2025)
**Fuente**: Google Developers Blog + Gemini API Docs

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Video Extension (Scene Extension)](#video-extension-scene-extension)
3. [Multi-Image Support (hasta 3 referencias)](#multi-image-support)
4. [Audio Nativo Mejorado](#audio-nativo-mejorado)
5. [Frame-Specific Generation](#frame-specific-generation)
6. [API Parameters Completos](#api-parameters-completos)
7. [Pricing & Costos](#pricing--costos)
8. [Diferencias VEO3 vs VEO3.1](#diferencias-veo3-vs-veo31)
9. [Implementación en Fantasy La Liga](#implementación-en-fantasy-la-liga)
10. [Limitaciones Conocidas](#limitaciones-conocidas)

---

## Visión General

**VEO 3.1** es la nueva versión del modelo de generación de videos de Google,
lanzada en **Octubre 2025** con mejoras significativas en:

- ✅ **Audio nativo más rico** - Diálogos, efectos de sonido, y ruido ambiental
  sincronizado
- ✅ **Realismo mejorado** - Texturas realistas y movimientos suaves
- ✅ **Video Extension** - Extiende videos hasta 148 segundos (20 extensiones de
  7s cada una)
- ✅ **Multi-imagen** - Hasta 3 imágenes de referencia para consistencia de
  personajes
- ✅ **Frame-specific generation** - Control de primer y último frame
- ✅ **Mayor control narrativo** - Mejor interpretación de prompts complejos

---

## Video Extension (Scene Extension)

### ¿Qué es?

**Video Extension** permite crear videos más largos generando nuevos clips que
**se conectan automáticamente al video anterior**. Cada extensión usa **el
último segundo del video anterior** como contexto visual.

### Características clave

| Feature                    | Detalle                                         |
| -------------------------- | ----------------------------------------------- |
| **Duración por extensión** | +7 segundos por llamada                         |
| **Máximo de extensiones**  | 20 veces (7s × 20 = 140s)                       |
| **Duración máxima total**  | 148 segundos (8s inicial + 140s extensiones)    |
| **Aspecto Ratio**          | 9:16 o 16:9 (debe coincidir con video original) |
| **Resolución**             | 720p (video original debe ser 720p)             |
| **Requisito crítico**      | Solo funciona con **videos generados por VEO**  |

### Limitaciones importantes

⚠️ **Audio/Voz**:

- La voz **NO se extiende efectivamente** si no está presente en el **último
  segundo** del video anterior
- Si el personaje termina de hablar antes del último segundo, la extensión **no
  continuará el diálogo**

⚠️ **Video de origen**:

- El video DEBE haber sido generado con VEO (no acepta videos externos)
- Duración máxima del video a extender: 141 segundos
- Resolución: 720p o 1080p
- Formato: 9:16 o 16:9

### Ejemplo de uso (Python - Google API)

```python
from google import genai

client = genai.Client()

# 1. Generar video inicial (8 segundos)
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="Ana, analista deportiva, habla sobre Fantasy La Liga en un estudio de TV.",
    image=initial_frame,
    aspectRatio="9:16",
    resolution="720p",
    durationSeconds="8"
)

initial_video = operation.result()

# 2. Extender video (+7 segundos)
extension_operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="Ana continúa explicando las estadísticas del jugador, gesticulando con las manos.",
    video=initial_video,  # Video anterior como input
    aspectRatio="9:16",
    resolution="720p"
)

extended_video = extension_operation.result()  # Video resultante: 8s + 7s = 15s
```

### Ejemplo esperado (Node.js - KIE.ai API)

```javascript
const VEO3Client = require('./backend/services/veo3/veo3Client');
const client = new VEO3Client();

// 1. Generar video inicial
const initialResponse = await client.generateVideo(
    'Ana, analista deportiva, habla sobre chollos de Fantasy La Liga.',
    {
        model: 'veo3_fast',
        imageUrl: 'https://supabase.co/.../ana-estudio.png',
        aspectRatio: '9:16',
        durationSeconds: 8
    }
);

const initialTaskId = initialResponse.data.taskId;
const initialVideo = await client.waitForCompletion(initialTaskId);

// 2. Extender video (NOTA: API de KIE.ai puede variar)
const extensionResponse = await client.extendVideo(
    initialVideo.url, // URL del video anterior
    'Ana continúa hablando sobre las estadísticas del jugador.',
    {
        aspectRatio: '9:16',
        durationSeconds: 7 // Extensión de 7 segundos
    }
);

const extensionTaskId = extensionResponse.data.taskId;
const finalVideo = await client.waitForCompletion(extensionTaskId);

console.log(`Video extendido: ${finalVideo.url} (duración: 15s)`);
```

**NOTA**: Aún no tenemos confirmación de cómo KIE.ai implementa video extension.
Puede ser:

- Un parámetro `videoUrl` en `generateVideo()`
- Un método nuevo `extendVideo()`
- Disponible solo vía Google Gemini API (no KIE.ai)

---

## Multi-Image Support

VEO 3.1 acepta **hasta 3 imágenes de referencia** para mantener consistencia de
personaje a través de múltiples tomas.

### Diferencias con VEO3

| Feature                   | VEO3             | VEO3.1                     |
| ------------------------- | ---------------- | -------------------------- |
| Imágenes de referencia    | 1-2 imágenes     | 1-3 imágenes               |
| Primer frame control      | ❌               | ✅ (con `image` param)     |
| Último frame control      | ❌               | ✅ (con `lastFrame` param) |
| Consistencia de personaje | Buena (1 imagen) | Excelente (3 imágenes)     |

### Ejemplo de uso (Google API)

```python
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="Ana explica las tácticas de Fantasy La Liga.",
    referenceImages=[
        ana_frontal,      # Imagen 1: Vista frontal
        ana_perfil,       # Imagen 2: Perfil lateral
        ana_gesticulando  # Imagen 3: Gesticulando
    ],
    aspectRatio="9:16",
    durationSeconds="8"
)
```

### Ventajas para Fantasy La Liga

- ✅ **Consistencia de Ana** - Mantener apariencia exacta de Ana en todos los
  segmentos
- ✅ **Transiciones suaves** - Último frame de segmento N = primer frame de
  segmento N+1
- ✅ **Múltiples ángulos** - Referencias desde diferentes perspectivas para
  mejor realismo

---

## Audio Nativo Mejorado

VEO 3.1 genera **audio nativo sincronizado automáticamente** con cada video, sin
necesidad de parámetros adicionales.

### Mejoras sobre VEO3

| Aspecto               | VEO3         | VEO3.1                                       |
| --------------------- | ------------ | -------------------------------------------- |
| Audio nativo          | ✅ Básico    | ✅ **Rico y mejorado**                       |
| Diálogos              | ✅ Funcional | ✅ **Más natural y sincronizado**            |
| Efectos de sonido     | ⚠️ Limitado  | ✅ **Completo** (ambiente, pasos, gestos)    |
| Ruido ambiental       | ⚠️ Básico    | ✅ **Realista** (estudio TV, multitud, etc.) |
| Sincronización labial | ✅ Buena     | ✅ **Excelente**                             |

### Ejemplo de prompt con audio

```javascript
const prompt = `Ana, analista deportiva española de 32 años, habla en español de España:
"Hola Misters, hoy os traigo los chollos de la jornada. El primer jugador es un mediocentro que ha marcado 3 goles en 2 partidos."

Se escucha ambiente de estudio de TV en segundo plano. Ana gesticula con las manos mientras habla.`;

// VEO 3.1 generará automáticamente:
// - Voz de Ana sincronizada
// - Ruido ambiental de estudio TV
// - Sonido de gestos/movimientos
```

### Audio en Video Extension

⚠️ **IMPORTANTE**: Si extiendes un video donde Ana **NO está hablando en el
último segundo**, VEO 3.1 **NO continuará el diálogo** en la extensión.

**Solución**: Asegurarse de que:

1. El personaje esté hablando **hasta el último segundo** del video anterior
2. El prompt de extensión indique **continuación del diálogo** explícitamente

---

## Frame-Specific Generation

VEO 3.1 permite especificar **primer y último frame** del video para generar
interpolación entre ambos.

### Parámetros

| Parámetro   | Tipo   | Descripción                                   |
| ----------- | ------ | --------------------------------------------- |
| `image`     | Image  | **Primer frame** del video (inicio)           |
| `lastFrame` | Image  | **Último frame** del video (final)            |
| `prompt`    | string | Descripción de cómo transicionar entre frames |

### Ejemplo de uso

```python
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="Ana camina hacia la cámara con confianza, sonriendo.",
    image=ana_lejos,     # Primer frame: Ana lejos de cámara
    lastFrame=ana_cerca,  # Último frame: Ana cerca de cámara (close-up)
    aspectRatio="9:16",
    durationSeconds="8"
)
```

### Ventajas para Fantasy La Liga

- ✅ **Transiciones frame-to-frame perfectas** - Sin crossfades, sin reseteos
  visuales
- ✅ **Control total del inicio y final** - Predecible, consistente
- ✅ **Mejor concatenación** - Segmentos se unen sin interrupciones visuales

---

## API Parameters Completos

### Google Gemini API (Oficial)

```python
from google import genai

client = genai.Client()

operation = client.models.generate_videos(
    # REQUERIDOS
    model="veo-3.1-generate-preview",           # Modelo VEO 3.1
    prompt="Descripción del video",             # Texto del contenido

    # OPCIONALES - Video Extension
    video=previous_video,                       # Video anterior a extender

    # OPCIONALES - Frame Control
    image=initial_frame,                        # Primer frame
    lastFrame=final_frame,                      # Último frame

    # OPCIONALES - Multi-Image
    referenceImages=[img1, img2, img3],         # Hasta 3 referencias

    # OPCIONALES - Configuración
    aspectRatio="9:16",                         # "9:16" o "16:9"
    resolution="720p",                          # "720p" o "1080p"
    durationSeconds="8",                        # "4", "6", o "8"
    negativePrompt="elementos a excluir"        # Exclusiones
)

# Esperar resultado
while not operation.done:
    await asyncio.sleep(5)
    operation.refresh()

video_result = operation.result()
```

### KIE.ai API (Esperado)

**NOTA**: KIE.ai aún no ha publicado documentación oficial sobre VEO 3.1. Esto
es una **proyección** basada en la API actual.

```javascript
const response = await client.generateVideo(prompt, {
    // Parámetros actuales de VEO3
    model: 'veo3_fast', // O 'veo3.1_fast' en el futuro
    imageUrl: 'https://...', // Imagen de referencia
    aspectRatio: '9:16',
    watermark: 'Fantasy La Liga Pro',
    enableTranslation: false,

    // Nuevos parámetros VEO3.1 (hipotéticos)
    imageUrls: [
        // Multi-imagen (hasta 3)
        'https://.../ana-frontal.png',
        'https://.../ana-perfil.png',
        'https://.../ana-gesticulando.png'
    ],
    lastFrameUrl: 'https://.../final-frame.png', // Último frame
    videoToExtend: 'https://.../previous-video.mp4', // Video extension
    durationSeconds: 8, // Duración (4, 6, 8)
    resolution: '720p' // Resolución (720p, 1080p)
});
```

---

## Pricing & Costos

### Google Gemini API (Oficial)

| Modelo                       | Precio             | Duración | Notas                            |
| ---------------------------- | ------------------ | -------- | -------------------------------- |
| **veo-3.1-generate-preview** | ❓ Aún no revelado | 4-8s     | Mismo precio que VEO3 (probable) |
| **veo-3.1-fast-preview**     | ❓ Aún no revelado | 4-8s     | Versión rápida y económica       |

### KIE.ai API (Actual - VEO3)

| Modelo             | Precio          | Duración | Notas                             |
| ------------------ | --------------- | -------- | --------------------------------- |
| **veo3_fast**      | **$0.30/video** | 8s       | 75% más barato que Google oficial |
| **veo3** (Quality) | **$2.00/video** | 8s       | Calidad máxima                    |

### Proyección de Costos VEO3.1 en KIE.ai

Asumiendo incremento del 33% (basado en mejoras de features):

| Modelo             | Precio Actual | Precio Proyectado VEO3.1 | Incremento    |
| ------------------ | ------------- | ------------------------ | ------------- |
| **veo3_fast**      | $0.30         | **$0.40**                | +$0.10 (+33%) |
| **veo3** (Quality) | $2.00         | **$2.65**                | +$0.65 (+33%) |

### Costo por Video Extension

| Escenario               | VEO3 (actual) | VEO3.1 (proyectado) |
| ----------------------- | ------------- | ------------------- |
| **Video inicial** (8s)  | $0.30         | $0.40               |
| **1 extensión** (+7s)   | $0.30         | $0.40               |
| **Total** (15s)         | **$0.60**     | **$0.80**           |
| **3 extensiones** (29s) | **$1.20**     | **$1.60**           |
| **5 extensiones** (43s) | **$2.10**     | **$2.80**           |

### Impacto en Fantasy La Liga

**Escenario actual** (3 segmentos de 8s cada uno):

- VEO3: 3 × $0.30 = **$0.90/video**
- VEO3.1: 3 × $0.40 = **$1.20/video** (+33%)

**Nuevo escenario con Video Extension** (1 inicial + 2 extensiones):

- VEO3.1: $0.40 (inicial) + 2 × $0.40 (extensiones) = **$1.20/video**
- Duración: 8s + 7s + 7s = **22 segundos** (vs 24s actual)

**Ventajas del enfoque de extensión**:

- ✅ **Transiciones perfectas** (último segundo = contexto automático)
- ✅ **Menos complejidad** (no necesitas describir frame-to-frame manualmente)
- ⚠️ **Mismo costo** ($1.20/video)
- ⚠️ **2s menos de duración** (22s vs 24s)

---

## Diferencias VEO3 vs VEO3.1

| Feature                   | VEO3             | VEO3.1                                |
| ------------------------- | ---------------- | ------------------------------------- |
| **Audio nativo**          | ✅ Básico        | ✅ **Rico y mejorado**                |
| **Video Extension**       | ❌ No disponible | ✅ **Hasta 148s** (20 extensiones)    |
| **Multi-imagen**          | 1-2 imágenes     | **1-3 imágenes**                      |
| **Frame control**         | ❌ No            | ✅ **Primer y último frame**          |
| **Realismo**              | ✅ Bueno         | ✅ **Excelente** (texturas mejoradas) |
| **Sincronización labial** | ✅ Buena         | ✅ **Excelente**                      |
| **Control narrativo**     | ✅ Básico        | ✅ **Avanzado**                       |
| **Precio (proyectado)**   | $0.30 (KIE fast) | **$0.40** (+33%)                      |
| **Duración máxima**       | 8s               | **148s** (con extensiones)            |

---

## Implementación en Fantasy La Liga

### Opción 1: Mantener Arquitectura Actual (3 Segmentos Independientes)

```javascript
// backend/routes/veo3.js - Phase 2: Generate individual segments

// NO CAMBIOS - Seguir generando 3 segmentos independientes de 8s
const segment0Response = await veo3Client.generateVideo(
    script.segments[0].narration,
    {
        model: 'veo3.1_fast', // Actualizar modelo (si KIE.ai lo soporta)
        imageUrl: contextImages.segment0,
        aspectRatio: '9:16',
        durationSeconds: 8
    }
);

// Ventajas:
// ✅ Sistema ya probado y funcional
// ✅ Retry individual de segmentos
// ✅ Control total de cada segmento

// Desventajas:
// ⚠️ Transiciones frame-to-frame manuales (como ahora)
// ⚠️ No aprovecha video extension
```

### Opción 2: Usar Video Extension (Experimental)

```javascript
// backend/services/veo3/veo3VideoExtensionClient.js (NUEVO)

class VEO3VideoExtensionClient {
    async generateExtendedVideo(segments, contextImages) {
        // 1. Generar segmento inicial (8s)
        const initialResponse = await this.generateVideo(
            segments[0].narration,
            {
                model: 'veo3.1_fast',
                imageUrl: contextImages.segment0,
                aspectRatio: '9:16',
                durationSeconds: 8
            }
        );

        const initialVideo = await this.waitForCompletion(
            initialResponse.data.taskId
        );

        // 2. Extender segmento 1 (+7s)
        const extension1Response = await this.extendVideo(
            initialVideo.url,
            segments[1].narration,
            {
                aspectRatio: '9:16',
                durationSeconds: 7
            }
        );

        const video15s = await this.waitForCompletion(
            extension1Response.data.taskId
        );

        // 3. Extender segmento 2 (+7s)
        const extension2Response = await this.extendVideo(
            video15s.url,
            segments[2].narration,
            {
                aspectRatio: '9:16',
                durationSeconds: 7
            }
        );

        const finalVideo = await this.waitForCompletion(
            extension2Response.data.taskId
        );

        return {
            url: finalVideo.url,
            duration: 22, // 8 + 7 + 7
            segments: [initialVideo, video15s, finalVideo]
        };
    }
}

// Ventajas:
// ✅ Transiciones perfectas (último segundo automático)
// ✅ No necesitas describir frame-to-frame
// ✅ Menos complejidad en prompts

// Desventajas:
// ⚠️ Si falla extensión 2, pierdes todo (no retry individual)
// ⚠️ 2s menos de duración (22s vs 24s actual)
// ⚠️ Requiere video de origen VEO (no acepta externos)
```

### Opción 3: Híbrido (Mejor de ambos mundos)

```javascript
// backend/services/veo3/veo3HybridClient.js (RECOMENDADO)

class VEO3HybridClient {
    async generateVideo(segments, contextImages, useExtension = false) {
        if (useExtension) {
            // Usar video extension para transiciones suaves
            return await this.generateWithExtension(segments, contextImages);
        } else {
            // Usar arquitectura actual (3 segmentos independientes + FFmpeg)
            return await this.generateWithConcatenation(
                segments,
                contextImages
            );
        }
    }

    async generateWithExtension(segments, contextImages) {
        // Implementación con video extension (Opción 2)
    }

    async generateWithConcatenation(segments, contextImages) {
        // Implementación actual (Opción 1)
    }
}

// Uso:
const video = await hybridClient.generateVideo(
    segments,
    contextImages,
    (useExtension = true)
);

// Ventajas:
// ✅ Flexibilidad total (elegir según caso de uso)
// ✅ A/B testing (comparar calidad de transiciones)
// ✅ Fallback a concatenación si extension falla
```

### Recomendación para Fantasy La Liga

**Fase 1: Testing** (Noviembre 2025)

1. Esperar documentación oficial de KIE.ai sobre VEO 3.1
2. Probar video extension con 1 video de prueba
3. Comparar calidad de transiciones: Extension vs Concatenación actual

**Fase 2: Implementación** (Diciembre 2025)

1. Implementar `VEO3HybridClient` con flag `useExtension`
2. Generar 5 videos con cada método
3. A/B testing con usuarios (votación en Instagram Stories)

**Fase 3: Producción** (Enero 2026)

1. Activar método ganador (extension o concatenación)
2. Mantener fallback al método alternativo

---

## Limitaciones Conocidas

### Video Extension

| Limitación                       | Detalle                                          |
| -------------------------------- | ------------------------------------------------ |
| **Videos externos**              | ❌ Solo acepta videos generados por VEO          |
| **Duración máxima video origen** | 141 segundos                                     |
| **Aspecto ratio**                | Debe coincidir con video original (9:16 o 16:9)  |
| **Resolución**                   | Debe coincidir con video original (720p o 1080p) |
| **Audio/Voz**                    | No se extiende si no está en el último segundo   |
| **Máximo extensiones**           | 20 veces (148s total)                            |

### Multi-Image

| Limitación          | Detalle                                    |
| ------------------- | ------------------------------------------ |
| **Máximo imágenes** | 3 referencias                              |
| **Formato**         | PNG, JPEG (verificar docs oficiales)       |
| **Tamaño**          | No especificado (verificar docs oficiales) |

### Audio Nativo

| Limitación           | Detalle                                                        |
| -------------------- | -------------------------------------------------------------- |
| **Idioma**           | Soporte multilingüe (verificar español de España)              |
| **Voz**              | No se puede especificar voz personalizada (usa modelo interno) |
| **Control de audio** | No se puede desactivar audio nativo en VEO 3.1                 |

### Pricing

| Limitación              | Detalle                        |
| ----------------------- | ------------------------------ |
| **Pricing oficial**     | Aún no revelado por Google     |
| **Pricing KIE.ai**      | Aún no confirmado para VEO 3.1 |
| **Incremento esperado** | +33% sobre VEO3 (proyección)   |

---

## Recursos y Documentación

### Google Oficial

- **Blog Announcement**:
  https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/
- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs/video
- **Google AI Studio**: https://aistudio.google.com/

### KIE.ai

- **Sitio oficial**: https://kie.ai/
- **Documentación API VEO3**: https://docs.kie.ai/veo3-api/generate-veo-3-video
- **Playground VEO 3.1**: https://kie.ai/veo-3-1

### Comunidad

- **9to5Google**: https://9to5google.com/2025/10/15/veo-3-1/
- **TechCrunch**:
  https://techcrunch.com/2025/10/15/google-releases-veo-3-1-adds-it-to-flow-video-editor/
- **VentureBeat**:
  https://venturebeat.com/ai/google-releases-new-ai-video-model-veo-3-1-in-flow-and-api-what-it-means-for

---

## Próximos Pasos

### Para Fantasy La Liga

1. ✅ **Documentación completa de VEO 3.1** (este documento)
2. ⏳ **Esperar documentación oficial de KIE.ai** (esperado: Nov 2025)
3. ⏳ **Probar video extension con KIE.ai API** (esperado: Nov 2025)
4. ⏳ **A/B testing: Extension vs Concatenación** (esperado: Dic 2025)
5. ⏳ **Implementar `VEO3HybridClient`** (esperado: Ene 2026)

### Contacto con KIE.ai

Si quieres acceso temprano a VEO 3.1 en KIE.ai, puedes contactarlos vía:

- **Email**: support@kie.ai
- **Asunto**: "VEO 3.1 API Access - Fantasy La Liga Project"
- **Template**: Ver `docs/VEO3.1_API_REQUEST_TEMPLATE.md`

---

**Última actualización**: 2025-10-16 **Autor**: Claude Code **Versión**: 1.0.0
