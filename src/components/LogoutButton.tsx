"use client";

import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  async function handleLogout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm"
      style={{ color: "var(--text-tertiary)" }}
    >
      Sign out
    </button>
  );
}
