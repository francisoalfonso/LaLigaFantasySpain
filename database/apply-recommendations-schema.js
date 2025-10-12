/**
 * Aplicar schema de competitive_recommendations a Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applySchema() {
    console.log('🚀 Aplicando schema de competitive_recommendations a Supabase...\n');

    try {
        // Leer el archivo SQL
        const schemaPath = path.join(__dirname, 'competitive-recommendations-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Schema SQL cargado:', schemaPath);
        console.log('📏 Tamaño:', schemaSql.length, 'caracteres\n');

        // Ejecutar el SQL usando rpc
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: schemaSql
        });

        if (error) {
            // Si exec_sql no existe, intentar manualmente split y ejecutar
            if (error.message.includes('function') || error.message.includes('exec_sql')) {
                console.log('⚠️  exec_sql() no disponible, ejecutando manualmente...\n');
                await executeManually(schemaSql);
            } else {
                throw error;
            }
        } else {
            console.log('✅ Schema aplicado exitosamente');
            console.log(data);
        }
    } catch (error) {
        console.error('❌ Error aplicando schema:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function executeManually(sql) {
    // Split SQL en comandos individuales (aproximado)
    const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
        const cmd = `${commands[i]};`;

        // Skip comments blocks
        if (cmd.includes('/*') || cmd.includes('COMMENT ON')) {
            console.log(`⏭️  Saltando comando ${i + 1}/${commands.length} (comentario)`);
            continue;
        }

        console.log(`🔨 Ejecutando comando ${i + 1}/${commands.length}...`);
        console.log(`${cmd.substring(0, 100)}...\n`);

        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: cmd });
            if (error) {
                console.error(`⚠️  Error en comando ${i + 1}:`, error.message);
            } else {
                console.log(`✅ Comando ${i + 1} ejecutado\n`);
            }
        } catch (err) {
            console.error(`❌ Error fatal en comando ${i + 1}:`, err.message);
        }
    }

    console.log('\n✅ Ejecución manual completada');
    console.log('\n⚠️  NOTA: Debes ejecutar manualmente el SQL en Supabase SQL Editor:');
    console.log('   1. Ir a https://supabase.com/dashboard → SQL Editor');
    console.log('   2. Copiar contenido de database/competitive-recommendations-schema.sql');
    console.log('   3. Ejecutar');
}

// Ejecutar
applySchema()
    .then(() => {
        console.log('\n✅ Script completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error fatal:', error.message);
        process.exit(1);
    });
