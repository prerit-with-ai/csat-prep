import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const resourceUpdateSchema = z.object({
  topicId: z.string().uuid().optional(),
  type: z.enum(["video", "pdf", "article"]).optional(),
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  language: z.enum(["en", "hi"]).optional(),
  displayOrder: z.number().int().optional(),
});

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
    const validatedData = resourceUpdateSchema.parse(body);

    const [updatedResource] = await db
      .update(resources)
      .set(validatedData)
      .where(eq(resources.id, id))
      .returning();

    if (!updatedResource) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    return Response.json({ resource: updatedResource });
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
    console.error("PUT /api/admin/resources/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to update resource" },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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
    await db.delete(resources).where(eq(resources.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/resources/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to delete resource" },
      },
      { status: 500 }
    );
  }
}
