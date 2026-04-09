import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revisionQueue, questions, patternTypes, topics, attempts } from "../../../../drizzle/schema";
import { eq, and, lte, inArray, notInArray, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Fetch all due revision items where status is active or persistent and nextReviewAt <= now
  const dueItems = await db
    .select({
      id: revisionQueue.id,
      patternTypeId: revisionQueue.patternTypeId,
      originalQuestionId: revisionQueue.originalQuestionId,
      status: revisionQueue.status,
      reviewCount: revisionQueue.reviewCount,
      wrongCount: revisionQueue.wrongCount,
      nextReviewAt: revisionQueue.nextReviewAt,
      patternTypeName: patternTypes.name,
      topicId: topics.id,
      topicName: topics.name,
      topicSection: topics.section,
    })
    .from(revisionQueue)
    .innerJoin(patternTypes, eq(revisionQueue.patternTypeId, patternTypes.id))
    .innerJoin(topics, eq(patternTypes.topicId, topics.id))
    .where(
      and(
        eq(revisionQueue.userId, userId),
        inArray(revisionQueue.status, ["active", "persistent"]),
        lte(revisionQueue.nextReviewAt, sql`now()`)
      )
    );

  // For each item, find a question to serve
  const items = await Promise.all(
    dueItems.map(async (item) => {
      // Get all attempted question IDs by this user for this pattern
      const attemptedQuestions = await db
        .select({ questionId: attempts.questionId })
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, userId),
            eq(attempts.patternTypeId, item.patternTypeId)
          )
        )
        .then((rows) => rows.map((r) => r.questionId));

      // Try to find an unattempted question (excluding original)
      let questionToServe = null;

      // First: try unattempted questions
      if (attemptedQuestions.length > 0) {
        const unattempted = await db
          .select({
            id: questions.id,
            questionText: questions.questionText,
            imageUrl: questions.imageUrl,
            optionA: questions.optionA,
            optionB: questions.optionB,
            optionC: questions.optionC,
            optionD: questions.optionD,
          })
          .from(questions)
          .where(
            and(
              eq(questions.patternTypeId, item.patternTypeId),
              eq(questions.isArchived, false),
              notInArray(questions.id, [...attemptedQuestions, item.originalQuestionId])
            )
          )
          .limit(1);

        if (unattempted.length > 0) {
          questionToServe = unattempted[0];
        }
      } else {
        // No attempts yet, just exclude original
        const unattempted = await db
          .select({
            id: questions.id,
            questionText: questions.questionText,
            imageUrl: questions.imageUrl,
            optionA: questions.optionA,
            optionB: questions.optionB,
            optionC: questions.optionC,
            optionD: questions.optionD,
          })
          .from(questions)
          .where(
            and(
              eq(questions.patternTypeId, item.patternTypeId),
              eq(questions.isArchived, false),
              sql`${questions.id} != ${item.originalQuestionId}`
            )
          )
          .limit(1);

        if (unattempted.length > 0) {
          questionToServe = unattempted[0];
        }
      }

      // Fallback: any question of this pattern (excluding original)
      if (!questionToServe) {
        const fallback = await db
          .select({
            id: questions.id,
            questionText: questions.questionText,
            imageUrl: questions.imageUrl,
            optionA: questions.optionA,
            optionB: questions.optionB,
            optionC: questions.optionC,
            optionD: questions.optionD,
          })
          .from(questions)
          .where(
            and(
              eq(questions.patternTypeId, item.patternTypeId),
              eq(questions.isArchived, false),
              sql`${questions.id} != ${item.originalQuestionId}`
            )
          )
          .limit(1);

        if (fallback.length > 0) {
          questionToServe = fallback[0];
        }
      }

      // Final fallback: serve the original question
      if (!questionToServe) {
        const original = await db
          .select({
            id: questions.id,
            questionText: questions.questionText,
            imageUrl: questions.imageUrl,
            optionA: questions.optionA,
            optionB: questions.optionB,
            optionC: questions.optionC,
            optionD: questions.optionD,
          })
          .from(questions)
          .where(eq(questions.id, item.originalQuestionId))
          .limit(1);

        if (original.length > 0) {
          questionToServe = original[0];
        }
      }

      return {
        id: item.id,
        patternTypeId: item.patternTypeId,
        patternTypeName: item.patternTypeName,
        topicId: item.topicId,
        topicName: item.topicName,
        topicSection: item.topicSection,
        status: item.status,
        reviewCount: item.reviewCount,
        wrongCount: item.wrongCount,
        nextReviewAt: item.nextReviewAt.toISOString(),
        question: questionToServe || {
          id: "",
          questionText: "No question available",
          imageUrl: null,
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
        },
      };
    })
  );

  return NextResponse.json({ items });
}
