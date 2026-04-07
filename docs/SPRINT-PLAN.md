# SPRINT-PLAN.md — CSAT Prep Tool

## 1. Development Methodology

### Vertical Slicing

Each slice is a complete user flow — schema + API + UI + test + deploy. No slice is "just backend" or "just frontend." Every slice produces something a real user can touch.

**Why vertical slicing:**
- You see real output after every slice (motivation + validation)
- Bugs surface at integration, not at the end
- Each deploy is a checkpoint you can demo or share
- Claude Code works best with bounded, clear scope per session

### Workflow Per Slice

```
1. SCOPE    → Read the slice spec below. Understand what "done" means.
2. SCHEMA   → Write/update Drizzle schema. Run migration. Verify in Neon.
3. API      → Build API routes. Test with curl/Postman/Thunder Client.
4. UI       → Build pages/components. Connect to API. Visual QA.
5. TEST     → Write E2E test for the full user flow. Run it. Fix.
6. DEPLOY   → Push to main. Railway auto-deploys. Smoke test on prod URL.
7. SEED     → If this slice needs content (questions, topics), add seed data.
8. REVIEW   → Walk through the flow as the user. Note issues. Fix before next slice.
```

### Testing Strategy

**Not TDD. Not no-tests. Flow-tested.**

Each slice gets ONE end-to-end test that covers the complete user flow for that slice. Think: "a student opens the app, does X, sees Y." This catches real bugs (broken routes, missing fields, wrong queries) without the overhead of unit-testing every function.

Tool: **Playwright** — headless browser testing, works with Next.js, tests both student and admin flows.

```
Example test for Slice 3 (Practice Mode):
  1. Login as student
  2. Navigate to Topics → Percentage
  3. Click "Start Practice"
  4. Answer 10 questions (mix of correct and wrong)
  5. Verify: solution shown after each answer
  6. Verify: smart solution appears first
  7. Verify: option explanations are visible
  8. Verify: batch summary shows at end
  9. Verify: topic progress updated in DB
  10. Verify: wrong answers created revision queue entries
```

**What we DON'T test:**
- Individual utility functions (scoring, adaptive logic) — these are simple math, bugs will show in E2E
- CSS/visual regression — manual visual QA is faster for a solo dev
- API routes in isolation — E2E covers them through the UI

### Branch Strategy

Simple. Two branches:
- `main` → production (Railway deploys from here)
- `dev` → working branch (merge to main when slice is complete + tested)

No feature branches. No PRs to yourself. `dev` → test → merge to `main` → deploy.

---

## 2. Slice Breakdown

### Slice 0: Foundation
**Goal:** Scaffolded project, auth working, deployed on Railway.

**Schema:**
- `users` table (id, email, name, role, created_at)

**API:**
- BetterAuth setup with student/admin roles
- `/api/auth/[...all]` catch-all route
- `/api/health` endpoint

**UI:**
- Login page
- Register page (with role — admin self-registers once, then flips role in DB)
- Root redirect: admin → /admin/dashboard, student → /dashboard
- Empty dashboard shells for both roles (just "Welcome, {name}")

**Test:**
- Register as student → redirected to student dashboard
- Register as admin → redirected to admin dashboard (after manual role flip)
- Unauthenticated access to /dashboard → redirected to /login
- Student cannot access /admin/* routes

**Done when:**
- App is live on Railway with custom domain (or .railway.app)
- Login/register works
- Role-based routing works
- Neon DB connected, users table has data

**Seed data:** Create 1 admin user, 1 student user manually.

**Estimated effort:** 3-4 hours

---

### Slice 1: Admin Seeds Content
**Goal:** Admin can create topics, pattern types, and questions with full metadata.

**Schema:**
- `topics` table
- `pattern_types` table
- `questions` table
- `resources` table
- `formula_cards` table

**API:**
- CRUD for topics (with cheatsheet markdown)
- CRUD for pattern types (per topic)
- CRUD for questions (single add + edit)
- CRUD for resources (video links per topic)
- Image upload endpoint for question diagrams

**UI:**
- Admin: Topic list page with create/edit
- Admin: Topic detail page — cheatsheet editor (markdown), resource manager, pattern type manager
- Admin: Question list page with filters (topic, difficulty, pattern, source)
- Admin: Question create/edit form with all fields (text, options, solutions, explanations, tags)
- Admin: KaTeX preview in question/cheatsheet editors

**Test:**
- Admin creates a topic "Percentage" with cheatsheet content
- Admin adds 3 pattern types: "basic percentage", "successive change", "price hike/discount"
- Admin adds 10 questions across patterns and difficulty levels
- Admin adds 2 YouTube video resources
- Verify: questions appear in list, filters work
- Verify: cheatsheet renders markdown + KaTeX correctly

**Done when:**
- Admin can fully manage content — topics, patterns, questions, resources
- At least 1 topic with 10+ questions exists in production
- Markdown + KaTeX rendering works in preview

**Seed data:** Create full "Percentage" topic with cheatsheet, 3 pattern types, 15 questions (5 per level), 2 video links. This is the content used to test all subsequent student-facing slices.

**Estimated effort:** 6-8 hours

---

### Slice 2: Student Learns
**Goal:** Student can browse topics, read cheatsheets, watch videos, and signal readiness.

**Schema:**
- `topic_progress` table (initial entry created when student first visits a topic)
- `topic_dependencies` table

**API:**
- GET topics list (published only, with progress status for current user)
- GET topic detail (cheatsheet, resources, progress, dependency check)
- POST concept checkpoint (mark "ready" or "not ready")
- GET dependency validation (can this student access this topic?)

**UI:**
- Student: Topics page — 3 sections (RC, LR, Math), cards with progress status
- Student: Topic detail page — cheatsheet rendered, video embeds/links, concept checkpoint
- Student: Dependency enforcement — if prereq not cleared, show message + link to prereq
- Student: "Not ready" triggers flag visible on admin dashboard

**Test:**
- Student navigates to Topics → sees sections with published topics
- Student opens "Percentage" → reads cheatsheet, sees videos
- Student clicks "Ready to practice" → topic_progress created
- Student clicks "Not ready" → admin dashboard shows flag
- Student tries to access a dependent topic without clearing prereq → blocked with message

**Done when:**
- Student can browse, read, and signal readiness
- Dependency enforcement works
- Admin sees "needs help" flags

**Seed data:** Add a second topic ("Profit & Loss") with dependency on Percentage. Add 2-3 more topics across RC and LR sections for browsing.

**Estimated effort:** 4-5 hours

---

### Slice 3: Student Practices
**Goal:** Student can practice questions with adaptive serving, solutions, and progress tracking.

**Schema:**
- `attempts` table

**API:**
- POST /api/practice/serve — adaptive batch serving (10 questions)
- POST /api/practice/submit — submit answer, return solution, update progress
- GET /api/progress/topics — topic progress for dashboard

**UI:**
- Student: Practice session page — question card, option selection, confirm, solution reveal
- Student: Per-question timer (running in background, displayed subtly)
- Student: Solution view — smart approach first, detailed collapsible, all option explanations
- Student: Batch summary after 10 questions — score, time per question, option to continue
- Student: "Continue practicing" → next batch with pattern coverage
- Student: Topic progress card updates (red/amber/green)
- Student: Level progression — L1 cleared → L2 unlocked notification

**Test:**
- Student starts practice on "Percentage"
- Gets 10 L1 questions (first time = Level 1)
- Answers 8 correctly → sees "Level 2 unlocked"
- Starts another batch → gets L2 questions
- Verify: solutions show smart approach, option explanations
- Verify: wrong answers have different pattern types covered
- Verify: topic_progress updated in DB
- Verify: attempts recorded with time_spent

**Done when:**
- Full practice loop works end-to-end
- Adaptive serving delivers questions by level and pattern coverage
- Solutions with all four options explained
- Progress tracking updates in real-time

**Seed data:** Ensure 30+ questions exist for Percentage across all 3 levels and 3 pattern types.

**Estimated effort:** 8-10 hours (this is the meatiest slice)

---

### Slice 4: Daily Dose
**Goal:** System generates daily mixed practice, student completes it, sees summary.

**Schema:**
- `daily_doses` table
- `daily_dose_questions` table

**API:**
- POST /api/daily/generate — create today's dose (18 questions, mixed per algorithm)
- POST /api/daily/submit — submit answer within daily dose
- GET /api/daily — get today's dose status + questions

**UI:**
- Student: Dashboard shows "Daily Dose" card — "Start today's practice" or "Continue (8/18)"
- Student: Daily practice session — same question card as practice mode
- Student: Completion summary — score, section breakdown, time
- Student: Streak counter on dashboard (gentle, no guilt)

**Test:**
- Student opens dashboard → sees daily dose card
- Starts daily dose → gets 18 questions mixed across topics
- Completes → sees summary with section breakdown
- Next day → new dose generated with different questions
- Verify: composition follows 40% weak / 30% active / 20% revision / 10% strong

**Done when:**
- Daily dose generates correctly with proper composition
- Student can complete and see summary
- Streak tracking works

**Seed data:** Need 3-4 topics with 15+ questions each to test mixed composition. Add RC and LR topics with questions.

**Estimated effort:** 5-6 hours

---

### Slice 5: Mock Tests
**Goal:** Full mock test experience with ABC tagging and post-mock behavioral analysis.

**Schema:**
- `mock_tests` table
- `mock_test_responses` table

**API:**
- POST /api/mock/create — create mock (select questions based on type)
- POST /api/mock/[id]/respond — submit response with ABC tag
- POST /api/mock/[id]/submit — finalize mock test
- GET /api/mock/[id]/analysis — full behavioral analysis

**UI:**
- Student: Mock test selection page — topic / section / full paper
- Student: Mock test interface:
  - Global countdown timer
  - Question card with ABC tag selector (mandatory)
  - Question navigator (sidebar on desktop, bottom sheet on mobile)
  - First pass → Review B → Review C → Submit flow
- Student: Post-mock analysis page:
  - Score with CSAT marking (2.5 correct, -0.83 wrong)
  - Section-wise breakdown
  - ABC analysis (A accuracy, B conversion, C audit)
  - Time allocation breakdown
  - Wasted time analysis
  - Question-by-question review with solutions

**Test:**
- Student creates a topic mini-mock (10 questions)
- Tags questions as A/B/C during first pass
- Reviews B questions after first pass
- Submits → sees analysis page
- Verify: scoring math is correct (positive + negative marking)
- Verify: ABC distribution is tracked
- Verify: time per question recorded
- Verify: behavioral insights generated ("You spent 14 min on 4 math questions and got 2 wrong")

**Done when:**
- Full mock flow works including ABC tagging
- Post-mock analysis shows all behavioral metrics
- Question review with solutions works
- Timer works correctly (countdown, amber at 15min, red at 5min)

**Seed data:** Need enough questions across all sections to populate a full 80-question mock. Target: 100+ questions in bank.

**Estimated effort:** 10-12 hours (most complex slice)

---

### Slice 6: Revision Queue
**Goal:** Wrong answers trigger pattern-based revision with smart resurfacing.

**Schema:**
- `revision_queue` table
- `pattern_progress` table

**API:**
- POST /api/revision/trigger — called automatically when answer is wrong (creates/updates queue entry)
- GET /api/revision — get today's due revision items
- POST /api/revision/submit — submit revision answer, update schedule
- GET /api/progress/patterns — pattern-level progress

**UI:**
- Student: Revision page — list of due patterns with count
- Student: Revision practice — same question card, but system serves different question of same pattern
- Student: Dashboard shows revision count badge
- Admin: Sees "persistent weakness" flags for patterns wrong 3+ times

**Test:**
- Student answers wrong on "successive percentage change" question
- Revision queue entry created for pattern type
- Next day: student opens revision → sees the pattern
- Gets a DIFFERENT question of same pattern type
- Answers correctly → entry moves to resolved
- Answers wrong again → schedule resets, remains active
- After 3 wrong: status becomes "persistent", admin flagged
- Verify: same question never served for revision (different question, same pattern)

**Done when:**
- Pattern-based revision queue works end-to-end
- Resurfacing schedule (1→3→7 days) works correctly
- Different questions of same pattern served
- Persistent weakness flagging works

**Seed data:** Ensure each pattern type has 3+ questions for rotation.

**Estimated effort:** 6-7 hours

---

### Slice 7: Analytics + Polish
**Goal:** Admin analytics, formula card, strategy page, ABC conversion tracking, dashboard polish.

**Schema:**
- No new tables — reads from existing data

**API:**
- GET /api/admin/analytics — student overview (topic progress, pattern weaknesses, time trends)
- GET /api/admin/flags — all flags (needs help, persistent weakness)
- PATCH /api/admin/flags/[id] — add admin notes
- GET /api/progress/abc-trend — ABC conversion data across mocks
- GET /api/formulas — all formula cards by topic

**UI:**
- Student: Polished dashboard — daily dose, progress overview, weak areas, ABC trend, mock history
- Student: Formula card FAB — floating button, opens slide-over with searchable formulas
- Student: Strategy page — 10-year analysis data, ABC methodology guide, attempt order, target scorecard
- Student: ABC conversion chart on dashboard — across mocks, showing A/B/C shifts
- Admin: Student analytics page — topic-wise accuracy, pattern weakness map, time trends
- Admin: Flag management — view all flags, add notes, mark resolved
- Admin: Question bank stats — pattern coverage gaps, questions per topic/level

**Test:**
- Verify: dashboard loads with correct aggregated data
- Verify: formula card search works across topics
- Verify: strategy page renders with accurate 10-year data
- Verify: admin analytics shows correct metrics for test student
- Verify: ABC trend shows data from mock tests in Slice 5
- Verify: admin can view and annotate flags

**Done when:**
- All pages polished and functional
- No dead links, no empty states without proper messaging
- Mobile responsive across all pages
- Dark mode works across all pages

**Seed data:** None needed — reads from data generated by previous slices.

**Estimated effort:** 8-10 hours

---

### Slice 8: Bulk Import + Content Sprint
**Goal:** Admin can bulk import questions. Content sprint to populate full question bank.

**API:**
- POST /api/questions/import — CSV/JSON upload with validation and preview

**UI:**
- Admin: Bulk import page — upload file, map columns, preview, confirm
- Admin: Duplicate detection warning before import

**Content work (not code):**
- Import 2016-2025 PYQs (800 questions) — tag by topic, pattern, difficulty
- Import CAT series questions — map to CSAT topics
- Generate L1/L2 questions in Claude sessions — review and import
- Write cheatsheets for all remaining topics
- Curate video links for all topics
- Write formula cards for all math + LR topics

**Done when:**
- Bulk import works without errors
- Question bank has 500+ questions across all topics and levels
- All topics have cheatsheets, resources, and pattern types
- Product is content-ready for real use

**Estimated effort:** 4 hours (code) + 8-12 hours (content curation across multiple sessions)

---

## 3. Total Estimated Timeline

| Slice | Scope | Effort | Running total |
|-------|-------|--------|---------------|
| 0 | Foundation | 3-4h | 4h |
| 1 | Admin content | 6-8h | 12h |
| 2 | Student learns | 4-5h | 17h |
| 3 | Student practices | 8-10h | 27h |
| 4 | Daily dose | 5-6h | 33h |
| 5 | Mock tests | 10-12h | 45h |
| 6 | Revision queue | 6-7h | 52h |
| 7 | Analytics + polish | 8-10h | 62h |
| 8 | Bulk import + content | 4h + 12h content | 78h |

**Total: ~78 hours of work.** At 4-5 focused hours/day with Claude Code, that's roughly **3 weeks** to a fully functional, content-loaded product.

---

## 4. Content Readiness Per Slice

| Slice | Content needed before starting | How to create |
|-------|-------------------------------|---------------|
| 0 | None | - |
| 1 | 1 topic + 15 questions | Write in Claude chat, paste into admin |
| 2 | 3-4 topics with cheatsheets + videos | Write cheatsheets in Claude, curate YouTube |
| 3 | 30+ questions for 1 topic (all levels) | Generate in Claude, review, add via admin |
| 4 | 60+ questions across 4 topics | Same as above |
| 5 | 100+ questions (for full mock) | Same + start PYQ import |
| 6 | 3+ questions per pattern type | Ensure coverage, generate gaps |
| 7 | Strategy page content | Already done (10-year analysis from this chat) |
| 8 | Full bank (500+) | Bulk import + generation sprint |

---

## 5. Post-Slice Checklist (run after EVERY slice)

```
□ E2E test passes
□ Deployed to Railway and accessible
□ Tested on mobile (responsive)
□ Tested in dark mode
□ No console errors
□ Empty states handled (no data yet → show helpful message)
□ Loading states work (if any operations >500ms)
□ Auth guards work (student can't access admin, unauthenticated can't access app)
□ Walk through the flow as the actual user (not as the developer)
```

---

*This document is referenced by CLAUDE.md and defines the build cadence.*
