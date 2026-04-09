import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

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
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {session.user.name}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto px-4 py-8" style={{ maxWidth: "var(--max-page)" }}>
        {children}
      </main>
    </div>
  );
}
