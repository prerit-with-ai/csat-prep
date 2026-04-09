import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics, topicProgress, patternTypes, patternProgress, user, revisionQueue } from "../../../../../drizzle/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin only" } }, { status: 403 });
  }

  // Topic-wise stats: per topic, count students, avg accuracy per level
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

  // Pattern weakness: patterns with most wrong answers
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

  // Enrich pattern stats with accuracy and topic name
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

  return NextResponse.json({
    topicStats,
    patternWeaknesses: enrichedPatterns.slice(0, 20),
    overallStats,
  });
}
