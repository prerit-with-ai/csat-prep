import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { topics, topicProgress, revisionQueue, mockTests, userSettings } from "../../../../drizzle/schema";
import { eq, asc, and, lte, inArray, sql, desc } from "drizzle-orm";
import Link from "next/link";
import DailyDoseCard from "@/components/DailyDoseCard";
import { Badge } from "@/components/ui/badge";
import { ExamCountdown } from "@/components/ExamCountdown";

const sectionNames = {
  rc: "Reading Comprehension",
  lr: "Logical Reasoning",
  math: "Mathematics",
};

const sectionVars = {
  rc: { bg: "--section-rc-bg", accent: "--section-rc" },
  lr: { bg: "--section-lr-bg", accent: "--section-lr" },
  math: { bg: "--section-math-bg", accent: "--section-math" },
};

export default async function StudentDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const allTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.status, "published"))
    .orderBy(asc(topics.displayOrder));

  const userProgress = await db
    .select()
    .from(topicProgress)
    .where(eq(topicProgress.userId, session.user.id));

  const recentMocks = await db
    .select()
    .from(mockTests)
    .where(and(eq(mockTests.userId, session.user.id), eq(mockTests.status, "completed")))
    .orderBy(desc(mockTests.submittedAt))
    .limit(3);

  const [{ count: revisionCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(revisionQueue)
    .where(
      and(
        eq(revisionQueue.userId, session.user.id),
        inArray(revisionQueue.status, ["active", "persistent"]),
        lte(revisionQueue.nextReviewAt, sql`now()`)
      )
    );

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  const examDate = settings?.examDate ? settings.examDate.toISOString() : null;

  const progressMap = new Map(userProgress.map((p) => [p.topicId, p]));

  const topicsBySection = {
    rc: allTopics.filter((t) => t.section === "rc"),
    lr: allTopics.filter((t) => t.section === "lr"),
    math: allTopics.filter((t) => t.section === "math"),
  };

  const activeSections = (["rc", "lr", "math"] as const).filter(
    (s) => topicsBySection[s].length > 0
  );

  const topicsWithProgress = userProgress.length;
  const latestMockScore = recentMocks[0]?.netScore
    ? parseFloat(recentMocks[0].netScore)
    : null;

  const isNewUser =
    userProgress.length === 0 && recentMocks.length === 0 && revisionCount === 0;

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-page-title mb-1">
          Welcome back, {session.user.name.split(" ")[0]}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Keep the momentum going.
        </p>
      </div>

      {/* ── TODAY ZONE ────────────────────────────────────────────────────────── */}
      <div
        data-testid="today-zone"
        className="rounded-2xl p-5 mb-6"
        style={{
          backgroundColor: "var(--color-amber-bg)",
          border: "1px solid var(--color-amber)",
        }}
      >
        {isNewUser ? (
          /* Onboarding — only for brand-new students */
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-amber)" }}>
              Getting started — 3 steps
            </p>
            <div className="space-y-3">
              {[
                { step: "1", title: "Browse your topics", desc: "Read the cheatsheet, then attempt a checkpoint quiz.", href: "/topics", cta: "Go to Topics →" },
                { step: "2", title: "Do your Daily Dose", desc: "18 mixed questions every day. Takes around 30 minutes.", href: "/daily/practice", cta: "Start today's dose →" },
                { step: "3", title: "Take a mock when ready", desc: "Full 80-question mock with ABC methodology and analysis.", href: "/mock", cta: "Go to Mocks →" },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-center gap-4 hover-row rounded-xl px-4 py-3"
                  style={{ border: "1px solid var(--border-subtle)" }}
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0"
                    style={{ backgroundColor: "var(--color-amber)", color: "#fff" }}
                  >
                    {item.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-sm shrink-0" style={{ color: "var(--color-amber)" }}>
                    {item.cta}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Returning student — Daily Dose + Exam Countdown side by side */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <DailyDoseCard />
            {examDate && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-default)" }}
              >
                <ExamCountdown examDate={examDate} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STAT STRIP ────────────────────────────────────────────────────────── */}
      <div
        data-testid="stat-strip"
        className="grid grid-cols-3 gap-3 mb-6"
      >
        {[
          {
            value: revisionCount > 0 ? revisionCount : "—",
            label: "Due for revision",
            color: revisionCount > 0 ? "var(--color-amber)" : "var(--text-tertiary)",
            href: revisionCount > 0 ? "/revision" : undefined,
          },
          {
            value: topicsWithProgress,
            label: `of ${allTopics.length} topics active`,
            color: "var(--text-primary)",
            href: "/topics",
          },
          {
            value: latestMockScore !== null ? latestMockScore.toFixed(1) : "—",
            label: "Last mock score",
            color: latestMockScore === null
              ? "var(--text-tertiary)"
              : latestMockScore >= 66
              ? "var(--color-correct)"
              : "var(--color-wrong)",
            href: recentMocks[0] ? `/mock/${recentMocks[0].id}/analysis` : undefined,
          },
        ].map((stat) => {
          const inner = (
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p
                className="text-2xl font-semibold tabular-nums leading-tight"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {stat.label}
              </p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="hover:opacity-80 transition-opacity">
              {inner}
            </Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      {/* ── TOPIC MAP ─────────────────────────────────────────────────────────── */}
      {allTopics.length === 0 ? (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-default)" }}
        >
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            No topics available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSections.map((sectionKey) => {
            const sectionTopics = topicsBySection[sectionKey];
            const vars = sectionVars[sectionKey];

            return (
              <div
                key={sectionKey}
                data-testid={`section-container-${sectionKey}`}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border-default)" }}
              >
                {/* Section header — tinted */}
                <div
                  data-testid={`section-header-${sectionKey}`}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ backgroundColor: `var(${vars.bg})` }}
                >
                  <Badge variant={`section-${sectionKey}` as "section-rc" | "section-lr" | "section-math"}>
                    {sectionKey.toUpperCase()}
                  </Badge>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: `var(${vars.accent})` }}
                  >
                    {sectionNames[sectionKey]}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: `var(${vars.accent})` }}>
                    {sectionTopics.filter((t) => progressMap.get(t.id)?.status === "green").length}/{sectionTopics.length} done
                  </span>
                </div>

                {/* Topic rows */}
                {sectionTopics.map((topic) => {
                  const progress = progressMap.get(topic.id);
                  const statusColor = !progress
                    ? "var(--text-tertiary)"
                    : progress.status === "red"
                    ? "var(--color-wrong)"
                    : progress.status === "amber"
                    ? "var(--color-amber)"
                    : "var(--color-correct)";
                  const statusLabel = !progress
                    ? "Not started"
                    : progress.status === "red"
                    ? "Started"
                    : progress.status === "amber"
                    ? "In progress"
                    : "Completed";

                  return (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.slug}`}
                      className="hover-row flex items-center gap-3 px-4 py-3"
                      style={{
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Status dot */}
                      <span style={{ color: statusColor, fontSize: 10 }}>●</span>

                      {/* Topic name */}
                      <span
                        className="flex-1 text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {topic.name}
                      </span>

                      {/* Status label + needs review badge */}
                      <div className="flex items-center gap-2">
                        {progress?.needsHelp && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--color-amber-bg)",
                              color: "var(--color-amber)",
                            }}
                          >
                            Review
                          </span>
                        )}
                        <span className="text-xs" style={{ color: statusColor }}>
                          {statusLabel}
                        </span>
                        <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
