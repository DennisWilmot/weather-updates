import { betterAuth } from "better-auth";
import { db } from "./db";
import * as schema from "./db/schema";

// Only initialize Better Auth if required environment variables are set
// BETTER_AUTH_SECRET is required, Google OAuth is optional
const isBetterAuthConfigured = !!process.env.BETTER_AUTH_SECRET;
const hasGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Get base URL - use environment variable or detect from request
// For development, works with any localhost port (3000, 3001, 3002, etc.)
const getBaseURL = (request?: Request) => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://atlas.tm';
  }
  
  // In development, try to detect from request headers if available
  if (request) {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  
  // Fallback: use localhost:3000 (client-side will use window.location.origin anyway)
  return 'http://localhost:3000';
};

// Import drizzle adapter for Better Auth
// Better Auth v1.3+ includes drizzle adapter
// Use package import path which works in both dev and serverless (Vercel) environments
let drizzleAdapter: any = null;
if (typeof window === 'undefined' && isBetterAuthConfigured) {
  try {
    // Use package import path - this works in Vercel/serverless environments
    // The package.json exports should handle the path resolution
    const adapterModule = require('better-auth/adapters/drizzle');
    drizzleAdapter = adapterModule.drizzleAdapter; // This is the correct export name
    
    if (!drizzleAdapter || typeof drizzleAdapter !== 'function') {
      console.warn('[Better Auth] Drizzle adapter not found, using memory adapter');
      drizzleAdapter = null;
    } else {
      console.log('[Better Auth] Drizzle adapter loaded successfully');
    }
  } catch (e: any) {
    console.error('[Better Auth] Error loading drizzle adapter:', e.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('[Better Auth] Stack:', e.stack);
    }
    console.warn('[Better Auth] Falling back to memory adapter (data will not persist)');
    drizzleAdapter = null;
  }
}

// Create auth instance factory that can use request-specific baseURL
const createAuthInstance = (request?: Request) => {
  const baseURL = getBaseURL(request);
  
  // Determine trusted origins based on environment
  const trustedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://atlas.tm', 'https://www.atlas.tm']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
  
  if (isBetterAuthConfigured && drizzleAdapter) {
    return betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      emailAndPassword: {
        enabled: true,
      },
      ...(hasGoogleOAuth && {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        },
      }),
      baseURL,
      secret: process.env.BETTER_AUTH_SECRET!,
      trustedOrigins,
    });
  }
  
  // Fallback: create a minimal auth instance that won't crash
  return betterAuth({
    emailAndPassword: {
      enabled: true,
    },
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET || "temporary-secret-change-in-production",
    trustedOrigins,
  });
};

// Default auth instance (used when request is not available)
export const auth = createAuthInstance();

// Export factory function for request-specific instances
export { createAuthInstance };

