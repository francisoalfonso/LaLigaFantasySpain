# Nano Banana - Configuración de Timeouts

## ⚠️ Problema Recurrente

Las 3 imágenes de Nano Banana **YA están generadas** y funcionan correctamente, pero los scripts fallaban por timeouts incorrectos.

## 📊 Tiempos Reales Medidos (Octubre 2025)

### Generación de 3 Imágenes de Carlos
```
Imagen 1: 113 segundos (1:53)
Imagen 2: 132 segundos (2:12)
Imagen 3: 134 segundos (2:14)
```

### Proceso Completo `prepare-session`
```
1. Generar 3 imágenes Nano Banana:  ~2.2 minutos (134s max)
2. Descargar cada imagen:           ~10 segundos
3. Subir a Supabase Storage:        ~20 segundos
4. Crear progress.json:             ~5 segundos

TOTAL: ~3.5 minutos (210 segundos)
```

## ✅ Configuración Correcta

### Scripts de Test
```javascript
// ❌ INCORRECTO (causaba timeouts):
{ timeout: 180000 } // 3 minutos - MUY JUSTO

// ✅ CORRECTO:
{ timeout: 300000 } // 5 minutos - Con margen de seguridad
```

### Endpoints Afectados
- `POST /api/veo3/prepare-session` - Genera imágenes + guión
- Archivos actualizados:
  - `scripts/veo3/test-outlier-to-video-only.js` ✅
  - `scripts/veo3/test-e2e-outlier-to-youtube.js` ✅

## 📝 Notas Importantes

1. **Las imágenes se generan correctamente** en ~2 minutos
2. El timeout debe ser **5 minutos** para incluir descarga/upload
3. No intentar optimizar generando menos imágenes - son necesarias las 3
4. Nano Banana es un servicio externo - los tiempos varían según carga

## 🔍 Cómo Verificar

Ver logs de Nano Banana en la interfaz de KIE.ai:
- Status: "success" en las 3 imágenes ✅
- Duration: ~110-135 segundos por imagen
- Seed: 30001 (Carlos) o 30002 (Ana)

## 📅 Última Actualización
- Fecha: 13 Octubre 2025
- Contexto: Flujo E2E Outlier → Video → YouTube
