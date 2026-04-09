# ARCHITECTURE.md: CSAT Prep Tool

**Version:** 1.0
**Date:** April 6, 2026
**Prereq:** Read PRD.md first

---

## 1. System Overview

Single Next.js application serving both student and admin interfaces. Server-side rendering for content pages, client-side interactivity for practice/mock sessions. Neon PostgreSQL for persistence, BetterAuth for role-based auth, Drizzle ORM for type-safe queries. Deployed on Railway Pro.

```
┌──────────────────────────────────────────────────┐
│                    Next.js App                    │
│                                                   │
│  /learn/*  (Student)    /admin/*  (Admin)         │
│  /api/*    (API Routes)                           │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ BetterAuth│  │ Drizzle  │  │ KaTeX (client) │  │
│  │ (Auth)    │  │ (ORM)    │  │ (Math render)  │  │
│  └─────┬────┘  └─────┬────┘  └────────────────┘  │
│        │              │                            │
└────────┼──────────────┼────────────────────────────┘
         │              │
         ▼              ▼
   ┌──────────┐   ┌──────────┐
   │ Neon     │   │ Railway  │
   │ Postgres │   │ Pro      │
   └──────────┘   └──────────┘
```

No external AI API calls at runtime. No separate backend service. No Redis/cache layer for v1 — Neon handles everything.

## 2. Tech Stack Details

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack in one repo, RSC for content pages, API routes for data mutations |
| Database | Neon (PostgreSQL) | Already used for Poko, serverless-friendly, branching for dev/staging |
| ORM | Drizzle | Lightweight, SQL-like, type-safe, fast. Better DX than Prisma for this scale |
| Auth | BetterAuth | Already used for Poko, supports role-based access (student/admin) |
| Styling | Tailwind CSS | Fast iteration, utility-first, responsive by default |
| Math rendering | KaTeX | Client-side LaTeX rendering, lighter than MathJax |
| Markdown rendering | react-markdown + rehype-katex | For cheatsheets and solutions with embedded math |
| File uploads | Next.js API routes + Neon (or Railway volume) | Question images, bulk import CSVs |
| Deployment | Railway Pro | Already has Pro plan, handles Next.js well |

## 3. Project Structure

```
csat-prep/
├── drizzle/
│   ├── schema.ts              # All table definitions
│   ├── migrations/            # Auto-generated migrations
│   └── seed.ts                # Seed data (topics, pattern types, sample questions)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with auth provider
│   │   ├── page.tsx           # Landing/login page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── learn/             # Student routes (protected: role=student)
│   │   │   ├── layout.tsx     # Student shell (sidebar, formula card button)
│   │   │   ├── page.tsx       # Student dashboard
│   │   │   ├── daily/         # Daily Dose
│   │   │   │   └── page.tsx
│   │   │   ├── topics/
│   │   │   │   ├── page.tsx           # Topic list (by section)
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx       # Topic module (cheatsheet + resources)
│   │   │   │       └── practice/
│   │   │   │           └── page.tsx   # Practice session
│   │   │   ├── mock/
│   │   │   │   ├── page.tsx           # Mock test list/start
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # Active mock session
│   │   │   │   │   └── review/
│   │   │   │   │       └── page.tsx   # Post-mock analysis
│   │   │   ├── revision/
│   │   │   │   └── page.tsx           # Revision queue
│   │   │   ├── strategy/
│   │   │   │   └── page.tsx           # Paper-taking strategy
│   │   │   └── formulas/
│   │   │       └── page.tsx           # Formula/shortcut card
│   │   ├── admin/             # Admin routes (protected: role=admin)
│   │   │   ├── layout.tsx     # Admin shell
│   │   │   ├── page.tsx       # Admin dashboard (analytics overview)
│   │   │   ├── questions/
│   │   │   │   ├── page.tsx           # Question bank (list, filter, search)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Add single question
│   │   │   │   ├── import/
│   │   │   │   │   └── page.tsx       # Bulk import
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Edit question
│   │   │   ├── topics/
│   │   │   │   ├── page.tsx           # Topic manager
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Edit topic (cheatsheet, resources, patterns)
│   │   │   ├── patterns/
│   │   │   │   └── page.tsx           # Pattern type manager (coverage dashboard)
│   │   │   └── students/
│   │   │       ├── page.tsx           # Student list + overview
│   │   │       └── [id]/
│   │   │           └── page.tsx       # Per-student analytics
│   │   └── api/
│   │       ├── auth/[...all]/         # BetterAuth catch-all
│   │       ├── questions/             # Question CRUD
│   │       ├── attempts/              # Record practice/mock attempts
│   │       ├── daily-dose/            # Generate daily dose
│   │       ├── mock/                  # Mock test lifecycle
│   │       ├── revision/              # Revision queue operations
│   │       └── import/                # Bulk import endpoint
│   ├── components/
│   │   ├── ui/                # Base UI components (Button, Card, Input, Modal, etc.)
│   │   ├── question-card.tsx  # Question display with options, timer, ABC tag
│   │   ├── solution-view.tsx  # Smart + detailed solution with option explanations
│   │   ├── mock-timer.tsx     # Global countdown + per-question tracking
│   │   ├── abc-tagger.tsx     # A/B/C button group for mock tagging
│   │   ├── topic-card.tsx     # Topic module card (status, progress)
│   │   ├── formula-panel.tsx  # Sliding formula/shortcut card
│   │   ├── progress-ring.tsx  # Circular progress indicator
│   │   ├── abc-tracker.tsx    # ABC conversion visualization
│   │   ├── markdown-render.tsx # Markdown + KaTeX renderer
│   │   └── difficulty-badge.tsx # L1/L2/L3 badge
│   ├── lib/
│   │   ├── db.ts              # Drizzle client + Neon connection
│   │   ├── auth.ts            # BetterAuth config
│   │   ├── question-engine.ts # Adaptive question selection logic
│   │   ├── daily-dose.ts      # Daily dose composition logic
│   │   ├── revision.ts        # Revision queue scheduling logic
│   │   ├── mock-analysis.ts   # Post-mock behavioral analysis computation
│   │   ├── progress.ts        # Topic/pattern progress calculations
│   │   └── utils.ts           # Shared utilities
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── public/
│   └── uploads/               # Question images (or use external storage later)
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── package.json
└── CLAUDE.md
```

## 4. Database Schema

### 4.1 Core Tables

```
users
├── id              UUID PK DEFAULT gen_random_uuid()
├── email           TEXT UNIQUE NOT NULL
├── name            TEXT NOT NULL
├── role            TEXT NOT NULL CHECK (role IN ('student', 'admin'))
├── created_at      TIMESTAMPTZ DEFAULT now()
└── (BetterAuth managed fields: password hash, sessions, etc.)

topics
├── id              UUID PK DEFAULT gen_random_uuid()
├── section         TEXT NOT NULL CHECK (section IN ('rc', 'lr', 'math'))
├── name            TEXT NOT NULL
├── slug            TEXT UNIQUE NOT NULL
├── display_order   INT NOT NULL
├── cheatsheet      TEXT                    -- Markdown content
├── dependency_ids  UUID[]                  -- Array of prerequisite topic IDs
├── status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'))
├── created_at      TIMESTAMPTZ DEFAULT now()
└── updated_at      TIMESTAMPTZ DEFAULT now()

pattern_types
├── id              UUID PK DEFAULT gen_random_uuid()
├── topic_id        UUID NOT NULL REFERENCES topics(id)
├── name            TEXT NOT NULL            -- e.g., "successive percentage change"
├── description     TEXT
├── display_order   INT NOT NULL
└── created_at      TIMESTAMPTZ DEFAULT now()

resources
├── id              UUID PK DEFAULT gen_random_uuid()
├── topic_id        UUID NOT NULL REFERENCES topics(id)
├── type            TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'article'))
├── title           TEXT NOT NULL
├── url             TEXT NOT NULL
├── language        TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi'))
├── display_order   INT NOT NULL
└── created_at      TIMESTAMPTZ DEFAULT now()

questions
├── id              UUID PK DEFAULT gen_random_uuid()
├── topic_id        UUID NOT NULL REFERENCES topics(id)
├── pattern_type_id UUID REFERENCES pattern_types(id)
├── subtopic        TEXT
├── difficulty      TEXT NOT NULL CHECK (difficulty IN ('l1', 'l2', 'l3'))
├── question_text   TEXT NOT NULL            -- Supports markdown + KaTeX
├── image_url       TEXT                     -- Nullable, for diagram questions
├── option_a        TEXT NOT NULL
├── option_b        TEXT NOT NULL
├── option_c        TEXT NOT NULL
├── option_d        TEXT NOT NULL
├── correct_option  TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd'))
├── smart_solution  TEXT NOT NULL            -- Intuitive/shortcut approach
├── detailed_solution TEXT                   -- Formula-based approach (optional)
├── option_a_explanation TEXT               -- Why A is right/wrong
├── option_b_explanation TEXT
├── option_c_explanation TEXT
├── option_d_explanation TEXT
├── source_type     TEXT NOT NULL CHECK (source_type IN ('pyq', 'cat', 'ai', 'custom'))
├── source_year     INT                      -- For PYQs: 2016, 2017, etc.
├── language        TEXT DEFAULT 'en'
├── is_archived     BOOLEAN DEFAULT false
└── created_at      TIMESTAMPTZ DEFAULT now()
```

### 4.2 Student Activity Tables

```
attempts
├── id              UUID PK DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── question_id     UUID NOT NULL REFERENCES questions(id)
├── selected_option TEXT CHECK (selected_option IN ('a', 'b', 'c', 'd'))
├── is_correct      BOOLEAN NOT NULL
├── time_spent_secs INT NOT NULL
├── context         TEXT NOT NULL CHECK (context IN ('practice', 'mock', 'revision', 'daily'))
├── session_id      UUID                     -- Groups attempts in same practice/daily session
└── created_at      TIMESTAMPTZ DEFAULT now()

mock_tests
├── id              UUID PK DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── type            TEXT NOT NULL CHECK (type IN ('topic', 'section', 'full'))
├── topic_id        UUID REFERENCES topics(id)  -- For topic-wise mocks
├── section_filter  TEXT                         -- For section-wise: 'rc', 'lr', 'math'
├── status          TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
├── started_at      TIMESTAMPTZ DEFAULT now()
├── completed_at    TIMESTAMPTZ
└── total_time_secs INT

mock_test_responses
├── id              UUID PK DEFAULT gen_random_uuid()
├── mock_test_id    UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE
├── question_id     UUID NOT NULL REFERENCES questions(id)
├── selected_option TEXT                      -- Nullable = skipped
├── is_correct      BOOLEAN
├── abc_tag         TEXT NOT NULL CHECK (abc_tag IN ('a', 'b', 'c'))
├── time_spent_secs INT NOT NULL
└── display_order   INT NOT NULL

revision_queue
├── id              UUID PK DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── pattern_type_id UUID NOT NULL REFERENCES pattern_types(id)
├── original_question_id UUID NOT NULL REFERENCES questions(id)
├── next_review_at  TIMESTAMPTZ NOT NULL
├── review_count    INT DEFAULT 0
├── last_reviewed_at TIMESTAMPTZ
├── status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'persistent'))
└── created_at      TIMESTAMPTZ DEFAULT now()

daily_doses
├── id              UUID PK DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── date            DATE NOT NULL
├── question_ids    UUID[] NOT NULL
├── completed       BOOLEAN DEFAULT false
├── score           INT                       -- Correct count
├── total_time_secs INT
├── completed_at    TIMESTAMPTZ
└── UNIQUE(user_id, date)
```

### 4.3 Progress Tracking Tables

```
topic_progress
├── id              UUID PK DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── topic_id        UUID NOT NULL REFERENCES topics(id)
├── current_level   TEXT DEFAULT 'l1' CHECK (current_level IN ('l1', 'l2', 'l3'))
├── l1_attempts     INT DEFAULT 0
├── l1_correct      INT DEFAULT 0
├── l2_attempts     INT DEFAULT 0
├── l2_correct      INT DEFAULT 0
├── l3_attempts     INT DEFAULT 0
├── l3_correct      INT DEFAULT 0
├── status          TEXT DEFAULT 'red' CHECK (status IN ('red', 'amber', 'green'))
├── needs_help      BOOLEAN DEFAULT false
├── admin_notes     TEXT
├── updated_at      TIMESTAMPTZ DEFAULT now()
└── UNIQUE(user_id, topic_id)

pattern_progress
├── id              UUID PK DEFAULT gen_random_uuid()
├── user_id         UUID NOT NULL REFERENCES users(id)
├── pattern_type_id UUID NOT NULL REFERENCES pattern_types(id)
├── attempts_count  INT DEFAULT 0
├── correct_count   INT DEFAULT 0
├── last_abc_tag    TEXT CHECK (last_abc_tag IN ('a', 'b', 'c'))
├── trend           TEXT DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining'))
├── updated_at      TIMESTAMPTZ DEFAULT now()
└── UNIQUE(user_id, pattern_type_id)

formula_cards
├── id              UUID PK DEFAULT gen_random_uuid()
├── topic_id        UUID NOT NULL REFERENCES topics(id)
├── content         TEXT NOT NULL              -- Markdown + KaTeX
├── display_order   INT NOT NULL
└── updated_at      TIMESTAMPTZ DEFAULT now()
```

### 4.4 Key Indexes

```sql
CREATE INDEX idx_questions_topic ON questions(topic_id) WHERE NOT is_archived;
CREATE INDEX idx_questions_pattern ON questions(pattern_type_id) WHERE NOT is_archived;
CREATE INDEX idx_questions_difficulty ON questions(topic_id, difficulty) WHERE NOT is_archived;
CREATE INDEX idx_attempts_user ON attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_question ON attempts(user_id, question_id);
CREATE INDEX idx_revision_user_active ON revision_queue(user_id, next_review_at) WHERE status = 'active';
CREATE INDEX idx_mock_responses_mock ON mock_test_responses(mock_test_id);
CREATE INDEX idx_topic_progress_user ON topic_progress(user_id);
CREATE INDEX idx_pattern_progress_user ON pattern_progress(user_id);
CREATE INDEX idx_daily_dose_user_date ON daily_doses(user_id, date);
```

## 5. Core Algorithms

### 5.1 Question Selection Engine (`lib/question-engine.ts`)

**Purpose:** Select the next batch of questions for practice/daily dose, avoiding repeats and ensuring pattern coverage.

```
selectQuestions(userId, topicId, difficulty, batchSize = 10):
  1. Get all questions for (topicId, difficulty) that are not archived
  2. Get all question IDs the user has already attempted in this topic+difficulty
  3. Get pattern types for this topic
  4. For each pattern type, count how many unattempted questions exist
  5. Select questions prioritizing:
     a. Pattern types with ZERO attempts (cover all patterns first)
     b. Pattern types with lowest accuracy (strengthen weak patterns)
     c. Unattempted questions over attempted ones
  6. If batchSize > unattempted questions, include attempted questions
     the user got WRONG previously (but not in last 24 hours)
  7. Return shuffled batch
```

### 5.2 Daily Dose Composition (`lib/daily-dose.ts`)

**Purpose:** Generate daily mixed practice set.

```
generateDailyDose(userId, date):
  1. Check if dose already exists for this date — return existing if so
  2. Get user's topic progress (all topics)
  3. Get active revision queue items due today or overdue
  4. Compose 18 questions:
     - 7 questions from weak topics (status = 'red', lowest accuracy first)
     - 5 questions from active topics (status = 'amber', current level)
     - 4 questions from revision queue (pattern-matched different questions)
     - 2 questions from strong topics (status = 'green', prevent decay)
  5. Ensure mix across sections (at least 3 RC, 3 LR, 3 Math)
  6. Use question selection engine for each bucket
  7. Shuffle final set
  8. Store in daily_doses table
  9. Return question IDs
```

### 5.3 Revision Queue Scheduling (`lib/revision.ts`)

```
onWrongAnswer(userId, questionId):
  1. Get pattern_type_id from question
  2. Check if active revision entry exists for this user + pattern_type
  3. If NO: create new entry, next_review_at = now + 1 day
  4. If YES and status = 'resolved': reactivate, reset review_count, next_review_at = now + 1 day
  5. If YES and status = 'active': don't duplicate

onRevisionAttempt(userId, revisionQueueId, isCorrect):
  1. If correct:
     - If review_count >= 2: mark status = 'resolved'
     - Else: increment review_count, set next_review_at based on schedule
       - review_count 0 → next in 3 days
       - review_count 1 → next in 7 days
  2. If wrong:
     - Reset review_count = 0, next_review_at = now + 1 day
     - If total wrong attempts on this pattern > 5: mark status = 'persistent'
       (flags on admin dashboard)

selectRevisionQuestion(userId, patternTypeId, excludeQuestionId):
  1. Find questions with same pattern_type_id, excluding original question
  2. Prefer questions user hasn't seen
  3. If none available at same difficulty, try adjacent difficulty
  4. Last resort: return original question (edge case for thin banks)
```

### 5.4 Mock Test Analysis (`lib/mock-analysis.ts`)

```
analyzeMock(mockTestId):
  1. Fetch all responses with questions joined
  2. Calculate:
     - raw_score: correct_count * 2.5
     - negative_marks: wrong_count * 0.83
     - net_score: raw_score - negative_marks
     - section_scores: { rc, lr, math } each with correct/wrong/skipped/score
  3. ABC analysis:
     - a_questions: { count, correct, wrong, accuracy }
     - b_questions: { count, attempted_in_review, correct, wrong, accuracy }
     - c_questions: { count, easy_ones_skipped (where difficulty = 'l1' or 'l2') }
  4. Time analysis:
     - time_per_section: { rc, lr, math } in seconds
     - wasted_time: questions where time > 180s AND is_correct = false
     - avg_time_per_question: by section
  5. Compare with cutoff (66/200)
  6. If previous mocks exist for this user:
     - abc_trend: compare A/B/C counts across last 3 mocks
     - score_trend: compare net scores
  7. Return full analysis object
```

### 5.5 Progress Computation (`lib/progress.ts`)

```
updateTopicProgress(userId, topicId):
  1. Count attempts at each level (l1, l2, l3) from attempts table
  2. Calculate accuracy at each level
  3. Determine current_level:
     - If l1_accuracy >= 70% AND l1_attempts >= 10: eligible for l2
     - If l2_accuracy >= 70% AND l2_attempts >= 10: eligible for l3
  4. Determine status:
     - green: l3_accuracy >= 80% AND l3_attempts >= 10
     - amber: l1 cleared, working on l2 or l3
     - red: l1 not cleared OR l1_accuracy < 60%
  5. Upsert topic_progress

updatePatternProgress(userId, patternTypeId):
  1. Count total attempts and correct from attempts table (via question's pattern_type_id)
  2. Get last mock's ABC tag for questions of this pattern type
  3. Determine trend:
     - Compare last 10 attempts accuracy vs previous 10
     - improving: current > previous by 10%+
     - declining: current < previous by 10%+
     - stable: within 10%
  4. Upsert pattern_progress
```

## 6. API Routes

### 6.1 Public
```
POST /api/auth/[...all]     # BetterAuth handles login/register/session
```

### 6.2 Student (role = student)
```
GET  /api/daily-dose            # Get or generate today's dose
POST /api/daily-dose/complete   # Mark daily dose complete with results

GET  /api/topics                # List all published topics with progress
GET  /api/topics/[slug]         # Topic detail (cheatsheet, resources, progress)
POST /api/topics/[slug]/not-ready  # Flag "needs help"

GET  /api/practice/[topicSlug]  # Get next batch of practice questions
POST /api/attempts              # Record a practice/daily attempt

POST /api/mock/start            # Create mock test, return question set
POST /api/mock/[id]/respond     # Record individual mock response (with ABC tag)
POST /api/mock/[id]/complete    # Submit mock, trigger analysis
GET  /api/mock/[id]/analysis    # Get post-mock analysis

GET  /api/revision              # Get due revision items
POST /api/revision/[id]/attempt # Record revision attempt

GET  /api/progress              # Dashboard data (all topics, ABC trends, stats)
GET  /api/formulas              # All formula cards
```

### 6.3 Admin (role = admin)
```
# Questions
GET    /api/admin/questions          # List with filters (topic, difficulty, pattern, source)
POST   /api/admin/questions          # Create question
PUT    /api/admin/questions/[id]     # Update question
DELETE /api/admin/questions/[id]     # Soft delete (archive)
POST   /api/admin/questions/import   # Bulk import (CSV/JSON)

# Topics
GET    /api/admin/topics             # All topics (including drafts)
POST   /api/admin/topics             # Create topic
PUT    /api/admin/topics/[id]        # Update (cheatsheet, dependencies, etc.)
DELETE /api/admin/topics/[id]        # Delete topic

# Pattern Types
GET    /api/admin/patterns                 # All pattern types with coverage stats
POST   /api/admin/patterns                 # Create pattern type
PUT    /api/admin/patterns/[id]            # Update
DELETE /api/admin/patterns/[id]            # Delete

# Resources
POST   /api/admin/resources                # Add resource to topic
PUT    /api/admin/resources/[id]           # Update
DELETE /api/admin/resources/[id]           # Delete

# Analytics
GET    /api/admin/students                 # Student list with summary stats
GET    /api/admin/students/[id]            # Detailed student analytics
GET    /api/admin/students/[id]/flags      # Flagged topics for this student
POST   /api/admin/students/[id]/notes      # Add admin note to a topic flag
GET    /api/admin/dashboard                # Overview stats (hardest topics, coverage gaps)

# Formula Cards
POST   /api/admin/formulas                 # Add formula card
PUT    /api/admin/formulas/[id]            # Update
DELETE /api/admin/formulas/[id]            # Delete
```

## 7. Auth & Access Control

**BetterAuth config:**
- Email + password auth (no social login needed for v1)
- Two roles: `student`, `admin`
- Admin creates student accounts (no open registration for v1 — it's a private tool)
- Session-based auth (BetterAuth default)

**Middleware:**
```
/learn/*  → require role = 'student' (or 'admin' — admin can view student side)
/admin/*  → require role = 'admin'
/api/admin/* → require role = 'admin'
/api/*    → require authenticated
```

For v1 with single student + single admin, this is simple. If scaling later, add multi-tenancy (admin_id on topics/questions, student groups, etc.).

## 8. Client-Side State Management

No external state library. Use:
- **React Server Components** for initial data fetching (topics, questions, progress)
- **Client components** with `useState`/`useReducer` for interactive sessions (practice, mock tests)
- **SWR or React Query** (TBD) for client-side data fetching with cache invalidation (dashboard, progress)

**Practice session state (client):**
```typescript
{
  topicId: string
  difficulty: 'l1' | 'l2' | 'l3'
  currentBatch: Question[]
  currentIndex: number
  answers: { questionId: string, selected: string, timeSpent: number }[]
  batchScore: number
  startedAt: Date
}
```

**Mock test session state (client):**
```typescript
{
  mockTestId: string
  questions: Question[]
  currentIndex: number
  responses: {
    questionId: string
    selected: string | null
    abcTag: 'a' | 'b' | 'c'
    timeSpent: number
  }[]
  globalTimer: number        // Countdown in seconds
  questionTimer: number      // Per-question elapsed
  phase: 'first_pass' | 'review_b' | 'review_all'
  startedAt: Date
}
```

## 9. Key UI Components

### 9.1 Question Card
- Renders question text (markdown + KaTeX)
- Renders image if present
- 4 option buttons (A/B/C/D)
- In mock mode: ABC tagger (A/B/C buttons, mandatory before proceeding)
- Per-question timer (visible in practice, hidden in mock)
- On answer (practice mode): instant flip to solution view
- Keyboard shortcuts: 1/2/3/4 for options, Enter to confirm

### 9.2 Solution View
- **Smart solution** displayed first (highlighted as "Quick approach")
- **Detailed solution** collapsible below ("Full method")
- **Option breakdown:** each option with correct/wrong indicator and explanation
- Source tag and difficulty badge
- "Got it" / "Still confused" buttons (latter flags for admin)

### 9.3 Mock Timer
- Global countdown (top bar, always visible)
- Color changes: green (>30 min left), amber (10-30 min), red (<10 min)
- Per-question timer runs in background, not displayed to student

### 9.4 ABC Tagger
- Three buttons: A (green), B (amber), C (red)
- Mandatory selection in mock mode before moving to next question
- Shows count: "A: 12 | B: 8 | C: 5" in mock navigation

### 9.5 Formula Panel
- Floating button (bottom-right corner) on all student pages
- Opens sliding panel (right side)
- Organized by topic with collapsible sections
- Search bar at top
- Renders markdown + KaTeX

### 9.6 Dashboard Widgets
- Daily Dose card (prominent, top)
- ABC conversion chart (line chart showing A/B/C counts across mocks)
- Topic grid (cards with status color: red/amber/green)
- Revision queue count badge
- Streak counter

## 10. Deployment

**Vercel (Hobby) setup:**
- Connect GitHub repo → Vercel auto-detects Next.js
- Build command: `npm run build` (auto-detected)
- Output: `.next` (auto-detected)
- Environment variables (set in Vercel dashboard):
  - `DATABASE_URL` — Neon connection string
  - `BETTER_AUTH_SECRET` — Auth secret
  - `BETTER_AUTH_URL` — https://your-app.vercel.app
  - `NEXT_PUBLIC_APP_URL` — https://your-app.vercel.app
- Auto-deploys on every push to `main`

**Neon setup:**
- Single database, HTTP driver (`@neondatabase/serverless`) — works in Vercel serverless functions with no config
- Connection pooling handled by Neon's infrastructure

**Domain:** Vercel assigns `your-app.vercel.app` by default. Custom domain can be added later.

## 11. Migration Path for Future Features

### v1.5: Variant Generation
- Add `variant_of` column to questions table (self-referencing FK)
- New API route: `POST /api/admin/questions/[id]/generate-variant`
- Calls Anthropic API with original question + pattern type, generates variant
- Admin reviews in UI before publishing
- Architecture already supports this — just needs the API integration

### v2: Multi-tenancy
- Add `organization_id` to users, topics, questions
- Admin manages their own question bank
- Students join via invite code
- Shared question bank marketplace (admins can import from public banks)

### v2: Mobile App
- React Native or PWA
- API layer already exists, just needs a new frontend

---

*Next document: CLAUDE.md → then build.*
