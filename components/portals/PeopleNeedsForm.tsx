/**
 * PeopleNeedsForm - Form for reporting people needs
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
import { IconUpload, IconX, IconCheck, IconPlus, IconSparkles } from '@tabler/icons-react';
import { toast } from 'sonner';
import { peopleNeedsSchema, URGENCY_LEVELS } from '@/lib/schemas/people-needs-schema';
import FormSection from '@/components/forms/FormSection';
import FormField from '@/components/forms/FormField';
import LocationMapPicker from '@/components/forms/LocationMapPicker';
import { useSession } from '@/lib/auth-client';
import { upload } from '@vercel/blob/client';

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
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [needsSuggestions, setNeedsSuggestions] = useState<string[]>(COMMON_NEEDS);
  const [skillsSuggestions, setSkillsSuggestions] = useState<string[]>(COMMON_SKILLS);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isExtractingGPS, setIsExtractingGPS] = useState(false);
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


  async function transcribe(audioFile: File) {
    setUploadProgress(0);
    const VERCEL_SIZE_LIMIT = 4.5 * 1024 * 1024; // 4.5 MB in bytes
    let blobUrl: string | null = null;
    let blobId: string | null = null;

    try {
      // Check if file is larger than Vercel limit
      if (audioFile.size > VERCEL_SIZE_LIMIT) {
        // Step 1: Upload to Vercel Blob storage (0% -> 30%)
        console.log("📤 File too large, uploading to Vercel Blob...");
        setUploadProgress(5);
        const useMultipart = audioFile.size > 50 * 1024 * 1024; // 50 MB

        const blob = await upload(audioFile.name, audioFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          multipart: useMultipart,
          onUploadProgress: (progressEvent) => {
            // Update progress: 5% to 30% for upload
            const uploadProgress = 5 + (progressEvent.loaded / progressEvent.total) * 25;
            setUploadProgress(Math.min(uploadProgress, 30));
          },
        });

        console.log("✅ Vercel Blob upload completed successfully!");
        blobUrl = blob.url;
        blobId = blob.pathname;
        setUploadProgress(30);

        // Step 2: Send blob URL to backend for transcription (30% -> 95%)
        console.log("📤 Sending blob URL for transcription...");
        setUploadProgress(30);
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl: blobUrl,
            blobId: blobId,
            isAudio: true,
          }),
        });

        if (!transcribeRes.ok) {
          const error = await transcribeRes.json().catch(() => ({ error: 'Unknown error' }));
          console.error("Transcribe error:", error);
          throw new Error(error.error || 'Transcription failed');
        }

        const result = await transcribeRes.json();
        console.log("✅ Transcription and processing complete, result:", result);
        setUploadProgress(95);

        // Extract transcription text from result if available
        if (result.summary) {
          setTranscription(result.summary);
        }

        return result;
      } else {
        // File is small enough, send directly
        console.log("📤 Sending audio directly for transcription...");
        setUploadProgress(10);
        const formData = new FormData();
        formData.append("file", audioFile, audioFile.name);
        setUploadProgress(20);

        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData, // FormData automatically sets Content-Type with boundary
        });

        if (!transcribeRes.ok) {
          const error = await transcribeRes.json().catch(() => ({ error: 'Unknown error' }));
          console.error("Transcribe error:", error);
          throw new Error(error.error || 'Transcription failed');
        }

        const result = await transcribeRes.json();
        console.log("✅ Transcription and processing complete, result:", result);
        setUploadProgress(95);

        // Extract transcription text from result if available
        if (result.summary) {
          setTranscription(result.summary);
        }

        return result;
      }
    } catch (error: any) {
      console.error("Transcribe function error:", error);
      throw new Error(error?.message || 'Failed to transcribe and process audio');
    }
  }


  const handleAudioDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploadedAudio(file);
    setIsTranscribing(true);
    setUploadProgress(0);

    try {
      const result = await transcribe(file);
      setUploadProgress(100);

      console.log("Transcription result received:", result);

      if (result) {
        // If your analysis exists, override description with summary
        if (result.summary) {
          form.setFieldValue("description", result.summary);
        }

        if (result.contact && result.contact.name) {
          form.setFieldValue("contactName", result.contact.name);
        }

        if (result.contact && result.contact.phone) {
          form.setFieldValue("contactPhone", result.contact.phone);
        }

        if (result.contact && result.contact.email) {
          form.setFieldValue("contactEmail", result.contact.email);
        }

        // Optionally auto-fill needs & skills
        if (result.needs) {
          const { immediate = [], secondary = [] } = result.needs;
          console.log(immediate, "immediate needs");
          form.setFieldValue("needs", [...form.values.needs, ...immediate, ...secondary]);
        }

        if (result.skills) {
          form.setFieldValue("skills", [...form.values.skills, ...result.skills]);
        }
      }

      toast.success("Audio transcribed and processed successfully!");
    } catch (err) {
      console.error("handleAudioDrop error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
      console.error("Error message:", errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
      setUploadedAudio(null);
    } finally {
      setIsTranscribing(false);
      // Keep progress at 100 if successful, reset if error
      if (uploadProgress < 100) {
        setUploadProgress(0);
      }
    }
  };

  const handleRemoveAudio = () => {
    setUploadedAudio(null);
    setTranscription('');
    setUploadProgress(0);
  };

  const handleImageDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setUploadedImage(file);
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
      setUploadedImage(null);
    } finally {
      setIsExtractingGPS(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setUploadedImage(null);
    setImagePreviewUrl(null);
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

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
    const toastId = toast.loading('Submitting needs report...');
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

      toast.dismiss(toastId);
      toast.success('Needs report submitted successfully!');
      form.reset();
      setUploadedAudio(null);
      setTranscription('');
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setUploadedImage(null);
      setImagePreviewUrl(null);
      setNeedsSuggestions(COMMON_NEEDS);
      setSkillsSuggestions(COMMON_SKILLS);
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
          {/* Section 1: Audio Upload */}
          <FormSection title="Audio Report (Optional)" defaultExpanded={true}>
            <Stack gap="md">
              {!uploadedAudio ? (
                <Dropzone
                  onDrop={handleAudioDrop}
                  maxSize={100 * 1024 * 1024}
                  loading={isTranscribing}
                  accept={['audio/*']}
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
                            Drop audio here
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
                              Upload audio report
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                              Drag and drop or click to select an audio file
                            </Text>
                            <Text size="xs" c="dimmed" ta="center">
                              We'll automatically transcribe and process the audio
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
                            {uploadedAudio.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {(uploadedAudio.size / (1024 * 1024)).toFixed(2)} MB
                          </Text>
                        </div>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={handleRemoveAudio}
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

                  </Stack>
                </Paper>
              )}
            </Stack>
          </FormSection>

          {/* Section 2: Image Upload with GPS Extraction */}
          <FormSection title="Upload Photo with Location (Optional)" defaultExpanded={false}>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Upload a photo taken with your phone to automatically extract GPS coordinates. The location will be set on the map below.
              </Text>
              {!uploadedImage ? (
                <Dropzone
                  onDrop={handleImageDrop}
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
                          ) : imagePreviewUrl ? (
                            <img
                              src={imagePreviewUrl}
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
                            {uploadedImage.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {(uploadedImage.size / (1024 * 1024)).toFixed(2)} MB
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
                        onClick={handleRemoveImage}
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