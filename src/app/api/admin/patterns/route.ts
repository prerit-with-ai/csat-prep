import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { patternTypes } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const patternTypeSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    let patterns;
    if (topicId) {
      patterns = await db.query.patternTypes.findMany({
        where: eq(patternTypes.topicId, topicId),
        orderBy: (patternTypes, { asc }) => [asc(patternTypes.displayOrder)],
      });
    } else {
      patterns = await db.query.patternTypes.findMany({
        orderBy: (patternTypes, { asc }) => [asc(patternTypes.displayOrder)],
      });
    }

    return Response.json({ patterns });
  } catch (error) {
    console.error("GET /api/admin/patterns error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch patterns" },
      },
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
    const validatedData = patternTypeSchema.parse(body);

    const [newPattern] = await db
      .insert(patternTypes)
      .values(validatedData)
      .returning();

    return Response.json({ patternType: newPattern }, { status: 201 });
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
    console.error("POST /api/admin/patterns error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to create pattern type" },
      },
      { status: 500 }
    );
  }
}
