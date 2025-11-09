"use client";

import { createAuthClient } from "better-auth/react";

// Use current origin for client-side to avoid CORS issues
// Works for both development (localhost) and production (atlas.tm)
const getBaseURL = (): string => {
  // Client-side: use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side: use environment variable or fallback
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;

