import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { patternTypes } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const patternTypeUpdateSchema = z.object({
  topicId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
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
    const validatedData = patternTypeUpdateSchema.parse(body);

    const [updatedPattern] = await db
      .update(patternTypes)
      .set(validatedData)
      .where(eq(patternTypes.id, id))
      .returning();

    if (!updatedPattern) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Pattern type not found" } },
        { status: 404 }
      );
    }

    return Response.json({ patternType: updatedPattern });
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
    console.error("PUT /api/admin/patterns/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to update pattern type" },
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
    await db.delete(patternTypes).where(eq(patternTypes.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/patterns/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to delete pattern type" },
      },
      { status: 500 }
    );
  }
}
