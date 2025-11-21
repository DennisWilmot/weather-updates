/**
 * PeopleNeedsForm - Form for reporting people needs
 */
'use client';
import { useState, useCallback, useRef } from 'react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import {
  Stack,
  Button,
  Group,
  Text,
  Loader,
  Paper,
  Select,
  NumberInput,
  Textarea,
  TextInput,
  Box,
  Center,
  Progress,
  ActionIcon,
  rem,
  Badge,
  Pill,
  MultiSelect,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useMediaQuery } from '@mantine/hooks';
import { IconUpload, IconVideo, IconX, IconCheck, IconPlus, IconSparkles } from '@tabler/icons-react';
import { peopleNeedsSchema, URGENCY_LEVELS } from '@/lib/schemas/people-needs-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
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

// Common needs suggestions
const COMMON_NEEDS = [
  'Food',
  'Water',
  'Shelter',
  'Medical Care',
  'Clothing',
  'Transportation',
  'Financial Assistance',
  'Hygiene Products',
  'Baby Supplies',
  'Medication',
];

// Common skills suggestions
const COMMON_SKILLS = [
  'Medical/Nursing',
  'Construction',
  'Electrical Work',
  'Plumbing',
  'Carpentry',
  'Cooking',
  'Teaching',
  'Counseling',
  'Transportation/Driving',
  'Translation',
  'Technology/IT',
  'Legal Aid',
];

export default function PeopleNeedsForm({
  onSuccess,
  onError,
}: PeopleNeedsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [needsSuggestions, setNeedsSuggestions] = useState<string[]>(COMMON_NEEDS);
  const [skillsSuggestions, setSkillsSuggestions] = useState<string[]>(COMMON_SKILLS);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
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
      skills: [] as string[],
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

  async function transcribe(file: File) {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: data,
    });
    return res.json();
  }


  const handleVideoDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploadedVideo(file);
    setIsTranscribing(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await transcribe(file);
      clearInterval(progressInterval);
      setUploadProgress(100);


      if (result) {
        // setTranscription(result);



        // If your analysis exists, override description with summary
        if (result.summary) {
          form.setFieldValue("description", result.summary);
        }

        // Optionally auto-fill needs & skills
        if (result.needs) {
          const { immediate = [], secondary = [] } = result.needs;
          console.log(immediate, "im")
          form.setFieldValue("needs", [...[...form.values.needs, ...immediate, ...secondary]]);
        }

        if (result.skills) {
          form.setFieldValue("skills", [...[...form.values.skills, ...result.skills]]);
        }
      }

    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to transcribe video');
      setUploadedVideo(null);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRemoveVideo = () => {
    setUploadedVideo(null);
    setTranscription('');
    setUploadProgress(0);
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
      setUploadedVideo(null);
      setTranscription('');
      setNeedsSuggestions(COMMON_NEEDS);
      setSkillsSuggestions(COMMON_SKILLS);
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
          {/* Section 1: Video Upload */}
          <FormSection title="Video Report (Optional)" defaultExpanded={true}>
            <Stack gap="md">
              {!uploadedVideo ? (
                <Dropzone
                  onDrop={handleVideoDrop}
                  maxSize={100 * 1024 * 1024}
                  accept={[".mp4", ".mp3"]}
                  loading={isTranscribing}
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
                  <Group justify="center" gap="xl" style={{ minHeight: rem(180), pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                      <Center>
                        <Stack align="center" gap="sm">
                          <IconUpload
                            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                            stroke={1.5}
                          />
                          <Text size="lg" fw={500} c="blue">
                            Drop video here
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
                            <IconVideo
                              style={{ width: rem(32), height: rem(32), color: 'var(--mantine-color-blue-6)' }}
                              stroke={1.5}
                            />
                          </Box>
                          <Stack align="center" gap={4}>
                            <Text size="lg" fw={500}>
                              Upload video report
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                              Drag and drop or click to select a video
                            </Text>
                            <Text size="xs" c="dimmed" ta="center">
                              We'll automatically transcribe the audio
                            </Text>
                          </Stack>
                          <Text size="xs" c="dimmed" ta="center" mt="xs">
                            Maximum file size: 100MB
                          </Text>
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
                          }}
                        >
                          {isTranscribing ? (
                            <Loader size="sm" color="blue" />
                          ) : (
                            <IconCheck
                              style={{ width: rem(24), height: rem(24), color: 'var(--mantine-color-blue-6)' }}
                              stroke={2}
                            />
                          )}
                        </Box>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} truncate>
                            {uploadedVideo.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB
                          </Text>
                        </div>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={handleRemoveVideo}
                        disabled={isTranscribing}
                      >
                        <IconX style={{ width: rem(18), height: rem(18) }} />
                      </ActionIcon>
                    </Group>
                    {isTranscribing && (
                      <Box>
                        <Group justify="space-between" mb={4}>
                          <Text size="xs" c="dimmed">
                            Transcribing audio...
                          </Text>
                          <Text size="xs" c="dimmed">
                            {uploadProgress}%
                          </Text>
                        </Group>
                        <Progress value={uploadProgress} size="sm" radius="xl" animated />
                      </Box>
                    )}
                    {transcription && !isTranscribing && (
                      <Box
                        p="sm"
                        style={{
                          backgroundColor: 'white',
                          borderRadius: rem(8),
                          border: '1px solid var(--mantine-color-gray-3)',
                        }}
                      >
                        <Text size="xs" c="dimmed" mb={4}>
                          Transcription:
                        </Text>
                        <Text size="sm">{transcription}</Text>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </FormSection>

          {/* Section 2: Location */}
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

          {/* Section 4: Needs */}
          <FormSection title="Needs" defaultExpanded={true}>
            <FormField
              label="What items or services are needed?"
              description="Select from suggestions or type your own"
              required
              error={form.errors.needs as string | undefined}
            >
              <MultiSelect
                data={needsSuggestions}
                value={form.values.needs}
                onChange={(value) => form.setFieldValue('needs', value)}
                placeholder="Select or type needs"
                searchable
                // @ts-expect-error creatable is not in MultiSelectProps but required for UX
                creatable
                getCreateLabel={(query: string) => `+ Add "${query}"`}
                onKeyDownCapture={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // prevents form submit
                  }
                }}
                onCreate={(query: string) => {
                  const item = query;

                  // Add to suggestions list
                  setNeedsSuggestions((current) => [...current, item]);

                  // Add to selected values in the form
                  form.setFieldValue('needs', [...form.values.needs, item]);

                  return item;
                }}

                size={isMobile ? "md" : "sm"}
                styles={{
                  input: {
                    fontSize: isMobile ? '16px' : undefined,
                    minHeight: isMobile ? '44px' : undefined,
                  },
                }}
              />
            </FormField>
          </FormSection>

          {/* Section 5: Skills Needed */}
          <FormSection title="Skills Needed" defaultExpanded={true}>
            <FormField
              label="What skills would be helpful?"
              description="Select volunteer skills that could help address these needs"
              error={form.errors.skills as string | undefined}
            >
              <MultiSelect
                data={skillsSuggestions}
                value={form.values.skills}
                onChange={(value) => form.setFieldValue('skills', value)}
                placeholder="Select or type skills"
                searchable
                // @ts-expect-error creatable is not in MultiSelectProps but required for UX
                creatable
                getCreateLabel={(query: string) => `+ Add "${query}"`}
                onCreate={(query: string) => {
                  const item = query;
                  setSkillsSuggestions((current) => [...current, item]);
                  return item;
                }}
                size={isMobile ? "md" : "sm"}
                styles={{
                  input: {
                    fontSize: isMobile ? '16px' : undefined,
                    minHeight: isMobile ? '44px' : undefined,
                  },
                }}
              />
            </FormField>
          </FormSection>

          {/* Section 6: Contact Information */}
          <FormSection title="Contact Information" defaultExpanded={true}>
            <Stack gap="md">
              <FormField
                label="Contact Name"
                required
                error={form.errors.contactName as string | undefined}
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

          {/* Section 7: Additional Details */}
          <FormSection title="Additional Details" defaultExpanded={true}>
            <Stack gap="md">
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