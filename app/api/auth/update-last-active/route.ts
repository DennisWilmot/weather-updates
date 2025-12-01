import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "../../../../lib/middleware";
import { updateLastActiveServer } from "../../../../lib/update-last-active-server";
import { auditLogLogin } from "../../../../lib/audit";

/**
 * Updates the user's lastActiveAt timestamp
 * Called after successful login to track user activity
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const currentUser = await getUserWithRole(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update the user's lastActiveAt timestamp using server function
    const success = await updateLastActiveServer(currentUser.id);

    if (success) {
      console.log(
        `[Last Active] Updated for user ${currentUser.id} (${currentUser.email})`
      );

      // Log audit event for login
      await auditLogLogin(request, currentUser, true);

      return NextResponse.json({
        success: true,
        message: "Last active timestamp updated",
      });
    } else {
      throw new Error("Failed to update timestamp");
    }
  } catch (error) {
    console.error("Error updating last active timestamp:", error);
    return NextResponse.json(
      { error: "Failed to update last active timestamp" },
      { status: 500 }
    );
  }
}
