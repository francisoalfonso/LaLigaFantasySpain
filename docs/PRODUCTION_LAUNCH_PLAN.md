# 🚀 Plan de Lanzamiento a Producción - Fantasy La Liga Pro

**Fecha creación**: 16 Oct 2025 **Última actualización**: 16 Oct 2025
**Status**: 🔴 Pre-lanzamiento - Checklist en progreso **Objetivo**: Publicar
contenido regular y automatizado en Instagram

---

## 📊 Estado Actual del Sistema

### ✅ Componentes Funcionando

#### **Backend (Express.js)**

- ✅ Servidor estable en desarrollo (`npm run dev`)
- ✅ 88 sesiones VEO3 generadas (54 en últimos 7 días)
- ✅ Timeouts configurados para VEO3 (15 min servidor)
- ✅ Rate limiting implementado
- ✅ Winston logger con rotación diaria
- ✅ Error handling middleware
- ✅ API-Sports Ultra plan activo ($29/mes)

#### **Database (Supabase)**

- ✅ PostgreSQL schema actualizado
- ✅ Conexión estable
- ✅ Schema validation disponible (`npm run db:verify-competitive`)

#### **VEO3 Video Generation (KIE.ai)**

- ✅ Arquitectura 3 fases implementada (sin timeouts)
- ✅ Ana character consistency (seed 30001)
- ✅ Carlos character implementado (seed 30002)
- ✅ Nano Banana integration (imágenes contextualizadas)
- ✅ Frame-to-frame transitions
- ✅ Player card overlay system
- ✅ ASS karaoke subtitles system
- ⚠️ VEO 3.1 pendiente (esperando release)

#### **Content Analysis (Competitive Intelligence)**

- ✅ YouTube outlier detection (6h automation)
- ✅ Gemini 2.0 Flash video analysis
- ✅ 14 servicios de análisis competitivo
- ✅ Intelligent script generator (GPT-4o)
- ✅ Player name normalization

#### **Instagram System**

- ✅ Preview único consolidado (`instagram-viral-preview.html`)
- ✅ Viral score calculator (11 criterios)
- ✅ Version manager con feedback loop
- ⏸️ Instagram Graph API (implementado pero no publicando)
- ⏸️ n8n workflows (2/8 activos)

### ⚠️ Componentes Pendientes/Bloqueados

#### **APIs Externas**

- ⏸️ **ContentDrips API** - Pendiente activación cuenta (carousels)
- ⏸️ **Instagram Graph API** - Credenciales configuradas pero no testeadas en
  producción
- ⏸️ **YouTube Data API** - Configurada pero cuota limitada

#### **Automation**

- ⏸️ **n8n workflows** - 6/8 workflows pendientes de activación
- ⏸️ **Cron jobs** - Outlier detection activo, otros pendientes

#### **Testing**

- ❌ **Quality checks** - `npm run quality` timeout (>30s)
- ⚠️ **E2E tests** - Outliers test falló por socket hang up
- ⚠️ **Instagram publishing** - No testeado en producción

---

## 🎯 Objetivos de Lanzamiento

### **Fase 1: Publicación Manual (Semana 1-2)**

**Objetivo**: Publicar 3-5 videos manualmente para validar sistema

- [ ] Generar 3 videos de chollos de la jornada
- [ ] Publicar manualmente en Instagram (via preview)
- [ ] Monitorear métricas (views, engagement, comentarios)
- [ ] Validar calidad de videos (audio, visual, subtítulos)
- [ ] Iterar basado en feedback

### **Fase 2: Semi-Automatización (Semana 3-4)**

**Objetivo**: Automatizar generación pero mantener revisión manual

- [ ] Activar workflow n8n de chollos diarios
- [ ] Implementar cola de revisión pre-publicación
- [ ] Automatizar programación de posts
- [ ] Monitorear costos reales vs proyectados
- [ ] Ajustar frecuencia según engagement

### **Fase 3: Automatización Completa (Semana 5+)**

**Objetivo**: Sistema 100% automatizado con monitoreo

- [ ] Activar todos los workflows n8n
- [ ] Implementar sistema de alertas
- [ ] Dashboard de métricas en tiempo real
- [ ] A/B testing automático
- [ ] Optimización continua basada en datos

---

## ✅ Pre-Launch Checklist

### **1. Infraestructura** (P0 - CRÍTICO)

#### 1.1 Servidor & Hosting

- [ ] **Migrar a servidor de producción**
    - [ ] Evaluar opciones: Railway, Fly.io, DigitalOcean, AWS
    - [ ] Configurar dominio (fantasylalipro.com o similar)
    - [ ] SSL/HTTPS configurado
    - [ ] Variables de entorno en producción
    - [ ] Health checks configurados
    - [ ] Auto-restart on crash
    - **Estimación**: 1-2 días
    - **Costo**: $10-20/mes

- [ ] **Configurar CDN para videos**
    - [ ] Evaluar: Bunny.net, Cloudflare R2, AWS S3
    - [ ] Migrar videos de local a CDN
    - [ ] Configurar URLs públicas
    - [ ] Testing de carga
    - **Estimación**: 1 día
    - **Costo**: $5-10/mes

- [ ] **Base de datos en producción**
    - [ ] Supabase plan actualizado (si necesario)
    - [ ] Backups automáticos configurados
    - [ ] Connection pooling optimizado
    - [ ] Monitoring configurado
    - **Estimación**: 0.5 días
    - **Costo**: Incluido en Supabase free tier

#### 1.2 Monitoring & Logging

- [ ] **Sistema de logs centralizado**
    - [ ] Configurar servicio: Logtail, BetterStack, o similar
    - [ ] Agregar logs críticos de VEO3, outliers, Instagram
    - [ ] Alertas para errores críticos
    - **Estimación**: 0.5 días
    - **Costo**: $0-10/mes

- [ ] **Application monitoring**
    - [ ] Sentry para error tracking
    - [ ] Uptime monitoring (UptimeRobot)
    - [ ] Performance metrics (API response times)
    - **Estimación**: 0.5 días
    - **Costo**: $0-10/mes (free tiers)

- [ ] **Cost tracking dashboard**
    - [ ] Tracking de costos VEO3/Nano Banana
    - [ ] Tracking de costos APIs (OpenAI, Gemini)
    - [ ] Alertas si excede presupuesto
    - **Estimación**: 1 día
    - **Costo**: $0

---

### **2. Testing & Quality** (P0 - CRÍTICO)

#### 2.1 Tests E2E

- [ ] **Flujo chollos completo**
    - [ ] API-Sports → BargainAnalyzer → VEO3 3-phase → Preview
    - [ ] Validar: 3 videos generados, sin errores, calidad OK
    - [ ] Test con diferentes posiciones (DEF, MID, FWD)
    - **Comando**: `npm run veo3:e2e-chollo`
    - **Estimación**: 2 horas
    - **Status**: ⚠️ Pendiente validación completa

- [ ] **Flujo outliers completo**
    - [ ] YouTube detection → Gemini analysis → Script generation → VEO3 3-phase
    - [ ] Validar: Carlos presenter, audio sincronizado, player card overlay
    - [ ] Test con diferentes response angles (rebatir, complementar, ampliar)
    - **Comando**: `npm run outliers:test-complete-e2e`
    - **Estimación**: 2 horas
    - **Status**: ❌ Falló por socket hang up (revisar timeout)

- [ ] **Flujo Instagram publish**
    - [ ] Generar video → Preview → Publish to Instagram
    - [ ] Validar: Video subido, caption correcto, hashtags
    - [ ] Test en cuenta de prueba PRIMERO
    - **Estimación**: 1 hora
    - **Status**: ⏸️ No testeado

#### 2.2 Quality Checks

- [ ] **Fix `npm run quality` timeout**
    - [ ] Investigar por qué tarda >30s
    - [ ] Optimizar linting/testing
    - [ ] Separar en comandos más pequeños si necesario
    - **Estimación**: 1 hora
    - **Status**: ❌ Timeout actual

- [ ] **Video quality validation**
    - [ ] Checklist visual: Ana/Carlos facial consistency, fondo TV studio, logo
          FLP
    - [ ] Checklist audio: Sincronización labios, sin silencios largos, acento
          español
    - [ ] Checklist técnico: 9:16 aspect ratio, 720p mínimo, subtítulos ASS
    - **Estimación**: Manual por video (5 min)
    - **Status**: ✅ Checklist definido

- [ ] **Performance testing**
    - [ ] Load testing con 10 requests concurrentes
    - [ ] Validar timeouts bajo carga
    - [ ] Memory leaks check
    - **Estimación**: 2 horas
    - **Status**: ⏸️ Pendiente

---

### **3. Content Strategy** (P0 - CRÍTICO)

#### 3.1 Calendario Editorial

- [ ] **Definir frecuencia de publicación**
    - [ ] Semana 1-2: 3 posts/semana (Lunes, Miércoles, Viernes)
    - [ ] Semana 3-4: 5 posts/semana (Lunes-Viernes)
    - [ ] Semana 5+: 7 posts/semana (diario) + Stories
    - **Decisión**: Empezar conservador, escalar gradualmente

- [ ] **Content mix definido**
    - [ ] 70% Chollos virales (Ana) - 5 videos/semana
    - [ ] 20% Outlier responses (Carlos) - 1-2 videos/semana
    - [ ] 10% Stories/carousels - Diario
    - **Estimación**: Template en n8n
    - **Status**: ⏸️ Pendiente configurar n8n

- [ ] **Horarios óptimos de publicación**
    - [ ] Analizar competidores (Carrasco, Antonio Romero, etc.)
    - [ ] Test A/B de horarios: 9am, 1pm, 7pm
    - [ ] Ajustar según engagement
    - **Estimación**: Semana 1-2 para encontrar óptimos

#### 3.2 Brand Guidelines

- [ ] **Tono y estilo consolidado**
    - [ ] Ana: Analítica, datos, confianza, urgencia
    - [ ] Carlos: Rebate mitos, datos avanzados, provocador
    - [ ] Hashtags estratégicos: #FantasyLaLiga #Biwenger #Comunio
    - **Status**: ✅ Definido en character bibles

- [ ] **Templates de captions**
    - [ ] Viral hooks configurados
    - [ ] CTAs claros (link en bio, DM para consultas)
    - [ ] Emoji strategy consistente
    - **Status**: ✅ Viralcaptionsgenerator implementado

---

### **4. APIs & Integrations** (P1 - IMPORTANTE)

#### 4.1 Instagram Graph API

- [ ] **Credenciales de producción**
    - [ ] App Facebook creada y aprobada
    - [ ] Instagram Business account conectada
    - [ ] Access tokens refreshed automáticamente
    - [ ] Test publish en cuenta de prueba
    - **Estimación**: 2 horas
    - **Status**: ⏸️ Credenciales configuradas pero no testeadas

- [ ] **Rate limits entendidos**
    - [ ] Límites de publishing diarios
    - [ ] Límites de API calls
    - [ ] Cooldown periods
    - **Estimación**: 1 hora lectura docs

#### 4.2 YouTube Data API

- [ ] **Cuota management**
    - [ ] Entender cuota diaria (10,000 units)
    - [ ] Optimizar requests (outlier detection)
    - [ ] Implementar caching agresivo
    - **Estimación**: 1 hora
    - **Status**: ⚠️ Cuota limitada

#### 4.3 ContentDrips API

- [ ] **Activar cuenta**
    - [ ] Contactar soporte ContentDrips
    - [ ] Configurar API key
    - [ ] Test generación de carousels
    - **Estimación**: 1 día (depende de soporte)
    - **Status**: ⏸️ Bloqueado por activación

---

### **5. Automation & Workflows** (P1 - IMPORTANTE)

#### 5.1 n8n Workflows

- [ ] **Workflow 1: Chollos Diarios**
    - [ ] Trigger: Cron 8am (2 horas antes de jornada)
    - [ ] Flow: API-Sports → BargainAnalyzer → VEO3 prepare → Queue
    - [ ] Output: 3 videos en cola de revisión
    - **Status**: ⏸️ Pendiente activar

- [ ] **Workflow 2: Publicación Programada**
    - [ ] Trigger: Cron horarios definidos (9am, 1pm, 7pm)
    - [ ] Flow: Queue → Instagram Graph API → Log
    - [ ] Retry logic si falla
    - **Status**: ⏸️ Pendiente implementar

- [ ] **Workflow 3: Outlier Detection + Response**
    - [ ] Trigger: Cron cada 6 horas
    - [ ] Flow: YouTube search → Gemini analysis → Script → VEO3
    - [ ] Output: 1-2 videos outlier/día
    - **Status**: ✅ Detection activo, publishing pendiente

- [ ] **Workflow 4: Stories Diarias**
    - [ ] Trigger: Cron 7am
    - [ ] Flow: Player stats → Graphic generation → Instagram Stories
    - [ ] Status\*\*: ⏸️ Pendiente diseñar

#### 5.2 Error Handling & Retries

- [ ] **VEO3 retry logic**
    - [ ] Max 3 reintentos por segmento
    - [ ] Cooling period 30s entre reintentos
    - [ ] Fallback a veo3_fast si veo3 falla
    - **Status**: ✅ Implementado en veo3RetryManager

- [ ] **Instagram publish retry**
    - [ ] Max 2 reintentos
    - [ ] Log failures para revisión manual
    - [ ] Alertas si >3 fallos consecutivos
    - **Status**: ⏸️ Pendiente implementar

---

### **6. Security & Compliance** (P1 - IMPORTANTE)

#### 6.1 API Keys & Secrets

- [ ] **Rotation policy**
    - [ ] Rotar API keys cada 90 días
    - [ ] Documentar proceso de rotación
    - [ ] Alertas 7 días antes de expiración
    - **Status**: ⏸️ Pendiente definir

- [ ] **Access control**
    - [ ] .env nunca en git (✅ ya configurado)
    - [ ] Variables de entorno en producción (Railway secrets, etc.)
    - [ ] Backups encriptados
    - **Status**: ✅ Configurado localmente, pendiente producción

#### 6.2 Content Moderation

- [ ] **Player names validation**
    - [ ] Evitar Error 422 con player name optimizer
    - [ ] Blacklist de términos prohibidos
    - [ ] Manual review queue para outliers
    - **Status**: ✅ Optimizer implementado

- [ ] **Copyright compliance**
    - [ ] No usar nombres de jugadores en VEO3 (✅ ya implementado)
    - [ ] Logo FLP solo en outro
    - [ ] Música/audio libre de derechos
    - **Status**: ✅ Cumpliendo

---

### **7. Documentation** (P2 - NICE TO HAVE)

#### 7.1 Operational Docs

- [ ] **Runbook de producción**
    - [ ] Cómo deployar
    - [ ] Cómo rollback
    - [ ] Troubleshooting común
    - **Estimación**: 2 horas
    - **Status**: ⏸️ Pendiente

- [ ] **Incident response plan**
    - [ ] VEO3 down: Qué hacer
    - [ ] Instagram API down: Fallback
    - [ ] Server down: Recovery procedure
    - **Estimación**: 1 hora
    - **Status**: ⏸️ Pendiente

#### 7.2 User Guides

- [ ] **Manual de uso para equipo**
    - [ ] Cómo revisar videos en queue
    - [ ] Cómo publicar manualmente
    - [ ] Cómo interpretar métricas
    - **Estimación**: 2 horas
    - **Status**: ⏸️ Pendiente

---

## 📅 Timeline de Lanzamiento

### **Semana 1: Pre-Launch Preparation** (16-20 Oct 2025)

#### Día 1-2 (16-17 Oct) - Testing & Fixes

- [x] ✅ Análisis estado actual completado
- [ ] Fix `npm run quality` timeout
- [ ] Fix outliers E2E test (socket hang up)
- [ ] Test chollo E2E completo (3 videos)

#### Día 3-4 (18-19 Oct) - Infraestructura

- [ ] Evaluar y seleccionar hosting (Railway recomendado)
- [ ] Deploy servidor a producción
- [ ] Configurar CDN para videos (Bunny.net)
- [ ] Setup monitoring (Sentry + UptimeRobot)

#### Día 5 (20 Oct) - Final Testing

- [ ] Test Instagram publish en cuenta de prueba
- [ ] Validar flujo completo en producción
- [ ] Checklist pre-launch completo

---

### **Semana 2: Soft Launch** (21-27 Oct 2025)

#### Fase 1.1: Manual Publishing (Lun-Mie)

- [ ] **Lunes 21**: Generar y publicar 1 chollo
- [ ] **Martes 22**: Generar y publicar 1 outlier response
- [ ] **Miércoles 23**: Generar y publicar 1 chollo
- [ ] Monitorear métricas: views, engagement, comentarios
- [ ] Ajustar basado en feedback

#### Fase 1.2: Semi-Auto (Jue-Dom)

- [ ] **Jueves 24**: Activar workflow chollos automático
- [ ] **Viernes 25**: Publicar 2 videos (1 auto, 1 manual)
- [ ] **Sábado 26**: Descanso (analizar métricas semana)
- [ ] **Domingo 27**: Preparar calendario semana 3

---

### **Semana 3: Scale Up** (28 Oct - 3 Nov 2025)

#### Fase 2: Daily Automation

- [ ] Activar publicación diaria (5 posts/semana)
- [ ] Implementar Stories diarias
- [ ] A/B testing de horarios
- [ ] Optimizar basado en engagement

---

### **Semana 4+: Full Automation** (4 Nov+ 2025)

#### Fase 3: Complete System

- [ ] 7 posts/semana (diario)
- [ ] Stories automáticas
- [ ] Carousels semanales
- [ ] Sistema 100% automatizado con revisión spot-check

---

## 💰 Presupuesto Mensual Proyectado

### **Costos Actuales (Pre-Launch)**

- API-Sports Ultra: $29/mes ✅
- VEO3 (KIE.ai): ~$19/mes (20 videos) ✅
- Nano Banana: Incluido en VEO3 ✅
- Supabase: $0 (free tier) ✅
- **Total actual**: $48/mes

### **Costos Post-Launch (Producción)**

- **APIs existentes**: $48/mes
- **Hosting (Railway)**: $15/mes
- **CDN (Bunny.net)**: $5/mes
- **Monitoring (Sentry + UptimeRobot)**: $0 (free tiers)
- **ContentDrips**: $39/mes (cuando activemos)
- **Total sin ContentDrips**: $68/mes
- **Total con ContentDrips**: $107/mes

### **Proyección Escalado (Mes 2+)**

Si escalamos a 50 videos/mes:

- VEO3: ~$48/mes (50 videos × $0.96)
- APIs: $29/mes
- Infraestructura: $20/mes
- **Total**: $97/mes (sin ContentDrips)

---

## 🚨 Riesgos Identificados

### **Riesgo 1: VEO3 Timeouts** - ALTO

**Descripción**: Socket hang up en generación de segmentos **Mitigación**:

- ✅ Arquitectura 3 fases ya implementada
- [ ] Aumentar timeout Axios a 180s
- [ ] Implementar retry con exponential backoff **Status**: ⚠️ Requiere fix
      inmediato

### **Riesgo 2: Instagram API Rate Limits** - MEDIO

**Descripción**: Límites de publicación no claros **Mitigación**:

- [ ] Leer docs oficiales de límites
- [ ] Implementar rate limiting interno
- [ ] Monitoring de cuota **Status**: ⏸️ Pendiente investigación

### **Riesgo 3: VEO 3.1 Release** - BAJO

**Descripción**: VEO 3.1 puede cambiar pricing/features **Mitigación**:

- [x] ✅ Análisis completo en `VEO3.1_ANALYSIS_AND_MIGRATION_PLAN.md`
- [ ] Contactar KIE.ai para roadmap
- [ ] Plan B: Migrar a Gemini API si necesario **Status**: ⏳ Esperando release

### **Riesgo 4: Costos Excedan Presupuesto** - MEDIO

**Descripción**: Escalado rápido puede disparar costos **Mitigación**:

- [ ] Implementar cost tracking dashboard
- [ ] Alertas si excede $150/mes
- [ ] Throttling de generación si necesario **Status**: ⏸️ Pendiente implementar

### **Riesgo 5: Quality Issues en Producción** - BAJO

**Descripción**: Videos con errores pasan a publicación **Mitigación**:

- ✅ Manual review queue implementado (test-history.html)
- ✅ Viral score calculator (11 criterios)
- [ ] Automated quality checks (FFmpeg validation) **Status**: ✅ Mitigado
      parcialmente

---

## ✅ Checklist Rápido - Pre-Launch

### **P0 - Bloqueadores Críticos**

- [ ] Fix outliers E2E socket hang up
- [ ] Test Instagram publish (cuenta prueba)
- [ ] Deploy servidor a producción
- [ ] Configurar CDN para videos
- [ ] Monitoring & alertas configurados

### **P1 - Importantes**

- [ ] Fix `npm run quality` timeout
- [ ] n8n workflows activados (chollos + publish)
- [ ] Instagram Graph API tokens válidos
- [ ] Calendario editorial definido
- [ ] Runbook de producción documentado

### **P2 - Nice to Have**

- [ ] ContentDrips activado
- [ ] A/B testing framework
- [ ] User guides documentados
- [ ] Advanced analytics dashboard

---

## 📊 Métricas de Éxito (KPIs)

### **Semana 1-2 (Validación)**

- [ ] 5 videos publicados sin errores críticos
- [ ] > 100 views/video (promedio)
- [ ] > 5% engagement rate
- [ ] 0 incidentes de downtime
- [ ] Costos <$80

### **Mes 1 (Consolidación)**

- [ ] 20-30 videos publicados
- [ ] > 500 views/video (promedio)
- [ ] > 10% engagement rate
- [ ] > 100 seguidores nuevos
- [ ] Costos <$120

### **Mes 2+ (Crecimiento)**

- [ ] 50+ videos publicados
- [ ] > 1,000 views/video (promedio)
- [ ] > 15% engagement rate
- [ ] > 500 seguidores nuevos
- [ ] ROI positivo (sponsors/ads)

---

## 🎯 Próximos Pasos Inmediatos

### **HOY (16 Oct)**

1. [ ] Fix outliers E2E test (investigar socket hang up)
2. [ ] Test chollo E2E completo (validar 3 videos)
3. [ ] Evaluar opciones de hosting (Railway vs Fly.io vs DigitalOcean)

### **MAÑANA (17 Oct)**

1. [ ] Fix `npm run quality` timeout
2. [ ] Seleccionar hosting y setup inicial
3. [ ] Configurar monitoring básico

### **ESTA SEMANA (18-20 Oct)**

1. [ ] Deploy a producción
2. [ ] Setup CDN
3. [ ] Test Instagram publish
4. [ ] Completar checklist P0

---

## 📝 Notas Adicionales

### **Decisiones Pendientes**

- [ ] **Hosting provider**: Railway (recomendado), Fly.io, o DigitalOcean
- [ ] **CDN provider**: Bunny.net (recomendado), Cloudflare R2, o AWS S3
- [ ] **Frecuencia inicial**: 3 posts/semana (conservador) vs 5 posts/semana
      (agresivo)
- [ ] **Contenido initial**: Solo chollos vs chollos + outliers

### **Preguntas Abiertas**

- ¿Cuenta de Instagram ya existe o crear nueva?
- ¿Quién será responsable de manual review en Fase 1?
- ¿Presupuesto máximo mensual aprobado?
- ¿Estrategia monetización (sponsors, ads)?

---

**Última actualización**: 16 Oct 2025 07:45 UTC **Responsable**: Claude Code +
Fran **Estado**: 🔴 Pre-Launch - En progreso

**Próxima revisión**: 17 Oct 2025 (daily standup)
