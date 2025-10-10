# RESTAURACIÓN TEST #47 - COMPLETADA

**Fecha**: 6 Octubre 2025, 14:30h
**Estado**: ✅ Listo para probar
**Objetivo**: Restaurar sistema validado del Test #47 + mejora imagen Supabase

---

## 🎯 CAMBIOS REALIZADOS

### 1. ✅ Nuevo Preset `chollo_quick` (2×7s = 14s)

**Archivo modificado**: `backend/services/veo3/threeSegmentGenerator.js`

**Líneas agregadas** (23-30):
```javascript
chollo_quick: {
    segments: 2,
    intro: 7,  // Hook + Revelación + Precio (7s)
    outro: 7,  // Datos + CTA (7s)
    total: 14
}
```

**Justificación**: Usuario requiere 2 segmentos × 7s = 14s total (vs Test #47 que usaba 3×8s = 24s).

---

### 2. ✅ Script de Test Restaurado

**Archivo creado**: `scripts/veo3/test-restaurado-2seg-14s.js`

**Configuración del test**:
```javascript
{
    contentType: 'chollo',
    playerData: {
        name: 'Lamine Yamal',
        team: 'Barcelona',
        price: 7.2,
        valueRatio: 1.45,
        stats: { /* ... */ }
    },
    preset: 'chollo_quick',  // ✅ NUEVO preset
    options: {
        useViralStructure: true,  // ✅ Usa UnifiedScriptGenerator
        anaImageIndex: 0  // ✅ Imagen fija (Supabase)
    }
}
```

**Endpoint usado**: `POST /api/veo3/generate-multi-segment` (✅ correcto, NO `/generate-viral`)

---

## 📊 ARQUITECTURA RESTAURADA

### Flujo Completo (Test #47 Restaurado)
```
Script test-restaurado-2seg-14s.js
  ↓
POST /api/veo3/generate-multi-segment (endpoint correcto)
  ↓
ThreeSegmentGenerator.generateThreeSegments()
  preset: 'chollo_quick' (2 segmentos)
  ↓
UnifiedScriptGenerator.generateUnifiedScript()
  ✅ Convierte números: 7.2 → "siete punto dos"
  ✅ Pluralización: "gol/goles"
  ✅ Narrativa coherente (score validación)
  ↓
VEO3Client.generateCompleteVideo() (2 veces)
  ✅ Imagen Ana desde Supabase (process.env.ANA_IMAGE_URL)
  ✅ Seed fijo: 30001
  ✅ Enhanced: false (sin transiciones cámara)
  ↓
VideoConcatenator.concatenateVideos()
  ✅ Sin crossfade (cortes secos)
  ✅ Logo outro automático
  ✅ Subtítulos virales automáticos
  ↓
Video final (14-16s)
```

---

## ✅ COMPONENTES VALIDADOS CONSERVADOS

### 1. UnifiedScriptGenerator (Git commit 63ab1af)
**Ubicación**: `backend/services/veo3/unifiedScriptGenerator.js`

**Funcionalidad crítica**:
- `_numberToSpanishText()` (líneas 345-382): Convierte 7.2 → "siete punto dos"
- Pluralización (líneas 210-214): 1 gol, 2 goles
- Scripts JSON-estructurados con validación de cohesión
- Narrativa coherente completa

**Estado**: ✅ NO modificado (ya validado)

### 2. ThreeSegmentGenerator
**Ubicación**: `backend/services/veo3/threeSegmentGenerator.js`

**Modificación**:
- ✅ Agregado preset `chollo_quick`
- ✅ Conservado todo lo demás

**Estado**: ✅ Funciona con UnifiedScriptGenerator

### 3. VideoConcatenator
**Ubicación**: `backend/services/veo3/videoConcatenator.js`

**Configuración actual** (sin cambios):
- Crossfade: desactivado ✅
- Logo outro: activado ✅
- Subtítulos virales: activados ✅
- Freeze frame: activado (0.8s) ✅

**Estado**: ✅ NO modificado (ya correcto)

### 4. VEO3Client
**Ubicación**: `backend/services/veo3/veo3Client.js`

**Configuración actual**:
- Imagen Ana: `process.env.ANA_IMAGE_URL` (Supabase) ✅
- Seed: 30001 ✅
- Pool: 1 imagen fija ✅

**Estado**: ✅ NO modificado (ya usa Supabase)

---

## 🔄 COMPARACIÓN: Test #47 vs Restaurado

| Aspecto | Test #47 (4 Oct) | Test Restaurado (6 Oct) | Estado |
|---------|------------------|-------------------------|--------|
| **Endpoint** | `/generate-multi-segment` | `/generate-multi-segment` | ✅ Igual |
| **Generador** | ThreeSegmentGenerator | ThreeSegmentGenerator | ✅ Igual |
| **Scripts** | UnifiedScriptGenerator | UnifiedScriptGenerator | ✅ Igual |
| **Conversión números** | ✅ "cinco punto cinco" | ✅ "siete punto dos" | ✅ Igual |
| **Preset** | `chollo_viral` (3×8s=24s) | `chollo_quick` (2×7s=14s) | ✅ Mejorado |
| **Imagen Ana** | GitHub (fija) | Supabase (fija) | ✅ Mejorado |
| **Logo outro** | ✅ Activado | ✅ Activado | ✅ Igual |
| **Subtítulos** | ✅ Activados | ✅ Activados | ✅ Igual |
| **Coherencia** | ✅ Score 85/100 | ✅ Score esperado >80 | ✅ Igual |

**Conclusión**: Sistema restaurado = Test #47 + mejoras (timing + imagen Supabase)

---

## 🎬 CÓMO EJECUTAR EL TEST

### Opción 1: Desde la raíz del proyecto
```bash
node scripts/veo3/test-restaurado-2seg-14s.js
```

### Opción 2: Hacer ejecutable (ya hecho)
```bash
./scripts/veo3/test-restaurado-2seg-14s.js
```

### Tiempo estimado
- **Generación**: 6-8 minutos (2 segmentos)
- **Video abre automáticamente** al finalizar

---

## 📋 CHECKLIST DE VALIDACIÓN

Después de ejecutar el test, verificar:

### Video Técnico
- [ ] Duración total: ~14-16s (sin logo) o ~16-18s (con logo)
- [ ] 2 segmentos visibles
- [ ] Ana aparece en AMBOS segmentos
- [ ] Ana visualmente consistente (misma ropa, peinado, iluminación)
- [ ] Logo "Fantasy La Liga Pro" al final
- [ ] Subtítulos virales visibles

### Script y Audio
- [ ] Números en texto: "siete punto dos millones" (NO "7.2")
- [ ] Números en texto: "uno coma cuatro cinco veces" (NO "1.45x")
- [ ] Pluralización correcta: "tres goles" (NO "3 goles")
- [ ] Script coherente (narrativa fluida entre segmentos)
- [ ] Acento español de España (NO mexicano) ⚠️ CRÍTICO
- [ ] Pronunciación correcta de nombres

### Calidad Viral
- [ ] Hook efectivo en primeros 3 segundos
- [ ] Revelación clara del jugador
- [ ] Datos concretos presentados
- [ ] CTA claro al final
- [ ] Transiciones suaves (sin saltos bruscos)

---

## 🔴 PROBLEMAS ESPERADOS (de Test #47)

Basado en feedback del Test #47, estos problemas **podrían persistir**:

### 1. Acento mexicano (CRÍTICO)
**Síntoma**: Ana habla con acento mexicano en vez de español de España
**Causa**: Prompts de VEO3 no fuerzan acento correctamente
**Seguimiento**: Verificar línea de PromptBuilder "SPANISH FROM SPAIN"

### 2. Transiciones entre segmentos (CRÍTICO)
**Síntoma**: Ana "salta" de una pose a otra (no frame-to-frame suave)
**Causa**: Frame extraction no funcionó en Test #47
**Seguimiento**: Verificar logs de frameExtractor

### 3. Final cortado (CRÍTICO)
**Síntoma**: Ana se queda con cara de "me cortaron" al final del último segmento
**Causa**: Timing del diálogo excede los 7s
**Solución esperada**: UnifiedScriptGenerator debería ajustar longitud texto

### 4. Transiciones visuales de VEO3 o FFmpeg (CRÍTICO)
**Síntoma**: Se ven crossfades o zoom-out entre segmentos
**Verificación**:
- VideoConcatenator tiene `transition.enabled: false` ✅
- PromptBuilder usa `enhanced: false` ✅
**Posible causa**: VEO3 agrega transiciones internamente

---

## 🎯 SIGUIENTE PASO

**EJECUTAR EL TEST**:
```bash
node scripts/veo3/test-restaurado-2seg-14s.js
```

**Reportar resultados**:
1. ✅ Video generado exitosamente
2. ✅ Checklist de validación completado
3. ⚠️ Problemas identificados (si existen)
4. 📊 Comparación con Test #47

---

## 📚 ARCHIVOS DE REFERENCIA

### Código Modificado
- `backend/services/veo3/threeSegmentGenerator.js` (preset agregado)
- `scripts/veo3/test-restaurado-2seg-14s.js` (nuevo script)

### Código Conservado (NO modificado)
- `backend/services/veo3/unifiedScriptGenerator.js` ✅ Validado
- `backend/services/veo3/veo3Client.js` ✅ Ya usa Supabase
- `backend/services/veo3/videoConcatenator.js` ✅ Ya correcto
- `backend/services/veo3/promptBuilder.js` ✅ Ya correcto
- `backend/routes/veo3.js` (endpoint `/generate-multi-segment`) ✅ Ya existe

### Documentación
- `STATUS/REGRESION_ANALISIS_TEST47.md` - Análisis completo regresión
- `docs/CONTEXTO_CRITICO_VEO3.md` - Contexto general VEO3
- `data/instagram-versions/dani-carvajal-v1759569346240.json` - Test #47 original

---

**Última actualización**: 6 Octubre 2025, 14:30h
**Autor**: Claude Code
**Estado**: ✅ Listo para ejecutar test
**Tiempo de restauración**: ~45 minutos
**Archivos modificados**: 2
**Archivos conservados (validados)**: 5
