/**
 * Server-side utility function to update user's last active timestamp
 * Use this in server actions, API routes, and server components
 */

import { db } from "./db";
import { appUsers, user } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Server-side function to update last active timestamp
 * Use this in server actions or API routes when you have the user ID
 */
export async function updateLastActiveServer(userId: string): Promise<boolean> {
  try {
    await db
      .update(appUsers)
      .set({
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(appUsers.id, userId));

    console.log(`[Last Active] Server-side update for user ${userId}`);
    return true;
  } catch (error) {
    console.error("[Last Active] Server-side error:", error);
    return false;
  }
}
