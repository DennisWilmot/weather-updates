'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Container,
  Stack,
  Group,
  Paper,
  Button,
  Text,
  Title,
  Badge,
  TextInput,
  Select,
  Table,
  Modal,
  SimpleGrid,
  Pagination as MantinePagination,
  Loader,
  ActionIcon,
  Checkbox,
  Textarea,
} from '@mantine/core';
import {
  IconBadge,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFilter,
  IconMail,
  IconRefresh,
  IconDeviceFloppy,
  IconSearch,
  IconShield,
  IconTrash,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'sonner';

const CUSTOM_ROLE_ID = 'custom-inline';

type Status = 'active' | 'suspended';
type RoleMode = 'preset' | 'custom';

interface PermissionActionConfig {
  id: string;
  label: string;
}

interface PermissionCategoryConfig {
  id: string;
  label: string;
  description: string;
  actions: PermissionActionConfig[];
}

type PermissionMatrix = Record<string, Record<string, boolean>>;
type FormsAccess = Record<string, boolean>;

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  accent: string;
  badgeClass: string;
  permissions: PermissionMatrix;
  formsAccess: FormsAccess;
  lastUpdated: string;
  isSystem?: boolean;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  status: Status;
  roleId: string;
  customRole?: RoleDefinition;
  location: string;
  teams: string[];
  lastActive: string;
  createdAt: string;
}

const formsCatalog = [
  { id: 'damage', label: 'Damage & Needs Assessment' },
  { id: 'supply', label: 'Supply Drop Verification' },
  { id: 'shelter', label: 'Shelter Readiness Survey' },
  { id: 'medical', label: 'Medical Intake' },
  { id: 'water', label: 'Water Quality Check' },
];

const permissionCatalog: PermissionCategoryConfig[] = [
  {
    id: 'users',
    label: 'User Directory',
    description: 'Invite, edit, and suspend platform users.',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'invite', label: 'Invite' },
      { id: 'edit', label: 'Edit' },
      { id: 'suspend', label: 'Suspend' },
    ],
  },
  {
    id: 'deployments',
    label: 'Deployments',
    description: 'Field missions, assignments, and approvals.',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Create' },
      { id: 'edit', label: 'Edit' },
      { id: 'approve', label: 'Approve' },
    ],
  },
  {
    id: 'forms',
    label: 'Form Builder',
    description: 'Atlas form templates and publishing.',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Create' },
      { id: 'assign', label: 'Assign' },
      { id: 'publish', label: 'Publish' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights & Exports',
    description: 'Reporting, downloads, and sharing.',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'export', label: 'Export' },
    ],
  },
];

const baseMatrix = buildBaseMatrix();
const baseForms = buildBaseForms();

function buildBaseMatrix(): PermissionMatrix {
  const matrix: PermissionMatrix = {};
  permissionCatalog.forEach(category => {
    matrix[category.id] = {};
    category.actions.forEach(action => {
      matrix[category.id][action.id] = false;
    });
  });
  return matrix;
}

function buildBaseForms(): FormsAccess {
  const map: FormsAccess = {};
  formsCatalog.forEach(form => {
    map[form.id] = false;
  });
  return map;
}

function cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return JSON.parse(JSON.stringify(matrix));
}

function cloneForms(map: FormsAccess): FormsAccess {
  return { ...map };
}

function createMatrix(enabled: Record<string, string[]>): PermissionMatrix {
  const matrix = cloneMatrix(baseMatrix);
  Object.entries(enabled).forEach(([categoryId, actionIds]) => {
    actionIds.forEach(actionId => {
      if (matrix[categoryId] && actionId in matrix[categoryId]) {
        matrix[categoryId][actionId] = true;
      }
    });
  });
  return matrix;
}

function createFormsAccess(enabledIds: string[]): FormsAccess {
  const map = cloneForms(baseForms);
  enabledIds.forEach(id => {
    if (map[id] !== undefined) {
      map[id] = true;
    }
  });
  return map;
}

function createRoleTemplate(overrides?: Partial<RoleDefinition>): RoleDefinition {
  return {
    id: overrides?.id ?? `role-${Math.random().toString(36).slice(2, 8)}`,
    name: overrides?.name ?? 'Custom Role',
    description: overrides?.description ?? 'Tailored permissions for unique access needs.',
    accent: overrides?.accent ?? 'bg-gradient-to-r from-slate-600 to-slate-800',
    badgeClass: overrides?.badgeClass ?? 'bg-slate-100 text-slate-800 border border-slate-200',
    permissions: overrides?.permissions ? cloneMatrix(overrides.permissions) : cloneMatrix(baseMatrix),
    formsAccess: overrides?.formsAccess ? cloneForms(overrides.formsAccess) : cloneForms(baseForms),
    lastUpdated: overrides?.lastUpdated ?? 'Just now',
    isSystem: overrides?.isSystem ?? false,
  };
}

function cloneRole(role: RoleDefinition): RoleDefinition {
  return {
    ...role,
    permissions: cloneMatrix(role.permissions),
    formsAccess: cloneForms(role.formsAccess),
  };
}

const rolePresets: RoleDefinition[] = [
  createRoleTemplate({
    id: 'admin',
    name: 'Atlas Admin',
    description: 'Full platform control, approvals, and publishing.',
    accent: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    permissions: createMatrix({
      users: ['view', 'invite', 'edit', 'suspend'],
      deployments: ['view', 'create', 'edit', 'approve'],
      forms: ['view', 'create', 'assign', 'publish'],
      insights: ['view', 'export'],
    }),
    formsAccess: createFormsAccess(formsCatalog.map(form => form.id)),
    lastUpdated: '2h ago',
    isSystem: true,
  }),
  createRoleTemplate({
    id: 'ops',
    name: 'Operations Lead',
    description: 'Runs field deployments and assigns responders.',
    accent: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    permissions: createMatrix({
      users: ['view'],
      deployments: ['view', 'create', 'edit', 'approve'],
      forms: ['view', 'assign'],
      insights: ['view'],
    }),
    formsAccess: createFormsAccess(['damage', 'supply', 'shelter']),
    lastUpdated: '4h ago',
    isSystem: true,
  }),
  createRoleTemplate({
    id: 'field',
    name: 'Field Reporter',
    description: 'Captures needs and status updates on site.',
    accent: 'bg-gradient-to-r from-amber-500 to-orange-500',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
    permissions: createMatrix({
      deployments: ['view'],
      forms: ['view', 'assign'],
      insights: ['view'],
    }),
    formsAccess: createFormsAccess(['damage', 'supply', 'medical']),
    lastUpdated: 'Yesterday',
    isSystem: true,
  }),
  createRoleTemplate({
    id: 'analyst',
    name: 'Insights Analyst',
    description: 'Reviews submissions and exports trend data.',
    accent: 'bg-gradient-to-r from-sky-500 to-cyan-500',
    badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
    permissions: createMatrix({
      users: ['view'],
      deployments: ['view'],
      forms: ['view'],
      insights: ['view', 'export'],
    }),
    formsAccess: createFormsAccess(['damage', 'water']),
    lastUpdated: '3d ago',
    isSystem: true,
  }),
];

const initialUsers: UserRecord[] = [
  {
    id: 'USR-2411',
    name: 'Nia Morgan',
    email: 'nia.morgan@atlas.tm',
      status: 'active',
    roleId: 'admin',
    location: 'Kingston HQ',
    teams: ['Command Center'],
    lastActive: '2 min ago',
    createdAt: '2024-03-14',
  },
  {
    id: 'USR-2412',
    name: 'David Park',
    email: 'david.park@atlas.tm',
    status: 'active',
    roleId: 'ops',
    location: 'St. Mary',
    teams: ['Deployments', 'Logistics'],
    lastActive: '15 min ago',
    createdAt: '2024-05-02',
  },
  {
    id: 'USR-2413',
    name: 'Simone Graves',
    email: 'simone.graves@atlas.tm',
    status: 'suspended',
    roleId: 'analyst',
    location: 'Remote - Montego Bay',
    teams: ['Insights'],
    lastActive: '5d ago',
    createdAt: '2023-11-20',
  },
  {
    id: 'USR-2414',
    name: 'Andre Miller',
    email: 'andre.miller@atlas.tm',
    status: 'active',
    roleId: 'field',
    location: 'Portland Parish',
    teams: ['Field Recon'],
    lastActive: '50 min ago',
    createdAt: '2024-01-07',
  },
  {
    id: 'USR-2415',
    name: 'Maya Chen',
    email: 'maya.chen@atlas.tm',
    status: 'active',
    roleId: CUSTOM_ROLE_ID,
    customRole: createRoleTemplate({
      id: CUSTOM_ROLE_ID,
      name: 'Needs Only',
      description: 'Limited view for rapid needs capture.',
      permissions: createMatrix({
        deployments: ['view'],
        forms: ['view'],
        insights: ['view'],
      }),
      formsAccess: createFormsAccess(['damage']),
      accent: 'bg-gradient-to-r from-rose-500 to-orange-500',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
      lastUpdated: '1d ago',
    }),
    location: 'St. Thomas',
    teams: ['Needs Assessment'],
    lastActive: '1h ago',
    createdAt: '2024-02-18',
  },
];

const usersPerPage = 6;

function parseBadgeClass(badgeClass: string) {
  // Parse Tailwind classes to Mantine-compatible styles
  if (badgeClass.includes('indigo')) {
    return { backgroundColor: '#e0e7ff', color: '#4338ca', borderColor: '#c7d2fe' };
  }
  if (badgeClass.includes('emerald')) {
    return { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' };
  }
  if (badgeClass.includes('amber')) {
    return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
  }
  if (badgeClass.includes('sky')) {
    return { backgroundColor: '#e0f2fe', color: '#0c4a6e', borderColor: '#bae6fd' };
  }
  if (badgeClass.includes('rose')) {
    return { backgroundColor: '#ffe4e6', color: '#9f1239', borderColor: '#fecdd3' };
  }
  if (badgeClass.includes('slate')) {
    return { backgroundColor: '#f1f5f9', color: '#1e293b', borderColor: '#cbd5e1' };
  }
  return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' };
}

export default function AdminUsersPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>(rolePresets);
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);

  const [userModalOpened, { open: openUserModal, close: closeUserModal }] = useDisclosure(false);
  const [userDraft, setUserDraft] = useState<UserRecord | null>(null);
  const [roleMode, setRoleMode] = useState<RoleMode>('preset');
  const [userCustomRole, setUserCustomRole] = useState<RoleDefinition>(() => createRoleTemplate());

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => [
      ...roles.map(role => ({ id: role.id, label: role.name })),
      { id: CUSTOM_ROLE_ID, label: 'Custom roles' },
    ],
    [roles],
  );

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === CUSTOM_ROLE_ID && user.roleId === CUSTOM_ROLE_ID) ||
        user.roleId === roleFilter;

      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const pagedUsers = filteredUsers.slice((page - 1) * usersPerPage, page * usersPerPage);

  const totalActive = users.filter(user => user.status === 'active').length;
  const totalSuspended = users.length - totalActive;
  const customRolesCount = roles.filter(role => !role.isSystem).length;

  const simulateNetwork = async (key: string, cb: () => void, message: string) => {
    setPendingAction(key);
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));
    cb();
    toast.success(message);
    setPendingAction(null);
  };

  const getRoleMeta = (user: UserRecord) => {
    if (user.roleId === CUSTOM_ROLE_ID && user.customRole) {
      return { label: user.customRole.name, badgeClass: user.customRole.badgeClass };
    }
    const role = roles.find(r => r.id === user.roleId);
    return {
      label: role?.name ?? 'Unassigned',
      badgeClass: role?.badgeClass ?? 'bg-gray-100 text-gray-700 border border-gray-200',
    };
  };

  const handleOpenUserModal = (user: UserRecord) => {
    setUserDraft({ ...user });
    if (user.roleId === CUSTOM_ROLE_ID && user.customRole) {
      setRoleMode('custom');
      setUserCustomRole(cloneRole(user.customRole));
    } else {
      setRoleMode('preset');
      setUserCustomRole(createRoleTemplate({ name: `${user.name} Custom Access` }));
    }
    openUserModal();
  };

  const resetUserModal = () => {
    closeUserModal();
    setUserDraft(null);
    setRoleMode('preset');
  };

  const handleSaveUser = async () => {
    if (!userDraft) return;
    await simulateNetwork('save-user', () => {
      setUsers(prev =>
        prev.map(user => {
          if (user.id !== userDraft.id) return user;
          if (roleMode === 'custom') {
            return {
              ...userDraft,
              roleId: CUSTOM_ROLE_ID,
              customRole: cloneRole({
                ...userCustomRole,
                id: `${CUSTOM_ROLE_ID}-${userDraft.id}`,
                badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
              }),
            };
          }
          return { ...userDraft, customRole: undefined };
        }),
      );
    }, 'User changes saved');
    resetUserModal();
  };

  const handleToggleUserStatus = async (user: UserRecord) => {
    await simulateNetwork(
      'toggle-status',
      () => {
        setUsers(prev =>
          prev.map(entry =>
            entry.id === user.id
              ? { ...entry, status: entry.status === 'active' ? 'suspended' : 'active' }
              : entry,
          ),
        );
      },
      user.status === 'active' ? 'User suspended' : 'User reactivated',
    );
  };

  const handleDeleteUser = async (user: UserRecord) => {
    await simulateNetwork(
      'delete-user',
      () => {
        setUsers(prev => prev.filter(entry => entry.id !== user.id));
      },
      'User removed',
    );
    resetUserModal();
  };

  const updateCustomRole = (
    updater: (current: RoleDefinition) => RoleDefinition,
  ) => {
    setUserCustomRole(current => updater(cloneRole(current)));
  };

  return (
    <Stack gap="md">
      <Box>
        <Text size="sm" fw={600} c="blue.6" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Admin Panel
        </Text>
        <Title order={1} fw={700} c="gray.9" mt="xs">
          Users & Access
        </Title>
        <Text c="gray.6" mt="xs">
          Manage user accounts and their role assignments.
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <SummaryCard
          label="Active users"
          value={totalActive}
          change="+8 this week"
          icon={<IconUsers size={20} style={{ color: '#2563eb' }} />}
        />
        <SummaryCard
          label="Suspended"
          value={totalSuspended}
          change="Review needed"
          icon={<IconShield size={20} style={{ color: '#f59e0b' }} />}
        />
        <SummaryCard
          label="Custom roles"
          value={customRolesCount}
          change="Locally saved"
          icon={<IconBadge size={20} style={{ color: '#10b981' }} />}
        />
      </SimpleGrid>

      <Stack gap="md">
        <FiltersCard
          search={search}
          onSearch={setSearch}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilter={setRoleFilter}
          onStatusFilter={setStatusFilter}
          roleOptions={roleOptions}
        />

        <Paper withBorder shadow="lg" radius="md" style={{ overflow: 'hidden' }}>
            {filteredUsers.length === 0 ? (
              <Stack gap="md" p="xl" align="center">
                <Box
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                  }}
                >
                  <IconSearch size={22} />
                </Box>
                <Title order={3} fw={600} c="gray.9">No matches found</Title>
                <Text c="gray.6" style={{ maxWidth: 384 }} ta="center">
                  Adjust filters or reset search to see the full roster.
                </Text>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              </Stack>
            ) : (
              <>
                <Box visibleFrom="xl">
                  <Table.ScrollContainer minWidth={800}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>User</Table.Th>
                          <Table.Th>Role</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Last active</Table.Th>
                          <Table.Th>Location</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {pagedUsers.map(user => {
                          const roleMeta = getRoleMeta(user);
                          return (
                            <Table.Tr
                  key={user.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleOpenUserModal(user)}
                            >
                              <Table.Td>
                                <Group gap="sm">
                                  <Box
                                    style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: '50%',
                                      backgroundColor: '#1e293b',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {user.name
                                      .split(' ')
                                      .map(part => part[0])
                                      .slice(0, 2)
                                      .join('')}
                                  </Box>
                                  <Box>
                                    <Text fw={600} c="gray.9">{user.name}</Text>
                                    <Text size="sm" c="gray.5">{user.email}</Text>
                                  </Box>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  variant="light"
                                  style={{
                                    border: '1px solid',
                                    ...parseBadgeClass(roleMeta.badgeClass),
                                  }}
                                >
                                  {roleMeta.label}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <StatusBadge status={user.status} />
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="gray.6">{user.lastActive}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="gray.6">{user.location}</Text>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Box>

                <Stack gap="xs" hiddenFrom="xl">
                  {pagedUsers.map(user => {
                    const roleMeta = getRoleMeta(user);
                    return (
                      <Paper
            key={user.id}
                        p="md"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenUserModal(user)}
                      >
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Text size="sm" fw={600} c="gray.9">{user.name}</Text>
                            <Text size="xs" c="gray.5">{user.email}</Text>
                          </Box>
                          <StatusBadge status={user.status} />
                        </Group>
                        <Group gap="xs" mt="md">
                          <Badge
                            variant="light"
                            size="xs"
                            style={{
                              border: '1px solid',
                              ...parseBadgeClass(roleMeta.badgeClass),
                            }}
                          >
                            {roleMeta.label}
                          </Badge>
                          <Badge variant="light" size="xs" color="gray">
                            {user.location}
                          </Badge>
                          <Badge variant="light" size="xs" color="gray">
                            {user.lastActive}
                          </Badge>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>

                <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <MantinePagination
                    value={page}
                    total={pageCount}
                    onChange={setPage}
                  />
                </Box>
              </>
            )}
        </Paper>
      </Stack>

      <Modal
        opened={userModalOpened}
        onClose={resetUserModal}
        title={
          <Box>
            <Text size="sm" fw={600} c="blue.6">User profile</Text>
            <Title order={2} fw={700} c="gray.9" mt="xs">{userDraft?.name}</Title>
            <Text size="sm" c="gray.6" mt="xs">{userDraft?.location}</Text>
          </Box>
        }
        size="xl"
        centered
      >
        {userDraft && (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Field label="Email">
                <Group gap="xs">
                  <IconMail size={14} />
                  <Text size="sm" c="gray.7">{userDraft.email}</Text>
                </Group>
              </Field>
              <Field label="Created">
                <Group gap="xs">
                  <IconCalendar size={14} />
                  <Text size="sm" c="gray.7">{userDraft.createdAt}</Text>
                </Group>
              </Field>
              <Field label="Status">
                <StatusBadge status={userDraft.status} />
              </Field>
              <Field label="Last active">
                <Group gap="xs">
                  <IconClock size={14} />
                  <Text size="sm" c="gray.7">{userDraft.lastActive}</Text>
                </Group>
              </Field>
            </SimpleGrid>

            <Paper withBorder radius="md" p="md">
              <Stack gap="md">
                <Group gap="xs" wrap="wrap">
                  <Text size="sm" fw={600} c="gray.9">Role assignment</Text>
                  <Badge variant="light" size="xs" color="gray">
                    Shared data
                  </Badge>
                </Group>

                <Group gap="xs" wrap="wrap">
                  {(['preset', 'custom'] as RoleMode[]).map(mode => (
                    <Button
                      key={mode}
                      variant={roleMode === mode ? 'filled' : 'outline'}
                      color={roleMode === mode ? 'blue' : 'gray'}
                      size="sm"
                      radius="xl"
                      onClick={() => setRoleMode(mode)}
                      style={
                        roleMode === mode
                          ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af' }
                          : {}
                      }
                    >
                      {mode === 'preset' ? 'Preset role' : 'Custom role'}
                    </Button>
                  ))}
                </Group>

                {roleMode === 'preset' ? (
                  <Stack gap="xs">
                    {roles.map(role => (
                      <Paper
                        key={role.id}
                        p="md"
                        withBorder
                        radius="md"
                        style={{
                          cursor: 'pointer',
                          borderColor: userDraft.roleId === role.id ? '#3b82f6' : '#e5e7eb',
                          backgroundColor: userDraft.roleId === role.id ? '#eff6ff' : 'white',
                        }}
                        onClick={() =>
                          setUserDraft(prev => (prev ? { ...prev, roleId: role.id } : prev))
                        }
                      >
                        <Group justify="space-between">
                          <Box>
                            <Text size="sm" fw={600} c="gray.9">{role.name}</Text>
                            <Text size="xs" c="gray.5">{role.description}</Text>
                          </Box>
                  <input
                            type="radio"
                            checked={userDraft.roleId === role.id}
                            onChange={() =>
                              setUserDraft(prev => (prev ? { ...prev, roleId: role.id } : prev))
                            }
                          />
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <TextInput
                      value={userCustomRole.name}
                      onChange={(event) =>
                        setUserCustomRole(prev => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Custom role name"
                      radius="md"
                    />
                    <PermissionMatrix
                      matrix={userCustomRole.permissions}
                      onToggle={(category, action) =>
                        updateCustomRole(current => {
                          current.permissions[category][action] = !current.permissions[category][action];
                          return current;
                        })
                      }
                    />
                    <FormToggleList
                      forms={formsCatalog}
                      access={userCustomRole.formsAccess}
                      onToggle={formId =>
                        updateCustomRole(current => {
                          current.formsAccess[formId] = !current.formsAccess[formId];
                          return current;
                        })
                      }
                    />
                  </Stack>
                )}
              </Stack>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Button
                disabled={!!pendingAction}
                onClick={handleSaveUser}
                leftSection={
                  pendingAction === 'save-user' ? (
                    <Loader size={16} />
                  ) : (
                    <IconDeviceFloppy size={16} />
                  )
                }
                style={{ backgroundColor: '#1a1a3c' }}
                radius="md"
                fullWidth
              >
                Save changes
              </Button>
              <Button
                variant="outline"
                leftSection={<IconRefresh size={16} />}
                onClick={() => toast.info('Password reset email queued')}
                radius="md"
                fullWidth
              >
                Send reset link
              </Button>
              <Button
                variant="outline"
                color="orange"
                onClick={() => userDraft && handleToggleUserStatus(userDraft)}
                radius="md"
                fullWidth
              >
                Pause access
              </Button>
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={() => userDraft && handleDeleteUser(userDraft)}
                radius="md"
                fullWidth
              >
                Delete user
              </Button>
            </SimpleGrid>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

function SummaryCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: number;
  change: string;
  icon: ReactNode;
}) {
  return (
    <Paper withBorder shadow="sm" radius="md" p="md">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="xs" fw={600} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </Text>
          <Title order={2} fw={700} c="gray.9" mt="xs">{value}</Title>
        </Box>
        <Box
          style={{
            borderRadius: '50%',
            backgroundColor: '#f9fafb',
            padding: 12,
            color: '#374151',
          }}
        >
          {icon}
        </Box>
      </Group>
      <Text size="sm" c="gray.6" mt="md">{change}</Text>
    </Paper>
  );
}

function FiltersCard({
  search,
  onSearch,
  roleFilter,
  statusFilter,
  onRoleFilter,
  onStatusFilter,
  roleOptions,
}: {
  search: string;
  onSearch: (value: string) => void;
  roleFilter: string;
  statusFilter: string;
  onRoleFilter: (value: string) => void;
  onStatusFilter: (value: 'all' | Status) => void;
  roleOptions: { id: string; label: string }[];
}) {
  return (
    <Paper withBorder shadow="sm" radius="md" p="md">
      <Group gap="xs" mb="md">
        <IconFilter size={16} />
        <Text size="sm" fw={600} c="gray.9">Filters</Text>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <TextInput
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search users, email, parishes..."
          leftSection={<IconSearch size={18} />}
          radius="md"
        />
        <Select
          value={roleFilter}
          onChange={(value) => value && onRoleFilter(value)}
          data={[
            { value: 'all', label: 'All roles' },
            ...roleOptions.map(role => ({ value: role.id, label: role.label })),
          ]}
          radius="md"
        />
        <Select
          value={statusFilter}
          onChange={(value) => value && onStatusFilter(value as 'all' | Status)}
          data={[
            { value: 'all', label: 'All status' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          radius="md"
        />
      </SimpleGrid>
    </Paper>
  );
}


function PermissionMatrix({
  matrix,
  onToggle,
}: {
  matrix: PermissionMatrix;
  onToggle?: (categoryId: string, actionId: string) => void;
}) {
  return (
    <Stack gap="md">
      {permissionCatalog.map(category => (
        <Paper key={category.id} withBorder radius="md" p="md">
          <Box mb="sm">
            <Text size="sm" fw={600} c="gray.9">{category.label}</Text>
            <Text size="xs" c="gray.5">{category.description}</Text>
          </Box>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {category.actions.map(action => {
              const active = matrix[category.id]?.[action.id];
              return (
                <Button
                  key={action.id}
                  variant={active ? 'filled' : 'outline'}
                  color={active ? 'blue' : 'gray'}
                  size="xs"
                  radius="md"
                  leftSection={active ? <IconCheck size={14} /> : undefined}
                  onClick={() => onToggle?.(category.id, action.id)}
                  style={
                    active
                      ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af' }
                      : {}
                  }
                >
                  {action.label}
                </Button>
              );
            })}
          </SimpleGrid>
        </Paper>
      ))}
    </Stack>
  );
}

function FormToggleList({
  forms,
  access,
  onToggle,
}: {
  forms: { id: string; label: string }[];
  access: FormsAccess;
  onToggle?: (formId: string) => void;
}) {
  return (
    <Stack gap="xs">
      {forms.map(form => {
        const enabled = access[form.id];
        return (
          <Paper
            key={form.id}
            p="sm"
            withBorder
            radius="md"
            style={{ cursor: 'pointer' }}
            onClick={() => onToggle?.(form.id)}
          >
            <Group justify="space-between">
              <Text size="sm">{form.label}</Text>
              <Badge
                variant="light"
                size="xs"
                color={enabled ? 'green' : 'gray'}
                leftSection={enabled ? <IconCheck size={12} /> : undefined}
              >
                {enabled ? 'Enabled' : 'Hidden'}
              </Badge>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="light"
      color={status === 'active' ? 'green' : 'red'}
      style={{ textTransform: 'capitalize' }}
    >
      {status}
    </Badge>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="xs">
      <Text size="xs" fw={600} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Text>
      <Paper withBorder radius="md" p="sm">
        {children}
      </Paper>
    </Stack>
  );
}

function countPermissions(matrix: PermissionMatrix) {
  return Object.values(matrix).reduce(
    (sum, actions) => sum + Object.values(actions).filter(Boolean).length,
    0,
  );
}
