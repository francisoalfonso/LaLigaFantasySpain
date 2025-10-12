// Script temporal para ejecutar migration usando node-postgres
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

// Crear pool de conexiones
const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('✅ Conectado a Supabase PostgreSQL\n');
        console.log('📖 Leyendo script SQL...');

        const sqlPath = path.join(__dirname, 'competitive-channels-onboarding-columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Dividir en statements individuales
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => {
                if (!stmt) {
                    return false;
                }
                if (stmt.startsWith('--')) {
                    return false;
                }
                if (stmt.startsWith('/*')) {
                    return false;
                }
                if (stmt === '') {
                    return false;
                }
                return true;
            });

        console.log(`🔧 Encontrados ${statements.length} statements SQL\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];

            // Extraer tipo de operación
            let operation = 'SQL';
            if (stmt.toUpperCase().includes('ALTER TABLE')) {
                const match = stmt.match(/ALTER TABLE\s+(\w+)/i);
                operation = `ALTER TABLE ${match ? match[1] : 'unknown'}`;
            } else if (stmt.toUpperCase().includes('CREATE INDEX')) {
                const match = stmt.match(/CREATE INDEX.*\s+(\w+)/i);
                operation = `CREATE INDEX ${match ? match[1] : 'unknown'}`;
            } else if (stmt.toUpperCase().includes('COMMENT ON')) {
                const match = stmt.match(/COMMENT ON\s+\w+\s+(\S+)/i);
                operation = `COMMENT ON ${match ? match[1] : ''}`;
            }

            console.log(`  [${i + 1}/${statements.length}] ${operation}...`);

            try {
                await client.query(`${stmt};`);
                console.log(`    ✅ Ejecutado`);
                successCount++;
            } catch (error) {
                if (
                    error.message.includes('already exists') ||
                    error.message.includes('duplicate') ||
                    error.message.includes('does not exist')
                ) {
                    console.log(`    ⚠️  ${error.message.split('\n')[0]}`);
                    successCount++;
                } else {
                    console.log(`    ❌ Error: ${error.message.split('\n')[0]}`);
                    errorCount++;
                }
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`  ✅ Exitosos: ${successCount}`);
        console.log(`  ❌ Errores: ${errorCount}`);

        // Verificar columnas añadidas
        console.log(`\n🔍 Verificando columnas en competitive_channels...`);
        const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'competitive_channels'
      AND column_name IN ('insights', 'viral_patterns', 'onboarding_completed_at', 'onboarding_metadata')
      ORDER BY column_name;
    `);

        if (result.rows.length > 0) {
            console.log(`  ✅ Columnas añadidas:`);
            result.rows.forEach(row => {
                console.log(`    - ${row.column_name} (${row.data_type})`);
            });
        } else {
            console.log(`  ❌ No se encontraron las columnas nuevas`);
        }

        // Verificar columnas en competitive_videos
        console.log(`\n🔍 Verificando columnas en competitive_videos...`);
        const videosResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'competitive_videos'
      AND column_name IN ('views', 'likes', 'comments', 'engagement_rate', 'duration_seconds')
      ORDER BY column_name;
    `);

        if (videosResult.rows.length > 0) {
            console.log(`  ✅ Columnas añadidas:`);
            videosResult.rows.forEach(row => {
                console.log(`    - ${row.column_name} (${row.data_type})`);
            });
        } else {
            console.log(`  ❌ No se encontraron las columnas nuevas`);
        }

        console.log('\n🎉 Migration completada!');
    } catch (err) {
        console.error('💥 Error:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
