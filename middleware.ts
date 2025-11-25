import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAuthPage =
    path.startsWith("/auth") || path.startsWith("/reset-password");

  // Check for session token in cookies (edge-compatible)
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("better-auth.session_token")?.value;

  console.log(sessionToken);

  const hasSession = !!sessionToken;

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
