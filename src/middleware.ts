import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Authenticated users trying to access auth pages → redirect to root
  if (sessionCookie && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated users trying to access protected routes → redirect to login
  if (
    !sessionCookie &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/topics") ||
      pathname.startsWith("/daily"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/topics/:path*", "/daily/:path*", "/login", "/register"],
};
