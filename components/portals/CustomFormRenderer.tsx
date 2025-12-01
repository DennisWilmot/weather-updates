'use client';

import React, { useState } from 'react';
import {
    Stack,
    TextInput,
    Textarea,
    Select,
    MultiSelect,
    NumberInput,
    Switch,
    Button,
    Group,
    Text,
    Paper,
    Divider,
    Alert,
    Loader,
    Center
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

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
}

interface CustomFormRendererProps {
    form: CustomForm;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export default function CustomFormRenderer({ form, onSuccess, onError }: CustomFormRendererProps) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        form.fields.forEach(field => {
            if (field.required) {
                const value = formData[field.id];
                if (value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0)) {
                    errors[field.id] = `${field.label} is required`;
                }
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Submitting form...');

        try {
            const response = await fetch('/api/form-submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formId: form.id,
                    submissionData: formData,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit form');
            }

            toast.dismiss(toastId);
            toast.success('Form submitted successfully!');
            onSuccess();

            // Reset form
            setFormData({});
            setValidationErrors({});
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.dismiss(toastId);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
            toast.error(errorMessage);
            onError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field: FormField) => {
        const commonProps = {
            key: field.id,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            value: formData[field.id] || '',
            onChange: (value: any) => handleFieldChange(field.id, value),
            error: validationErrors[field.id],
            size: isMobile ? 'md' : 'sm',
            style: {
                fontSize: isMobile ? '16px' : undefined,
                minHeight: isMobile ? '44px' : undefined,
            },
        };

        switch (field.type) {
            case 'text':
                return (
                    <TextInput
                        {...commonProps}
                        onChange={(e) => handleFieldChange(field.id, e.currentTarget.value)}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        {...commonProps}
                        onChange={(e) => handleFieldChange(field.id, e.currentTarget.value)}
                        minRows={3}
                        autosize
                    />
                );

            case 'email':
                return (
                    <TextInput
                        {...commonProps}
                        type="email"
                        onChange={(e) => handleFieldChange(field.id, e.currentTarget.value)}
                    />
                );

            case 'number':
                return (
                    <NumberInput
                        {...commonProps}
                        onChange={(value) => handleFieldChange(field.id, value)}
                    />
                );

            case 'select':
                return (
                    <Select
                        {...commonProps}
                        data={field.options || []}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        searchable
                        clearable
                    />
                );

            case 'multiselect':
                return (
                    <MultiSelect
                        {...commonProps}
                        data={field.options || []}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        searchable
                        clearable
                    />
                );

            case 'switch':
                return (
                    <Switch
                        key={field.id}
                        label={field.label}
                        checked={formData[field.id] || false}
                        onChange={(e) => handleFieldChange(field.id, e.currentTarget.checked)}
                        error={validationErrors[field.id]}
                        size={isMobile ? 'md' : 'sm'}
                    />
                );

            case 'date':
                return (
                    <DateInput
                        {...commonProps}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        clearable
                        size={isMobile ? 'md' : 'sm'}
                    />
                );


            case 'time':
                return (
                    <TimeInput
                        {...commonProps}
                        onChange={(e) => handleFieldChange(field.id, e.currentTarget.value)}
                    />
                );

            default:
                return (
                    <TextInput
                        {...commonProps}
                        onChange={(e) => handleFieldChange(field.id, e.currentTarget.value)}
                    />
                );
        }
    };

    if (!form.fields || form.fields.length === 0) {
        return (
            <Alert
                icon={<IconAlertCircle size={16} />}
                title="No Fields"
                color="yellow"
            >
                This form has no fields configured. Please contact an administrator.
            </Alert>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="md">
                {/* Form Fields */}
                <Paper p="md" withBorder radius="md">
                    <Stack gap="md">
                        {form.fields.map(renderField)}
                    </Stack>
                </Paper>

                {/* Validation Summary */}
                {Object.keys(validationErrors).length > 0 && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Please fix the following errors:"
                        color="red"
                    >
                        <Stack gap="xs">
                            {Object.values(validationErrors).map((error, index) => (
                                <Text key={index} size="sm">
                                    • {error}
                                </Text>
                            ))}
                        </Stack>
                    </Alert>
                )}

                <Divider />

                {/* Submit Button */}
                <Group justify="flex-end">
                    <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        size={isMobile ? 'md' : 'sm'}
                        style={{
                            minHeight: isMobile ? '44px' : undefined,
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                </Group>

                {/* Form Info */}
                <Paper p="sm" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
                    <Text size="xs" c="dimmed">
                        Form: {form.name} • Fields: {form.fields.length} •
                        Last updated: {new Date(form.updatedAt).toLocaleDateString()}
                    </Text>
                </Paper>
            </Stack>
        </form>
    );
}
