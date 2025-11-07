// User role types
export type UserRole = 'admin' | 'coordinator' | 'responder' | 'viewer';

// Better Auth types
export type { InferSession, InferUser } from 'better-auth';

// Re-export auth client for convenience
export { authClient, signIn, signOut, signUp, useSession } from './auth-client';

