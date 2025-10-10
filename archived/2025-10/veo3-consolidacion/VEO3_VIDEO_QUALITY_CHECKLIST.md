# VEO3 - Checklist de Calidad de Videos Multi-Segmento

**Fecha creación**: 3 Octubre 2025
**Video analizado**: Pere Milla chollo viral 4 segmentos (32s)
**Estado**: 🔴 Requiere optimizaciones críticas

---

## 📋 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### 🎙️ **1. AUDIO - Timing y Transiciones**

#### **Problema 1.1**: Audio empieza demasiado rápido (segundo 0)
- **Síntoma**: Ana se traba al hablar al principio del video
- **Causa raíz**: VEO3 inicia diálogo inmediatamente sin tiempo de "setup"
- **Impacto**: ❌ CRÍTICO - Primera impresión negativa
- **Solución propuesta**:
  - Agregar 0.5-1s de silencio al inicio del primer segmento
  - Modificar prompt para incluir "brief pause before speaking"
- **Archivo afectado**: `backend/services/veo3/threeSegmentGenerator.js`
- **Estado**: ⏳ Pendiente

#### **Problema 1.2**: Audio se traba en transiciones (segundo 8, 16, 24)
- **Síntoma**: Cambios bruscos entre segmentos causan cortes de audio
- **Causa raíz**: Concatenación FFmpeg sin padding de audio
- **Impacto**: ❌ CRÍTICO - Interrumpe narrativa
- **Solución propuesta**:
  - Agregar 0.3s de silence padding entre segmentos en VideoConcatenator
  - Implementar audio crossfade de 0.2s en transiciones
- **Archivo afectado**: `backend/services/veo3/videoConcatenator.js`
- **Estado**: ⏳ Pendiente

---

### 🗣️ **2. VOZ - Consistencia y Tono**

#### **Problema 2.1**: Voz cambia entre segmentos (segundo 0 → 8 → 17)
- **Síntoma**:
  - Segundo 0-8: Voz A
  - Segundo 8-17: Voz B (diferente tono)
  - Segundo 17+: Vuelve a Voz A
- **Causa raíz**: VEO3 genera cada segmento independientemente, sin garantía de consistencia de voz
- **Impacto**: ❌ CRÍTICO - Rompe inmersión del espectador
- **Solución propuesta**:
  - Agregar parámetro `voice_consistency_seed` en VEO3 API (si disponible)
  - Incluir en prompt: "maintain same voice tone and pitch throughout"
  - Investigar si VEO3 Fast vs VEO3 Standard tiene mejor consistencia
- **Archivo afectado**: `backend/services/veo3/veo3Client.js`
- **Estado**: ⏳ Pendiente - REQUIERE INVESTIGACIÓN API

---

### 📝 **3. TEXTO - Pronunciación y Formato**

#### **Problema 3.1**: No pronuncia bien "su Ratio"
- **Síntoma**: Ana tartamudea o mispronuncia "ratio calidad-precio"
- **Causa raíz**: Palabra técnica no natural en español conversacional
- **Impacto**: ⚠️ MEDIO - Distrae pero no rompe contenido
- **Solución propuesta**:
  - Reemplazar "ratio" por sinónimo más natural
  - Opciones:
    - ✅ "relación calidad-precio"
    - ✅ "valor por precio"
    - ✅ "rendimiento por coste"
- **Archivo afectado**: `backend/services/veo3/unifiedScriptGenerator.js` (línea 142)
- **Estado**: ⏳ Pendiente

#### **Problema 3.2**: Dice "4.5M" en lugar de "4.5 millones"
- **Síntoma**: Ana lee abreviatura "M" de forma antinatural
- **Causa raíz**: Template usa formato abreviado `{{price}}M`
- **Impacto**: ⚠️ MEDIO - Suena robótico
- **Solución propuesta**:
  - Cambiar template de `"{{price}}M"` a `"{{price}} millones"`
  - Asegurar que `playerData.price` sea número (ej: 4.5)
- **Archivo afectado**: `backend/services/veo3/unifiedScriptGenerator.js` (líneas 136, 146)
- **Estado**: ⏳ Pendiente

---

### 🎬 **4. VIDEO - Inicio y Final**

#### **Problema 4.1**: Video termina abruptamente (segundo 32)
- **Síntoma**: Parece que va a iniciar transición pero se corta
- **Causa raíz**: No hay frame de cierre/outro después del CTA
- **Impacto**: ❌ CRÍTICO - Ending poco profesional
- **Solución propuesta**:
  - Agregar 1-2s de outro con logo FLP blanco
  - Usar imagen existente: (BUSCAR PATH del logo FLP usado anteriormente)
  - Implementar fade out suave
- **Archivo afectado**: `backend/services/veo3/videoConcatenator.js`
- **Estado**: ⏳ Pendiente - REQUIERE ASSET LOGO

---

## 🔧 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Fixes Críticos de Audio** (30 minutos)
1. ✅ Agregar silence padding inicial (0.5s)
2. ✅ Agregar silence padding entre segmentos (0.3s)
3. ✅ Implementar audio crossfade (0.2s)

### **Fase 2: Fixes de Texto** (15 minutos)
4. ✅ Reemplazar "ratio" por "relación calidad-precio"
5. ✅ Cambiar formato "4.5M" → "4.5 millones"

### **Fase 3: Outro con Logo** (20 minutos)
6. ✅ Localizar asset logo FLP blanco
7. ✅ Implementar outro de 1.5s con fade out

### **Fase 4: Investigación Voz** (REQUIERE TESTING)
8. ⚠️ Investigar parámetros VEO3 para consistencia de voz
9. ⚠️ Probar VEO3 Standard vs Fast para comparar consistencia
10. ⚠️ Ajustar prompts con instrucciones de tono

### **Fase 5: Testing E2E** (10 minutos)
11. ✅ Regenerar video Pere Milla con todos los fixes
12. ✅ Validar checklist completo
13. ✅ Aprobar para producción

---

## ✅ CHECKLIST DE VALIDACIÓN (Post-Fixes)

Al regenerar video, validar:

- [ ] **Audio timing**: No se traba al inicio (segundo 0)
- [ ] **Audio transiciones**: No hay cortes en segundos 8, 16, 24
- [ ] **Voz consistente**: Mismo tono en todo el video (0-32s)
- [ ] **Pronunciación**: "relación calidad-precio" suena natural
- [ ] **Números**: "4.5 millones" en lugar de "4.5M"
- [ ] **Ending**: Video termina con logo FLP + fade out (no corte abrupto)
- [ ] **Duración total**: 33-34s (32s contenido + 1.5s outro)

---

## 📊 MÉTRICAS DE CALIDAD OBJETIVO

| Métrica | Antes | Objetivo | Estado |
|---------|-------|----------|--------|
| Audio timing (inicio) | ❌ 0s (inmediato) | ✅ 0.5s padding | ⏳ Pendiente |
| Audio transiciones | ❌ Cortes bruscos | ✅ Crossfade 0.2s | ⏳ Pendiente |
| Consistencia voz | ❌ 60% (cambia 2x) | ✅ 95%+ | ⏳ Requiere investigación |
| Pronunciación natural | ⚠️ 80% ("ratio" falla) | ✅ 95%+ | ⏳ Pendiente |
| Ending profesional | ❌ Corte abrupto | ✅ Logo + fade out | ⏳ Pendiente |
| **Score global** | **❌ 65/100** | **✅ 90/100** | **⏳ En progreso** |

---

## 🚨 REGLA DE ORO

**"NO ESTROPEAR NADA QUE YA FUNCIONA"**

### ✅ Funcionalidades que DEBEN mantenerse intactas:

1. ✅ Generación de 4 segmentos (intro + analysis + middle + outro)
2. ✅ UnifiedScriptGenerator con arco narrativo cohesivo
3. ✅ Ana imagen fija (mismo índice en los 4 segmentos)
4. ✅ Optimización diccionario (solo apellido)
5. ✅ Concatenación FFmpeg de segmentos
6. ✅ Guardado en dashboard Instagram
7. ✅ Validación de cohesión narrativa (score 100/100)

### ⚠️ Archivos core que NO deben romperse:

- `backend/services/veo3/unifiedScriptGenerator.js` - SOLO editar templates de texto
- `backend/services/veo3/threeSegmentGenerator.js` - SOLO agregar silence padding
- `backend/services/veo3/veo3Client.js` - SOLO agregar parámetros de voz
- `backend/services/veo3/videoConcatenator.js` - SOLO agregar crossfade + outro

---

## 📝 NOTAS DE IMPLEMENTACIÓN

- **Testing iterativo**: Probar cada fix individualmente antes de combinar
- **Rollback plan**: Git commit después de cada fix exitoso
- **Logs detallados**: Agregar logging para cada optimización aplicada
- **Documentación**: Actualizar este checklist con resultados reales post-testing

---

**Última actualización**: 3 Octubre 2025, 11:35 AM
**Próximo paso**: Comenzar Fase 1 (Fixes Críticos de Audio)
