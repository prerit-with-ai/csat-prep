import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const questionUpdateSchema = z.object({
  topicId: z.string().uuid().optional(),
  passageId: z.string().uuid().optional().nullable(),
  patternTypeId: z.string().uuid().optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(["l1", "l2", "l3"]).optional(),
  questionText: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  optionA: z.string().min(1).optional(),
  optionB: z.string().min(1).optional(),
  optionC: z.string().min(1).optional(),
  optionD: z.string().min(1).optional(),
  correctOption: z.enum(["a", "b", "c", "d"]).optional(),
  smartSolution: z.string().min(1).optional(),
  detailedSolution: z.string().optional(),
  optionAExplanation: z.string().optional(),
  optionBExplanation: z.string().optional(),
  optionCExplanation: z.string().optional(),
  optionDExplanation: z.string().optional(),
  sourceType: z.enum(["pyq", "cat", "ai", "custom"]).optional(),
  sourceYear: z.number().int().optional(),
  language: z.enum(["en", "hi"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!question) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Question not found" } },
        { status: 404 }
      );
    }

    return Response.json({ question });
  } catch (error) {
    console.error("GET /api/admin/questions/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch question" },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = questionUpdateSchema.parse(body);

    const [updatedQuestion] = await db
      .update(questions)
      .set(validatedData)
      .where(eq(questions.id, id))
      .returning();

    if (!updatedQuestion) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Question not found" } },
        { status: 404 }
      );
    }

    return Response.json({ question: updatedQuestion });
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
    console.error("PUT /api/admin/questions/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to update question" },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Soft delete by setting isArchived to true
    const [archivedQuestion] = await db
      .update(questions)
      .set({ isArchived: true })
      .where(eq(questions.id, id))
      .returning();

    if (!archivedQuestion) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Question not found" } },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/questions/[id] error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to delete question" },
      },
      { status: 500 }
    );
  }
}
