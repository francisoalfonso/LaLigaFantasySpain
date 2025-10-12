-- ============================================================================
-- COMPETITIVE CHANNELS - ONBOARDING COLUMNS
-- Añadir columnas para almacenar insights y viral patterns del onboarding
-- ============================================================================
--
-- Fecha: 12 Oct 2025
-- Feature: Onboarding con YouTube API v3 + Content Analysis
--
-- IMPORTANTE: Ejecutar DESPUÉS de competitive-channels-schema.sql
-- ============================================================================

-- ============================================================================
-- AÑADIR COLUMNAS A competitive_channels
-- ============================================================================

-- Columnas para almacenar resultados del onboarding
ALTER TABLE competitive_channels
ADD COLUMN IF NOT EXISTS insights jsonb,
ADD COLUMN IF NOT EXISTS viral_patterns jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS onboarding_metadata jsonb;

-- Índice para búsquedas en insights (performance_benchmarks)
CREATE INDEX IF NOT EXISTS idx_competitive_channels_insights
    ON competitive_channels USING gin(insights);

-- Índice para búsquedas en viral_patterns
CREATE INDEX IF NOT EXISTS idx_competitive_channels_viral_patterns
    ON competitive_channels USING gin(viral_patterns);

-- Índice para ordenar por última fecha de onboarding
CREATE INDEX IF NOT EXISTS idx_competitive_channels_onboarding_date
    ON competitive_channels(onboarding_completed_at DESC);

-- Comentarios
COMMENT ON COLUMN competitive_channels.insights IS 'Resultados del análisis: performance_benchmarks, content_patterns, posting_strategy, competitive_strategy';
COMMENT ON COLUMN competitive_channels.viral_patterns IS 'Patrones virales extraídos: content_structures, viral_keywords, tone_preferences, hook_strategies, engagement_tactics, recommendations_for_veo3';
COMMENT ON COLUMN competitive_channels.onboarding_completed_at IS 'Última fecha de onboarding completado';
COMMENT ON COLUMN competitive_channels.onboarding_metadata IS 'Metadatos del onboarding: videos_found, top_count, transcribed_count, cost_estimate, mode';

-- ============================================================================
-- AÑADIR COLUMNAS A competitive_videos
-- ============================================================================

-- Columnas para métricas de engagement (obtenidas de YouTube API)
ALTER TABLE competitive_videos
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate float DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

-- Índices para ordenar por métricas
CREATE INDEX IF NOT EXISTS idx_competitive_videos_views
    ON competitive_videos(views DESC);

CREATE INDEX IF NOT EXISTS idx_competitive_videos_engagement
    ON competitive_videos(engagement_rate DESC);

CREATE INDEX IF NOT EXISTS idx_competitive_videos_duration
    ON competitive_videos(duration_seconds);

-- Comentarios
COMMENT ON COLUMN competitive_videos.views IS 'Número de visualizaciones (YouTube API)';
COMMENT ON COLUMN competitive_videos.likes IS 'Número de likes (YouTube API)';
COMMENT ON COLUMN competitive_videos.comments IS 'Número de comentarios (YouTube API)';
COMMENT ON COLUMN competitive_videos.engagement_rate IS 'Tasa de engagement: (likes + comments) / views';
COMMENT ON COLUMN competitive_videos.duration_seconds IS 'Duración del video en segundos (para filtrar Shorts <60s)';

-- ============================================================================
-- EJEMPLO DE DATOS ALMACENADOS
-- ============================================================================

-- Ejemplo de estructura de insights (JSONB)
/*
{
  "channel": {
    "name": "José Carrasco",
    "content_type": "chollos",
    "priority": 5
  },
  "performance_benchmarks": {
    "views": 24108.2,
    "likes": 979.9,
    "comments": 52.1,
    "engagement_rate": 0.0385,
    "duration_seconds": 45
  },
  "content_patterns": {
    "top_keywords": ["chollo", "fantasy", "jornada"],
    "most_mentioned_players": ["Lewandowski", "Bellingham"],
    "viral_claims": ["Este jugador es un ROBO"],
    "tone_distribution": {
      "urgente": 60,
      "análisis": 30,
      "humor": 10
    }
  },
  "posting_strategy": {
    "best_days": ["friday", "saturday"],
    "best_hours": [18, 19, 20]
  },
  "competitive_strategy": {
    "their_strength": "Claims virales con urgencia",
    "our_opportunity": "Análisis técnico profundo con datos API-Sports",
    "response_timing": "Publicar 2-4h después con datos de contraste",
    "differentiation": "Ana con respaldo estadístico vs opinión viral"
  }
}
*/

-- Ejemplo de estructura de viral_patterns (JSONB)
/*
{
  "content_structures": [
    "hook (3s) → claim (5s) → justificación (30s) → CTA suave"
  ],
  "viral_keywords": [
    "OBLIGATORIO",
    "CHOLLO",
    "MILLONES",
    "PARÓN"
  ],
  "tone_preferences": ["urgente", "técnico"],
  "hook_strategies": [
    "Pregunta directa",
    "Claim polémico",
    "Número específico"
  ],
  "engagement_tactics": [
    "CTA en comentarios",
    "Pregunta al final",
    "Emoji en thumbnail"
  ],
  "recommendations_for_veo3": [
    "Usar keywords virales identificados en hooks",
    "Tono preferido: técnico",
    "Estructurar videos: hook (3s) → claim (5s) → justificación (30s) → CTA suave",
    "Incluir jugadores top mencionados por competencia",
    "Evitar copiar claims exactos, generar contraste con datos"
  ]
}
*/

-- Ejemplo de onboarding_metadata (JSONB)
/*
{
  "mode": "smart",
  "videos_found": 20,
  "top_count": 5,
  "transcribed_count": 3,
  "cost_estimate": 0.08,
  "started_at": "2025-10-12T10:58:00.992Z",
  "completed_at": "2025-10-12T10:58:07.324Z",
  "duration_seconds": 6
}
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
