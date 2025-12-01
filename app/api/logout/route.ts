// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "../../../lib/middleware";
import { auditLogLogout } from "../../../lib/audit";

export async function POST(request: NextRequest) {
  // Get user before clearing session
  const currentUser = await getUserWithRole(request);
  
  const res = NextResponse.json({ ok: true });

  res.cookies.set("better-auth.session_token", "", {
    maxAge: 0,
    path: "/",
  });

  res.cookies.set("better-auth.refresh_token", "", {
    maxAge: 0,
    path: "/",
  });

  // Log audit event for logout (if user was authenticated)
  if (currentUser) {
    await auditLogLogout(request, currentUser);
  }

  return res;
}
