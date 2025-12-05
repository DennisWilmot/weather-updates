'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    Center,
    Box,
    ActionIcon,
    rem,
    Progress,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { DateInput, TimeInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconCheck, IconUpload, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import LocationMapPicker from '@/components/forms/LocationMapPicker';

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
    const [locationImages, setLocationImages] = useState<Record<string, File | null>>({});
    const [locationImagePreviews, setLocationImagePreviews] = useState<Record<string, string | null>>({});
    const [extractingGPS, setExtractingGPS] = useState<Record<string, boolean>>({});

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

    const handleLocationChange = useCallback((fieldId: string, location: {
        parishId: string | null;
        communityId: string | null;
        latitude: number | null;
        longitude: number | null;
        accuracy?: number;
    }) => {
        setFormData(prev => ({
            ...prev,
            [`${fieldId}_parishId`]: location.parishId || '',
            [`${fieldId}_communityId`]: location.communityId || '',
            [`${fieldId}_latitude`]: location.latitude ?? undefined,
            [`${fieldId}_longitude`]: location.longitude ?? undefined,
        }));
    }, []);

    const handleLocationImageDrop = async (fieldId: string, files: File[]) => {
        const file = files[0];
        if (!file) return;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setLocationImagePreviews(prev => ({ ...prev, [fieldId]: previewUrl }));
        setLocationImages(prev => ({ ...prev, [fieldId]: file }));
        setExtractingGPS(prev => ({ ...prev, [fieldId]: true }));

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/image-meta", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to extract GPS data' }));
                throw new Error(error.error || 'Failed to extract GPS data from image');
            }

            const data = await response.json();

            if (data.latitude && data.longitude) {
                // Find parish and community from coordinates
                try {
                    const locationResponse = await fetch(
                        `/api/location/find?latitude=${data.latitude}&longitude=${data.longitude}`
                    );

                    let parishId: string | null = null;
                    let communityId: string | null = null;

                    if (locationResponse.ok) {
                        const locationData = await locationResponse.json();
                        if (locationData.parishId && locationData.communityId) {
                            parishId = locationData.parishId;
                            communityId = locationData.communityId;
                            toast.success(
                                `Found location: ${locationData.communityName}, ${locationData.parishName}`
                            );
                        }
                    }

                    // Update form data with GPS coordinates and location
                    handleLocationChange(fieldId, {
                        parishId: parishId,
                        communityId: communityId,
                        latitude: data.latitude,
                        longitude: data.longitude,
                    });

                    if (!parishId || !communityId) {
                        toast.warning(
                            `GPS coordinates extracted: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}. Please select parish and community manually.`
                        );
                    }
                } catch (locationError) {
                    console.error("Error finding location:", locationError);
                    handleLocationChange(fieldId, {
                        parishId: null,
                        communityId: null,
                        latitude: data.latitude,
                        longitude: data.longitude,
                    });
                    toast.warning(
                        `GPS coordinates extracted: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}. Could not find parish/community automatically.`
                    );
                }
            } else {
                toast.warning("No GPS data found in image. Please set location manually.");
            }
        } catch (err) {
            console.error("Error extracting GPS from image:", err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to extract GPS data from image';
            toast.error(errorMessage);
            setLocationImages(prev => ({ ...prev, [fieldId]: null }));
        } finally {
            setExtractingGPS(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    const handleRemoveLocationImage = (fieldId: string) => {
        if (locationImagePreviews[fieldId]) {
            URL.revokeObjectURL(locationImagePreviews[fieldId]!);
        }
        setLocationImages(prev => ({ ...prev, [fieldId]: null }));
        setLocationImagePreviews(prev => ({ ...prev, [fieldId]: null }));
    };

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(locationImagePreviews).forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [locationImagePreviews]);

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

            case 'photo-location':
                return (
                    <Stack gap="md">
                        <Group gap="xs">
                            <Text size="sm" fw={500}>
                                {field.label}
                            </Text>
                            {field.required && (
                                <Text size="sm" c="red">
                                    *
                                </Text>
                            )}
                        </Group>
                        <Text size="sm" c="dimmed">
                            Upload a photo taken with your phone to automatically extract GPS coordinates.
                        </Text>
                        {!locationImages[field.id] ? (
                            <Dropzone
                                onDrop={(files) => handleLocationImageDrop(field.id, files)}
                                maxSize={10 * 1024 * 1024} // 10 MB
                                loading={extractingGPS[field.id]}
                                accept={['image/*']}
                                styles={{
                                    root: {
                                        borderWidth: 2,
                                        borderStyle: 'dashed',
                                        borderRadius: rem(12),
                                        padding: 20,
                                        backgroundColor: 'var(--mantine-color-gray-0)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: 'var(--mantine-color-blue-0)',
                                            borderColor: 'var(--mantine-color-blue-6)',
                                        },
                                    },
                                }}
                            >
                                <Group justify="center" gap="xl" style={{ minHeight: rem(120), pointerEvents: 'none' }}>
                                    <Dropzone.Accept>
                                        <Center>
                                            <Stack align="center" gap="sm">
                                                <IconUpload
                                                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                                                    stroke={1.5}
                                                />
                                                <Text size="lg" fw={500} c="blue">
                                                    Drop image here
                                                </Text>
                                            </Stack>
                                        </Center>
                                    </Dropzone.Accept>
                                    <Dropzone.Reject>
                                        <Center>
                                            <Stack align="center" gap="sm">
                                                <IconX
                                                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                                                    stroke={1.5}
                                                />
                                                <Text size="lg" fw={500} c="red">
                                                    Invalid file
                                                </Text>
                                            </Stack>
                                        </Center>
                                    </Dropzone.Reject>
                                    <Dropzone.Idle>
                                        <Center>
                                            <Stack align="center" gap="md">
                                                <Box
                                                    style={{
                                                        width: rem(64),
                                                        height: rem(64),
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--mantine-color-blue-1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <IconUpload
                                                        style={{ width: rem(32), height: rem(32), color: 'var(--mantine-color-blue-6)' }}
                                                        stroke={1.5}
                                                    />
                                                </Box>
                                                <Stack align="center" gap={4}>
                                                    <Text size="lg" fw={500}>
                                                        Upload photo with GPS
                                                    </Text>
                                                    <Text size="sm" c="dimmed" ta="center">
                                                        Drag and drop or click to select an image
                                                    </Text>
                                                    <Text size="xs" c="dimmed" ta="center">
                                                        GPS coordinates will be extracted automatically
                                                    </Text>
                                                </Stack>
                                            </Stack>
                                        </Center>
                                    </Dropzone.Idle>
                                </Group>
                            </Dropzone>
                        ) : (
                            <Paper
                                withBorder
                                p="md"
                                radius="md"
                                style={{
                                    backgroundColor: 'var(--mantine-color-blue-0)',
                                    borderColor: 'var(--mantine-color-blue-3)',
                                }}
                            >
                                <Stack gap="sm">
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="sm">
                                            <Box
                                                style={{
                                                    width: rem(40),
                                                    height: rem(40),
                                                    borderRadius: rem(8),
                                                    backgroundColor: 'var(--mantine-color-blue-1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {extractingGPS[field.id] ? (
                                                    <Loader size="sm" color="blue" />
                                                ) : locationImagePreviews[field.id] ? (
                                                    <img
                                                        src={locationImagePreviews[field.id]!}
                                                        alt="Uploaded"
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                ) : null}
                                            </Box>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="sm" fw={500} truncate>
                                                    {locationImages[field.id]?.name}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {locationImages[field.id] ? (locationImages[field.id]!.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
                                                </Text>
                                                {formData[`${field.id}_latitude`] && formData[`${field.id}_longitude`] && (
                                                    <Text size="xs" c="blue" mt={4}>
                                                        ✓ GPS: {formData[`${field.id}_latitude`].toFixed(6)}, {formData[`${field.id}_longitude`].toFixed(6)}
                                                    </Text>
                                                )}
                                            </div>
                                        </Group>
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleRemoveLocationImage(field.id)}
                                            disabled={extractingGPS[field.id]}
                                        >
                                            <IconX style={{ width: rem(18), height: rem(18) }} />
                                        </ActionIcon>
                                    </Group>
                                    {extractingGPS[field.id] && (
                                        <Box>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="xs" c="dimmed">
                                                    Extracting GPS coordinates...
                                                </Text>
                                            </Group>
                                            <Progress value={100} size="sm" radius="xl" animated />
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        )}
                        <LocationMapPicker
                            parishId={formData[`${field.id}_parishId`] || ''}
                            communityId={formData[`${field.id}_communityId`] || ''}
                            latitude={formData[`${field.id}_latitude`]}
                            longitude={formData[`${field.id}_longitude`]}
                            onLocationChange={(location) => handleLocationChange(field.id, location)}
                            error={validationErrors[field.id] as string | undefined}
                            required={field.required}
                            showMap={true}
                        />
                    </Stack>
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
