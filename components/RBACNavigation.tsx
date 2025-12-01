/**
 * RBAC Navigation Component
 * Shows navigation items based on user permissions
 */

'use client';

import Link from 'next/link';
import { useUser, usePermission } from '../hooks/usePermissions';

export default function RBACNavigation() {
  const { user, isAuthenticated } = useUser();
  const { hasPermission: canViewDashboard } = usePermission('dashboard_view');
  const { hasPermission: canManageUsers } = usePermission('users_view_directory');
  const { hasPermission: canViewAssets } = usePermission('assets_view');
  const { hasPermission: canAccessAdmin } = usePermission('system_access_settings');

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Weather Updates
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/rbac-demo"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                RBAC Demo
              </Link>
              <a
                href="/api/auth/sign-in"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Weather Updates
            </Link>
            
            {/* Navigation Links Based on Permissions */}
            <div className="hidden md:flex space-x-6">
              <Link
                href="/rbac-demo"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                RBAC Demo
              </Link>
              
              {canViewDashboard && (
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              
              {canViewAssets && (
                <Link
                  href="/assets"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Assets
                </Link>
              )}
              
              {canManageUsers && (
                <Link
                  href="/users"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Users
                </Link>
              )}
              
              {canAccessAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-red-50 text-red-600"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-600">Welcome, </span>
              <span className="font-medium text-gray-900">
                {user?.fullName || user?.name || user?.email}
              </span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                {user?.role}
              </span>
            </div>
            <a
              href="/api/auth/sign-out"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
