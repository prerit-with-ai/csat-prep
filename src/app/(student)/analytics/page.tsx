import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  attempts,
  topics,
  patternProgress,
  patternTypes,
  mockTests,
  mockTestResponses,
} from "../../../../drizzle/schema";
import { eq, and, asc, desc, sql, gte } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const QUALIFYING = 66;
const MAX_SCORE = 200;

const sectionLabels: Record<string, string> = {
  rc: "Reading Comprehension",
  lr: "Logical Reasoning",
  math: "Mathematics",
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [sectionStats, weakPatterns, velocity, completedMocks, abcTrend] =
    await Promise.all([
      // Accuracy + avg time by section
      db
        .select({
          section: topics.section,
          total: sql<number>`count(${attempts.id})::int`,
          correct: sql<number>`sum(case when ${attempts.isCorrect} then 1 else 0 end)::int`,
          avgTimeSecs: sql<number>`round(avg(${attempts.timeSpent}))::int`,
        })
        .from(attempts)
        .innerJoin(topics, eq(topics.id, attempts.topicId))
        .where(eq(attempts.userId, userId))
        .groupBy(topics.section),

      // Weakest patterns (≥3 attempts), ordered by accuracy ascending
      db
        .select({
          patternId: patternTypes.id,
          patternName: patternTypes.name,
          topicName: topics.name,
          topicSlug: topics.slug,
          attemptCount: patternProgress.attemptsCount,
          correctCount: patternProgress.correctCount,
        })
        .from(patternProgress)
        .innerJoin(
          patternTypes,
          eq(patternTypes.id, patternProgress.patternTypeId)
        )
        .innerJoin(topics, eq(topics.id, patternTypes.topicId))
        .where(
          and(
            eq(patternProgress.userId, userId),
            gte(patternProgress.attemptsCount, 3)
          )
        )
        .orderBy(
          sql`(${patternProgress.correctCount}::float / nullif(${patternProgress.attemptsCount}, 0))`
        )
        .limit(5),

      // Practice velocity
      db
        .select({
          last7: sql<number>`count(*) filter (where ${attempts.createdAt} >= now() - interval '7 days')::int`,
          last30: sql<number>`count(*) filter (where ${attempts.createdAt} >= now() - interval '30 days')::int`,
          allTime: sql<number>`count(*)::int`,
        })
        .from(attempts)
        .where(eq(attempts.userId, userId)),

      // Completed mocks — most recent first
      db
        .select()
        .from(mockTests)
        .where(
          and(eq(mockTests.userId, userId), eq(mockTests.status, "completed"))
        )
        .orderBy(desc(mockTests.submittedAt)),

      // ABC breakdown per mock — oldest first for trend reading
      db
        .select({
          mockId: mockTests.id,
          submittedAt: mockTests.submittedAt,
          netScore: mockTests.netScore,
          aCount:
            sql<number>`sum(case when ${mockTestResponses.abcTag} = 'A' then 1 else 0 end)::int`,
          aCorrect:
            sql<number>`sum(case when ${mockTestResponses.abcTag} = 'A' and ${mockTestResponses.isCorrect} then 1 else 0 end)::int`,
          bCount:
            sql<number>`sum(case when ${mockTestResponses.abcTag} = 'B' then 1 else 0 end)::int`,
          cCount:
            sql<number>`sum(case when ${mockTestResponses.abcTag} = 'C' then 1 else 0 end)::int`,
        })
        .from(mockTests)
        .innerJoin(
          mockTestResponses,
          eq(mockTestResponses.mockTestId, mockTests.id)
        )
        .where(
          and(eq(mockTests.userId, userId), eq(mockTests.status, "completed"))
        )
        .groupBy(
          mockTests.id,
          mockTests.submittedAt,
          mockTests.netScore,
          mockTests.totalQuestions
        )
        .orderBy(asc(mockTests.submittedAt)),
    ]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const vel = velocity[0] ?? { last7: 0, last30: 0, allTime: 0 };

  const mockScores = completedMocks
    .map((m) => (m.netScore ? parseFloat(m.netScore) : null))
    .filter((s): s is number => s !== null);

  const bestScore = mockScores.length ? Math.max(...mockScores) : null;
  const avgScore = mockScores.length
    ? mockScores.reduce((a, b) => a + b, 0) / mockScores.length
    : null;
  const latestScore = mockScores.length ? mockScores[0] : null;

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "var(--max-content)" }}>
      <div className="mb-8">
        <h1 className="text-page-title mb-1">Your Performance</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Based on your practice and mock history
        </p>
      </div>

      {/* ── Practice activity ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-section mb-4">Practice Activity</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Last 7 days", value: vel.last7 },
            { label: "Last 30 days", value: vel.last30 },
            { label: "All time", value: vel.allTime },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p
                className="text-2xl font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Accuracy by section ────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-section mb-4">Accuracy by Section</h2>

        {sectionStats.length === 0 ? (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No practice data yet.{" "}
              <Link
                href="/topics"
                className="underline"
                style={{ color: "var(--text-primary)" }}
              >
                Start practicing →
              </Link>
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            {(["rc", "lr", "math"] as const)
              .map((sec) => ({
                sec,
                stat: sectionStats.find((s) => s.section === sec),
              }))
              .filter(({ stat }) => !!stat)
              .map(({ sec, stat }, idx, arr) => {
                const accuracy =
                  stat!.total > 0
                    ? Math.round((stat!.correct / stat!.total) * 100)
                    : 0;
                return (
                  <div
                    key={sec}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      backgroundColor: "var(--bg-primary)",
                      borderBottom:
                        idx < arr.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          (`section-${sec}`) as
                            | "section-rc"
                            | "section-lr"
                            | "section-math"
                        }
                      >
                        {sec.toUpperCase()}
                      </Badge>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {sectionLabels[sec]}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {stat!.total} questions · avg{" "}
                          {formatTime(stat!.avgTimeSecs ?? 0)} / question
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{
                        color:
                          accuracy >= 70
                            ? "var(--color-correct)"
                            : accuracy >= 50
                            ? "var(--color-amber)"
                            : "var(--color-wrong)",
                      }}
                    >
                      {accuracy}%
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* ── Weakest patterns ───────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-section mb-4">Weakest Patterns</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          Patterns with ≥3 attempts, ordered by accuracy.
        </p>

        {weakPatterns.length === 0 ? (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Practice at least 3 questions per pattern to see weakness data.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            {weakPatterns.map((p, idx) => {
              const accuracy =
                p.attemptCount > 0
                  ? Math.round((p.correctCount / p.attemptCount) * 100)
                  : 0;
              const isLast = idx === weakPatterns.length - 1;
              return (
                <div
                  key={p.patternId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    backgroundColor: "var(--bg-primary)",
                    borderBottom: isLast
                      ? "none"
                      : "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {p.patternName}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {p.topicName} · {p.attemptCount} attempts
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--color-wrong)" }}
                  >
                    {accuracy}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Mock scores ────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-section mb-4">Mock Scores</h2>

        {completedMocks.length === 0 ? (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No completed mocks yet.{" "}
              <Link
                href="/mock"
                className="underline"
                style={{ color: "var(--text-primary)" }}
              >
                Take your first mock →
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Score overview cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Best", value: bestScore },
                { label: "Average", value: avgScore },
                { label: "Latest", value: latestScore },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <p
                    className="text-2xl font-semibold mb-1 tabular-nums"
                    style={{
                      color:
                        value === null
                          ? "var(--text-tertiary)"
                          : value >= QUALIFYING
                          ? "var(--color-correct)"
                          : "var(--color-wrong)",
                    }}
                  >
                    {value !== null ? value.toFixed(1) : "—"}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {label} / {MAX_SCORE}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
              Qualifying threshold: {QUALIFYING} / {MAX_SCORE} (33%)
            </p>

            {/* Mock list */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border-default)" }}
            >
              {completedMocks.slice(0, 8).map((mock, idx, arr) => {
                const score = mock.netScore ? parseFloat(mock.netScore) : null;
                const date = mock.submittedAt
                  ? new Date(mock.submittedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—";
                const isLast = idx === arr.length - 1;
                return (
                  <Link
                    key={mock.id}
                    href={`/mock/${mock.id}/analysis`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-primary)",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid var(--border-subtle)",
                      transition: "background-color 150ms",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-tertiary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-primary)")
                    }
                  >
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {mock.type === "full"
                          ? "Full Mock"
                          : mock.type === "section"
                          ? `${mock.section?.toUpperCase()} Mock`
                          : "Topic Mock"}{" "}
                        · {date}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {mock.totalQuestions} questions
                      </p>
                    </div>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{
                        color:
                          score === null
                            ? "var(--text-tertiary)"
                            : score >= QUALIFYING
                            ? "var(--color-correct)"
                            : "var(--color-wrong)",
                      }}
                    >
                      {score !== null ? score.toFixed(1) : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── ABC trend ──────────────────────────────────────────────────────── */}
      {abcTrend.length > 0 && (
        <section className="mb-8">
          <h2 className="text-section mb-1">ABC Trend</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            A-accuracy = correct A-tags / total A-tags. Target: &gt;80%.
          </p>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 72px 72px 60px 60px",
                padding: "10px 16px",
                backgroundColor: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {["Date", "Score", "A acc.", "B", "C"].map((h) => (
                <span
                  key={h}
                  className="text-xs font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {abcTrend.map((mock, idx) => {
              const score = mock.netScore ? parseFloat(mock.netScore) : null;
              const aAcc =
                mock.aCount > 0
                  ? Math.round((mock.aCorrect / mock.aCount) * 100)
                  : null;
              const date = mock.submittedAt
                ? new Date(mock.submittedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "—";
              const isLast = idx === abcTrend.length - 1;

              return (
                <div
                  key={mock.mockId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 72px 72px 60px 60px",
                    padding: "11px 16px",
                    backgroundColor: "var(--bg-primary)",
                    borderBottom: isLast
                      ? "none"
                      : "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {date}
                  </span>
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{
                      color:
                        score === null
                          ? "var(--text-tertiary)"
                          : score >= QUALIFYING
                          ? "var(--color-correct)"
                          : "var(--color-wrong)",
                    }}
                  >
                    {score !== null ? score.toFixed(0) : "—"}
                  </span>
                  <span
                    className="text-sm tabular-nums"
                    style={{
                      color:
                        aAcc === null
                          ? "var(--text-tertiary)"
                          : aAcc >= 80
                          ? "var(--color-correct)"
                          : aAcc >= 60
                          ? "var(--color-amber)"
                          : "var(--color-wrong)",
                    }}
                  >
                    {aAcc !== null ? `${aAcc}%` : "—"}
                  </span>
                  <span
                    className="text-sm tabular-nums"
                    style={{ color: "var(--color-amber)" }}
                  >
                    {mock.bCount}
                  </span>
                  <span
                    className="text-sm tabular-nums"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {mock.cCount}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-2">
        <Link
          href="/strategy"
          className="text-sm underline"
          style={{ color: "var(--text-secondary)" }}
        >
          Read the strategy guide →
        </Link>
      </div>
    </div>
  );
}
