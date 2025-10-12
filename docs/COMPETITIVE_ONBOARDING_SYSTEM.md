# Sistema de Onboarding Competitivo

**Fecha**: 12 Oct 2025 **Feature**: Competitive YouTube Analyzer **Versión**:
1.0

---

## 📋 Descripción

Sistema inteligente para analizar canales competidores de YouTube Shorts y
**extraer insights virales** que mejoran nuestro sistema VEO3 completo.

### Características Clave

✅ **Filtrado de branding automático** - Elimina referencias a marcas, hashtags
y CTAs del competidor ✅ **3 modos de análisis** - quick, smart, full (balance
costo/profundidad) ✅ **Integración con VEO3** - Insights aplicables a toda la
plataforma ✅ **Análisis agregado** - Aprende de múltiples canales
simultáneamente ✅ **Cost-aware** - Estimación de costos antes de ejecutar

---

## 🎯 Flujo de Onboarding

### Modo `smart` (RECOMENDADO)

```
1. Fetch últimos 20 videos del canal (YouTube RSS/API)
2. Analizar metadata de TODOS (gratis)
   ├─ Views, likes, comments
   ├─ Engagement rate
   ├─ Tags, títulos
   └─ Patrones de publicación
3. Identificar top 5 performers (por engagement)
4. Transcribir SOLO esos 5 (Whisper AI: ~$0.015)
5. Analizar contenido con GPT-4o-mini (~$0.05)
6. FILTRAR branding del competidor
7. Generar insights agregados
8. Extraer viral patterns para VEO3

TOTAL: ~$0.08 | 5-7 minutos
```

### Otros Modos

**`quick`** - Solo metadata, 0 transcripciones → $0, 30s **`full`** - 30 videos,
transcribir todos → ~$0.18, 10-15 min

---

## 🔧 API Endpoints

### 1. Onboarding de Canal

```http
POST /api/competitive/channels/:id/onboard
Content-Type: application/json

{
  "mode": "smart"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Onboarding completado",
    "data": {
        "channel_name": "José Carrasco",
        "mode": "smart",
        "videos_found": 20,
        "videos_transcribed": 5,
        "cost_estimate": 0.08,
        "insights": {
            "performance_benchmarks": {
                "views": 15000,
                "engagement_rate": 0.055
            },
            "content_patterns": {
                "top_keywords": ["chollo", "regalado", "marca fijo"],
                "most_mentioned_players": ["Lewandowski", "Vinicius"],
                "tone_distribution": { "alarmista": 10, "técnico": 7 }
            }
        },
        "viral_patterns": {
            "viral_keywords": ["chollo", "regalado", "imprescindible"],
            "recommendations_for_veo3": [
                "Usar keywords virales en hooks",
                "Tono preferido: alarmista",
                "Estructura: hook 3s → claim 5s → justificación 30s"
            ]
        }
    }
}
```

### 2. Exportar Insights Agregados

```http
GET /api/competitive/insights/viral-patterns?format=json
```

**Response:**

```json
{
    "success": true,
    "data": {
        "generated_at": "2025-10-12T10:00:00Z",
        "sources": [
            { "channel_name": "José Carrasco", "videos_analyzed": 20 },
            { "channel_name": "Otro Canal", "videos_analyzed": 20 }
        ],
        "viral_keywords": [
            { "keyword": "chollo", "frequency": 15 },
            { "keyword": "regalado", "frequency": 12 }
        ],
        "effective_tones": [
            { "tone": "alarmista", "frequency": 18 },
            { "tone": "técnico", "frequency": 12 }
        ],
        "recommendations_for_veo3": [
            "Incorporar 'chollo' en hooks de ofertas",
            "Usar tono alarmista para contenido viral",
            "Estructura: hook impactante + 2-3 stats + CTA suave"
        ]
    }
}
```

---

## 🧹 Filtrado de Branding

### Qué se ELIMINA automáticamente

```javascript
❌ "José Carrasco"               // Nombre del canal
❌ "#JoseCarrascoFT"             // Hashtags específicos
❌ "@JoseCarrasco_98"            // Menciones
❌ "mi canal"                    // Referencias autoreferenciales
❌ "suscríbete"                  // CTAs genéricos
❌ "link en descripción"         // CTAs de redirección
❌ "como siempre os digo"        // Catchphrases
```

### Qué se CONSERVA (insights virales)

```javascript
✅ "REGALADO 🔥"                 // Keywords virales genéricos
✅ "CHOLLO BRUTAL"               // Estructuras virales
✅ "marca fijo"                  // Claims típicos de Fantasy
✅ Hook primeros 3s              // Estructura narrativa
✅ Tono alarmista                // Estilo que funciona
✅ CTA en comentarios            // Estrategia de engagement
✅ "Lewandowski", "Vinicius"     // Jugadores mencionados
```

---

## 💡 Integración con VEO3

### Aplicar Insights Aprendidos

Los insights se exportan en formato consumible para:

1. **`promptBuilder.js`** - Incorporar keywords virales en hooks
2. **`viralFramework.js`** - Ajustar estructuras narrativas
3. **`anaCharacter.js`** - Adaptar tonos según lo que funciona
4. **`cinematicProgressionSystem.js`** - Optimizar duraciones de segmentos

### Ejemplo de Aplicación

**Antes** (sin insights):

```javascript
const hook = `Ana presenta: ${playerName} es un chollo`;
```

**Después** (con insights competitivos):

```javascript
const viralKeyword = competitiveInsights.viral_keywords[0]; // "REGALADO"
const hook = `${viralKeyword.toUpperCase()} 🔥 - ${playerName} a solo ${price}M`;
```

### Sugerencias Automáticas

El sistema genera sugerencias específicas:

```javascript
GET /api/competitive/insights/suggestions

{
  "hook_improvements": [
    {
      "suggestion": "Incorporar 'CHOLLO' en hooks de ofertas",
      "rationale": "Aparece 15 veces en top performers",
      "implementation": "Hook ejemplo: 'CHOLLO - Lewandowski a 7.5M'"
    }
  ],
  "structure_optimizations": [
    {
      "suggestion": "Ajustar duración hook a 3-5s",
      "rationale": "Videos exitosos usan hooks cortos",
      "implementation": "Actualizar SEGMENT_DURATIONS en promptBuilder.js"
    }
  ]
}
```

---

## 📊 Métricas Recolectadas

### Nivel 1: Metadata (GRATIS)

- Views, likes, comments
- Engagement rate
- Duración promedio
- Tags más usados
- Patrones de publicación (días/horas)

### Nivel 2: Contenido (COSTO: transcripción)

- Keywords virales
- Jugadores mencionados
- Claims y predicciones
- Tono y estilo
- Estructura narrativa
- CTAs utilizados

### Nivel 3: Insights Agregados

- Top keywords consolidados
- Tonos más efectivos
- Estructuras que funcionan
- Benchmarks de engagement
- Recomendaciones VEO3

---

## 💰 Costos

| Modo    | Videos | Transcripciones | Costo  | Tiempo   |
| ------- | ------ | --------------- | ------ | -------- |
| `quick` | 10     | 0               | $0     | 30s      |
| `smart` | 20     | 5               | ~$0.08 | 5-7 min  |
| `full`  | 30     | 30              | ~$0.18 | 10-15min |

**Breakdown smart mode:**

- Transcripciones Whisper: 5 videos × 0.5 min × $0.006/min = $0.015
- Análisis GPT-4o-mini: 5 análisis × $0.01 = $0.05
- **Total: ~$0.08**

---

## 🚀 Uso Recomendado

### Workflow Típico

```bash
# 1. Añadir canal competidor
curl -X POST http://localhost:3000/api/competitive/channels \
  -H "Content-Type: application/json" \
  -d '{
    "channel_url": "https://www.youtube.com/@JoseCarrasco_98/shorts",
    "channel_name": "José Carrasco",
    "priority": 5,
    "content_type": "chollos"
  }'

# Response: { "data": { "id": "a9c8e10d-..." } }

# 2. Ejecutar onboarding (modo smart)
curl -X POST http://localhost:3000/api/competitive/channels/a9c8e10d-.../onboard \
  -H "Content-Type: application/json" \
  -d '{"mode":"smart"}'

# 3. Esperar 5-7 minutos

# 4. Exportar insights para VEO3
curl http://localhost:3000/api/competitive/insights/viral-patterns

# 5. Aplicar insights manualmente a VEO3
# Ver sección "Integración con VEO3" arriba
```

### Frecuencia Recomendada

- **Onboarding inicial**: Cuando añades un canal nuevo
- **Re-análisis**: Cada 30-60 días (para detectar cambios de estrategia)
- **Agregación de insights**: Después de cada onboarding

---

## 🔒 Protección del Sistema VEO3

**CRÍTICO**: Este sistema **NO modifica código VEO3 automáticamente**.

Los insights se exportan para **revisión y aplicación manual**, garantizando:

✅ 0% riesgo de romper sistema estable del 11 oct 2025 ✅ Control total sobre
qué insights aplicar ✅ Posibilidad de A/B testing antes de adoptar cambios

---

## 🎯 Casos de Uso

### 1. Nuevo Competidor Detectado

```
Usuario descubre canal exitoso
→ Añade canal via frontend/API
→ Ejecuta onboarding modo smart
→ Revisa insights exportados
→ Decide qué aplicar a VEO3
```

### 2. Mejora Continua de VEO3

```
Cada mes:
→ Re-analizar canales activos
→ Agregar nuevos insights
→ Comparar con benchmarks anteriores
→ Iterar en VEO3 basado en datos reales
```

### 3. Respuesta a Video Específico

```
Video viral del competidor detectado
→ Analizar ese video (modo quick)
→ Generar respuesta con VEO3 usando insights
→ Publicar respuesta 2-4h después con datos de contraste
```

---

## 📝 Notas Importantes

1. **Filtrado de branding es automático** - No necesitas limpiar manualmente
2. **Insights son genéricos** - Seguros de usar sin problemas legales
3. **Costos son estimados** - Pueden variar según duración real de videos
4. **OpenAI API key requerida** - Para transcripción y análisis
5. **YouTube Data API opcional** - RSS funciona sin API key

---

## 🐛 Troubleshooting

### Error: "No OPENAI_API_KEY found"

```bash
# Añadir a .env
OPENAI_API_KEY=sk-...
```

### Error: "YouTube video download failed"

```bash
# Verificar yt-dlp instalado
yt-dlp --version

# Instalar si falta
brew install yt-dlp  # macOS
```

### Onboarding muy lento

- Usar modo `quick` para pruebas rápidas
- Reducir `max_videos` en configuración
- Verificar conexión a internet

---

## 🔗 Referencias

- **Servicio**:
  `backend/services/contentAnalysis/competitiveOnboardingService.js`
- **Integración VEO3**:
  `backend/services/contentAnalysis/viralInsightsIntegration.js`
- **API Routes**: `backend/routes/competitiveChannels.js` (líneas 498-614)
- **Frontend**: `frontend/competitive-channels.html`

---

**Última actualización**: 12 Oct 2025 **Versión**: 1.0.0 **Autor**: Claude Code
