import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics } from "../../../../../drizzle/schema";
import { asc } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const topicSchema = z.object({
  section: z.enum(["rc", "lr", "math"]),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  displayOrder: z.number().int().default(0),
  cheatsheet: z.string().optional(),
  dependencyIds: z.array(z.string().uuid()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

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

    if (session.user.role !== "admin") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const allTopics = await db.query.topics.findMany({
      orderBy: [asc(topics.displayOrder)],
    });

    return Response.json({ topics: allTopics });
  } catch (error) {
    console.error("GET /api/admin/topics error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch topics" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const validatedData = topicSchema.parse(body);

    const [newTopic] = await db
      .insert(topics)
      .values(validatedData)
      .returning();

    return Response.json({ topic: newTopic }, { status: 201 });
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
    console.error("POST /api/admin/topics error:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create topic" } },
      { status: 500 }
    );
  }
}
