# Prioridades - Fantasy La Liga Pro

**Última actualización**: 2025-10-11 13:16

## 🔴 P0 - CRÍTICO (Hacer HOY - 12 Oct)

### 🚧 EN PROGRESO

- [ ] **Testing E2E sistema VEO3 optimizado**
    - Comando: `npm run veo3:test-nano-banana`
    - Validar logs: "✅ IDEAL" en diálogos 40-45 palabras
    - Comparar con video problemático: db72769c3ec28b017d768ddf880d98df
    - **Checklist verificación**:
        - ❌ NO hay silencios largos (>1s)
        - ❌ NO hay voz en off inventada
        - ✅ Ana habla fluido todo el segmento
        - ✅ Transiciones invisibles frame-to-frame
        - ✅ Acciones físicas progresivas

### ✅ COMPLETADO (11 Oct)

- [x] **Optimización prompts VEO3 playground-style**
    - Nuevo método `buildEnhancedNanoBananaPrompt()` en promptBuilder.js
    - Diálogos extendidos: 10 → 40-45 palabras (+320%)
    - Duración segmentos: 7s → 8s (estándar playground)
    - Velocidad habla: 2.5 → 5 palabras/segundo (natural)
    - Endpoint veo3.js actualizado
    - Documento resumen: RESUMEN-MEJORA-PROMPTS-VEO3-11OCT2025.md
    - Commit: 09b4619, Push: ✅ GitHub

### ✅ COMPLETADO (9-10 Oct)

- [x] **Estructura `.claude/` reglas centralizadas**
    - `.cursorrules` creado
    - `.claude/START_HERE.md` punto de entrada único
    - `.claude/rules/01-CRITICAL-RULES.md` reglas inquebrantables
    - Migración completa: CODE_STYLE, API_GUIDELINES, NORMAS_DESARROLLO

## 🟡 P1 - IMPORTANTE (Esta semana 14-18 Oct)

### Iteración según resultados test

- [ ] **Ajustes post-testing si necesario**
    - Analizar feedback de videos generados
    - Ajustar rangos palabras si >50% fuera de ideal
    - Refinar mapeo emociones → tonos si inconsistencias
    - Actualizar documento resumen con resultados reales

### Workflows y Referencia (postponed desde P0)

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

| Prioridad | Total  | Completado | En Progreso | Bloqueado |
| --------- | ------ | ---------- | ----------- | --------- |
| P0        | 3      | 2          | 1           | 0         |
| P1        | 5      | 0          | 0           | 2         |
| P2        | 4      | 0          | 0           | 0         |
| **TOTAL** | **12** | **2**      | **1**       | **2**     |

## 🎯 Objetivos Semana

### Esta Semana (Oct 9-15)

1. ✅ Estructura reglas `.claude/` centralizada
2. ✅ Optimización prompts VEO3 playground-style
3. 🚧 Testing E2E sistema VEO3 optimizado (mañana 12 Oct)
4. ⏸️ Workflows y archivos referencia (postponed a P1)

### Próxima Semana (Oct 14-18)

1. Iteración según resultados test VEO3
2. Completar workflows y archivos referencia
3. Descargar documentación oficial APIs
4. Optimizar sistema cache VEO3

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

**Próxima revisión**: 2025-10-12 (post-test E2E) **Responsable**: Claude + Fran
**Estado**: ✅ **P0 CASI COMPLETO** - Optimización VEO3 implementada, pendiente
validación E2E
