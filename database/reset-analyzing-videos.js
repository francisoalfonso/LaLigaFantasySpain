// Reset videos en estado analyzing
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reset() {
    const { error } = await supabase
        .from('competitive_videos')
        .update({ processing_status: 'onboarding_analyzed' })
        .eq('processing_status', 'analyzing');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Videos en "analyzing" reseteados');
    }
}

reset().then(() => process.exit(0));
