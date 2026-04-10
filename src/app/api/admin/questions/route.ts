import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "../../../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const questionSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID"),
  passageId: z.string().uuid().optional().nullable(),
  patternTypeId: z.string().uuid("Invalid pattern type ID").optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(["l1", "l2", "l3"]),
  questionText: z.string().min(1, "Question text is required"),
  imageUrl: z.string().url().optional(),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctOption: z.enum(["a", "b", "c", "d"]),
  smartSolution: z.string().min(1, "Smart solution is required"),
  detailedSolution: z.string().optional(),
  optionAExplanation: z.string().optional(),
  optionBExplanation: z.string().optional(),
  optionCExplanation: z.string().optional(),
  optionDExplanation: z.string().optional(),
  sourceType: z.enum(["pyq", "cat", "ai", "custom"]).default("custom"),
  sourceYear: z.number().int().optional(),
  language: z.enum(["en", "hi"]).default("en"),
});

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");
    const patternTypeId = searchParams.get("patternTypeId");
    const sourceType = searchParams.get("sourceType");

    const conditions = [eq(questions.isArchived, false)];

    if (topicId) {
      conditions.push(eq(questions.topicId, topicId));
    }
    if (difficulty) {
      conditions.push(eq(questions.difficulty, difficulty));
    }
    if (patternTypeId) {
      conditions.push(eq(questions.patternTypeId, patternTypeId));
    }
    if (sourceType) {
      conditions.push(eq(questions.sourceType, sourceType));
    }

    const allQuestions = await db.query.questions.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
      orderBy: [desc(questions.createdAt)],
    });

    return Response.json({ questions: allQuestions });
  } catch (error) {
    console.error("GET /api/admin/questions error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch questions" },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = questionSchema.parse(body);

    const [newQuestion] = await db
      .insert(questions)
      .values(validatedData)
      .returning();

    return Response.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }
    console.error("POST /api/admin/questions error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to create question" },
      },
      { status: 500 }
    );
  }
}
