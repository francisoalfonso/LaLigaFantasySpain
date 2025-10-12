# 🎯 FLUJO COMPLETO: Análisis Competitivo → Recomendaciones → Brief Redactor

**Sistema Automatizado de Inteligencia Competitiva para Fantasy La Liga Pro**

Fecha: 12 Octubre 2025

---

## 📹 FASE 1: ANÁLISIS DE VIDEO (ContentAnalyzer)

### Input

- **Transcripción**: Texto del video transcrito con Whisper AI
- **Metadata**: Título, canal, fecha publicación, views

### Proceso (GPT-4o Mini)

El `ContentAnalyzer` extrae automáticamente:

```json
{
    "players": [
        {
            "name": "Lewandowski",
            "team": "Barcelona",
            "position": "Delantero",
            "mentioned_count": 5,
            "playerId": 12345 // Normalizado con playerNameNormalizer
        }
    ],
    "claims": [
        {
            "type": "value", // price|performance|value|fixture
            "claim": "Lewandowski está REGALADO a 8.5M",
            "verifiable": true,
            "confidence": 0.9
        }
    ],
    "predictions": [
        {
            "player": "Lewandowski",
            "metric": "goals",
            "value": "1+",
            "confidence": 0.85
        }
    ],
    "context": {
        "gameweek": "Jornada 10",
        "opponent": "Getafe",
        "condition": "En racha, 3 goles últimos 2 partidos"
    },
    "contentType": "chollo", // chollo|stats|prediccion|breaking|general
    "viralPotential": 8 // 0-10 basado en palabras como REGALADO, FICHARLO YA
}
```

### Output

- ✅ **Análisis estructurado** guardado en `competitive_videos.analysis`
- ✅ **Quality Score** calculado (0-10 puntos)
- ⏱️ **Duración**: ~10-15 segundos
- 💰 **Costo**: ~$0.001 por análisis

---

## 🎯 FASE 2: GENERACIÓN DE RECOMENDACIONES (RecommendationEngine)

### Proceso Automático (cada 1 hora)

El `RecommendationEngine` analiza videos de los últimos 7 días y detecta:

### 2.1 Counter Arguments (Contraargumentos)

**Detecta**: Videos con `viralPotential ≥ 7` y `claims` específicos

**Ejemplo Real**:

```json
{
    "recommendation_type": "counter_argument",
    "title": "CONTRAARGUMENTO: Lewandowski - Análisis con datos reales",
    "description": "Canal Fantasy Insider publicó video sobre Lewandowski. Crear contraargumento con nuestros datos de API-Sports",
    "rationale": "Video competidor: 'LEWANDOWSKI REGALADO' (45,000 views). Claim: '8.5M es precio bajo'. Oportunidad para contrastar con datos oficiales.",

    "source_video_id": "abc123",
    "source_channel_id": "xyz789",
    "target_player": "Lewandowski",
    "target_gameweek": "Jornada 10",
    "competitor_claim": "Lewandowski está REGALADO a 8.5M",

    "our_data": {
        "player_id": 12345,
        "player_name": "Lewandowski",
        "team": "Barcelona",
        "position": "Delantero",
        "confidence": 0.9,
        // Aquí se agregarían datos reales de BargainAnalyzer
        "current_price": 8.5,
        "fantasy_points_last_5": [8, 2, 12, 3, 7], // Promedio: 6.4
        "value_ratio": 0.75 // Bajo (no es chollo real)
    },

    "viral_potential": 9, // Más que el original
    "urgency_deadline": "2025-10-14T10:00:00Z", // 2 días
    "estimated_views": 22500, // 50% del competidor
    "priority": "P0" // URGENTE <24h
}
```

### 2.2 Player Spotlights (Jugadores Trending)

**Detecta**: Jugadores mencionados ≥3 veces en ≥2 canales diferentes

**Ejemplo Real**:

```json
{
    "recommendation_type": "player_spotlight",
    "title": "ANÁLISIS: Lewandowski - El jugador del momento",
    "description": "Lewandowski mencionado 7 veces en 3 canales competidores. Crear spotlight profundo",
    "rationale": "Trending player detectado: 7 menciones, 125,000 views acumuladas. Oportunidad para contenido autoritativo con datos completos.",

    "our_data": {
        "player_id": 12345,
        "player_name": "Lewandowski",
        "mentions": 7,
        "channels": ["Fantasy Insider", "FantasyZone", "La Liga Fantasy Pro"],
        "total_competitor_views": 125000
    },

    "viral_potential": 8,
    "urgency_deadline": "2025-10-17T10:00:00Z", // 5 días
    "estimated_views": 37500, // 30% de views acumuladas
    "priority": "P1" // ALTA <48h
}
```

### 2.3 Viral Responses (Respuestas Urgentes)

**Detecta**: `viralPotential ≥ 8` + publicado <24h + views >20,000

**Ejemplo Real**:

```json
{
    "recommendation_type": "viral_response",
    "title": "🔥 RESPUESTA VIRAL: ¿Lewandowski o Benzema?",
    "description": "Video viral (58,000 views en 18h) requiere respuesta inmediata",
    "rationale": "URGENTE: Fantasy Insider publicó contenido viral. Viral potential 9/10. Responder en próximas 12-24h para capturar audiencia.",

    "competitor_claim": "Benzema > Lewandowski para Jornada 10",
    "our_data": {
        "competitor_views": 58000,
        "competitor_engagement": 4.2, // %
        "content_type": "prediccion",
        "viral_potential": 9,
        "published_hours_ago": 18
    },

    "viral_potential": 10, // MÁXIMO
    "urgency_deadline": "2025-10-13T12:00:00Z", // 24 horas
    "estimated_views": 46400, // 80% potencial
    "priority": "P0" // CRÍTICO
}
```

### Priorización Automática

```javascript
// P0: CRÍTICO (<24h o viral_response)
if (urgency_hours < 24 || type === 'viral_response') {
    priority = 'P0';
}
// P1: ALTA (<48h o viral_potential ≥ 8)
else if (urgency_hours < 48 || viral_potential >= 8) {
    priority = 'P1';
}
// P2: MEDIA (<5 días)
else if (urgency_hours < 120) {
    priority = 'P2';
}
// P3: BAJA (>5 días)
else {
    priority = 'P3';
}
```

### Output

- ✅ **Recomendaciones** guardadas en `competitive_recommendations`
- ✅ **Priorizadas** automáticamente (P0/P1/P2/P3)
- ✅ **Estadísticas** agregadas (total views estimadas, avg viral potential)

---

## 📋 FASE 3: BRIEF PARA REDACTOR VIRAL

### Endpoint: `GET /api/competitive/recommendations/:id/details`

### Output Completo para Agente Redactor

```json
{
  "success": true,
  "data": {
    // === INFORMACIÓN BÁSICA ===
    "recommendation_id": "uuid-abc123",
    "recommendation_type": "counter_argument",
    "priority": "P0",
    "urgency_deadline": "2025-10-14T10:00:00Z",
    "urgency_hours": 22,  // Calculado automáticamente

    // === CONTEXTO DEL COMPETIDOR ===
    "competitor": {
      "channel_name": "Fantasy Insider",
      "video_title": "LEWANDOWSKI REGALADO - FICHALO YA",
      "video_views": 45000,
      "published_at": "2025-10-12T08:00:00Z",
      "claim": "Lewandowski está REGALADO a 8.5M"
    },

    // === ANÁLISIS DEL VIDEO FUENTE ===
    "source_analysis": {
      "players": [...],  // Jugadores mencionados
      "claims": [...],   // Claims específicos
      "predictions": [...],  // Predicciones
      "context": {...},  // Jornada, rival, condición
      "viralPotential": 8
    },

    // === NUESTROS DATOS (API-Sports reales) ===
    "our_data": {
      "player_id": 12345,
      "player_name": "Lewandowski",
      "team": "Barcelona",
      "position": "Delantero",
      "current_price": 8.5,
      "fantasy_points_last_5": [8, 2, 12, 3, 7],
      "avg_points": 6.4,
      "value_ratio": 0.75,  // BAJO (no es chollo)
      "next_fixtures": ["Getafe (H)", "Sevilla (A)", "Athletic (H)"],
      "difficulty_avg": 2.3  // 1=fácil, 5=difícil
    },

    // === TARGET ===
    "target_player": "Lewandowski",
    "target_gameweek": "Jornada 10",

    // === MÉTRICAS OBJETIVO ===
    "viral_potential": 9,  // Nuestro potencial
    "estimated_views": 22500,

    // === RATIONALE ===
    "rationale": "Video competidor: 'LEWANDOWSKI REGALADO' (45,000 views). Claim sin verificar. Oportunidad para contrastar con datos oficiales.",

    // === GUÍA PARA EL REDACTOR ===
    "writer_guidance": {
      "content_type": "Contraargumento con datos reales",
      "tone": "Autoritativo pero no agresivo, basado en hechos",

      "key_points": [
        "Reconocer el video del competidor",
        "Presentar datos oficiales API-Sports",
        "Contrastar con claim específico",
        "CTA: 'Revisa siempre los datos oficiales'"
      ],

      "hook_suggestions": [
        "¿Has visto el video de Fantasy Insider sobre Lewandowski?",
        "Hay un video viral sobre Lewandowski que necesita contexto...",
        "ATENCIÓN: Lo que NO te están diciendo sobre Lewandowski"
      ],

      "cta_suggestions": [
        "Descarga la app Fantasy La Liga Pro",
        "Sígueme para más análisis con datos reales",
        "Comenta si ya lo fichaste",
        "¿Estás de acuerdo? Déjame tu opinión"
      ]
    }
  }
}
```

---

## 📊 TABLA PARA AGENTE REDACTOR VIRAL

### Formato Markdown (para copiar/pegar a Ana IA)

```markdown
# Brief: CONTRAARGUMENTO sobre Lewandowski

## 🎯 PRIORIDAD: P0 (URGENTE - 22 horas restantes)

## 📹 VIDEO COMPETIDOR

- **Canal**: Fantasy Insider
- **Título**: "LEWANDOWSKI REGALADO - FICHALO YA"
- **Views**: 45,000
- **Claim**: "Lewandowski está REGALADO a 8.5M"
- **Publicado**: Hace 18 horas

## 📊 NUESTROS DATOS (API-Sports)

| Métrica          | Valor                     | Interpretación                     |
| ---------------- | ------------------------- | ---------------------------------- |
| Precio           | 8.5M                      | ❌ NO es chollo (promedio mercado) |
| Puntos últimos 5 | 6.4 avg                   | ⚠️ Irregular (8,2,12,3,7)          |
| Value Ratio      | 0.75                      | ❌ BAJO (umbral chollo: 1.2)       |
| Próximos rivales | Getafe, Sevilla, Athletic | 🟡 Mixto (2.3/5 dificultad)        |

## ✅ CONCLUSIÓN

**El claim del competidor es FALSO**. Lewandowski NO está regalado según datos
oficiales.

## 🎬 GUIÓN RECOMENDADO

### Tono

Autoritativo pero no agresivo, basado en hechos

### Estructura (3 segmentos, 24 segundos total)

**Segmento 1 (Intro - 8s)** Hook: "¿Has visto el video viral sobre Lewandowski?
Déjame mostrarte lo que los DATOS REALES dicen..."

**Segmento 2 (Middle - 8s)** Datos: "API-Sports confirma: Lewandowski 6.4 puntos
promedio, value ratio 0.75. NO cumple criterio chollo (necesita 1.2+)"

**Segmento 3 (Outro - 8s)** CTA: "SIEMPRE revisa datos oficiales antes de
fichar. Sígueme para análisis con fuentes verificadas. ¿Ya lo fichaste?"

## 📈 POTENCIAL

- **Viral Potential**: 9/10
- **Views Estimadas**: 22,500
- **Engagement Esperado**: Alto (tema trending + contraargumento polémico)

## ⏰ DEADLINE

**2025-10-14 10:00** (22 horas restantes)
```

---

## 🔄 AUTOMATIZACIÓN COMPLETA

### Flujo Automático (sin intervención manual)

1. **Detección** (YouTubeMonitor)
    - Monitoreo cada 1 hora de canales configurados
    - Detección de videos nuevos

2. **Transcripción** (TranscriptionService)
    - Descarga video con yt-dlp
    - Transcribe con Whisper API
    - Costo: ~$0.01 por video

3. **Análisis** (ContentAnalyzer)
    - Extrae jugadores, claims, predicciones
    - Calcula viral potential
    - Costo: ~$0.001 por análisis

4. **Generación Recomendaciones** (RecommendationEngine)
    - Cada 1 hora analiza videos completados (últimos 7 días)
    - Genera counter_arguments, player_spotlights, viral_responses
    - Prioriza automáticamente

5. **Brief para Redactor** (Endpoint API)
    - Agente redactor consume `/recommendations/:id/details`
    - Recibe brief completo con guía y datos
    - Genera guión VEO3 listo para Ana

---

## 📡 ENDPOINTS DISPONIBLES

### Listar Recomendaciones

```bash
GET /api/competitive/recommendations?priority=P0&status=pending&limit=10
```

**Response**:

```json
{
    "success": true,
    "data": {
        "recommendations": [
            {
                "id": "uuid",
                "recommendation_type": "counter_argument",
                "title": "CONTRAARGUMENTO: Lewandowski...",
                "priority": "P0",
                "urgency_hours": 22,
                "viral_potential": 9,
                "estimated_views": 22500,
                "channel_name": "Fantasy Insider",
                "video_title": "LEWANDOWSKI REGALADO...",
                "video_views": 45000
            }
        ],
        "stats": {
            "total": 15,
            "by_priority": { "P0": 3, "P1": 7, "P2": 5, "P3": 0 },
            "by_type": {
                "counter_argument": 8,
                "player_spotlight": 5,
                "viral_response": 2
            },
            "estimated_total_views": 285000,
            "avg_viral_potential": "7.80"
        }
    }
}
```

### Generar Nuevas Recomendaciones

```bash
POST /api/competitive/recommendations/generate
Content-Type: application/json

{
  "lookbackDays": 7
}
```

### Obtener Brief Completo

```bash
GET /api/competitive/recommendations/{id}/details
```

---

## 💰 COSTOS TOTALES

| Fase                | Servicio    | Costo       | Frecuencia     |
| ------------------- | ----------- | ----------- | -------------- |
| Transcripción       | Whisper API | $0.01       | Por video      |
| Análisis            | GPT-4o Mini | $0.001      | Por video      |
| Recomendaciones     | GPT-4o Mini | $0.005      | Por generación |
| **Total por video** |             | **~$0.016** |                |

### Ejemplo Real (20 videos/semana)

- Transcripción: 20 × $0.01 = **$0.20**
- Análisis: 20 × $0.001 = **$0.02**
- Recomendaciones: 7 × $0.005 = **$0.04**
- **Total semanal: $0.26**
- **Total mensual: ~$1.00**

---

## ✅ BENEFICIOS DEL SISTEMA

1. **100% Automatizado**
    - Sin intervención manual desde detección hasta brief

2. **Data-Driven**
    - Todas las decisiones basadas en métricas reales
    - Priorización automática por urgencia y potencial viral

3. **Escalable**
    - Puede monitorizar decenas de canales simultáneamente
    - Costo marginal bajo (~$0.016 por video)

4. **Accionable**
    - Briefs listos para agente redactor
    - Guías específicas por tipo de contenido
    - Sugerencias de hooks y CTAs

5. **Trazable**
    - Todas las recomendaciones tienen fuente rastreable
    - Métricas para medir éxito (views estimadas vs reales)

---

**Última actualización**: 12 Octubre 2025 **Versión**: 1.0.0 **Autor**: Claude
Code + Fantasy La Liga Pro Team
