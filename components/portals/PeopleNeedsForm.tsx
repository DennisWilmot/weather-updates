/**
 * PeopleNeedsForm - Form for reporting people needs
 */

'use client';

import { useState, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Stack, Button, Group, Text, Loader, Paper, Select, NumberInput, Textarea, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { peopleNeedsSchema, NEEDS_OPTIONS, URGENCY_LEVELS } from '@/lib/schemas/people-needs-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import MultiSelectCheckbox from '@/components/forms/MultiSelectCheckbox';
import LocationMapPicker from '@/components/forms/LocationMapPicker';
import { useSession } from '@/lib/auth-client';

interface PeopleNeedsFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const urgencyOptions = URGENCY_LEVELS.map((level) => ({
  value: level,
  label: level.charAt(0).toUpperCase() + level.slice(1),
}));

export default function PeopleNeedsForm({
  onSuccess,
  onError,
}: PeopleNeedsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session } = useSession();
  const user = session?.user;

  const form = useForm({
    initialValues: {
      parishId: '',
      communityId: '',
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
      needs: [] as string[],
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      numberOfPeople: undefined as number | undefined,
      urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
      description: '',
      status: 'pending' as 'pending' | 'in_progress' | 'fulfilled' | 'cancelled',
      reportedBy: user?.id || '',
    },
    validate: zodResolver(peopleNeedsSchema),
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
  }, [form]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!user?.id) {
      onError?.('You must be logged in to submit this form');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/people/needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          reportedBy: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit people needs');
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
          {/* Section 1: Location */}
          <FormSection title="Location" defaultExpanded={true}>
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

          {/* Section 2: Needs */}
          <FormSection title="Needs" defaultExpanded={true}>
            <FormField
              label="What are the needs?"
              description="Select all needs that apply"
              required
              error={form.errors.needs as string | undefined}
            >
              <MultiSelectCheckbox
                options={NEEDS_OPTIONS.map((need) => ({
                  value: need,
                  label: need,
                }))}
                value={form.values.needs}
                onChange={(value) => form.setFieldValue('needs', value)}
                error={form.errors.needs as string | undefined}
                required
                columns={isMobile ? 1 : 2}
              />
            </FormField>
          </FormSection>

          {/* Section 3: Contact Information */}
          <FormSection title="Contact Information" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Contact Name"
                required
                error={form.errors.contactName as string | undefined as string | undefined}
              >
                <TextInput
                  placeholder="Name of the person reporting needs"
                  {...form.getInputProps('contactName')}
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
                error={form.errors.contactPhone as string | undefined}
              >
                <TextInput
                  placeholder="876-123-4567"
                  {...form.getInputProps('contactPhone')}
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
                label="Email Address"
                error={form.errors.contactEmail as string | undefined}
              >
                <TextInput
                  type="email"
                  placeholder="email@example.com"
                  {...form.getInputProps('contactEmail')}
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

          {/* Section 4: Additional Details */}
          <FormSection title="Additional Details" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Number of People"
                description="Total number of people affected"
                error={form.errors.numberOfPeople as string | undefined}
              >
                <NumberInput
                  placeholder="0"
                  min={1}
                  {...form.getInputProps('numberOfPeople')}
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
                label="Urgency Level"
                required
                error={form.errors.urgency as string | undefined}
              >
                <Select
                  data={urgencyOptions}
                  {...form.getInputProps('urgency')}
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
                label="Description"
                description="Additional details about the needs or situation"
                error={form.errors.description as string | undefined}
              >
                <Textarea
                  placeholder="Provide any additional information..."
                  rows={4}
                  {...form.getInputProps('description')}
                  size={isMobile ? "md" : "sm"}
                  styles={{
                    input: {
                      fontSize: isMobile ? '16px' : undefined,
                    },
                  }}
                />
              </FormField>
            </Stack>
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
                'Submit Needs Report'
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

