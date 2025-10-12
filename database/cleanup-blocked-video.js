// Script para limpiar video bloqueado en estado 'processing'
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
    // Encontrar videos bloqueados en 'processing'
    const { data: blockedVideos, error: findError } = await supabase
        .from('competitive_videos')
        .select('id, video_id, title, processing_status')
        .eq('processing_status', 'processing');

    if (findError) {
        console.error('❌ Error buscando videos bloqueados:', findError.message);
        return;
    }

    if (!blockedVideos || blockedVideos.length === 0) {
        console.log('✅ No hay videos bloqueados en estado "processing"');
        return;
    }

    console.log(`📊 Encontrados ${blockedVideos.length} videos bloqueados:`);
    blockedVideos.forEach(v => {
        console.log(`   - ${v.video_id}: ${v.title.substring(0, 50)}...`);
    });

    // Resetear a 'onboarding_analyzed'
    const { error: updateError } = await supabase
        .from('competitive_videos')
        .update({
            processing_status: 'onboarding_analyzed'
        })
        .eq('processing_status', 'processing');

    if (updateError) {
        console.error('❌ Error reseteando videos:', updateError.message);
        return;
    }

    console.log('');
    console.log(`✅ ${blockedVideos.length} videos reseteados a "onboarding_analyzed"`);
}

cleanup()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
