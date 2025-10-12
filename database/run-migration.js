// Script temporal para ejecutar migration de onboarding columns
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
    try {
        console.log('📖 Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'competitive-channels-onboarding-columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Dividir en statements individuales
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`🔧 Encontrados ${statements.length} statements SQL\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];

            // Extraer tipo de operación
            let operation = 'SQL statement';
            if (stmt.toUpperCase().includes('ALTER TABLE')) {
                const match = stmt.match(/ALTER TABLE\s+(\w+)/i);
                operation = `ALTER TABLE ${match ? match[1] : 'unknown'}`;
            } else if (stmt.toUpperCase().includes('CREATE INDEX')) {
                const match = stmt.match(/CREATE INDEX.*\s+(\w+)/i);
                operation = `CREATE INDEX ${match ? match[1] : 'unknown'}`;
            } else if (stmt.toUpperCase().includes('COMMENT ON')) {
                operation = 'COMMENT';
            }

            console.log(`  [${i + 1}/${statements.length}] ${operation}...`);

            const { error } = await supabase.rpc('exec_sql', {
                sql: `${stmt};`
            });

            if (error) {
                if (
                    error.message.includes('already exists') ||
                    error.message.includes('duplicate')
                ) {
                    console.log(`    ⚠️  Ya existe (OK)`);
                    successCount++;
                } else {
                    console.log(`    ❌ Error: ${error.message}`);
                    errorCount++;
                }
            } else {
                console.log(`    ✅ Ejecutado`);
                successCount++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`  ✅ Exitosos: ${successCount}`);
        console.log(`  ❌ Errores: ${errorCount}`);

        // Verificar columnas añadidas
        console.log(`\n🔍 Verificando columnas en competitive_channels...`);
        const { data, error: selectError } = await supabase
            .from('competitive_channels')
            .select('id, insights, viral_patterns, onboarding_completed_at')
            .limit(1);

        if (selectError) {
            console.log(`  ❌ Error verificando: ${selectError.message}`);
        } else {
            console.log(`  ✅ Columnas disponibles:`, Object.keys(data[0] || {}));
        }

        console.log('\n✅ Migration completada!');
    } catch (err) {
        console.error('💥 Error:', err.message);
        process.exit(1);
    }
}

runMigration();
