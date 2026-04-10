import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formulaCards } from "../../../../../drizzle/schema";
import { headers } from "next/headers";
import { z } from "zod";

const createSchema = z.object({
  topicId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  displayOrder: z.number().int().optional().default(0),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
    }

    const body = await request.json();
    const { topicId, content, displayOrder } = createSchema.parse(body);

    const [created] = await db
      .insert(formulaCards)
      .values({ topicId, content, displayOrder })
      .returning();

    return Response.json({ formulaCard: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: error.issues[0].message } }, { status: 400 });
    }
    console.error("POST /api/admin/formulas error:", error);
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create formula card" } }, { status: 500 });
  }
}
