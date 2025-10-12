/**
 * Script para aplicar fix SQL a la función start_job
 * Corrige error: "operator does not exist: boolean > integer"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const axios = require('axios');

// Cargar variables de entorno
require('dotenv').config();
if (fs.existsSync('.env.supabase')) {
    require('dotenv').config({ path: '.env.supabase' });
}

const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Variables de entorno faltantes:');
    console.error('   SUPABASE_PROJECT_URL:', SUPABASE_URL ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SQL_FIX = `
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
`;

async function applyFix() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  🔧 Aplicando Fix SQL - start_job Function                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Conexión Supabase:');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Key: ${SUPABASE_KEY.substring(0, 20)}...`);
    console.log('');

    try {
        console.log('🔍 Intentando ejecutar SQL...');

        // Intentar con rpc primero
        const { data, error } = await supabase.rpc('exec_sql', { sql: SQL_FIX });

        if (error) {
            console.log('⚠️  Método rpc no disponible, usando REST API...\n');

            // Alternativa: usar axios directo a la REST API
            const response = await axios.post(
                `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
                { sql: SQL_FIX },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        apikey: SUPABASE_KEY,
                        Authorization: `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            const result = response.data;
            console.log('✅ SQL ejecutado via REST API');
            console.log('   Resultado:', JSON.stringify(result, null, 2));
        } else {
            console.log('✅ SQL ejecutado via RPC');
            console.log('   Data:', JSON.stringify(data, null, 2));
        }

        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║  ✅ FIX APLICADO CORRECTAMENTE                                ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        console.log('🎯 Próximos pasos:');
        console.log('   1. El VideoOrchestrator debería dejar de mostrar errores');
        console.log('   2. Los jobs en automation_queue se procesarán correctamente');
        console.log('   3. Puedes verificar con: npm run dev (ya no verás el error)\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error ejecutando SQL:', err.message);
        console.log('\n🔧 SOLUCIÓN MANUAL:');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('Ve a Supabase Dashboard → SQL Editor y ejecuta:\n');
        console.log('──────────────────────────────────────────────────────────────');
        console.log(SQL_FIX);
        console.log('──────────────────────────────────────────────────────────────\n');
        console.log('URL Dashboard:');
        console.log(
            `https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].split('//')[1]}\n`
        );

        process.exit(1);
    }
}

applyFix();
