import { eq, and, desc, asc, sql, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  topics,
  patternTypes,
  resources,
  questions,
  topicProgress,
  patternProgress,
  user,
  revisionQueue,
} from "../../drizzle/schema";

// Topics
export async function getTopics() {
  return await db.select().from(topics).orderBy(asc(topics.displayOrder));
}

export async function getTopicById(id: string) {
  const result = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
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

// Admin analytics
export type AdminAnalyticsData = {
  topicStats: Array<{
    topicId: string;
    topicName: string;
    topicSection: "rc" | "lr" | "math";
    studentCount: number;
    needsHelpCount: number;
    l1Attempts: number;
    l1Correct: number;
    l2Attempts: number;
    l2Correct: number;
    l3Attempts: number;
    l3Correct: number;
    greenCount: number;
    amberCount: number;
    redCount: number;
  }>;
  patternWeaknesses: Array<{
    patternId: string;
    patternName: string;
    topicId: string;
    topicName: string;
    studentCount: number;
    totalAttempts: number;
    totalCorrect: number;
    accuracy: number | null;
    persistentCount: number;
  }>;
  overallStats: {
    totalStudents: number;
  };
};

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  // Topic-wise stats: per topic, count students, level-wise attempts + status counts
  const topicStats = await db
    .select({
      topicId: topics.id,
      topicName: topics.name,
      topicSection: topics.section,
      studentCount: sql<number>`count(distinct ${topicProgress.userId})::int`,
      needsHelpCount: sql<number>`sum(case when ${topicProgress.needsHelp} then 1 else 0 end)::int`,
      l1Attempts: sql<number>`sum(${topicProgress.l1Attempts})::int`,
      l1Correct: sql<number>`sum(${topicProgress.l1Correct})::int`,
      l2Attempts: sql<number>`sum(${topicProgress.l2Attempts})::int`,
      l2Correct: sql<number>`sum(${topicProgress.l2Correct})::int`,
      l3Attempts: sql<number>`sum(${topicProgress.l3Attempts})::int`,
      l3Correct: sql<number>`sum(${topicProgress.l3Correct})::int`,
      greenCount: sql<number>`sum(case when ${topicProgress.status} = 'green' then 1 else 0 end)::int`,
      amberCount: sql<number>`sum(case when ${topicProgress.status} = 'amber' then 1 else 0 end)::int`,
      redCount: sql<number>`sum(case when ${topicProgress.status} = 'red' then 1 else 0 end)::int`,
    })
    .from(topics)
    .leftJoin(topicProgress, eq(topicProgress.topicId, topics.id))
    .where(eq(topics.status, "published"))
    .groupBy(topics.id, topics.name, topics.section);

  // Pattern weakness: patterns sorted by accuracy (lowest first)
  const patternStats = await db
    .select({
      patternId: patternTypes.id,
      patternName: patternTypes.name,
      topicId: patternTypes.topicId,
      studentCount: sql<number>`count(distinct ${patternProgress.userId})::int`,
      totalAttempts: sql<number>`sum(${patternProgress.attemptsCount})::int`,
      totalCorrect: sql<number>`sum(${patternProgress.correctCount})::int`,
      persistentCount: sql<number>`count(case when ${revisionQueue.status} = 'persistent' then 1 end)::int`,
    })
    .from(patternTypes)
    .leftJoin(patternProgress, eq(patternProgress.patternTypeId, patternTypes.id))
    .leftJoin(revisionQueue, eq(revisionQueue.patternTypeId, patternTypes.id))
    .groupBy(patternTypes.id, patternTypes.name, patternTypes.topicId)
    .orderBy(sql`sum(${patternProgress.attemptsCount}) desc nulls last`);

  // Enrich pattern stats with accuracy + topic name
  const topicNameMap = new Map(topicStats.map((t) => [t.topicId, t.topicName]));
  const enrichedPatterns = patternStats
    .filter((p) => (p.totalAttempts ?? 0) > 0)
    .map((p) => ({
      ...p,
      topicName: topicNameMap.get(p.topicId) ?? "Unknown",
      accuracy: p.totalAttempts ? Math.round((p.totalCorrect / p.totalAttempts) * 100) : null,
    }))
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));

  // Overall stats
  const [overallStats] = await db
    .select({
      totalStudents: sql<number>`count(distinct ${user.id})::int`,
    })
    .from(user)
    .where(eq(user.role, "student"));

  return {
    topicStats: topicStats as AdminAnalyticsData["topicStats"],
    patternWeaknesses: enrichedPatterns.slice(0, 20),
    overallStats,
  };
}
