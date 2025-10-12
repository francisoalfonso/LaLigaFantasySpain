// Script para verificar que los insights se guardaron en la BD
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
    const { data, error } = await supabase
        .from('competitive_channels')
        .select(
            'id, channel_name, insights, viral_patterns, onboarding_completed_at, onboarding_metadata'
        )
        .eq('id', 'a9c8e10d-4da9-472e-9c36-851f341440e3')
        .single();

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log('📊 Canal:', data.channel_name);
    console.log('');
    console.log(
        '✅ insights:',
        data.insights ? `GUARDADO (${JSON.stringify(data.insights).length} bytes)` : '❌ NULL'
    );
    console.log(
        '✅ viral_patterns:',
        data.viral_patterns
            ? `GUARDADO (${JSON.stringify(data.viral_patterns).length} bytes)`
            : '❌ NULL'
    );
    console.log('✅ onboarding_completed_at:', data.onboarding_completed_at || '❌ NULL');
    console.log('✅ onboarding_metadata:', data.onboarding_metadata ? 'GUARDADO' : '❌ NULL');

    if (data.insights && data.insights.performance_benchmarks) {
        console.log('');
        console.log('📈 Performance Benchmarks:');
        const b = data.insights.performance_benchmarks;
        console.log('  - Views:', b.views.toFixed(1));
        console.log('  - Likes:', b.likes.toFixed(1));
        console.log('  - Engagement:', `${(b.engagement_rate * 100).toFixed(2)}%`);
    }

    if (data.onboarding_metadata) {
        console.log('');
        console.log('⏱️  Metadata:');
        const m = data.onboarding_metadata;
        console.log('  - Mode:', m.mode);
        console.log('  - Videos:', m.videos_found);
        console.log('  - Top performers:', m.top_count);
        console.log('  - Duration:', `${m.duration_seconds}s`);
        console.log('  - Cost:', `$${m.cost_estimate.toFixed(2)}`);
    }
}

verify();
