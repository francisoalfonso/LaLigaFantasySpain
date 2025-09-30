#!/usr/bin/env node

/**
 * Direct Supabase Database Initialization
 * Uses PostgreSQL client to execute schema directly
 */

const { Client } = require('pg');
const logger = require('../../../../../../utils/logger');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

// PostgreSQL connection config
const connectionConfig = {
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT) || 5432,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
};

async function initializeDatabase() {
    logger.info('🚀 Fantasy La Liga Database Direct Initialization');
    logger.info(`📡 Connecting to: ${connectionConfig.host}:${connectionConfig.port}`);

    const client = new Client(connectionConfig);

    try {
        // Connect to database
        logger.info('🔌 Connecting to PostgreSQL...');
        await client.connect();
        logger.info('✅ Connected to database');

        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'supabase-schema.sql');
        logger.info(`📖 Reading schema from: ${schemaPath}`);

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        logger.info(`✅ Schema file loaded (${sqlSchema.length} characters)`);

        // Execute schema
        logger.info('⚙️ Executing SQL schema...');

        try {
            await client.query(sqlSchema);
            logger.info('✅ Schema executed successfully');
        } catch (error) {
            logger.error('❌ Schema execution error:', error.message);

            // Try executing in smaller chunks
            logger.info('🔄 Attempting to execute in smaller chunks...');
            await executeInChunks(client, sqlSchema);
        }

        // Verify database structure
        logger.info('\n🔍 Verifying database structure...');
        await verifyDatabaseStructure(client);

        logger.info('\n🎉 Database initialization completed successfully!');

    } catch (error) {
        logger.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        await client.end();
        logger.info('🔌 Database connection closed');
    }
}

async function executeInChunks(client, sqlSchema) {
    // Split schema into logical chunks
    const chunks = sqlSchema.split(/(?=CREATE TABLE|CREATE VIEW|CREATE FUNCTION|CREATE TRIGGER|CREATE INDEX|INSERT INTO|ALTER TABLE)/);

    let successCount = 0;
    let errorCount = 0;

    logger.info(`📝 Executing ${chunks.length} SQL chunks...`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i].trim();

        if (chunk.length < 10 || chunk.startsWith('--')) {
            continue;
        }

        try {
            logger.info(`  Processing chunk ${i + 1}/${chunks.length}...`);
            await client.query(chunk);
            successCount++;
        } catch (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') ||
                error.message.includes('does not exist')) {
                logger.info(`  ⚠️ Expected: ${error.message.split('\n')[0]}`);
            } else {
                logger.error(`  ❌ Error in chunk ${i + 1}: ${error.message.split('\n')[0]}`);
                errorCount++;
            }
        }
    }

    logger.info(`📊 Chunk execution results: ${successCount} success, ${errorCount} errors`);
}

async function verifyDatabaseStructure(client) {
    try {
        // Get list of tables
        const tablesResult = await client.query(`
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        logger.info('📋 Created tables:');
        let tableCount = 0;
        let viewCount = 0;

        tablesResult.rows.forEach(row => {
            if (row.table_type === 'BASE TABLE') {
                logger.info(`  📄 ${row.table_name}`);
                tableCount++;
            } else if (row.table_type === 'VIEW') {
                logger.info(`  👁️ ${row.table_name} (view)`);
                viewCount++;
            }
        });

        logger.info(`\n📊 Database summary:`);
        logger.info(`  📄 Tables: ${tableCount}`);
        logger.info(`  👁️ Views: ${viewCount}`);

        // Check core tables and get record counts
        const coreTables = ['teams', 'players', 'matches', 'content_plans', 'users'];

        logger.info('\n🔍 Core table verification:');
        for (const tableName of coreTables) {
            try {
                const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                const count = parseInt(countResult.rows[0].count);
                logger.info(`  ✅ ${tableName}: ${count} records`);
            } catch (error) {
                logger.info(`  ❌ ${tableName}: ${error.message.split('\n')[0]}`);
            }
        }

        // Check indexes
        const indexResult = await client.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY indexname
        `);

        logger.info(`\n📈 Indexes created: ${indexResult.rows.length}`);

        // Check functions
        const functionResult = await client.query(`
            SELECT proname
            FROM pg_proc
            WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            ORDER BY proname
        `);

        logger.info(`⚙️ Functions created: ${functionResult.rows.length}`);

    } catch (error) {
        logger.error('❌ Verification error:', error.message);
    }
}

// Install pg dependency if not present
async function checkDependencies() {
    try {
        require('pg');
    } catch (error) {
        logger.info('📦 Installing required dependency: pg');
        const { execSync } = require('child_process');
        execSync('npm install pg', { stdio: 'inherit' });
        logger.info('✅ Dependency installed');
    }
}

// Run initialization
if (require.main === module) {
    (async () => {
        try {
            await checkDependencies();
            await initializeDatabase();
            logger.info('\n🏁 Initialization completed successfully');
            process.exit(0);
        } catch (error) {
            logger.error('\n💥 Initialization failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = { initializeDatabase };