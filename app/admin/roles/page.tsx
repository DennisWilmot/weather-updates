'use client'
import { Edit2, Plus, Search, Shield, Users, X } from 'lucide-react';
import React, { useState } from 'react'

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  userCount?: number;
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access',
    permissions: ['view_users', 'edit_users', 'delete_users', 'view_missions', 'edit_missions', 'approve_missions', 'view_settings', 'edit_settings'],
    userCount: 3
  },
  {
    id: '2',
    name: 'Supervisor',
    description: 'Can edit content',
    permissions: ['view_users', 'view_missions', 'edit_missions'],
    userCount: 12
  },
  {
    id: '3',
    name: 'Responder',
    description: 'Read-only access',
    permissions: ['view_missions'],
    userCount: 45
  },

];

const allPermissions = [
  { id: 'view_users', name: 'View Users', category: 'Users' },
  { id: 'edit_users', name: 'Edit Users', category: 'Users' },
  { id: 'delete_users', name: 'Delete Users', category: 'Users' },
  { id: 'view_missions', name: 'View Missions', category: 'Missions' },
  { id: 'edit_missions', name: 'Edit Missions', category: 'Missions' },
  { id: 'delete_missions', name: 'Delete Missions', category: 'Missions' },
  { id: 'approve_missions', name: 'Approve Missions', category: 'Missions' },
  { id: 'view_settings', name: 'View Settings', category: 'Settings' },
  { id: 'edit_settings', name: 'Edit Settings', category: 'Settings' },
];

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleTogglePermission = (permission: string) => {
    if (!selectedRole) return;

    const hasPermission = selectedRole.permissions.includes(permission);
    const updatedPermissions = hasPermission
      ? selectedRole.permissions.filter(p => p !== permission)
      : [...selectedRole.permissions, permission];

    const updatedRole = { ...selectedRole, permissions: updatedPermissions };
    setSelectedRole(updatedRole);

    setRoles(roles.map(role =>
      role.id === updatedRole.id ? updatedRole : role
    ));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['all', ...Array.from(new Set(allPermissions.map(p => p.category)))];

  const filteredPermissions = selectedCategory === 'all'
    ? allPermissions
    : allPermissions.filter(p => p.category === selectedCategory);

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-black bg-clip-text tracking-tight">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage user roles and their permissions</p>
        </div>
        <button
          onClick={() => {
            setSelectedRole({
              id: Date.now().toString(),
              name: '',
              description: '',
              permissions: [],
              userCount: 0
            });
            setShowRoleModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#1a1a3c] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus size={20} />
          Create Role
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(role => (
          <div
            key={role.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1a1a3c] rounded-lg flex items-center justify-center shadow-sm">
                    <Shield className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRole(role);
                    setShowRoleModal(true);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>{role.userCount} users</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield size={16} className="text-gray-400" />
                  <span>{role.permissions.length} permissions</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Key Permissions
                </p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map(perm => (
                    <span
                      key={perm}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      {perm.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showRoleModal && selectedRole && (
        <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-[#1a1a3c] p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedRole.name ? 'Edit Role' : 'Create New Role'}
                  </h2>
                  <p className="text-blue-100 text-sm">Configure role permissions</p>
                </div>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedRole(null);
                    setSelectedCategory('all');
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={selectedRole.name}
                    onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={selectedRole.description || ''}
                    onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                        ? 'bg-[#1a1a3c] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Permissions ({selectedRole.permissions.length} selected)
                </label>

                {selectedCategory === 'all' ? (
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {perms.map(permission => {
                            const isChecked = selectedRole.permissions.includes(permission.id);
                            return (
                              <label key={permission.id} className="group relative flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(permission.id)}
                                  className="sr-only"
                                />
                                <div className={`relative w-5 h-5 rounded-md border-2 transition-all ${isChecked ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'
                                  }`}>
                                  {isChecked && (
                                    <svg className="absolute inset-0 w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {permission.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredPermissions.map(permission => {
                        const isChecked = selectedRole.permissions.includes(permission.id);
                        return (
                          <label key={permission.id} className="group relative flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(permission.id)}
                              className="sr-only"
                            />
                            <div className={`relative w-5 h-5 rounded-md border-2 transition-all ${isChecked ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'
                              }`}>
                              {isChecked && (
                                <svg className="absolute inset-0 w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>
                              {permission.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                  setSelectedCategory('all');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                  setSelectedCategory('all');
                }}
                className="px-6 py-2 bg-[#1a1a3c] text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}