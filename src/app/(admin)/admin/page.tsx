import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const navCards = [
    {
      title: "Topics",
      href: "/admin/topics",
      description: "Manage topics, cheatsheets, pattern types, and resources",
    },
    {
      title: "Questions",
      href: "/admin/questions",
      description: "Add and edit questions across all topics and difficulty levels",
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      description: "Student performance overview, topic accuracy, pattern weaknesses",
    },
    {
      title: "Flags",
      href: "/admin/flags",
      description: "Students needing help, persistent revision weaknesses",
    },
    {
      title: "Bulk Import",
      href: "/admin/import",
      description: "Import questions from JSON — validate, preview, then confirm",
    },
  ];

  return (
    <div>
      <h1
        className="text-page-title mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Admin Dashboard
      </h1>
      <p
        className="text-body mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Welcome, {session.user.name}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
            }}
            className="block p-5 transition-colors hover:border-[var(--border-hover)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {card.title}
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {card.description}
                </p>
              </div>
              <span
                className="text-lg ml-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
