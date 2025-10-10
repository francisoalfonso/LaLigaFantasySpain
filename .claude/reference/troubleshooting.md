# Troubleshooting - Fantasy La Liga Pro

## 🚨 Problemas Comunes y Soluciones

### VEO3 Sistema

#### Error 422 "failed" - Generación Fallida
**Síntomas**: VEO3 retorna error 422 con mensaje "failed"

**Causas**:
1. Nombres de jugadores en prompts (KIE.ai los bloquea)
2. Prompts demasiado largos (>80 palabras)
3. Referencias específicas no optimizadas

**Solución**:
```bash
# 1. Verificar referencia segura en logs
grep "Usando referencia segura" logs/server.log

# 2. Si falta, revisar promptBuilder.js líneas 325-359
# 3. Verificar prompt <80 palabras
grep "prompt.*=" logs/server.log | wc -w
```

**Prevención**: Siempre usar referencias genéricas ("el jugador", NO nombres)

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

**Causa**: Timeouts configurados muy bajos

**Solución**:
```bash
# Verificar configuración timeouts
grep "timeout.*120000" logs/server.log  # Inicial: 120s
grep "statusTimeout.*45000" logs/server.log  # Status: 45s

# NO reducir estos valores
# VEO3 necesita 4-6 min para generar
```

**Prevención**: Mantener timeouts: 120s inicial, 45s status

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

### Logs Estructurados
```bash
# Logs por componente
grep "VEO3" logs/server.log
grep "API-Sports" logs/server.log
grep "Instagram" logs/server.log
grep "Database" logs/server.log

# Logs por nivel
grep "ERROR" logs/server.log
grep "WARN" logs/server.log
grep "INFO" logs/server.log
```

### Performance Debugging
```bash
# Response times
grep "duration.*ms" logs/server.log

# Rate limiting
grep "Rate limit" logs/server.log

# Memory usage
grep "memory" logs/server.log
```

### Network Debugging
```bash
# Requests salientes
grep "request.*http" logs/server.log

# Responses entrantes
grep "response.*http" logs/server.log

# Timeouts
grep "timeout" logs/server.log
```

## 🚨 Escalación

### Cuándo Escalar
- Error persiste >15 min
- Sistema completamente caído
- Pérdida de datos
- Rate limits excedidos críticamente

### Información para Escalación
1. **Error específico**: Mensaje exacto
2. **Logs relevantes**: Últimas 50 líneas
3. **Pasos para reproducir**: Comandos exactos
4. **Contexto**: Qué estaba haciendo cuando falló
5. **Impacto**: Qué funcionalidad está afectada

### Contactos
- **Desarrollo**: Claude + Fran
- **Infraestructura**: Supabase support
- **APIs**: API-Sports support, KIE.ai support

---

**Regla de oro**: **LOG PRIMERO, DEBUG DESPUÉS**
**Tiempo máximo debugging**: 15 min antes de escalar
**Última actualización**: 2025-10-09


