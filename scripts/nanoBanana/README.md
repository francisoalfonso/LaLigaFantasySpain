# Nano Banana Scripts

Esta carpeta contiene scripts relacionados con la integración de Nano Banana
(Google Gemini 2.5 Flash) para generación de imágenes.

## 🚨 IMPORTANTE

**NO uses los scripts en `_EXPERIMENTAL/`** para producción. Ver
`_EXPERIMENTAL/README.md` para más detalles.

## ✅ Sistema Validado

Para generar videos con el sistema completo validado, usa los endpoints de la
API:

### Opción 1: Sistema Actual (Sin Nano Banana)

```bash
POST /api/veo3/generate-multi-segment

# Flujo:
# UnifiedScriptGenerator → VEO3 (con imágenes pool) → Concatenación
```

### Opción 2: Sistema con Nano Banana (Pendiente Implementar)

```bash
POST /api/veo3/generate-with-nano-banana

# Flujo:
# UnifiedScriptGenerator → Nano Banana (imágenes contextualizadas) → VEO3 → Concatenación
```

**Estado**: Opción 2 requiere implementación completa (ver
`STATUS/ANALISIS_TEST_49_NANO_BANANA.md` - Recomendación #0)

## 📖 Documentación

- **Análisis Test #49**: `/STATUS/ANALISIS_TEST_49_NANO_BANANA.md`
- **Sistema VEO3**: `/docs/VEO3_GUIA_COMPLETA.md`
- **Supabase Storage**: `/docs/SUPABASE_STORAGE_ANA_IMAGES.md`

## 🎯 Flujo Correcto (Aprobado)

```
1. UnifiedScriptGenerator
   ↓
   Genera guión profesional cohesivo (3 segmentos)
   Cada segmento: diálogo, emoción, contexto visual
   ↓
2. Nano Banana
   ↓
   Genera 3 imágenes BASADAS EN el guión
   Prompts contextualizados con emoción + shot type
   ↓
3. Subir a Supabase Storage
   ↓
   URLs persistentes para VEO3
   ↓
4. VEO3
   ↓
   Usa cada imagen como referencia inicial
   Genera 3 segmentos de video (5s cada uno)
   ↓
5. Concatenación
   ↓
   Unir 3 segmentos + logo outro
   Video final listo para Instagram
```

## ⚠️ Problemas Conocidos

1. **Nano Banana NO recibe guión profesional** - Requiere implementación
2. **VEO3 no puede acceder a Supabase Storage** - Requiere signed URLs o GitHub
   Raw
3. **enableTranslation: true** causa audio en inglés - Requiere fix

Ver detalles en `STATUS/ANALISIS_TEST_49_NANO_BANANA.md`

## 🔧 Servicios Backend

- `backend/services/veo3/nanoBananaVeo3Integrator.js` - Integrador principal
- `backend/services/nanoBanana/nanoBananaClient.js` - Cliente API KIE.ai
- `backend/services/veo3/supabaseFrameUploader.js` - Upload a Supabase Storage

---

**Última actualización**: 2025-10-10
