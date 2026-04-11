import { db } from "@/lib/db";
import { topics, resources, patternTypes, topicProgress } from "../../../../../drizzle/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import Link from "next/link";
import { ReadinessButtons } from "./ReadinessButtons";

const sectionVars = {
  rc: { bg: "--section-rc-bg", accent: "--section-rc", name: "Reading Comprehension" },
  lr: { bg: "--section-lr-bg", accent: "--section-lr", name: "Logical Reasoning" },
  math: { bg: "--section-math-bg", accent: "--section-math", name: "Mathematics" },
};

const resourceTypeBadges = {
  video: { label: "Video", bg: "var(--color-info-bg)", text: "var(--color-info)" },
  pdf: { label: "PDF", bg: "var(--color-amber-bg)", text: "var(--color-amber)" },
  article: { label: "Article", bg: "var(--bg-tertiary)", text: "var(--text-secondary)" },
};

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.slug, slug), eq(topics.status, "published")))
    .limit(1);

  if (!topic) {
    notFound();
  }

  const [topicResources, topicPatternTypes, userProgressArr] = await Promise.all([
    db.select().from(resources).where(eq(resources.topicId, topic.id)).orderBy(asc(resources.displayOrder)),
    db.select().from(patternTypes).where(eq(patternTypes.topicId, topic.id)).orderBy(asc(patternTypes.displayOrder)),
    db.select().from(topicProgress).where(and(eq(topicProgress.userId, session.user.id), eq(topicProgress.topicId, topic.id))).limit(1),
  ]);

  const userProgress = userProgressArr[0];

  // Check dependencies
  let blockedByTopics: typeof topics.$inferSelect[] = [];
  let dependenciesCleared = true;

  if (topic.dependencyIds && topic.dependencyIds.length > 0) {
    const dependencyTopics = await db
      .select()
      .from(topics)
      .where(inArray(topics.id, topic.dependencyIds));

    const dependencyProgress = await db
      .select()
      .from(topicProgress)
      .where(and(eq(topicProgress.userId, session.user.id), inArray(topicProgress.topicId, topic.dependencyIds)));

    const clearedIds = new Set(
      dependencyProgress.filter((p) => p.status === "green").map((p) => p.topicId)
    );

    blockedByTopics = dependencyTopics.filter((t) => !clearedIds.has(t.id));
    dependenciesCleared = blockedByTopics.length === 0;
  }

  const sec = sectionVars[topic.section as keyof typeof sectionVars];
  const statusColor = !userProgress
    ? "var(--text-tertiary)"
    : userProgress.status === "red"
    ? "var(--color-wrong)"
    : userProgress.status === "amber"
    ? "var(--color-amber)"
    : "var(--color-correct)";
  const statusLabel = !userProgress
    ? "Not started"
    : userProgress.status === "red"
    ? "Started"
    : userProgress.status === "amber"
    ? "In progress"
    : "Completed";

  return (
    <div className="space-y-0">
      {/* ── Colored section header band ──────────────────────────────────────── */}
      <div
        data-testid="topic-header"
        className="rounded-2xl mb-6 overflow-hidden"
        style={{ backgroundColor: `var(${sec.bg})`, border: `1px solid var(${sec.accent})` }}
      >
        {/* Back link */}
        <div className="px-5 pt-4 pb-0">
          <Link
            href="/topics"
            className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: `var(${sec.accent})` }}
          >
            ← Topics
          </Link>
        </div>

        {/* Topic name + section + status */}
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
            <h1
              className="text-page-title"
              style={{ color: "var(--text-primary)" }}
            >
              {topic.name}
            </h1>
            <div className="flex items-center gap-2">
              {userProgress && (
                <span className="text-xs font-medium" style={{ color: statusColor }}>
                  ● {statusLabel}
                </span>
              )}
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `var(${sec.accent})`,
                  color: "#fff",
                }}
              >
                {topic.section.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: `var(${sec.accent})` }}>
            {sec.name}
          </p>

          {/* Primary CTAs in header */}
          {dependenciesCleared && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/topics/${slug}/practice`}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: `var(${sec.accent})`,
                  color: "#fff",
                }}
              >
                Start Practice →
              </Link>
              {topicPatternTypes.length > 0 && (
                <Link
                  href={`/topics/${slug}/drill`}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: `1px solid var(${sec.accent})`,
                    color: `var(${sec.accent})`,
                  }}
                >
                  Pattern Drill
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Dependency gate ───────────────────────────────────────────────────── */}
      {!dependenciesCleared && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: "var(--color-amber-bg)",
            border: "1px solid var(--color-amber)",
          }}
        >
          <p className="text-body font-medium mb-2" style={{ color: "var(--color-amber)" }}>
            ⚠ Complete these topics first:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {blockedByTopics.map((depTopic) => (
              <li key={depTopic.id}>
                <Link
                  href={`/topics/${depTopic.slug}`}
                  className="text-body hover:underline"
                  style={{ color: "var(--color-amber)" }}
                >
                  {depTopic.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Cheatsheet ────────────────────────────────────────────────────────── */}
      {topic.cheatsheet && (
        <div className="mb-6">
          <h2 className="text-section mb-4">Cheatsheet</h2>
          <div
            className="rounded-xl"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            {/* Cheatsheet header bar */}
            <div
              className="px-5 py-2.5 flex items-center gap-2"
              style={{
                backgroundColor: `var(${sec.bg})`,
                borderBottom: `1px solid var(${sec.accent})`,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: `var(${sec.accent})` }}>
                Quick Reference
              </span>
            </div>
            <div className="px-5 py-5">
              <MarkdownRenderer content={topic.cheatsheet} />
            </div>
          </div>
        </div>
      )}

      {/* ── Pattern Types ─────────────────────────────────────────────────────── */}
      {topicPatternTypes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-section mb-4">What you&apos;ll learn</h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            {topicPatternTypes.map((pattern, idx) => (
              <div
                key={pattern.id}
                className="px-5 py-4"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderTop: idx > 0 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <h3 className="font-medium text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {pattern.name}
                </h3>
                {pattern.description && (
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {pattern.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Resources ─────────────────────────────────────────────────────────── */}
      {topicResources.length > 0 && (
        <div className="mb-6">
          <h2 className="text-section mb-4">Study Resources</h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            {topicResources.map((resource, idx) => {
              const badge = resourceTypeBadges[resource.type as keyof typeof resourceTypeBadges];
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover-row flex items-center gap-3 px-5 py-4"
                  style={{
                    borderTop: idx > 0 ? "1px solid var(--border-subtle)" : "none",
                    textDecoration: "none",
                  }}
                >
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                  <span
                    className="flex-1 text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {resource.title}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    ↗
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Readiness section ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2 className="text-section mb-2">Are you ready to practice?</h2>
        <p className="text-body mb-4" style={{ color: "var(--text-secondary)" }}>
          Click below when you&apos;ve read the cheatsheet and feel confident.
        </p>

        {userProgress && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Current status:
            </span>
            <span className="text-xs" style={{ color: statusColor }}>●</span>
            <span className="text-sm font-medium" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>
        )}

        <ReadinessButtons slug={slug} />

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/topics/${slug}/practice`}
            className="inline-block px-5 py-2.5 rounded-lg text-body font-medium"
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-primary)",
            }}
          >
            Start Practice →
          </Link>
          {topicPatternTypes.length > 0 && (
            <Link
              href={`/topics/${slug}/drill`}
              className="inline-block px-5 py-2.5 rounded-lg text-body font-medium"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              Pattern Drill
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
