# TECHNICAL-DECISIONS.md — CSAT Prep Tool

Every decision below is final for v1. No revisiting during build unless something is technically impossible.

---

## 1. Data Fetching Pattern

**Decision: Hybrid — Server Components for reads, API routes for mutations.**

- **Page loads / data display:** Server Components with direct Drizzle queries. No API route roundtrip for reading data. The topic list page, question list page, dashboard stats — all fetched server-side in the component.
- **Mutations (create, update, delete, submit answer):** API routes (`/api/*`). Client components call these via `fetch`. This keeps mutation logic centralized, reusable, and testable.
- **Practice/mock sessions (real-time interactions):** Client components with `useState`/`useReducer` for session state. API calls on each answer submission (`POST /api/practice/submit`). Session state (current question index, selected answers, timer) lives in client memory — not in the database until submitted.

**Why not Server Actions:** They're fine for simple forms, but practice and mock sessions have complex client-side state (timers, question navigation, ABC tagging). Mixing server actions with rich client state gets messy. API routes are cleaner for this use case.

```
Pattern summary:
  Page load data    → Server Component + Drizzle query (no loading state needed)
  Admin CRUD forms  → Client component + API route via fetch
  Practice session  → Client component + useReducer for session + API on submit
  Mock test session → Client component + useReducer for session + API on submit
  Dashboard stats   → Server Component + Drizzle query
```

### Data Fetching Utilities

Create a `src/lib/db-queries.ts` file with typed query functions used by Server Components:

```
// Pattern: each query is a simple async function
export async function getTopicsBySection(section: string) { ... }
export async function getQuestionsByTopic(topicId: string, difficulty: string) { ... }
export async function getStudentProgress(userId: string) { ... }
```

API routes in `src/app/api/` call the same Drizzle instance but handle auth, validation, and response formatting.

---

## 2. State Management

**Decision: No global state library. React built-ins only.**

- **Server data:** Fetched in Server Components. Revalidated via `revalidatePath()` after mutations.
- **Client session state (practice/mock):** `useReducer` in a custom hook (`use-practice-session.ts`, `use-mock-session.ts`). These hooks manage: current question index, selected answers, ABC tags, timer values, and submission state.
- **UI state (modals, formula card open/closed, filters):** `useState` local to the component.
- **No Zustand, no Jotai, no Redux.** The app doesn't have cross-cutting client state that would justify a store. Each page is self-contained.

### Session State Shape

```typescript
// Practice session
type PracticeState = {
  questions: Question[]
  currentIndex: number
  answers: Map<string, { selected: string; timeSpent: number }>
  showSolution: boolean
  batchComplete: boolean
  startTime: number
}

// Mock test session
type MockState = {
  questions: Question[]
  currentIndex: number
  responses: Map<string, { selected: string | null; abcTag: 'a' | 'b' | 'c'; timeSpent: number }>
  phase: 'first_pass' | 'reviewing_b' | 'reviewing_c' | 'submitted'
  globalTimerStart: number
  globalTimeRemaining: number
}
```

---

## 3. Form Handling

**Decision: react-hook-form + zod for admin forms. Raw controlled inputs for student interactions.**

- **Admin forms (question create/edit, topic editor, bulk import):** `react-hook-form` with `zod` validation schemas. These forms have many fields, validation rules, and error states. react-hook-form handles this cleanly without re-render overhead.
- **Student interactions (option selection, ABC tagging):** Simple `useState` + `onClick` handlers. No form library needed for clicking an option button.
- **Markdown editor (cheatsheets, solutions):** Plain `<textarea>` with live preview panel. No WYSIWYG editor — markdown is stored raw, rendered on display. Admin learns basic markdown (they already know it, it's Prerit).

### Zod Schemas

Shared between client validation and API route validation. Live in `src/lib/schemas.ts`:

```typescript
export const questionSchema = z.object({
  topicId: z.string().uuid(),
  patternTypeId: z.string().uuid(),
  difficulty: z.enum(['l1', 'l2', 'l3']),
  questionText: z.string().min(10),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(['a', 'b', 'c', 'd']),
  smartSolution: z.string().min(10),
  detailedSolution: z.string().optional(),
  // ... etc
})
```

---

## 4. File Storage

**Decision: Cloudflare R2 from day one.**

Railway volumes are ephemeral on redeploy — question images would disappear. R2 is S3-compatible, has a generous free tier (10GB storage, 10M reads/month), and works with the AWS S3 SDK.

Setup:
- Bucket: `csat-prep-assets`
- Access: Public read (images are not sensitive), authenticated write (admin upload only)
- Path convention: `questions/{questionId}/{filename}`
- Client upload: presigned URL flow — admin UI gets presigned URL from API, uploads directly to R2, saves the URL to DB

```
Upload flow:
  1. Admin selects image in question form
  2. Client calls POST /api/upload/presign → returns presigned R2 URL
  3. Client uploads directly to R2 via presigned URL
  4. Client saves R2 URL in question form → submitted with question data
```

**Environment variables:**
```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=csat-prep-assets
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 5. Markdown + KaTeX Pipeline

**Decision: `react-markdown` + `remark-math` + `rehype-katex` — client-side rendering.**

```
Dependencies:
  react-markdown          — renders markdown to React
  remark-math             — parses $...$ and $$...$$ in markdown
  rehype-katex            — renders parsed math as KaTeX HTML
  katex/dist/katex.min.css — KaTeX styles (import in layout)
```

**Why client-side:** Server-side KaTeX rendering is possible but adds build complexity. Client-side is simpler and KaTeX is fast enough (<10ms per expression). The content is not SEO-sensitive (it's behind auth).

### Markdown Component

Single shared component used everywhere: cheatsheets, solutions, question text.

```
// src/components/markdown-renderer.tsx
<ReactMarkdown
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {content}
</ReactMarkdown>
```

This component is a **client component** (`"use client"`) because KaTeX needs the DOM. Wrap content passed from Server Components:

```
// In a Server Component page:
<MarkdownRenderer content={topic.cheatsheetContent} />
```

### Editor Preview

Admin markdown editors show a split view: raw markdown left, rendered preview right. Both use the same `MarkdownRenderer` component. Preview updates on debounced input (300ms).

---

## 6. Error Handling

**Decision: Global error boundary + toast for mutations + inline for forms.**

### Layers

1. **Next.js `error.tsx`** — catches unhandled errors per route segment. Shows a clean "Something went wrong" message with a retry button. Logs error to console (no external error tracking in v1).

2. **API route errors** — return structured JSON:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Question text is required" } }
```
HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server).

3. **Client-side mutation errors** — shown as toast notifications (top-right, auto-dismiss after 5s). Use a simple custom toast component — no library needed for v1.

4. **Form validation errors** — inline, below the field. Provided by react-hook-form + zod.

5. **Empty states** — every list/grid has an empty state with a helpful message:
   - No topics yet → "No topics published yet. Check back soon."
   - No questions for this topic → "No practice questions available for this topic yet."
   - No revision items → "Nothing to revise — keep practicing!"
   - No mock history → "You haven't taken any mock tests yet."

---

## 7. Database Connection

**Decision: Neon serverless driver (`@neondatabase/serverless`) with Drizzle.**

```
Dependencies:
  @neondatabase/serverless   — Neon's HTTP-based driver (no TCP, works in Edge/serverless)
  drizzle-orm                — ORM
  drizzle-kit                — migrations CLI
```

**Why serverless driver over node-postgres:** Next.js API routes run in serverless/edge environments on Railway. The Neon serverless driver uses HTTP, avoiding TCP connection overhead and cold start issues. Connection pooling is handled by Neon's infrastructure.

```typescript
// src/lib/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../drizzle/schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

### Migration Workflow

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema directly (dev only — faster iteration)
npx drizzle-kit push

# Run migrations (production — in build step)
npx drizzle-kit migrate
```

**Dev vs prod:**
- Dev: `drizzle-kit push` for instant schema changes (no migration files)
- Prod: `drizzle-kit migrate` in Railway build command (runs migration files)

---

## 8. Local Development Setup

**Decision: Neon branch for dev. No local Postgres.**

```
Setup steps:
  1. Create Neon project (if not exists from Poko — can reuse project, new database)
  2. Create a dev branch in Neon dashboard
  3. Copy dev branch connection string to .env.local
  4. npm install
  5. npx drizzle-kit push (sync schema to dev branch)
  6. npm run dev (Next.js dev server on localhost:3000)
```

**Why Neon branch over local Postgres:** Zero setup, matches production exactly, schema can be compared between branches, and you already know the workflow from Poko.

**.env.local:**
```
DATABASE_URL=postgresql://...@ep-xxx.us-east-2.aws.neon.tech/csat_dev?sslmode=require
BETTER_AUTH_SECRET=generate-a-random-string
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=csat-prep-assets
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 9. Security

**Decision: Minimal but correct for v1.**

### Authentication
- BetterAuth handles sessions (httpOnly cookies, CSRF tokens built-in)
- Every API route checks `auth()` before processing
- Role check middleware: admin routes verify `user.role === 'admin'`

### Input Sanitization
- All markdown content is rendered via `react-markdown` which sanitizes HTML by default (no raw HTML injection)
- Zod validation on all API inputs — rejects unexpected fields
- SQL injection: prevented by Drizzle's parameterized queries (never use raw SQL strings)

### Rate Limiting
- **Not implemented in v1.** The app has 1-2 users. If scaling, add `@upstash/ratelimit` later.

### File Upload Security
- R2 presigned URLs expire in 5 minutes
- Only image MIME types accepted (image/png, image/jpeg, image/webp)
- Max file size: 5MB (enforced on client + presigned URL policy)

### CORS
- Not needed — API routes are same-origin (Next.js serves both frontend and API)

---

## 10. Seeding

**Decision: Seed script + admin UI. No manual SQL.**

### Initial Seed (Slice 0)

A TypeScript seed script (`scripts/seed.ts`) run via `npx tsx scripts/seed.ts`:

```
What it creates:
  - 1 admin user (prerit@..., role: admin)
  - 1 student user (sister@..., role: student)
```

### Content Seeding (Slice 1+)

All content goes through the admin UI. No seed scripts for questions/topics. This ensures:
- Content goes through the same validation as production
- Admin UI gets tested naturally
- No seed-only code paths to maintain

### Test Data for E2E

Playwright tests create their own test data via API calls in the `beforeAll` hook. Cleaned up in `afterAll`. This keeps tests independent of seed state.

---

## 11. Package Inventory (Locked Versions)

Core:
```json
{
  "next": "^14.2",
  "react": "^18.3",
  "react-dom": "^18.3",
  "drizzle-orm": "^0.35",
  "drizzle-kit": "^0.30",
  "@neondatabase/serverless": "^0.10",
  "better-auth": "latest"
}
```

UI:
```json
{
  "tailwindcss": "^3.4",
  "@tailwindcss/typography": "^0.5",
  "lucide-react": "^0.460",
  "react-markdown": "^9",
  "remark-math": "^6",
  "rehype-katex": "^7",
  "katex": "^0.16"
}
```

Forms + Validation:
```json
{
  "react-hook-form": "^7",
  "@hookform/resolvers": "^3",
  "zod": "^3.23"
}
```

File Upload:
```json
{
  "@aws-sdk/client-s3": "^3",
  "@aws-sdk/s3-request-presigner": "^3"
}
```

Testing:
```json
{
  "@playwright/test": "^1.48"
}
```

Dev:
```json
{
  "typescript": "^5.5",
  "tsx": "^4"
}
```

No other dependencies. If you think you need a library not listed here, check if React/Next.js built-ins can do it first.

---

## 12. Key Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `QuestionCard.tsx`)
- Utilities/hooks: `kebab-case.ts` (e.g., `use-timer.ts`)
- API routes: `route.ts` inside folder (Next.js convention)
- Schema: `schema.ts` (single file for all tables in v1)

### Component Structure
```typescript
// "use client" only when the component needs interactivity
// Default is Server Component (no directive needed)

// Client component pattern:
"use client"
import { useState } from 'react'
export function QuestionCard({ question }: Props) { ... }

// Server component pattern (default):
import { db } from '@/lib/db'
export default async function TopicsPage() {
  const topics = await db.query.topics.findMany()
  return <TopicList topics={topics} />
}
```

### API Route Pattern
```typescript
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { questionSchema } from '@/lib/schemas'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  
  const body = await req.json()
  const parsed = questionSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 })
  
  const result = await db.insert(questions).values(parsed.data).returning()
  return Response.json(result[0])
}
```

### Tailwind Conventions
- Use design system tokens via CSS variables (defined in `globals.css`)
- Never use arbitrary Tailwind values for colors — always reference CSS variables
- Spacing: use Tailwind classes (`p-4`, `gap-3`, `mt-6`) matching the 4/8px grid
- Max content width: `max-w-3xl` (720px) for reading content, `max-w-5xl` (960px) for dashboards

---

*This document is referenced by CLAUDE.md and supplements ARCHITECTURE.md with implementation-level decisions.*
