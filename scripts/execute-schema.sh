#!/bin/bash

# Fantasy La Liga - Supabase Database Schema Execution Script
# Executes the SQL schema directly via Supabase REST API

# Load environment variables
if [ -f "../.env.supabase" ]; then
    source "../.env.supabase"
else
    echo "❌ Error: .env.supabase file not found"
    exit 1
fi

# Check required variables
if [ -z "$SUPABASE_PROJECT_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Required: SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "🚀 Fantasy La Liga Database Schema Execution"
echo "📡 Target: $SUPABASE_PROJECT_URL"

# Read SQL schema
SCHEMA_FILE="../database/supabase-schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Schema file not found: $SCHEMA_FILE"
    exit 1
fi

echo "📖 Reading schema file..."
SQL_CONTENT=$(cat "$SCHEMA_FILE")

# Execute SQL via Supabase API
echo "⚙️ Executing SQL schema via REST API..."

# Create a temporary file with the SQL content
TEMP_SQL_FILE="/tmp/fantasy_laliga_schema.sql"
echo "$SQL_CONTENT" > "$TEMP_SQL_FILE"

# Execute using curl
RESPONSE=$(curl -s -X POST \
    "${SUPABASE_PROJECT_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"sql\": $(cat "$TEMP_SQL_FILE" | jq -Rs .)}")

# Clean up temp file
rm "$TEMP_SQL_FILE"

# Check response
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ SQL execution failed:"
    echo "$RESPONSE" | jq .
    exit 1
else
    echo "✅ SQL schema executed successfully"
fi

# Verify tables were created
echo "🔍 Verifying table creation..."

# Get list of tables
TABLES_RESPONSE=$(curl -s \
    "${SUPABASE_PROJECT_URL}/rest/v1/information_schema.tables?table_schema=eq.public&select=table_name" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

if echo "$TABLES_RESPONSE" | grep -q "error"; then
    echo "⚠️ Could not verify tables: $TABLES_RESPONSE"
else
    echo "📋 Created tables:"
    echo "$TABLES_RESPONSE" | jq -r '.[].table_name' | sort | sed 's/^/  - /'

    TABLE_COUNT=$(echo "$TABLES_RESPONSE" | jq length)
    echo "✅ Total tables created: $TABLE_COUNT"
fi

echo "🎉 Database initialization completed!"