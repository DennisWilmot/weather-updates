/**
 * Roles API Endpoint
 * Manages roles and permissions for the RBAC system
 */

import { NextRequest, NextResponse } from "next/server";
import { assertPermission, getUserWithRole } from "../../../lib/middleware";
import { rolePermissions, isValidRole } from "../../../lib/permissions";
import type { UserRole } from "../../../lib/permissions";
import { db } from "../../../lib/db";
import { roles } from "../../../lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/actions";
import {
  auditLogRoleCreate,
  auditLogRoleUpdate,
  auditLogRoleDelete,
} from "../../../lib/audit";

export async function GET(request: NextRequest) {
  try {
    // Require admin permission to view roles
    await assertPermission(request, "roles_view_all");

    // Fetch custom roles from database
    const customRolesFromDb = await db
      .select()
      .from(roles)
      .orderBy(desc(roles.createdAt));

    // Return default roles + custom roles from database
    const defaultRoles = Object.entries(rolePermissions).map(
      ([name, permissions]) => ({
        id: name,
        name,
        description: getRoleDescription(name as UserRole),
        permissions,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    // Parse permissions from JSONB and format custom roles
    const formattedCustomRoles = customRolesFromDb.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse((role.permissions as string) || "[]"),
      isDefault: role.isDefault,
      createdBy: role.createdBy,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));

    const response = NextResponse.json([
      ...defaultRoles,
      ...formattedCustomRoles,
    ]);

    // Add caching headers for long-lived cache
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
    );
    response.headers.set("ETag", `"roles-${Date.now()}"`);

    return response;
  } catch (error: any) {
    console.error("Error fetching roles:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Admin access required to view roles" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin permission to create roles
    await assertPermission(request, "roles_create_custom");

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    // Validate input
    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Name and permissions array are required" },
        { status: 400 }
      );
    }

    // Check if role already exists (system role or custom role)
    if (isValidRole(name)) {
      return NextResponse.json(
        { error: "Cannot create role with system role name" },
        { status: 409 }
      );
    }

    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name));

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 409 }
      );
    }

    // Create new custom role in database
    const newRoleData = await db
      .insert(roles)
      .values({
        name,
        description: description || "",
        permissions: permissions, // JSONB field handles array directly
        isDefault: false,
        createdBy: user.id,
      })
      .returning();

    const createdRole = newRoleData[0];

    // Format response
    const formattedRole = {
      id: createdRole.id,
      name: createdRole.name,
      description: createdRole.description || "",
      permissions: Array.isArray(createdRole.permissions)
        ? createdRole.permissions
        : JSON.parse((createdRole.permissions as string) || "[]"),
      isDefault: createdRole.isDefault,
      createdBy: createdRole.createdBy,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
    };

    // Log audit event
    const currentUser = await getUserWithRole(request);
    if (currentUser) {
      await auditLogRoleCreate(request, currentUser, formattedRole);
    }

    return NextResponse.json(formattedRole, { status: 201 });
  } catch (error: any) {
    console.error("Error creating role:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Admin access required to create roles" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require admin permission to edit roles
    await assertPermission(request, "roles_edit_permissions");

    const body = await request.json();
    const { originalName, name, description, permissions } = body;

    // Validate input
    if (!originalName || !name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Original name, name, and permissions array are required" },
        { status: 400 }
      );
    }

    // Cannot edit default system roles
    if (isValidRole(originalName)) {
      return NextResponse.json(
        { error: "Cannot modify default system roles" },
        { status: 400 }
      );
    }

    // Find the role in database
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, originalName))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const role = existingRole[0];

    // Cannot edit default roles (double check)
    if (role.isDefault) {
      return NextResponse.json(
        { error: "Cannot modify default system roles" },
        { status: 400 }
      );
    }

    // Check if new name conflicts with existing role (if name is changing)
    if (name !== originalName) {
      if (isValidRole(name)) {
        return NextResponse.json(
          { error: "Cannot use system role name" },
          { status: 409 }
        );
      }

      const nameConflict = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

      if (nameConflict.length > 0) {
        return NextResponse.json(
          { error: "Role name already exists" },
          { status: 409 }
        );
      }
    }

    // Store before value for audit log
    const beforeValue = {
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse((role.permissions as string) || "[]"),
      isDefault: role.isDefault,
    };

    // Update the role in database
    const updatedRoleData = await db
      .update(roles)
      .set({
        name,
        description: description || "",
        permissions: permissions, // JSONB field handles array directly
        updatedAt: new Date(),
      })
      .where(eq(roles.id, role.id))
      .returning();

    const updatedRole = updatedRoleData[0];

    // Format response
    const formattedRole = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description || "",
      permissions: Array.isArray(updatedRole.permissions)
        ? updatedRole.permissions
        : JSON.parse((updatedRole.permissions as string) || "[]"),
      isDefault: updatedRole.isDefault,
      createdBy: updatedRole.createdBy,
      createdAt: updatedRole.createdAt.toISOString(),
      updatedAt: updatedRole.updatedAt.toISOString(),
    };

    // Log audit event
    const currentUser = await getUserWithRole(request);
    if (currentUser) {
      await auditLogRoleUpdate(
        request,
        currentUser,
        formattedRole,
        beforeValue
      );
    }

    return NextResponse.json(formattedRole);
  } catch (error: any) {
    console.error("Error updating role:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Admin access required to edit roles" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin permission to delete roles
    await assertPermission(request, "roles_delete");

    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Cannot delete default system roles
    if (isValidRole(name)) {
      return NextResponse.json(
        { error: "Cannot delete default system roles" },
        { status: 400 }
      );
    }

    // Find the role in database
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name));

    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const role = existingRole[0];

    // Cannot delete default roles (double check)
    if (role.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default system roles" },
        { status: 400 }
      );
    }

    // TODO: Check if any users are assigned this role before deleting
    // This would require querying the appUsers table to see if any users have this role
    // For now, we'll allow deletion but this should be implemented for production

    // Store role data for audit log before deletion
    const roleData = {
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse((role.permissions as string) || "[]"),
      isDefault: role.isDefault,
    };

    // Delete the role from database
    await db.delete(roles).where(eq(roles.id, role.id));

    // Log audit event
    const currentUser = await getUserWithRole(request);
    if (currentUser) {
      await auditLogRoleDelete(request, currentUser, roleData);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting role:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Admin access required to delete roles" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin:
      "System Administrator - Full system access with complete administrative privileges",
    ops: "Operations Lead - Manages field deployments and coordinates response operations",
    field:
      "Field Reporter - Front-line personnel capturing real-time data and status updates",
    analyst:
      "Insights Analyst - Data analysis specialist focused on reporting and trend analysis",
    needs:
      "Needs Reporter - Limited role specifically for reporting people needs only",
  };
  return descriptions[role];
}
