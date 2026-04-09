import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mockTests, mockTestResponses } from "../../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const respondSchema = z.object({
  questionId: z.string().uuid(),
  abcTag: z.enum(['A', 'B', 'C']),
  selectedOption: z.string().nullable(),
  timeSpentSeconds: z.number().int().min(0),
  reviewedInSecondPass: z.boolean().optional(),
});

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

  // 2. Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const result = respondSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: result.error.message } },
      { status: 400 }
    );
  }

  const { questionId, abcTag, selectedOption, timeSpentSeconds, reviewedInSecondPass } = result.data;
  const mockId = params.id;

  try {
    // 3. Get mock by id, verify userId
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

    // 4. Verify mock.status === 'in_progress'
    if (mock.status !== 'in_progress') {
      return NextResponse.json(
        { error: { code: "MOCK_COMPLETED", message: "Mock test is already completed" } },
        { status: 400 }
      );
    }

    // 5. Update the mockTestResponse row
    await db
      .update(mockTestResponses)
      .set({
        abcTag,
        selectedOption,
        timeSpentSeconds,
        reviewedInSecondPass: reviewedInSecondPass ?? false,
      })
      .where(
        and(
          eq(mockTestResponses.mockTestId, mockId),
          eq(mockTestResponses.questionId, questionId)
        )
      );

    // 6. Return success
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating mock test response:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update response" } },
      { status: 500 }
    );
  }
}
