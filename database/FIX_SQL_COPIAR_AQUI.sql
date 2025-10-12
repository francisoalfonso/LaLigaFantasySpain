-- ============================================================================
-- 🔧 FIX SQL - Aplicar en Supabase Dashboard → SQL Editor
-- ============================================================================
--
-- ERROR ACTUAL: "operator does not exist: boolean > integer"
-- CAUSA: Variable 'success' declarada como boolean pero comparada con integer
-- SOLUCIÓN: Cambiar a integer y usar ROW_COUNT correctamente
--
-- INSTRUCCIONES:
-- 1. Abre: https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx
-- 2. Ve a: SQL Editor (menú lateral izquierdo)
-- 3. Copia y pega TODO el contenido de este archivo
-- 4. Click en "Run" (o Ctrl+Enter)
-- 5. Deberías ver: "Success. No rows returned"
--
-- ============================================================================

CREATE OR REPLACE FUNCTION start_job(job_id uuid)
RETURNS boolean AS $$
DECLARE
    rows_affected integer;  -- 🔧 CAMBIADO: De boolean a integer
BEGIN
    UPDATE automation_queue
    SET
        status = 'processing',
        started_at = now(),
        updated_at = now()
    WHERE
        id = job_id
        AND status = 'queued';

    GET DIAGNOSTICS rows_affected = ROW_COUNT;  -- 🔧 Ahora asigna integer a integer
    RETURN rows_affected > 0;  -- 🔧 Comparación válida: integer > integer
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION start_job IS 'Marcar trabajo como iniciado';

-- ============================================================================
-- ✅ DESPUÉS DE EJECUTAR:
-- ============================================================================
--
-- 1. El error desaparecerá de los logs del servidor
-- 2. VideoOrchestrator procesará jobs correctamente
-- 3. Puedes verificar reiniciando el servidor: npm run dev
--
-- El error actual se repite cada 10s:
-- "❌ [VideoOrchestrator] Error iniciando job"
-- "operator does not exist: boolean > integer"
--
-- Después del fix, estos errores NO aparecerán más.
-- ============================================================================
