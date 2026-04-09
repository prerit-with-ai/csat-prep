import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mockTests, mockTestResponses } from "../../../../../drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all completed mocks for this user
  const completedMocks = await db
    .select({
      id: mockTests.id,
      startedAt: mockTests.startedAt,
      netScore: mockTests.netScore,
      totalQuestions: mockTests.totalQuestions,
      aCount: sql<number>`sum(case when ${mockTestResponses.abcTag} = 'A' then 1 else 0 end)::int`,
      bCount: sql<number>`sum(case when ${mockTestResponses.abcTag} = 'B' then 1 else 0 end)::int`,
      cCount: sql<number>`sum(case when ${mockTestResponses.abcTag} = 'C' then 1 else 0 end)::int`,
      aCorrect: sql<number>`sum(case when ${mockTestResponses.abcTag} = 'A' and ${mockTestResponses.isCorrect} = true then 1 else 0 end)::int`,
      bCorrect: sql<number>`sum(case when ${mockTestResponses.abcTag} = 'B' and ${mockTestResponses.isCorrect} = true then 1 else 0 end)::int`,
      cCorrect: sql<number>`sum(case when ${mockTestResponses.abcTag} = 'C' and ${mockTestResponses.isCorrect} = true then 1 else 0 end)::int`,
    })
    .from(mockTests)
    .innerJoin(mockTestResponses, eq(mockTestResponses.mockTestId, mockTests.id))
    .where(and(eq(mockTests.userId, userId), eq(mockTests.status, "completed")))
    .groupBy(mockTests.id, mockTests.startedAt, mockTests.netScore, mockTests.totalQuestions)
    .orderBy(asc(mockTests.startedAt));

  return NextResponse.json({ mocks: completedMocks });
}
