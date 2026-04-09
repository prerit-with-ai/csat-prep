import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics, topicProgress } from "../../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const progressSchema = z.object({
  needsHelp: z.boolean().optional(),
});

export async function POST(
  request: Request,
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

    const body = await request.json();
    const validatedData = progressSchema.parse(body);

    // Check if progress already exists
    const existing = await db
      .select()
      .from(topicProgress)
      .where(
        and(
          eq(topicProgress.userId, session.user.id),
          eq(topicProgress.topicId, topic.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      // Create new progress
      const [created] = await db
        .insert(topicProgress)
        .values({
          userId: session.user.id,
          topicId: topic.id,
          needsHelp: validatedData.needsHelp ?? false,
        })
        .returning();

      return Response.json({ progress: created });
    } else {
      // Update existing progress
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (validatedData.needsHelp !== undefined) {
        updates.needsHelp = validatedData.needsHelp;
      }

      const [updated] = await db
        .update(topicProgress)
        .set(updates)
        .where(eq(topicProgress.id, existing[0].id))
        .returning();

      return Response.json({ progress: updated });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }
    console.error("POST /api/topics/[slug]/progress error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update progress" } },
      { status: 500 }
    );
  }
}
