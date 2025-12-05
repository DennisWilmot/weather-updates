'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Container,
  Stack,
  Title,
  Text,
  Alert,
  Paper,
  Group,
  Box,
  Center,
  Loader,
  TextInput,
  Select,
  Grid,
  Card,
  Badge,
  Button,
  Modal,
  Divider,
  ActionIcon,
  Tooltip,
  Skeleton
} from '@mantine/core';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import {
  IconPackage,
  IconMapPin,
  IconUsers,
  IconUserCheck,
  IconCheck,
  IconAlertCircle,
  IconStatusChange,
  IconSearch,
  IconFilter,
  IconForms,
  IconStar,
  IconClock,
  IconEye,
  IconX,
  IconSettings,
  IconPlus,
  IconBuilding
} from '@tabler/icons-react';
import PortalLayout from '@/components/portals/PortalLayout';
import { usePermission, useRole } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Dynamic imports for predefined forms
const AssetsDistributionForm = dynamic(() => import('@/components/portals/AssetsDistributionForm'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

const PlaceStatusForm = dynamic(() => import('@/components/portals/PlaceStatusForm'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

const PeopleNeedsForm = dynamic(() => import('@/components/portals/PeopleNeedsForm'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

const AidWorkerScheduleForm = dynamic(() => import('@/components/portals/AidWorkerScheduleForm'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

const AvailableAssetsForm = dynamic(() => import('@/components/portals/AvailableAssetsForm'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

const MerchantOnboardingForm = dynamic(() => import('@/components/portals/MerchantOnboardingForm'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

// Dynamic import for custom form renderer
const CustomFormRenderer = dynamic(() => import('@/components/portals/CustomFormRenderer'), {
  ssr: false,
  loading: () => <Center py="xl"><Loader /></Center>,
});

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface CustomForm {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  fields: FormField[];
  allowedRoles: string[]; // Array of UserRole strings that can access this form
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PredefinedForm {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  isPredefined: true;
  allowedRoles: string[]; // Array of UserRole strings that can access this form
}

interface FormItem extends Partial<CustomForm> {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon?: React.ReactNode;
  component?: React.ComponentType<any>;
  isPredefined?: boolean;
  isCustom?: boolean;
}

export default function PortalPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)') ?? false;
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);

  const { hasPermission: canViewForms } = usePermission(['forms_view', 'forms_view_submissions'], false);
  const { hasPermission: canManageForms } = usePermission(['forms_create_templates', 'forms_edit_templates', 'forms_delete_templates'], false);
  const { role: userRole } = useRole();

  // Predefined forms configuration
  const predefinedForms: PredefinedForm[] = [
    {
      id: 'assets-distribution',
      name: 'Asset Distribution',
      description: 'Record asset distributions to individuals or locations. This information will be displayed on the dashboard map.',
      category: 'Assets',
      icon: <IconStatusChange size={20} />,
      component: AssetsDistributionForm,
      isPredefined: true,
      allowedRoles: ['admin', 'ops', 'field'], // Assets management for admin, ops, and field workers
    },
    {
      id: 'available-assets',
      name: 'Available Assets',
      description: 'Record asset availability to individuals or locations. This information will be displayed on the dashboard map.',
      category: 'Assets',
      icon: <IconPackage size={20} />,
      component: AvailableAssetsForm,
      isPredefined: true,
      allowedRoles: ['admin', 'ops', 'field'], // Assets management for admin, ops, and field workers
    },
    {
      id: 'place-status',
      name: 'Place Status',
      description: 'Report the operational status of places including electricity, water, WiFi, and shelter capacity.',
      category: 'Places',
      icon: <IconMapPin size={20} />,
      component: PlaceStatusForm,
      isPredefined: true,
      allowedRoles: ['admin', 'ops', 'field'], // Place status reporting for admin, ops, and field workers
    },
    {
      id: 'people-needs',
      name: 'People Needs',
      description: 'Report the needs of people in affected areas. This helps coordinate relief efforts and prioritize assistance.',
      category: 'People',
      icon: <IconUsers size={20} />,
      component: PeopleNeedsForm,
      isPredefined: true,
      allowedRoles: ['admin', 'ops', 'field', 'needs'], // People needs accessible to all roles including needs reporters
    },
    {
      id: 'aid-workers',
      name: 'Aid Worker Schedule',
      description: 'Register aid worker schedules, capabilities, and deployment information.',
      category: 'Aid Workers',
      icon: <IconUserCheck size={20} />,
      component: AidWorkerScheduleForm,
      isPredefined: true,
      allowedRoles: ['admin', 'ops'], // Aid worker management for admin and ops only
    },
    {
      id: 'merchant-onboarding',
      name: 'MSME Merchant Onboarding',
      description: 'Onboard MSME merchants for the Digital Jamaica ATLAS AI program. Register business information, location, and contact details.',
      category: 'Merchants',
      icon: <IconBuilding size={20} />,
      component: MerchantOnboardingForm,
      isPredefined: true,
      allowedRoles: ['admin', 'ops', 'field'], // Merchant onboarding for admin, ops, and field workers
    },
  ];

  // Fetch custom forms
  useEffect(() => {
    const fetchCustomForms = async () => {
      if (!canViewForms) {
        setIsLoadingForms(false);
        return;
      }

      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`/api/forms?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch forms');
        }

        const data = await response.json();
        const publishedForms = (data.forms || []).filter((form: CustomForm) => form.status === 'published');
        setCustomForms(publishedForms);
      } catch (error) {
        console.error('Error fetching custom forms:', error);
        toast.error('Failed to load custom forms');
      } finally {
        setIsLoadingForms(false);
      }
    };

    fetchCustomForms();

    // Refetch forms when window regains focus (e.g., after publishing a form in another tab)
    const handleFocus = () => {
      if (canViewForms) {
        fetchCustomForms();
      }
    };

    // Also poll every 30 seconds to catch updates
    const pollInterval = setInterval(() => {
      if (canViewForms && document.hasFocus()) {
        fetchCustomForms();
      }
    }, 30000); // 30 seconds

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [canViewForms]);

  // Filter predefined forms based on user role
  const accessiblePredefinedForms = predefinedForms.filter(form => {
    if (!userRole) return false; // If role is not loaded yet, don't show any forms
    return form.allowedRoles.includes(userRole);
  });

  // Combine predefined and custom forms
  const allForms: FormItem[] = [
    ...accessiblePredefinedForms,
    ...customForms.map(form => ({
      ...form,
      category: 'Custom Forms',
      icon: <IconForms size={20} />,
      isCustom: true,
    }))
  ];

  // Filter forms based on search and category
  const filteredForms = allForms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || form.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(allForms.map(form => form.category).filter(Boolean)))] as string[];

  const handleSuccess = () => {
    setSubmitted(true);
    setError(null);
    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  const handleError = (err: string) => {
    setError(err);
    setSubmitted(false);
  };

  const handleFormSelect = (form: FormItem) => {
    setSelectedForm(form);
    openFormModal();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Assets': 'blue',
      'Places': 'green',
      'People': 'orange',
      'Aid Workers': 'purple',
      'Custom Forms': 'teal',
    };
    return colors[category] || 'gray';
  };

  const formatRoleName = (role: string) => {
    // Capitalize first letter and handle common role names
    const formatted = role.charAt(0).toUpperCase() + role.slice(1);

    // Map common role names to more descriptive titles
    const roleNames: Record<string, string> = {
      'admin': 'Admin',
      'ops': 'Operations',
      'field': 'Field Reporter',
      'analyst': 'Analyst',
      'needs': 'Needs Reporter',
    };

    return roleNames[role.toLowerCase()] || formatted;
  };

  const getFormStats = (form: FormItem) => {
    if (form.isPredefined) {
      return {
        type: 'System Form',
        badge: 'system',
        roles: form.allowedRoles || ['admin']
      };
    }
    if (form.isCustom) {
      return {
        type: 'Custom Form',
        badge: 'custom',
        fields: form.fields?.length || 0,
        updated: form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : 'Unknown',
        roles: form.allowedRoles || ['admin']
      };
    }
    return { type: 'Form', badge: 'default' };
  };

  if (isLoadingForms) {
    return (
      <PortalLayout title="Portal" icon={<IconForms size={28} />}>
        <PortalPageSkeleton isMobile={isMobile} />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Portal" icon={<IconForms size={28} />}>
      <Container size="lg" py={isMobile ? "md" : "xl"}>
        <Stack gap="lg">
          {/* Header */}
          <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Title order={2} size={isMobile ? "h3" : "h2"}>
                    Data Collection Portal
                  </Title>
                  <Text size={isMobile ? "sm" : "md"} c="dimmed" mt="xs">
                    Access all available forms for data collection and reporting. Choose from system forms or custom forms created by your organization.
                  </Text>
                </div>

                {/* Manage Forms Button */}
                {canManageForms && (
                  <Group gap="xs">
                    <Button
                      variant="light"
                      leftSection={<IconSettings size={16} />}
                      onClick={() => router.push('/manage-forms')}
                      size={isMobile ? "sm" : "md"}
                      style={{
                        minHeight: isMobile ? '36px' : undefined,
                      }}
                    >
                      {isMobile ? 'Manage' : 'Manage Forms'}
                    </Button>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={() => router.push('/manage-forms/create')}
                      size={isMobile ? "sm" : "md"}
                      style={{
                        minHeight: isMobile ? '36px' : undefined,
                      }}
                    >
                      {isMobile ? 'Create' : 'Create Form'}
                    </Button>
                  </Group>
                )}
              </Group>

              <Group gap="md" mt="sm">
                <Group gap="xs">
                  <IconForms size={16} />
                  <Text size="sm" c="dimmed">
                    {allForms.length} forms available
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconStar size={16} />
                  <Text size="sm" c="dimmed">
                    {predefinedForms.length} system forms
                  </Text>
                </Group>
                {customForms.length > 0 && (
                  <Group gap="xs">
                    <IconForms size={16} />
                    <Text size="sm" c="dimmed">
                      {customForms.length} custom forms
                    </Text>
                  </Group>
                )}
              </Group>
            </Stack>
          </Paper>

          {/* Search and Filters */}
          <Paper p="md" withBorder radius="md">
            <Stack gap="md">
              <Group gap="md" grow={isMobile}>
                <TextInput
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={16} />}
                  rightSection={
                    searchQuery && (
                      <ActionIcon
                        variant="subtle"
                        onClick={() => setSearchQuery('')}
                        size="sm"
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    )
                  }
                  size={isMobile ? "md" : "sm"}
                />
                <Select
                  placeholder="All Categories"
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value || 'all')}
                  data={categories.map(cat => ({
                    value: cat,
                    label: cat === 'all' ? 'All Categories' : (cat || 'Unknown')
                  }))}
                  leftSection={<IconFilter size={16} />}
                  clearable
                  size={isMobile ? "md" : "sm"}
                />
              </Group>

              {(searchQuery || categoryFilter !== 'all') && (
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Showing {filteredForms.length} of {allForms.length} forms
                  </Text>
                  {(searchQuery || categoryFilter !== 'all') && (
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Success Message */}
          {submitted && (
            <Alert
              icon={<IconCheck size={20} />}
              title="Success!"
              color="green"
              onClose={() => setSubmitted(false)}
              withCloseButton
            >
              Form submitted successfully! The data will appear on the dashboard map shortly.
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={20} />}
              title="Error"
              color="red"
              onClose={() => setError(null)}
              withCloseButton
            >
              {error}
            </Alert>
          )}

          {/* Forms Grid */}
          {filteredForms.length === 0 ? (
            <Paper p="xl" withBorder radius="md">
              <Stack align="center" gap="md">
                <IconSearch size={48} color="gray" />
                <Title order={3} c="dimmed">No forms found</Title>
                <Text c="dimmed" ta="center">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No forms are currently available.'
                  }
                </Text>
                {(searchQuery || categoryFilter !== 'all') && (
                  <Button
                    variant="light"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </Stack>
            </Paper>
          ) : (
            <Grid gutter="md">
              {filteredForms.map((form) => {
                const stats = getFormStats(form);
                return (
                  <Grid.Col key={form.id} span={{ base: 12, sm: 6, lg: 4 }}>
                    <Card
                      withBorder
                      radius="md"
                      p="md"
                      style={{
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleFormSelect(form)}
                      className="hover:shadow-lg hover:border-blue-500"
                    >
                      <Stack gap="sm" h="100%">
                        {/* Header */}
                        <Group justify="space-between" align="flex-start">
                          <Group gap="sm">
                            {form.icon}
                            <div style={{ flex: 1 }}>
                              <Text fw={600} size="sm" lineClamp={1}>
                                {form.name}
                              </Text>
                            </div>
                          </Group>
                          <Badge
                            size="xs"
                            variant="light"
                            color={getCategoryColor(form.category || 'default')}
                          >
                            {form.category}
                          </Badge>
                        </Group>

                        {/* Description */}
                        <Text size="xs" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
                          {form.description}
                        </Text>

                        {/* Stats */}
                        <Stack gap="xs">
                          <Group gap="xs" justify="space-between">
                            <Badge
                              size="xs"
                              variant="dot"
                              color={stats.badge === 'system' ? 'blue' : stats.badge === 'custom' ? 'teal' : 'gray'}
                            >
                              {stats.type}
                            </Badge>
                            {form.isCustom && stats.fields && (
                              <Text size="xs" c="dimmed">
                                {stats.fields} fields
                              </Text>
                            )}
                          </Group>

                          {form.isCustom && stats.updated && (
                            <Group gap="xs">
                              <IconClock size={12} />
                              <Text size="xs" c="dimmed">
                                Updated {stats.updated}
                              </Text>
                            </Group>
                          )}

                          {/* Role Access Information */}
                          {stats.roles && stats.roles.length > 0 && (
                            <Group gap="xs" wrap="wrap">
                              <Text size="xs" c="dimmed">Access:</Text>
                              {stats.roles.slice(0, 3).map((role, index) => (
                                <Badge
                                  key={role}
                                  size="xs"
                                  variant="outline"
                                  color="gray"
                                >
                                  {formatRoleName(role)}
                                </Badge>
                              ))}
                              {stats.roles.length > 3 && (
                                <Text size="xs" c="dimmed">
                                  +{stats.roles.length - 3} more
                                </Text>
                              )}
                            </Group>
                          )}
                        </Stack>

                        {/* Action */}
                        <Button
                          variant="light"
                          size="xs"
                          fullWidth
                          leftSection={<IconEye size={14} />}
                        >
                          Open Form
                        </Button>
                      </Stack>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}

          {/* Form Modal */}
          <Modal
            opened={formModalOpened}
            onClose={closeFormModal}
            title={
              selectedForm && (
                <Group gap="sm">
                  {selectedForm.icon}
                  <div>
                    <Text fw={600}>{selectedForm.name}</Text>
                    <Text size="xs" c="dimmed">{selectedForm.category}</Text>
                  </div>
                </Group>
              )
            }
            size="xl"
            centered
          >
            {selectedForm && (
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  {selectedForm.description}
                </Text>

                <Divider />

                {/* Render the appropriate form */}
                {selectedForm.isPredefined && selectedForm.component && (
                  <selectedForm.component
                    onSuccess={() => {
                      handleSuccess();
                      closeFormModal();
                    }}
                    onError={handleError}
                  />
                )}

                {selectedForm.isCustom && (
                  <CustomFormRenderer
                    form={selectedForm as CustomForm}
                    onSuccess={() => {
                      handleSuccess();
                      closeFormModal();
                    }}
                    onError={handleError}
                  />
                )}
              </Stack>
            )}
          </Modal>

          {/* Tips and Quick Actions */}
          <Stack gap="md">
            <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  💡 Tips for using the portal:
                </Text>
                <Text size="xs" c="dimmed">
                  • Use the search bar to quickly find specific forms
                  <br />
                  • Filter by category to browse related forms
                  <br />
                  • System forms are pre-built and optimized for common tasks
                  <br />
                  • Custom forms are created by your organization for specific needs
                  <br />
                  • All submitted data will appear on the dashboard map for coordination
                </Text>
              </Stack>
            </Paper>

            {/* Quick Actions for Form Management */}
            {canManageForms && (
              <Paper p="md" withBorder radius="md">
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconSettings size={16} />
                    <Text size="sm" fw={600}>
                      Form Management
                    </Text>
                  </Group>
                  <Group gap="sm" grow={isMobile}>
                    <Button
                      variant="light"
                      leftSection={<IconForms size={14} />}
                      onClick={() => router.push('/manage-forms')}
                      size={isMobile ? "md" : "sm"}
                      style={{
                        minHeight: isMobile ? '44px' : undefined,
                      }}
                    >
                      {isMobile ? 'Manage Forms' : 'View All Forms'}
                    </Button>
                    <Button
                      leftSection={<IconPlus size={14} />}
                      onClick={() => router.push('/manage-forms/create')}
                      size={isMobile ? "md" : "sm"}
                      style={{
                        minHeight: isMobile ? '44px' : undefined,
                      }}
                    >
                      Create New Form
                    </Button>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Manage custom forms, edit templates, and configure form settings.
                  </Text>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Stack>
      </Container>
    </PortalLayout>
  );
}

function PortalPageSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Container size="lg" py={isMobile ? "md" : "xl"}>
      <Stack gap="lg">
        {/* Header Skeleton */}
        <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Skeleton height={isMobile ? 24 : 32} width={250} mb="xs" />
                <Skeleton height={isMobile ? 14 : 16} width={400} />
              </div>
              <Group gap="xs">
                <Skeleton height={isMobile ? 36 : 40} width={isMobile ? 80 : 120} />
                <Skeleton height={isMobile ? 36 : 40} width={isMobile ? 70 : 100} />
              </Group>
            </Group>

            <Group gap="md" mt="sm">
              <Group gap="xs">
                <Skeleton height={16} width={16} />
                <Skeleton height={14} width={120} />
              </Group>
              <Group gap="xs">
                <Skeleton height={16} width={16} />
                <Skeleton height={14} width={100} />
              </Group>
              <Group gap="xs">
                <Skeleton height={16} width={16} />
                <Skeleton height={14} width={110} />
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Search and Filters Skeleton */}
        <Paper p="md" withBorder radius="md">
          <Stack gap="md">
            <Group gap="md" grow={isMobile}>
              <Skeleton height={isMobile ? 40 : 36} />
              <Skeleton height={isMobile ? 40 : 36} />
            </Group>
            <Group gap="xs">
              <Skeleton height={12} width={150} />
              <Skeleton height={20} width={80} />
            </Group>
          </Stack>
        </Paper>

        {/* Forms Grid Skeleton */}
        <Grid gutter="md">
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
              <FormCardSkeleton />
            </Grid.Col>
          ))}
        </Grid>

        {/* Tips Section Skeleton */}
        <Stack gap="md">
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Skeleton height={16} width={200} />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="90%" />
              <Skeleton height={12} width="95%" />
            </Stack>
          </Paper>

          <Paper p="md" withBorder radius="md">
            <Stack gap="sm">
              <Group gap="xs">
                <Skeleton height={16} width={16} />
                <Skeleton height={16} width={120} />
              </Group>
              <Group gap="sm" grow={isMobile}>
                <Skeleton height={isMobile ? 44 : 36} />
                <Skeleton height={isMobile ? 44 : 36} />
              </Group>
              <Skeleton height={12} width="80%" />
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}

function FormCardSkeleton() {
  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{ height: '100%' }}
    >
      <Stack gap="sm" h="100%">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <Skeleton height={20} width={20} />
            <Skeleton height={16} width={120} />
          </Group>
          <Skeleton height={20} width={60} radius="md" />
        </Group>

        {/* Description */}
        <Stack gap="xs" style={{ flex: 1 }}>
          <Skeleton height={12} width="100%" />
          <Skeleton height={12} width="90%" />
          <Skeleton height={12} width="80%" />
        </Stack>

        {/* Stats */}
        <Stack gap="xs">
          <Group gap="xs" justify="space-between">
            <Skeleton height={16} width={80} radius="md" />
            <Skeleton height={12} width={60} />
          </Group>
          <Group gap="xs">
            <Skeleton height={12} width={12} />
            <Skeleton height={12} width={100} />
          </Group>
        </Stack>

        {/* Action Button */}
        <Skeleton height={28} width="100%" radius="md" />
      </Stack>
    </Card>
  );
}