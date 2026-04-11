# CSAT Prep Tool — Roadmap

Living document. Items move between sections as priorities change. Each
sprint follows: design → approve → build → test → approve → commit →
push → deploy → manual verify → merge → roadmap update → next.

---

## Now — Sprint in progress

*(nothing in progress yet)*

---

## Next — Sprint queue (in order, do not parallelize)

### Sprint 1: Adaptive Study Plan

**Goal:** Replace "figure out what to practice" with "trust the system."
On login, show a prescriptive daily plan based on exam date, weak areas,
revision queue, and last activity. This is the biggest single lever for
the app's perceived usefulness — it removes decision fatigue and makes
the dashboard primary CTA "do today's plan" instead of "browse topics".

**MVP scope:**

- New `daily_plans` table (`userId`, `date`, `items[]` JSON, `status`)
- Plan-generation algorithm: weights weak patterns, due revision items,
  unpracticed topics, and time-to-exam
- Dashboard card: "Today's 60 minutes" with 3–5 items, each a link into
  the right practice / revision / cheatsheet flow
- Items check off as completed when the corresponding session finishes

**Cold-start mode:** For users without enough data (< 20 practice
attempts AND 0 completed mocks), the plan runs in a simplified "guided
warmup" — prescribes cheatsheet reading + L1 practice in the first topic
of each section to bootstrap attempt data. After the student crosses the
threshold, the algorithm switches to full adaptive mode automatically.
The switchover is invisible to the student — no "you're now in adaptive
mode!" notification, just smarter recommendations. Threshold tuning
(20/1) is a calibration call — start there, adjust based on how the
first week feels.

**Out of scope for v1:** multi-day planning, time estimation per item,
rest day detection, study-stress signals, notification reminders.

**Success metric:** the dashboard's primary CTA becomes the plan, not
topic browsing, and the student returns to the plan (not Topics) on
subsequent logins.

---

### Sprint 2: Student Analytics Redesign + Cutoff Predictor

**Goal:** Make the student analytics page actually useful — answer "am
I improving?" and "what should I work on next?" The current page is a
dump of raw numbers with zero insight; it actively hurts student
confidence by showing effort without progress.

**Scope:**

- Custom SVG charts (no charting library — keep dep list minimal per
  CLAUDE.md tech stack philosophy)
- **ABC conversion trend over time** — C→B→A shifts as a line chart.
  The emotional hook: "you used to skip percentage questions, now
  you're nailing them."
- **Weak patterns ranked by impact** — ordered list, "these 3 patterns
  are costing you the most marks"
- **Cutoff predictor — trajectory framing:** shows current projected
  score + improvement rate + projected qualifying date. Critically,
  gated on:
  1. Exam-date proximity (only shown in the last 60 days)
  2. Enough data (3+ completed mocks OR 100+ practice attempts)
  3. Opt-in toggle (student can disable if the pressure isn't helpful)

  Framing is *trajectory, not snapshot* — "+2 marks/week, projected to
  hit 66 by Oct 15" instead of "42/200, 24 marks below cutoff". Points
  to motion and action, not status.
- Retire the current "bunch of numbers" layout

**Design decision pending:** how to visually frame negative trajectory
(student losing ground) without demotivating. Probably: neutral color
palette + action-focused copy ("your improvement rate slowed — here's
what to try") rather than red alerts.

---

### Sprint 3: Gamification System

**Goal:** Make the app feel alive and rewarding without being gimmicky
or manipulative. The pre-dev-docs anti-gamification rule is removed —
this sprint is the positive version of that.

**In scope for v1:**

1. **XP + levels.** Points per correct answer (1), wrong answer (0),
   bonus for first-try L3 correct (3). Levels: Novice → Learner →
   Scholar → Topper → Master. Purely progression — no content gating.
2. **Days-active streak (informational only).** "12 days active this
   month." No "🔥 Don't break your streak!" copy. No guilt when it
   lapses. Factual counter, nothing more.
3. **Badges — curated set of ~12 milestones.** "First 100 questions",
   "First mock qualifying", "Cleared all L1 in Math", "Perfect revision
   week", "30 days active", etc. Badge unlock = small toast, no
   confetti spam.
4. **Milestone confetti — 3 events only.** First L3 cleared, first
   qualifying mock score, first "all topics in a section cleared".
   Rare enough to feel earned.
5. **Personal "best of" cards in analytics.** "Best week: +14 marks
   improvement", "Longest session: 2h 15m", "Highest accuracy day".
   Self-comparison, no social pressure.

**Explicitly out of scope:**

- Competitive leaderboards (solo user, N/A)
- In-app currency / shops (overkill)
- Unlockable cosmetic themes (low priority)
- Level-gated content (bad — all content always accessible)
- Daily quests as a separate system (they merge with the adaptive plan
  items from Sprint 1)

---

## Backlog — evaluate later

Items ranked by impact/effort, all discussed and agreed to park.

### Tier A — high impact, likely next few sprints after the three above

- **Real exam-condition mock mode** — 2h locked timer, OMR-style answer
  sheet, no section breaks, no pause. A dress-rehearsal mode distinct
  from regular mocks.
- **Cross-mock trend analysis** — line chart of mock scores over time
  with qualifying cutoff overlaid. Pairs naturally with Sprint 2.
- **Days-active counter + inactivity reminder emails** — "you haven't
  practiced in 5 days, 6 weeks to exam." Opt-in, gentle copy. The
  counter itself ships in Sprint 3; email reminders are separate.
- **Hindi UI support** — schema already has `language` column. Big lift
  for Hindi-medium UPSC aspirants.
- **PWA install + offline cheatsheet reading** — 1–2 days of work, huge
  mobile stickiness.
- **Question health dashboard (admin)** — auto-flag questions that are
  too easy (>95% correct), too hard (<10%), or ambiguous (high flag
  rate).

### Tier B — medium impact, farther out

- **Prerequisite surfacing** — when a student repeatedly fails a
  pattern, suggest the underlying concept to review first. Requires
  concept-dependency mapping (mostly content work, not engineering).
- **Auto-calibrated difficulty** — use attempt data to re-score L1/L2/L3
  instead of admin-set. Makes adaptive practice more accurate without
  manual tuning.
- **Student data export** — CSV/PDF of progress, attempts, mock history.
  Trust-building, zero-cost technically.
- **Coverage gap detector (admin)** — "you have 40 percentage questions
  but only 3 on probability, which shows up 3× as often in past papers."
- **Per-student drill-down for admin** — when `needsHelp` flag triggers,
  admin sees what the student has actually done.
- **Content freshness tracking** — flag questions last reviewed > N
  months ago.

### Tier C — speculative / needs user traction first

- **Peer notes / discussion per question** — high friction, moderation
  overhead, powerful for retention. Needs >1 user.
- **Concept graph visualization** — topic-to-concept-to-pattern network.
- **Referral / sharing system** — only relevant if growth matters.

---

## Won't do (for now, reasoned)

- **External API for third-party tools** — no ask, no use case.
- **Anonymous peer benchmarking** — single-user app, not applicable.
- **Aggressive push notifications** — exam prep is already stressful;
  don't make the app another source of guilt.
- **AI-generated explanations** — content quality is better when
  curated, not auto-generated.

---

## Done — shipped

- **PR #1** (`42c0c8f` → rebased as `d01b5df…8d10c97`) — Dead code
  cleanup, Button component adoption, governance rules, auth
  preview-deploy fixes
- **PR #2** (`9773f7b`) — Knip residuals cleanup
- **PR #3** (`9458244`) — Test suite rot fix (11 E2E failures → 0)
- **PR #4** (`72a73c6`) — Admin analytics self-fetch refactored to
  direct db-queries call
- **PR #5** (`f9d528a`) — Practice loop test flakiness hardened
  (4 flaky → 2)

---

## How this document is maintained

- When a sprint kicks off, move its item from **Next** to **Now**.
- When a sprint ships, move to **Done** with the PR number and commit
  hash in the same commit that merges the PR.
- When brainstorming surfaces new ideas, land them in **Backlog** under
  the appropriate tier — don't silently forget.
- Items that stop mattering move to **Won't do** with a one-line reason.
- Re-rank **Next** after every sprint based on what was learned.
- This doc is part of the governance checklist — CLAUDE.md's post-slice
  checklist requires updating it before marking a sprint done.
