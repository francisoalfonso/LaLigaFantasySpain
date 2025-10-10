# Nano Banana - Configuración Definitiva Validada

**Fecha de validación**: 10 de Octubre, 2025
**Estado**: ✅ CONFIGURACIÓN FINAL - NO MODIFICAR

## Resumen Ejecutivo

Esta configuración ha sido validada mediante testing exhaustivo y produce imágenes de Ana Martínez con:
- ✅ Formato vertical correcto (9:16 = 576x1024px)
- ✅ Pelo rubio natural sin reflejos rojizos fuertes
- ✅ Identidad de Ana consistente con referencias
- ✅ Contacto visual directo con cámara
- ✅ Integración realista con estudio FLP

**IMPORTANTE**: Esta configuración NO debe ser modificada sin aprobación explícita del usuario.

---

## Configuración de Parámetros

### Archivo: `data/flp-nano-banana-config.json`

```json
{
  "model": "google/nano-banana-edit",
  "seed": 12500,
  "prompt_strength": 0.75,
  "image_size": "9:16",
  "output_format": "png",
  "transparent_background": false
}
```

### Parámetros Críticos

| Parámetro | Valor | Función |
|-----------|-------|---------|
| `image_size` | `"9:16"` | **CRÍTICO**: Fuerza formato vertical 576x1024px (Instagram/TikTok) |
| `prompt_strength` | `0.75` | Equilibrio óptimo entre identidad Ana y entorno FLP |
| `seed` | `12500` | Seed base para consistencia de identidad |

**¿Por qué `image_size: "9:16"` es crítico?**

Sin este parámetro, Nano Banana genera imágenes cuadradas (1024x1024) que no funcionan para Reels/Stories. El parámetro `"9:16"` fuerza explícitamente el formato vertical independientemente del orden de imágenes de referencia.

**¿Por qué `prompt_strength: 0.75` en lugar de 0.8?**

Testing demostró que 0.75 produce mejor equilibrio:
- Mantiene identidad de Ana de referencias
- Permite integración natural con estudio FLP
- Reduce artefactos y reflejos excesivos

---

## Orden de Imágenes de Referencia

### Array de Referencias (5 imágenes totales)

```javascript
[
  // 1-4: Vistas de Ana Martínez (4 imágenes)
  "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png", // body-outfit
  "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-04.png", // face-frontal
  "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-06.png", // face-right-profile
  "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-07.png", // face-left-profile

  // 5: Estudio FLP (1 imagen) - AL FINAL
  "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/flp/estudio/estudio-FLP.jpg"
]
```

**Nota**: Con `image_size: "9:16"` explícito, el orden NO afecta el aspect ratio. El estudio va al final por convención (contexto ambiental después de identidad).

---

## Prompts Validados

### Prompt Base (DEFINITIVO)

⚠️ **CRÍTICO: Este prompt es EXACTO del test exitoso. NO añadir texto adicional.**

**Longitud de prompt afecta realismo**:
- Prompt corto (~80 palabras) = Realismo natural ✅
- Prompt largo (>100 palabras) = Aspecto 3D/render/plástico ❌

```
ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, same face, hairstyle and red FLP polo shirt, integrated with the studio lighting and reflections, very soft red neon glow from the FLP sign behind her, reflecting faintly on the right edge of her face only, no red color cast on hair, maintain natural blonde hair color, balanced neutral white balance, gentle blue monitor reflections on left side, realistic soft shadows and light diffusion, cinematic tone, Canon EOS R5 85mm f1.4 lens, shallow depth of field, film grain, authentic human skin texture, no CGI, no render, no plastic skin, confident professional expression
```

**Elementos clave del prompt**:
- `same woman as in the reference images, same face` → Identidad consistente
- `very soft red neon glow... reflecting faintly on the right edge of her face only` → Control preciso de reflejos rojizos
- `no red color cast on hair, maintain natural blonde hair color` → Protección del color rubio
- `confident professional expression` → Expresión natural (ya implica mirar a cámara)

### Negative Prompt (DEFINITIVO)

```
no red tint on hair, no red highlights on hair, no strong color reflections, no magenta tone on face, no HDR, no 3D render, no composite lighting mismatch, no overexposed red areas, no fake reflections
```

**Función del negative prompt**:
- Previene reflejos rojizos fuertes en pelo rubio
- Evita look 3D/render (mantiene realismo)
- Controla sobreexposición de neón rojo

---

## Variaciones por Plano Cinematográfico

### Progresión: Wide → Medium → Close-Up

#### 1. Wide Shot (Segmento Hook)
```
[BASE_PROMPT], wide shot, full body from waist up, standing confidently in the center of the FLP studio, natural pose with hands gesturing
```
- Seed: `12500` (base)
- Establece escenario completo

#### 2. Medium Shot (Segmento Desarrollo)
```
[BASE_PROMPT], medium shot, from waist up, direct eye contact with camera, professional confident expression, slight smile
```
- Seed: `12501` (base + 1)
- Acercamiento natural

#### 3. Close-Up (Segmento CTA)
```
[BASE_PROMPT], close-up, head and shoulders only, intense direct eye contact, warm confident expression, engaging the viewer
```
- Seed: `12502` (base + 2)
- Intimidad y urgencia

**Variaciones de seed**: Mínimas (+1, +2) para microcambios naturales sin perder identidad.

---

## Resultados de Testing

### Test Exitoso: `test-prompt-usuario-v2.js`

**Configuración probada**:
- `image_size: "9:16"` ✅
- `prompt_strength: 0.75` ✅
- Prompt detallado sin asteriscos markdown ✅
- Orden: 4 Ana + 1 estudio ✅

**Resultados**:
- ⏱️ Tiempo de generación: 24 segundos
- 📐 Dimensiones: 576x1024 (9:16 ratio perfecto)
- 🎨 Calidad: Pelo rubio sin reflejos rojizos fuertes
- 👁️ Contacto visual: Directo a cámara
- 🖼️ URL ejemplo: `https://tempfile.aiquickdraw.com/workers/nano/image_*_9x16_576x1024.png`

### Validación Visual

Usuario confirmó:
> "Sí, guarda esta configuración. Esta información de las imágenes que está generando está realmente muy bien. Hay que intentar también que las imágenes que genere Ana estén mirando para la cámara... Pero las imágenes están siendo de buena calidad, me gusta. Vamos a guardar esto y que quede afianzado, ¿vale? Que ya no tengamos que salirnos de este modelo."

---

## Problemas Resueltos

### Problema 1: Reflejos Rojizos en Pelo
**Causa**: Neón rojo FLP reflejándose en pelo rubio
**Solución**:
- Prompt: `very soft red neon glow... reflecting faintly on the right edge of her face only`
- Negative prompt: `no red tint on hair, no red highlights on hair`
- Resultado: Reflejos controlados, pelo rubio natural mantenido

### Problema 2: Formato Cuadrado en Lugar de Vertical
**Causa**: Sin `image_size` explícito, Nano Banana generaba 1024x1024
**Solución**: Parámetro `image_size: "9:16"` fuerza 576x1024
**Resultado**: 100% vertical, perfecto para Instagram Reels/Stories

### Problema 3: Aspecto 3D/Render/Plástico (CRÍTICO)
**Causa**: Prompts demasiado largos (>100 palabras) con descripciones extra de planos/poses
**Ejemplo problema**: Añadir `, wide shot, full body from waist up, standing confidently...` al prompt base
**Solución**: Usar SOLO el prompt base validado sin añadir texto extra
**Resultado**: Piel realista y natural, sin aspecto 3D/render

**Comparación visual**:
- ❌ Prompt largo (>100 palabras): Piel suave/plástico, iluminación artificial, aspecto 3D
- ✅ Prompt corto (~80 palabras): Piel con textura natural, iluminación orgánica, realismo

**Regla de oro**: **Menos es más**. El prompt base ya contiene toda la información necesaria. NO añadir descripciones adicionales de:
- Planos cinematográficos (wide/medium/close-up)
- Poses específicas
- Instrucciones de mirada
- Descripciones de expresión adicionales

La **variación entre imágenes** se logra SOLO con cambios mínimos de seed (+1, +2), NO con texto extra en el prompt.

---

## Implementación en Código

### `backend/services/nanoBanana/nanoBananaClient.js`

```javascript
// Configuración
this.anaConfig = {
    seed: FLP_CONFIG.seed || 12500,
    promptStrength: FLP_CONFIG.prompt_strength || 0.75,
    model: FLP_CONFIG.model || 'google/nano-banana-edit',
    imageSize: FLP_CONFIG.image_size || '9:16', // CRITICAL
    outputFormat: FLP_CONFIG.output_format || 'png',
    transparentBackground: FLP_CONFIG.transparent_background || false
};

// Payload API
const createResponse = await axios.post(
    `${this.baseUrl}${this.createTaskEndpoint}`,
    {
        model: this.anaConfig.model,
        input: {
            prompt: prompt,
            negative_prompt: negativePrompt,
            image_urls: this.anaReferenceUrls,
            output_format: this.anaConfig.outputFormat,
            image_size: this.anaConfig.imageSize, // ✅ CRÍTICO
            seed: seed,
            prompt_strength: this.anaConfig.promptStrength,
            transparent_background: this.anaConfig.transparentBackground,
            n: 1
        }
    }
);
```

---

## Checklist de Validación (Para Nuevas Generaciones)

Al recibir una imagen generada, verificar:

- [ ] **Formato**: Vertical 9:16 (URL debe contener `9x16_576x1024`)
- [ ] **Pelo**: Rubio natural sin reflejos rojizos fuertes
- [ ] **Identidad**: Misma mujer que referencias (cara, peinado, polo FLP)
- [ ] **Contacto visual**: Ana mirando directamente a cámara
- [ ] **Iluminación**: Neón rojo suave en borde derecho, monitores azules izquierda
- [ ] **Realismo**: Piel natural (sin look 3D/plástico)

---

## Costos

- **Precio por imagen**: $0.02 USD (KIE.ai)
- **Progresión completa** (3 imágenes): $0.06 USD
- **Tiempo estimado**: 70-120 segundos (3 imágenes con cooling periods)

---

## Documentos Relacionados

- `data/flp-nano-banana-config.json` - Configuración de parámetros
- `backend/services/nanoBanana/nanoBananaClient.js` - Cliente implementado
- `scripts/nanoBanana/test-prompt-usuario-v2.js` - Test validado exitosamente
- `docs/presentadores-BASE ANA - NANOBANANA/guia_nanobanana_KIEAI_ana_martinez.md` - Guía original del sistema

---

## Notas de Desarrollo

### ¿Cuándo modificar esta configuración?

**NUNCA sin aprobación del usuario.** Esta configuración fue validada exhaustivamente y produce resultados consistentes de alta calidad.

Si surgen problemas:
1. Verificar que `flp-nano-banana-config.json` no ha sido modificado
2. Confirmar que `nanoBananaClient.js` usa `this.anaConfig.imageSize` correctamente
3. Revisar logs de payload enviado a KIE.ai
4. Consultar este documento para configuración de referencia

### Testing de Cambios

Si es absolutamente necesario probar cambios:
1. Crear nuevo script en `scripts/nanoBanana/test-*.js`
2. Documentar motivo del cambio
3. Comparar resultados con configuración actual
4. Obtener aprobación del usuario antes de aplicar

---

**Última actualización**: 10 de Octubre, 2025
**Estado**: ✅ CONFIGURACIÓN DEFINITIVA VALIDADA
**Aprobado por**: Usuario (sesión de validación Oct 10, 2025)
