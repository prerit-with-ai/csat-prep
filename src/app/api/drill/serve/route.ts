import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, patternTypes, attempts } from "../../../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const serveSchema = z.object({
  patternTypeId: z.string().uuid(),
  excludeIds: z.array(z.string().uuid()).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  let body;
  try {
    body = serveSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const { patternTypeId, excludeIds } = body;

  // Verify pattern type exists
  const [pattern] = await db
    .select()
    .from(patternTypes)
    .where(eq(patternTypes.id, patternTypeId));

  if (!pattern) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Pattern type not found" } },
      { status: 404 }
    );
  }

  // Fetch all non-archived questions for this pattern
  const allQuestions = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.patternTypeId, patternTypeId),
        eq(questions.isArchived, false)
      )
    );

  if (allQuestions.length === 0) {
    return NextResponse.json({ question: null, patternName: pattern.name });
  }

  // Exclude recently seen questions
  const recentAttempts = await db
    .select({ questionId: attempts.questionId })
    .from(attempts)
    .where(eq(attempts.userId, session.user.id))
    .orderBy(desc(attempts.createdAt))
    .limit(20);

  const recentIds = new Set([
    ...recentAttempts.map((a) => a.questionId),
    ...excludeIds,
  ]);

  let pool = allQuestions.filter((q) => !recentIds.has(q.id));
  if (pool.length === 0) {
    // Fall back to all questions, excluding only the current session
    pool = allQuestions.filter((q) => !excludeIds.includes(q.id));
  }
  if (pool.length === 0) {
    pool = allQuestions; // total reset
  }

  // Pick a random question
  const q = pool[Math.floor(Math.random() * pool.length)];

  return NextResponse.json({
    patternName: pattern.name,
    question: {
      id: q.id,
      topicId: q.topicId,
      patternTypeId: q.patternTypeId,
      difficulty: q.difficulty,
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    },
  });
}
