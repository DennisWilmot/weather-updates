'use client';

import {
  Box,
  Stack,
  Group,
  Paper,
  Button,
  Text,
  Title,
  Badge,
  TextInput,
  Modal,
  SimpleGrid,
  Checkbox,
  Skeleton,
} from '@mantine/core';
import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconShield,
  IconUsers,
  IconX,
  IconTrash,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import React, { useEffect, useState } from 'react';
import { rolePermissions, permissionCategories, getPermissionCategory } from '../../../lib/permissions';
import type { Permission, UserRole } from '../../../lib/permissions';
import { toast } from 'sonner';

// Helper function to get role-specific colors
const getRoleColor = (roleName: string): string => {
  const colors: Record<string, string> = {
    admin: '#dc2626', // red
    ops: '#ea580c', // orange
    field: '#16a34a', // green
    analyst: '#2563eb', // blue
    needs: '#7c3aed', // purple
  };
  return colors[roleName] || '#1a1a3c';
};

interface Role {
  name: string;
  description?: string;
  permissions: Permission[];
  userCount?: number; // optional, for UI display
  originalName?: string; // used when renaming
}

// Generate all permissions with proper categorization from our RBAC system
const allPermissions = Object.keys(rolePermissions).reduce((acc, role) => {
  rolePermissions[role as UserRole].forEach(permission => {
    if (!acc.find(p => p.id === permission)) {
      const category = permission.split('_')[0];
      const categoryName = permissionCategories[category as keyof typeof permissionCategories] || 'Other';
      const displayName = permission
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      acc.push({
        id: permission,
        name: displayName,
        category: categoryName
      });
    }
  });
  return acc;
}, [] as { id: Permission; name: string; category: string }[])
  .sort((a, b) => {
    // Sort by category first, then by name
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

// Default roles from our RBAC system
const defaultRoles: Role[] = [
  {
    name: 'admin',
    description: 'System Administrator - Full system access with complete administrative privileges',
    permissions: rolePermissions.admin,
    userCount: 0
  },
  {
    name: 'ops',
    description: 'Operations Lead - Manages field deployments and coordinates response operations',
    permissions: rolePermissions.ops,
    userCount: 0
  },
  {
    name: 'field',
    description: 'Field Reporter - Front-line personnel capturing real-time data and status updates',
    permissions: rolePermissions.field,
    userCount: 0
  },
  {
    name: 'analyst',
    description: 'Insights Analyst - Data analysis specialist focused on reporting and trend analysis',
    permissions: rolePermissions.analyst,
    userCount: 0
  },
  {
    name: 'needs',
    description: 'Needs Reporter - Limited role specifically for reporting people needs only',
    permissions: rolePermissions.needs,
    userCount: 0
  }
];

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, { open: openRoleModal, close: closeRoleModal }] =
    useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load roles on mount
  useEffect(() => {
    // Try to fetch from API, fallback to default roles
    fetch('/api/roles')
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('API not available');
      })
      .then((data) => {
        setRoles(
          data.map((r: any) => ({
            ...r,
            userCount: Math.floor(Math.random() * 50), // mock count
          }))
        );
      })
      .catch(() => {
        // Fallback to default roles if API is not available
        console.log('Using default RBAC roles');
        setRoles(defaultRoles.map(role => ({
          ...role,
          userCount: Math.floor(Math.random() * 50)
        })));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Toggle permissions inside modal
  const handleTogglePermission = (permission: Permission) => {
    if (!selectedRole) return;

    const updatedPermissions = selectedRole.permissions.includes(permission)
      ? selectedRole.permissions.filter((p) => p !== permission)
      : [...selectedRole.permissions, permission];

    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
  };

  // Select all permissions
  const handleSelectAll = () => {
    if (!selectedRole) return;

    const allPermissionIds = allPermissions.map(p => p.id);
    setSelectedRole({ ...selectedRole, permissions: allPermissionIds });
  };

  // Deselect all permissions
  const handleDeselectAll = () => {
    if (!selectedRole) return;

    setSelectedRole({ ...selectedRole, permissions: [] });
  };

  // Select all permissions in current category
  const handleSelectAllInCategory = (category: string) => {
    if (!selectedRole) return;

    const categoryPermissions = allPermissions
      .filter(p => p.category === category)
      .map(p => p.id);

    const otherPermissions = selectedRole.permissions.filter(p => {
      const perm = allPermissions.find(ap => ap.id === p);
      return perm?.category !== category;
    });

    setSelectedRole({
      ...selectedRole,
      permissions: [...otherPermissions, ...categoryPermissions]
    });
  };

  // Deselect all permissions in current category
  const handleDeselectAllInCategory = (category: string) => {
    if (!selectedRole) return;

    const categoryPermissions = allPermissions
      .filter(p => p.category === category)
      .map(p => p.id);

    const updatedPermissions = selectedRole.permissions.filter(p =>
      !categoryPermissions.includes(p)
    );

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions
    });
  };

  // Save (Create or Update)
  const handleSaveRole = async () => {
    if (!selectedRole) return;

    const isEditing = !!selectedRole.originalName;

    console.log('selectedRole', selectedRole);

    if (selectedRole.name == null || selectedRole.description == null || selectedRole.permissions.length == 0) {
      toast.warning('Role name, description, and permissions are required');
      return;
    }

    const toastId = toast.loading(isEditing ? 'Updating role...' : 'Creating role...');
    try {
      const response = await fetch('/api/roles', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: selectedRole.originalName,
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: selectedRole.permissions,
        }),
      });

      if (response.ok) {
        // Refresh roles from API
        const updated = await fetch('/api/roles').then((res) => res.json());
        setRoles(
          updated.map((r: any) => ({
            ...r,
            userCount: Math.floor(Math.random() * 50),
          }))
        );
        toast.dismiss(toastId);
        toast.success(isEditing ? 'Role updated successfully' : 'Role created successfully');
      } else {
        // Fallback to local state update if API fails
        const updatedRoles = isEditing
          ? roles.map(role =>
            role.name === selectedRole.originalName
              ? { ...selectedRole, userCount: role.userCount }
              : role
          )
          : [...roles, { ...selectedRole, userCount: Math.floor(Math.random() * 50) }];

        setRoles(updatedRoles);
        console.log('Role saved locally (API not available)');
        toast.dismiss(toastId);
        toast.success(isEditing ? 'Role updated successfully' : 'Role created successfully');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.dismiss(toastId);
      toast.error('Failed to save role');
      // Still update local state for demo purposes
      const updatedRoles = isEditing
        ? roles.map(role =>
          role.name === selectedRole.originalName
            ? { ...selectedRole, userCount: role.userCount }
            : role
        )
        : [...roles, { ...selectedRole, userCount: Math.floor(Math.random() * 50) }];

      setRoles(updatedRoles);
    }

    closeRoleModal();
    setSelectedRole(null);
    setSelectedCategory('all');
  };

  // Delete role
  const handleDeleteRole = async (name: string) => {
    const toastId = toast.loading('Deleting role...');
    try {
      const response = await fetch('/api/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        console.log('API delete failed, updating locally');
      }
      toast.dismiss(toastId);
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.dismiss(toastId);
      toast.error('Failed to delete role');
    }

    // Always update local state
    setRoles(roles.filter((role) => role.name !== name));
  };

  // Search filter
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categories for permission filters
  const categories = [
    'all',
    ...Array.from(new Set(allPermissions.map((p) => p.category))),
  ];

  const filteredPermissions =
    selectedCategory === 'all'
      ? allPermissions
      : allPermissions.filter((p) => p.category === selectedCategory);

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  if (loading) {
    return <RolesPageSkeleton />;
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Title order={1} fw={700} c="gray.9" style={{ letterSpacing: '-0.02em' }}>
            Roles & Permissions
          </Title>
          <Text c="gray.6" mt="xs">
            Manage user roles and their permissions ({allPermissions.length} total permissions available)
          </Text>
          <Group gap="md" mt="sm">
            <Badge variant="light" color="blue" size="lg">
              {roles.length} Roles
            </Badge>
            <Badge variant="light" color="green" size="lg">
              {Object.keys(permissionCategories).length} Categories
            </Badge>
            <Badge variant="light" color="purple" size="lg">
              {allPermissions.length} Permissions
            </Badge>
          </Group>
        </Box>
        <Button
          onClick={() => {
            setSelectedRole({
              name: '',
              description: '',
              permissions: [],
              originalName: undefined,
            });
            openRoleModal();
          }}
          leftSection={<IconPlus size={20} />}
          style={{ backgroundColor: '#1a1a3c' }}
          radius="md"
        >
          Create Role
        </Button>
      </Group>

      {/* Search */}
      <Paper withBorder shadow="sm" radius="md" p="md">
        <TextInput
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={20} />}
          radius="md"
        />
      </Paper>

      {/* Roles Grid */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {filteredRoles.map((role) => (
          <Paper
            key={role.name}
            withBorder
            shadow="sm"
            radius="md"
            p="md"
            style={{ position: 'relative' }}
          >
            <Group justify="space-between" align="flex-start" mb="md">
              <Group gap="sm">
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: getRoleColor(role.name),
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconShield size={20} color="white" />
                </Box>
                <Box>
                  <Text fw={700} size="lg" c="gray.9" style={{ textTransform: 'capitalize' }}>
                    {role.name}
                  </Text>
                  <Text size="xs" c="gray.5" style={{ maxWidth: '200px' }}>
                    {role.description}
                  </Text>
                </Box>
              </Group>

              <Group gap="xs">
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setSelectedRole({
                      ...role,
                      originalName: role.name,
                    });
                    openRoleModal();
                  }}
                >
                  <IconEdit size={16} />
                </Button>

                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={() => handleDeleteRole(role.name)}
                >
                  <IconTrash size={16} />
                </Button>
              </Group>
            </Group>

            <Group gap="lg" mb="md" pb="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <Group gap="xs">
                <IconUsers size={16} color="#9ca3af" />
                <Text size="sm" c="gray.6">
                  {role.userCount} users
                </Text>
              </Group>
              <Group gap="xs">
                <IconShield size={16} color="#9ca3af" />
                <Text size="sm" c="gray.6">
                  {role.permissions.length} permissions
                </Text>
              </Group>
            </Group>

            <Box>
              <Text
                size="xs"
                fw={600}
                c="gray.5"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                mb="xs"
              >
                Key Permissions
              </Text>
              <Group gap="xs" wrap="wrap">
                {role.permissions.slice(0, 3).map((perm) => {
                  const permissionInfo = allPermissions.find(p => p.id === perm);
                  return (
                    <Badge key={perm} variant="light" color="blue" size="sm">
                      {permissionInfo?.name || perm.replace(/_/g, ' ')}
                    </Badge>
                  );
                })}
                {role.permissions.length > 3 && (
                  <Badge variant="light" color="gray" size="sm">
                    +{role.permissions.length - 3} more
                  </Badge>
                )}
              </Group>
            </Box>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Modal */}
      <Modal
        opened={showRoleModal}
        onClose={() => {
          closeRoleModal();
          setSelectedRole(null);
          setSelectedCategory('all');
        }}
        title={
          <Box>
            <Title order={2} fw={700} c="white" mb="xs">
              {selectedRole?.originalName ? 'Edit Role' : 'Create New Role'}
            </Title>
            <Text size="sm" c="blue.1">
              Configure role permissions
            </Text>
          </Box>
        }
        size="xl"
        centered
        styles={{
          header: { backgroundColor: '#1a1a3c' },
          title: { color: 'white' },
        }}
      >
        {selectedRole && (
          <Stack gap="md">
            <Stack gap="md">
              <TextInput
                label="Role Name"
                value={selectedRole.name}
                onChange={(e) =>
                  setSelectedRole({ ...selectedRole, name: e.currentTarget.value })
                }
                placeholder="Enter role name"
                radius="md"
              />
              <TextInput
                label="Description"
                value={selectedRole.description || ''}
                onChange={(e) =>
                  setSelectedRole({
                    ...selectedRole,
                    description: e.currentTarget.value,
                  })
                }
                placeholder="Brief description"
                radius="md"
              />
            </Stack>

            <Box>
              <Text size="sm" fw={600} c="gray.7" mb="sm">
                Filter by Category
              </Text>
              <Group gap="xs" wrap="wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'filled' : 'light'}
                    color={selectedCategory === cat ? 'blue' : 'gray'}
                    size="sm"
                    radius="md"
                    onClick={() => setSelectedCategory(cat)}
                    style={
                      selectedCategory === cat ? { backgroundColor: '#1a1a3c' } : {}
                    }
                  >
                    {cat === 'all' ? 'All' : cat}
                  </Button>
                ))}
              </Group>
            </Box>

            <Box>
              <Group justify="space-between" align="center" mb="sm">
                <Text size="sm" fw={600} c="gray.7">
                  Permissions ({selectedRole.permissions.length} selected)
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </Group>
              </Group>

              {selectedCategory === 'all' ? (
                <Stack gap="md">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    const categoryPermissionIds = perms.map(p => p.id);
                    const selectedInCategory = selectedRole.permissions.filter(p =>
                      categoryPermissionIds.includes(p)
                    ).length;
                    const allSelectedInCategory = selectedInCategory === categoryPermissionIds.length;

                    return (
                      <Paper key={category} withBorder radius="md" p="md" bg="gray.0">
                        <Group justify="space-between" align="center" mb="sm">
                          <Group gap="xs">
                            <Box
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                              }}
                            />
                            <Text size="sm" fw={700} c="gray.9">
                              {category} ({selectedInCategory}/{categoryPermissionIds.length})
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="subtle"
                              color="blue"
                              onClick={() => handleSelectAllInCategory(category)}
                              disabled={allSelectedInCategory}
                            >
                              Select All
                            </Button>
                            <Button
                              size="xs"
                              variant="subtle"
                              color="gray"
                              onClick={() => handleDeselectAllInCategory(category)}
                              disabled={selectedInCategory === 0}
                            >
                              Deselect All
                            </Button>
                          </Group>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                          {perms.map((permission) => {
                            const isChecked = selectedRole.permissions.includes(
                              permission.id
                            );
                            return (
                              <Checkbox
                                key={permission.id}
                                label={
                                  <Box>
                                    <Text size="sm" fw={500}>{permission.name}</Text>
                                    <Text size="xs" c="gray.6">{permission.id}</Text>
                                  </Box>
                                }
                                checked={isChecked}
                                onChange={() => handleTogglePermission(permission.id)}
                              />
                            );
                          })}
                        </SimpleGrid>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Paper withBorder radius="md" p="md" bg="gray.0">
                  {selectedCategory !== 'all' && (
                    <Group justify="space-between" align="center" mb="sm">
                      <Text size="sm" fw={600} c="gray.7">
                        {selectedCategory} Category
                      </Text>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="subtle"
                          color="blue"
                          onClick={() => handleSelectAllInCategory(selectedCategory)}
                        >
                          Select All in Category
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => handleDeselectAllInCategory(selectedCategory)}
                        >
                          Deselect All in Category
                        </Button>
                      </Group>
                    </Group>
                  )}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {filteredPermissions.map((permission) => {
                      const isChecked = selectedRole.permissions.includes(permission.id);
                      return (
                        <Checkbox
                          key={permission.id}
                          label={
                            <Box>
                              <Text size="sm" fw={500}>{permission.name}</Text>
                              <Text size="xs" c="gray.6">{permission.id}</Text>
                            </Box>
                          }
                          checked={isChecked}
                          onChange={() => handleTogglePermission(permission.id)}
                        />
                      );
                    })}
                  </SimpleGrid>
                </Paper>
              )}
            </Box>

            <Group justify="flex-end" gap="sm" mt="md">
              <Button
                variant="outline"
                onClick={() => {
                  closeRoleModal();
                  setSelectedRole(null);
                  setSelectedCategory('all');
                }}
                radius="md"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSaveRole}
                style={{ backgroundColor: '#1a1a3c' }}
                radius="md"
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

function RolesPageSkeleton() {
  return (
    <Stack gap="md">
      {/* Header Skeleton */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Skeleton height={32} width={250} mb="xs" />
          <Skeleton height={16} width={400} mb="sm" />
          <Group gap="md">
            <Skeleton height={28} width={80} radius="md" />
            <Skeleton height={28} width={100} radius="md" />
            <Skeleton height={28} width={120} radius="md" />
          </Group>
        </Box>
        <Skeleton height={36} width={130} />
      </Group>

      {/* Search Skeleton */}
      <Paper withBorder shadow="sm" radius="md" p="md">
        <Skeleton height={36} />
      </Paper>

      {/* Roles Grid Skeleton */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {Array.from({ length: 6 }).map((_, index) => (
          <RoleCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

function RoleCardSkeleton() {
  return (
    <Paper withBorder shadow="sm" radius="md" p="md">
      {/* Header with icon and actions */}
      <Group justify="space-between" align="flex-start" mb="md">
        <Group gap="sm">
          <Skeleton height={40} width={40} radius="md" />
          <Box>
            <Skeleton height={20} width={80} mb="xs" />
            <Skeleton height={12} width={180} />
          </Box>
        </Group>
        <Group gap="xs">
          <Skeleton height={24} width={24} />
          <Skeleton height={24} width={24} />
        </Group>
      </Group>

      {/* Stats section */}
      <Group gap="lg" mb="md" pb="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Group gap="xs">
          <Skeleton height={16} width={16} />
          <Skeleton height={14} width={60} />
        </Group>
        <Group gap="xs">
          <Skeleton height={16} width={16} />
          <Skeleton height={14} width={80} />
        </Group>
      </Group>

      {/* Permissions section */}
      <Box>
        <Skeleton height={12} width={120} mb="xs" />
        <Group gap="xs" wrap="wrap">
          <Skeleton height={20} width={70} radius="md" />
          <Skeleton height={20} width={85} radius="md" />
          <Skeleton height={20} width={60} radius="md" />
          <Skeleton height={20} width={50} radius="md" />
        </Group>
      </Box>
    </Paper>
  );
}
