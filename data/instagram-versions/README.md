# 📁 Sistema de Versiones Instagram

**Propósito**: Documentar todas las pruebas y versiones de videos generados para Instagram.

---

## 📂 Estructura de Carpetas

### `_archive_pre-fixes/`
**Videos generados ANTES del 4 Oct 2025** (antes de fixes críticos)

**Características**:
- ❌ Imagen Ana aleatoria (rotación entre 14 imágenes)
- ❌ Transiciones de cámara (zooms, dollys)
- ❌ Iluminación dinámica

**Uso**: Comparación baseline para medir mejoras

---

### `_active_testing/`
**Videos EN PRUEBAS** (post-fixes, validación en curso)

**Características**:
- ✅ Imagen Ana fija (ana-estudio-pelo-suelto.jpg)
- ✅ Cámara estática (sin transiciones)
- ✅ Enhanced: false

**Proceso**:
1. Video generado → guarda aquí
2. Validación con checklist completo
3. Si aprobado → mover a `_approved/`
4. Si falla → documentar issues y regenerar

---

### `_approved/`
**Videos VALIDADOS** listos para publicación

**Criterios de aprobación**:
- ✅ Checklist 9/9 items completados
- ✅ Quality score ≥ 8.5/10
- ✅ Sin issues detectados
- ✅ Framework viral cumplido

**Siguiente paso**: Publicación en Instagram

---

### Raíz (archivos sueltos)
**Videos legacy** sin clasificar

**Acción**: Revisar y mover a carpeta correspondiente

---

## 📋 Schema de Versiones

Ver `VERSION_SCHEMA.json` para estructura completa.

**Campos clave**:
- `testMetadata.fixesApplied[]` - Qué fixes se aplicaron
- `testMetadata.checklist{}` - Validación 9 puntos
- `testMetadata.qualityScore{}` - Scores detallados
- `veo3Config{}` - Config técnica VEO3

---

## 🔄 Workflow de Pruebas

```
1. GENERAR VIDEO
   ↓
2. Guardar en _active_testing/
   ↓
3. COMPLETAR CHECKLIST
   - [ ] Imagen Ana fija (3 segmentos)
   - [ ] Sin transiciones cámara
   - [ ] Audio sin cortes
   - [ ] Voz consistente
   - [ ] Pronunciación correcta
   - [ ] Logo outro 1.5s
   - [ ] Duración 32-34s
   - [ ] Hook segundo 3
   - [ ] CTA claro final
   ↓
4. SCORING
   - Video quality /10
   - Audio quality /10
   - Viral potential /10
   - Technical /10
   - Overall /10
   ↓
5. DECISIÓN
   - Si overall ≥ 8.5 → _approved/
   - Si < 8.5 → documentar issues + regenerar
```

---

## 📊 Comparación de Versiones

**Ejemplo**:

```bash
# Video PRE-FIXES (baseline)
pere-milla-v1759490675402.json
├─ Imagen Ana: aleatoria
├─ Transiciones: SÍ (zooms, dollys)
└─ Score: 6.5/10

vs

# Video POST-FIXES (nuevo)
dani-carvajal-v1759527XXX.json
├─ Imagen Ana: fija
├─ Transiciones: NO (estática)
└─ Score: 9.1/10

Mejora: +40% quality score
```

---

## 🎯 Métricas de Éxito

**Target**:
- Quality score promedio ≥ 8.5/10
- 0 issues críticos en videos aprobados
- 100% checklist en videos publicados

**Actual** (actualizar tras cada prueba):
- Videos generados: 0
- Videos aprobados: 0
- Score promedio: N/A

---

**Última actualización**: 4 Oct 2025, 09:45h
