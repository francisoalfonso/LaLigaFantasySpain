# ⚠️ SCRIPTS EXPERIMENTALES - NO USAR EN PRODUCCIÓN

Esta carpeta contiene scripts de prueba técnica que **NO representan el sistema
validado**.

## ❌ No Usar Estos Scripts

Todos los scripts en esta carpeta:

- Usan datos **hardcodeados** (diálogos, URLs, etc.)
- **NO usan** el sistema completo (`UnifiedScriptGenerator`, `PromptBuilder`,
  diccionario)
- Son **pruebas técnicas** aisladas, no flujos E2E
- **NO están integrados** con el endpoint oficial

## ✅ Sistema Validado (Usar Esto)

Para generar videos con VEO3 + Nano Banana, usa:

```bash
# Endpoint oficial validado
POST /api/veo3/generate-with-nano-banana

# O el endpoint actual sin Nano Banana
POST /api/veo3/generate-multi-segment
```

**Documentación**: Ver `STATUS/ANALISIS_TEST_49_NANO_BANANA.md`

## 📋 Scripts en Esta Carpeta

| Script                              | Propósito                             | Problema                               |
| ----------------------------------- | ------------------------------------- | -------------------------------------- |
| `test-veo3-with-existing-images.js` | Test #49 - VEO3 con imágenes Supabase | Diálogos hardcodeados, prompts simples |
| `test-nano-to-veo3-complete.js`     | Flujo Nano→VEO3 completo              | NO usa UnifiedScriptGenerator          |
| `test-e2e-nano-to-veo3.js`          | Test E2E                              | Datos hardcodeados                     |
| `test-integration-with-supabase.js` | Test Supabase                         | Solo prueba de integración             |
| `test-nano-banana-only.js`          | Test generación imágenes              | Solo Nano Banana aislado               |
| `test-veo3-text-to-video-audio.js`  | Test audio VEO3                       | Investigación técnica                  |
| `publish-to-test-history.js`        | Publicar Test #49                     | Script one-off                         |
| Otros `test-*.js`                   | Pruebas diversas                      | Experimentales                         |

## 🎯 ¿Por Qué Están Aquí?

Estos scripts fueron útiles para:

1. ✅ Validar que Nano Banana funciona
2. ✅ Validar que VEO3 acepta imágenes de referencia
3. ✅ Investigar problemas de audio
4. ✅ Probar integración con Supabase

Pero **NO implementan el flujo aprobado**:

```
UnifiedScriptGenerator → Nano Banana (contexto) → VEO3 → Concatenación
```

## 📝 Historial

- **Test #49** (Pere Milla): Usado `test-veo3-with-existing-images.js`
    - Resultado: Videos generados pero con bugs (audio faltante, inglés)
    - Conclusión: Flujo incompleto, falta contexto del guión

## 🚀 Próximo Paso

Implementar el flujo completo siguiendo
`STATUS/ANALISIS_TEST_49_NANO_BANANA.md` - Recomendación #0.

---

**Última actualización**: 2025-10-10 **Mantenido por**: Claude Code
