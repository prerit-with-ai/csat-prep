import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mockTests, mockTestResponses, questions } from "../../../../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const mockId = params.id;

  try {
    // 2. Get mock by id, verify userId, verify status = 'in_progress'
    const mock = await db.query.mockTests.findFirst({
      where: eq(mockTests.id, mockId),
    });

    if (!mock) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Mock test not found" } },
        { status: 404 }
      );
    }

    if (mock.userId !== session.user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to access this mock test" } },
        { status: 403 }
      );
    }

    if (mock.status !== 'in_progress') {
      return NextResponse.json(
        { error: { code: "MOCK_COMPLETED", message: "Mock test is already completed" } },
        { status: 400 }
      );
    }

    // 3. Get all mockTestResponses joined with questions
    const responses = await db.query.mockTestResponses.findMany({
      where: eq(mockTestResponses.mockTestId, mockId),
    });

    const questionIds = responses.map(r => r.questionId);
    const allQuestions = await db.query.questions.findMany({
      where: (questions, { inArray }) => inArray(questions.id, questionIds),
    });

    const questionMap = new Map(allQuestions.map(q => [q.id, q]));

    // 4. For each response, compute isCorrect and update
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    for (const response of responses) {
      const question = questionMap.get(response.questionId);
      if (!question) continue;

      const isCorrect = response.selectedOption !== null &&
        response.selectedOption.toLowerCase() === question.correctOption.toLowerCase();

      await db
        .update(mockTestResponses)
        .set({ isCorrect })
        .where(eq(mockTestResponses.id, response.id));

      if (isCorrect) {
        correctCount++;
      } else if (response.selectedOption !== null) {
        wrongCount++;
      } else {
        skippedCount++;
      }
    }

    // 5. Compute net score
    const rawScore = correctCount * 2.5;
    const negativeMarks = wrongCount * 0.83;
    const netScore = (rawScore - negativeMarks).toFixed(2);

    // 6. Update mockTest
    await db
      .update(mockTests)
      .set({
        status: 'completed',
        submittedAt: sql`now()`,
        netScore,
      })
      .where(eq(mockTests.id, mockId));

    // 7. Return result
    return NextResponse.json({
      netScore: parseFloat(netScore),
      correctCount,
      wrongCount,
      skippedCount,
      mockId,
    });
  } catch (error) {
    console.error("Error submitting mock test:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to submit mock test" } },
      { status: 500 }
    );
  }
}
