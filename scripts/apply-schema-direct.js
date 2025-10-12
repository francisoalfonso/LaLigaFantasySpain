const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

async function apply() {
    // URL encode password
    const encodedPassword = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
    const connectionString = `postgresql://${process.env.SUPABASE_DB_USER}:${encodedPassword}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Conectando a Supabase...');
        await client.connect();
        console.log('✅ Conectado');

        const schemaSQL = fs.readFileSync(
            path.join(__dirname, '..', 'database', 'competitive-channels-schema.sql'),
            'utf8'
        );

        console.log('⚙️  Ejecutando schema completo...');
        await client.query(schemaSQL);
        console.log('✅ Schema aplicado correctamente');

        // Verificar
        const result = await client.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_name IN ('competitive_channels', 'competitive_videos')
            ORDER BY table_name
        `);

        console.log('\n📊 Tablas creadas:');
        result.rows.forEach(row => console.log('  ✅', row.table_name));

        // Contar registros
        const {
            rows: [channels]
        } = await client.query('SELECT COUNT(*) FROM competitive_channels');
        const {
            rows: [videos]
        } = await client.query('SELECT COUNT(*) FROM competitive_videos');

        console.log('\n📈 Registros:');
        console.log('  competitive_channels:', channels.count);
        console.log('  competitive_videos:', videos.count);

        await client.end();
        console.log('\n🎉 Schema aplicado exitosamente!');
        console.log('🔗 Accede a: http://localhost:3000/competitive-channels');
    } catch (error) {
        console.error('❌ Error:', error.message);
        try {
            await client.end();
        } catch (e) {}
        process.exit(1);
    }
}

apply();
