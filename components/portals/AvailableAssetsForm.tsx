"use client";

import Papa from "papaparse";
import { useState, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Stack, Button, Group, Text, Loader, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import MultiSelectCheckbox from '@/components/forms/MultiSelectCheckbox';
import DatePicker from '@/components/forms/DatePicker';
import LocationMapPicker from '@/components/forms/LocationMapPicker';
import SignatureCapture from '@/components/forms/SignatureCapture';
import { TextInput, Select } from '@mantine/core';
import { useSession } from '@/lib/auth-client';
import { availableAssetSchema } from "@/lib/schemas/asset-availability-schema";
import { toast } from 'sonner';
// organization: "",
//     assetType: "",
//     quantity: "",
//     parish: "",
//     latitude: "",
//     longitude: "",
//     contactName: "",
//     contactPhone: "",
//     notes: "",

interface AvailableAssetsFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function AvailableAssetsForm({
    onSuccess,
    onError,
}: AvailableAssetsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { data: session } = useSession();
    const user = session?.user;

    const form = useForm({
        initialValues: {
            // Section 1: General Information
            organizationName: '',
            organizationEntity: '',

            assetType: '',
            assetName: '',
            assetQuantity: 0,

            // Section 2: Location
            parishId: '',
            communityId: '',
            latitude: undefined as number | undefined,
            longitude: undefined as number | undefined,
            altitude: undefined as number | undefined,
            accuracy: undefined as number | undefined,


            // Metadata
            submittedBy: user?.id || '',
        },
        validate: zodResolver(availableAssetSchema),
    });

    const handleLocationChange = useCallback((location: {
        parishId: string | null;
        communityId: string | null;
        latitude: number | null;
        longitude: number | null;
        accuracy?: number;
    }) => {
        form.setFieldValue('parishId', location.parishId || '');
        form.setFieldValue('communityId', location.communityId || '');
        form.setFieldValue('latitude', location.latitude ?? undefined);
        form.setFieldValue('longitude', location.longitude ?? undefined);
        if (location.accuracy !== undefined) {
            form.setFieldValue('accuracy', location.accuracy);
        }
    }, [form]);

    const handleSubmit = async (values: typeof form.values) => {
        // if (!user?.id) {
        //     onError?.('You must be logged in to submit this form');
        //     return;
        // }

        setIsSubmitting(true);
        const toastId = toast.loading('Submitting asset availability...');
        try {
            const payload = {
                name: values.assetName,
                type: values.assetType, // must match enum: 'starlink' | 'iphone' | ...
                serialNumber: null, // unless you add a field later
                status: "available",
                isOneTime: true, // or derive from type
                currentLocation: null,
                parishId: values.parishId || null,
                communityId: values.communityId || null,
                latitude: values.latitude ?? null,
                longitude: values.longitude ?? null,
                organization: values.organizationName || null,
            };

            console.log(payload)

            const response = await fetch("/api/asset-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {

                const error = await response.json();
                throw new Error(error.message || 'Failed to submit distribution');
            }

            toast.dismiss(toastId);
            toast.success('Asset availability submitted successfully!');
            form.reset();
            onSuccess?.();
        } catch (err) {
            toast.dismiss(toastId);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while submitting the form';
            toast.error(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Paper p={isMobile ? "md" : "lg"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                    {/* Section 1: General Information */}
                    <FormSection title="General Information" defaultExpanded={true}>
                        <Stack gap="md">
                            <FormField
                                label="Organization Name"
                                description="Name of the organization conducting the distribution"
                                required
                                error={form.errors.organizationName as string | undefined as string | undefined}
                            >
                                <TextInput
                                    placeholder="e.g., Red Cross Jamaica"
                                    {...form.getInputProps('organizationName')}
                                    size={isMobile ? "md" : "sm"}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? '16px' : undefined,
                                            minHeight: isMobile ? '44px' : undefined,
                                        },
                                    }}
                                />
                            </FormField>


                            <FormField
                                label="Organization / Entity"
                                description="Specific entity or department within the organization"
                                required
                                error={form.errors.organizationEntity as string | undefined}
                            >
                                <TextInput
                                    placeholder="e.g., Emergency Response Team"
                                    {...form.getInputProps('organizationEntity')}
                                    size={isMobile ? "md" : "sm"}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? '16px' : undefined,
                                            minHeight: isMobile ? '44px' : undefined,
                                        },
                                    }}
                                />
                            </FormField>
                        </Stack>
                    </FormSection>

                    <FormSection title="Asset Information" defaultExpanded={true}>
                        <Stack gap="md">
                            <FormField
                                label="Asset Type"
                                description="Categorize the asset"
                                required
                                error={form.errors.assetType as string | undefined}
                            >
                                <Select
                                    placeholder="Select Asset Type"
                                    data={[
                                        { value: "starlink", label: "Starlink Unit" },
                                        { value: "iphone", label: "iPhone" },
                                        { value: "powerbank", label: "Power Bank" },
                                        { value: "food", label: "Food Supplies" },
                                        { value: "water", label: "Water" },
                                        { value: "box_shelter", label: "Box Shelter" },
                                        { value: "generator", label: "Generator" },
                                        { value: "hygiene_kit", label: "Hygiene Kit" },
                                    ]}
                                    size={isMobile ? "md" : "sm"}
                                    allowDeselect={false}
                                    searchable={false}
                                    clearable={false}
                                    {...form.getInputProps("assetType")}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? "16px" : undefined,
                                            minHeight: isMobile ? "44px" : undefined,
                                        },
                                    }}
                                />


                            </FormField>


                            <FormField
                                label="Asset Name"
                                description="The name of the available asset "
                                required
                                error={form.errors.organizationEntity as string | undefined}
                            >
                                <TextInput
                                    placeholder="e.g., Case of Water"
                                    {...form.getInputProps('assetName')}
                                    size={isMobile ? "md" : "sm"}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? '16px' : undefined,
                                            minHeight: isMobile ? '44px' : undefined,
                                        },
                                    }}
                                />
                            </FormField>

                            <FormField
                                label="Asset Quantity"
                                description="The amount of the available asset"
                                required
                                error={form.errors.organizationEntity as string | undefined}
                            >
                                <TextInput
                                    placeholder="1"
                                    {...form.getInputProps('assetQuantity')}
                                    size={isMobile ? "md" : "sm"}
                                    type="number"
                                    min={1}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? '16px' : undefined,
                                            minHeight: isMobile ? '44px' : undefined,
                                        },
                                    }}
                                />
                            </FormField>
                        </Stack>
                    </FormSection>

                    {/* Section 2: Location */}
                    <FormSection title="Location of Distribution" defaultExpanded={true}>
                        <LocationMapPicker
                            parishId={form.values.parishId}
                            communityId={form.values.communityId}
                            latitude={form.values.latitude}
                            longitude={form.values.longitude}
                            onLocationChange={handleLocationChange}
                            error={(form.errors.parishId || form.errors.communityId) as string | undefined}
                            required
                            showMap={true}
                        />
                    </FormSection>


                    {/* Submit Button */}
                    <Group justify="flex-end" mt="xl">
                        <Button
                            type="submit"
                            size={isMobile ? "md" : "lg"}
                            loading={isSubmitting}
                            // disabled={!user?.id}
                            style={{
                                minHeight: isMobile ? '44px' : undefined,
                                minWidth: isMobile ? '120px' : undefined,
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader size="sm" mr="xs" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Availability'
                            )}
                        </Button>
                    </Group>

                    {!user?.id && (
                        <Text size="xs" c="red" ta="center">
                            You must be logged in to submit this form
                        </Text>
                    )}
                </Stack>
            </form>
        </Paper>
    );
}
