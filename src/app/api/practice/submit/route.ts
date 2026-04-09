import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, topicProgress, attempts } from "../../../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

const submitSchema = z.object({
  questionId: z.string().uuid(),
  topicId: z.string().uuid(),
  selectedOption: z.string().nullable(),
  timeSpent: z.number().int().min(0),
});

type Difficulty = "l1" | "l2" | "l3";
type TopicStatus = "red" | "amber" | "green";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  let body;
  try {
    body = submitSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const { questionId, topicId, selectedOption, timeSpent } = body;

  // Query 1: Get question (needed for correctOption, difficulty, solution)
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId));

  if (!question) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Question not found" } },
      { status: 404 }
    );
  }

  const isCorrect = selectedOption !== null && selectedOption.toLowerCase() === question.correctOption;
  const diff = question.difficulty as Difficulty;
  const inc = (condition: boolean) => (condition ? 1 : 0);

  // Query 2: Record attempt
  await db.insert(attempts).values({
    userId,
    questionId,
    topicId,
    patternTypeId: question.patternTypeId,
    selectedOption,
    isCorrect,
    timeSpent,
    difficulty: diff,
  });

  // Query 3: Upsert topicProgress — insert or increment counters atomically
  const [updatedProgress] = await db
    .insert(topicProgress)
    .values({
      userId,
      topicId,
      currentLevel: "l1",
      l1Attempts: inc(diff === "l1"),
      l1Correct: inc(diff === "l1" && isCorrect),
      l2Attempts: inc(diff === "l2"),
      l2Correct: inc(diff === "l2" && isCorrect),
      l3Attempts: inc(diff === "l3"),
      l3Correct: inc(diff === "l3" && isCorrect),
      status: "red",
      needsHelp: false,
    })
    .onConflictDoUpdate({
      target: [topicProgress.userId, topicProgress.topicId],
      set: {
        l1Attempts: sql`topic_progress.l1_attempts + ${inc(diff === "l1")}`,
        l1Correct: sql`topic_progress.l1_correct + ${inc(diff === "l1" && isCorrect)}`,
        l2Attempts: sql`topic_progress.l2_attempts + ${inc(diff === "l2")}`,
        l2Correct: sql`topic_progress.l2_correct + ${inc(diff === "l2" && isCorrect)}`,
        l3Attempts: sql`topic_progress.l3_attempts + ${inc(diff === "l3")}`,
        l3Correct: sql`topic_progress.l3_correct + ${inc(diff === "l3" && isCorrect)}`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  // Level advancement check using cumulative counts (no extra query)
  let levelAdvanced = false;
  let newLevel: Difficulty = updatedProgress.currentLevel as Difficulty;
  let newStatus: TopicStatus = updatedProgress.status as TopicStatus;

  const check = (attempts: number, correct: number) =>
    attempts >= 10 && correct / attempts >= 0.7;

  if (updatedProgress.currentLevel === "l1" && check(updatedProgress.l1Attempts, updatedProgress.l1Correct)) {
    newLevel = "l2";
    newStatus = "amber";
    levelAdvanced = true;
  } else if (updatedProgress.currentLevel === "l2" && check(updatedProgress.l2Attempts, updatedProgress.l2Correct)) {
    newLevel = "l3";
    newStatus = "amber";
    levelAdvanced = true;
  } else if (updatedProgress.currentLevel === "l3" && check(updatedProgress.l3Attempts, updatedProgress.l3Correct)) {
    newStatus = "green";
    levelAdvanced = true;
  }

  // Query 4 (only if level advanced): update level/status
  if (levelAdvanced) {
    await db
      .update(topicProgress)
      .set({ currentLevel: newLevel, status: newStatus, updatedAt: new Date() })
      .where(and(eq(topicProgress.userId, userId), eq(topicProgress.topicId, topicId)));
  }

  return NextResponse.json({
    isCorrect,
    correctOption: question.correctOption,
    smartSolution: question.smartSolution,
    detailedSolution: question.detailedSolution,
    optionAExplanation: question.optionAExplanation,
    optionBExplanation: question.optionBExplanation,
    optionCExplanation: question.optionCExplanation,
    optionDExplanation: question.optionDExplanation,
    levelAdvanced,
    newLevel,
    topicStatus: newStatus,
  });
}
