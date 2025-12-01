/**
 * Client-side utility function to update user's last active timestamp
 * Use this in client components and pages
 */

/**
 * Client-side function to update last active timestamp
 * Call this after important user interactions (login, navigation, etc.)
 */
export async function updateLastActive(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/update-last-active", {
      method: "POST",
      credentials: "include", // Include cookies for authentication
    });

    if (response.ok) {
      console.log("[Last Active] Timestamp updated successfully");
      return true;
    } else {
      console.warn(
        "[Last Active] Failed to update timestamp:",
        response.status
      );
      return false;
    }
  } catch (error) {
    console.error("[Last Active] Error updating timestamp:", error);
    return false;
  }
}
