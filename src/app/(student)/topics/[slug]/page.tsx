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

  // Fetch topic by slug
  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.slug, slug), eq(topics.status, "published")))
    .limit(1);

  if (!topic) {
    notFound();
  }

  // Fetch resources for topic
  const topicResources = await db
    .select()
    .from(resources)
    .where(eq(resources.topicId, topic.id))
    .orderBy(asc(resources.displayOrder));

  // Fetch pattern types for topic
  const topicPatternTypes = await db
    .select()
    .from(patternTypes)
    .where(eq(patternTypes.topicId, topic.id))
    .orderBy(asc(patternTypes.displayOrder));

  // Fetch user's progress for this topic
  const [userProgress] = await db
    .select()
    .from(topicProgress)
    .where(
      and(
        eq(topicProgress.userId, session.user.id),
        eq(topicProgress.topicId, topic.id)
      )
    )
    .limit(1);

  // Check dependencies
  let blockedByTopics: typeof topics.$inferSelect[] = [];
  let dependenciesCleared = true;

  if (topic.dependencyIds && topic.dependencyIds.length > 0) {
    // Fetch dependency topics
    const dependencyTopics = await db
      .select()
      .from(topics)
      .where(inArray(topics.id, topic.dependencyIds));

    // Fetch progress for dependency topics
    const dependencyProgressRecords = await db
      .select()
      .from(topicProgress)
      .where(
        and(
          eq(topicProgress.userId, session.user.id),
          inArray(topicProgress.topicId, topic.dependencyIds)
        )
      );

    const clearedDependencyIds = new Set(
      dependencyProgressRecords
        .filter((p) => p.status === "green")
        .map((p) => p.topicId)
    );

    blockedByTopics = dependencyTopics.filter(
      (t) => !clearedDependencyIds.has(t.id)
    );
    dependenciesCleared = blockedByTopics.length === 0;
  }

  const sectionColors = {
    rc: { bg: "var(--section-rc-bg)", text: "var(--section-rc)" },
    lr: { bg: "var(--section-lr-bg)", text: "var(--section-lr)" },
    math: { bg: "var(--section-math-bg)", text: "var(--section-math)" },
  };

  const sectionColor = sectionColors[topic.section as keyof typeof sectionColors];

  const resourceTypeBadges = {
    video: { label: "Video", bg: "var(--color-info-bg)", text: "var(--color-info)" },
    pdf: { label: "PDF", bg: "var(--color-amber-bg)", text: "var(--color-amber)" },
    article: { label: "Article", bg: "var(--bg-tertiary)", text: "var(--text-secondary)" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm mb-4 hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1
            className="text-page-title"
            style={{ color: "var(--text-primary)" }}
          >
            {topic.name}
          </h1>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: sectionColor.bg,
              color: sectionColor.text,
            }}
          >
            {topic.section.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Dependency gate */}
      {!dependenciesCleared && (
        <div
          style={{
            backgroundColor: "var(--color-amber-bg)",
            border: "1px solid var(--color-amber)",
          }}
          className="rounded-xl p-5"
        >
          <p
            className="text-body font-medium mb-2"
            style={{ color: "var(--color-amber)" }}
          >
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

      {/* Cheatsheet section */}
      {topic.cheatsheet && (
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
          className="rounded-xl p-5"
        >
          <h2
            className="text-section mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Cheatsheet
          </h2>
          <MarkdownRenderer content={topic.cheatsheet} />
        </div>
      )}

      {/* Pattern Types section */}
      {topicPatternTypes.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
          className="rounded-xl p-5"
        >
          <h2
            className="text-section mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            What you'll learn
          </h2>
          <ul className="space-y-3">
            {topicPatternTypes.map((pattern) => (
              <li key={pattern.id}>
                <h3
                  className="font-medium text-body mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {pattern.name}
                </h3>
                {pattern.description && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {pattern.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources section */}
      {topicResources.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
          className="rounded-xl p-5"
        >
          <h2
            className="text-section mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Study Resources
          </h2>
          <ul className="space-y-3">
            {topicResources.map((resource) => {
              const badge = resourceTypeBadges[resource.type as keyof typeof resourceTypeBadges];
              return (
                <li key={resource.id} className="flex items-start gap-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                    }}
                  >
                    {badge.label}
                  </span>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {resource.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Readiness section */}
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
        className="rounded-xl p-5"
      >
        <h2
          className="text-section mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Are you ready to practice?
        </h2>
        <p
          className="text-body mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Click below when you've read the cheatsheet and feel confident.
        </p>

        {userProgress && (
          <div className="mb-4 flex items-center gap-2">
            <span
              className="text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              Current status:
            </span>
            <span
              className="text-xs"
              style={{
                color:
                  userProgress.status === "red"
                    ? "var(--color-wrong)"
                    : userProgress.status === "amber"
                    ? "var(--color-amber)"
                    : "var(--color-correct)",
              }}
            >
              ●
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color:
                  userProgress.status === "red"
                    ? "var(--color-wrong)"
                    : userProgress.status === "amber"
                    ? "var(--color-amber)"
                    : "var(--color-correct)",
              }}
            >
              {userProgress.status === "red" && "Started"}
              {userProgress.status === "amber" && "In progress"}
              {userProgress.status === "green" && "Completed"}
            </span>
          </div>
        )}

        <ReadinessButtons
          slug={slug}
          initialNeedsHelp={userProgress?.needsHelp ?? false}
          hasProgress={!!userProgress}
        />
      </div>
    </div>
  );
}
