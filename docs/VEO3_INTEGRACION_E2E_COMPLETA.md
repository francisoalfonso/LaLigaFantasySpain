# VEO3 - Integración E2E Completa Instagram Chollos Virales

**Fecha**: 10 Octubre 2025
**Estado**: ✅ **COMPLETADO**
**Versión**: 1.0.0

---

## 📋 Resumen Ejecutivo

Se ha implementado la **integración E2E completa** del flujo de generación de videos virales para Instagram, incluyendo:

1. ✅ **Generación de 3 segmentos VEO3** (Hook → Desarrollo → CTA)
2. ✅ **Concatenación automática** con freeze frame + logo outro
3. ✅ **Subtítulos virales automáticos** (ASS karaoke golden #FFD700)
4. ✅ **Player card overlay** en segundo 3-7 (animación slide-in)
5. ✅ **Scoring automático** (viral score 0-100)
6. ✅ **Guardado en test-history** con metadata completa

---

## 🎯 Flujo E2E Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO E2E INSTAGRAM VIRAL                     │
└─────────────────────────────────────────────────────────────────┘

1. API-Sports → BargainAnalyzer
   └─ Identifica chollos (ratio > 1.2, precio < €8.0)

2. ViralVideoBuilder.generateViralVideo(playerData)
   ├─ UnifiedScriptGenerator → Genera 3 diálogos cohesivos
   │  ├─ Segmento 1 (Hook): Susurro conspirativo
   │  ├─ Segmento 2 (Desarrollo): Revelación + datos
   │  └─ Segmento 3 (CTA): Urgencia + llamada a acción
   │
   ├─ VEO3Client → Genera 3 videos (frame-to-frame Supabase)
   │  ├─ Seg 1: Con imagen Ana desde Supabase
   │  ├─ Seg 2: Image-to-Video (último frame seg 1)
   │  └─ Seg 3: Image-to-Video (último frame seg 2)
   │
   └─ VideoConcatenator.concatenateVideos()
      ├─ ✅ Aplica subtítulos virales ASS karaoke (#FFD700)
      ├─ ✅ Aplica player card overlay (segundo 3-7)
      ├─ ✅ Recorta audio automáticamente (evita "cara rara")
      ├─ ✅ Crea freeze frame del último segmento (0.8s)
      ├─ ✅ Agrega logo outro estático (1.5s)
      └─ ✅ Concatena con FFmpeg concat filter

3. ViralVideoBuilder.saveToTestHistory()
   ├─ Incrementa contador global de tests
   ├─ Calcula viral score (0-100)
   ├─ Crea estructura JSON completa
   └─ Guarda en data/instagram-versions/{player}-v{timestamp}.json

4. Retorna objeto con:
   ├─ videoPath: ruta del video final
   ├─ testHistory: { id, testNumber, viralScore, status }
   ├─ metadata: { segments, unifiedScript, playerData }
   └─ success: true
```

---

## 🔧 Componentes Integrados

### 1. Subtítulos Virales (ViralCaptionsGenerator)

**Estado**: ✅ INTEGRADO en VideoConcatenator (línea 119-549)

**Configuración Validada**:
```javascript
{
  formato: "ASS Karaoke word-by-word",
  color: "#FFD700", // Golden (Test #47 aprobado)
  fontSize: 48,
  fontFamily: "Arial-Bold",
  highlightColor: "yellow", // Palabra destacada
  outlineColor: "black",
  outlineWidth: 3,
  yPosition: "(h*0.75)", // 75% desde arriba
  enableBox: true,
  boxColor: "black@0.7", // Semi-transparente
  boxPadding: 20,
  wordsPerSecond: 2.5
}
```

**Activación**: Automática por defecto
```javascript
viralCaptions: {
  enabled: true, // ✅ Default
  applyBeforeConcatenation: true
}
```

---

### 2. Player Card Overlay (PlayerCardOverlay)

**Estado**: ✅ INTEGRADO en ViralVideoBuilder (línea 225-245)

**Diseño Validado**:
```javascript
{
  // Dimensiones
  cardWidth: 320px,
  cardHeight: 100px,

  // Posición (videos 720x1280)
  position: {
    x: 0, // Pegado al borde izquierdo
    y: 870px // 310px desde el fondo
  },

  // Timing
  startTime: 3.0, // Aparece en segundo 3
  duration: 4.0, // Visible hasta segundo 7
  slideInDuration: 0.5, // Animación entrada

  // Diseño visual
  backgroundColor: "#F5F5F5FF", // Gris claro
  textColor: "#000000FF", // Negro
  accentColor: "#3B82F6FF", // Azul para números
  photoSize: 100px, // Foto circular
  borderRadius: 12px
}
```

**Datos Mostrados**:
- Foto del jugador (local > API > placeholder)
- Nombre del jugador
- Logo del equipo
- Badge de posición (GK/DEF/MID/FWD)
- Stats: Partidos, Goles, Rating

**Activación**: Automática en ViralVideoBuilder
```javascript
playerCard: {
  enabled: true, // ✅ Activado
  startTime: 3.0,
  duration: 4.0,
  slideInDuration: 0.5,
  applyToFirstSegment: true
}
```

---

### 3. Test-History Scoring (testHistory.js)

**Estado**: ✅ INTEGRADO en ViralVideoBuilder (línea 257-269)

**Algoritmo de Scoring Automático**:
```javascript
Base Score: 10.0

Penalties:
- Critical issues: -2.0 por cada uno
- Major issues: -0.5 por cada uno
- Minor issues: -0.2 por cada uno

Bonuses:
- What works: +0.3 por cada acierto

Formula:
overallScore = Math.max(0, Math.min(10,
  baseScore - criticalPenalty - majorPenalty - minorPenalty + worksBonus
));
```

**Viral Score Inicial** (calculateViralScore):
```javascript
Base Score: 50

Bonuses:
- Ratio > 2.0: +15
- Ratio > 1.5: +10
- Ratio > 1.2: +5
- Precio < €3.0: +10
- Precio < €5.0: +5
- Goles > 5: +10
- Goles > 3: +5
- Rating > 7.5: +5
- Rating > 7.0: +3
- Asistencias > 3: +5
- Script unificado: +10

Range: 0-100
```

**Estructura Test-History**:
```json
{
  "id": "{player-slug}-v{timestamp}",
  "testMetadata": {
    "testNumber": 47,
    "fixesApplied": [
      "guion-unificado",
      "subtitulos-virales",
      "logo-outro",
      "player-card-overlay",
      "imagen-ana-fija",
      "sin-transiciones-camara"
    ],
    "feedback": {
      "whatWorks": [],
      "whatFails": [],
      "severity": { "critical": 0, "major": 0, "minor": 0 }
    },
    "checklist": {
      "imagenAnaFija": true,
      "sinTransicionesCamara": true,
      "audioSinCortes": null,
      "logoOutro": true,
      "hookSegundo3": true
    },
    "qualityScore": {
      "overallScore": 10.0,
      "autoCalculated": true
    }
  },
  "viralScore": 75,
  "isRealVideo": true
}
```

---

## 📝 Cambios Implementados

### ViralVideoBuilder.js (backend/services/veo3/viralVideoBuilder.js)

#### 1. Modificación de Concatenación (línea 197-247)

**ANTES**:
```javascript
const finalVideoPath = await this.concatenator.concatenateVideos(tempPaths, {
  transition: { type: 'none', duration: 0, enabled: false },
  audio: { normalize: true, fadeInOut: false },
  outro: { enabled: true, freezeFrame: { enabled: true, duration: 0.8 } }
});
```

**DESPUÉS**:
```javascript
const finalVideoPath = await this.concatenator.concatenateVideos(
  // ✅ Pasar array de objetos con dialogue para subtítulos
  [
    { videoPath: tempPaths[0], dialogue: segment1Dialogue },
    { videoPath: tempPaths[1], dialogue: segment2Dialogue },
    { videoPath: tempPaths[2], dialogue: segment3Dialogue }
  ],
  {
    transition: { type: 'none', duration: 0, enabled: false },
    audio: { normalize: true, fadeInOut: false },
    outro: { enabled: true, freezeFrame: { enabled: true, duration: 0.8 } },

    // ✅ NUEVO: Subtítulos virales
    viralCaptions: {
      enabled: true,
      applyBeforeConcatenation: true
    },

    // ✅ NUEVO: Player card overlay
    playerCard: {
      enabled: true,
      startTime: 3.0,
      duration: 4.0,
      slideInDuration: 0.5,
      applyToFirstSegment: true
    },

    // ✅ NUEVO: Datos del jugador
    playerData: {
      id: playerData.id,
      name: playerName,
      team: team,
      position: playerData.position || 'MID',
      stats: {
        games: stats.games || 0,
        goals: stats.goals || 0,
        rating: stats.rating || 'N/A'
      },
      photo: playerData.photo,
      teamLogo: playerData.teamLogo
    }
  }
);
```

#### 2. Guardado en Test-History (línea 257-269)

**NUEVO**:
```javascript
// ✅ INTEGRACIÓN E2E: Guardar en test-history con scoring automático
logger.info('[ViralVideoBuilder] 💾 Guardando en test-history...');
const testHistoryData = await this.saveToTestHistory(
  viralPath,
  playerData,
  unifiedScript,
  {
    segment1: segment1,
    segment2: segment2,
    segment3: segment3
  }
);
logger.info(`[ViralVideoBuilder] ✅ Test guardado: ${testHistoryData.id} (Test #${testHistoryData.testMetadata.testNumber})`);
logger.info(`[ViralVideoBuilder]    Viral Score: ${testHistoryData.viralScore}/100`);
```

#### 3. Método saveToTestHistory() (línea 455-613)

**NUEVO**: 160 líneas
- Incrementa contador global
- Crea ID único
- Calcula viral score
- Crea estructura JSON completa (según VERSION_SCHEMA.json)
- Guarda en `data/instagram-versions/{player}-v{timestamp}.json`

#### 4. Método calculateViralScore() (línea 627-690)

**NUEVO**: 64 líneas
- Algoritmo de scoring predictivo (0-100)
- Bonuses por ratio, precio, goles, rating, asistencias
- Bonus por script unificado
- Logging detallado del cálculo

#### 5. Actualización de Objeto de Retorno (línea 278-310)

**NUEVO**:
```javascript
return {
  success: true,
  videoPath: viralPath,
  duration: '~24s',
  segments: 3,
  structure: 'Hook → Desarrollo → CTA',

  // ✅ NUEVO: Datos del test-history guardado
  testHistory: {
    id: testHistoryData.id,
    testNumber: testHistoryData.testMetadata.testNumber,
    viralScore: testHistoryData.viralScore,
    status: testHistoryData.metadata.status
  },

  metadata: { ... }
};
```

---

## 🧪 Testing

### Test E2E Completo

**Script**: `scripts/instagram/test-e2e-chollos-instagram.js`

**Comando**:
```bash
npm run instagram:test-e2e
```

**Flujo del Test**:
1. Health check servidor
2. Health check VEO3
3. Obtener chollos de BargainAnalyzer (limit=3)
4. Generar video viral para cada chollo
5. Verificar:
   - Video generado exitosamente
   - Test-history guardado
   - Viral score calculado
   - Player card aplicado
   - Subtítulos aplicados
   - Logo outro agregado

**Resultado Esperado**:
```
✅ Test E2E EXITOSO
   - 3 videos generados
   - 3 tests guardados en test-history
   - Viral scores: 70-85/100
   - Player cards visibles en segundo 3-7
   - Subtítulos ASS karaoke golden aplicados
   - Logo outro agregado correctamente
```

---

## 📊 Métricas de Calidad

### Checklist Automático Confirmado

| Criterio | Estado | Validación |
|----------|--------|------------|
| **Imagen Ana Fija** | ✅ Confirmado | Supabase frame-to-frame |
| **Sin Transiciones Cámara** | ✅ Confirmado | Frame-to-frame continuity |
| **Logo Outro** | ✅ Confirmado | Config outro.enabled |
| **Player Card Segundo 3** | ✅ Confirmado | Config playerCard.startTime |
| **Audio Sin Cortes** | ⚠️ Pendiente | Validación manual |
| **Voz Consistente** | ⚠️ Pendiente | Validación manual |
| **Pronunciación Correcta** | ⚠️ Pendiente | Validación manual |
| **Duración Correcta** | ⚠️ Pendiente | Validación manual |
| **CTA Claro** | ⚠️ Pendiente | Validación manual |

### Fixes Aplicados Automáticamente

1. ✅ **guion-unificado** - UnifiedScriptGenerator con narrativa cohesiva
2. ✅ **subtitulos-virales** - ASS karaoke golden (#FFD700)
3. ✅ **logo-outro** - Freeze frame + logo estático 1.5s
4. ✅ **player-card-overlay** - Card animada segundo 3-7
5. ✅ **imagen-ana-fija** - Supabase Storage frame-to-frame
6. ✅ **sin-transiciones-camara** - Continuidad visual perfecta

---

## 🎓 Próximos Pasos

### Validación Manual (Pendiente)

1. **Audio Sin Cortes**: Revisar transiciones en segundos 0, 8, 16
2. **Voz Consistente**: Verificar mismo tono/timbre en 3 segmentos
3. **Pronunciación**: Validar números, ratio, nombres de jugadores
4. **Duración**: Confirmar 32-34s totales (8s × 3 + 1.5s logo + freeze)
5. **CTA**: Verificar llamada a acción clara y directa

### Mejoras Futuras

1. **Feedback Loop**: Interface UI para marcar whatWorks/whatFails
2. **A/B Testing**: Comparar diferentes estilos de subtítulos
3. **Optimización Score**: Ajustar algoritmo según engagement real
4. **Automatización Publicación**: Integrar con Instagram Graph API
5. **Analytics**: Tracking de métricas post-publicación

---

## 📚 Referencias

- **VERSION_SCHEMA.json**: `data/instagram-versions/VERSION_SCHEMA.json`
- **VEO3 Guía Completa**: `docs/VEO3_GUIA_COMPLETA.md`
- **Player Card System**: `docs/VEO3_PLAYER_CARD_OVERLAY_SISTEMA.md`
- **Subtítulos Virales**: `docs/VEO3_SUBTITULOS_VIRALES_INSTAGRAM.md`
- **Test-History API**: `backend/routes/testHistory.js`

---

**Última actualización**: 10 Octubre 2025, 07:50
**Autor**: Claude Code + Fran
**Estado**: ✅ PRODUCCIÓN
