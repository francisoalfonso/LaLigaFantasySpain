# 📋 Guía de Validación de Funcionalidades

**Fecha creación**: 1 Octubre 2025 **Propósito**: Proceso estandarizado para
validar nuevas funcionalidades antes de automatización

---

## 🎯 Objetivo

Antes de automatizar cualquier funcionalidad de contenido para Instagram,
**SIEMPRE** seguir este proceso de validación para asegurar calidad viral y
optimización.

---

## ✅ Checklist de Implementación (OBLIGATORIO)

### **1. Crear Vista de Preview**

Cada tipo de contenido nuevo debe tener su propia pestaña en `/viral-preview`:

```html
<!-- Agregar en frontend/instagram-viral-preview.html -->
<div
    x-show="activeTab === 'nombre-tipo'"
    class="grid grid-cols-1 lg:grid-cols-2 gap-8"
>
    <!-- Mockup Instagram izquierda -->
    <!-- Controles derecha -->
</div>
```

**Elementos obligatorios:**

- ✅ Mockup Instagram (9:16 para Reels, 1:1 para Posts, etc.)
- ✅ Preview del contenido generado
- ✅ Caption editable
- ✅ Metadata del contenido

---

### **2. Sistema de Score de Viralidad**

**CRÍTICO**: Cada tipo de contenido debe tener su propio cálculo de score (0-100
puntos).

#### **Criterios Base Instagram 2025:**

| Criterio                   | Puntos | Verificación                       |
| -------------------------- | ------ | ---------------------------------- |
| **Duración Video**         | 15pts  | Reels: ≤30s óptimo, ≤60s aceptable |
| **Hook (primeros 3s)**     | 20pts  | Conspirativo, ≤15 palabras         |
| **Caption Longitud**       | 10pts  | ≤125 caracteres óptimo             |
| **Cantidad Hashtags**      | 15pts  | 5-10 hashtags (2025 best practice) |
| **Formato**                | 10pts  | 9:16 vertical (Reels), 1:1 (Post)  |
| **Call-to-Action**         | 15pts  | CTA clara y urgente                |
| **Emojis**                 | 5pts   | 3-8 emojis (mejora engagement)     |
| **Estructura**             | 10pts  | Hook → Desarrollo → CTA            |
| **Consistencia Personaje** | 5pts   | Seed fijo, imagen referencia       |
| **Idioma**                 | 5pts   | Español España (NO mexicano)       |

**Total: 100 puntos**

#### **Niveles de Viralidad:**

- 🔥 **80-100pts**: ALTO POTENCIAL VIRAL (verde) → ✅ Listo para automatizar
- ⚡ **60-79pts**: BUEN POTENCIAL (amarillo) → ⚠️ Mejorar antes de automatizar
- ⚠️ **40-59pts**: NECESITA MEJORAS (naranja) → ❌ NO automatizar
- ❌ **0-39pts**: REQUIERE OPTIMIZACIÓN (rojo) → ❌ NO automatizar

---

### **3. Historial de Versiones**

**Obligatorio**: Guardar cada iteración de prompts y resultados.

```javascript
// Estructura de versión
{
    version: 1,
    timestamp: "2025-10-01T12:00:00Z",
    playerData: { /* datos input */ },
    segments: [ /* prompts VEO3 */ ],
    videoUrl: "/output/veo3/...",
    notes: "Hook muy largo, CTA funciona bien",
    viralScore: 85
}
```

**Permite:**

- Ver evolución de ajustes
- Comparar qué funciona mejor
- Volver a versiones anteriores
- Aprender qué optimizaciones funcionan

---

### **4. Validación Completa de Prompts VEO3**

**Mostrar TODO lo que se envía a VEO3:**

#### **A. Parámetros Técnicos Globales:**

```javascript
{
    model: 'veo3_fast',
    aspectRatio: '9:16',
    seed: 30001, // Ana consistencia
    voice: {
        locale: 'es-ES',
        gender: 'female',
        style: 'professional'
    },
    waterMark: 'Fantasy La Liga Pro',
    imageUrls: ['Ana referencia URL'],
    referenceImageWeight: 1.0,
    characterConsistency: true
}
```

#### **B. Por Cada Segmento:**

```javascript
{
    dialogue: "Texto que dice Ana...",
    behavior: "Descripción gestos, expresiones...",
    cinematography: "Cámara, iluminación, encuadre..."
}
```

**UI Obligatoria:**

- Parámetros globales siempre visibles
- Diálogos en grande
- Details expandible con behavior + cinematography

---

### **5. Integración con Dashboard Central**

**SIEMPRE agregar al menú principal** (`frontend/index.html`):

```html
<a
    href="/ruta-nueva-funcionalidad"
    class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
>
    <div
        class="flex items-center justify-center w-8 h-8 bg-pink-100 rounded-lg mr-3"
    >
        <i class="fas fa-icono text-pink-600"></i>
    </div>
    <div>
        <div class="font-medium">Nombre Funcionalidad</div>
        <div class="text-xs text-gray-500">Descripción breve</div>
    </div>
</a>
```

**Secciones del menú:**

- ⚽ Fantasy La Liga (chollos, alineaciones, jugadores)
- 🔧 Herramientas Desarrollo (debug, testing)
- 📱 Gestión Contenido Instagram (preview, matriz, staging)

---

## 🔄 Proceso de Validación Paso a Paso

### **Paso 1: Desarrollo Inicial**

1. Crear nueva pestaña en `/viral-preview`
2. Implementar generación de contenido
3. Mostrar preview en mockup Instagram

### **Paso 2: Implementar Score Viral**

1. Crear función `calculateViralScore_[tipo]()`
2. Definir 10 criterios específicos del tipo
3. Calcular puntuación 0-100
4. Mostrar checklist detallado

### **Paso 3: Sistema de Versiones**

1. Guardar cada preview generado
2. Permitir cargar versiones anteriores
3. Habilitar comparación entre versiones
4. Campo notas editable

### **Paso 4: Iteración y Mejora**

1. Generar múltiples versiones (mínimo 5)
2. Ajustar prompts según score
3. Anotar qué funciona/no funciona
4. Objetivo: conseguir score ≥80

### **Paso 5: Generación de Video REAL**

Una vez optimizados los prompts con versiones mock:

1. Click en **"🎬 Generar Video REAL con VEO3"**
2. Confirmar generación (coste: $0.90, tiempo: 4-6 min)
3. Esperar a que se complete el proceso E2E
4. Video REAL se guarda automáticamente como nueva versión
5. Revisar calidad del video generado
6. Comparar con versiones mock previas

**Importante**: Solo generar videos REALES cuando score ≥80 y prompts validados.

### **Paso 6: Validación Final**

- ✅ Score viral ≥80 puntos
- ✅ Mínimo 3 versiones probadas (mocks)
- ✅ Mínimo 1 video REAL generado y aprobado
- ✅ Notas documentadas en historial
- ✅ Prompts optimizados y validados
- ✅ Caption ≤125 caracteres
- ✅ 5-10 hashtags relevantes
- ✅ CTA clara presente

### **Paso 7: Solo si APROBADO → Automatizar**

```javascript
// Ejemplo: automatización solo después de validación
if (viralScore >= 80 && versionsTested >= 3) {
    // ✅ LISTO PARA AUTOMATIZAR
    enableAutomation(contentType);
} else {
    // ❌ SEGUIR ITERANDO
    continueValidation();
}
```

---

## 📊 Ejemplo: Chollos Virales (IMPLEMENTADO)

### **Resultado Final:**

- ✅ Score: **95/100** (ALTO POTENCIAL VIRAL)
- ✅ Versiones probadas: 5
- ✅ Hook optimizado: "Pssst... Misters..." (conspirativo)
- ✅ Caption: 267 caracteres → **reducir a ≤125**
- ✅ Hashtags: 8 (óptimo rango)
- ✅ Duración: 24s (≤30s óptimo)

### **Ajustes Realizados:**

1. **v1**: Hook muy largo (30 palabras) → Score 70
2. **v2**: Hook reducido (15 palabras) → Score 82
3. **v3**: Caption optimizado → Score 88
4. **v4**: CTA más urgente → Score 92
5. **v5**: Emojis ajustados → Score 95 ✅

### **Estado:**

🟢 **LISTO PARA AUTOMATIZAR**

---

## 🚫 Criterios de RECHAZO

**NO automatizar si:**

- ❌ Score viral <80 puntos
- ❌ Menos de 3 versiones probadas
- ❌ Caption >200 caracteres
- ❌ Sin CTA claro
- ❌ Formato incorrecto (no vertical para Reels)
- ❌ Hook débil (primeros 3s no engancha)
- ❌ Prompts VEO3 no documentados

---

## 📁 Estructura de Archivos

```
frontend/
└── instagram-viral-preview.html    # Vista principal de validación

backend/
├── routes/
│   └── instagram.js                # Endpoints preview/publish
└── services/veo3/
    ├── viralVideoBuilder.js        # Generación videos
    └── promptBuilder.js            # Construcción prompts

docs/
├── GUIA_VALIDACION_FUNCIONALIDADES.md  # Este documento
└── VEO3_FRAMEWORK_VIRAL_USO.md         # Framework viral
```

---

## 🎯 KPIs de Validación

**Antes de automatizar, validar:**

| KPI                | Meta    | Crítico     |
| ------------------ | ------- | ----------- |
| Score Viral        | ≥80/100 | ✅ SÍ       |
| Versiones Probadas | ≥3      | ✅ SÍ       |
| Tiempo Retención   | >50%    | ⚠️ Deseable |
| CTR Caption        | >5%     | ⚠️ Deseable |
| Engagement Rate    | >3%     | ⚠️ Deseable |

---

## 🔄 Mejora Continua

**Después de automatizar:**

1. Monitorear métricas reales Instagram
2. Ajustar prompts según performance
3. Actualizar score viral con datos reales
4. Iterar y mejorar continuamente

---

## 📚 Referencias

- [Instagram Reels Best Practices 2025](https://insights.vaizle.com/viral-and-trending-hashtags-for-instagram-reels-to-boost-engagement/)
- [Viral Hashtag Strategy](https://planable.io/blog/hashtags-instagram-reels/)
- Framework Viral: `docs/VEO3_FRAMEWORK_VIRAL_USO.md`

---

## ✅ Checklist Rápida Nueva Funcionalidad

```
□ Nueva pestaña en /viral-preview
□ Mockup Instagram correcto
□ Score viral implementado (10 criterios)
□ Sistema de versiones habilitado
□ Prompts VEO3 visibles completos
□ Agregado al dashboard central
□ Mínimo 3 versiones probadas (mocks)
□ Score ≥80 alcanzado
□ Botón "Generar Video REAL" implementado
□ Mínimo 1 video REAL generado y validado
□ Documentación en historial
□ ✅ LISTO PARA AUTOMATIZAR
```

---

**RECORDATORIO FINAL**: La validación manual es CRÍTICA. No saltarse pasos. Un
contenido mal optimizado automatizado = desperdiciar recursos y dañar
engagement.
