import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { mockTests } from "../../../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";

export default async function MockHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const mocks = await db
    .select()
    .from(mockTests)
    .where(and(eq(mockTests.userId, session.user.id), eq(mockTests.status, "completed")))
    .orderBy(desc(mockTests.submittedAt));

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-page-title mb-6" style={{ color: "var(--text-primary)" }}>
        Mock History
      </h1>

      {mocks.length === 0 && (
        <div
          className="p-8 rounded-xl text-center"
          style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-primary)" }}
        >
          <p className="text-body mb-4" style={{ color: "var(--text-secondary)" }}>
            No completed mocks yet.
          </p>
          <Link
            href="/mock"
            className="inline-block px-6 py-3 rounded-lg text-body"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-primary)" }}
          >
            Start your first mock →
          </Link>
        </div>
      )}

      {mocks.length > 0 && (
        <div className="space-y-3">
          {mocks.map((mock) => {
            const score = mock.netScore ? parseFloat(mock.netScore) : null;
            const maxScore = mock.totalQuestions * 2.5;
            const scoreColor =
              score === null ? "var(--text-tertiary)"
              : score >= 66 ? "var(--color-correct)"
              : score >= 40 ? "var(--color-amber)"
              : "var(--color-wrong)";

            const date = mock.submittedAt
              ? new Date(mock.submittedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            const typeLabel =
              mock.type === "full" ? "Full Paper Mock"
              : mock.type === "section" ? `${mock.section?.toUpperCase()} Section Mock`
              : "Topic Mock";

            return (
              <Link
                key={mock.id}
                href={`/mock/${mock.id}/analysis`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid var(--border-default)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <div>
                  <p className="font-medium text-base" style={{ color: "var(--text-primary)" }}>
                    {typeLabel}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {date} · {mock.totalQuestions} questions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-base" style={{ color: scoreColor }}>
                    {score !== null ? `${score.toFixed(1)} / ${maxScore.toFixed(0)}` : "—"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    View analysis →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
