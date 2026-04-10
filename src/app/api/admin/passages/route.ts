import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { passages } from "../../../../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const passageSchema = z.object({
  topicId: z.string().uuid(),
  title: z.string().min(1),
  passageText: z.string().min(1),
  difficulty: z.enum(["l1", "l2", "l3"]).default("l2"),
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "UNAUTHORIZED", status: 401 };
  if (session.user.role !== "admin") return { error: "FORBIDDEN", status: 403 };
  return { session };
}

export async function GET(request: Request) {
  const auth_result = await requireAdmin();
  if ("error" in auth_result) {
    return Response.json({ error: { code: auth_result.error } }, { status: auth_result.status });
  }

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId");

  const query = db.select().from(passages).where(
    and(
      topicId ? eq(passages.topicId, topicId) : undefined,
      eq(passages.isArchived, false)
    )
  ).orderBy(asc(passages.createdAt));

  const result = await query;
  return Response.json({ passages: result });
}

export async function POST(request: Request) {
  const auth_result = await requireAdmin();
  if ("error" in auth_result) {
    return Response.json({ error: { code: auth_result.error } }, { status: auth_result.status });
  }

  let body;
  try {
    body = passageSchema.parse(await request.json());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return Response.json({ error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
  }

  const [passage] = await db.insert(passages).values(body).returning();
  return Response.json({ passage }, { status: 201 });
}
