# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

---

## ⚡ Quick Start (Read This First)

**Fantasy La Liga Dashboard** - Automated Instagram influencer system for La
Liga Fantasy Football using VEO3 video generation, API-Sports data, and n8n
workflows.

### Mandatory Session Start (3 minutes)

```bash
1. Read .claude/rules/01-CRITICAL-RULES.md          # Unbreakable rules (1 min)
2. Read .claude/status/CURRENT-SPRINT.md            # Current state (1 min)
3. Read .claude/status/PRIORITIES.md                # P0/P1/P2 tasks (1 min)
4. Health check: npm run dev && curl http://localhost:3000/api/test/ping
```

**Why**: Without this context, you'll duplicate work or violate critical system
constraints.

**Then**: Work on P0 tasks from PRIORITIES.md. Update CURRENT-SPRINT.md when
done.

---

## 🚨 Critical Rules - Never Break

### VEO3 Video System (Most Important)

- ❌ **NEVER** change `ANA_CHARACTER_SEED=30001` or `ANA_IMAGE_URL` → Ana's
  identity breaks
- ❌ **NEVER** use player names in prompts → Error 422 (system auto-uses "el
  jugador", "el centrocampista")
- ❌ **NEVER** create prompts >80 words → High failure rate
- ✅ **ALWAYS** use "speaks in Spanish from Spain" (lowercase) → Prevents
  Mexican accent
- ✅ **ALWAYS** keep timeouts ≥120s (initial), ≥45s (status) → Network stability

### File Creation

- ❌ **NEVER** create files without checking
  `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md`
- ✅ **ALWAYS** search existing files first:
  `ls backend/services/ | grep -i [keyword]`

### API-Sports & La Liga Data

- ❌ **NEVER** use `season != 2025` → Wrong data (2025-26 season uses ID 2025)
- ✅ **ALWAYS** verify in `backend/config/constants.js`

### Database

- ❌ **NEVER** modify schema without updating BOTH
  `database/supabase-schema.sql` AND `database/init-database.js`
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
# Development
npm run dev                                    # Start server with auto-reload (PORT 3000)
curl http://localhost:3000/api/test/ping      # Server health check

# VEO3 Video Generation (3-Phase System) ⭐ RECOMMENDED
npm run veo3:test-phased                       # E2E test of 3-phase workflow
npm run veo3:e2e-chollo                        # Complete chollo video generation
npm run veo3:test-nano-banana                  # Test Nano Banana integration
npm run veo3:monitor                           # Monitor active generation

# VEO3 Legacy (Single-Phase)
npm run veo3:generate-ana                      # Generate Ana video (interactive)
npm run veo3:test-retry-v3                     # Test with retry system

# Database
npm run db:init                                # Initialize/reset Supabase schema
npm run db:test                                # Database connectivity test
npm run db:verify-competitive                  # Verify competitive analysis schema

# Quality & Testing
npm run quality                                # Lint + format + test (all checks)
npm test                                       # Jest tests only
npm run lint:fix                               # Auto-fix ESLint issues

# Content & Instagram
npm run instagram:test-e2e                     # End-to-end Instagram workflow
npm run sync:player-photos                     # Sync player photos from API-Sports
npm run veo3:test-carlos                       # Test player stats video

# Competitive YouTube Analyzer (NEW - Oct 2025)
# (No dedicated npm scripts - use API endpoints via curl or frontend)

# Session Management
npm run session-close                          # Save session + commit changes
npm run auto-save                              # Quick save without commit

# Utilities
npm run n8n:check-versions                     # Check n8n workflow versions
npm run db:keep-alive                          # Keep Supabase connection alive
```

---

## 🏗️ Architecture Overview

### Tech Stack

- **Backend**: Express.js + Node.js (15min timeouts for VEO3)
- **Database**: Supabase PostgreSQL
- **APIs**: API-Sports (La Liga data), VEO3/KIE.ai (video), Nano Banana
  (contextual images), AEMET (weather)
- **Frontend**: Alpine.js + Tailwind CSS (no build process, static files)
- **Automation**: n8n workflows + Instagram Graph API

### Critical Data Flow

```
API-Sports (rate limited) → apiFootball.js → dataProcessor.js (Fantasy points)
         ↓
Supabase PostgreSQL (persistent storage)
         ↓
BargainAnalyzer (identify chollos) → VEO3 3-Phase System (generate Ana videos)
         ↓
n8n Workflows (scheduled) → Instagram Graph API (publish)
```

### VEO3 3-Phase Architecture (NEW - Oct 2025) ⭐ **MOST IMPORTANT**

**Problem Solved**: Server timeouts eliminated by splitting 10-15 minute
monolithic operations into separate short HTTP requests (2-4 min each).

**Location**: `backend/services/veo3/` (22 services) + `backend/routes/veo3.js`
(lines 1772-2493)

**Architecture Overview**:

```
Phase 1: Preparation (2-3 min)
   ├─ Generate 3-segment script (UnifiedScriptGenerator)
   ├─ Generate 3 contextual images (Nano Banana)
   └─ Save progress.json (status: "prepared")

Phase 2: Individual Generation (3-4 min × 3)
   ├─ Generate segment 0 (intro)
   ├─ Generate segment 1 (middle)
   └─ Generate segment 2 (outro)

Phase 3: Finalization (1 min)
   ├─ Concatenate 3 videos (FFmpeg)
   └─ Add logo outro
```

**Key Endpoints**:

- `POST /api/veo3/prepare-session` - Phase 1: Script + images
- `POST /api/veo3/generate-segment` - Phase 2: Generate 1 segment (call 3x)
- `POST /api/veo3/finalize-session` - Phase 3: Concatenate + logo

**Advantages**:

1. ✅ **No timeouts** - Each request <5 min (vs 15 min monolithic)
2. ✅ **Retry individual segments** - Don't regenerate entire video on failure
3. ✅ **Visible progress** - `progress.json` updates incrementally
4. ✅ **Persistent state** - Survives server restarts
5. ✅ **Parallelizable** - Future: generate 3 segments concurrently

**Cost per video**: ~$0.96 ($0.06 Nano Banana + $0.90 VEO3 for 3 segments)

**Test Commands**:

```bash
npm run veo3:test-phased        # E2E test of 3-phase workflow
npm run veo3:e2e-chollo         # Complete chollo video generation
```

### VEO3 Core Services

**Location**: `backend/services/veo3/` (22 services total)

**Core Services**:

- `veo3Client.js` - KIE.ai API client with Ana character consistency (120s
  timeout)
- `promptBuilder.js` - Viral framework + **automatic player name removal**
  (bypasses Error 422)
- `unifiedScriptGenerator.js` - Cohesive narrative arcs across segments
- `viralVideoBuilder.js` - Multi-segment generation with frame-to-frame
  transitions
- `videoConcatenator.js` - FFmpeg concatenation + logo outro
- `viralCaptionsGenerator.js` - Automatic viral Instagram/TikTok captions
- `playerCardOverlay.js` - Player stats overlay (seconds 3-6)
- `nanoBananaVeo3Integrator.js` - Nano Banana integration coordinator

**Intelligent Systems**:

- `emotionAnalyzer.js` - 18 emotions, 4 algorithms (keywords 50%, grammar 20%,
  intent 20%, context 10%)
- `cinematicProgressionSystem.js` - 5 progression patterns, 4 shot types
  (prevents "reset" look between segments)
- `audioAnalyzer.js` - FFmpeg silence detection + auto-trimming (prevents "cara
  rara")
- `veo3RetryManager.js` - Smart retry with 30s cooling periods

**Ana Character Consistency**:

- Fixed seed: `ANA_CHARACTER_SEED=30001` (locked to Ana's identity in VEO3
  model)
- Fixed image: `ANA_IMAGE_URL` (32-year-old Spanish analyst, short black curly
  hair, navy blazer)
- Spanish from Spain accent: MUST include "speaks in Spanish from Spain"
  (lowercase) in all prompts
- **WHY**: Changing seed/image breaks visual consistency across all videos

**VEO3 Error 422 Solution** (CRITICAL):

- **Root cause**: KIE.ai blocks ALL player names (Pedri, Lewandowski, etc.) due
  to image rights
- **Automatic fix**: `promptBuilder.js:325-359` replaces names with generic
  references ("el jugador", "el centrocampista")
- **Verification**: Check logs for
  `"[PromptBuilder] 🔧 Usando referencia segura: 'el centrocampista'"`
- **Success rate**: 100% when using generic references vs 0% with player names
- **See**: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`

**Frame-to-Frame Transitions**:

- Last frame of Segment N = First frame of Segment N+1 (exhaustive description)
- Result: Invisible transitions, no crossfade needed
- Implementation: `videoConcatenator.js` + `promptBuilder.js`

### Nano Banana Integration

**Location**: `backend/services/nanoBanana/nanoBananaClient.js`

**Purpose**: Generate contextual Ana images for each video segment with
consistent character appearance.

**How it works**:

- Takes 6 reference images of Ana + context description
- Generates contextual image (e.g., "Ana in TV studio with stats overlay")
- Seed: 12500 (fixed for consistency)
- Cost: ~$0.02 per image
- Used in Phase 1 of 3-Phase VEO3 workflow

**Why critical**: Without Nano Banana, VEO3 would use generic images and Ana's
appearance would be inconsistent across segments.

### BargainAnalyzer System

**Location**: `backend/services/bargainAnalyzer.js`

**Algorithm**:

- Identifies undervalued Fantasy players (high points potential, low price)
- Points estimation + value ratio (points/price) > 1.2
- Constraints: Max price €8.0, min 3 games, min 90 minutes

### Competitive YouTube Analyzer (NEW - Oct 2025)

**Location**: `backend/services/contentAnalysis/` (14 services)

**Purpose**: Automated intelligence system that monitors competitor YouTube
channels to identify trending players, topics, and viral content patterns for
Fantasy La Liga.

**Architecture**:

```
Onboarding → Monitor → Download → Transcribe → Analyze → Recommend
    ↓           ↓          ↓          ↓           ↓          ↓
 Channels   New Videos   Audio    Whisper AI   GPT-5 Mini  Editorial
 Database   Detection    Extract               Content     Planning
                                               Insights

Outlier Detection (Parallel System)
    ↓
 YouTube Search → Filter → Analyze → Generate Scripts
    ↓                ↓          ↓            ↓
 Keywords     Performance   AI Analysis   VEO3 Ready
```

**Key Services**:

- `competitiveOnboardingService.js` - Automated channel onboarding with first
  video analysis
- `youtubeMonitor.js` - Tracks competitor channels for new uploads
- `transcriptionService.js` - Whisper API transcription (~$0.01/video)
- `contentAnalyzer.js` - OpenAI GPT-5 Mini content analysis
- `recommendationEngine.js` - Generates actionable content recommendations
- `viralInsightsIntegration.js` - Extracts viral patterns and hooks
- `automaticVideoProcessor.js` - Background queue processing
- `youtubeOutlierDetector.js` - Detects viral videos by keyword search
- `outlierScriptGenerator.js` - Generates VEO3 scripts from outliers
- `outlierDetectorScheduler.js` - Automated hourly outlier detection
- `playerNameNormalizer.js` - Normalizes player names across sources
- `dataCatalog.js` - Centralized data catalog management
- `contentEnrichmentEngine.js` - Enriches content with additional metadata
- `tempCleaner.js` - Cleans temporary files (videos, audio)

**How it works**:

1. **Onboarding**: Add competitor channel → auto-analyze first video
2. **Monitoring**: Poll YouTube RSS feeds for new videos (cron: every hour)
3. **Processing**: Download audio → transcribe with Whisper → analyze with GPT-5
4. **Intelligence**: Extract players mentioned, topics, viral hooks, engagement
   patterns
5. **Recommendations**: Generate content ideas for Editorial Planning
6. **Outlier Detection**: Hourly search for trending keywords → identify viral
   videos → generate scripts

**Cost per video**: ~$0.01 (Whisper transcription only, GPT-5 Mini cached)

**Key Endpoints**:

- `POST /api/competitive/onboard` - Onboard new competitor channel
- `GET /api/competitive/channels` - List all tracked channels
- `POST /api/content-analysis/analyze` - Analyze specific video
- `GET /api/content-analysis/recommendations` - Get content recommendations
- `POST /api/outliers/detect` - Manually trigger outlier detection
- `GET /api/outliers/recent` - Get recent outliers
- `POST /api/outliers/generate-script` - Generate VEO3 script from outlier

**Dashboards**:

- http://localhost:3000/intel - Competitive Intelligence Dashboard
- http://localhost:3000/planning - Editorial Planning (integrates
  recommendations)

### Instagram Automation Strategy

**Content Mix** (70/20/10 strategy):

- 70% Reels (5/week) - VEO3-generated Ana videos
- 20% Carousels (1-2/week) - ContentDrips API
- 10% Stories (daily) - Engagement

**Workflows**:

- n8n: 8 total (2 active, 6 pending)
- Version tracking: `data/instagram-versions/` (test metadata with feedback
  loop)

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
│   │   ├── veo3/                    # VEO3 video system (22 services - MOST COMPLEX)
│   │   ├── contentAnalysis/         # Competitive YouTube analyzer (14 services)
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

### Running Tests and Scripts

**VEO3 Test Scripts** - Always test changes before deployment:

```bash
# Quick validation (single segment)
npm run veo3:test-nano-banana          # Tests Nano Banana integration

# Full E2E tests (3 segments)
npm run veo3:test-phased               # Tests 3-phase architecture
npm run veo3:e2e-chollo                # Tests complete chollo workflow

# Phase-by-phase debugging
# 1. Test Phase 1 (preparation): curl -X POST http://localhost:3000/api/veo3/prepare-session
# 2. Test Phase 2 (segments): curl -X POST http://localhost:3000/api/veo3/generate-segment
# 3. Test Phase 3 (finalization): curl -X POST http://localhost:3000/api/veo3/finalize-session
```

**Outlier Detection Tests**:

```bash
npm run outliers:test-e2e              # Test outlier detection workflow
npm run outliers:test-complete         # Complete outlier script generation
```

**Quality Checks** - Run before committing:

```bash
npm run quality                        # Runs lint + format check + tests
npm run lint:fix                       # Auto-fix ESLint issues
npm test                               # Run Jest tests only
```

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
            const response = await axios.get(
                `${this.baseUrl}${endpoint}`,
                options
            );
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
router.get('/test', rateLimiter, async (req, res) => {
    /* test endpoint */
});
router.get('/top', rateLimiter, async (req, res) => {
    /* main endpoint */
});
router.get('/position/:pos', rateLimiter, async (req, res) => {
    /* filtered */
});

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

### Session Management & Git Workflow

**Session Close** (end of development session):

```bash
npm run session-close              # Saves work + creates git commit
# Runs: auto-save.sh + complete-session-close.sh
# - Updates .claude/status/CURRENT-SPRINT.md
# - Creates structured git commit
# - Saves session metadata
```

**Quick Save** (during session):

```bash
npm run auto-save                  # Quick save without commit
# Updates tracking files only, no git commit
```

**Git Commit Best Practices**:

- Use semantic commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Reference session timestamps when relevant
- Include VEO3 session IDs in commits for video generation work
- Always run `npm run quality` before committing

**Branch Strategy**:

- `main` - Production-ready code
- `feature/*` - New features (e.g., `feature/competitive-youtube-analyzer`)
- Always create feature branch for significant changes
- Keep commits atomic and focused

---

## 🔄 Common Workflows

### Workflow 1: Session Start (3 min) - MANDATORY

**Every session MUST start with this checklist**:

```bash
# 1. Read context files
cat .claude/rules/01-CRITICAL-RULES.md
cat .claude/status/CURRENT-SPRINT.md
cat .claude/status/PRIORITIES.md

# 2. Start server
npm run dev

# 3. Health check
curl http://localhost:3000/api/test/ping
```

**Next Steps by Task Type**:

- **New feature** → See Workflow 2
- **Debugging** → See Workflow 3
- **VEO3 work** → Consult `.claude/rules/05-veo3.md`
- **API integration** → Consult `.claude/rules/04-apis.md`

**Details**: See `.claude/workflows/session-start.md`

---

### Workflow 2: Adding New Feature (15-30 min)

**CRITICAL**: Always prefer reusing existing code over creating new files.

#### Step 1: Verify Feature Doesn't Exist (3 min)

```bash
# Search similar services
ls backend/services/ | grep -i [keyword]

# Search similar endpoints
ls backend/routes/ | grep -i [keyword]

# Search similar frontend
ls frontend/ | grep -i [keyword]
```

**STOP**: If similar functionality exists, reuse it. Do NOT create duplicates.

#### Step 2: Consult Rules (2 min)

```bash
# Read critical rules
cat .claude/rules/01-CRITICAL-RULES.md

# Read development guidelines
cat .claude/rules/02-development.md
```

#### Step 3: Implement (10-20 min)

**Code Standards**:

- ✅ Use Winston logger (NO `console.log`)
- ✅ Validate inputs with Joi
- ✅ Add try/catch in async functions
- ✅ Apply rate limiting for external APIs

**VEO3-specific**:

- ✅ Seed = 30001 (NEVER change)
- ✅ Prompts <80 words
- ✅ Use generic references ("el jugador", NOT player names)
- ✅ "speaks in Spanish from Spain" (lowercase)

#### Step 4: Test (5 min)

```bash
npm run lint:fix      # Auto-fix issues
npm test             # Run tests
npm run dev          # Test locally
```

#### Step 5: Document

- Update `.claude/reference/endpoints.md` (if API)
- Update `.claude/reference/services.md` (if service)
- Add JSDoc comments to public functions

**Details**: See `.claude/workflows/new-feature.md`

---

### Workflow 3: Debugging Issues (5-15 min)

#### Step 1: Identify Problem (2 min)

```bash
# Check recent logs
tail -100 logs/combined-*.log | grep ERROR

# For VEO3 issues
cat output/veo3/sessions/session_[timestamp]/progress.json
grep "VEO3" logs/combined-*.log
```

#### Step 2: Check Common Issues

Consult "Common Issues & Solutions" section below for:

- VEO3 Error 422
- Ana Mexican accent
- VEO3 timeouts
- Database connection issues
- Rate limiting errors

#### Step 3: Component-Specific Debugging

**VEO3 System**:

```bash
# View sessions
ls -la output/veo3/sessions/

# Check progress
cat output/veo3/sessions/session_[id]/progress.json

# VEO3 logs
grep "VEO3" logs/combined-*.log | tail -50
```

**Database**:

```bash
npm run db:test      # Test connection
npm run db:init      # Reset schema
```

**APIs**:

```bash
# Test API-Sports
curl -H "x-apisports-key: $API_FOOTBALL_KEY" \
  "https://v3.football.api-sports.io/status"
```

#### Step 4: Log Analysis

```bash
# Structured Winston logs
grep "error" logs/combined-*.log

# Performance issues
grep "duration" logs/combined-*.log

# Rate limiting
grep "Rate limit" logs/combined-*.log
```

**Details**: See `.claude/workflows/debugging.md`

---

### Workflow 4: VEO3 Video Generation (10-15 min)

**Use 3-Phase Architecture** (recommended):

#### Phase 1: Prepare Session (2-3 min)

```bash
# Generate script + contextual images
curl -X POST http://localhost:3000/api/veo3/prepare-session \
  -H "Content-Type: application/json" \
  -d '{
    "playerData": {...},
    "contentType": "chollo_viral",
    "preset": "chollo_viral"
  }'
```

**Output**: sessionId + script + 3 Nano Banana images

#### Phase 2: Generate Segments (3-4 min × 3)

```bash
# Generate each segment individually
for segment in 0 1 2; do
  curl -X POST http://localhost:3000/api/veo3/generate-segment \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"session_[timestamp]\",
      \"segmentIndex\": $segment
    }"
done
```

**Advantage**: If one segment fails, retry only that segment (not entire video)

#### Phase 3: Finalize (1 min)

```bash
# Concatenate segments + add logo
curl -X POST http://localhost:3000/api/veo3/finalize-session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_[timestamp]"
  }'
```

**Test Command**:

```bash
npm run veo3:test-phased     # E2E test of 3-phase workflow
npm run veo3:e2e-chollo      # Complete chollo workflow
```

**Monitoring**:

```bash
# Watch progress in real-time
watch -n 5 cat output/veo3/sessions/session_[id]/progress.json
```

**Critical Rules**:

- ❌ NEVER change `ANA_CHARACTER_SEED=30001`
- ❌ NEVER use player names in prompts (auto-replaced)
- ✅ ALWAYS use "speaks in Spanish from Spain" (lowercase)
- ✅ Timeouts: ≥120s initial, ≥45s status

---

### Workflow 5: Session Close (5 min) - MANDATORY

**NEVER end a session without completing this**:

#### Step 1: Update Status Files (2 min)

**A. Update CURRENT-SPRINT.md**:

```markdown
## ✅ Completado Hoy

- [x] [Task completed today]

## 🚧 En Progreso

- [ ] [Task in progress]

## 📝 Notas Importantes

- [Technical decision made]
```

**B. Update PRIORITIES.md**:

```markdown
### ✅ COMPLETADO

- [x] **[Task name]** - [Date] - [Description]

### 🚧 EN PROGRESO

- [ ] **[Task name]** - [Status]
```

**C. Update DECISIONS-LOG.md** (if applicable):

```markdown
### [Date]: [Decision Title]

**Decisión**: [Technical decision] **Problema**: [Problem it solved]
**Resultado**: [Outcome]
```

#### Step 2: Git Commit (1 min)

```bash
# Use structured commit message
git add .
git commit -m "feat: [Description]

- ✅ Completed: [Task 1]
- ✅ Completed: [Task 2]
- 🚧 In progress: [Task 3]

Refs: .claude/status/CURRENT-SPRINT.md"

git push origin main
```

#### Step 3: Quality Check (1 min)

```bash
npm run lint     # Must pass
npm test         # Must pass
curl http://localhost:3000/api/test/ping  # Must return 200
```

#### Step 4: Session Summary (1 min)

**Template for user**:

```markdown
## ✅ Sesión Completada - [Date]

### 🎯 Objetivos Cumplidos

- ✅ [Objective 1]
- ✅ [Objective 2]

### 📊 Progreso del Sprint

- **Completado**: X tareas
- **En progreso**: Y tareas

### 🔄 Estado Guardado

- ✅ Status files updated
- ✅ Git commit created
- ✅ Tests passing

### 🚀 Próxima Sesión

- [ ] [Priority task 1]
- [ ] [Priority task 2]
```

**Automated Command**:

```bash
npm run session-close    # Runs all steps automatically
```

**Details**: See `.claude/workflows/session-close.md`

---

### Workflow 6: Database Changes (10 min)

**CRITICAL**: ALWAYS update BOTH files when modifying schema.

#### Step 1: Update Schema Files (5 min)

```bash
# 1. Edit PostgreSQL schema
vim database/supabase-schema.sql

# 2. Edit initialization script
vim database/init-database.js

# Both files MUST stay in sync
```

#### Step 2: Apply Changes (2 min)

```bash
npm run db:init      # Apply schema changes
npm run db:test      # Verify connectivity
```

#### Step 3: Verify (3 min)

```bash
# Test endpoints that use new schema
curl http://localhost:3000/api/[endpoint]

# Check logs for errors
tail -50 logs/combined-*.log | grep -i database
```

**Example**: Adding new table for outliers

```sql
-- database/supabase-schema.sql
CREATE TABLE IF NOT EXISTS outlier_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT NOT NULL,
  player_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

```javascript
// database/init-database.js
await client.query(`
  CREATE TABLE IF NOT EXISTS outlier_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    player_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
```

---

### Workflow 7: Deployment (30-45 min)

**Pre-deployment Checklist**:

#### Code Quality (5 min)

- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] No `console.log` in code
- [ ] Winston logger used everywhere
- [ ] All secrets in `.env` (not hardcoded)

#### API Configuration (5 min)

- [ ] Rate limiting applied to all external APIs
- [ ] Error handling robust
- [ ] Timeouts configured correctly
- [ ] API documentation downloaded to `docs/`

#### VEO3 System (5 min)

- [ ] `ANA_CHARACTER_SEED=30001` verified
- [ ] `ANA_IMAGE_URL` correct
- [ ] Prompts <80 words validated
- [ ] Generic references used (no player names)
- [ ] Timeouts: 120s initial, 45s status

#### Database (5 min)

- [ ] Schema updated in BOTH files
- [ ] Migrations applied: `npm run db:init`
- [ ] Backup created before deploy

#### Environment Variables (5 min)

```bash
# Verify all critical variables
echo $API_FOOTBALL_KEY
echo $KIE_AI_API_KEY
echo $DATABASE_URL
echo $OPENAI_API_KEY
echo $YOUTUBE_API_KEY
```

#### Health Checks (5 min)

```bash
# Post-deployment verification
curl http://localhost:3000/api/test/ping
curl http://localhost:3000/api/test/database
curl http://localhost:3000/api/test/veo3
```

#### Rollback Plan

If deployment fails:

1. Stop service
2. Restore database backup
3. Revert code: `git revert HEAD`
4. Restart service

**Details**: See `.claude/workflows/deployment.md`

---

### Quick Workflow Reference

| Task            | Workflow   | Time      | Command                    |
| --------------- | ---------- | --------- | -------------------------- |
| Start session   | Workflow 1 | 3 min     | See session-start.md       |
| Add feature     | Workflow 2 | 15-30 min | See new-feature.md         |
| Debug issue     | Workflow 3 | 5-15 min  | See debugging.md           |
| Generate video  | Workflow 4 | 10-15 min | `npm run veo3:test-phased` |
| Close session   | Workflow 5 | 5 min     | `npm run session-close`    |
| Update database | Workflow 6 | 10 min    | `npm run db:init`          |
| Deploy          | Workflow 7 | 30-45 min | See deployment.md          |

**Full workflow documentation**: `.claude/workflows/`

---

## 🐛 Common Issues & Solutions

### VEO3 Error 422 "failed" / "Names not allowed"

**Symptom**: Video generation fails with Error 422 **Cause**: KIE.ai blocks ALL
player names due to image rights **Solution**: System auto-uses generic
references via `promptBuilder.js:325-359` **Verify**: Check logs for
`"[PromptBuilder] 🔧 Usando referencia segura: 'el centrocampista'"` **If
missing**: Verify `playerNameOptimizer` is imported in `promptBuilder.js`
**See**: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`

### Ana has Mexican accent

**Cause**: Missing or incorrect "speaks in Spanish from Spain" in prompt
**Solution**: Verify `promptBuilder.js` uses lowercase "speaks" (not "SPEAKING")
**Pattern**: "The person from the reference image speaks in Spanish from Spain"

### VEO3 timeouts

**Cause**: Axios timeout too short for video generation (4-6 minutes)
**Solution**: Verify `veo3Client.js` has `timeout: 120000` (initial) and
`timeout: 45000` (status) **Note**: Server timeout already set to 15min in
`server.js:339`

### API-Sports returns wrong teams

**Cause**: Using wrong season ID **Solution**: Always use `season=2025` for
2025-26 season (not 2024)

### Duplicate files created

**Cause**: Not checking `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` before
creating files **Solution**: ALWAYS search existing files first, follow NORMA #1
checklist

### Server not starting / Port 3000 in use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`
**Diagnostic**: `lsof -i :3000` to find process using port **Solution**: Kill
process with `kill -9 [PID]` or use different port in .env

### VEO3 3-Phase workflow stuck

**Symptom**: `progress.json` shows incomplete status **Diagnostic steps**:

```bash
# 1. Check session progress
cat output/veo3/sessions/session_[timestamp]/progress.json

# 2. Check logs for errors
tail -100 logs/combined-*.log | grep ERROR

# 3. Verify segment files exist
ls -lh output/veo3/sessions/session_[timestamp]/
```

**Solution**: Retry failed phase using same sessionId - system preserves
completed work

### Nano Banana image generation fails

**Symptom**: Error 400 or 422 from Nano Banana API **Cause**: Prompt too complex
or reference images not accessible **Diagnostic**: Check logs for
`[NanoBananaClient]` entries **Solution**: Verify `ANA_IMAGE_URL` is accessible
and prompt is <80 words

### Database connection timeout

**Symptom**: `Connection timeout` errors from Supabase **Diagnostic**:
`npm run db:test` to check connectivity **Solution**:

- Verify `.env.supabase` has correct credentials
- Run `npm run db:keep-alive` to maintain connection
- Check Supabase dashboard for project status

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

- `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md` - CRITICAL: Read before creating
  ANY file

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
# Instagram & Social
CONTENTDRIPS_API_KEY=your_key           # Instagram carousels automation
INSTAGRAM_ACCESS_TOKEN=your_token       # Instagram Graph API
INSTAGRAM_ACCOUNT_ID=your_account_id    # Instagram business account ID
FACEBOOK_PAGE_ID=your_page_id           # Facebook page linked to Instagram

# Content Analysis (Competitive Intelligence)
OPENAI_API_KEY=your_key                 # GPT-5 Mini for content analysis
YOUTUBE_API_KEY=your_key                # YouTube Data API v3

# Image Generation
NANO_BANANA_API_KEY=your_key            # Nano Banana contextual images
GEMINI_API_KEY=your_key                 # Google Gemini (optional, for testing)

# Other integrations
AEMET_API_KEY=your_key                  # Spanish weather data (optional)
```

**Environment Variable Priority**:

1. **CRITICAL** (system won't work): `API_FOOTBALL_KEY`, `KIE_AI_API_KEY`,
   `DATABASE_URL`
2. **IMPORTANT** (features won't work): `OPENAI_API_KEY`, `YOUTUBE_API_KEY`,
   `NANO_BANANA_API_KEY`
3. **OPTIONAL** (nice-to-have): `CONTENTDRIPS_API_KEY`, `AEMET_API_KEY`

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

**Monthly Costs (Active)**:

- API-Sports Ultra: $29/mo (75k req/day)
- VEO3 (KIE.ai): ~$19/mo (20 videos × $0.96 with Nano Banana)
    - Per video: $0.90 VEO3 (3 segments × $0.30) + $0.06 Nano Banana (3 images)
- Supabase: $0 (free tier)
- n8n: $0 (self-hosted)

**Pending**:

- ContentDrips: $39/mo (carousel automation, pending activation)

**Total Active**: $48/mo | **Projected with ContentDrips**: $87/mo

**Cost Breakdown per Video**:

- Phase 1: $0.06 (Nano Banana images only)
- Phase 2: $0.90 (VEO3 3 segments × $0.30)
- Phase 3: $0 (local FFmpeg concatenation)
- **Total**: $0.96/video

---

## 🎯 Quick Reference - Start Here

**Every Session Start (3 min)**:

1. Read `.claude/rules/01-CRITICAL-RULES.md` (unbreakable rules)
2. Read `.claude/status/CURRENT-SPRINT.md` (current state)
3. Check `.claude/status/PRIORITIES.md` (P0/P1/P2 tasks)
4. Run: `npm run dev && curl http://localhost:3000/api/test/ping`

**VEO3 Critical Rules**:

- ❌ NEVER change `ANA_CHARACTER_SEED=30001` or `ANA_IMAGE_URL`
- ❌ NEVER use player names in prompts (auto-replaced with "el jugador", "el
  centrocampista")
- ✅ ALWAYS use "speaks in Spanish from Spain" (lowercase)
- ✅ ALWAYS use 3-phase workflow: `npm run veo3:test-phased`
- Timeouts: ≥120s (initial), ≥45s (status polling)

**La Liga Season 2025-26**:

- API-Sports season ID: **2025** (not 2024)
- 20 teams (new: Levante, Elche, Real Oviedo)
- Config: `backend/config/constants.js`

**Before Creating Files**:

1. Search: `ls backend/services/ | grep -i [keyword]`
2. Check: `docs/NORMAS_DESARROLLO_IMPRESCINDIBLES.md`
3. MODIFY > CREATE (always prefer editing existing)

**Database Changes**:

1. Update `database/supabase-schema.sql`
2. Update `database/init-database.js`
3. Run: `npm run db:init`

---

**Last Updated**: 2025-10-16 **Version**: 2.6.0 **Maintained by**: Claude Code

## 🆕 Recent Critical Updates

### Oct 16, 2025 - Complete Workflows Integration ⭐ MAJOR

- **Added comprehensive "Common Workflows" section** with 7 detailed workflows:
    - Workflow 1: Session Start (3 min) - MANDATORY
    - Workflow 2: Adding New Feature (15-30 min)
    - Workflow 3: Debugging Issues (5-15 min)
    - Workflow 4: VEO3 Video Generation (10-15 min)
    - Workflow 5: Session Close (5 min) - MANDATORY
    - Workflow 6: Database Changes (10 min)
    - Workflow 7: Deployment (30-45 min)
- **Quick Workflow Reference table** for instant lookup
- **Step-by-step instructions** with time estimates and commands
- **Cross-references** to detailed workflow files in `.claude/workflows/`
- **Integration** of existing workflow documentation into main CLAUDE.md

### Oct 16, 2025 - CLAUDE.md Analysis & Improvements

- Added script execution patterns and test command details
- Clarified 3-phase VEO3 workflow with retry patterns
- Enhanced troubleshooting section with specific diagnostic steps
- Updated environment variables section with all required keys
- Verified all npm scripts in package.json are documented

### Oct 16, 2025 - CLAUDE.md Maintenance

- Removed resolved P0 reference (PENDING_FIX_OUTLIERS_PRESENTERS.md - presenter
  selection fixed)
- Updated session start time: 4min → 3min
- Verified service counts accurate (VEO3: 22, contentAnalysis: 14)
- Updated directory structure with contentAnalysis folder

### Oct 14, 2025 - CLAUDE.md Improvements

- Added Competitive YouTube Analyzer service details (14 services)
- Updated service counts: VEO3 (22 services), contentAnalysis (14 services)
- Added missing `nanoBananaVeo3Integrator.js` to VEO3 core services
- Clarified outlier detection system architecture
- Added dashboards section for competitive intelligence

### Oct 13, 2025 - CLAUDE.md Refinements

- Enhanced 3-Phase VEO3 Architecture documentation with visual diagram
- Reorganized Essential Commands with 3-phase system as primary
- Updated cost tracking with accurate Nano Banana costs ($0.96/video)
- Simplified TL;DR → Quick Reference with actionable steps
- Added session management commands (session-close, auto-save)

### Oct 11, 2025 - 3-Phase VEO3 Architecture ⭐ MAJOR

- **Problem solved**: Server timeouts eliminated (15 min → 3×4 min requests)
- Implemented Phase 1 (prepare-session), Phase 2 (generate-segment), Phase 3
  (finalize-session)
- Endpoints: `veo3.js:1772-2493` (3 new endpoints)
- Test script: `npm run veo3:test-phased`
- Benefits: Retriable segments, visible progress, persistent state

### Oct 11, 2025 - VEO3 Prompt Optimization

- Dialogue length: 10 words → 40-45 words (prevents VEO3 inventing content)
- Duration: 7s → 8s (matches playground standard)
- Speech rate: 2.5 → 5 words/sec (natural speaking)
- New method: `buildEnhancedNanoBananaPrompt()` in `promptBuilder.js`

### Oct 6, 2025 - VEO3 Critical Fix (100% Success Rate)

- Fixed 100% failure → 100% success rate
- Root cause: Player names blocked by KIE.ai (image rights)
- Solution: Dictionary-based generic references ("el jugador", "el
  centrocampista")
- Timeout increase: 60s → 120s (initial), 15s → 45s (status)
- See: `docs/VEO3_FIX_REGRESION_OCTUBRE_2025.md`
