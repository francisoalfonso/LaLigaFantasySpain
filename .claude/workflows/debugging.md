# Workflow: Debugging

## Proceso de Debugging

### 1. Identificar el Problema (2 min)
- [ ] Leer logs: `tail -f logs/server.log`
- [ ] Verificar error específico
- [ ] Identificar componente afectado

### 2. Consultar Troubleshooting (1 min)
- [ ] Leer `.claude/reference/troubleshooting.md`
- [ ] Buscar error similar
- [ ] Aplicar solución documentada

### 3. Debugging por Componente

#### A. Servidor Backend
```bash
# Verificar servidor
npm run dev

# Health check
curl http://localhost:3000/api/test/ping

# Logs detallados
tail -f logs/server.log | grep ERROR
```

#### B. VEO3 Sistema
```bash
# Ver generaciones activas
ls output/veo3/sessions/session_*/

# Ver progreso
cat output/veo3/sessions/session_*/progress.json

# Logs VEO3
grep "VEO3" logs/server.log
```

#### C. Base de Datos
```bash
# Test conexión
npm run db:test

# Verificar schema
npm run db:init
```

#### D. APIs Externas
```bash
# API-Sports
curl -H "x-apisports-key: $API_FOOTBALL_KEY" \
  "https://v3.football.api-sports.io/status"

# VEO3
grep "VEO3.*error" logs/server.log
```

### 4. Errores Comunes y Soluciones

#### Error VEO3 422 "failed"
```bash
# Verificar referencia segura
grep "Usando referencia segura" logs/server.log

# Si falta, revisar promptBuilder.js:325-359
```

#### Acento mexicano en Ana
```bash
# Verificar prompt
grep "speaks in Spanish from Spain" logs/server.log

# Debe ser lowercase, NO uppercase
```

#### Timeouts VEO3
```bash
# Verificar configuración
grep "timeout.*120000" logs/server.log

# NO reducir timeouts
```

#### Rate Limiting APIs
```bash
# Verificar delays
grep "Rate limit delay" logs/server.log

# API-Sports: 1000ms
# VEO3: 6000ms
```

### 5. Logging Avanzado

#### Winston Logger
```javascript
// ✅ CORRECTO - Logs estructurados
logger.error('Error específico', {
    component: 'VEO3',
    operation: 'generateVideo',
    error: error.message,
    context: { playerId, prompt: prompt.substring(0, 50) }
});
```

#### Debug Mode
```bash
# Activar debug
DEBUG=* npm run dev

# Solo VEO3
DEBUG=veo3* npm run dev
```

### 6. Herramientas de Debugging

#### Network Requests
```bash
# Ver requests API-Sports
grep "API-Sports request" logs/server.log

# Ver responses
grep "API-Sports response" logs/server.log
```

#### Performance
```bash
# Tiempos de respuesta
grep "duration" logs/server.log

# Rate limiting
grep "Rate limit" logs/server.log
```

### 7. Escalación

#### Si no se resuelve en 15 min:
1. Documentar error en `.claude/status/DECISIONS-LOG.md`
2. Crear issue con:
   - Error específico
   - Logs relevantes
   - Pasos para reproducir
   - Contexto del problema

#### Errores Críticos:
- VEO3 sistema caído
- Base de datos no responde
- Rate limiting excedido

### 8. Prevención

#### Monitoreo Proactivo
```bash
# Verificar métricas cada hora
grep "API metrics" logs/server.log

# Verificar rate limits
grep "Rate limit usage" logs/server.log
```

#### Health Checks
```bash
# Automatizar checks
curl http://localhost:3000/api/test/ping
curl http://localhost:3000/api/test/database
curl http://localhost:3000/api/test/veo3
```

---

**Tiempo estimado**: 5-15 min
**Regla de oro**: **LOG PRIMERO, DEBUG DESPUÉS**


