import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { topics, topicProgress } from "../../../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import Link from "next/link";

const sectionNames = {
  rc: "Reading Comprehension",
  lr: "Logical Reasoning",
  math: "Mathematics",
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

  return (
    <div>
      <h1 className="text-page-title mb-6" style={{ color: "var(--text-primary)" }}>
        Topics
      </h1>

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
        <div className="space-y-8">
          {(["rc", "lr", "math"] as const).map((sectionKey) => {
            const sectionTopics = topicsBySection[sectionKey];
            if (sectionTopics.length === 0) return null;

            return (
              <section key={sectionKey}>
                <h2 className="text-section mb-4" style={{ color: "var(--text-primary)" }}>
                  {sectionNames[sectionKey]}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sectionTopics.map((topic) => {
                    const progress = progressMap.get(topic.id);
                    const statusColor =
                      !progress ? "var(--text-tertiary)"
                      : progress.status === "red" ? "var(--color-wrong)"
                      : progress.status === "amber" ? "var(--color-amber)"
                      : "var(--color-correct)";
                    const statusLabel =
                      !progress ? "Not started"
                      : progress.status === "red" ? "Started"
                      : progress.status === "amber" ? "In progress"
                      : "Completed";

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
                          <span className="text-xs" style={{ color: statusColor }}>●</span>
                          <span className="text-sm" style={{ color: statusColor }}>
                            {statusLabel}
                          </span>
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
