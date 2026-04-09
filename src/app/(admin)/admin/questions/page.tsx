import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getQuestions, getTopics } from "@/lib/db-queries";
import QuestionsFilter from "./QuestionsFilter";

interface PageProps {
  searchParams: Promise<{
    topicId?: string;
    difficulty?: string;
    patternTypeId?: string;
  }>;
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const filters = {
    topicId: params.topicId,
    difficulty: params.difficulty,
    patternTypeId: params.patternTypeId,
  };

  const [questions, topics] = await Promise.all([
    getQuestions(filters),
    getTopics(),
  ]);

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      l1: { color: "var(--level-l1)", label: "L1" },
      l2: { color: "var(--level-l2)", label: "L2" },
      l3: { color: "var(--level-l3)", label: "L3" },
    };
    const style = styles[difficulty as keyof typeof styles] || styles.l1;
    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: `${style.color}15`,
          color: style.color,
        }}
      >
        {style.label}
      </span>
    );
  };

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1
          className="text-page-title"
          style={{ color: "var(--text-primary)" }}
        >
          Questions
        </h1>
        <Link
          href="/admin/questions/new"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
          }}
        >
          New Question
        </Link>
      </div>

      <QuestionsFilter topics={topics} />

      <div className="mb-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Showing {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {questions.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            No questions found. Add your first question.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th
                  className="text-left px-4 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Question
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Topic
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Difficulty
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Source
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => {
                const topic = topics.find((t) => t.id === question.topicId);
                return (
                  <tr
                    key={question.id}
                    style={{
                      borderBottom:
                        index < questions.length - 1
                          ? "1px solid var(--border-default)"
                          : "none",
                    }}
                  >
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {truncate(question.questionText, 80)}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {topic?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      {getDifficultyBadge(question.difficulty)}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {question.sourceType.toUpperCase()}
                      {question.sourceYear && ` ${question.sourceYear}`}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/questions/${question.id}/edit`}
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
