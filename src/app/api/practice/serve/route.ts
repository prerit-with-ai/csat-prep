import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, topics, topicProgress, attempts } from "../../../../../drizzle/schema";
import { eq, and, desc, notInArray } from "drizzle-orm";

const serveSchema = z.object({
  topicId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 2. Validate body
  let body;
  try {
    body = serveSchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const { topicId } = body;

  // 3. Verify topic exists and is published
  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.status, "published")));

  if (!topic) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Topic not found or not published" } },
      { status: 404 }
    );
  }

  // 4. Get topicProgress for user+topic
  const [progress] = await db
    .select()
    .from(topicProgress)
    .where(and(eq(topicProgress.userId, userId), eq(topicProgress.topicId, topicId)));

  const currentLevel = progress?.currentLevel || "l1";

  // 5. Fetch all non-archived questions at currentLevel for this topic
  const allQuestions = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.topicId, topicId),
        eq(questions.difficulty, currentLevel),
        eq(questions.isArchived, false)
      )
    )
    .orderBy(questions.createdAt);

  if (allQuestions.length === 0) {
    return NextResponse.json({
      questions: [],
      level: currentLevel,
      totalAvailable: 0,
    });
  }

  // 6. Fetch last 30 attempts by user for this topic
  const recentAttempts = await db
    .select({ questionId: attempts.questionId })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.topicId, topicId)))
    .orderBy(desc(attempts.createdAt))
    .limit(30);

  const recentQuestionIds = recentAttempts.map((a) => a.questionId);

  // 7. Filter out recently attempted questions (only if remaining > 10)
  let availableQuestions = allQuestions;
  if (recentQuestionIds.length > 0) {
    const filtered = allQuestions.filter((q) => !recentQuestionIds.includes(q.id));
    if (filtered.length > 10) {
      availableQuestions = filtered;
    }
  }

  // 8. Shuffle (Fisher-Yates)
  const shuffled = [...availableQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 9. Take first 10
  const servedQuestions = shuffled.slice(0, 10);

  // 10. Return safe fields only (strip solution and correct answer)
  const safeQuestions = servedQuestions.map((q) => ({
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
  }));

  return NextResponse.json({
    questions: safeQuestions,
    level: currentLevel,
    totalAvailable: availableQuestions.length,
  });
}
