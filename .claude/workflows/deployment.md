# Workflow: Deployment

## Proceso de Deployment

### 1. Pre-deployment Checklist (5 min)

#### Código Quality
- [ ] ESLint pasa: `npm run lint`
- [ ] Tests pasan: `npm test`
- [ ] No `console.log` en código
- [ ] Winston logger usado correctamente

#### APIs y Rate Limiting
- [ ] Rate limiting aplicado en todas las APIs
- [ ] Error handling robusto
- [ ] Timeouts configurados correctamente
- [ ] Documentación oficial descargada

#### VEO3 Sistema
- [ ] Seed 30001 configurado
- [ ] Prompts <80 palabras
- [ ] Referencias genéricas (NO nombres jugadores)
- [ ] Timeouts: 120s inicial, 45s status

#### Base de Datos
- [ ] Schema actualizado: `database/supabase-schema.sql`
- [ ] Init script actualizado: `database/init-database.js`
- [ ] Migraciones aplicadas

### 2. Environment Variables

#### Producción
```bash
# APIs
API_FOOTBALL_KEY=your_production_key
KIE_AI_API_KEY=your_production_key
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# VEO3
VEO3_DEFAULT_MODEL=veo3_fast
VEO3_MAX_DURATION=8
VEO3_DEFAULT_ASPECT=9:16

# Bunny.net
BUNNY_STREAM_API_KEY=your_production_key
BUNNY_STREAM_LIBRARY_ID=your_library_id
```

#### Verificar Variables
```bash
# Test conexiones
curl -H "x-apisports-key: $API_FOOTBALL_KEY" \
  "https://v3.football.api-sports.io/status"

# Test Supabase
npm run db:test
```

### 3. Database Migration

#### Schema Updates
```bash
# 1. Actualizar schema
vim database/supabase-schema.sql

# 2. Actualizar init script
vim database/init-database.js

# 3. Aplicar cambios
npm run db:init
```

#### Backup Before Migration
```bash
# Backup datos críticos
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. VEO3 System Check

#### Character Consistency
```bash
# Verificar Ana seed
grep "ANA_CHARACTER_SEED.*30001" backend/config/constants.js

# Verificar imagen URL
grep "ANA_IMAGE_URL" backend/config/constants.js
```

#### Prompts Optimization
```bash
# Verificar prompts <80 palabras
grep -r "prompt.*=" backend/services/veo3/ | wc -w
```

### 5. API Rate Limits

#### Verificar Configuración
```bash
# API-Sports: 1000ms delay
grep "rateLimitDelay.*1000" backend/services/

# VEO3: 6000ms delay  
grep "VEO3_REQUEST_DELAY.*6000" backend/services/

# OpenAI: 100ms delay
grep "GPT5_RATE_LIMIT.*100" backend/services/
```

### 6. Health Checks

#### Endpoints de Verificación
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

### 7. Monitoring Setup

#### Logs Estructurados
```javascript
// Verificar Winston config
logger.info('Deployment successful', {
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
});
```

#### Métricas
```bash
# Verificar métricas cada hora
grep "API metrics" logs/server.log
grep "VEO3 metrics" logs/server.log
```

### 8. Rollback Plan

#### Si algo falla:
1. **Detener servicio**: `pm2 stop fantasy-la-liga`
2. **Restaurar backup**: `pg_restore backup_file.sql`
3. **Revertir código**: `git revert HEAD`
4. **Restart**: `pm2 start fantasy-la-liga`

#### Rollback Triggers:
- Error rate >5%
- Response time >10s
- VEO3 success rate <50%
- Database connection failures

### 9. Post-deployment Verification

#### Funcionalidad Crítica
- [ ] Preview Instagram funciona
- [ ] VEO3 genera videos correctamente
- [ ] Ana mantiene consistencia visual
- [ ] Rate limiting funciona
- [ ] Base de datos responde

#### Performance
- [ ] Response time <2s
- [ ] VEO3 success rate >90%
- [ ] API error rate <1%
- [ ] Memory usage estable

### 10. Documentation Update

#### Actualizar Status
- [ ] `.claude/status/CURRENT-SPRINT.md`
- [ ] `.claude/status/PRIORITIES.md`
- [ ] `.claude/status/DECISIONS-LOG.md`

#### Changelog
```markdown
## [2.0.1] - 2025-10-09
### Added
- Nueva funcionalidad X
### Fixed
- Bug Y resuelto
### Changed
- Optimización Z
```

---

**Tiempo estimado**: 30-45 min
**Regla de oro**: **VERIFICAR TODO ANTES DE DEPLOY**





