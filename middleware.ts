import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/melissa",
    "/api/submissions",
    "/api/tweets",
    "/api/rss-news",
    "/api/parishes",
    "/api/communities",
    "/api/locations",
    "/api/locations/(.*)",
    "/api/search",
    "/api/link-preview",
    "/api/emergency-updates",
    "/api/live-updates",
    "/api/relief-portal/stats",
    "/api/parishes/stats",
    "/api/submissions/stats",
    "/api/online-retailers",
    "/sign-up"
  ],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
