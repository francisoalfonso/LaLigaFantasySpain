# 📋 Tareas Pendientes - Próxima Sesión

## 🎯 TAREA PRIORITARIA #1: Integración Sistema Viral con Instagram

### Objetivo

Vincular el sistema de videos virales VEO3 con el prototipo de publicación de
Instagram para visualizar el flujo completo de generación y publicación.

### Contexto

- ✅ Sistema videos virales completado y validado
- ✅ Video Dani Carvajal 24s generado exitosamente
- ✅ Estructura Hook → Desarrollo → CTA funcionando
- ⏳ Falta integrar con sistema publicación Instagram

### Componentes a Conectar

1. **Sistema Videos Virales** (`backend/services/veo3/viralVideoBuilder.js`)
    - Generación 3 segmentos
    - Concatenación automática
    - Caption Instagram generado

2. **Sistema Instagram** (`backend/routes/instagram.js` +
   `backend/services/imageGenerator.js`)
    - API Instagram existente
    - Publicación automática posts
    - Gestión de contenido

3. **Frontend Preview** (a crear/actualizar)
    - Visualización video viral generado
    - Preview caption Instagram
    - Botón publicar directo a Instagram
    - Timeline completo del proceso

### Plan de Implementación

#### Paso 1: Crear Endpoint de Preview Completo

```javascript
// backend/routes/instagram.js
POST /api/instagram/preview-viral
- Input: playerData (jugador para generar video)
- Output:
  - Video viral URL
  - Caption optimizado
  - Hashtags sugeridos
  - Metadata completa
  - Estado de generación
```

#### Paso 2: Frontend Visualización

```
frontend/instagram-viral-preview.html
- Player de video viral
- Texto caption editable
- Previsualización formato Instagram
- Botones: Regenerar / Editar / Publicar
```

#### Paso 3: Integración Completa

```javascript
// Flujo completo:
1. Usuario selecciona jugador chollo
2. Sistema genera video viral (3 segmentos)
3. Preview muestra video + caption
4. Usuario ajusta si necesario
5. Publicación directa a Instagram
```

### Archivos a Crear/Modificar

**Nuevos:**

- `frontend/instagram-viral-preview.html` - Preview completo
- `backend/routes/instagramViral.js` - Endpoints específicos viral

**Modificar:**

- `backend/routes/instagram.js` - Agregar endpoints preview viral
- `backend/services/veo3/viralVideoBuilder.js` - Método getPreviewData()
- `frontend/content-preview.html` - Link a nuevo preview viral

### Resultado Esperado

Un sistema completo donde:

1. Seleccionas un jugador chollo
2. Ves el video viral generándose en tiempo real
3. Previsualizas cómo se verá en Instagram
4. Publicas con un click directamente

### Ejemplo de Uso

```bash
# Frontend: Seleccionar Dani Carvajal
# Sistema genera automáticamente:
# - Video Hook (8s): "Pssst... Misters..."
# - Video Desarrollo (8s): "Dani Carvajal. Ratio 3.37x..."
# - Video CTA (8s): "¿Fichamos o esperamos?..."
# - Video Final Concatenado (24s)
# - Caption Instagram con hashtags
# - Preview formato 9:16 vertical

# Preview muestra todo listo para publicar
# Click en "Publicar" → Instagram API → Post live
```

### Tiempo Estimado

- Frontend preview: 1-2 horas
- Backend integración: 1 hora
- Testing completo: 30 minutos
- **Total: 2.5-3.5 horas**

---

## 📝 Tareas Secundarias (Si hay tiempo)

### 2. Optimizar Concatenación Videos

- Mejorar transiciones crossfade
- Normalización audio más precisa
- Reducir warnings FFmpeg

### 3. Sistema de Templates Virales

- Crear más estructuras virales (no solo Hook → Dev → CTA)
- Templates para diferentes tipos de contenido:
    - Análisis táctico
    - Comparativas jugadores
    - Predicciones jornada

### 4. Dashboard Gestión Videos

- Panel para ver todos los videos generados
- Estadísticas: vistas, engagement, costos
- Organización por fecha/jugador/tipo

### 5. Automatización Completa

- Workflow n8n que:
    1. Detecta chollos automáticamente
    2. Genera video viral
    3. Publica en Instagram en horario óptimo
    4. Reporta métricas

---

## 🎯 Prioridades

1. **CRÍTICO**: Integración Instagram (TAREA #1)
2. **ALTA**: Optimizar concatenación
3. **MEDIA**: Templates adicionales
4. **BAJA**: Dashboard gestión
5. **FUTURA**: Automatización completa

---

## 📊 Estado Actual

### ✅ Completado

- Sistema generación videos VEO3
- ViralVideoBuilder (3 segmentos)
- Concatenación FFmpeg
- Script Carvajal validado
- Video 24s funcional
- Caption Instagram generator
- Fix waitForCompletion
- Commit y push GitHub

### ⏳ En Progreso

- Ninguno

### 🔜 Pendiente

- Integración Instagram (PRÓXIMA TAREA)
- Todo lo demás de la lista

---

**Fecha creación**: 30 Septiembre 2025, 17:04h **Última actualización**: 30
Septiembre 2025, 17:04h **Próxima sesión**: Comenzar con TAREA #1 - Integración
Instagram
