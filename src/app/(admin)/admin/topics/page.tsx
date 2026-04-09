import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTopics } from "@/lib/db-queries";
import Link from "next/link";

export default async function TopicsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const topics = await getTopics();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Topics
        </h1>
        <Link
          href="/admin/topics/new"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-primary)",
          }}
        >
          New Topic
        </Link>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
        className="rounded-xl overflow-hidden"
      >
        {topics.length === 0 ? (
          <div className="p-12 text-center">
            <p
              className="text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              No topics yet. Create your first topic.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <th
                  className="text-left px-5 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Name
                </th>
                <th
                  className="text-left px-5 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Section
                </th>
                <th
                  className="text-left px-5 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Status
                </th>
                <th
                  className="text-left px-5 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Questions
                </th>
                <th
                  className="text-left px-5 py-3 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr
                  key={topic.id}
                  style={{
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <td
                    className="px-5 py-4 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {topic.name}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor:
                          topic.section === "rc"
                            ? "var(--section-rc-bg)"
                            : topic.section === "lr"
                            ? "var(--section-lr-bg)"
                            : "var(--section-math-bg)",
                        color:
                          topic.section === "rc"
                            ? "var(--section-rc)"
                            : topic.section === "lr"
                            ? "var(--section-lr)"
                            : "var(--section-math)",
                      }}
                    >
                      {topic.section.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color:
                          topic.status === "published"
                            ? "var(--color-correct)"
                            : "var(--color-amber)",
                      }}
                    >
                      {topic.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td
                    className="px-5 py-4 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    0
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/topics/${topic.id}`}
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
