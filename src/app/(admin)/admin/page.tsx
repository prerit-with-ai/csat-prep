import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1
        className="text-page-title mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Admin Dashboard
      </h1>
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
        className="rounded-xl p-5"
      >
        <p
          className="text-body"
          style={{ color: "var(--text-secondary)" }}
        >
          Welcome, {session.user.name}. Content management and student analytics will appear here.
        </p>
      </div>
    </div>
  );
}
