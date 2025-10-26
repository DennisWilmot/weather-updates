'use client';

import { useState } from 'react';
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
  Checkbox,
  Divider,
  Badge,
  SimpleGrid,
  Slider
} from '@mantine/core';
import { IconPhoto, IconBolt, IconWifi, IconRoad, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import HierarchicalLocationPicker from './HierarchicalLocationPicker';
import imageCompression from 'browser-image-compression';

// Service Status Toggle Component
function ServiceStatusToggle({ 
  label, 
  emoji, 
  value, 
  onChange 
}: { 
  label: string; 
  emoji: string; 
  value: number; 
  onChange: (value: number) => void; 
}) {
  const statusLabels = ['Unavailable', 'N/A', 'Available'];
  const statusEmojis = ['❌', '○', '✅'];
  const statusColors = ['red', 'gray', 'green'];
  
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
            color={statusColors[value]} 
            variant="filled"
            size="md"
            radius="md"
          >
            {statusEmojis[value]} {statusLabels[value]}
          </Badge>
        </Group>
        
        {/* 3-Part Toggle Switch */}
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
              width: '33.33%',
              height: '100%',
              backgroundColor: value === 0 ? '#dc3545' : '#e9ecef',
              borderRadius: '6px 0 0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: value === 0 ? '2px solid #dc3545' : '2px solid transparent'
            }}
            onClick={() => onChange(0)}
          >
            <Text size="xs" fw={600} c={value === 0 ? 'white' : 'dimmed'}>
              ❌ Unavailable
            </Text>
          </Box>
          
          {/* N/A Section */}
          <Box
            style={{
              position: 'absolute',
              left: '33.33%',
              top: 0,
              width: '33.33%',
              height: '100%',
              backgroundColor: value === 1 ? '#6c757d' : '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: value === 1 ? '2px solid #6c757d' : '2px solid transparent'
            }}
            onClick={() => onChange(1)}
          >
            <Text size="xs" fw={600} c={value === 1 ? 'white' : 'dimmed'}>
              ○ N/A
            </Text>
          </Box>
          
          {/* Available Section */}
          <Box
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '33.33%',
              height: '100%',
              backgroundColor: value === 2 ? '#28a745' : '#e9ecef',
              borderRadius: '0 6px 6px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: value === 2 ? '2px solid #28a745' : '2px solid transparent'
            }}
            onClick={() => onChange(2)}
          >
            <Text size="xs" fw={600} c={value === 2 ? 'white' : 'dimmed'}>
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

  // Service status (0=unavailable, 1=n/a, 2=available) - default to N/A
  const [jpsElectricity, setJpsElectricity] = useState<number>(1); // JPS
  const [flowService, setFlowService] = useState<number>(1); // Flow Internet
  const [digicelService, setDigicelService] = useState<number>(1); // Digicel Mobile
  const [waterService, setWaterService] = useState<number>(1); // Water

  // Infrastructure
  const [roadStatus, setRoadStatus] = useState<'clear' | 'flooded' | 'blocked' | 'mudslide' | 'damaged'>('clear');

  // Hazards
  const [flooding, setFlooding] = useState<boolean>(false);
  const [downedPowerLines, setDownedPowerLines] = useState<boolean>(false);
  const [fallenTrees, setFallenTrees] = useState<boolean>(false);
  const [structuralDamage, setStructuralDamage] = useState<boolean>(false);

  // Emergency
  const [needsHelp, setNeedsHelp] = useState<boolean>(false);
  const [helpType, setHelpType] = useState<'medical' | 'physical' | 'police' | 'firefighter' | 'other' | ''>('');

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

    if (!location.parishId || !location.communityId) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select both parish and community',
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

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

          // Service status (convert slider values to boolean for backward compatibility)
          hasElectricity: jpsElectricity > 0, // JPS
          hasWifi: flowService > 0 || digicelService > 0, // Combined for backward compat
          jpsElectricity: jpsElectricity,
          flowService: flowService,
          digicelService: digicelService,
          waterService: waterService,

          // Infrastructure
          roadStatus,

          // Hazards
          flooding,
          downedPowerLines,
          fallenTrees,
          structuralDamage,

          // Emergency
          needsHelp,
          helpType: needsHelp ? helpType : null,

          // Additional info
          additionalInfo: additionalInfo.trim() || undefined,
          imageUrl: uploadedImageUrl
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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
      setJpsElectricity(1);
      setFlowService(1);
      setDigicelService(1);
      setWaterService(1);
      setRoadStatus('clear');
      setFlooding(false);
      setDownedPowerLines(false);
      setFallenTrees(false);
      setStructuralDamage(false);
      setNeedsHelp(false);
      setHelpType('');
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

  return (
    <Stack gap="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Title order={2} c="electricBlue.0" mb="md">Submit Status Update</Title>

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

            <Divider label="Infrastructure & Hazards" labelPosition="center" />

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

            {/* Hazards */}
            <Box>
              <Group gap="xs" mb="xs">
                <IconAlertTriangle size={18} color="#FF686D" />
                <Text size="sm" fw={600}>Active Hazards (Check all that apply)</Text>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <Checkbox
                  label="Flooding"
                  checked={flooding}
                  onChange={(e) => setFlooding(e.currentTarget.checked)}
                  color="blue"
                />
                <Checkbox
                  label="Downed Power Lines"
                  checked={downedPowerLines}
                  onChange={(e) => setDownedPowerLines(e.currentTarget.checked)}
                  color="yellow"
                />
                <Checkbox
                  label="Fallen Trees"
                  checked={fallenTrees}
                  onChange={(e) => setFallenTrees(e.currentTarget.checked)}
                  color="green"
                />
                <Checkbox
                  label="Structural Damage"
                  checked={structuralDamage}
                  onChange={(e) => setStructuralDamage(e.currentTarget.checked)}
                  color="red"
                />
              </SimpleGrid>
            </Box>

            <Divider label="Emergency" labelPosition="center" />

            {/* Emergency Help */}
            <Box>
              <Text size="sm" fw={600} mb="xs">Do you need emergency help?</Text>
              <Radio.Group
                value={needsHelp ? 'yes' : 'no'}
                onChange={(value) => {
                  setNeedsHelp(value === 'yes');
                  if (value === 'no') setHelpType('');
                }}
              >
                <Group gap="md">
                  <Radio value="yes" label="Yes, I need help" color="red" />
                  <Radio value="no" label="No" color="green" />
                </Group>
              </Radio.Group>

              {needsHelp && (
                <Box mt="md">
                  <Text size="sm" fw={500} mb="xs">What type of help?</Text>
                  <Radio.Group
                    value={helpType}
                    onChange={(value) => setHelpType(value as any)}
                  >
                    <Stack gap="xs">
                      <Radio value="medical" label="🏥 Medical Emergency" color="red" />
                      <Radio value="physical" label="💪 Physical Assistance" color="orange" />
                      <Radio value="police" label="👮 Police" color="blue" />
                      <Radio value="firefighter" label="🚒 Fire/Rescue" color="yellow" />
                      <Radio value="other" label="ℹ️ Other" color="gray" />
                    </Stack>
                  </Radio.Group>
                </Box>
              )}
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
              capture="environment"
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
              disabled={!location.parishId || !location.communityId}
              color="electricBlue"
              size="lg"
              fullWidth
            >
              Submit Status Update
            </Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
