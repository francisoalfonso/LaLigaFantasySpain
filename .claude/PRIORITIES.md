# Project Priorities - Fantasy La Liga Pro

**Última actualización**: 4 Octubre 2025, 10:50h

**Principio**: Enfoque en completar funcionalidades E2E antes de empezar nuevas.

---

## 🔥 P0 - CRÍTICO (Esta Semana - 4-10 Oct)

### 1. ✅ Sistema Tracking y Documentación
**Owner**: Claude Code
**Status**: ✅ COMPLETADO (4 Oct, 10:50h)
**Effort**: 2 horas

**Objetivo**: Setup sistema robusto documentación estado proyecto

**Tareas**:
- [x] Crear carpetas `.claude/` y `STATUS/`
- [x] `PROJECT_STATUS.md` - Estado actual
- [x] `DAILY_LOG.md` - Historial cronológico
- [x] `PRIORITIES.md` - Este archivo
- [ ] Archivos `STATUS/*.md`
- [ ] Migrar info NEXT_TASK.md
- [ ] Actualizar CLAUDE.md

**Impacto**: CRÍTICO - Sin esto, Claude Code arranca sin contexto cada día

---

### 2. 🔄 Automatización Instagram Chollos (Lunes)
**Owner**: Claude Code
**Status**: 🔄 EN PROGRESO (80%)
**Target**: 7 Oct 2025 (primer Reel automático)
**Effort**: 4 horas restantes

**Objetivo**: Publicación automática Reel Ana chollo cada Lunes 10:00 AM

**Componentes**:
- ✅ Backend: `/api/bargains/top` funcionando
- ✅ VEO3: ViralVideoBuilder operacional
- ✅ Instagram: Routes implementadas
- [ ] n8n Workflow: Schedule Lunes 10:00 AM
- [ ] Testing: E2E completo

**Bloqueadores**: Ninguno

**Próximo paso**: Crear/modificar workflow n8n #3 con schedule trigger

---

### 3. 🔄 Automatización Instagram Carruseles (Martes)
**Owner**: Claude Code + Usuario
**Status**: 🔄 EN PROGRESO (60%)
**Target**: 8 Oct 2025 (primer carrusel automático)
**Effort**: 3 horas + API key

**Objetivo**: Publicación automática carrusel Top 10 Chollos cada Martes 10:00 AM

**Componentes**:
- ✅ Backend: `/api/carousels/top-chollos` funcionando
- ✅ n8n Workflow JSON: Configurado
- ⚠️ ContentDrips API: Pendiente API key del usuario
- [ ] Testing: E2E con ContentDrips real

**Bloqueadores**:
- ⚠️ ContentDrips API key (Usuario debe proveer)

**Próximo paso**: Obtener API key ContentDrips + importar workflow n8n

---

### 4. ⚪ Testing VEO3 Producción
**Owner**: Claude Code
**Status**: ⚪ PENDIENTE
**Target**: 5-6 Oct 2025
**Effort**: 3 horas

**Objetivo**: Validar sistema VEO3 optimizado con 10 jugadores diferentes

**Tareas**:
- [ ] Generar 10 videos con jugadores variados
- [ ] Validar diccionario progresivo funciona
- [ ] Verificar tasas éxito >85%
- [ ] Confirmar Ana consistente todos videos
- [ ] Documentar cualquier edge case

**Bloqueadores**: Ninguno

**Próximo paso**: Ejecutar `npm run veo3:test-retry-v3` con 10 jugadores

---

## ⭐ P1 - IMPORTANTE (Este Mes - Octubre)

### 5. ⚪ Workflows n8n Restantes (6 de 8)
**Status**: ⚪ PENDIENTE
**Target**: 15-20 Oct 2025
**Effort**: 2 días

**Workflows a activar**:
1. Workflow #1: Sincronización Diaria (⚪ INACTIVE)
2. Workflow #4: Pipeline Contenido Semanal (⚪ INACTIVE)
3. Workflow #5: Monitor Lesiones (⚪ INACTIVE)
4. Workflow #6: Análisis Post-Jornada (⚪ INACTIVE)
5. Workflow #7: Optimización Plantilla (⚪ INACTIVE)
6. Workflow #8: Backup Automático (⚪ INACTIVE)

**Dependencias**:
- Workflows #2 y #3 funcionando correctamente
- n8n instance estable

**Próximo paso**: Activar Workflow #1 (más simple)

---

### 6. ⚪ Instagram Stories Automatización
**Status**: ⚪ PENDIENTE
**Target**: 22-25 Oct 2025
**Effort**: 2 días

**Objetivo**: Stories diarias automáticas (8% contenido)

**Tipos Stories**:
- Polls: "¿Quién será tu capitán?"
- Q&A: Respuestas dudas Fantasy
- Behind-scenes: Proceso creación videos Ana
- Stats: Datos curiosos jornada

**Dependencias**:
- Reels y Carruseles funcionando

---

### 7. ⚪ YouTube Shorts Setup Inicial
**Status**: ⚪ PENDIENTE
**Target**: 25-31 Oct 2025
**Effort**: 3 días

**Objetivo**: Primera publicación YouTube Shorts automática

**Componentes**:
- YouTube Data API v3 setup
- Adaptación videos VEO3 para Shorts
- Subtítulos automáticos (crítico - 85% sin audio)
- Workflow n8n publicación

**Dependencias**:
- Sistema VEO3 estable
- OAuth2 Google configurado

---

## 📋 P2 - DESEABLE (Próximo Mes - Noviembre)

### 8. ⚪ Dashboard Analytics
**Status**: ⚪ BACKLOG
**Effort**: 1 semana

**Objetivo**: Dashboard visualización métricas Instagram/YouTube

**Features**:
- Engagement rates por tipo contenido
- Alcance por día/semana
- Mejores horarios publicación
- ROI por tipo contenido

---

### 9. ⚪ Sistema de Alertas Proactivo
**Status**: ⚪ BACKLOG
**Effort**: 3 días

**Objetivo**: Alertas automáticas lesiones, alineaciones, cambios precio

**Features**:
- Monitor lesiones cada 2 horas
- Webhook cuando jugador clave lesionado
- Generación contenido "Breaking News" automático
- Publicación Instagram inmediata

---

### 10. ⚪ Optimización Costos
**Status**: ⚪ BACKLOG
**Effort**: 2 días

**Objetivo**: Reducir costos mensuales sin sacrificar calidad

**Áreas**:
- A/B testing variaciones prompts VEO3
- Caching más agresivo API-Sports
- Optimización número segmentos videos
- Análisis ROI por tipo contenido

---

## 🚫 BLOQUEADO - Pendiente Dependencias

### ContentDrips API Key
**Afecta**: Carruseles Instagram (P0 #3)
**Owner**: Usuario
**Action required**: Registrarse en ContentDrips y proveer API key
**Urgencia**: Alta (necesario para Martes 8 Oct)

### n8n Instance URL (Opcional)
**Afecta**: Workflows con webhooks
**Owner**: Usuario (si prefiere webhooks vs schedules)
**Action required**: Proveer URL instance n8n
**Urgencia**: Baja (schedules funcionan perfectamente)

---

## ✅ COMPLETADO RECIENTEMENTE

### VEO3 Sistema Optimizado (3 Oct)
- PlayerNameOptimizer implementado
- Sistema Diccionario Progresivo
- Reducción 50% costos
- Incremento 50% tasa éxito

### Estrategia Instagram Definida (1 Oct)
- 70% Reels + 20% Carruseles + 10% Stories
- Calendario semanal diseñado
- Herramienta carruseles elegida (ContentDrips)

### BargainAnalyzer Sistema (Sept)
- 200+ jugadores analizados en tiempo real
- API completa funcionando
- Frontend interactivo implementado

---

## 📊 Distribución de Esfuerzo

### Esta Semana (4-10 Oct)

| Prioridad | Tareas | Esfuerzo | % Tiempo |
|-----------|--------|----------|----------|
| P0 | 4 tareas | 12 horas | 80% |
| P1 | 0 tareas | 0 horas | 0% |
| P2 | 0 tareas | 0 horas | 0% |
| **Total** | **4 tareas** | **12 horas** | **100%** |

### Este Mes (Octubre)

| Prioridad | Tareas | Esfuerzo | % Tiempo |
|-----------|--------|----------|----------|
| P0 | 4 tareas | 12 horas | 35% |
| P1 | 3 tareas | 7 días | 60% |
| P2 | 0 tareas | 0 días | 0% |
| Contingencia | - | - | 5% |
| **Total** | **7 tareas** | **~12 días** | **100%** |

---

## 🎯 Criterios de Priorización

### P0 (Crítico)
- **Impacto**: Bloquea desarrollo futuro
- **Urgencia**: Necesario esta semana
- **Riesgo**: Alto si no se completa

### P1 (Importante)
- **Impacto**: Valor significativo al proyecto
- **Urgencia**: Deseable este mes
- **Riesgo**: Medio si se retrasa

### P2 (Deseable)
- **Impacto**: Nice to have
- **Urgencia**: Próximo mes aceptable
- **Riesgo**: Bajo si se postpone

---

**Mantenido por**: Claude Code
**Formato**: Actualizar cuando cambien prioridades
**Propósito**: Enfoque claro en lo que importa ahora
