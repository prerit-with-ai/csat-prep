import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  return NextResponse.json({
    examDate: settings?.examDate ?? null,
  });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const body = await request.json();
  const examDate = body.examDate ? new Date(body.examDate) : null;

  if (examDate && isNaN(examDate.getTime())) {
    return NextResponse.json({ error: { code: "INVALID_DATE", message: "Invalid date" } }, { status: 400 });
  }

  await db
    .insert(userSettings)
    .values({
      userId: session.user.id,
      examDate,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { examDate, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, examDate });
}
