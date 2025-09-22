# La Liga Data Sync - n8n Workflow Documentation

## 📋 Overview

This directory contains a production-ready n8n workflow that automatically syncs La Liga football data from API-Sports to your Supabase database. The workflow is designed to be the foundation for your Fantasy La Liga AI content generation system.

## 📁 Files Structure

```
n8n-workflows/
├── README.md                       # This documentation
├── laliga-supabase-sync.json      # Complete n8n workflow JSON
├── workflow-configuration-guide.md # Setup and configuration instructions
├── testing-procedures.md          # Comprehensive testing guide
└── claude-code-integration.md     # Dashboard integration guide
```

## 🚀 Quick Start

1. **Import Workflow**: Import `laliga-supabase-sync.json` into your n8n instance
2. **Configure Credentials**: Set up API-Sports and Supabase credentials
3. **Test Execution**: Run manual test execution
4. **Integrate Dashboard**: Follow integration guide for Claude Code dashboard
5. **Deploy**: Configure production schedule and monitoring

## 🔧 Workflow Features

### ✅ Data Synchronization
- **Teams**: All 20 La Liga teams with logos, stadiums, and metadata
- **Players**: 500+ players with positions, stats, and fantasy data
- **Fixtures**: Complete season fixtures with results and schedules
- **Match Stats**: Detailed match statistics and player performances

### ✅ Production Features
- **Rate Limiting**: 1-second delays between API calls (API-Sports compliant)
- **Error Handling**: Comprehensive retry logic and error logging
- **Data Transformation**: API-Sports data mapped to Supabase schema
- **Upsert Operations**: Smart insert/update logic prevents duplicates
- **Webhook Integration**: Status updates to Claude Code dashboard
- **Execution Logging**: Complete audit trail in Supabase

### ✅ Triggers
- **Scheduled**: Daily execution at 6 AM UTC (configurable)
- **Webhook**: Manual trigger from Claude Code dashboard
- **API**: REST API trigger for external systems

## 📊 Data Flow

```
API-Sports
    ↓ (HTTP Requests)
n8n Workflow
    ↓ (Data Transformation)
Supabase Database
    ↓ (Queries)
Claude Code Dashboard
    ↓ (AI Processing)
Content Generation
```

## 🔌 Integration Points

### API-Sports Integration
- **Endpoint**: `https://v3.football.api-sports.io`
- **Authentication**: X-RapidAPI-Key header
- **Rate Limit**: 75,000 requests/day (Ultra plan)
- **Data Sources**: Teams, Players, Fixtures, Statistics

### Supabase Integration
- **Database**: PostgreSQL with custom schema
- **Authentication**: Service Role Key
- **Tables**: teams, players, matches, workflows, api_requests
- **Features**: RLS policies, triggers, views, functions

### Claude Code Dashboard Integration
- **Webhook Triggers**: Manual sync execution
- **Status Updates**: Real-time workflow status
- **Monitoring**: Health checks and performance metrics
- **Alerts**: Error notifications and data quality alerts

## 📈 Performance Metrics

### Expected Performance
- **Execution Time**: 5-10 minutes (full sync)
- **API Calls**: ~5-10 requests per execution
- **Data Volume**: 20 teams, 500+ players, 380+ fixtures
- **Memory Usage**: <100MB during execution
- **Error Rate**: <1% (with proper API limits)

### Optimization Features
- **Batch Processing**: Efficient data transformation
- **Incremental Updates**: Upsert operations only update changed data
- **Parallel Processing**: Independent operations run in parallel
- **Caching**: API response caching where appropriate

## 🛡️ Security & Compliance

### Security Features
- **Credential Management**: Secure storage in n8n credentials
- **API Key Protection**: Environment variable storage
- **Database Security**: Service role key with limited permissions
- **Webhook Security**: Optional authentication on webhooks

### Data Privacy
- **GDPR Compliance**: Player data handling according to regulations
- **Data Retention**: Configurable data retention policies
- **Audit Logging**: Complete request and execution audit trail
- **Access Control**: Role-based access to sensitive operations

## 📋 Requirements

### Technical Requirements
- **n8n Instance**: Cloud or self-hosted (v0.235.0+)
- **API-Sports Subscription**: Ultra plan ($29/month) recommended
- **Supabase Project**: With Fantasy La Liga schema deployed
- **Node.js**: v16+ for Claude Code dashboard integration
- **Storage**: ~1GB for complete season data

### Account Requirements
- API-Sports account with active subscription
- Supabase account with project setup
- n8n cloud account or self-hosted instance
- Domain/hosting for Claude Code dashboard (optional)

## 🔧 Configuration

### Environment Variables
```bash
# API-Sports
API_FOOTBALL_KEY=your_api_sports_key

# Supabase
SUPABASE_PROJECT_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# n8n (for dashboard integration)
N8N_BASE_URL=your_n8n_instance_url
N8N_WEBHOOK_URL=your_webhook_url
N8N_API_TOKEN=your_n8n_token
```

### Workflow Configuration
- **League ID**: 140 (La Liga)
- **Season**: 2025 (configurable)
- **Schedule**: Daily at 6 AM UTC
- **Rate Limit**: 1000ms between requests
- **Timeout**: 30 seconds per request
- **Retries**: 3 attempts with exponential backoff

## 📊 Monitoring & Alerts

### Built-in Monitoring
- **Execution Logs**: All executions logged to `workflows` table
- **API Request Logs**: Rate limiting and performance tracking
- **Data Quality Checks**: Automated validation of synced data
- **Error Tracking**: Detailed error messages and stack traces

### Alert Conditions
- Workflow execution failures
- API rate limit violations
- Data quality issues (missing teams, players)
- Execution timeout (>15 minutes)
- Database connection failures

### Monitoring Endpoints
- `/api/n8n/health` - System health check
- `/api/n8n/sync-stats` - Data synchronization statistics
- `/api/n8n/recent-executions` - Recent workflow executions
- `/api/n8n/execution-status/:id` - Specific execution status

## 🧪 Testing

### Test Categories
1. **Unit Tests**: Individual node functionality
2. **Integration Tests**: End-to-end workflow execution
3. **Performance Tests**: Load and stress testing
4. **Data Quality Tests**: Validation of synced data
5. **Error Handling Tests**: Failure scenario testing

### Test Execution
```bash
# Manual workflow test
curl -X POST "https://your-n8n-instance.com/webhook/laliga-sync-webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Dashboard integration test
npm run test:integration

# Data validation test
npm run test:data-quality
```

## 🐛 Troubleshooting

### Common Issues

#### API-Sports Connection Failed
```bash
# Check API key validity
curl -H "X-RapidAPI-Key: YOUR_KEY" \
     "https://v3.football.api-sports.io/status"

# Verify rate limits
Check current usage in API-Sports dashboard
```

#### Supabase Connection Failed
```sql
-- Test database connectivity
SELECT NOW();

-- Check table existence
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

#### Data Transformation Errors
- Verify API response structure hasn't changed
- Check team ID mappings in database
- Validate position mapping logic

#### Performance Issues
- Check API response times
- Monitor database query performance
- Verify rate limiting configuration

### Debug Mode

Enable debug logging in any Code node:
```javascript
console.log('Debug:', JSON.stringify($input.all(), null, 2));
```

### Support Resources
- **n8n Documentation**: https://docs.n8n.io/
- **API-Sports Documentation**: https://www.api-sports.io/documentation/
- **Supabase Documentation**: https://supabase.com/docs
- **Project Issues**: Create issue in project repository

## 🔄 Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review execution logs and error rates
- **Monthly**: Update API-Sports quotas and limits
- **Quarterly**: Performance optimization and cleanup
- **Seasonally**: Update league configuration for new season

### Update Procedures
1. **Workflow Updates**: Import new workflow version
2. **Schema Changes**: Apply database migrations
3. **API Changes**: Update transformation logic
4. **Configuration Updates**: Update environment variables

### Backup Procedures
- **Database Backup**: Daily Supabase backups
- **Workflow Backup**: Export workflow JSON regularly
- **Configuration Backup**: Secure credential storage

## 🎯 Next Steps

### Phase 2: Enhanced Features
- **Player Statistics**: Detailed performance metrics
- **Historical Data**: Multi-season data import
- **Live Updates**: Real-time match data
- **Advanced Analytics**: Fantasy points calculation

### Phase 3: AI Integration
- **Content Generation**: Automated article creation
- **Player Analysis**: AI-powered insights
- **Prediction Models**: Fantasy performance predictions
- **Social Media**: Automated content posting

### Phase 4: Expansion
- **Multiple Leagues**: Premier League, Serie A, etc.
- **Mobile App**: React Native application
- **Public API**: Third-party integrations
- **White Label**: Customizable platform

## 📞 Support

For technical support:
1. Check troubleshooting section
2. Review execution logs in Supabase
3. Test individual workflow nodes
4. Contact project maintainers

For feature requests:
1. Submit enhancement proposal
2. Include use case and requirements
3. Provide technical specifications
4. Consider implementation complexity

---

**Created for Fantasy La Liga project**
**Version**: 1.0
**Last Updated**: January 2025
**Compatibility**: n8n v0.235.0+, Supabase PostgreSQL, API-Sports v3