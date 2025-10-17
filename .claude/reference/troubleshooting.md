# Troubleshooting - Fantasy La Liga Pro

## 🚨 Problemas Comunes y Soluciones

### VEO3 Sistema

#### VEO3 3-Phase Workflow Stuck

**Síntomas**: `progress.json` muestra estado incompleto (prepared,
generating_segment_0/1/2)

**Diagnóstico**:

```bash
# 1. Verificar progreso actual
cat output/veo3/sessions/session_[timestamp]/progress.json

# 2. Verificar logs de errores
tail -100 logs/combined-*.log | grep ERROR

# 3. Verificar archivos generados
ls -lh output/veo3/sessions/session_[timestamp]/
```

**Solución**:

```bash
# Retry failed phase usando MISMO sessionId
# - Si falló Phase 1: POST /api/veo3/prepare-session (regenera todo)
# - Si falló Phase 2 segmento N: POST /api/veo3/generate-segment {"sessionId": "...", "segmentIndex": N}
# - Si falló Phase 3: POST /api/veo3/finalize-session {"sessionId": "..."}

# El sistema preserva trabajo completado, NO regenera desde cero
```

**Prevención**: Monitorear `progress.json` en tiempo real con
`npm run veo3:monitor`

#### Error 422 "failed" - Generación Fallida

**Síntomas**: VEO3 retorna error 422 con mensaje "failed"

**Causas**:

1. Nombres de jugadores en prompts (KIE.ai los bloquea por derechos de imagen)
2. Prompts demasiado largos (>80 palabras)
3. Referencias específicas no optimizadas

**Solución**:

```bash
# 1. Verificar referencia segura en logs
grep "Usando referencia segura" logs/combined-*.log

# 2. Si falta, revisar promptBuilder.js líneas 325-359
cat backend/services/veo3/promptBuilder.js | grep -A 20 "optimizePlayerReference"

# 3. Verificar prompt <80 palabras
grep "prompt.*words" logs/combined-*.log
```

**Fix Aplicado (Oct 2025)**: Sistema automático de reemplazo de nombres

- `promptBuilder.js:325-359` reemplaza automáticamente nombres con referencias
  genéricas
- Pedri → "el centrocampista"
- Lewandowski → "el delantero"
- Success rate: 100% (era 0% antes del fix)

**Prevención**: NUNCA usar nombres directamente en prompts, sistema
auto-optimiza

#### Acento Mexicano en Ana

**Síntomas**: Ana habla con acento mexicano en lugar de español de España

**Causa**: Prompt no especifica correctamente el dialecto

**Solución**:

```bash
# Verificar prompt correcto
grep "speaks in Spanish from Spain" logs/server.log

# Debe ser lowercase, NO uppercase
# ❌ INCORRECTO: "SPEAKING IN SPANISH FROM SPAIN"
# ✅ CORRECTO: "speaks in Spanish from Spain"
```

**Prevención**: Usar siempre "speaks in Spanish from Spain" (lowercase)

#### Timeouts VEO3

**Síntomas**: Generación se cancela por timeout

**Causa**: Timeouts configurados muy bajos (legacy issue, RESUELTO con 3-phase)

**Solución (3-Phase Architecture)**:

```bash
# La arquitectura 3-phase ELIMINA timeouts
# Cada fase <5 min vs 15 min monolítico

# Si aún hay timeouts, verificar configuración:
grep "timeout.*120000" backend/services/veo3/veo3Client.js  # Inicial: 120s
grep "statusTimeout.*45000" backend/services/veo3/veo3Client.js  # Status: 45s

# Server timeout: 15 min (backend/server.js:339)
grep "timeout.*15" backend/server.js
```

**Fix Aplicado (Oct 2025)**: Arquitectura 3-phase

- Phase 1: 2-3 min (prepare-session)
- Phase 2: 3-4 min × 3 (generate-segment)
- Phase 3: 1 min (finalize-session)
- **Resultado**: Cero timeouts en producción

**Prevención**: SIEMPRE usar workflow 3-phase (`npm run veo3:test-phased`)

#### Ana Inconsistente Visualmente

**Síntomas**: Ana cambia de apariencia entre segmentos

**Causa**: Seed o imagen de referencia incorrectos

**Solución**:

```bash
# Verificar seed fijo
grep "ANA_CHARACTER_SEED.*30001" backend/config/constants.js

# Verificar imagen URL
grep "ANA_IMAGE_URL" backend/config/constants.js

# NUNCA cambiar estos valores
```

**Prevención**: Seed 30001 e imagen URL fijos (NUNCA cambiar)

#### Nano Banana Image Generation Fails

**Síntomas**: Error 400 o 422 desde Nano Banana API durante Phase 1

**Causas**:

1. Prompt demasiado complejo o largo
2. Imágenes de referencia no accesibles
3. API key inválida

**Diagnóstico**:

```bash
# Verificar logs Nano Banana
grep "NanoBananaClient" logs/combined-*.log

# Verificar imagen de referencia accesible
curl -I $ANA_IMAGE_URL

# Verificar API key
echo $NANO_BANANA_API_KEY | wc -c  # Debe ser >20 caracteres
```

**Solución**:

```bash
# 1. Verificar que ANA_IMAGE_URL es accesible públicamente
curl -o /tmp/test_ana.jpg $ANA_IMAGE_URL

# 2. Verificar prompt <80 palabras
# nanoBananaClient.js auto-trunca prompts largos

# 3. Test manual
npm run veo3:test-nano-banana
```

**Fix Aplicado (Oct 2025)**: Prompts mejorados para Nano Banana

- Seed fijo: 12500 (consistencia)
- Descripción contextual exhaustiva (40-45 palabras)
- 6 imágenes de referencia Ana
- Cost: ~$0.02 por imagen

**Prevención**: Verificar ANA_IMAGE_URL accesible antes de generar

#### Transiciones Bruscas Entre Segmentos

**Síntomas**: "Reset" visual entre segmentos (cara rara, jump cut)

**Causa**: Falta frame-to-frame transition

**Solución**:

```bash
# Verificar que frameExtractor.js está activo
grep "Extracting last frame" logs/combined-*.log

# Verificar que último frame Seg N = primer frame Seg N+1
# promptBuilder.js incluye descripción exhaustiva del último frame
```

**Fix Aplicado (Oct 2025)**: Frame-to-frame transitions

- `frameExtractor.js` extrae último frame de cada segmento
- `promptBuilder.js` usa descripción exhaustiva como primer frame del siguiente
- **Resultado**: Transiciones invisibles, no crossfade needed

**Prevención**: NUNCA desactivar frame extraction en workflow 3-phase

### API-Sports

#### Rate Limit Exceeded

**Síntomas**: Error 429 "Rate limit exceeded"

**Causa**: Demasiadas requests por minuto

**Solución**:

```bash
# Verificar rate limiting
grep "Rate limit delay" logs/server.log

# Debe ser 1000ms entre requests
# Plan Ultra: 75,000 req/día = 52 req/min
```

**Prevención**: Siempre usar `waitForRateLimit()` antes de requests

#### Temporada Incorrecta

**Síntomas**: Datos de temporada incorrecta

**Causa**: No usar season=2025

**Solución**:

```bash
# Verificar season en requests
grep "season.*2025" logs/server.log

# SIEMPRE usar season=2025 para temporada 2025-26
```

**Prevención**: Constante `SEASON_2025_26 = 2025`

### Competitive Intelligence & Outliers

#### Outlier Detection No Encuentra Videos

**Síntomas**: `npm run outliers:detect` retorna 0 videos

**Causas**:

1. Keywords demasiado específicos
2. Views threshold muy alto
3. YouTube API quota excedida

**Solución**:

```bash
# 1. Verificar quota YouTube API
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=fantasy+laliga&type=video&key=$YOUTUBE_API_KEY"

# 2. Bajar threshold de views
# outlierDetectorScheduler.js: minViews = 5000 (default)

# 3. Test manual con keywords amplios
npm run outliers:test-e2e
```

#### Transcription Service Fails

**Síntomas**: Error al transcribir audio de YouTube video

**Causas**:

1. OpenAI API key inválida
2. Audio muy largo (>25MB)
3. Formato no soportado

**Solución**:

```bash
# Verificar API key
echo $OPENAI_API_KEY

# Verificar tamaño audio
ls -lh temp/audio_*.mp3

# Test Whisper API
npm run outliers:test-complete
```

**Prevención**: Verificar OpenAI API key antes de onboarding

### Base de Datos

#### Conexión Fallida

**Síntomas**: Error "Connection failed" o timeout

**Causa**: Variables de entorno incorrectas o BD caída

**Solución**:

```bash
# Test conexión
npm run db:test

# Verificar variables
echo $SUPABASE_PROJECT_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Verificar BD activa
curl http://localhost:3000/api/test/database
```

**Prevención**: Health checks regulares

#### Missing Outliers Tables

**Síntomas**: Error "relation 'outlier_videos' does not exist"

**Causa**: Schema outliers no aplicado

**Solución**:

```bash
# Aplicar migration outliers
npm run outliers:migrate

# Verificar schema
npm run db:verify-competitive
```

**Prevención**: Siempre ejecutar migrations después de pull

#### Schema Desactualizado

**Síntomas**: Error "relation does not exist"

**Causa**: Schema no sincronizado

**Solución**:

```bash
# Actualizar schema
npm run db:init

# Verificar archivos
# - database/supabase-schema.sql
# - database/init-database.js
```

**Prevención**: Siempre actualizar ambos archivos

### Servidor Backend

#### Puerto 3000 Ocupado

**Síntomas**: Error "EADDRINUSE: address already in use"

**Solución**:

```bash
# Encontrar proceso
lsof -ti:3000

# Matar proceso
kill -9 $(lsof -ti:3000)

# O usar otro puerto
PORT=3001 npm run dev
```

#### Memory Leak

**Síntomas**: Servidor consume mucha memoria

**Solución**:

```bash
# Verificar memoria
ps aux | grep "node.*server.js"

# Restart servidor
pm2 restart fantasy-la-liga

# O kill y restart
kill -9 $(pgrep -f "node.*server.js")
npm run dev
```

### Instagram Preview

#### Preview No Genera

**Síntomas**: Endpoint `/api/instagram/preview-viral` falla

**Causa**: Datos de jugador incompletos

**Solución**:

```bash
# Verificar datos requeridos
curl -X POST http://localhost:3000/api/instagram/preview-viral \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {
      "name": "Pedri",
      "team": "Barcelona",
      "price": 8.5,
      "points": 32
    },
    "contentType": "chollo"
  }'
```

#### Score Viral Bajo

**Síntomas**: Score <60 puntos

**Causa**: Contenido no optimizado para viralidad

**Solución**: Revisar 11 criterios en `viralContentService.js`:

1. Hook impactante (15 pts)
2. Datos específicos (15 pts)
3. Urgencia temporal (10 pts)
4. Comparación precio (10 pts)
5. Estadísticas recientes (10 pts)
6. Emociones (10 pts)
7. Call-to-action claro (10 pts)
8. Longitud óptima (5 pts)
9. Hashtags relevantes (5 pts)
10. Timing publicación (5 pts)
11. Engagement potencial (5 pts)

## 🔍 Debugging Avanzado

### VEO3 3-Phase Debugging Workflow

```bash
# 1. Verificar estado actual
cat output/veo3/sessions/session_[timestamp]/progress.json | jq

# 2. Verificar logs por fase
grep "Phase 1" logs/combined-*.log  # Preparación
grep "Phase 2" logs/combined-*.log  # Generación segmentos
grep "Phase 3" logs/combined-*.log  # Finalización

# 3. Verificar archivos generados por fase
ls -lh output/veo3/sessions/session_[timestamp]/

# Phase 1 debe tener:
# - script.json
# - ana_context_seg0.jpg, ana_context_seg1.jpg, ana_context_seg2.jpg
# - progress.json (status: "prepared")

# Phase 2 debe tener (después de cada segmento):
# - segment_0.mp4, segment_1.mp4, segment_2.mp4
# - last_frame_seg0.jpg, last_frame_seg1.jpg
# - progress.json (status: "segment_N_completed")

# Phase 3 debe tener:
# - final_video.mp4
# - final_video_with_logo.mp4
# - progress.json (status: "completed")
```

### Logs Estructurados

```bash
# Logs por componente
grep "VEO3" logs/combined-*.log
grep "NanoBanana" logs/combined-*.log
grep "API-Sports" logs/combined-*.log
grep "Instagram" logs/combined-*.log
grep "Outlier" logs/combined-*.log
grep "Database" logs/combined-*.log

# Logs por nivel
grep "ERROR" logs/combined-*.log
grep "WARN" logs/combined-*.log
grep "INFO" logs/combined-*.log
```

### Performance Debugging

```bash
# Response times
grep "duration.*ms" logs/combined-*.log

# Rate limiting
grep "Rate limit" logs/combined-*.log

# Memory usage
grep "memory" logs/combined-*.log

# VEO3 phase timings
grep "Phase.*completed in" logs/combined-*.log
```

### Network Debugging

```bash
# Requests salientes
grep "request.*http" logs/combined-*.log

# Responses entrantes
grep "response.*http" logs/combined-*.log

# Timeouts
grep "timeout" logs/combined-*.log

# KIE.ai API calls
grep "KIE.ai.*request" logs/combined-*.log

# Nano Banana API calls
grep "NanoBanana.*request" logs/combined-*.log
```

### Outlier Detection Debugging

```bash
# Verificar detección hourly
grep "Outlier detection scheduled" logs/combined-*.log

# Verificar videos encontrados
grep "Found.*outlier videos" logs/combined-*.log

# Verificar transcriptions
grep "Transcription completed" logs/combined-*.log

# Verificar content analysis
grep "Content analysis completed" logs/combined-*.log
```

## 🔧 Quick Fixes (Aplicados Oct 2025)

### Fix #1: Error 422 "Names not allowed"

**Problema**: 100% failure rate por nombres de jugadores **Solución**:
Diccionario automático de referencias genéricas (`promptBuilder.js:325-359`)
**Resultado**: 100% success rate

### Fix #2: Server Timeouts

**Problema**: 15 min generación monolítica excedía timeouts **Solución**:
Arquitectura 3-phase (3×4 min requests vs 1×15 min) **Resultado**: Cero timeouts
en producción

### Fix #3: Ana Acento Mexicano

**Problema**: Prompt incorrecto ("SPEAKING" uppercase) **Solución**: "speaks in
Spanish from Spain" (lowercase) forzado en todos los prompts **Resultado**:
Acento castellano 100% consistente

### Fix #4: Transiciones Bruscas

**Problema**: "Reset" visual entre segmentos **Solución**: Frame-to-frame
transitions (`frameExtractor.js` + descripciones exhaustivas) **Resultado**:
Transiciones invisibles sin crossfade

**Ver**: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md` para detalles completos

## 🚨 Escalación

### Cuándo Escalar

- Error persiste >15 min
- Sistema completamente caído
- Pérdida de datos
- Rate limits excedidos críticamente
- VEO3 3-phase workflow stuck en múltiples sesiones

### Información para Escalación

1. **Error específico**: Mensaje exacto + código
2. **Logs relevantes**: Últimas 100 líneas (`tail -100 logs/combined-*.log`)
3. **Pasos para reproducir**: Comandos exactos (curl o npm script)
4. **Contexto**: Qué estaba haciendo cuando falló
5. **Impacto**: Qué funcionalidad está afectada
6. **Session ID**: Si es VEO3, incluir sessionId para debugging
7. **Progress.json**: Estado actual si es workflow 3-phase

### Contactos

- **Desarrollo**: Claude Code + Fran
- **Infraestructura**: Supabase support (https://supabase.com/support)
- **APIs**:
    - API-Sports support (support@api-sports.io)
    - KIE.ai support (support@kie.ai)
    - OpenAI support (help.openai.com)

### Emergency Restart

```bash
# 1. Kill todos los procesos Node
pkill -f "node.*server.js"

# 2. Limpiar archivos temporales
rm -rf temp/*
rm -rf output/veo3/sessions/session_*_incomplete*

# 3. Restart servidor
npm run dev

# 4. Health check
curl http://localhost:3000/api/test/ping
```

---

**Regla de oro**: **LOG PRIMERO, DEBUG DESPUÉS** **Tiempo máximo debugging**: 15
min antes de escalar **Última actualización**: 2025-10-16 **Fixes aplicados**: 4
(Error 422, Timeouts, Acento, Transiciones)
