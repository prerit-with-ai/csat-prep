# DESIGN-SYSTEM.md — CSAT Prep Tool

## 1. Design Philosophy

**"The quiet study desk."**

This is not an ed-tech app. There are no streaks, no confetti, no XP bars, no mascots. The interface is a tool — like a well-organized notebook with tabs. It stays out of the way. Content is the hero. Every pixel either teaches something or tracks progress. Nothing else earns screen space.

The student using this is already stressed. The design should lower their heart rate, not raise it. Calm backgrounds, generous spacing, type-first hierarchy. When she opens the app at 11 PM after a long day, it should feel like opening a clean notebook — not like logging into a dashboard.

### Design Principles

1. **Content-first.** No chrome competes with the question or the cheatsheet. Navigation is minimal. The current task fills the screen.
2. **Signal, not noise.** Color is used only for status (progress, correct/wrong, ABC tags) and section identity (RC/LR/Math). Decorative color is zero.
3. **One thing at a time.** No split views, no sidebars during practice. The student sees one question, answers it, sees the solution. Linear, focused.
4. **Mobile-native thinking.** She will use this on her phone. Every interaction works with thumbs. Tap targets are large. Scrolling is natural. No hover-dependent UI.
5. **Dark mode is not optional.** Late-night study sessions are the norm. Dark mode must be as considered as light mode — not an afterthought inversion.

---

## 2. Color System

### 2.1 Base Palette

Built on warm neutrals — not blue-gray (too corporate) or pure gray (too cold). A slight warm undertone that feels like paper.

```
Light Mode:
  --bg-primary:     #FFFFFF       /* Card surfaces, content areas */
  --bg-secondary:   #F8F7F4       /* Page background, inset areas */
  --bg-tertiary:    #F1EFE8       /* Hover states, subtle fills */
  --text-primary:   #1A1A18       /* Headings, question text */
  --text-secondary: #5C5C58       /* Body text, descriptions */
  --text-tertiary:  #8A8A84       /* Hints, timestamps, meta */
  --border-default: #E4E2DA       /* Card borders, dividers */
  --border-subtle:  #EEEDEA       /* Inner dividers, table lines */

Dark Mode:
  --bg-primary:     #1C1C1A       /* Card surfaces */
  --bg-secondary:   #141413       /* Page background */
  --bg-tertiary:    #252523       /* Hover states */
  --text-primary:   #E8E6DF       /* Headings, question text */
  --text-secondary: #A3A19A       /* Body text */
  --text-tertiary:  #6B6A65       /* Hints, meta */
  --border-default: #2E2E2B       /* Card borders */
  --border-subtle:  #232321       /* Inner dividers */
```

### 2.2 Functional Colors

These ONLY appear when communicating status. Never decorative.

```
/* Correct / Success / Green topic status */
--color-correct:      #2D8B59       /* Light mode */
--color-correct-bg:   #E8F5ED       /* Light mode fill */
--color-correct-dark: #4ADE80       /* Dark mode */
--color-correct-bg-d: #1A2E22       /* Dark mode fill */

/* Wrong / Error / Red topic status */
--color-wrong:        #C53030       /* Light mode */
--color-wrong-bg:     #FEE8E8       /* Light mode fill */
--color-wrong-dark:   #F87171       /* Dark mode */
--color-wrong-bg-d:   #2E1A1A       /* Dark mode fill */

/* In-progress / Amber topic status / B-tag */
--color-amber:        #B27D10       /* Light mode */
--color-amber-bg:     #FEF6E2       /* Light mode fill */
--color-amber-dark:   #FBBF24       /* Dark mode */
--color-amber-bg-d:   #2E2510       /* Dark mode fill */

/* Info / Active state / A-tag */
--color-info:         #2563EB       /* Light mode */
--color-info-bg:      #EFF6FF       /* Light mode fill */
--color-info-dark:    #60A5FA       /* Dark mode */
--color-info-bg-d:    #1A2340       /* Dark mode fill */
```

### 2.3 Section Identity Colors

Each CSAT section gets a subtle color accent — used only for section headers, tab indicators, and topic cards. Never overwhelming.

```
/* Reading Comprehension — blue-gray (calm, reading) */
--section-rc:         #4A6FA5
--section-rc-bg:      #EDF2F8
--section-rc-bg-d:    #1A2230

/* Logical Reasoning — teal (analytical, sharp) */
--section-lr:         #0F766E
--section-lr-bg:      #E6F5F3
--section-lr-bg-d:    #0F2625

/* Mathematics — warm brown (structured, grounded) */
--section-math:       #92610A
--section-math-bg:    #FAF3E6
--section-math-bg-d:  #2A2010
```

### 2.4 ABC Tag Colors

```
/* A (Ab Karo) — confident green */
--abc-a:              #16A34A
--abc-a-bg:           #DCFCE7
--abc-a-bg-d:         #142E1C

/* B (Baad mein Karo) — amber */
--abc-b:              #D97706
--abc-b-bg:           #FEF3C7
--abc-b-bg-d:         #2E2510

/* C (Chorh Do) — gray */
--abc-c:              #71717A
--abc-c-bg:           #F4F4F5
--abc-c-bg-d:         #27272A
```

### 2.5 Difficulty Level Colors

```
/* L1 — easy, soft green */
--level-l1:           #22C55E
--level-l1-bg:        #F0FDF4

/* L2 — medium, amber */
--level-l2:           #EAB308
--level-l2-bg:        #FEFCE8

/* L3 — hard, red-orange */
--level-l3:           #EF4444
--level-l3-bg:        #FEF2F2
```

---

## 3. Typography

### 3.1 Font Stack

```
/* Primary — for all UI text */
--font-sans: 'Source Sans 3', 'Source Sans Pro', system-ui, -apple-system, sans-serif;

/* Content — for question text, cheatsheets, solutions */
/* Same as primary but at slightly different sizing for readability */

/* Math — for formulas and equations */
/* KaTeX handles its own font loading (KaTeX_Math, KaTeX_Main) */

/* Mono — for code-like content if ever needed */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

**Why Source Sans 3:** Free (Google Fonts), excellent readability at small sizes, good Hindi/Devanagari support via fallbacks, professional without being corporate. Has proper weight range (300-700). Not overused in Indian ed-tech (unlike Inter or Poppins).

### 3.2 Type Scale

```
/* Hierarchy — limited to 5 sizes */
--text-xs:    12px / 1.5    /* Meta: timestamps, source tags, hints */
--text-sm:    13px / 1.5    /* Secondary: descriptions, option explanations */
--text-base:  15px / 1.7    /* Body: question text, cheatsheet prose, solutions */
--text-lg:    18px / 1.5    /* Section headers, topic names */
--text-xl:    24px / 1.3    /* Page titles (Dashboard, Mock Test Review) */

/* Weights */
--font-regular:   400       /* Body text, descriptions */
--font-medium:    500       /* Labels, options, nav items */
--font-semibold:  600       /* Headings, topic names, scores */
```

### 3.3 Type Rules

- Question text is always `--text-base` (15px). Never smaller. It's the most important content.
- Options (A/B/C/D) are `--text-base` with `--font-medium`. They need equal visual weight to the question.
- Solutions use `--text-sm` (13px) — slightly smaller than questions to create clear hierarchy.
- Never use ALL CAPS except for section labels ("RC", "LR", "MATH") which are 11px uppercase with letter-spacing.
- Line heights are generous. Question text at 1.7 line-height. Solutions at 1.6. Tight line heights cause reading fatigue.

---

## 4. Spacing System

8px base grid. All spacing is multiples of 4 or 8.

```
--space-1:    4px       /* Tight: between icon and label */
--space-2:    8px       /* Compact: between related items */
--space-3:    12px      /* Default gap: between list items */
--space-4:    16px      /* Card padding (horizontal) */
--space-5:    20px      /* Card padding (vertical) */
--space-6:    24px      /* Between sections */
--space-8:    32px      /* Between major blocks */
--space-10:   40px      /* Page top/bottom padding */
--space-12:   48px      /* Between page sections */
```

### Content Width

```
--max-content:  720px   /* Maximum width for reading content (questions, cheatsheets) */
--max-page:     960px   /* Maximum width for dashboard, analytics */
```

Content never stretches beyond 720px. Reading long lines is tiring. This is a reading-heavy product — optimal line length matters.

---

## 5. Component Patterns

### 5.1 Cards

The primary container. Used for: question display, topic module, mock test card, stats.

```
Light:
  background: var(--bg-primary)
  border: 1px solid var(--border-default)
  border-radius: 12px
  padding: 20px 16px
  shadow: none (flat design — no elevation)

Dark:
  background: var(--bg-primary)
  border: 1px solid var(--border-default)
  (same structure, colors swap via CSS variables)
```

No box shadows anywhere in the product. Borders define containers. This keeps things flat, calm, and print-friendly (she might screenshot solutions).

### 5.2 Question Card (the most important component)

```
┌─────────────────────────────────────────────┐
│  Q.7                              ⏱ 1:24   │ ← question number + timer (subtle gray)
│                                             │
│  A 4-digit number N is such that when       │ ← question text (15px, primary color)
│  divided by 3, 5, 6, 9 leaves a remainder  │
│  1, 3, 4, 7 respectively. What is the      │
│  smallest value of N?                       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  A   1068                           │    │ ← option buttons (full width, stacked)
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  B   1072                           │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  C   1078                           │    │ ← selected state: filled bg
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  D   1082                           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│                      [Confirm Answer →]     │ ← primary button (only after selection)
└─────────────────────────────────────────────┘
```

Option states:
- Default: `bg-secondary` fill, `border-subtle` border, `text-primary` text
- Hover/focus: `bg-tertiary` fill, `border-default` border
- Selected: `info-bg` fill, `info` border (2px), `info` text for option letter
- Correct (post-answer): `correct-bg` fill, `correct` border, checkmark icon
- Wrong (post-answer): `wrong-bg` fill, `wrong` border, X icon
- Correct answer revealed: `correct-bg` fill with subtle pulse animation (200ms)

### 5.3 Solution View (post-answer)

Appears below the question card after answering. Scrolls into view smoothly.

```
┌─────────────────────────────────────────────┐
│  ⚡ Smart approach                          │ ← section label (amber accent)
│                                             │
│  In every case, divisor - remainder = 2.    │ ← solution text (13px)
│  So N+2 is divisible by 3, 5, 6, and 9.    │
│  LCM(3,5,6,9) = 90.                        │
│  Smallest 4-digit multiple of 90 = 1080.   │
│  N = 1080 - 2 = 1078. Answer: (C)          │
│                                             │
│  ▸ Detailed approach                        │ ← collapsible (closed by default)
│                                             │
│  ── Why other options are wrong ──          │ ← always visible
│                                             │
│  (A) 1068: 1068+2=1070. 1070/9=118.88 ✗    │
│  (B) 1072: 1072+2=1074. 1074/5=214.8 ✗     │
│  (D) 1082: 1082+2=1084. 1084/9=120.4 ✗     │
└─────────────────────────────────────────────┘
```

### 5.4 ABC Tag Selector (Mock Mode)

Appears as a floating bar at the bottom of the screen during mock tests. Always visible.

```
┌───────────────────────────────────────────────┐
│                                               │
│  How confident?                               │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  A       │  │  B       │  │  C       │   │
│  │  Ab karo │  │  Baad me │  │  Chorh do│   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
└───────────────────────────────────────────────┘
```

- A button: green tint when selected
- B button: amber tint when selected
- C button: gray tint when selected
- Must select one before "Next" is enabled
- Compact on mobile: single row, abbreviated labels

### 5.5 Topic Progress Card

```
┌─────────────────────────────────────────────┐
│  ┌────┐                                     │
│  │ RC │  Central idea questions        🟢   │ ← section badge + topic name + status dot
│  └────┘                                     │
│                                             │
│  Level 2 · 78% accuracy · 34 practiced     │ ← progress details (text-tertiary)
│                                             │
│  ████████████░░░░░  L1 ✓  L2 ···  L3 ○    │ ← progress bar + level indicators
└─────────────────────────────────────────────┘
```

Status dot:
- 🔴 `--color-wrong` — <60% accuracy or Level 1 incomplete
- 🟡 `--color-amber` — Level 1 done, working through L2/L3
- 🟢 `--color-correct` — ≥80% accuracy across all levels

### 5.6 Dashboard Stats

Simple metric cards, not fancy charts. Numbers are the focus.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Daily Dose  │  │  Topics      │  │  Revision    │
│              │  │              │  │              │
│  12/18       │  │  8 of 29     │  │  6 patterns  │
│  done today  │  │  mastered    │  │  pending     │
└──────────────┘  └──────────────┘  └──────────────┘
```

Background: `--bg-secondary`. No border. `border-radius: 8px`. Number is `--text-xl` (24px) semibold. Label is `--text-xs` (12px) tertiary.

### 5.7 Timer

**Practice timer (per-question):** Subtle, top-right of question card. `text-tertiary`, `text-xs`. Just ticks. No red warning state — we don't want to add pressure during practice.

**Mock timer (global):** Fixed to top of screen. Larger (`text-lg`). Turns amber at 15 min remaining. Turns red at 5 min remaining. Gentle transition, no flashing.

### 5.8 Buttons

```
Primary:
  background: var(--text-primary)
  color: var(--bg-primary)
  border-radius: 8px
  padding: 10px 20px
  font-weight: 500
  font-size: 14px

Secondary:
  background: transparent
  border: 1px solid var(--border-default)
  color: var(--text-primary)
  (same sizing as primary)

Ghost:
  background: transparent
  border: none
  color: var(--text-secondary)
  (for less important actions)
```

No colored buttons. Primary is black/white (inverts in dark mode). This keeps the interface calm — color is reserved for status.

### 5.9 Navigation

**Student nav:** Top bar, minimal. Logo/name left. Nav links center: Dashboard, Topics, Mock Tests, Revision. Profile/logout right.

On mobile: bottom tab bar with 4 tabs (Dashboard, Topics, Mocks, More). "More" contains: Revision, Strategy, Formulas, Profile.

**Admin nav:** Side nav (left), collapsible. Links: Dashboard, Questions, Topics, Patterns, Analytics, Settings.

---

## 6. Iconography

Use Lucide icons (free, consistent, works with React). Style:

```
size: 18px (default), 16px (inline with text), 20px (nav)
stroke-width: 1.5
color: inherits from text color
```

Key icons:
- Sections: `book-open` (RC), `brain` (LR), `calculator` (Math)
- Status: `check-circle` (correct), `x-circle` (wrong), `circle` (unanswered)
- ABC: `zap` (A), `clock` (B), `skip-forward` (C)
- Nav: `layout-dashboard`, `layers`, `timer`, `rotate-ccw` (revision)
- Actions: `chevron-right`, `arrow-left`, `search`, `filter`

No custom icons. No illustrations. Lucide everywhere for consistency.

---

## 7. Motion & Animation

Minimal. Functional only.

```
/* Page transitions */
--transition-page: 150ms ease-out          /* Route changes */

/* Micro-interactions */
--transition-fast: 100ms ease              /* Button press, option select */
--transition-default: 200ms ease           /* Card expand, solution reveal */
--transition-slow: 300ms ease-out          /* Modal open, slide-over */

/* Solution reveal */
Solution card slides up from below with opacity 0→1 and translateY 8px→0px.
Duration: 200ms. Easing: ease-out.

/* Correct/wrong feedback */
Option background color transition: 150ms.
Correct answer gets a single subtle scale pulse: 1→1.02→1 over 200ms.
No shake animation for wrong answers. Just color change. Calm.

/* Progress bar fill */
Width transition: 400ms ease-out. Triggered on mount or on value change.
```

**What is NOT animated:**
- No page load animations or skeleton screens (content should load fast enough)
- No confetti, sparkles, or celebrations
- No bouncing elements
- No parallax
- No animated backgrounds
- No loading spinners (use simple "Loading..." text if needed, or instant optimistic UI)

---

## 8. Responsive Breakpoints

```
/* Mobile-first approach */
--bp-sm:   640px      /* Small phones → larger phones */
--bp-md:   768px      /* Phones → tablets */
--bp-lg:   1024px     /* Tablets → laptops */
--bp-xl:   1280px     /* Laptops → desktops */
```

### Key Responsive Behaviors

**Question card:** Full-width at all sizes. Options stack vertically always (never side-by-side).

**Dashboard stats:** 3 columns on desktop. 2 columns on tablet. Stack to 1 column on mobile.

**Topic listing:** Single column on mobile, 2-column grid on tablet+.

**Mock test navigator:** Sidebar on desktop (right side, 200px). Slides up from bottom as a sheet on mobile (tap to expand).

**Formula card FAB:** Bottom-right corner, 48px circle. Opens as full-screen slide-over on mobile, right sidebar (320px) on desktop.

**Admin question form:** Single column always (forms work better single-column).

---

## 9. Content Formatting

### 9.1 Markdown Rendering

Cheatsheets and solutions are stored as markdown. Rendering rules:

```
Headings: Only h3 and h4 within content (h1/h2 reserved for page structure)
Bold: Used for formulas and key terms only — not for emphasis
Italic: Used for book/exam references
Code blocks: Used for step-by-step calculations
Lists: Bulleted for shortcuts, numbered for steps
Blockquotes: Used for "key insight" callouts in cheatsheets
```

### 9.2 KaTeX Rendering

Math expressions inline with text. Rules:

```
Inline math: $...$  → renders inline with text
Display math: $$...$$ → renders centered on own line
Font size: Matches surrounding text size (inherits from parent)
```

### 9.3 Cheatsheet Layout

```
┌─────────────────────────────────────────────┐
│  📐 Percentage                              │ ← topic name
│                                             │
│  ── Key formulas ──                         │
│                                             │
│  • % change = (change / original) × 100     │
│  • Successive change: a + b + (ab/100)      │
│  • x% of y = y% of x (always)              │
│                                             │
│  ── Shortcuts ──                            │
│                                             │
│  ▸ "10% up then 10% down ≠ same price"     │
│    Net = -1%. Always negative.              │
│                                             │
│  ▸ "If you see price hike + reduced travel" │
│    → It's a successive percentage problem.  │
│    Don't calculate — use the formula.        │
│                                             │
│  ── Common traps ──                         │
│                                             │
│  ⚠ Calculating % of new value instead of   │
│    original. Always check: "% of what?"     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 10. Dark Mode

Not an inversion — a separate, intentional palette.

**Principles:**
- Backgrounds darken, text lightens. But not pure black (#000) or pure white (#FFF). Off-black (#1C1C1A) and warm off-white (#E8E6DF).
- Status colors shift to their lighter variants (more saturated, lower value) to maintain contrast on dark backgrounds.
- Borders become subtler (lower contrast) — they define space without shouting.
- Cards are slightly lighter than page background (reversed from light mode where cards are white on gray).
- Images (question diagrams) may need a subtle background plate in dark mode for legibility.

**Implementation:** CSS custom properties with `@media (prefers-color-scheme: dark)` and a manual toggle in user settings. System preference is default, but she should be able to override.

---

## 11. Anti-Patterns (What NOT to do)

1. **No gamification.** No XP, no levels displayed as badges, no achievements, no leaderboards. Progress tracking is clinical: accuracy %, topics cleared, revision pending. That's it.
2. **No streaks with consequences.** The daily dose has a gentle streak counter but breaking a streak has zero penalty or guilt messaging. No "You lost your streak!" — just "Start today's practice."
3. **No unnecessary loading states.** If data loads in <200ms (it should with Neon), render directly. Only show loading for operations >500ms.
4. **No generic "Good job!" messages.** Post-answer feedback is informational: "Correct. Here's why." or "Incorrect. The answer is C. Here's why." No emotional adjectives.
5. **No gradient backgrounds.** Ever. Flat solid colors only.
6. **No rounded avatars or profile pictures.** Initials in a circle is enough. This isn't social.
7. **No tooltips on mobile.** If information needs explaining, it goes in the UI directly or in a help section.
8. **No more than 2 font sizes on any single screen.** Outside of page title and meta text, body content should be one size.

---

## 12. Reference Inspirations

These aren't templates to copy — they're mood references for the aesthetic:

- **Notion** — Content-first, clean type hierarchy, minimal chrome
- **Linear** — Calm dark mode, functional color usage, tight spacing
- **Are.na** — Quiet, text-focused, no visual noise
- **Day One (journal app)** — Warm paper tones, reading-optimized
- **Exam.net** — Clean exam interface, distraction-free question display (for mock test mode specifically)

---

*This document is referenced by CLAUDE.md and informs all UI implementation decisions.*
