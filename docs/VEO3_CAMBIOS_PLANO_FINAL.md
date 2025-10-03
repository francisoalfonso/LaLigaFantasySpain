# VEO3 - Problema Cambio de Plano Final (3 Oct 2025)

## 🚨 PROBLEMA DETECTADO

**Síntoma:** Al final del video (cuando termina el audio del guion), aparece **otra imagen de Ana en un plano diferente** que genera un efecto visual extraño/abrupto.

## 🔍 CAUSA RAÍZ

El problema está causado por usar **prompts con estructura viral compleja** que describe múltiples "escenas" o cambios de energía emocional.

### ❌ Prompt Problemático

Cuando usamos `buildCholloPrompt()`, se genera esto:

```javascript
"¡Misters! Venid que os cuento un secreto... He encontrado un jugador del Celta a solo 8 euros... ¿Demasiado barato para ser bueno? ¡Aspas! 0 goles, 0 asistencias en 0 partidos. Ratio de valor: 1.4x. ¡Está RINDIENDO como uno de 15 millones! A este precio, es IMPRESCINDIBLE para tu plantilla. ¿Fichamos ya o esperamos? ¡Yo lo tengo CLARO!"
```

**Problema:** Esta estructura tiene 7 elementos narrativos (hook → contexto → conflicto → inflexión → resolución → moraleja → cta), cada uno con diferentes energías emocionales:

- conspiratorial_whisper
- building_tension
- implicit_tension
- explosive_revelation
- explosive_excitement
- authoritative_confidence
- urgent_cta

VEO3 interpreta estos cambios de energía como **transiciones de escena**, generando cambios de plano/postura.

## ✅ SOLUCIÓN

Usar **prompts mínimos simples** con `buildPrompt()` en lugar de `buildCholloPrompt()`.

### ✅ Prompt Correcto

```javascript
promptBuilder.buildPrompt({
    dialogue: "Aspas del Celta está a solo 8 millones. La relación calidad-precio es brutal."
})
```

**Resultado:**
```
The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "Aspas del Celta está a solo 8 millones. La relación calidad-precio es brutal.". Exact appearance from reference image.
```

**Beneficio:** VEO3 mantiene **un solo plano/escena constante** durante todo el video de 8 segundos, sin cambios abruptos al final.

## 📝 COMPARATIVA

| Aspecto | buildCholloPrompt() | buildPrompt() |
|---------|-------------------|--------------|
| **Longitud** | ~470 caracteres | ~180 caracteres |
| **Estructura** | 7 elementos virales | Simple y directa |
| **Energías** | Múltiples cambios | Constante |
| **Planos VEO3** | Múltiples escenas | Un solo plano |
| **Efecto final** | ❌ Cambio abrupto | ✅ Consistente |

## 🔧 IMPLEMENTACIÓN CORRECTA

### Script Actualizado

```javascript
// ❌ INCORRECTO - Genera múltiples escenas
const segments = [
    {
        prompt: promptBuilder.buildCholloPrompt(playerName, price, {
            team: 'Celta',
            ratio: 1.4,
            dialogue: 'Custom dialogue...'
        })
    }
];

// ✅ CORRECTO - Un solo plano constante
const segments = [
    {
        prompt: promptBuilder.buildPrompt({
            dialogue: 'Aspas del Celta está a solo 8 millones. La relación calidad-precio es brutal.'
        })
    }
];
```

### Archivo Actualizado

`scripts/veo3/generate-aspas-clean.js` ya implementa la solución correcta usando `buildPrompt()` directo.

## ⚠️ TRADE-OFF

**Ventaja estructura viral (buildCholloPrompt):**
- ✅ Mayor engagement potencial
- ✅ Framework de 7 elementos optimizado para viralidad

**Desventaja estructura viral:**
- ❌ Cambios de plano/escena en VEO3
- ❌ Efecto visual abrupto al final
- ❌ Menor consistencia visual

**Conclusión:** Para videos VEO3, **priorizar consistencia visual** sobre estructura viral compleja. La viralidad se puede lograr mediante:
1. Edición externa con efectos
2. Música de fondo
3. Subtítulos dinámicos
4. Thumbnails impactantes

## 🎯 NORMA ACTUALIZADA

**NORMA #6: Prompts Mínimos para Evitar Cambios de Plano**

- ✅ Usar `buildPrompt()` con diálogo simple
- ❌ NO usar `buildCholloPrompt()` para videos individuales
- ✅ Mantener diálogo en 1-2 frases cortas
- ❌ NO incluir múltiples preguntas retóricas
- ✅ Energía emocional constante

---

Fecha: 3 Octubre 2025 23:55h
Estado: ✅ Problema identificado y solucionado
Script actualizado: `generate-aspas-clean.js`
