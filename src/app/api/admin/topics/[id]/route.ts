import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const topicUpdateSchema = z.object({
  section: z.enum(["rc", "lr", "math"]).optional(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
  cheatsheet: z.string().optional(),
  dependencyIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    if (session.user.role !== "admin") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, id),
    });

    if (!topic) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Topic not found" } },
        { status: 404 }
      );
    }

    return Response.json({ topic });
  } catch (error) {
    console.error("GET /api/admin/topics/[id] error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch topic" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    if (session.user.role !== "admin") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = topicUpdateSchema.parse(body);

    const [updatedTopic] = await db
      .update(topics)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning();

    if (!updatedTopic) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Topic not found" } },
        { status: 404 }
      );
    }

    return Response.json({ topic: updatedTopic });
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
    console.error("PUT /api/admin/topics/[id] error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update topic" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    if (session.user.role !== "admin") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    await db.delete(topics).where(eq(topics.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/topics/[id] error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete topic" } },
      { status: 500 }
    );
  }
}
