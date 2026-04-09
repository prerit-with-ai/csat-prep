import { eq, and, desc, asc, count, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { topics, patternTypes, resources, questions, formulaCards } from "../../drizzle/schema";

// Topics
export async function getTopics() {
  return await db.select().from(topics).orderBy(asc(topics.displayOrder));
}

export async function getTopicById(id: string) {
  const result = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
  return result[0];
}

export async function getTopicBySlug(slug: string) {
  const result = await db.select().from(topics).where(eq(topics.slug, slug)).limit(1);
  return result[0];
}

// Pattern Types
export async function getPatternTypesByTopicId(topicId: string) {
  return await db
    .select()
    .from(patternTypes)
    .where(eq(patternTypes.topicId, topicId))
    .orderBy(asc(patternTypes.displayOrder));
}

// Resources
export async function getResourcesByTopicId(topicId: string) {
  return await db
    .select()
    .from(resources)
    .where(eq(resources.topicId, topicId))
    .orderBy(asc(resources.displayOrder));
}

// Questions
export async function getQuestions(filters?: {
  topicId?: string;
  difficulty?: string;
  patternTypeId?: string;
  sourceType?: string;
  isArchived?: boolean;
}) {
  const conditions: SQL[] = [eq(questions.isArchived, filters?.isArchived ?? false)];

  if (filters?.topicId) {
    conditions.push(eq(questions.topicId, filters.topicId));
  }

  if (filters?.difficulty) {
    conditions.push(eq(questions.difficulty, filters.difficulty as "l1" | "l2" | "l3"));
  }

  if (filters?.patternTypeId) {
    conditions.push(eq(questions.patternTypeId, filters.patternTypeId));
  }

  if (filters?.sourceType) {
    conditions.push(eq(questions.sourceType, filters.sourceType as "pyq" | "cat" | "ai" | "custom"));
  }

  return await db
    .select()
    .from(questions)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(questions.createdAt));
}

export async function getQuestionById(id: string) {
  const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return result[0];
}

// Formula Cards
export async function getFormulaCardsByTopicId(topicId: string) {
  return await db
    .select()
    .from(formulaCards)
    .where(eq(formulaCards.topicId, topicId))
    .orderBy(asc(formulaCards.displayOrder));
}
