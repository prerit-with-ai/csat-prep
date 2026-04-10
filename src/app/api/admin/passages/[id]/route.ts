import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { passages } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  passageText: z.string().min(1).optional(),
  difficulty: z.enum(["l1", "l2", "l3"]).optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "UNAUTHORIZED", status: 401 };
  if (session.user.role !== "admin") return { error: "FORBIDDEN", status: 403 };
  return { session };
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth_result = await requireAdmin();
  if ("error" in auth_result) {
    return Response.json({ error: { code: auth_result.error } }, { status: auth_result.status });
  }

  let body;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return Response.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const [updated] = await db
    .update(passages)
    .set(body)
    .where(eq(passages.id, params.id))
    .returning();

  if (!updated) {
    return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  return Response.json({ passage: updated });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth_result = await requireAdmin();
  if ("error" in auth_result) {
    return Response.json({ error: { code: auth_result.error } }, { status: auth_result.status });
  }

  await db.update(passages).set({ isArchived: true }).where(eq(passages.id, params.id));
  return Response.json({ success: true });
}
