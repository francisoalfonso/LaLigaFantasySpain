-- ============================================================================
-- COMPETITIVE RECOMMENDATIONS SCHEMA
-- Sistema de recomendaciones priorizadas del Agente Analizador → Agente VEO3
-- ============================================================================
--
-- Fecha creación: 12 Oct 2025
-- Feature: Tabla priorizada de recomendaciones con workflow completo
--
-- WORKFLOW:
-- 1. Agente Analizador crea recomendación (status: pending)
-- 2. Agente VEO3 consume recomendación (status: in_production)
-- 3. Video publicado en YouTube/Instagram (status: published)
-- 4. Recomendación archivada o eliminada de pendientes
-- ============================================================================

-- Tabla: competitive_recommendations
-- Recomendaciones de contenido basadas en análisis competitivo
CREATE TABLE IF NOT EXISTS competitive_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Metadata básica
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Prioridad y estado
    priority text NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')) DEFAULT 'P2',
    status text NOT NULL CHECK (status IN ('pending', 'in_production', 'published', 'archived', 'rejected')) DEFAULT 'pending',

    -- Tipo de recomendación
    recommendation_type text NOT NULL CHECK (recommendation_type IN (
        'counter_argument',    -- Contraargumento a video competidor
        'trend_jump',          -- Saltar a tendencia detectada
        'player_spotlight',    -- Spotlight de jugador mencionado frecuentemente
        'viral_response',      -- Respuesta viral urgente
        'data_contrast'        -- Contrastar con datos propios
    )),

    -- Contenido de la recomendación
    title text NOT NULL,                        -- "Contraargumento: Carlos Álvarez NO es el mejor chollo"
    description text,                           -- Explicación detallada
    rationale text,                             -- "José Carrasco dice que Carlos Álvarez es top chollo, pero nuestros datos muestran..."

    -- Referencias
    source_video_id uuid REFERENCES competitive_videos(id) ON DELETE SET NULL,  -- Video competidor que originó esto
    source_channel_id uuid REFERENCES competitive_channels(id) ON DELETE SET NULL,
    target_player text,                         -- "Carlos Álvarez" (jugador sobre el que trata)
    target_gameweek integer,                    -- Jornada relevante

    -- Datos de contraste (nuestros datos)
    our_data jsonb,                             -- Datos de BargainAnalyzer, API-Sports, etc.
    competitor_claim text,                      -- Claim original del competidor

    -- Métricas de viralidad
    viral_potential integer CHECK (viral_potential >= 0 AND viral_potential <= 10),  -- 0-10
    urgency_deadline timestamptz,               -- Deadline para crear contenido (pierde relevancia después)
    estimated_views integer,                    -- Estimación de views potenciales

    -- Workflow de producción
    claimed_by text,                            -- "veo3_agent" o "manual"
    claimed_at timestamptz,
    script_generated_at timestamptz,
    video_session_id text,                      -- ID de sesión VEO3 cuando se genera video

    -- Publicación
    published_at timestamptz,
    published_urls jsonb,                       -- {"youtube": "https://...", "instagram": "https://..."}

    -- Performance post-publicación
    performance_metrics jsonb                   -- {"views": 10000, "engagement_rate": 3.5, "likes": 350}
);

-- Índices para competitive_recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_status
    ON competitive_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority
    ON competitive_recommendations(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_type
    ON competitive_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_pending
    ON competitive_recommendations(status, priority DESC)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_recommendations_deadline
    ON competitive_recommendations(urgency_deadline)
    WHERE status = 'pending' AND urgency_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendations_player
    ON competitive_recommendations(target_player)
    WHERE target_player IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendations_source
    ON competitive_recommendations(source_video_id);

-- Comentarios
COMMENT ON TABLE competitive_recommendations IS 'Recomendaciones priorizadas del Agente Analizador para crear contenido viral';
COMMENT ON COLUMN competitive_recommendations.priority IS 'P0=crítico (24h), P1=alto (48h), P2=medio (1 semana), P3=bajo';
COMMENT ON COLUMN competitive_recommendations.status IS 'pending → in_production → published | archived | rejected';
COMMENT ON COLUMN competitive_recommendations.recommendation_type IS 'Tipo: counter_argument, trend_jump, player_spotlight, viral_response, data_contrast';
COMMENT ON COLUMN competitive_recommendations.our_data IS 'Datos propios para contrastar: {price, points, form, fixtures, etc}';
COMMENT ON COLUMN competitive_recommendations.urgency_deadline IS 'Después de esta fecha la recomendación pierde relevancia';
COMMENT ON COLUMN competitive_recommendations.video_session_id IS 'SessionID de VEO3 (ej: session_chollo_1234567890)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_recommendations_updated_at ON competitive_recommendations;
CREATE TRIGGER update_recommendations_updated_at
    BEFORE UPDATE ON competitive_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTILES
-- ============================================================================

-- Vista: Recomendaciones pendientes priorizadas
CREATE OR REPLACE VIEW recommendations_queue AS
SELECT
    r.id,
    r.priority,
    r.recommendation_type,
    r.title,
    r.description,
    r.rationale,
    r.target_player,
    r.viral_potential,
    r.urgency_deadline,
    r.created_at,
    cv.title as source_video_title,
    cv.video_url as source_video_url,
    cc.channel_name as source_channel_name,
    -- Calcular urgencia (días restantes hasta deadline)
    CASE
        WHEN r.urgency_deadline IS NULL THEN 999
        ELSE EXTRACT(EPOCH FROM (r.urgency_deadline - now())) / 86400
    END as days_until_deadline
FROM competitive_recommendations r
LEFT JOIN competitive_videos cv ON r.source_video_id = cv.id
LEFT JOIN competitive_channels cc ON r.source_channel_id = cc.id
WHERE r.status = 'pending'
ORDER BY
    CASE r.priority
        WHEN 'P0' THEN 1
        WHEN 'P1' THEN 2
        WHEN 'P2' THEN 3
        WHEN 'P3' THEN 4
    END,
    r.urgency_deadline ASC NULLS LAST,
    r.viral_potential DESC;

COMMENT ON VIEW recommendations_queue IS 'Cola de recomendaciones pendientes ordenada por prioridad, deadline y potencial viral';

-- ============================================================================

-- Vista: Recomendaciones en producción
CREATE OR REPLACE VIEW recommendations_in_production AS
SELECT
    r.id,
    r.title,
    r.claimed_by,
    r.claimed_at,
    r.video_session_id,
    r.created_at,
    EXTRACT(EPOCH FROM (now() - r.claimed_at)) / 3600 as hours_in_production
FROM competitive_recommendations r
WHERE r.status = 'in_production'
ORDER BY r.claimed_at DESC;

COMMENT ON VIEW recommendations_in_production IS 'Recomendaciones actualmente en producción (VEO3 generando video)';

-- ============================================================================

-- Vista: Performance de recomendaciones publicadas
CREATE OR REPLACE VIEW recommendations_performance AS
SELECT
    r.id,
    r.recommendation_type,
    r.title,
    r.published_at,
    r.published_urls,
    r.performance_metrics,
    (r.performance_metrics->>'views')::integer as views,
    (r.performance_metrics->>'likes')::integer as likes,
    (r.performance_metrics->>'engagement_rate')::float as engagement_rate,
    cv.title as source_video_title,
    cc.channel_name as source_channel_name
FROM competitive_recommendations r
LEFT JOIN competitive_videos cv ON r.source_video_id = cv.id
LEFT JOIN competitive_channels cc ON r.source_channel_id = cc.id
WHERE r.status = 'published'
AND r.published_at IS NOT NULL
ORDER BY r.published_at DESC;

COMMENT ON VIEW recommendations_performance IS 'Performance de contenido publicado basado en recomendaciones';

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función: Marcar recomendación como "en producción"
CREATE OR REPLACE FUNCTION claim_recommendation(
    recommendation_id uuid,
    claimed_by_name text DEFAULT 'veo3_agent'
)
RETURNS boolean AS $$
DECLARE
    success boolean;
BEGIN
    UPDATE competitive_recommendations
    SET
        status = 'in_production',
        claimed_by = claimed_by_name,
        claimed_at = now(),
        updated_at = now()
    WHERE
        id = recommendation_id
        AND status = 'pending';

    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION claim_recommendation IS 'Marcar recomendación como reclamada para producción';

-- ============================================================================

-- Función: Marcar recomendación como publicada
CREATE OR REPLACE FUNCTION publish_recommendation(
    recommendation_id uuid,
    youtube_url text DEFAULT NULL,
    instagram_url text DEFAULT NULL,
    session_id text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    success boolean;
    urls jsonb;
BEGIN
    -- Construir objeto de URLs
    urls := jsonb_build_object(
        'youtube', youtube_url,
        'instagram', instagram_url
    );

    UPDATE competitive_recommendations
    SET
        status = 'published',
        published_at = now(),
        published_urls = urls,
        video_session_id = COALESCE(session_id, video_session_id),
        updated_at = now()
    WHERE
        id = recommendation_id
        AND status = 'in_production';

    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION publish_recommendation IS 'Marcar recomendación como publicada con URLs';

-- ============================================================================

-- Función: Actualizar performance metrics
CREATE OR REPLACE FUNCTION update_recommendation_metrics(
    recommendation_id uuid,
    views_count integer DEFAULT NULL,
    likes_count integer DEFAULT NULL,
    comments_count integer DEFAULT NULL,
    engagement_rate_value float DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    success boolean;
BEGIN
    UPDATE competitive_recommendations
    SET
        performance_metrics = jsonb_build_object(
            'views', views_count,
            'likes', likes_count,
            'comments', comments_count,
            'engagement_rate', engagement_rate_value,
            'updated_at', now()
        ),
        updated_at = now()
    WHERE
        id = recommendation_id
        AND status = 'published';

    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_recommendation_metrics IS 'Actualizar métricas de performance post-publicación';

-- ============================================================================

-- Función: Archivar recomendaciones antiguas
CREATE OR REPLACE FUNCTION archive_old_recommendations(
    days_old integer DEFAULT 30
)
RETURNS integer AS $$
DECLARE
    archived_count integer;
BEGIN
    UPDATE competitive_recommendations
    SET
        status = 'archived',
        updated_at = now()
    WHERE
        status = 'published'
        AND published_at < now() - (days_old || ' days')::interval;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_recommendations IS 'Archivar recomendaciones publicadas hace más de N días';

-- ============================================================================

-- Función: Rechazar recomendación expirada
CREATE OR REPLACE FUNCTION reject_expired_recommendations()
RETURNS integer AS $$
DECLARE
    rejected_count integer;
BEGIN
    UPDATE competitive_recommendations
    SET
        status = 'rejected',
        updated_at = now()
    WHERE
        status = 'pending'
        AND urgency_deadline IS NOT NULL
        AND urgency_deadline < now();

    GET DIAGNOSTICS rejected_count = ROW_COUNT;
    RETURN rejected_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reject_expired_recommendations IS 'Rechazar recomendaciones pendientes que pasaron su deadline';

-- ============================================================================
-- DATOS DE EJEMPLO (comentar en producción)
-- ============================================================================

/*
-- Ejemplo 1: Contraargumento urgente
INSERT INTO competitive_recommendations (
    priority,
    status,
    recommendation_type,
    title,
    description,
    rationale,
    target_player,
    target_gameweek,
    our_data,
    competitor_claim,
    viral_potential,
    urgency_deadline
) VALUES (
    'P0',
    'pending',
    'counter_argument',
    'CONTRAARGUMENTO: Carlos Álvarez NO es el mejor chollo de la jornada 8',
    'José Carrasco afirma que Carlos Álvarez (Levante) es el mejor chollo. Nuestros datos muestran que tiene rival difícil y bajo xG',
    'Competidor: José Carrasco (@JoseCarrasco_98) publicó video "Carlos Álvarez REGALADO" con 28K views. Nuestros datos: Levante vs Barcelona (0% clean sheet), Carlos Álvarez 0.3 xG últimos 3 partidos, Pepelu mejor opción en Valencia',
    'Carlos Álvarez',
    8,
    jsonb_build_object(
        'player', 'Carlos Álvarez',
        'team', 'Levante',
        'price', 5.2,
        'opponent', 'Barcelona',
        'xG_last3', 0.3,
        'clean_sheet_prob', 0.05,
        'alternative', jsonb_build_object('name', 'Pepelu', 'price', 5.5, 'xG_last3', 1.2)
    ),
    'Carlos Álvarez es el mejor chollo de la jornada 8',
    9,
    now() + interval '24 hours'
);

-- Ejemplo 2: Spotlight de jugador trending
INSERT INTO competitive_recommendations (
    priority,
    status,
    recommendation_type,
    title,
    description,
    target_player,
    viral_potential,
    urgency_deadline
) VALUES (
    'P1',
    'pending',
    'player_spotlight',
    'ANÁLISIS: Por qué F. de Jong es el centrocampista más infravalorado',
    'F. de Jong mencionado 5 veces en videos competidores esta semana. Crear spotlight con datos de rendimiento',
    'F. de Jong',
    7,
    now() + interval '72 hours'
);
*/

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
