# Pull Request

## 🎯 Descripción

<!-- Breve descripción de los cambios realizados -->

## 📋 Tipo de Cambio

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causa breaking change existente)
- [ ] 📝 Documentación (cambios solo en documentación)
- [ ] 🎨 Estilo (formato, punto y coma, etc; sin cambio de código)
- [ ] ♻️ Refactor (código que no corrige bug ni agrega feature)
- [ ] ⚡️ Performance (cambio que mejora performance)
- [ ] ✅ Tests (agregar tests faltantes o corregir existentes)
- [ ] 🔧 Chore (cambios en build, configuración, dependencias)

## ✅ Checklist

- [ ] Mi código sigue los estándares del proyecto (CODE_STYLE.md)
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código en áreas complejas (español)
- [ ] He actualizado la documentación relevante
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests unitarios nuevos y existentes pasan localmente
- [ ] He actualizado CHANGELOG.md si aplica
- [ ] He verificado API_GUIDELINES.md para uso correcto de APIs
- [ ] Sigo CONTRIBUTING.md para el proceso de desarrollo

## 🧪 Tests

<!-- Describe los tests que agregaste o modificaste -->

```bash
# Comandos para ejecutar tests
npm test
npm run test:coverage
```

## 📸 Screenshots (si aplica)

<!-- Agrega screenshots si hay cambios visuales -->

## 🔗 Issues Relacionados

Fixes #<!-- número de issue --> Relates to #<!-- número de issue -->

## 📝 Notas Adicionales

<!-- Cualquier información adicional relevante para los reviewers -->

---

**Antes de marcar como ready for review, verificar:**

- `npm run lint` pasa sin errores
- `npm run format:check` pasa sin errores
- `npm test` pasa con >70% coverage
- `npm run quality` pasa completamente
