import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { rolePermissionFlags } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
import { getUserWithRole } from "@/lib/middleware";
import { auditLogUserCreate } from "@/lib/audit";

export async function GET() {
  try {
    const users = await db.select().from(appUsers);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get current user for audit logging
    const currentUser = await getUserWithRole(req);

    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      fullName,
      phoneNumber,
      imageUrl,
      role,
      status,
      organization,
      department,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Get permission flags for the role
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

    const newUser = await db
      .insert(appUsers)
      .values({
        email,
        firstName,
        lastName,
        fullName,
        phoneNumber,
        imageUrl,
        role,
        status: status || "active",
        organization,
        department,
        ...permissionFlags,
      })
      .returning();

    // Log audit event
    if (currentUser) {
      await auditLogUserCreate(req, currentUser, newUser[0]);
    }

    return NextResponse.json({ user: newUser[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
