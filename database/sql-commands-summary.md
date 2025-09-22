# Fantasy La Liga Database - SQL Commands Summary

This document contains all the SQL commands created for the Fantasy La Liga Supabase database.

## Complete Database Schema

The complete schema is located in `/database/supabase-schema.sql` with:

### 📊 Database Statistics
- **Total Tables**: 20
- **Core La Liga Tables**: 5 (teams, players, matches, player_stats, fantasy_points)
- **Content Management Tables**: 4 (content_plans, social_posts, workflows, api_requests)
- **User Management Tables**: 3 (users, user_teams, transfers)
- **Indexes**: 50+
- **Views**: 3
- **Functions**: 2
- **Triggers**: 11

### 🔧 Key Features Implemented

1. **Real-time La Liga Data Support**
   - Teams and players from API-Sports
   - Match fixtures and results
   - Player statistics per match
   - Fantasy points calculation

2. **Content Automation**
   - AI-generated content plans
   - Social media post management
   - Workflow execution tracking
   - API request monitoring

3. **Performance Optimizations**
   - Comprehensive indexing strategy
   - Database views for common queries
   - JSONB support for flexible data
   - Text search capabilities

4. **Security Features**
   - Row Level Security (RLS) policies
   - User data protection
   - Service role access control

## 🚀 Quick Setup Commands

### Option 1: Full Schema (Recommended)
```sql
-- Copy and paste the entire content from:
-- /database/supabase-schema.sql
-- Into the Supabase SQL Editor and execute
```

### Option 2: Core Tables Only
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Core teams table
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

-- Core players table
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    fantasy_price DECIMAL(4,1) DEFAULT 5.0,
    ownership_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL,
    season INTEGER NOT NULL DEFAULT 2025,
    gameweek INTEGER,
    home_team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fantasy points table
CREATE TABLE fantasy_points (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    final_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, match_id)
);

-- Content plans table
CREATE TABLE content_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essential indexes
CREATE INDEX idx_teams_api_sports_id ON teams(api_sports_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_matches_gameweek ON matches(gameweek);
CREATE INDEX idx_fantasy_points_gameweek ON fantasy_points(gameweek);
```

### Initial Data Seeding
```sql
-- Insert La Liga teams
INSERT INTO teams (api_sports_id, name, short_name, stadium, city) VALUES
(529, 'FC Barcelona', 'BAR', 'Camp Nou', 'Barcelona'),
(541, 'Real Madrid', 'RMA', 'Santiago Bernabéu', 'Madrid'),
(530, 'Atlético Madrid', 'ATM', 'Cívitas Metropolitano', 'Madrid'),
(532, 'Valencia', 'VAL', 'Mestalla', 'Valencia'),
(533, 'Villarreal', 'VIL', 'Estadio de la Cerámica', 'Villarreal'),
(548, 'Real Sociedad', 'RSO', 'Reale Arena', 'San Sebastián'),
(531, 'Athletic Bilbao', 'ATH', 'San Mamés', 'Bilbao'),
(536, 'Sevilla', 'SEV', 'Ramón Sánchez-Pizjuán', 'Sevilla'),
(542, 'Real Betis', 'BET', 'Benito Villamarín', 'Sevilla'),
(546, 'Getafe', 'GET', 'Coliseum', 'Getafe'),
(727, 'Osasuna', 'OSA', 'El Sadar', 'Pamplona'),
(539, 'Celta Vigo', 'CEL', 'Abanca-Balaídos', 'Vigo'),
(540, 'Espanyol', 'ESP', 'RCDE Stadium', 'Barcelona'),
(538, 'Cádiz', 'CAD', 'Nuevo Mirandilla', 'Cádiz'),
(547, 'Girona', 'GIR', 'Montilivi', 'Girona'),
(543, 'Real Valladolid', 'VLL', 'José Zorrilla', 'Valladolid'),
(715, 'Rayo Vallecano', 'RAY', 'Vallecas', 'Madrid'),
(728, 'UD Almería', 'ALM', 'Mediterráneo', 'Almería'),
(549, 'UD Las Palmas', 'LPA', 'Gran Canaria', 'Las Palmas'),
(544, 'Mallorca', 'MLL', 'Visit Mallorca Estadi', 'Palma');

-- Sample content plans
INSERT INTO content_plans (plan_type, title, description, target_date, status) VALUES
('daily', 'Análisis diario Fantasy La Liga', 'Repaso de los mejores picks del día', CURRENT_DATE, 'draft'),
('weekly', 'Recomendaciones semanales', 'Los mejores fichajes para la jornada', CURRENT_DATE + INTERVAL '1 day', 'draft');
```

## 🧪 Testing and Verification

### After running the SQL commands, test with:

```bash
# Test database connection
npm run db:test:quick

# Full test suite
npm run db:test

# Check API endpoints
curl http://localhost:3000/api/database/test
curl http://localhost:3000/api/database/teams
```

## 📁 File Structure Created

```
database/
├── supabase-schema.sql          # Complete database schema
├── init-database.js             # Node.js initialization script
├── test-database.js             # Comprehensive test suite
├── setup-instructions.md        # Manual setup guide
├── sql-commands-summary.md      # This file
└── README.md                    # Complete documentation

backend/config/
└── supabase.js                  # Supabase client configuration

backend/routes/
└── database.js                  # Database API routes
```

## 🔍 Key Functions and Utilities

### Fantasy Points Calculation
```sql
-- Function to calculate fantasy points
SELECT calculate_fantasy_points(
    'FWD',          -- position
    2,              -- goals
    1,              -- assists
    90,             -- minutes
    0,              -- yellow_cards
    0,              -- red_cards
    0,              -- saves
    0,              -- goals_conceded
    0,              -- penalties_saved
    false           -- clean_sheet
); -- Returns: 13 points (2 + 8 + 3)
```

### Database Views
```sql
-- Current gameweek top performers
SELECT * FROM current_gameweek_performance
ORDER BY total_points DESC LIMIT 10;

-- Top performers by position
SELECT * FROM top_performers_by_position
WHERE position = 'FWD' ORDER BY avg_points DESC;

-- Content performance metrics
SELECT * FROM content_performance
ORDER BY avg_engagement DESC;
```

## 🔗 Integration with Project

The database integrates with:

1. **API-Sports Data**: Automatic sync of La Liga data
2. **Fantasy Points System**: Official La Liga Fantasy rules
3. **Content Generation**: AI-powered content creation
4. **n8n Workflows**: Automation and scheduling
5. **Social Media**: Post management and analytics

## 📊 Production Checklist

- [ ] ✅ Schema deployed to Supabase
- [ ] ✅ Initial data seeded (La Liga teams)
- [ ] ✅ API endpoints configured
- [ ] ✅ Test suite passing
- [ ] ✅ Supabase client configured
- [ ] ✅ Environment variables set
- [ ] 🔄 Real-time data sync (pending API-Sports integration)
- [ ] 🔄 Content workflows active (pending n8n setup)

## 🎯 Next Steps

1. **Data Import**: Sync players and matches from API-Sports
2. **Content Generation**: Activate AI content workflows
3. **Real-time Updates**: Set up live data synchronization
4. **Performance Monitoring**: Implement analytics dashboard
5. **User Management**: Add authentication for fantasy teams

The database is now ready to support the complete Fantasy La Liga ecosystem!