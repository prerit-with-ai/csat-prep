import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface TopicStat {
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
}

interface PatternWeakness {
  patternId: string;
  patternName: string;
  topicId: string;
  topicName: string;
  studentCount: number;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number | null;
  persistentCount: number;
}

interface AnalyticsData {
  topicStats: TopicStat[];
  patternWeaknesses: PatternWeakness[];
  overallStats: {
    totalStudents: number;
  };
}

function calculateAccuracy(
  l1Correct: number,
  l1Attempts: number,
  l2Correct: number,
  l2Attempts: number,
  l3Correct: number,
  l3Attempts: number
): string {
  const totalCorrect = l1Correct + l2Correct + l3Correct;
  const totalAttempts = l1Attempts + l2Attempts + l3Attempts;

  if (totalAttempts === 0) return "—";

  const accuracy = (totalCorrect / totalAttempts) * 100;
  return `${accuracy.toFixed(1)}%`;
}

function getSectionLabel(section: "rc" | "lr" | "math"): string {
  switch (section) {
    case "rc":
      return "Reading Comprehension";
    case "lr":
      return "Logical Reasoning";
    case "math":
      return "Quantitative Aptitude";
  }
}

export default async function AdminAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="p-6">
        <h1 className="text-page-title mb-2">Analytics</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Error loading analytics data
        </p>
      </div>
    );
  }

  const data: AnalyticsData = await res.json();

  const hasTopicData = data.topicStats.length > 0;
  const hasPatternData = data.patternWeaknesses.length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-page-title mb-2">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Student performance overview
        </p>
      </div>

      <div className="mb-8 p-4 border border-[var(--border-default)] rounded-xl bg-[var(--bg-secondary)]">
        <p className="text-body text-[var(--text-secondary)]">
          {data.overallStats.totalStudents === 0
            ? "No students active yet"
            : `${data.overallStats.totalStudents} ${
                data.overallStats.totalStudents === 1 ? "student" : "students"
              } active`}
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-section mb-4">Topic Performance</h2>
        {!hasTopicData ? (
          <div className="p-8 border border-[var(--border-default)] rounded-xl text-center">
            <p className="text-body text-[var(--text-tertiary)]">
              No topic data yet
            </p>
          </div>
        ) : (
          <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                  <tr>
                    <th className="text-left text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Topic
                    </th>
                    <th className="text-left text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Section
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Students
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Accuracy
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Needs Help
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {data.topicStats.map((topic) => {
                    const accuracy = calculateAccuracy(
                      topic.l1Correct,
                      topic.l1Attempts,
                      topic.l2Correct,
                      topic.l2Attempts,
                      topic.l3Correct,
                      topic.l3Attempts
                    );

                    return (
                      <tr
                        key={topic.topicId}
                        className="hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <td className="px-4 py-3 text-body text-[var(--text-primary)]">
                          {topic.topicName}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {getSectionLabel(topic.topicSection)}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {topic.studentCount}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {accuracy}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {topic.needsHelpCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {topic.greenCount > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-correct)]" />
                                <span className="text-sm text-[var(--text-secondary)]">
                                  {topic.greenCount}
                                </span>
                              </div>
                            )}
                            {topic.amberCount > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-amber)]" />
                                <span className="text-sm text-[var(--text-secondary)]">
                                  {topic.amberCount}
                                </span>
                              </div>
                            )}
                            {topic.redCount > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-wrong)]" />
                                <span className="text-sm text-[var(--text-secondary)]">
                                  {topic.redCount}
                                </span>
                              </div>
                            )}
                            {topic.greenCount === 0 &&
                              topic.amberCount === 0 &&
                              topic.redCount === 0 && (
                                <span className="text-sm text-[var(--text-tertiary)]">
                                  —
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-section mb-4">Pattern Weaknesses</h2>
        {!hasPatternData ? (
          <div className="p-8 border border-[var(--border-default)] rounded-xl text-center">
            <p className="text-body text-[var(--text-tertiary)]">
              No pattern data yet
            </p>
          </div>
        ) : (
          <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                  <tr>
                    <th className="text-left text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Pattern
                    </th>
                    <th className="text-left text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Topic
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Students
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Attempts
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Accuracy
                    </th>
                    <th className="text-right text-sm font-semibold text-[var(--text-secondary)] px-4 py-3">
                      Persistent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {data.patternWeaknesses.slice(0, 20).map((pattern) => {
                    const accuracyDisplay =
                      pattern.accuracy !== null
                        ? `${pattern.accuracy.toFixed(1)}%`
                        : "—";

                    return (
                      <tr
                        key={pattern.patternId}
                        className="hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <td className="px-4 py-3 text-body text-[var(--text-primary)]">
                          {pattern.patternName}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {pattern.topicName}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {pattern.studentCount}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {pattern.totalAttempts}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {accuracyDisplay}
                        </td>
                        <td className="px-4 py-3 text-body text-right text-[var(--text-primary)]">
                          {pattern.persistentCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
