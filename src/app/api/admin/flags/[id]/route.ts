import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topicProgress } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";

const patchSchema = z.object({
  adminNotes: z.string().max(1000).nullable(),
  needsHelp: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin only" } }, { status: 403 });
  }

  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request body" } }, { status: 400 });
  }

  const { id } = params;

  const [existing] = await db
    .select()
    .from(topicProgress)
    .where(eq(topicProgress.id, id));

  if (!existing) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Flag not found" } }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
  if (body.needsHelp !== undefined) updateData.needsHelp = body.needsHelp;

  await db.update(topicProgress).set(updateData).where(eq(topicProgress.id, id));

  return NextResponse.json({ success: true });
}
