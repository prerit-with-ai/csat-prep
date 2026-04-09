import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topicProgress, topics, user, revisionQueue, patternTypes } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin only" } }, { status: 403 });
  }

  // Fetch all needsHelp topic progress flags
  const needsHelpFlags = await db
    .select({
      id: topicProgress.id,
      userId: topicProgress.userId,
      topicId: topicProgress.topicId,
      topicName: topics.name,
      topicSection: topics.section,
      status: topicProgress.status,
      currentLevel: topicProgress.currentLevel,
      l1Attempts: topicProgress.l1Attempts,
      l1Correct: topicProgress.l1Correct,
      adminNotes: topicProgress.adminNotes,
      needsHelp: topicProgress.needsHelp,
      updatedAt: topicProgress.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(topicProgress)
    .innerJoin(topics, eq(topics.id, topicProgress.topicId))
    .innerJoin(user, eq(user.id, topicProgress.userId))
    .where(eq(topicProgress.needsHelp, true))
    .orderBy(topicProgress.updatedAt);

  // Fetch persistent revision queue items
  const persistentItems = await db
    .select({
      id: revisionQueue.id,
      userId: revisionQueue.userId,
      patternTypeId: revisionQueue.patternTypeId,
      patternName: patternTypes.name,
      wrongCount: revisionQueue.wrongCount,
      reviewCount: revisionQueue.reviewCount,
      status: revisionQueue.status,
      createdAt: revisionQueue.createdAt,
      lastReviewedAt: revisionQueue.lastReviewedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(revisionQueue)
    .innerJoin(patternTypes, eq(patternTypes.id, revisionQueue.patternTypeId))
    .innerJoin(user, eq(user.id, revisionQueue.userId))
    .where(eq(revisionQueue.status, "persistent"))
    .orderBy(revisionQueue.wrongCount);

  return NextResponse.json({ needsHelpFlags, persistentItems });
}
