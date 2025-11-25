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

interface Role {
  name: string;
  description?: string;
  permissions: string[];
  userCount?: number; // optional, for UI display
  originalName?: string; // used when renaming
}

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, { open: openRoleModal, close: closeRoleModal }] =
    useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load roles on mount
  useEffect(() => {
    fetch('/api/roles')
      .then((res) => res.json())
      .then((data) => {
        setRoles(
          data.map((r: any) => ({
            ...r,
            userCount: Math.floor(Math.random() * 50), // mock count
          }))
        );
      });
  }, []);

  // Toggle permissions inside modal
  const handleTogglePermission = (permission: string) => {
    if (!selectedRole) return;

    const updatedPermissions = selectedRole.permissions.includes(permission)
      ? selectedRole.permissions.filter((p) => p !== permission)
      : [...selectedRole.permissions, permission];

    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
  };

  // Save (Create or Update)
  const handleSaveRole = async () => {
    if (!selectedRole) return;

    const isEditing = !!selectedRole.originalName;

    await fetch('/api/roles', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalName: selectedRole.originalName,
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions,
      }),
    });

    // Refresh roles
    const updated = await fetch('/api/roles').then((res) => res.json());
    setRoles(
      updated.map((r: any) => ({
        ...r,
        userCount: Math.floor(Math.random() * 50),
      }))
    );

    closeRoleModal();
    setSelectedRole(null);
    setSelectedCategory('all');
  };

  // Delete role
  const handleDeleteRole = async (name: string) => {
    await fetch('/api/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

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

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Title order={1} fw={700} c="gray.9" style={{ letterSpacing: '-0.02em' }}>
            Roles & Permissions
          </Title>
          <Text c="gray.6" mt="xs">
            Manage user roles and their permissions
          </Text>
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
                    backgroundColor: '#1a1a3c',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconShield size={20} color="white" />
                </Box>
                <Box>
                  <Text fw={700} size="lg" c="gray.9">
                    {role.name}
                  </Text>
                  <Text size="xs" c="gray.5">
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
                {role.permissions.slice(0, 3).map((perm) => (
                  <Badge key={perm} variant="light" color="blue" size="sm">
                    {perm.replace(/_/g, ' ')}
                  </Badge>
                ))}
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
              <Text size="sm" fw={600} c="gray.7" mb="sm">
                Permissions ({selectedRole.permissions.length} selected)
              </Text>

              {selectedCategory === 'all' ? (
                <Stack gap="md">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <Paper key={category} withBorder radius="md" p="md" bg="gray.0">
                      <Group gap="xs" mb="sm">
                        <Box
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                          }}
                        />
                        <Text size="sm" fw={700} c="gray.9">
                          {category}
                        </Text>
                      </Group>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        {perms.map((permission) => {
                          const isChecked = selectedRole.permissions.includes(
                            permission.id
                          );
                          return (
                            <Checkbox
                              key={permission.id}
                              label={permission.name}
                              checked={isChecked}
                              onChange={() => handleTogglePermission(permission.id)}
                            />
                          );
                        })}
                      </SimpleGrid>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper withBorder radius="md" p="md" bg="gray.0">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {filteredPermissions.map((permission) => {
                      const isChecked = selectedRole.permissions.includes(permission.id);
                      return (
                        <Checkbox
                          key={permission.id}
                          label={permission.name}
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
