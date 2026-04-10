import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicById, getPatternTypesByTopicId, getResourcesByTopicId } from "@/lib/db-queries";
import { TopicInfoEditor, CheatsheetEditor, PatternManager, ResourceManager, FormulaCardManager } from "./TopicDetailClient";
import { db } from "@/lib/db";
import { formulaCards } from "../../../../../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [topic, patternTypes, resources, formulas] = await Promise.all([
    getTopicById(id),
    getPatternTypesByTopicId(id),
    getResourcesByTopicId(id),
    db.select().from(formulaCards).where(eq(formulaCards.topicId, id)).orderBy(asc(formulaCards.displayOrder)),
  ]);

  if (!topic) {
    notFound();
  }

  const sectionLabels: Record<string, string> = {
    rc: "Reading Comprehension",
    lr: "Logical Reasoning",
    math: "Math",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/topics"
          className="text-sm mb-3 inline-block"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Topics
        </Link>
        <div className="flex items-center justify-between mb-2">
          <h1
            className="text-page-title"
            style={{ color: "var(--text-primary)" }}
          >
            {topic.name}
          </h1>
          <span
            className="px-3 py-1 rounded-lg text-sm"
            style={{
              backgroundColor: topic.status === "published" ? "var(--status-correct)" : "var(--bg-tertiary)",
              color: topic.status === "published" ? "white" : "var(--text-secondary)",
            }}
          >
            {topic.status}
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {sectionLabels[topic.section]} • Order: {topic.displayOrder}
        </p>
      </div>

      {/* Topic Info Section */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          className="text-section-header mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Topic Information
        </h2>
        <TopicInfoEditor topic={{ id: topic.id, name: topic.name, slug: topic.slug, section: topic.section, status: topic.status, displayOrder: topic.displayOrder }} />
      </div>

      {/* Cheatsheet Section */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          className="text-section-header mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Cheatsheet
        </h2>
        <CheatsheetEditor topicId={topic.id} initialContent={topic.cheatsheet || ""} />
      </div>

      {/* Pattern Types Section */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          className="text-section-header mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Pattern Types
        </h2>
        <PatternManager topicId={topic.id} initialPatterns={patternTypes} />
      </div>

      {/* Resources Section */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          className="text-section-header mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Resources
        </h2>
        <ResourceManager topicId={topic.id} initialResources={resources} />
      </div>

      {/* Formula Cards Section */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          className="text-section-header mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Formula Cards
        </h2>
        <FormulaCardManager topicId={topic.id} initialFormulas={formulas} />
      </div>
    </div>
  );
}
