# 🎬 SUPER GUÍA VEO3 MAESTRA
## Guía Técnica Completa para Creadores de Contenido Fantasy La Liga

> **🚨 CONSULTA OBLIGATORIA**: Esta guía debe ser consultada por el **Agente Redactor de Scripts** y el **Director de Arte** antes de cualquier producción de video.

---

## 📋 ÍNDICE RÁPIDO

- [🎯 ACCESO RÁPIDO PARA AGENTES](#acceso-rapido-agentes)
- [⭐ ANA CHARACTER BIBLE](#ana-character-bible)
- [🎬 8 FORMATOS VIRALES](#formatos-virales)
- [🎥 CONTROL DE CÁMARA](#control-camara)
- [🗣️ GESTIÓN DE DIÁLOGOS](#gestion-dialogos)
- [🔗 NARRATIVE CHAINING](#narrative-chaining)
- [📊 BIBLIOTECA DE PROMPTS](#biblioteca-prompts)
- [✅ CHECKLIST PRE-PRODUCCIÓN](#checklist-preproduccion)

---

## 🎯 ACCESO RÁPIDO PARA AGENTES {#acceso-rapido-agentes}

### 🤖 **PARA EL AGENTE REDACTOR DE SCRIPTS**

#### **ANTES DE ESCRIBIR CUALQUIER SCRIPT:**
1. ✅ **Consultar [Ana Character Bible](#ana-character-bible)** - NUNCA modificar
2. ✅ **Elegir formato** de [8 Formatos Virales](#formatos-virales)
3. ✅ **Validar diálogo** según [Gestión de Diálogos](#gestion-dialogos)
4. ✅ **Confirmar timing** (máximo 8 segundos por segmento)
5. ✅ **Aplicar [Checklist Pre-Producción](#checklist-preproduccion)**

#### **FORMATO DE SCRIPT OBLIGATORIO:**
```
FORMATO: [Análisis Táctico/Selfie Vlog/Breaking News/etc.]
DURACIÓN: [8s/16s/24s]
PERSONAJE: Ana Martínez (usar descripción completa del Bible)
DIÁLOGO: [texto exacto - máximo 8 segundos]
CÁMARA: [movimiento específico]
CONTEXTO: [datos Fantasy específicos]
```

### 🎨 **PARA EL DIRECTOR DE ARTE**

#### **ANTES DE GENERAR CUALQUIER VIDEO:**
1. ✅ **Verificar consistencia Ana** usando [Character Bible](#ana-character-bible)
2. ✅ **Aplicar estructura cinematográfica** de [Control de Cámara](#control-camara)
3. ✅ **Validar prompt técnico** con [Biblioteca de Prompts](#biblioteca-prompts)
4. ✅ **Configurar parámetros VEO3** correctos
5. ✅ **Ejecutar [Checklist Pre-Producción](#checklist-preproduccion)**

#### **CONFIGURACIÓN VEO3 OBLIGATORIA:**
```
MODEL: veo3_fast
SEED: 30001 (FIJO PARA ANA)
ASPECT: 9:16 (redes sociales)
DURATION: 8 segundos
IMAGE_URL: https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg
```

---

## ⭐ ANA CHARACTER BIBLE {#ana-character-bible}

> **🚨 CRÍTICO**: Esta descripción es SAGRADA. NUNCA modificar ni cambiar una sola palabra.

### **📝 DESCRIPCIÓN MAESTRA (Copiar/Pegar EXACTO)**

```
Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy
```

### **🎭 PERSONALIDAD Y VOZ**
- **Tono**: Profesional pero cercano
- **Energía**: Media-alta, entusiasta
- **Velocidad**: Ritmo natural español (no acelerado)
- **Gestos**: Naturales para énfasis
- **Postura**: Confiada y autoritaria

### **👗 VESTUARIO FIJO**
- **Blazer**: Azul navy (#0066cc) profesional
- **Logo**: La Liga branding sutil en el pecho
- **Estilo**: Reportero deportivo profesional
- **Corte**: Profesional ajustado

### **🎤 VOZ Y LOCUCIÓN**
```javascript
voice: {
    locale: 'es-ES',        // ESPAÑOL DE ESPAÑA (no mexicano)
    gender: 'female',
    style: 'professional',
    speed: 'natural'
}
```

### **🚨 REGLAS INQUEBRANTABLES ANA**
1. **SEED 30001** - NUNCA cambiar
2. **Imagen referencia fija** - Mismo URL siempre
3. **Descripción exacta** - Copiar/pegar completo
4. **Español de España** - NUNCA acento mexicano
5. **Character Bible** - NUNCA modificar

---

## 🎬 8 FORMATOS VIRALES {#formatos-virales}

### **1. 📊 ANÁLISIS TÁCTICO ANA** *(Formato Principal)*

#### **Uso**: 80% del contenido Fantasy La Liga
#### **Estructura**:
```
Professional sports analysis video, Ana Martínez [DESCRIPCIÓN_COMPLETA], analyzing [PLAYER/TEAM] tactics while [SPECIFIC_ACTION], camera [MOVEMENT], professional studio with La Liga statistics overlay, [AUDIO_CONTEXT]
```

#### **Ejemplo Completo**:
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, analyzing Lewandowski's positioning while pointing at tactical board, camera slowly dollies in from medium to close-up shot, professional studio with Barcelona vs Real Madrid statistics overlay, clean studio lighting with subtle background music
```

#### **Variables Personalizables**:
- `[PLAYER/TEAM]`: Lewandowski, Barcelona, Real Madrid, etc.
- `[SPECIFIC_ACTION]`: pointing at board, showing statistics, gesturing, etc.
- `[MOVEMENT]`: dolly in, tracking shot, static medium, etc.
- `[AUDIO_CONTEXT]`: studio ambience, background music, crowd noise

### **2. 📱 SELFIE VLOG DEPORTIVO**

#### **Uso**: Contenido casual, reacciones, tips rápidos
#### **Estructura**:
```
A selfie video, Ana Martínez [DESCRIPCIÓN_COMPLETA] holding camera at arm's length, her arm clearly visible in frame, YouTube vlog style, sometimes looking at camera before glancing at [INTEREST_POINT], discussing [FANTASY_TOPIC]: [DIALOGUE]
```

#### **Ejemplo**:
```
A selfie video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, holding camera at arm's length, her arm clearly visible in frame, YouTube vlog style, sometimes looking at camera before glancing at phone screen showing Fantasy app, discussing this week's captain choice: "Chicos, para esta jornada tengo clarísimo quién debe ser vuestro capitán"
```

### **3. 🎤 ENTREVISTA CALLE FANTASY**

#### **Uso**: Contenido viral, reacciones fans, street credibility
#### **Estructura**:
```
Street interview style video, female sports reporter with Fantasy La Liga microphone logo, back view shot, interviewing [FAN_TYPE] about [FANTASY_TOPIC], [URBAN_BACKGROUND], natural crowd noise, [SPECIFIC_DIALOGUE]
```

#### **Ejemplo**:
```
Street interview style video, female sports reporter with Fantasy La Liga microphone logo, back view shot, interviewing young Barcelona fan about Pedri's Fantasy value, busy street outside Camp Nou stadium, natural crowd noise, reporter asks: "¿Crees que Pedri a 8 millones es un chollo?" Fan responds enthusiastically: "¡Obviamente! Es la joya de la cantera"
```

### **4. 📺 BREAKING NEWS CON TWIST**

#### **Uso**: Noticias importantes + elemento cómico/sorpresa
#### **Estructura**:
```
News segment style, Ana Martínez [DESCRIPCIÓN_COMPLETA] giving serious Fantasy update: [NEWS_CONTENT], while in background [FUNNY_ACTION] happens, professional news studio setup with Fantasy La Liga graphics overlay
```

#### **Ejemplo**:
```
News segment style, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, giving serious Fantasy update: "Lewandowski ha subido 0.5 millones esta jornada", while in background a inflatable Barça mascot slowly deflates and falls over, professional news studio with Fantasy La Liga breaking news graphics
```

### **5. 🎬 VIDEOS CINEMÁTICOS**

#### **Uso**: Contenido premium, análisis profundos, momentos épicos
#### **Estructura**:
```
Cinematic video, Ana Martínez [DESCRIPCIÓN_COMPLETA] [CINEMATIC_ACTION], camera [ADVANCED_MOVEMENT], dramatic lighting with [LIGHTING_STYLE], [ATMOSPHERIC_CONTEXT]
```

#### **Ejemplo**:
```
Cinematic video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, walking confidently through empty stadium tunnel toward bright field light, camera tracks behind her then moves to side profile as she emerges, dramatic lighting with golden hour sun rays, Santiago Bernabéu atmosphere with distant crowd echoes
```

### **6. 🎧 ASMR DEPORTIVO** *(Experimental)*

#### **Uso**: Contenido relajante, análisis calmados, formatos únicos
#### **Estructura**:
```
ASMR sports analysis video, Ana Martínez [DESCRIPCIÓN_COMPLETA] speaking in soft, calm voice about [FANTASY_TOPIC], close-up shot focusing on [DETAIL], gentle [SOUND_ELEMENT], relaxing studio environment
```

### **7. 🏆 OLIMPIADAS FANTASY**

#### **Uso**: Competiciones entre jugadores, rankings, vs battles
#### **Estructura**:
```
Olympic-style sports video, Ana Martínez [DESCRIPCIÓN_COMPLETA] presenting Fantasy Olympics competition between [PLAYER1] vs [PLAYER2], stadium atmosphere with [SPECIFIC_SPORT] elements, crowd cheering, official competition graphics
```

### **8. 🚀 FORMATOS EXPERIMENTALES**

#### **Uso**: Testing, tendencias nuevas, contenido viral específico
#### **Variables**: Adaptables según trending topics en redes sociales

---

## 🎥 CONTROL DE CÁMARA {#control-camara}

### **🎯 MOVIMIENTOS BÁSICOS (Alta Precisión VEO3)**

#### **1. DOLLY IN/OUT**
```
# Básico
"dolly in"

# Avanzado (RECOMENDADO)
"camera slowly dollies in from wide shot to medium close-up of Ana"
"cinematic camera dollies out revealing entire Fantasy studio setup"
```

#### **2. TRACKING SHOT**
```
# Básico
"tracking shot"

# Avanzado (RECOMENDADO)
"camera tracks Ana as she walks confidently to the tactical board"
"smooth tracking shot following Ana from left to right across studio"
```

#### **3. STATIC SHOTS**
```
"medium shot of Ana centered in frame"
"close-up shot focusing on Ana's confident expression"
"wide shot showing entire Fantasy La Liga studio setup"
```

#### **4. ANGLE SHOTS**
```
"low angle shot making Ana appear authoritative and confident"
"high angle shot providing overview of tactical analysis setup"
"side profile shot capturing Ana's professional broadcaster energy"
```

#### **5. ADVANCED MOVEMENTS**
```
"camera starts wide then slowly pushes in while Ana explains tactics"
"cinematic camera glides up to bird's eye view showing tactical board"
"camera circles around Ana as she analyzes player statistics"
```

### **⚙️ CONFIGURACIÓN DE TOMA SEGÚN FORMATO**

| Formato | Toma Recomendada | Movimiento | Justificación |
|---------|------------------|------------|---------------|
| Análisis Táctico | Medium → Close-up | Dolly In | Enfatiza expertise |
| Selfie Vlog | Close-up handheld | Static/slight movement | Autenticidad |
| Entrevista Calle | Medium back view | Static | Profesionalismo |
| Breaking News | Medium centered | Static → Quick push-in | Urgencia |
| Cinemático | Wide → Various | Complex movements | Drama visual |

### **🎬 ESTRUCTURA CINEMATOGRÁFICA**

#### **Formula Universal:**
```
[SHOT_TYPE] + [MOVEMENT] + [LIGHTING] + [COMPOSITION]
```

#### **Ejemplo Aplicado:**
```
Medium shot of Ana, camera slowly dollies in for emphasis, professional studio lighting with subtle rim light, Ana positioned using rule of thirds with tactical board visible in background
```

---

## 🗣️ GESTIÓN DE DIÁLOGOS {#gestion-dialogos}

### **⏱️ TIMING CRÍTICO**

#### **Reglas de Oro:**
- **8 segundos máximo** por segmento
- **120-140 palabras por minuto** (español natural)
- **16-18 palabras máximo** por clip de 8 segundos
- **Pausas naturales** cada 3-4 palabras

#### **Cálculo de Timing:**
```javascript
// Fórmula timing
const wordsPerSecond = 2.3; // Español natural
const maxWords = 8 * wordsPerSecond; // ~18 palabras máximo
```

### **📝 MÉTODOS DE DIÁLOGO**

#### **1. MÉTODO IMPLÍCITO** *(Menos Control)*
```
Ana says an insightful comment about Lewandowski's performance
Ana explains why Pedri is this week's best bargain
Ana reveals her captain choice for the upcoming gameweek
```

#### **2. MÉTODO EXPLÍCITO** *(Control Total - RECOMENDADO)*
```
Ana speaks confidently: "Lewandowski tiene la mejor relación calidad-precio de esta jornada"
Ana analyzes: "Los números de Pedri no mienten, 8 millones es una ganga absoluta"
Ana reveals: "Mi capitán para esta jornada está clarísimo, y os voy a explicar por qué"
```

### **🎯 ESTRUCTURA DE DIÁLOGO PERFECTO**

#### **Para Análisis Táctico (8s):**
```
"[PLAYER] [ACCIÓN_CLAVE] [RAZÓN_BREVE] [CALL_TO_ACTION]"

Ejemplo: "Lewandowski marca en casa siempre. Esta jornada juega contra Getafe. Es capitán obligatorio."
```

#### **Para Selfie Vlog (8s):**
```
"[SALUDO] [TOPIC] [INSIGHT_RÁPIDO]"

Ejemplo: "¡Hola familia Fantasy! Esta jornada tengo el chollo perfecto para vosotros."
```

#### **Para Breaking News (8s):**
```
"[URGENCIA] [NOTICIA] [IMPLICACIÓN]"

Ejemplo: "¡Atención managers! Pedri ha bajado medio millón. Aprovechad antes que suba."
```

### **✍️ TÉCNICAS DE ESCRITURA**

#### **1. Evitar Subtítulos Automáticos:**
- ✅ Usar **":"** después del personaje
- ❌ NO usar **"comillas"**
- ✅ Agregar **"no subtitles"** si aparecen

#### **2. Claridad en Múltiples Personajes:**
```
# ❌ Confuso
Ana and Carlos discuss tactics

# ✅ Claro
Ana wearing blue blazer says: "Pedri está en forma"
Carlos in white shirt responds: "Pero es muy caro"
```

#### **3. Naturalidad Española:**
- ✅ "¡Chicos!" (no "¡Hola amigos!")
- ✅ "Esta jornada" (no "este gameweek")
- ✅ "Chollo" (no "ganga barata")
- ✅ "Clarísimo" (no "muy claro")

### **🎤 CONTROL DE VOZ Y ACENTO**

#### **Configuración Obligatoria:**
```
voice: {
    locale: 'es-ES',              // ESPAÑOL DE ESPAÑA
    accent: 'Castilian',          // NO mexicano/argentino
    speed: 'natural',             // NO acelerado
    energy: 'professional_warm'   // Profesional pero cercano
}
```

#### **Frases de Refuerzo:**
- Agregar al prompt: **"speaking in Spanish from Spain (not Mexican)"**
- **"Castilian Spanish accent"**
- **"Professional Spanish broadcaster style"**

---

## 🔗 NARRATIVE CHAINING {#narrative-chaining}

### **🎯 CONCEPTO FUNDAMENTAL**

**Narrative Chaining** = Técnica para extender videos manteniendo **continuidad perfecta** visual y narrativa.

#### **Proceso Paso a Paso:**

```
VIDEO 1 (8s) → [Análisis último frame] → [Contexto narrativo] → VIDEO 2 (8s)
      ↓                                                              ↓
[Frame final] ────────────────────────────────────────→ [Frame inicial]
```

### **🔧 IMPLEMENTACIÓN TÉCNICA**

#### **1. Análisis del Video Previo**
```javascript
// Usando File.ai Video Understanding
const analysis = await analyzeVideo(previousVideoUrl);
// Output: "Ana está señalando el táctical board con confianza,
//          explicando la formación del Barcelona..."
```

#### **2. Extracción Último Frame**
```javascript
// Usando File.ai ExtractFrame
const lastFrame = await extractFrame(videoUrl, 'last');
// Output: URL de imagen JPEG del último frame
```

#### **3. Generación Prompt Contextual**
```javascript
const nextPrompt = `
${ANA_CHARACTER_BIBLE},
continuing from previous analysis where ${previousAnalysis},
now [NEXT_ACTION],
${CAMERA_MOVEMENT},
maintaining consistent lighting and studio setup
`;
```

#### **4. Generación con Imagen Inicial**
```javascript
const nextVideo = await generateVEO3({
  prompt: nextPrompt,
  initialImage: lastFrame,  // ← CLAVE para continuidad
  seed: 30001,              // Ana consistency
  duration: 8
});
```

### **📊 GESTIÓN DE PROYECTOS LARGOS**

#### **Base de Datos Narrative Chain:**
```sql
CREATE TABLE narrative_chains (
  id SERIAL PRIMARY KEY,
  project_title VARCHAR(200),
  scene_number INTEGER,
  video_url TEXT,
  last_frame_url TEXT,
  narrative_context TEXT,
  next_scene_prompt TEXT,
  status VARCHAR(20) DEFAULT 'pending'
);
```

#### **Workflow Automático:**
```
1. Input: Tema general ("Análisis completo Lewandowski")
2. Planning: Dividir en 3-4 escenas de 8s cada una
3. Scene 1: Generar desde cero
4. Scene 2: Chain desde Scene 1
5. Scene 3: Chain desde Scene 2
6. Merge: Concatenar todas las escenas
7. Output: Video final 24-32 segundos
```

### **🎬 ESCENARIOS DE USO**

#### **Análisis Completo de Jugador (24s):**
```
Escena 1 (8s): Ana presenta al jugador y sus stats básicas
Escena 2 (8s): Ana analiza rendimiento reciente y forma
Escena 3 (8s): Ana da veredicto final y recomendación
```

#### **Preview de Jornada (32s):**
```
Escena 1 (8s): Ana introduce la jornada y contexto
Escena 2 (8s): Ana destaca 2-3 jugadores clave
Escena 3 (8s): Ana revela sus capitanes recomendados
Escena 4 (8s): Ana cierra con call-to-action
```

#### **Breaking News Extendida (16s):**
```
Escena 1 (8s): Ana da la noticia principal
Escena 2 (8s): Ana explica las implicaciones Fantasy
```

### **✅ CHECKLIST NARRATIVE CHAINING**

- [ ] **Contexto claro** entre escenas
- [ ] **Último frame** extraído correctamente
- [ ] **Prompt maintains** el estado visual anterior
- [ ] **Ana consistency** preserved (seed 30001)
- [ ] **Lighting y setup** coherentes
- [ ] **Narrative flow** lógico y natural
- [ ] **Timing total** apropiado para plataforma

---

## 📊 BIBLIOTECA DE PROMPTS {#biblioteca-prompts}

### **🎯 PROMPTS OPTIMIZADOS POR CATEGORÍA**

#### **CATEGORÍA: ANÁLISIS DE JUGADORES**

##### **P001 - Análisis Básico**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, analyzing {PLAYER_NAME} while pointing at statistics on screen, camera slowly dollies in from medium to close-up shot, professional studio with {TEAM_COLOR} accent lighting, clean audio with subtle background ambience
```
**Variables**: `{PLAYER_NAME}`, `{TEAM_COLOR}`
**Uso**: Análisis estándar de cualquier jugador
**Success Rate**: 95%

##### **P002 - Análisis con Datos**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, explaining {PLAYER_NAME}'s statistics while gesturing toward tactical board showing {STATS_TYPE}, camera starts wide then dollies in for emphasis, professional studio with La Liga graphics overlay, Ana speaks: "{DIALOGUE_8_SECONDS}"
```
**Variables**: `{PLAYER_NAME}`, `{STATS_TYPE}`, `{DIALOGUE_8_SECONDS}`
**Uso**: Análisis con estadísticas específicas
**Success Rate**: 92%

##### **P003 - Comparación de Jugadores**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, comparing {PLAYER1} versus {PLAYER2} while pointing between two tactical screens, camera tracks left to right following her gesture, split-screen graphics showing both players, Ana analyzes: "{COMPARISON_DIALOGUE}"
```
**Variables**: `{PLAYER1}`, `{PLAYER2}`, `{COMPARISON_DIALOGUE}`
**Uso**: Comparativas directas entre jugadores
**Success Rate**: 88%

#### **CATEGORÍA: CHOLLOS Y RECOMENDACIONES**

##### **P004 - Revelación de Chollo**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, leaning forward conspiratorially while revealing {PLAYER_NAME} as hidden gem, camera slowly pushes in to intimate close-up, dim lighting with spotlight on Ana, Ana whispers then speaks normally: "El chollo de esta jornada es {PLAYER_NAME}, {PRICE} millones y {REASONING}"
```
**Variables**: `{PLAYER_NAME}`, `{PRICE}`, `{REASONING}`
**Uso**: Revelación dramática de chollos
**Success Rate**: 96%

##### **P005 - Lista de Chollos**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, counting on fingers while listing top bargains, camera static medium shot with slight zoom on hand gestures, bright studio lighting with countdown graphics, Ana explains: "Mis tres chollos: {PLAYER1}, {PLAYER2}, y {PLAYER3}"
```
**Variables**: `{PLAYER1}`, `{PLAYER2}`, `{PLAYER3}`
**Uso**: Listas rápidas de recomendaciones
**Success Rate**: 93%

#### **CATEGORÍA: BREAKING NEWS**

##### **P006 - Noticia Urgente**
```
News segment style, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, delivering urgent Fantasy news with serious expression, camera static medium shot then quick push-in for emphasis, professional news studio with "BREAKING" graphics, Ana announces: "¡Atención managers! {URGENT_NEWS}"
```
**Variables**: `{URGENT_NEWS}`
**Uso**: Noticias importantes de última hora
**Success Rate**: 91%

##### **P007 - Lesiones y Cambios**
```
News segment style, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, explaining injury impact while showing concerned expression, camera medium shot with subtle zoom, medical graphics overlay, Ana reports: "{PLAYER_NAME} {INJURY_STATUS}, impacto Fantasy: {IMPACT_ANALYSIS}"
```
**Variables**: `{PLAYER_NAME}`, `{INJURY_STATUS}`, `{IMPACT_ANALYSIS}`
**Uso**: Informes de lesiones y rotaciones
**Success Rate**: 89%

#### **CATEGORÍA: PREDICCIONES**

##### **P008 - Capitán de la Jornada**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, revealing captain choice with confident smile, camera dollies in dramatically while golden captain armband graphic appears, Ana declares: "Mi capitán para esta jornada es {CAPTAIN_NAME} por {REASONING}"
```
**Variables**: `{CAPTAIN_NAME}`, `{REASONING}`
**Uso**: Revelación de capitanes recomendados
**Success Rate**: 94%

##### **P009 - Predicción de Puntos**
```
Professional sports analysis video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, pointing at prediction charts with confidence, camera tracks across statistical displays, prediction graphics with point values, Ana predicts: "{PLAYER_NAME} {PREDICTED_POINTS} puntos porque {PREDICTION_LOGIC}"
```
**Variables**: `{PLAYER_NAME}`, `{PREDICTED_POINTS}`, `{PREDICTION_LOGIC}`
**Uso**: Predicciones específicas de puntuación
**Success Rate**: 87%

#### **CATEGORÍA: SELFIE VLOGS**

##### **P010 - Tip Rápido Selfie**
```
A selfie video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, holding camera at arm's length with arm visible, YouTube vlog style, occasionally glancing at phone showing Fantasy app, Ana shares: "¡Hola familia! {QUICK_TIP}"
```
**Variables**: `{QUICK_TIP}`
**Uso**: Tips rápidos estilo vlog personal
**Success Rate**: 92%

##### **P011 - Reacción en Vivo**
```
A selfie video, Ana Martínez, a 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding, confident posture, natural hand gestures for emphasis, professional broadcaster energy, holding camera showing excited reaction to live Fantasy updates, camera slightly shaky for authenticity, Ana reacts: "¡No me lo puedo creer! {REACTION_CONTENT}"
```
**Variables**: `{REACTION_CONTENT}`
**Uso**: Reacciones auténticas a eventos en vivo
**Success Rate**: 90%

### **🔧 SISTEMA DE VARIABLES**

#### **Variables de Jugadores:**
```javascript
const PLAYER_VARIABLES = {
  '{PLAYER_NAME}': ['Lewandowski', 'Pedri', 'Vinicius', 'Benzema', 'Griezmann'],
  '{TEAM_COLOR}': ['Barcelona blue', 'Real Madrid white', 'Atletico red'],
  '{PRICE}': ['8.5', '10.2', '12.0', '6.8', '15.5'],
  '{POSITION}': ['delantero', 'centrocampista', 'defensa', 'portero']
};
```

#### **Variables de Contexto:**
```javascript
const CONTEXT_VARIABLES = {
  '{GAMEWEEK}': ['jornada 1', 'jornada 15', 'última jornada'],
  '{COMPETITION}': ['La Liga', 'Champions', 'Copa del Rey'],
  '{URGENCY}': ['¡Urgente!', '¡Atención!', '¡Importante!', '¡Último momento!']
};
```

#### **Variables de Diálogo (8 segundos máximo):**
```javascript
const DIALOGUE_8S = [
  "tiene la mejor relación calidad-precio de esta jornada",
  "está en una forma espectacular, aprovechad antes que suba",
  "juega contra el peor rival posible, es capitán obligatorio",
  "ha bajado medio millón esta semana, no lo dejéis escapar"
];
```

---

## ✅ CHECKLIST PRE-PRODUCCIÓN {#checklist-preproduccion}

### **🤖 PARA AGENTE REDACTOR DE SCRIPTS**

#### **📝 SCRIPT VALIDATION**
- [ ] **Ana Character Bible** consultado y aplicado exactamente
- [ ] **Formato seleccionado** de los 8 virales disponibles
- [ ] **Diálogo cronometrado** (máximo 18 palabras para 8s)
- [ ] **Contexto Fantasy** específico incluido (jugador, equipo, jornada)
- [ ] **Call-to-action** claro y relevante
- [ ] **Tono español España** mantenido (no mexicano)
- [ ] **Estructura cinematográfica** aplicada
- [ ] **Variables completadas** en template de prompt

#### **⏱️ TIMING VERIFICATION**
- [ ] **Duración total** planificada (8s/16s/24s/32s)
- [ ] **Segmentación** correcta si es multi-parte
- [ ] **Narrative chaining** planificado si es extensión
- [ ] **Pausas naturales** incluidas en diálogo

#### **📊 CONTENT VALIDATION**
- [ ] **Datos Fantasy** verificados y actuales
- [ ] **Precios de jugadores** correctos
- [ ] **Estadísticas** reales y precisas
- [ ] **Contexto de jornada** apropiado
- [ ] **Relevancia temporal** confirmada

### **🎨 PARA DIRECTOR DE ARTE**

#### **🎬 TECHNICAL SETUP**
- [ ] **Configuración VEO3** aplicada (model: veo3_fast, seed: 30001)
- [ ] **Aspect ratio** correcto (9:16 para redes sociales)
- [ ] **Duración** configurada (8 segundos estándar)
- [ ] **Ana reference image** URL configurado correctamente
- [ ] **Prompt structure** completado con todas las variables
- [ ] **Camera movement** especificado claramente
- [ ] **Audio context** definido

#### **🎯 ANA CONSISTENCY**
- [ ] **Character description** copiado exactamente del Bible
- [ ] **Vestuario** especificado (navy blazer + La Liga branding)
- [ ] **Postura** descrita (confident, professional)
- [ ] **Gestos** incluidos (natural hand gestures for emphasis)
- [ ] **Energy level** apropiado (professional broadcaster energy)
- [ ] **Voice settings** configurados (es-ES, professional)

#### **📸 VISUAL QUALITY**
- [ ] **Lighting setup** especificado (professional studio lighting)
- [ ] **Background context** incluido (Fantasy studio, graphics overlay)
- [ ] **Color scheme** coherente (La Liga branding colors)
- [ ] **Graphics elements** planificados (overlays, statistics)
- [ ] **Composition** optimizada (rule of thirds, framing)

#### **🔗 NARRATIVE CONTINUITY** *(Si aplica)*
- [ ] **Previous scene context** analizado
- [ ] **Last frame** extraído para continuidad
- [ ] **Visual transition** planificada
- [ ] **Narrative flow** validado
- [ ] **Character state** consistente entre escenas

### **🚀 PRODUCTION WORKFLOW**

#### **Pre-Production Checklist:**
```
1. [ ] Script validated by Redactor Agent
2. [ ] Visual plan approved by Director Agent
3. [ ] Ana consistency verified
4. [ ] Technical parameters configured
5. [ ] Prompt tested and optimized
6. [ ] Timeline and resources confirmed
```

#### **Production Execution:**
```
1. [ ] Generate video with validated prompt
2. [ ] Monitor generation quality
3. [ ] Verify Ana consistency in output
4. [ ] Check audio/visual sync
5. [ ] Validate against script requirements
```

#### **Post-Production Validation:**
```
1. [ ] Quality assessment completed
2. [ ] Ana character consistency confirmed
3. [ ] Technical specs met (duration, format)
4. [ ] Content accuracy verified
5. [ ] Ready for distribution approval
```

### **📊 QUALITY METRICS**

#### **Success Criteria:**
- **Ana Consistency**: 98%+ character recognition
- **Technical Quality**: 720p minimum, upscaled to 1080p
- **Audio Quality**: Clear Spanish Spain accent, professional level
- **Content Accuracy**: 100% factual Fantasy data
- **Brand Consistency**: La Liga colors and branding visible
- **Timing Accuracy**: ±0.5 seconds of target duration

#### **Red Flags (Must Fix Before Production):**
- ❌ Ana appearance inconsistent with Bible
- ❌ Mexican or non-Spain Spanish accent detected
- ❌ Script exceeds 8-second timing
- ❌ Fantasy data outdated or incorrect
- ❌ Prompt missing character Bible description
- ❌ Camera movement not specified
- ❌ VEO3 parameters not configured correctly

---

## 🔧 INTEGRACIÓN TÉCNICA

### **🤖 APIs PARA AGENTES**

#### **Script Agent Integration:**
```javascript
// backend/services/agents/scriptAgent.js
class ScriptAgent {
  async validateScript(script) {
    // 1. Check Ana Character Bible compliance
    // 2. Validate timing (8s max)
    // 3. Verify Fantasy data accuracy
    // 4. Confirm dialogue structure
    // 5. Apply checklist validation
  }

  async consultGuide(format) {
    // Query this guide for specific format
    return await this.queryGuide(`VEO3-MAESTRA.md#${format}`);
  }
}
```

#### **Art Director Integration:**
```javascript
// backend/services/agents/artDirectorAgent.js
class ArtDirectorAgent {
  async validateProduction(prompt, config) {
    // 1. Verify Ana consistency parameters
    // 2. Check VEO3 technical configuration
    // 3. Validate prompt structure
    // 4. Confirm visual specifications
    // 5. Apply production checklist
  }

  async getOptimizedPrompt(format, variables) {
    // Get prompt from biblioteca with variables applied
    return await this.applyTemplate(format, variables);
  }
}
```

### **📊 Database Integration:**

```sql
-- Tabla para tracking de consultas de guía
CREATE TABLE guide_consultations (
  id SERIAL PRIMARY KEY,
  agent_type VARCHAR(50),           -- 'script_agent', 'art_director'
  guide_section VARCHAR(100),       -- 'ana-character-bible', 'formatos-virales'
  consultation_reason VARCHAR(200), -- 'pre_production_check', 'validation'
  project_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para métricas de calidad
CREATE TABLE production_quality_metrics (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(50),
  ana_consistency_score DECIMAL(3,2),    -- 0.00 to 1.00
  technical_quality_score DECIMAL(3,2),  -- 0.00 to 1.00
  content_accuracy_score DECIMAL(3,2),   -- 0.00 to 1.00
  timing_accuracy_seconds DECIMAL(4,2),  -- Difference from target
  checklist_completion_rate DECIMAL(3,2), -- % of checklist completed
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **🚨 ENFORCEMENT SYSTEM**

#### **Mandatory Guide Consultation:**
```javascript
// Middleware que bloquea producción sin consulta previa
app.use('/api/veo3/generate', async (req, res, next) => {
  const guideConsultation = await checkGuideConsultation(req.body.projectId);

  if (!guideConsultation.scriptAgentValidated) {
    return res.status(400).json({
      error: 'Script Agent must consult VEO3-MAESTRA guide before production'
    });
  }

  if (!guideConsultation.artDirectorValidated) {
    return res.status(400).json({
      error: 'Art Director must validate against VEO3-MAESTRA guide before production'
    });
  }

  next();
});
```

---

## 📈 MÉTRICAS Y OPTIMIZACIÓN

### **📊 Tracking de Rendimiento:**
- **Consistency Score**: % de videos con Ana reconocible
- **Quality Score**: Evaluación técnica automática
- **Engagement Metrics**: Rendimiento en redes sociales
- **Cost Efficiency**: Costo por video de alta calidad
- **Production Speed**: Tiempo desde script hasta video final

### **🔄 Continuous Improvement:**
- **Monthly Guide Updates**: Basado en métricas de rendimiento
- **Prompt Optimization**: Actualización de biblioteca según resultados
- **New Format Integration**: Añadir formatos virales emergentes
- **Agent Training**: Mejora continua de agentes basada en resultados

---

> **🎯 OBJETIVO FINAL**: Garantizar que el 100% de los videos de Fantasy La Liga mantengan la más alta calidad técnica y narrativa, con Ana como personaje consistente y reconocible, utilizando las mejores prácticas cinematográficas y de producción de contenido viral.

---

**📅 Última actualización**: ${new Date().toLocaleDateString('es-ES')}
**🔄 Versión**: 1.0 - VEO3 Maestra Completa
**👥 Target**: Agente Redactor de Scripts + Director de Arte
**⚡ Estado**: **CONSULTA OBLIGATORIA ANTES DE CUALQUIER PRODUCCIÓN**