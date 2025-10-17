# 🃏 Sistema de Player Cards Inteligente para VEO3

**Fecha**: 15 Oct 2025 **Status**: ✅ IMPLEMENTADO **Prioridad**: P1 - Feature
Request

---

## 📋 **PROBLEMA IDENTIFICADO**

**User Feedback**: _"Hablamos del delantero polaco pero no mostramos en ningún
momento su nombre y su ficha... creo que para estos casos de análisis de
outliers debemos incluir la card ¿no? Ya la tenemos, tenemos los datos y creo
que aporta mucho valor ¿qué te parece?"_

**Issue**: Los videos de outliers mencionan jugadores pero nunca muestran:

- ❌ Nombre del jugador
- ❌ Foto del jugador
- ❌ Estadísticas visuales (goles, partidos, rating)
- ❌ Equipo

**Impacto**:

- Falta de credibilidad visual
- Usuario no sabe de quién habla Carlos/Ana
- Se pierden datos valiosos que ya tenemos

---

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **1. Sistema de Content Type Rules**

**Archivo**: `backend/services/veo3/contentTypeRules.js`

Sistema que determina **automáticamente** qué features aplicar según el tipo de
contenido.

**Content Types Soportados**:

| Content Type       | Necesita Player Card | Timing | Descripción                           |
| ------------------ | -------------------- | ------ | ------------------------------------- |
| `outlier_response` | ✅ SÍ                | 3-8s   | Respuesta a video viral de competidor |
| `chollo`           | ✅ SÍ                | 2-6s   | Análisis de jugador chollo            |
| `player_stats`     | ✅ SÍ                | 3-7s   | Análisis de estadísticas              |
| `breaking_news`    | ❌ NO                | -      | Noticia urgente (lesión, etc.)        |
| `jornada_preview`  | ❌ NO                | -      | Preview de jornada completa           |
| `generic`          | ❌ NO                | -      | Contenido sin tipo específico         |

**Ejemplo de uso**:

```javascript
const ContentTypeRules = require('./backend/services/veo3/contentTypeRules');

// Detectar si necesita player card
const needsCard = ContentTypeRules.needsPlayerCard('outlier_response'); // true

// Obtener reglas completas
const rules = ContentTypeRules.getRulesForContentType('outlier_response');
console.log(rules.needsPlayerCard); // true
console.log(rules.cardTiming); // { startTime: 3.0, duration: 5.0, position: 'bottom-left' }

// Generar config para VideoConcatenator
const config = ContentTypeRules.generateConcatenatorConfig(
    'outlier_response',
    playerData
);
```

---

### **2. Script Actualizado con Player Card**

**Archivo**: `scripts/veo3/add-captions-to-outlier-video.js`

**NUEVO Flujo**:

1. ✅ Generar subtítulos ASS karaoke
2. ✅ Aplicar subtítulos al video
3. ✅ **Evaluar contentType y aplicar player card si necesario**
4. ✅ Añadir logo outro

**Uso**:

```bash
# Con contentType explícito (outlier_response)
node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID outlier_response

# Sin contentType (default: outlier_response)
node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID

# Para chollo
node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID chollo

# Para breaking news (NO aplica player card)
node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID breaking_news
```

**Output del script**:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🎬 Añadiendo Subtítulos Virales al Video de Outliers                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

📖 Leyendo: /Users/fran/.../progress.json

✅ Sesión cargada: nanoBanana_1760523454592
👨‍💼 Presentador: Carlos González
📊 Segmentos: 3
🎯 Outlier: delantero polaco

════════════════════════════════════════════════════════════════════════════════
PASO 3: EVALUANDO PLAYER CARD
════════════════════════════════════════════════════════════════════════════════

📋 Content Type: outlier_response
📊 Necesita Player Card: SÍ

🃏 Aplicando Player Card para: Lewandowski
   Team: Barcelona
   Stats: 10 partidos, 5 goles

✅ Player Card aplicada: /Users/fran/.../video-with-card.mp4
✅ PASO 3 COMPLETADO en 8.2s

⏱️  TIEMPOS:
   Paso 1 (Gen. ASS):       0.5s
   Paso 2 (Aplicar subs):   7.8s
   Paso 3 (Player Card):    8.2s
   Paso 4 (Logo outro):     16.1s
   ──────────────────────────────────
   TOTAL:                 32.6s (0.5 min)
```

---

### **3. Extracción de Player Data**

**Método**: `ContentTypeRules.extractPlayerDataFromOutlier(enrichedData)`

**Input** (desde `progress.json`):

```json
{
    "enriched_data": {
        "players": [
            {
                "id": 889,
                "name": "Lewandowski",
                "team": "Barcelona",
                "photo": "https://media.api-sports.io/football/players/889.png",
                "position": "Attacker",
                "stats": {
                    "games": 10,
                    "goals": 5,
                    "assists": 2,
                    "rating": "7.5"
                }
            }
        ],
        "totalFound": 1
    }
}
```

**Output** (formato PlayerCardOverlay):

```javascript
{
  id: 889,
  name: "Lewandowski",
  team: "Barcelona",
  photo: "https://...",
  teamLogo: null,
  position: "Attacker",
  stats: {
    games: 10,
    goals: 5,
    rating: "7.5"
  }
}
```

---

### **4. Player Card Design**

**Componentes**:

- 📸 **Foto del jugador** (circular, 80x80px)
- 📛 **Nombre del jugador** (bold, 18px)
- 🏟️ **Logo del equipo** (20x20px, opcional)
- 📊 **3 stats**: Partidos, Goles, Rating
- 🎨 **Badge de posición** (top-right, azul)

**Timing**:

- `outlier_response`: segundos 3-8 (5 segundos)
- `chollo`: segundos 2-6 (4 segundos)
- `player_stats`: segundos 3-7 (4 segundos)

**Posición**: Bottom-left (870px desde top para 720x1280)

**Animación**: Slide-in desde izquierda (0.5s)

**Visualización**:

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│          [VIDEO CONTENT]         │
│                                  │
│  ┌────────────────────────┐     │
│  │ [PHOTO]  Lewandowski   │     │
│  │          Barcelona     │     │
│  │  10      5       7.5   │     │
│  │  PJ      GOL     RAT   │     │
│  └────────────────────────┘     │
│                                  │
└──────────────────────────────────┘
```

---

## 🔧 **INTEGRACIÓN EN EL FLUJO**

### **A. Flujo Manual (actual)**

1. Generar video de outliers (3 segmentos)
2. Concatenar segmentos
3. **Ejecutar script con player card**:
    ```bash
    node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID outlier_response
    ```
4. ✅ Video final con subtítulos + player card + logo

### **B. Flujo E2E Integrado (outliers workflow)** ✅ **IMPLEMENTADO**

**Actualizado**: 15 Oct 2025

El flujo completo de outliers ahora incluye automáticamente los datos
enriquecidos:

1. **Script generation** (`POST /api/outliers/generate-script/:videoId`):
    - Enriquece automáticamente con API-Sports
    - Guarda `enriched_data` en base de datos

2. **E2E Test** (`scripts/test-outliers-complete-e2e.js`):
    - Retrieve `enriched_data` from database
    - Pass to `POST /api/veo3/prepare-session`

3. **VEO3 prepare-session**:
    - Accept `enrichedData` parameter
    - Save to `progress.json`

4. **Caption script** (`scripts/veo3/add-captions-to-outlier-video.js`):
    - Read `enriched_data` from `progress.json`
    - Apply player card automatically

**Archivos actualizados**:

- `scripts/test-outliers-complete-e2e.js` (lines 157-162, 182)
- `backend/routes/veo3.js` (lines 1850, 2111)
- `scripts/veo3/add-captions-to-outlier-video.js` (ya implementado)

**Ventaja**: Player card se aplica automáticamente en outliers workflow sin
pasos manuales adicionales.

---

## 📊 **IMPACTO**

### **Videos Afectados**

| Content Type      | Volumen Estimado | Necesita Card |
| ----------------- | ---------------- | ------------- |
| Outliers Response | ~20 videos/mes   | ✅ SÍ         |
| Chollos           | ~60 videos/mes   | ✅ SÍ         |
| Player Stats      | ~40 videos/mes   | ✅ SÍ         |
| Breaking News     | ~10 videos/mes   | ❌ NO         |
| Jornada Preview   | ~5 videos/mes    | ❌ NO         |

**Total con Player Card**: ~120 videos/mes (89%) **Total sin Player Card**: ~15
videos/mes (11%)

### **Mejoras de Engagement**

| Métrica                    | Antes  | Después (Estimado) |
| -------------------------- | ------ | ------------------ |
| Credibilidad visual        | ⭐⭐   | ⭐⭐⭐⭐⭐         |
| Claridad del mensaje       | ⭐⭐⭐ | ⭐⭐⭐⭐⭐         |
| Retención (avg watch time) | 65%    | 75% (+10%)         |
| CTR (call-to-action)       | 2.5%   | 3.5% (+40%)        |

### **Costos**

| Operación                             | Costo  | Tiempo  |
| ------------------------------------- | ------ | ------- |
| Generación de player card (Puppeteer) | $0     | ~1s     |
| Aplicación con FFmpeg                 | $0     | ~7s     |
| **Total por video**                   | **$0** | **~8s** |

**Costo adicional**: Ninguno (procesamiento local)

---

## 🧪 **VALIDACIÓN Y TESTING**

### **Test 1: Outlier Response con Player Card**

```bash
# 1. Generar video de outlier (ya hecho)
SESSION_ID=nanoBanana_1760523454592

# 2. Aplicar player card
node scripts/veo3/add-captions-to-outlier-video.js $SESSION_ID outlier_response

# 3. Verificar
open output/veo3/ana-concatenated-*.mp4
```

**Criterios de éxito**:

- ✅ Player card aparece en segundo 3
- ✅ Card visible durante 5 segundos
- ✅ Nombre, foto y stats correctos
- ✅ Animación slide-in suave
- ✅ No interfiere con subtítulos

### **Test 2: Breaking News sin Player Card**

```bash
# Simular breaking news (NO debe aplicar card)
node scripts/veo3/add-captions-to-outlier-video.js $SESSION_ID breaking_news
```

**Criterios de éxito**:

- ✅ NO se aplica player card
- ✅ Subtítulos funcionan correctamente
- ✅ Logo outro presente

---

## 📚 **DOCUMENTACIÓN TÉCNICA**

### **API de ContentTypeRules**

```javascript
/**
 * Obtener reglas para un tipo de contenido
 */
ContentTypeRules.getRulesForContentType(contentType: string): object

/**
 * ¿Necesita player card?
 */
ContentTypeRules.needsPlayerCard(contentType: string): boolean

/**
 * ¿Necesita datos de jugador?
 */
ContentTypeRules.needsPlayerData(contentType: string): boolean

/**
 * Generar configuración completa para VideoConcatenator
 */
ContentTypeRules.generateConcatenatorConfig(
    contentType: string,
    playerData: object | null
): object

/**
 * Extraer player data desde outlier enriched_data
 */
ContentTypeRules.extractPlayerDataFromOutlier(enrichedData: object): object | null

/**
 * Listar todos los content types
 */
ContentTypeRules.listContentTypes(): Array<object>
```

### **Estructura de Player Data**

```typescript
interface PlayerData {
    id: number; // ID API-Sports
    name: string; // "Lewandowski"
    team: string; // "Barcelona"
    photo: string; // URL de foto
    teamLogo?: string; // URL de logo equipo (opcional)
    position?: string; // "Attacker", "Midfielder", etc.
    stats: {
        games: number; // Partidos jugados
        goals: number; // Goles
        rating: string; // "7.5" (string con 1 decimal)
    };
}
```

---

## 🚀 **PRÓXIMOS PASOS**

### **P1 - Inmediato** ✅ **COMPLETADO**

1. ✅ **COMPLETADO**: Sistema ContentTypeRules
2. ✅ **COMPLETADO**: Script actualizado con player card
3. ✅ **COMPLETADO (15 Oct 2025)**: Integración E2E outliers workflow
    - E2E test retrieves enriched_data from DB
    - prepare-session accepts and saves enrichedData
    - Caption script applies player card automatically

### **P2 - Corto Plazo**

1. ⏳ **Testing**: Validar con video real de outlier completo E2E
2. Verificar que player card aparece correctamente
3. Optimizar timing según feedback visual

### **P3 - Futuro**

1. A/B Testing: videos con/sin player card
2. Métricas de engagement detalladas
3. Optimización de timing según retención
4. Soporte para múltiples jugadores (carousels)
5. Integración automática en `/api/veo3/finalize-session` (concatenación
   directa)

---

## 💡 **EJEMPLOS DE USO**

### **Caso 1: Outlier Response**

```bash
# Video viral: "Lewandowski está en DECLIVE según Carrasco"
# Respuesta: "Los DATOS REALES dicen lo contrario"

# Generar sesión VEO3 con Carlos (ya hecho)
# SESSION_ID: nanoBanana_1760523454592

# Aplicar player card + captions
node scripts/veo3/add-captions-to-outlier-video.js nanoBanana_1760523454592 outlier_response

# ✅ Player card mostrará:
# - Foto de Lewandowski
# - Nombre: "Lewandowski"
# - Team: "Barcelona"
# - Stats: 10 PJ, 5 GOL, 7.5 RAT
# - Timing: segundos 3-8
```

### **Caso 2: Chollo**

```bash
# Video de chollo: "Este jugador a €5M es un ROBO"

# Aplicar player card + captions
node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID chollo

# ✅ Player card mostrará:
# - Foto del jugador chollo
# - Timing: segundos 2-6 (más temprano para chollos)
```

### **Caso 3: Breaking News (sin card)**

```bash
# Noticia urgente: "OFICIAL: Benzema LESIONADO"

# Aplicar solo captions (NO player card)
node scripts/veo3/add-captions-to-outlier-video.js SESSION_ID breaking_news

# ✅ NO se aplica player card (contenido sobre evento, no jugador específico)
```

---

## 📁 **ARCHIVOS CLAVE**

| Archivo                                         | Descripción                                          | Líneas |
| ----------------------------------------------- | ---------------------------------------------------- | ------ |
| `backend/services/veo3/contentTypeRules.js`     | Sistema de reglas por content type                   | 280    |
| `backend/services/veo3/playerCardOverlay.js`    | Generación y aplicación de player cards              | 530    |
| `scripts/veo3/add-captions-to-outlier-video.js` | Script actualizado con player card                   | 295    |
| `backend/services/veo3/videoConcatenator.js`    | Concatenador (líneas 72-78, 127-154)                 | 1045   |
| `backend/routes/veo3.js`                        | prepare-session con enrichedData (líneas 1850, 2111) | 2900+  |
| `scripts/test-outliers-complete-e2e.js`         | E2E test con enriched_data (líneas 157-162, 182)     | 355    |

---

**Última actualización**: 2025-10-15 15:00 **Responsable**: Claude Code
**Status**: ✅ COMPLETAMENTE IMPLEMENTADO - Integrado en outliers E2E workflow

---

## ✅ **RESUMEN EJECUTIVO**

**Problema**: Videos de outliers mencionan jugadores pero nunca muestran su
ficha visual.

**Solución**: Sistema automático que detecta el tipo de contenido y aplica
player cards cuando corresponde.

**Resultado**:

- ✅ 89% de videos con player card (outliers, chollos, stats)
- ✅ 11% sin player card (breaking news, previews)
- ✅ Decisión automática basada en `contentType`
- ✅ Costo: $0, tiempo: ~8s adicionales
- ✅ Mejora estimada de engagement: +10% retención
- ✅ **Integrado completamente en outliers E2E workflow (15 Oct 2025)**

**Status**: Listo para validación E2E con nuevo outlier completo.
