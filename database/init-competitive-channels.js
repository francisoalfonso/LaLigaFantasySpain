// =====================================================
// COMPETITIVE CHANNELS SCHEMA INITIALIZATION
// =====================================================
// Script to initialize competitive channels tables
// Part of: Competitive YouTube Analyzer feature

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

/**
 * Log with colors
 */
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Main initialization function
 */
async function initializeCompetitiveChannels() {
    log('🚀 Initializing Competitive Channels Schema', 'bright');
    log('='.repeat(60), 'blue');

    // Validate environment variables
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_HOST) {
        log('❌ Missing database connection variables!', 'red');
        log(
            'Please ensure DATABASE_URL or SUPABASE_DB_* variables are set in .env.supabase',
            'yellow'
        );
        process.exit(1);
    }

    // Construct DATABASE_URL if not provided
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        connectionString = `postgresql://${process.env.SUPABASE_DB_USER}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`;
        log('🔧 Constructed DATABASE_URL from individual parameters', 'blue');
    }

    // Create PostgreSQL client
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Connect to database
        log('📡 Connecting to database...', 'blue');
        await client.connect();
        log('✅ Database connection successful!', 'green');

        // Read schema
        log('📖 Reading competitive-channels schema...', 'blue');
        const schemaPath = path.join(__dirname, 'competitive-channels-schema.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        log('✅ Schema file loaded successfully!', 'green');

        // Split SQL into statements
        log('🔧 Parsing SQL statements...', 'blue');
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        log(`📊 Found ${statements.length} SQL statements to execute`, 'blue');

        // Execute statements using Supabase SQL editor
        log('⚙️  Executing schema creation...', 'blue');
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.trim() === '') {
                continue;
            }

            try {
                const statementType = getStatementType(statement);
                log(`  ${i + 1}/${statements.length}: ${statementType}...`, 'blue');

                // Execute SQL statement
                await client.query(`${statement};`);
                successCount++;
            } catch (error) {
                // Some errors are expected (like table already exists)
                if (isExpectedError(error.message)) {
                    log(`  ⚠️  Expected: ${error.message}`, 'yellow');
                    successCount++;
                } else {
                    log(`  ❌ Error: ${error.message}`, 'red');
                    errorCount++;
                }
            }
        }

        // Summary
        log('='.repeat(60), 'blue');
        log('📈 Schema Initialization Summary:', 'bright');
        log(`✅ Successful operations: ${successCount}`, 'green');

        if (errorCount > 0) {
            log(`❌ Failed operations: ${errorCount}`, 'red');
        }

        // Verify tables were created
        log('🔍 Verifying competitive tables...', 'blue');
        const competitiveTables = ['competitive_channels', 'competitive_videos'];

        for (const tableName of competitiveTables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
                const count = parseInt(result.rows[0].count);
                log(`  ✅ Table '${tableName}' exists (${count} records)`, 'green');
            } catch (error) {
                log(`  ❌ Table '${tableName}' verification failed: ${error.message}`, 'red');
            }
        }

        // Close connection
        await client.end();

        log('='.repeat(60), 'blue');
        log('🎉 Competitive Channels schema initialized!', 'green');
        log('📚 Next steps:', 'bright');
        log('  1. Test channel CRUD: POST /api/competitive/channels', 'blue');
        log('  2. Test content analysis: POST /api/content-analysis/analyze-youtube', 'blue');
        log('  3. Create frontend interface: competitive-channels.html', 'blue');
    } catch (error) {
        log('💥 Schema initialization failed!', 'red');
        log(`Error: ${error.message}`, 'red');

        if (error.stack) {
            log('Stack trace:', 'yellow');
            console.error(error.stack);
        }

        // Close connection on error
        try {
            await client.end();
        } catch (endError) {
            // Ignore
        }

        process.exit(1);
    }
}

/**
 * Extract statement type for logging
 */
function getStatementType(statement) {
    const upperStatement = statement.toUpperCase().trim();

    if (upperStatement.startsWith('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
        return `Creating table '${match ? match[1] : 'unknown'}'`;
    }

    if (upperStatement.startsWith('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
        return `Creating index '${match ? match[1] : 'unknown'}'`;
    }

    if (upperStatement.startsWith('CREATE.*FUNCTION')) {
        const match = statement.match(/CREATE.*FUNCTION\s+(\w+)/i);
        return `Creating function '${match ? match[1] : 'unknown'}'`;
    }

    if (upperStatement.startsWith('CREATE TRIGGER')) {
        const match = statement.match(/CREATE TRIGGER\s+(\w+)/i);
        return `Creating trigger '${match ? match[1] : 'unknown'}'`;
    }

    if (upperStatement.startsWith('DROP TRIGGER')) {
        const match = statement.match(/DROP TRIGGER\s+(?:IF EXISTS\s+)?(\w+)/i);
        return `Dropping trigger '${match ? match[1] : 'unknown'}'`;
    }

    if (upperStatement.startsWith('COMMENT ON')) {
        return 'Adding comment';
    }

    return 'Executing SQL statement';
}

/**
 * Check if error is expected
 */
function isExpectedError(errorMessage) {
    const expectedErrors = [
        'already exists',
        'duplicate key',
        'relation already exists',
        'function already exists',
        'trigger already exists'
    ];

    return expectedErrors.some(expectedError => errorMessage.toLowerCase().includes(expectedError));
}

/**
 * Command line interface
 */
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        log('Competitive Channels Schema Initialization', 'bright');
        log('Usage: node init-competitive-channels.js', 'blue');
        log('');
        log('Environment variables required:', 'bright');
        log('  DATABASE_URL   PostgreSQL connection string (from .env.supabase)', 'blue');
        process.exit(0);
    }

    // Start initialization
    initializeCompetitiveChannels().catch(error => {
        log('💥 Unhandled error during initialization:', 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    initializeCompetitiveChannels,
    log,
    colors
};
