# Fantasy La Liga - Supabase Database Setup Instructions

## 🎯 Objective
Initialize the complete Supabase database schema for the Fantasy La Liga project with all tables, indexes, views, and functions.

## 📋 Setup Summary

### Environment Configuration ✅
- **Supabase Project URL**: `https://ixfowlkuypnfbrwawxlx.supabase.co`
- **Environment file**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/.env.supabase`
- **Credentials**: ✅ Properly configured

### Database Schema Details
- **Schema file**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/database/supabase-schema.sql`
- **Size**: 28,946 characters
- **Tables**: 20 core tables
- **Indexes**: 50+ optimized indexes
- **Views**: 3 performance views
- **Functions**: 2 utility functions

## 🚀 Database Initialization Steps

### Step 1: Access Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your account
3. Navigate to your project: **ixfowlkuypnfbrwawxlx**

### Step 2: Open SQL Editor
1. In the left sidebar, click on **SQL Editor**
2. Click **New Query** to create a new SQL script

### Step 3: Execute Schema
1. Copy the complete content from: `/Users/fran/Desktop/CURSOR/Fantasy la liga/database/supabase-schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the schema

### Step 4: Verify Installation
Run this verification script to check if everything was created properly:

```bash
cd "/Users/fran/Desktop/CURSOR/Fantasy la liga"
node scripts/verify-database.js
```

## 📊 Expected Database Structure

### Core La Liga Tables
- **teams**: La Liga team data (20 teams seeded)
- **players**: Player information and Fantasy stats
- **matches**: Match fixtures and results
- **player_stats**: Individual match performance
- **fantasy_points**: Calculated Fantasy points

### Content Management Tables
- **content_plans**: AI-generated content strategies
- **social_posts**: Instagram/social media posts
- **workflows**: n8n automation tracking
- **api_requests**: Rate limiting and monitoring

### User Management Tables (Future)
- **users**: Fantasy managers
- **user_teams**: User Fantasy squads
- **transfers**: Transfer history

### Performance Views
- **current_gameweek_performance**: Latest player stats
- **top_performers_by_position**: Best players by position
- **content_performance**: Social media analytics

## 🔧 Database Features

### Automatic Features
- **Updated timestamps**: All tables auto-update `updated_at`
- **Fantasy points calculation**: SQL function for point calculation
- **Row Level Security**: User data protection
- **Comprehensive indexing**: Optimized for performance

### Initial Data
- ✅ 20 La Liga teams pre-seeded
- ✅ Sample content plans for testing
- ✅ All team logos and stadium information

## 🔍 Verification Checklist

After running the schema, verify these elements exist:

### Tables (20 total)
- [ ] teams
- [ ] players
- [ ] matches
- [ ] player_stats
- [ ] fantasy_points
- [ ] content_plans
- [ ] social_posts
- [ ] workflows
- [ ] api_requests
- [ ] users
- [ ] user_teams
- [ ] transfers

### Views (3 total)
- [ ] current_gameweek_performance
- [ ] top_performers_by_position
- [ ] content_performance

### Functions (2 total)
- [ ] update_updated_at_column()
- [ ] calculate_fantasy_points()

### Initial Data
- [ ] 20 teams in `teams` table
- [ ] 3 sample content plans
- [ ] Proper indexes and constraints

## 🚦 Status Indicators

### ✅ Ready for Use
- Database schema contains all required tables
- Indexes are properly created
- Initial data is seeded
- Views and functions work correctly

### ⚠️ Needs Manual Setup
- Schema must be executed via Supabase SQL Editor
- Direct PostgreSQL connection not available (normal for managed database)

### ❌ Issues to Resolve
- None expected if schema is executed properly

## 🔄 Next Steps After Database Setup

1. **Test API endpoints**: Verify Fantasy La Liga backend can connect
2. **Seed player data**: Import current La Liga players via API-Sports
3. **Test Fantasy calculations**: Verify point calculation accuracy
4. **Setup content automation**: Configure n8n workflows
5. **Enable HeyGen integration**: For AI avatar content creation

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the Dashboard
2. Verify all environment variables are set
3. Ensure service role key has proper permissions
4. Review SQL execution results for errors

## 🔗 Related Files

- **Main schema**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/database/supabase-schema.sql`
- **Environment config**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/.env.supabase`
- **Project docs**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/CLAUDE.md`
- **Backend server**: `/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/server.js`