-- ============================================================================
-- MIGRATION: Añadir columnas para Onboarding System
-- Fecha: 12 Oct 2025
-- ============================================================================
--
-- INSTRUCCIONES:
-- 1. Abre: https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/sql
-- 2. Copia TODO este archivo
-- 3. Pégalo en el SQL Editor
-- 4. Click "RUN" (botón verde)
-- 5. Espera confirmación "Success"
--
-- ============================================================================

-- Añadir columnas a competitive_channels
ALTER TABLE competitive_channels
ADD COLUMN IF NOT EXISTS insights jsonb,
ADD COLUMN IF NOT EXISTS viral_patterns jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS onboarding_metadata jsonb;

-- Añadir columnas a competitive_videos
ALTER TABLE competitive_videos
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate float DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_competitive_channels_insights
    ON competitive_channels USING gin(insights);

CREATE INDEX IF NOT EXISTS idx_competitive_channels_viral_patterns
    ON competitive_channels USING gin(viral_patterns);

CREATE INDEX IF NOT EXISTS idx_competitive_videos_views
    ON competitive_videos(views DESC);

CREATE INDEX IF NOT EXISTS idx_competitive_videos_engagement
    ON competitive_videos(engagement_rate DESC);

-- ============================================================================
-- FIN - Verifica que aparezca "Success. No rows returned"
-- ============================================================================
