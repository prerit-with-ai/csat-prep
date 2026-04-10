import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { passages } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const [passage] = await db
    .select()
    .from(passages)
    .where(eq(passages.id, params.id));

  if (!passage || passage.isArchived) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({
    id: passage.id,
    title: passage.title,
    passageText: passage.passageText,
    difficulty: passage.difficulty,
  });
}
