import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
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
        Dashboard
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
          Welcome, {session.user.name}. Your preparation dashboard will appear here.
        </p>
      </div>
    </div>
  );
}
