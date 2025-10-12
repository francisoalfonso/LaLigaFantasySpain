/**
 * Verifica que las tablas competitive_channels y competitive_videos
 * existen y están correctamente configuradas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.supabase') });

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verify() {
    log('🔍 Verificando Competitive Channels Schema', 'bright');
    log('='.repeat(60), 'blue');

    if (!process.env.SUPABASE_PROJECT_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log('❌ Variables de entorno no encontradas', 'red');
        process.exit(1);
    }

    const supabase = createClient(
        process.env.SUPABASE_PROJECT_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let allChecksPass = true;

    // Test 1: competitive_channels
    try {
        log('\n📋 Test 1: Tabla competitive_channels', 'blue');
        const { count, error } = await supabase
            .from('competitive_channels')
            .select('*', { count: 'exact', head: true });

        if (error) {
            log(`  ❌ Error: ${error.message}`, 'red');
            allChecksPass = false;
        } else {
            log(`  ✅ Tabla existe (${count || 0} registros)`, 'green');
        }
    } catch (error) {
        log(`  ❌ Exception: ${error.message}`, 'red');
        allChecksPass = false;
    }

    // Test 2: competitive_videos
    try {
        log('\n📹 Test 2: Tabla competitive_videos', 'blue');
        const { count, error } = await supabase
            .from('competitive_videos')
            .select('*', { count: 'exact', head: true });

        if (error) {
            log(`  ❌ Error: ${error.message}`, 'red');
            allChecksPass = false;
        } else {
            log(`  ✅ Tabla existe (${count || 0} registros)`, 'green');
        }
    } catch (error) {
        log(`  ❌ Exception: ${error.message}`, 'red');
        allChecksPass = false;
    }

    // Test 3: CRUD operations
    try {
        log('\n🧪 Test 3: Operaciones CRUD', 'blue');

        // Crear canal de prueba
        const { data: insertData, error: insertError } = await supabase
            .from('competitive_channels')
            .insert([
                {
                    channel_url: 'https://www.youtube.com/@TestChannel/shorts',
                    channel_id: 'UC_TEST_VERIFICATION',
                    channel_name: 'Test Channel - Verification',
                    priority: 3,
                    content_type: 'test',
                    monitoring_frequency: '1h'
                }
            ])
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                // Duplicate key - el canal ya existe, esto está bien
                log('  ⚠️  Canal de prueba ya existe (UNIQUE constraint)', 'yellow');

                // Intentar leerlo
                const { data: existingData, error: selectError } = await supabase
                    .from('competitive_channels')
                    .select('*')
                    .eq('channel_id', 'UC_TEST_VERIFICATION')
                    .single();

                if (selectError) {
                    log(`  ❌ Error leyendo canal existente: ${selectError.message}`, 'red');
                    allChecksPass = false;
                } else {
                    log('  ✅ INSERT + SELECT funcionando (canal ya existía)', 'green');

                    // Limpiar canal de prueba
                    await supabase.from('competitive_channels').delete().eq('id', existingData.id);
                }
            } else {
                log(`  ❌ Error INSERT: ${insertError.message}`, 'red');
                allChecksPass = false;
            }
        } else {
            log('  ✅ INSERT exitoso', 'green');

            // Limpiar canal de prueba
            const { error: deleteError } = await supabase
                .from('competitive_channels')
                .delete()
                .eq('id', insertData.id);

            if (deleteError) {
                log(`  ⚠️  Error limpiando canal de prueba: ${deleteError.message}`, 'yellow');
            } else {
                log('  ✅ DELETE exitoso', 'green');
            }
        }
    } catch (error) {
        log(`  ❌ Exception: ${error.message}`, 'red');
        allChecksPass = false;
    }

    // Resultado final
    log(`\n${'='.repeat(60)}`, 'blue');

    if (allChecksPass) {
        log('✅ Todas las verificaciones pasaron!', 'green');
        log('\n🚀 Siguiente paso: Testing E2E', 'bright');
        log('   1. Añadir un canal real: POST /api/competitive/channels', 'blue');
        log('   2. Analizar un video: POST /api/content-analysis/analyze-youtube', 'blue');
        log('   3. Ver interfaz: http://localhost:3000/competitive-channels', 'blue');
        process.exit(0);
    } else {
        log('❌ Algunas verificaciones fallaron', 'red');
        log('\n💡 Solución:', 'yellow');
        log('   Aplica el schema manualmente en Supabase Dashboard:', 'yellow');
        log('   https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/sql/new', 'blue');
        process.exit(1);
    }
}

verify().catch(error => {
    log('💥 Error no controlado:', 'red');
    console.error(error);
    process.exit(1);
});
