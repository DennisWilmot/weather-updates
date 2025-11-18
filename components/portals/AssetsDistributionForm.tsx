/**
 * AssetsDistributionForm - Form for recording asset distributions
 * Uses reusable form components and Zod validation
 */

'use client';

import { useState, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Stack, Button, Group, Text, Loader, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { distributionSchema, DISTRIBUTION_ITEMS } from '@/lib/schemas/distribution-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import MultiSelectCheckbox from '@/components/forms/MultiSelectCheckbox';
import DatePicker from '@/components/forms/DatePicker';
import LocationMapPicker from '@/components/forms/LocationMapPicker';
import SignatureCapture from '@/components/forms/SignatureCapture';
import { TextInput, Select } from '@mantine/core';
import { useSession } from '@/lib/auth-client';

interface AssetsDistributionFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function AssetsDistributionForm({
  onSuccess,
  onError,
}: AssetsDistributionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session } = useSession();
  const user = session?.user;

  const form = useForm({
    initialValues: {
      // Section 1: General Information
      organizationName: '',
      distributionDate: new Date(),
      organizationEntity: '',
      
      // Section 2: Location
      parishId: '',
      communityId: '',
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
      altitude: undefined as number | undefined,
      accuracy: undefined as number | undefined,
      
      // Section 3: Items Distributed
      itemsDistributed: [] as string[],
      
      // Section 4: Recipient Information
      recipientFirstName: '',
      recipientMiddleNames: '',
      recipientLastName: '',
      recipientAlias: '',
      recipientDateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      recipientSex: 'Male' as 'Male' | 'Female',
      recipientTRN: '',
      recipientPhone: '',
      
      // Section 5: Signature
      recipientSignature: '',
      
      // Metadata
      submittedBy: user?.id || '',
    },
    validate: zodResolver(distributionSchema),
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
    if (!user?.id) {
      onError?.('You must be logged in to submit this form');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/asset-distributions', {
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
        throw new Error(error.message || 'Failed to submit distribution');
      }

      form.reset();
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'An error occurred while submitting the form');
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
                label="Date of Distribution"
                description="Date when the distribution took place"
                required
                error={form.errors.distributionDate as string | undefined}
              >
                <DatePicker
                  value={form.values.distributionDate}
                  onChange={(date) => form.setFieldValue('distributionDate', date || new Date())}
                  error={form.errors.distributionDate as string | undefined}
                  required
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

          {/* Section 3: Items Distributed */}
          <FormSection title="Items Distributed" defaultExpanded={true}>
            <FormField
              label="What items were distributed?"
              description="Select all items that were distributed in this session"
              required
              error={form.errors.itemsDistributed as string | undefined}
            >
              <MultiSelectCheckbox
                options={DISTRIBUTION_ITEMS.map((item) => ({
                  value: item,
                  label: item,
                }))}
                value={form.values.itemsDistributed}
                onChange={(value) => form.setFieldValue('itemsDistributed', value)}
                error={form.errors.itemsDistributed as string | undefined}
                required
                columns={isMobile ? 1 : 2}
              />
            </FormField>
          </FormSection>

          {/* Section 4: Recipient Information */}
          <FormSection title="Recipient Information" defaultExpanded={true}>
            <Stack gap="md">
              <Group grow>
                <FormField
                  label="First Name"
                  required
                  error={form.errors.recipientFirstName as string | undefined}
                >
                  <TextInput
                    placeholder="John"
                    {...form.getInputProps('recipientFirstName')}
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
                  label="Last Name"
                  required
                  error={form.errors.recipientLastName as string | undefined}
                >
                  <TextInput
                    placeholder="Doe"
                    {...form.getInputProps('recipientLastName')}
                    size={isMobile ? "md" : "sm"}
                    styles={{
                      input: {
                        fontSize: isMobile ? '16px' : undefined,
                        minHeight: isMobile ? '44px' : undefined,
                      },
                    }}
                  />
                </FormField>
              </Group>

              <FormField
                label="Middle Names"
                error={form.errors.recipientMiddleNames as string | undefined}
              >
                <TextInput
                  placeholder="Michael"
                  {...form.getInputProps('recipientMiddleNames')}
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
                label="Alias or Nickname"
                error={form.errors.recipientAlias as string | undefined}
              >
                <TextInput
                  placeholder="Johnny"
                  {...form.getInputProps('recipientAlias')}
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
                label="Date of Birth"
                required
                error={form.errors.recipientDateOfBirth as string | undefined}
              >
                <DatePicker
                  value={form.values.recipientDateOfBirth}
                  onChange={(date) => form.setFieldValue('recipientDateOfBirth', date || new Date())}
                  error={form.errors.recipientDateOfBirth as string | undefined}
                  required
                  maxDate={new Date()}
                />
              </FormField>

              <FormField
                label="Sex"
                required
                error={form.errors.recipientSex as string | undefined}
              >
                <Select
                  data={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                  ]}
                  {...form.getInputProps('recipientSex')}
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
                label="TRN (Tax Registration Number)"
                error={form.errors.recipientTRN as string | undefined}
              >
                <TextInput
                  placeholder="123-456-789"
                  {...form.getInputProps('recipientTRN')}
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
                label="Phone Number"
                error={form.errors.recipientPhone as string | undefined}
              >
                <TextInput
                  placeholder="876-123-4567"
                  {...form.getInputProps('recipientPhone')}
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

          {/* Section 5: Signature */}
          <FormSection title="Confirmation of Receipt" defaultExpanded={true}>
            <FormField
              label="Recipient's Signature"
              description="Capture the recipient's signature to confirm receipt"
              error={form.errors.recipientSignature as string | undefined}
            >
              <SignatureCapture
                value={form.values.recipientSignature}
                onChange={(signature) => form.setFieldValue('recipientSignature', signature || '')}
                error={form.errors.recipientSignature as string | undefined}
                uploadToStorage={true}
                storagePath="signatures/asset-distributions"
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
              {isSubmitting ? (
                <>
                  <Loader size="sm" mr="xs" />
                  Submitting...
                </>
              ) : (
                'Submit Distribution'
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

