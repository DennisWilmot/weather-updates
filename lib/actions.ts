/**
 * Server Action Helpers for Permission Checking
 * Provides utilities for checking permissions in server actions and components
 */

"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { appUsers } from "./db/schema";
import { eq } from "drizzle-orm";
import type { Permission, UserRole, UserWithRole } from "./permissions";
import {
  getPermissionsForRole,
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
  isValidRole,
} from "./permissions";

/**
 * Get current user with role and permissions
 */
export async function getCurrentUser(): Promise<UserWithRole | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return null;
    }

    // Fetch user role and permissions from appUsers table
    const appUser = await db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        firstName: appUsers.firstName,
        lastName: appUsers.lastName,
        fullName: appUsers.fullName,
        phoneNumber: appUsers.phoneNumber,
        imageUrl: appUsers.imageUrl,
        role: appUsers.role,
        organization: appUsers.organization,
        department: appUsers.department,
        canViewSensitiveData: appUsers.canViewSensitiveData,
        canExportData: appUsers.canExportData,
        canManageUsers: appUsers.canManageUsers,
        lastActiveAt: appUsers.lastActiveAt,
        createdAt: appUsers.createdAt,
        updatedAt: appUsers.updatedAt,
        username: appUsers.username,
      })
      .from(appUsers)
      .where(eq(appUsers.email, session.user.email))
      .limit(1);

    if (appUser.length === 0) {
      return null;
    }

    const userData = appUser[0];

    if (!isValidRole(userData.role)) {
      return null;
    }

    const userRole = userData.role as UserRole;

    return {
      id: userData.id,
      email: userData.email,
      name: session.user.name || undefined,
      image: session.user.image || undefined,
      role: userRole,
      permissions: getPermissionsForRole(userRole),
      canViewSensitiveData: userData.canViewSensitiveData,
      canExportData: userData.canExportData,
      canManageUsers: userData.canManageUsers,
      canCreateDeployments: roleHasPermission(userRole, "deployments_create"),
      canAssignForms: roleHasPermission(userRole, "forms_assign"),
      canApproveRequests: roleHasPermission(
        userRole,
        "relief_approve_requests"
      ),
      canAccessAdmin: roleHasPermission(userRole, "system_access_settings"),
      canSubmitPeopleNeeds: roleHasPermission(userRole, "form_people_needs"),
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      fullName: userData.fullName || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      imageUrl: userData.imageUrl || undefined,
      organization: userData.organization || undefined,
      department: userData.department || undefined,
      username: userData.username || undefined,
      lastActiveAt: userData.lastActiveAt || undefined,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<Permission[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return getPermissionsForRole(user.role);
}

/**
 * Check if current user has specific permission(s)
 */
export async function checkPermission(
  permission: Permission | Permission[],
  requireAll: boolean = true
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const permissions = Array.isArray(permission) ? permission : [permission];

  if (requireAll) {
    return roleHasAllPermissions(user.role, permissions);
  } else {
    return roleHasAnyPermission(user.role, permissions);
  }
}

/**
 * Check if current user has any of the specified permissions (OR logic)
 */
export async function hasAnyPermission(
  permissions: Permission[]
): Promise<boolean> {
  return checkPermission(permissions, false);
}

/**
 * Check if current user has all specified permissions (AND logic)
 */
export async function hasAllPermissions(
  permissions: Permission[]
): Promise<boolean> {
  return checkPermission(permissions, true);
}

/**
 * Check if current user has specific role(s)
 */
export async function hasRole(roles: UserRole | UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
}

/**
 * Assert that current user has specific permission(s) - throws error if not
 */
export async function assertPermission(
  permission: Permission | Permission[],
  requireAll: boolean = true
): Promise<UserWithRole> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const hasPermission = await checkPermission(permission, requireAll);

  if (!hasPermission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const userPermissions = getPermissionsForRole(user.role);
    const missingPermissions = permissions.filter(
      (p) => !userPermissions.includes(p)
    );

    throw new Error(
      `Insufficient permissions. Required: ${permissions.join(", ")}. Missing: ${missingPermissions.join(", ")}`
    );
  }

  return user;
}

/**
 * Assert that current user has any of the specified permissions (OR logic)
 */
export async function assertAnyPermission(
  permissions: Permission[]
): Promise<UserWithRole> {
  return assertPermission(permissions, false);
}

/**
 * Assert that current user has all specified permissions (AND logic)
 */
export async function assertAllPermissions(
  permissions: Permission[]
): Promise<UserWithRole> {
  return assertPermission(permissions, true);
}

/**
 * Assert that current user has specific role(s)
 */
export async function assertRole(
  roles: UserRole | UserRole[]
): Promise<UserWithRole> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Insufficient role privileges. Required: ${allowedRoles.join(", ")}. Current: ${user.role}`
    );
  }

  return user;
}

/**
 * Assert that user is authenticated
 */
export async function assertAuth(): Promise<UserWithRole> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("admin");
}
