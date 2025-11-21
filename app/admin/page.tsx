'use client'
import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import "./../global.css"

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  device: string;
  beforeValue?: string;
  afterValue?: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

// Mock data
const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', lastLogin: '2025-11-19 10:30', createdAt: '2025-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active', lastLogin: '2025-11-18 14:20', createdAt: '2025-02-20' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'Viewer', status: 'suspended', lastLogin: '2025-11-10 09:15', createdAt: '2025-03-10' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'active', lastLogin: '2025-11-19 08:45', createdAt: '2025-04-05' },
];

const mockRoles: Role[] = [
  { id: '1', name: 'Admin', permissions: ['view_users', 'edit_users', 'delete_users', 'view_missions', 'edit_missions', 'approve_missions'] },
  { id: '2', name: 'Editor', permissions: ['view_users', 'view_missions', 'edit_missions'] },
  { id: '3', name: 'Viewer', permissions: ['view_missions'] },
];

const mockAuditLogs: AuditLog[] = [
  { id: '1', action: 'User Login', user: 'John Doe', timestamp: '2025-11-19 10:30:15', details: 'Successful login', ipAddress: '192.168.1.1', device: 'Chrome on Windows' },
  { id: '2', action: 'User Updated', user: 'Admin', timestamp: '2025-11-19 09:15:22', details: 'Updated user role', ipAddress: '192.168.1.5', device: 'Firefox on Mac', beforeValue: 'Editor', afterValue: 'Admin' },
  { id: '3', action: 'User Suspended', user: 'Admin', timestamp: '2025-11-18 16:45:10', details: 'Suspended user account', ipAddress: '192.168.1.5', device: 'Chrome on Windows' },
];

export const App: React.FC = () => {
  const [users] = useState<User[]>(mockUsers);
  const [roles] = useState<Role[]>(mockRoles);
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    requireTwoFactor: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });
  const [settingsChanged, setSettingsChanged] = useState(false);

  const handleSettingChange = (key: keyof SystemSettings, value: boolean | number) => {
    setSettings({ ...settings, [key]: value });
    setSettingsChanged(true);
  };

  const handleSaveSettings = () => {
    alert('Settings saved successfully');
    setSettingsChanged(false);
  };

  const handleRevertSettings = () => {
    setSettings({
      maintenanceMode: false,
      requireTwoFactor: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
    });
    setSettingsChanged(false);
  };

  return (
    <div className="">
      <div className="">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black bg-clip-text tracking-tight">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Active</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
                <p className="text-4xl font-bold text-gray-900 mb-3">
                  {users.filter(u => u.status === 'active').length}
                </p>
                <div className="text-sm text-gray-500">
                  <span className="text-green-600 font-medium">↑ 12%</span> from last month
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Suspended</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Suspended Users</h3>
                <p className="text-4xl font-bold text-gray-900 mb-3">
                  {users.filter(u => u.status === 'suspended').length}
                </p>
                <div className="text-sm text-gray-500">
                  Requires attention
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Total</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Roles</h3>
                <p className="text-4xl font-bold text-gray-900 mb-3">{roles.length}</p>
                <div className="text-sm text-gray-500">
                  Permission groups
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600 mt-1">Latest system events and changes</p>
                </div>

              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {auditLogs.slice(0, 5).map((log, index) => (
                <div
                  key={log.id}
                  className="p-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${log.action.includes('Login') ? 'bg-green-100' :
                      log.action.includes('Updated') ? 'bg-blue-100' :
                        'bg-orange-100'
                      }`}>
                      {log.action.includes('Login') && (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      )}
                      {log.action.includes('Updated') && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      )}
                      {log.action.includes('Suspended') && (
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {log.action}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                          <p className="text-xs text-gray-500 mt-2">by {log.user}</p>
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">API Status</span>
                  </div>
                  <span className="text-sm text-green-600 font-semibold">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Database</span>
                  </div>
                  <span className="text-sm text-green-600 font-semibold">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Storage</span>
                  </div>
                  <span className="text-sm text-yellow-600 font-semibold">85% Used</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Users</span>
                  <span className="text-sm font-bold text-gray-900">{users.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Active Sessions</span>
                  <span className="text-sm font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">System Uptime</span>
                  <span className="text-sm font-bold text-gray-900">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;