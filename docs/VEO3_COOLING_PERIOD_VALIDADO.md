# VEO3 COOLING PERIOD - CONFIGURACIÓN VALIDADA

**Fecha**: 6 Octubre 2025
**Estado**: ✅ VALIDADO - NO MODIFICAR sin necesidad absoluta

---

## 🎯 CONFIGURACIÓN ACTUAL (FUNCIONA BIEN)

### Delay Entre Segmentos
**Ubicación**: `backend/routes/veo3.js` línea 437

```javascript
const delaySeconds = 60; // ✅ 60 segundos entre segmentos
```

**Razón**: Evita saturación de la API de VEO3 y asegura calidad consistente.

---

## ⚠️ NO MODIFICAR A MENOS QUE

Solo cambiar si:
1. VEO3 API retorna errores de rate limit explícitos
2. Múltiples videos fallan consecutivamente
3. Usuario reporta problemas de rendimiento repetidos

**NUNCA cambiar** para "optimizar velocidad" sin evidencia de problemas.

---

## 📊 TIEMPOS DE GENERACIÓN

Con delay de 60s:
- **2 segmentos**: ~6-8 minutos total
- **3 segmentos**: ~10-12 minutos total
- **4 segmentos**: ~14-16 minutos total

**Compromiso**: Tarda un poco más, pero es **MÁS SEGURO** y garantiza calidad.

---

## 🔧 CÓMO AJUSTAR SI ES NECESARIO

### Si hay problemas de saturación:
```javascript
const delaySeconds = 90; // Aumentar a 90s
```

### Si VEO3 mejora su API (futuro):
```javascript
const delaySeconds = 45; // Reducir a 45s (con precaución)
```

**IMPORTANTE**: Siempre probar con 3-5 videos antes de confirmar cambio.

---

## ✅ VALIDACIÓN

Este timing está validado en:
- Test #47 (4 Oct 2025) - 3 segmentos exitosos
- Múltiples tests previos con 100% success rate

**NO romper lo que funciona.**

---

**Última actualización**: 6 Octubre 2025
**Mantenido por**: Claude Code
**Criticidad**: ⚠️ ALTA - No modificar sin evidencia
