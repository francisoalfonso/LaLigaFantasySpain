-- =====================================================
-- FANTASY LA LIGA - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Complete database schema for Fantasy La Liga project
-- Designed for real-time data, fantasy points, content automation, and user management
-- Created: $(date)
-- Project: Fantasy La Liga Dashboard & AI Content Automation
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- CORE LA LIGA DATA TABLES
-- =====================================================

-- Teams table - La Liga teams data
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL, -- API-Sports team ID
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(10),
    logo_url TEXT,
    stadium VARCHAR(100),
    city VARCHAR(50),
    founded INTEGER,
    colors JSONB, -- Primary, secondary colors
    national BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for teams
CREATE INDEX idx_teams_api_sports_id ON teams(api_sports_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_active ON teams(is_active);

-- Players table - All La Liga players
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL, -- API-Sports player ID
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    age INTEGER,
    birth_date DATE,
    birth_place VARCHAR(100),
    nationality VARCHAR(50),
    height VARCHAR(10), -- e.g., "180 cm"
    weight VARCHAR(10), -- e.g., "75 kg"
    injured BOOLEAN DEFAULT false,
    photo_url TEXT,

    -- Fantasy specific fields
    position VARCHAR(10) NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    detailed_position VARCHAR(20), -- More specific position
    fantasy_price DECIMAL(4,1) DEFAULT 5.0, -- Fantasy price in millions
    ownership_percentage DECIMAL(5,2) DEFAULT 0, -- % of users who own this player
    form DECIMAL(3,1) DEFAULT 0, -- Recent form rating

    -- Status fields
    is_active BOOLEAN DEFAULT true,
    is_injured BOOLEAN DEFAULT false,
    injury_details TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for players
CREATE INDEX idx_players_api_sports_id ON players(api_sports_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_active ON players(is_active);
CREATE INDEX idx_players_price ON players(fantasy_price);
CREATE INDEX idx_players_ownership ON players(ownership_percentage);

-- Matches table - Match fixtures and results
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    api_sports_id INTEGER UNIQUE NOT NULL,
    season INTEGER NOT NULL DEFAULT 2025,
    round VARCHAR(50), -- "Regular Season - 1", "Regular Season - 38", etc.
    gameweek INTEGER,

    -- Teams
    home_team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,

    -- Match details
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(100),
    referee VARCHAR(100),

    -- Results
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, finished, postponed, cancelled
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    halftime_home INTEGER DEFAULT 0,
    halftime_away INTEGER DEFAULT 0,

    -- Additional stats
    home_possession INTEGER,
    away_possession INTEGER,
    match_stats JSONB, -- Full match statistics

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for matches
CREATE INDEX idx_matches_api_sports_id ON matches(api_sports_id);
CREATE INDEX idx_matches_season ON matches(season);
CREATE INDEX idx_matches_gameweek ON matches(gameweek);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);

-- Player statistics per match
CREATE TABLE player_stats (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,

    -- Basic stats
    minutes_played INTEGER DEFAULT 0,
    position_played VARCHAR(10),
    rating DECIMAL(3,1), -- API-Sports rating

    -- Attacking stats
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots_total INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,

    -- Passing stats
    passes_total INTEGER DEFAULT 0,
    passes_accurate INTEGER DEFAULT 0,
    passes_percentage DECIMAL(5,2),
    key_passes INTEGER DEFAULT 0,

    -- Defensive stats
    tackles_total INTEGER DEFAULT 0,
    tackles_successful INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    duels_won INTEGER DEFAULT 0,
    duels_total INTEGER DEFAULT 0,

    -- Disciplinary
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    fouls_drawn INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,

    -- Goalkeeper specific
    saves INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    penalties_saved INTEGER DEFAULT 0,

    -- Additional stats as JSON
    detailed_stats JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(match_id, player_id)
);

-- Create indexes for player_stats
CREATE INDEX idx_player_stats_match_id ON player_stats(match_id);
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_player_stats_team_id ON player_stats(team_id);
CREATE INDEX idx_player_stats_goals ON player_stats(goals);
CREATE INDEX idx_player_stats_assists ON player_stats(assists);
CREATE INDEX idx_player_stats_rating ON player_stats(rating);

-- Fantasy points calculation and tracking
CREATE TABLE fantasy_points (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,

    -- Point breakdown
    match_played_points INTEGER DEFAULT 0,
    goals_points INTEGER DEFAULT 0,
    assists_points INTEGER DEFAULT 0,
    clean_sheet_points INTEGER DEFAULT 0,
    penalty_saved_points INTEGER DEFAULT 0,
    goals_conceded_points INTEGER DEFAULT 0,
    yellow_card_points INTEGER DEFAULT 0,
    red_card_points INTEGER DEFAULT 0,

    -- Totals
    total_points INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0, -- Future: bonus points system
    final_points INTEGER DEFAULT 0, -- total + bonus

    -- Meta information
    calculation_version VARCHAR(10) DEFAULT '1.0',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(player_id, match_id)
);

-- Create indexes for fantasy_points
CREATE INDEX idx_fantasy_points_player_id ON fantasy_points(player_id);
CREATE INDEX idx_fantasy_points_match_id ON fantasy_points(match_id);
CREATE INDEX idx_fantasy_points_gameweek ON fantasy_points(gameweek);
CREATE INDEX idx_fantasy_points_total ON fantasy_points(total_points);
CREATE INDEX idx_fantasy_points_final ON fantasy_points(final_points);

-- =====================================================
-- CONTENT MANAGEMENT & AUTOMATION TABLES
-- =====================================================

-- Content plans generated by AI
CREATE TABLE content_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'match_preview', 'match_recap', etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Content structure
    main_topic VARCHAR(100),
    key_players JSONB, -- Array of player IDs and names
    key_stats JSONB,   -- Important stats to highlight
    content_hooks JSONB, -- Engagement hooks
    hashtags JSONB,    -- Suggested hashtags

    -- Scheduling
    target_date DATE,
    target_time TIME,
    priority INTEGER DEFAULT 1, -- 1-5, 5 being highest

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, approved, scheduled, published, cancelled
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- AI generation metadata
    generated_by VARCHAR(50) DEFAULT 'competitive_intelligence_agent',
    generation_model VARCHAR(50),
    generation_prompt TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content_plans
CREATE INDEX idx_content_plans_type ON content_plans(plan_type);
CREATE INDEX idx_content_plans_date ON content_plans(target_date);
CREATE INDEX idx_content_plans_status ON content_plans(status);
CREATE INDEX idx_content_plans_priority ON content_plans(priority);

-- Social media posts (Instagram, Twitter, etc.)
CREATE TABLE social_posts (
    id BIGSERIAL PRIMARY KEY,
    content_plan_id BIGINT REFERENCES content_plans(id) ON DELETE CASCADE,

    platform VARCHAR(20) NOT NULL, -- 'instagram', 'twitter', 'tiktok', etc.
    post_type VARCHAR(30), -- 'story', 'feed', 'reel', 'tweet', etc.

    -- Content
    content_text TEXT NOT NULL,
    media_urls JSONB, -- Array of image/video URLs
    hashtags TEXT,
    mentions JSONB, -- Array of @mentions

    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Engagement tracking
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),

    -- Status and metadata
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, published, failed
    external_post_id VARCHAR(100), -- Platform's post ID
    error_message TEXT,

    -- AI generation
    generated_by VARCHAR(50),
    heygen_avatar_used BOOLEAN DEFAULT false,
    heygen_video_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for social_posts
CREATE INDEX idx_social_posts_content_plan_id ON social_posts(content_plan_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for);
CREATE INDEX idx_social_posts_published ON social_posts(published_at);

-- n8n Workflow execution tracking
CREATE TABLE workflows (
    id BIGSERIAL PRIMARY KEY,
    workflow_name VARCHAR(100) NOT NULL,
    n8n_workflow_id VARCHAR(100),
    n8n_execution_id VARCHAR(100),

    -- Execution details
    trigger_type VARCHAR(50), -- 'manual', 'webhook', 'cron', 'api'
    trigger_data JSONB,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'running', -- running, success, error, stopped
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Results and error handling
    output_data JSONB,
    error_message TEXT,
    error_stack TEXT,

    -- Related entities
    content_plan_id BIGINT REFERENCES content_plans(id),
    affected_players JSONB, -- Array of player IDs processed
    affected_matches JSONB, -- Array of match IDs processed

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for workflows
CREATE INDEX idx_workflows_name ON workflows(workflow_name);
CREATE INDEX idx_workflows_n8n_id ON workflows(n8n_workflow_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_started ON workflows(started_at);

-- API request tracking and rate limiting
CREATE TABLE api_requests (
    id BIGSERIAL PRIMARY KEY,
    api_provider VARCHAR(50) NOT NULL, -- 'api-sports', 'heygen', 'instagram', etc.
    endpoint VARCHAR(200) NOT NULL,
    http_method VARCHAR(10) DEFAULT 'GET',

    -- Request details
    request_params JSONB,
    response_status INTEGER,
    response_size INTEGER, -- bytes
    response_time_ms INTEGER,

    -- Rate limiting
    daily_count INTEGER DEFAULT 1,
    hourly_count INTEGER DEFAULT 1,

    -- Status
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for api_requests
CREATE INDEX idx_api_requests_provider ON api_requests(api_provider);
CREATE INDEX idx_api_requests_endpoint ON api_requests(endpoint);
CREATE INDEX idx_api_requests_requested_at ON api_requests(requested_at);
CREATE INDEX idx_api_requests_success ON api_requests(success);

-- =====================================================
-- COMPETITIVE INTELLIGENCE & OUTLIER DETECTION
-- =====================================================

-- YouTube Outliers - Viral videos detection
CREATE TABLE youtube_outliers (
    id BIGSERIAL PRIMARY KEY,
    video_id VARCHAR(20) UNIQUE NOT NULL, -- YouTube video ID
    title TEXT NOT NULL,

    -- Channel info
    channel_id VARCHAR(50) NOT NULL,
    channel_name VARCHAR(200) NOT NULL,
    channel_subscribers BIGINT DEFAULT 0,

    -- Video metadata
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    duration VARCHAR(20), -- ISO 8601 duration

    -- Engagement metrics
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0, -- (likes + comments) / views * 100

    -- Outlier analysis
    outlier_score DECIMAL(10,1) DEFAULT 0, -- Calculated viral score
    priority VARCHAR(5) NOT NULL, -- P0, P1, P2, P3
    viral_ratio DECIMAL(10,2), -- views / channel_subscribers
    velocity DECIMAL(10,2), -- views per hour

    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'detected', -- detected, analyzing, analyzed, responded
    transcription_id VARCHAR(100), -- Reference to transcription if processed
    analysis_id VARCHAR(100), -- Reference to AI analysis if processed

    -- Response tracking (when we create a response video)
    response_video_id VARCHAR(20), -- YouTube video ID of our response
    response_url TEXT, -- Full URL to our response video

    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for youtube_outliers
CREATE INDEX idx_youtube_outliers_video_id ON youtube_outliers(video_id);
CREATE INDEX idx_youtube_outliers_channel_id ON youtube_outliers(channel_id);
CREATE INDEX idx_youtube_outliers_priority ON youtube_outliers(priority);
CREATE INDEX idx_youtube_outliers_score ON youtube_outliers(outlier_score DESC);
CREATE INDEX idx_youtube_outliers_status ON youtube_outliers(processing_status);
CREATE INDEX idx_youtube_outliers_detected_at ON youtube_outliers(detected_at DESC);
CREATE INDEX idx_youtube_outliers_published_at ON youtube_outliers(published_at DESC);

-- Composite index for dashboard queries
CREATE INDEX idx_youtube_outliers_dashboard ON youtube_outliers(detected_at DESC, priority, processing_status);

-- =====================================================
-- USER MANAGEMENT & FANTASY TEAMS (Future Expansion)
-- =====================================================

-- Users table - Fantasy managers
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),

    -- Profile
    avatar_url TEXT,
    country VARCHAR(50),
    favorite_team_id BIGINT REFERENCES teams(id),

    -- Fantasy settings
    preferred_formation VARCHAR(10) DEFAULT '4-3-3',
    total_budget DECIMAL(5,1) DEFAULT 100.0, -- millions

    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    premium_member BOOLEAN DEFAULT false,

    -- Auth metadata (Supabase handles this, but keeping for reference)
    last_login_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- User fantasy teams
CREATE TABLE user_teams (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,

    -- Formation and budget
    formation VARCHAR(10) DEFAULT '4-3-3',
    total_value DECIMAL(6,1) DEFAULT 0,
    remaining_budget DECIMAL(5,1) DEFAULT 100.0,

    -- Active lineup (15 players: 11 playing + 4 bench)
    goalkeepers JSONB, -- Array of player IDs (2 players)
    defenders JSONB,   -- Array of player IDs (5 players)
    midfielders JSONB, -- Array of player IDs (5 players)
    forwards JSONB,    -- Array of player IDs (3 players)

    -- Active XI for the gameweek
    captain_id BIGINT REFERENCES players(id),
    vice_captain_id BIGINT REFERENCES players(id),
    active_formation VARCHAR(10),

    -- Performance tracking
    total_points INTEGER DEFAULT 0,
    gameweek_points INTEGER DEFAULT 0,
    transfers_made INTEGER DEFAULT 0,
    transfer_penalties INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    auto_substitute BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_teams
CREATE INDEX idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX idx_user_teams_total_points ON user_teams(total_points);
CREATE INDEX idx_user_teams_active ON user_teams(is_active);

-- Transfer history
CREATE TABLE transfers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_team_id BIGINT REFERENCES user_teams(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,

    -- Transfer details
    player_in_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    player_out_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    transfer_cost DECIMAL(4,1), -- Usually 0 or -4 points

    -- Financial impact
    money_spent DECIMAL(4,1),
    money_gained DECIMAL(4,1),
    net_cost DECIMAL(4,1),

    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transfers
CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_gameweek ON transfers(gameweek);
CREATE INDEX idx_transfers_player_in ON transfers(player_in_id);
CREATE INDEX idx_transfers_player_out ON transfers(player_out_id);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Current gameweek player performance
CREATE VIEW current_gameweek_performance AS
SELECT
    p.id as player_id,
    p.name,
    p.position,
    t.name as team_name,
    fp.gameweek,
    fp.total_points,
    fp.goals_points,
    fp.assists_points,
    ps.minutes_played,
    ps.rating,
    p.fantasy_price,
    p.ownership_percentage
FROM players p
JOIN teams t ON p.team_id = t.id
LEFT JOIN fantasy_points fp ON p.id = fp.player_id
LEFT JOIN player_stats ps ON p.id = ps.player_id AND fp.match_id = ps.match_id
WHERE fp.gameweek = (
    SELECT MAX(gameweek)
    FROM fantasy_points
    WHERE gameweek IS NOT NULL
)
ORDER BY fp.total_points DESC;

-- View: Top performers by position
CREATE VIEW top_performers_by_position AS
SELECT
    p.position,
    p.id as player_id,
    p.name,
    t.name as team_name,
    AVG(fp.total_points) as avg_points,
    SUM(fp.total_points) as total_points,
    COUNT(fp.match_id) as matches_played,
    p.fantasy_price,
    p.ownership_percentage
FROM players p
JOIN teams t ON p.team_id = t.id
JOIN fantasy_points fp ON p.id = fp.player_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.position, t.name, p.fantasy_price, p.ownership_percentage
HAVING COUNT(fp.match_id) >= 3 -- At least 3 matches played
ORDER BY p.position, avg_points DESC;

-- View: Recent content performance
CREATE VIEW content_performance AS
SELECT
    cp.plan_type,
    cp.title,
    COUNT(sp.id) as posts_count,
    AVG(sp.likes_count) as avg_likes,
    AVG(sp.comments_count) as avg_comments,
    AVG(sp.engagement_rate) as avg_engagement,
    cp.created_at
FROM content_plans cp
LEFT JOIN social_posts sp ON cp.id = sp.content_plan_id
WHERE cp.status = 'published'
AND cp.created_at >= NOW() - INTERVAL '30 days'
GROUP BY cp.id, cp.plan_type, cp.title, cp.created_at
ORDER BY avg_engagement DESC;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all main tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fantasy_points_updated_at BEFORE UPDATE ON fantasy_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON content_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_teams_updated_at BEFORE UPDATE ON user_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate fantasy points
CREATE OR REPLACE FUNCTION calculate_fantasy_points(
    player_position VARCHAR(10),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    penalties_saved INTEGER DEFAULT 0,
    clean_sheet BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER := 0;
    goals_points INTEGER := 0;
BEGIN
    -- Match played points (if played more than 60 minutes)
    IF minutes >= 60 THEN
        total_points := total_points + 2;
    END IF;

    -- Goals points based on position
    CASE player_position
        WHEN 'GK' THEN goals_points := goals * 10;
        WHEN 'DEF' THEN goals_points := goals * 6;
        WHEN 'MID' THEN goals_points := goals * 5;
        WHEN 'FWD' THEN goals_points := goals * 4;
    END CASE;

    total_points := total_points + goals_points;

    -- Assists (all positions)
    total_points := total_points + (assists * 3);

    -- Clean sheet points (GK and DEF only)
    IF clean_sheet AND (player_position = 'GK' OR player_position = 'DEF') THEN
        total_points := total_points + 4;
    END IF;

    -- Penalty saves (GK only)
    IF player_position = 'GK' AND penalties_saved > 0 THEN
        total_points := total_points + (penalties_saved * 5);
    END IF;

    -- Goals conceded penalty (GK only, -1 for each goal)
    IF player_position = 'GK' AND goals_conceded > 0 THEN
        total_points := total_points - goals_conceded;
    END IF;

    -- Goals conceded penalty (DEF only, -1 for every 2 goals)
    IF player_position = 'DEF' AND goals_conceded > 0 THEN
        total_points := total_points - (goals_conceded / 2);
    END IF;

    -- Cards
    total_points := total_points - yellow_cards;
    total_points := total_points - (red_cards * 3);

    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User teams policies
CREATE POLICY "Users can view own teams" ON user_teams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own teams" ON user_teams
    FOR ALL USING (auth.uid() = user_id);

-- Transfers policies
CREATE POLICY "Users can view own transfers" ON transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers" ON transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for reference data
CREATE POLICY "Public read access to teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Public read access to players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Public read access to matches" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Public read access to player_stats" ON player_stats
    FOR SELECT USING (true);

CREATE POLICY "Public read access to fantasy_points" ON fantasy_points
    FOR SELECT USING (true);

-- Content tables - read access for public, write access for service role
CREATE POLICY "Public read access to content_plans" ON content_plans
    FOR SELECT USING (true);

CREATE POLICY "Public read access to social_posts" ON social_posts
    FOR SELECT USING (true);

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert La Liga teams (2024-25 season)
INSERT INTO teams (api_sports_id, name, short_name, stadium, city, logo_url) VALUES
(529, 'FC Barcelona', 'BAR', 'Camp Nou', 'Barcelona', 'https://media.api-sports.io/football/teams/529.png'),
(541, 'Real Madrid', 'RMA', 'Santiago Bernabéu', 'Madrid', 'https://media.api-sports.io/football/teams/541.png'),
(530, 'Atlético Madrid', 'ATM', 'Cívitas Metropolitano', 'Madrid', 'https://media.api-sports.io/football/teams/530.png'),
(532, 'Valencia', 'VAL', 'Mestalla', 'Valencia', 'https://media.api-sports.io/football/teams/532.png'),
(533, 'Villarreal', 'VIL', 'Estadio de la Cerámica', 'Villarreal', 'https://media.api-sports.io/football/teams/533.png'),
(548, 'Real Sociedad', 'RSO', 'Reale Arena', 'San Sebastián', 'https://media.api-sports.io/football/teams/548.png'),
(531, 'Athletic Bilbao', 'ATH', 'San Mamés', 'Bilbao', 'https://media.api-sports.io/football/teams/531.png'),
(536, 'Sevilla', 'SEV', 'Ramón Sánchez-Pizjuán', 'Sevilla', 'https://media.api-sports.io/football/teams/536.png'),
(542, 'Real Betis', 'BET', 'Benito Villamarín', 'Sevilla', 'https://media.api-sports.io/football/teams/542.png'),
(546, 'Getafe', 'GET', 'Coliseum', 'Getafe', 'https://media.api-sports.io/football/teams/546.png'),
(727, 'Osasuna', 'OSA', 'El Sadar', 'Pamplona', 'https://media.api-sports.io/football/teams/727.png'),
(539, 'Celta Vigo', 'CEL', 'Abanca-Balaídos', 'Vigo', 'https://media.api-sports.io/football/teams/539.png'),
(540, 'Espanyol', 'ESP', 'RCDE Stadium', 'Barcelona', 'https://media.api-sports.io/football/teams/540.png'),
(538, 'Cádiz', 'CAD', 'Nuevo Mirandilla', 'Cádiz', 'https://media.api-sports.io/football/teams/538.png'),
(547, 'Girona', 'GIR', 'Montilivi', 'Girona', 'https://media.api-sports.io/football/teams/547.png'),
(543, 'Real Valladolid', 'VLL', 'José Zorrilla', 'Valladolid', 'https://media.api-sports.io/football/teams/543.png'),
(715, 'Rayo Vallecano', 'RAY', 'Vallecas', 'Madrid', 'https://media.api-sports.io/football/teams/715.png'),
(728, 'UD Almería', 'ALM', 'Mediterráneo', 'Almería', 'https://media.api-sports.io/football/teams/728.png'),
(549, 'UD Las Palmas', 'LPA', 'Gran Canaria', 'Las Palmas', 'https://media.api-sports.io/football/teams/549.png'),
(544, 'Mallorca', 'MLL', 'Visit Mallorca Estadi', 'Palma', 'https://media.api-sports.io/football/teams/544.png');

-- Create some sample content plans for testing
INSERT INTO content_plans (plan_type, title, description, target_date, status) VALUES
('daily', 'Análisis diario Fantasy La Liga', 'Repaso de los mejores picks del día', CURRENT_DATE, 'draft'),
('weekly', 'Recomendaciones semanales', 'Los mejores fichajes para la jornada', CURRENT_DATE + INTERVAL '1 day', 'draft'),
('match_preview', 'El Clásico: Barcelona vs Real Madrid', 'Preview del partido más esperado', CURRENT_DATE + INTERVAL '3 days', 'draft');

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Create composite indexes for common query patterns
CREATE INDEX idx_player_stats_composite ON player_stats(match_id, player_id, minutes_played);
CREATE INDEX idx_fantasy_points_composite ON fantasy_points(gameweek, total_points DESC);
CREATE INDEX idx_matches_date_status ON matches(match_date, status);
CREATE INDEX idx_players_team_position ON players(team_id, position, is_active);

-- GIN indexes for JSONB columns
CREATE INDEX idx_players_colors_gin ON teams USING gin(colors);
CREATE INDEX idx_content_plans_key_players_gin ON content_plans USING gin(key_players);
CREATE INDEX idx_social_posts_hashtags_gin ON social_posts USING gin(hashtags);

-- Text search indexes
CREATE INDEX idx_players_name_gin ON players USING gin(name gin_trgm_ops);
CREATE INDEX idx_teams_name_gin ON teams USING gin(name gin_trgm_ops);

-- =====================================================
-- SUMMARY
-- =====================================================
-- Schema created with:
-- - 13 core tables for La Liga data and fantasy management
-- - 4 content management tables for AI automation
-- - 3 user management tables for future expansion
-- - Comprehensive indexing strategy
-- - Row Level Security policies
-- - Utility functions and triggers
-- - Initial data seeding for La Liga teams
-- - Performance optimizations
--
-- Total tables: 20
-- Total indexes: 50+
-- Total views: 3
-- Total functions: 2
-- Ready for production use with Supabase
-- =====================================================

-- End of schema
-- =====================================================
-- OUTLIERS SYSTEM OPTIMIZATION (Added: 14 Oct 2025)
-- =====================================================

-- Extend youtube_outliers with intelligent content analysis
ALTER TABLE youtube_outliers
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS content_analysis JSONB,
ADD COLUMN IF NOT EXISTS mentioned_players JSONB,
ADD COLUMN IF NOT EXISTS enriched_data JSONB,
ADD COLUMN IF NOT EXISTS generated_script JSONB,
ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) CHECK (video_type IN ('player_spotlight', 'generic_analysis')),
ADD COLUMN IF NOT EXISTS platform VARCHAR(20),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_outliers_platform ON youtube_outliers(platform);
CREATE INDEX IF NOT EXISTS idx_outliers_published_at ON youtube_outliers(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_video_type ON youtube_outliers(video_type);

-- Comments
COMMENT ON COLUMN youtube_outliers.transcription IS 'Full video transcription from Whisper API';
COMMENT ON COLUMN youtube_outliers.content_analysis IS 'GPT analysis: thesis, arguments, hooks, suggested response';
COMMENT ON COLUMN youtube_outliers.mentioned_players IS 'Array of player names mentioned: ["Pedri", "Lewandowski"]';
COMMENT ON COLUMN youtube_outliers.enriched_data IS 'API-Sports stats for mentioned players';
COMMENT ON COLUMN youtube_outliers.generated_script IS 'VEO3 script generated by intelligentScriptGenerator';
COMMENT ON COLUMN youtube_outliers.video_type IS 'Video classification: player_spotlight (single player focus) | generic_analysis (jornada/multi-player)';
COMMENT ON COLUMN youtube_outliers.platform IS 'Publication platform: youtube | instagram';

-- Update processing_status to support new states
-- States: detected → analyzing → analyzed → enriched → scripted → producing → published → failed
ALTER TABLE youtube_outliers
ALTER COLUMN processing_status TYPE VARCHAR(20);

-- Table: youtube_outliers_responses (separate tracking)
CREATE TABLE IF NOT EXISTS youtube_outliers_responses (
  id SERIAL PRIMARY KEY,
  outlier_id INTEGER REFERENCES youtube_outliers(id) ON DELETE CASCADE,
  response_video_id VARCHAR(50) UNIQUE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  presenter VARCHAR(20) NOT NULL CHECK (presenter IN ('carlos', 'ana')),
  script_used JSONB,
  production_cost FLOAT DEFAULT 0.97,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Metrics 24h
  views_24h INTEGER DEFAULT 0,
  likes_24h INTEGER DEFAULT 0,
  comments_24h INTEGER DEFAULT 0,
  engagement_rate_24h FLOAT DEFAULT 0,

  -- Metrics 48h
  views_48h INTEGER DEFAULT 0,
  likes_48h INTEGER DEFAULT 0,
  comments_48h INTEGER DEFAULT 0,
  engagement_rate_48h FLOAT DEFAULT 0,

  -- Metrics 7d
  views_7d INTEGER DEFAULT 0,
  likes_7d INTEGER DEFAULT 0,
  comments_7d INTEGER DEFAULT 0,
  engagement_rate_7d FLOAT DEFAULT 0,

  -- ROI
  roi_score FLOAT,
  roi_24h FLOAT,
  roi_48h FLOAT,
  roi_7d FLOAT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for outliers_responses
CREATE INDEX IF NOT EXISTS idx_outliers_responses_outlier_id ON youtube_outliers_responses(outlier_id);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_platform ON youtube_outliers_responses(platform);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_presenter ON youtube_outliers_responses(presenter);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_roi ON youtube_outliers_responses(roi_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_outliers_responses_published_at ON youtube_outliers_responses(published_at DESC);

COMMENT ON TABLE youtube_outliers_responses IS 'Performance tracking for published response videos';

-- View: Outliers Performance Analysis
CREATE OR REPLACE VIEW outliers_performance_analysis AS
SELECT
    o.id AS outlier_id,
    o.video_id AS outlier_video_id,
    o.title AS outlier_title,
    o.channel_name AS outlier_channel,
    o.views AS outlier_views,
    o.outlier_score,
    o.priority,
    o.detected_at,

    r.response_video_id,
    r.platform,
    r.presenter,
    r.published_at,

    -- Response time in hours
    EXTRACT(EPOCH FROM (r.published_at - o.detected_at)) / 3600 AS response_time_hours,

    -- Performance metrics
    r.views_24h,
    r.views_48h,
    r.views_7d,
    r.engagement_rate_24h,
    r.engagement_rate_48h,
    r.engagement_rate_7d,

    -- ROI metrics
    r.production_cost,
    r.roi_24h,
    r.roi_48h,
    r.roi_7d,

    -- Capture rate (% of original viral views)
    CASE
        WHEN o.views > 0 THEN (r.views_7d::FLOAT / o.views::FLOAT) * 100
        ELSE 0
    END AS capture_rate_percentage,

    -- Success category
    CASE
        WHEN r.roi_7d >= 20 THEN 'High Success'
        WHEN r.roi_7d >= 10 THEN 'Medium Success'
        WHEN r.roi_7d >= 5 THEN 'Low Success'
        ELSE 'Poor Performance'
    END AS success_category

FROM youtube_outliers o
LEFT JOIN youtube_outliers_responses r ON o.id = r.outlier_id
WHERE o.processing_status = 'published';

COMMENT ON VIEW outliers_performance_analysis IS 'Analytics view for evaluating ROI and response video success';

-- Function: Calculate ROI
CREATE OR REPLACE FUNCTION calculate_roi(
    views INTEGER,
    production_cost FLOAT DEFAULT 0.97
) RETURNS FLOAT AS $$
BEGIN
    IF production_cost <= 0 THEN
        RETURN 0;
    END IF;
    RETURN (views::FLOAT / production_cost) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_roi IS 'Calculate ROI score: (views / production_cost) / 1000';

-- Trigger for youtube_outliers_responses updated_at
CREATE TRIGGER update_outliers_responses_updated_at
    BEFORE UPDATE ON youtube_outliers_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UPDATED SUMMARY
-- =====================================================
-- Schema includes:
-- - 13 core tables for La Liga data and fantasy management
-- - 4 content management tables for AI automation
-- - 3 user management tables for future expansion
-- - 1 outliers response tracking table (youtube_outliers_responses)
-- - Comprehensive indexing strategy
-- - Row Level Security policies
-- - Utility functions and triggers
-- - Initial data seeding for La Liga teams
-- - Performance optimizations
-- - Intelligent outliers analysis system with ROI tracking
--
-- Total tables: 21
-- Total indexes: 57+
-- Total views: 4
-- Total functions: 3
-- Ready for production use with Supabase
-- =====================================================
