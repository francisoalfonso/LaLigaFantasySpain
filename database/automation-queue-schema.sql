-- ============================================================================
-- AUTOMATION QUEUE SCHEMA
-- Sistema centralizado de cola para automatizaciones de video
-- ============================================================================
--
-- Fecha creación: 12 Oct 2025
-- Feature: Calendario/cola centralizado para evitar saturar APIs
--
-- OBJETIVO:
-- - Coordinar TODAS las generaciones de video (VEO3, Instagram, etc.)
-- - Respetar rate limits de APIs (VEO3, OpenAI, etc.)
-- - Priorizar trabajos por urgencia
-- - Prevenir conflictos y saturación
--
-- WORKFLOW:
-- 1. Diferentes fuentes encolan trabajos (recomendaciones, chollos, breaking)
-- 2. VideoOrchestrator consume cola respetando límites
-- 3. Marca como completed/failed cuando termina
-- ============================================================================

-- Tabla: automation_queue
-- Cola centralizada de trabajos de automatización
CREATE TABLE IF NOT EXISTS automation_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Metadata básica
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Prioridad y estado
    priority text NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')) DEFAULT 'P2',
    status text NOT NULL CHECK (status IN (
        'queued',           -- En cola esperando
        'processing',       -- Actualmente procesando
        'completed',        -- Completado exitosamente
        'failed',           -- Falló (se puede reintentar)
        'cancelled',        -- Cancelado manualmente
        'paused'            -- Pausado temporalmente
    )) DEFAULT 'queued',

    -- Tipo de trabajo
    job_type text NOT NULL CHECK (job_type IN (
        'veo3_chollo',              -- Video VEO3 de chollo
        'veo3_competitive_response', -- Respuesta a video competidor
        'veo3_player_spotlight',    -- Spotlight de jugador
        'veo3_breaking',            -- Breaking news urgente
        'instagram_reel',           -- Reel Instagram
        'instagram_carousel',       -- Carrusel Instagram
        'tiktok_video'              -- Video TikTok
    )),

    -- Contenido del trabajo
    title text NOT NULL,                        -- "Generar video: Carlos Álvarez chollo J8"
    description text,                           -- Descripción detallada
    job_config jsonb NOT NULL,                  -- Configuración específica del trabajo

    -- Referencias
    source_type text,                           -- 'recommendation', 'daily_bargain', 'manual', 'scheduled'
    source_id uuid,                             -- ID de la recomendación, bargain, etc.
    recommendation_id uuid REFERENCES competitive_recommendations(id) ON DELETE SET NULL,

    -- Deadlines y scheduling
    schedule_after timestamptz DEFAULT now(),   -- No procesar antes de esta fecha
    deadline timestamptz,                       -- Debe completarse antes de esta fecha
    estimated_duration_seconds integer,         -- Duración estimada (para planning)

    -- Restricciones de rate limiting
    api_provider text,                          -- 'veo3', 'openai', 'instagram', etc.
    api_cost_estimate decimal(6,2),             -- Costo estimado en USD

    -- Ejecución
    started_at timestamptz,
    completed_at timestamptz,
    duration_seconds integer,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,

    -- Resultados
    result_data jsonb,                          -- Resultado del trabajo (session_id, URLs, etc.)
    error_message text,
    error_details jsonb,

    -- Performance tracking
    actual_cost decimal(6,2),                   -- Costo real incurrido
    output_urls jsonb                           -- URLs de outputs generados
);

-- Índices para automation_queue
CREATE INDEX IF NOT EXISTS idx_queue_status
    ON automation_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority
    ON automation_queue(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_pending
    ON automation_queue(status, priority, schedule_after)
    WHERE status IN ('queued', 'paused');
CREATE INDEX IF NOT EXISTS idx_queue_processing
    ON automation_queue(status, started_at DESC)
    WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_queue_type
    ON automation_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_queue_provider
    ON automation_queue(api_provider)
    WHERE status IN ('queued', 'processing');
CREATE INDEX IF NOT EXISTS idx_queue_deadline
    ON automation_queue(deadline)
    WHERE status = 'queued' AND deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_queue_recommendation
    ON automation_queue(recommendation_id);

-- Comentarios
COMMENT ON TABLE automation_queue IS 'Cola centralizada de automatizaciones para coordinar generación de videos y contenido';
COMMENT ON COLUMN automation_queue.priority IS 'P0=crítico (ejecutar ASAP), P1=alto, P2=medio, P3=bajo';
COMMENT ON COLUMN automation_queue.status IS 'queued → processing → completed | failed | cancelled';
COMMENT ON COLUMN automation_queue.job_config IS 'Configuración JSON del trabajo: {player, price, data, script_segments, etc}';
COMMENT ON COLUMN automation_queue.schedule_after IS 'No procesar antes de esta fecha (para scheduling futuro)';
COMMENT ON COLUMN automation_queue.estimated_duration_seconds IS 'Duración estimada para planning (VEO3: ~300s, Instagram: ~30s)';
COMMENT ON COLUMN automation_queue.api_provider IS 'API principal usada: veo3, openai, instagram, tiktok';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_queue_updated_at ON automation_queue;
CREATE TRIGGER update_queue_updated_at
    BEFORE UPDATE ON automation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTILES
-- ============================================================================

-- Vista: Cola pendiente priorizada
CREATE OR REPLACE VIEW queue_pending AS
SELECT
    q.id,
    q.priority,
    q.job_type,
    q.title,
    q.description,
    q.schedule_after,
    q.deadline,
    q.estimated_duration_seconds,
    q.api_provider,
    q.api_cost_estimate,
    q.created_at,
    -- Calcular urgencia
    CASE
        WHEN q.deadline IS NULL THEN 999
        ELSE EXTRACT(EPOCH FROM (q.deadline - now())) / 3600
    END as hours_until_deadline,
    -- Calcular tiempo en cola
    EXTRACT(EPOCH FROM (now() - q.created_at)) / 3600 as hours_in_queue
FROM automation_queue q
WHERE q.status = 'queued'
AND q.schedule_after <= now()
ORDER BY
    CASE q.priority
        WHEN 'P0' THEN 1
        WHEN 'P1' THEN 2
        WHEN 'P2' THEN 3
        WHEN 'P3' THEN 4
    END,
    q.deadline ASC NULLS LAST,
    q.created_at ASC;

COMMENT ON VIEW queue_pending IS 'Cola de trabajos pendientes ordenada por prioridad y deadline';

-- ============================================================================

-- Vista: Trabajos en progreso
CREATE OR REPLACE VIEW queue_processing AS
SELECT
    q.id,
    q.job_type,
    q.title,
    q.api_provider,
    q.started_at,
    q.estimated_duration_seconds,
    EXTRACT(EPOCH FROM (now() - q.started_at)) as seconds_running,
    CASE
        WHEN EXTRACT(EPOCH FROM (now() - q.started_at)) > q.estimated_duration_seconds * 1.5
        THEN true
        ELSE false
    END as is_stuck
FROM automation_queue q
WHERE q.status = 'processing'
ORDER BY q.started_at ASC;

COMMENT ON VIEW queue_processing IS 'Trabajos actualmente en ejecución con detección de stuck';

-- ============================================================================

-- Vista: Performance histórico por tipo
CREATE OR REPLACE VIEW queue_performance_by_type AS
SELECT
    q.job_type,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE q.status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE q.status = 'failed') as failed_jobs,
    ROUND(AVG(q.duration_seconds)) as avg_duration_seconds,
    ROUND(AVG(q.actual_cost), 2) as avg_cost_usd,
    SUM(q.actual_cost) as total_cost_usd
FROM automation_queue q
WHERE q.completed_at >= now() - interval '30 days'
GROUP BY q.job_type
ORDER BY total_jobs DESC;

COMMENT ON VIEW queue_performance_by_type IS 'Performance de últimos 30 días por tipo de trabajo';

-- ============================================================================

-- Vista: Calendario próximas 24h
CREATE OR REPLACE VIEW queue_calendar_24h AS
SELECT
    q.id,
    q.job_type,
    q.title,
    q.priority,
    q.schedule_after,
    q.deadline,
    q.estimated_duration_seconds,
    q.status
FROM automation_queue q
WHERE q.schedule_after BETWEEN now() AND now() + interval '24 hours'
OR q.deadline BETWEEN now() AND now() + interval '24 hours'
ORDER BY q.schedule_after ASC, q.priority ASC;

COMMENT ON VIEW queue_calendar_24h IS 'Calendario de trabajos programados para próximas 24 horas';

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función: Encolar trabajo
CREATE OR REPLACE FUNCTION enqueue_job(
    job_priority text,
    job_type_param text,
    job_title text,
    job_config_param jsonb,
    schedule_after_param timestamptz DEFAULT now(),
    deadline_param timestamptz DEFAULT NULL,
    estimated_duration integer DEFAULT NULL,
    api_provider_param text DEFAULT NULL,
    source_type_param text DEFAULT NULL,
    source_id_param uuid DEFAULT NULL,
    recommendation_id_param uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_job_id uuid;
BEGIN
    INSERT INTO automation_queue (
        priority,
        job_type,
        title,
        job_config,
        schedule_after,
        deadline,
        estimated_duration_seconds,
        api_provider,
        source_type,
        source_id,
        recommendation_id
    ) VALUES (
        job_priority,
        job_type_param,
        job_title,
        job_config_param,
        schedule_after_param,
        deadline_param,
        estimated_duration,
        api_provider_param,
        source_type_param,
        source_id_param,
        recommendation_id_param
    )
    RETURNING id INTO new_job_id;

    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION enqueue_job IS 'Encolar nuevo trabajo de automatización';

-- ============================================================================

-- Función: Marcar trabajo como en proceso
CREATE OR REPLACE FUNCTION start_job(job_id uuid)
RETURNS boolean AS $$
DECLARE
    success boolean;
BEGIN
    UPDATE automation_queue
    SET
        status = 'processing',
        started_at = now(),
        updated_at = now()
    WHERE
        id = job_id
        AND status = 'queued';

    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION start_job IS 'Marcar trabajo como iniciado';

-- ============================================================================

-- Función: Completar trabajo exitosamente
CREATE OR REPLACE FUNCTION complete_job(
    job_id uuid,
    result_data_param jsonb DEFAULT NULL,
    actual_cost_param decimal DEFAULT NULL,
    output_urls_param jsonb DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    success boolean;
    job_started_at timestamptz;
BEGIN
    -- Obtener started_at
    SELECT started_at INTO job_started_at
    FROM automation_queue
    WHERE id = job_id;

    UPDATE automation_queue
    SET
        status = 'completed',
        completed_at = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - job_started_at))::integer,
        result_data = result_data_param,
        actual_cost = actual_cost_param,
        output_urls = output_urls_param,
        updated_at = now()
    WHERE
        id = job_id
        AND status = 'processing';

    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_job IS 'Marcar trabajo como completado con resultados';

-- ============================================================================

-- Función: Marcar trabajo como fallido (con retry)
CREATE OR REPLACE FUNCTION fail_job(
    job_id uuid,
    error_message_param text,
    error_details_param jsonb DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    success boolean;
    current_retry_count integer;
    max_retry_count integer;
BEGIN
    -- Obtener retry count actual
    SELECT retry_count, max_retries
    INTO current_retry_count, max_retry_count
    FROM automation_queue
    WHERE id = job_id;

    -- Si puede reintentar, volver a queued
    IF current_retry_count < max_retry_count THEN
        UPDATE automation_queue
        SET
            status = 'queued',
            retry_count = retry_count + 1,
            error_message = error_message_param,
            error_details = error_details_param,
            started_at = NULL,
            updated_at = now()
        WHERE id = job_id;
    ELSE
        -- Ya no hay más reintentos, marcar como failed permanentemente
        UPDATE automation_queue
        SET
            status = 'failed',
            error_message = error_message_param,
            error_details = error_details_param,
            completed_at = now(),
            updated_at = now()
        WHERE id = job_id;
    END IF;

    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fail_job IS 'Marcar trabajo como fallido (con retry automático si aplica)';

-- ============================================================================

-- Función: Limpiar trabajos completados antiguos
CREATE OR REPLACE FUNCTION archive_old_jobs(
    days_old integer DEFAULT 30
)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM automation_queue
    WHERE
        status IN ('completed', 'failed', 'cancelled')
        AND completed_at < now() - (days_old || ' days')::interval;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_jobs IS 'Eliminar trabajos completados/fallidos hace más de N días';

-- ============================================================================

-- Función: Calcular capacidad disponible
CREATE OR REPLACE FUNCTION get_available_capacity(provider_name text)
RETURNS jsonb AS $$
DECLARE
    processing_count integer;
    queued_count integer;
    max_concurrent integer;
BEGIN
    -- Contar trabajos en proceso para este provider
    SELECT COUNT(*)
    INTO processing_count
    FROM automation_queue
    WHERE api_provider = provider_name
    AND status = 'processing';

    -- Contar trabajos en cola
    SELECT COUNT(*)
    INTO queued_count
    FROM automation_queue
    WHERE api_provider = provider_name
    AND status = 'queued';

    -- Determinar límite de concurrencia (hardcoded por ahora)
    max_concurrent := CASE provider_name
        WHEN 'veo3' THEN 2        -- Max 2 videos VEO3 simultáneos
        WHEN 'openai' THEN 5       -- Max 5 llamadas OpenAI simultáneas
        WHEN 'instagram' THEN 3    -- Max 3 posts Instagram simultáneos
        ELSE 1
    END;

    RETURN jsonb_build_object(
        'provider', provider_name,
        'processing', processing_count,
        'queued', queued_count,
        'max_concurrent', max_concurrent,
        'available_slots', max_concurrent - processing_count,
        'is_available', (max_concurrent - processing_count) > 0
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_capacity IS 'Obtener capacidad disponible de un proveedor de API';

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
