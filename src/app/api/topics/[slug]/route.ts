import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics, resources, patternTypes, topicProgress } from "../../../../../drizzle/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Fetch topic by slug
    const [topic] = await db
      .select()
      .from(topics)
      .where(and(eq(topics.slug, slug), eq(topics.status, "published")))
      .limit(1);

    if (!topic) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Topic not found" } },
        { status: 404 }
      );
    }

    // Fetch resources for this topic
    const topicResources = await db
      .select()
      .from(resources)
      .where(eq(resources.topicId, topic.id))
      .orderBy(asc(resources.displayOrder));

    // Fetch pattern types for this topic
    const topicPatternTypes = await db
      .select()
      .from(patternTypes)
      .where(eq(patternTypes.topicId, topic.id))
      .orderBy(asc(patternTypes.displayOrder));

    // Fetch student's progress for this topic
    const [progress] = await db
      .select()
      .from(topicProgress)
      .where(
        and(
          eq(topicProgress.userId, session.user.id),
          eq(topicProgress.topicId, topic.id)
        )
      )
      .limit(1);

    // Dependency check
    let dependenciesCleared = true;
    const blockedByTopics: string[] = [];

    if (topic.dependencyIds && topic.dependencyIds.length > 0) {
      // Fetch dependency topics
      const dependencyTopics = await db
        .select()
        .from(topics)
        .where(inArray(topics.id, topic.dependencyIds));

      // Fetch progress for all dependencies
      const dependencyProgress = await db
        .select()
        .from(topicProgress)
        .where(
          and(
            eq(topicProgress.userId, session.user.id),
            inArray(topicProgress.topicId, topic.dependencyIds)
          )
        );

      // Create a map of dependency progress
      const depProgressMap = new Map(
        dependencyProgress.map((p) => [p.topicId, p])
      );

      // Check each dependency
      for (const depTopic of dependencyTopics) {
        const depProgress = depProgressMap.get(depTopic.id);
        if (!depProgress || depProgress.status !== "green") {
          dependenciesCleared = false;
          blockedByTopics.push(depTopic.name);
        }
      }
    }

    return Response.json({
      topic,
      resources: topicResources,
      patternTypes: topicPatternTypes,
      progress: progress || null,
      dependenciesCleared,
      blockedByTopics,
    });
  } catch (error) {
    console.error("GET /api/topics/[slug] error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch topic details" } },
      { status: 500 }
    );
  }
}
