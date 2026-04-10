"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function handleLogout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm transition-colors"
      style={{ color: "var(--text-tertiary)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = "var(--text-primary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--text-tertiary)")
      }
    >
      <LogOut size={14} strokeWidth={1.5} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
