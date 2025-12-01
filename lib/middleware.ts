/**
 * Access Control Middleware for Weather Updates System
 * Provides route protection and permission checking for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { db } from './db';
import { appUsers } from './db/schema';
import { eq } from 'drizzle-orm';
import type { Permission, UserRole, UserWithRole } from './permissions';
import { 
  getPermissionsForRole, 
  roleHasPermission, 
  roleHasAnyPermission, 
  roleHasAllPermissions,
  isValidRole 
} from './permissions';

/**
 * Error class for permission-related errors
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_ROLE' | 'MISSING_PERMISSION',
    public requiredPermissions?: Permission[],
    public userRole?: UserRole
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Get user with role and permissions from session
 */
export async function getUserWithRole(request: Request): Promise<UserWithRole | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
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
      throw new PermissionError(
        'User not found in application database',
        'INVALID_ROLE'
      );
    }

    const userData = appUser[0];
    
    if (!isValidRole(userData.role)) {
      throw new PermissionError(
        `Invalid user role: ${userData.role}`,
        'INVALID_ROLE'
      );
    }

    const userRole = userData.role as UserRole;

    return {
      id: userData.id,
      email: userData.email,
      name: session.user.name,
      image: session.user.image,
      role: userRole,
      canViewSensitiveData: userData.canViewSensitiveData,
      canExportData: userData.canExportData,
      canManageUsers: userData.canManageUsers,
      canCreateDeployments: roleHasPermission(userRole, 'deployments_create'),
      canAssignForms: roleHasPermission(userRole, 'forms_assign'),
      canApproveRequests: roleHasPermission(userRole, 'relief_approve_requests'),
      canAccessAdmin: roleHasPermission(userRole, 'system_access_settings'),
      canSubmitPeopleNeeds: roleHasPermission(userRole, 'form_people_needs'),
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
    console.error('Error getting user with role:', error);
    return null;
  }
}

/**
 * Check if user has required permission(s)
 */
export async function checkUserPermission(
  request: Request,
  permission: Permission | Permission[],
  requireAll: boolean = true
): Promise<{ hasPermission: boolean; user: UserWithRole | null; missingPermissions?: Permission[] }> {
  const user = await getUserWithRole(request);

  if (!user) {
    return { hasPermission: false, user: null };
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  
  let hasPermission: boolean;
  let missingPermissions: Permission[] = [];

  if (requireAll) {
    hasPermission = roleHasAllPermissions(user.role, permissions);
    if (!hasPermission) {
      const userPermissions = getPermissionsForRole(user.role);
      missingPermissions = permissions.filter(p => !userPermissions.includes(p));
    }
  } else {
    hasPermission = roleHasAnyPermission(user.role, permissions);
    if (!hasPermission) {
      missingPermissions = permissions;
    }
  }

  return { 
    hasPermission, 
    user, 
    missingPermissions: missingPermissions.length > 0 ? missingPermissions : undefined 
  };
}

/**
 * Helper function for API routes - throws errors instead of returning responses
 */
export async function assertPermission(
  request: Request,
  permission: Permission | Permission[],
  requireAll: boolean = true
): Promise<UserWithRole> {
  const { hasPermission, user, missingPermissions } = await checkUserPermission(
    request,
    permission,
    requireAll
  );

  if (!user) {
    throw new PermissionError(
      'Authentication required',
      'UNAUTHORIZED'
    );
  }

  if (!hasPermission) {
    throw new PermissionError(
      'Insufficient permissions',
      'FORBIDDEN',
      missingPermissions,
      user.role
    );
  }

  return user;
}

/**
 * Helper function for API routes - assert any permission (OR logic)
 */
export async function assertAnyPermission(
  request: Request,
  permissions: Permission[]
): Promise<UserWithRole> {
  return assertPermission(request, permissions, false);
}

/**
 * Helper function for API routes - assert all permissions (AND logic)
 */
export async function assertAllPermissions(
  request: Request,
  permissions: Permission[]
): Promise<UserWithRole> {
  return assertPermission(request, permissions, true);
}

/**
 * Helper function for API routes - assert role
 */
export async function assertRole(
  request: Request,
  roles: UserRole | UserRole[]
): Promise<UserWithRole> {
  const user = await getUserWithRole(request);

  if (!user) {
    throw new PermissionError(
      'Authentication required',
      'UNAUTHORIZED'
    );
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasRole = allowedRoles.includes(user.role);

  if (!hasRole) {
    throw new PermissionError(
      'Insufficient role privileges',
      'FORBIDDEN',
      undefined,
      user.role
    );
  }

  return user;
}

/**
 * Helper function for API routes - assert authentication
 */
export async function assertAuth(request: Request): Promise<UserWithRole> {
  const user = await getUserWithRole(request);

  if (!user) {
    throw new PermissionError(
      'Authentication required',
      'UNAUTHORIZED'
    );
  }

  return user;
}