'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Button,
  Radio,
  Textarea,
  Box,
  FileInput,
  Image,
  Divider,
  Badge,
  SimpleGrid,
  Alert
} from '@mantine/core';
import { IconPhoto, IconRoad, IconLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import HierarchicalLocationPicker from './HierarchicalLocationPicker';
import imageCompression from 'browser-image-compression';

// Service Status Toggle Component - 2-State (Available/Unavailable)
function ServiceStatusToggle({
  label,
  emoji,
  value,
  onChange
}: {
  label: string;
  emoji: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const statusLabel = value ? 'Available' : 'Unavailable';
  const statusEmoji = value ? '✅' : '❌';
  const statusColor = value ? 'green' : 'red';

  return (
    <Card withBorder padding="md" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="lg">{emoji}</Text>
            <Text size="sm" fw={600} c="dark">
              {label}
            </Text>
          </Group>
          <Badge
            color={statusColor}
            variant="filled"
            size="md"
            radius="md"
          >
            {statusEmoji} {statusLabel}
          </Badge>
        </Group>

        {/* 2-Part Toggle Switch */}
        <Box
          style={{
            position: 'relative',
            width: '100%',
            height: '48px',
            backgroundColor: '#e9ecef',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            border: '2px solid #dee2e6'
          }}
        >
          {/* Unavailable Section */}
          <Box
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50%',
              height: '100%',
              backgroundColor: !value ? '#dc3545' : '#e9ecef',
              borderRadius: '6px 0 0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: !value ? '2px solid #dc3545' : '2px solid transparent'
            }}
            onClick={() => onChange(false)}
          >
            <Text size="xs" fw={600} c={!value ? 'white' : 'dimmed'}>
              ❌ Unavailable
            </Text>
          </Box>

          {/* Available Section */}
          <Box
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '50%',
              height: '100%',
              backgroundColor: value ? '#28a745' : '#e9ecef',
              borderRadius: '0 6px 6px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: value ? '2px solid #28a745' : '2px solid transparent'
            }}
            onClick={() => onChange(true)}
          >
            <Text size="xs" fw={600} c={value ? 'white' : 'dimmed'}>
              ✅ Available
            </Text>
          </Box>
        </Box>
      </Stack>
    </Card>
  );
}

export default function SubmitUpdateEnhanced() {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const [canSubmit, setCanSubmit] = useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!isSignedIn) {
        setCanSubmit(false);
        setCheckingPermissions(false);
        return;
      }

      try {
        // Sync user to database first
        await fetch('/api/users/sync', { method: 'POST' });
        
        // Check if user can submit
        const response = await fetch('/api/users/check-permissions');
        if (response.ok) {
          const data = await response.json();
          setCanSubmit(data.canSubmit || false);
        } else {
          // If permissions check fails, allow anyway for now
          console.warn('Permissions check failed, allowing access anyway');
          setCanSubmit(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        // If permissions check fails, allow anyway for now
        setCanSubmit(true);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, [isSignedIn]);

  // Location state
  const [location, setLocation] = useState<{
    parishId: string | null;
    parishName: string | null;
    communityId: string | null;
    communityName: string | null;
    locationId: string | null;
    placeName: string | null;
    streetName: string | null;
  }>({
    parishId: null,
    parishName: null,
    communityId: null,
    communityName: null,
    locationId: null,
    placeName: null,
    streetName: null
  });

  // Service status (true=available, false=unavailable) - default to available
  const [jpsElectricity, setJpsElectricity] = useState<boolean>(true); // JPS
  const [flowService, setFlowService] = useState<boolean>(true); // Flow Internet
  const [digicelService, setDigicelService] = useState<boolean>(true); // Digicel Mobile
  const [waterService, setWaterService] = useState<boolean>(true); // Water

  // Infrastructure
  const [roadStatus, setRoadStatus] = useState<'clear' | 'flooded' | 'blocked' | 'mudslide' | 'damaged'>('clear');

  // Additional info
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.2, // 200KB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg' as const
    };

    try {
      const compressedFile = await imageCompression(file, options);

      // Show notification about compression
      const originalSizeKB = (file.size / 1024).toFixed(0);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(0);

      notifications.show({
        title: 'Image Compressed',
        message: `Reduced from ${originalSizeKB}KB to ${compressedSizeKB}KB`,
        color: 'blue',
        autoClose: 3000
      });

      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImageUrl(null);
      return;
    }

    try {
      setCompressing(true);

      // Compress the image
      const compressedFile = await compressImage(file);

      setImageFile(compressedFile);
      setImageUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      notifications.show({
        title: 'Compression Error',
        message: 'Failed to compress image. Please try a different photo.',
        color: 'red'
      });
      setImageFile(null);
      setImageUrl(null);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.parishId || !location.communityName) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select parish and enter community',
        color: 'red'
      });
      return;
    }

    try {
      setSubmitting(true);

      // Upload image if provided
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        try {
          const fileName = `${Date.now()}-${imageFile.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from('submission-photos')
            .upload(fileName, imageFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

          const { data: { publicUrl } } = supabase.storage
            .from('submission-photos')
            .getPublicUrl(fileName);

          uploadedImageUrl = publicUrl;
        } catch (uploadErr) {
          notifications.show({
            title: 'Image Upload Error',
            message: `Failed to upload image: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`,
            color: 'orange'
          });
        }
      }

      console.log('Submitting with location:', location);

      const submissionData = {
        // Hierarchical location
        parishId: location.parishId,
        communityId: location.communityId,
        locationId: location.locationId,

        // Legacy text fields for backward compatibility
        parish: location.parishName,
        community: location.communityName,

        // Place/Street details
        placeName: location.placeName,
        streetName: location.streetName,

        // Service status - boolean values (true=available, false=unavailable)
        hasElectricity: jpsElectricity,
        hasWifi: flowService || digicelService, // Combined for backward compat
        flowService: flowService,
        digicelService: digicelService,
        waterService: waterService,

        // Infrastructure
        roadStatus,

        // Hazards - all set to false (responder updates don't track individual hazards)
        flooding: false,
        downedPowerLines: false,
        fallenTrees: false,
        structuralDamage: false,

        // Emergency - responders don't submit emergency help requests
        needsHelp: false,
        helpType: null,
        requesterName: null,
        requesterPhone: null,
        helpDescription: null,

        // Submission type - mark as responder update
        submissionType: 'responder',

        // Additional info
        additionalInfo: additionalInfo.trim() || undefined,
        imageUrl: uploadedImageUrl
      };

      console.log('Submission data:', submissionData);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submission failed:', errorData);
        
        // Handle permission errors specifically
        if (response.status === 403 || response.status === 401) {
          notifications.show({
            title: 'Permission Denied',
            message: errorData.error || 'You do not have permission to submit updates',
            color: 'red',
            autoClose: 5000
          });
          // Refresh permissions check
          const permResponse = await fetch('/api/users/check-permissions');
          if (permResponse.ok) {
            const permData = await permResponse.json();
            setCanSubmit(permData.canSubmit || false);
          }
        } else {
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return;
      }

      await response.json();

      notifications.show({
        title: '✅ Successfully Submitted!',
        message: `Your status update for ${location.communityName}, ${location.parishName} has been submitted.`,
        color: 'green',
        autoClose: 5000
      });

      await queryClient.invalidateQueries({ queryKey: ['submissions'], exact: false });

      // Reset form
      setLocation({
        parishId: null,
        parishName: null,
        communityId: null,
        communityName: null,
        locationId: null,
        placeName: null,
        streetName: null
      });
      setJpsElectricity(true);
      setFlowService(true);
      setDigicelService(true);
      setWaterService(true);
      setRoadStatus('clear');
      setAdditionalInfo('');
      setImageFile(null);
      setImageUrl(null);

    } catch (err) {
      console.error('Error submitting:', err);
      notifications.show({
        title: 'Submission Error',
        message: `Failed to submit: ${err instanceof Error ? err.message : 'Unknown error'}`,
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while checking permissions
  if (checkingPermissions) {
    return (
      <Stack gap="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Alert color="blue" title="Checking permissions..." icon={<IconLock />}>
            Verifying your access...
          </Alert>
        </Card>
      </Stack>
    );
  }

  // Show disabled state if user cannot submit
  if (!canSubmit) {
    return (
      <Stack gap="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Alert 
            color="yellow" 
            title="Access Restricted" 
            icon={<IconLock />}
            mb="md"
          >
            {!isSignedIn ? (
              <>
                You must be signed in to submit updates. Please sign in to continue.
              </>
            ) : (
              <>
                You do not have permission to submit updates. Only response team members and administrators can submit updates.
                If you believe this is an error, please contact support.
              </>
            )}
          </Alert>
          <Box style={{ opacity: 0.6, pointerEvents: 'none' }}>
            <Title order={2} c="electricBlue.0" mb="md">Responder Status Update</Title>
          </Box>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Title order={2} c="electricBlue.0" mb="md">Responder Status Update</Title>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {/* Location Picker */}
            <HierarchicalLocationPicker
              onLocationChange={setLocation}
            />

            {/* Service Status Section */}
            <Card withBorder padding="lg" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Stack gap="md">
                <Group gap="xs" mb="sm">
                  <Text size="lg">🔧</Text>
                  <Text size="lg" fw={700} c="dark">Service Status</Text>
                </Group>
                
                <Stack gap="md">
                  <ServiceStatusToggle
                    label="JPS Electricity"
                    emoji="⚡"
                    value={jpsElectricity}
                    onChange={setJpsElectricity}
                  />
                  
                  <ServiceStatusToggle
                    label="Flow Service"
                    emoji="📡"
                    value={flowService}
                    onChange={setFlowService}
                  />
                  
                  <ServiceStatusToggle
                    label="Digicel Service"
                    emoji="📱"
                    value={digicelService}
                    onChange={setDigicelService}
                  />

                  <ServiceStatusToggle
                    label="Water Service"
                    emoji="💧"
                    value={waterService}
                    onChange={setWaterService}
                  />
                </Stack>
              </Stack>
            </Card>

            <Divider label="Infrastructure" labelPosition="center" />

            {/* Road Status */}
            <Box>
              <Group gap="xs" mb="xs">
                <IconRoad size={18} />
                <Text size="sm" fw={600}>Road Status</Text>
              </Group>
              <Radio.Group
                value={roadStatus}
                onChange={(value) => setRoadStatus(value as any)}
              >
                <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
                  <Radio value="clear" label="Clear" color="green" />
                  <Radio value="flooded" label="Flooded" color="blue" />
                  <Radio value="blocked" label="Blocked" color="yellow" />
                  <Radio value="mudslide" label="Mudslide" color="orange" />
                  <Radio value="damaged" label="Damaged" color="red" />
                </SimpleGrid>
              </Radio.Group>
            </Box>

            <Divider label="Additional Details" labelPosition="center" />

            <Textarea
              label="Additional Information (Optional)"
              placeholder="Any additional details about conditions in your area..."
              value={additionalInfo}
              onChange={(event) => setAdditionalInfo(event.currentTarget.value)}
              maxLength={500}
              minRows={3}
            />

            <FileInput
              label="Upload Photo (Optional)"
              placeholder="Take or choose a photo"
              accept="image/*"
              onChange={handleImageChange}
              clearable
              leftSection={<IconPhoto size={16} />}
              disabled={compressing}
              description={compressing ? "Compressing image..." : "Images will be automatically compressed to 200KB max"}
            />

            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Preview"
                style={{
                  maxHeight: '300px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
            )}

            <Button
              type="submit"
              loading={submitting}
              disabled={!location.parishId || !location.communityName}
              color="electricBlue"
              size="lg"
              fullWidth
              style={{
                marginBottom: '20px'
              }}
            >
              Submit Status Update
            </Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
