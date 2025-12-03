'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import {
    Paper,
    Stack,
    Group,
    Button,
    Text,
    Loader,
    Select,
    Card,
    Badge,
    Menu,
    ActionIcon,
    Title,
    Container,
    Grid,
    Divider,
    Box
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
    IconPlus,
    IconDots,
    IconEdit,
    IconEye,
    IconTrash,
    IconAlertCircle
} from '@tabler/icons-react';
import DashboardNavigation from '@/components/DashboardNavigation';

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
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    archivedAt?: string;
}

const ManageFormsPage = () => {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const { hasPermission: canViewForms, isLoading: permissionsLoading } = usePermission(['forms_view', 'forms_view_submissions'], false);
    const { hasPermission: canCreateForms } = usePermission('forms_create_templates');
    const { hasPermission: canEditForms } = usePermission('forms_edit_templates');
    const { hasPermission: canDeleteForms } = usePermission('forms_delete_templates');

    const [forms, setForms] = useState<CustomForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Fetch forms function (extracted for reuse)
    const fetchForms = async () => {
        if (!canViewForms && !permissionsLoading) {
            setIsLoading(false);
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
            setForms(data.forms || []);
        } catch (error) {
            console.error('Error fetching forms:', error);
            toast.error('Failed to load forms');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch forms on mount and when permissions change
    useEffect(() => {
        if (!permissionsLoading) {
            fetchForms();
        }
    }, [canViewForms, permissionsLoading]);

    // Filter forms based on status
    const filteredForms = forms.filter(form =>
        statusFilter === 'all' || form.status === statusFilter
    );

    // Delete form
    const handleDeleteForm = async (formId: string, formName: string) => {
        if (!confirm(`Are you sure you want to delete "${formName}"? This action cannot be undone.`)) {
            return;
        }

        const toastId = toast.loading('Deleting form...');
        try {
            const response = await fetch(`/api/forms/${formId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete form');
            }

            toast.dismiss(toastId);
            toast.success('Form deleted successfully');
            
            // Refetch forms to get fresh data from server
            await fetchForms();
        } catch (error) {
            console.error('Error deleting form:', error);
            toast.dismiss(toastId);
            toast.error(error instanceof Error ? error.message : 'Failed to delete form');
        }
    };

    // Update form status
    const handleStatusChange = async (formId: string, newStatus: CustomForm['status']) => {
        try {
            let id = toast.loading('Updating form status...');
            const response = await fetch(`/api/forms/${formId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            toast.dismiss(id);

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || 'Failed to update form status');
                throw new Error(error.error || 'Failed to update form status');
            }

            const data = await response.json();
            
            toast.success(`Form ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'saved as draft'} successfully`);
            
            // Refetch forms to get fresh data from server
            await fetchForms();
        } catch (error) {
            console.error('Error updating form status:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update form status');
        }
    };

    // Get status badge color
    const getStatusColor = (status: CustomForm['status']) => {
        const colors = {
            draft: 'gray',
            published: 'green',
            archived: 'red',
        };
        return colors[status];
    };

    // Loading state
    if (permissionsLoading || isLoading) {
        return (
            <Container size="xl" py="xl">
                <Paper p={isMobile ? "md" : "xl"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                    <Stack align="center" gap="md" py="xl">
                        <Loader size="lg" />
                        <Text size="sm" c="dimmed">Loading forms...</Text>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    // Permission check
    if (!canViewForms) {
        return (
            <Container size="xl" py="xl">
                <Paper p={isMobile ? "md" : "xl"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                    <Stack align="center" gap="md" py="xl">
                        <Box
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                backgroundColor: 'var(--mantine-color-red-1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconAlertCircle size={32} color="var(--mantine-color-red-6)" />
                        </Box>
                        <Title order={3} ta="center">Access Denied</Title>
                        <Text size="sm" c="dimmed" ta="center">
                            You don't have permission to view forms. Contact your administrator.
                        </Text>
                        <Button
                            onClick={() => router.push('/')}
                            mt="md"
                            size={isMobile ? "md" : "sm"}
                        >
                            Back to Dashboard
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    return (
        <Container size="xl" py={isMobile ? "md" : "xl"}>
            <Stack gap="lg">
                {/* Header */}
                <Paper p={isMobile ? "md" : "lg"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                    <Stack gap="md">
                        <Group justify="space-between" wrap="wrap">
                            <div>
                                <Title order={2} size={isMobile ? "h3" : "h2"}>Forms</Title>
                                <Text size="sm" c="dimmed" mt="xs">
                                    Manage and create custom forms for data collection
                                </Text>
                            </div>
                            {canCreateForms && (
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => router.push('/manage-forms/create')}
                                    size={isMobile ? "md" : "sm"}
                                    style={{
                                        minHeight: isMobile ? '44px' : undefined,
                                    }}
                                >
                                    Create Form
                                </Button>
                            )}
                        </Group>

                        <Divider />

                        {/* Filters */}
                        <Group gap="md">
                            <Text size="sm" fw={500}>Filter by status:</Text>
                            <Select
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value || 'all')}
                                data={[
                                    { value: 'all', label: 'All Forms' },
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'published', label: 'Published' },
                                    { value: 'archived', label: 'Archived' },
                                ]}
                                size={isMobile ? "md" : "sm"}
                                style={{ width: isMobile ? '100%' : 200 }}
                                styles={{
                                    input: {
                                        fontSize: isMobile ? '16px' : undefined,
                                        minHeight: isMobile ? '44px' : undefined,
                                    },
                                }}
                            />
                        </Group>
                    </Stack>
                </Paper>

                {/* Forms Grid */}
                {filteredForms.length === 0 ? (
                    <Paper p={isMobile ? "md" : "xl"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                        <Stack align="center" gap="md" py="xl">
                            <Box
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--mantine-color-gray-1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5A3.375 3.375 0 008.25 11.625v2.625" />
                                    <path d="M5.25 19.5h13.5a2.25 2.25 0 002.25-2.25v-2.25a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </Box>
                            <Title order={4} ta="center">No forms found</Title>
                            <Text size="sm" c="dimmed" ta="center">
                                {statusFilter === 'all'
                                    ? 'Get started by creating your first form.'
                                    : `No forms with status "${statusFilter}" found.`
                                }
                            </Text>
                            {canCreateForms && statusFilter === 'all' && (
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => router.push('/manage-forms/create')}
                                    mt="md"
                                    size={isMobile ? "md" : "sm"}
                                    style={{
                                        minHeight: isMobile ? '44px' : undefined,
                                    }}
                                >
                                    Create Your First Form
                                </Button>
                            )}
                        </Stack>
                    </Paper>
                ) : (
                    <Grid gutter="md">
                        {filteredForms.map((form) => (
                            <Grid.Col key={form.id} span={{ base: 12, sm: 6, md: 4 }}>
                                <Card
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                    style={{
                                        height: '100%',
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <Stack gap="md" h="100%" justify="space-between">
                                        {/* Header */}
                                        <Stack gap="xs">
                                            <Group justify="space-between" wrap="nowrap">
                                                <Title
                                                    order={4}
                                                    size={isMobile ? "h5" : "h4"}
                                                    style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        flex: 1,
                                                    }}
                                                >
                                                    {form.name}
                                                </Title>
                                                <Badge
                                                    color={getStatusColor(form.status)}
                                                    variant="light"
                                                    size={isMobile ? "md" : "sm"}
                                                >
                                                    {form.status}
                                                </Badge>
                                            </Group>

                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                lineClamp={2}
                                            >
                                                {form.description}
                                            </Text>
                                        </Stack>

                                        {/* Metadata */}
                                        <Group justify="space-between">
                                            <Text size="xs" c="dimmed">
                                                {form.fields.length} fields
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {new Date(form.updatedAt).toLocaleDateString()}
                                            </Text>
                                        </Group>

                                        <Divider />

                                        {/* Actions */}
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                {canEditForms && (
                                                    <Button
                                                        variant="light"
                                                        size="xs"
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => router.push(`/forms/edit/${form.id}`)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="subtle"
                                                    size="xs"
                                                    leftSection={<IconEye size={14} />}
                                                    onClick={() => router.push(`/forms/view/${form.id}`)}
                                                >
                                                    View
                                                </Button>
                                            </Group>

                                            <Group gap={4}>
                                                {canEditForms && (
                                                    <Select
                                                        value={form.status}
                                                        onChange={(value) => handleStatusChange(form.id, value as CustomForm['status'])}
                                                        data={[
                                                            { value: 'draft', label: 'Draft' },
                                                            { value: 'published', label: 'Published' },
                                                            { value: 'archived', label: 'Archived' },
                                                        ]}
                                                        size="xs"
                                                        style={{ width: 110 }}
                                                    />
                                                )}

                                                {canDeleteForms && (
                                                    <Menu position="bottom-end" shadow="md">
                                                        <Menu.Target>
                                                            <ActionIcon variant="subtle" color="gray">
                                                                <IconDots size={16} />
                                                            </ActionIcon>
                                                        </Menu.Target>

                                                        <Menu.Dropdown>
                                                            <Menu.Item
                                                                leftSection={<IconTrash size={14} />}
                                                                color="red"
                                                                onClick={() => handleDeleteForm(form.id, form.name)}
                                                            >
                                                                Delete
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                )}
                                            </Group>
                                        </Group>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                )}
            </Stack>
        </Container>
    );
}

export default function ManagePage() {
    return (
        <>
            <DashboardNavigation />

            <Suspense fallback={<div>Loading...</div>}>
                <ManageFormsPage />
            </Suspense>
        </>
    );
}