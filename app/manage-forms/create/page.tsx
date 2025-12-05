'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '../../../hooks/usePermissions';
import { toast } from 'sonner';
import {
    Paper,
    Stack,
    Group,
    Button,
    Text,
    Loader,
    Select,
    TextInput,
    Textarea,
    Container,
    Title,
    Badge,
    Checkbox,
    ActionIcon,
    Divider,
    Modal,
    Grid,
    Box,
    Card,
    MultiSelect,
} from '@mantine/core';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import {
    IconPlus,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
    IconAlertCircle,
    IconArrowLeft,
    IconX,
} from '@tabler/icons-react';
import DashboardNavigation from '@/components/DashboardNavigation';

// Form field types that can be used in custom forms
interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'radio' | 'file' | 'photo-location';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select, radio fields
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

// Predetermined field templates
const FIELD_TEMPLATES: Omit<FormField, 'id' | 'required'>[] = [
    { type: 'text', label: 'Full Name', placeholder: 'Enter full name' },
    { type: 'email', label: 'Email Address', placeholder: 'Enter email address' },
    { type: 'phone', label: 'Phone Number', placeholder: 'Enter phone number' },
    { type: 'textarea', label: 'Description', placeholder: 'Enter description' },
    { type: 'number', label: 'Age', placeholder: 'Enter age' },
    { type: 'date', label: 'Date of Birth', placeholder: 'Select date' },
    { type: 'text', label: 'Address', placeholder: 'Enter address' },
    { type: 'text', label: 'Emergency Contact', placeholder: 'Enter emergency contact' },
    { type: 'select', label: 'Parish', options: ['Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'] },
    { type: 'select', label: 'Priority Level', options: ['Low', 'Medium', 'High', 'Critical'] },
    { type: 'radio', label: 'Status', options: ['Active', 'Inactive', 'Pending'] },
    { type: 'checkbox', label: 'Terms and Conditions', placeholder: 'I agree to the terms and conditions' },
    { type: 'file', label: 'Upload Document', placeholder: 'Choose file' },
    { type: 'photo-location', label: 'Photo with Location', placeholder: 'Upload photo to extract GPS coordinates' },
    { type: 'textarea', label: 'Additional Notes', placeholder: 'Enter any additional notes' },
    { type: 'text', label: 'Organization', placeholder: 'Enter organization name' },
];

interface CustomForm {
    name: string;
    description: string;
    status: 'draft' | 'published' | 'archived';
    fields: FormField[];
    allowedRoles: string[]; // Array of UserRole strings that can access this form
}

function FormPage() {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [opened, { open, close }] = useDisclosure(false);
    const { hasPermission, isLoading } = usePermission('forms_create_templates');

    const [form, setForm] = useState<CustomForm>({
        name: '',
        description: '',
        status: 'draft',
        fields: [],
        allowedRoles: ['admin'] // Default to admin only
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<Array<{ value: string, label: string }>>([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    // Fetch available roles from API
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch('/api/roles');
                if (!response.ok) {
                    throw new Error('Failed to fetch roles');
                }

                const rolesData = await response.json();

                // Format roles for MultiSelect component
                const formattedRoles = rolesData.map((role: any) => ({
                    value: role.name,
                    label: `${role.name.charAt(0).toUpperCase() + role.name.slice(1)} - ${role.description}`
                }));

                setAvailableRoles(formattedRoles);
            } catch (error) {
                console.error('Error fetching roles:', error);
                // Fallback to default roles if API fails
                setAvailableRoles([
                    { value: 'admin', label: 'Admin - Full system access' },
                    { value: 'ops', label: 'Operations Lead - Manages deployments and operations' },
                    { value: 'field', label: 'Field Reporter - Front-line data capture' },
                    { value: 'analyst', label: 'Insights Analyst - Data analysis and reporting' },
                    { value: 'needs', label: 'Needs Reporter - Community needs reporting' },
                ]);
            } finally {
                setRolesLoading(false);
            }
        };

        fetchRoles();
    }, []);

    // Generate unique ID for fields
    const generateFieldId = useCallback(() => {
        return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Add field to form
    const addField = useCallback((template: Omit<FormField, 'id' | 'required'>) => {
        const newField: FormField = {
            ...template,
            id: generateFieldId(),
            required: false
        };

        setForm(prev => ({
            ...prev,
            fields: [...prev.fields, newField]
        }));
        // Don't close the modal - let user add multiple fields
    }, [generateFieldId]);

    // Remove field from form
    const removeField = useCallback((fieldId: string) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.filter(field => field.id !== fieldId)
        }));
    }, []);

    // Update field properties
    const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.map(field =>
                field.id === fieldId ? { ...field, ...updates } : field
            )
        }));
    }, []);

    // Move field up/down
    const moveField = useCallback((fieldId: string, direction: 'up' | 'down') => {
        setForm(prev => {
            const fields = [...prev.fields];
            const index = fields.findIndex(f => f.id === fieldId);

            if (index === -1) return prev;

            const newIndex = direction === 'up' ? index - 1 : index + 1;

            if (newIndex < 0 || newIndex >= fields.length) return prev;

            [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];

            return { ...prev, fields };
        });
    }, []);

    // Save form
    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Please enter a form name');
            return;
        }

        if (!form.description.trim()) {
            toast.error('Please enter a form description');
            return;
        }

        if (form.fields.length === 0) {
            toast.error('Please add at least one field to the form');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creating form...');

        try {
            const response = await fetch('/api/forms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create form');
            }

            toast.dismiss(toastId);
            toast.success('Form created successfully!');
            router.push('/forms');
        } catch (error) {
            console.error('Error creating form:', error);
            toast.dismiss(toastId);
            toast.error(error instanceof Error ? error.message : 'Failed to create form');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <Container size="xl" py="xl">
                <Paper p={isMobile ? "md" : "xl"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                    <Stack align="center" gap="md" py="xl">
                        <Loader size="lg" />
                        <Text size="sm" c="dimmed">Loading...</Text>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    // Permission check
    if (!hasPermission) {
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
                            You don't have permission to create forms. Contact your administrator.
                        </Text>
                        <Button
                            onClick={() => router.push('/forms')}
                            mt="md"
                            size={isMobile ? "md" : "sm"}
                        >
                            Back to Forms
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
                    <Group justify="space-between" wrap="wrap">
                        <div>
                            <Title order={2} size={isMobile ? "h3" : "h2"}>Create Custom Form</Title>
                            <Text size="sm" c="dimmed" mt="xs">
                                Build a custom form by selecting and configuring fields
                            </Text>
                        </div>
                        <Button
                            variant="default"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => router.push('/forms')}
                            size={isMobile ? "md" : "sm"}
                            style={{
                                minHeight: isMobile ? '44px' : undefined,
                            }}
                        >
                            Back to Forms
                        </Button>
                    </Group>
                </Paper>

                <Grid gutter="lg">
                    {/* Form Configuration */}
                    <Grid.Col span={{ base: 12, lg: 8 }}>
                        <Paper p={isMobile ? "md" : "lg"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                            <Stack gap="lg">
                                <div>
                                    <Title order={3} size="h4" mb="md">Form Configuration</Title>
                                    <Divider />
                                </div>

                                {/* Basic Info */}
                                <Stack gap="md">
                                    <TextInput
                                        label="Form Name"
                                        placeholder="Enter form name"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        size={isMobile ? "md" : "sm"}
                                        styles={{
                                            input: {
                                                fontSize: isMobile ? '16px' : undefined,
                                                minHeight: isMobile ? '44px' : undefined,
                                            },
                                        }}
                                    />

                                    <Textarea
                                        label="Description"
                                        placeholder="Enter form description"
                                        required
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        size={isMobile ? "md" : "sm"}
                                        styles={{
                                            input: {
                                                fontSize: isMobile ? '16px' : undefined,
                                            },
                                        }}
                                    />

                                    <Select
                                        label="Status"
                                        value={form.status}
                                        onChange={(value) => setForm(prev => ({ ...prev, status: value as CustomForm['status'] }))}
                                        data={[
                                            { value: 'draft', label: 'Draft' },
                                            { value: 'published', label: 'Published' },
                                            { value: 'archived', label: 'Archived' },
                                        ]}
                                        size={isMobile ? "md" : "sm"}
                                        styles={{
                                            input: {
                                                fontSize: isMobile ? '16px' : undefined,
                                                minHeight: isMobile ? '44px' : undefined,
                                            },
                                        }}
                                    />

                                    <MultiSelect
                                        label="Allowed Roles"
                                        description="Select which roles can access this form. Admin is always included."
                                        placeholder={rolesLoading ? "Loading roles..." : "Select roles that can access this form"}
                                        value={form.allowedRoles}
                                        onChange={(value) => {
                                            // Ensure admin is always included
                                            const roles = value.includes('admin') ? value : [...value, 'admin'];
                                            setForm(prev => ({ ...prev, allowedRoles: roles }));
                                        }}
                                        data={availableRoles}
                                        size={isMobile ? "md" : "sm"}
                                        searchable
                                        clearable={false}
                                        disabled={rolesLoading}
                                        styles={{
                                            input: {
                                                fontSize: isMobile ? '16px' : undefined,
                                                minHeight: isMobile ? '44px' : undefined,
                                            },
                                        }}
                                    />
                                </Stack>

                                <Divider />

                                {/* Form Fields */}
                                <div>
                                    <Group justify="space-between" mb="md">
                                        <Title order={4}>Form Fields</Title>
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            onClick={open}
                                            size={isMobile ? "md" : "sm"}
                                            style={{
                                                minHeight: isMobile ? '44px' : undefined,
                                            }}
                                        >
                                            Add Field
                                        </Button>
                                    </Group>

                                    {form.fields.length === 0 ? (
                                        <Paper
                                            p="xl"
                                            withBorder
                                            style={{
                                                borderStyle: 'dashed',
                                                borderColor: 'var(--mantine-color-gray-4)',
                                            }}
                                        >
                                            <Stack align="center" gap="md">
                                                <Box
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--mantine-color-gray-1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5A3.375 3.375 0 008.25 11.625v2.625" />
                                                    </svg>
                                                </Box>
                                                <div>
                                                    <Text fw={500} ta="center">No fields added</Text>
                                                    <Text size="sm" c="dimmed" ta="center">Get started by adding a field to your form.</Text>
                                                </div>
                                            </Stack>
                                        </Paper>
                                    ) : (
                                        <Stack gap="md">
                                            {form.fields.map((field, index) => (
                                                <Card key={field.id} padding="md" withBorder>
                                                    <Stack gap="sm">
                                                        <Group justify="space-between" wrap="nowrap">
                                                            <Group gap="xs">
                                                                <Badge variant="light" size="sm">
                                                                    {field.type}
                                                                </Badge>
                                                                <Text size="sm" fw={500}>{field.label}</Text>
                                                                {field.required && (
                                                                    <Text size="sm" c="red">*</Text>
                                                                )}
                                                            </Group>
                                                            <Group gap={4}>
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="gray"
                                                                    onClick={() => moveField(field.id, 'up')}
                                                                    disabled={index === 0}
                                                                >
                                                                    <IconArrowUp size={16} />
                                                                </ActionIcon>
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="gray"
                                                                    onClick={() => moveField(field.id, 'down')}
                                                                    disabled={index === form.fields.length - 1}
                                                                >
                                                                    <IconArrowDown size={16} />
                                                                </ActionIcon>
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="red"
                                                                    onClick={() => removeField(field.id)}
                                                                >
                                                                    <IconTrash size={16} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </Group>

                                                        <Grid gutter="sm">
                                                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                                                <TextInput
                                                                    label="Label"
                                                                    size="xs"
                                                                    value={field.label}
                                                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                                />
                                                            </Grid.Col>
                                                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                                                <TextInput
                                                                    label="Placeholder"
                                                                    size="xs"
                                                                    value={field.placeholder || ''}
                                                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                                />
                                                            </Grid.Col>
                                                        </Grid>

                                                        <Checkbox
                                                            label="Required field"
                                                            checked={field.required}
                                                            onChange={(e) => updateField(field.id, { required: e.currentTarget.checked })}
                                                            size="sm"
                                                        />
                                                    </Stack>
                                                </Card>
                                            ))}
                                        </Stack>
                                    )}
                                </div>

                                <Divider />

                                {/* Actions */}
                                <Group justify="flex-end">
                                    <Button
                                        variant="default"
                                        onClick={() => router.push('/forms')}
                                        size={isMobile ? "md" : "sm"}
                                        style={{
                                            minHeight: isMobile ? '44px' : undefined,
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        loading={isSubmitting}
                                        size={isMobile ? "md" : "sm"}
                                        style={{
                                            minHeight: isMobile ? '44px' : undefined,
                                        }}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Form'}
                                    </Button>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    {/* Form Preview */}
                    <Grid.Col span={{ base: 12, lg: 4 }}>
                        <Paper
                            p={isMobile ? "md" : "lg"}
                            withBorder
                            radius="md"
                            style={{
                                backgroundColor: 'white',
                                position: isMobile ? 'relative' : 'sticky',
                                top: isMobile ? 0 : 32,
                            }}
                        >
                            <Stack gap="md">
                                <div>
                                    <Title order={4} mb="xs">Form Preview</Title>
                                    <Divider />
                                </div>

                                {form.name && (
                                    <div>
                                        <Title order={5} size="h5">{form.name}</Title>
                                        {form.description && (
                                            <Text size="sm" c="dimmed" mt={4}>{form.description}</Text>
                                        )}
                                    </div>
                                )}

                                <Stack gap="md">
                                    {form.fields.map((field) => (
                                        <div key={field.id}>
                                            <Text size="sm" fw={500} mb={4}>
                                                {field.label}
                                                {field.required && <span style={{ color: 'var(--mantine-color-red-6)' }}> *</span>}
                                            </Text>
                                            {field.type === 'textarea' ? (
                                                <Textarea
                                                    placeholder={field.placeholder}
                                                    disabled
                                                    size="xs"
                                                    rows={3}
                                                />
                                            ) : field.type === 'select' ? (
                                                <Select
                                                    placeholder={field.placeholder || 'Select option'}
                                                    data={field.options || []}
                                                    disabled
                                                    size="xs"
                                                />
                                            ) : field.type === 'checkbox' ? (
                                                <Checkbox
                                                    label={field.placeholder}
                                                    disabled
                                                    size="xs"
                                                />
                                            ) : field.type === 'radio' ? (
                                                <Stack gap={4}>
                                                    {field.options?.map((option, idx) => (
                                                        <Checkbox
                                                            key={idx}
                                                            label={option}
                                                            disabled
                                                            size="xs"
                                                        />
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <TextInput
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    disabled
                                                    size="xs"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {form.fields.length === 0 && (
                                        <Text size="sm" c="dimmed" fs="italic">Add fields to see preview</Text>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Stack>

            {/* Field Selector Modal */}
            <Modal
                opened={opened}
                onClose={close}
                title={
                    <Group justify="space-between" style={{ width: '100%' }}>
                        <Text fw={500}>Add Field</Text>
                        {form.fields.length > 0 && (
                            <Badge variant="light" color="blue">
                                {form.fields.length} field{form.fields.length !== 1 ? 's' : ''} added
                            </Badge>
                        )}
                    </Group>
                }
                size="lg"
                centered
            >
                <Stack gap="md">
                    <Grid gutter="sm">
                        {FIELD_TEMPLATES.map((template, index) => (
                            <Grid.Col key={index} span={{ base: 12, sm: 6 }}>
                                <Card
                                    padding="md"
                                    withBorder
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => addField(template)}
                                    className="hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                    <Group gap="sm">
                                        <Badge variant="light" size="sm">
                                            {template.type}
                                        </Badge>
                                        <div style={{ flex: 1 }}>
                                            <Text size="sm" fw={500}>{template.label}</Text>
                                            {template.placeholder && (
                                                <Text size="xs" c="dimmed">{template.placeholder}</Text>
                                            )}
                                        </div>
                                    </Group>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>

                    <Divider />

                    <Group justify="flex-end">
                        <Button
                            onClick={close}
                            size={isMobile ? "md" : "sm"}
                            style={{
                                minHeight: isMobile ? '44px' : undefined,
                            }}
                        >
                            Done
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

export default function CreateFormsPage() {
    return (
        <>
            <DashboardNavigation />
            <Suspense fallback={<div>Loading...</div>}>

                <FormPage />
            </Suspense>
        </>
    );
}