# VEO 3.1 - Plan de Implementación Fantasy La Liga

**Fecha**: 16 Oct 2025 **Estado**: Ready to implement **Prioridad**: P0 - VEO3.1
disponible en KIE.ai

---

## 🎯 Objetivo

Migrar sistema VEO3 → VEO3.1 para aprovechar:

1. ✅ Audio nativo (eliminar TTS externa)
2. ✅ Start/End Frame control (transiciones invisibles)
3. ✅ Multi-Image Reference (mejor consistencia Ana/Carlos)

---

## 📋 Fase 1: Descubrimiento API (AHORA)

### 1.1. Test Manual en KIE.ai Playground

**Objetivo**: Identificar parámetros VEO3.1 exactos

**Tests a realizar**:

```javascript
// Test 1: Verificar nombre del modelo
{
  "prompt": "A woman speaking in Spanish from Spain",
  "model": "veo3.1_fast"  // O "veo3_1_fast", "veo-3.1-fast"?
}

// Test 2: Audio nativo
{
  "prompt": "Ana talks about football statistics",
  "model": "veo3.1_fast",
  "generateAudio": true  // O "audioEnabled", "enableAudio"?
}

// Test 3: Multi-image reference
{
  "prompt": "Ana in TV studio",
  "model": "veo3.1_fast",
  "imageUrls": [
    "https://.../ana-face.png",
    "https://.../ana-studio.png",
    "https://.../ana-outfit.png"
  ]
}

// Test 4: Start/End Frame
{
  "prompt": "Continuation of previous segment",
  "model": "veo3.1_fast",
  "startFrame": "https://.../last-frame.png",  // O "firstFrame"?
  "endFrame": {...}  // Configuración?
}
```

**Información a capturar**:

- ✅ Nombre exacto del modelo
- ✅ Parámetros de audio (`generateAudio`? `audioConfig`?)
- ✅ Parámetros de frame control (`startFrame`? `firstFrame`?)
- ✅ Límite de `imageUrls` (¿realmente soporta 3?)
- ✅ Estructura de respuesta (¿cambia algo?)
- ✅ Costo real por request

---

## 📋 Fase 2: Actualizar `veo3Client.js`

### 2.1. Cambios Requeridos

**Archivo**: `backend/services/veo3/veo3Client.js`

```javascript
class VEO3Client {
    constructor() {
        // ... existing code ...

        // ✅ NUEVO - VEO3.1 defaults
        this.defaultModel = process.env.VEO3_DEFAULT_MODEL || 'veo3.1_fast';
        this.enableNativeAudio =
            process.env.VEO3_ENABLE_NATIVE_AUDIO !== 'false';
        this.maxReferenceImages = 3; // VEO3.1 soporta hasta 3 imágenes
    }

    /**
     * Generar video con VEO3.1
     * @param {string} prompt - Prompt para el video
     * @param {object} options - Opciones VEO3.1
     */
    async generateVideo(prompt, options = {}) {
        try {
            // ✅ NUEVO - Soporte multi-imagen (hasta 3)
            let imageUrls = [];
            if (options.imageUrls && Array.isArray(options.imageUrls)) {
                imageUrls = options.imageUrls.slice(0, this.maxReferenceImages);
            } else if (options.imageUrl) {
                imageUrls = [options.imageUrl];
            }

            const params = {
                prompt,
                model: options.model || this.defaultModel,
                aspectRatio: options.aspectRatio || this.defaultAspect,
                seeds: this.characterSeed,
                watermark: options.watermark || this.watermark,
                enableTranslation: false,
                enableFallback: options.enableFallback !== false,

                // ✅ NUEVO - Audio nativo VEO3.1
                generateAudio:
                    this.enableNativeAudio && options.generateAudio !== false,

                // ✅ NUEVO - Multi-image reference
                ...(imageUrls.length > 0 && { imageUrls }),

                // ✅ NUEVO - Start/End Frame control
                ...(options.startFrame && { startFrame: options.startFrame }),
                ...(options.endFrame && { endFrame: options.endFrame })
            };

            logger.info(`[VEO3Client] 🎬 Generando con VEO3.1:`);
            logger.info(`   Model: ${params.model}`);
            logger.info(`   Audio nativo: ${params.generateAudio}`);
            logger.info(`   Reference images: ${imageUrls.length}`);
            logger.info(`   Start frame: ${options.startFrame ? 'YES' : 'NO'}`);

            const response = await axios.post(
                `${this.baseUrl}/generate`,
                params,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000,
                    validateStatus: status => status < 500
                }
            );

            return response.data;
        } catch (error) {
            logger.error(
                '[VEO3Client] Error generando video VEO3.1:',
                error.message
            );
            throw error;
        }
    }

    /**
     * ✅ NUEVO - Extraer último frame de video para continuidad
     * @param {string} videoPath - Ruta al video local
     * @returns {Promise<string>} - Path al frame extraído
     */
    async extractLastFrame(videoPath) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execPromise = promisify(exec);

        const outputPath = `/tmp/last_frame_${Date.now()}.png`;

        try {
            // Extraer último frame con FFmpeg
            await execPromise(
                `ffmpeg -sseof -1 -i "${videoPath}" -vframes 1 "${outputPath}"`
            );

            logger.info(`[VEO3Client] ✅ Last frame extracted: ${outputPath}`);
            return outputPath;
        } catch (error) {
            logger.error(
                '[VEO3Client] Error extracting last frame:',
                error.message
            );
            throw error;
        }
    }

    /**
     * ✅ NUEVO - Subir frame a Supabase para usar como startFrame
     * @param {string} framePath - Path local del frame
     * @returns {Promise<string>} - URL pública del frame
     */
    async uploadFrameToSupabase(framePath) {
        const fs = require('fs');
        const path = require('path');
        const { createClient } = require('@supabase/supabase-js');

        const supabase = createClient(
            process.env.SUPABASE_PROJECT_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const fileName = `frames/${Date.now()}_${path.basename(framePath)}`;
        const fileBuffer = fs.readFileSync(framePath);

        const { data, error } = await supabase.storage
            .from('flp')
            .upload(fileName, fileBuffer, {
                contentType: 'image/png',
                cacheControl: '3600'
            });

        if (error) throw error;

        const { data: publicUrl } = supabase.storage
            .from('flp')
            .getPublicUrl(fileName);

        logger.info(`[VEO3Client] ✅ Frame uploaded: ${publicUrl.publicUrl}`);
        return publicUrl.publicUrl;
    }
}

module.exports = VEO3Client;
```

---

## 📋 Fase 3: Actualizar `viralVideoBuilder.js`

### 3.1. Cambios para Start/End Frame

**Archivo**: `backend/services/veo3/viralVideoBuilder.js`

```javascript
class ViralVideoBuilder {
    /**
     * ✅ ACTUALIZADO - Generar segmento con frame continuity
     */
    async generateSegment(segmentIndex) {
        const segment = this.segments[segmentIndex];

        logger.info(
            `[ViralVideoBuilder] 📹 Generando segmento ${segmentIndex + 1}/${this.segments.length}`
        );

        // ✅ NUEVO - Extraer último frame del segmento anterior
        let startFrame = null;
        if (segmentIndex > 0) {
            const prevSegment = this.segments[segmentIndex - 1];
            if (prevSegment.localPath) {
                try {
                    const lastFramePath =
                        await this.veo3Client.extractLastFrame(
                            prevSegment.localPath
                        );
                    startFrame =
                        await this.veo3Client.uploadFrameToSupabase(
                            lastFramePath
                        );

                    logger.info(
                        `[ViralVideoBuilder] ✅ Using start frame from segment ${segmentIndex}`
                    );
                } catch (error) {
                    logger.warn(
                        `[ViralVideoBuilder] ⚠️ Could not extract start frame, continuing without it`
                    );
                }
            }
        }

        // Construir prompt mejorado
        const enhancedPrompt = this.promptBuilder.buildEnhancedNanoBananaPrompt(
            segment.script,
            segment.emotion,
            segment.shot,
            segment.action,
            segment.imageContext
        );

        // ✅ ACTUALIZADO - Usar multi-image reference (3 imágenes)
        const referenceImages = [
            segment.imageContext.supabaseUrl, // Imagen contextual Nano Banana
            this.presenter.imageUrls[0], // Rostro Ana/Carlos
            this.presenter.studioBackground // Estudio TV
        ].filter(Boolean);

        // Generar video con VEO3.1
        const veo3Response = await this.veo3Client.generateVideo(
            enhancedPrompt,
            {
                model: this.presenter.model,
                aspectRatio: this.presenter.aspectRatio,
                seeds: this.presenter.seed,
                watermark: this.presenter.waterMark,

                // ✅ NUEVO - Multi-image reference
                imageUrls: referenceImages,

                // ✅ NUEVO - Audio nativo
                generateAudio: true,

                // ✅ NUEVO - Start frame control
                startFrame: startFrame
            }
        );

        // Esperar generación
        const taskId = veo3Response.data.taskId;
        const video = await this.veo3Client.waitForCompletion(
            taskId,
            300000,
            enhancedPrompt
        );

        // Descargar video
        const outputPath = path.join(
            this.sessionFolder,
            `segment_${segmentIndex}_${taskId.substring(0, 8)}.mp4`
        );

        await this.veo3Client.downloadVideo(video.url, outputPath);

        // Actualizar metadata del segmento
        segment.veo3Url = video.url;
        segment.localPath = outputPath;
        segment.duration = video.duration;
        segment.taskId = taskId;
        segment.startFrameUsed = !!startFrame;

        return segment;
    }
}
```

---

## 📋 Fase 4: Test E2E VEO3.1

### 4.1. Script de Test

**Archivo**: `scripts/veo3/test-veo3.1-e2e.js`

```javascript
/**
 * Test E2E VEO3.1 - Audio nativo + Start/End Frame + Multi-Image
 */

const VEO3Client = require('../../backend/services/veo3/veo3Client');
const logger = require('../../backend/utils/logger');

async function testVEO31() {
    console.log('\n🚀 TEST E2E VEO 3.1\n');

    const client = new VEO3Client();

    // Test 1: Audio Nativo
    console.log('📹 Test 1: Audio nativo...');
    const segment1 = await client.generateCompleteVideo(
        'Ana habla con emoción: "¡Misters! He descubierto el chollo de la jornada. Pere Milla a solo 5 euros es INCREÍBLE!"',
        {
            model: 'veo3.1_fast',
            imageUrls: [
                'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png'
            ],
            generateAudio: true
        }
    );

    console.log(`✅ Segment 1: ${segment1.url}`);
    console.log(`   Audio nativo: ${segment1.hasAudio ? 'YES' : 'NO'}`);

    // Descargar para extraer frame
    const segment1Path = '/tmp/veo31_segment1.mp4';
    await client.downloadVideo(segment1.url, segment1Path);

    // Test 2: Start/End Frame
    console.log('\n📹 Test 2: Start/End Frame control...');
    const lastFrame = await client.extractLastFrame(segment1Path);
    const startFrameUrl = await client.uploadFrameToSupabase(lastFrame);

    const segment2 = await client.generateCompleteVideo(
        'Ana continúa: "Los números son ESPECTACULARES. 5 euros por este nivel es MATEMÁTICA pura."',
        {
            model: 'veo3.1_fast',
            startFrame: startFrameUrl,
            generateAudio: true
        }
    );

    console.log(`✅ Segment 2: ${segment2.url}`);
    console.log(`   Start frame: ${startFrameUrl}`);

    // Test 3: Multi-Image Reference
    console.log('\n📹 Test 3: Multi-image reference (3 imágenes)...');
    const segment3 = await client.generateCompleteVideo(
        'Ana concluye: "¡NO esperéis más! Pere Milla es el FICHAJE de la jornada."',
        {
            model: 'veo3.1_fast',
            imageUrls: [
                'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png',
                'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-estudio.jpg',
                'https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/logos/flp-logo.png'
            ],
            generateAudio: true
        }
    );

    console.log(`✅ Segment 3: ${segment3.url}`);
    console.log(`   Reference images: 3`);

    console.log('\n✅ TEST COMPLETADO\n');
    console.log('Resultados:');
    console.log(`   Segment 1: ${segment1.url}`);
    console.log(`   Segment 2: ${segment2.url}`);
    console.log(`   Segment 3: ${segment3.url}`);
}

testVEO31().catch(console.error);
```

**Ejecutar**:

```bash
npm run veo3:test-veo3.1
```

---

## 📋 Fase 5: Validación Calidad

### 5.1. Checklist Validación

**Audio Nativo**:

- [ ] Audio sincronizado con movimientos labiales
- [ ] Acento español de España (no mexicano)
- [ ] Volumen consistente entre segmentos
- [ ] Sin artefactos de audio (clicks, pops)

**Start/End Frame**:

- [ ] Transición invisible entre Segment 1 → 2
- [ ] Transición invisible entre Segment 2 → 3
- [ ] No hay "saltos" visuales
- [ ] No hay crossfades necesarios

**Multi-Image Reference**:

- [ ] Ana mantiene consistencia facial en 3 segmentos
- [ ] Outfit (polo rojo) visible y consistente
- [ ] Estudio TV visible en fondo
- [ ] Logo FLP visible en algún segmento

**Comparación vs VEO3**:

- [ ] Calidad visual: VEO3.1 ≥ VEO3
- [ ] Duración generación: VEO3.1 ≈ VEO3 (no más lento)
- [ ] Tasa de error: VEO3.1 ≤ VEO3

---

## 📋 Fase 6: Despliegue Gradual

### 6.1. Estrategia Rollout

**Semana 1**: Test interno

- Generar 5 videos test con VEO3.1
- Validar calidad vs VEO3
- Medir costos reales

**Semana 2**: A/B Testing

- 50% videos con VEO3
- 50% videos con VEO3.1
- Comparar engagement Instagram

**Semana 3**: Full Migration

- 100% videos con VEO3.1
- Deprecar flujo VEO3 (mantener como fallback)

---

## 💰 Cost Tracking

```
VEO3 Actual:
- $0.30/segmento × 3 = $0.90/video
- 20 videos/mes = $18/mes

VEO3.1 Fast:
- $0.40/segmento × 3 = $1.20/video (+33%)
- 20 videos/mes = $24/mes (+$6/mes)

Incremento: +$6/mes (+$72/año)
```

**ROI Estimado**:

- Audio nativo: Elimina 2h/semana de corrección TTS → $80/mes saved (labor)
- Start/End Frame: Elimina 1h/semana crossfades → $40/mes saved
- **Total savings**: $120/mes - $6/mes = **$114/mes profit**

---

## 🚀 Timeline

| Fase                            | Duración  | Responsable   | Output                        |
| ------------------------------- | --------- | ------------- | ----------------------------- |
| 1. Descubrimiento API           | 2-4 horas | Fran + Claude | Parámetros exactos VEO3.1     |
| 2. Actualizar veo3Client.js     | 4-6 horas | Claude        | Código production-ready       |
| 3. Actualizar viralVideoBuilder | 2-3 horas | Claude        | Frame continuity implementado |
| 4. Test E2E                     | 1-2 horas | Fran          | 3 videos generados            |
| 5. Validación calidad           | 2-3 horas | Fran          | Checklist completado          |
| 6. Despliegue gradual           | 3 semanas | Fran + Claude | 100% migración                |

**Total**: 3-4 días desarrollo + 3 semanas rollout

---

## 📝 Próximos Pasos INMEDIATOS

1. **Test Manual KIE.ai Playground** (Fran - 30 min)
    - Generar 1 video con VEO3.1
    - Capturar parámetros exactos del request
    - Verificar estructura de respuesta

2. **Compartir JSON Request/Response** (Fran → Claude - 5 min)
    - Copiar request completo del playground
    - Copiar response completo
    - Confirmar pricing real

3. **Implementar veo3Client.js** (Claude - 4 horas)
    - Actualizar con parámetros verificados
    - Agregar métodos extractLastFrame + uploadFrameToSupabase
    - Crear test script

4. **Test E2E** (Fran - 1 hora)
    - Ejecutar `npm run veo3:test-veo3.1`
    - Validar calidad audio + transiciones
    - Aprobar para producción

---

**Última actualización**: 16 Oct 2025 21:00 **Mantenido por**: Claude Code
**Status**: ⏳ Esperando test manual Fran en KIE.ai playground
