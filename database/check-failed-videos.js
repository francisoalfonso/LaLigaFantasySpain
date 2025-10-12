// Script para ver errores de videos fallidos
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFailed() {
    const { data: failedVideos, error } = await supabase
        .from('competitive_videos')
        .select('id, video_id, title, analysis, processing_status')
        .eq('processing_status', 'failed')
        .order('id', { ascending: true });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!failedVideos || failedVideos.length === 0) {
        console.log('✅ No hay videos fallidos');
        return;
    }

    console.log(`❌ VIDEOS FALLIDOS: ${failedVideos.length}`);
    console.log('');

    failedVideos.forEach((video, idx) => {
        console.log(`${idx + 1}. ${video.title.substring(0, 60)}...`);
        console.log(`   Video ID: ${video.video_id}`);
        if (video.analysis && video.analysis.error) {
            console.log(`   Error: ${video.analysis.error}`);
        } else {
            console.log(`   Error: (no especificado)`);
        }
        console.log('');
    });
}

checkFailed()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
