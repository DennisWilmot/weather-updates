import { betterAuth } from "better-auth";
import { db } from "./db";

// Only initialize Better Auth if required environment variables are set
// This prevents crashes when Better Auth is not yet fully configured
const isBetterAuthConfigured = 
  process.env.BETTER_AUTH_SECRET && 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET;

// Dynamically import drizzle adapter to avoid build errors when Better Auth is not configured
// Using dynamic import to avoid build-time errors since the adapter path is not exported
let drizzleAdapter: any = null;
if (typeof window === 'undefined' && isBetterAuthConfigured) {
  // Only try to load adapter on server-side and when configured
  try {
    // Use dynamic import to avoid build-time module resolution errors
    const adapterModule = require("better-auth/adapters/drizzle-adapter");
    drizzleAdapter = adapterModule?.drizzleAdapter;
  } catch (e) {
    // Adapter not available - Better Auth not fully configured
    // This is expected when Better Auth is paused/not configured
  }
}

export const auth = isBetterAuthConfigured && drizzleAdapter
  ? betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
      }),
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      secret: process.env.BETTER_AUTH_SECRET!,
    })
  : // Fallback: create a minimal auth instance that won't crash
    // This uses the default memory adapter when drizzle adapter is not available
    betterAuth({
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      secret: process.env.BETTER_AUTH_SECRET || "temporary-secret-change-in-production",
    });

