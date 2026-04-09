import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics, patternTypes, questions } from "../../../../../../drizzle/schema";
import { inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const importRowSchema = z.object({
  topicSlug: z.string().min(1, "Topic slug is required"),
  patternTypeName: z.string().optional(),
  difficulty: z.enum(["l1", "l2", "l3"]),
  questionText: z.string().min(1, "Question text is required"),
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
});

const importRequestSchema = z.object({
  rows: z.array(importRowSchema).min(1, "At least one row is required"),
  preview: z.boolean(),
});

type ImportRow = z.infer<typeof importRowSchema>;

interface ValidatedRow {
  row: number;
  data: ImportRow;
  resolvedTopicId: string;
  resolvedPatternTypeId: string | null;
}

interface InvalidRow {
  row: number;
  data: Record<string, string | number | undefined>;
  reason: string;
}

interface DuplicateRow {
  row: number;
  data: Record<string, string | number | undefined>;
}

interface ImportSummary {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
}

interface ImportResponse {
  summary: ImportSummary;
  invalid: InvalidRow[];
  duplicates: DuplicateRow[];
  inserted?: number;
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
    const { rows, preview } = importRequestSchema.parse(body);

    // Load all topics and pattern types in parallel
    const [allTopics, allPatternTypes] = await Promise.all([
      db.select({ id: topics.id, slug: topics.slug }).from(topics),
      db.select({
        id: patternTypes.id,
        name: patternTypes.name,
        topicId: patternTypes.topicId
      }).from(patternTypes),
    ]);

    // Create lookup maps
    const topicsBySlug = new Map(allTopics.map(t => [t.slug, t.id]));
    const patternTypesByTopicAndName = new Map(
      allPatternTypes.map(pt => [`${pt.topicId}::${pt.name.toLowerCase()}`, pt.id])
    );

    // Validate all rows
    const validatedRows: ValidatedRow[] = [];
    const invalidRows: InvalidRow[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowData = row as Record<string, string | number | undefined>;

      // Resolve topicId
      const topicId = topicsBySlug.get(row.topicSlug);
      if (!topicId) {
        invalidRows.push({
          row: rowNumber,
          data: rowData,
          reason: `Topic slug '${row.topicSlug}' not found`,
        });
        return;
      }

      // Resolve patternTypeId if provided
      let patternTypeId: string | null = null;
      if (row.patternTypeName) {
        const lookupKey = `${topicId}::${row.patternTypeName.toLowerCase()}`;
        patternTypeId = patternTypesByTopicAndName.get(lookupKey) || null;
        if (!patternTypeId) {
          invalidRows.push({
            row: rowNumber,
            data: rowData,
            reason: `Pattern type '${row.patternTypeName}' not found for topic '${row.topicSlug}'`,
          });
          return;
        }
      }

      // All validations passed
      validatedRows.push({
        row: rowNumber,
        data: row,
        resolvedTopicId: topicId,
        resolvedPatternTypeId: patternTypeId,
      });
    });

    // Detect duplicates
    const topicIdsInBatch = [...new Set(validatedRows.map(r => r.resolvedTopicId))];
    const existingTexts = await db
      .select({ topicId: questions.topicId, questionText: questions.questionText })
      .from(questions)
      .where(inArray(questions.topicId, topicIdsInBatch));

    const existingSet = new Set(
      existingTexts.map(e => `${e.topicId}::${e.questionText.trim().toLowerCase()}`)
    );

    const nonDuplicateRows: ValidatedRow[] = [];
    const duplicateRows: DuplicateRow[] = [];

    validatedRows.forEach(vr => {
      const duplicateKey = `${vr.resolvedTopicId}::${vr.data.questionText.trim().toLowerCase()}`;
      if (existingSet.has(duplicateKey)) {
        duplicateRows.push({
          row: vr.row,
          data: vr.data as Record<string, string | number | undefined>,
        });
      } else {
        nonDuplicateRows.push(vr);
      }
    });

    const summary: ImportSummary = {
      total: rows.length,
      valid: nonDuplicateRows.length,
      duplicates: duplicateRows.length,
      invalid: invalidRows.length,
    };

    // If preview mode, return validation results without inserting
    if (preview) {
      const response: ImportResponse = {
        summary,
        invalid: invalidRows,
        duplicates: duplicateRows,
      };
      return Response.json(response);
    }

    // Insert valid, non-duplicate rows
    let insertedCount = 0;
    if (nonDuplicateRows.length > 0) {
      const insertValues = nonDuplicateRows.map(vr => ({
        topicId: vr.resolvedTopicId,
        patternTypeId: vr.resolvedPatternTypeId,
        difficulty: vr.data.difficulty,
        questionText: vr.data.questionText,
        optionA: vr.data.optionA,
        optionB: vr.data.optionB,
        optionC: vr.data.optionC,
        optionD: vr.data.optionD,
        correctOption: vr.data.correctOption,
        smartSolution: vr.data.smartSolution,
        detailedSolution: vr.data.detailedSolution,
        optionAExplanation: vr.data.optionAExplanation,
        optionBExplanation: vr.data.optionBExplanation,
        optionCExplanation: vr.data.optionCExplanation,
        optionDExplanation: vr.data.optionDExplanation,
        sourceType: vr.data.sourceType,
        sourceYear: vr.data.sourceYear,
        language: "en",
        isArchived: false,
      }));

      await db.insert(questions).values(insertValues);
      insertedCount = insertValues.length;
    }

    const response: ImportResponse = {
      summary,
      invalid: invalidRows,
      duplicates: duplicateRows,
      inserted: insertedCount,
    };

    return Response.json(response, { status: 201 });
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
    console.error("POST /api/admin/questions/import error:", error);
    return Response.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Failed to import questions" },
      },
      { status: 500 }
    );
  }
}
