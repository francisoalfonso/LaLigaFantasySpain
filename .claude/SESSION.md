# 🎯 SESSION - Source of Truth Único del Proyecto

**REGLA DE ORO**: Este es el ÚNICO archivo que Claude Code y Usuario consultan/actualizan cada sesión.

**Última actualización**: 4 Octubre 2025, 12:00h
**Sesión actual**: #46
**Fase**: Automatización Instagram Chollos

---

## ⚡ QUICK STATUS (Leer primero - 2 min)

| Pregunta | Respuesta |
|----------|-----------|
| **¿Dónde estamos?** | Automatización chollos Instagram (80% completo) |
| **¿Qué hicimos ayer?** | Sistema VEO3 optimizado (PlayerNameOptimizer + Diccionario) |
| **¿Qué haremos HOY?** | Activar workflows n8n Lunes (Reel) + Martes (Carrusel) |
| **¿Qué está bloqueado?** | ContentDrips API key (para carruseles Martes) |
| **¿Cuándo termina esto?** | 7 Oct - Primer Reel automático / 8 Oct - Primer Carrusel |

---

## 📅 SESIÓN ANTERIOR (3 Oct 2025)

### ✅ Completamos
1. PlayerNameOptimizer - Solo apellidos para evitar Error 422
2. Sistema Diccionario Progresivo - Apodos verificados automáticamente
3. Integración E2E validada - API → VEO3 → Video
4. Ahorro 50% costos VEO3 ($0.30-0.60 vs $0.60-0.90)
5. Documentación completa en `docs/VEO3_OPTIMIZACION_PROMPT_BUILDER_DICCIONARIO.md`

### 📝 Decisiones Tomadas
- Solo apellidos en prompts VEO3 (NUNCA nombres completos)
- Diccionario JSON progresivo que aprende automáticamente
- Prompts simples sin transiciones para mantener consistencia Ana

### 🔧 Archivos Modificados
- `backend/services/veo3/promptBuilder.js`
- `backend/services/veo3/playerNameOptimizer.js`
- `backend/services/veo3/veo3Client.js`

---

## 🎯 SESIÓN ACTUAL (4 Oct 2025)

### Objetivo Principal
**Cerrar automatización chollos Instagram** - Workflows n8n Lunes + Martes

### Lo Que Haremos Hoy
- [ ] Workflow n8n Lunes: Reel Ana Chollos (schedule 10:00 AM)
- [ ] Workflow n8n Martes: Carrusel Top 10 (schedule 10:00 AM, requiere API key)
- [ ] Testing E2E automatización completa
- [ ] Primera ejecución real validada

### Estado Actual
- Sistema tracking `.claude/` y `STATUS/` creado ✅
- Discusión con usuario sobre simplificar a UN SOLO archivo ✅
- **AHORA**: Definiendo SESSION.md como source of truth único

---

## 🚫 BLOQUEADORES ACTIVOS

### 1. ContentDrips API key
- **Afecta**: Workflow Martes (carruseles)
- **Severity**: Media (no bloquea Lunes)
- **Owner**: Usuario
- **Workaround**: Hacer solo Lunes primero

---

## 📚 DECISIONES ARQUITECTÓNICAS (NUNCA CAMBIAR)

### Decisión #1: Estrategia Instagram 70/20/10
**Fecha**: 1 Oct 2025
**Documento**: `docs/INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md`
**Qué significa**:
- 70% Reels Ana (5/semana)
- 20% Carruseles (2/semana)
- 10% Stories (diarias)

**Calendario semanal FIJO**:
- **Lunes**: Reel Ana Chollos (30s, 3 segmentos VEO3)
- **Martes**: Carrusel Top 10 Chollos (12 slides, ContentDrips)
- **Miércoles**: Reel Ana Predicción Capitán
- **Jueves**: Reel Ana Breaking News
- **Viernes**: Reel Ana Preview Jornada
- **Sábado**: Carrusel Alineaciones
- **Domingo**: Reel Ana Resumen

**NUNCA preguntar**: "¿Qué tipo de contenido prefieres?" - YA ESTÁ DEFINIDO

---

### Decisión #2: Automatización 100% desde Día 1
**Fecha**: 25 Ago 2025 (inicio proyecto)
**Documento**: `PLAN_MAESTRO_AUTOMATIZACION_COMPLETA.md`
**Qué significa**:
- Proyecto SIEMPRE fue diseñado para automatización 100%
- 8 workflows n8n creados desde Sept 2025
- Backend + VEO3 + n8n = stack automatización completo

**NUNCA decir**: "No está preparado para automatización" - SÍ LO ESTÁ

---

### Decisión #3: Solo Apellidos VEO3
**Fecha**: 3 Oct 2025
**Documento**: `docs/VEO3_NOMBRES_BLOQUEADOS.md`
**Qué significa**:
- KIE.ai bloquea nombres completos futbolistas (Error 422)
- Solo usar apellidos o apodos en prompts
- Diccionario progresivo aprende apodos válidos

**NUNCA usar**: "Iago Aspas" → ✅ "Aspas"

---

### Decisión #4: ContentDrips para Carruseles
**Fecha**: 1 Oct 2025
**Documento**: `docs/INSTAGRAM_CARRUSELES_AUTOMATIZACION.md`
**Qué significa**:
- ContentDrips API ($39/mes) elegida sobre Bannerbear/Placid
- Integración nativa n8n
- Template system con labeled elements

**NUNCA preguntar**: "¿Qué herramienta usar para carruseles?" - YA DECIDIDO

---

### Decisión #5: VEO3 Único - Descarte Bunny.net y HeyGen
**Fecha**: 4 Oct 2025
**Qué significa**:
- **Bunny.net DESCARTADO**: Problemas técnicos + no aporta valor vs VEO3
- **HeyGen DESCARTADO**: VEO3 (KIE.ai) ya genera videos Ana perfectos
- **Stack video definitivo**: Solo VEO3 (KIE.ai) para generación + hosting integrado
- **Almacenamiento**: Archivos locales en `output/veo3/` + CDN propio si necesario

**Razón crítica**: VEO3 integra generación + hosting + Ana consistente. Bunny.net añadía complejidad sin beneficio.

**NUNCA usar**: Bunny.net Stream API, HeyGen API

---

## 📊 ESTADO FUNCIONALIDADES

### ✅ Completadas (100%)

| Funcionalidad | Completada | Documentación |
|---------------|------------|---------------|
| API-Sports Integration | 10 Sept | `backend/services/apiFootball.js` |
| BargainAnalyzer | 20 Sept | `backend/services/bargainAnalyzer.js` |
| VEO3 Video System | 3 Oct | `backend/services/veo3/veo3Client.js` |
| Supabase Database | 15 Sept | `database/supabase-schema.sql` |
| Instagram Routes | 1 Oct | `backend/routes/instagram.js` |

### 🔄 En Progreso

| Funcionalidad | Progreso | Bloqueador | Target |
|---------------|----------|------------|--------|
| Chollos Lunes (Reel Ana) | 80% | Ninguno | 7 Oct |
| Carruseles Martes | 60% | API key | 8 Oct |
| Testing VEO3 Producción | 0% | Ninguno | 5-6 Oct |

### ⚪ Backlog

| Funcionalidad | Prioridad | Effort | Target |
|---------------|-----------|--------|--------|
| Workflows n8n restantes (6 de 8) | P1 | 2 días | 15-20 Oct |
| YouTube Shorts | P1 | 3 días | 25-31 Oct |
| Instagram Stories | P1 | 2 días | 22-25 Oct |

---

## 🗂️ SISTEMA DE DOCUMENTACIÓN

### ⚠️ REGLAS CRÍTICAS

1. **CONSULTAR `.claude/DOCS_INDEX.md` ANTES DE CREAR ARCHIVOS** - Índice maestro de TODA la documentación
2. **SOLO CREAR si ABSOLUTAMENTE necesario** - Primero verificar si info va en archivo existente
3. **SIEMPRE REGISTRAR en DOCS_INDEX.md** - Ningún documento nuevo sin registro
4. **ARCHIVAR documentos obsoletos** - Ver carpeta `archived/` y su README.md

---

### Índice Maestro

📋 **`.claude/DOCS_INDEX.md`** - Registro completo de todos los documentos del proyecto con:
- Categorización por tipo (12 categorías)
- Propósito de cada documento
- Última consulta
- Cuándo usar cada uno
- Estado (Vigente/Fusionar/Archivar)

**Consultar SIEMPRE antes de**:
- Crear nuevo documento
- Buscar información específica
- Decidir dónde documentar algo nuevo

---

### Documentos Vigentes Principales

#### Arquitectura y Decisiones

| Archivo | Propósito | Consultar cuando |
|---------|-----------|------------------|
| `.claude/SESSION.md` | **Source of truth único** | Inicio de CADA sesión |
| `CLAUDE.md` | Guía técnica completa + normas críticas | Info arquitectura/desarrollo |
| `PLAN_MAESTRO_AUTOMATIZACION_COMPLETA.md` | Visión automatización 100% | Recordar objetivos proyecto |
| `README.md` | Overview proyecto público | Nunca (para externos) |

#### Estrategia de Contenido

| Archivo | Propósito | Consultar cuando |
|---------|-----------|------------------|
| `docs/INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md` | Estrategia 70/20/10 DEFINITIVA | Calendario contenido |
| `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md` | 8 workflows n8n completos | Info workflows específicos |
| `docs/VEO3_GUIA_COMPLETA.md` | **Sistema VEO3 consolidado** 🆕 | TODO sobre VEO3 |

#### Implementación Técnica

| Archivo | Propósito | Consultar cuando |
|---------|-----------|------------------|
| `docs/INSTAGRAM_CARRUSELES_AUTOMATIZACION.md` | ContentDrips setup completo | Configurar carruseles |
| `workflows/n8n-carousel-top-chollos.json` | Workflow carrusel Martes | Importar workflow n8n |
| `frontend-public/src/app/page.tsx` | **Landing Pública Next.js** 🌐 | Actualizar página usuario final |

**Landing Pública**: Hero + Equipo Reporteros (Ana activa, Carlos/Lucía/Pablo próximamente) + Funcionalidades + Stats + CTAs

---

### Archivos Archivados

📦 **`archived/README.md`** - Guía completa de estructura archivado

**39 archivos archivados** en:
- `2025-08/investigacion-mercado/` (5 archivos)
- `2025-09/auditorias/` (4 archivos)
- `2025-09/implementaciones-completadas/` (5 archivos)
- `2025-09/validaciones/` (3 archivos)
- `2025-09/planes-obsoletos/` (3 archivos)
- `2025-10/veo3-fixes/` (8 archivos debugging histórico)
- `2025-10/veo3-consolidacion/` (7 archivos → fusionados en VEO3_GUIA_COMPLETA.md)
- `futuro/modernizacion-frontend/` (2 archivos Next.js)
- `infraestructura/` (1 archivo CONTRIBUTING.md)

**Consultar archivos archivados cuando**:
- Necesites ver historial decisiones
- Debugging de problemas antiguos
- Justificar arquitectura actual
- Preparar migración futura (Next.js)

---

## 📊 MÉTRICAS PROYECTO

### Desarrollo
- **Días desarrollo**: 46
- **Funcionalidades completadas**: 23/35 (66%)
- **Líneas código**: ~15,000
- **Tests passing**: 45/48 (94%)

### Costos Mensuales
- **API-Sports**: $29/mes ✅
- **VEO3**: ~$6/mes ✅
- **Supabase**: $0/mes ✅
- **ContentDrips**: $39/mes ⏳ (pendiente activar)
- **TOTAL activo**: $35/mes
- **TOTAL proyectado**: $74/mes

---

## 🔄 WORKFLOW SESIÓN (Para Claude Code)

### Al Inicio de Cada Día

```
1. Leer SESSION.md sección "QUICK STATUS" (2 min)
2. Leer SESSION.md sección "SESIÓN ANTERIOR" (2 min)
3. Leer SESSION.md sección "SESIÓN ACTUAL" (1 min)
4. Verificar "DECISIONES ARQUITECTÓNICAS" relevantes (2 min)
5. Consultar documentos externos SOLO si necesario (5 min)

TOTAL: 7-12 min ANTES de responder al usuario
```

### Al Final de Cada Día

```
1. Actualizar sección "SESIÓN ACTUAL" (5 min):
   - Marcar tareas completadas
   - Agregar decisiones tomadas
   - Documentar bloqueadores nuevos

2. Crear entrada "SESIÓN ANTERIOR" para mañana (5 min):
   - Copiar "SESIÓN ACTUAL" → "SESIÓN ANTERIOR"
   - Limpiar "SESIÓN ACTUAL" para mañana

3. Actualizar "ESTADO FUNCIONALIDADES" si cambió (2 min)

4. Actualizar "ÍNDICE DE DOCUMENTOS" si creamos algo (1 min)

TOTAL: 13 min al final del día
```

---

## 🎯 HITOS IMPORTANTES

**Definición**: Un hito es un logro significativo que cambia el estado del proyecto.

### Hito #1: MVP Backend + Frontend (15 Sept 2025)
- API-Sports integrada
- BargainAnalyzer funcionando
- Dashboard Alpine.js
- Supabase PostgreSQL

### Hito #2: Sistema VEO3 Base (30 Sept 2025)
- VEO3Client operacional
- ViralVideoBuilder (3 segmentos)
- VideoConcatenator
- 8 workflows n8n creados

### Hito #3: VEO3 Optimizado (3 Oct 2025)
- PlayerNameOptimizer
- Diccionario Progresivo
- Ahorro 50% costos
- Tasa éxito 85-90%

### Hito #4: Sistema Tracking (4 Oct 2025)
- Carpetas `.claude/` y `STATUS/`
- SESSION.md como source of truth
- Workflow sesión definido

### Hito #5: Automatización Instagram (TARGET: 7-8 Oct 2025)
- Workflow Lunes activo ⏳
- Workflow Martes activo ⏳
- Primera publicación automática ⏳

---

## 🚨 REGLAS DE ESTE ARCHIVO

### OBLIGATORIO

1. ✅ **Actualizar al final de CADA sesión** (sin excepción)
2. ✅ **Leer al inicio de CADA sesión** (antes de responder)
3. ✅ **Documentar TODOS los hitos** importantes
4. ✅ **Registrar TODOS los documentos** externos creados
5. ✅ **Mantener DECISIONES actualizadas** (nunca borrar)

### PROHIBIDO

1. ❌ **NO crear documentos paralelos** sin registrar aquí
2. ❌ **NO duplicar información** que ya está aquí
3. ❌ **NO omitir bloqueadores** (documentar siempre)
4. ❌ **NO cambiar decisiones** sin discutir con usuario
5. ❌ **NO asumir contexto** - siempre leer primero

---

## 📝 NOTAS IMPORTANTES

### Lecciones Aprendidas

1. **KIE.ai bloquea nombres completos** - Solo apellidos
2. **VEO3 necesita prompts simples** - Sin transiciones complejas
3. **Carruseles > Reels en engagement** - +12% interacciones
4. **Documentación única esencial** - Múltiples archivos = confusión

### Deuda Técnica

- NEXT_TASK.md deprecado (usar SESSION.md)
- Archivos en `STATUS/` pueden ser redundantes (evaluar)
- Algunos workflows n8n inactivos (activar gradualmente)

---

**Mantenido por**: Claude Code + Usuario (colaborativo)
**Formato**: Actualizar al inicio/final de cada sesión
**Propósito**: Source of Truth único y compartido del proyecto
