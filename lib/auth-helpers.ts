import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'admin' | 'coordinator' | 'responder' | 'viewer';

/**
 * Get the current authenticated user's Clerk ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get user record from database by Clerk user ID
 */
export async function getUserFromDb(clerkUserId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  
  return user || null;
}

/**
 * Get the current user's role from database
 */
export async function getUserRole(): Promise<UserRole | null> {
  const clerkUserId = await getCurrentUserId();
  if (!clerkUserId) return null;
  
  const user = await getUserFromDb(clerkUserId);
  return user?.role as UserRole | null;
}

/**
 * Check if user can submit updates
 * Admin, coordinator, and responder roles can submit
 */
export async function canSubmitUpdates(): Promise<boolean> {
  const role = await getUserRole();
  if (!role) return false;
  
  return role === 'admin' || role === 'coordinator' || role === 'responder';
}

/**
 * Check if user has admin permissions
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Sync or create user in database from Clerk user data
 */
export async function syncUserToDb(clerkUser: any) {
  const existingUser = await getUserFromDb(clerkUser.id);
  
  const userData = {
    clerkUserId: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    firstName: clerkUser.firstName || null,
    lastName: clerkUser.lastName || null,
    fullName: clerkUser.fullName || null,
    phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || null,
    imageUrl: clerkUser.imageUrl || null,
    lastActiveAt: new Date(),
    updatedAt: new Date(),
  };

  if (existingUser) {
    // Update existing user
    const [updated] = await db
      .update(users)
      .set(userData)
      .where(eq(users.clerkUserId, clerkUser.id))
      .returning();
    
    return updated;
  } else {
    // Create new user with default role 'responder'
    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        role: 'responder', // Default role
      })
      .returning();
    
    return newUser;
  }
}

