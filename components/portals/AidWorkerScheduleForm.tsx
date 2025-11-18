/**
 * AidWorkerScheduleForm - Form for registering aid worker schedules and capabilities
 */

'use client';

import { useState, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Stack, Button, Group, Text, Loader, Paper, Select, NumberInput, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { aidWorkerScheduleSchema, CAPABILITIES, MISSION_TYPES, WORKER_STATUS } from '@/lib/schemas/aid-worker-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import MultiSelectCheckbox from '@/components/forms/MultiSelectCheckbox';
import DatePicker from '@/components/forms/DatePicker';
import LocationMapPicker from '@/components/forms/LocationMapPicker';
import { useSession } from '@/lib/auth-client';

interface AidWorkerScheduleFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const missionTypeOptions = MISSION_TYPES.map((type) => ({
  value: type,
  label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
}));

const statusOptions = WORKER_STATUS.map((status) => ({
  value: status,
  label: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
}));

export default function AidWorkerScheduleForm({
  onSuccess,
  onError,
}: AidWorkerScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session } = useSession();
  const user = session?.user;

  const form = useForm({
    initialValues: {
      workerName: '',
      workerId: '',
      organization: '',
      capabilities: [] as string[],
      missionType: 'planned_mission' as 'rapid_deployment' | 'planned_mission' | 'standby',
      startTime: new Date(),
      endTime: undefined as Date | undefined,
      durationHours: undefined as number | undefined,
      currentLatitude: undefined as number | undefined,
      currentLongitude: undefined as number | undefined,
      deploymentArea: '',
      status: 'available' as 'available' | 'deployed' | 'on_mission' | 'unavailable',
      contactPhone: '',
      contactEmail: '',
      createdBy: user?.id || '',
    },
    validate: zodResolver(aidWorkerScheduleSchema),
  });

  const handleLocationChange = useCallback((location: {
    parishId: string | null;
    communityId: string | null;
    latitude: number | null;
    longitude: number | null;
    accuracy?: number;
  }) => {
    form.setFieldValue('currentLatitude', location.latitude ?? undefined);
    form.setFieldValue('currentLongitude', location.longitude ?? undefined);
  }, [form]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!user?.id) {
      onError?.('You must be logged in to submit this form');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/aid-workers/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          createdBy: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit aid worker schedule');
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
          {/* Section 1: Worker Information */}
          <FormSection title="Worker Information" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Worker Name"
                required
                error={form.errors.workerName as string | undefined as string | undefined}
              >
                <TextInput
                  placeholder="Full name of the aid worker"
                  {...form.getInputProps('workerName')}
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
                label="Organization"
                required
                error={form.errors.organization as string | undefined}
              >
                <TextInput
                  placeholder="e.g., Red Cross Jamaica, JDF"
                  {...form.getInputProps('organization')}
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
                label="Capabilities"
                description="Select all capabilities this worker can provide"
                required
                error={form.errors.capabilities as string | undefined}
              >
                <MultiSelectCheckbox
                  options={CAPABILITIES.map((capability) => ({
                    value: capability,
                    label: capability,
                  }))}
                  value={form.values.capabilities}
                  onChange={(value) => form.setFieldValue('capabilities', value)}
                  error={form.errors.capabilities as string | undefined}
                  required
                  columns={isMobile ? 1 : 2}
                />
              </FormField>
            </Stack>
          </FormSection>

          {/* Section 2: Schedule */}
          <FormSection title="Schedule & Mission Type" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Mission Type"
                required
                error={form.errors.missionType as string | undefined}
              >
                <Select
                  data={missionTypeOptions}
                  {...form.getInputProps('missionType')}
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
                label="Start Time"
                required
                error={form.errors.startTime as string | undefined}
              >
                <DatePicker
                  value={form.values.startTime}
                  onChange={(date) => form.setFieldValue('startTime', date || new Date())}
                  includeTime={true}
                  error={form.errors.startTime as string | undefined}
                  required
                />
              </FormField>

              <FormField
                label="End Time (Optional)"
                error={form.errors.endTime as string | undefined}
              >
                <DatePicker
                  value={form.values.endTime || null}
                  onChange={(date) => form.setFieldValue('endTime', date || undefined)}
                  includeTime={true}
                  error={form.errors.endTime as string | undefined}
                />
              </FormField>

              <FormField
                label="Duration (Hours)"
                description="Expected duration of the mission"
                error={form.errors.durationHours as string | undefined}
              >
                <NumberInput
                  placeholder="0"
                  min={1}
                  {...form.getInputProps('durationHours')}
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
                label="Status"
                required
                error={form.errors.status as string | undefined}
              >
                <Select
                  data={statusOptions}
                  {...form.getInputProps('status')}
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

          {/* Section 3: Location */}
          <FormSection title="Location" defaultExpanded={true}>
            <Stack gap="md">
              <LocationMapPicker
                latitude={form.values.currentLatitude}
                longitude={form.values.currentLongitude}
                onLocationChange={handleLocationChange}
                showMap={true}
              />

              <FormField
                label="Deployment Area"
                description="General area or region for deployment"
                error={form.errors.deploymentArea as string | undefined}
              >
                <TextInput
                  placeholder="e.g., Kingston and St. Andrew"
                  {...form.getInputProps('deploymentArea')}
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

          {/* Section 4: Contact Information */}
          <FormSection title="Contact Information" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Contact Phone"
                required
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
                'Submit Schedule'
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

