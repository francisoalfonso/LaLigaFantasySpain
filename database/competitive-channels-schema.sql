-- ============================================================================
-- COMPETITIVE CHANNELS SCHEMA
-- Sistema de monitorización de canales YouTube competidores
-- ============================================================================
--
-- Fecha creación: 12 Oct 2025
-- Feature: Competitive YouTube Analyzer
--
-- IMPORTANTE: Este schema es NUEVO y NO modifica tablas existentes
-- ============================================================================

-- Tabla: competitive_channels
-- Almacena canales de YouTube que queremos monitorizar
CREATE TABLE IF NOT EXISTS competitive_channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_url text NOT NULL,
    channel_id text NOT NULL,
    channel_name text,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    content_type text DEFAULT 'general',
    monitoring_frequency text DEFAULT '1h',
    videos_processed integer DEFAULT 0,
    videos_detected integer DEFAULT 0,
    avg_quality_score float DEFAULT 0,
    last_checked timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT unique_channel_url UNIQUE (channel_url)
);

-- Índices para competitive_channels
CREATE INDEX IF NOT EXISTS idx_competitive_channels_active
    ON competitive_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_competitive_channels_priority
    ON competitive_channels(priority DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_channels_frequency
    ON competitive_channels(monitoring_frequency);

-- Comentarios
COMMENT ON TABLE competitive_channels IS 'Canales YouTube de competidores monitorizados';
COMMENT ON COLUMN competitive_channels.priority IS 'Prioridad 1-5 (5=alta)';
COMMENT ON COLUMN competitive_channels.monitoring_frequency IS 'Frecuencia: 30min, 1h, 4h, 12h, 24h';
COMMENT ON COLUMN competitive_channels.content_type IS 'Tipo: general, chollos, stats, predicciones, breaking';

-- ============================================================================

-- Tabla: competitive_videos
-- Almacena videos detectados de canales competidores
CREATE TABLE IF NOT EXISTS competitive_videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid REFERENCES competitive_channels(id) ON DELETE CASCADE,
    video_id text NOT NULL,
    video_url text NOT NULL,
    title text,
    thumbnail text,
    published_at timestamptz,
    detected_at timestamptz DEFAULT now(),
    processed boolean DEFAULT false,
    processing_status text DEFAULT 'pending',
    transcription jsonb,
    analysis jsonb,
    our_response_session_id text,
    quality_score float,
    engagement_metrics jsonb,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT unique_video_id UNIQUE (video_id)
);

-- Índices para competitive_videos
CREATE INDEX IF NOT EXISTS idx_competitive_videos_channel
    ON competitive_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_competitive_videos_processed
    ON competitive_videos(processed);
CREATE INDEX IF NOT EXISTS idx_competitive_videos_status
    ON competitive_videos(processing_status);
CREATE INDEX IF NOT EXISTS idx_competitive_videos_detected
    ON competitive_videos(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_videos_quality
    ON competitive_videos(quality_score DESC);

-- Comentarios
COMMENT ON TABLE competitive_videos IS 'Videos detectados de canales competidores';
COMMENT ON COLUMN competitive_videos.processing_status IS 'Estados: pending, analyzing, generating, completed, skipped';
COMMENT ON COLUMN competitive_videos.transcription IS 'Resultado de Whisper AI';
COMMENT ON COLUMN competitive_videos.analysis IS 'Resultado de Content Analyzer';
COMMENT ON COLUMN competitive_videos.our_response_session_id IS 'SessionID de VEO3 si generamos respuesta';

-- ============================================================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en competitive_channels
DROP TRIGGER IF EXISTS update_competitive_channels_updated_at ON competitive_channels;
CREATE TRIGGER update_competitive_channels_updated_at
    BEFORE UPDATE ON competitive_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Función: Actualizar stats del canal cuando se procesa un video
CREATE OR REPLACE FUNCTION update_channel_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el video acaba de ser procesado
    IF NEW.processed = true AND OLD.processed = false THEN
        UPDATE competitive_channels
        SET
            videos_processed = videos_processed + 1,
            avg_quality_score = (
                SELECT AVG(quality_score)
                FROM competitive_videos
                WHERE channel_id = NEW.channel_id
                AND processed = true
                AND quality_score IS NOT NULL
            )
        WHERE id = NEW.channel_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar stats del canal
DROP TRIGGER IF EXISTS update_channel_stats_trigger ON competitive_videos;
CREATE TRIGGER update_channel_stats_trigger
    AFTER UPDATE ON competitive_videos
    FOR EACH ROW
    WHEN (NEW.processed IS DISTINCT FROM OLD.processed)
    EXECUTE FUNCTION update_channel_stats();

-- ============================================================================

-- Datos de ejemplo (opcional - comentar en producción)
/*
INSERT INTO competitive_channels (
    channel_url,
    channel_id,
    channel_name,
    priority,
    content_type,
    monitoring_frequency
) VALUES
    (
        'https://www.youtube.com/@JoseCarrasco_98/shorts',
        'UCxxxxxxxxxxx',
        'José Carrasco',
        5,
        'chollos',
        '1h'
    ),
    (
        'https://www.youtube.com/@AnotherChannel/shorts',
        'UCyyyyyyyyyyyy',
        'Otro Canal Fantasy',
        3,
        'general',
        '4h'
    )
ON CONFLICT (channel_url) DO NOTHING;
*/

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
