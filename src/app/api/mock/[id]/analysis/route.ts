import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mockTests, mockTestResponses, questions } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
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
    // 2. Get mock by id, verify userId
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

    // 3. Verify status = 'completed'
    if (mock.status !== 'completed') {
      return NextResponse.json(
        { error: { code: "MOCK_NOT_COMPLETED", message: "Mock test is not completed yet" } },
        { status: 400 }
      );
    }

    // 4. Fetch all responses WITH question data
    const responses = await db.query.mockTestResponses.findMany({
      where: eq(mockTestResponses.mockTestId, mockId),
      orderBy: (mockTestResponses, { asc }) => [asc(mockTestResponses.displayOrder)],
    });

    const questionIds = responses.map(r => r.questionId);
    const allQuestions = await db.query.questions.findMany({
      where: (questions, { inArray }) => inArray(questions.id, questionIds),
    });

    const questionMap = new Map(allQuestions.map(q => [q.id, q]));

    // 5. Build analysis
    const analyzed = responses.map(r => {
      const q = questionMap.get(r.questionId);
      if (!q) return null;

      return {
        displayOrder: r.displayOrder,
        questionId: r.questionId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        smartSolution: q.smartSolution,
        detailedSolution: q.detailedSolution,
        selectedOption: r.selectedOption,
        abcTag: r.abcTag,
        isCorrect: r.isCorrect,
        timeSpentSeconds: r.timeSpentSeconds,
        difficulty: q.difficulty,
      };
    }).filter(Boolean) as Array<{
      displayOrder: number;
      questionId: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      smartSolution: string;
      detailedSolution: string | null;
      selectedOption: string | null;
      abcTag: string | null;
      isCorrect: boolean | null;
      timeSpentSeconds: number;
      difficulty: string;
    }>;

    // Score
    const correctCount = analyzed.filter(r => r.isCorrect).length;
    const wrongCount = analyzed.filter(r => r.selectedOption && !r.isCorrect).length;
    const skippedCount = analyzed.filter(r => !r.selectedOption).length;
    const netScore = parseFloat(mock.netScore ?? '0');

    // ABC analysis
    const aResponses = analyzed.filter(r => r.abcTag === 'A');
    const bResponses = analyzed.filter(r => r.abcTag === 'B');
    const cResponses = analyzed.filter(r => r.abcTag === 'C');

    const abcAnalysis = {
      a: {
        count: aResponses.length,
        correct: aResponses.filter(r => r.isCorrect).length,
        wrong: aResponses.filter(r => r.selectedOption && !r.isCorrect).length,
        accuracy: aResponses.length > 0 ? Math.round(aResponses.filter(r => r.isCorrect).length / aResponses.length * 100) : 0,
      },
      b: {
        count: bResponses.length,
        attempted: bResponses.filter(r => r.selectedOption).length,
        correct: bResponses.filter(r => r.isCorrect).length,
      },
      c: {
        count: cResponses.length,
        easySkipped: cResponses.filter(r => r.difficulty === 'l1' || r.difficulty === 'l2').length,
      },
    };

    // Time analysis
    const wastedTime = analyzed
      .filter(r => r.timeSpentSeconds > 180 && !r.isCorrect && r.selectedOption)
      .map(r => ({
        displayOrder: r.displayOrder,
        questionText: r.questionText,
        timeSpentSeconds: r.timeSpentSeconds,
        abcTag: r.abcTag,
      }));

    const totalTimeSecs = analyzed.reduce((sum, r) => sum + r.timeSpentSeconds, 0);

    // 6. Return analysis
    return NextResponse.json({
      mock: {
        id: mock.id,
        type: mock.type,
        netScore: parseFloat(mock.netScore ?? '0'),
        durationSeconds: mock.durationSeconds,
        totalTimeSecs,
      },
      score: {
        net: netScore,
        correct: correctCount,
        wrong: wrongCount,
        skipped: skippedCount,
        total: analyzed.length,
      },
      abcAnalysis,
      wastedTime,
      totalTimeSecs,
      responses: analyzed,
    });
  } catch (error) {
    console.error("Error fetching mock test analysis:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch mock test analysis" } },
      { status: 500 }
    );
  }
}
