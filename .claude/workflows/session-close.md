# Workflow: Cierre de Sesión

## 🔄 Proceso de Auto-Guardado (OBLIGATORIO)

### 1. Actualizar Status del Proyecto (2 min)

#### A. Actualizar CURRENT-SPRINT.md
```markdown
## ✅ Completado Hoy
- [x] [Descripción tarea completada]
- [x] [Otra tarea completada]

## 🚧 En Progreso  
- [ ] [Tarea en progreso]
- [ ] [Otra tarea en progreso]

## 📝 Notas Importantes
- [Decisión técnica importante]
- [Problema resuelto]
- [Optimización implementada]
```

#### B. Actualizar PRIORITIES.md
```markdown
### ✅ COMPLETADO
- [x] **[Nombre tarea]** - [Fecha] - [Descripción]

### 🚧 EN PROGRESO
- [ ] **[Nombre tarea]** - [Descripción estado]

### ⏸️ BLOQUEADO
- [ ] **[Nombre tarea]** - [Razón bloqueo]
```

#### C. Actualizar DECISIONS-LOG.md
```markdown
### [Fecha]: [Título Decisión]
**Decisión**: [Descripción decisión técnica]
**Problema**: [Problema que resolvía]
**Solución implementada**: [Solución específica]
**Resultado**: [Resultado obtenido]
**Impacto**: [Impacto en el proyecto]
```

### 2. Guardar Progreso en GitHub (1 min)

#### A. Commit con Mensaje Estructurado
```bash
# Formato obligatorio
git add .
git commit -m "feat: [Descripción funcionalidad]

- ✅ Completado: [Tarea 1]
- ✅ Completado: [Tarea 2]  
- 🚧 En progreso: [Tarea 3]
- 📝 Decisión: [Decisión técnica]

Refs: .claude/status/CURRENT-SPRINT.md"
```

#### B. Push a GitHub
```bash
git push origin main
```

### 3. Verificación Final (1 min)

#### A. Health Check
```bash
# Verificar que todo funciona
curl http://localhost:3000/api/test/ping
npm run lint
npm test
```

#### B. Documentación Actualizada
- [ ] Status files actualizados
- [ ] Git commit realizado
- [ ] Tests pasan
- [ ] No console.log en código

## 📋 Checklist Cierre de Sesión

### Status Updates
- [ ] ✅ CURRENT-SPRINT.md actualizado
- [ ] ✅ PRIORITIES.md actualizado  
- [ ] ✅ DECISIONS-LOG.md actualizado
- [ ] ✅ Timestamps correctos

### GitHub Operations
- [ ] ✅ Archivos añadidos: `git add .`
- [ ] ✅ Commit con mensaje estructurado
- [ ] ✅ Push realizado: `git push origin main`
- [ ] ✅ Mensaje commit incluye referencias

### Quality Assurance
- [ ] ✅ ESLint pasa: `npm run lint`
- [ ] ✅ Tests pasan: `npm test`
- [ ] ✅ No console.log en código
- [ ] ✅ Health check OK

### Documentation
- [ ] ✅ Archivos .claude/ actualizados
- [ ] ✅ Referencias cruzadas correctas
- [ ] ✅ Próxima sesión preparada

## 🎯 Mensaje de Cierre

**Template obligatorio para el usuario:**

```markdown
## ✅ Sesión Completada - [Fecha]

### 🎯 Objetivos Cumplidos
- ✅ [Objetivo 1]
- ✅ [Objetivo 2]
- ✅ [Objetivo 3]

### 📊 Progreso del Sprint
- **Completado**: [X] tareas
- **En progreso**: [Y] tareas  
- **Bloqueado**: [Z] tareas

### 🔄 Estado Guardado
- ✅ Status actualizado en `.claude/status/`
- ✅ Git commit realizado
- ✅ Próxima sesión preparada

### 🚀 Próxima Sesión
- [ ] [Tarea prioritaria 1]
- [ ] [Tarea prioritaria 2]
- [ ] [Tarea prioritaria 3]

**Tiempo total sesión**: [X] horas
**Confianza en progreso**: [Y]%
```

## ⚠️ Reglas Críticas

### NUNCA Terminar Sin:
1. **Actualizar status files** (CURRENT-SPRINT, PRIORITIES, DECISIONS-LOG)
2. **GitHub commit** con mensaje estructurado
3. **Health check** del sistema
4. **Mensaje de cierre** al usuario

### SIEMPRE Incluir:
1. **Timestamps** en todas las actualizaciones
2. **Referencias cruzadas** entre archivos
3. **Estado de próxima sesión** preparado
4. **Métricas de progreso** actualizadas

---

**Tiempo total cierre**: 5 minutos
**Regla de oro**: **GUARDAR TODO ANTES DE TERMINAR**
