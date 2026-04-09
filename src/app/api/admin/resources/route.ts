import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "../../../../../drizzle/schema";
import { headers } from "next/headers";
import { z } from "zod";

const resourceSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID"),
  type: z.enum(["video", "pdf", "article"]).default("video"),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL"),
  language: z.enum(["en", "hi"]).default("en"),
  displayOrder: z.number().int().default(0),
});

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
    const validatedData = resourceSchema.parse(body);

    const [newResource] = await db
      .insert(resources)
      .values(validatedData)
      .returning();

    return Response.json({ resource: newResource }, { status: 201 });
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
    console.error("POST /api/admin/resources error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to create resource" },
      },
      { status: 500 }
    );
  }
}
