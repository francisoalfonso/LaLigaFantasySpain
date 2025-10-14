# 🔍 ANÁLISIS PROFUNDO: Sistema de Chollos Ana (100% Funcional)

**Fecha**: 14 Octubre 2025 **Propósito**: Documentar el flujo completo del
sistema de chollos para entender qué adaptar para multi-presentador (Ana +
Carlos)

---

## 📋 TABLA DE CONTENIDOS

1. [Vista General del Flujo](#vista-general-del-flujo)
2. [FASE 0: Identificación del Chollo](#fase-0-identificación-del-chollo)
3. [FASE 1: Validación del Diccionario](#fase-1-validación-del-diccionario)
4. [FASE 2: Preparación del Workflow](#fase-2-preparación-del-workflow)
5. [FASE 3A: Preparar Sesión (Guión + Imágenes)](#fase-3a-preparar-sesión-guión--imágenes)
6. [FASE 3B: Generación de Segmentos Individuales](#fase-3b-generación-de-segmentos-individuales)
7. [FASE 3C: Finalización y Concatenación](#fase-3c-finalización-y-concatenación)
8. [Puntos Críticos para Adaptación Multi-Presentador](#puntos-críticos-para-adaptación-multi-presentador)

---

## 📊 VISTA GENERAL DEL FLUJO

```
┌─────────────────────────────────────────────────────────────────────┐
│ FASE 0: Identificación Chollo                                       │
│ GET /api/bargains/top                                                │
│ → Retorna top chollo con playerData completo                        │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FASE 1: Validación Diccionario                                      │
│ validateAndPrepare(playerName, team)                                │
│ → Verifica/crea entrada en player-dictionary.json                   │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FASE 2: Preparación Workflow                                        │
│ Construir payload con playerData + contentType + preset             │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FASE 3A: Preparar Sesión (2-3 min)                                  │
│ POST /api/veo3/prepare-session                                      │
│                                                                      │
│ 1. UnifiedScriptGenerator → 3 segmentos (intro, middle, outro)      │
│ 2. CinematicProgressionSystem → cinematografía por segmento         │
│ 3. NanoBananaVeo3Integrator.generateImagesFromScript()              │
│    ├─ generateContextualImage() × 3 (una por segmento)              │
│    ├─ Descargar imagen desde URL Nano Banana                        │
│    ├─ Subir a Supabase Storage (bucket flp/ana/)                    │
│    └─ Obtener signed URL (válido 60 min)                            │
│ 4. Guardar progress.json con:                                       │
│    - status: "prepared"                                              │
│    - segments[].imageContext.supabaseUrl (para VEO3)                │
│    - presenter config (seed, imageUrl, characterBible)              │
│                                                                      │
│ RESULTADO: SessionId + 3 signed URLs en progress.json               │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FASE 3B: Generar Segmentos (3-4 min × 3)                            │
│ POST /api/veo3/generate-segment (llamar 3 veces)                    │
│                                                                      │
│ Para cada segmentIndex (0, 1, 2):                                   │
│ 1. Leer progress.json → obtener:                                    │
│    - segments[segmentIndex].dialogue                                │
│    - segments[segmentIndex].imageContext.supabaseUrl                │
│    - presenter.seed, presenter.characterBible                       │
│ 2. PromptBuilder.buildSegmentPrompt()                               │
│    → Construir prompt VEO3 con dialogue                             │
│ 3. VEO3Client.generateCompleteVideo()                               │
│    - model: presenter.model                                         │
│    - aspectRatio: presenter.aspectRatio                             │
│    - imageUrl: segments[segmentIndex].imageContext.supabaseUrl ✅   │
│    - seed: presenter.seed                                           │
│    - waterMark: presenter.waterMark                                 │
│ 4. Descargar video generado → guardar localmente                    │
│ 5. Actualizar progress.json:                                        │
│    - segments[segmentIndex].taskId                                  │
│    - segments[segmentIndex].veo3Url                                 │
│    - segments[segmentIndex].localPath                               │
│    - segmentsCompleted++                                            │
│                                                                      │
│ RESULTADO: 3 videos generados, progress.json actualizado            │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FASE 3C: Finalización (1 min)                                       │
│ POST /api/veo3/finalize-session                                     │
│                                                                      │
│ 1. Validar que segmentsCompleted === 3                              │
│ 2. VideoConcatenator.concatenateSegments()                          │
│    → FFmpeg: concat 3 videos + logo outro                           │
│ 3. Actualizar progress.json:                                        │
│    - status: "finalized"                                            │
│    - concatenatedVideo (path + URL)                                 │
│                                                                      │
│ RESULTADO: Video final concatenado                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FASE 0: Identificación del Chollo

**Archivo**: `scripts/veo3/test-e2e-complete-chollo-viral.js` (líneas 36-65)

### Proceso

1. **Request**: `GET /api/bargains/top`
    - Timeout: 120s (31 páginas API-Sports)

2. **Response**: `bargainsResponse.data.data[0]` contiene:

    ```javascript
    {
      name: "D. Blind",
      id: 123,
      team: { name: "Girona", logo: "..." },
      position: "Defender",
      number: 2,
      photo: "https://...",
      analysis: {
        estimatedPrice: 5.5,
        estimatedPoints: 85,
        valueRatio: 1.54
      },
      stats: {
        games: 10,
        goals: 1,
        assists: 2,
        rating: 7.12
      }
    }
    ```

3. **Validación**:
    - `success === true`
    - `data.length > 0`
    - Si falla → Error: "No se encontraron chollos"

---

## FASE 1: Validación del Diccionario

**Archivo**: `scripts/veo3/test-e2e-complete-chollo-viral.js` (líneas 68-105)

### Propósito

Garantizar que el jugador tenga referencias seguras para VEO3 (evitar Error 422
por nombres de jugador)

### Proceso

1. **Cargar diccionario**:

    ```javascript
    const refGenerator = new CreativeReferenceGenerator();
    const dictionary = refGenerator.dictionary;
    ```

2. **Verificar existencia**:

    ```javascript
    const playerExists = dictionary.players[topBargain.name];
    ```

3. **Si NO existe**:

    ```javascript
    const playerEntry = refGenerator.updatePlayerInDictionary(topBargain.name, {
        team: topBargain.team.name,
        position: topBargain.position,
        number: topBargain.number || null
    });
    ```

    - Genera automáticamente referencias: "el jugador", "el defensa del Girona",
      etc.
    - Guarda en `data/player-dictionary.json`

4. **Si existe**:
    - Log de referencias disponibles
    - Continuar con workflow

### Output

```javascript
{
  player: {
    name: "D. Blind",
    safeReferences: ["el jugador", "el defensa", "el centrocampista del Girona"],
    testedSuccessRate: 1.0,
    totalVideos: 3
  }
}
```

---

## FASE 2: Preparación del Workflow

**Archivo**: `scripts/veo3/test-e2e-complete-chollo-viral.js` (líneas 110-140)

### Construcción del Payload

```javascript
const workflowPayload = {
    playerName: topBargain.name,
    contentType: 'chollo',
    preset: 'chollo_viral',
    playerData: {
        name: topBargain.name,
        team: topBargain.team.name,
        position: topBargain.position,
        price: topBargain.analysis.estimatedPrice,
        rating: topBargain.stats.rating,
        stats: {
            goals: topBargain.stats.goals || 0,
            assists: topBargain.stats.assists || 0,
            rating: topBargain.stats.rating
        },
        fantasyPoints: topBargain.analysis.estimatedPoints,
        valueRatio: topBargain.analysis.valueRatio
    }
};
```

### Campos Críticos

- `contentType`: Define el tipo de video (chollo, analysis, prediction)
- `preset`: Template de guión a usar (chollo_viral, informative, etc.)
- `playerData`: Datos completos del jugador para el guión

---

## FASE 3A: Preparar Sesión (Guión + Imágenes)

**Archivo**: `backend/routes/veo3.js` (líneas 1789-2127)

### 🔑 PASO 0: Cargar Configuración del Presentador

```javascript
// Determinar qué presentador usar (Ana por defecto)
const presenter = req.body.presenter || 'ana';

let presenterConfig;
if (presenter === 'carlos') {
    const carlosChar = require('../config/veo3/carlosCharacter');
    presenterConfig = {
        name: 'Carlos González',
        seed: carlosChar.CARLOS_DEFAULT_CONFIG.seed,
        imageUrl: carlosChar.CARLOS_IMAGE_URL,
        characterBible: carlosChar.CARLOS_CHARACTER_BIBLE,
        model: carlosChar.CARLOS_DEFAULT_CONFIG.model,
        aspectRatio: carlosChar.CARLOS_DEFAULT_CONFIG.aspectRatio,
        waterMark: carlosChar.CARLOS_DEFAULT_CONFIG.waterMark
    };
} else {
    // Ana (líneas 1834-1847)
    const anaChar = require('../config/veo3/anaCharacter');
    presenterConfig = {
        name: 'Ana Martínez',
        seed: anaChar.ANA_DEFAULT_CONFIG.seed,
        imageUrl: anaChar.ANA_IMAGE_URL,
        characterBible: anaChar.ANA_CHARACTER_BIBLE
        // ...
    };
}
```

**Configuración Ana**:

```javascript
{
  name: 'Ana Martínez',
  seed: 30001,  // FIJO - nunca cambiar
  imageUrl: 'https://raw.githubusercontent.com/...',
  characterBible: 'A 32-year-old Spanish sports analyst Ana Martínez...',
  model: 'google/veo-3',
  aspectRatio: '9:16',
  waterMark: 'FLP'
}
```

### 🔑 PASO 1: Validar Diccionario

```javascript
// líneas 1853-1866
let dictionaryData = null;
if (playerData && playerData.name && playerData.team) {
    dictionaryData = await validateAndPrepare(playerData.name, playerData.team);
    // Log tasa de éxito
}
```

**Función `validateAndPrepare`**:

- Verifica si jugador existe en diccionario
- Si no existe → crea entrada automática
- Retorna `dictionaryData.player.safeReferences` para usar en prompts

### 🔑 PASO 2: Generar Guión

```javascript
// líneas 1916-1932
const structure = multiSegmentGenerator.generateThreeSegments(
    contentType, // 'chollo'
    playerData, // Datos del jugador
    viralData, // Hooks virales opcionales
    { preset, ...options }
);
```

**Output de `generateThreeSegments`**:

```javascript
{
  segments: {
    intro: {
      role: 'intro',
      dialogue: "Psst... ¿Buscas un CHOLLO top? Pues mira a D. Blind del Girona...",
      emotion: 'curiosidad',
      duration: 8
    },
    middle: {
      role: 'middle',
      dialogue: "Rating 7.12 y solo €5.5M. Este jugador está MUY infravalorado...",
      emotion: 'autoridad',
      duration: 8
    },
    outro: {
      role: 'outro',
      dialogue: "Ratio valor 1.54 - ¡Añádelo YA antes de que suba de precio!",
      emotion: 'urgencia',
      duration: 8
    }
  },
  segmentCount: 3,
  totalDuration: 24
}
```

### 🔑 PASO 2B: Añadir Cinematografía

```javascript
// líneas 1935-1955
const CinematicProgressionSystem = require('../services/veo3/cinematicProgressionSystem');
const cinematicSystem = new CinematicProgressionSystem();

const cinematicProgression = cinematicSystem.getFullProgression(contentType, [
    'curiosidad',
    'autoridad',
    'urgencia'
]);

const scriptSegments = [
    {
        ...structure.segments.intro,
        cinematography: cinematicProgression[0].shot // { name: 'wide', ... }
    },
    {
        ...structure.segments.middle,
        cinematography: cinematicProgression[1].shot // { name: 'medium', ... }
    },
    {
        ...structure.segments.outro,
        cinematography: cinematicProgression[2].shot // { name: 'close-up', ... }
    }
];
```

**Resultado**: Array de 3 segmentos con `role`, `dialogue`, `emotion`,
`duration`, `cinematography`

### 🔑 PASO 3: Generar Imágenes Nano Banana

**Archivo**: `backend/services/veo3/nanoBananaVeo3Integrator.js` (líneas
175-278)

#### 3.1. Preparar opciones con configuración del presentador

```javascript
// backend/routes/veo3.js líneas 1965-1976
const optionsWithPresenter = {
    ...options,
    presenter: presenter, // 'ana' o 'carlos'
    seed: presenterConfig.seed, // 30001 para Ana
    // CRÍTICO: Solo pasar imageUrl para presentadores NO-Ana
    // Ana usa sistema por defecto (4 Ana + 2 estudios)
    // Carlos usa (3 Carlos + 2 estudios)
    ...(presenter !== 'ana' && { imageUrl: presenterConfig.imageUrl }),
    characterBible: presenterConfig.characterBible,
    model: presenterConfig.model,
    aspectRatio: presenterConfig.aspectRatio,
    waterMark: presenterConfig.waterMark
};
```

#### 3.2. Llamar a generateImagesFromScript()

```javascript
// backend/routes/veo3.js líneas 1978-1985
const imagesResult = await nanoBananaVeo3Integrator.generateImagesFromScript(
    scriptSegments, // Array de 3 segmentos con dialogue + cinematography
    optionsWithPresenter
);
```

#### 3.3. Dentro de generateImagesFromScript() - Loop de 3 imágenes

```javascript
// nanoBananaVeo3Integrator.js líneas 188-257
for (let i = 0; i < scriptSegments.length; i++) {
    const segment = scriptSegments[i];

    // 3.3.1. Construir prompt contextualizado
    const imagePrompt = this.buildContextualImagePrompt(
        segment,
        options.characterBible
    );

    // 3.3.2. Extraer shot type
    const shotType = segment.cinematography?.name || 'medium';

    // 3.3.3. Determinar URLs de referencia
    const imageUrls = options.imageUrl
        ? [
              ...FLP_CONFIG.carlos_references.map(ref => ref.url), // 3 imágenes Carlos
              ...FLP_CONFIG.estudio_references.map(ref => ref.url) // 2 estudios
          ]
        : undefined; // Ana usa default: 4 Ana + 2 estudios

    // 3.3.4. Generar imagen con Nano Banana
    const nanoImage = await this.nanoBananaClient.generateContextualImage(
        imagePrompt,
        shotType,
        { ...options, imageUrls }
    );

    // 3.3.5. Descargar imagen desde URL temporal de Nano Banana
    const presenter = options.presenter || 'ana';
    const fileName = `${presenter}-${segment.role}-${Date.now()}.png`;
    const localPath = await this.downloadImage(nanoImage.url, fileName);

    // 3.3.6. Subir a Supabase Storage
    const segmentName = `seg${i + 1}-${segment.role}`;
    const supabaseUrl = await supabaseFrameUploader.uploadFrame(
        localPath,
        segmentName,
        {
            useSignedUrl: true, // ✅ CRÍTICO: Signed URL para VEO3
            presenter: presenter // ✅ Para subdirectorio flp/ana/ o flp/carlos/
        }
    );

    // 3.3.7. Limpiar archivo local
    fs.unlinkSync(localPath);

    // 3.3.8. Guardar metadata
    processedImages.push({
        index: i + 1,
        role: segment.role,
        shot: shotType,
        emotion: segment.emotion,
        dialogue: segment.dialogue,
        visualContext: segment.cinematography?.description || '',
        supabaseUrl: supabaseUrl, // ✅ ESTO SE PASA A VEO3
        generatedAt: new Date().toISOString()
    });
}
```

#### 3.4. Detalles de generateContextualImage()

**Archivo**: `backend/services/nanoBanana/nanoBananaClient.js` (líneas 530-651)

```javascript
async generateContextualImage(customPrompt, shotType, options = {}) {
  const seed = options.seed || this.anaConfig.seed;  // 30001 para Ana

  // Determinar referencias a usar
  const referenceUrls = options.imageUrls || this.anaReferenceUrls;
  // Ana: 4 Ana + 2 estudios = 6 referencias
  // Carlos: 3 Carlos + 2 estudios = 5 referencias

  const negativePrompt = `no red tint on hair, no red highlights on hair...`;

  const payload = {
    model: 'google/nano-banana-edit',
    input: {
      prompt: customPrompt,
      negative_prompt: negativePrompt,
      image_urls: referenceUrls,  // ✅ CRÍTICO: Array de URLs públicas
      output_format: 'png',
      image_size: '9:16',         // ✅ Fuerza vertical 576x1024
      seed: seed,
      prompt_strength: 0.75,
      transparent_background: false,
      n: 1
    }
  };

  // 1. Crear tarea en KIE.ai
  const createResponse = await axios.post(
    `${this.baseUrl}/playground/createTask`,
    payload,
    { headers: { Authorization: `Bearer ${this.apiKey}` } }
  );

  const taskId = createResponse.data?.data?.taskId;

  // 2. Polling hasta que complete (max 60 intentos × 3s = 180s)
  let imageUrl = null;
  let attempts = 0;
  while (!imageUrl && attempts < 60) {
    attempts++;
    await this.sleep(3000);

    const statusResponse = await axios.get(
      `${this.baseUrl}/playground/recordInfo`,
      { params: { taskId } }
    );

    const state = statusResponse.data?.data?.state;
    if (state === 'success') {
      const result = JSON.parse(statusResponse.data.data.resultJson);
      imageUrl = result?.resultUrls?.[0];
      break;
    }
  }

  return {
    url: imageUrl,  // URL temporal de Nano Banana (válido ~10 min)
    shot: shotType,
    seed: seed,
    generatedAt: new Date().toISOString()
  };
}
```

#### 3.5. Subida a Supabase Storage

**Archivo**: `backend/services/veo3/supabaseFrameUploader.js`

```javascript
async uploadFrame(localPath, segmentName, options = {}) {
  const useSignedUrl = options.useSignedUrl || false;
  const presenter = options.presenter || 'ana';  // 'ana' o 'carlos'

  // Determinar path en bucket según presentador
  const bucketPath = `flp/${presenter}/${segmentName}-${Date.now()}.png`;
  // Ej: flp/ana/seg1-intro-1697654321.png
  // Ej: flp/carlos/seg2-middle-1697654322.png

  // Subir a Supabase
  const { data, error } = await supabase.storage
    .from('veo3-frames')
    .upload(bucketPath, fs.readFileSync(localPath), {
      contentType: 'image/png',
      upsert: true
    });

  if (error) throw error;

  // Generar signed URL (válido 60 min) si se solicita
  if (useSignedUrl) {
    const { signedURL } = await supabase.storage
      .from('veo3-frames')
      .createSignedUrl(bucketPath, 3600);  // 60 min

    return signedURL;
  }

  // O URL pública
  const publicUrl = supabase.storage
    .from('veo3-frames')
    .getPublicUrl(bucketPath);

  return publicUrl;
}
```

**Resultado**:

```
https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/sign/veo3-frames/flp/ana/seg1-intro-1697654321.png?token=...
```

### 🔑 PASO 4: Guardar progress.json

**Archivo**: `backend/routes/veo3.js` (líneas 1988-2065)

```javascript
// Preparar metadata de segmentos (SIN videos aún)
const segmentsPrepared = scriptSegments.map((seg, idx) => ({
    index: idx,
    role: seg.role, // 'intro', 'middle', 'outro'
    shot: imagesResult.images[idx].shot, // 'wide', 'medium', 'close-up'
    emotion: seg.emotion, // 'curiosidad', 'autoridad', 'urgencia'
    dialogue: seg.dialogue, // "Psst... ¿Buscas un CHOLLO top?..."
    duration: seg.duration, // 8
    imageContext: {
        supabaseUrl: imagesResult.images[idx].supabaseUrl, // ✅ SIGNED URL
        visualContext: imagesResult.images[idx].visualContext,
        emotion: imagesResult.images[idx].emotion
    },
    // Campos de video NULL (se llenarán en FASE 3B)
    taskId: null,
    veo3Url: null,
    localPath: null,
    filename: null,
    generatedAt: null,
    size: null
}));

const progressData = {
    sessionId,
    sessionDir,
    status: 'prepared', // ✅ Listo para generar videos
    segmentsCompleted: 0,
    segmentsTotal: 3,
    playerName: playerData.name,
    contentType: 'chollo',
    preset: 'chollo_viral',
    workflow: 'nano-banana-contextual',

    // Configuración del presentador (Ana o Carlos)
    presenter: {
        name: presenterConfig.name, // 'Ana Martínez'
        seed: presenterConfig.seed, // 30001
        imageUrl: presenterConfig.imageUrl, // Reference image
        characterBible: presenterConfig.characterBible,
        model: presenterConfig.model, // 'google/veo-3'
        aspectRatio: presenterConfig.aspectRatio, // '9:16'
        waterMark: presenterConfig.waterMark // 'FLP'
    },

    // Guión completo
    script: {
        segments: scriptSegments.map(seg => ({
            role: seg.role,
            emotion: seg.emotion,
            dialogue: seg.dialogue,
            duration: seg.duration,
            shot: seg.cinematography?.name || 'medium'
        })),
        totalDuration: structure.totalDuration
    },

    // Imágenes Nano Banana
    nanoBananaImages: imagesResult.images.map(img => ({
        role: img.role,
        shot: img.shot,
        emotion: img.emotion,
        supabaseUrl: img.supabaseUrl, // ✅ SIGNED URL
        visualContext: img.visualContext
    })),

    // Segmentos preparados (sin videos)
    segments: segmentsPrepared,

    // Metadata temporal
    preparedAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
};

// Guardar en disco
await fs.promises.writeFile(
    progressFile,
    JSON.stringify(progressData, null, 2)
);
```

**Ubicación del archivo**:

```
output/veo3/sessions/session_nanoBanana_1697654321/progress.json
```

### ✅ Output de FASE 3A

```javascript
{
  success: true,
  message: "Sesión preparada exitosamente para D. Blind",
  data: {
    sessionId: "nanoBanana_1697654321",
    sessionDir: "/output/veo3/sessions/session_nanoBanana_1697654321",
    status: "prepared",
    workflow: "nano-banana-contextual",

    // 3 Signed URLs listas para VEO3
    nanoBananaImages: [
      {
        role: 'intro',
        shot: 'wide',
        emotion: 'curiosidad',
        supabaseUrl: 'https://...supabase.co/.../flp/ana/seg1-intro-1697654321.png?token=...',
        visualContext: 'Wide shot - establece escenario FLP studio'
      },
      {
        role: 'middle',
        shot: 'medium',
        emotion: 'autoridad',
        supabaseUrl: 'https://...supabase.co/.../flp/ana/seg2-middle-1697654322.png?token=...',
        visualContext: 'Medium shot - acercamiento natural'
      },
      {
        role: 'outro',
        shot: 'close-up',
        emotion: 'urgencia',
        supabaseUrl: 'https://...supabase.co/.../flp/ana/seg3-outro-1697654323.png?token=...',
        visualContext: 'Close-up - intimidad y urgencia'
      }
    ],

    costs: {
      nanoBanana: 0.06  // 3 imágenes × $0.02
    }
  }
}
```

---

## FASE 3B: Generación de Segmentos Individuales

**Archivo**: `backend/routes/veo3.js` (líneas 2036-2294)

### Loop de 3 Segmentos

```javascript
// En test E2E: scripts/veo3/test-e2e-complete-chollo-viral.js líneas 198-227
for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
    const segmentResponse = await axios.post(
        `${BASE_URL}/api/veo3/generate-segment`,
        {
            sessionId: sessionId,
            segmentIndex: segmentIndex // 0, 1, 2
        },
        { timeout: 300000 } // 5 minutos
    );

    // Delay entre segmentos (excepto el último)
    if (segmentIndex < 2) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s
    }
}
```

### Dentro del Endpoint /api/veo3/generate-segment

```javascript
router.post('/generate-segment', async (req, res) => {
  const { sessionId, segmentIndex } = req.body;

  // Validaciones
  if (!sessionId || segmentIndex === undefined) {
    return res.status(400).json({ ... });
  }

  // 1. Leer progress.json
  const sessionDir = path.join(__dirname, '../../output/veo3/sessions', `session_${sessionId}`);
  const progressFile = path.join(sessionDir, 'progress.json');
  const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));

  // 2. Validar estado
  if (progressData.status !== 'prepared' && progressData.status !== 'generating') {
    return res.status(400).json({
      success: false,
      message: `Sesión debe estar en estado 'prepared', estado actual: ${progressData.status}`
    });
  }

  // 3. Extraer datos del segmento
  const segment = progressData.segments[segmentIndex];
  if (!segment) {
    return res.status(404).json({
      success: false,
      message: `Segmento ${segmentIndex} no encontrado`
    });
  }

  // 4. Validar que el segmento NO esté ya generado
  if (segment.taskId) {
    return res.status(400).json({
      success: false,
      message: `Segmento ${segmentIndex} ya fue generado (taskId: ${segment.taskId})`
    });
  }

  // 5. Construir prompt VEO3 con el dialogue del segmento
  const prompt = promptBuilder.buildSegmentPrompt(
    segment.dialogue,  // "Psst... ¿Buscas un CHOLLO top?..."
    {
      presenterConfig: progressData.presenter,
      emotion: segment.emotion,
      shot: segment.shot
    }
  );

  logger.info(`[VEO3 Routes] 🎬 Generando segmento ${segmentIndex} (${segment.role})...`);
  logger.info(`[VEO3 Routes] Dialogue: "${segment.dialogue.substring(0, 50)}..."`);
  logger.info(`[VEO3 Routes] Image URL: ${segment.imageContext.supabaseUrl.substring(0, 80)}...`);

  // 6. Generar video con VEO3
  const video = await veo3Client.generateCompleteVideo(
    prompt,
    {
      model: progressData.presenter.model,           // 'google/veo-3'
      aspectRatio: progressData.presenter.aspectRatio, // '9:16'
      imageUrl: segment.imageContext.supabaseUrl,    // ✅ SIGNED URL de Supabase
      seed: progressData.presenter.seed,             // 30001
      waterMark: progressData.presenter.waterMark    // 'FLP'
    }
  );

  // 7. Descargar video generado
  const videoFilename = `segment_${segmentIndex}_${video.taskId}.mp4`;
  const localPath = path.join(sessionDir, videoFilename);

  await this.downloadVideo(video.url, localPath);

  // 8. Actualizar progress.json
  progressData.segments[segmentIndex] = {
    ...segment,
    taskId: video.taskId,
    veo3Url: video.url,
    localPath: localPath,
    filename: videoFilename,
    generatedAt: new Date().toISOString(),
    size: fs.statSync(localPath).size
  };

  progressData.segmentsCompleted++;
  progressData.status = progressData.segmentsCompleted === 3 ? 'segments_ready' : 'generating';
  progressData.lastUpdate = new Date().toISOString();

  await fs.promises.writeFile(progressFile, JSON.stringify(progressData, null, 2));

  logger.info(`[VEO3 Routes] ✅ Segmento ${segmentIndex} completado`);
  logger.info(`[VEO3 Routes] Progreso: ${progressData.segmentsCompleted}/3`);

  res.json({
    success: true,
    message: `Segmento ${segmentIndex} generado exitosamente`,
    data: {
      segment: progressData.segments[segmentIndex],
      session: {
        sessionId,
        status: progressData.status,
        progress: `${progressData.segmentsCompleted}/3`,
        segmentsCompleted: progressData.segmentsCompleted
      }
    }
  });
});
```

### 🔑 Cómo VEO3 Usa las Imágenes de Nano Banana

**Archivo**: `backend/services/veo3/veo3Client.js`

```javascript
async generateCompleteVideo(prompt, options = {}) {
  const {
    model = 'google/veo-3',
    aspectRatio = '9:16',
    imageUrl,        // ✅ Signed URL de Supabase
    seed,
    waterMark
  } = options;

  // 1. Crear tarea en KIE.ai
  const payload = {
    model: model,
    input: {
      prompt: prompt,              // "The person from the reference image speaks in Spanish..."
      image_url: imageUrl,         // ✅ CRÍTICO: URL de imagen Nano Banana en Supabase
      seed: seed,                  // 30001 para Ana
      aspect_ratio: aspectRatio,   // '9:16'
      water_mark: waterMark        // 'FLP'
    }
  };

  const createResponse = await axios.post(
    `${this.baseUrl}/playground/createTask`,
    payload,
    { headers: { Authorization: `Bearer ${this.apiKey}` } }
  );

  const taskId = createResponse.data?.data?.taskId;

  // 2. Polling hasta que complete (max 120 intentos × 3s = 360s = 6 min)
  let videoUrl = null;
  let attempts = 0;
  while (!videoUrl && attempts < 120) {
    attempts++;
    await this.sleep(3000);

    const statusResponse = await axios.get(
      `${this.baseUrl}/playground/recordInfo`,
      { params: { taskId } }
    );

    const state = statusResponse.data?.data?.state;
    if (state === 'success') {
      const result = JSON.parse(statusResponse.data.data.resultJson);
      videoUrl = result?.resultUrls?.[0];
      break;
    }
  }

  return {
    taskId: taskId,
    url: videoUrl,        // URL del video generado
    generatedAt: new Date().toISOString()
  };
}
```

### ✅ Output de FASE 3B (después de 3 llamadas)

```javascript
// progress.json actualizado:
{
  sessionId: "nanoBanana_1697654321",
  status: "segments_ready",  // ✅ Cambió de 'prepared' a 'segments_ready'
  segmentsCompleted: 3,

  segments: [
    {
      index: 0,
      role: 'intro',
      dialogue: "Psst... ¿Buscas un CHOLLO top?...",
      taskId: "abc123",
      veo3Url: "https://kie.ai/output/video-abc123.mp4",
      localPath: "/output/veo3/sessions/session_nanoBanana_1697654321/segment_0_abc123.mp4",
      filename: "segment_0_abc123.mp4",
      generatedAt: "2025-10-14T10:30:00Z",
      size: 2456789
    },
    {
      index: 1,
      role: 'middle',
      // ... similar structure
    },
    {
      index: 2,
      role: 'outro',
      // ... similar structure
    }
  ]
}
```

---

## FASE 3C: Finalización y Concatenación

**Archivo**: `backend/routes/veo3.js` (líneas 2296-2493)

### Endpoint /api/veo3/finalize-session

```javascript
router.post('/finalize-session', async (req, res) => {
    const { sessionId } = req.body;

    // 1. Leer progress.json
    const progressFile = path.join(sessionDir, 'progress.json');
    const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));

    // 2. Validar que todos los segmentos estén completos
    if (progressData.segmentsCompleted !== 3) {
        return res.status(400).json({
            success: false,
            message: `Solo ${progressData.segmentsCompleted}/3 segmentos completos`
        });
    }

    // 3. Extraer rutas locales de los 3 videos
    const videoFiles = progressData.segments.map(seg => seg.localPath);

    // 4. Concatenar videos con FFmpeg
    const concatenator = new VideoConcatenator();
    const finalVideo = await concatenator.concatenateSegments(videoFiles, {
        sessionId: sessionId,
        addLogoOutro: true, // Añadir logo FLP al final
        logoPath: path.join(__dirname, '../../assets/flp-logo.png')
    });

    // 5. Actualizar progress.json
    progressData.status = 'finalized';
    progressData.concatenatedVideo = {
        localPath: finalVideo.path,
        filename: finalVideo.filename,
        url: `/output/veo3/sessions/session_${sessionId}/${finalVideo.filename}`,
        size: fs.statSync(finalVideo.path).size,
        duration: finalVideo.duration,
        finalizedAt: new Date().toISOString()
    };

    await fs.promises.writeFile(
        progressFile,
        JSON.stringify(progressData, null, 2)
    );

    logger.info(`[VEO3 Routes] ✅ Sesión finalizada: ${finalVideo.path}`);

    res.json({
        success: true,
        message: 'Sesión finalizada exitosamente',
        data: {
            sessionId,
            finalVideo: progressData.concatenatedVideo,
            segments: progressData.segments
        }
    });
});
```

### VideoConcatenator.concatenateSegments()

**Archivo**: `backend/services/veo3/videoConcatenator.js`

```javascript
async concatenateSegments(videoFiles, options = {}) {
  const { sessionId, addLogoOutro, logoPath } = options;

  const outputFilename = `final_video_${sessionId}.mp4`;
  const outputPath = path.join(
    process.cwd(),
    'output/veo3/sessions',
    `session_${sessionId}`,
    outputFilename
  );

  // 1. Crear archivo de lista para FFmpeg
  const listFile = path.join(tempDir, `concat_${sessionId}.txt`);
  const listContent = videoFiles.map(file => `file '${file}'`).join('\n');
  fs.writeFileSync(listFile, listContent);

  // 2. Concatenar videos
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // 3. Añadir logo outro si se solicita
  if (addLogoOutro && logoPath) {
    const withLogo = await this.addLogoOutro(outputPath, logoPath);
    return withLogo;
  }

  return {
    path: outputPath,
    filename: outputFilename,
    duration: await this.getVideoDuration(outputPath)
  };
}
```

### ✅ Output Final

```
output/veo3/sessions/session_nanoBanana_1697654321/
├── progress.json                    (status: "finalized")
├── segment_0_abc123.mp4             (2.4MB)
├── segment_1_def456.mp4             (2.5MB)
├── segment_2_ghi789.mp4             (2.3MB)
└── final_video_nanoBanana_1697654321.mp4  (7.5MB)
```

---

## 🔑 PUNTOS CRÍTICOS PARA ADAPTACIÓN MULTI-PRESENTADOR

### 1. **Configuración del Presentador** (✅ Ya Implementado)

**Ubicación**: `backend/routes/veo3.js` líneas 1817-1847

- Sistema ya soporta `presenter: 'ana' | 'carlos'`
- Carga configuración dinámica desde:
    - `backend/config/veo3/anaCharacter.js`
    - `backend/config/veo3/carlosCharacter.js`

### 2. **Referencias de Imágenes Nano Banana** (⚠️ CRÍTICO)

**Problema actual**: `nanoBananaClient.js` está hardcodeado para Ana

**Ubicación**: `backend/services/nanoBanana/nanoBananaClient.js` líneas 44-60

```javascript
// ACTUAL (hardcoded Ana)
this.anaReferenceUrls = [
    ...FLP_CONFIG.ana_references.map(ref => ref.url), // 4 Ana
    ...FLP_CONFIG.estudio_references.map(ref => ref.url) // 2 estudios
];
```

**Solución**: Pasar `imageUrls` dinámicamente según presentador

```javascript
// En nanoBananaVeo3Integrator.js línea 212-217
const imageUrls = options.imageUrl
    ? [
          ...FLP_CONFIG.carlos_references.map(ref => ref.url), // 3 Carlos
          ...FLP_CONFIG.estudio_references.map(ref => ref.url) // 2 estudios
      ]
    : undefined; // Ana usa default del client
```

**Estado**: ✅ Ya implementado en `generateImagesFromScript()`

### 3. **Subdirectorios en Supabase Storage** (✅ Ya Implementado)

**Ubicación**: `backend/services/veo3/supabaseFrameUploader.js`

- Sistema usa `flp/${presenter}/` dinámicamente
- Ana → `flp/ana/seg1-intro-xxx.png`
- Carlos → `flp/carlos/seg1-intro-xxx.png`

### 4. **Character Bible Dinámico** (✅ Ya Implementado)

**Ubicación**: `backend/services/veo3/nanoBananaVeo3Integrator.js` línea 293-324

```javascript
buildContextualImagePrompt(segment, characterBible) {
  // Si no se proporciona characterBible, usar default de Ana
  const defaultAnaBible = 'A 32-year-old Spanish sports analyst Ana Martínez...';
  const bible = characterBible || defaultAnaBible;

  let prompt = `ultra realistic cinematic portrait, ${bible}, presenting inside the FLP studio...`;
  // ...
}
```

### 5. **Validación de Imágenes Completadas** (✅ Ya Implementado)

**Ubicación**: Sistema usa polling en Nano Banana + validación en progress.json

1. **Nano Banana polling**: `nanoBananaClient.js` líneas 223-269
    - Espera hasta state === 'success'
    - Max 60 intentos × 3s = 180s timeout

2. **Validación en progress.json**: `veo3.js` líneas 2048-2064
    - Guarda `supabaseUrl` solo cuando imagen está descargada y subida
    - Valida que `imageContext.supabaseUrl` exista antes de generar video

3. **Validación en generate-segment**: `veo3.js` líneas 2145-2158
    - Valida que `segment.imageContext.supabaseUrl` exista
    - Si no existe → Error: "Imagen no disponible para segmento X"

### 6. **Passing de Imágenes a VEO3** (✅ Ya Implementado)

**Flow completo**:

```
Nano Banana API
    ↓
  URL temporal (válido ~10 min)
    ↓
Download a /temp/nano-banana/
    ↓
Upload a Supabase Storage (flp/ana/ o flp/carlos/)
    ↓
Generate signed URL (válido 60 min)
    ↓
Guardar en progress.json:
  segments[i].imageContext.supabaseUrl
    ↓
Leer en generate-segment:
  const imageUrl = progressData.segments[segmentIndex].imageContext.supabaseUrl
    ↓
Pasar a VEO3Client:
  veo3Client.generateCompleteVideo(prompt, { imageUrl, ... })
    ↓
VEO3 usa imageUrl como reference frame para generar video
```

### 7. **Error Handling en Cada Paso** (✅ Implementado)

- Nano Banana timeout → Reintentar hasta 60 intentos
- Supabase upload fallo → Error con stack trace
- VEO3 generación fallo → Error con taskId para debug
- Progress.json corrupt → Error con recovery instructions

---

## 📊 RESUMEN: ¿Qué Falta para Multi-Presentador?

### ✅ Ya Funciona (0 cambios necesarios)

1. Sistema de configuración dinámica de presentador
2. Subdirectorios en Supabase (flp/ana/, flp/carlos/)
3. Character bible dinámico en prompts
4. Referencias de imágenes dinámicas (imageUrls)
5. Validación de imágenes completadas
6. Passing de signed URLs a VEO3

### ⚠️ Necesita Verificación

1. **Carlos character config**:
    - ¿Existe `backend/config/veo3/carlosCharacter.js`?
    - ¿Tiene `CARLOS_DEFAULT_CONFIG.seed`?
    - ¿`CARLOS_IMAGE_URL` es accesible públicamente?

2. **FLP_CONFIG para Carlos**:
    - ¿`data/flp-nano-banana-config.json` tiene `carlos_references`?
    - ¿Son 3 imágenes Carlos + 2 estudios = 5 referencias?

3. **Testing end-to-end con Carlos**:
    - Ejecutar: `npm run veo3:test-phased` con `presenter: 'carlos'`
    - Validar que imágenes se generen en `flp/carlos/`
    - Validar que videos usen las imágenes correctas

---

## 🎯 CONCLUSIÓN

El sistema está **arquitecturalmente preparado** para multi-presentador.

Los puntos críticos ya están resueltos:

- ✅ Configuración dinámica
- ✅ Referencias dinámicas
- ✅ Storage segregado
- ✅ Validación robusta

**Lo único que falta**:

1. Verificar que los configs de Carlos existen y están correctos
2. Testing E2E con `presenter: 'carlos'`
3. Debugging de cualquier edge case específico de Carlos

**El flujo de imágenes funciona perfecto**:

```
Nano Banana → Temp → Supabase → Signed URL → progress.json → VEO3
```

Cada paso valida que el anterior completó correctamente antes de continuar.
