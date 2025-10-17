# Comandos Útiles - Fantasy La Liga Pro

## 🔄 Auto-Guardado y Cierre de Sesión

### Auto-Guardado

```bash
# Auto-guardado completo
npm run session-close

# Solo auto-guardado
npm run auto-save

# Verificar estado
curl http://localhost:3000/api/test/ping
```

### Cierre de Sesión

```bash
# Proceso completo de cierre
npm run session-close

# Verificar que todo está guardado en GitHub
git status
git log -1 --oneline
```

## 🚀 Comandos de Desarrollo

### Servidor

```bash
# Iniciar servidor desarrollo
npm run dev

# Servidor con debug
DEBUG=* npm run dev

# Solo VEO3 debug
DEBUG=veo3* npm run dev
```

### Quality Assurance

```bash
# ESLint
npm run lint

# Prettier
npm run format

# Tests
npm test

# Coverage
npm run test:coverage
```

## 🗄️ Base de Datos

### Inicialización

```bash
# Inicializar BD
npm run db:init

# Test conexión
npm run db:test

# Reset BD (cuidado!)
npm run db:reset
```

### Supabase

```bash
# Login Supabase
npx supabase login

# Start local Supabase
npx supabase start

# Generate types
npx supabase gen types typescript --local > types/supabase.ts
```

## 🎬 VEO3 Sistema

### Generación Videos (3-Phase) ⭐ RECOMENDADO

```bash
# E2E test 3-phase workflow
npm run veo3:test-phased

# Complete chollo workflow
npm run veo3:e2e-chollo

# Test Nano Banana integration
npm run veo3:test-nano-banana

# Monitor generaciones activas
npm run veo3:monitor

# Test Carlos stats video
npm run veo3:test-carlos
```

### Generación Videos (Legacy)

```bash
# Generar video Ana (single-phase)
npm run veo3:generate-ana

# Test retry sistema
npm run veo3:test-retry-v3

# Test optimized prompt builder
npm run veo3:test-optimized
```

### Debugging VEO3

```bash
# Ver progreso sesión específica
cat output/veo3/sessions/session_[timestamp]/progress.json

# Watch progress en tiempo real
watch -n 5 cat output/veo3/sessions/session_[timestamp]/progress.json

# Logs VEO3
grep "VEO3" logs/combined-*.log

# Verificar referencia segura (player names)
grep "Usando referencia segura" logs/combined-*.log

# Verificar timeouts configurados
grep "timeout.*120000" backend/services/veo3/veo3Client.js
```

### Testing VEO3

```bash
# Test fase por fase
npm run veo3:test-phased       # Test completo 3 fases
npm run veo3:test-phase4       # Test phase 4 enhancements
npm run veo3:test-black-flashes # Test detección flashes negros

# Cleanup
npm run veo3:delete-bad-images  # Eliminar imágenes problemáticas
```

## 🎯 Competitive Intelligence & Outliers

### Outlier Detection

```bash
# Test E2E outlier detection
npm run outliers:test-e2e

# Test complete workflow
npm run outliers:test-complete

# Manual detection via API
npm run outliers:detect    # curl wrapper
npm run outliers:list      # List all outliers
npm run outliers:stats     # Statistics
```

### Outlier Migration

```bash
# Apply outliers schema migration
npm run outliers:migrate
```

## 🌐 APIs Externas

### API-Sports

```bash
# Test API-Sports
curl -H "x-apisports-key: $API_FOOTBALL_KEY" \
  "https://v3.football.api-sports.io/status"

# Obtener jugador temporada 2025-26
curl -H "x-apisports-key: $API_FOOTBALL_KEY" \
  "https://v3.football.api-sports.io/players?id=521&season=2025"

# Sync player photos
npm run sync:player-photos
```

### Health Checks

```bash
# Servidor
curl http://localhost:3000/api/test/ping

# Base de datos
curl http://localhost:3000/api/test/database

# VEO3
curl http://localhost:3000/api/test/veo3

# APIs externas
curl http://localhost:3000/api/test/apis
```

## 📊 Monitoreo y Logs

### Logs

```bash
# Logs en tiempo real
tail -f logs/server.log

# Logs VEO3
tail -f logs/server.log | grep VEO3

# Logs errores
tail -f logs/server.log | grep ERROR

# Logs API-Sports
tail -f logs/server.log | grep "API-Sports"
```

### Métricas

```bash
# Ver métricas
grep "API metrics" logs/server.log

# Rate limiting
grep "Rate limit" logs/server.log

# Performance
grep "duration" logs/server.log
```

## 🔧 Herramientas de Debugging

### Network

```bash
# Ver requests API-Sports
grep "API-Sports request" logs/server.log

# Ver responses
grep "API-Sports response" logs/server.log

# Ver timeouts
grep "timeout" logs/server.log
```

### VEO3 Debugging

```bash
# Verificar configuración
grep "ANA_CHARACTER_SEED.*30001" backend/config/constants.js

# Verificar prompts
grep "speaks in Spanish from Spain" logs/server.log

# Verificar timeouts
grep "timeout.*120000" logs/server.log
```

## 📁 Gestión de Archivos

### Limpieza

```bash
# Limpiar logs antiguos
find logs/ -name "*.log" -mtime +7 -delete

# Limpiar sesiones VEO3 antiguas
find output/veo3/sessions/ -mtime +3 -exec rm -rf {} \;

# Limpiar archivos temporales
rm -rf temp/*
```

### Backup

```bash
# Backup BD
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup logs
tar -czf logs_backup_$(date +%Y%m%d).tar.gz logs/

# Backup sesiones VEO3
tar -czf veo3_sessions_$(date +%Y%m%d).tar.gz output/veo3/sessions/
```

## 🎯 Comandos Específicos

### Instagram Preview

```bash
# Test preview viral
curl -X POST http://localhost:3000/api/instagram/preview-viral \
  -H "Content-Type: application/json" \
  -d '{"playerData":{"name":"Pedri","price":8.5},"contentType":"chollo"}'
```

### Fantasy Evolution

```bash
# Test evolución jugador
curl http://localhost:3000/api/evolution/player/521

# Test sistema evolución
curl http://localhost:3000/api/evolution/test
```

### Test History

```bash
# Ver historial
curl http://localhost:3000/api/test-history

# Crear test
curl -X POST http://localhost:3000/api/test-history \
  -H "Content-Type: application/json" \
  -d '{"testType":"veo3","description":"Test generación"}'
```

## 🔍 Búsquedas Útiles

### Código

```bash
# Buscar console.log (NO debería haber)
grep -r "console.log" backend/

# Buscar secrets hardcodeados
grep -r "api.*key.*=" backend/

# Buscar rate limiting
grep -r "rateLimit" backend/
```

### Logs

```bash
# Buscar errores VEO3
grep "VEO3.*error" logs/server.log

# Buscar rate limit exceeded
grep "Rate limit exceeded" logs/server.log

# Buscar timeouts
grep "timeout" logs/server.log
```

## 📈 Performance

### Monitoreo

```bash
# CPU usage
top -p $(pgrep -f "node.*server.js")

# Memory usage
ps aux | grep "node.*server.js"

# Disk usage
du -sh logs/ output/ temp/
```

### Optimización

```bash
# Verificar rate limits
grep "Rate limit delay" logs/server.log

# Verificar cache hits
grep "cache hit" logs/server.log

# Verificar response times
grep "duration.*ms" logs/server.log
```

---

## 🚀 Workflows Completos

### VEO3 3-Phase Workflow

```bash
# 1. Preparar sesión
curl -X POST http://localhost:3000/api/veo3/prepare-session \
  -H "Content-Type: application/json" \
  -d '{"playerData":{...},"contentType":"chollo_viral"}'

# 2. Generar segmentos (×3)
for i in 0 1 2; do
  curl -X POST http://localhost:3000/api/veo3/generate-segment \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"session_...\",\"segmentIndex\":$i}"
done

# 3. Finalizar
curl -X POST http://localhost:3000/api/veo3/finalize-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session_..."}'
```

### Instagram E2E Workflow

```bash
# Test E2E Instagram chollos
npm run instagram:test-e2e

# Upload studio backgrounds
npm run upload:studio-backgrounds

# Add viral captions
npm run veo3:add-captions-carlos
```

### n8n Workflows

```bash
# Check n8n versions
npm run n8n:check-versions

# Daily version check
npm run n8n:version-daily
```

---

**Comandos más usados**:

- `npm run dev` (desarrollo)
- `npm run veo3:test-phased` (test VEO3)
- `npm run quality` (pre-commit)
- `tail -f logs/combined-*.log` (logs)

**Última actualización**: 2025-10-16 **Nuevos scripts**: veo3:test-phased,
outliers:\*, veo3:e2e-chollo
