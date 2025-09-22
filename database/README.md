# Fantasy La Liga - Supabase Database

Complete database implementation for the Fantasy La Liga project using Supabase as the backend database solution.

## 📋 Overview

This database schema supports:
- **Real-time La Liga data** from API-Sports
- **Fantasy points calculation** based on official rules
- **Content generation and automation** workflows
- **Social media post management**
- **User management** for future expansion
- **API request tracking** and rate limiting
- **n8n workflow integration**

## 🗄️ Database Structure

### Core La Liga Tables
- **`teams`** - La Liga teams data (20 teams)
- **`players`** - All La Liga players with fantasy data
- **`matches`** - Match fixtures and results
- **`player_stats`** - Player performance stats per match
- **`fantasy_points`** - Calculated fantasy points per player/gameweek

### Content Management Tables
- **`content_plans`** - AI-generated content plans
- **`social_posts`** - Social media posts (Instagram, Twitter, etc.)
- **`workflows`** - n8n workflow execution tracking
- **`api_requests`** - API usage and rate limiting

### User Management Tables (Future)
- **`users`** - Fantasy managers
- **`user_teams`** - User fantasy teams
- **`transfers`** - Transfer history

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment

Create `.env.supabase` with your Supabase credentials:

```bash
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Initialize Database

```bash
# Install schema and initial data
npm run db:init

# Test database connection
npm run db:test

# Quick connection test
npm run db:test:quick
```

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Initialize DB | `npm run db:init` | Create all tables, indexes, functions |
| Test DB | `npm run db:test` | Run comprehensive test suite |
| Quick Test | `npm run db:test:quick` | Quick connection test only |
| Migrate | `npm run db:migrate` | Alias for db:init |

## 📊 Database Schema Details

### Fantasy Points System

Based on official La Liga Fantasy rules:

```javascript
// All positions
MATCH_PLAYED: +2 points (60+ minutes)
ASSIST: +3 points
YELLOW_CARD: -1 point
RED_CARD: -3 points

// Goals by position
GOALKEEPER: +10 points
DEFENDER: +6 points
MIDFIELDER: +5 points
FORWARD: +4 points

// Goalkeeper specific
CLEAN_SHEET: +4 points
PENALTY_SAVED: +5 points
GOAL_CONCEDED: -1 point

// Defender specific
CLEAN_SHEET: +4 points
GOALS_CONCEDED: -0.5 points (per 2 goals)
```

### Key Indexes

Performance-optimized indexes for:
- Player searches by team/position/price
- Fantasy points by gameweek
- Match data by date/status
- Content plans by date/status
- API requests for rate limiting

### Views

Pre-built views for common queries:
- `current_gameweek_performance` - Latest gameweek top performers
- `top_performers_by_position` - Best players by position
- `content_performance` - Content engagement metrics

## 🔧 API Endpoints

### Database Management
- `GET /api/database/test` - Test connection
- `GET /api/database/stats` - Database statistics
- `GET /api/database/config` - Configuration info

### Data Access
- `GET /api/database/teams` - All La Liga teams
- `GET /api/database/players?position=FWD&max_price=10` - Players with filters
- `GET /api/database/fantasy-points?gameweek=1` - Fantasy points data
- `GET /api/database/top-performers?position=FWD&limit=10` - Top performers
- `GET /api/database/current-gameweek` - Current gameweek performance

### Content Management
- `GET /api/database/content-plans?status=draft&limit=20` - Content plans
- `GET /api/database/social-posts?platform=instagram` - Social posts
- `GET /api/database/content-performance` - Content metrics

### Monitoring
- `GET /api/database/workflows?status=success&limit=20` - Workflow executions
- `GET /api/database/api-stats?provider=api-sports&hours=24` - API statistics

## 🔒 Security Features

### Row Level Security (RLS)
- **User data** - Users can only access their own data
- **Public data** - Teams, players, matches are publicly readable
- **Content data** - Read access for all, write access for service role

### Authentication
- **Anonymous access** for public data
- **Service role** for administrative operations
- **User authentication** for personal data (future)

## 📈 Performance Optimizations

### Indexing Strategy
- **Primary keys** on all tables
- **Foreign key indexes** for joins
- **Composite indexes** for common query patterns
- **GIN indexes** for JSONB columns
- **Text search indexes** for player/team names

### Query Optimization
- **View materialization** for complex queries
- **Selective column loading** in API responses
- **Pagination** support for large datasets
- **Connection pooling** through Supabase

## 🧪 Testing

### Test Coverage
- ✅ Database connection
- ✅ Table creation and access
- ✅ Data insertion/updating
- ✅ Fantasy points calculation
- ✅ Content management
- ✅ Workflow logging
- ✅ API request tracking
- ✅ Row Level Security
- ✅ Database views
- ✅ Performance functions

### Running Tests

```bash
# Full test suite
npm run db:test

# Quick connection test
npm run db:test:quick

# Manual testing
node database/test-database.js --help
```

## 📦 Data Migration

### Initial Data Seeding
The schema includes seeded data for:
- All 20 La Liga teams (2024-25 season)
- Sample content plans for testing
- Basic configuration data

### API-Sports Integration
Use the included functions to sync data:

```javascript
const { upsertTeam, upsertPlayer, insertMatch } = require('./backend/config/supabase');

// Sync team data from API-Sports
await upsertTeam({
  api_sports_id: 529,
  name: 'FC Barcelona',
  // ... other team data
});
```

## 🔄 Workflow Integration

### n8n MCP Support
- Workflow execution logging
- Result tracking and error handling
- Performance monitoring
- Automated content generation

### Content Automation
- AI-generated content plans
- Social media post scheduling
- Performance tracking
- Engagement metrics

## 🚨 Error Handling

### Database Errors
- Connection failures gracefully handled
- Transaction rollback on errors
- Detailed error logging
- Health monitoring endpoints

### Data Validation
- Schema constraints enforcement
- Foreign key relationships
- Check constraints for data integrity
- Input sanitization

## 📚 Next Steps

### Data Population
1. **Import La Liga teams** from API-Sports
2. **Sync player data** regularly
3. **Set up match fixtures** for current season
4. **Initialize content generation** workflows

### Advanced Features
1. **User authentication** system
2. **Real-time subscriptions** for live data
3. **Advanced analytics** dashboard
4. **Machine learning** model integration

## 🔗 Related Files

- **Schema**: `database/supabase-schema.sql`
- **Initialization**: `database/init-database.js`
- **Testing**: `database/test-database.js`
- **Client Config**: `backend/config/supabase.js`
- **API Routes**: `backend/routes/database.js`

## 📞 Support

For database-related issues:
1. Check the test suite output
2. Review Supabase dashboard logs
3. Verify environment variables
4. Test API endpoint responses

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Initial data seeded
- [ ] Tests passing
- [ ] API endpoints tested
- [ ] RLS policies verified
- [ ] Performance indexes created
- [ ] Monitoring configured