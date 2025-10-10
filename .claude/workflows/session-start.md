# Workflow: Inicio de Sesión

## Checklist Obligatorio (5 min)

1. [ ] Leer `.claude/START_HERE.md`
2. [ ] Leer `.claude/status/CURRENT-SPRINT.md`
3. [ ] Leer `.claude/status/PRIORITIES.md`
4. [ ] Verificar servidor: `npm run dev`
5. [ ] Health check: `curl http://localhost:3000/api/test/ping`

## ¿Qué Hacer Después?

### Si vas a desarrollar nueva funcionalidad:
→ Ve a `.claude/workflows/new-feature.md`

### Si vas a debuggear:
→ Ve a `.claude/workflows/debugging.md`

### Si vas a modificar código existente:
→ Consulta `.claude/rules/03-code-style.md`

### Si vas a usar APIs externas:
→ Consulta `.claude/rules/04-apis.md`

### Si vas a generar videos VEO3:
→ Consulta `.claude/rules/05-veo3.md`

## Comandos de Verificación

```bash
# Servidor funcionando
npm run dev

# Health check
curl http://localhost:3000/api/test/ping

# VEO3 sistema
ls output/veo3/sessions/

# Logs recientes
tail -f logs/server.log
```

## Estado del Sistema

### ✅ Funcionando
- Servidor backend (puerto 3000)
- Base de datos Supabase
- Sistema VEO3 con Ana
- Preview Instagram viral

### ⚠️ Requiere Atención
- Documentación oficial API-Sports (P1)
- ContentDrips API (pendiente activación)

### 🔧 Comandos Útiles
```bash
npm run lint          # Verificar código
npm test             # Ejecutar tests
npm run db:init      # Inicializar BD
```

---

**Tiempo total**: 5 minutos
**Próximo paso**: Seguir workflow específico según tarea


