# Workflow: Nueva Funcionalidad

## Proceso Obligatorio

### 1. Consultar Reglas Críticas (2 min)
- [ ] Leer `.claude/rules/01-CRITICAL-RULES.md`
- [ ] Leer `.claude/rules/02-development.md` sección "Creación de Archivos"
- [ ] Verificar que NO existe funcionalidad similar

### 2. Buscar Infraestructura Existente (3 min)
```bash
# Buscar servicios similares
ls backend/services/ | grep -i [keyword]

# Buscar endpoints similares  
ls backend/routes/ | grep -i [keyword]

# Buscar frontend similar
ls frontend/ | grep -i [keyword]
```

### 3. Preguntar Antes de Crear
**OBLIGATORIO**: "¿Ya existe algo similar que pueda reutilizar?"

### 4. Si NO existe alternativa, proceder:

#### A. Crear Archivo (si es necesario)
- Documentar en `.claude/rules/02-development.md`
- Explicar por qué era la única opción

#### B. Seguir Estándares
- Consultar `.claude/rules/03-code-style.md`
- Usar Winston logger (NO console.log)
- Validar inputs con Joi
- Try/catch en funciones async

#### C. Implementar Rate Limiting
- Consultar `.claude/rules/04-apis.md`
- Aplicar delays apropiados
- Error handling robusto

#### D. Si usa VEO3
- Consultar `.claude/rules/05-veo3.md`
- Seed 30001 fijo
- Prompts <80 palabras
- Referencias genéricas

### 5. Testing
```bash
npm run lint          # Verificar código
npm test             # Ejecutar tests
npm run dev          # Probar localmente
```

### 6. Documentación
- Actualizar `.claude/reference/endpoints.md` si es API
- Actualizar `.claude/reference/services.md` si es servicio
- Comentarios JSDoc en funciones públicas

## Checklist Final

- [ ] ✅ No hay `console.log` en código
- [ ] ✅ Winston logger usado correctamente
- [ ] ✅ Rate limiting aplicado
- [ ] ✅ Input validation con Joi
- [ ] ✅ Error handling completo
- [ ] ✅ Tests pasan
- [ ] ✅ ESLint pasa
- [ ] ✅ Documentación actualizada

## Ejemplos de Reutilización

### ✅ CORRECTO - Reutilizar Existente
```javascript
// En lugar de crear nuevo servicio
const existingService = require('./apiSports');
const result = await existingService.getPlayerData(playerId);
```

### ❌ INCORRECTO - Crear Duplicado
```javascript
// NO crear nuevo servicio si existe
const newService = require('./newApiSports'); // ❌ Duplicado
```

---

**Tiempo estimado**: 15-30 min
**Regla de oro**: **REUTILIZAR > CREAR**


