# VEO3 - Plan B: Nano Banana para Continuidad Visual

**Fecha**: 10 Octubre 2025
**Estado**: 📋 **PLAN B DOCUMENTADO** (Backup para frame-to-frame)
**Prioridad**: P2 (Implementar si Plan A falla)

---

## 🎯 Problema a Resolver

**Plan A Actual** (Frame-to-Frame con Supabase):
- Extraer último frame del Segmento N
- Subir a Supabase Storage
- Usar como imagen inicial del Segmento N+1

**Riesgo Identificado**:
- ⚠️ Si la extracción de frames no captura el frame exacto final
- ⚠️ Si VEO3 no interpreta correctamente la imagen extraída
- ⚠️ Si hay degradación de calidad en la extracción/compresión
- ⚠️ Resultado: Saltos visuales entre segmentos (cambio de ángulo, zoom, posición de Ana)

---

## 💡 Solución: Plan B con Nano Banana

### Concepto

**En lugar de extraer frames de videos VEO3**, usar **Nano Banana** para generar 3 imágenes de Ana **idénticas** pero con **planos diferentes** ANTES de generar los videos.

### Ventajas

1. ✅ **Control total del plano**: Especificamos exactamente el encuadre (wide, medium, close-up)
2. ✅ **Consistencia garantizada**: Misma Ana, misma ropa, misma pose base
3. ✅ **Sin degradación**: Imágenes generadas en alta calidad (no extraídas de video)
4. ✅ **Progresión cinematográfica**: Podemos diseñar una progresión visual intencionada
5. ✅ **Independencia de VEO3**: No dependemos de que VEO3 genere el frame perfecto

---

## 🎬 Estrategia de Planos

### Opción 1: Progresión Clásica (Wide → Medium → Close-up)

```
Segmento 1 (Hook): WIDE SHOT
┌─────────────────────────┐
│                         │
│     [Ana cuerpo         │
│      completo]          │
│                         │
│   Ambiente oficina      │
└─────────────────────────┘
- Establece el escenario
- Ana visible completa
- Contexto profesional

Segmento 2 (Desarrollo): MEDIUM SHOT
┌─────────────────────────┐
│                         │
│   [Ana cintura          │
│    arriba]              │
│                         │
└─────────────────────────┘
- Acercamiento natural
- Más enfoque en Ana
- Mantiene contexto

Segmento 3 (CTA): CLOSE-UP
┌─────────────────────────┐
│   [Ana cabeza           │
│    y hombros]           │
│                         │
└─────────────────────────┘
- Intimidad máxima
- Conexión directa
- Urgencia visual
```

### Opción 2: Variación de Ángulos (Mantener mismo plano)

```
Segmento 1: Medium frontal (0°)
Segmento 2: Medium slight angle (15° derecha)
Segmento 3: Medium frontal (0°)
```

### Opción 3: Hybrid (Recomendado)

```
Segmento 1 (Hook): Medium shot frontal
- Ana centrada, cintura arriba
- Pose ligeramente conspiratoria

Segmento 2 (Desarrollo): Medium-close shot frontal
- Ana más cerca, pecho arriba
- Pose más directa, seria

Segmento 3 (CTA): Close-up frontal
- Ana muy cerca, hombros arriba
- Pose urgente, directa a cámara
```

---

## 🔧 Implementación Técnica

### 1. Integración con Nano Banana API

**Ubicación**: `backend/services/nanoBanana/nanoBananaClient.js` (NUEVO)

```javascript
const axios = require('axios');
const logger = require('../../utils/logger');

class NanoBananaClient {
    constructor() {
        this.apiKey = process.env.NANO_BANANA_API_KEY;
        this.baseUrl = 'https://api.nanobanana.com/v1'; // URL ejemplo
    }

    /**
     * Generar 3 imágenes de Ana con progresión de planos
     * @param {object} options - Opciones de generación
     * @returns {Promise<Array>} - Array de 3 URLs de imágenes
     */
    async generateAnaProgression(options = {}) {
        const {
            style = 'professional',
            progression = 'wide-medium-closeup'
        } = options;

        // Prompt base de Ana (mantener consistencia)
        const anaBasePrompt = `
            Professional Spanish sports analyst, 32 years old,
            short black curly hair in ponytail,
            warm brown eyes, athletic build,
            navy blue blazer with La Liga branding,
            studio background, soft lighting, 4K
        `;

        // Definir 3 prompts con variación SOLO de plano
        const prompts = [
            {
                shot: 'wide',
                prompt: `${anaBasePrompt}, wide shot, full body visible,
                         standing in modern sports studio, professional pose`
            },
            {
                shot: 'medium',
                prompt: `${anaBasePrompt}, medium shot, waist up,
                         centered, slight lean forward, engaging pose`
            },
            {
                shot: 'close-up',
                prompt: `${anaBasePrompt}, close-up shot, head and shoulders,
                         direct eye contact, serious expression`
            }
        ];

        logger.info('[NanoBananaClient] 🎨 Generando 3 imágenes Ana con progresión de planos...');

        const images = [];

        for (let i = 0; i < prompts.length; i++) {
            const { shot, prompt } = prompts[i];

            try {
                logger.info(`[NanoBananaClient] 📸 Generando imagen ${i + 1}/3 (${shot})...`);

                const response = await axios.post(
                    `${this.baseUrl}/generate`,
                    {
                        prompt: prompt,
                        // Parámetros para garantizar consistencia
                        seed: 30001, // ✅ Mismo seed que VEO3 Ana
                        model: 'flux-1.1-pro-ultra', // Modelo de alta calidad
                        aspectRatio: '9:16', // Vertical para Instagram
                        guidance: 7.5, // Control creativo vs prompt
                        steps: 50, // Calidad alta
                        width: 720,
                        height: 1280
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000 // 60s timeout
                    }
                );

                const imageUrl = response.data.output?.url || response.data.url;
                images.push({
                    index: i + 1,
                    shot: shot,
                    url: imageUrl,
                    prompt: prompt
                });

                logger.info(`[NanoBananaClient] ✅ Imagen ${i + 1} generada: ${imageUrl}`);

            } catch (error) {
                logger.error(`[NanoBananaClient] ❌ Error generando imagen ${i + 1}:`, error.message);
                throw new Error(`Failed to generate image ${i + 1}: ${error.message}`);
            }
        }

        logger.info(`[NanoBananaClient] ✅ 3 imágenes Ana generadas exitosamente`);
        return images;
    }

    /**
     * Subir imágenes generadas a Supabase Storage
     * @param {Array} images - Array de imágenes de Nano Banana
     * @returns {Promise<Array>} - Array de URLs públicas de Supabase
     */
    async uploadToSupabase(images) {
        const supabaseUploader = require('../veo3/supabaseFrameUploader');
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');

        logger.info('[NanoBananaClient] 📤 Subiendo imágenes a Supabase Storage...');

        const supabaseUrls = [];

        for (let i = 0; i < images.length; i++) {
            const { index, shot, url } = images[i];

            try {
                // 1. Descargar imagen de Nano Banana
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const tempPath = path.join(__dirname, `../../../temp/veo3/ana-${shot}-${Date.now()}.jpg`);
                fs.writeFileSync(tempPath, response.data);

                // 2. Subir a Supabase Storage
                const supabaseUrl = await supabaseUploader.uploadFrame(
                    tempPath,
                    `ana-${shot}-seg${index}`
                );

                supabaseUrls.push({
                    index: index,
                    shot: shot,
                    supabaseUrl: supabaseUrl,
                    originalUrl: url
                });

                // 3. Limpiar archivo temporal
                fs.unlinkSync(tempPath);

                logger.info(`[NanoBananaClient] ✅ Imagen ${index} en Supabase: ${supabaseUrl}`);

            } catch (error) {
                logger.error(`[NanoBananaClient] ❌ Error subiendo imagen ${index}:`, error.message);
                throw error;
            }
        }

        logger.info('[NanoBananaClient] ✅ Todas las imágenes subidas a Supabase');
        return supabaseUrls;
    }
}

module.exports = NanoBananaClient;
```

---

### 2. Modificación de ViralVideoBuilder (Plan B)

**Ubicación**: `backend/services/veo3/viralVideoBuilder.js`

```javascript
async generateViralVideo(playerData, options = {}) {
    // ✅ PLAN B: Usar Nano Banana si usePlanB = true
    const usePlanB = options.usePlanB || false;

    if (usePlanB) {
        logger.info('[ViralVideoBuilder] 🎨 PLAN B: Usando Nano Banana para continuidad visual...');

        const NanoBananaClient = require('../nanoBanana/nanoBananaClient');
        const nanoBanana = new NanoBananaClient();

        // 1. Generar 3 imágenes Ana con progresión de planos
        const anaImages = await nanoBanana.generateAnaProgression({
            style: 'professional',
            progression: 'wide-medium-closeup'
        });

        // 2. Subir a Supabase Storage
        const supabaseFrames = await nanoBanana.uploadToSupabase(anaImages);

        logger.info('[ViralVideoBuilder] ✅ Plan B: 3 imágenes Ana listas en Supabase');

        // 3. Generar segmentos usando las imágenes de Nano Banana
        const segment1Result = await this.veo3Client.generateVideo(hookPrompt, {
            aspectRatio: '9:16',
            useImageReference: true,
            imageUrl: supabaseFrames[0].supabaseUrl // ✅ Imagen 1: Wide shot
        });

        // ... esperar segment1 ...

        const segment2Result = await this.veo3Client.generateVideo(developmentPrompt, {
            aspectRatio: '9:16',
            useImageReference: true,
            imageUrl: supabaseFrames[1].supabaseUrl // ✅ Imagen 2: Medium shot
        });

        // ... esperar segment2 ...

        const segment3Result = await this.veo3Client.generateVideo(ctaPrompt, {
            aspectRatio: '9:16',
            useImageReference: true,
            imageUrl: supabaseFrames[2].supabaseUrl // ✅ Imagen 3: Close-up
        });

        // ✅ Resto del flujo igual (concatenación, test-history, etc.)
    } else {
        // PLAN A: Frame-to-frame extraction (implementación actual)
        // ...
    }
}
```

---

## 🎯 Comparación Plan A vs Plan B

| Aspecto | Plan A (Frame-to-Frame) | Plan B (Nano Banana) |
|---------|-------------------------|----------------------|
| **Continuidad Visual** | ⚠️ Depende de VEO3 | ✅ Garantizada (misma base) |
| **Control de Planos** | ❌ Aleatorio | ✅ Total control |
| **Calidad de Imagen** | ⚠️ Extracción de video | ✅ Generación directa 4K |
| **Costo** | ✅ $0 extra | ⚠️ ~$0.15 (3 imágenes × $0.05) |
| **Tiempo** | ✅ Instantáneo (extracción) | ⚠️ +30-60s (generación) |
| **Complejidad** | ✅ Simple (FFmpeg) | ⚠️ API adicional |
| **Progresión Cinematográfica** | ❌ No controlada | ✅ Diseñada intencionadamente |
| **Dependencias** | ✅ Solo VEO3 + FFmpeg | ⚠️ Nano Banana + VEO3 + FFmpeg |

---

## 📊 Cuándo Usar Cada Plan

### Usar Plan A (Frame-to-Frame) cuando:
- ✅ La extracción de frames funciona perfectamente
- ✅ VEO3 genera transiciones suaves naturalmente
- ✅ No necesitamos control estricto de planos
- ✅ Queremos minimizar costos y tiempo

### Usar Plan B (Nano Banana) cuando:
- ⚠️ Frame-to-frame produce saltos visuales
- ⚠️ VEO3 cambia ángulos/zoom inesperadamente
- ✅ Necesitamos progresión cinematográfica intencionada
- ✅ La calidad visual es crítica
- ✅ Estamos dispuestos a invertir $0.15 extra + 60s

---

## 🔄 Estrategia de Implementación

### Fase 1: Validar Plan A (ACTUAL)
1. Ejecutar test E2E completo
2. Revisar transiciones entre segmentos
3. Evaluar si hay saltos visuales
4. **Criterio de éxito**: Transiciones imperceptibles

### Fase 2: Implementar Plan B (Si Plan A falla)
1. Crear `backend/services/nanoBanana/nanoBananaClient.js`
2. Obtener API key de Nano Banana
3. Agregar variable de entorno `NANO_BANANA_API_KEY`
4. Modificar `ViralVideoBuilder` con flag `usePlanB`
5. Probar generación de 3 imágenes
6. Validar transiciones con Plan B

### Fase 3: Comparación A/B
1. Generar mismo video con Plan A y Plan B
2. Comparar calidad visual
3. Comparar costos y tiempos
4. Decidir plan por defecto

---

## 🎨 Prompts Nano Banana Optimizados

### Base Prompt (Consistencia)
```
Professional Spanish sports analyst named Ana, 32 years old,
short black curly hair styled in neat professional ponytail,
warm expressive brown eyes, athletic build,
wearing navy blue blazer with La Liga branding pin,
modern sports studio background with soft professional lighting,
photorealistic, 4K quality, studio portrait
```

### Variaciones por Plano

**Wide Shot (Segmento 1 - Hook)**:
```
{base_prompt}, wide shot composition, full body visible from head to knees,
standing confidently in modern sports studio,
hands gesturing naturally, slight lean forward suggesting conspiracy,
professional anchor pose, centered in frame
```

**Medium Shot (Segmento 2 - Desarrollo)**:
```
{base_prompt}, medium shot composition, waist up,
centered in frame, direct eye contact with camera,
hands visible in mid-gesture, serious analytical expression,
professional and engaging posture
```

**Close-Up (Segmento 3 - CTA)**:
```
{base_prompt}, close-up shot composition, head and shoulders only,
direct intense eye contact with camera, slight lean toward camera,
urgent and persuasive expression, professional intimacy,
minimal background visible
```

---

## 💰 Estimación de Costos

### Plan A (Frame-to-Frame)
- VEO3: $0.30 × 3 segmentos = **$0.90**
- FFmpeg: $0 (gratis)
- **Total**: **$0.90**

### Plan B (Nano Banana)
- Nano Banana: $0.05 × 3 imágenes = **$0.15**
- VEO3: $0.30 × 3 segmentos = **$0.90**
- **Total**: **$1.05**

**Diferencia**: +$0.15 (+16.7%)

---

## ⏱️ Estimación de Tiempos

### Plan A (Frame-to-Frame)
- Extracción frames: ~2s × 2 = 4s
- Subida Supabase: ~3s × 2 = 6s
- **Overhead total**: **~10s**

### Plan B (Nano Banana)
- Generación imágenes: ~20s × 3 = 60s
- Subida Supabase: ~3s × 3 = 9s
- **Overhead total**: **~69s**

**Diferencia**: +59s adicionales

---

## 🎯 Recomendación

**Implementar AHORA**: ❌ No (esperar validación Plan A)

**Implementar SI**:
- ⚠️ Plan A produce saltos visuales en > 30% de videos
- ⚠️ Usuarios reportan inconsistencia visual como problema
- ✅ Tenemos budget para $0.15 extra por video
- ✅ 60s adicionales son aceptables

**Alternativa Hybrid**:
- Usar Plan A por defecto
- Activar Plan B automáticamente si detección de salto visual
- Sistema de fallback automático

---

## 📚 Referencias

- **Nano Banana API Docs**: https://docs.nanobanana.com
- **VEO3 Image-to-Video**: `docs/VEO3_GUIA_COMPLETA.md`
- **Supabase Uploader**: `backend/services/veo3/supabaseFrameUploader.js`
- **Frame Extractor**: `backend/services/veo3/frameExtractor.js`

---

**Última actualización**: 10 Octubre 2025, 08:10
**Estado**: 📋 Plan B documentado, pendiente de validación Plan A
**Decisión**: Probar Plan A primero, implementar Plan B solo si es necesario
