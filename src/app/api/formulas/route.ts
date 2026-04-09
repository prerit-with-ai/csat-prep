import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formulaCards, topics } from "../../../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const cards = await db
    .select({
      id: formulaCards.id,
      topicId: formulaCards.topicId,
      topicName: topics.name,
      topicSection: topics.section,
      content: formulaCards.content,
      displayOrder: formulaCards.displayOrder,
    })
    .from(formulaCards)
    .innerJoin(topics, eq(topics.id, formulaCards.topicId))
    .where(eq(topics.status, "published"))
    .orderBy(asc(topics.displayOrder), asc(formulaCards.displayOrder));

  // Group by topic
  const grouped: Record<string, { topicId: string; topicName: string; topicSection: string; cards: typeof cards }> = {};
  for (const card of cards) {
    if (!grouped[card.topicId]) {
      grouped[card.topicId] = {
        topicId: card.topicId,
        topicName: card.topicName,
        topicSection: card.topicSection,
        cards: [],
      };
    }
    grouped[card.topicId].cards.push(card);
  }

  return NextResponse.json({ topics: Object.values(grouped) });
}
