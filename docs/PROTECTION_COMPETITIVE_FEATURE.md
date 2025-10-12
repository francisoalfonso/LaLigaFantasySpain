# 🛡️ Protección del Sistema VEO3 Estable

**Fecha creación**: 12 Oct 2025 **Feature nueva**: Competitive YouTube Analyzer
**Sistema protegido**: VEO3 3-Phase Workflow (11 Oct 2025)

---

## 📋 Estado de Protección

### ✅ Backups Creados

```bash
# Git Tag (punto de restauración)
v1.0-stable-11oct2025

# Branch de Backup (inmutable)
backup/veo3-stable-11oct2025

# Branch de Desarrollo (feature nueva)
feature/competitive-youtube-analyzer
```

### 🔐 Commits Protegidos

```
edac414 - 🔧 Fix: Ana Image URL - Sincronizar con NanoBanana referencias
          ⚠️ CAMBIO NO TESTEADO AÚN - Primera revisión si hay problemas
3378286 - 🎯 HITO 11 OCT 2025: Sistema Instagram VEO3 Estable + Mejoras Finales
          ✅ ÚLTIMO COMMIT 100% FUNCIONAL PROBADO
7d679d3 - 🎨 Player Card: Fix Transparencia Real (50% Opacidad + Canal Alpha)
```

### ⚠️ CAMBIO NO TESTEADO (12 Oct 2025)

**Commit `edac414` - Ana Image URL**:

- **Cambio**: ANA_IMAGE_URL actualizada de `ana-estudio-01.jpeg` →
  `ana-peinido2-03.png`
- **Motivo**: Fix health check (URL anterior retornaba HTTP 400)
- **Health check**: ✅ Pasa (HTTP 200)
- **Generación VEO3**: ❌ **NO TESTEADO AÚN**
- **Estado antes del cambio**: ✅ **TODO FUNCIONABA 100%**

**IMPLICACIÓN CRÍTICA**:

- Si hay CUALQUIER problema con generación VEO3, **este cambio debe ser el
  PRIMER punto de revisión**
- Rollback fácil: `git revert edac414` o usar imagen anterior en `.env`

**Rollback del cambio de imagen (si necesario)**:

```bash
# Opción 1: Revertir commit
git revert edac414

# Opción 2: Cambiar .env manualmente (más rápido)
# Editar .env y cambiar de vuelta:
ANA_IMAGE_URL=https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/object/public/ana-images/ana-estudio-01.jpeg

# Reiniciar servidor
npm run dev
```

**Recomendación**: Antes de continuar con feature nueva, testear generación
completa con imagen actual.

---

## 🚫 Archivos CRÍTICOS - NO MODIFICAR

Estos archivos están **100% funcionales** y **NO deben modificarse** para la
nueva feature:

### Core VEO3 Services (backend/services/veo3/)

```
❌ NO TOCAR:
- veo3Client.js                      # Cliente KIE.ai - CRÍTICO
- unifiedScriptGenerator.js         # Generación guiones - FUNCIONA PERFECTO
- promptBuilder.js                   # Construcción prompts VEO3 - OPTIMIZADO
- viralVideoBuilder.js               # Builder multi-segmento - ESTABLE
- videoConcatenator.js               # Concatenación FFmpeg - FUNCIONA
- nanoBananaVeo3Integrator.js        # Integración Nano Banana - WORKING
- playerCardOverlay.js               # Overlays stats - OPERATIVO
- captionsService.js                 # Subtítulos karaoke - FUNCIONA
- emotionAnalyzer.js                 # Análisis emociones - ESTABLE
- cinematicProgressionSystem.js     # Progresión shots - WORKING
- audioAnalyzer.js                   # Análisis audio - FUNCIONA
- threeSegmentGenerator.js          # Generador 3 segmentos - ESTABLE
```

### VEO3 Routes (backend/routes/)

```
⚠️ MODIFICACIÓN MÍNIMA PERMITIDA (solo extensión):
- veo3.js                            # Endpoints prepare/generate/finalize

  ✅ PERMITIDO: Añadir parámetro opcional `customScript` en prepare-session
  ❌ NO TOCAR: Lógica existente de generación

  Líneas críticas NO modificar:
  - 1772-2034: POST /prepare-session (FASE 1)
  - 2036-2294: POST /generate-segment (FASE 2)
  - 2296-2493: POST /finalize-session (FASE 3)
```

### Configuration Files

```
⚠️ SOLO LECTURA:
- backend/config/veo3/anaCharacter.js    # Character Bible - INMUTABLE
- backend/config/constants.js            # Season 2025-26 - FIXED
- data/flp-nano-banana-config.json       # Referencias Ana - WORKING
```

### Support Services (NO TOCAR)

```
❌ NO MODIFICAR:
- backend/services/bargainAnalyzer.js    # Chollos - FUNCIONA
- backend/services/apiFootball.js        # API-Sports - ESTABLE
- backend/services/nanoBanana/nanoBananaClient.js  # Nano Banana - WORKING
```

---

## ✅ Estrategia de Extensión (NO Modificación)

### Principio: **Extensión sobre Modificación**

**Crear NUEVOS archivos** en lugar de modificar existentes:

### 1. Nuevos Servicios (crear desde cero)

```
✅ CREAR NUEVOS:
backend/services/contentAnalysis/
  ├── transcriptionService.js         # Whisper AI integration
  ├── contentAnalyzer.js              # Claude API analysis
  ├── youtubeMonitor.js               # YouTube Data API v3
  └── responseScriptGenerator.js      # Custom script generation
```

### 2. Nuevas Routes (crear nuevas)

```
✅ CREAR NUEVAS:
backend/routes/
  ├── contentAnalysis.js              # POST /api/content/analyze-youtube
  └── competitiveChannels.js          # CRUD de canales monitorizados
```

### 3. Extensión de VEO3 (mínima modificación)

**backend/routes/veo3.js - Línea ~1780 (prepare-session)**

```javascript
// ✅ ANTES (NO TOCAR):
router.post('/prepare-session', async (req, res) => {
    const { contentType, playerData, preset, viralData } = req.body;

    // Generar guión con UnifiedScriptGenerator
    const script = await scriptGenerator.generate(...);

    // Continuar workflow...
});

// ✅ DESPUÉS (EXTENSIÓN SEGURA):
router.post('/prepare-session', async (req, res) => {
    const {
        contentType,
        playerData,
        preset,
        viralData,
        customScript  // ← NUEVO parámetro opcional
    } = req.body;

    // Si customScript existe, usar ese; si no, generar normal
    const script = customScript || await scriptGenerator.generate(...);

    // ✅ Resto del código SIN CAMBIOS
    // Continuar workflow normal...
});
```

**Modificación**: Solo añadir 2 líneas, NO tocar lógica existente.

### 4. Nueva Base de Datos (tablas independientes)

```sql
-- ✅ CREAR NUEVAS TABLAS (NO modificar existentes):

CREATE TABLE competitive_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_url text NOT NULL,
  channel_id text NOT NULL,
  channel_name text,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 3,
  content_type text,
  monitoring_frequency text DEFAULT '1h',
  videos_processed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE competitive_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES competitive_channels(id),
  video_id text NOT NULL,
  video_url text NOT NULL,
  title text,
  published_at timestamptz,
  detected_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  processing_status text DEFAULT 'pending',
  transcription jsonb,
  analysis jsonb,
  our_response_session_id text,
  quality_score float,
  created_at timestamptz DEFAULT now()
);
```

**NO tocar tablas existentes**: `players`, `bargains`, `fixtures`, etc.

---

## 🔄 Plan de Rollback (Si algo falla)

### Opción 1: Rollback Total (volver a sistema estable)

```bash
# 1. Cambiar al tag estable
git checkout v1.0-stable-11oct2025

# 2. Crear nueva branch desde tag
git checkout -b main-restored

# 3. Forzar push (CUIDADO - confirmar primero)
git push origin main-restored:main --force

# Sistema restaurado al estado 11 Oct 2025
```

### Opción 2: Rollback Parcial (mantener fix de Ana URL)

```bash
# 1. Ir al commit específico (después del fix Ana URL)
git checkout edac414

# 2. Crear branch
git checkout -b main-with-ana-fix

# 3. Merge selectivo si es necesario
git cherry-pick <commits específicos que funcionan>
```

### Opción 3: Revert de Feature (si ya mergeada)

```bash
# 1. Revertir merge de feature
git revert -m 1 <merge-commit-hash>

# 2. Push del revert
git push origin main

# Sistema vuelve a estado pre-feature manteniendo historial
```

### Opción 4: Branch Swap (cambio rápido)

```bash
# 1. Cambiar a branch de backup
git checkout backup/veo3-stable-11oct2025

# 2. Verificar que funciona
npm run dev
curl http://localhost:3000/api/veo3/health

# 3. Si OK, hacer este branch el nuevo main
git branch -D main
git checkout -b main
git push origin main --force
```

---

## ✅ Checklist Pre-Desarrollo

Antes de escribir CUALQUIER código nuevo, confirmar:

```
☑️ Tag v1.0-stable-11oct2025 creado
☑️ Branch backup/veo3-stable-11oct2025 creado
☑️ Branch feature/competitive-youtube-analyzer creado
☑️ Lista de archivos NO TOCAR revisada
☑️ Estrategia de extensión clara (nuevos servicios, no modificar existentes)
☑️ Plan de rollback documentado
☑️ Sistema actual testeado y funcionando 100%
☑️ Usuario (Fran) ha revisado y aprobado este documento
```

---

## 🧪 Testing Pre-Feature

Antes de empezar desarrollo, **confirmar que sistema actual funciona**:

```bash
# 1. Health check general
curl http://localhost:3000/api/test/ping

# 2. Health check VEO3
curl http://localhost:3000/api/veo3/health

# 3. Test preparación sesión (NO generar video, solo preparar)
curl -X POST http://localhost:3000/api/veo3/prepare-session \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "chollo_viral",
    "preset": "chollo_viral",
    "playerData": {
      "name": "Test Player",
      "price": 8.5,
      "position": "Centrocampista"
    }
  }'

# Esperado: 200 OK con sessionId
```

**Si TODOS los tests pasan** → OK iniciar desarrollo **Si ALGUNO falla** → NO
iniciar, investigar primero

---

## 📊 Métricas de Seguridad

| Métrica                           | Valor | Status       |
| --------------------------------- | ----- | ------------ |
| Commits protegidos                | 3     | ✅           |
| Branches backup                   | 1     | ✅           |
| Tags creados                      | 1     | ✅           |
| Archivos NO TOCAR                 | 18    | ✅           |
| Nuevos servicios (extensión)      | 4     | 📝 Pendiente |
| Modificaciones mínimas permitidas | 1     | 📝 Pendiente |
| Líneas de código a modificar      | ~2    | 📝 Pendiente |
| Riesgo estimado                   | BAJO  | ✅           |

---

## 🚨 Reglas de Oro

1. **NUNCA** modificar archivos de la lista "NO TOCAR"
2. **SIEMPRE** crear nuevos servicios en lugar de modificar existentes
3. **SOLO** añadir parámetros opcionales (backward compatible)
4. **TESTEAR** en branch feature antes de merge a main
5. **SI ALGO FALLA** → Rollback inmediato sin dudar
6. **PEDIR CONFIRMACIÓN** a Fran antes de merge a main

---

## 📝 Aprobación

**Usuario**: Fran **Fecha**: ******\_****** **Firma**: ******\_******

**Confirmación**:

- [ ] He revisado todos los archivos protegidos
- [ ] Entiendo la estrategia de extensión
- [ ] Conozco el plan de rollback
- [ ] Autorizo inicio de desarrollo de feature

---

**Última actualización**: 12 Oct 2025 **Documento**:
PROTECTION_COMPETITIVE_FEATURE.md **Status**: ✅ LISTO PARA APROBACIÓN
