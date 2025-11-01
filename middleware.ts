import { withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default withClerkMiddleware(() => {
  return NextResponse.next();
});

// Only run middleware for protected routes
export const config = {
  matcher: [
    "/relief-portal(.*)",
    "/api/relief-portal(.*)",
  ],
};
