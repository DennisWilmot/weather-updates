'use client'
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
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
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
  const [showRoleModalOpened, { open: openRoleModal, close: closeRoleModal }] = useDisclosure(false);
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
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Title order={1} fw={700} c="gray.9" style={{ letterSpacing: '-0.02em' }}>
            Roles & Permissions
          </Title>
          <Text c="gray.6" mt="xs">Manage user roles and their permissions</Text>
        </Box>
        <Button
          onClick={() => {
            setSelectedRole({
              id: Date.now().toString(),
              name: '',
              description: '',
              permissions: [],
              userCount: 0
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
        {filteredRoles.map(role => (
          <Paper
            key={role.id}
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
                  <Text fw={700} size="lg" c="gray.9">{role.name}</Text>
                  <Text size="xs" c="gray.5">{role.description}</Text>
                </Box>
              </Group>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => {
                  setSelectedRole(role);
                  openRoleModal();
                }}
                style={{ opacity: 0 }}
                className="group-hover:opacity-100"
              >
                <IconEdit size={16} />
              </Button>
            </Group>

            <Group gap="lg" mb="md" pb="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <Group gap="xs">
                <IconUsers size={16} color="#9ca3af" />
                <Text size="sm" c="gray.6">{role.userCount} users</Text>
              </Group>
              <Group gap="xs">
                <IconShield size={16} color="#9ca3af" />
                <Text size="sm" c="gray.6">{role.permissions.length} permissions</Text>
              </Group>
            </Group>

            <Box>
              <Text size="xs" fw={600} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} mb="xs">
                Key Permissions
              </Text>
              <Group gap="xs" wrap="wrap">
                {role.permissions.slice(0, 3).map(perm => (
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
        opened={showRoleModalOpened}
        onClose={() => {
          closeRoleModal();
          setSelectedRole(null);
          setSelectedCategory('all');
        }}
        title={
          <Box>
            <Title order={2} fw={700} c="white" mb="xs">
              {selectedRole?.name ? 'Edit Role' : 'Create New Role'}
            </Title>
            <Text size="sm" c="blue.1">Configure role permissions</Text>
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
                onChange={(e) => setSelectedRole({ ...selectedRole, name: e.currentTarget.value })}
                placeholder="Enter role name"
                radius="md"
              />
              <TextInput
                label="Description"
                value={selectedRole.description || ''}
                onChange={(e) => setSelectedRole({ ...selectedRole, description: e.currentTarget.value })}
                placeholder="Brief description"
                radius="md"
              />
            </Stack>

            <Box>
              <Text size="sm" fw={600} c="gray.7" mb="sm">Filter by Category</Text>
              <Group gap="xs" wrap="wrap">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'filled' : 'light'}
                    color={selectedCategory === cat ? 'blue' : 'gray'}
                    size="sm"
                    radius="md"
                    onClick={() => setSelectedCategory(cat)}
                    style={
                      selectedCategory === cat
                        ? { backgroundColor: '#1a1a3c' }
                        : {}
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
                        <Text size="sm" fw={700} c="gray.9">{category}</Text>
                      </Group>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        {perms.map(permission => {
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
                  ))}
                </Stack>
              ) : (
                <Paper withBorder radius="md" p="md" bg="gray.0">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {filteredPermissions.map(permission => {
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
                onClick={() => {
                  closeRoleModal();
                  setSelectedRole(null);
                  setSelectedCategory('all');
                }}
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
  )
}
