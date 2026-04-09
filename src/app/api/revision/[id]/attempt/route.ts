import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revisionQueue, patternProgress, questions } from "../../../../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

const attemptSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.string().nullable(),
  timeSpent: z.number().int().min(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const { id } = params;

  let body;
  try {
    body = attemptSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const { questionId, selectedOption, timeSpent } = body;

  // Fetch revision queue entry and verify ownership
  const [queueEntry] = await db
    .select()
    .from(revisionQueue)
    .where(eq(revisionQueue.id, id));

  if (!queueEntry) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Revision queue entry not found" } },
      { status: 404 }
    );
  }

  if (queueEntry.userId !== userId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Not authorized to access this revision item" } },
      { status: 403 }
    );
  }

  // Fetch the question being answered
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

  // Verify question belongs to the same pattern
  if (question.patternTypeId !== queueEntry.patternTypeId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Question does not match revision pattern" } },
      { status: 400 }
    );
  }

  const isCorrect = selectedOption !== null && selectedOption.toLowerCase() === question.correctOption;

  let resolved = false;
  const now = new Date();

  if (isCorrect) {
    // Correct answer: advance review schedule
    const newReviewCount = queueEntry.reviewCount + 1;

    if (newReviewCount >= 2) {
      // Mark as resolved after 2 successful reviews
      await db
        .update(revisionQueue)
        .set({
          status: "resolved",
          lastReviewedAt: now,
          reviewCount: newReviewCount,
        })
        .where(eq(revisionQueue.id, id));
      resolved = true;
    } else {
      // Schedule next review
      const daysToAdd = newReviewCount === 1 ? 3 : 7;
      const nextReviewAt = new Date(now);
      nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);

      await db
        .update(revisionQueue)
        .set({
          reviewCount: newReviewCount,
          nextReviewAt,
          lastReviewedAt: now,
        })
        .where(eq(revisionQueue.id, id));
    }
  } else {
    // Wrong answer: reset schedule and increment wrong count
    const newWrongCount = queueEntry.wrongCount + 1;
    const nextReviewAt = new Date(now);
    nextReviewAt.setDate(nextReviewAt.getDate() + 1);

    const newStatus = newWrongCount >= 5 ? "persistent" : queueEntry.status;

    await db
      .update(revisionQueue)
      .set({
        reviewCount: 0,
        wrongCount: newWrongCount,
        nextReviewAt,
        lastReviewedAt: now,
        status: newStatus,
      })
      .where(eq(revisionQueue.id, id));
  }

  // Upsert pattern progress
  await db
    .insert(patternProgress)
    .values({
      userId,
      patternTypeId: queueEntry.patternTypeId,
      attemptsCount: 1,
      correctCount: isCorrect ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: [patternProgress.userId, patternProgress.patternTypeId],
      set: {
        attemptsCount: sql`pattern_progress.attempts_count + 1`,
        correctCount: sql`pattern_progress.correct_count + ${isCorrect ? 1 : 0}`,
        updatedAt: now,
      },
    });

  return NextResponse.json({
    isCorrect,
    correctOption: question.correctOption,
    smartSolution: question.smartSolution,
    detailedSolution: question.detailedSolution,
    optionAExplanation: question.optionAExplanation,
    optionBExplanation: question.optionBExplanation,
    optionCExplanation: question.optionCExplanation,
    optionDExplanation: question.optionDExplanation,
    resolved,
  });
}
