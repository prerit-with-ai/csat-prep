import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mockTests, mockTestResponses } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const mockId = params.id;

  try {
    // 2. Get mock by id, verify userId matches session
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

    // 3. Get all mockTestResponses for this mock, ordered by displayOrder
    const responses = await db.query.mockTestResponses.findMany({
      where: eq(mockTestResponses.mockTestId, mockId),
      orderBy: (mockTestResponses, { asc }) => [asc(mockTestResponses.displayOrder)],
    });

    // 4. Get all question data (safe fields only - no correctOption, no solutions)
    const questionIds = responses.map(r => r.questionId);
    const allQuestions = await db.query.questions.findMany({
      where: (questions, { inArray }) => inArray(questions.id, questionIds),
    });

    // Create a map for quick lookup
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));

    // 5. Build response with questions in displayOrder
    const questionsInOrder = responses.map(r => {
      const q = questionMap.get(r.questionId);
      if (!q) return null;
      return {
        id: q.id,
        topicId: q.topicId,
        difficulty: q.difficulty,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      };
    }).filter(Boolean);

    return NextResponse.json({
      mock: {
        id: mock.id,
        type: mock.type,
        topicId: mock.topicId,
        section: mock.section,
        totalQuestions: mock.totalQuestions,
        durationSeconds: mock.durationSeconds,
        status: mock.status,
        startedAt: mock.startedAt,
      },
      questions: questionsInOrder,
      responses: responses.map(r => ({
        id: r.id,
        questionId: r.questionId,
        displayOrder: r.displayOrder,
        selectedOption: r.selectedOption,
        abcTag: r.abcTag,
        timeSpentSeconds: r.timeSpentSeconds,
        reviewedInSecondPass: r.reviewedInSecondPass,
      })),
    });
  } catch (error) {
    console.error("Error fetching mock test:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch mock test" } },
      { status: 500 }
    );
  }
}
