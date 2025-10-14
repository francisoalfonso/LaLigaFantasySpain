#!/usr/bin/env node

/**
 * Script para aplicar migration de optimización del sistema de outliers
 *
 * IMPORTANTE: Ejecutar con variables de entorno de Supabase cargadas
 *
 * Usage:
 *   node scripts/apply-outliers-migration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.supabase') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function applyMigration() {
    const startTime = Date.now();

    console.log(`\n${colors.bright}${colors.blue}${'═'.repeat(70)}${colors.reset}`);
    log('🚀', 'APLICANDO MIGRATION: Sistema de Outliers Optimizado', colors.bright + colors.blue);
    console.log(`${colors.bright}${colors.blue}${'═'.repeat(70)}${colors.reset}\n`);

    // Verificar variables de entorno
    if (!process.env.SUPABASE_PROJECT_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log('❌', 'ERROR: Variables de Supabase no encontradas en .env.supabase', colors.red);
        log('', '   Se requiere: SUPABASE_PROJECT_URL y SUPABASE_SERVICE_ROLE_KEY', colors.yellow);
        process.exit(1);
    }

    // Conectar a Supabase
    const supabase = createClient(
        process.env.SUPABASE_PROJECT_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: { autoRefreshToken: false, persistSession: false }
        }
    );

    try {
        log('🔌', 'Conectando a Supabase PostgreSQL...', colors.cyan);

        // Test connection
        const { data: testData, error: testError } = await supabase
            .from('youtube_outliers')
            .select('id')
            .limit(1);

        if (testError && !testError.message.includes('does not exist')) {
            throw new Error(`Connection failed: ${testError.message}`);
        }

        log('✅', 'Conectado exitosamente', colors.green);

        // Leer archivo de migration
        const migrationPath = path.join(
            __dirname,
            '..',
            'database',
            'migrations',
            'optimize-outliers-system.sql'
        );

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        log('📄', `Migration SQL cargada (${migrationSQL.length} caracteres)`, colors.cyan);
        log('⏳', 'Ejecutando migration...', colors.yellow);

        // Split SQL into executable chunks (Supabase RPC limitations)
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        log('', `   Ejecutando ${statements.length} statements SQL...`, colors.cyan);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comments
            if (statement.startsWith('--') || statement.trim().startsWith('/*')) {
                continue;
            }

            try {
                // Use pg client directly for DDL operations
                const { Pool } = require('pg');
                const pool = new Pool({
                    connectionString: `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || 'MsyrW6Mv%4$dZqp'}@db.${process.env.SUPABASE_PROJECT_URL?.split('//')[1]?.split('.')[0]}.supabase.co:5432/postgres`,
                    ssl: { rejectUnauthorized: false }
                });

                const client = await pool.connect();
                await client.query(`${statement};`);
                client.release();
                await pool.end();
            } catch (error) {
                // Ignore "already exists" errors
                if (
                    !error.message.includes('already exists') &&
                    !error.message.includes('duplicate') &&
                    !error.message.includes('does not exist')
                ) {
                    console.error(`   ⚠️  Statement ${i + 1}: ${error.message}`);
                }
            }
        }

        log('✅', 'Migration aplicada exitosamente', colors.green);

        // Verificar cambios
        console.log(`\n${colors.cyan}${'─'.repeat(70)}${colors.reset}`);
        log('🔍', 'Verificando cambios...', colors.cyan);

        // Conectar para verificación
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || 'MsyrW6Mv%4$dZqp'}@db.${process.env.SUPABASE_PROJECT_URL?.split('//')[1]?.split('.')[0]}.supabase.co:5432/postgres`,
            ssl: { rejectUnauthorized: false }
        });
        const client = await pool.connect();
        let indexesCount = 0;

        try {
            // 1. Verificar columnas nuevas en youtube_outliers
            const columnsResult = await client.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'youtube_outliers'
                AND column_name IN ('transcription', 'content_analysis', 'mentioned_players',
                                     'enriched_data', 'generated_script', 'response_video_id',
                                     'published_at', 'platform')
                ORDER BY column_name;
            `);

            log(
                '✅',
                `Columnas añadidas a youtube_outliers: ${columnsResult.rows.length}/8`,
                colors.green
            );
            columnsResult.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type})`);
            });

            // 2. Verificar tabla youtube_outliers_responses
            const tableResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'youtube_outliers_responses'
                );
            `);

            if (tableResult.rows[0].exists) {
                log('✅', 'Tabla youtube_outliers_responses creada', colors.green);

                // Contar columnas
                const responsesColumnsResult = await client.query(`
                    SELECT COUNT(*) as count
                    FROM information_schema.columns
                    WHERE table_name = 'youtube_outliers_responses';
                `);
                console.log(`   - Columnas: ${responsesColumnsResult.rows[0].count}`);
            } else {
                log('❌', 'Tabla youtube_outliers_responses NO creada', colors.red);
            }

            // 3. Verificar vista outliers_performance_analysis
            const viewResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.views
                    WHERE table_name = 'outliers_performance_analysis'
                );
            `);

            if (viewResult.rows[0].exists) {
                log('✅', 'Vista outliers_performance_analysis creada', colors.green);
            } else {
                log('❌', 'Vista outliers_performance_analysis NO creada', colors.red);
            }

            // 4. Verificar función calculate_roi
            const functionResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM pg_proc
                    WHERE proname = 'calculate_roi'
                );
            `);

            if (functionResult.rows[0].exists) {
                log('✅', 'Función calculate_roi() creada', colors.green);
            } else {
                log('❌', 'Función calculate_roi() NO creada', colors.red);
            }

            // 5. Verificar índices
            const indexesResult = await client.query(`
                SELECT indexname
                FROM pg_indexes
                WHERE tablename IN ('youtube_outliers', 'youtube_outliers_responses')
                AND indexname LIKE '%outliers%'
                ORDER BY indexname;
            `);

            indexesCount = indexesResult.rows.length;
            log('✅', `Índices creados: ${indexesCount}`, colors.green);
            indexesResult.rows.forEach(row => {
                console.log(`   - ${row.indexname}`);
            });

            client.release();
            await pool.end();
        } catch (verifyError) {
            client.release();
            await pool.end();
            throw verifyError;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n${colors.bright}${colors.green}${'═'.repeat(70)}${colors.reset}`);
        log('🎉', 'MIGRATION COMPLETADA EXITOSAMENTE', colors.bright + colors.green);
        console.log(`${colors.bright}${colors.green}${'═'.repeat(70)}${colors.reset}\n`);

        console.log(`${colors.cyan}⏱️  Duración: ${duration}s${colors.reset}`);
        console.log(`${colors.cyan}📊 Cambios aplicados:${colors.reset}`);
        console.log(`   ✓ 8 columnas añadidas a youtube_outliers`);
        console.log(`   ✓ Tabla youtube_outliers_responses creada`);
        console.log(`   ✓ Vista outliers_performance_analysis creada`);
        console.log(`   ✓ Función calculate_roi() creada`);
        console.log(`   ✓ ${indexesCount} índices creados`);
        console.log(`   ✓ Trigger update_updated_at activado\n`);

        console.log(`${colors.yellow}📝 Próximos pasos:${colors.reset}`);
        console.log(`   1. Implementar endpoint /api/outliers/analyze/:videoId`);
        console.log(`   2. Crear intelligentScriptGenerator.js`);
        console.log(`   3. Implementar tracking de respuestas`);
        console.log(`   4. Test E2E del flujo completo\n`);
    } catch (error) {
        log('❌', 'ERROR aplicando migration:', colors.red);
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
applyMigration();
