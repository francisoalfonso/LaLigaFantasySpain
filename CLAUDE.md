# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚡ Quick Start (Read This First)

**Fantasy La Liga Dashboard** - Automated Instagram influencer system for La Liga Fantasy Football using VEO3 video generation, API-Sports data, and n8n workflows.

### Mandatory Session Start (3 minutes)

```bash
1. Read .claude/rules/01-CRITICAL-RULES.md          # Unbreakable rules (1 min)
2. Read .claude/status/CURRENT-SPRINT.md            # Current state (1 min)
3. Read .claude/status/PRIORITIES.md                # P0/P1/P2 tasks (1 min)
4. Health check: npm run dev && curl http://localhost:3000/api/test/ping
```

**Why**: Without this context, you'll duplicate work or violate critical system constraints.

**Then**: Work on P0 tasks from PRIORITIES.md. Update CURRENT-SPRINT.md when done.

---

## 🚨 Critical Rules - Never Break

### VEO3 Video System (Most Important)
- ❌ **NEVER** change `ANA_CHARACTER_SEED=30001` or `ANA_IMAGE_URL` → Ana's identity breaks
- ❌ **NEVER** use player names in prompts → Error 422 (system auto-uses "el jugador", "el centrocampista")
- ❌ **NEVER** create prompts >80 words → High failure rate
- ✅ **ALWAYS** use "speaks in Spanish from Spain" (lowercase) → Prevents Mexican accent
- ✅ **ALWAYS** keep timeouts ≥120s (initial), ≥45s (status) → Network stability

### File Creation
- ❌ **NEVER** create files without checking `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md`
- ✅ **ALWAYS** search existing files first: `ls backend/services/ | grep -i [keyword]`

### API-Sports & La Liga Data
- ❌ **NEVER** use `season != 2025` → Wrong data (2025-26 season uses ID 2025)
- ✅ **ALWAYS** verify in `backend/config/constants.js`

### Database
- ❌ **NEVER** modify schema without updating BOTH `database/supabase-schema.sql` AND `database/init-database.js`
- ✅ **ALWAYS** run `npm run db:init` after changes

### Code Quality
- ❌ **NEVER** use `console.log` (use Winston logger, except server startup)
- ❌ **NEVER** hardcode secrets (use .env)
- ✅ **ALWAYS** validate inputs with Joi
- ✅ **ALWAYS** use try/catch in async functions

**See `.claude/rules/01-CRITICAL-RULES.md` for complete list**

---

## 📋 Essential Commands

```bash
# Most Used (Daily)
npm run dev                                    # Start server with auto-reload
curl http://localhost:3000/api/test/ping      # Server health check
curl http://localhost:3000/api/veo3/health    # VEO3 system health

# VEO3 Video Generation
npm run veo3:generate-ana                      # Generate Ana video (interactive)
npm run veo3:test-retry-v3                     # Test optimized system (recommended)
npm run veo3:monitor                           # Monitor active generation

# Database
npm run db:init                                # Initialize/reset Supabase schema
npm run db:test                                # Database connectivity test

# Quality & Testing
npm run quality                                # Lint + format + test (all checks)
npm test                                       # Jest tests
npm run lint:fix                               # Auto-fix ESLint issues

# Instagram & Social Media
npm run instagram:test-e2e                     # End-to-end Instagram workflow
npm run sync:player-photos                     # Sync player photos from API

# Less Frequent
npm run veo3:test-google-vs-kie                # Compare VEO3 providers
npm run n8n:check-versions                     # Check n8n workflow versions
npm run db:keep-alive                          # Keep Supabase connection alive
```

---

## 🏗️ Architecture Overview

### Tech Stack
- **Backend**: Express.js + Node.js
- **Database**: Supabase PostgreSQL
- **APIs**: API-Sports (La Liga data), VEO3/KIE.ai (video), AEMET (weather)
- **Frontend**: Alpine.js + Tailwind CSS (no build process, static files)
- **Automation**: n8n workflows + Instagram Graph API

### Critical Data Flow

```
API-Sports (rate limited) → apiFootball.js → dataProcessor.js (Fantasy points)
         ↓
Supabase PostgreSQL (persistent storage)
         ↓
BargainAnalyzer (identify chollos) → VEO3Client (generate Ana videos)
         ↓
n8n Workflows (scheduled) → Instagram Graph API (publish)
```

### VEO3 System Architecture (Most Complex Part)

**Location**: `backend/services/veo3/` (19 services)

**Core Services**:
- `veo3Client.js` - KIE.ai API client with Ana character consistency (120s timeout)
- `promptBuilder.js` - Viral framework + **automatic player name removal** (bypasses Error 422)
- `unifiedScriptGenerator.js` - Cohesive narrative arcs across segments
- `viralVideoBuilder.js` - Multi-segment generation with frame-to-frame transitions
- `videoConcatenator.js` - FFmpeg concatenation + logo outro
- `viralCaptionsGenerator.js` - Automatic viral Instagram/TikTok captions
- `playerCardOverlay.js` - Player stats overlay (seconds 3-6)

**Intelligent Systems**:
- `emotionAnalyzer.js` - 18 emotions, 4 algorithms (keywords 50%, grammar 20%, intent 20%, context 10%)
- `cinematicProgressionSystem.js` - 5 progression patterns, 4 shot types (prevents "reset" look between segments)
- `audioAnalyzer.js` - FFmpeg silence detection + auto-trimming (prevents "cara rara")
- `veo3RetryManager.js` - Smart retry with 30s cooling periods

**Ana Character Consistency**:
- Fixed seed: `ANA_CHARACTER_SEED=30001` (locked to Ana's identity in VEO3 model)
- Fixed image: `ANA_IMAGE_URL` (32-year-old Spanish analyst, short black curly hair, navy blazer)
- Spanish from Spain accent: MUST include "speaks in Spanish from Spain" (lowercase) in all prompts
- **WHY**: Changing seed/image breaks visual consistency across all videos

**VEO3 Error 422 Solution** (CRITICAL):
- **Root cause**: KIE.ai blocks ALL player names (Pedri, Lewandowski, etc.) due to image rights
- **Automatic fix**: `promptBuilder.js:325-359` replaces names with generic references ("el jugador", "el centrocampista")
- **Verification**: Check logs for `"[PromptBuilder] 🔧 Usando referencia segura: 'el centrocampista'"`
- **Success rate**: 100% when using generic references vs 0% with player names
- **See**: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`

**Frame-to-Frame Transitions**:
- Last frame of Segment N = First frame of Segment N+1 (exhaustive description)
- Result: Invisible transitions, no crossfade needed
- Implementation: `videoConcatenator.js` + `promptBuilder.js`

### BargainAnalyzer System

**Location**: `backend/services/bargainAnalyzer.js`

**Algorithm**:
- Identifies undervalued Fantasy players (high points potential, low price)
- Points estimation + value ratio (points/price) > 1.2
- Constraints: Max price €8.0, min 3 games, min 90 minutes

### Instagram Automation Strategy

**Content Mix** (70/20/10 strategy):
- 70% Reels (5/week) - VEO3-generated Ana videos
- 20% Carousels (1-2/week) - ContentDrips API
- 10% Stories (daily) - Engagement

**Workflows**:
- n8n: 8 total (2 active, 6 pending)
- Version tracking: `data/instagram-versions/` (test metadata with feedback loop)

---

## 📂 Key Directories

```
Fantasy la liga/
├── .claude/                           # Session tracking (READ FIRST)
│   ├── rules/                        # Development rules (CRITICAL-RULES.md, etc.)
│   ├── status/                       # Current sprint, priorities, decisions log
│   ├── workflows/                    # Common workflows (new-feature, debugging, etc.)
│   └── reference/                    # Quick references (endpoints, services, etc.)
│
├── backend/
│   ├── server.js                     # Express server (15min timeout for VEO3)
│   ├── routes/                       # API endpoints (modular by domain)
│   │   ├── veo3.js                  # VEO3 video generation routes
│   │   ├── bargains.js              # Bargain analyzer routes
│   │   ├── carousels.js             # ContentDrips carousel automation
│   │   └── testHistory.js           # Video test feedback tracking
│   ├── services/                     # Business logic layer
│   │   ├── veo3/                    # VEO3 video system (19 services - MOST COMPLEX)
│   │   ├── bargainAnalyzer.js       # Chollos algorithm
│   │   └── apiFootball.js           # API-Sports client with rate limiting
│   ├── config/
│   │   ├── constants.js             # La Liga IDs, season 2025-26
│   │   └── veo3/anaCharacter.js     # Ana character bible
│   └── utils/logger.js              # Winston logger with daily rotation
│
├── frontend/                          # Static files (no build process)
│   ├── instagram-viral-preview.html  # ÚNICO preview oficial para videos
│   ├── carousel-instagram-mockup.html # Preview para carruseles
│   └── test-history.html            # Video feedback interface
│
├── database/
│   ├── supabase-schema.sql           # PostgreSQL schema (UPDATE WITH init-database.js)
│   └── init-database.js              # Schema initialization
│
├── data/
│   ├── instagram-versions/           # Video test metadata + feedback
│   ├── player-dictionary.json        # Player name mappings (deprecated, use API)
│   └── player-photos/               # Player images from API
│
├── docs/                              # Technical documentation
│   ├── NORMAS_DESARROLLO_IMPRESCINDIBLES.md  # CRITICAL: File creation rules
│   ├── VEO3_FIX_REGRESION_OCTUBRE_2025.md    # VEO3 Error 422 troubleshooting
│   └── VEO3_GUIA_COMPLETA.md                 # Complete VEO3 guide
│
├── output/veo3/sessions/             # Generated videos by session
│   └── session_{timestamp}/          # Each session has own folder
│
└── workflows/
    └── n8n-carousel-top-chollos.json # n8n workflow definitions
```

---

## 🏆 La Liga 2025-26 Season Data

**ALWAYS USE**:
- **Season ID**: 2025 (API-Sports uses 2025 for 2025-26 season, NOT 2024)
- **Liga ID**: 140
- **Teams**: 20 total
  - ✅ NEW: Levante (539), Elche (797), Real Oviedo (718)
  - ❌ EXCLUDED: Valladolid, Las Palmas, Leganés (relegated)
- **Dates**: Aug 15, 2025 - May 24, 2026

**Configuration**: `backend/config/constants.js` → `SEASON_2025_26: 2025`

---

## 🔧 Common Development Patterns

### Service Layer Pattern

```javascript
// Centralized client with caching, rate limiting, error handling
class ServiceClient {
  constructor() {
    this.apiKey = process.env.API_KEY;
    this.baseUrl = 'https://api.example.com';
  }

  async makeRequest(endpoint, options) {
    try {
      // 1. Rate limiting check
      // 2. Cache check
      const response = await axios.get(`${this.baseUrl}${endpoint}`, options);
      // 3. Cache write
      return response.data;
    } catch (error) {
      logger.error('ServiceClient error', { error, endpoint });
      throw error;
    }
  }
}
```

### Route Organization

```javascript
// Feature-based routes (not RESTful resources)
// Each domain gets its own route file

// routes/bargains.js
router.get('/test', rateLimiter, async (req, res) => { /* test endpoint */ });
router.get('/top', rateLimiter, async (req, res) => { /* main endpoint */ });
router.get('/position/:pos', rateLimiter, async (req, res) => { /* filtered */ });

// Registered in server.js with appropriate rate limiter
app.use('/api/bargains', apiSportsLimiter, bargainsRoutes);
```

### Database Changes Workflow

**ALWAYS update BOTH files**:
1. `database/supabase-schema.sql` - PostgreSQL DDL
2. `database/init-database.js` - Initialization logic

**Then run**:
```bash
npm run db:init     # Apply changes
npm run db:test     # Verify connectivity
```

### Adding New Features

1. Check `.claude/status/PRIORITIES.md` - Is this P0/P1?
2. Study similar functionality in existing routes/services
3. Create `/api/*/test` endpoint for new features
4. Apply appropriate rate limiter from `middleware/rateLimiter.js`
5. Validate inputs with Joi schemas
6. Use Winston logger (NOT console.log)
7. Follow try/catch + error logging pattern

---

## 🐛 Common Issues & Solutions

### VEO3 Error 422 "failed" / "Names not allowed"
**Symptom**: Video generation fails with Error 422
**Cause**: KIE.ai blocks ALL player names due to image rights
**Solution**: System auto-uses generic references via `promptBuilder.js:325-359`
**Verify**: Check logs for `"[PromptBuilder] 🔧 Usando referencia segura: 'el centrocampista'"`
**If missing**: Verify `playerNameOptimizer` is imported in `promptBuilder.js`
**See**: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`

### Ana has Mexican accent
**Cause**: Missing or incorrect "speaks in Spanish from Spain" in prompt
**Solution**: Verify `promptBuilder.js` uses lowercase "speaks" (not "SPEAKING")
**Pattern**: "The person from the reference image speaks in Spanish from Spain"

### VEO3 timeouts
**Cause**: Axios timeout too short for video generation (4-6 minutes)
**Solution**: Verify `veo3Client.js` has `timeout: 120000` (initial) and `timeout: 45000` (status)
**Note**: Server timeout already set to 15min in `server.js:339`

### API-Sports returns wrong teams
**Cause**: Using wrong season ID
**Solution**: Always use `season=2025` for 2025-26 season (not 2024)

### Duplicate files created
**Cause**: Not checking `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` before creating files
**Solution**: ALWAYS search existing files first, follow NORMA #1 checklist

---

## 📚 Documentation Index

**Quick References** (`.claude/reference/`):
- `endpoints.md` - All API endpoints
- `services.md` - Service layer architecture
- `commands.md` - npm scripts reference
- `troubleshooting.md` - Common issues

**Critical Rules** (`.claude/rules/`):
- `01-CRITICAL-RULES.md` - Unbreakable rules ⚠️
- `02-development.md` - Development guidelines
- `03-code-style.md` - Code style standards
- `04-apis.md` - API integration guidelines
- `05-veo3.md` - VEO3-specific rules

**Status Tracking** (`.claude/status/`):
- `CURRENT-SPRINT.md` - Current state, yesterday/today plan
- `PRIORITIES.md` - P0/P1/P2 tasks with blockers
- `DECISIONS-LOG.md` - Historical technical decisions

**VEO3 Deep Dives** (`docs/`):
- `VEO3_FIX_REGRESION_OCTUBRE_2025.md` - Error 422 troubleshooting
- `VEO3_GUIA_COMPLETA.md` - Complete VEO3 guide
- `VEO3_SISTEMA_EMOCIONES_INTELIGENTE.md` - Emotion analyzer system
- `VEO3_CINEMATOGRAFIA_PROGRESIVA_SISTEMA.md` - Cinematic progression

**Instagram** (`docs/`):
- `INSTAGRAM_ESTRATEGIA_CONTENIDO_2025.md` - 70/20/10 strategy
- `INSTAGRAM_CARRUSELES_AUTOMATIZACION.md` - Carousel automation

**File Creation Rules**:
- `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` - CRITICAL: Read before creating ANY file

---

## ⚙️ Environment Variables

**Required** (`.env`):
```bash
# API-Sports (La Liga data)
API_FOOTBALL_KEY=your_api_key

# VEO3 (video generation)
KIE_AI_API_KEY=your_kie_key
ANA_CHARACTER_SEED=30001                          # DO NOT CHANGE
ANA_IMAGE_URL=https://raw.githubusercontent.com/... # DO NOT CHANGE

# Server
NODE_ENV=development
PORT=3000
HOST=localhost
```

**Database** (`.env.supabase`):
```bash
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

**Optional** (`.env`):
```bash
CONTENTDRIPS_API_KEY=your_key  # Instagram carousels
AEMET_API_KEY=your_key         # Weather integration
```

---

## 🚀 Quick Links

**Local Dashboards**:
- http://localhost:3000 - Main dashboard
- http://localhost:3000/viral-preview - Instagram video preview (OFICIAL)
- http://localhost:3000/staging - Content validation
- http://localhost:3000/bargains - Chollos analysis
- http://localhost:3000/test-history - Video feedback tracking

**External Services**:
- n8n: https://n8n-n8n.6ld9pv.easypanel.host
- Supabase: https://supabase.com/dashboard
- KIE.ai: https://kie.ai
- GitHub: https://github.com/laligafantasyspainpro-ux/LaLigaFantasySpain

---

## 💰 Cost Tracking

**Monthly Costs**:
- API-Sports Ultra: $29/mo (75k req/day)
- VEO3 (KIE.ai): ~$6/mo (20 videos × $0.30)
- Supabase: $0 (free tier)
- n8n: $0 (self-hosted)
- ContentDrips: $39/mo (pending activation)

**Total Active**: $35/mo | **Projected**: $74/mo

---

## 🎯 TL;DR - Critical Knowledge

**VEO3 Video Generation**:
- Ana seed 30001 + fixed image URL (NEVER change)
- Prompts: 30-50 words, "speaks in Spanish from Spain" (lowercase)
- Player names: Auto-replaced with generic references ("el jugador")
- Timeouts: ≥120s (initial), ≥45s (status)

**La Liga Data**:
- Season 2025-26 = ID 2025 (not 2024)
- 20 teams (includes Levante, Elche, Oviedo)

**File Creation**:
- Check `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` FIRST
- Search existing files before creating new ones

**Database**:
- Update BOTH `supabase-schema.sql` AND `init-database.js`
- Run `npm run db:init` after schema changes

**Session Workflow**:
1. Read `.claude/rules/01-CRITICAL-RULES.md` + `.claude/status/CURRENT-SPRINT.md`
2. Work on P0 tasks from `.claude/status/PRIORITIES.md`
3. Update `CURRENT-SPRINT.md` when done

---

**Last Updated**: 2025-10-10
**Version**: 2.2.0
**Maintained by**: Claude Code

## 🆕 Recent Critical Updates

### Oct 10, 2025 - CLAUDE.md Streamlined
- Reduced redundancy with `.claude/` documentation
- Emphasized VEO3 Error 422 solution (most common issue)
- Focused on high-level architecture vs implementation details
- Removed generic development advice per `/init` guidelines

### Oct 9, 2025 - Modular .claude/ Structure
- Split documentation into `.claude/rules/`, `.claude/workflows/`, `.claude/reference/`
- Created `START_HERE.md` master index
- Better separation of concerns

### Oct 8, 2025 - Intelligent VEO3 Systems
- EmotionAnalyzer: 18 emotions, content-based detection
- CinematicProgressionSystem: 5 progression patterns, prevents "reset" look
- AudioAnalyzer: FFmpeg silence detection, auto-trimming

### Oct 6, 2025 - VEO3 Critical Fix
- Fixed 100% failure → 100% success rate
- Timeout increase: 60s → 120s (initial), 15s → 45s (status)
- Automatic generic player references (bypasses Error 422)
