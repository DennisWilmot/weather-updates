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
  Skeleton,
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
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconDeviceFloppy,
  IconSearch,
  IconShield,
  IconTrash,
  IconUser,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { UserRole, Permission } from '@/lib/permissions';
import { rolePermissions } from '../../../lib/permissions';

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
  name: UserRole | string;
  description: string;
  permissions: Permission[];
  isDefault?: boolean;
  accent?: string;
  badgeClass?: string;
  lastUpdated?: string;
  isSystem?: boolean;
}

interface UserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  imageUrl?: string;
  role: UserRole;
  organization?: string;
  department?: string;
  canViewSensitiveData: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canCreateDeployments: boolean;
  canAssignForms: boolean;
  canApproveRequests: boolean;
  canAccessAdmin: boolean;
  canSubmitPeopleNeeds: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  status?: 'active' | 'suspended';
  // Legacy fields for compatibility
  name?: string;
  location?: string;
  teams?: string[];
  lastActive?: string;
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

const locationOptions = [
  'Kingston HQ',
  'St. Mary',
  'Montego Bay',
  'Portland Parish',
  'St. Thomas',
  'St. Andrew',
  'Clarendon',
  'Manchester',
  'Remote - Montego Bay',
];

const teamOptions = [
  'Command Center',
  'Deployments',
  'Logistics',
  'Insights',
  'Field Recon',
  'Needs Assessment',
  'Medical Response',
  'Supply Chain',
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
    name: overrides?.name ?? 'Custom Role',
    description: overrides?.description ?? 'Tailored permissions for unique access needs.',
    permissions: overrides?.permissions ?? [],
    badgeClass: overrides?.badgeClass ?? 'bg-slate-100 text-slate-800 border border-slate-200',
    lastUpdated: overrides?.lastUpdated ?? 'Just now',
    isSystem: overrides?.isSystem ?? false,
  };
}

function cloneRole(role: RoleDefinition): RoleDefinition {
  return {
    ...role,
    permissions: [...role.permissions],
  };
}

// These functions are no longer needed with the new RBAC system
// The permissions are now handled directly as arrays in the Better Auth system

// Role definitions will be fetched from the RBAC system
const initialUsers: UserRecord[] = []

const usersPerPage = 6;

// Helper function to get role description
function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'System Administrator - Full system access with complete administrative privileges',
    ops: 'Operations Lead - Manages field deployments and coordinates response operations',
    field: 'Field Reporter - Front-line personnel capturing real-time data and status updates',
    analyst: 'Insights Analyst - Data analysis specialist focused on reporting and trend analysis',
    needs: 'Needs Reporter - Limited role specifically for reporting people needs only'
  };
  return descriptions[role] || 'Custom role with specific permissions';
}

// Helper function to get role badge styling
function getRoleBadgeClass(role: string): string {
  const roleStyles: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 border border-red-200',
    ops: 'bg-blue-100 text-blue-800 border border-blue-200',
    field: 'bg-green-100 text-green-800 border border-green-200',
    analyst: 'bg-purple-100 text-purple-800 border border-purple-200',
    needs: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  };
  return roleStyles[role] || 'bg-gray-100 text-gray-800 border border-gray-200';
}

function parseBadgeClass(badgeClass: string) {
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
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Edit user modal
  const [userModalOpened, { open: openUserModal, close: closeUserModal }] = useDisclosure(false);
  const [userDraft, setUserDraft] = useState<UserRecord | null>(null);
  const [roleMode, setRoleMode] = useState<RoleMode>('preset');
  const [userCustomRole, setUserCustomRole] = useState<RoleDefinition>(() => createRoleTemplate());

  // Create user modal
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserLocation, setNewUserLocation] = useState('');
  const [newUserTeams, setNewUserTeams] = useState<string[]>([]);
  const [newUserRoleId, setNewUserRoleId] = useState('');
  const [newUserStatus, setNewUserStatus] = useState<Status>('active');
  const [createRoleMode, setCreateRoleMode] = useState<RoleMode>('preset');
  const [createCustomRole, setCreateCustomRole] = useState<RoleDefinition>(() => createRoleTemplate());

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Fetch roles and users from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch roles from RBAC system
        const rolesRes = await fetch('/api/roles');
        if (rolesRes.ok) {
          const backendRoles = await rolesRes.json();
          const convertedRoles: RoleDefinition[] = backendRoles.map((role: any) => ({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || [],
            isDefault: role.isDefault || false,
            badgeClass: getRoleBadgeClass(role.name),
          }));
          setRoles(convertedRoles);
        } else {
          // Fallback to default roles from permissions system
          const defaultRoles: RoleDefinition[] = Object.entries(rolePermissions).map(([name, permissions]) => ({
            name: name as UserRole,
            description: getRoleDescription(name as UserRole),
            permissions,
            isDefault: true,
            badgeClass: getRoleBadgeClass(name),
          }));
          setRoles(defaultRoles);
        }

        // Fetch users from database
        const usersRes = await fetch('/api/users');
        if (!usersRes.ok) throw new Error('Failed to fetch users');

        const { users: dbUsers } = await usersRes.json();
        const convertedUsers: UserRecord[] = dbUsers.map((user: any) => ({
          ...user,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          location: user.organization || 'Unknown',
          teams: user.department ? [user.department] : [],
          lastActive: user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never',
          status: 'active' as Status, // Default status
        }));
        setUsers(convertedUsers);

        toast.success('Data loaded successfully');
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingRoles(false);
        setLoadingUsers(false);
      }
    };

    fetchData();
  }, []);

  const roleOptions = useMemo(
    () => roles.map(role => ({ id: role.name, label: typeof role.name === 'string' ? role.name : role.name })),
    [roles],
  );

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        (user.name || user.fullName || '').toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.location || user.organization || '').toLowerCase().includes(query);

      const matchesRole =
        roleFilter === 'all' ||
        user.role === roleFilter;

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

  // Removed simulateNetwork - now using real API calls

  const getRoleMeta = (user: UserRecord) => {
    const role = roles.find(r => r.name === user.role);
    return {
      label: role?.name ?? user.role ?? 'Unassigned',
      badgeClass: role?.badgeClass ?? getRoleBadgeClass(user.role),
    };
  };

  const handleOpenUserModal = (user: UserRecord) => {
    setUserDraft({ ...user });
    setRoleMode('preset');
    setUserCustomRole(createRoleTemplate({ name: `${user.name || user.fullName || user.email} Custom Access` }));
    openUserModal();
  };

  const resetUserModal = () => {
    closeUserModal();
    setUserDraft(null);
    setRoleMode('preset');
  };

  const handleSaveUser = async () => {
    if (!userDraft) return;

    // For now, we'll only support preset roles from the RBAC system
    // Custom role functionality can be added later if needed

    // Update user in database
    let toastId: string | number | undefined;
    try {
      setPendingAction('save-user');
      toastId = toast.loading('Saving user changes...');

      const updatePayload = {
        id: userDraft.id,
        role: userDraft.role,
        firstName: userDraft.firstName,
        lastName: userDraft.lastName,
        fullName: userDraft.fullName,
        organization: userDraft.organization,
        department: userDraft.department,
      };

      const res = await fetch(`/api/users/${userDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === userDraft.id ? { ...user, ...userDraft } : user
        )
      );

      toast.dismiss(toastId);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      if (toastId) toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setPendingAction(null);
    }
    resetUserModal();
  };

  const handleToggleUserStatus = async (user: UserRecord) => {
    let toastId: string | number | undefined;
    try {
      setPendingAction('toggle-status');
      toastId = toast.loading(user.status === 'active' ? 'Suspending user...' : 'Reactivating user...');

      const newStatus = user.status === 'active' ? 'suspended' : 'active';

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user status');
      }

      // Update local state
      setUsers(prev =>
        prev.map(entry =>
          entry.id === user.id
            ? { ...entry, status: newStatus }
            : entry,
        ),
      );

      if (toastId) toast.dismiss(toastId);
      toast.success(user.status === 'active' ? 'User suspended' : 'User reactivated');
    } catch (error) {
      console.error('Error toggling user status:', error);
      if (toastId) toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    let toastId: string | number | undefined;
    try {
      setPendingAction('delete-user');
      toastId = toast.loading('Deleting user...');

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      // Update local state
      setUsers(prev => prev.filter(entry => entry.id !== user.id));

      if (toastId) toast.dismiss(toastId);
      toast.success('User removed successfully');
      resetUserModal();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (toastId) toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setPendingAction(null);
    }
  };

  const updateCustomRole = (updater: (current: RoleDefinition) => RoleDefinition) => {
    setUserCustomRole(current => updater(cloneRole(current)));
  };

  const handleOpenCreateModal = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserLocation('');
    setNewUserTeams([]);
    setNewUserRoleId('');
    setNewUserStatus('active');
    setCreateRoleMode('preset');
    setCreateCustomRole(createRoleTemplate({ name: 'New Custom Access' }));
    openCreateModal();
  };

  const handleCreateUser = async () => {
    // Validation
    if (!newUserName.trim()) {
      toast.error('Please enter a user name');
      return;
    }
    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!newUserLocation) {
      toast.error('Please select a location');
      return;
    }
    if (!newUserRoleId) {
      toast.error('Please select a role');
      return;
    }

    setPendingAction('create-user');
    const toastId = toast.loading('Creating user...');

    try {
      // Prepare the user data payload
      const [firstName, ...lastNameParts] = newUserName.trim().split(' ');
      const lastName = lastNameParts.join(' ');

      const payload = {
        email: newUserEmail,
        firstName,
        lastName,
        fullName: newUserName,
        role: newUserRoleId,
        organization: newUserLocation,
        department: newUserTeams.length > 0 ? newUserTeams[0] : undefined,
      };

      // Create user in database
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response.error || 'Failed to create user');
      }

      if (response.user) {
        // Create auth account
        const { data, error } = await authClient.signUp.email({
          email: response.user.email,
          password: 'Password123',
          name: response.user.fullName,
          callbackURL: '/',
        });

        if (error) {
          console.error('Signup error:', error);
          toast.error(error.message);
        } else {
          console.log('User created:', data);

          // Send password reset email
          const resetRes = await authClient.requestPasswordReset({
            email: response.user.email,
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (resetRes.error) {
            console.error('Failed to send welcome email');
            toast.warning('User created but welcome email failed to send');
          } else {
            toast.success('Welcome email sent!');
          }
        }

        // Transform the backend response to match frontend structure
        const newUser: UserRecord = {
          ...response.user,
          name: response.user.fullName || newUserName,
          location: response.user.organization || newUserLocation,
          teams: newUserTeams,
          lastActive: 'Just now',
          status: 'active' as Status,
        };

        setUsers(prev => [...prev, newUser]);
        toast.dismiss(toastId);
        toast.success(`User ${newUserName} created successfully`);
        closeCreateModal();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setPendingAction(null);
    }
  };

  const updateCreateCustomRole = (updater: (current: RoleDefinition) => RoleDefinition) => {
    setCreateCustomRole(current => updater(cloneRole(current)));
  };

  const resetPassword = async (email: any) => {
    const toastId = toast.loading('Sending password reset email...');
    let resetRes = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    console.log(resetRes);

    toast.dismiss(toastId);
    if (resetRes.error) {
      toast.error('Failed to send password reset email');
    } else {
      toast.success('Password reset email sent!');
    }
  };

  if (loadingRoles || loadingUsers) {
    return <AdminUsersPageSkeleton />;
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" wrap="wrap">
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
        <Button
          onClick={handleOpenCreateModal}
          leftSection={<IconPlus size={20} />}
          style={{ backgroundColor: '#1a1a3c' }}
          radius="md"
        >
          Create User
        </Button>
      </Group>

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
          change="From database"
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
              <Title order={3} fw={600} c="gray.9">
                No matches found
              </Title>
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
                                  {(user.name || user.fullName || user.email)
                                    .split(' ')
                                    .map(part => part[0])
                                    .slice(0, 2)
                                    .join('')}
                                </Box>
                                <Box>
                                  <Text fw={600} c="gray.9">
                                    {user.name || user.fullName || user.email}
                                  </Text>
                                  <Text size="sm" c="gray.5">
                                    {user.email}
                                  </Text>
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
                              <StatusBadge status={user.status || 'active'} />
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="gray.6">
                                {user.lastActive || (user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never')}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="gray.6">
                                {user.location || user.organization || 'Unknown'}
                              </Text>
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
                          <Text size="sm" fw={600} c="gray.9">
                            {user.name || user.fullName || user.email}
                          </Text>
                          <Text size="xs" c="gray.5">
                            {user.email}
                          </Text>
                        </Box>
                        <StatusBadge status={user.status || 'active'} />
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
                          {user.location || user.organization || 'Unknown'}
                        </Badge>
                        <Badge variant="light" size="xs" color="gray">
                          {user.lastActive || (user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never')}
                        </Badge>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>

              <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
                <MantinePagination value={page} total={pageCount} onChange={setPage} />
              </Box>
            </>
          )}
        </Paper>
      </Stack>

      {/* Edit User Modal */}
      <Modal
        opened={userModalOpened}
        onClose={resetUserModal}
        title={
          <Box>
            <Text size="sm" fw={600} c="blue.6">
              User profile
            </Text>
            <Title order={2} fw={700} c="gray.9" mt="xs">
              {userDraft?.name || userDraft?.fullName || userDraft?.email}
            </Title>
            <Text size="sm" c="gray.6" mt="xs">
              {userDraft?.location || userDraft?.organization || 'Unknown'}
            </Text>
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
                  <Text size="sm" c="gray.7">
                    {userDraft.email}
                  </Text>
                </Group>
              </Field>
              <Field label="Created">
                <Group gap="xs">
                  <IconCalendar size={14} />
                  <Text size="sm" c="gray.7">
                    {userDraft.createdAt ? new Date(userDraft.createdAt).toLocaleDateString() : 'Unknown'}
                  </Text>
                </Group>
              </Field>
              <Field label="Status">
                <StatusBadge status={userDraft.status || 'active'} />
              </Field>
              <Field label="Last active">
                <Group gap="xs">
                  <IconClock size={14} />
                  <Text size="sm" c="gray.7">
                    {userDraft.lastActive}
                  </Text>
                </Group>
              </Field>
            </SimpleGrid>

            <Paper withBorder radius="md" p="md">
              <Stack gap="md">
                <Group gap="xs" wrap="wrap">
                  <Text size="sm" fw={600} c="gray.9">
                    Role assignment
                  </Text>
                  <Badge variant="light" size="xs" color="gray">
                    Saved to database
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
                        key={role.name}
                        p="md"
                        withBorder
                        radius="md"
                        style={{
                          cursor: 'pointer',
                          borderColor: userDraft.role === role.name ? '#3b82f6' : '#e5e7eb',
                          backgroundColor: userDraft.role === role.name ? '#eff6ff' : 'white',
                        }}
                        onClick={() =>
                          setUserDraft(prev => (prev ? { ...prev, role: role.name as UserRole } : prev))
                        }
                      >
                        <Group justify="space-between">
                          <Box>
                            <Text size="sm" fw={600} c="gray.9">
                              {role.name}
                            </Text>
                            <Text size="xs" c="gray.5">
                              {role.description}
                            </Text>
                          </Box>
                          <input
                            type="radio"
                            checked={userDraft.role === role.name}
                            onChange={() =>
                              setUserDraft(prev => (prev ? { ...prev, role: role.name as UserRole } : prev))
                            }
                          />
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <TextInput
                      value={userCustomRole.name as string}
                      onChange={event =>
                        setUserCustomRole(prev => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Custom role name"
                      radius="md"
                    />
                    <Text size="sm" c="gray.6">
                      Custom role functionality will be available in a future update.
                      For now, please select from the available preset roles.
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Button
                disabled={!!pendingAction}
                onClick={handleSaveUser}
                leftSection={
                  pendingAction === 'save-user' || pendingAction === 'save-role' ? (
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
                onClick={() => resetPassword(userDraft.email)}
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

      {/* Create User Modal */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title={
          <Box>
            <Text size="sm" fw={600} c="blue.6">
              New User
            </Text>
            <Title order={2} fw={700} c="gray.9" mt="xs">
              Create User Account
            </Title>
            <Text size="sm" c="gray.6" mt="xs">
              Add a new user to the platform
            </Text>
          </Box>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          {/* Basic Information */}
          <Paper withBorder radius="md" p="md" bg="gray.0">
            <Text size="sm" fw={600} c="gray.9" mb="md">
              Basic Information
            </Text>
            <Stack gap="md">
              <TextInput
                label="Full Name"
                placeholder="Enter user's full name"
                value={newUserName}
                onChange={e => setNewUserName(e.currentTarget.value)}
                leftSection={<IconUser size={16} />}
                radius="md"
                required
              />
              <TextInput
                label="Email Address"
                placeholder="user@atlas.tm"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.currentTarget.value)}
                leftSection={<IconMail size={16} />}
                radius="md"
                type="email"
                required
              />
              <Select
                label="Location"
                placeholder="Select location"
                value={newUserLocation}
                onChange={value => value && setNewUserLocation(value)}
                data={locationOptions}
                leftSection={<IconMapPin size={16} />}
                radius="md"
                searchable
                required
              />
            </Stack>
          </Paper>

          {/* Teams */}
          <Paper withBorder radius="md" p="md" bg="gray.0">
            <Text size="sm" fw={600} c="gray.9" mb="md">
              Teams
            </Text>
            <Stack gap="md">
              <Group gap="xs" wrap="wrap">
                {newUserTeams.map(team => (
                  <Badge
                    key={team}
                    variant="light"
                    color="blue"
                    rightSection={
                      <Box
                        onClick={() =>
                          setNewUserTeams(prev => prev.filter(t => t !== team))
                        }
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <IconX size={12} />
                      </Box>
                    }
                    style={{ paddingRight: 4 }}
                  >
                    {team}
                  </Badge>
                ))}
                {newUserTeams.length === 0 && (
                  <Text size="sm" c="gray.5">
                    No teams assigned
                  </Text>
                )}
              </Group>
              <Select
                placeholder="Add team"
                data={teamOptions.filter(team => !newUserTeams.includes(team))}
                leftSection={<IconUsers size={16} />}
                radius="md"
                searchable
                onChange={value => {
                  if (value && !newUserTeams.includes(value)) {
                    setNewUserTeams(prev => [...prev, value]);
                  }
                }}
                value={null}
              />
            </Stack>
          </Paper>

          {/* Role Assignment */}
          <Paper withBorder radius="md" p="md" bg="gray.0">
            <Stack gap="md">
              <Group gap="xs">
                <Text size="sm" fw={600} c="gray.9">
                  Role Assignment
                </Text>
                <Badge variant="light" size="xs" color="gray">
                  Required
                </Badge>
              </Group>

              <Group gap="xs" wrap="wrap">
                <Button
                  variant={'filled'}
                  color={'blue'}
                  size="sm"
                  radius="xl"
                  style={{
                    backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af'
                  }}
                >
                  Preset role
                </Button>
              </Group>

              <Stack gap="xs">
                {roles.map(role => (
                  <Paper
                    key={role.name}
                    p="md"
                    withBorder
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      borderColor: newUserRoleId === role.name ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: newUserRoleId === role.name ? '#eff6ff' : 'white',
                    }}
                    onClick={() => setNewUserRoleId(role.name as string)}
                  >
                    <Group justify="space-between">
                      <Box>
                        <Group gap="sm" mb="xs">
                          <Text size="sm" fw={600} c="gray.9">
                            {role.name}
                          </Text>
                          <Badge
                            variant="light"
                            size="xs"
                            style={{
                              border: '1px solid',
                              ...parseBadgeClass(role.badgeClass || getRoleBadgeClass(role.name as string)),
                            }}
                          >
                            {role.name}
                          </Badge>
                        </Group>
                        <Text size="xs" c="gray.5">
                          {role.description}
                        </Text>
                      </Box>
                      <input
                        type="radio"
                        checked={newUserRoleId === role.name}
                        onChange={() => setNewUserRoleId(role.name as string)}
                        style={{ cursor: 'pointer' }}
                      />
                    </Group>
                  </Paper>
                ))}
              </Stack>

            </Stack>
          </Paper>

          {/* Status */}
          <Paper withBorder radius="md" p="md" bg="gray.0">
            <Text size="sm" fw={600} c="gray.9" mb="md">
              Account Status
            </Text>
            <Group gap="md">
              <Checkbox
                label="Active"
                checked={newUserStatus === 'active'}
                onChange={e =>
                  setNewUserStatus(e.currentTarget.checked ? 'active' : 'suspended')
                }
              />
              <Text size="xs" c="gray.5">
                User will have immediate access to the platform
              </Text>
            </Group>
          </Paper>

          {/* Actions */}
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={closeCreateModal} radius="md">
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!!pendingAction}
              leftSection={
                pendingAction === 'create-user' ? <Loader size={16} /> : <IconPlus size={16} />
              }
              style={{ backgroundColor: '#1a1a3c' }}
              radius="md"
            >
              Create User
            </Button>
          </Group>
        </Stack>
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
          <Text
            size="xs"
            fw={600}
            c="gray.5"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {label}
          </Text>
          <Title order={2} fw={700} c="gray.9" mt="xs">
            {value}
          </Title>
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
      <Text size="sm" c="gray.6" mt="md">
        {change}
      </Text>
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
        <Text size="sm" fw={600} c="gray.9">
          Filters
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <TextInput
          value={search}
          onChange={event => onSearch(event.target.value)}
          placeholder="Search users, email, parishes..."
          leftSection={<IconSearch size={18} />}
          radius="md"
        />
        <Select
          value={roleFilter}
          onChange={value => value && onRoleFilter(value)}
          data={[
            { value: 'all', label: 'All roles' },
            ...roleOptions.map(role => ({ value: role.id, label: role.label })),
          ]}
          radius="md"
        />
        <Select
          value={statusFilter}
          onChange={value => value && onStatusFilter(value as 'all' | Status)}
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

// Permission matrix and form toggle components removed
// These are no longer needed with the new RBAC system

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
      <Text
        size="xs"
        fw={600}
        c="gray.5"
        style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
      >
        {label}
      </Text>
      <Paper withBorder radius="md" p="sm">
        {children}
      </Paper>
    </Stack>
  );
}

function AdminUsersPageSkeleton() {
  return (
    <Stack gap="md">
      {/* Header Section */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Skeleton height={14} width={100} mb="xs" />
          <Skeleton height={32} width={200} mb="xs" />
          <Skeleton height={16} width={300} />
        </Box>
        <Skeleton height={36} width={120} />
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {Array.from({ length: 3 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Paper withBorder shadow="sm" radius="md" p="md">
        <Group gap="xs" mb="md">
          <Skeleton height={16} width={16} />
          <Skeleton height={16} width={60} />
        </Group>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </SimpleGrid>
      </Paper>

      {/* Users Table/Cards */}
      <Paper withBorder shadow="lg" radius="md" style={{ overflow: 'hidden' }}>
        {/* Desktop Table Skeleton */}
        <Box visibleFrom="xl">
          <Table.ScrollContainer minWidth={800}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th><Skeleton height={16} width={60} /></Table.Th>
                  <Table.Th><Skeleton height={16} width={40} /></Table.Th>
                  <Table.Th><Skeleton height={16} width={50} /></Table.Th>
                  <Table.Th><Skeleton height={16} width={80} /></Table.Th>
                  <Table.Th><Skeleton height={16} width={70} /></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: 6 }).map((_, index) => (
                  <UserTableRowSkeleton key={index} />
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Box>

        {/* Mobile Cards Skeleton */}
        <Stack gap="xs" hiddenFrom="xl" p="md">
          {Array.from({ length: 6 }).map((_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </Stack>

        {/* Pagination Skeleton */}
        <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
          <Group justify="center">
            <Skeleton height={32} width={200} />
          </Group>
        </Box>
      </Paper>
    </Stack>
  );
}

function SummaryCardSkeleton() {
  return (
    <Paper withBorder shadow="sm" radius="md" p="md">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Skeleton height={12} width={80} mb="xs" />
          <Skeleton height={28} width={40} mb="md" />
          <Skeleton height={14} width={100} />
        </Box>
        <Skeleton height={44} width={44} radius="50%" />
      </Group>
    </Paper>
  );
}

function UserTableRowSkeleton() {
  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm">
          <Skeleton height={44} width={44} radius="50%" />
          <Box>
            <Skeleton height={16} width={120} mb="xs" />
            <Skeleton height={14} width={180} />
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Skeleton height={24} width={80} radius="md" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={24} width={60} radius="md" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={14} width={90} />
      </Table.Td>
      <Table.Td>
        <Skeleton height={14} width={100} />
      </Table.Td>
    </Table.Tr>
  );
}

function UserCardSkeleton() {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="flex-start" mb="md">
        <Box>
          <Skeleton height={16} width={140} mb="xs" />
          <Skeleton height={12} width={180} />
        </Box>
        <Skeleton height={24} width={60} radius="md" />
      </Group>
      <Group gap="xs">
        <Skeleton height={20} width={70} radius="md" />
        <Skeleton height={20} width={90} radius="md" />
        <Skeleton height={20} width={80} radius="md" />
      </Group>
    </Paper>
  );
}