# 🔴 REGLAS CRÍTICAS - NUNCA ROMPER

## 1. CREACIÓN DE ARCHIVOS ⛔

- ❌ **NUNCA** crear archivos sin consultar `.claude/rules/02-development.md`
- ❌ **NUNCA** duplicar funcionalidad existente
- ✅ **SIEMPRE** buscar primero: `ls backend/services/ | grep -i [keyword]`
- ✅ **SIEMPRE** preguntar: "¿Ya existe algo similar que pueda reutilizar?"

## 2. VEO3 SISTEMA 🎬

- ❌ **NUNCA** cambiar `ANA_CHARACTER_SEED=30001`
- ❌ **NUNCA** cambiar `ANA_IMAGE_URL`
- ❌ **NUNCA** crear prompts >80 palabras
- ✅ **SIEMPRE** usar "speaks in Spanish from Spain" (lowercase)
- ✅ **SIEMPRE** usar referencias genéricas ("el jugador", NO nombres de jugadores)

## 3. APIs EXTERNAS 🌐

- ❌ **NUNCA** implementar contra API sin descargar docs oficiales
- ❌ **NUNCA** usar `season != 2025` (temporada actual)
- ✅ **SIEMPRE** aplicar rate limiting
- ✅ **SIEMPRE** guardar docs en `/docs/[API_NAME]_OFICIAL.md`

## 4. CÓDIGO QUALITY ✨

- ❌ **NUNCA** usar `console.log` (usar Winston logger)
- ❌ **NUNCA** hardcodear secrets
- ✅ **SIEMPRE** validar inputs con Joi
- ✅ **SIEMPRE** try/catch en funciones async

## 5. BASE DE DATOS 💾

- ❌ **NUNCA** modificar schema sin actualizar AMBOS:
  - `database/supabase-schema.sql`
  - `database/init-database.js`
- ✅ **SIEMPRE** ejecutar `npm run db:init` después de cambios

## 6. TEMPORADA LA LIGA ⚽

- ❌ **NUNCA** usar `season != 2025` (temporada 2025-26)
- ✅ **SIEMPRE** usar `season=2025` en API-Sports
- ✅ **SIEMPRE** verificar en `backend/config/constants.js`

## 7. LOGGING 📊

- ❌ **NUNCA** usar `console.log` en producción
- ✅ **SIEMPRE** usar Winston logger
- ✅ **SIEMPRE** logs estructurados con contexto

## 8. SECURITY 🔒

- ❌ **NUNCA** hardcodear API keys o secrets
- ✅ **SIEMPRE** usar variables de entorno
- ✅ **SIEMPRE** validar inputs con Joi

---

## 📋 CHECKLIST ANTES DE COMMIT

- [ ] ESLint pasa: `npm run lint`
- [ ] Tests pasan: `npm test`
- [ ] No hay `console.log` en código
- [ ] No hay secrets hardcodeados
- [ ] Documentación actualizada si creaste archivos
- [ ] Rate limiting aplicado en APIs
- [ ] Inputs validados con Joi
- [ ] Try/catch en funciones async

---

**Ver detalles completos en**: `.claude/rules/02-development.md`

**Última actualización**: 2025-10-09


