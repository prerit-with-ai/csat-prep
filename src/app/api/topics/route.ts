import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics, topicProgress } from "../../../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
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

    // Get all published topics
    const publishedTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.status, "published"))
      .orderBy(asc(topics.displayOrder));

    // Get all topic progress for this user
    const userProgress = await db
      .select()
      .from(topicProgress)
      .where(eq(topicProgress.userId, session.user.id));

    // Create a map for quick lookup
    const progressMap = new Map(
      userProgress.map((p) => [p.topicId, p])
    );

    // Join topics with progress
    const topicsWithProgress = publishedTopics.map((topic) => ({
      ...topic,
      progress: progressMap.get(topic.id) || null,
    }));

    return Response.json({ topics: topicsWithProgress });
  } catch (error) {
    console.error("GET /api/topics error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch topics" } },
      { status: 500 }
    );
  }
}
