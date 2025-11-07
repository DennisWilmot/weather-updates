import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle-adapter";
import { db } from "./db";

// Only initialize Better Auth if required environment variables are set
// This prevents crashes when Better Auth is not yet fully configured
const isBetterAuthConfigured = 
  process.env.BETTER_AUTH_SECRET && 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET;

export const auth = isBetterAuthConfigured
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
    betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
      }),
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      secret: process.env.BETTER_AUTH_SECRET || "temporary-secret-change-in-production",
    });

