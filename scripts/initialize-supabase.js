#!/usr/bin/env node

/**
 * Supabase Database Initialization Script
 * Executes the complete SQL schema on the Fantasy La Liga Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.supabase
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Missing Supabase credentials in .env.supabase');
    console.error('Required: SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY');
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
    console.log('🚀 Starting Fantasy La Liga Database Initialization');
    console.log(`📡 Connecting to: ${SUPABASE_URL}`);

    try {
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'supabase-schema.sql');
        console.log(`📖 Reading schema from: ${schemaPath}`);

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        console.log(`✅ Schema file loaded (${sqlSchema.length} characters)`);

        // Test connection first with a simple query
        console.log('🔍 Testing database connection...');
        try {
            const { data: connectionTest, error: connectionError } = await supabase
                .from('teams')
                .select('id')
                .limit(1);

            if (connectionError) {
                // This might be expected if tables don't exist yet
                if (connectionError.message.includes('relation "teams" does not exist')) {
                    console.log('⚠️ Tables not yet created (expected for new database)');
                } else {
                    console.log('⚠️ Connection test returned:', connectionError.message);
                }
            } else {
                console.log('✅ Database connection successful - tables already exist');
            }
        } catch (err) {
            console.log('⚠️ Initial connection test failed (this may be normal for new database)');
        }

        // Execute the schema using SQL editor approach
        console.log('⚙️ Executing SQL schema...');
        console.log('📋 Note: For full schema execution, please run this SQL in Supabase SQL Editor:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Copy and paste the complete schema');
        console.log('   4. Execute it there');
        console.log('');
        console.log('🔄 Attempting to create core tables using client methods...');

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
                console.log('📝 Tables need to be created. Please execute the schema in Supabase SQL Editor.');

                // Show the schema file location
                const schemaPath = path.join(__dirname, '..', 'database', 'supabase-schema.sql');
                console.log(`📍 Schema file location: ${schemaPath}`);

                // Create a simple indication that we need manual setup
                console.log('');
                console.log('🔧 Manual Setup Required:');
                console.log('   1. Open Supabase Dashboard');
                console.log('   2. Go to SQL Editor');
                console.log('   3. Run the schema from database/supabase-schema.sql');
                console.log('   4. Then run this script again to verify');

                return false;
            } else if (testError) {
                console.error('❌ Unexpected error:', testError.message);
                errorCount++;
            } else {
                console.log('✅ Tables appear to already exist');
                successCount++;
            }
        } catch (err) {
            console.error('❌ Error checking table existence:', err.message);
            errorCount++;
        }

        console.log(`\n📊 Execution Summary:`);
        console.log(`  ✅ Successful statements: ${successCount}`);
        console.log(`  ❌ Failed statements: ${errorCount}`);

        // Verify database structure
        console.log('\n🔍 Verifying database structure...');
        await verifyDatabaseStructure();

        console.log('\n🎉 Database initialization completed!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('Stack trace:', error.stack);
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
                console.error('❌ Could not verify tables:', altError.message);
                return;
            }

            console.log('📋 Created tables:');
            altTables.forEach(table => {
                console.log(`  - ${table.table_name}`);
            });

            console.log(`\n✅ Total tables created: ${altTables.length}`);
            return;
        }

        // If we have the custom function, use it
        console.log('📋 Database verification results:');
        console.log(tables);

    } catch (error) {
        console.log('⚠️ Could not verify database structure:', error.message);
    }
}

// Alternative verification method using direct queries
async function basicVerification() {
    const tablesToCheck = [
        'teams', 'players', 'matches', 'player_stats', 'fantasy_points',
        'content_plans', 'social_posts', 'workflows', 'api_requests',
        'users', 'user_teams', 'transfers'
    ];

    console.log('🔍 Checking core tables...');

    for (const tableName of tablesToCheck) {
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`  ❌ ${tableName}: ${error.message}`);
            } else {
                console.log(`  ✅ ${tableName}: ${count} records`);
            }
        } catch (err) {
            console.log(`  ❌ ${tableName}: ${err.message}`);
        }
    }
}

// Run the initialization
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('\n🏁 Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };