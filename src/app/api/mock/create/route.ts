import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mockTests, mockTestResponses, questions, topicProgress, topics } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const createSchema = z.object({
  type: z.enum(['topic', 'section', 'full']),
  topicId: z.string().uuid().optional(),
  section: z.enum(['rc', 'lr', 'math']).optional(),
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  // 2. Parse + validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: result.error.message } },
      { status: 400 }
    );
  }

  const { type, topicId, section } = result.data;

  // 3. Select questions based on type
  let selectedQuestions: typeof questions.$inferSelect[] = [];
  let durationSeconds: number;

  try {
    if (type === 'topic') {
      if (!topicId) {
        return NextResponse.json(
          { error: { code: "MISSING_TOPIC_ID", message: "topicId is required for topic mocks" } },
          { status: 400 }
        );
      }

      // Get user's current level for this topic
      const progress = await db.query.topicProgress.findFirst({
        where: and(
          eq(topicProgress.userId, session.user.id),
          eq(topicProgress.topicId, topicId)
        ),
      });

      const currentLevel = progress?.currentLevel ?? 'l1';

      // Fetch questions at current level
      const questionsAtLevel = await db.query.questions.findMany({
        where: and(
          eq(questions.topicId, topicId),
          eq(questions.difficulty, currentLevel),
          eq(questions.isArchived, false)
        ),
      });

      let allQuestions = [...questionsAtLevel];

      // If < 10 at current level, fill from other levels
      if (allQuestions.length < 10) {
        const otherQuestions = await db.query.questions.findMany({
          where: and(
            eq(questions.topicId, topicId),
            eq(questions.isArchived, false)
          ),
        });
        allQuestions = otherQuestions;
      }

      selectedQuestions = shuffle(allQuestions).slice(0, 10);
      durationSeconds = 15 * 60;
    } else if (type === 'section') {
      if (!section) {
        return NextResponse.json(
          { error: { code: "MISSING_SECTION", message: "section is required for section mocks" } },
          { status: 400 }
        );
      }

      // Fetch all questions and filter by section
      const allQs = await db.query.questions.findMany({
        where: eq(questions.isArchived, false),
      });

      const topicsInSection = await db.query.topics.findMany({
        where: eq(topics.section, section),
      });

      const topicIdsInSection = topicsInSection.map(t => t.id);

      const questionsInSection = allQs.filter(q =>
        topicIdsInSection.includes(q.topicId)
      );

      selectedQuestions = shuffle(questionsInSection).slice(0, 30);
      durationSeconds = 40 * 60;
    } else {
      // type === 'full'
      const allQuestions = await db.query.questions.findMany({
        where: eq(questions.isArchived, false),
      });

      // Filter by published topics
      const publishedTopics = await db.query.topics.findMany();
      const publishedTopicIds = publishedTopics
        .filter(t => t.status === 'published')
        .map(t => t.id);

      const questionsFromPublished = allQuestions.filter(q =>
        publishedTopicIds.includes(q.topicId)
      );

      selectedQuestions = shuffle(questionsFromPublished).slice(0, 80);
      durationSeconds = 120 * 60;
    }

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_QUESTIONS", message: "No questions available for this mock test" } },
        { status: 400 }
      );
    }

    // 4. Insert into mockTests
    const [mock] = await db
      .insert(mockTests)
      .values({
        userId: session.user.id,
        type,
        topicId: topicId ?? null,
        section: section ?? null,
        totalQuestions: selectedQuestions.length,
        durationSeconds,
      })
      .returning();

    // 5. Insert all mockTestResponses
    await db.insert(mockTestResponses).values(
      selectedQuestions.map((q, index) => ({
        mockTestId: mock.id,
        questionId: q.id,
        displayOrder: index,
        selectedOption: null,
        abcTag: null,
        isCorrect: null,
        timeSpentSeconds: 0,
        reviewedInSecondPass: false,
      }))
    );

    // 6. Return response
    return NextResponse.json({
      mockId: mock.id,
      questionCount: selectedQuestions.length,
      durationSeconds,
    });
  } catch (error) {
    console.error("Error creating mock test:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create mock test" } },
      { status: 500 }
    );
  }
}
