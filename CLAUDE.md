# CLAUDE.md — CSAT Prep Tool

## Project Overview

A two-sided CSAT (UPSC Civil Services Aptitude Test) preparation platform. Student side: structured learning, adaptive practice, daily practice doses, timed mock tests with ABC methodology, pattern-based revision, and progress tracking. Admin side: question bank management, topic/content curation, student analytics.

**Read these docs before making any architectural or design decision:**
- `docs/PRD.md` — Full product spec, features, data model, user flows
- `docs/ARCHITECTURE.md` — Tech stack, DB schema, algorithms, API routes, project structure
- `docs/DESIGN-SYSTEM.md` — Visual identity, colors, typography, component patterns
- `docs/SPRINT-PLAN.md` — Vertical slices, build order, test strategy, post-slice checklist
- `docs/TECHNICAL-DECISIONS.md` — Implementation-level decisions (data fetching, state, forms, storage, packages)

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Neon PostgreSQL via `@neondatabase/serverless`
- **ORM:** Drizzle
- **Auth:** BetterAuth (roles: student, admin)
- **Styling:** Tailwind CSS with CSS variables from design system
- **Math rendering:** KaTeX via react-markdown + remark-math + rehype-katex
- **Forms:** Raw `useState`/handler patterns everywhere (admin and student). No form library is installed. Do not add `react-hook-form`, Formik, or any other form library. If a form gets complex enough to need one, raise it as a proposal first — don't unilaterally install.
- **Icons:** lucide-react
- **File storage:** Cloudflare R2 (S3-compatible)
- **Testing:** Playwright (E2E per slice)
- **Deployment:** Vercel (Hobby)

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npx drizzle-kit push # Sync schema to dev DB (dev only)
npx drizzle-kit generate # Generate migration files
npx drizzle-kit migrate  # Run migrations (prod)
npx tsx scripts/seed.ts  # Seed initial users
npx playwright test  # Run E2E tests
```

---

## Project Structure

```
docs/                          # All pre-dev documentation (read-only reference)
drizzle/
  schema.ts                    # All table definitions (single file)
  relations.ts                 # Drizzle relations
  migrations/                  # Generated migration files
scripts/
  seed.ts                      # Initial user seeding
src/
  app/
    (auth)/                    # Login, register pages
    (student)/                 # Student-facing pages (dashboard, topics, practice, mock, revision, strategy, formulas)
    (admin)/                   # Admin pages (dashboard, questions, topics, patterns, analytics)
    api/                       # API routes (auth, questions, practice, daily, mock, revision, progress, upload, admin)
    layout.tsx                 # Root layout (KaTeX CSS, font loading)
    page.tsx                   # Root redirect based on role
  lib/
    db.ts                      # Drizzle client + Neon connection
    auth.ts                    # BetterAuth config
    scoring.ts                 # CSAT scoring logic
    adaptive.ts                # Question serving algorithm
    revision.ts                # Revision queue logic
    analytics.ts               # ABC conversion, mock analysis, weak area detection
    db-queries.ts              # Typed query functions for Server Components
  components/
    ui/                        # Shared primitives (button, card, input, modal, toast)
    markdown-renderer.tsx      # Markdown + KaTeX (client component)
    question-card.tsx          # Question display with options, timer, ABC tag
    solution-view.tsx          # Smart + detailed solution + option explanations
    formula-fab.tsx            # Floating formula card button + slide-over
    progress-ring.tsx          # Topic mastery visualization
    abc-badge.tsx              # A/B/C tag component
    timer.tsx                  # Per-question and global timer
  hooks/
    use-timer.ts               # Timer logic
    use-practice-session.ts    # Practice session state (useReducer)
    use-mock-session.ts        # Mock test state with ABC flow (useReducer)
tests/
  slice-0-auth.spec.ts        # E2E: auth flow
  slice-1-admin-content.spec.ts
  slice-2-student-learns.spec.ts
  slice-3-practice.spec.ts
  slice-4-daily-dose.spec.ts
  slice-5-mock-test.spec.ts
  slice-6-revision.spec.ts
  slice-7-analytics.spec.ts
```

---

## Architecture Rules

### Data Fetching
- **Reads:** Server Components with direct Drizzle queries via `db-queries.ts`. No API roundtrip for page loads.
- **Mutations:** API routes (`/api/*`). Client components call via `fetch`.
- **Sessions (practice/mock):** Client-side `useReducer`. API call on each answer submission. Session state (question index, answers, timer) lives in client memory.
- After a mutation, call `revalidatePath()` to refresh Server Component data.
- **Shared query helpers live in `src/lib/db-queries.ts`.** Before writing an inline `db.select()` in a Server Component or API route, check if a helper already exists. If you need a new reusable query (one that would be useful in >1 callsite), add it to `db-queries.ts` rather than inlining. One-off queries unique to a single callsite can stay inline.

### Components
- Default is **Server Component** (no `"use client"` directive).
- Add `"use client"` only when the component needs: useState, useEffect, onClick handlers, browser APIs, or third-party client libraries (KaTeX).
- Server Components fetch data and pass it as props to client components.

### API Route Pattern
```
Every API route:
  1. Check auth via auth()
  2. Check role if admin-only
  3. Parse + validate body with zod schema
  4. Execute DB operation via Drizzle
  5. Return structured JSON
  6. Errors: { error: { code: string, message: string } } with proper HTTP status
```

### Database
- Single schema file (`drizzle/schema.ts`) for all tables
- Use Neon serverless driver (`@neondatabase/serverless`) — HTTP-based, no TCP
- Dev: `drizzle-kit push` for instant schema sync
- Prod: `drizzle-kit migrate` in Railway build step
- **Relations** are defined in `drizzle/relations.ts` and wired into `src/lib/db.ts` via `drizzle(sql, { schema: { ...schema, ...relations } })`. When adding a new table with foreign keys, add its relations to this file in the same commit. Prefer `db.query.*.findMany({ with: { ... } })` for nested fetches over manual `.leftJoin()` chains where the nested shape is cleaner.

---

## Sub-Agents & Parallel Execution

You are encouraged to spawn sub-agents (via `Task` tool) and run work in parallel wherever it makes sense. Don't do everything sequentially when independent tasks can run simultaneously.

### When to use sub-agents

- **Independent file creation:** When a slice needs multiple files that don't depend on each other (e.g., creating the schema file, the API route, and the page component can be parallelized if the interfaces are defined upfront).
- **Test + build in parallel:** Run E2E tests in one agent while fixing or building the next piece in another.
- **Multiple API routes:** If a slice defines 3-4 API routes with no shared logic beyond the DB, build them in parallel.
- **Component scaffolding:** Create multiple UI components simultaneously when their props/interfaces are already defined.
- **Linting / type-checking / testing:** Run `tsc --noEmit`, `npx playwright test`, and build commands in parallel agents to get faster feedback.
- **Content seeding:** Seed data in one agent while building UI that consumes it in another.

### When NOT to use sub-agents

- **Sequential dependencies:** Don't parallelize schema creation and API routes that import from that schema — the schema must exist first.
- **Shared file edits:** Two agents editing the same file will conflict. One agent per file at a time.
- **Debugging:** When tracking down a bug, work sequentially. Parallel debugging creates confusion.
- **Design decisions:** Architectural choices need a single thread of reasoning, not parallel exploration.

### General guidance

- Bias toward parallelism for speed. A slice that touches 4-5 independent files should use sub-agents.
- Each sub-agent should get clear, bounded scope: "Create the file X with this interface. Do not modify any other files."
- After parallel work completes, do a sequential integration pass — verify imports, check types, run the app.

---

## Design Rules

Read `docs/DESIGN-SYSTEM.md` for full spec. Key rules for implementation:

### Colors
- Define all colors as CSS variables in `globals.css` with light/dark mode via `@media (prefers-color-scheme: dark)` + manual toggle
- Warm neutral base palette (not blue-gray)
- Color is ONLY for status: correct/wrong, ABC tags, difficulty levels, section identity
- No decorative color. No colored buttons. Primary button is black text on white (inverts in dark mode).

### Typography
- Font: Source Sans 3 (Google Fonts)
- 5 sizes only: 12px (meta), 13px (secondary), 15px (body/questions), 18px (section headers), 24px (page titles)
- Question text is always 15px. Never smaller.
- Line height: 1.7 for questions, 1.5 for UI text

### Components
- No box shadows anywhere. Borders define containers.
- Cards: 1px border, 12px radius, 20px vertical / 16px horizontal padding
- No gamification elements (XP, badges, confetti, streaks with guilt)
- No "Good job!" messages. Feedback is informational only.
- Empty states: every list has a helpful empty message
- **All buttons MUST use `src/components/ui/button.tsx`.** No raw `<button>` elements. Variants: `primary` (black bg, white text — CTAs), `secondary` (outline — cancel/back), `ghost` (low-emphasis), `danger` (red outline — destructive). Sizes: `sm`, `md` (default). **If the Button component doesn't support your use case, extend its variant API — don't bypass it with inline styles.** Documented exceptions (intentionally kept as raw `<button>`): A/B/C/D option selectors, ABC tag pickers, and timer/icon-only buttons with unique one-off styling.

### Responsive
- Mobile-first. All interactions work with thumbs.
- Content max-width: 720px. Dashboard max-width: 960px.
- Options always stack vertically (never side-by-side)
- Mock navigator: sidebar on desktop, bottom sheet on mobile
- Formula card: slide-over panel (full screen mobile, 320px sidebar desktop)

### Motion
- Minimal. Solution reveal: 200ms ease-out slide-up. Option select: 100ms color transition.
- No page load animations, no skeleton screens, no confetti, no bouncing.
- Mock timer: amber at 15min remaining, red at 5min. Gentle transition, no flashing.

---

## Coding Conventions

### Files
- Components: `PascalCase.tsx`
- Utilities/hooks: `kebab-case.ts`
- API routes: `route.ts` (Next.js convention)

### TypeScript
- Strict mode enabled
- No `any` types — use proper types or `unknown` with narrowing
- Zod validation schemas are defined inline in each API route file. There is no shared schemas module. If client-side validation is added in the future (currently none), create a shared schema file *at that point* — don't create it speculatively.
- Database types inferred from Drizzle schema (`typeof topics.$inferSelect`)

### Tailwind
- Use design system CSS variables for colors — never hardcode hex in Tailwind classes
- Spacing via Tailwind classes matching 4/8px grid (p-4, gap-3, mt-6)
- `max-w-3xl` for reading content, `max-w-5xl` for dashboards
- Markdown styling is handled manually in `src/components/MarkdownRenderer.tsx` using design system CSS variables. No typography plugin.

### Imports
- Use `@/` path alias for `src/` directory
- Group imports: React → Next.js → External libs → Internal modules → Types

---

## Anti-Patterns (DO NOT)

1. **Do not add a state management library.** useState and useReducer are sufficient. No Zustand, Jotai, or Redux.
2. **Do not use Server Actions for practice/mock submissions.** These have complex client state — use API routes.
3. **Do not install UI component libraries (shadcn, Chakra, MUI).** Build the few components needed from scratch with Tailwind. The design system is specific enough that a generic library would fight it.
4. **Do not add loading skeletons or spinners.** Server Components render with data. If something takes >500ms, show "Loading..." text. No animated skeletons.
5. **Do not add any gamification.** No XP, no badges, no achievements, no leaderboards, no confetti. Progress tracking is clinical: accuracy %, topics cleared, revision pending.
6. **Do not use raw SQL strings.** Always use Drizzle's query builder. Parameterized queries only.
7. **Do not create separate CSS files.** All styling via Tailwind classes + CSS variables in globals.css.
8. **Do not add dependencies not listed in TECHNICAL-DECISIONS.md** without explicit approval.
9. **Do not build features not in the current slice.** Follow SPRINT-PLAN.md slice order strictly.
10. **Do not skip the post-slice checklist.** Every slice must pass: E2E test, deployed, mobile tested, dark mode tested, empty states handled.
11. **Do not install aspirational dependencies.** Only add a package to `package.json` if it is immediately imported in at least one file in the same commit. "Planned for later" deps that sit unused rot in place — `react-hook-form` sat unused from Slice 1 through Slice 8 before being removed. If you're not ready to use it now, don't install it now.
12. **Do not bypass shared layers.** If you're about to inline a query, schema, or button style that a shared helper/component already handles, stop and use the shared version. If the shared version doesn't fit, extend it — don't route around it. Architectural drift is what happens when every slice takes the shortcut "just this once."

---

## Build Order

Follow `docs/SPRINT-PLAN.md` strictly. Summary:

```
Slice 0: Foundation      → Auth + DB + deploy pipeline
Slice 1: Admin content   → Topic + Question + Pattern CRUD
Slice 2: Student learns  → Topic browsing + cheatsheets + checkpoint
Slice 3: Student practices → Adaptive practice + solutions + progress
Slice 4: Daily dose      → System-curated daily mixed practice
Slice 5: Mock tests      → Full mock with ABC tagging + behavioral analysis
Slice 6: Revision queue  → Pattern-based resurfacing
Slice 7: Analytics       → Admin analytics + formula card + strategy page + polish
Slice 8: Bulk import     → CSV import + content sprint
```

Each slice: schema → API → UI → E2E test → deploy → seed content → review.
No slice starts until the previous one is deployed and passing.

---

## Key Domain Concepts

### ABC Methodology
- **A (Ab Karo):** Student is confident, answering now
- **B (Baad mein Karo):** Student can do it but needs time, will revisit
- **C (Chorh Do):** Student has no clue, skipping
- Mandatory tagging during mock tests. Progress metric = C→B and B→A conversion over time.

### Pattern Types
- Each topic has multiple pattern types (e.g., Percentage has: "basic percentage", "successive change", "price hike/discount")
- Every question is tagged with exactly one pattern type
- Revision queue operates on pattern types, not individual questions
- When resurfacing, system serves a DIFFERENT question of the same pattern type

### Difficulty Ladder
- L1 (Foundation) → L2 (Intermediate) → L3 (UPSC-level)
- Student must clear L1 (≥7/10) before L2 unlocks
- Practice serves questions at current level only

### CSAT Scoring
- 2.5 marks per correct answer
- -0.83 marks per wrong answer (1/3 negative marking)
- Skipped questions: 0 marks
- Qualifying: 66/200 (33%)

### Smart Solutions
- Every question solution leads with the intuitive/shortcut approach
- Detailed/formula approach is secondary (collapsible)
- All four options explained (why wrong ones are tempting but incorrect)

---

## Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=csat-prep-assets
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## Post-Slice Checklist

Run after completing every slice or non-trivial feature:

### Functional checks
```
□ E2E test passes
□ Deployed to Vercel and accessible
□ Tested on mobile (responsive)
□ Tested in dark mode
□ No console errors
□ Empty states handled
□ Auth guards work
□ Walked through the flow as the actual user
```

### Governance checks (catch architectural drift early)
```
□ Does CLAUDE.md still describe what was actually built?
  → Update any line that no longer reflects reality (tech stack, file tree, rules).
  → Stale docs caused Slices 1–8 to drift from the original plan on schemas,
    Button, relations, typography. Don't repeat this.

□ Were any shared layers bypassed in this slice?
  → Grep for inline queries that could use db-queries.ts helpers.
  → Grep for raw <button> that should use the Button component.
  → Grep for inline zod that duplicates existing route schemas.
  → If you bypassed a shared layer intentionally, either adopt it or formally
    retire it — don't leave stale shared code sitting around.

□ Run `npx knip --no-progress` and resolve any new findings before committing.
  → Unused files, unused exports, unused deps, unlisted deps.
  → Some findings are false positives (eslint via `next lint`); document those
    in .knip.json rather than ignoring them.

□ Run `npx tsc --noEmit` — must be clean.

□ Any new dependency? Confirm it's imported in at least one file in this
  same commit. No aspirational installs.
```
