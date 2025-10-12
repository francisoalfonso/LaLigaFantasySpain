// Script para resetear videos fallidos a onboarding_analyzed
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reset() {
    // Encontrar videos fallidos
    const { data: failedVideos, error: findError } = await supabase
        .from('competitive_videos')
        .select('id, video_id, title')
        .eq('processing_status', 'failed');

    if (findError) {
        console.error('❌ Error:', findError.message);
        return;
    }

    if (!failedVideos || failedVideos.length === 0) {
        console.log('✅ No hay videos fallidos para resetear');
        return;
    }

    console.log(`📊 Encontrados ${failedVideos.length} videos fallidos`);

    // Resetear a 'onboarding_analyzed'
    const { error: updateError } = await supabase
        .from('competitive_videos')
        .update({
            processing_status: 'onboarding_analyzed',
            analysis: null
        })
        .eq('processing_status', 'failed');

    if (updateError) {
        console.error('❌ Error reseteando:', updateError.message);
        return;
    }

    console.log(`✅ ${failedVideos.length} videos reseteados a "onboarding_analyzed"`);
}

reset()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
