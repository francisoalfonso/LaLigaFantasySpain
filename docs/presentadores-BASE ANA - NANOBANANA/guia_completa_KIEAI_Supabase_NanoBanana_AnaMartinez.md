# 🎬 Guía completa KIE.AI + Supabase + Nano Banana
## Caso práctico: Ana Martínez (FLP)

Esta guía te permite generar imágenes **totalmente consistentes y realistas** del personaje **Ana Martínez**, integrando **Nano Banana** dentro de **KIE.AI**, con **imágenes de referencia almacenadas en Supabase Storage**.

---

## 🎯 Objetivo general
- Mantener **identidad facial constante** (Ana Martínez).  
- Integrar **entorno de estudio FLP** (luces, reflejos, neón).  
- Permitir **cambio de ropa o camiseta** sin romper la coherencia.  
- Lograr **piel real y luz fotográfica natural**.

---

## 🧠 Arquitectura base
**Stack:**  
- Generador: `KIE.AI (modelo Nano Banana)`  
- Almacenamiento: `Supabase Storage`  
- Pipeline: `API pública o Playground`

### Campos clave (KIE.AI)
Usa siempre este formato (no `referenced_image_ids`):
```json
"image_urls": ["https://.../imagen1.png", "https://.../imagen2.jpg"]
```

---

## 📸 Referencias de Ana Martínez
Usa **estas vistas base** para la identidad facial y corporal:

| Tipo | Archivo | Uso |
|------|----------|-----|
| Rostro frontal | `ana-peinido2-04.png` | Face ID principal |
| Cuerpo / outfit | `ana-peinido2-03.png` | Proporciones y polo FLP |
| Perfil derecho | `ana-peinido2-06.png` | Volumen y textura lateral |
| Perfil izquierdo | `ana-peinido2-07.png` | Equilibrio facial 3D |
| Entorno | `estudio-FLP.jpg` | Luces y reflejos del plató |

> ⚠️ No mezcles variantes con coleta si buscas consistencia máxima.

---

## 🗂️ Estructura recomendada en Supabase
```
flp/
  ana/
    ana-peinido2-03.png
    ana-peinido2-04.png
    ana-peinido2-06.png
    ana-peinido2-07.png
  estudio/
    estudio-FLP.jpg
  kits/
    Bilbao.png
```

---

## 🔗 URLs desde Supabase

### A) Bucket público (recomendado para KIE.AI)
```
https://<PROJECT_REF>.supabase.co/storage/v1/object/public/<BUCKET>/<ruta/archivo>.png
```

### B) Bucket privado + signed URL
- Genera signed URLs con caducidad mínima de **30 minutos**:
```js
const { data } = await supabase
  .storage.from("flp")
  .createSignedUrl("ana/ana-peinido2-03.png", 1800);
```
- Úsalas en el campo `image_urls`.

---

## 💡 Parámetros recomendados (Nano Banana)
| Parámetro | Valor | Descripción |
|------------|--------|--------------|
| **model** | `"nano-banana-latest"` | Última versión estable |
| **seed** | `12500` | Fija identidad y luz base |
| **prompt_strength** | `0.8` | Equilibrio cara ↔ entorno |
| **size** | `"1536x864"` | Plano medio |
| **film_grain** | `true` | Realismo analógico |
| **lighting** | `cinematic daylight, soft diffused light` | Luz coherente con el plató |

---

## ⚙️ Payload base (Supabase + KIE.AI)
```json
{
  "model": "nano-banana-latest",
  "prompt": "ultra realistic cinematic portrait of Ana Martínez presenting inside the FLP studio, same woman as in the reference images, same face, hairstyle and red FLP polo shirt, fully integrated with the studio lighting and reflections, red neon light reflecting on her right side, subtle blue glow from the monitor screens, realistic soft shadows, Canon EOS R5 85mm f1.4 lens, shallow depth of field, cinematic film grain, authentic human skin texture, no CGI, no render, no plastic skin",
  "negative_prompt": "no 3D render, no compositing, no mismatched lighting, no HDR, no over-smooth face, no fake reflections, no morphing, no new identity",
  "size": "1536x864",
  "seed": 12500,
  "image_urls": [
    "https://<PROJECT_REF>.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-03.png",
    "https://<PROJECT_REF>.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-04.png",
    "https://<PROJECT_REF>.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-06.png",
    "https://<PROJECT_REF>.supabase.co/storage/v1/object/public/flp/ana/ana-peinido2-07.png",
    "https://<PROJECT_REF>.supabase.co/storage/v1/object/public/flp/estudio/estudio-FLP.jpg"
  ],
  "transparent_background": false,
  "n": 1,
  "prompt_strength": 0.8
}
```

---

## 🧪 Ejemplo de cURL (KIE.AI)
```bash
curl -X POST https://api.kie.ai/v1/generate-image   -H "Authorization: Bearer $KIEAI_API_KEY"   -H "Content-Type: application/json"   -d @payload-ana-flp.json
```

---

## 👕 Sustituir camiseta o polo
Para cambiar la ropa sin romper la coherencia:

1. Añade la nueva prenda como **última referencia**:
```json
"https://<PROJECT_REF>.supabase.co/storage/v1/object/public/flp/kits/Bilbao.png"
```
2. Ajusta el prompt:
```
wearing the same shirt design as in the last reference image (Athletic Club Bilbao red and white stripes),
realistic cotton texture, correct cloth folds, consistent lighting with the studio,
red neon reflections and blue monitor glow on the fabric, no warped logos
```
3. Mantén `seed` y referencias anteriores → rostro y entorno no cambian.

---

## 💡 Mejores prácticas de integración con el estudio FLP
| Elemento | Clave a incluir en el prompt |
|-----------|-----------------------------|
| **Neón rojo FLP** | `red neon light reflecting softly on right side of face` |
| **Pantallas** | `blue and green glow from monitors` |
| **Sombras reales** | `soft shadow under chin from overhead light` |
| **Color grading** | `warm to neutral cinematic tone, film grain` |
| **Reflejos naturales** | `light scattering on skin and fabric` |

---

## ⚠️ Errores comunes y solución
| Problema | Causa | Solución |
|-----------|--------|----------|
| Logos deformados | Fusión agresiva del prompt | Añadir `no warped logos` |
| Ropa demasiado brillante | Luz CGI o HDR | Usa `balanced exposure, diffuse cotton fabric` |
| Piel artificial | Falta de textura | Añadir `visible pores, film grain` |
| Integración débil | Falta de entorno FLP | Mantén `estudio-FLP.jpg` siempre en las referencias |
| Identidad inestable | Peinados distintos | No mezclar coleta / cambios extremos |

---

## ✅ Checklist final
- [x] Usar `image_urls` (no `referenced_image_ids`)  
- [x] Imágenes en Supabase accesibles vía HTTPS  
- [x] Semilla fija (`seed: 12500`)  
- [x] `prompt_strength: 0.8`  
- [x] Luz y cámara consistentes (`Canon EOS R5 85mm f1.4`)  
- [x] Entorno FLP como referencia de luz base  
- [x] Añadir prendas nuevas solo al final del array  
- [x] Incluir siempre “no CGI / no render” en negatives  

---

**Versión:** 3.0  
**Autor:** Fran  
**Proyecto:** Fantasy La Liga Pro (FLP)  
**Modelo:** Nano Banana (KIE.AI)  
**Integración:** Supabase Storage  
**Propósito:** Generación estable, realista y configurable del personaje Ana Martínez
