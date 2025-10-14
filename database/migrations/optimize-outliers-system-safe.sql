-- ============================================================================
-- MIGRATION: Optimizar Sistema de Outliers (SAFE VERSION)
-- Fecha: 14 Octubre 2025
-- Fix: Drop vista antes de ALTER COLUMN para evitar conflictos
-- ============================================================================

-- ============================================================================
-- PASO 0: Eliminar vista si existe (evita conflicto con ALTER TYPE)
-- ============================================================================

DROP VIEW IF EXISTS outliers_performance_analysis;

-- ============================================================================
-- PARTE 1: Extender tabla youtube_outliers con análisis de contenido
-- ============================================================================

-- Añadir columnas para análisis de contenido
ALTER TABLE youtube_outliers
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS content_analysis JSONB,
ADD COLUMN IF NOT EXISTS mentioned_players JSONB,
ADD COLUMN IF NOT EXISTS enriched_data JSONB,
ADD COLUMN IF NOT EXISTS generated_script JSONB,
ADD COLUMN IF NOT EXISTS response_video_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS platform VARCHAR(20);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_outliers_response_video ON youtube_outliers(response_video_id);
CREATE INDEX IF NOT EXISTS idx_outliers_platform ON youtube_outliers(platform);
CREATE INDEX IF NOT EXISTS idx_outliers_published_at ON youtube_outliers(published_at DESC);

-- Comentarios descriptivos
COMMENT ON COLUMN youtube_outliers.transcription IS 'Transcripción completa del video viral (Whisper API)';
COMMENT ON COLUMN youtube_outliers.content_analysis IS 'Análisis GPT del contenido: tesis, argumentos, hooks, jugadores mencionados';
COMMENT ON COLUMN youtube_outliers.mentioned_players IS 'Lista de jugadores mencionados en el video: ["Pedri", "Lewandowski"]';
COMMENT ON COLUMN youtube_outliers.enriched_data IS 'Stats de API-Sports para jugadores mencionados';
COMMENT ON COLUMN youtube_outliers.generated_script IS 'Script VEO3 generado por GPT para la respuesta';
COMMENT ON COLUMN youtube_outliers.response_video_id IS 'ID del video de YouTube/Instagram publicado como respuesta';
COMMENT ON COLUMN youtube_outliers.published_at IS 'Timestamp de publicación del video respuesta';
COMMENT ON COLUMN youtube_outliers.platform IS 'Plataforma de publicación: youtube | instagram';

-- ============================================================================
-- PARTE 2: Nueva tabla youtube_outliers_responses (tracking separado)
-- ============================================================================

CREATE TABLE IF NOT EXISTS youtube_outliers_responses (
  id SERIAL PRIMARY KEY,
  outlier_id INTEGER REFERENCES youtube_outliers(id) ON DELETE CASCADE,
  response_video_id VARCHAR(50) UNIQUE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  presenter VARCHAR(20) NOT NULL CHECK (presenter IN ('carlos', 'ana')),
  script_used JSONB,
  production_cost FLOAT DEFAULT 0.97,
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Métricas 24h
  views_24h INTEGER DEFAULT 0,
  likes_24h INTEGER DEFAULT 0,
  comments_24h INTEGER DEFAULT 0,
  engagement_rate_24h FLOAT DEFAULT 0,

  -- Métricas 48h
  views_48h INTEGER DEFAULT 0,
  likes_48h INTEGER DEFAULT 0,
  comments_48h INTEGER DEFAULT 0,
  engagement_rate_48h FLOAT DEFAULT 0,

  -- Métricas 7 días
  views_7d INTEGER DEFAULT 0,
  likes_7d INTEGER DEFAULT 0,
  comments_7d INTEGER DEFAULT 0,
  engagement_rate_7d FLOAT DEFAULT 0,

  -- ROI Calculation
  roi_score FLOAT,
  roi_24h FLOAT,
  roi_48h FLOAT,
  roi_7d FLOAT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para análisis de rendimiento
CREATE INDEX IF NOT EXISTS idx_outliers_responses_outlier_id ON youtube_outliers_responses(outlier_id);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_platform ON youtube_outliers_responses(platform);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_presenter ON youtube_outliers_responses(presenter);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_roi ON youtube_outliers_responses(roi_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_roi_24h ON youtube_outliers_responses(roi_24h DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_published_at ON youtube_outliers_responses(published_at DESC);

-- Comentarios descriptivos
COMMENT ON TABLE youtube_outliers_responses IS 'Tracking de videos respuesta publicados y sus métricas de rendimiento';
COMMENT ON COLUMN youtube_outliers_responses.roi_score IS 'ROI global: (views_7d / production_cost) / 1000';
COMMENT ON COLUMN youtube_outliers_responses.roi_24h IS 'ROI primeras 24h: (views_24h / production_cost) / 1000';
COMMENT ON COLUMN youtube_outliers_responses.engagement_rate_24h IS '((likes + comments) / views) * 100 en primeras 24h';

-- ============================================================================
-- PARTE 4: Actualizar enum de processing_status (SAFE: solo si no es ya VARCHAR)
-- ============================================================================

-- Cambiar tipo de columna para soportar nuevos estados (solo si no es ya VARCHAR)
DO $$
BEGIN
    -- Verificar si la columna NO es ya VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'youtube_outliers'
        AND column_name = 'processing_status'
        AND data_type != 'character varying'
    ) THEN
        ALTER TABLE youtube_outliers ALTER COLUMN processing_status TYPE VARCHAR(20);
        RAISE NOTICE 'processing_status convertido a VARCHAR(20)';
    ELSE
        RAISE NOTICE 'processing_status ya es VARCHAR, skip';
    END IF;
END $$;

-- Estados posibles (documentados):
-- 'detected'    - Outlier detectado, pendiente de análisis
-- 'analyzing'   - Descargando y transcribiendo video
-- 'analyzed'    - Transcripción y análisis GPT completados
-- 'enriched'    - Datos de API-Sports añadidos
-- 'scripted'    - Script VEO3 generado
-- 'producing'   - Generando video VEO3
-- 'published'   - Video respuesta publicado
-- 'failed'      - Error en alguna fase
-- 'skipped'     - Decidido no responder (P3 bajo ROI esperado)

-- ============================================================================
-- PARTE 3: Vista para análisis de ROI y rendimiento (RECREAR)
-- ============================================================================

CREATE OR REPLACE VIEW outliers_performance_analysis AS
SELECT
    o.id AS outlier_id,
    o.video_id AS outlier_video_id,
    o.title AS outlier_title,
    o.channel_name AS outlier_channel,
    o.views AS outlier_views,
    o.outlier_score,
    o.priority,
    o.detected_at,

    r.response_video_id,
    r.platform,
    r.presenter,
    r.published_at,

    -- Tiempo de respuesta
    EXTRACT(EPOCH FROM (r.published_at - o.detected_at)) / 3600 AS response_time_hours,

    -- Métricas de rendimiento
    r.views_24h,
    r.views_48h,
    r.views_7d,
    r.engagement_rate_24h,
    r.engagement_rate_48h,
    r.engagement_rate_7d,

    -- ROI
    r.production_cost,
    r.roi_24h,
    r.roi_48h,
    r.roi_7d,

    -- Ratio viral respuesta vs original
    CASE
        WHEN o.views > 0 THEN (r.views_7d::FLOAT / o.views::FLOAT) * 100
        ELSE 0
    END AS capture_rate_percentage,

    -- Clasificación de éxito
    CASE
        WHEN r.roi_7d >= 20 THEN 'Éxito Alto'
        WHEN r.roi_7d >= 10 THEN 'Éxito Medio'
        WHEN r.roi_7d >= 5 THEN 'Éxito Bajo'
        ELSE 'Bajo Rendimiento'
    END AS success_category

FROM youtube_outliers o
LEFT JOIN youtube_outliers_responses r ON o.id = r.outlier_id
WHERE o.processing_status = 'published';

COMMENT ON VIEW outliers_performance_analysis IS 'Vista analítica para evaluar ROI y éxito de respuestas a outliers';

-- ============================================================================
-- PARTE 5: Función para calcular ROI automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_roi(
    views INTEGER,
    production_cost FLOAT DEFAULT 0.97
) RETURNS FLOAT AS $$
BEGIN
    IF production_cost <= 0 THEN
        RETURN 0;
    END IF;

    RETURN (views::FLOAT / production_cost) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_roi IS 'Calcula ROI: (views / production_cost) / 1000';

-- ============================================================================
-- PARTE 6: Trigger para actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_outliers_responses_updated_at ON youtube_outliers_responses;

CREATE TRIGGER update_outliers_responses_updated_at
    BEFORE UPDATE ON youtube_outliers_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

-- Verificar que todo se aplicó correctamente
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completada exitosamente';
    RAISE NOTICE '   - Columnas añadidas a youtube_outliers: transcription, content_analysis, etc.';
    RAISE NOTICE '   - Tabla youtube_outliers_responses creada';
    RAISE NOTICE '   - Vista outliers_performance_analysis creada';
    RAISE NOTICE '   - Función calculate_roi() creada';
    RAISE NOTICE '   - Trigger update_updated_at activado';
END $$;
