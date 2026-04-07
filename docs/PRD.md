# PRD: CSAT Prep Tool

**Product Name:** TBD (working title: "CSAT Cracker")
**Author:** Prerit
**Date:** April 6, 2026
**Status:** Draft v1

---

## 1. Problem Statement

UPSC CSAT (Civil Services Aptitude Test) is a qualifying paper requiring 66/200 marks (33%). Despite the low bar, many aspirants — particularly those weak in mathematics — fail to qualify, which voids their GS Paper 1 performance entirely. The problem isn't intelligence; it's lack of structured preparation targeting the specific patterns, question types, and exam strategy that CSAT demands.

Existing solutions (coaching classes, scattered YouTube videos, question PDFs without context) don't provide an integrated learn → practice → test → review loop, and they don't adapt to a student's specific weak areas.

## 2. Target User

**Primary:** UPSC aspirants who are strong in General Studies but weak in Mathematics, Logical Reasoning, and/or English comprehension. The archetype is someone who can clear GS Paper 1 but risks failing CSAT due to poor quantitative aptitude.

**Secondary (future):** Broader UPSC aspirant base, state PSC aspirants with similar aptitude test requirements.

## 3. Product Vision

A structured, two-sided CSAT preparation platform that provides curated learning content, adaptive practice, and timed mock tests — with an admin interface for content management. Intelligence lives in question serving and progress tracking, not runtime AI generation.

## 4. Key Insight from 10-Year CSAT Analysis (2016-2025)

Data driving the product design:

- **Math share has doubled**: From 24/80 questions (2016) to 33-40/80 (2020-2025). This is the section that kills weak students.
- **Reasoning has halved**: From 29-35 questions (2014-2016) to 14-18 (2020-2025). Still trainable, but fewer free marks than before.
- **Comprehension is rock-solid**: 25-30 questions every single year. Most predictable section. Paired passages with "central idea" + "valid assumption" format, unchanged in a decade.
- **Number System dominates math**: 87 questions in 10 years. Followed by Percentage (26), Divisibility (22), Permutation (19).
- **In Reasoning**: Sequences/patterns, clock/calendar, order/ranking, and arrangement are the most consistent sub-topics.
- **To qualify (66/200):** A student needs roughly 28 correct answers with ~5 wrong. That's 34 questions attempted out of 80. Selective attempt strategy is critical.

## 5. Core Product Principles

1. **Preparation ≠ Exam Strategy.** During prep: full coverage, ground up, no topics skipped — even in math. During exam: RC first, cherry-pick easy math, skip hard questions. The product teaches both but keeps them separate.
2. **Smart solutions over textbook solutions.** Every question solution leads with the intuitive/"street smart" approach. Detailed/formula approach is secondary. The goal: she should think "oh, that's a simpler way" not "I need to memorize this formula."
3. **All four options explained.** Every MCQ solution explains why each wrong option is tempting but incorrect. Half of CSAT learning is elimination.
4. **Difficulty ladders, not difficulty cliffs.** Each topic starts from absolute basics (Level 1) and builds up. A student weak in math should never see a UPSC-level question before clearing Level 1 and Level 2.
5. **Content is curated, serving is intelligent.** The question bank is built offline (PYQs + CAT series + AI-generated batches reviewed by admin). The system decides what to show when, based on performance.
6. **ABC methodology — the exam muscle memory.** Borrowed from CAT prep philosophy. Every question is categorized by the student as: **A (Ab Karo)** — I know this, doing it now; **B (Baad mein Karo)** — I can do this but need time, will revisit; **C (Chorh Do)** — no clue, skipping. The entire preparation arc is about converting Cs → Bs and Bs → As. This is trained during mocks AND tracked over time to show progress.

## 6. User Roles

### 6.1 Student

- Login / register
- Dashboard: progress overview, weak areas, suggested next action
- **Daily Practice ("Daily Dose"):** System-curated 15-20 mixed questions daily
- Topic modules: learn → practice → test flow
- Mock tests: timed, with ABC marking, section-wise or full paper
- Revision queue: resurfaces wrong-answer patterns (not same question)
- Quick-access formula/shortcut card
- Paper-taking strategy guide

### 6.2 Admin

- Question bank CRUD: add, edit, tag, bulk import
- **Question pattern type tagging:** Categorize questions by pattern (e.g., "successive percentage change", "remainder-based number system", "assumption validity RC") — enables intelligent serving and pattern-aware revision
- Topic management: create/edit topics, set dependencies, manage cheatsheets
- Resource management: add/edit video links and reference materials per topic
- Student analytics: progress, weak areas, time patterns, ABC conversion tracking
- Flag system: mark topics where student "needs a call" from admin

## 7. Information Architecture

### 7.1 Subject Structure

The CSAT syllabus maps to three sections, each containing topic modules:

**Section 1: Reading Comprehension (RC)**
Priority: HIGHEST. This is where weak-math students win the exam.

Modules:
- Central idea / main message questions
- Valid assumption questions (inference vs. extrapolation)
- Author's tone and intent
- Logical corollary questions
- Passage structure and argument flow
- Practice passage sets (by difficulty)

**Section 2: Logical Reasoning (LR)**
Priority: HIGH. Trainable skills with formulaic question types.

Modules:
- Sequences and patterns
- Clock and calendar problems
- Order and ranking
- Arrangement and seating
- Coding and decoding
- Direction and distance
- Cube and dice
- Statements and conclusions

**Section 3: Mathematics**
Priority: FULL COVERAGE in prep, selective in exam. Start from scratch, build up.

Modules (in dependency order):
1. Number system fundamentals (types of numbers, place value, operations)
2. Divisibility rules and remainder theorems
3. Factors, multiples, HCF, LCM
4. Percentage (basics → successive change → applied problems)
5. Ratio and proportion
6. Profit and loss
7. Simple and compound interest
8. Average and mixtures
9. Speed, time, and distance
10. Time and work
11. Algebra basics (linear equations)
12. Permutation and combination (basics only)
13. Geometry and mensuration (basic formulas)
14. Data interpretation (tables, charts, graphs)
15. Data sufficiency

### 7.2 Topic Module Structure

Each module contains:

**A. Cheatsheet**
- Not theory paragraphs. Tight reference card with:
  - Key formulas (3-5 max)
  - Shortcuts and tricks ("if you see X, do Y")
  - Common traps and how to avoid them
  - Pattern recognition tips
- Example for Percentage: "Successive change of a% and b% = a + b + ab/100. Price up 10% then down 10% ≠ original. Net change = -1%."

**B. Curated Resources**
- 1-3 YouTube video links (vetted for quality and relevance)
- Optional: PDF reference, article link, book chapter reference
- Each resource tagged with: topic, subtopic, difficulty, language (Hindi/English)

**C. Concept Checkpoint**
- After reviewing cheatsheet + resources, student is asked: "Ready to practice?"
- If YES → proceed to practice questions
- If NO → topic gets flagged on admin dashboard as "needs help"
- Admin sees this flag and can reach out (phone call, send additional resources)

**D. Practice Questions**
- Served in batches of 10 (unlimited batches per session — student keeps going until they want to stop)
- Each question tagged with a **pattern type** (e.g., "successive percentage change", "unit digit determination", "assumption validity") — admin assigns this during question creation
- Difficulty ladder:
  - **Level 1 (Foundation):** Basic concept application. "What is 15% of 240?"
  - **Level 2 (Intermediate):** Multi-step or applied. "Price increased by 20% then decreased by 10%. Net change?"
  - **Level 3 (UPSC-level):** Actual PYQ difficulty. Full word problems, tricky options.
- Student must clear Level 1 (≥7/10) before unlocking Level 2, and Level 2 before Level 3
- System ensures all pattern types within a topic are covered across batches (not random selection — pattern coverage matters)
- Each question has:
  - Question text + 4 options
  - Correct answer
  - **Smart solution** (intuitive/shortcut approach — displayed first)
  - **Detailed solution** (formula-based approach — collapsible)
  - **Why other options are wrong** (explanation for each incorrect option)
  - Per-question timer (tracks time spent)
  - Source tag (PYQ 2025, CAT Series, AI-generated, Custom)
  - Difficulty tag (L1/L2/L3)
  - Pattern type tag

**E. Topic Mastery Status**
- Calculated from practice performance:
  - 🔴 Red: <60% accuracy or Level 1 not cleared
  - 🟡 Amber: Level 1 cleared, working on Level 2-3
  - 🟢 Green: ≥80% accuracy across all levels
- Feeds into dashboard view

### 7.3 Topic Dependencies

Some math topics have prerequisites. The system should enforce (or strongly recommend) completing prerequisites before moving to dependent topics.

Dependency map:
- Number system → Divisibility → Factors/HCF/LCM
- Percentage → Profit & Loss → Simple & Compound Interest
- Percentage → Speed/Time/Distance
- Ratio & Proportion → Mixtures
- Ratio & Proportion → Time & Work
- Algebra basics is standalone
- Permutation/Combination is standalone
- Geometry/Mensuration is standalone
- Data Interpretation is standalone (but benefits from Percentage)

RC and LR modules have no hard dependencies. Recommended order follows the module list in 7.1 but is not enforced.

## 8. Feature Specifications

### 8.1 Student Dashboard

**What it shows:**
- **Daily Dose status:** "Today's practice: 0/20 done" — prominent, top of dashboard
- Overall progress: X/Y topics green, A/B topics amber, C/D topics red
- **ABC conversion tracker:** "This week: 4 Cs became Bs, 6 Bs became As" — shows improvement trajectory
- Weak areas: top 3 topics needing attention (lowest accuracy)
- Suggested next action: "Continue Percentage Level 2" or "Review 4 wrong answers from yesterday"
- Revision queue count: "6 question patterns to revisit"
- Mock test history: last 3 scores with trend
- Days until exam (if set by admin)

### 8.2 Daily Practice ("Daily Dose")

**What it is:** A daily curated set of 15-20 questions assembled by the system. Not random — intentionally mixed.

**Composition logic:**
- 40% from weak topics (lowest accuracy)
- 30% from topics currently being learned (active level)
- 20% revision queue questions (pattern-matched, not same question — see 8.4)
- 10% from strong topics (prevent decay)
- Mixed across RC, LR, and Math every day
- Difficulty matches student's current level per topic

**Flow:**
- Student opens dashboard → "Start today's practice" → 15-20 questions, one at a time
- Instant feedback after each question (same as topic practice)
- Completion summary at end: score, time, ABC distribution, pattern coverage
- Streak tracking: "7 day streak" — gentle motivation, not gamification

### 8.3 Topic Practice Mode

**Flow:**
1. Student selects topic (or system suggests one)
2. System serves 10 questions at appropriate difficulty level, ensuring pattern type coverage
3. Student answers each question, per-question timer runs in background
4. After each answer: instant feedback — correct/wrong, show smart solution, show why other options wrong
5. After batch of 10: score summary, time per question, patterns covered, option to do another batch or switch topic
6. Wrong answer patterns enter revision queue
7. Student can do unlimited batches — system keeps serving from the question bank, cycling through all pattern types before repeating

**Adaptive logic:**
- If student gets ≥7/10 at current level → offer to advance to next level
- If student gets ≤3/10 → suggest reviewing cheatsheet, flag for admin
- Never serve the same question twice in a session (unless revision queue)
- Prioritize questions from uncovered pattern types within the topic
- After all pattern types covered at a level, cycle back with different questions of same patterns

### 8.4 Revision Queue (Pattern-Based Resurfacing)

- When a student gets a question wrong, the system records the **pattern type** (not just the question)
- Resurfacing serves a **different question of the same pattern type** — not the same question with remembered answers. E.g., if she got a "successive percentage change" question wrong, she gets a different successive percentage change question on review.
- Resurfacing schedule: 1 day later → 3 days later → 7 days later
- If answered correctly during revision: pattern marked as improving, removed from active queue
- If wrong again on same pattern: resets schedule, flags pattern as "persistent weakness" on admin dashboard
- Student can access revision queue anytime from dashboard
- Shows: pattern type, original wrong answer context, time spent on original
- If the question bank doesn't have another question of the same pattern type, fall back to same question (edge case for thin topics in v1)

**v1.5 — Variant generation (future):** When the bank runs thin for a pattern type, use LLM to generate a variant of the original question (same pattern, different numbers/options). Admin reviews before it enters the bank. Architecture should support this but not implement in v1.

### 8.5 Mock Tests

**Types:**
- **Topic-wise mini-mock:** 10-15 questions from one topic, timed (15-20 min)
- **Section-wise mock:** All questions from RC or LR or Math, timed proportionally
- **Full paper mock:** 80 questions, 120 minutes, simulates real CSAT

**During mock:**
- Global countdown timer visible
- Per-question timer tracking (hidden from student, recorded)
- **ABC marking on every question:** Student must tag each question as A (Ab Karo — doing it now, confident), B (Baad mein Karo — can do, will revisit), or C (Chorh Do — leaving it). This is mandatory before moving to next question.
- B-tagged questions appear in a "Review" queue after the student finishes all A-tagged ones
- C-tagged questions remain skipped unless student chooses to revisit
- No instant feedback during mock (feedback only after submission)

**Post-mock behavioral analysis:**
- Total score with positive and negative marking applied (2.5 per correct, -0.83 per wrong)
- Section-wise breakdown: RC score, LR score, Math score
- **ABC analysis:**
  - A questions: X attempted, Y% accuracy (should be >85% — if not, she's miscategorizing)
  - B questions: X attempted during review, Y% accuracy, avg time spent
  - C questions: X skipped, Y were actually easy (based on difficulty tag) — "You could have attempted 3 of these"
  - Conversion tracking across mocks: "Mock 1: 30A/25B/25C → Mock 3: 38A/22B/20C — improving"
- Time allocation analysis: how many minutes spent on each section
- "Wasted time" analysis: questions where >3 minutes spent AND answered wrong
- Question-wise review: each question with student's answer, correct answer, ABC tag, solution, time spent
- Comparison with qualifying cutoff (66/200)

### 8.6 Paper-Taking Strategy Section

Static content section (not a module to "clear") containing:

- **The 10-year pattern analysis** (data from our conversation — question distribution trends, topic weightage heatmaps)
- **ABC methodology guide:** How to tag questions during the exam, when to mark B vs C, how to manage the review pass
- **Attempt order strategy:** RC first (45 min) → LR (25 min) → Easy Math (30 min) → Review Bs (20 min)
- **Skip discipline rules:** If >90 seconds on a question and unsure, mark C and move. If math question has complex setup, mark C. Never guess on hard questions (negative marking).
- **Target scorecard:** Aim for 22/29 RC + 8/18 LR + 6/33 Math = 90 marks → net ~77 after negative marking
- **Common traps:** Why students fail CSAT (spending too long on hard math, not attempting enough RC, panic-guessing, not using ABC properly)

### 8.7 Quick-Access Formula/Shortcut Card

- Searchable reference card accessible from any screen (floating button or sidebar)
- Organized by topic
- Contains: formulas, shortcuts, "if you see X, do Y" rules, unit digit patterns, divisibility rules
- Should feel like a pocket cheatsheet, not a textbook

### 8.8 Admin: Question Bank Manager

**Add questions:**
- Single question form: question text, 4 options, correct answer, smart solution, detailed solution, option-wise explanation
- Fields: topic, subtopic, **pattern_type** (e.g., "successive percentage change", "unit digit"), difficulty (L1/L2/L3), source (PYQ + year / CAT Series / AI Generated / Custom), language (EN/HI)
- Rich text support for math notation (at minimum: superscript, subscript, fractions)
- Optional: image upload for questions with diagrams/tables

**Pattern type management:**
- Admin creates pattern types per topic (e.g., under Percentage: "basic percentage of X", "successive change", "population growth", "price hike/discount", "election/voting")
- Each question must be tagged with exactly one pattern type
- Dashboard shows pattern type coverage: "Percentage has 5 pattern types, 3 have 10+ questions, 2 have only 3 questions — need more"

**Bulk import:**
- CSV/JSON upload with column mapping
- Preview before import
- Duplicate detection (based on question text similarity)

**Edit/delete:**
- Search and filter by topic, difficulty, source, pattern type
- Edit any field inline
- Soft delete (archive, not permanent)

### 8.10 Admin: Topic & Content Manager

- CRUD for topic modules
- Edit cheatsheet content (markdown editor)
- Manage video links per topic
- Set topic dependencies
- Reorder topics within sections
- Manage pattern types per topic

### 8.11 Admin: Student Analytics

- Per-student view: topic-wise accuracy, time patterns, progress over time
- **ABC conversion tracking:** Across mocks, how A/B/C distribution is shifting — the single most important progress metric
- **Pattern weakness map:** Which specific pattern types the student consistently gets wrong
- Flag system: topics where student clicked "Not ready" or scored ≤3/10 get flagged
- Admin can add notes per flag ("called her, explained percentage concept, retry in 2 days")
- Overview: which topics and pattern types are hardest across all students (useful if product scales)

## 9. Data Model (High-Level)

### Core Entities

**User**
- id, email, name, role (student/admin), created_at

**Topic**
- id, section (RC/LR/MATH), name, slug, display_order, cheatsheet_content (markdown), dependency_ids[], status (draft/published)

**PatternType**
- id, topic_id, name (e.g., "successive percentage change"), description, display_order

**Resource**
- id, topic_id, type (video/pdf/article), title, url, language, display_order

**Question**
- id, topic_id, pattern_type_id, subtopic, difficulty (L1/L2/L3), question_text, image_url (nullable), option_a, option_b, option_c, option_d, correct_option, smart_solution, detailed_solution, option_a_explanation, option_b_explanation, option_c_explanation, option_d_explanation, source_type (pyq/cat/ai/custom), source_year, language, is_archived, created_at

**Attempt**
- id, user_id, question_id, selected_option, is_correct, time_spent_seconds, context (practice/mock/revision), created_at

**MockTest**
- id, user_id, type (topic/section/full), question_ids[], started_at, completed_at, total_time_seconds

**MockTestResponse**
- id, mock_test_id, question_id, selected_option (nullable for skipped), is_correct, **abc_tag (A/B/C)**, time_spent_seconds, display_order

**RevisionQueue**
- id, user_id, **pattern_type_id**, original_question_id (the question that triggered the entry), next_review_date, review_count, last_reviewed_at, status (active/resolved/persistent_weakness)

**DailyDose**
- id, user_id, date, question_ids[], completed (boolean), score, total_time_seconds

**TopicProgress**
- id, user_id, topic_id, current_level (L1/L2/L3), l1_accuracy, l2_accuracy, l3_accuracy, status (red/amber/green), needs_help (boolean), admin_notes

**PatternProgress**
- id, user_id, pattern_type_id, attempts_count, correct_count, accuracy, last_abc_tag (A/B/C — from most recent mock), trend (improving/stable/declining)

**FormulaCard**
- id, topic_id, content (markdown), display_order

## 10. Tech Stack

- **Framework:** Next.js (full-stack, single repo)
- **Database:** Neon (PostgreSQL)
- **ORM:** Drizzle
- **Auth:** BetterAuth (role-based: student/admin)
- **Styling:** Tailwind CSS
- **Deployment:** Railway Pro
- **Rich text:** Markdown rendering for cheatsheets and solutions
- **Math notation:** KaTeX for rendering (lightweight, fast)
- **No runtime AI API calls.** Content generated offline via Claude, curated by admin, loaded into question bank.

## 11. Content Pipeline

1. **PYQ Collection:** Source CSAT papers 2016-2025 (80 questions × 10 years = 800 questions). Tag each by topic, difficulty, and write smart + detailed solutions.
2. **CAT Series Import:** Prerit uploads from his existing CAT question bank. Map to CSAT topics.
3. **AI-Assisted Generation:** In offline Claude sessions, generate Level 1 and Level 2 questions for each topic (simpler than PYQs). Prerit reviews and approves before import.
4. **Cheatsheet Authoring:** Write topic-wise cheatsheets in Claude, review, paste into admin.
5. **Video Curation:** Identify 1-3 best YouTube explainers per topic. Preference for short (<15 min), clear, Hindi or English.

Target question bank for v1: 500-800 questions across all topics and difficulty levels.

## 12. Success Metrics

- **Primary:** Student qualifies CSAT (scores ≥66/200 in actual exam)
- **Leading indicators:**
  - ≥80% of topics at green status
  - Mock test scores consistently above 80/200
  - Revision queue trending toward zero
  - Time-per-question in mock tests averaging <2 minutes for RC, <2.5 minutes for LR

## 13. Out of Scope for v1

- Mobile app (responsive web only)
- Multiple students / multi-tenancy (single admin, single student for now — but data model supports expansion)
- In-app AI chatbot or runtime question generation
- Payment / subscription system
- Discussion forum or community features
- Hindi-medium UI (content can be bilingual, UI is English)
- Detailed analytics dashboards with charts (basic tables sufficient for v1)

## 14. Open Questions

1. **Product name?** Needs something memorable. "CSAT Cracker" is placeholder.
2. **Math notation:** Is KaTeX sufficient or do we need an equation editor in admin? For v1, markdown + KaTeX rendering should work. Admin can write LaTeX in the question text field.
3. **Question images:** Some CSAT questions have diagrams/tables as images. Do we support image upload per question in v1? Probably yes — file upload field on question form.
4. **Timer visibility during practice:** Should the student see how long they're taking per question during practice (not mocks)? Could create anxiety. Consider: show time only in post-practice review, not during.

---

*Next document: ARCHITECTURE.md → then CLAUDE.md → then build.*
