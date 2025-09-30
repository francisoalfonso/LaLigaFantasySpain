#!/usr/bin/env node

/**
 * Supabase Database Verification Script
 * Verifies that the Fantasy La Liga database schema was properly initialized
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../../../../../../utils/logger');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logger.error('❌ Error: Missing Supabase credentials');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyDatabase() {
    logger.info('🔍 Fantasy La Liga Database Verification');
    logger.info('==========================================\n');

    let allTestsPassed = true;

    try {
        // Test 1: Core Tables
        logger.info('📊 Testing Core Tables...');
        const coreTables = [
            'teams', 'players', 'matches', 'player_stats', 'fantasy_points',
            'content_plans', 'social_posts', 'workflows', 'api_requests',
            'users', 'user_teams', 'transfers'
        ];

        const tableResults = {};
        for (const tableName of coreTables) {
            try {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    logger.info(`  ❌ ${tableName}: ${error.message}`);
                    tableResults[tableName] = { exists: false, count: 0, error: error.message };
                    allTestsPassed = false;
                } else {
                    logger.info(`  ✅ ${tableName}: ${count || 0} records`);
                    tableResults[tableName] = { exists: true, count: count || 0 };
                }
            } catch (err) {
                logger.info(`  ❌ ${tableName}: ${err.message}`);
                tableResults[tableName] = { exists: false, count: 0, error: err.message };
                allTestsPassed = false;
            }
        }

        // Test 2: Initial Data
        logger.info('\n🎯 Testing Initial Data...');

        // Check if teams are seeded
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('name, short_name')
            .limit(5);

        if (teamsError || !teams || teams.length === 0) {
            logger.info('  ❌ Teams not properly seeded');
            allTestsPassed = false;
        } else {
            logger.info(`  ✅ Teams seeded: ${teams.length} sample teams found`);
            teams.forEach(team => {
                logger.info(`    - ${team.name} (${team.short_name})`);
            });
        }

        // Check content plans
        const { data: contentPlans, error: contentError } = await supabase
            .from('content_plans')
            .select('title, plan_type')
            .limit(3);

        if (contentError || !contentPlans || contentPlans.length === 0) {
            logger.info('  ⚠️ No sample content plans found (may be normal)');
        } else {
            logger.info(`  ✅ Content plans seeded: ${contentPlans.length} samples`);
        }

        // Test 3: Database Functions
        logger.info('\n⚙️ Testing Database Functions...');

        try {
            // Test the fantasy points calculation function
            const { data: functionTest, error: functionError } = await supabase
                .rpc('calculate_fantasy_points', {
                    player_position: 'FWD',
                    goals: 2,
                    assists: 1,
                    minutes: 90,
                    yellow_cards: 0,
                    red_cards: 0
                });

            if (functionError) {
                logger.info('  ❌ calculate_fantasy_points function: Not working');
                logger.info(`    Error: ${functionError.message}`);
                allTestsPassed = false;
            } else {
                logger.info(`  ✅ calculate_fantasy_points function: Returns ${functionTest} points`);
            }
        } catch (err) {
            logger.info('  ❌ Function test failed:', err.message);
            allTestsPassed = false;
        }

        // Test 4: Views
        logger.info('\n👁️ Testing Database Views...');

        const views = [
            'current_gameweek_performance',
            'top_performers_by_position',
            'content_performance'
        ];

        for (const viewName of views) {
            try {
                const { data, error } = await supabase
                    .from(viewName)
                    .select('*')
                    .limit(1);

                if (error) {
                    logger.info(`  ❌ ${viewName}: ${error.message}`);
                    allTestsPassed = false;
                } else {
                    logger.info(`  ✅ ${viewName}: View accessible`);
                }
            } catch (err) {
                logger.info(`  ❌ ${viewName}: ${err.message}`);
                allTestsPassed = false;
            }
        }

        // Test 5: Row Level Security
        logger.info('\n🔒 Testing Row Level Security...');

        // Check if RLS is enabled on sensitive tables
        const rlsTables = ['users', 'user_teams', 'transfers'];

        for (const tableName of rlsTables) {
            try {
                // Try to access with anon key (should be restricted)
                const anonSupabase = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
                const { data, error } = await anonSupabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error && (error.message.includes('RLS') || error.message.includes('policy'))) {
                    logger.info(`  ✅ ${tableName}: RLS properly enabled`);
                } else {
                    logger.info(`  ⚠️ ${tableName}: RLS may not be properly configured`);
                }
            } catch (err) {
                logger.info(`  ⚠️ ${tableName}: Could not test RLS`);
            }
        }

        // Summary
        logger.info('\n🏁 Verification Summary');
        logger.info('======================');

        const tableCount = Object.keys(tableResults).length;
        const successfulTables = Object.values(tableResults).filter(r => r.exists).length;

        logger.info(`📊 Tables: ${successfulTables}/${tableCount} successful`);

        if (allTestsPassed) {
            logger.info('🎉 Database verification PASSED!');
            logger.info('✅ Your Fantasy La Liga database is ready for use');

            logger.info('\n🚀 Next Steps:');
            logger.info('1. Start the backend server: npm run dev');
            logger.info('2. Test API endpoints: http://localhost:3000/api/test/ping');
            logger.info('3. Import La Liga data: Call /api/laliga endpoints');
            logger.info('4. Setup n8n workflows for automation');
        } else {
            logger.info('⚠️ Database verification found issues');
            logger.info('❌ Please review the errors above and re-run the schema');

            logger.info('\n🔧 Troubleshooting:');
            logger.info('1. Ensure you executed the complete schema in Supabase SQL Editor');
            logger.info('2. Check for any SQL execution errors in Supabase logs');
            logger.info('3. Verify your service role key has proper permissions');
        }

        // Detailed table status
        logger.info('\n📋 Detailed Table Status:');
        Object.entries(tableResults).forEach(([table, result]) => {
            if (result.exists) {
                logger.info(`  ✅ ${table}: ${result.count} records`);
            } else {
                logger.info(`  ❌ ${table}: ${result.error || 'Not found'}`);
            }
        });

    } catch (error) {
        logger.error('💥 Verification failed:', error.message);
        allTestsPassed = false;
    }

    return allTestsPassed;
}

// Run verification
if (require.main === module) {
    verifyDatabase()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            logger.error('💥 Verification script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { verifyDatabase };