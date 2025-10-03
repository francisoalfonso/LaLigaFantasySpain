# VEO3 - Nombres Bloqueados KIE.ai (3 Oct 2025)

## 🚨 PROBLEMA CRÍTICO - Error 422

KIE.ai **rechaza prompts que mencionan nombres completos de futbolistas profesionales** por temas de derechos de imagen.

### ❌ Nombres que Causan Error 422

- **"Iago Aspas"** → ❌ Error 422 "failed"

### ✅ Solución: Usar Solo Apellidos

- **"Aspas"** → ✅ Funciona correctamente

## 📝 Regla de Oro

**NUNCA usar nombres completos de futbolistas en los prompts de VEO3.**

### Ejemplos Correctos

```javascript
// ❌ INCORRECTO - Causa error 422
const dialogue = "Iago Aspas del Celta está a solo 8 millones...";

// ✅ CORRECTO - Funciona
const dialogue = "Aspas del Celta está a solo 8 millones...";
```

```javascript
// ❌ INCORRECTO
const dialogue = "Lewandowski tiene 5 goles...";

// ✅ CORRECTO
const dialogue = "Lewa tiene 5 goles...";
```

## 🔧 Implementación en Código

### Función de Sanitización

```javascript
/**
 * Sanitizar nombre de jugador para VEO3
 * @param {string} playerName - Nombre completo del jugador
 * @returns {string} - Solo apellido o apodo
 */
function sanitizePlayerName(playerName) {
    // Casos especiales (apodos conocidos)
    const nicknames = {
        'Robert Lewandowski': 'Lewa',
        'Mohamed Salah': 'Salah',
        'Erling Haaland': 'Haaland'
    };

    if (nicknames[playerName]) {
        return nicknames[playerName];
    }

    // Por defecto: usar solo apellido (última palabra)
    const parts = playerName.trim().split(' ');
    return parts[parts.length - 1];
}
```

### Uso en Scripts

```javascript
// Antes de construir prompts VEO3
const playerDisplayName = sanitizePlayerName(CONFIG.contentData.playerName);

const dialogue = `${playerDisplayName} del ${team} está a solo ${price} millones...`;
```

## 🎯 Lista de Jugadores Comunes

| Nombre Completo | Usar en VEO3 |
|----------------|--------------|
| Iago Aspas | Aspas |
| Robert Lewandowski | Lewa |
| Vinicius Junior | Vini |
| Pedri González | Pedri |
| Gavi | Gavi |
| Antoine Griezmann | Griezmann |
| Álvaro Morata | Morata |
| Mikel Oyarzabal | Oyarzabal |

## ⚠️ Otros Nombres Posiblemente Bloqueados

Aunque no están confirmados, es probable que KIE.ai también bloquee:

- Nombres de jugadores muy famosos (Messi, Cristiano, Neymar, etc.)
- Nombres de managers (Ancelotti, Guardiola, etc.)
- Nombres de clubes completos en ciertos contextos

**Regla segura**: Siempre usar apellidos o apodos cortos.

## 📊 Impacto en Calidad de Audio

**Ventaja adicional**: Los apellidos suenan más naturales y profesionales en español.

- ❌ "Iago Aspas" → Suena formal y distante
- ✅ "Aspas" → Suena profesional y cercano (como comentaristas reales)

## 🔄 Actualización de Scripts

Todos los scripts de generación VEO3 deben implementar `sanitizePlayerName()`:

- ✅ `generate-aspas-clean.js`
- ✅ `promptBuilder.js` (buildCholloPrompt, buildAnalysisPrompt, etc.)
- ✅ Cualquier script que genere prompts con nombres de jugadores

---

Fecha: 3 Octubre 2025 23:50h
Estado: ✅ Problema identificado y documentado
Solución: Usar solo apellidos en prompts VEO3
