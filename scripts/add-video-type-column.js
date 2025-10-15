#!/usr/bin/env node

/**
 * Add video_type column to youtube_outliers table
 *
 * Purpose: Store video classification separately from content_analysis JSONB
 * Values: 'player_spotlight' (single player focus) | 'generic_analysis' (jornada/multi-player)
 */

const { supabaseAdmin } = require('../backend/config/supabase');

async function addVideoTypeColumn() {
    try {
        console.log('\n🔧 Adding video_type column to youtube_outliers...');

        // Execute raw SQL using Supabase admin client
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
            sql_query: `
                -- Add video_type column
                ALTER TABLE youtube_outliers
                ADD COLUMN IF NOT EXISTS video_type VARCHAR(20)
                CHECK (video_type IN ('player_spotlight', 'generic_analysis'));

                -- Create index
                CREATE INDEX IF NOT EXISTS idx_outliers_video_type ON youtube_outliers(video_type);

                -- Add comment
                COMMENT ON COLUMN youtube_outliers.video_type IS 'Video classification: player_spotlight (single player focus) | generic_analysis (jornada/multi-player)';
            `
        });

        if (error) {
            // Try alternative approach using direct SQL execution
            console.log('⚠️  RPC method not available, using direct SQL execution...');

            const { error: sqlError } = await supabaseAdmin
                .from('youtube_outliers')
                .select('video_type')
                .limit(1);

            if (sqlError && sqlError.code === '42703') {
                // Column doesn't exist - need manual migration
                console.log('\n❌ Column does not exist yet.');
                console.log('\n📝 Manual migration required. Run this SQL in Supabase SQL Editor:');
                console.log(`\n${'='.repeat(80)}`);
                console.log(
                    `
ALTER TABLE youtube_outliers
ADD COLUMN IF NOT EXISTS video_type VARCHAR(20)
CHECK (video_type IN ('player_spotlight', 'generic_analysis'));

CREATE INDEX IF NOT EXISTS idx_outliers_video_type ON youtube_outliers(video_type);

COMMENT ON COLUMN youtube_outliers.video_type IS 'Video classification: player_spotlight (single player focus) | generic_analysis (jornada/multi-player)';
                `.trim()
                );
                console.log(`\n${'='.repeat(80)}`);
                console.log(
                    '\n🔗 Go to: https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/sql\n'
                );
                return;
            }

            console.log('✅ Column video_type already exists or migration applied successfully!');
            return;
        }

        console.log('✅ Migration completed successfully!');
        console.log('   - Column: video_type (VARCHAR(20))');
        console.log('   - Constraint: player_spotlight | generic_analysis');
        console.log('   - Index: idx_outliers_video_type');
    } catch (err) {
        console.error('\n❌ Error applying migration:', err.message);
        console.log('\n📝 Manual migration required. Run this SQL in Supabase SQL Editor:');
        console.log(`\n${'='.repeat(80)}`);
        console.log(
            `
ALTER TABLE youtube_outliers
ADD COLUMN IF NOT EXISTS video_type VARCHAR(20)
CHECK (video_type IN ('player_spotlight', 'generic_analysis'));

CREATE INDEX IF NOT EXISTS idx_outliers_video_type ON youtube_outliers(video_type);

COMMENT ON COLUMN youtube_outliers.video_type IS 'Video classification: player_spotlight (single player focus) | generic_analysis (jornada/multi-player)';
        `.trim()
        );
        console.log(`\n${'='.repeat(80)}`);
        console.log(
            '\n🔗 Go to: https://supabase.com/dashboard/project/ixfowlkuypnfbrwawxlx/sql\n'
        );
    }
}

addVideoTypeColumn();
