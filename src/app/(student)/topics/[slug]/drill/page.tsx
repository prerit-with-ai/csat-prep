import { db } from "@/lib/db";
import { topics, patternTypes } from "../../../../../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DrillSession } from "./DrillSession";

export default async function DrillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.slug, slug), eq(topics.status, "published")))
    .limit(1);

  if (!topic) notFound();

  const patterns = await db
    .select()
    .from(patternTypes)
    .where(eq(patternTypes.topicId, topic.id))
    .orderBy(asc(patternTypes.displayOrder));

  if (patterns.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/topics/${slug}`}
          className="text-sm mb-6 inline-block"
          style={{ color: "var(--text-secondary)" }}
        >
          ← {topic.name}
        </Link>
        <h1 className="text-page-title mb-4">Drill Mode</h1>
        <p className="text-body" style={{ color: "var(--text-tertiary)" }}>
          No pattern types defined for this topic yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href={`/topics/${slug}`}
        className="text-sm mb-6 inline-block"
        style={{ color: "var(--text-secondary)" }}
      >
        ← {topic.name}
      </Link>
      <DrillSession topic={topic} patterns={patterns} />
    </div>
  );
}
