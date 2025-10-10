# 🎬 VEO3 - Estrategia de Variedad Visual con Consistencia de Personaje

**Fecha creación**: 1 Octubre 2025 **Objetivo**: Sistema de generación de videos
con variedad visual (ambientes, ropas, ángulos) manteniendo consistencia de
personaje

---

## 🎯 Problema a Resolver

**Desafío**: Generar contenido visual variado (diferentes ambientes, outfits,
ángulos de cámara) manteniendo la misma identidad de personaje (Ana, Carlos,
Lucía, Pablo).

**Solución**: Sistema multi-imagen de referencia + Character Bible detallada +
Prompts cinematográficos específicos

---

## 📚 Character Bible - Fundamentos

### **¿Qué es un Character Bible?**

Documento **exhaustivo y detallado** que define TODOS los aspectos del
personaje:

- ✅ Rasgos físicos inmutables (cara, ojos, estructura facial)
- ✅ Variaciones permitidas (ropa, peinado, accesorios)
- ✅ Personalidad y energía (afecta gestos y expresiones)
- ✅ Contextos de aparición (estudio, estadio, exteriores)

**Regla de oro**: Cuanto más detallado el Character Bible, mayor consistencia
visual.

---

## 🗂️ Sistema de Imágenes de Referencia

### **Arquitectura Propuesta**

```
GitHub Repository: laligafantasyspainpro-ux/imagenes-presentadores
│
├── ana-main/                    # Ana Martínez (Analista Táctica)
│   ├── base/
│   │   ├── Ana-001.jpeg        # Imagen principal (actual)
│   │   ├── Ana-002.jpeg        # Ángulo lateral derecho
│   │   └── Ana-003.jpeg        # Ángulo lateral izquierdo
│   ├── outfits/
│   │   ├── estudio-blazer-azul.jpeg      # Outfit actual
│   │   ├── estadio-polo-blanco.jpeg      # Casual reportaje
│   │   ├── exteriores-chaqueta-rosa.jpeg # Casual urbano
│   │   └── gala-vestido-elegante.jpeg    # Eventos especiales
│   ├── environments/
│   │   ├── estudio-profesional.jpeg      # Ana en set estudio
│   │   ├── estadio-campo.jpeg            # Ana en césped estadio
│   │   ├── grada-estadio.jpeg            # Ana en tribuna
│   │   └── oficina-analisis.jpeg         # Ana con pantallas stats
│   └── expressions/
│       ├── seria-confianza.jpeg          # Análisis profesional
│       ├── entusiasta-sonrisa.jpeg       # Celebración gol
│       └── conspirativa-secreto.jpeg     # Chollos (hook actual)
│
├── carlos-stats/                # Carlos González (Estadísticas)
│   └── [misma estructura]
│
├── lucia-femenina/              # Lucía Rodríguez (Fútbol Femenino)
│   └── [misma estructura]
│
└── pablo-genz/                  # Pablo Martín (Gen Z)
    └── [misma estructura]
```

### **URLs de Acceso**

```javascript
const ANA_REFERENCES = {
    base: {
        main: 'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/base/Ana-001.jpeg',
        sideRight:
            'https://raw.githubusercontent.com/.../ana-main/base/Ana-002.jpeg',
        sideLeft:
            'https://raw.githubusercontent.com/.../ana-main/base/Ana-003.jpeg'
    },
    outfits: {
        studioBlazer:
            'https://raw.githubusercontent.com/.../ana-main/outfits/estudio-blazer-azul.jpeg',
        stadiumPolo:
            'https://raw.githubusercontent.com/.../ana-main/outfits/estadio-polo-blanco.jpeg',
        casualJacket:
            'https://raw.githubusercontent.com/.../ana-main/outfits/exteriores-chaqueta-rosa.jpeg',
        galaDress:
            'https://raw.githubusercontent.com/.../ana-main/outfits/gala-vestido-elegante.jpeg'
    },
    environments: {
        studio: 'https://raw.githubusercontent.com/.../ana-main/environments/estudio-profesional.jpeg',
        stadiumField:
            'https://raw.githubusercontent.com/.../ana-main/environments/estadio-campo.jpeg',
        stadiumStands:
            'https://raw.githubusercontent.com/.../ana-main/environments/grada-estadio.jpeg',
        officeAnalysis:
            'https://raw.githubusercontent.com/.../ana-main/environments/oficina-analisis.jpeg'
    },
    expressions: {
        serious:
            'https://raw.githubusercontent.com/.../ana-main/expressions/seria-confianza.jpeg',
        enthusiastic:
            'https://raw.githubusercontent.com/.../ana-main/expressions/entusiasta-sonrisa.jpeg',
        conspiratorial:
            'https://raw.githubusercontent.com/.../ana-main/expressions/conspirativa-secreto.jpeg'
    }
};
```

---

## 🎨 Character Bible Completa - Ana Martínez

### **Rasgos Inmutables (NUNCA CAMBIAR)**

```
IDENTIDAD FACIAL:
- Mujer española de 32 años
- Cabello corto negro rizado (corte profesional bob)
- Ojos marrones cálidos con expresión inteligente
- Estructura facial: pómulos definidos, mandíbula suave
- Tez morena mediterránea
- Altura media (1.68m), complexión atlética
- Cejas definidas, sonrisa amplia y cercana
```

### **Variaciones Permitidas por Contexto**

#### **OUTFIT 1: Estudio Profesional (Default)**

```
- Blazer azul marino (#0066cc) con logo La Liga en pecho izquierdo
- Camisa blanca debajo
- Peinado: coleta profesional alta
- Accesorios: pendientes pequeños plateados
- Ambiente: set de televisión deportivo moderno
- Iluminación: profesional, tres puntos, cálida
```

#### **OUTFIT 2: Reportaje Estadio**

```
- Polo blanco con cuello azul y logo La Liga
- Pantalones oscuros formales
- Peinado: coleta baja práctica
- Accesorios: micrófono de mano, auricular
- Ambiente: campo de fútbol, gradas de fondo
- Iluminación: natural exterior, golden hour preferido
```

#### **OUTFIT 3: Casual Urbano (Exterior)**

```
- Chaqueta rosa claro deportiva
- Camiseta básica blanca
- Peinado: pelo suelto natural
- Accesorios: gafas de sol en cabeza, bolso cruzado
- Ambiente: ciudad, calle urbana, cafetería
- Iluminación: natural difusa, sombras suaves
```

#### **OUTFIT 4: Eventos Gala**

```
- Vestido elegante negro/azul oscuro
- Peinado: recogido elaborado con rizos sueltos
- Accesorios: pendientes largos, clutch pequeño
- Ambiente: alfombra roja, evento deportivo
- Iluminación: dramática, flashes, focos
```

### **Personalidad y Energía (afecta gestos)**

```
ENERGÍA: Media-alta (7/10)
EXPRESIVIDAD: Natural y cercana
GESTICULACIÓN: Manos activas para enfatizar puntos
POSTURA: Confiada, hombros relajados hacia atrás
CONTACTO VISUAL: Directo a cámara (conexión con audiencia)
VELOCIDAD DE HABLA: Media, pausas para énfasis
```

---

## 📹 Estrategia de Cinematografía

### **Variaciones de Cámara por Segmento**

#### **SEGMENTO 1: Hook (8s) - Intimidad**

```javascript
{
    camera: "Medium close-up, dollying in slowly from comfortable distance to intimate close",
    angle: "Eye level, slight Dutch angle para tensión",
    movement: "Push-in suave (slow dolly in)",
    framing: "Empieza medium shot → termina close-up",
    lighting: "Warm intimate, low key, conspiratorial mood"
}
```

#### **SEGMENTO 2: Desarrollo (8s) - Autoridad**

```javascript
{
    camera: "Steady medium shot, occasional subtle push-in on key stats",
    angle: "Eye level recto, profesional",
    movement: "Estático con ligeros push-ins en datos clave",
    framing: "Medium shot constante, espacio para gráficos laterales",
    lighting: "Broadcast professional, three-point setup, energetic"
}
```

#### **SEGMENTO 3: CTA (8s) - Urgencia**

```javascript
{
    camera: "Medium close-up with final push-in on call to action",
    angle: "Slightly low angle (empoderamiento)",
    movement: "Push-in decisivo en CTA final",
    framing: "Medium close-up → tight close-up en final",
    lighting: "Full broadcast, vibrant, high energy"
}
```

### **Variaciones de Ambiente por Tipo de Contenido**

| Tipo Contenido        | Ambiente              | Outfit           | Cámara Principal        |
| --------------------- | --------------------- | ---------------- | ----------------------- |
| **Chollo Viral**      | Estudio profesional   | Blazer azul      | Medium → Close-up       |
| **Análisis Táctico**  | Oficina con pantallas | Blazer azul      | Medium shot estático    |
| **Reportaje Partido** | Estadio (campo/grada) | Polo blanco      | Wide → Medium           |
| **Breaking News**     | Estudio + chromakey   | Blazer azul      | Close-up directo        |
| **Entrevista Casual** | Exterior urbano       | Chaqueta rosa    | Over-shoulder + Medium  |
| **Gala/Premios**      | Alfombra roja         | Vestido elegante | Wide glamour + Close-up |

---

## 🔧 Implementación Técnica en VEO3

### **Estrategia Multi-Imagen**

VEO3 permite **múltiples imágenes de referencia simultáneas**:

```javascript
// OPCIÓN A: Imagen única específica al contexto
const singleImagePrompt = {
    prompt: 'The woman in the reference image...',
    imageUrls: [ANA_REFERENCES.outfits.stadiumPolo], // Una sola imagen
    seed: 30001, // Seed fijo Ana
    referenceImageWeight: 1.0
};

// OPCIÓN B: Múltiples imágenes para mayor consistencia (RECOMENDADO)
const multiImagePrompt = {
    prompt: 'The woman in the reference images...',
    imageUrls: [
        ANA_REFERENCES.base.main, // Cara principal
        ANA_REFERENCES.outfits.stadiumPolo, // Outfit específico
        ANA_REFERENCES.environments.stadiumField // Ambiente objetivo
    ],
    seed: 30001,
    referenceImageWeight: 0.9, // Ligeramente menor para permitir creatividad
    blendMode: 'weighted' // VEO3 combina las referencias
};
```

### **Modificación de veo3Client.js**

```javascript
class VEO3Client {
    constructor() {
        // ... existing code ...

        // Nuevo: Referencias por personaje
        this.characterReferences = {
            ana: ANA_REFERENCES,
            carlos: CARLOS_REFERENCES,
            lucia: LUCIA_REFERENCES,
            pablo: PABLO_REFERENCES
        };
    }

    /**
     * Generar video con referencias contextuales
     * @param {string} reporter - 'ana', 'carlos', 'lucia', 'pablo'
     * @param {string} context - 'studio', 'stadium', 'outdoor', 'gala'
     * @param {string} prompt - Prompt del video
     * @param {object} options - Opciones adicionales
     */
    async generateVideoWithContext(reporter, context, prompt, options = {}) {
        const refs = this.characterReferences[reporter];

        // Seleccionar imágenes según contexto
        const contextImages = this.selectContextImages(refs, context);

        // Generar con múltiples referencias
        return await this.generateVideo(prompt, {
            imageUrls: contextImages,
            ...options
        });
    }

    selectContextImages(refs, context) {
        const baseImages = [refs.base.main]; // Siempre incluir cara base

        switch (context) {
            case 'studio':
                return [
                    refs.base.main,
                    refs.outfits.studioBlazer,
                    refs.environments.studio
                ];
            case 'stadium':
                return [
                    refs.base.main,
                    refs.outfits.stadiumPolo,
                    refs.environments.stadiumField
                ];
            case 'outdoor':
                return [
                    refs.base.main,
                    refs.outfits.casualJacket
                    // No environment, dejar que VEO3 cree escena urbana
                ];
            case 'gala':
                return [
                    refs.base.main,
                    refs.outfits.galaDress
                    // No environment, VEO3 generará alfombra roja
                ];
            default:
                return [refs.base.main];
        }
    }
}
```

---

## 📊 Matriz de Contenido → Contexto Visual

### **Ana Martínez (Analista Táctica)**

| Tipo Contenido   | Ambiente         | Outfit      | Cámara           | Lighting            |
| ---------------- | ---------------- | ----------- | ---------------- | ------------------- |
| Chollo Viral     | Studio           | Blazer azul | Push-in intimate | Warm low-key        |
| Análisis Jornada | Studio + screens | Blazer azul | Static medium    | Broadcast bright    |
| Preview Partido  | Stadium field    | Polo blanco | Wide → Medium    | Natural golden hour |
| Breaking News    | Studio chromakey | Blazer azul | Tight close-up   | High-key urgent     |
| Post-Match       | Stadium stands   | Polo blanco | Over-shoulder    | Natural evening     |

### **Carlos González (Especialista Stats)**

| Tipo Contenido      | Ambiente       | Outfit           | Cámara              | Lighting       |
| ------------------- | -------------- | ---------------- | ------------------- | -------------- |
| Stats Semanal       | Studio tech    | Camisa azul tech | Medium + gráficos   | Cool tech blue |
| Comparativa Players | Studio screens | Polo deportivo   | Static medium       | Neutral bright |
| Datos en Vivo       | Stadium box    | Polo + chaleco   | Handheld energético | Natural bright |

### **Lucía Rodríguez (Fútbol Femenino)**

| Tipo Contenido | Ambiente        | Outfit             | Cámara            | Lighting         |
| -------------- | --------------- | ------------------ | ----------------- | ---------------- |
| Liga Femenina  | Stadium outdoor | Polo blanco        | Wide active       | Natural daylight |
| Cantera Reveal | Training ground | Chaqueta deportiva | Medium energético | Golden hour      |
| Entrevistas    | Outdoor casual  | Outfit casual      | Over-shoulder     | Soft natural     |

### **Pablo Martín (Gen Z Viral)**

| Tipo Contenido | Ambiente     | Outfit          | Cámara            | Lighting     |
| -------------- | ------------ | --------------- | ----------------- | ------------ |
| TikTok Viral   | Urban street | Streetwear      | Handheld dinámico | Natural hard |
| Fantasy Hacks  | Gaming setup | Hoodie casual   | Close-up rápido   | RGB colorful |
| Memes Fútbol   | Green screen | Camiseta equipo | Tight close-up    | Flat even    |

---

## 🎯 Workflow Producción con Variedad

### **Paso 1: Selección de Contexto**

```javascript
// Determinar contexto según tipo de contenido
function selectProductionContext(contentType) {
    const contextMap = {
        chollo_viral: {
            environment: 'studio',
            outfit: 'studioBlazer',
            mood: 'intimate'
        },
        analisis_tactica: {
            environment: 'studio',
            outfit: 'studioBlazer',
            mood: 'professional'
        },
        reportaje_estadio: {
            environment: 'stadium',
            outfit: 'stadiumPolo',
            mood: 'energetic'
        },
        breaking_news: {
            environment: 'studio',
            outfit: 'studioBlazer',
            mood: 'urgent'
        },
        casual_interview: {
            environment: 'outdoor',
            outfit: 'casualJacket',
            mood: 'friendly'
        }
    };

    return contextMap[contentType] || contextMap['chollo_viral']; // Default
}
```

### **Paso 2: Construcción de Prompt Completo**

```javascript
function buildContextualPrompt(reporter, context, dialogue) {
    const characterBible = getCharacterBible(reporter); // Ana, Carlos, etc.
    const outfit = getOutfitDescription(reporter, context.outfit);
    const environment = getEnvironmentDescription(context.environment);
    const mood = getMoodLighting(context.mood);

    return `
        ${characterBible} // "A 32-year-old Spanish sports analyst..."

        OUTFIT: ${outfit} // "wearing navy blue sports blazer..."

        ENVIRONMENT: ${environment} // "modern sports TV studio..."

        Speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}"

        ${mood} // "Warm intimate lighting, conspiratorial mood..."

        Exact facial features from reference image.
        Natural hand gestures for emphasis.
        Direct eye contact with camera.
    `;
}
```

### **Paso 3: Generación con Referencias Múltiples**

```javascript
async function generateContextualVideo(reporter, contentType, dialogue) {
    const context = selectProductionContext(contentType);
    const references = selectContextImages(
        reporter,
        context.environment,
        context.outfit
    );
    const prompt = buildContextualPrompt(reporter, context, dialogue);

    const veo3Client = new VEO3Client();

    return await veo3Client.generateVideo(prompt, {
        imageUrls: references, // Array de 2-3 imágenes
        seed: getReporterSeed(reporter), // Seed fijo por reporter
        referenceImageWeight: 0.9,
        aspectRatio: '9:16',
        model: 'veo3_fast'
    });
}
```

---

## 📸 Guía Creación de Imágenes de Referencia

### **Requisitos Técnicos**

```
FORMATO: JPEG de alta calidad
RESOLUCIÓN: Mínimo 1080x1920 (9:16) o 1920x1080 (16:9)
TAMAÑO ARCHIVO: 200KB - 2MB óptimo
COMPRESIÓN: 85-95% calidad
FONDO: Limpio, sin distracciones excesivas
ILUMINACIÓN: Profesional, sin sombras duras
```

### **Matriz de Sesiones Fotográficas Necesarias**

#### **Sesión 1: Base Identity (CRÍTICO)**

```
- 3 ángulos: frontal, lateral derecho 45°, lateral izquierdo 45°
- Outfit: neutro profesional (blazer azul)
- Ambiente: fondo neutro gris/blanco
- Expresión: neutra profesional
- Iluminación: tres puntos perfecta
- OBJETIVO: Capturar identidad facial inmutable
```

#### **Sesión 2: Outfits Studio**

```
- 2 outfits: blazer formal + polo casual
- Ambiente: set estudio profesional
- 3 expresiones: seria, sonriente, conspirativa
- Iluminación: broadcast profesional
- OBJETIVO: Referencias para contenido estudio
```

#### **Sesión 3: Outdoor Stadium**

```
- 1 outfit: polo reportaje + pantalón oscuro
- Ambiente: estadio real (campo + gradas)
- 2 momentos: golden hour + tarde nublada
- Iluminación: natural exterior
- OBJETIVO: Referencias para reportajes estadio
```

#### **Sesión 4: Casual Urban**

```
- 1 outfit: chaqueta casual + jeans
- Ambiente: ciudad (calle, cafetería, parque)
- Expresión: relajada amigable
- Iluminación: natural difusa
- OBJETIVO: Referencias para contenido casual
```

### **Post-Procesamiento de Imágenes**

```bash
# Script de optimización (ImageMagick)
convert input.jpg \
  -resize 1080x1920 \
  -quality 90 \
  -sharpen 0x1.0 \
  -auto-level \
  output.jpg

# Verificar metadata
exiftool -a -G1 output.jpg

# Subir a GitHub
git add imagenes-presentadores/ana-main/base/Ana-001.jpeg
git commit -m "Add Ana base reference image"
git push origin main
```

---

## 🚀 Plan de Implementación

### **Fase 1: Ana Martínez (Piloto) - 2 semanas**

**Semana 1: Preparación**

- [ ] Sesión fotográfica completa Ana (4 sesiones)
- [ ] Post-procesamiento y optimización imágenes
- [ ] Subida a GitHub repository estructurado
- [ ] Documentar URLs de acceso

**Semana 2: Desarrollo**

- [ ] Modificar `veo3Client.js` con sistema multi-referencia
- [ ] Crear `characterReferences.js` con todas las URLs
- [ ] Implementar `selectContextImages()` función
- [ ] Crear `buildContextualPrompt()` función
- [ ] Testing con 5 contextos diferentes

### **Fase 2: Validación y Ajustes - 1 semana**

- [ ] Generar 10 videos de prueba (2 por contexto)
- [ ] Validar consistencia facial entre contextos
- [ ] Ajustar `referenceImageWeight` si necesario
- [ ] Documentar mejores prácticas encontradas
- [ ] Crear tabla comparativa calidad por contexto

### **Fase 3: Expansión Equipo Completo - 3 semanas**

**Carlos González** (Semana 1)

- [ ] Sesión fotográfica completa
- [ ] Subida referencias GitHub
- [ ] Configuración Character Bible
- [ ] Testing contextos específicos

**Lucía Rodríguez** (Semana 2)

- [ ] Sesión fotográfica completa
- [ ] Subida referencias GitHub
- [ ] Configuración Character Bible
- [ ] Testing contextos específicos

**Pablo Martín** (Semana 3)

- [ ] Sesión fotográfica completa
- [ ] Subida referencias GitHub
- [ ] Configuración Character Bible
- [ ] Testing contextos específicos

### **Fase 4: Automatización Inteligente - 2 semanas**

- [ ] Sistema auto-selección reporter según contenido
- [ ] Sistema auto-selección contexto según tipo post
- [ ] Integración con `/viral-preview` (dropdown reporter + contexto)
- [ ] Dashboard analytics: contextos más usados
- [ ] Documentación completa workflow producción

---

## 📊 KPIs de Éxito

### **Consistencia Visual**

- ✅ **95%+** reconocimiento facial entre contextos (misma persona)
- ✅ **90%+** consistencia outfit dentro del mismo contexto
- ✅ **85%+** coherencia ambiente/iluminación

### **Variedad de Producción**

- ✅ **5+ ambientes** diferentes por reporter
- ✅ **4+ outfits** diferentes por reporter
- ✅ **10+ ángulos/movimientos** cámara disponibles

### **Eficiencia Workflow**

- ✅ **<2 min** seleccionar contexto + generar prompt
- ✅ **<5 min** tiempo total generación (VEO3)
- ✅ **80%+** tasa éxito primer intento (no regeneración)

---

## 🔍 Troubleshooting

### **Problema: Cara cambia entre contextos**

**Solución**:

- Aumentar `referenceImageWeight` a 1.0
- Usar imagen base frontal como PRIMERA en array
- Verificar que todas las referencias son de la misma persona

### **Problema: Outfit no coincide con referencia**

**Solución**:

- Incluir descripción detallada outfit en prompt
- Usar imagen outfit como SEGUNDA en array (después de cara)
- Reducir complejidad de outfit (menos accesorios)

### **Problema: Ambiente genérico/incorrecto**

**Solución**:

- Ser MÁS específico en descripción ambiente en prompt
- Si se usa imagen ambiente, ponerla TERCERA en array
- Reducir `referenceImageWeight` a 0.8 para dar creatividad

### **Problema: Expresión facial no natural**

**Solución**:

- Evitar "forced smile" en prompt, usar "natural warm expression"
- Incluir referencia con expresión similar
- Describir emoción + razón ("excited because revealing data")

---

## 📚 Referencias y Recursos

### **Documentación Técnica**

- VEO3 API Docs: https://docs.kie.ai/
- Character Bible Guide:
  https://prompt-helper.com/consistent-characters-in-veo-3/
- Cinematography Glossary: https://www.studiobinder.com/blog/camera-movements/

### **Mejores Prácticas 2025**

- Multi-modal reference approach (facial + outfit + environment)
- Weighted image blending (cara 60%, outfit 30%, ambiente 10%)
- Scene Builder para continuidad entre segmentos
- Prompt chaining para transiciones suaves

### **Herramientas Recomendadas**

- **Fotografía**: Sesión profesional en estudio + exteriores
- **Post-Proceso**: Adobe Lightroom / GIMP (gratuito)
- **Optimización**: ImageMagick (CLI)
- **Almacenamiento**: GitHub raw URLs (CDN gratis)
- **Gestión**: Google Sheets para tracking referencias

---

## ✅ Checklist Rápida

```
□ Character Bible completo por reporter
□ 3+ imágenes base (frontal + laterales)
□ 4+ outfits fotografiados
□ 5+ ambientes fotografiados
□ Imágenes optimizadas (JPEG 90%, 1080p+)
□ Subidas a GitHub con URLs documentadas
□ veo3Client.js modificado con multi-referencia
□ characterReferences.js creado con URLs
□ Funciones selectContextImages() implementadas
□ Testing 5 contextos diferentes completado
□ Documentación workflow actualizada
□ ✅ LISTO PARA PRODUCCIÓN VARIADA
```

---

**RECORDATORIO FINAL**: Variedad visual NO debe comprometer consistencia de
identidad. La cara del reporter debe ser SIEMPRE reconocible. Seed + imagen base
frontal son CRÍTICOS.
