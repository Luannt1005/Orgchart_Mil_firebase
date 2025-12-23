import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const auth = request.cookies.get("auth")?.value;
  const pathname = request.nextUrl.pathname;

  // ✅ Cho phép API
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ✅ Cho phép login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // 🔒 Chưa login → đá về login
  if (!auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
