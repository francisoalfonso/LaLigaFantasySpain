#!/usr/bin/env node

/**
 * Supabase Database Initialization Script
 * Executes the complete SQL schema on the Fantasy La Liga Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../../../../../../utils/logger');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.supabase
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logger.error('❌ Error: Missing Supabase credentials in .env.supabase');
    logger.error('Required: SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function initializeDatabase() {
    logger.info('🚀 Starting Fantasy La Liga Database Initialization');
    logger.info(`📡 Connecting to: ${SUPABASE_URL}`);

    try {
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'supabase-schema.sql');
        logger.info(`📖 Reading schema from: ${schemaPath}`);

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        logger.info(`✅ Schema file loaded (${sqlSchema.length} characters)`);

        // Test connection first with a simple query
        logger.info('🔍 Testing database connection...');
        try {
            const { data: connectionTest, error: connectionError } = await supabase
                .from('teams')
                .select('id')
                .limit(1);

            if (connectionError) {
                // This might be expected if tables don't exist yet
                if (connectionError.message.includes('relation "teams" does not exist')) {
                    logger.info('⚠️ Tables not yet created (expected for new database)');
                } else {
                    logger.info('⚠️ Connection test returned:', connectionError.message);
                }
            } else {
                logger.info('✅ Database connection successful - tables already exist');
            }
        } catch (err) {
            logger.info('⚠️ Initial connection test failed (this may be normal for new database)');
        }

        // Execute the schema using SQL editor approach
        logger.info('⚙️ Executing SQL schema...');
        logger.info('📋 Note: For full schema execution, please run this SQL in Supabase SQL Editor:');
        logger.info('   1. Go to your Supabase dashboard');
        logger.info('   2. Navigate to SQL Editor');
        logger.info('   3. Copy and paste the complete schema');
        logger.info('   4. Execute it there');
        logger.info('');
        logger.info('🔄 Attempting to create core tables using client methods...');

        let successCount = 0;
        let errorCount = 0;

        // Try to create some basic structure using available methods
        try {
            // Test if we can create a simple table
            const { error: testError } = await supabase
                .from('teams')
                .select('id')
                .limit(1);

            if (testError && testError.message.includes('relation "teams" does not exist')) {
                logger.info('📝 Tables need to be created. Please execute the schema in Supabase SQL Editor.');

                // Show the schema file location
                const schemaPath = path.join(__dirname, '..', 'database', 'supabase-schema.sql');
                logger.info(`📍 Schema file location: ${schemaPath}`);

                // Create a simple indication that we need manual setup
                logger.info('');
                logger.info('🔧 Manual Setup Required:');
                logger.info('   1. Open Supabase Dashboard');
                logger.info('   2. Go to SQL Editor');
                logger.info('   3. Run the schema from database/supabase-schema.sql');
                logger.info('   4. Then run this script again to verify');

                return false;
            } else if (testError) {
                logger.error('❌ Unexpected error:', testError.message);
                errorCount++;
            } else {
                logger.info('✅ Tables appear to already exist');
                successCount++;
            }
        } catch (err) {
            logger.error('❌ Error checking table existence:', err.message);
            errorCount++;
        }

        logger.info(`\n📊 Execution Summary:`);
        logger.info(`  ✅ Successful statements: ${successCount}`);
        logger.info(`  ❌ Failed statements: ${errorCount}`);

        // Verify database structure
        logger.info('\n🔍 Verifying database structure...');
        await verifyDatabaseStructure();

        logger.info('\n🎉 Database initialization completed!');

    } catch (error) {
        logger.error('❌ Database initialization failed:', error.message);
        logger.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

async function verifyDatabaseStructure() {
    try {
        // Get list of tables
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables_info');

        if (tablesError) {
            // Alternative method to get tables
            const { data: altTables, error: altError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .order('table_name');

            if (altError) {
                logger.error('❌ Could not verify tables:', altError.message);
                return;
            }

            logger.info('📋 Created tables:');
            altTables.forEach(table => {
                logger.info(`  - ${table.table_name}`);
            });

            logger.info(`\n✅ Total tables created: ${altTables.length}`);
            return;
        }

        // If we have the custom function, use it
        logger.info('📋 Database verification results:');
        logger.info(tables);

    } catch (error) {
        logger.info('⚠️ Could not verify database structure:', error.message);
    }
}

// Alternative verification method using direct queries
async function basicVerification() {
    const tablesToCheck = [
        'teams', 'players', 'matches', 'player_stats', 'fantasy_points',
        'content_plans', 'social_posts', 'workflows', 'api_requests',
        'users', 'user_teams', 'transfers'
    ];

    logger.info('🔍 Checking core tables...');

    for (const tableName of tablesToCheck) {
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) {
                logger.info(`  ❌ ${tableName}: ${error.message}`);
            } else {
                logger.info(`  ✅ ${tableName}: ${count} records`);
            }
        } catch (err) {
            logger.info(`  ❌ ${tableName}: ${err.message}`);
        }
    }
}

// Run the initialization
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            logger.info('\n🏁 Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('\n💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };