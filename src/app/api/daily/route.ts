import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and, gte, inArray } from "drizzle-orm";
import {
  dailyDoses,
  dailyDoseAnswers,
  topics,
  topicProgress,
  questions,
  attempts,
} from "../../../../drizzle/schema";

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function GET(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Get today's date
  const today = new Date().toISOString().split("T")[0];

  try {
    // 3. Check for existing dose
    const existingDose = await db
      .select()
      .from(dailyDoses)
      .where(and(eq(dailyDoses.userId, userId), eq(dailyDoses.date, today)))
      .limit(1);

    if (existingDose.length > 0) {
      const dose = existingDose[0];

      // Fetch questions
      const doseQuestions = await db
        .select({
          id: questions.id,
          topicId: questions.topicId,
          patternTypeId: questions.patternTypeId,
          passageId: questions.passageId,
          difficulty: questions.difficulty,
          questionText: questions.questionText,
          imageUrl: questions.imageUrl,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
        })
        .from(questions)
        .where(inArray(questions.id, dose.questionIds));

      // Fetch answered question IDs
      const answeredRecords = await db
        .select({ questionId: dailyDoseAnswers.questionId })
        .from(dailyDoseAnswers)
        .where(eq(dailyDoseAnswers.dailyDoseId, dose.id));

      const answeredQuestionIds = answeredRecords.map((r) => r.questionId);

      // Calculate streak
      const allDoses = await db
        .select({ date: dailyDoses.date })
        .from(dailyDoses)
        .where(and(eq(dailyDoses.userId, userId), eq(dailyDoses.completed, true)))
        .orderBy(dailyDoses.date);

      let streak = 0;
      const sortedDates = allDoses.map((d) => d.date).sort().reverse();

      if (sortedDates.length > 0) {
        // Check if today is completed
        if (sortedDates[0] === today) {
          streak = 1;
          let currentDate = new Date(today);
          for (let i = 1; i < sortedDates.length; i++) {
            currentDate.setDate(currentDate.getDate() - 1);
            const expectedDate = currentDate.toISOString().split("T")[0];
            if (sortedDates[i] === expectedDate) {
              streak++;
            } else {
              break;
            }
          }
        } else {
          // Check from yesterday backwards
          let currentDate = new Date(today);
          currentDate.setDate(currentDate.getDate() - 1);
          const yesterday = currentDate.toISOString().split("T")[0];

          if (sortedDates[0] === yesterday) {
            streak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
              currentDate.setDate(currentDate.getDate() - 1);
              const expectedDate = currentDate.toISOString().split("T")[0];
              if (sortedDates[i] === expectedDate) {
                streak++;
              } else {
                break;
              }
            }
          }
        }
      }

      return NextResponse.json({
        dose: {
          id: dose.id,
          date: dose.date,
          completed: dose.completed,
          score: dose.score,
          totalTimeSecs: dose.totalTimeSecs,
          completedAt: dose.completedAt,
          questionCount: dose.questionIds.length,
        },
        questions: doseQuestions,
        answeredQuestionIds,
        streak,
      });
    }

    // 4. Generate new dose

    // Get all published topics
    const publishedTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.status, "published"));

    // Get user's topic progress
    const userProgress = await db
      .select()
      .from(topicProgress)
      .where(eq(topicProgress.userId, userId));

    const progressMap = new Map(userProgress.map((p) => [p.topicId, p]));

    // Get recent attempt question IDs (last 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentAttempts = await db
      .select({ questionId: attempts.questionId })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, threeDaysAgo)));

    const recentQuestionIds = new Set(recentAttempts.map((a) => a.questionId));

    // Classify topics
    const weakTopicIds: string[] = [];
    const activeTopicIds: string[] = [];
    const strongTopicIds: string[] = [];

    for (const topic of publishedTopics) {
      const progress = progressMap.get(topic.id);
      if (!progress || progress.status === "red") {
        weakTopicIds.push(topic.id);
      } else if (progress.status === "amber") {
        activeTopicIds.push(topic.id);
      } else if (progress.status === "green") {
        strongTopicIds.push(topic.id);
      }
    }

    // Helper function to fetch and filter questions
    async function fetchQuestionsForTopics(
      topicIds: string[],
      targetCount: number
    ): Promise<typeof questions.$inferSelect[]> {
      if (topicIds.length === 0) return [];

      const allQuestions = await db
        .select()
        .from(questions)
        .where(
          and(
            inArray(questions.topicId, topicIds),
            eq(questions.isArchived, false)
          )
        );

      // Filter out recent questions if enough remain
      const filtered = allQuestions.filter((q) => !recentQuestionIds.has(q.id));
      const pool = filtered.length >= targetCount ? filtered : allQuestions;

      return shuffle(pool).slice(0, targetCount);
    }

    // Fetch questions for each bucket
    const weakQuestions = await fetchQuestionsForTopics(weakTopicIds, 9);
    const activeQuestions = await fetchQuestionsForTopics(activeTopicIds, 6);
    const strongQuestions = await fetchQuestionsForTopics(strongTopicIds, 3);

    // Combine and shuffle
    let collectedQuestions = [
      ...weakQuestions,
      ...activeQuestions,
      ...strongQuestions,
    ];

    // Fill gaps if needed
    if (collectedQuestions.length < 18) {
      const usedIds = new Set(collectedQuestions.map((q) => q.id));
      const allTopicIds = publishedTopics.map((t) => t.id);
      const fillQuestions = await db
        .select()
        .from(questions)
        .where(
          and(
            inArray(questions.topicId, allTopicIds),
            eq(questions.isArchived, false)
          )
        );

      const available = fillQuestions.filter((q) => !usedIds.has(q.id));
      const needed = 18 - collectedQuestions.length;
      collectedQuestions = [
        ...collectedQuestions,
        ...shuffle(available).slice(0, needed),
      ];
    }

    const finalQuestions = shuffle(collectedQuestions).slice(0, 18);
    const questionIds = finalQuestions.map((q) => q.id);

    // Insert new dose
    const newDose = await db
      .insert(dailyDoses)
      .values({
        userId,
        date: today,
        questionIds,
      })
      .returning();

    const dose = newDose[0];

    // Calculate streak (same logic as above)
    const allDoses = await db
      .select({ date: dailyDoses.date })
      .from(dailyDoses)
      .where(and(eq(dailyDoses.userId, userId), eq(dailyDoses.completed, true)))
      .orderBy(dailyDoses.date);

    let streak = 0;
    const sortedDates = allDoses.map((d) => d.date).sort().reverse();

    if (sortedDates.length > 0) {
      let currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - 1);
      const yesterday = currentDate.toISOString().split("T")[0];

      if (sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          currentDate.setDate(currentDate.getDate() - 1);
          const expectedDate = currentDate.toISOString().split("T")[0];
          if (sortedDates[i] === expectedDate) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Prepare questions for response (exclude solution fields)
    const responseQuestions = finalQuestions.map((q) => ({
      id: q.id,
      topicId: q.topicId,
      patternTypeId: q.patternTypeId,
      passageId: q.passageId,
      difficulty: q.difficulty,
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    }));

    return NextResponse.json({
      dose: {
        id: dose.id,
        date: dose.date,
        completed: dose.completed,
        score: dose.score,
        totalTimeSecs: dose.totalTimeSecs,
        completedAt: dose.completedAt,
        questionCount: dose.questionIds.length,
      },
      questions: responseQuestions,
      answeredQuestionIds: [],
      streak,
    });
  } catch (error) {
    console.error("Error in GET /api/daily:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
