/**
 * MerchantOnboardingForm - Form for MSME merchant onboarding
 */
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import {
    Stack,
    Button,
    Group,
    Text,
    Paper,
    Select,
    Textarea,
    TextInput,
    Grid,
    Checkbox,
    Box,
    Center,
    ActionIcon,
    rem,
    Loader,
    NumberInput,
    Radio,
    Slider,
    Progress,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useMediaQuery } from '@mantine/hooks';
import { IconMapPin, IconUser, IconUpload, IconX, IconCheck, IconCamera, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { merchantOnboardingSchema, BUSINESS_TYPES } from '@/lib/schemas/merchant-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import LocationMapPicker from '@/components/forms/LocationMapPicker';
import { useSession } from '@/lib/auth-client';
import { upload } from '@vercel/blob/client';

interface MerchantOnboardingFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

const businessTypeOptions = BUSINESS_TYPES.map((type) => ({
    value: type,
    label: type,
}));

// Product categories from page 2
const PRODUCT_CATEGORIES = [
    'Roofing materials',
    'Hardware',
    'Solar / electrical items',
    'Generators / electrical',
    'Water tanks',
    'Water pumps / plumbing',
    'Livestock',
    'Animal feed',
    'Seeds / fertilizer / agro',
    'Food & grocery items',
    'School supplies',
    'Medical / pharmacy items',
    'Other',
] as const;

export default function MerchantOnboardingForm({
    onSuccess,
    onError,
}: MerchantOnboardingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState<{
        shopfront: boolean;
        document: boolean;
        invoice: boolean;
    }>({
        shopfront: false,
        document: false,
        invoice: false,
    });
    const [photoPreviews, setPhotoPreviews] = useState<{
        shopfront: string | null;
        document: string | null;
        invoice: string | null;
    }>({
        shopfront: null,
        document: null,
        invoice: null,
    });
    const [locationImage, setLocationImage] = useState<File | null>(null);
    const [locationImagePreviewUrl, setLocationImagePreviewUrl] = useState<string | null>(null);
    const [isExtractingGPS, setIsExtractingGPS] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { data: session } = useSession();
    const user = session?.user;

    const form = useForm({
        initialValues: {
            businessName: '',
            tradingName: '',
            businessType: '',
            parishId: '',
            communityId: '',
            streetAddress: '',
            gpsPin: '',
            latitude: undefined as number | undefined,
            longitude: undefined as number | undefined,
            ownerName: '',
            phone: '',
            alternatePhone: '',
            email: '',
            productCategories: [] as string[],
            topItems: [] as Array<{ itemName: string; unit: string; price: number }>,
            wantsFullInventoryUpload: false,
            monthlySalesVolume: undefined as number | undefined,
            numberOfEmployees: undefined as number | undefined,
            issuesInvoices: false,
            acceptsDigitalPayments: false,
            hasElectricity: false,
            hasInternetAccess: false,
            hasSmartphone: false,
            revenueAllocationPercentage: 0,
            estimatedMonthlyPurchaseAmount: 0,
            interestedImportProducts: [] as string[],
            shopfrontPhotoUrl: '',
            documentPhotoUrl: '',
            invoicePhotoUrl: '',
            consent: false,
            notes: '',
            submittedBy: user?.id || '',
        },
        validate: zodResolver(merchantOnboardingSchema),
    });

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(photoPreviews).forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
            if (locationImagePreviewUrl) {
                URL.revokeObjectURL(locationImagePreviewUrl);
            }
        };
    }, [photoPreviews, locationImagePreviewUrl]);

    const handlePhotoUpload = async (
        file: File,
        type: 'shopfront' | 'document' | 'invoice'
    ) => {
        setUploadingPhotos((prev) => ({ ...prev, [type]: true }));

        try {
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreviews((prev) => ({ ...prev, [type]: previewUrl }));

            // Upload to Vercel Blob
            const blob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });

            // Update form with photo URL
            const fieldName = `${type}PhotoUrl` as 'shopfrontPhotoUrl' | 'documentPhotoUrl' | 'invoicePhotoUrl';
            form.setFieldValue(fieldName, blob.url);

            toast.success(`${type === 'shopfront' ? 'Shopfront' : type === 'document' ? 'Document' : 'Invoice'} photo uploaded successfully`);
        } catch (error) {
            console.error(`Error uploading ${type} photo:`, error);
            toast.error(`Failed to upload ${type} photo`);
            setPhotoPreviews((prev) => {
                if (prev[type]) URL.revokeObjectURL(prev[type]!);
                return { ...prev, [type]: null };
            });
        } finally {
            setUploadingPhotos((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleRemovePhoto = (type: 'shopfront' | 'document' | 'invoice') => {
        const fieldName = `${type}PhotoUrl` as 'shopfrontPhotoUrl' | 'documentPhotoUrl' | 'invoicePhotoUrl';
        form.setFieldValue(fieldName, '');
        if (photoPreviews[type]) {
            URL.revokeObjectURL(photoPreviews[type]!);
        }
        setPhotoPreviews((prev) => ({ ...prev, [type]: null }));
    };

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
    }, [form]);

    const handleLocationImageDrop = async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setLocationImagePreviewUrl(previewUrl);
        setLocationImage(file);
        setIsExtractingGPS(true);

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
                        console.log("Location data from API:", locationData);

                        if (locationData.parishId && locationData.communityId) {
                            parishId = locationData.parishId;
                            communityId = locationData.communityId;
                            toast.success(
                                `Found location: ${locationData.communityName}, ${locationData.parishName}`
                            );
                        } else if (locationData.error) {
                            console.warn("Location API returned error:", locationData.error);
                        }
                    } else {
                        const errorData = await locationResponse.json().catch(() => ({}));
                        console.error("Location API error:", errorData);
                    }

                    // Update form with GPS coordinates and location
                    form.setFieldValue('latitude', data.latitude);
                    form.setFieldValue('longitude', data.longitude);

                    if (parishId) {
                        console.log("Setting parishId:", parishId);
                        form.setFieldValue('parishId', parishId);
                    }
                    if (communityId) {
                        console.log("Setting communityId:", communityId);
                        form.setFieldValue('communityId', communityId);
                    }

                    // Also call handleLocationChange to trigger map update
                    handleLocationChange({
                        parishId: parishId,
                        communityId: communityId,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        accuracy: data.altitude ? undefined : undefined,
                    });

                    if (!parishId || !communityId) {
                        toast.warning(
                            `GPS coordinates extracted: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}. Please select parish and community manually.`
                        );
                    }
                } catch (locationError) {
                    console.error("Error finding location:", locationError);
                    // Still set the coordinates even if location lookup fails
                    form.setFieldValue('latitude', data.latitude);
                    form.setFieldValue('longitude', data.longitude);
                    handleLocationChange({
                        parishId: null,
                        communityId: null,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        accuracy: data.altitude ? undefined : undefined,
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
            setLocationImage(null);
        } finally {
            setIsExtractingGPS(false);
        }
    };

    const handleRemoveLocationImage = () => {
        if (locationImagePreviewUrl) {
            URL.revokeObjectURL(locationImagePreviewUrl);
        }
        setLocationImage(null);
        setLocationImagePreviewUrl(null);
    };

    const handleSubmit = async (values: typeof form.values) => {
        if (!user?.id) {
            onError?.('You must be logged in to submit this form');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Submitting merchant onboarding form...');
        try {
            const response = await fetch('/api/merchants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...values,
                    submittedBy: user.id,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit merchant onboarding form');
            }

            toast.dismiss(toastId);
            toast.success('Merchant onboarding form submitted successfully!');
            form.reset();
            // Reset inventory fields
            form.setFieldValue('productCategories', []);
            form.setFieldValue('topItems', []);
            form.setFieldValue('wantsFullInventoryUpload', false);
            // Reset Step 3 fields
            form.setFieldValue('monthlySalesVolume', undefined);
            form.setFieldValue('numberOfEmployees', undefined);
            form.setFieldValue('issuesInvoices', false);
            form.setFieldValue('acceptsDigitalPayments', false);
            form.setFieldValue('hasElectricity', false);
            form.setFieldValue('hasInternetAccess', false);
            form.setFieldValue('hasSmartphone', false);
            form.setFieldValue('revenueAllocationPercentage', 0);
            form.setFieldValue('estimatedMonthlyPurchaseAmount', 0);
            form.setFieldValue('interestedImportProducts', []);
            // Clear photo previews
            Object.values(photoPreviews).forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
            setPhotoPreviews({ shopfront: null, document: null, invoice: null });
            // Clear location image
            if (locationImagePreviewUrl) {
                URL.revokeObjectURL(locationImagePreviewUrl);
            }
            setLocationImage(null);
            setLocationImagePreviewUrl(null);
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
                    {/* Section 1: Business Information */}
                    <FormSection title="Business Information" defaultExpanded={true}>
                        <Stack gap="md">
                            <FormField
                                label="Business Name"
                                required
                                error={form.errors.businessName as string | undefined}
                            >
                                <TextInput
                                    placeholder="Enter your business name"
                                    {...form.getInputProps('businessName')}
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
                                label="Trading Name (if different)"
                                error={form.errors.tradingName as string | undefined}
                            >
                                <TextInput
                                    placeholder="Optional"
                                    {...form.getInputProps('tradingName')}
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
                                label="Business Type / Category"
                                required
                                error={form.errors.businessType as string | undefined}
                            >
                                <Select
                                    data={businessTypeOptions}
                                    placeholder="Select business type"
                                    {...form.getInputProps('businessType')}
                                    size={isMobile ? "md" : "sm"}
                                    searchable
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

                    {/* Section 2: Upload Photo with Location (Optional) */}
                    <FormSection title="Upload Photo with Location (Optional)" defaultExpanded={false}>
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Upload a photo taken with your phone to automatically extract GPS coordinates. The location will be set on the map below.
                            </Text>
                            {!locationImage ? (
                                <Dropzone
                                    onDrop={handleLocationImageDrop}
                                    maxSize={10 * 1024 * 1024} // 10 MB
                                    loading={isExtractingGPS}
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
                                                    {isExtractingGPS ? (
                                                        <Loader size="sm" color="blue" />
                                                    ) : locationImagePreviewUrl ? (
                                                        <img
                                                            src={locationImagePreviewUrl}
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
                                                        {locationImage.name}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {(locationImage.size / (1024 * 1024)).toFixed(2)} MB
                                                    </Text>
                                                    {form.values.latitude && form.values.longitude && (
                                                        <Text size="xs" c="blue" mt={4}>
                                                            ✓ GPS: {form.values.latitude.toFixed(6)}, {form.values.longitude.toFixed(6)}
                                                        </Text>
                                                    )}
                                                </div>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={handleRemoveLocationImage}
                                                disabled={isExtractingGPS}
                                            >
                                                <IconX style={{ width: rem(18), height: rem(18) }} />
                                            </ActionIcon>
                                        </Group>
                                        {isExtractingGPS && (
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
                        </Stack>
                    </FormSection>

                    {/* Section 3: Location */}
                    <FormSection title="Location" defaultExpanded={true}>
                        <Stack gap="md">
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

                            <FormField
                                label="Street Address / Landmark"
                                required
                                error={form.errors.streetAddress as string | undefined}
                            >
                                <Textarea
                                    placeholder="Full business address"
                                    rows={3}
                                    {...form.getInputProps('streetAddress')}
                                    size={isMobile ? "md" : "sm"}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? '16px' : undefined,
                                        },
                                    }}
                                />
                            </FormField>

                            <FormField
                                label="GPS Pin / Plus Code"
                                description="Optional - can be filled by field officer"
                                error={form.errors.gpsPin as string | undefined}
                            >
                                <TextInput
                                    placeholder="Optional - can be filled by field officer"
                                    {...form.getInputProps('gpsPin')}
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

                    {/* Section 3: Contact Details */}
                    <FormSection title="Contact Details" defaultExpanded={true}>
                        <Stack gap="md">
                            <FormField
                                label="Owner / Main Contact Name"
                                required
                                error={form.errors.ownerName as string | undefined}
                            >
                                <TextInput
                                    placeholder="Full name"
                                    {...form.getInputProps('ownerName')}
                                    size={isMobile ? "md" : "sm"}
                                    styles={{
                                        input: {
                                            fontSize: isMobile ? '16px' : undefined,
                                            minHeight: isMobile ? '44px' : undefined,
                                        },
                                    }}
                                />
                            </FormField>

                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <FormField
                                        label="Phone (WhatsApp preferred)"
                                        required
                                        error={form.errors.phone as string | undefined}
                                    >
                                        <TextInput
                                            placeholder="(876) XXX-XXXX"
                                            type="tel"
                                            {...form.getInputProps('phone')}
                                            size={isMobile ? "md" : "sm"}
                                            styles={{
                                                input: {
                                                    fontSize: isMobile ? '16px' : undefined,
                                                    minHeight: isMobile ? '44px' : undefined,
                                                },
                                            }}
                                        />
                                    </FormField>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <FormField
                                        label="Alternate Phone"
                                        error={form.errors.alternatePhone as string | undefined}
                                    >
                                        <TextInput
                                            placeholder="Optional"
                                            type="tel"
                                            {...form.getInputProps('alternatePhone')}
                                            size={isMobile ? "md" : "sm"}
                                            styles={{
                                                input: {
                                                    fontSize: isMobile ? '16px' : undefined,
                                                    minHeight: isMobile ? '44px' : undefined,
                                                },
                                            }}
                                        />
                                    </FormField>
                                </Grid.Col>
                            </Grid>

                            <FormField
                                label="Email"
                                error={form.errors.email as string | undefined}
                            >
                                <TextInput
                                    type="email"
                                    placeholder="Optional"
                                    {...form.getInputProps('email')}
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

                    {/* Section 4: Inventory (Step 2) */}
                    <FormSection title="Inventory" defaultExpanded={true}>
                        <Stack gap="md">
                            {/* Main Product Categories */}
                            <FormField
                                label="Main Product Categories"
                                description="Which of these do you sell regularly? (Select all that apply)"
                                required
                                error={form.errors.productCategories as string | undefined}
                            >
                                <Grid>
                                    {PRODUCT_CATEGORIES.map((category) => (
                                        <Grid.Col key={category} span={{ base: 12, sm: 6, md: 4 }}>
                                            <Paper
                                                p="sm"
                                                withBorder
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    borderColor: form.values.productCategories.includes(category)
                                                        ? 'var(--mantine-color-blue-6)'
                                                        : undefined,
                                                    backgroundColor: form.values.productCategories.includes(category)
                                                        ? 'var(--mantine-color-blue-0)'
                                                        : undefined,
                                                }}
                                                onClick={() => {
                                                    const current = form.values.productCategories;
                                                    if (current.includes(category)) {
                                                        form.setFieldValue(
                                                            'productCategories',
                                                            current.filter((c) => c !== category)
                                                        );
                                                    } else {
                                                        form.setFieldValue('productCategories', [...current, category]);
                                                    }
                                                }}
                                            >
                                                <Group gap="sm">
                                                    <Checkbox
                                                        checked={form.values.productCategories.includes(category)}
                                                        onChange={() => { }} // Handled by Paper onClick
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                    <Text size={isMobile ? "md" : "sm"} style={{ flex: 1 }}>
                                                        {category}
                                                    </Text>
                                                </Group>
                                            </Paper>
                                        </Grid.Col>
                                    ))}
                                </Grid>
                            </FormField>

                            {/* Top 10 Items */}
                            <FormField
                                label="Top 10 Items You Sell Most"
                                description="Add your most popular items with their prices"
                                error={form.errors.topItems as string | undefined}
                            >
                                <Stack gap="md">
                                    {form.values.topItems.map((item, index) => (
                                        <Paper key={index} p="md" withBorder>
                                            <Grid>
                                                <Grid.Col span={{ base: 12, md: 4 }}>
                                                    <TextInput
                                                        label="Item Name"
                                                        placeholder="e.g., Zinc sheets"
                                                        value={item.itemName}
                                                        onChange={(e) => {
                                                            const newItems = [...form.values.topItems];
                                                            newItems[index] = { ...item, itemName: e.target.value };
                                                            form.setFieldValue('topItems', newItems);
                                                        }}
                                                        size={isMobile ? "md" : "sm"}
                                                        styles={{
                                                            input: {
                                                                fontSize: isMobile ? '16px' : undefined,
                                                                minHeight: isMobile ? '44px' : undefined,
                                                            },
                                                        }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={{ base: 12, md: 4 }}>
                                                    <TextInput
                                                        label="Unit"
                                                        placeholder="e.g., Sheet"
                                                        value={item.unit}
                                                        onChange={(e) => {
                                                            const newItems = [...form.values.topItems];
                                                            newItems[index] = { ...item, unit: e.target.value };
                                                            form.setFieldValue('topItems', newItems);
                                                        }}
                                                        size={isMobile ? "md" : "sm"}
                                                        styles={{
                                                            input: {
                                                                fontSize: isMobile ? '16px' : undefined,
                                                                minHeight: isMobile ? '44px' : undefined,
                                                            },
                                                        }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={{ base: 12, md: 3 }}>
                                                    <NumberInput
                                                        label="Price (JMD)"
                                                        placeholder="e.g., 2500"
                                                        value={item.price}
                                                        onChange={(value) => {
                                                            const newItems = [...form.values.topItems];
                                                            newItems[index] = { ...item, price: Number(value) || 0 };
                                                            form.setFieldValue('topItems', newItems);
                                                        }}
                                                        min={0}
                                                        prefix="J$ "
                                                        size={isMobile ? "md" : "sm"}
                                                        styles={{
                                                            input: {
                                                                fontSize: isMobile ? '16px' : undefined,
                                                                minHeight: isMobile ? '44px' : undefined,
                                                            },
                                                        }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={{ base: 12, md: 1 }}>
                                                    <Box style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                                                        <ActionIcon
                                                            color="red"
                                                            variant="subtle"
                                                            onClick={() => {
                                                                const newItems = form.values.topItems.filter((_, i) => i !== index);
                                                                form.setFieldValue('topItems', newItems);
                                                            }}
                                                            size={isMobile ? "lg" : "md"}
                                                            style={{
                                                                minWidth: isMobile ? '44px' : undefined,
                                                                minHeight: isMobile ? '44px' : undefined,
                                                            }}
                                                        >
                                                            <IconTrash size={isMobile ? 20 : 18} />
                                                        </ActionIcon>
                                                    </Box>
                                                </Grid.Col>
                                            </Grid>
                                        </Paper>
                                    ))}

                                    {form.values.topItems.length < 10 && (
                                        <Button
                                            variant="light"
                                            leftSection={<IconPlus size={18} />}
                                            onClick={() => {
                                                form.setFieldValue('topItems', [
                                                    ...form.values.topItems,
                                                    { itemName: '', unit: '', price: 0 },
                                                ]);
                                            }}
                                            size={isMobile ? "md" : "sm"}
                                            style={{
                                                minHeight: isMobile ? '44px' : undefined,
                                            }}
                                        >
                                            Add Item
                                        </Button>
                                    )}

                                    {form.values.topItems.length >= 10 && (
                                        <Text size="xs" c="dimmed" ta="center">
                                            Maximum 10 items reached
                                        </Text>
                                    )}
                                </Stack>
                            </FormField>

                            {/* Full Inventory Upload */}
                            <FormField
                                label="Full Inventory Upload"
                                description="Do you want to upload your full inventory now?"
                                error={form.errors.wantsFullInventoryUpload as string | undefined}
                            >
                                <Radio.Group
                                    value={form.values.wantsFullInventoryUpload ? 'yes' : 'no'}
                                    onChange={(value) => {
                                        form.setFieldValue('wantsFullInventoryUpload', value === 'yes');
                                    }}
                                >
                                    <Stack gap="sm" mt="xs">
                                        <Radio
                                            value="yes"
                                            label="Yes, I want to add my full inventory now"
                                            size={isMobile ? "md" : "sm"}
                                        />
                                        <Radio
                                            value="no"
                                            label="No, I'll provide it later"
                                            size={isMobile ? "md" : "sm"}
                                        />
                                    </Stack>
                                </Radio.Group>
                            </FormField>
                        </Stack>
                    </FormSection>

                    {/* Section 5: Business Capacity & Quotation (Step 3) */}
                    <FormSection title="Business Capacity & Quotation" defaultExpanded={true}>
                        <Stack gap="md">
                            {/* Business Capacity */}
                            <div>
                                <Text size="md" fw={600} mb="md">
                                    Business Capacity
                                </Text>
                                <Stack gap="md">
                                    <FormField
                                        label="Monthly sales volume (approx.)"
                                        error={form.errors.monthlySalesVolume as string | undefined}
                                    >
                                        <NumberInput
                                            placeholder="Enter amount in JMD"
                                            value={form.values.monthlySalesVolume}
                                            onChange={(value) => form.setFieldValue('monthlySalesVolume', Number(value) || undefined)}
                                            min={0}
                                            prefix="J$ "
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
                                        label="Number of employees"
                                        error={form.errors.numberOfEmployees as string | undefined}
                                    >
                                        <NumberInput
                                            placeholder="Enter number"
                                            value={form.values.numberOfEmployees}
                                            onChange={(value) => form.setFieldValue('numberOfEmployees', Number(value) || undefined)}
                                            min={0}
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
                                        label="Does your business issue invoices?"
                                        required
                                        error={form.errors.issuesInvoices as string | undefined}
                                    >
                                        <Radio.Group
                                            value={form.values.issuesInvoices ? 'yes' : 'no'}
                                            onChange={(value) => {
                                                form.setFieldValue('issuesInvoices', value === 'yes');
                                            }}
                                        >
                                            <Stack gap="sm" mt="xs">
                                                <Radio
                                                    value="yes"
                                                    label="Yes"
                                                    size={isMobile ? "md" : "sm"}
                                                />
                                                <Radio
                                                    value="no"
                                                    label="No"
                                                    size={isMobile ? "md" : "sm"}
                                                />
                                            </Stack>
                                        </Radio.Group>
                                    </FormField>

                                    <FormField
                                        label="Do you accept digital payments?"
                                        required
                                        error={form.errors.acceptsDigitalPayments as string | undefined}
                                    >
                                        <Radio.Group
                                            value={form.values.acceptsDigitalPayments ? 'yes' : 'no'}
                                            onChange={(value) => {
                                                form.setFieldValue('acceptsDigitalPayments', value === 'yes');
                                            }}
                                        >
                                            <Stack gap="sm" mt="xs">
                                                <Radio
                                                    value="yes"
                                                    label="Yes"
                                                    size={isMobile ? "md" : "sm"}
                                                />
                                                <Radio
                                                    value="no"
                                                    label="No"
                                                    size={isMobile ? "md" : "sm"}
                                                />
                                            </Stack>
                                        </Radio.Group>
                                    </FormField>
                                </Stack>
                            </div>

                            {/* Utilities & Connectivity */}
                            <div>
                                <Text size="md" fw={600} mb="md" mt="lg">
                                    Utilities & Connectivity
                                </Text>
                                <Grid>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <FormField
                                            label="Do you have electricity?"
                                            required
                                            error={form.errors.hasElectricity as string | undefined}
                                        >
                                            <Radio.Group
                                                value={form.values.hasElectricity ? 'yes' : 'no'}
                                                onChange={(value) => {
                                                    form.setFieldValue('hasElectricity', value === 'yes');
                                                }}
                                            >
                                                <Stack gap="sm" mt="xs">
                                                    <Radio
                                                        value="yes"
                                                        label="Yes"
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                    <Radio
                                                        value="no"
                                                        label="No"
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                </Stack>
                                            </Radio.Group>
                                        </FormField>
                                    </Grid.Col>

                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <FormField
                                            label="Do you have internet access?"
                                            required
                                            error={form.errors.hasInternetAccess as string | undefined}
                                        >
                                            <Radio.Group
                                                value={form.values.hasInternetAccess ? 'yes' : 'no'}
                                                onChange={(value) => {
                                                    form.setFieldValue('hasInternetAccess', value === 'yes');
                                                }}
                                            >
                                                <Stack gap="sm" mt="xs">
                                                    <Radio
                                                        value="yes"
                                                        label="Yes"
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                    <Radio
                                                        value="no"
                                                        label="No"
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                </Stack>
                                            </Radio.Group>
                                        </FormField>
                                    </Grid.Col>

                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <FormField
                                            label="Do you have a smartphone?"
                                            required
                                            error={form.errors.hasSmartphone as string | undefined}
                                        >
                                            <Radio.Group
                                                value={form.values.hasSmartphone ? 'yes' : 'no'}
                                                onChange={(value) => {
                                                    form.setFieldValue('hasSmartphone', value === 'yes');
                                                }}
                                            >
                                                <Stack gap="sm" mt="xs">
                                                    <Radio
                                                        value="yes"
                                                        label="Yes"
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                    <Radio
                                                        value="no"
                                                        label="No"
                                                        size={isMobile ? "md" : "sm"}
                                                    />
                                                </Stack>
                                            </Radio.Group>
                                        </FormField>
                                    </Grid.Col>
                                </Grid>
                            </div>

                            {/* Import Interest & Purchasing */}
                            <div>
                                <Text size="md" fw={600} mb="md" mt="lg">
                                    Import Interest & Purchasing
                                </Text>
                                <Stack gap="md">
                                    <FormField
                                        label="What percentage of your monthly revenue would you allocate to bulk import purchases?"
                                        error={form.errors.revenueAllocationPercentage as string | undefined}
                                    >
                                        <Stack gap="sm" mt="xs">
                                            <Slider
                                                value={form.values.revenueAllocationPercentage || 0}
                                                onChange={(value) => form.setFieldValue('revenueAllocationPercentage', value)}
                                                min={0}
                                                max={100}
                                                marks={[
                                                    { value: 0, label: '0%' },
                                                    { value: 50, label: '50%' },
                                                    { value: 100, label: '100%' },
                                                ]}
                                                size={isMobile ? "md" : "sm"}
                                            />
                                            <Group justify="space-between">
                                                <Text size="xs" c="dimmed">0%</Text>
                                                <Text size="lg" fw={600} c="blue">
                                                    {form.values.revenueAllocationPercentage || 0}%
                                                </Text>
                                                <Text size="xs" c="dimmed">100%</Text>
                                            </Group>
                                        </Stack>
                                    </FormField>

                                    <FormField
                                        label="Estimated monthly purchase amount (JMD)"
                                        required
                                        error={form.errors.estimatedMonthlyPurchaseAmount as string | undefined}
                                    >
                                        <NumberInput
                                            placeholder="e.g., 500000"
                                            value={form.values.estimatedMonthlyPurchaseAmount}
                                            onChange={(value) => form.setFieldValue('estimatedMonthlyPurchaseAmount', Number(value) || 0)}
                                            min={0}
                                            prefix="J$ "
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
                                        label="What products are you interested in importing? (Select all that apply)"
                                        error={form.errors.interestedImportProducts as string | undefined}
                                    >
                                        <Grid>
                                            {PRODUCT_CATEGORIES.map((category) => (
                                                <Grid.Col key={category} span={{ base: 12, md: 6 }}>
                                                    <Paper
                                                        p="sm"
                                                        withBorder
                                                        style={{
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            borderColor: form.values.interestedImportProducts.includes(category)
                                                                ? 'var(--mantine-color-blue-6)'
                                                                : undefined,
                                                            backgroundColor: form.values.interestedImportProducts.includes(category)
                                                                ? 'var(--mantine-color-blue-0)'
                                                                : undefined,
                                                        }}
                                                        onClick={() => {
                                                            const current = form.values.interestedImportProducts;
                                                            if (current.includes(category)) {
                                                                form.setFieldValue(
                                                                    'interestedImportProducts',
                                                                    current.filter((c) => c !== category)
                                                                );
                                                            } else {
                                                                form.setFieldValue('interestedImportProducts', [...current, category]);
                                                            }
                                                        }}
                                                    >
                                                        <Group gap="sm">
                                                            <Checkbox
                                                                checked={form.values.interestedImportProducts.includes(category)}
                                                                onChange={() => { }} // Handled by Paper onClick
                                                                size={isMobile ? "md" : "sm"}
                                                            />
                                                            <Text size={isMobile ? "md" : "sm"} style={{ flex: 1 }}>
                                                                {category}
                                                            </Text>
                                                        </Group>
                                                    </Paper>
                                                </Grid.Col>
                                            ))}
                                        </Grid>
                                    </FormField>
                                </Stack>
                            </div>
                        </Stack>
                    </FormSection>

                    {/* Section 6: Verification Photos */}
                    <FormSection title="Verification Photos" defaultExpanded={false}>
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Upload photos to verify your business (can be taken by field officer)
                            </Text>

                            {/* Shopfront Photo */}
                            <FormField
                                label="Shopfront Photo"
                                description="Clear photo showing your shop exterior"
                            >
                                {!form.values.shopfrontPhotoUrl ? (
                                    <Dropzone
                                        onDrop={(files) => files[0] && handlePhotoUpload(files[0], 'shopfront')}
                                        maxSize={10 * 1024 * 1024} // 10 MB
                                        loading={uploadingPhotos.shopfront}
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
                                        <Group justify="center" gap="xl" style={{ minHeight: rem(100), pointerEvents: 'none' }}>
                                            <Center>
                                                <Stack align="center" gap="sm">
                                                    {uploadingPhotos.shopfront ? (
                                                        <Loader size="md" />
                                                    ) : (
                                                        <IconUpload
                                                            style={{ width: rem(32), height: rem(32), color: 'var(--mantine-color-blue-6)' }}
                                                            stroke={1.5}
                                                        />
                                                    )}
                                                    <Text size="sm" fw={500}>
                                                        {uploadingPhotos.shopfront ? 'Uploading...' : 'Drop or click to upload'}
                                                    </Text>
                                                </Stack>
                                            </Center>
                                        </Group>
                                    </Dropzone>
                                ) : (
                                    <Paper withBorder p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                {photoPreviews.shopfront && (
                                                    <Box
                                                        style={{
                                                            width: rem(60),
                                                            height: rem(60),
                                                            borderRadius: rem(8),
                                                            overflow: 'hidden',
                                                            border: '1px solid var(--mantine-color-blue-3)',
                                                        }}
                                                    >
                                                        <img
                                                            src={photoPreviews.shopfront}
                                                            alt="Shopfront preview"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                )}
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        Shopfront photo uploaded
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        ✓ Photo ready
                                                    </Text>
                                                </div>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() => handleRemovePhoto('shopfront')}
                                            >
                                                <IconX size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                )}
                            </FormField>

                            {/* Document Photo */}
                            <FormField
                                label="Business Registration / TRN Document"
                                description="Photo of business registration or TRN certificate"
                            >
                                {!form.values.documentPhotoUrl ? (
                                    <Dropzone
                                        onDrop={(files) => files[0] && handlePhotoUpload(files[0], 'document')}
                                        maxSize={10 * 1024 * 1024}
                                        loading={uploadingPhotos.document}
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
                                        <Group justify="center" gap="xl" style={{ minHeight: rem(100), pointerEvents: 'none' }}>
                                            <Center>
                                                <Stack align="center" gap="sm">
                                                    {uploadingPhotos.document ? (
                                                        <Loader size="md" />
                                                    ) : (
                                                        <IconUpload
                                                            style={{ width: rem(32), height: rem(32), color: 'var(--mantine-color-blue-6)' }}
                                                            stroke={1.5}
                                                        />
                                                    )}
                                                    <Text size="sm" fw={500}>
                                                        {uploadingPhotos.document ? 'Uploading...' : 'Drop or click to upload'}
                                                    </Text>
                                                </Stack>
                                            </Center>
                                        </Group>
                                    </Dropzone>
                                ) : (
                                    <Paper withBorder p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                {photoPreviews.document && (
                                                    <Box
                                                        style={{
                                                            width: rem(60),
                                                            height: rem(60),
                                                            borderRadius: rem(8),
                                                            overflow: 'hidden',
                                                            border: '1px solid var(--mantine-color-blue-3)',
                                                        }}
                                                    >
                                                        <img
                                                            src={photoPreviews.document}
                                                            alt="Document preview"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                )}
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        Document photo uploaded
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        ✓ Photo ready
                                                    </Text>
                                                </div>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() => handleRemovePhoto('document')}
                                            >
                                                <IconX size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                )}
                            </FormField>

                            {/* Invoice Photo */}
                            <FormField
                                label="Sample Invoice / Receipt"
                                description="Photo of a typical invoice or receipt you issue"
                            >
                                {!form.values.invoicePhotoUrl ? (
                                    <Dropzone
                                        onDrop={(files) => files[0] && handlePhotoUpload(files[0], 'invoice')}
                                        maxSize={10 * 1024 * 1024}
                                        loading={uploadingPhotos.invoice}
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
                                        <Group justify="center" gap="xl" style={{ minHeight: rem(100), pointerEvents: 'none' }}>
                                            <Center>
                                                <Stack align="center" gap="sm">
                                                    {uploadingPhotos.invoice ? (
                                                        <Loader size="md" />
                                                    ) : (
                                                        <IconUpload
                                                            style={{ width: rem(32), height: rem(32), color: 'var(--mantine-color-blue-6)' }}
                                                            stroke={1.5}
                                                        />
                                                    )}
                                                    <Text size="sm" fw={500}>
                                                        {uploadingPhotos.invoice ? 'Uploading...' : 'Drop or click to upload'}
                                                    </Text>
                                                </Stack>
                                            </Center>
                                        </Group>
                                    </Dropzone>
                                ) : (
                                    <Paper withBorder p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                {photoPreviews.invoice && (
                                                    <Box
                                                        style={{
                                                            width: rem(60),
                                                            height: rem(60),
                                                            borderRadius: rem(8),
                                                            overflow: 'hidden',
                                                            border: '1px solid var(--mantine-color-blue-3)',
                                                        }}
                                                    >
                                                        <img
                                                            src={photoPreviews.invoice}
                                                            alt="Invoice preview"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                )}
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        Invoice photo uploaded
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        ✓ Photo ready
                                                    </Text>
                                                </div>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() => handleRemovePhoto('invoice')}
                                            >
                                                <IconX size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                )}
                            </FormField>
                        </Stack>
                    </FormSection>

                    {/* Section 7: Consent & Agreement */}
                    <FormSection title="Consent & Agreement" defaultExpanded={true}>
                        <Stack gap="md">
                            <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                                <FormField
                                    error={form.errors.consent as string | undefined}
                                >
                                    <Checkbox
                                        label={
                                            <Text size="sm">
                                                I consent to Digital Jamaica collecting and using my business information for the MSME Bulk Import Program. I understand my data will be used to match me with suppliers and process bulk orders. I agree to the{' '}
                                                <Text component="a" href="#" c="blue" style={{ textDecoration: 'underline' }}>
                                                    Terms and Conditions
                                                </Text>
                                                {' '}and{' '}
                                                <Text component="a" href="#" c="blue" style={{ textDecoration: 'underline' }}>
                                                    Privacy Policy
                                                </Text>
                                                .
                                            </Text>
                                        }
                                        {...form.getInputProps('consent', { type: 'checkbox' })}
                                        required
                                    />
                                </FormField>
                            </Paper>
                        </Stack>
                    </FormSection>

                    {/* Section 8: Additional Notes */}
                    <FormSection title="Additional Information" defaultExpanded={false}>
                        <FormField
                            label="Additional Notes (Optional)"
                            description="Any additional information you'd like to share"
                            error={form.errors.notes as string | undefined}
                        >
                            <Textarea
                                placeholder="Any additional information you'd like to share..."
                                rows={4}
                                {...form.getInputProps('notes')}
                                size={isMobile ? "md" : "sm"}
                                styles={{
                                    input: {
                                        fontSize: isMobile ? '16px' : undefined,
                                    },
                                }}
                            />
                        </FormField>
                    </FormSection>

                    {/* Submit Button */}
                    <Group justify="flex-end" mt="xl">
                        <Button
                            type="submit"
                            size={isMobile ? "md" : "lg"}
                            loading={isSubmitting}
                            disabled={!user?.id}
                            style={{
                                minHeight: isMobile ? '44px' : undefined,
                                minWidth: isMobile ? '120px' : undefined,
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
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

