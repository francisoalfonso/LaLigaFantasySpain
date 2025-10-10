# 📦 Documentos Archivados

**Creado**: 4 Octubre 2025
**Propósito**: Almacenar documentos históricos, completados o planificados para futuro

---

## 📁 Estructura de Carpetas

### Por Mes (Documentos Completados)

```
archived/
├── 2025-08/
│   └── investigacion-mercado/      # Análisis inicial competencia y mercado
├── 2025-09/
│   ├── auditorias/                 # Auditorías profesionales completadas
│   ├── implementaciones-completadas/ # Features finalizadas e implementadas
│   ├── validaciones/               # Testing y validaciones históricas
│   └── planes-obsoletos/           # Planes reemplazados por SESSION.md
└── 2025-10/
    └── veo3-fixes/                 # Debugging y fixes históricos VEO3
```

### Por Tipo (Documentos Futuros/Infraestructura)

```
archived/
├── futuro/
│   └── modernizacion-frontend/     # Docs para migración Next.js (futuro)
└── infraestructura/                # Docs infraestructura no aplicables
```

---

## 🗂️ Contenido por Carpeta

### 2025-08/investigacion-mercado/

**Documentos** (5 archivos):
- `ANALISIS_CONTENIDO_INFLUENCER.md`
- `fantasy-competitors-analysis.md`
- `competitive-intelligence-research.md`
- `EJEMPLOS_CONTENIDO_REAL.md`
- `RECOMENDACION_ESTRATEGICA.md`

**Razón de archivo**: Investigación inicial ya aplicada. Resultados consolidados en `INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md`.

**Consultar cuando**: Necesites recordar análisis competencia inicial o justificar decisiones estratégicas.

---

### 2025-09/auditorias/

**Documentos** (4 archivos):
- `AUDITORIA_PROYECTO_PROFESIONAL.md`
- `PLAN_IMPLEMENTACION_MEJORAS.md`
- `RESUMEN_AUDITORIA_EJECUTIVO.md`
- `DATABASE_INITIALIZATION_REPORT.md`

**Razón de archivo**: Auditorías completadas. Mejoras ya aplicadas al código.

**Consultar cuando**: Necesites ver historial de mejoras profesionales o justificar arquitectura actual.

---

### 2025-09/implementaciones-completadas/

**Documentos** (5 archivos):
- `FRAMEWORK_GUIONES_VIRALES_ANA.md`
- `GUIA_MAESTRA_CONTENIDO_INSTAGRAM_VEO3.md`
- `ACTUALIZACION_FRAMEWORK_VIRAL.md`
- `SISTEMA_3_SEGMENTOS_STATS_CARDS.md`
- `IMPLEMENTACION_VIRAL_PREVIEW.md`

**Razón de archivo**: Features completadas. Código ya en producción (viralVideoBuilder.js, promptBuilder.js, etc.).

**Consultar cuando**: Necesites ver documentación original de implementación o entender decisiones de diseño.

---

### 2025-09/validaciones/

**Documentos** (3 archivos):
- `WORKFLOW_CHOLLOS_VALIDATION.md`
- `WORKFLOW_5_INJURIES_SUMMARY.md`
- `GUIA_VALIDACION_FUNCIONALIDADES.md`

**Razón de archivo**: Testing histórico. Workflows validados y activos.

**Consultar cuando**: Necesites ver proceso de validación histórico o debugging de workflows.

---

### 2025-09/planes-obsoletos/

**Documentos** (3 archivos):
- `NEXT_TASK.md`
- `TAREAS_PENDIENTES.md`
- `FIX_FANTASY_EVOLUTION_COMPLETADO.md`

**Razón de archivo**: Planes antiguos reemplazados por `.claude/SESSION.md` como source of truth único.

**Consultar cuando**: Necesites ver historial de tareas completadas antes del sistema SESSION.md.

---

### 2025-10/veo3-fixes/

**Documentos** (8 archivos):
- `VEO3_CAMBIOS_PLANO_FINAL.md`
- `VEO3_CAMBIOS_CONSISTENCIA_VIDEO.md`
- `VEO3_HALLAZGOS_BLOQUEOS_GOOGLE.md`
- `VEO3_RESULTADOS_TEST_V3.md`
- `VEO3_ESTRATEGIA_CONSERVADORA_V3.md`
- `VEO3_PROBLEMA_TRANSICIONES_INTERNAS.md`
- `VEO3_ESTRATEGIA_VARIEDAD_VISUAL.md`
- `VEO3_HOOK_CAPTION_OPTIMIZATION.md`

**Razón de archivo**: Debugging histórico VEO3. Fixes ya aplicados. Info consolidada en `docs/VEO3_GUIA_COMPLETA.md`.

**Consultar cuando**: Necesites ver historial de problemas VEO3 resueltos o entender evolución del sistema.

---

### 2025-10/veo3-consolidacion/

**Documentos** (7 archivos fusionados):
- `VEO3_CONFIGURACION_DEFINITIVA.md`
- `VEO3_OPTIMIZACION_PROMPT_BUILDER_DICCIONARIO.md`
- `VEO3_NOMBRES_BLOQUEADOS.md`
- `VEO3_FRAMEWORK_VIRAL_USO.md`
- `VEO3_TRANSICIONES_FRAME_TO_FRAME.md`
- `VEO3_VIDEO_QUALITY_CHECKLIST.md`
- `VEO3_SISTEMA_RESILIENCIA_24_7.md`

**Razón de archivo**: Documentos vigentes fusionados en **`docs/VEO3_GUIA_COMPLETA.md`** (4 Oct 2025).

**Consultar cuando**:
- Necesites ver versiones originales antes de la fusión
- Historial específico de cada componente VEO3
- Debugging de configuraciones antiguas

**IMPORTANTE**: Para info actualizada VEO3, usar SIEMPRE `docs/VEO3_GUIA_COMPLETA.md`.

---

### futuro/modernizacion-frontend/

**Documentos** (2 archivos):
- `DESIGN_SYSTEM.md`
- `UI_COMPONENTS.md`

**Razón de archivo**: Documentos para **migración futura a Next.js + React**. Frontend actual es Alpine.js + Vanilla JS.

**Consultar cuando**: Se decida migrar frontend de Alpine.js a Next.js (fase futura). Documentos muy completos y listos para implementar.

**Nota importante**: Estos docs NO son obsoletos, son **preparación para futuro**. Stack completo:
- Next.js 14+
- TypeScript
- Tailwind + CSS Variables
- shadcn/ui components
- Framer Motion
- Radix UI primitives
- Dark mode con next-themes

---

### infraestructura/

**Documentos** (1 archivo):
- `CONTRIBUTING.md`

**Razón de archivo**: Proyecto es **privado** (1 desarrollador + Claude Code). Documento típico de proyectos open-source.

**Consultar cuando**: Se decida abrir proyecto como open-source en futuro.

---

## 📊 Estadísticas

**Total archivos archivados**: ~35-40 archivos
**Espacio liberado en raíz**: ~40% documentos
**Documentos vigentes**: ~15 archivos esenciales

---

## 🔍 Cómo Buscar Documentos Archivados

### Por Fecha
```bash
# Ver todo de agosto 2025
ls archived/2025-08/**/*.md

# Ver todo de septiembre 2025
ls archived/2025-09/**/*.md
```

### Por Tipo
```bash
# Auditorías
ls archived/2025-09/auditorias/*.md

# Implementaciones
ls archived/2025-09/implementaciones-completadas/*.md

# VEO3 fixes
ls archived/2025-10/veo3-fixes/*.md
```

### Por Nombre (desde raíz)
```bash
# Buscar archivo específico
find archived -name "*AUDITORIA*.md"
find archived -name "*VEO3*.md"
```

---

## 📋 Reglas de Archivo

### ✅ ARCHIVAR cuando:
1. Documento completado (features implementadas)
2. Plan obsoleto (reemplazado por SESSION.md)
3. Auditoría histórica (mejoras ya aplicadas)
4. Testing/validación completado
5. Investigación one-time aplicada
6. Documento para futuro (no stack actual)

### ❌ NO ARCHIVAR:
1. Decisiones arquitectónicas vigentes
2. Documentos consultados regularmente
3. Guías técnicas activas
4. Documentación de código en uso

---

## 🔄 Recuperar Documentos

Si necesitas recuperar un documento archivado:

```bash
# Copiar de vuelta a raíz
cp archived/2025-09/auditorias/AUDITORIA_PROYECTO_PROFESIONAL.md .

# O mover de vuelta
mv archived/2025-09/auditorias/AUDITORIA_PROYECTO_PROFESIONAL.md .
```

**Importante**: Actualizar `.claude/DOCS_INDEX.md` si recuperas documento.

---

## 📝 Mantenimiento

- **Mensual**: Revisar si hay nuevos documentos para archivar
- **Cada milestone**: Archivar documentos completados del milestone
- **Anual**: Comprimir carpetas antiguas (>12 meses)

---

**Mantenido por**: Claude Code + Usuario
**Última revisión**: 4 Octubre 2025
**Próxima revisión**: Noviembre 2025
