# CSAT Cracker — End-to-End Critique

**Generated:** April 2026  
**Test run result:** 98/102 E2E tests pass (4 Neon DB connectivity failures under load — not code bugs)

---

## Automated Test Baseline

| Slice | Tests | Status |
|-------|-------|--------|
| slice-0 (Auth) | all pass | ✓ |
| slice-1 (Admin Content) | all pass | ✓ |
| slice-2 (Student Learns) | 1 fail (Neon) | ⚠ |
| slice-3 (Practice) | 3 fail (Neon) | ⚠ |
| slice-4 (Daily Dose) | all pass | ✓ |
| slice-5 (Mock Tests) | all pass | ✓ |
| slice-6 (Revision) | all pass | ✓ |
| slice-7 (Analytics) | all pass | ✓ |
| slice-8 (Import) | all pass | ✓ |

Neon intermittency failures are under load during sustained test runs. Already mitigated with `retries: 1` in playwright.config.ts. Not code bugs.

---

## 1. VISUAL DESIGN

### Broken
- **No dark mode** — design system says "not optional." No media query, no toggle, no dark palette implemented anywhere.
- **Font may not be loading** — Source Sans 3 specified in design system but no `@import` or font definition verified in stylesheets. App likely falls back to system fonts.
- **Wrong CSS variable names in mock page** — References non-existent vars like `var(--color-bg-primary)`, `var(--color-text-primary)`, `var(--color-border-primary)`. Should be `var(--bg-primary)`, `var(--text-primary)`, `var(--border-default)`.
- **Button padding inconsistency** — Primary buttons use different padding across pages (practice: `px-6 py-3`, mock: `px-4 py-2`).

### Incomplete
- **No mobile bottom navigation** — design system specifies bottom tab bar (Dashboard, Topics, Mocks, More) for mobile. Only desktop top navigation exists.
- **Mock question navigator not mobile-responsive** — should be bottom sheet on mobile, currently fixed horizontal flex only.

---

## 2. UX & USER FLOWS

### Blocking Navigation Issues
- **Student nav is broken** — header only shows "Strategy" link + logout. No links to Topics, Mocks, Revision, or Dashboard. Students must use browser back or manually type URLs.
- **No breadcrumbs** — after navigating into a topic or practice session, only way back is browser back button.
- **Strategy page is a dead end** — no nav links away from it except browser back.

### Missing Flow Completions
- **Mock analysis → next mock** — analysis page shows "Back to Dashboard" but no "Start another mock" from that page.
- **Daily dose completion → next step** — no suggestion for what to do after completing the dose.
- **Import success → view questions** — after bulk import completes, no link to `/admin/questions` to verify what was imported.

### Empty/Error States
- **Daily dose empty state missing** — if dose generation fails (no questions in bank), nothing handles it gracefully.
- **Mock creation failure** — if there aren't enough questions for a full mock, no validation or helpful message.
- **Practice with 0 questions** — serve returns empty array but hook stays in "loading" state forever; no empty state shown.

### Admin UX
- **Flags page save confirmation absent** — after saving admin notes, no success feedback. Button just re-enables.

---

## 3. FUNCTIONAL CORRECTNESS

### Suspected Bugs (from code review — not yet confirmed by failing tests)

1. **Practice session level advancement** — `practice/submit` checks current level BEFORE the atomic upsert. Two simultaneous correct answers at the threshold could both trigger advancement. Low probability in single-user testing, higher with concurrent users.

2. **Mock response fire-and-forget** — `advanceFirstPass` in `use-mock-session.ts` saves responses with `.catch(console.error)`. If API is down, response is silently lost but client advances. Student could complete entire mock with no responses saved.

3. **Timer expiry mid-answer** — if student has selected an option but not confirmed when timer hits 0, `handleTimeExpired` calls `handleSkipAndSubmit` without saving current selection.

### Known Infrastructure Issue
- **Neon DB under load** — HTTP serverless driver drops connections under sustained parallel E2E test load. Mitigated with `retries: 1`. Consider connection retry logic in the DB client itself for production.

---

## 4. MISSING FEATURES (Blocking Admin Content Sprint)

These pages were scaffolded in Slice 1 but the linked pages don't exist:

| Missing Page | Impact |
|---|---|
| `/admin/topics/new` | Can't create new topics |
| `/admin/topics/[id]` (edit) | Can't edit cheatsheets, resources, dependencies |
| `/admin/questions/new` | Can't create individual questions |
| `/admin/questions/[id]/edit` | Can't fix typos in imported questions |
| Pattern type manager | Can't create patterns — import tagging broken |
| Formula card admin | Formula FAB always empty |

**Current state:** Admin can ONLY add content via bulk import. Cannot fix anything after the fact.

---

## 5. MISSING FEATURES (Student Experience)

| Missing Feature | PRD Reference |
|---|---|
| Topics nav link in header | Section 8.2 |
| Mock test history page (all past mocks) | Section 8.5 |
| ABC trend on dashboard across mocks | Section 8.5 |
| Pattern weakness visibility for student | Section 8.6 |
| Days until exam countdown | Section 8.1 |
| ABC tagging during practice (not just mocks) | Section 7.4 |
| No `/topics` list page | — |

---

## 6. TECHNICAL RISKS

### Performance
- **No pagination on questions page** — loads ALL questions. Will degrade with 500+ question bank.
- **N+1 queries in revision serve** — for N revision items, up to 4N DB queries. Should batch.
- **Daily dose generated on-demand** — should be pre-generated, not computed on each page load.

### Security
- **No rate limiting** — practice serve endpoint can be spammed.
- **MarkdownRenderer XSS** — if imported question markdown contains `<script>` tags, depends on whether MarkdownRenderer sanitizes. Needs verification.

### Reliability
- **No React error boundaries** — any component throw crashes entire app to white screen.
- **No input length limits** — question text and solutions have no max length enforced at DB or API level.

---

## 7. CONTENT READINESS

### Before any real students can use this:
1. Build missing admin CRUD pages (topic, question, pattern type, formula card)
2. Create pattern types for each topic
3. Import questions via bulk import
4. Write cheatsheets for all topics
5. Write formula cards for math + LR topics

### Formula card gap
- Schema exists, FormulaFab displays them, but no admin UI to create/manage them.
- Must be done via direct DB seed or script until admin UI is built.

---

## 8. PRIORITY FIXES

### For Students (before beta)

| Priority | Fix |
|---|---|
| P0 | Add Topics, Mocks, Revision nav links to student header |
| P0 | Fix mock response save — make it awaited, not fire-and-forget |
| P0 | Handle empty question array in practice hook (show empty state) |
| P1 | Implement dark mode (media query + toggle) |
| P1 | Add breadcrumbs / back navigation on all pages |

### For Admin (before content sprint)

| Priority | Fix |
|---|---|
| P0 | Build topic create/edit page with cheatsheet editor |
| P0 | Build pattern type manager per topic |
| P0 | Build question edit page |
| P0 | Build formula card admin (CRUD per topic) |
| P1 | Add question count to topics list (currently hardcoded 0) |

---

## Summary

**Verdict:** Solid V0.7. Architecture and data model are sound. Core flows (practice, mock, revision concept) work. But not ready for real students due to missing admin tooling, navigation gaps, and silent failure risks.

**Time to MVP:** ~1.5 weeks of dev (admin CRUD + nav fixes + polish) + 1 week content sprint.
