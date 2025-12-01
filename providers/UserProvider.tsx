'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from '../lib/auth-client';
import type { Permission, UserRole, UserWithRole } from '../lib/permissions';
import { AppCache, CACHE_KEYS, CACHE_EXPIRY } from '../lib/cache';

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserContextValue {
  // User state
  user: UserWithRole | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  
  // Roles state
  roles: RoleDefinition[];
  rolesLoading: boolean;
  rolesError: Error | null;
  
  // Actions
  refetchUser: () => Promise<void>;
  refetchRoles: () => Promise<void>;
  clearCache: () => void;
  
  // Derived state
  permissions: Permission[];
  role: UserRole | null;
}

const UserContext = createContext<UserContextValue | null>(null);


interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // Session from Better Auth
  const { data: session, isPending: sessionLoading } = useSession();
  
  // User state
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Roles state
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<Error | null>(null);
  
  // Refs to prevent duplicate requests
  const userFetchRef = useRef<Promise<void> | null>(null);
  const rolesFetchRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  // Initialize cache on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Try to load user from cache first
    const cachedUser = AppCache.get<UserWithRole>(CACHE_KEYS.USER);
    if (cachedUser && session?.user) {
      setUser(cachedUser);
      setIsLoading(false);
    }
    
    // Try to load roles from cache first
    const cachedRoles = AppCache.get<RoleDefinition[]>(CACHE_KEYS.ROLES);
    if (cachedRoles) {
      setRoles(cachedRoles);
      setRolesLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [session?.user]);

  // Fetch user data
  const fetchUser = useCallback(async (): Promise<void> => {
    // Prevent duplicate requests
    if (userFetchRef.current) {
      return userFetchRef.current;
    }

    // Don't fetch if no session
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      setError(null);
      AppCache.remove(CACHE_KEYS.USER);
      return;
    }

    // Check cache first
    const cachedUser = AppCache.get<UserWithRole>(CACHE_KEYS.USER);
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchPromise = (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/auth/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData: UserWithRole = await response.json();
        
        if (mountedRef.current) {
          setUser(userData);
          setError(null);
          
          // Cache the user data
          AppCache.set(CACHE_KEYS.USER, userData, { expiry: CACHE_EXPIRY.USER });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        const error = err instanceof Error ? err : new Error('Failed to fetch user data');
        
        if (mountedRef.current) {
          setError(error);
          setUser(null);
          AppCache.remove(CACHE_KEYS.USER);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
        userFetchRef.current = null;
      }
    })();

    userFetchRef.current = fetchPromise;
    return fetchPromise;
  }, [session?.user]);

  // Fetch roles data
  const fetchRoles = useCallback(async (): Promise<void> => {
    // Prevent duplicate requests
    if (rolesFetchRef.current) {
      return rolesFetchRef.current;
    }

    // Check cache first
    const cachedRoles = AppCache.get<RoleDefinition[]>(CACHE_KEYS.ROLES);
    if (cachedRoles) {
      setRoles(cachedRoles);
      setRolesLoading(false);
      setRolesError(null);
      return;
    }

    const fetchPromise = (async () => {
      try {
        setRolesLoading(true);
        setRolesError(null);

        const response = await fetch('/api/roles', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          // Add cache headers for long-lived caching
          cache: 'force-cache',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.status}`);
        }

        const rolesData: RoleDefinition[] = await response.json();
        
        if (mountedRef.current) {
          setRoles(rolesData);
          setRolesError(null);
          
          // Cache the roles data with longer expiry
          AppCache.set(CACHE_KEYS.ROLES, rolesData, { expiry: CACHE_EXPIRY.ROLES });
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        const error = err instanceof Error ? err : new Error('Failed to fetch roles');
        
        if (mountedRef.current) {
          setRolesError(error);
          setRoles([]);
          AppCache.remove(CACHE_KEYS.ROLES);
        }
      } finally {
        if (mountedRef.current) {
          setRolesLoading(false);
        }
        rolesFetchRef.current = null;
      }
    })();

    rolesFetchRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  // Effect to fetch user when session changes
  useEffect(() => {
    if (!sessionLoading) {
      fetchUser();
    }
  }, [sessionLoading, fetchUser]);

  // Effect to fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Clear cache function
  const clearCache = useCallback(() => {
    AppCache.clear('weather-app-');
    setUser(null);
    setRoles([]);
    setError(null);
    setRolesError(null);
    
    // Refetch if we have a session
    if (session?.user) {
      fetchUser();
      fetchRoles();
    }
  }, [session?.user, fetchUser, fetchRoles]);

  // Derived state
  const permissions = user?.permissions || [];
  const role = user?.role || null;
  const isAuthenticated = !!user;

  // Context value
  const contextValue: UserContextValue = {
    user,
    isLoading: sessionLoading || isLoading,
    error,
    isAuthenticated,
    
    roles,
    rolesLoading,
    rolesError,
    
    refetchUser: fetchUser,
    refetchRoles: fetchRoles,
    clearCache,
    
    permissions,
    role,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the user context
export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Export the context for advanced usage
export { UserContext };
