# Sistema de Generación Automática de Chollos

**Fecha de implementación**: 16 Oct 2025 **Versión**: 1.0.0 **Estado**: ✅
Producción Ready

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes](#componentes)
4. [Configuración](#configuración)
5. [API Endpoints](#api-endpoints)
6. [Flujo de Ejecución](#flujo-de-ejecución)
7. [Monitoreo y Métricas](#monitoreo-y-métricas)
8. [Troubleshooting](#troubleshooting)
9. [Deploy a Producción](#deploy-a-producción)

---

## Visión General

Sistema automático de generación diaria de videos virales de chollos Fantasy La
Liga usando:

- **BargainAnalyzer**: Identifica jugadores infravalorados (alto potencial, bajo
  precio)
- **VEO3 3-Phase Workflow**: Genera videos con Ana Martínez (presentadora)
- **Nano Banana**: Genera imágenes contextualizadas del presentador
- **Cron Scheduler**: Ejecuta automáticamente a las 8 AM todos los días

### Beneficios

- ✅ **Automatización completa**: Sin intervención manual
- ✅ **Contenido viral diario**: 1 video de chollo cada mañana
- ✅ **Costo optimizado**: ~$0.96 por video (Nano Banana + VEO3)
- ✅ **Estadísticas en tiempo real**: Monitoreo de éxito/fallos
- ✅ **Ejecución manual**: API para testing o generación bajo demanda

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHOLLOS CRON SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────────┐  │
│  │ ChollosScheduler│ ────> │  BargainAnalyzer │ ──>│ VEO3 3-Phase │  │
│  │  (node-cron) │         │   (Top Chollo)   │    │   Workflow   │  │
│  └──────────────┘         └──────────────┘      └──────────────┘  │
│         │                         │                      │          │
│         │                         │                      │          │
│         v                         v                      v          │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────────┐  │
│  │   Statistics │         │  BargainCache │      │ Nano Banana  │  │
│  │   Tracking   │         │  (30min TTL) │      │   Images     │  │
│  └──────────────┘         └──────────────┘      └──────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
            │                              │
            v                              v
    ┌──────────────┐              ┌──────────────┐
    │ API Endpoints │              │ Future: n8n  │
    │ /chollos/*   │              │ Instagram    │
    └──────────────┘              └──────────────┘
```

---

## Componentes

### 1. ChollosScheduler (`backend/services/cron/chollosScheduler.js`)

**Responsabilidad**: Orquestar la generación automática de videos de chollos.

**Características**:

- Cron job configurable vía ENV (`CHOLLOS_CRON_SCHEDULE`)
- Default: `'0 8 * * *'` (8:00 AM diario)
- Estadísticas de ejecución: totalRuns, successfulRuns, failedRuns
- Método `runNow()` para ejecución manual instantánea
- Graceful shutdown en SIGTERM/SIGINT

**Métodos principales**:

```javascript
class ChollosScheduler {
    start()              // Iniciar cron job
    stop()               // Detener cron job
    executeJob()         // Ejecutar tarea de generación (4 fases)
    runNow()             // Ejecución manual (no espera al cron)
    getStats()           // Obtener estadísticas
    getNextRun()         // Calcular próxima ejecución
}
```

### 2. Chollos Routes (`backend/routes/chollos.js`)

**Responsabilidad**: API para monitoreo y ejecución manual del scheduler.

**Endpoints**:

- `GET /api/chollos/status` - Estado del scheduler y estadísticas
- `POST /api/chollos/run-now` - Trigger de ejecución manual

**Dependency Injection**:

```javascript
const {
    router: chollosRoutes,
    setChollosScheduler
} = require('./routes/chollos');
app.use('/api/chollos', generalLimiter, chollosRoutes);
setChollosScheduler(chollosScheduler); // Inyectar scheduler instance
```

### 3. BargainAnalyzer (`backend/services/bargainAnalyzer.js`)

**Responsabilidad**: Identificar chollos (jugadores infravalorados).

**Algoritmo**:

- Ratio valor/precio > 1.2
- Precio máximo: €8.0
- Mínimo 3 partidos jugados
- Mínimo 90 minutos totales

**Cache**: BargainCache con TTL 30 minutos

### 4. VEO3 3-Phase Workflow (`backend/routes/veo3.js:1772-2493`)

**Responsabilidad**: Generación de videos en 3 fases separadas.

**Fases**:

1. **Prepare Session**: Script + 3 imágenes Nano Banana (2-3 min)
2. **Generate Segments**: 3 segmentos de video (3-4 min × 3)
3. **Finalize Session**: Concatenación + logo outro (1 min)

**Ventajas**:

- Sin timeouts del servidor (cada request <5 min)
- Retry de segmentos individuales
- Progreso visible vía `progress.json`

---

## Configuración

### Variables de Entorno

**`.env` (Desarrollo)**:

```bash
# Cron Configuration
CHOLLOS_CRON_SCHEDULE=0 8 * * *        # 8 AM diario
CHOLLOS_CRON_ENABLED=true              # Activar/desactivar

# Server
NODE_ENV=development
PORT=3000
HOST=localhost
SERVER_URL=http://localhost:3000

# APIs necesarias
API_FOOTBALL_KEY=your_api_key          # API-Sports (chollos data)
KIE_AI_API_KEY=your_kie_key            # VEO3 (video generation)
NANO_BANANA_API_KEY=your_nano_key      # Nano Banana (images)
OPENAI_API_KEY=your_openai_key         # GPT-5 Mini (script generation)
```

**`.env.production` (Producción)**:

```bash
# Cron Configuration
CHOLLOS_CRON_SCHEDULE=0 8 * * *
CHOLLOS_CRON_ENABLED=true

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SERVER_URL=https://tu-dominio.railway.app

# Mismas API keys que desarrollo
```

### Formatos de Cron Schedule

```bash
# Formato: minuto hora dia mes diasemana
0 8 * * *       # 8:00 AM todos los días (default)
0 12 * * *      # 12:00 PM todos los días
0 8 * * 1-5     # 8:00 AM solo lunes a viernes
0 */6 * * *     # Cada 6 horas
*/30 * * * *    # Cada 30 minutos (testing)
```

### Configuración en server.js

El scheduler se auto-inicia al levantar el servidor:

```javascript
// backend/server.js:456-476
const ChollosScheduler = require('./services/cron/chollosScheduler');
const chollosScheduler = new ChollosScheduler();

(async () => {
    try {
        // Inyectar scheduler en routes/chollos.js
        setChollosScheduler(chollosScheduler);

        chollosScheduler.start();
        const stats = chollosScheduler.getStats();
        logger.info('💰 ChollosScheduler iniciado', {
            enabled: stats.enabled,
            schedule: stats.schedule,
            nextRun: stats.nextRun
        });
    } catch (error) {
        logger.error('❌ Error iniciando ChollosScheduler', {
            error: error.message
        });
    }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
    chollosScheduler.stop();
    server.close(() => process.exit(0));
});
```

---

## API Endpoints

### GET /api/chollos/status

Obtener estado del scheduler y estadísticas de ejecución.

**Request**:

```bash
curl http://localhost:3000/api/chollos/status
```

**Response** (200 OK):

```json
{
    "success": true,
    "data": {
        "scheduler": "ChollosScheduler",
        "status": "ACTIVO",
        "schedule": "0 8 * * *",
        "lastRun": "2025-10-16T06:00:12.345Z",
        "nextRun": "2025-10-17T06:00:00.000Z",
        "statistics": {
            "totalRuns": 15,
            "successfulRuns": 14,
            "failedRuns": 1,
            "successRate": "93.3",
            "lastError": null
        }
    },
    "timestamp": "2025-10-16T18:30:00.000Z"
}
```

**Casos de error**:

```json
{
    "success": false,
    "message": "ChollosScheduler no inicializado"
}
```

### POST /api/chollos/run-now

Ejecutar generación de chollo manualmente (sin esperar al cron).

**Request**:

```bash
curl -X POST http://localhost:3000/api/chollos/run-now
```

**Response** (200 OK - Background execution):

```json
{
    "success": true,
    "message": "Generación de chollo iniciada en background",
    "note": "El proceso tomará ~12-15 minutos. Monitorea los logs del servidor.",
    "timestamp": "2025-10-16T18:30:00.000Z"
}
```

**Notas**:

- La generación se ejecuta en background (no bloquea el cliente)
- Duración estimada: 12-15 minutos
- Monitorear logs del servidor para ver progreso en tiempo real

---

## Flujo de Ejecución

### Flujo Completo (4 Pasos)

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: ANÁLISIS DE BARGAINS (30s)                            │
├─────────────────────────────────────────────────────────────────┤
│ GET /api/bargains/top                                           │
│ - BargainAnalyzer identifica top chollo del día                 │
│ - Cache: 30 minutos (evita recálculo)                           │
│ - Resultado: { name, team, position, price, stats, valueRatio } │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: PREPARACIÓN SESIÓN VEO3 (2-3 min)                      │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/veo3/prepare-session                                  │
│ - UnifiedScriptGenerator: 3-segment script                      │
│ - Nano Banana: 3 contextual images (wide, medium, close-up)    │
│ - Supabase: Upload images con signed URLs                       │
│ - Save: progress.json (status: "prepared")                      │
│ - Resultado: { sessionId, scriptSegments, nanoBananaImages }    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: GENERACIÓN DE 3 SEGMENTOS (3-4 min × 3)                │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/veo3/generate-segment (× 3 en paralelo)              │
│ - Segmento 0: Hook (intro)                                      │
│ - Segmento 1: Development (análisis)                            │
│ - Segmento 2: CTA (cierre)                                      │
│ - VEO3: Generate 8-second video per segment                     │
│ - Save: seg0.mp4, seg1.mp4, seg2.mp4                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: FINALIZACIÓN (1 min)                                   │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/veo3/finalize-session                                 │
│ - FFmpeg: Concatenate 3 segments                                │
│ - Add logo outro (2s)                                            │
│ - Upload to Supabase Storage                                     │
│ - Save: final_video.mp4                                          │
│ - Resultado: { finalVideoUrl, totalCost, sessionStats }         │
└─────────────────────────────────────────────────────────────────┘
```

### Tiempo Total Estimado

| Fase                          | Duración      | Costo     |
| ----------------------------- | ------------- | --------- |
| Análisis Bargains             | 30s           | $0        |
| Preparación (Script + Images) | 2-3 min       | $0.06     |
| Generación 3 Segmentos        | 9-12 min      | $0.90     |
| Finalización (Concat)         | 1 min         | $0        |
| **TOTAL**                     | **12-15 min** | **$0.96** |

### Logs de Ejemplo

```bash
[ChollosScheduler] 🕐 Inicio: 2025-10-16T06:00:00.000Z
[ChollosScheduler] 📊 Paso 1/4: Analizando bargains...
[ChollosScheduler] ✅ Top chollo: Pedri (Barcelona)
[ChollosScheduler]    💰 Precio: €6.5 | Ratio: 1.85

[ChollosScheduler] 🎬 Paso 2/4: Preparando sesión VEO3 (script + imágenes)...
[ChollosScheduler] ✅ Fase 1 completada
[ChollosScheduler]    📁 Session ID: session_nanoBanana_1760632789123
[ChollosScheduler]    🖼️  Imágenes: 3

[ChollosScheduler] 🎥 Paso 3/4: Generando 3 segmentos de video...
[ChollosScheduler]    🔄 Generando segmento 1/3...
[ChollosScheduler]    ✅ Segmento 1 completado
[ChollosScheduler]    🔄 Generando segmento 2/3...
[ChollosScheduler]    ✅ Segmento 2 completado
[ChollosScheduler]    🔄 Generando segmento 3/3...
[ChollosScheduler]    ✅ Segmento 3 completado

[ChollosScheduler] 🎬 Paso 4/4: Finalizando video (concatenación + logo)...
[ChollosScheduler] 🎉 Player: Pedri
[ChollosScheduler] 📹 Video: https://ixfowlkuypnfbrwawxlx.supabase.co/storage/v1/...
[ChollosScheduler] ⏱️  Duración: 785.3s
[ChollosScheduler] 💰 Costo: $0.960
[ChollosScheduler] 📊 Stats: 1/1 exitosos
[ChollosScheduler] 🕐 Próxima ejecución: 2025-10-17T06:00:00.000Z
```

---

## Monitoreo y Métricas

### Estadísticas en Tiempo Real

El scheduler mantiene estadísticas de todas las ejecuciones:

```javascript
{
  totalRuns: 30,           // Total de ejecuciones
  successfulRuns: 28,      // Ejecuciones exitosas
  failedRuns: 2,           // Ejecuciones fallidas
  successRate: "93.3%",    // Ratio de éxito
  lastError: null          // Último error (si existe)
}
```

### Logs Estructurados

Todos los logs usan Winston con formato estructurado:

```bash
# Logs en consola (desarrollo)
logs/combined-YYYY-MM-DD.log         # Todos los niveles
logs/error-YYYY-MM-DD.log            # Solo errores

# Niveles de log
INFO  - Ejecución normal
WARN  - Advertencias (no críticas)
ERROR - Errores (ejecución fallida)
```

### Monitoreo en Producción

**1. Dashboard de Estado**:

```bash
# Verificar estado del scheduler
curl https://tu-dominio.railway.app/api/chollos/status | jq .
```

**2. Logs de Railway**:

```bash
# Railway CLI
railway logs --tail 100

# Buscar errores
railway logs | grep "ERROR"

# Buscar ejecuciones exitosas
railway logs | grep "VIDEO CHOLLO GENERADO EXITOSAMENTE"
```

**3. Alertas**:

- Configurar webhooks en Railway para notificar fallos
- Integrar con servicios de monitoreo (Sentry, Datadog, etc.)

### Health Checks

```bash
# 1. Verificar servidor activo
curl https://tu-dominio.railway.app/health

# 2. Verificar scheduler activo
curl https://tu-dominio.railway.app/api/chollos/status

# 3. Verificar última ejecución
# Si lastRun es > 24h, puede haber un problema
```

---

## Troubleshooting

### Problema: Cron no ejecuta automáticamente

**Síntomas**:

- `lastRun` siempre `null`
- `nextRun` correcto pero no ejecuta

**Diagnóstico**:

```bash
# 1. Verificar estado del scheduler
curl http://localhost:3000/api/chollos/status

# 2. Verificar logs del servidor
tail -100 logs/combined-$(date +%Y-%m-%d).log | grep "ChollosScheduler"

# 3. Verificar ENV
echo $CHOLLOS_CRON_ENABLED
echo $CHOLLOS_CRON_SCHEDULE
```

**Soluciones**:

1. Verificar `CHOLLOS_CRON_ENABLED=true` en `.env`
2. Validar formato de cron con `cron.validate(schedule)`
3. Reiniciar servidor para aplicar cambios

### Problema: Ejecución falla en Fase 1 (Bargains)

**Síntomas**:

- Error: "No se encontraron chollos disponibles"

**Diagnóstico**:

```bash
# Verificar que BargainAnalyzer funciona
curl http://localhost:3000/api/bargains/top
```

**Soluciones**:

1. Verificar `API_FOOTBALL_KEY` configurada
2. Verificar que hay jugadores con precio < €8.0
3. Limpiar cache: `BargainCache.clear()`

### Problema: Ejecución falla en Fase 2 (Nano Banana)

**Síntomas**:

- Error: "Error generando imágenes contextualizadas"

**Diagnóstico**:

```bash
# Verificar Nano Banana API
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $NANO_BANANA_API_KEY" \
  -d '{"version": "...", "input": {"prompt": "test"}}'
```

**Soluciones**:

1. Verificar `NANO_BANANA_API_KEY` configurada
2. Verificar que imágenes de referencia son accesibles (Supabase URLs)
3. Verificar límite de rate de Nano Banana (100 req/día)

### Problema: Ejecución falla en Fase 3 (VEO3)

**Síntomas**:

- Error 422: "failed" / "Names not allowed"

**Diagnóstico**:

```bash
# Verificar logs de VEO3Client
grep "VEO3Client" logs/combined-$(date +%Y-%m-%d).log

# Verificar que prompt builder usa referencias genéricas
grep "Usando referencia segura" logs/combined-$(date +%Y-%m-%d).log
```

**Soluciones**:

1. Verificar que `promptBuilder.js` usa referencias genéricas ("el jugador", "el
   centrocampista")
2. Verificar timeout: 120s inicial, 45s polling
3. Ver troubleshooting en `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`

### Problema: Timeout del Servidor

**Síntomas**:

- Error: "ETIMEDOUT" o "ESOCKETTIMEDOUT"

**Diagnóstico**:

```bash
# Verificar timeouts del servidor
grep "Timeouts del servidor" logs/combined-$(date +%Y-%m-%d).log
```

**Soluciones**:

1. Verificar `server.timeout = 900000` (15 min)
2. Usar 3-Phase Workflow (cada request <5 min)
3. En producción, aumentar timeout si es necesario

### Problema: FFmpeg falla en Finalización

**Síntomas**:

- Error: "FFmpeg command failed"

**Diagnóstico**:

```bash
# Verificar FFmpeg instalado
ffmpeg -version

# Verificar que 3 segmentos existen
ls -lh output/veo3/sessions/session_*/seg*.mp4
```

**Soluciones**:

1. Instalar FFmpeg: `npm install fluent-ffmpeg`
2. Verificar que 3 segmentos se generaron correctamente
3. Verificar permisos de escritura en `output/veo3/`

---

## Deploy a Producción

### 1. Preparación

**Checklist pre-deploy**:

- ✅ Variables de entorno en `.env.production`
- ✅ Todos los tests pasan: `npm run quality`
- ✅ Test manual exitoso: `POST /api/chollos/run-now`
- ✅ Logs configurados correctamente
- ✅ Monitoreo configurado (Railway, Sentry, etc.)

### 2. Railway Deployment

**Paso 1: Subir código a GitHub**:

```bash
git add .
git commit -m "🚀 Sistema de chollos automático - Producción ready"
git push origin main
```

**Paso 2: Configurar variables en Railway**:

```bash
# Variables críticas
CHOLLOS_CRON_SCHEDULE=0 8 * * *
CHOLLOS_CRON_ENABLED=true
NODE_ENV=production
SERVER_URL=https://tu-dominio.railway.app

# API Keys
API_FOOTBALL_KEY=your_key
KIE_AI_API_KEY=your_key
NANO_BANANA_API_KEY=your_key
OPENAI_API_KEY=your_key

# Database (Supabase)
SUPABASE_PROJECT_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

**Paso 3: Deploy y verificar**:

```bash
# Railway auto-deploys desde GitHub

# Verificar deploy exitoso
curl https://tu-dominio.railway.app/health

# Verificar scheduler activo
curl https://tu-dominio.railway.app/api/chollos/status
```

### 3. Post-Deploy Verification

**Checklist post-deploy**:

- ✅ Servidor responde: `GET /health`
- ✅ Scheduler activo: `GET /api/chollos/status`
- ✅ Próxima ejecución correcta: `nextRun` en 8 AM siguiente día
- ✅ Logs sin errores: Railway logs

### 4. Primera Ejecución Manual

```bash
# Trigger manual para validar
curl -X POST https://tu-dominio.railway.app/api/chollos/run-now

# Monitorear logs en tiempo real
railway logs --tail 100

# Verificar video generado (12-15 min)
# Buscar en logs: "VIDEO CHOLLO GENERADO EXITOSAMENTE"
```

### 5. Configuración de Horario Personalizado

Si quieres cambiar el horario:

```bash
# Opción 1: Railway Dashboard
# Variables → CHOLLOS_CRON_SCHEDULE → "0 12 * * *" (12 PM)

# Opción 2: Railway CLI
railway variables:set CHOLLOS_CRON_SCHEDULE="0 12 * * *"

# Reiniciar servicio
railway restart
```

### 6. Monitoreo Continuo

**Setup recomendado**:

1. **Railway Logs**: Monitoreo básico incluido
2. **Sentry** (opcional): Alertas de errores en tiempo real
3. **Datadog** (opcional): Métricas avanzadas
4. **Webhook** (recomendado): Notificar a Slack/Discord cuando hay éxito/fallo

**Ejemplo webhook**:

```javascript
// En chollosScheduler.js:executeJob()
// Agregar al final del try (éxito)
await axios.post(process.env.WEBHOOK_URL, {
    text: `✅ Video chollo generado: ${topBargain.name} - ${videoUrl}`
});

// Agregar al final del catch (error)
await axios.post(process.env.WEBHOOK_URL, {
    text: `❌ Error generando chollo: ${error.message}`
});
```

---

## Próximas Mejoras

### Corto Plazo

1. **n8n Integration**: Publicación automática a Instagram después de generar
   video
2. **Webhook Notifications**: Alertas a Slack/Discord cuando hay éxito/fallo
3. **Dashboard Web**: Interfaz visual para ver historial y estadísticas

### Medio Plazo

1. **Múltiples Chollos**: Generar top 3 chollos en lugar de solo 1
2. **Scheduling Inteligente**: Ajustar horario según engagement de Instagram
3. **A/B Testing**: Probar diferentes scripts/estilos

### Largo Plazo

1. **Machine Learning**: Predecir qué chollos tendrán más engagement
2. **Multi-Platform**: Publicar también en TikTok, YouTube Shorts
3. **Personalización**: Chollos por posición (defensas, medios, delanteros)

---

## Referencias

- **VEO3 3-Phase Workflow**: `docs/VEO3_GUIA_COMPLETA.md`
- **Nano Banana Integration**: `backend/services/nanoBanana/nanoBananaClient.js`
- **BargainAnalyzer**: `backend/services/bargainAnalyzer.js`
- **Troubleshooting VEO3**: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`

---

**Última actualización**: 16 Oct 2025 **Mantenido por**: Claude Code **Versión
del documento**: 1.0.0
