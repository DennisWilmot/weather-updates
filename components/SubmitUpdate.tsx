'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Button,
  Card,
  Group,
  TextInput,
  Textarea,
  Select,
  Radio,
  FileInput,
  Image,
  Alert,
  Loader,
  Center
} from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SubmitUpdate() {
  const [parish, setParish] = useState('');
  const [community, setCommunity] = useState('');
  const [hasElectricity, setHasElectricity] = useState<'yes' | 'no' | 'na'>('na');
  const [hasWifi, setHasWifi] = useState<'yes' | 'no' | 'na'>('na');
  const [needsHelp, setNeedsHelp] = useState(false);
  const [helpType, setHelpType] = useState<string>('');
  const [roadStatus, setRoadStatus] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parish,
          community,
          hasElectricity: hasElectricity === 'yes',
          hasWifi: hasWifi === 'yes',
          needsHelp,
          helpType: needsHelp ? helpType : null,
          roadStatus,
          additionalInfo,
          imageUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit update');
      }

      setSubmitSuccess(true);
      // Reset form
      setParish('');
      setCommunity('');
      setHasElectricity('na');
      setHasWifi('na');
        setNeedsHelp(false);
        setHelpType('');
      setRoadStatus('');
        setAdditionalInfo('');
      setImageFile(null);
      setImageUrl(null);
    } catch (error) {
      console.error('Error submitting update:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit update');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="md">
          <Text size="lg" fw={600} c="green">✅ Update Submitted Successfully!</Text>
          <Text size="sm" c="dimmed" ta="center">
            Thank you for sharing your status. Your update has been recorded and will help others in your community.
          </Text>
          <Button onClick={() => setSubmitSuccess(false)}>
            Submit Another Update
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
          <Title order={2} c="#1478FF">Submit Status Update</Title>
          
          {submitError && (
            <Alert color="red" title="Error">
              {submitError}
            </Alert>
          )}

          {/* Location */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Location</Text>
            <Group grow>
              <TextInput
                placeholder="Parish"
                value={parish}
                onChange={(e) => setParish(e.currentTarget.value)}
                required
              />
                    <TextInput
                placeholder="Community/Town"
                value={community}
                onChange={(e) => setCommunity(e.currentTarget.value)}
                      required
                    />
            </Group>
          </Stack>

          {/* Service Status */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Service Status</Text>
            
            <Stack gap="xs">
              <Text size="xs" c="dimmed">Do you have electricity/light?</Text>
              <Radio.Group value={hasElectricity} onChange={(value) => setHasElectricity(value as 'yes' | 'no' | 'na')}>
                <Group gap="md">
                  <Radio value="yes" label="Yes" />
                  <Radio value="no" label="No" />
                  <Radio value="na" label="N/A" />
                  </Group>
                </Radio.Group>
            </Stack>

            <Stack gap="xs">
              <Text size="xs" c="dimmed">Do you have WiFi/service/data?</Text>
              <Radio.Group value={hasWifi} onChange={(value) => setHasWifi(value as 'yes' | 'no' | 'na')}>
                <Group gap="md">
                  <Radio value="yes" label="Yes" />
                  <Radio value="no" label="No" />
                  <Radio value="na" label="N/A" />
                </Group>
              </Radio.Group>
            </Stack>
          </Stack>

          {/* Emergency Help */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Emergency Status</Text>
            <Radio.Group value={needsHelp ? 'yes' : 'no'} onChange={(value) => setNeedsHelp(value === 'yes')}>
              <Group gap="md">
                <Radio value="yes" label="I need help" />
                <Radio value="no" label="I'm okay" />
                </Group>
              </Radio.Group>
              
              {needsHelp && (
                  <Select
                placeholder="What type of help do you need?"
                    value={helpType}
                onChange={(value) => setHelpType(value || '')}
                    data={[
                  { value: 'medical', label: 'Medical' },
                  { value: 'physical', label: 'Physical Rescue' },
                      { value: 'police', label: 'Police' },
                  { value: 'firefighter', label: 'Fire Department' },
                      { value: 'other', label: 'Other' }
                    ]}
                required={needsHelp}
              />
            )}
          </Stack>

          {/* Road Status */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Road Status</Text>
            <Select
              placeholder="Select road condition"
                value={roadStatus}
              onChange={(value) => setRoadStatus(value || '')}
              data={[
                { value: 'clear', label: 'Clear - Passable' },
                { value: 'flooded', label: 'Flooded' },
                { value: 'blocked', label: 'Blocked' },
                { value: 'mudslide', label: 'Mudslide' },
                { value: 'damaged', label: 'Damaged' }
              ]}
              required
            />
                </Stack>

          {/* Additional Info */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Additional Information</Text>
            <Textarea
              placeholder="Any additional details about your situation..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.currentTarget.value)}
              minRows={3}
            />
          </Stack>

          {/* Photo Upload */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Photo (Optional)</Text>
            <FileInput
              placeholder="Upload a photo"
              leftSection={<IconPhoto size={16} />}
              accept="image/*"
              value={imageFile}
              onChange={(file) => {
                setImageFile(file);
                if (file) handleImageUpload(file);
              }}
            />
            {imageUrl && (
              <Group gap="xs">
                <Image src={imageUrl} alt="Uploaded" width={100} height={100} radius="md" />
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconX size={12} />}
                  onClick={() => {
                    setImageFile(null);
                    setImageUrl(null);
                  }}
                >
                  Remove
                </Button>
              </Group>
            )}
          </Stack>

          {/* Submit Button */}
            <Button
              type="submit"
            fullWidth
              size="md"
            loading={isSubmitting}
            leftSection={!isSubmitting && <IconUpload size={16} />}
            >
            {isSubmitting ? 'Submitting...' : 'Submit Update'}
            </Button>
          </Stack>
        </form>
      </Card>
  );
}