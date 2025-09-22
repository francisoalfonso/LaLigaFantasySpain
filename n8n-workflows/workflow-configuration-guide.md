# La Liga Supabase Sync Workflow - Configuration Guide

## Overview

This n8n workflow automatically syncs La Liga data from API-Sports to your Supabase database. It's designed to run daily and can also be triggered manually via webhook.

## Prerequisites

Before importing this workflow, ensure you have:

1. **n8n instance** (cloud or self-hosted)
2. **API-Sports subscription** (Ultra plan recommended - 75,000 requests/day)
3. **Supabase project** with the Fantasy La Liga schema deployed
4. **Environment variables** properly configured

## Step 1: Environment Variables Setup

### 1.1 API-Sports Configuration

In your n8n instance, set up the following environment variables:

```bash
API_FOOTBALL_KEY=your_api_sports_key_here
```

**How to get API-Sports key:**
1. Go to [API-Sports.io](https://www.api-sports.io/)
2. Subscribe to Ultra plan ($29/month - 75,000 requests/day)
3. Get your API key from the dashboard
4. Add it to your n8n environment variables

### 1.2 Supabase Configuration

Set up your Supabase credentials in n8n:

```bash
SUPABASE_PROJECT_URL=https://ixfowlkuypnfbrwawxlx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Note:** Use the Service Role Key (not the anon key) for write operations.

## Step 2: n8n Credentials Setup

### 2.1 Create Supabase API Credential

1. In n8n, go to **Settings > Credentials**
2. Click **Add Credential**
3. Select **Supabase**
4. Configure:
   - **Name**: `supabase-credentials`
   - **Host**: `https://ixfowlkuypnfbrwawxlx.supabase.co`
   - **Service Role Secret**: Your Supabase service role key

### 2.2 Create HTTP Header Auth for API-Sports

1. In n8n, go to **Settings > Credentials**
2. Click **Add Credential**
3. Select **HTTP Header Auth**
4. Configure:
   - **Name**: `api-sports-auth`
   - **Header Name**: `X-RapidAPI-Key`
   - **Header Value**: Your API-Sports key

## Step 3: Import the Workflow

1. Download the workflow JSON file: `laliga-supabase-sync.json`
2. In n8n, go to **Workflows**
3. Click **Import from File**
4. Select the downloaded JSON file
5. The workflow will be imported with all nodes configured

## Step 4: Configure Workflow Variables

The workflow uses these key variables (already configured in the JSON):

```javascript
// API Configuration
api_sports_base_url: "https://v3.football.api-sports.io"
laliga_id: "140"          // La Liga league ID in API-Sports
current_season: "2025"    // Current season

// Rate Limiting
rate_limit_delay: 1000    // 1 second between requests
```

## Step 5: Webhook Configuration

### 5.1 Manual Trigger Webhook

The workflow includes a webhook trigger for manual execution:

- **Webhook URL**: `https://your-n8n-instance.com/webhook/laliga-sync-webhook`
- **Method**: POST
- **Authentication**: None (configure as needed)

### 5.2 Status Webhook (for Claude Code integration)

The workflow sends status updates to:

- **Endpoint**: `/laliga-sync-status`
- **Payload**:
```json
{
  "status": "success|error",
  "message": "Workflow completion message",
  "execution_id": "n8n_execution_id",
  "duration_seconds": 120,
  "data_processed": {
    "teams_processed": 20,
    "players_processed": 500,
    "fixtures_processed": 380
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

## Step 6: Schedule Configuration

The workflow is configured to run daily at 6:00 AM UTC. To modify:

1. Click on the **"Daily Schedule (6 AM)"** node
2. Modify the cron expression:
   - **Hour**: 6 (for 6 AM)
   - **Minute**: 0
   - **Timezone**: UTC (adjust as needed)

### Alternative Schedule Examples:

```javascript
// Every 6 hours
"0 */6 * * *"

// Twice daily (6 AM and 6 PM)
"0 6,18 * * *"

// Every weekday at 7 AM
"0 7 * * 1-5"
```

## Step 7: Error Handling Configuration

The workflow includes comprehensive error handling:

### 7.1 API Request Retries
- **Max retries**: 3
- **Wait between retries**: 1000ms
- **Timeout**: 30 seconds

### 7.2 Error Logging
All errors are logged to the `workflows` table in Supabase with:
- Error message
- Stack trace
- Execution details
- Timestamp

### 7.3 Rate Limiting
- 1-second delay between API requests
- Complies with API-Sports rate limits
- Prevents API quota exhaustion

## Step 8: Database Schema Validation

Ensure your Supabase database has these tables:

### Required Tables:
- `teams` - La Liga teams data
- `players` - Player information and stats
- `matches` - Fixture data and results
- `workflows` - Workflow execution logs
- `api_requests` - API request tracking

### Validation Query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('teams', 'players', 'matches', 'workflows', 'api_requests');
```

## Step 9: Testing the Workflow

### 9.1 Manual Test Execution

1. Open the workflow in n8n
2. Click **Execute Workflow**
3. Monitor the execution progress
4. Check Supabase tables for data

### 9.2 Webhook Test

```bash
curl -X POST https://your-n8n-instance.com/webhook/laliga-sync-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 9.3 Data Validation Queries

```sql
-- Check teams imported
SELECT COUNT(*) as teams_count FROM teams WHERE is_active = true;

-- Check players imported
SELECT COUNT(*) as players_count FROM players WHERE is_active = true;

-- Check recent workflow executions
SELECT * FROM workflows
WHERE workflow_name = 'La Liga Data Sync to Supabase'
ORDER BY started_at DESC
LIMIT 5;

-- Check API request logs
SELECT api_provider, endpoint, COUNT(*) as request_count,
       AVG(response_time_ms) as avg_response_time
FROM api_requests
WHERE requested_at >= NOW() - INTERVAL '1 day'
GROUP BY api_provider, endpoint;
```

## Step 10: Monitoring and Maintenance

### 10.1 Workflow Monitoring

Monitor these metrics in Supabase:

```sql
-- Daily execution success rate
SELECT
  DATE(started_at) as execution_date,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_executions,
  ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM workflows
WHERE workflow_name = 'La Liga Data Sync to Supabase'
  AND started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY execution_date DESC;
```

### 10.2 API Usage Monitoring

```sql
-- Daily API request usage
SELECT
  DATE(requested_at) as request_date,
  api_provider,
  COUNT(*) as request_count,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_requests
FROM api_requests
WHERE requested_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(requested_at), api_provider
ORDER BY request_date DESC;
```

### 10.3 Data Quality Checks

```sql
-- Check for missing team mappings
SELECT COUNT(*) as players_without_teams
FROM players
WHERE team_id IS NULL AND is_active = true;

-- Check for recent data updates
SELECT
  'teams' as table_name,
  MAX(updated_at) as last_update,
  COUNT(*) as record_count
FROM teams
UNION ALL
SELECT
  'players' as table_name,
  MAX(updated_at) as last_update,
  COUNT(*) as record_count
FROM players
UNION ALL
SELECT
  'matches' as table_name,
  MAX(updated_at) as last_update,
  COUNT(*) as record_count
FROM matches;
```

## Troubleshooting

### Common Issues:

1. **API-Sports Rate Limit Exceeded**
   - Solution: Increase delay between requests
   - Check current usage in API-Sports dashboard

2. **Supabase Connection Failed**
   - Verify service role key
   - Check database connectivity
   - Validate table schema

3. **Data Transformation Errors**
   - Check API response structure
   - Validate team ID mappings
   - Review position mapping logic

4. **Workflow Execution Timeout**
   - Increase node timeouts
   - Split large operations
   - Optimize database queries

### Debug Mode:

Enable debug logging by adding this to any Code node:

```javascript
console.log('Debug data:', JSON.stringify($input.all(), null, 2));
return $input.all();
```

## Security Considerations

1. **API Keys**: Store securely in n8n credentials, never in workflow JSON
2. **Database Access**: Use service role key with appropriate RLS policies
3. **Webhook Security**: Consider adding authentication to webhook endpoints
4. **Rate Limiting**: Respect API provider limits to avoid account suspension

## Performance Optimization

1. **Batch Processing**: Process data in batches for large datasets
2. **Selective Updates**: Only update changed records using upsert operations
3. **Index Optimization**: Ensure proper database indexes for fast queries
4. **Parallel Processing**: Consider parallel execution for independent operations

## Support and Maintenance

- **Logs Location**: Supabase `workflows` and `api_requests` tables
- **Monitoring Dashboard**: Use Supabase dashboard for real-time monitoring
- **Backup Strategy**: Regular database backups recommended
- **Update Schedule**: Weekly review of workflow performance and optimization