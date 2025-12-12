import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { rolePermissionFlags } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
import { getUserWithRole } from "@/lib/middleware";
import {
  auditLogUserUpdate,
  auditLogUserDelete,
  auditLogUserSuspend,
} from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const resolvedParams = await params;
    // Get current user for audit logging
    const currentUser = await getUserWithRole(request);

    const body = await request.json();
    const {
      role,
      status,
      firstName,
      lastName,
      fullName,
      organization,
      department,
      phoneNumber,
      imageUrl,
    } = body;

    const userId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get current user data for audit log (before value)
    const currentUserData = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1);

    if (currentUserData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const beforeValue = currentUserData[0];

    // Get permission flags for the role if role is being updated
    const updateData: any = {
      firstName,
      lastName,
      fullName,
      organization,
      department,
      phoneNumber,
      imageUrl,
      status,
      updatedAt: new Date(),
    };

    if (role) {
      const permissionFlags = rolePermissionFlags[role as UserRole] || {
        canViewSensitiveData: false,
        canExportData: false,
        canManageUsers: false,
        canCreateDeployments: false,
        canAssignForms: false,
        canApproveRequests: false,
        canAccessAdmin: false,
        canSubmitPeopleNeeds: false,
      };

      updateData.role = role;
      Object.assign(updateData, permissionFlags);
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await db
      .update(appUsers)
      .set(updateData)
      .where(eq(appUsers.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log audit event
    if (currentUser) {
      // Check if status changed to/from suspended
      if (status && status !== beforeValue.status) {
        if (status === "suspended" || beforeValue.status === "suspended") {
          await auditLogUserSuspend(
            request,
            currentUser,
            updatedUser[0],
            status === "suspended"
          );
        } else {
          await auditLogUserUpdate(
            request,
            currentUser,
            updatedUser[0],
            beforeValue
          );
        }
      } else {
        await auditLogUserUpdate(
          request,
          currentUser,
          updatedUser[0],
          beforeValue
        );
      }
    }

    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const resolvedParams = await params;
    // Get current user for audit logging
    const currentUser = await getUserWithRole(request);

    const userId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data before deletion for audit log
    const userToDelete = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1);

    if (userToDelete.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deletedUser = await db
      .delete(appUsers)
      .where(eq(appUsers.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log audit event
    if (currentUser) {
      await auditLogUserDelete(request, currentUser, userToDelete[0]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
