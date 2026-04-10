import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { NavLinks } from "@/components/NavLinks";
import { MobileNav } from "@/components/MobileNav";
import FormulaFab from "@/components/FormulaFab";

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
          {/* Wordmark */}
          <Link
            href="/dashboard"
            className="text-sm font-semibold shrink-0"
            style={{ color: "var(--text-primary)" }}
          >
            CSAT Cracker
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <NavLinks />

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <DarkModeToggle />
            <Link
              href="/settings"
              className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Settings"
            >
              <Settings size={16} strokeWidth={1.5} />
            </Link>
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

      {/* Page content — extra bottom padding on mobile for the tab bar */}
      <main
        className="mx-auto px-4 py-8 pb-24 md:pb-8"
        style={{ maxWidth: "var(--max-page)" }}
      >
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <MobileNav />

      {/* Formula FAB */}
      <FormulaFab />
    </div>
  );
}
