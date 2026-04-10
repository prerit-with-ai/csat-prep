import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";
import FormulaFab from "@/components/FormulaFab";
import { DarkModeToggle } from "@/components/DarkModeToggle";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      style={{ backgroundColor: "var(--bg-secondary)" }}
      className="min-h-screen"
    >
      <header
        style={{
          backgroundColor: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-default)",
        }}
        className="px-4 py-3 flex items-center justify-between"
      >
        <span
          className="text-section font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          CSAT Cracker
        </span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
          <Link href="/topics" className="text-sm" style={{ color: "var(--text-secondary)" }}>Topics</Link>
          <Link href="/mock" className="text-sm" style={{ color: "var(--text-secondary)" }}>Mocks</Link>
          <Link href="/revision" className="text-sm" style={{ color: "var(--text-secondary)" }}>Revision</Link>
          <Link href="/strategy" className="text-sm" style={{ color: "var(--text-secondary)" }}>Strategy</Link>
          <DarkModeToggle />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {session.user.name}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto px-4 py-8" style={{ maxWidth: "var(--max-page)" }}>
        {children}
      </main>
      <FormulaFab />
    </div>
  );
}
