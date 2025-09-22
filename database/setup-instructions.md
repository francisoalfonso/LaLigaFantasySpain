# Supabase Database Setup Instructions

Since direct SQL execution through the Node.js client has limitations, please follow these steps to set up the database:

## Method 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `Fantasy La Liga`

2. **Open SQL Editor**
   - Navigate to `SQL Editor` in the left sidebar
   - Click `New Query`

3. **Execute Schema**
   - Copy the entire content from `/database/supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click `Run` to execute

4. **Verify Setup**
   - Check the `Table Editor` to confirm all tables were created
   - Run the test command: `npm run db:test:quick`

## Method 2: Supabase CLI (Advanced)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Project**
   ```bash
   supabase init
   supabase link --project-ref ixfowlkuypnfbrwawxlx
   ```

3. **Apply Migration**
   ```bash
   supabase db reset
   ```

## Method 3: Manual Table Creation

If the full schema is too large, create tables individually:

### Step 1: Core Tables
```sql
-- Teams table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(10),
    logo_url TEXT,
    stadium VARCHAR(100),
    city VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    fantasy_price DECIMAL(4,1) DEFAULT 5.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Insert Sample Data
```sql
-- La Liga Teams
INSERT INTO teams (api_sports_id, name, short_name, stadium, city) VALUES
(529, 'FC Barcelona', 'BAR', 'Camp Nou', 'Barcelona'),
(541, 'Real Madrid', 'RMA', 'Santiago Bernabéu', 'Madrid'),
(530, 'Atlético Madrid', 'ATM', 'Cívitas Metropolitano', 'Madrid');
```

### Step 3: Test Connection
```bash
npm run db:test:quick
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify `.env.supabase` contains correct credentials
   - Check Supabase project is active

2. **Permission Denied**
   - Ensure you're using the service role key for admin operations
   - Check RLS policies are not blocking access

3. **Table Not Found**
   - Confirm tables were created successfully
   - Check table names match exactly (case-sensitive)

### Verification Commands

```bash
# Test database connection
npm run db:test:quick

# Full test suite
npm run db:test

# Check API endpoints
curl http://localhost:3000/api/database/test
```

## Next Steps After Setup

1. **Start the server**: `npm run dev`
2. **Test API endpoints**: Visit `http://localhost:3000/api/database/test`
3. **Import La Liga data**: Use the API-Sports integration
4. **Set up content workflows**: Configure n8n MCP integration

## Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify environment variables
3. Test individual SQL statements
4. Review the full schema file for syntax errors