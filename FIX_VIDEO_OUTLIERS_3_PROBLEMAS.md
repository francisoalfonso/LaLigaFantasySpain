# Fix: 3 Problemas en Video Outliers con Player Card

**Sesión**: `nanoBanana_1760530129629` **Video**:
`ana-concatenated-1760533084088.mp4` **Fecha**: 15 Octubre 2025

---

## 🔴 PROBLEMA 1: Player Card Incorrecta

### Síntoma

El video habla del **"delantero del Barcelona"** pero muestra la tarjeta de
**Toni Martínez** (Alaves).

### Datos del Progress.json

```json
"playerName": "delantero del Barcelona",  // ❌ Genérico, sin nombre específico
"enriched_data": {
  "players": [
    {"name": "Toni Martínez", "team": "Alaves", "position": "Attacker", "stats": {"goals": 1}},  // ❌ Posición [0]
    ...
    {"name": "Ferran Torres", "team": "Barcelona", "position": "Attacker", "stats": {"goals": 4, "assists": 1}}  // ✅ Posición [5] - El correcto!
  ]
}
```

### Root Cause (MÁS PROFUNDO)

**El agente redactor viral NO identifica el jugador específico**:

1. **Content Analyzer** extrae jugadores mencionados →
   `mentioned_players: ["Ferran Torres", "Toni Martínez", ...]`
2. **Script Generator** genera texto genérico → `"delantero del Barcelona"` (sin
   especificar QUIÉN)
3. **Enrichment** busca datos de TODOS los jugadores mencionados →
   `enriched_data.players[0-N]`
4. **Player Card** usa `players[0]` por defecto → Toni Martínez ❌

**El problema**: Nadie decide "Este video habla principalmente de **Ferran
Torres**".

### Archivos Responsables

1. **`backend/services/contentAnalysis/contentAnalyzer.js`**
    - Extrae `mentioned_players` pero NO identifica el jugador principal
      (`target_player`)

2. **`backend/services/contentAnalysis/outlierScriptGenerator.js`**
    - Genera scripts genéricos sin referencia al jugador específico
    - **NO** añade `targetPlayer: "Ferran Torres"` al metadata

3. **`backend/routes/outliers.js`** (líneas 202-226)
    - Enriquece TODOS los jugadores mencionados
    - **NO** prioriza al jugador principal

4. **`backend/services/veo3/playerCardOverlay.js`**
    - Usa ciegamente `enriched_data.players[0]`

### Solución Correcta (3 FASES)

#### FASE 1: Content Analyzer identifica jugador principal

Modificar `contentAnalyzer.js` para añadir `target_player`:

```javascript
// Después de extractar mentioned_players (línea ~350)
const mentionedPlayers = [...]; // Array de jugadores mencionados

// NUEVO: Identificar jugador principal basado en:
// 1. Frecuencia de menciones
// 2. Posición en título/descripción
// 3. Contexto del contenido (delantero + Barcelona = Ferran Torres probablemente)
const targetPlayer = identifyTargetPlayer(mentionedPlayers, {
    title: videoData.title,
    transcription: videoData.transcription,
    contentFocus: analysis.focus  // "player_analysis" | "team_analysis" | "match_analysis"
});

return {
    mentioned_players: mentionedPlayers,
    target_player: targetPlayer,  // ✅ NUEVO CAMPO
    ...
};
```

Crear función helper:

```javascript
function identifyTargetPlayer(mentionedPlayers, context) {
    if (!mentionedPlayers || mentionedPlayers.length === 0) {
        return null;
    }

    // Si solo hay 1 jugador → ese es
    if (mentionedPlayers.length === 1) {
        return mentionedPlayers[0];
    }

    // Scoring basado en contexto
    const playerScores = mentionedPlayers.map(player => {
        let score = 0;

        // +50 puntos si aparece en el título
        if (context.title?.toLowerCase().includes(player.toLowerCase())) {
            score += 50;
        }

        // +30 puntos si aparece en primeros 30% de transcripción
        const transcriptStart = context.transcription?.substring(
            0,
            Math.floor(context.transcription.length * 0.3)
        );
        if (transcriptStart?.toLowerCase().includes(player.toLowerCase())) {
            score += 30;
        }

        // +20 puntos por frecuencia de menciones
        const mentions = (
            context.transcription
                ?.toLowerCase()
                .match(new RegExp(player.toLowerCase(), 'g')) || []
        ).length;
        score += mentions * 10;

        return { player, score };
    });

    // Retornar el jugador con mayor score
    playerScores.sort((a, b) => b.score - a.score);
    return playerScores[0].player;
}
```

#### FASE 2: Script Generator usa el jugador específico

Modificar `outlierScriptGenerator.js` para incluir el jugador en el script:

```javascript
// Línea ~50: Añadir targetPlayer a los parámetros
generateScriptFromOutlier(outlierData, options = {}) {
    const { presenter = 'Carlos', customHook = null, platform = 'youtube' } = options;

    // ✅ NUEVO: Extraer target_player del content_analysis
    const targetPlayer = outlierData.content_analysis?.target_player || null;

    logger.info('[OutlierScriptGenerator] Generando script desde outlier:', {
        videoId: outlierData.video_id,
        targetPlayer: targetPlayer,  // ✅ Log del jugador objetivo
        platform: platform.toUpperCase()
    });

    // Construir script con jugador específico
    const script = this._buildOutlierScript(outlierData, presenter, customHook, platform, targetPlayer);  // ✅ Pasar targetPlayer
    ...
}

// Línea ~82: Usar targetPlayer en el script
_buildOutlierScript(outlier, presenter, customHook, platform, targetPlayer) {
    // Si tenemos targetPlayer, usarlo en lugar de genérico
    const playerReference = targetPlayer || "el jugador";

    // Hook específico si conocemos el jugador
    const hook = customHook || (targetPlayer
        ? `Misters, acabo de ver el video de Carrasco sobre ${playerReference}... y hay datos que NO os están contando sobre su rendimiento y opciones.`
        : `Misters, acabo de descubrir un video que está rompiendo YouTube...`
    );

    // SEGMENTO 1: Mencionar jugador específico
    const segment1 = {
        hook: hook,
        discovery: targetPlayer ? `Los números de ${playerReference} son...` : `"${shortTitle}" de ${channelName}.`,
        impact: `Lleva ${views} visualizaciones en tiempo récord.`
    };

    ...
}
```

Añadir `targetPlayer` al metadata del script:

```javascript
// Línea ~220: Añadir a metadata
return {
    segments,
    arc: this.outlierTemplate,
    validation,
    metadata: {
        contentType: 'outlier_response',
        platform: platform || 'youtube',
        targetPlayer: targetPlayer,  // ✅ NUEVO CAMPO
        outlierVideoId: outlierData.video_id,
        ...
    }
};
```

#### FASE 3: Player Card usa targetPlayer específico

Modificar `playerCardOverlay.js` para buscar el jugador correcto:

```javascript
// backend/services/veo3/contentTypeRules.js
function extractPlayerDataFromOutlier(enrichedData, targetPlayer = null) {
    if (!enrichedData || !enrichedData.players || enrichedData.players.length === 0) {
        return null;
    }

    // ✅ NUEVO: Si tenemos targetPlayer, buscarlo específicamente
    if (targetPlayer) {
        const targetPlayerData = enrichedData.players.find(p =>
            p.name.toLowerCase() === targetPlayer.toLowerCase()
        );

        if (targetPlayerData) {
            logger.info(`[ContentTypeRules] ✅ Player card encontrado para target: ${targetPlayer}`);
            return {
                id: targetPlayerData.id,
                name: targetPlayerData.name,
                team: targetPlayerData.team,
                photo: targetPlayerData.photo,
                ...
            };
        } else {
            logger.warn(`[ContentTypeRules] ⚠️ Target player "${targetPlayer}" no encontrado en enriched_data, usando fallback`);
        }
    }

    // Fallback: usar players[0] (comportamiento anterior)
    const player = enrichedData.players[0];
    return { ... };
}
```

Modificar el script que aplica la card para pasar `targetPlayer`:

```javascript
// scripts/veo3/add-captions-to-outlier-video.js (línea ~80)
if (rules.needsPlayerCard) {
    const targetPlayer = progress.script?.metadata?.targetPlayer || null;  // ✅ Extraer de metadata

    const playerData = progress.enriched_data
        ? ContentTypeRules.extractPlayerDataFromOutlier(progress.enriched_data, targetPlayer)  // ✅ Pasar targetPlayer
        : null;

    if (playerData) {
        console.log(`\n🃏 Aplicando Player Card para: ${playerData.name}`);
        ...
    }
}
```

---

## 🔴 PROBLEMA 2: Acento Mexicano (Segmento 2)

### Síntoma

A pesar del fix de acento castellano, el segmento 2 (middle) tiene acento
mexicano.

### Análisis del Código

El método `buildEnhancedNanoBananaPrompt` (promptBuilder.js:177) **SÍ incluye el
enforcement**:

```javascript
speaks in CASTILIAN SPANISH FROM SPAIN with EUROPEAN SPANISH accent
(CRITICAL: not Mexican, not Latin American, ONLY Castilian Spanish from Spain)
```

### Root Cause Probable

#### Hipótesis 1: VEO3 TTS Limitation

VEO3 puede tener limitaciones en el modelo de Text-to-Speech español:

- El modelo podría estar entrenado principalmente con español latinoamericano
- Los prompts de "enforcement" pueden no ser suficientes

#### Hipótesis 2: Script Length

El usuario menciona: "Quizás hay algún guión que se pasa un poquito de palabras,
quizás una o dos palabras extras de más"

```
Segmento 2: "Los números reales son: 5 goles, 3 asistencias, y una calificación de 7.5...
muy diferente a lo que están vendiendo por ahí en otras fuentes."
```

**Conteo**: 25 palabras → Está dentro del rango óptimo (20-30 palabras para 8s)

### Soluciones Propuestas

#### Opción 1: Voice Cloning (IDEAL pero COSTOSO)

Usar un servicio de voice cloning con voz española nativa:

- **ElevenLabs**: $22/mo (10k caracteres/mes)
- **PlayHT**: $39/mo (12.5k caracteres/mes)
- Proceso: VEO3 video mudo → ElevenLabs voice-over → FFmpeg merge

#### Opción 2: Post-Processing con TTS

Reemplazar audio de VEO3 con TTS español nativo:

```javascript
// Servicios de TTS con español de España
const spanishTTS = {
    'Google Cloud TTS': 'es-ES-Wavenet-C', // Voz femenina española
    'Azure TTS': 'es-ES-ElviraNeural', // Neural voice española
    'AWS Polly': 'es-ES-Lucia' // Voz española estándar
};
```

#### Opción 3: Múltiples Generaciones + Selección Manual

Generar 3 versiones de cada segmento y seleccionar manualmente la que tenga
mejor acento:

- Costo: 3x ($0.90 por segmento → $2.70 por segmento)
- Tiempo: 3x (~6 minutos por segmento)
- **No garantiza resultado** (VEO3 puede seguir generando acento mexicano)

#### Opción 4: Prompt con Ejemplos Fonéticos (EXPERIMENTAL)

```javascript
const phoneticPrompt = `speaks in CASTILIAN SPANISH FROM SPAIN
(pronunciation: "graZias" not "grasias", "Zerbeza" not "serbeza",
theta sound for 'z' and 'c' before 'i/e', distinct 'j' and 'll' sounds)`;
```

### Recomendación

**Opción 2** (Post-Processing con TTS) es la más viable:

- Costo bajo (~$0.01 por video con Google Cloud TTS)
- Control total sobre el acento
- Workflow automatizable

---

## 🔴 PROBLEMA 3: Subtítulos Desincronizados (CONFIRMADO)

### Síntoma

En el segundo 23 del video, aparece el subtítulo **"delantero"** (solo,
aislado), cuando debería mostrar **"Barça."**

### Screenshot Evidencia

```
Timestamp: 0:23 (segundo 23 del video)
Subtítulo visible: "delantero"
```

### Análisis del ASS File

```
22.33-22.66 → "delantero"
22.66-22.99 → "del"
22.99-23.33 → "Barça."     ← ESTO debería mostrar en segundo 23
23.33-23.66 → "¡Decididlo"
23.66-23.99 → "pronto!"
```

### Root Cause: Desincronización ~1 segundo

**Proceso actual (INCORRECTO)**:

```
1. Generar ASS basado en 3 diálogos (24s totales)
2. Aplicar subtítulos burned-in al video concatenado (24s)
3. Aplicar player card (no cambia duración)
4. Concatenar con logo outro + RECORTE DE AUDIO (23.53s)
   └─> Los subtítulos burned-in del paso 2 quedan desincronizados ❌
```

El problema: Los subtítulos se quemaron en el video **ANTES** del recorte de
audio en PASO 4.

**Duración real del video**: 25.907s (según ffprobe) **Duración ASS**: 24s
(basado en script) **Audio detectado**: 23.53s (recorte aplicado en PASO 4)

### Archivos Responsables

**`scripts/veo3/add-captions-to-outlier-video.js`**

- Líneas 30-70: PASO 1 y 2 (Generar ASS + Aplicar subtítulos)
- Líneas 100-150: PASO 4 (Concatenar + recorte)

El orden está invertido:

1. ❌ Primero quema subtítulos en video de 24s
2. ❌ Luego recorta el video a 23.53s
3. ❌ Resultado: Subtítulos desincronizados

### Solución: Reordenar Pasos del Workflow

**NUEVO orden correcto**:

```javascript
// scripts/veo3/add-captions-to-outlier-video.js

// PASO 1: Detectar duración real del audio (sin subtítulos todavía)
const realDuration = await detectAudioDuration(videoPath);
console.log(`📊 Duración real detectada: ${realDuration}s`);

// PASO 2: Aplicar player card (si needed)
let videoWithCard = videoPath;
if (rules.needsPlayerCard) {
    videoWithCard = await playerCardOverlay.generateAndApplyCard(...);
}

// PASO 3: Añadir logo outro + recorte (obtener video final con duración correcta)
const finalVideoPath = await videoConcatenator.concatenateVideos([videoWithCard, logoPath], {
    trim: true,
    audioBasedTrim: true
});

// Obtener duración FINAL después del recorte
const finalDuration = await ffprobe(finalVideoPath);
console.log(`📊 Duración final después de recorte: ${finalDuration}s`);

// PASO 4: Generar subtítulos ASS con duración REAL y FINAL
const assPath = await captionsService.generateKaraokeSubtitles(
    scriptSegments,
    finalDuration  // ✅ Usar duración real, no estimada
);

// PASO 5: Aplicar subtítulos al video YA FINALIZADO
const videoWithCaptions = await captionsService.burnSubtitles(finalVideoPath, assPath);
```

### Cambios Específicos

#### Modificar captionsService para aceptar duración real

```javascript
// backend/services/youtubeShorts/captionsService.js

generateKaraokeSubtitles(segments, actualDuration = null) {
    // ✅ NUEVO: Si se proporciona duración real, usarla para calcular timings
    const totalDuration = actualDuration || this._estimateDuration(segments);

    logger.info(`[CaptionsService] Generando subtítulos para ${totalDuration.toFixed(2)}s`);

    // Distribuir palabras en el tiempo real disponible
    const words = this._extractWords(segments);
    const wordTimings = this._calculateWordTimings(words, totalDuration);

    return this._generateASSFile(wordTimings);
}

_calculateWordTimings(words, totalDuration) {
    const wordsPerSecond = words.length / totalDuration;  // ✅ Usar duración real

    return words.map((word, index) => {
        const startTime = (index / words.length) * totalDuration;
        const endTime = ((index + 1) / words.length) * totalDuration;

        return {
            word,
            startTime: startTime.toFixed(2),
            endTime: endTime.toFixed(2)
        };
    });
}
```

---

## 📊 Prioridades de Fix

### P0 - CRÍTICO

1. **Player Card Incorrecta** → Implementar sistema completo de target_player (3
   FASES)
    - Impacto: ALTO - El video muestra información incorrecta
    - Esfuerzo: ALTO (6-8 horas para integración completa)
    - Archivos: contentAnalyzer.js, outlierScriptGenerator.js,
      contentTypeRules.js, add-captions-to-outlier-video.js

2. **Subtítulos Desincronizados** → Reordenar workflow de post-processing
    - Impacto: ALTO - Afecta experiencia de usuario
    - Esfuerzo: MEDIO (3-4 horas)
    - Archivos: add-captions-to-outlier-video.js, captionsService.js

### P1 - IMPORTANTE

3. **Acento Mexicano** → Implementar Post-Processing con TTS
    - Impacto: MEDIO - Afecta calidad percibida pero no afecta información
    - Esfuerzo: ALTO (4-6 horas para integración completa)
    - Archivos: Nuevo servicio spanishTTSReplacer.js, veo3.js routes

---

## 🛠️ Plan de Implementación

### Fase 1: Fix Player Card (HOY)

1. Modificar `outlierScriptGenerator.js` con algoritmo de ranking por relevancia
2. Agregar tests unitarios para verificar ranking correcto
3. Regenerar video con player card correcta de Ferran Torres

### Fase 2: TTS Post-Processing (MAÑANA)

1. Integrar Google Cloud TTS (es-ES-Wavenet-C)
2. Crear servicio `backend/services/veo3/spanishTTSReplacer.js`
3. Workflow: VEO3 mudo → TTS voice-over → FFmpeg audio replace
4. Test con segmento 2 problemático

### Fase 3: Testing & Validación

1. Generar nuevo video completo con ambos fixes
2. Validación manual de acento + player card
3. Actualizar documentación

---

## 📁 Archivos a Modificar

### Player Card Fix

- `backend/services/contentAnalysis/outlierScriptGenerator.js` (líneas ~400-500)
- `backend/services/veo3/playerCardOverlay.js` (líneas ~100-150)
- Tests: `backend/tests/outlierScriptGenerator.test.js` (nuevo)

### Acento Fix (Post-Processing)

- `backend/services/veo3/spanishTTSReplacer.js` (nuevo servicio)
- `backend/routes/veo3.js` (agregar endpoint `/apply-spanish-tts`)
- `package.json` (añadir `@google-cloud/text-to-speech`)

---

## 🎯 Resultado Esperado

Después de implementar los fixes:

✅ **Player Card**: Muestra **Ferran Torres** (Barcelona, 4 goles) correctamente
✅ **Acento**: Todos los segmentos con acento castellano auténtico ✅
**Subtítulos**: Sin problemas (ya está correcto)

**Tiempo estimado total**: 1-2 días de desarrollo **Costo adicional por video**:
+$0.01 (Google Cloud TTS)
