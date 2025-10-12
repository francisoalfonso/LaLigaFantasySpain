/**
 * Script para aplicar el schema de competitive channels
 * Usa Supabase JS client directamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applySchema() {
    log('🚀 Aplicando Competitive Channels Schema', 'blue');
    log('='.repeat(60), 'blue');

    // Validar variables
    if (!process.env.SUPABASE_PROJECT_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log('❌ Variables de entorno faltantes', 'red');
        process.exit(1);
    }

    // Crear cliente Supabase
    const supabase = createClient(
        process.env.SUPABASE_PROJECT_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Leer schema SQL
        const schemaPath = path.join(
            __dirname,
            '..',
            'database',
            'competitive-channels-schema.sql'
        );
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        log('📄 Schema leído correctamente', 'green');

        // Ejecutar SQL completo usando el cliente
        // Nota: Supabase permite ejecutar SQL raw via REST API
        log('⚙️  Ejecutando schema...', 'yellow');

        // Dividir en statements individuales para mejor debugging
        const statements = schemaSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        log(`📊 ${statements.length} statements encontrados`, 'blue');

        let successCount = 0;
        let errorCount = 0;

        // Ejecutar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comments
            if (statement.startsWith('--') || statement.startsWith('/*')) {
                continue;
            }

            try {
                // Intentar ejecutar via RPC si está disponible
                const { error } = await supabase.rpc('exec_sql', {
                    query: `${statement};`
                });

                if (error) {
                    // Algunos errores son esperados (ya existe, etc)
                    if (error.message.includes('already exists')) {
                        log(`  ⚠️  ${i + 1}. Ya existe`, 'yellow');
                        successCount++;
                    } else {
                        log(`  ❌ ${i + 1}. Error: ${error.message}`, 'red');
                        errorCount++;
                    }
                } else {
                    log(`  ✅ ${i + 1}. OK`, 'green');
                    successCount++;
                }
            } catch (error) {
                log(`  ❌ ${i + 1}. Exception: ${error.message}`, 'red');
                errorCount++;
            }
        }

        log('='.repeat(60), 'blue');
        log('📈 Resumen:', 'blue');
        log(`✅ Exitosos: ${successCount}`, 'green');
        if (errorCount > 0) {
            log(`❌ Errores: ${errorCount}`, 'red');
        }

        // Verificar tablas creadas
        log('\n🔍 Verificando tablas...', 'blue');

        const { count: channelsCount, error: channelsError } = await supabase
            .from('competitive_channels')
            .select('*', { count: 'exact', head: true });

        const { count: videosCount, error: videosError } = await supabase
            .from('competitive_videos')
            .select('*', { count: 'exact', head: true });

        if (!channelsError && !videosError) {
            log(`✅ competitive_channels: OK (${channelsCount || 0} registros)`, 'green');
            log(`✅ competitive_videos: OK (${videosCount || 0} registros)`, 'green');
            log('\n🎉 Schema aplicado correctamente!', 'green');
            log('🔗 Accede a: http://localhost:3000/competitive-channels', 'blue');
        } else {
            log('❌ Error verificando tablas:', 'red');
            if (channelsError) {
                log(`  - competitive_channels: ${channelsError.message}`, 'red');
            }
            if (videosError) {
                log(`  - competitive_videos: ${videosError.message}`, 'red');
            }

            log('\n⚠️  NOTA: Si ves este error, aplica el schema manualmente:', 'yellow');
            log('1. Ir a Supabase Dashboard > SQL Editor', 'yellow');
            log('2. Copiar contenido de database/competitive-channels-schema.sql', 'yellow');
            log('3. Pegar y ejecutar', 'yellow');
        }
    } catch (error) {
        log('💥 Error fatal:', 'red');
        log(error.message, 'red');
        log('\n⚠️  SOLUCIÓN: Aplicar schema manualmente via Supabase Dashboard', 'yellow');
        log('Ver instrucciones en: database/README-COMPETITIVE-CHANNELS.md', 'blue');
        process.exit(1);
    }
}

// Ejecutar
applySchema().catch(error => {
    log('💥 Error no controlado:', 'red');
    console.error(error);
    process.exit(1);
});
