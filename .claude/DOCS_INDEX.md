# 📚 ÍNDICE MAESTRO DE DOCUMENTACIÓN

**Creado**: 4 Octubre 2025, 13:30h
**Propósito**: Registro único de TODOS los documentos del proyecto con objetivo, última consulta y cuándo usar cada uno
**Mantenido por**: Claude Code + Usuario (colaborativo)

---

## 🎯 REGLAS DE GESTIÓN DOCUMENTAL

### ✅ ANTES DE CREAR UN NUEVO ARCHIVO:

1. **Consultar este índice** - ¿Ya existe un documento relacionado?
2. **Reflexionar necesidad** - ¿Es estrictamente necesario o es información complementaria?
3. **Preferir fusión** - Si la información pertenece a un tema existente, ACTUALIZAR ese archivo
4. **Registrar aquí** - Si creamos nuevo archivo, OBLIGATORIO agregarlo a este índice

### 📋 INFORMACIÓN DE CADA DOCUMENTO:

- **Archivo**: Ruta completa del archivo
- **Objetivo**: ¿Para qué sirve este documento?
- **Última consulta**: Fecha última vez que se consultó
- **Cuándo usar**: ¿En qué situaciones consultar este archivo?
- **Estado**: Vigente / Archivado / Fusionado
- **Fusionar con**: Si debe fusionarse, ¿con qué archivo?

---

## 📊 ESTADÍSTICAS ACTUALES

- **Total documentos**: 70 archivos .md
- **Vigentes**: TBD (después de limpieza)
- **A archivar**: TBD
- **A fusionar**: TBD

---

## 🗂️ CATEGORÍAS DE DOCUMENTACIÓN

### 1. GUÍAS TÉCNICAS ACTIVAS (Consulta diaria/semanal)

| Archivo | Objetivo | Última consulta | Cuándo usar | Estado |
|---------|----------|-----------------|-------------|--------|
| `.claude/SESSION.md` | **SOURCE OF TRUTH único** - Estado actual, sesiones anteriores, decisiones arquitectónicas | 4 Oct 2025 | **OBLIGATORIO** inicio/fin cada sesión | ✅ VIGENTE |
| `CLAUDE.md` | Guía técnica completa - Normas VEO3, comandos, arquitectura | 4 Oct 2025 | Buscar info técnica específica, comandos npm | ✅ VIGENTE |
| `.claude/DOCS_INDEX.md` | Este archivo - Índice maestro de documentación | 4 Oct 2025 | Antes de crear/buscar documentos | ✅ VIGENTE |
| `README.md` | Overview público del proyecto | 1 Oct 2025 | Para externos (NO usar internamente) | ✅ VIGENTE |

**Justificación vigencia**: Estos 4 archivos son la **base operacional diaria** del proyecto.

---

### 2. DECISIONES ARQUITECTÓNICAS (Referencia permanente)

| Archivo | Objetivo | Última consulta | Cuándo usar | Estado | Acción |
|---------|----------|-----------------|-------------|--------|--------|
| `PLAN_MAESTRO_AUTOMATIZACION_COMPLETA.md` | Visión 100% automatización - Arquitectura 8 workflows n8n | 4 Oct 2025 | Recordar que proyecto ES automatización | ✅ VIGENTE | Ninguna |
| `docs/INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md` | Estrategia 70/20/10 - Calendario semanal fijo | 4 Oct 2025 | Dudas sobre calendario/mix contenido | ✅ VIGENTE | Ninguna |
| `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md` | 8 workflows n8n completos | 4 Oct 2025 | Info workflow específico | ✅ VIGENTE | Ninguna |
| `docs/INSTAGRAM_CARRUSELES_AUTOMATIZACION.md` | ContentDrips setup carruseles | 1 Oct 2025 | Configurar carruseles Martes | ✅ VIGENTE | Ninguna |

**Justificación vigencia**: Decisiones estratégicas que **NUNCA cambian** y definen la arquitectura del proyecto.

---

### 3. DOCUMENTACIÓN VEO3 (Sistema videos Ana)

**PROBLEMA DETECTADO**: 15+ archivos VEO3, muchos con información duplicada o histórica.

#### 📝 Propuesta de Fusión VEO3:

**CREAR**: `docs/VEO3_GUIA_COMPLETA.md` (fusionar todos estos):

| Archivo actual | Contenido clave | Última consulta | Estado | Acción |
|----------------|-----------------|-----------------|--------|--------|
| `docs/VEO3_CONFIGURACION_DEFINITIVA.md` | 6 normas críticas (Ana consistente, español España, etc.) | 3 Oct 2025 | ⚠️ FUSIONAR | → VEO3_GUIA_COMPLETA.md |
| `docs/VEO3_OPTIMIZACION_PROMPT_BUILDER_DICCIONARIO.md` | Sistema diccionario progresivo - Ahorro 50% | 3 Oct 2025 | ⚠️ FUSIONAR | → VEO3_GUIA_COMPLETA.md |
| `docs/VEO3_NOMBRES_BLOQUEADOS.md` | Lista nombres bloqueados KIE.ai Error 422 | 3 Oct 2025 | ⚠️ FUSIONAR | → VEO3_GUIA_COMPLETA.md |
| `docs/VEO3_TRANSICIONES_FRAME_TO_FRAME.md` | Técnica transiciones invisibles | 1 Oct 2025 | ⚠️ FUSIONAR | → VEO3_GUIA_COMPLETA.md |
| `docs/VEO3_FRAMEWORK_VIRAL_USO.md` | Framework viral 7 elementos | 30 Sept 2025 | ⚠️ FUSIONAR | → VEO3_GUIA_COMPLETA.md |
| `docs/VEO3_VIDEO_QUALITY_CHECKLIST.md` | Checklist calidad videos | 28 Sept 2025 | ⚠️ FUSIONAR | → VEO3_GUIA_COMPLETA.md |

**ARCHIVAR** (debugging histórico, ya no relevante):

| Archivo | Contenido | Razón archivo | Destino |
|---------|-----------|---------------|---------|
| `docs/VEO3_CAMBIOS_PLANO_FINAL.md` | Fix cambios de plano (3 Oct) | Ya solucionado, info en GUIA_COMPLETA | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_CAMBIOS_CONSISTENCIA_VIDEO.md` | Fix consistencia Ana | Ya solucionado, info en GUIA_COMPLETA | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_HALLAZGOS_BLOQUEOS_GOOGLE.md` | Hallazgos técnicos Google | Historial debugging | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_RESULTADOS_TEST_V3.md` | Resultados test V3 | Test histórico | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_ESTRATEGIA_CONSERVADORA_V3.md` | Estrategia retry V3 | Implementado en código | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_PROBLEMA_TRANSICIONES_INTERNAS.md` | Problema transiciones | Ya solucionado | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_ESTRATEGIA_VARIEDAD_VISUAL.md` | Estrategia variedad visual | Implementado | `archived/2025-10/veo3-fixes/` |
| `docs/VEO3_HOOK_CAPTION_OPTIMIZATION.md` | Optimización captions | Implementado | `archived/2025-10/veo3-fixes/` |

**RESULTADO**: 1 archivo vigente `VEO3_GUIA_COMPLETA.md` en lugar de 14 archivos dispersos.

---

### 4. DOCUMENTACIÓN YOUTUBE SHORTS

| Archivo | Objetivo | Última consulta | Cuándo usar | Estado |
|---------|----------|-----------------|-------------|--------|
| `docs/YOUTUBE_SHORTS_AUTOMATIZACION_COMPLETA.md` | Stack técnico completo YouTube Shorts | 1 Oct 2025 | Implementar YouTube Shorts | ✅ VIGENTE |
| `docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md` | Estrategia monetización YouTube | 1 Oct 2025 | Proyecciones revenue YouTube | ✅ VIGENTE |

**Justificación vigencia**: Backlog P1 para implementar en 2-4 semanas.

---

### 5. TAREAS Y PLANES (Historiales completados/obsoletos)

| Archivo | Contenido | Última actualización | Estado | Acción |
|---------|-----------|---------------------|--------|--------|
| `NEXT_TASK.md` | Tareas VEO3 optimización | 3 Oct 2025 | ❌ OBSOLETO | Archivar - Reemplazado por SESSION.md |
| `TAREAS_PENDIENTES.md` | Integración Instagram viral | 1 Oct 2025 | ❌ OBSOLETO | Archivar - Reemplazado por SESSION.md |
| `FIX_FANTASY_EVOLUTION_COMPLETADO.md` | Fix evolución jugadores | 30 Sept 2025 | ✅ COMPLETADO | Archivar - Tarea finalizada |

**Destino**: `archived/2025-09/planes-obsoletos/`

**Justificación**: SESSION.md ahora es el único punto de tracking. Estos archivos son historial.

---

### 6. AUDITORÍAS E INFORMES (Historial completado)

| Archivo | Contenido | Fecha | Estado | Acción |
|---------|-----------|-------|--------|--------|
| `AUDITORIA_PROYECTO_PROFESIONAL.md` | Auditoría profesional completa | 30 Sept 2025 | ✅ COMPLETADO | Archivar |
| `PLAN_IMPLEMENTACION_MEJORAS.md` | Plan mejoras post-auditoría | 30 Sept 2025 | ✅ COMPLETADO | Archivar |
| `RESUMEN_AUDITORIA_EJECUTIVO.md` | Resumen ejecutivo auditoría | 30 Sept 2025 | ✅ COMPLETADO | Archivar |
| `DATABASE_INITIALIZATION_REPORT.md` | Reporte init database | 15 Sept 2025 | ✅ COMPLETADO | Archivar |

**Destino**: `archived/2025-09/auditorias/`

**Justificación**: Informes históricos completados. Resultados ya aplicados al código.

---

### 7. ANÁLISIS DE MERCADO E INVESTIGACIÓN (One-time, archivable)

| Archivo | Contenido | Fecha | Estado | Acción |
|---------|-----------|-------|--------|--------|
| `ANALISIS_CONTENIDO_INFLUENCER.md` | Análisis competencia influencers | Ago 2025 | ✅ COMPLETADO | Archivar |
| `fantasy-competitors-analysis.md` | Análisis competidores Fantasy | Ago 2025 | ✅ COMPLETADO | Archivar |
| `docs/competitive-intelligence-research.md` | Research inteligencia competitiva | Ago 2025 | ✅ COMPLETADO | Archivar |
| `EJEMPLOS_CONTENIDO_REAL.md` | Ejemplos contenido real | Ago 2025 | ✅ COMPLETADO | Archivar |
| `RECOMENDACION_ESTRATEGICA.md` | Recomendación estratégica inicial | Ago 2025 | ✅ COMPLETADO | Archivar |

**Destino**: `archived/2025-08/investigacion-mercado/`

**Justificación**: Investigación inicial ya aplicada. Resultados en INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md.

---

### 8. GUÍAS Y FRAMEWORKS (Implementados en código)

| Archivo | Contenido | Fecha | Estado | Acción |
|---------|-----------|-------|--------|--------|
| `FRAMEWORK_GUIONES_VIRALES_ANA.md` | Framework guiones virales | Sept 2025 | ✅ IMPLEMENTADO | Archivar - Código en promptBuilder.js |
| `GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md` | Guía maestra contenido | Sept 2025 | ✅ IMPLEMENTADO | Archivar - Código en viralVideoBuilder.js |
| `ACTUALIZACION_FRAMEWORK_VIRAL.md` | Actualización framework | Sept 2025 | ✅ IMPLEMENTADO | Archivar - Ya en código |
| `SISTEMA_3_SEGMENTOS_STATS_CARDS.md` | Sistema 3 segmentos | Sept 2025 | ✅ IMPLEMENTADO | Archivar - Ya en código |
| `IMPLEMENTACION_VIRAL_PREVIEW.md` | Preview viral Instagram | 1 Oct 2025 | ✅ COMPLETADO | Archivar - Feature completada |

**Destino**: `archived/2025-09/implementaciones-completadas/`

**Justificación**: Documentación de implementación. Código ya en producción.

---

### 9. VALIDACIONES Y TESTING (Completado)

| Archivo | Contenido | Fecha | Estado | Acción |
|---------|-----------|-------|--------|--------|
| `WORKFLOW_CHOLLOS_VALIDATION.md` | Validación workflow chollos | Sept 2025 | ✅ COMPLETADO | Archivar |
| `WORKFLOW_5_INJURIES_SUMMARY.md` | Summary workflow lesiones | Sept 2025 | ✅ COMPLETADO | Archivar |
| `docs/GUIA_VALIDACION_FUNCIONALIDADES.md` | Guía validación funcionalidades | Sept 2025 | ✅ COMPLETADO | Archirar |

**Destino**: `archived/2025-09/validaciones/`

**Justificación**: Testing histórico. Workflows validados y activos.

---

### 10. ESTÁNDARES Y CONVENCIONES (¿Vigentes o fusionar?)

| Archivo | Contenido | Estado | Propuesta |
|---------|-----------|--------|-----------|
| `API_GUIDELINES.md` | Guidelines API design | ⚠️ EVALUAR | Fusionar con CLAUDE.md o archivar |
| `CODE_STYLE.md` | Estilo de código | ⚠️ EVALUAR | Fusionar con CLAUDE.md o archivar |
| `CONTENT_GUIDELINES.md` | Guidelines contenido | ⚠️ EVALUAR | Fusionar con INSTAGRAM_ESTRATEGIA |
| `DESIGN_SYSTEM.md` | Sistema de diseño | ⚠️ EVALUAR | Fusionar con CLAUDE.md o archivar |
| `UI_COMPONENTS.md` | Componentes UI | ⚠️ EVALUAR | Fusionar con CLAUDE.md o archivar |
| `CONTRIBUTING.md` | Guía contribución | ⚠️ EVALUAR | Archivar (proyecto privado) |

**Decisión pendiente**: ¿Estos archivos aportan valor o pueden fusionarse con CLAUDE.md?

---

### 11. DOCUMENTOS N8N

| Archivo | Objetivo | Estado |
|---------|----------|--------|
| `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md` | Resumen 8 workflows | ✅ VIGENTE |
| `docs/N8N_WORKFLOWS_ARCHITECTURE.md` | Arquitectura workflows | ✅ VIGENTE |
| `docs/N8N_WORKFLOW_1_CREATED.md` | Workflow 1 creado | ⚠️ FUSIONAR |
| `docs/N8N_WORKFLOW_1_FINAL_REPORT.md` | Reporte final workflow 1 | ⚠️ FUSIONAR |
| `docs/N8N_WORKFLOW_1_GUIA_CREACION.md` | Guía creación workflow 1 | ⚠️ FUSIONAR |
| `docs/n8n-workflow-6-post-jornada.md` | Workflow 6 post-jornada | ⚠️ FUSIONAR |

**Propuesta**: Fusionar workflows individuales en `N8N_WORKFLOWS_RESUMEN_COMPLETO.md`.

---

### 12. OTROS DOCUMENTOS

| Archivo | Contenido | Estado | Propuesta |
|---------|-----------|--------|-----------|
| `channel-naming-strategy.md` | Estrategia naming canal YouTube | ✅ COMPLETADO | Archivar |
| `SECURITY-SETUP.md` | Setup seguridad | ⚠️ EVALUAR | ¿Fusionar con CLAUDE.md? |
| `CHECKLIST_AGENTE_CONTENIDO.md` | Checklist agente contenido | ✅ COMPLETADO | Archivar |
| `INFORME_PUBLICACION_AUTOMATIZADA_REDES_SOCIALES.md` | Informe publicación | ✅ COMPLETADO | Archivar |
| `PLAN_PUBLICACION_REDES_SOCIALES.md` | Plan publicación | ✅ COMPLETADO | Archivar |
| `PROFESSIONAL_SETUP_COMPLETE.md` | Setup profesional completado | ✅ COMPLETADO | Archivar |
| `FRONTEND_MODERNIZATION.md` | Modernización frontend | ⚠️ EVALUAR | ¿Vigente o archivado? |
| `ARQUITECTURA_DUAL_FRONTEND.md` | Arquitectura dual frontend | ⚠️ EVALUAR | ¿Vigente o archivado? |
| `docs/VOCABULARIO_COMUNIDAD_FANTASY.md` | Vocabulario Fantasy | ✅ VIGENTE | Referencia útil |
| `docs/ROADMAP_PROXIMOS_PASOS.md` | Roadmap próximos pasos | ❌ OBSOLETO | Archivar - Usar SESSION.md |
| `docs/MCP_GUIA_USUARIO.md` | Guía MCP usuario | ✅ VIGENTE | Mantener |
| `docs/integration-findings.md` | Hallazgos integración | ✅ COMPLETADO | Archivar |
| `docs/VIDEO_FEEDBACK_ANALYSIS.md` | Análisis feedback videos | ✅ COMPLETADO | Archivar |
| `docs/INSTAGRAM_VIRAL_GUIDE_2025.md` | Guía viral Instagram 2025 | ⚠️ EVALUAR | ¿Fusionar con INSTAGRAM_ESTRATEGIA? |
| `docs/API_SPORTS_LIGAS_DISPONIBLES_UK_USA.md` | Ligas disponibles API-Sports | ✅ VIGENTE | Referencia útil |
| `docs/PROYECCION_MONETIZACION_COMPLETA_2025.md` | Proyección monetización | ✅ VIGENTE | Referencia útil |
| `docs/GUIA-MIGRACION-FANTASY-VEO3.md` | Guía migración VEO3 | ✅ COMPLETADO | Archivar |
| `docs/INDICE-MIGRACION-COMPLETA.md` | Índice migración | ✅ COMPLETADO | Archivar |
| `docs/VEO3_SISTEMA_RESILIENCIA_24_7.md` | Sistema resiliencia VEO3 | ⚠️ EVALUAR | ¿Fusionar con VEO3_GUIA_COMPLETA? |

---

## 📋 STATUS/ y .claude/ (Sistema tracking)

### STATUS/ (Detallado por funcionalidad)

| Archivo | Objetivo | Estado | Decisión |
|---------|----------|--------|----------|
| `STATUS/IN_PROGRESS.md` | Trabajo en progreso | ⚠️ REDUNDANTE | **¿Eliminar?** Info en SESSION.md |
| `STATUS/COMPLETED.md` | Historial completados | ⚠️ REDUNDANTE | **¿Eliminar?** Info en SESSION.md |
| `STATUS/BLOCKED.md` | Bloqueadores | ⚠️ REDUNDANTE | **¿Eliminar?** Info en SESSION.md |
| `STATUS/BACKLOG.md` | Backlog futuras features | ✅ MANTENER | Útil para planificación |

### .claude/ (Sistema tracking diario)

| Archivo | Objetivo | Estado | Decisión |
|---------|----------|--------|----------|
| `.claude/SESSION.md` | **SOURCE OF TRUTH ÚNICO** | ✅ VIGENTE | **MANTENER** |
| `.claude/DOCS_INDEX.md` | Este archivo - Índice maestro | ✅ VIGENTE | **MANTENER** |
| `.claude/README.md` | Guía uso sistema tracking | ✅ VIGENTE | **MANTENER** |
| `.claude/PROJECT_STATUS.md` | Estado actual proyecto | ⚠️ REDUNDANTE | **¿Eliminar?** Info en SESSION.md |
| `.claude/DAILY_LOG.md` | Log cronológico | ⚠️ REDUNDANTE | **¿Eliminar?** Info en SESSION.md |
| `.claude/PRIORITIES.md` | Prioridades P0/P1/P2 | ⚠️ REDUNDANTE | **¿Eliminar?** Info en SESSION.md |

---

## 📊 RESUMEN PROPUESTA DE REORGANIZACIÓN

### ✅ MANTENER VIGENTES (14 archivos)

**Core operacional**:
1. `.claude/SESSION.md` ⭐ SOURCE OF TRUTH
2. `.claude/DOCS_INDEX.md` ⭐ Este archivo
3. `.claude/README.md`
4. `CLAUDE.md`
5. `README.md`

**Decisiones arquitectónicas**:
6. `PLAN_MAESTRO_AUTOMATIZACION_COMPLETA.md`
7. `docs/INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md`
8. `docs/N8N_WORKFLOWS_RESUMEN_COMPLETO.md`
9. `docs/N8N_WORKFLOWS_ARCHITECTURE.md`
10. `docs/INSTAGRAM_CARRUSELES_AUTOMATIZACION.md`

**YouTube Shorts** (Backlog P1):
11. `docs/YOUTUBE_SHORTS_AUTOMATIZACION_COMPLETA.md`
12. `docs/YOUTUBE_SHORTS_ESTRATEGIA_MONETIZACION.md`

**Referencias útiles**:
13. `docs/VOCABULARIO_COMUNIDAD_FANTASY.md`
14. `docs/API_SPORTS_LIGAS_DISPONIBLES_UK_USA.md`

**Backlog**:
15. `STATUS/BACKLOG.md`

### 🔄 FUSIONAR (20+ archivos → 2 archivos)

**VEO3**: 14 archivos → `docs/VEO3_GUIA_COMPLETA.md`
**n8n workflows individuales**: 5 archivos → Fusionar en `N8N_WORKFLOWS_RESUMEN_COMPLETO.md`

### 📦 ARCHIVAR (35+ archivos)

**Estructura propuesta**:
```
archived/
├── 2025-08/
│   └── investigacion-mercado/          # 5 archivos análisis inicial
├── 2025-09/
│   ├── auditorias/                     # 4 archivos auditoría
│   ├── implementaciones-completadas/   # 5 archivos features completadas
│   ├── validaciones/                   # 3 archivos testing
│   └── planes-obsoletos/               # 3 archivos planes antiguos
└── 2025-10/
    └── veo3-fixes/                     # 8 archivos debugging VEO3
```

### ❓ EVALUAR CON USUARIO (10 archivos)

Archivos que requieren decisión:
- `API_GUIDELINES.md`, `CODE_STYLE.md`, `DESIGN_SYSTEM.md`, etc.
- `.claude/PROJECT_STATUS.md`, `DAILY_LOG.md`, `PRIORITIES.md`
- `STATUS/IN_PROGRESS.md`, `COMPLETED.md`, `BLOCKED.md`

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

1. **Validar con usuario** esta propuesta de reorganización
2. **Crear `docs/VEO3_GUIA_COMPLETA.md`** fusionando 14 archivos VEO3
3. **Crear estructura `archived/`** con carpetas por mes/tipo
4. **Mover archivos a archive** según tabla anterior
5. **Eliminar archivos redundantes** (si usuario aprueba)
6. **Actualizar SESSION.md** con referencias a archivos archivados
7. **Crear regla en SESSION.md**: "Consultar DOCS_INDEX.md antes de crear archivos"

---

## 📝 REGLAS MANTENIMIENTO ÍNDICE

### OBLIGATORIO:

1. ✅ **Antes de crear archivo** - Consultar este índice
2. ✅ **Después de crear archivo** - Registrarlo aquí inmediatamente
3. ✅ **Al consultar archivo** - Actualizar "Última consulta"
4. ✅ **Al archivar archivo** - Marcar como "Archivado" y documentar destino
5. ✅ **Revisión mensual** - Identificar candidatos a fusión/archivo

### PROHIBIDO:

1. ❌ Crear archivos .md sin registrar en este índice
2. ❌ Duplicar información entre archivos sin justificación
3. ❌ Mantener archivos obsoletos en raíz sin archivar
4. ❌ Archivar documentos sin documentar en este índice

---

**Próxima actualización**: Después de reorganización aprobada por usuario
**Responsable mantenimiento**: Claude Code (con validación usuario)
