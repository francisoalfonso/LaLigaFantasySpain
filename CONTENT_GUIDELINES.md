# Content Creation Guidelines - Fantasy La Liga Pro

Guías profesionales para la creación de contenido viral y scripts para videos
con Ana y el equipo de reporteros virtuales.

## 📋 Tabla de Contenidos

- [Ana Character Bible](#ana-character-bible)
- [Framework Viral](#framework-viral)
- [Guiones por Tipo](#guiones-por-tipo)
- [Vocabulario Fantasy](#vocabulario-fantasy)
- [Reglas de Audio](#reglas-de-audio)
- [VEO3 Prompts](#veo3-prompts)

---

## 👤 Ana Character Bible - NUNCA CAMBIAR

### Apariencia Física (FIJA)

```
A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy.
```

### Configuración Técnica

```javascript
// ⚠️ CRÍTICO: NUNCA CAMBIAR
const ANA_CONFIG = {
    seed: 30001, // FIJO - NO MODIFICAR
    imageUrl:
        'https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg',
    voiceLocale: 'es-ES', // Español de España (NO mexicano)
    voiceGender: 'female',
    voiceStyle: 'professional'
};
```

### Personalidad

- **Tono**: Profesional pero cercano
- **Energía**: Media-alta (7/10)
- **Estilo**: Analista táctica experta
- **Credibilidad**: Confiable, datos verificados
- **Emoción**: Equilibrada (no extrema)

### Frases Características

```javascript
// Openings
'¡Hola familia Fantasy!';
'Bienvenidos a un nuevo análisis táctico';
'Atención managers, esto es importante';

// Transiciones
'Pero eso no es todo...';
'Y ahora viene lo mejor...';
'Espera, que esto te va a interesar...';

// Closings
'Ya sabes qué hacer con esta información';
'Nos vemos en la próxima jornada';
'¡A por esos puntos Fantasy!';
```

---

## 🎬 Framework Viral - 7 Elementos

### Estructura Obligatoria

Todos los guiones DEBEN seguir esta estructura de 7 elementos para maximizar
engagement:

```javascript
const VIRAL_FRAMEWORK = {
    1: 'Hook', // 0-2s: Captar atención
    2: 'Contexto', // 2-4s: Establecer situación
    3: 'Conflicto', // 4-5s: Tensión/problema
    4: 'Inflexión', // 5-6s: Punto de giro
    5: 'Resolución', // 6-7s: Solución/revelación
    6: 'Moraleja', // 7-8s: Lección/insight
    7: 'CTA' // 8s: Call to action
};
```

### Ejemplo: Video Chollo

```javascript
// 8 segundos - 70/30 (General Emocional + Nicho Fantasy)
const script = {
    hook: '(Susurro) Escúchame bien porque esto no lo puede saber nadie más...',
    contexto: 'Pere Milla está a 4 millones en Fantasy, precio ridículo.',
    conflicto: 'Pero el 95% de managers lo están ignorando completamente.',
    inflexion: '¿Qué saben que tú no? Mira su historial contra el Alavés...',
    resolucion: '3 goles en los últimos 3 enfrentamientos. TRES.',
    moraleja:
        'Los chollos se esconden a plena vista, solo hay que saber dónde buscar.',
    cta: 'Fichalo antes de que suba de precio. Ya.'
};
```

### Arcos Emocionales Disponibles

```javascript
const EMOTIONAL_ARCS = {
    chollo: 'susurro → tensión → revelación explosiva → urgencia',
    analisis: 'confianza analítica → construcción → conclusión autoritaria',
    breaking: 'alerta urgente → construcción urgencia → anuncio explosivo',
    prediccion: 'autoridad profesional → insight → realización explosiva'
};
```

---

## 📝 Guiones por Tipo de Contenido

### 1. Chollos (8 segundos)

**Template:**

```
[HOOK - Susurro conspirativo]
[CONTEXTO - Precio y situación]
[CONFLICTO - Por qué lo ignoran]
[INFLEXIÓN - Dato revelador]
[RESOLUCIÓN - Estadística clave]
[MORALEJA - Lección]
[CTA - Acción inmediata]
```

**Ejemplo Real:**

```
(Susurro) Toma nota porque este chollo no va a durar...
Pedri está a solo 8.5 millones en Fantasy La Liga.
¿Sabes por qué nadie lo está fichando? Lesión pasada.
Pero mira esto: ya lleva 3 partidos como titular completo.
Rating de 7.8 promedio y subiendo cada jornada.
El miedo de otros es tu oportunidad en Fantasy.
Fíchalo ahora antes del sábado. Go.
```

### 2. Análisis Táctico (8 segundos)

**Template:**

```
[HOOK - Afirmación audaz]
[CONTEXTO - Situación táctica]
[CONFLICTO - Problema common sense]
[INFLEXIÓN - Análisis profundo]
[RESOLUCIÓN - Data que respalda]
[MORALEJA - Implicación Fantasy]
[CTA - Decisión a tomar]
```

**Ejemplo Real:**

```
Lewandowski no es el delantero que deberías capitanear esta jornada.
Sí, tiene 32 puntos en 6 partidos, suena bien.
Pero está jugando solo 25 minutos por partido de promedio.
Rotación de Flick por Champions, patrón claro.
Pere Milla: 90 minutos asegurados, rival débil, precio bajo.
En Fantasy, minutos garantizados valen más que nombres famosos.
Capitán Pere Milla. Confia en el proceso.
```

### 3. Breaking News (8 segundos)

**Template:**

```
[HOOK - Alerta urgente]
[CONTEXTO - Noticia + timing]
[CONFLICTO - Impacto negativo]
[INFLEXIÓN - Alternativa]
[RESOLUCIÓN - Solución clara]
[MORALEJA - Lección rápida]
[CTA - Acción inmediata]
```

### 4. Predicción Jornada (8 segundos)

**Template:**

```
[HOOK - Predicción atrevida]
[CONTEXTO - Fixture + condiciones]
[CONFLICTO - Duda común]
[INFLEXIÓN - Estadística clave]
[RESOLUCIÓN - Predicción fundamentada]
[MORALEJA - Insight táctico]
[CTA - Jugada recomendada]
```

---

## 🗣️ Vocabulario Fantasy - Usar SIEMPRE

### Términos Obligatorios (70% contenido)

```javascript
const FANTASY_VOCAB = {
    // Jugadores
    chollo: 'Jugador infravalorado',
    ganga: 'Precio bajo, alto potencial',
    trampa: 'Jugador que parece bueno pero no lo es',
    puntomatic: 'Jugador que siempre suma',

    // Estrategia
    capitanear: 'Hacer capitán',
    banquillazo: 'Jugador inesperado que explota',
    rotación: 'Cambio de alineación por técnico',
    'doble jornada': 'Semana con 2 partidos',

    // Análisis
    fixture: 'Calendario de partidos',
    'underlying stats': 'Estadísticas avanzadas',
    xG: 'Goles esperados',
    ownership: 'Porcentaje de managers que lo tienen',

    // Situaciones
    differential: 'Jugador poco usado que puede marcar diferencia',
    template: 'Jugadores que tiene todo el mundo',
    'rogue pick': 'Elección arriesgada',
    'season keeper': 'Jugador a mantener toda temporada'
};
```

### Frases de Comunidad

```javascript
const COMMUNITY_PHRASES = {
  // Celebración
  '¡A por esos greens!',
  'Puntos en el saco',
  'Flecha verde intensifies',

  // Frustración controlada
  'Las matemáticas no mienten',
  'A veces Fantasy es cruel',
  'EO bajo, riesgo calculado',

  // Análisis
  'Los datos no engañan',
  'Fixture amable',
  'Underlying prometedor'
};
```

---

## 🎤 Reglas de Audio - CRÍTICAS

### Español de España OBLIGATORIO

```javascript
// ✅ CORRECTO: Especificar SIEMPRE en prompt
const prompt = `The person speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}"`;

// ❌ INCORRECTO: Sin especificar (usará acento mexicano)
const prompt = `The person speaking in Spanish: "${dialogue}"`;
```

### Voice Configuration

```javascript
// ⚠️ CRÍTICO: Configuración de voz
const voiceConfig = {
    locale: 'es-ES', // España, NO México
    gender: 'female',
    style: 'professional',
    rate: 'medium', // No muy rápido
    pitch: 'default',
    volume: '0.8' // Ligeramente más bajo
};
```

### Testing de Audio

Antes de generar video final, verificar:

- [ ] ✅ Acento es de España (NO mexicano)
- [ ] ✅ Velocidad adecuada (ni muy rápido ni lento)
- [ ] ✅ Entonación profesional
- [ ] ✅ Pausas naturales en puntos
- [ ] ✅ Énfasis correcto en palabras clave

---

## 🎥 VEO3 Prompts - Estándares

### Prompt Base Ana

```javascript
// ✅ SIEMPRE usar este formato
const basePrompt = `The person in the reference image speaking in SPANISH FROM SPAIN (not Mexican Spanish): "${dialogue}". Exact appearance from reference image.`;
```

### Límites VEO3

- **Max caracteres**: 500 (prompt completo)
- **Duración**: 8 segundos por segmento
- **Aspect ratio**: 9:16 (vertical redes sociales)
- **Model**: veo3_fast (más estable)

### Concatenación

Para videos >8s, usar sistema de 3 segmentos:

```javascript
const segments = [
    { type: 'intro', duration: 8, prompt: '...' },
    { type: 'desarrollo', duration: 8, prompt: '...' },
    { type: 'cierre', duration: 8, prompt: '...' }
];

// Transiciones suaves con neutral position
const transitionSetup = {
    position: 'center',
    gesture: 'neutral',
    crossfade: true
};
```

---

## 📊 Métricas de Calidad

### KPIs de Contenido

```javascript
const CONTENT_KPIS = {
    // Engagement
    retention_rate: '>60%', // Retención video completo
    completion_rate: '>75%', // Ven hasta el final
    rewatch_rate: '>15%', // Ven más de una vez

    // Viral potential
    share_rate: '>5%', // Comparten
    save_rate: '>10%', // Guardan
    comment_rate: '>3%', // Comentan

    // Formato
    duration: '8-10s', // Duración óptima
    hook_timing: '<2s', // Hook en primeros 2s
    cta_presence: '100%' // Siempre incluir CTA
};
```

### A/B Testing

Probar variaciones de:

- Hooks (3 opciones por contenido)
- CTAs (2 opciones por contenido)
- Tono emocional (2 variantes)

---

## 🚨 Errores Comunes a Evitar

### ❌ NO HACER

1. **Cambiar character de Ana** (seed, imagen, voz)
2. **Olvidar "SPANISH FROM SPAIN"** en prompts
3. **Guiones >500 caracteres** (VEO3 límite)
4. **Videos sin CTA** (siempre incluir)
5. **Datos sin verificar** (credibilidad crítica)
6. **Jerga sin explicar** (accesibilidad)
7. **Tono muy técnico** (balance necesario)
8. **Promesas imposibles** (realismo)

### ✅ SÍ HACER

1. **Verificar datos** en API-Sports antes de script
2. **Usar framework viral** (7 elementos)
3. **Vocabulario Fantasy** (70% mínimo)
4. **Test de audio** antes de producción final
5. **CTA clara** en cada video
6. **Balance 70/30** (Emocional/Nicho)
7. **Hook <2 segundos** siempre
8. **Credibilidad** con datos reales

---

## 📋 Checklist Pre-Producción

Antes de generar video, verificar:

- [ ] ✅ Script sigue framework viral (7 elementos)
- [ ] ✅ Duración 8 segundos (timing correcto)
- [ ] ✅ Vocabulario Fantasy usado (70% mínimo)
- [ ] ✅ Datos verificados en API-Sports
- [ ] ✅ "SPANISH FROM SPAIN" en prompt
- [ ] ✅ Character Bible respetado (Ana)
- [ ] ✅ CTA incluido y claro
- [ ] ✅ Prompt <500 caracteres
- [ ] ✅ Hook en primeros 2 segundos
- [ ] ✅ Balance 70/30 emocional/nicho

---

## 📚 Recursos Adicionales

- **Framework completo**: `docs/VEO3_FRAMEWORK_VIRAL_USO.md`
- **Guía Instagram**: `docs/INSTAGRAM_VIRAL_GUIDE_2025.md`
- **Vocabulario Fantasy**: `docs/VOCABULARIO_COMUNIDAD_FANTASY.md`
- **Análisis feedback**: `docs/VIDEO_FEEDBACK_ANALYSIS.md`

---

**Siguiendo estas guías, el contenido será viral, profesional y efectivo.** 🎯🚀
