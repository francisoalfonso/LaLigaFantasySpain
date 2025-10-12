-- ============================================================================
-- FIX: Función start_job - Corregir error de tipo de datos
-- ============================================================================

CREATE OR REPLACE FUNCTION start_job(job_id uuid)
RETURNS boolean AS $$
DECLARE
    rows_affected integer;
BEGIN
    UPDATE automation_queue
    SET
        status = 'processing',
        started_at = now(),
        updated_at = now()
    WHERE
        id = job_id
        AND status = 'queued';

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION start_job IS 'Marcar trabajo como iniciado';
