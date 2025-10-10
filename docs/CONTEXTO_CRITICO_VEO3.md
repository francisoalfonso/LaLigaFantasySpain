# CONTEXTO CRÍTICO VEO3 - REFERENCIA RÁPIDA

**Fecha**: 6 Octubre 2025
**Propósito**: Documento de referencia rápida con TODO el contexto que debo recordar SIEMPRE

---

## 🎯 PUNTOS CRÍTICOS IDENTIFICADOS (6 Oct 2025)

### 1. ✅ Script Coherente y Timing Correcto
**Problema**: Texto demasiado largo, Ana se queda con cara rara intentando hablar
**Solución**:
- **Duración máxima total**: 14 segundos (7s por segmento)
- **Script coherente**: Historia completa sobre el chollo
- Texto que se pueda decir cómodamente en el tiempo disponible

### 2. ✅ Sin Transiciones de VEO3 - Imagen Estática al Final
**Problema**: VEO3 genera movimientos/transiciones al final
**Solución**:
- Cada segmento debe terminar con **imagen ESTÁTICA**
- **Cortes secos** entre segmentos (no crossfade)
- Prompts: "ends with still frame" o "freezes at the end"

### 3. ✅ Textos Simples - Números en Palabras
**Problema**: Uso de cifras que VEO3 no pronuncia bien
**Solución**:
- ❌ "1.35x" → ✅ "uno coma tres cinco veces su valor"
- ❌ "7.2M" → ✅ "siete punto dos millones"
- Frases cortas y simples (30-50 palabras por prompt)
- Ver `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` NORMA #2 y #5

### 4. ✅ Logo Final con Transición desde Último Frame
**Requisito**:
- Tomar último frame del segmento 2
- Transición hacia logo blanco Fantasy La Liga
- Logo cierra el video (2-3 segundos)

### 5. ⏳ Formato JSON para VEO3
**Pendiente aclaración del usuario**

---

## 📁 RECURSOS CLAVE

### Logo Blanco Fantasy La Liga
**Ubicación**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/output/veo3/logo-static.mp4`
**Uso**: Outro final del video
**Configuración**: Ver `videoConcatenator.js` línea 18

### Imagen Ana (Supabase)
**URL**: `https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg`
**Configuración**: `.env` → `ANA_IMAGE_URL`
**Seed**: `30001` (NUNCA cambiar)

---

## 📋 ARCHIVOS CRÍTICOS

### 1. promptBuilder.js
**Ubicación**: `backend/services/veo3/promptBuilder.js`
**Función**: Genera prompts para VEO3
**Revisar**:
- Conversión de números a palabras
- Textos simples y directos
- Límite 30-50 palabras por prompt

### 2. videoConcatenator.js
**Ubicación**: `backend/services/veo3/videoConcatenator.js`
**Función**: Concatena segmentos + agrega logo
**Configuración actual**:
```javascript
// Línea 18: Logo outro path
this.logoOutroPath = path.join(this.outputDir, 'logo-static.mp4');

// Línea 47-56: Configuración outro
outro: {
    enabled: true,
    logoPath: null,
    duration: 1.5,
    freezeFrame: {
        enabled: true,
        duration: 0.8
    }
}

// Línea 30-33: Transiciones DESACTIVADAS
transition: {
    type: 'crossfade',
    duration: 0.5,
    enabled: false // ⚠️ DESACTIVADO
}
```

### 3. viralVideoBuilder.js
**Ubicación**: `backend/services/veo3/viralVideoBuilder.js`
**Función**: Genera videos multi-segmento
**Configuración actual**:
- Línea 75: `useImageReference: true` ✅ (Ana aparece)
- Línea 40: `useFrameToFrame = true` (transiciones suaves)

---

## 🔧 CONFIGURACIÓN ACTUAL (.env)

```bash
# Ana Real
ANA_IMAGE_URL=https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg
ANA_CHARACTER_SEED=30001

# VEO3
KIE_AI_API_KEY=db89d16920c0e0ca0d2e7ae4780087a8
VEO3_DEFAULT_MODEL=veo3_fast
VEO3_DEFAULT_ASPECT=9:16
VEO3_MAX_DURATION=8
```

---

## 📚 DOCUMENTOS DE REFERENCIA

### Normas Críticas
**Archivo**: `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md`
**Normas clave**:
- **NORMA #1**: No crear archivos innecesarios
- **NORMA #2**: Números en subtítulos (audio literal vs visual)
- **NORMA #3**: Español de España en prompts (lowercase "speaks")
- **NORMA #5**: Prompts VEO3 optimizados (30-50 palabras, simples)

### Guía Completa VEO3
**Archivo**: `docs/VEO3_GUIA_COMPLETA.md`
**Contenido**: Configuración definitiva, 6 normas críticas

### Supabase Storage
**Archivo**: `docs/SUPABASE_STORAGE_ANA_IMAGES.md`
**Contenido**: Migración de imágenes, cómo subir nuevas

---

## 🎬 FLUJO DE GENERACIÓN ACTUAL

```
1. Usuario request → /api/veo3/generate-viral
2. ViralVideoBuilder recibe data
3. Valida jugador en diccionario → obtiene referencia genérica
4. Para cada segmento (1-3):
   a. PromptBuilder genera prompt (con imagen Ana de Supabase)
   b. VEO3Client envía a KIE.ai API
   c. Espera completar (~2-5 min)
   d. Descarga video
5. VideoConcatenator:
   a. Concatena segmentos (sin crossfade)
   b. Agrega freeze frame
   c. Agrega logo outro
6. Retorna video final
```

---

## ⚠️ ERRORES COMUNES A EVITAR

### 1. Perder Contexto
❌ Preguntar por logo cuando ya existe
✅ Consultar este documento primero

### 2. Ignorar Normas Existentes
❌ Crear nuevos archivos sin verificar
✅ Leer `NORMAS_DESARROLLO_IMPRESCINDIBLES.md`

### 3. Textos Complejos
❌ "Ratio 1.35x a 7.2M"
✅ "Uno coma tres cinco veces su valor a siete millones"

### 4. Prompts Largos
❌ >80 palabras con múltiples instrucciones
✅ 30-50 palabras simples

### 5. Transiciones de VEO3
❌ Descripciones de movimientos continuos
✅ "ends with still frame"

---

## 🎯 PRÓXIMOS PASOS (TODO)

### Test 2 Segmentos
- [ ] Implementar script coherente (14s total)
- [ ] Asegurar imagen estática al final de cada segmento
- [ ] Convertir números a palabras
- [ ] Verificar transición a logo final
- [ ] Ejecutar test completo

### Validaciones
- [ ] Ana aparece en ambos segmentos
- [ ] Consistencia visual de Ana
- [ ] Transiciones suaves (cortes secos)
- [ ] Español de España
- [ ] Logo al final

---

## 📞 REFERENCIAS RÁPIDAS

### Comandos Útiles
```bash
# Iniciar servidor
npm run dev

# Test VEO3
node scripts/veo3/test-2-segmentos-completo.js

# Ver video generado
open "output/veo3/viral/ana-viral-*.mp4"

# Verificar logo
ls output/veo3/logo-static.mp4
```

### URLs Importantes
- Supabase Storage: https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/storage/buckets/ana-images
- KIE.ai: https://kie.ai

---

**Última actualización**: 6 Octubre 2025, 10:35h
**Mantenido por**: Claude Code
**Propósito**: Evitar pérdida de contexto, referencia rápida SIEMPRE
