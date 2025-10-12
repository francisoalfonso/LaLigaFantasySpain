// Script para verificar videos procesados
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
    // Contar por estado
    const { data: stats, error: statsError } = await supabase
        .from('competitive_videos')
        .select('processing_status');

    if (statsError) {
        console.error('❌ Error:', statsError.message);
        return;
    }

    // Agrupar por estado
    const statusCounts = stats.reduce((acc, video) => {
        acc[video.processing_status] = (acc[video.processing_status] || 0) + 1;
        return acc;
    }, {});

    console.log('📊 ESTADO DE VIDEOS:');
    console.log('');
    Object.entries(statusCounts).forEach(([status, count]) => {
        const emoji =
            status === 'completed'
                ? '✅'
                : status === 'analyzing'
                  ? '⏳'
                  : status === 'failed'
                    ? '❌'
                    : '📝';
        console.log(`${emoji} ${status}: ${count} videos`);
    });
    console.log('');
    console.log('📈 Total videos:', stats.length);

    // Obtener último video completado
    const { data: lastCompleted, error: lastError } = await supabase
        .from('competitive_videos')
        .select('title, processing_status, updated_at')
        .eq('processing_status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (!lastError && lastCompleted) {
        console.log('');
        console.log('🎯 Último video completado:');
        console.log('   Title:', `${lastCompleted.title.substring(0, 60)}...`);
        console.log('   Updated:', new Date(lastCompleted.updated_at).toLocaleString());
    }

    // Verificar si hay transcripciones
    const { data: withTranscription, error: transError } = await supabase
        .from('competitive_videos')
        .select('id, title, transcription, analysis')
        .not('transcription', 'is', null)
        .limit(3);

    if (!transError && withTranscription && withTranscription.length > 0) {
        console.log('');
        console.log('📝 Videos con transcripción:');
        withTranscription.forEach((video, idx) => {
            console.log(`   ${idx + 1}. ${video.title.substring(0, 50)}...`);
            if (video.transcription && video.transcription.duration) {
                console.log(`      Duración: ${video.transcription.duration}s`);
            }
            if (video.analysis && video.analysis.keywords) {
                console.log(`      Keywords: ${video.analysis.keywords.length}`);
            }
        });
    }
}

verify()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
