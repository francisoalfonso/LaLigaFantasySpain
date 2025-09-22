# La Liga Supabase Sync Workflow - Testing Procedures

## Overview

This document provides comprehensive testing procedures to validate the La Liga data sync workflow before deploying to production. Follow these tests sequentially to ensure all components function correctly.

## Pre-Testing Checklist

Before running any tests, verify:

- [ ] n8n workflow imported successfully
- [ ] All credentials configured (Supabase, API-Sports)
- [ ] Environment variables set correctly
- [ ] Database schema deployed to Supabase
- [ ] API-Sports subscription active and valid

## Test Suite 1: Environment Validation

### Test 1.1: API-Sports Connection
**Objective**: Verify API-Sports credentials and connectivity

**Steps**:
1. Create a simple test workflow with HTTP Request node
2. Configure request to `https://v3.football.api-sports.io/status`
3. Add headers:
   ```
   X-RapidAPI-Key: {{ $vars.API_FOOTBALL_KEY }}
   X-RapidAPI-Host: v3.football.api-sports.io
   ```
4. Execute the test

**Expected Result**:
```json
{
  "response": {
    "account": {
      "firstname": "Your Name",
      "lastname": "Your Lastname",
      "email": "your@email.com"
    },
    "subscription": {
      "plan": "Ultra",
      "end": "2025-12-31",
      "active": true
    },
    "requests": {
      "current": 42,
      "limit_day": 75000
    }
  }
}
```

**Validation**:
- [ ] Response status code: 200
- [ ] Subscription active: true
- [ ] Plan: "Ultra" (or your subscribed plan)
- [ ] Daily limit appropriate for your plan

### Test 1.2: Supabase Connection
**Objective**: Verify Supabase database connectivity and permissions

**SQL Test Query**:
```sql
-- Run this in Supabase SQL Editor
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'players', 'matches', 'workflows', 'api_requests')
ORDER BY tablename;
```

**Expected Result**:
```
schemaname | tablename     | tableowner
-----------+---------------+------------
public     | api_requests  | postgres
public     | matches       | postgres
public     | players       | postgres
public     | teams         | postgres
public     | workflows     | postgres
```

**Validation**:
- [ ] All 5 required tables present
- [ ] Tables owned by postgres user
- [ ] No permission errors

### Test 1.3: Rate Limiting Validation
**Objective**: Verify rate limiting configuration

**Test Script** (run in n8n Code node):
```javascript
const startTime = Date.now();

// Simulate API calls with rate limiting
for (let i = 0; i < 3; i++) {
  const callStart = Date.now();

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const callEnd = Date.now();
  console.log(`Call ${i + 1}: ${callEnd - callStart}ms`);
}

const totalTime = Date.now() - startTime;
console.log(`Total time: ${totalTime}ms`);

return [{ json: { total_time_ms: totalTime, expected_min: 3000 } }];
```

**Expected Result**:
- Each call should take ~1000ms
- Total time should be ~3000ms
- Rate limiting working correctly

## Test Suite 2: Data Extraction Testing

### Test 2.1: Teams Data Extraction
**Objective**: Test API-Sports teams endpoint and data transformation

**Manual Test URL**:
```
GET https://v3.football.api-sports.io/teams?league=140&season=2025
```

**Test in n8n**:
1. Create isolated workflow with just the teams extraction nodes:
   - HTTP Request (Fetch Teams)
   - Code (Transform Teams)
   - Set (Display Results)

2. Execute and verify output

**Expected Output Structure**:
```json
{
  "api_sports_id": 529,
  "name": "FC Barcelona",
  "short_name": "BAR",
  "logo_url": "https://media.api-sports.io/football/teams/529.png",
  "stadium": "Camp Nou",
  "city": "Barcelona",
  "founded": 1899,
  "colors": {
    "primary": "#004D98",
    "secondary": "#FCBF49"
  },
  "national": true,
  "is_active": true
}
```

**Validation Checklist**:
- [ ] All 20 La Liga teams extracted
- [ ] Required fields populated (name, api_sports_id)
- [ ] Optional fields handled gracefully (founded, colors)
- [ ] Data types correct (integers, strings, booleans)
- [ ] No null values in required fields

### Test 2.2: Players Data Extraction
**Objective**: Test players endpoint and position mapping

**Manual Test URL**:
```
GET https://v3.football.api-sports.io/players?league=140&season=2025&page=1
```

**Position Mapping Test**:
```javascript
// Test position mapping logic
const testPositions = [
  { api: "Goalkeeper", expected: "GK" },
  { api: "Defender", expected: "DEF" },
  { api: "Centre-Back", expected: "DEF" },
  { api: "Left-Back", expected: "DEF" },
  { api: "Right-Back", expected: "DEF" },
  { api: "Midfielder", expected: "MID" },
  { api: "Central Midfielder", expected: "MID" },
  { api: "Defensive Midfielder", expected: "MID" },
  { api: "Attacking Midfielder", expected: "MID" },
  { api: "Attacker", expected: "FWD" },
  { api: "Centre-Forward", expected: "FWD" },
  { api: "Left Winger", expected: "FWD" },
  { api: "Right Winger", expected: "FWD" }
];

// Test each mapping
testPositions.forEach(test => {
  const result = mapPosition(test.api);
  console.log(`${test.api} -> ${result} (expected: ${test.expected})`);
});
```

**Expected Results**:
- [ ] ~500+ players extracted
- [ ] All positions mapped correctly
- [ ] Team IDs properly linked
- [ ] Player stats included where available

### Test 2.3: Fixtures Data Extraction
**Objective**: Test fixtures endpoint and status mapping

**Manual Test URL**:
```
GET https://v3.football.api-sports.io/fixtures?league=140&season=2025
```

**Status Mapping Test**:
```javascript
const testStatuses = [
  { api: "NS", expected: "scheduled" },
  { api: "1H", expected: "live" },
  { api: "HT", expected: "live" },
  { api: "2H", expected: "live" },
  { api: "FT", expected: "finished" },
  { api: "PST", expected: "postponed" },
  { api: "CANC", expected: "cancelled" }
];
```

**Expected Results**:
- [ ] ~380 fixtures extracted (full season)
- [ ] All statuses mapped correctly
- [ ] Gameweek extraction from round string
- [ ] Proper date format conversion

## Test Suite 3: Database Integration Testing

### Test 3.1: Teams Upsert Testing
**Objective**: Test team data insertion and updates

**Test Steps**:
1. Clear teams table: `DELETE FROM teams WHERE api_sports_id = 999;`
2. Insert test team via workflow
3. Verify insertion
4. Update test team data
5. Verify upsert behavior

**Test Data**:
```sql
-- Verify test team insertion
SELECT * FROM teams WHERE api_sports_id = 529; -- Barcelona

-- Check upsert functionality
UPDATE teams SET name = 'TEST UPDATE' WHERE api_sports_id = 529;
-- Run workflow again, verify name reverts to correct value
```

**Validation**:
- [ ] New teams inserted correctly
- [ ] Existing teams updated (not duplicated)
- [ ] All required fields populated
- [ ] Timestamps updated correctly

### Test 3.2: Players Upsert Testing
**Objective**: Test player data insertion with team relationships

**Test Steps**:
1. Verify team relationships:
   ```sql
   SELECT p.name, t.name as team_name
   FROM players p
   JOIN teams t ON p.team_id = t.id
   WHERE p.api_sports_id IN (276, 874, 901) -- Messi, Benzema, Lewandowski
   ```

2. Test position distribution:
   ```sql
   SELECT position, COUNT(*) as player_count
   FROM players
   WHERE is_active = true
   GROUP BY position
   ORDER BY player_count DESC;
   ```

**Expected Results**:
```
position | player_count
---------+-------------
DEF      | ~150-200
MID      | ~150-200
FWD      | ~100-150
GK       | ~40-60
```

**Validation**:
- [ ] All players linked to correct teams
- [ ] Position distribution reasonable
- [ ] No orphaned players (team_id = null)
- [ ] Fantasy prices within valid range (0-15)

### Test 3.3: Fixtures Upsert Testing
**Objective**: Test match data insertion with team relationships

**Test Query**:
```sql
-- Verify match relationships
SELECT
  m.id,
  ht.name as home_team,
  at.name as away_team,
  m.match_date,
  m.status,
  m.gameweek
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE m.season = 2025
ORDER BY m.match_date DESC
LIMIT 10;
```

**Validation**:
- [ ] All matches have valid team references
- [ ] Dates in correct format and timezone
- [ ] Gameweeks correctly extracted
- [ ] No missing team relationships

## Test Suite 4: Workflow Execution Testing

### Test 4.1: Full Workflow Manual Execution
**Objective**: Test complete workflow end-to-end

**Steps**:
1. Clear test data:
   ```sql
   DELETE FROM workflows WHERE workflow_name = 'La Liga Data Sync to Supabase';
   DELETE FROM api_requests WHERE api_provider = 'api-sports';
   ```

2. Execute workflow manually in n8n
3. Monitor execution progress
4. Verify completion

**Performance Expectations**:
- Total execution time: 5-10 minutes
- API requests: ~5-10 calls
- Data processed: 20 teams, 500+ players, 380+ fixtures

**Validation Queries**:
```sql
-- Check workflow execution log
SELECT *
FROM workflows
WHERE workflow_name = 'La Liga Data Sync to Supabase'
ORDER BY started_at DESC
LIMIT 1;

-- Check API request logs
SELECT
  endpoint,
  COUNT(*) as request_count,
  AVG(response_time_ms) as avg_response_time,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests
FROM api_requests
WHERE api_provider = 'api-sports'
  AND requested_at >= NOW() - INTERVAL '1 hour'
GROUP BY endpoint;

-- Check data freshness
SELECT
  'teams' as table_name,
  COUNT(*) as records,
  MAX(updated_at) as last_update
FROM teams
WHERE is_active = true
UNION ALL
SELECT
  'players' as table_name,
  COUNT(*) as records,
  MAX(updated_at) as last_update
FROM players
WHERE is_active = true
UNION ALL
SELECT
  'matches' as table_name,
  COUNT(*) as records,
  MAX(updated_at) as last_update
FROM matches
WHERE season = 2025;
```

### Test 4.2: Webhook Trigger Testing
**Objective**: Test webhook-based execution

**Test Command**:
```bash
curl -X POST "https://your-n8n-instance.com/webhook/laliga-sync-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_source": "test",
    "test_mode": true
  }'
```

**Expected Response**:
```json
{
  "status": "success",
  "message": "La Liga data sync completed successfully",
  "execution_id": "n8n_execution_id_here",
  "duration_seconds": 420,
  "data_processed": {
    "teams_processed": 20,
    "players_processed": 567,
    "fixtures_processed": 380
  },
  "timestamp": "2025-01-20T10:30:00Z"
}
```

**Validation**:
- [ ] Webhook responds with 200 status
- [ ] Execution completes successfully
- [ ] Response includes execution details
- [ ] Data updated in database

### Test 4.3: Scheduled Execution Testing
**Objective**: Test cron-based scheduled execution

**Setup**:
1. Temporarily set schedule to run in 2 minutes
2. Monitor execution
3. Reset to original schedule

**Test Schedule**:
```json
{
  "rule": {
    "interval": [
      {
        "triggerAtHour": "*",
        "triggerAtMinute": "*/2"
      }
    ]
  }
}
```

**Validation**:
- [ ] Workflow executes at scheduled time
- [ ] Execution logs recorded
- [ ] No manual intervention required

## Test Suite 5: Error Handling Testing

### Test 5.1: API Error Simulation
**Objective**: Test workflow behavior with API failures

**Test Steps**:
1. Temporarily use invalid API key
2. Execute workflow
3. Verify error handling

**Expected Behavior**:
- Workflow logs error to `workflows` table
- Error response returned via webhook
- No partial data corruption
- Retry logic triggered

### Test 5.2: Database Error Simulation
**Objective**: Test workflow behavior with database failures

**Test Steps**:
1. Temporarily revoke Supabase permissions
2. Execute workflow
3. Verify error handling

**Expected Behavior**:
- Database errors caught and logged
- Workflow fails gracefully
- No data inconsistency

### Test 5.3: Rate Limiting Testing
**Objective**: Test behavior when API rate limits hit

**Simulation**:
Run multiple workflows simultaneously to hit rate limits

**Expected Behavior**:
- Requests delayed appropriately
- No 429 errors in logs
- Workflow completes successfully

## Test Suite 6: Data Quality Validation

### Test 6.1: Data Completeness Check
**Objective**: Verify all expected data is present

**Validation Queries**:
```sql
-- Expected team count
SELECT COUNT(*) as team_count FROM teams WHERE is_active = true;
-- Should be 20

-- Expected player count range
SELECT COUNT(*) as player_count FROM players WHERE is_active = true;
-- Should be 400-700

-- Expected fixture count
SELECT COUNT(*) as fixture_count FROM matches WHERE season = 2025;
-- Should be 380

-- Check for missing data
SELECT
  'teams_without_logo' as issue,
  COUNT(*) as count
FROM teams
WHERE logo_url IS NULL OR logo_url = ''
UNION ALL
SELECT
  'players_without_position' as issue,
  COUNT(*) as count
FROM players
WHERE position IS NULL
UNION ALL
SELECT
  'matches_without_teams' as issue,
  COUNT(*) as count
FROM matches
WHERE home_team_id IS NULL OR away_team_id IS NULL;
```

### Test 6.2: Data Consistency Check
**Objective**: Verify data relationships and integrity

**Validation Queries**:
```sql
-- Check player-team relationships
SELECT
  'orphaned_players' as issue,
  COUNT(*) as count
FROM players p
LEFT JOIN teams t ON p.team_id = t.id
WHERE t.id IS NULL AND p.is_active = true;

-- Check match-team relationships
SELECT
  'invalid_match_teams' as issue,
  COUNT(*) as count
FROM matches m
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = m.home_team_id)
   OR NOT EXISTS (SELECT 1 FROM teams WHERE id = m.away_team_id);

-- Check position distribution
SELECT
  position,
  COUNT(*) as player_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM players
WHERE is_active = true
GROUP BY position
ORDER BY player_count DESC;
```

### Test 6.3: Data Freshness Check
**Objective**: Verify data is recent and up-to-date

**Validation Queries**:
```sql
-- Check last update times
SELECT
  table_name,
  last_update,
  EXTRACT(EPOCH FROM (NOW() - last_update)) / 3600 as hours_since_update
FROM (
  SELECT 'teams' as table_name, MAX(updated_at) as last_update FROM teams
  UNION ALL
  SELECT 'players' as table_name, MAX(updated_at) as last_update FROM players
  UNION ALL
  SELECT 'matches' as table_name, MAX(updated_at) as last_update FROM matches
) t
ORDER BY hours_since_update;

-- Should all be less than 24 hours for daily sync
```

## Test Results Documentation

### Test Execution Log Template

```markdown
## Test Execution Report

**Date**: 2025-01-20
**Tester**: Your Name
**Environment**: Production/Staging
**Workflow Version**: 1.0

### Test Results Summary
- Total Tests: 18
- Passed: 16
- Failed: 2
- Skipped: 0

### Failed Tests
1. **Test 5.1: API Error Simulation**
   - Issue: Error response not properly formatted
   - Impact: Low
   - Resolution: Update error response node

2. **Test 6.2: Data Consistency Check**
   - Issue: 3 orphaned players found
   - Impact: Medium
   - Resolution: Fix team mapping logic

### Performance Metrics
- Full workflow execution: 8 minutes 32 seconds
- API response times: Avg 1.2s
- Database operations: Avg 0.3s

### Recommendations
1. Optimize player transformation logic
2. Add additional error handling for edge cases
3. Implement data validation webhooks
```

## Continuous Testing

### Automated Test Schedule
- **Daily**: Basic connectivity tests
- **Weekly**: Full data quality validation
- **Monthly**: Performance benchmarking
- **Quarterly**: Error handling validation

### Monitoring Alerts
Set up alerts for:
- Workflow execution failures
- Data quality issues
- API rate limit violations
- Performance degradation

## Next Steps

After successful testing:
1. Deploy to production environment
2. Set up monitoring dashboards
3. Configure alerting
4. Document operational procedures
5. Schedule regular maintenance windows