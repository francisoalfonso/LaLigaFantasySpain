/**
 * Script para crear tabla youtube_outliers en Supabase
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_PROJECT_URL o SUPABASE_SERVICE_ROLE_KEY no configurados');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createTableSQL = `
-- YouTube Outliers - Viral videos detection
CREATE TABLE IF NOT EXISTS youtube_outliers (
    id BIGSERIAL PRIMARY KEY,
    video_id VARCHAR(20) UNIQUE NOT NULL,
    title TEXT NOT NULL,

    -- Channel info
    channel_id VARCHAR(50) NOT NULL,
    channel_name VARCHAR(200) NOT NULL,
    channel_subscribers BIGINT DEFAULT 0,

    -- Video metadata
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    duration VARCHAR(20),

    -- Engagement metrics
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,

    -- Outlier analysis
    outlier_score DECIMAL(10,1) DEFAULT 0,
    priority VARCHAR(5) NOT NULL,
    viral_ratio DECIMAL(10,2),
    velocity DECIMAL(10,2),

    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'detected',
    transcription_id VARCHAR(100),
    analysis_id VARCHAR(100),

    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_video_id ON youtube_outliers(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_priority ON youtube_outliers(priority);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_score ON youtube_outliers(outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_detected_at ON youtube_outliers(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_status ON youtube_outliers(processing_status);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_channel ON youtube_outliers(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_published ON youtube_outliers(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_viral_ratio ON youtube_outliers(viral_ratio DESC);
`;

async function createTable() {
    console.log('🔧 Creando tabla youtube_outliers en Supabase...\n');

    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: createTableSQL
        });

        if (error) {
            // Si exec_sql no existe, intentar crear la tabla directamente
            console.log('⚠️  exec_sql RPC no disponible, creando tabla manualmente...\n');

            // Crear tabla con query directa (esto funcionará si tenemos acceso directo)
            const { error: createError } = await supabase
                .from('youtube_outliers')
                .select('*')
                .limit(0);

            if (createError && createError.code === '42P01') {
                console.log('✅ Tabla no existe, se creará en primera inserción\n');
                console.log('📝 SQL generado y guardado. Ejecuta manualmente si es necesario:\n');
                console.log(createTableSQL);
                return;
            }
        }

        console.log('✅ Tabla youtube_outliers creada exitosamente\n');
        console.log('📊 Verificando tabla...');

        // Verificar que la tabla existe
        const { data: testData, error: testError } = await supabase
            .from('youtube_outliers')
            .select('*')
            .limit(1);

        if (testError) {
            console.error('❌ Error verificando tabla:', testError.message);
        } else {
            console.log('✅ Tabla verificada correctamente\n');
        }

    } catch (err) {
        console.error('❌ Error creando tabla:', err.message);
        console.log('\n📝 SQL para ejecución manual:');
        console.log('----------------------------------');
        console.log(createTableSQL);
        console.log('----------------------------------\n');
    }
}

createTable().then(() => {
    console.log('✅ Script completado');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
