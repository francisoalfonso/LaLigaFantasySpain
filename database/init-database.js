// =====================================================
// SUPABASE DATABASE INITIALIZATION SCRIPT
// =====================================================
// Script to initialize the Fantasy La Liga database schema
// Executes the complete schema creation and initial data seeding

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
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
async function initializeDatabase() {
  log('🚀 Starting Fantasy La Liga Database Initialization', 'bright');
  log('=' .repeat(60), 'blue');

  // Validate environment variables
  if (!process.env.SUPABASE_PROJECT_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ Missing required environment variables!', 'red');
    log('Please ensure SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.supabase', 'yellow');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Test connection
    log('📡 Testing database connection...', 'blue');
    const { data: testData, error: testError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1);

    if (testError) {
      throw new Error(`Connection failed: ${testError.message}`);
    }

    log('✅ Database connection successful!', 'green');

    // Read and execute schema
    log('📖 Reading schema file...', 'blue');
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    log('✅ Schema file loaded successfully!', 'green');

    // Split SQL into individual statements
    log('🔧 Parsing SQL statements...', 'blue');
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    log(`📊 Found ${statements.length} SQL statements to execute`, 'blue');

    // Execute statements one by one
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
        // Extract table/function name for logging
        const statementType = getStatementType(statement);

        log(`  ${i + 1}/${statements.length}: ${statementType}...`, 'blue');

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Some errors are expected (like table already exists)
          if (isExpectedError(error.message)) {
            log(`  ⚠️  Expected: ${error.message}`, 'yellow');
          } else {
            log(`  ❌ Error: ${error.message}`, 'red');
            errorCount++;
          }
        } else {
          successCount++;
        }

      } catch (error) {
        log(`  ❌ Execution error: ${error.message}`, 'red');
        errorCount++;
      }
    }

    // Summary
    log('=' .repeat(60), 'blue');
    log('📈 Initialization Summary:', 'bright');
    log(`✅ Successful operations: ${successCount}`, 'green');

    if (errorCount > 0) {
      log(`❌ Failed operations: ${errorCount}`, 'red');
    }

    // Verify core tables were created
    log('🔍 Verifying core tables...', 'blue');
    const coreTablesCond = [
      'teams', 'players', 'matches', 'player_stats',
      'fantasy_points', 'content_plans', 'social_posts'
    ];

    for (const tableName of coreTablesCond) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        log(`  ❌ Table '${tableName}' verification failed: ${error.message}`, 'red');
      } else {
        log(`  ✅ Table '${tableName}' exists (${data?.length || 0} records)`, 'green');
      }
    }

    // Get database statistics
    log('📊 Database Statistics:', 'blue');
    try {
      for (const tableName of coreTablesCond) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          log(`  📋 ${tableName}: ${count} records`, 'blue');
        }
      }
    } catch (error) {
      log(`  ⚠️  Could not fetch statistics: ${error.message}`, 'yellow');
    }

    log('=' .repeat(60), 'blue');
    log('🎉 Database initialization completed!', 'green');
    log('🔗 Database URL: ' + process.env.SUPABASE_PROJECT_URL, 'blue');
    log('📚 Next steps:', 'bright');
    log('  1. Test the connection using npm run test:db', 'blue');
    log('  2. Start importing data from API-Sports', 'blue');
    log('  3. Begin content generation workflows', 'blue');

  } catch (error) {
    log('💥 Initialization failed!', 'red');
    log(`Error: ${error.message}`, 'red');

    if (error.stack) {
      log('Stack trace:', 'yellow');
      console.error(error.stack);
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
    const match = statement.match(/CREATE TABLE\s+(\w+)/i);
    return `Creating table '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('CREATE INDEX')) {
    const match = statement.match(/CREATE INDEX\s+(\w+)/i);
    return `Creating index '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('CREATE VIEW')) {
    const match = statement.match(/CREATE VIEW\s+(\w+)/i);
    return `Creating view '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('CREATE FUNCTION')) {
    const match = statement.match(/CREATE.*FUNCTION\s+(\w+)/i);
    return `Creating function '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('CREATE TRIGGER')) {
    const match = statement.match(/CREATE TRIGGER\s+(\w+)/i);
    return `Creating trigger '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('CREATE POLICY')) {
    const match = statement.match(/CREATE POLICY\s+"([^"]+)"/i);
    return `Creating policy '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('ALTER TABLE')) {
    const match = statement.match(/ALTER TABLE\s+(\w+)/i);
    return `Altering table '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('INSERT INTO')) {
    const match = statement.match(/INSERT INTO\s+(\w+)/i);
    return `Inserting data into '${match ? match[1] : 'unknown'}'`;
  }

  if (upperStatement.startsWith('CREATE EXTENSION')) {
    const match = statement.match(/CREATE EXTENSION.*"([^"]+)"/i);
    return `Creating extension '${match ? match[1] : 'unknown'}'`;
  }

  return 'Executing SQL statement';
}

/**
 * Check if error is expected (like table already exists)
 */
function isExpectedError(errorMessage) {
  const expectedErrors = [
    'already exists',
    'duplicate key',
    'relation already exists',
    'function already exists',
    'extension already exists'
  ];

  return expectedErrors.some(expectedError =>
    errorMessage.toLowerCase().includes(expectedError)
  );
}

/**
 * Command line interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    log('Fantasy La Liga Database Initialization', 'bright');
    log('Usage: node init-database.js [options]', 'blue');
    log('');
    log('Options:', 'bright');
    log('  --help, -h     Show this help message', 'blue');
    log('  --force        Force execution even if tables exist', 'blue');
    log('');
    log('Environment variables required:', 'bright');
    log('  SUPABASE_PROJECT_URL        Your Supabase project URL', 'blue');
    log('  SUPABASE_SERVICE_ROLE_KEY   Your Supabase service role key', 'blue');
    process.exit(0);
  }

  // Start initialization
  initializeDatabase().catch(error => {
    log('💥 Unhandled error during initialization:', 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  initializeDatabase,
  log,
  colors
};