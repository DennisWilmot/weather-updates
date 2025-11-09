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
let drizzleAdapter: any = null;
if (typeof window === 'undefined' && isBetterAuthConfigured) {
  try {
    const path = require('path');
    const fs = require('fs');
    const { createRequire } = require('module');
    
    // Use process.cwd() to get the real file system path (bypasses webpack)
    // This works because webpack doesn't intercept process.cwd()
    const projectRoot = process.cwd();
    const adapterPath = path.join(
      projectRoot,
      'node_modules',
      'better-auth',
      'dist',
      'adapters',
      'drizzle-adapter',
      'index.cjs'
    );
    
    // Verify file exists using real file system
    if (!fs.existsSync(adapterPath)) {
      throw new Error(`Adapter file not found at ${adapterPath}`);
    }
    
    // Get the absolute path
    const absoluteAdapterPath = path.resolve(adapterPath);
    
    // Use createRequire with project's package.json (real file system path)
    // This ensures proper module resolution context
    const projectPackageJson = path.join(process.cwd(), 'package.json');
    const adapterRequire = createRequire(projectPackageJson);
    
    // Load the adapter module
    const adapterModule = adapterRequire(absoluteAdapterPath);
    
    drizzleAdapter = adapterModule.drizzleAdapter || adapterModule.default || adapterModule;
    
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
    });
  }
  
  // Fallback: create a minimal auth instance that won't crash
  return betterAuth({
    emailAndPassword: {
      enabled: true,
    },
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET || "temporary-secret-change-in-production",
  });
};

// Default auth instance (used when request is not available)
export const auth = createAuthInstance();

// Export factory function for request-specific instances
export { createAuthInstance };

