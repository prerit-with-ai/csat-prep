import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import {
  dailyDoses,
  dailyDoseAnswers,
  questions,
  attempts,
  topicProgress,
} from "../../../../../drizzle/schema";

const submitSchema = z.object({
  doseId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOption: z.string().nullable(),
  timeSpent: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 2. Parse and validate body
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { doseId, questionId, selectedOption, timeSpent } = parsed.data;

    // 3. Fetch the dose
    const dose = await db
      .select()
      .from(dailyDoses)
      .where(eq(dailyDoses.id, doseId))
      .limit(1);

    if (dose.length === 0) {
      return NextResponse.json({ error: "Dose not found" }, { status: 404 });
    }

    if (dose[0].userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: dose does not belong to user" },
        { status: 403 }
      );
    }

    // 4. Verify questionId is in dose.questionIds
    if (!dose[0].questionIds.includes(questionId)) {
      return NextResponse.json(
        { error: "Question not part of this dose" },
        { status: 400 }
      );
    }

    // 5. Check not already answered
    const existing = await db
      .select()
      .from(dailyDoseAnswers)
      .where(
        and(
          eq(dailyDoseAnswers.dailyDoseId, doseId),
          eq(dailyDoseAnswers.questionId, questionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Already answered, fetch question for solution
      const question = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      if (question.length === 0) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      const q = question[0];

      return NextResponse.json(
        {
          error: "Already answered",
          isCorrect: existing[0].isCorrect,
          correctOption: q.correctOption,
          smartSolution: q.smartSolution,
          detailedSolution: q.detailedSolution,
          optionAExplanation: q.optionAExplanation,
          optionBExplanation: q.optionBExplanation,
          optionCExplanation: q.optionCExplanation,
          optionDExplanation: q.optionDExplanation,
        },
        { status: 409 }
      );
    }

    // 6. Fetch question
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const q = question[0];

    // 7. Compute isCorrect
    const isCorrect =
      selectedOption?.toLowerCase() === q.correctOption.toLowerCase();

    // 8. Insert into dailyDoseAnswers
    await db.insert(dailyDoseAnswers).values({
      dailyDoseId: doseId,
      questionId,
      selectedOption,
      isCorrect,
      timeSpent,
    });

    // 9. Insert into attempts table
    await db.insert(attempts).values({
      userId,
      questionId,
      topicId: q.topicId,
      patternTypeId: q.patternTypeId,
      selectedOption,
      isCorrect,
      timeSpent,
      difficulty: q.difficulty,
    });

    // 10. Upsert topicProgress
    const difficulty = q.difficulty as "l1" | "l2" | "l3";
    const attemptsField = `${difficulty}Attempts` as const;
    const correctField = `${difficulty}Correct` as const;

    await db
      .insert(topicProgress)
      .values({
        userId,
        topicId: q.topicId,
        currentLevel: "l1",
        l1Attempts: difficulty === "l1" ? 1 : 0,
        l1Correct: difficulty === "l1" && isCorrect ? 1 : 0,
        l2Attempts: difficulty === "l2" ? 1 : 0,
        l2Correct: difficulty === "l2" && isCorrect ? 1 : 0,
        l3Attempts: difficulty === "l3" ? 1 : 0,
        l3Correct: difficulty === "l3" && isCorrect ? 1 : 0,
        status: "red",
      })
      .onConflictDoUpdate({
        target: [topicProgress.userId, topicProgress.topicId],
        set: {
          [attemptsField]: sql`${topicProgress[attemptsField]} + 1`,
          [correctField]: isCorrect
            ? sql`${topicProgress[correctField]} + 1`
            : sql`${topicProgress[correctField]}`,
          updatedAt: new Date(),
        },
      });

    // Calculate new status based on accuracy
    const updatedProgress = await db
      .select()
      .from(topicProgress)
      .where(
        and(
          eq(topicProgress.userId, userId),
          eq(topicProgress.topicId, q.topicId)
        )
      )
      .limit(1);

    if (updatedProgress.length > 0) {
      const prog = updatedProgress[0];
      let newStatus = "red";
      let newLevel = prog.currentLevel;

      // Calculate accuracy for current level
      const currentLevel = prog.currentLevel as "l1" | "l2" | "l3";
      const levelAttempts = prog[`${currentLevel}Attempts` as const];
      const levelCorrect = prog[`${currentLevel}Correct` as const];

      if (levelAttempts >= 10) {
        const accuracy = levelCorrect / levelAttempts;
        if (accuracy >= 0.7) {
          newStatus = "green";
          // Check if should advance level
          if (currentLevel === "l1" && accuracy >= 0.7) {
            newLevel = "l2";
          } else if (currentLevel === "l2" && accuracy >= 0.7) {
            newLevel = "l3";
          }
        } else if (accuracy >= 0.4) {
          newStatus = "amber";
        }
      } else if (levelAttempts >= 5) {
        const accuracy = levelCorrect / levelAttempts;
        if (accuracy >= 0.6) {
          newStatus = "amber";
        }
      }

      await db
        .update(topicProgress)
        .set({
          status: newStatus,
          currentLevel: newLevel,
        })
        .where(eq(topicProgress.id, prog.id));
    }

    // 11. Check if dose is now complete
    const allAnswers = await db
      .select()
      .from(dailyDoseAnswers)
      .where(eq(dailyDoseAnswers.dailyDoseId, doseId));

    let doseCompleted = false;

    if (allAnswers.length === dose[0].questionIds.length) {
      doseCompleted = true;

      // Calculate score
      const correctCount = allAnswers.filter((a) => a.isCorrect).length;
      const totalTime = allAnswers.reduce((sum, a) => sum + a.timeSpent, 0);

      await db
        .update(dailyDoses)
        .set({
          completed: true,
          score: correctCount,
          totalTimeSecs: totalTime,
          completedAt: new Date(),
        })
        .where(eq(dailyDoses.id, doseId));
    }

    // 12. Return response
    return NextResponse.json({
      isCorrect,
      correctOption: q.correctOption,
      smartSolution: q.smartSolution,
      detailedSolution: q.detailedSolution,
      optionAExplanation: q.optionAExplanation,
      optionBExplanation: q.optionBExplanation,
      optionCExplanation: q.optionCExplanation,
      optionDExplanation: q.optionDExplanation,
      doseCompleted,
    });
  } catch (error) {
    console.error("Error in POST /api/daily/submit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
