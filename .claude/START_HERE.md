# 🎯 INICIO DE SESIÓN - LEE ESTO PRIMERO

## Orden de Lectura Obligatorio

1. 🔴 **CRÍTICO**: `.claude/rules/01-CRITICAL-RULES.md` (2 min)
2. 📊 **ESTADO**: `.claude/status/CURRENT-SPRINT.md` (1 min)
3. 🎯 **PRIORIDADES**: `.claude/status/PRIORITIES.md` (1 min)
4. 📋 **CONTEXTO**: `.claude/context/project-overview.md` (opcional, 3 min)

**Total**: 4-7 minutos para contexto completo

---

## ¿Qué Hacer Después?

### 🚀 Desarrollo Nueva Funcionalidad
→ Consulta `.claude/workflows/new-feature.md`

### 🐛 Debugging
→ Consulta `.claude/workflows/debugging.md`

### 📝 Dudas Código
→ Consulta `.claude/rules/03-code-style.md`

### 🌐 Dudas APIs
→ Consulta `.claude/rules/04-apis.md`

### 🎬 Dudas VEO3
→ Consulta `.claude/rules/05-veo3.md`

### 🚀 Deployment
→ Consulta `.claude/workflows/deployment.md`

### 🔄 Cierre de Sesión
→ Consulta `.claude/workflows/session-close.md`

---

## 🔴 Regla de Oro

**ANTES de crear cualquier archivo**: Lee `.claude/rules/02-development.md` sección "Creación de Archivos"

**ANTES de usar cualquier API**: Lee `.claude/rules/04-apis.md` para guidelines

**ANTES de generar videos VEO3**: Lee `.claude/rules/05-veo3.md` para reglas críticas

---

## 📚 Referencias Rápidas

- **Endpoints**: `.claude/reference/endpoints.md`
- **Servicios**: `.claude/reference/services.md`
- **Comandos**: `.claude/reference/commands.md`
- **Troubleshooting**: `.claude/reference/troubleshooting.md`
- **Arquitectura**: `.claude/context/architecture.md`
- **Estructura**: `.claude/context/file-structure.md`

---

## ⚡ Comandos Útiles

```bash
# Health checks
npm run dev
curl http://localhost:3000/api/test/ping

# VEO3
npm run veo3:generate-ana
npm run veo3:test-retry-v3

# Database
npm run db:init
npm run db:test

# Quality
npm run lint
npm test
```

---

**Última actualización**: 2025-10-09
**Versión**: 1.0.0

