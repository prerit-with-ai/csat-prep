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

export default async function StudentDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch published topics ordered by displayOrder
  const allTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.status, "published"))
    .orderBy(asc(topics.displayOrder));

  // Fetch user's topic progress
  const userProgress = await db
    .select()
    .from(topicProgress)
    .where(eq(topicProgress.userId, session.user.id));

  // Fetch last 3 completed mock tests
  const recentMocks = await db
    .select()
    .from(mockTests)
    .where(and(eq(mockTests.userId, session.user.id), eq(mockTests.status, "completed")))
    .orderBy(desc(mockTests.submittedAt))
    .limit(3);

  // Fetch topics needing help
  const needsHelpTopics = await db
    .select({ topicId: topicProgress.topicId })
    .from(topicProgress)
    .where(and(eq(topicProgress.userId, session.user.id), eq(topicProgress.needsHelp, true)));

  // Count due revision items
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

  // Fetch user settings (exam date)
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  const examDate = settings?.examDate ? settings.examDate.toISOString() : null;

  // Build progress map: topicId -> progress
  const progressMap = new Map(
    userProgress.map((p) => [p.topicId, p])
  );

  // Group topics by section
  const topicsBySection = {
    rc: allTopics.filter((t) => t.section === "rc"),
    lr: allTopics.filter((t) => t.section === "lr"),
    math: allTopics.filter((t) => t.section === "math"),
  };

  const sectionNames = {
    rc: "Reading Comprehension",
    lr: "Logical Reasoning",
    math: "Mathematics",
  };

  const hasAnyTopics = allTopics.length > 0;
  const isNewUser =
    userProgress.length === 0 &&
    recentMocks.length === 0 &&
    revisionCount === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-page-title mb-1">
          Welcome back, {session.user.name.split(" ")[0]}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Keep the momentum going.
        </p>
      </div>

      {/* Onboarding — shown only to brand-new students */}
      {isNewUser && (
        <div
          className="mb-8 rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-primary)" }}
          >
            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
              Getting started
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Three steps to begin your CSAT preparation
            </p>
          </div>
          {[
            {
              step: "1",
              title: "Browse your topics",
              desc: "Start with a cheatsheet, then attempt a checkpoint quiz.",
              href: "/topics",
              cta: "Go to Topics →",
            },
            {
              step: "2",
              title: "Do your Daily Dose",
              desc: "18 mixed questions every day. Takes around 30 minutes.",
              href: "/daily/practice",
              cta: "Start today's dose →",
            },
            {
              step: "3",
              title: "Take a mock when ready",
              desc: "Full 80-question mock with ABC methodology and analysis.",
              href: "/mock",
              cta: "Go to Mocks →",
            },
          ].map((item, idx, arr) => (
            <Link
              key={item.step}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                backgroundColor: "var(--bg-primary)",
                borderBottom: idx < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-primary)")
              }
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-sm shrink-0 ml-4" style={{ color: "var(--text-secondary)" }}>
                {item.cta}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-4">
        <ExamCountdown examDate={examDate} />
      </div>

      <div className="mb-8">
        <DailyDoseCard />
      </div>

      {revisionCount > 0 && (
        <div className="mb-8">
          <Link
            href="/revision"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--border-default)",
              borderLeft: "3px solid var(--color-amber)",
              borderRadius: "12px",
              padding: "16px 20px",
              backgroundColor: "var(--bg-primary)",
            }}
          >
            <div>
              <p className="font-medium" style={{ color: "var(--text-primary)", fontSize: 15 }}>
                Revision Due
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                {revisionCount} pattern{revisionCount !== 1 ? "s" : ""} to review
              </p>
            </div>
            <span
              style={{
                backgroundColor: "var(--color-amber)",
                color: "white",
                borderRadius: "12px",
                padding: "2px 10px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {revisionCount}
            </span>
          </Link>
        </div>
      )}

      {recentMocks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-section" style={{ color: "var(--text-primary)" }}>
              Recent Mocks
            </h2>
            <Link href="/mock/history" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentMocks.map((mock) => {
              const score = mock.netScore ? parseFloat(mock.netScore) : null;
              const date = mock.submittedAt
                ? new Date(mock.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "—";
              return (
                <Link
                  key={mock.id}
                  href={`/mock/${mock.id}/analysis`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid var(--border-default)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-primary)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {mock.type === "full" ? "Full Mock" : mock.type === "section" ? `${mock.section?.toUpperCase()} Section Mock` : "Topic Mock"} · {date}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {mock.totalQuestions} questions
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        score === null ? "var(--text-tertiary)"
                        : score >= 100 ? "var(--color-correct)"
                        : score >= 66 ? "var(--color-amber)"
                        : "var(--color-wrong)",
                    }}
                  >
                    {score !== null ? `${score.toFixed(1)} / ${(mock.totalQuestions * 2.5).toFixed(0)}` : "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {needsHelpTopics.length > 0 && (
        <div className="mb-8">
          <div
            style={{
              border: "1px solid var(--border-default)",
              borderLeft: "3px solid var(--color-amber)",
              borderRadius: "12px",
              padding: "16px 20px",
              backgroundColor: "var(--bg-primary)",
            }}
          >
            <p className="font-medium" style={{ color: "var(--text-primary)", fontSize: 15 }}>
              Topics Flagged for Help
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {needsHelpTopics.length} topic{needsHelpTopics.length !== 1 ? "s" : ""} marked as needing review by your instructor
            </p>
          </div>
        </div>
      )}

      {!hasAnyTopics && (
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
          className="rounded-xl p-5"
        >
          <p
            className="text-body"
            style={{ color: "var(--text-secondary)" }}
          >
            No topics available yet.
          </p>
        </div>
      )}

      {hasAnyTopics && (
        <div className="space-y-8">
          {(["rc", "lr", "math"] as const).map((sectionKey) => {
            const sectionTopics = topicsBySection[sectionKey];
            if (sectionTopics.length === 0) return null;

            return (
              <section key={sectionKey}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={`section-${sectionKey}` as "section-rc" | "section-lr" | "section-math"}>
                    {sectionKey.toUpperCase()}
                  </Badge>
                  <h2 className="text-section">
                    {sectionNames[sectionKey]}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sectionTopics.map((topic) => {
                    const progress = progressMap.get(topic.id);
                    return (
                      <Link
                        key={topic.id}
                        href={`/topics/${topic.slug}`}
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-default)",
                          borderLeft: `3px solid var(--section-${sectionKey})`,
                          display: "block",
                          borderRadius: "12px",
                          padding: "16px",
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
                        <h3
                          className="font-medium text-base mb-2"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {topic.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!progress && (
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                ●
                              </span>
                              <span
                                className="text-sm"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Not started
                              </span>
                            </div>
                          )}
                          {progress && (
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs"
                                style={{
                                  color:
                                    progress.status === "red"
                                      ? "var(--color-wrong)"
                                      : progress.status === "amber"
                                      ? "var(--color-amber)"
                                      : "var(--color-correct)",
                                }}
                              >
                                ●
                              </span>
                              <span
                                className="text-sm"
                                style={{
                                  color:
                                    progress.status === "red"
                                      ? "var(--color-wrong)"
                                      : progress.status === "amber"
                                      ? "var(--color-amber)"
                                      : "var(--color-correct)",
                                }}
                              >
                                {progress.status === "red" && "Started"}
                                {progress.status === "amber" && "In progress"}
                                {progress.status === "green" && "Completed"}
                              </span>
                            </div>
                          )}
                          {progress?.needsHelp && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: "var(--color-amber-bg)",
                                color: "var(--color-amber)",
                              }}
                            >
                              Needs review
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
