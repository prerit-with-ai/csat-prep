import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminNavLinks } from "@/components/AdminNavLinks";

export default async function AdminLayout({
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

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div
      style={{ backgroundColor: "var(--bg-secondary)" }}
      className="min-h-screen"
    >
      {/* Top header */}
      <header
        style={{
          backgroundColor: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-default)",
        }}
        className="sticky top-0 z-40"
      >
        <div
          className="mx-auto px-4 flex items-center justify-between h-12"
          style={{ maxWidth: "var(--max-page)" }}
        >
          {/* Wordmark + Admin badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              CSAT Cracker
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-tertiary)",
              }}
            >
              Admin
            </span>
          </div>

          {/* Admin nav links — hidden on mobile */}
          <AdminNavLinks />

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-sm hidden lg:block"
              style={{ color: "var(--text-tertiary)" }}
            >
              {session.user.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main
        className="mx-auto px-4 py-8"
        style={{ maxWidth: "var(--max-page)" }}
      >
        {children}
      </main>
    </div>
  );
}
