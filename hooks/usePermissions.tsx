/**
 * React Hooks for Client-Side Permission Checking
 * Provides reactive permission checking for UI components
 * Now uses cached data from UserProvider for optimal performance
 */

'use client';

import React, { useCallback } from 'react';
import { useUserContext } from '../providers/UserProvider';
import type { Permission, UserRole, UserWithRole } from '../lib/permissions';
import {
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
} from '../lib/permissions';

/**
 * Hook return types
 */
export interface UsePermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
  error?: Error;
}

export interface UsePermissionsResult {
  permissions: Permission[];
  role: UserRole | null;
  isLoading: boolean;
  error?: Error;
  hasPermission: (permission: Permission | Permission[], requireAll?: boolean) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

export interface UseRoleResult {
  role: UserRole | null;
  isLoading: boolean;
  error?: Error;
}

export interface UseUserResult {
  user: UserWithRole | null;
  isLoading: boolean;
  error?: Error;
  isAuthenticated: boolean;
}

/**
 * Custom hook to get current user with role and permissions
 * Now uses cached data from UserProvider
 */
export function useUser(): UseUserResult {
  const { user, isLoading, error, isAuthenticated } = useUserContext();

  return {
    user,
    isLoading,
    error: error || undefined,
    isAuthenticated,
  };
}

/**
 * Custom hook to check if user has specific permission(s)
 * Now uses cached data from UserProvider
 */
export function usePermission(
  permission: Permission | Permission[],
  requireAll: boolean = true
): UsePermissionResult {
  const { user, isLoading, error } = useUserContext();

  const hasPermission = React.useMemo(() => {
    if (!user) return false;

    const permissions = Array.isArray(permission) ? permission : [permission];

    if (requireAll) {
      return roleHasAllPermissions(user.role, permissions);
    } else {
      return roleHasAnyPermission(user.role, permissions);
    }
  }, [user, permission, requireAll]);

  return {
    hasPermission,
    isLoading,
    error: error || undefined,
  };
}

/**
 * Custom hook to get all current user permissions and role
 * Now uses cached data from UserProvider
 */
export function usePermissions(): UsePermissionsResult {
  const { user, isLoading, error, permissions, role } = useUserContext();

  const hasPermission = useCallback((
    permission: Permission | Permission[],
    requireAll: boolean = true
  ): boolean => {
    if (!user) return false;

    const perms = Array.isArray(permission) ? permission : [permission];

    if (requireAll) {
      return roleHasAllPermissions(user.role, perms);
    } else {
      return roleHasAnyPermission(user.role, perms);
    }
  }, [user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return hasPermission(permissions, false);
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return hasPermission(permissions, true);
  }, [hasPermission]);

  return {
    permissions,
    role,
    isLoading,
    error: error || undefined,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * Custom hook to get current user role
 * Now uses cached data from UserProvider
 */
export function useRole(): UseRoleResult {
  const { role, isLoading, error } = useUserContext();

  return {
    role,
    isLoading,
    error: error || undefined,
  };
}

/**
 * Custom hook to check if user has any of the specified permissions (OR logic)
 */
export function useHasAnyPermission(permissions: Permission[]): UsePermissionResult {
  return usePermission(permissions, false);
}

/**
 * Custom hook to check if user has all specified permissions (AND logic)
 */
export function useHasAllPermissions(permissions: Permission[]): UsePermissionResult {
  return usePermission(permissions, true);
}

/**
 * Custom hook to check if user has specific role(s)
 * Now uses cached data from UserProvider
 */
export function useHasRole(roles: UserRole | UserRole[]): UsePermissionResult {
  const { user, isLoading, error } = useUserContext();

  const hasRole = React.useMemo(() => {
    if (!user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  }, [user, roles]);

  return {
    hasPermission: hasRole,
    isLoading,
    error: error || undefined,
  };
}

/**
 * Custom hook to check if user is authenticated
 * Now uses cached data from UserProvider
 */
export function useIsAuthenticated(): UsePermissionResult {
  const { isAuthenticated, isLoading, error } = useUserContext();

  return {
    hasPermission: isAuthenticated,
    isLoading,
    error: error || undefined,
  };
}

/**
 * Custom hook to check if user is admin
 */
export function useIsAdmin(): UsePermissionResult {
  return useHasRole('admin');
}

/**
 * Custom hook to check permission flags
 * Now uses cached data from UserProvider
 */
export function usePermissionFlags() {
  const { user, isLoading, error } = useUserContext();

  return {
    canViewSensitiveData: user?.canViewSensitiveData || false,
    canExportData: user?.canExportData || false,
    canManageUsers: user?.canManageUsers || false,
    canCreateDeployments: user?.canCreateDeployments || false,
    canAssignForms: user?.canAssignForms || false,
    canApproveRequests: user?.canApproveRequests || false,
    canAccessAdmin: user?.canAccessAdmin || false,
    canSubmitPeopleNeeds: user?.canSubmitPeopleNeeds || false,
    isLoading,
    error: error || undefined,
  };
}

/**
 * Custom hook to get roles data
 * Uses cached data from UserProvider
 */
export function useRoles() {
  const { roles, rolesLoading, rolesError, refetchRoles } = useUserContext();

  return {
    roles,
    isLoading: rolesLoading,
    error: rolesError || undefined,
    refetch: refetchRoles,
  };
}

/**
 * Permission-based component wrapper
 */
export function PermissionGate({
  permission,
  requireAll = true,
  fallback = null,
  children,
}: {
  permission: Permission | Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission, isLoading } = usePermission(permission, requireAll);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Role-based component wrapper
 */
export function RoleGate({
  roles,
  fallback = null,
  children,
}: {
  roles: UserRole | UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission: hasRole, isLoading } = useHasRole(roles);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Authentication gate component
 */
export function AuthGate({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission: isAuthenticated, isLoading } = useIsAuthenticated();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll: boolean = true,
  fallback?: React.ComponentType<P> | React.ReactElement | null
) {
  return function PermissionWrapper(props: P) {
    const { hasPermission, isLoading } = usePermission(permission, requireAll);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!hasPermission) {
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        const FallbackComponent = fallback as React.ComponentType<P>;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component for role-based rendering
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  roles: UserRole | UserRole[],
  fallback?: React.ComponentType<P> | React.ReactElement | null
) {
  return function RoleWrapper(props: P) {
    const { hasPermission: hasRole, isLoading } = useHasRole(roles);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!hasRole) {
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        const FallbackComponent = fallback as React.ComponentType<P>;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}