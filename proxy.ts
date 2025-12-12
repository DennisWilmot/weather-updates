import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAuthPage =
    path.startsWith("/auth") || path.startsWith("/reset-password");
  const isApiRoute = path.startsWith("/api/");
  const isPublicRoute = path.startsWith("/merchant-onboarding");

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // API routes should handle their own authentication and return JSON errors
  // Don't redirect API routes to login page
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Check for session token in cookies
  // In production with HTTPS, cookies may have __Secure- prefix
  // Better Auth uses: better-auth.session_token (dev) or __Secure-better-auth.session_token (prod)
  const cookieHeader = req.headers.get("cookie") || "";

  // Parse cookies to check for session token (handles both prefixed and non-prefixed names)
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const hasSessionToken = cookies.some((cookie) => {
    const [name] = cookie.split("=");
    return (
      name === "better-auth.session_token" ||
      name === "__Secure-better-auth.session_token"
    );
  });

  if (!hasSessionToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (hasSessionToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
