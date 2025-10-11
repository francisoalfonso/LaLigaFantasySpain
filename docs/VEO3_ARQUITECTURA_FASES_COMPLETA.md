# VEO3 - Arquitectura en Fases (Documentación Completa)

**Última actualización**: 2025-10-11 13:55 **Estado**: ✅ VALIDADO E2E - NO
TOCAR SIN REVISAR ESTE DOC

---

## 🎯 Problema Resuelto

### Antes (Arquitectura Monolítica)

**Endpoint**: `/api/veo3/generate-with-nano-banana`

**Problema**:

- Generaba guión + 3 imágenes + 3 videos + concatenación en UNA sola petición
  HTTP
- Duración: 10-15 minutos de operación continua
- ❌ **Timeouts del servidor** (cliente desconectaba después de ~10 min)
- ❌ **Socket hang up** (conexión perdida antes de completar)
- ❌ **Progress.json parcial** (estado inconsistente si fallaba)
- ❌ **Imposible reintentar** segmentos individuales (tenías que regenerar TODO)

### Después (Arquitectura en Fases)

**3 Endpoints separados**: `/prepare-session`, `/generate-segment`,
`/finalize-session`

**Ventajas**:

- ✅ **Sin timeouts** - Sesiones cortas (2-4 min cada una)
- ✅ **Progreso visible** - progress.json actualizado incrementalmente (33% →
  67% → 100%)
- ✅ **Reintentos granulares** - Regenerar segmentos individuales sin empezar de
  cero
- ✅ **Paralelizable** - Futuro: generar 3 segmentos en paralelo
- ✅ **Estado persistente** - progress.json sobrevive a crashes del servidor
- ✅ **Cooling periods opcionales** - Ya no críticos (sesiones cortas), pero
  disponibles

---

## 🏗️ Arquitectura Implementada

### FASE 1: Preparación

**Endpoint**: `POST /api/veo3/prepare-session`

**Ubicación**: `backend/routes/veo3.js:1772-2034`

**Input**:

```json
{
    "contentType": "chollo",
    "playerData": {
        "name": "Pere Milla",
        "team": "Valencia CF",
        "price": 5.8,
        "stats": {
            "goals": 3,
            "assists": 2,
            "rating": 7.2
        }
    },
    "preset": "chollo_viral",
    "viralData": {
        "gameweek": "jornada 5",
        "xgIncrease": "30"
    }
}
```

**Proceso**:

1. Validar diccionario de jugador (`validateAndPrepare()`)
2. Generar guión con `UnifiedScriptGenerator` → 3 segmentos (intro, middle,
   outro)
3. Añadir cinematografía con `CinematicProgressionSystem`
4. Generar 3 imágenes Nano Banana contextualizadas
   (`nanoBananaVeo3Integrator.generateImagesFromScript()`)
5. Guardar todo en `progress.json` con `status: "prepared"`

**Output**:

```json
{
    "success": true,
    "data": {
        "sessionId": "nanoBanana_1760183659163",
        "sessionDir": "/Users/.../output/veo3/sessions/session_nanoBanana_1760183659163",
        "status": "prepared",
        "script": {
            "segments": [
                {
                    "role": "intro",
                    "emotion": "curiosidad",
                    "dialogue": "Misters, tengo un chollazo que no os vais a creer...",
                    "duration": 8,
                    "shot": "Close-Up"
                }
                // ... segmentos 2 y 3
            ],
            "totalDuration": 24
        },
        "nanoBananaImages": [
            {
                "role": "intro",
                "shot": "Close-Up",
                "emotion": "curiosidad",
                "supabaseUrl": "https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/sign/...",
                "visualContext": "framed from shoulders up, intimate perspective"
            }
            // ... imágenes 2 y 3
        ],
        "costs": {
            "nanoBanana": 0.06,
            "veo3": 0,
            "total": 0.06
        },
        "nextSteps": {
            "phase2": "POST /api/veo3/generate-segment",
            "params": {
                "sessionId": "nanoBanana_1760183659163",
                "segmentIndex": "0, 1, or 2"
            }
        }
    }
}
```

**Duración**: ~2-3 minutos (106.7s en test E2E) **Costo**: ~$0.06 (Nano Banana)

---

### FASE 2: Generación Individual

**Endpoint**: `POST /api/veo3/generate-segment`

**Ubicación**: `backend/routes/veo3.js:2036-2294`

**Input**:

```json
{
    "sessionId": "nanoBanana_1760183659163",
    "segmentIndex": 0 // 0, 1, or 2
}
```

**Proceso**:

1. Leer `progress.json` de la sesión
2. Validar que la sesión esté en estado `"prepared"` o `"generating"`
3. Validar que el segmento no haya sido generado ya
4. Generar prompt Enhanced Nano Banana
   (`promptBuilder.buildEnhancedNanoBananaPrompt()`)
5. Generar UN video VEO3 con imagen contextualizada
   (`veo3Client.generateCompleteVideo()`)
6. Descargar video desde VEO3 (`axios.get()`)
7. Guardar video localmente en `sessionDir/segment_N_taskId.mp4`
8. Actualizar `progress.json` incrementalmente:
    - `segmentsCompleted`: incrementar
    - `status`: `"generating"` → `"completed"` (cuando los 3 estén listos)
    - `segments[index]`: añadir `taskId`, `veo3Url`, `localPath`, `generatedAt`

**Output**:

```json
{
    "success": true,
    "data": {
        "segment": {
            "index": 0,
            "number": 1,
            "role": "intro",
            "taskId": "875680d74d198d36b44794c7ef36af4d",
            "localPath": "/Users/.../segment_1_875680d74d198d36b44794c7ef36af4d.mp4",
            "filename": "segment_1_875680d74d198d36b44794c7ef36af4d.mp4",
            "size": 1456128
        },
        "session": {
            "status": "generating",
            "segmentsCompleted": 1,
            "segmentsTotal": 3,
            "progress": "33%"
        },
        "costs": {
            "thisSegment": 0.3,
            "totalSoFar": 0.3
        },
        "nextSteps": {
            "continuePhase2": "POST /api/veo3/generate-segment",
            "params": {
                "sessionId": "nanoBanana_1760183659163",
                "segmentIndex": 1
            }
        }
    }
}
```

**Duración**: ~3-4 minutos POR segmento (88.6s, 109.1s, 98.1s en test E2E)
**Costo**: ~$0.30 por segmento **Ejecutar**: 3 veces (una por segmento)

---

### FASE 3: Finalización

**Endpoint**: `POST /api/veo3/finalize-session`

**Ubicación**: `backend/routes/veo3.js:2296-2493`

**Input**:

```json
{
    "sessionId": "nanoBanana_1760183659163"
}
```

**Proceso**:

1. Leer `progress.json` de la sesión
2. Validar que los 3 segmentos estén completos (`segmentsCompleted === 3`)
3. Concatenar 3 videos con `VideoConcatenator` (`concatenateVideos()`)
4. Añadir logo outro blanco FLP (freeze frame 0.8s)
5. Actualizar `progress.json` con:
    - `status: "finalized"`
    - `concatenatedVideo`: metadata del video final
    - `finalVideoUrl`: URL del video concatenado
    - `finalizedAt`: timestamp

**Output**:

```json
{
    "success": true,
    "data": {
        "finalVideo": {
            "url": "http://localhost:3000/output/veo3/ana-concatenated-1760184105617.mp4",
            "outputPath": "output/veo3/ana-concatenated-1760184105617.mp4",
            "duration": 24
        },
        "segments": [
            {
                "index": 0,
                "role": "intro",
                "taskId": "875680d74d198d36b44794c7ef36af4d",
                "filename": "segment_1_875680d74d198d36b44794c7ef36af4d.mp4"
            }
            // ... segmentos 2 y 3
        ],
        "costs": {
            "nanoBanana": 0.06,
            "veo3": 0.9,
            "total": 0.96
        },
        "nextSteps": {
            "validate": "Visualizar video en http://localhost:3000/output/veo3/...",
            "publish": "Publicar en Instagram/TikTok",
            "optional": [
                "Añadir subtítulos virales",
                "Añadir player card overlay (segundos 3-6)",
                "Optimizar para Instagram Reels"
            ]
        }
    }
}
```

**Duración**: ~1 minuto (22.5s en test E2E) **Costo**: $0 (local)

---

## 📊 Validación E2E (Test Real)

**Script**: `npm run veo3:test-phased` **Ubicación**:
`scripts/veo3/test-phased-workflow.js`

**Resultados (Pere Milla - Valencia CF)**:

| Fase           | Duración              | Costo      | Output                                                   |
| -------------- | --------------------- | ---------- | -------------------------------------------------------- |
| FASE 1         | 106.7s (~1.8 min)     | $0.060     | sessionId + 3 imágenes Nano Banana                       |
| FASE 2 (seg 1) | 88.6s                 | $0.300     | segment_1_875680d74d198d36b44794c7ef36af4d.mp4 (1.39 MB) |
| FASE 2 (seg 2) | 109.1s                | $0.300     | segment_2_77578e5fa2701de5197ec4d5bef02d31.mp4 (1.50 MB) |
| FASE 2 (seg 3) | 98.1s                 | $0.300     | segment_3_ff6d2d71985d58f507f6ff8ba0ff917f.mp4 (1.67 MB) |
| FASE 3         | 22.5s                 | $0.000     | ana-concatenated-1760184105617.mp4 (24s total)           |
| **TOTAL**      | **455.0s (~7.6 min)** | **$0.960** | **Video final concatenado con logo outro**               |

**Estado**: ✅ **100% EXITOSO** - Sin timeouts, sin errores, progreso visible

---

## 🗂️ Estructura de Archivos

### Session Directory (creado en FASE 1)

```
output/veo3/sessions/session_nanoBanana_1760183659163/
├── progress.json                                        # Estado de la sesión
├── segment_1_875680d74d198d36b44794c7ef36af4d.mp4     # FASE 2 - Segmento 1
├── segment_2_77578e5fa2701de5197ec4d5bef02d31.mp4     # FASE 2 - Segmento 2
└── segment_3_ff6d2d71985d58f507f6ff8ba0ff917f.mp4     # FASE 2 - Segmento 3
```

### Video Final (creado en FASE 3)

```
output/veo3/ana-concatenated-1760184105617.mp4  # Video final con logo outro
```

### progress.json (Evolución)

**FASE 1 (prepared)**:

```json
{
    "sessionId": "nanoBanana_1760183659163",
    "status": "prepared",
    "segmentsCompleted": 0,
    "segmentsTotal": 3,
    "script": {
        /* ... */
    },
    "nanoBananaImages": [
        /* ... */
    ],
    "segments": [
        {
            "index": 0,
            "role": "intro",
            "dialogue": "...",
            "imageContext": {
                /* ... */
            },
            "taskId": null, // Aún no generado
            "localPath": null
        }
        // ... segmentos 2 y 3
    ]
}
```

**FASE 2 (generating - después del segmento 1)**:

```json
{
    "sessionId": "nanoBanana_1760183659163",
    "status": "generating",
    "segmentsCompleted": 1,
    "segmentsTotal": 3,
    "segments": [
        {
            "index": 0,
            "role": "intro",
            "taskId": "875680d74d198d36b44794c7ef36af4d", // ✅ Generado
            "localPath": "/Users/.../segment_1_875680d74d198d36b44794c7ef36af4d.mp4",
            "generatedAt": "2025-10-11T11:56:25.789Z"
        },
        {
            "index": 1,
            "taskId": null, // ⏳ Pendiente
            "localPath": null
        }
        // ...
    ]
}
```

**FASE 3 (finalized)**:

```json
{
    "sessionId": "nanoBanana_1760183659163",
    "status": "finalized",
    "segmentsCompleted": 3,
    "segmentsTotal": 3,
    "concatenatedVideo": {
        "videoId": "concat_nanoBanana_1760183659163",
        "outputPath": "output/veo3/ana-concatenated-1760184105617.mp4",
        "duration": 24
    },
    "finalVideoUrl": "http://localhost:3000/output/veo3/ana-concatenated-1760184105617.mp4",
    "finalizedAt": "2025-10-11T12:01:48.128Z"
}
```

---

## 🔄 Comparación: Antes vs Después

| Aspecto                | Antes (Monolítico)            | Después (Fases)                  |
| ---------------------- | ----------------------------- | -------------------------------- |
| **Duración total**     | 10-15 min                     | 7.6 min                          |
| **Timeouts**           | ❌ Frecuentes                 | ✅ Ninguno                       |
| **Progreso visible**   | ❌ No (todo o nada)           | ✅ Sí (33% → 67% → 100%)         |
| **Reintentos**         | ❌ Regenerar TODO             | ✅ Regenerar segmento individual |
| **Estado persistente** | ❌ Se pierde si falla         | ✅ progress.json sobrevive       |
| **Paralelizable**      | ❌ No                         | ✅ Sí (futuro)                   |
| **Cooling periods**    | ⚠️ Críticos (90s)             | ✅ Opcionales (10s)              |
| **Debugging**          | ❌ Difícil (logs monolíticos) | ✅ Fácil (logs por fase)         |

---

## 🚨 Notas Importantes

### ⚠️ NO ROMPER COMPATIBILIDAD

- ✅ El endpoint antiguo `/generate-with-nano-banana` **sigue funcionando**
- ✅ Nuevos endpoints conviven con flujo antiguo sin conflictos
- ✅ Migración gradual sin breaking changes

### 🔒 Estado de progress.json

Los estados posibles son:

1. **`prepared`**: Sesión lista, guión + imágenes generados, 0 videos generados
2. **`generating`**: Al menos 1 video generado, pero no todos (1-2/3)
3. **`completed`**: Todos los videos generados (3/3), pero no concatenados
4. **`finalized`**: Video final concatenado + logo outro

### 🛡️ Validaciones Implementadas

**FASE 1 (prepare-session)**:

- ✅ `playerData.name` requerido
- ✅ Diccionario de jugador validado (si existe `playerData.team`)

**FASE 2 (generate-segment)**:

- ✅ `sessionId` y `segmentIndex` requeridos
- ✅ `segmentIndex` debe ser 0, 1, or 2
- ✅ Sesión debe existir (progress.json)
- ✅ Sesión debe estar en estado `"prepared"` o `"generating"`
- ✅ Segmento no debe haber sido generado ya (evita duplicados)

**FASE 3 (finalize-session)**:

- ✅ `sessionId` requerido
- ✅ Sesión debe existir (progress.json)
- ✅ Todos los segmentos deben estar completos (3/3)

---

## 📝 Uso Ejemplo

### Opción 1: Script E2E Automatizado (Recomendado)

```bash
npm run veo3:test-phased
```

Este script ejecuta automáticamente las 3 fases y muestra un resumen completo.

### Opción 2: Llamadas Manuales (Debugging)

```bash
# FASE 1: Preparar sesión
curl -X POST http://localhost:3000/api/veo3/prepare-session \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {"name": "Pere Milla", "team": "Valencia CF", "price": 5.8},
    "contentType": "chollo",
    "preset": "chollo_viral"
  }'

# Response: { "sessionId": "nanoBanana_XXXXX", ... }

# FASE 2: Generar segmento 1
curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "nanoBanana_XXXXX", "segmentIndex": 0}'

# FASE 2: Generar segmento 2
curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "nanoBanana_XXXXX", "segmentIndex": 1}'

# FASE 2: Generar segmento 3
curl -X POST http://localhost:3000/api/veo3/generate-segment \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "nanoBanana_XXXXX", "segmentIndex": 2}'

# FASE 3: Finalizar sesión
curl -X POST http://localhost:3000/api/veo3/finalize-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "nanoBanana_XXXXX"}'
```

---

## 🔮 Futuros (Opcionales)

### FASE 4 (Post-producción) - PENDIENTE

**Endpoint potencial**: `POST /api/veo3/add-enhancements`

**Input**:

```json
{
    "sessionId": "nanoBanana_XXXXX",
    "enhancements": {
        "playerCard": true, // Añadir player card (segundos 3-6)
        "viralSubtitles": true, // Añadir subtítulos virales
        "instagramOptimized": true // Optimizar para Instagram Reels
    }
}
```

**Servicios a usar**:

- `playerCardOverlay.js` - Overlay de stats del jugador
- `viralCaptionsGenerator.js` - Subtítulos virales automáticos
- `hookCaptionOptimizer.js` - Optimización de hook captions

**Duración estimada**: ~30-60s **Costo**: $0 (local)

---

## ✅ Checklist Validación

- [x] ✅ FASE 1 implementada y validada
- [x] ✅ FASE 2 implementada y validada
- [x] ✅ FASE 3 implementada y validada
- [x] ✅ Test E2E ejecutado exitosamente
- [x] ✅ Video final generado (24s con logo outro)
- [x] ✅ Sin timeouts del servidor
- [x] ✅ Progreso visible (33% → 67% → 100%)
- [x] ✅ Estado persistente (progress.json)
- [x] ✅ Compatibilidad con flujo antiguo
- [x] ✅ Documentación completa
- [ ] ⏳ FASE 4 (player card + subtítulos) - PENDIENTE

---

**Documentado por**: Claude Code **Fecha**: 2025-10-11 **Estado**: ✅
ARQUITECTURA VALIDADA E2E - LISTA PARA PRODUCCIÓN

**⚠️ IMPORTANTE**: Este documento describe la arquitectura actual validada.
Cualquier cambio debe actualizarse aquí primero.
