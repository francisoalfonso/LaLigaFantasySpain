// Migration simple: Añadir columnas directamente usando SQL raw
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
    console.log('🚀 Ejecutando migration de onboarding columns...\n');

    // Approach: Intentar insertar datos con las nuevas columnas
    // Si la columna no existe, Supabase dará error
    try {
        // Test 1: Verificar si ya existen las columnas
        console.log('🔍 Verificando estructura actual...');

        const { data: channels } = await supabase.from('competitive_channels').select('*').limit(1);

        if (channels && channels[0]) {
            const existingColumns = Object.keys(channels[0]);
            console.log('  Columnas actuales:', existingColumns.join(', '));

            const newColumns = [
                'insights',
                'viral_patterns',
                'onboarding_completed_at',
                'onboarding_metadata'
            ];
            const missingColumns = newColumns.filter(col => !existingColumns.includes(col));

            if (missingColumns.length === 0) {
                console.log('\n✅ Todas las columnas ya existen!');
                return;
            }

            console.log(`\n⚠️  Faltan columnas: ${missingColumns.join(', ')}`);
            console.log('\n📋 Para añadirlas, ejecuta este SQL en Supabase Dashboard:\n');
            console.log('-------------------------------------------------------------');
            console.log(`
-- Añadir columnas a competitive_channels
ALTER TABLE competitive_channels
ADD COLUMN IF NOT EXISTS insights jsonb,
ADD COLUMN IF NOT EXISTS viral_patterns jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS onboarding_metadata jsonb;

-- Añadir columnas a competitive_videos
ALTER TABLE competitive_videos
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate float DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_competitive_channels_insights
    ON competitive_channels USING gin(insights);

CREATE INDEX IF NOT EXISTS idx_competitive_channels_viral_patterns
    ON competitive_channels USING gin(viral_patterns);

CREATE INDEX IF NOT EXISTS idx_competitive_videos_views
    ON competitive_videos(views DESC);

CREATE INDEX IF NOT EXISTS idx_competitive_videos_engagement
    ON competitive_videos(engagement_rate DESC);
      `);
            console.log('-------------------------------------------------------------\n');

            console.log('📍 Pasos:');
            console.log(
                '  1. Abre https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/editor'
            );
            console.log('  2. Ve a SQL Editor');
            console.log('  3. Copia y pega el SQL de arriba');
            console.log('  4. Click en "Run"');
            console.log('\nO ejecuta: npx supabase db push (si tienes CLI configurado)\n');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runMigration();
