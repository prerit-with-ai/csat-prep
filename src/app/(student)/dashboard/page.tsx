import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { topics, topicProgress, revisionQueue, mockTests } from "../../../../drizzle/schema";
import { eq, asc, and, lte, inArray, sql, desc } from "drizzle-orm";
import Link from "next/link";
import DailyDoseCard from "@/components/DailyDoseCard";

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

  return (
    <div>
      <h1
        className="text-page-title mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Welcome, {session.user.name}
      </h1>

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
          <h2 className="text-section mb-3" style={{ color: "var(--text-primary)" }}>
            Recent Mocks
          </h2>
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
                <h2
                  className="text-section mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  {sectionNames[sectionKey]}
                </h2>
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
                        }}
                        className="rounded-xl p-4 block hover:opacity-80 transition-opacity"
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
