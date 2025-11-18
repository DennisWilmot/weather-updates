/**
 * PlaceStatusForm - Form for reporting place operational status
 */

'use client';

import { useState, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Stack, Button, Group, Text, Loader, Paper, Select, NumberInput, Checkbox, Textarea, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { placeStatusSchema, OPERATIONAL_STATUS } from '@/lib/schemas/place-status-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import HierarchicalLocationPicker from '@/components/HierarchicalLocationPicker';
import { useSession } from '@/lib/auth-client';

interface PlaceStatusFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const statusOptions = OPERATIONAL_STATUS.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

export default function PlaceStatusForm({
  onSuccess,
  onError,
}: PlaceStatusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session } = useSession();
  const user = session?.user;

  const form = useForm({
    initialValues: {
      parishId: '',
      communityId: '',
      town: '',
      electricityStatus: 'unknown' as 'operational' | 'outage' | 'partial' | 'unknown',
      waterStatus: 'unknown' as 'operational' | 'outage' | 'partial' | 'unknown',
      wifiStatus: 'unknown' as 'operational' | 'outage' | 'partial' | 'unknown',
      currentCapacity: undefined as number | undefined,
      maxCapacity: undefined as number | undefined,
      atCapacity: false,
      shelterName: '',
      notes: '',
      reportedBy: user?.id || '',
      verified: false,
    },
    validate: zodResolver(placeStatusSchema),
  });

  const handleLocationChange = useCallback((location: {
    parishId: string | null;
    parishName: string | null;
    communityId: string | null;
    communityName: string | null;
    locationId: string | null;
    placeName: string | null;
    streetName: string | null;
  }) => {
    form.setFieldValue('parishId', location.parishId || '');
    form.setFieldValue('communityId', location.communityId || '');
  }, [form]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!user?.id) {
      onError?.('You must be logged in to submit this form');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/places/status', {
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
        throw new Error(error.message || 'Failed to submit place status');
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
            <Stack gap="md">
              <FormField
                label="Parish and Community"
                description="Select the location of the place"
                required
                error={(form.errors.parishId || form.errors.communityId) as string | undefined}
              >
                <HierarchicalLocationPicker
                  onLocationChange={handleLocationChange}
                  initialParish={form.values.parishId}
                  initialCommunity={form.values.communityId}
                />
              </FormField>

              <FormField
                label="Town / Area Name"
                description="Specific town or area name (optional)"
                error={form.errors.town as string | undefined}
              >
                <TextInput
                  placeholder="e.g., Kingston, Montego Bay"
                  {...form.getInputProps('town')}
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
                label="Shelter / Facility Name"
                description="Name of the shelter or facility (if applicable)"
                error={form.errors.shelterName as string | undefined}
              >
                <TextInput
                  placeholder="e.g., National Stadium Shelter"
                  {...form.getInputProps('shelterName')}
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

          {/* Section 2: Operational Status */}
          <FormSection title="Operational Status" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Electricity Status"
                required
                error={form.errors.electricityStatus as string | undefined}
              >
                <Select
                  data={statusOptions}
                  {...form.getInputProps('electricityStatus')}
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
                label="Water Status"
                required
                error={form.errors.waterStatus as string | undefined}
              >
                <Select
                  data={statusOptions}
                  {...form.getInputProps('waterStatus')}
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
                label="WiFi / Internet Status"
                required
                error={form.errors.wifiStatus as string | undefined}
              >
                <Select
                  data={statusOptions}
                  {...form.getInputProps('wifiStatus')}
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

          {/* Section 3: Capacity (for shelters) */}
          <FormSection title="Shelter Capacity" defaultExpanded={false}>
            <Stack gap="md">
              <Group grow>
                <FormField
                  label="Current Capacity"
                  description="Number of people currently in shelter"
                  error={form.errors.currentCapacity as string | undefined}
                >
                  <NumberInput
                    placeholder="0"
                    min={0}
                    {...form.getInputProps('currentCapacity')}
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
                  label="Maximum Capacity"
                  description="Maximum number of people the shelter can accommodate"
                  error={form.errors.maxCapacity as string | undefined}
                >
                  <NumberInput
                    placeholder="0"
                    min={0}
                    {...form.getInputProps('maxCapacity')}
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
                label="At Capacity"
                error={form.errors.atCapacity as string | undefined}
              >
                <Checkbox
                  label="Shelter is at maximum capacity"
                  {...form.getInputProps('atCapacity', { type: 'checkbox' })}
                  size={isMobile ? "md" : "sm"}
                />
              </FormField>
            </Stack>
          </FormSection>

          {/* Section 4: Additional Notes */}
          <FormSection title="Additional Information" defaultExpanded={false}>
            <FormField
              label="Notes"
              description="Any additional information or observations"
              error={form.errors.notes as string | undefined}
            >
              <Textarea
                placeholder="Add any relevant details..."
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
              {isSubmitting ? (
                <>
                  <Loader size="sm" mr="xs" />
                  Submitting...
                </>
              ) : (
                'Submit Status'
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

