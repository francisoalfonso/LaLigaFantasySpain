# Prioridades - Fantasy La Liga Pro

**Última actualización**: 2025-10-09 15:30

## 🔴 P0 - CRÍTICO (Hacer HOY)

### ✅ COMPLETADO
- [x] **Estructura `.claude/` reglas centralizadas**
  - `.cursorrules` creado
  - `.claude/START_HERE.md` punto de entrada único
  - `.claude/rules/01-CRITICAL-RULES.md` reglas inquebrantables
  - Migración completa: CODE_STYLE, API_GUIDELINES, NORMAS_DESARROLLO

### 🚧 EN PROGRESO
- [ ] **Completar workflows `.claude/workflows/`**
  - session-start.md
  - new-feature.md  
  - debugging.md
  - deployment.md

- [ ] **Crear archivos referencia `.claude/reference/`**
  - endpoints.md
  - services.md
  - commands.md
  - troubleshooting.md

## 🟡 P1 - IMPORTANTE (Esta semana)

### Testing y Validación
- [ ] **Validación E2E flujo Instagram chollos virales**
  - Endpoint: `/api/instagram/preview-viral`
  - Frontend: `instagram-viral-preview.html`
  - Backend: Sistema versionado prompts

- [ ] **Testing sistema versionado prompts VEO3**
  - Persistencia backend + localStorage
  - Historial de versiones funcional
  - Comparación de versiones

### Documentación Oficial APIs
- [ ] **Descargar documentación oficial API-Sports**
  - Archivo: `/docs/API_SPORTS_OFICIAL.md`
  - Requerido según norma #4 desarrollo
  - Bloquea implementaciones futuras

- [ ] **Descargar documentación oficial Bunny.net Stream**
  - Archivo: `/docs/BUNNY_STREAM_API_OFICIAL.md`
  - Requerido para optimizaciones

## 🟢 P2 - NICE TO HAVE (Próximas semanas)

### Optimizaciones
- [ ] **Optimizar sistema de cache VEO3**
  - Reducir regeneraciones innecesarias
  - Cache inteligente por jugador

- [ ] **Implementar métricas avanzadas**
  - Tracking éxito/fallo VEO3
  - Análisis patrones prompts exitosos

### Nuevas Funcionalidades
- [ ] **Sistema de A/B testing prompts**
  - Comparación automática versiones
  - Métricas de engagement

- [ ] **Integración ContentDrips API**
  - Carousels automáticos
  - Dependiente: activación cuenta

## ⏸️ BLOQUEADO

### APIs Externas
- [ ] **ContentDrips API** - Pendiente activación cuenta
- [ ] **HeyGen API** - Futura integración avatares

### Documentación Pendiente
- [ ] **API-Sports oficial** - Requerida para P1
- [ ] **Bunny.net Stream oficial** - Requerida para P1

## 📊 Métricas Prioridades

| Prioridad | Total | Completado | En Progreso | Bloqueado |
|-----------|-------|------------|--------------|-----------|
| P0 | 3 | 1 | 2 | 0 |
| P1 | 4 | 0 | 0 | 2 |
| P2 | 4 | 0 | 0 | 0 |
| **TOTAL** | **11** | **1** | **2** | **2** |

## 🎯 Objetivos Semana

### Esta Semana (Oct 9-15)
1. ✅ Completar workflows `.claude/workflows/`
2. ✅ Crear archivos referencia `.claude/reference/`
3. ✅ Validación E2E Instagram chollos virales
4. ✅ Testing sistema versionado VEO3

### Próxima Semana (Oct 16-22)
1. Descargar documentación oficial APIs
2. Optimizar sistema cache VEO3
3. Implementar métricas avanzadas

## 🚨 Bloqueadores Críticos

1. **ContentDrips API**: Sin activación cuenta
   - Impacto: Carousels automáticos bloqueados
   - Acción: Contactar soporte ContentDrips

2. **Documentación API-Sports**: No descargada
   - Impacto: Implementaciones futuras sin guía oficial
   - Acción: Descargar docs oficiales

## 📝 Decisiones Técnicas Pendientes

- [ ] **Estrategia cache VEO3**: ¿Redis o memoria?
- [ ] **Métricas tracking**: ¿Qué KPIs medir?
- [ ] **A/B testing**: ¿Framework o custom?

---

**Próxima revisión**: 2025-10-16
**Responsable**: Claude + Fran
**Estado**: ✅ **EN PROGRESO** - P0 completado, P1 en curso


