import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/db-queries";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin only" } },
      { status: 403 }
    );
  }

  const data = await getAdminAnalytics();
  return NextResponse.json(data);
}
