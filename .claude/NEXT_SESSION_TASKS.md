# 🎯 TAREAS PRÓXIMA SESIÓN - 7 de octubre de 2025

**Última actualización**: 7 de octubre de 2025, 00:25h
**Sesión anterior**: BargainAnalyzer V2.0 Fase 1 completada al 100%

---

## ✅ LO QUE SE COMPLETÓ HOY

### BargainAnalyzer V2.0 - Fase 1 (100% COMPLETA)

1. ✅ **Stats DAZN 2025-26** - Sistema oficial 20+ categorías
2. ✅ **Team Tier Classification** - top/mid/low equipos
3. ✅ **Form Multiplier** - Últimos 5 partidos (0.8x-1.3x)
4. ✅ **Cache System** - RecentMatchesCache (100x performance)
5. ✅ **Fixture Difficulty** - Calendario próximos 3 rivales (0.85x-1.15x)

**Documentación creada**:
- `STATUS/FASE_1_COMPLETADA_100.md`
- `STATUS/CALIBRACION_PRECIOS_APLICADA.md`
- `STATUS/CACHE_SYSTEM_IMPLEMENTADO.md`
- `STATUS/FIXTURE_DIFFICULTY_IMPLEMENTADO.md`
- `STATUS/BARGAIN_ANALYZER_V2_FASE_1_COMPLETA.md`

---

## 🔥 PRIORIDAD 1 - EMPEZAR MAÑANA

### 1. Validación BargainAnalyzer con Datos Reales

**Bloqueador actual**: Temporada 2025-26 recién comenzó, pocos partidos jugados

**Opciones mañana**:

#### Opción A: Test con datos temporada 2024 (RECOMENDADO)
```bash
# Crear script que use season=2024 para validar algoritmo
# Pros: Datos completos disponibles
# Contras: No refleja sistema actual 2025-26
```

**Pasos**:
1. Crear `scripts/bargains/test-v2-validation-2024.js`
2. Modificar temporalmente `apiFootball.js` para usar season=2024
3. Ejecutar identifyBargains() con top 50 jugadores
4. Comparar estimaciones vs precios reales Fantasy 2024
5. Calcular error real puntos/precio
6. Revertir a season=2025

**Tiempo estimado**: 45 minutos

#### Opción B: Esperar a jornada 10+ (noviembre 2025)
- Validación bloqueada hasta que haya 10+ partidos por jugador
- Mientras tanto, confiar en lógica implementada

**Decisión recomendada**: **Opción A** para tener validación inmediata

---

### 2. Test E2E Endpoint `/api/bargains/top`

**Objetivo**: Verificar que endpoint completo funciona sin timeouts

**Test**:
```bash
# Cold cache (primera llamada)
time curl "http://localhost:3000/api/bargains/top?limit=20"
# Esperado: 20-30 segundos

# Warm cache (segunda llamada)
time curl "http://localhost:3000/api/bargains/top?limit=20"
# Esperado: <2 segundos ✅
```

**Validar**:
- ✅ Response time <30s (cold), <2s (warm)
- ✅ No timeouts
- ✅ Cache hit rate >80% en segunda llamada
- ✅ Chollos retornados tienen value_ratio >1.2
- ✅ Logs muestran fixture difficulty + form multiplier aplicados

**Tiempo estimado**: 15 minutos

---

### 3. Completar Historial Tests VEO3 (PENDIENTE)

**Archivo**: Crear `STATUS/VEO3_HISTORIAL_TESTS_OCTUBRE_2025.md`

**Contenido requerido**:
- Tests ejecutados últimas 2 semanas
- Resultados (success/fail)
- Problemas encontrados
- Fixes aplicados
- Estado actual del sistema

**Referencias**:
- Background shells activos (f6a7ab, 7c9bd9, 1378f5, etc.)
- Logs en `output/veo3/sessions/`
- Scripts en `scripts/veo3/`

**Tiempo estimado**: 30 minutos

---

## 🟡 PRIORIDAD 2 - SIGUIENTE

### 4. Endpoint Cache Stats `/api/bargains/cache-stats`

**Objetivo**: Dashboard para monitorear cache performance

**Implementación**:
```javascript
// backend/routes/bargains.js
router.get('/cache-stats', (req, res) => {
  const stats = recentMatchesCache.getStats();
  res.json({
    success: true,
    cache: stats,
    recommendations: {
      hitRate: stats.hitRate > 80 ? 'Optimal' : 'Consider pre-warming',
      size: stats.size < 100 ? 'Low usage' : 'Normal'
    }
  });
});
```

**Tiempo estimado**: 10 minutos

---

### 5. Pre-warming Cache Estratégico

**Problema**: Primera llamada siempre cold (100s timeout)

**Solución**: Pre-cargar top 50 jugadores al startup

**Implementación**:
```javascript
// backend/server.js (después de startup)
async function prewarmBargainCache() {
  logger.info('🔥 Pre-warming BargainAnalyzer cache...');
  const analyzer = new BargainAnalyzer();

  // Top 50 jugadores más populares (hardcoded IDs)
  const topPlayerIds = [874, 306, 1754, /* ... */];

  for (const playerId of topPlayerIds) {
    try {
      await analyzer.apiClient.getPlayerRecentMatches(playerId, 5);
    } catch (error) {
      logger.warn(`Pre-warm failed for player ${playerId}`);
    }
  }

  logger.info('✅ Cache pre-warmed');
}

// Ejecutar 2 minutos después del startup (evitar saturar API al iniciar)
setTimeout(prewarmBargainCache, 2 * 60 * 1000);
```

**Tiempo estimado**: 20 minutos

---

## ⏭️ PRIORIDAD 3 - FUTURO

### 6. BargainAnalyzer Fase 2 - Features Avanzadas

**NO urgente**, Fase 1 ya es sistema robusto

**Posibles features**:
- Consistency Score (detectar jugadores estables vs erráticos)
- Injury Risk Score (penalizar jugadores con historial lesiones)
- Home/Away Split (performance casa vs fuera)
- Star Player ML Model (machine learning para detectar estrellas)

**Prioridad**: ⏭️ Después de validar Fase 1

---

### 7. Instagram Carousels Automation

**Estado**: Sistema implementado pero no testeado end-to-end

**Pendiente**:
- Test endpoint `/api/carousels/top-chollos`
- Verificar integración ContentDrips API
- n8n workflow automation (Martes 10:00 AM)

**Prioridad**: ⏭️ Después de validar BargainAnalyzer

---

### 8. VEO3 - Mejoras Futuras

**Sistema actual**: ✅ Funcionando (99% success rate después de fix diccionario)

**Posibles mejoras**:
- Transitions más suaves (actualmente frame-to-frame funciona bien)
- Voice cloning Ana (actualmente TTS genérico)
- Dynamic backgrounds (actualmente fondo simple)

**Prioridad**: ⏭️ Sistema actual suficiente, no urgente

---

## 📋 CHECKLIST INICIO MAÑANA

### Primera hora (8:00-9:00 AM)
- [ ] Leer este archivo (`NEXT_SESSION_TASKS.md`)
- [ ] Verificar server corriendo: `npm run dev`
- [ ] Test quick health: `curl http://localhost:3000/api/test/ping`
- [ ] Revisar logs últimas 24h: `tail -100 logs/combined-YYYY-MM-DD.log`

### Segunda hora (9:00-10:00 AM)
- [ ] **TAREA 1**: Crear `test-v2-validation-2024.js` (Prioridad 1.1)
- [ ] **TAREA 2**: Ejecutar test validación con season 2024
- [ ] **TAREA 3**: Analizar resultados error puntos/precio

### Tercera hora (10:00-11:00 AM)
- [ ] **TAREA 4**: Test E2E endpoint `/api/bargains/top` (Prioridad 1.2)
- [ ] **TAREA 5**: Verificar cache warm/cold performance
- [ ] **TAREA 6**: Completar historial tests VEO3 (Prioridad 1.3)

### Resto del día
- [ ] Documentar resultados validación
- [ ] Ajustar thresholds si error >30%
- [ ] Implementar cache stats endpoint (Prioridad 2.1)
- [ ] Considerar pre-warming cache (Prioridad 2.2)

---

## 🐛 ISSUES CONOCIDOS

### 1. Validación Bloqueada por Datos Temporada 2025-26
**Status**: Conocido, esperado
**Solución**: Usar datos 2024 temporalmente (Opción A)

### 2. Background Shells Activos (10+)
**Status**: Múltiples shells VEO3 corriendo en background
**Acción**: Revisar output con `BashOutput` tool
**Limpieza**: Matar shells completados con `KillShell`

### 3. Cache Vacío al Restart
**Status**: Cache en memoria (Map), no persiste entre restarts
**Solución futura**: Redis persistence (Fase 2)
**Workaround actual**: Pre-warming estratégico

---

## 💾 ARCHIVOS IMPORTANTES

### Código Core
- `backend/services/bargainAnalyzer.js` - Motor principal (modificado 60%)
- `backend/services/apiFootball.js` - getPlayerRecentMatches() (nuevo)
- `backend/services/recentMatchesCache.js` - Cache system (nuevo)
- `backend/config/constants.js` - DAZN Points (modificado)

### Documentación
- `STATUS/BARGAIN_ANALYZER_V2_FASE_1_COMPLETA.md` - Resumen ejecutivo
- `STATUS/FIXTURE_DIFFICULTY_IMPLEMENTADO.md` - Fase 1.4
- `STATUS/CACHE_SYSTEM_IMPLEMENTADO.md` - Cache architecture
- `.claude/NEXT_SESSION_TASKS.md` - Este archivo

### Tests (pendientes crear)
- `scripts/bargains/test-v2-validation-2024.js` - Validación datos reales
- `scripts/bargains/test-cache-performance.js` - Cache benchmarks

---

## 🎯 OBJETIVOS SEMANA

### Esta semana (7-11 octubre 2025)
- ✅ Completar Fase 1 BargainAnalyzer V2.0 (HECHO)
- ⏳ Validar con datos reales (season 2024)
- ⏳ Confirmar error puntos <30%, precio <25%
- ⏳ Test E2E performance endpoint
- ⏳ Completar historial VEO3

### Próxima semana (14-18 octubre 2025)
- Instagram Carousels automation testing
- n8n workflows activation
- BargainAnalyzer monitoring dashboard
- User feedback collection

---

## 📊 MÉTRICAS A TRACKEAR

### BargainAnalyzer
- Error puntos estimados (objetivo: <30%)
- Error precio estimado (objetivo: <25%)
- Cache hit rate (objetivo: >80%)
- Endpoint response time (objetivo: <2s warm)
- API quota usage (objetivo: <50k/día)

### VEO3
- Success rate (actual: 99%+)
- Generation time (actual: ~2min/video)
- Error 422 frequency (actual: 0 después de fix)

### Instagram
- Posts/week (objetivo: 7 - 70% Reels, 20% Carousels, 10% Stories)
- Engagement rate (trackear manualmente)

---

## 🚀 COMANDO RÁPIDO INICIO SESIÓN

```bash
# Terminal 1: Server
cd "/Users/fran/Desktop/CURSOR/Fantasy la liga"
npm run dev

# Terminal 2: Quick tests
curl http://localhost:3000/api/test/ping
curl http://localhost:3000/api/bargains/test
curl http://localhost:3000/api/veo3/health

# Terminal 3: Logs live
tail -f logs/combined-$(date +%Y-%m-%d).log
```

---

**Estado al cierre**: 🟢 FASE 1 COMPLETA - PENDIENTE VALIDACIÓN

**Próxima sesión**: Validación BargainAnalyzer + Historial VEO3

**Tiempo estimado tareas P1**: 90 minutos (1.5 horas)

---

**Creado**: 7 de octubre de 2025, 00:25h
**Próxima revisión**: 7 de octubre de 2025, 08:00h (inicio sesión)
