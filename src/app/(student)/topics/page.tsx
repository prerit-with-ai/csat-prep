import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { topics, topicProgress } from "../../../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

export default async function TopicsPage() {
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
    .where(and(eq(topicProgress.userId, session.user.id)));

  const progressMap = new Map(userProgress.map((p) => [p.topicId, p]));

  const topicsBySection = {
    rc: allTopics.filter((t) => t.section === "rc"),
    lr: allTopics.filter((t) => t.section === "lr"),
    math: allTopics.filter((t) => t.section === "math"),
  };

  const activeSections = (["rc", "lr", "math"] as const).filter(
    (s) => topicsBySection[s].length > 0
  );

  return (
    <div>
      <h1 className="text-page-title mb-6">Topics</h1>

      {allTopics.length === 0 && (
        <div
          className="p-5 rounded-xl"
          style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-primary)" }}
        >
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            No topics published yet.
          </p>
        </div>
      )}

      {allTopics.length > 0 && (
        <div className="space-y-4">
          {activeSections.map((sectionKey) => {
            const sectionTopics = topicsBySection[sectionKey];
            const vars = sectionVars[sectionKey];
            const doneCount = sectionTopics.filter(
              (t) => progressMap.get(t.id)?.status === "green"
            ).length;

            return (
              <div
                key={sectionKey}
                data-testid={`topics-section-${sectionKey}`}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border-default)" }}
              >
                {/* Section header */}
                <div
                  data-testid={`topics-section-header-${sectionKey}`}
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
                    {doneCount}/{sectionTopics.length} completed
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

                  const levelLabel = progress
                    ? progress.currentLevel === "l1"
                      ? "L1"
                      : progress.currentLevel === "l2"
                      ? "L2"
                      : "L3"
                    : null;

                  return (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.slug}`}
                      className="hover-row flex items-center gap-3 px-4 py-3"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
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

                      {/* Level + status */}
                      <div className="flex items-center gap-2">
                        {levelLabel && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: `var(--level-${progress!.currentLevel}-bg)`,
                              color: `var(--level-${progress!.currentLevel})`,
                            }}
                          >
                            {levelLabel}
                          </span>
                        )}
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
