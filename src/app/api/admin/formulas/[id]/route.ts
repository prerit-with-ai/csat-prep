import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formulaCards } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
    }

    const body = await request.json();
    const updates = updateSchema.parse(body);

    const [updated] = await db
      .update(formulaCards)
      .set(updates)
      .where(eq(formulaCards.id, params.id))
      .returning();

    if (!updated) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Formula card not found" } }, { status: 404 });
    }

    return Response.json({ formulaCard: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: error.issues[0].message } }, { status: 400 });
    }
    console.error("PUT /api/admin/formulas/[id] error:", error);
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update formula card" } }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
    }

    await db.delete(formulaCards).where(eq(formulaCards.id, params.id));
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/formulas/[id] error:", error);
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete formula card" } }, { status: 500 });
  }
}
