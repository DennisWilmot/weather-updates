'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Button,
  Select,
  Switch,
  Radio,
  Textarea,
  Box,
  Combobox,
  TextInput,
  useCombobox,
  FileInput,
  Image,
  Slider,
  Badge,
  Center
} from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import jamaicaLocations from '../data/jamaica-locations.json';
import HierarchicalLocationPicker from './HierarchicalLocationPicker';

// Service Status Slider Component
function ServiceStatusSlider({ 
  label, 
  emoji, 
  color, 
  value, 
  onChange 
}: { 
  label: string; 
  emoji: string; 
  color: string; 
  value: number; 
  onChange: (value: number) => void; 
}) {
  const statusLabels = ['Out', 'Partial', 'Working'];
  const statusEmojis = ['❌', '⚠️', '✅'];
  const statusColors = ['red', 'yellow', 'green'];
  
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
        
        <Slider
          value={value}
          onChange={onChange}
          min={0}
          max={2}
          step={1}
          marks={[
            { value: 0, label: <Text size="xs" c="red">Out</Text> },
            { value: 1, label: <Text size="xs" c="yellow">Partial</Text> },
            { value: 2, label: <Text size="xs" c="green">Working</Text> }
          ]}
          color={statusColors[value]}
          size="lg"
          styles={{
            track: {
              backgroundColor: '#e9ecef',
              height: 8,
            },
            thumb: {
              backgroundColor: statusColors[value],
              border: `3px solid white`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              width: 24,
              height: 24,
            },
            mark: {
              backgroundColor: statusColors[value],
              border: `2px solid white`,
              width: 16,
              height: 16,
            },
            markLabel: {
              marginTop: 8,
            }
          }}
        />
      </Stack>
    </Card>
  );
}

export default function SubmitUpdate() {
  const queryClient = useQueryClient();
  const [selectedParish, setSelectedParish] = useState<string>('');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<string>('');
  const [selectedStreet, setSelectedStreet] = useState<string>('');
  const [communitySearch, setCommunitySearch] = useState<string>('');
  const [communities, setCommunities] = useState<any[]>([]);
  const [hasElectricity, setHasElectricity] = useState<boolean>(true);
  const [hasWifi, setHasWifi] = useState<boolean>(true);
  const [jpsElectricity, setJpsElectricity] = useState<number>(2); // 0=out, 1=partial, 2=working
  const [flowService, setFlowService] = useState<number>(2); // 0=out, 1=partial, 2=working
  const [digicelService, setDigicelService] = useState<number>(2); // 0=out, 1=partial, 2=working
  const [waterService, setWaterService] = useState<number>(2); // 0=out, 1=partial, 2=working
  const [needsHelp, setNeedsHelp] = useState<boolean>(false);
  const [helpType, setHelpType] = useState<'medical' | 'physical' | 'police' | 'firefighter' | 'other' | ''>('');
  const [roadStatus, setRoadStatus] = useState<'clear' | 'flooded' | 'blocked' | 'mudslide'>('clear');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const searchCommunities = async (search: string) => {
    if (!selectedParish || search.length < 2) {
      setCommunities([]);
      return;
    }
    
    try {
      setLoadingCommunities(true);
      const response = await fetch(`/api/communities?parish=${selectedParish}&search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error('Error searching communities:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleCommunitySearch = (value: string) => {
    setCommunitySearch(value);
    setSelectedCommunity(value);
    searchCommunities(value);
    combobox.openDropdown();
  };

  const handleCommunitySelect = (value: string) => {
    setSelectedCommunity(value);
    setCommunitySearch(value);
    combobox.closeDropdown();
  };

  // Handle location change from HierarchicalLocationPicker
  const handleLocationChange = (location: {
    parishId: string | null;
    communityId: string | null;
    locationId: string | null;
    placeName: string | null;
    streetName: string | null;
  }) => {
    // For now, we'll use the old system but with the new data
    // This will be updated when the database schema is migrated
    setSelectedParish(location.parishId || '');
    setSelectedCommunity(location.communityId || '');
    setSelectedPlace(location.placeName || '');
    setSelectedStreet(location.streetName || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParish || !selectedCommunity) {
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

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
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
          // Continue without image rather than failing the entire submission
        }
      }
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parish: selectedParish,
          community: selectedCommunity,
          hasElectricity: jpsElectricity > 0, // Convert slider to boolean for backward compatibility
          hasWifi: flowService > 0 || digicelService > 0, // Convert sliders to boolean for backward compatibility
          jpsElectricity: jpsElectricity,
          flowService: flowService,
          digicelService: digicelService,
          waterService: waterService,
          needsHelp,
          helpType: needsHelp ? helpType : null,
          roadStatus,
          additionalInfo: additionalInfo.trim() || undefined,
          imageUrl: uploadedImageUrl
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      notifications.show({
        title: '✅ Successfully Submitted!',
        message: `Your status update for ${selectedCommunity}, ${selectedParish} has been submitted and is now visible in the community feed.`,
        color: 'green',
        autoClose: 5000,
        withCloseButton: true,
        position: 'top-center'
      });

      // Invalidate and refetch all submissions queries to refresh the feed
      await queryClient.invalidateQueries({ 
        queryKey: ['submissions'],
        exact: false 
      });
      
      // Also try to refetch immediately
      await queryClient.refetchQueries({ 
        queryKey: ['submissions'],
        exact: false 
      });

      // Show additional feedback that the feed has been updated
      setTimeout(() => {
        notifications.show({
          title: '🔄 Feed Updated',
          message: 'The community feed has been refreshed with your latest update.',
          color: 'blue',
          autoClose: 3000,
          position: 'top-center'
        });
      }, 1000);

              // Reset form
                setSelectedParish('');
                setSelectedCommunity('');
                setSelectedPlace('');
                setSelectedStreet('');
                setJpsElectricity(2);
                setFlowService(2);
                setDigicelService(2);
                setWaterService(2);
                setNeedsHelp(false);
                setHelpType('');
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

  const availableCommunities = selectedParish ? jamaicaLocations[selectedParish as keyof typeof jamaicaLocations] || [] : [];

  return (
    <Stack gap="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Title order={2} c="electricBlue.0" mb="md">Submit Status Update</Title>
        
        <form onSubmit={handleSubmit}>
                  <Stack gap="md">
                    {/* Hierarchical Location Picker with Geolocation */}
                    <HierarchicalLocationPicker
                      onLocationChange={handleLocationChange}
                      initialParish={selectedParish}
                      initialCommunity={selectedCommunity}
                      initialPlace={selectedPlace}
                    />

            {/* Service Status Section */}
            <Card withBorder padding="lg" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Stack gap="md">
                <Group gap="xs" mb="sm">
                  <Text size="lg">🔧</Text>
                  <Text size="lg" fw={700} c="dark">Service Status</Text>
                </Group>
                
                <Stack gap="md">
                  <ServiceStatusSlider
                    label="JPS Electricity"
                    emoji="⚡"
                    color="yellow"
                    value={jpsElectricity}
                    onChange={setJpsElectricity}
                  />
                  
                  <ServiceStatusSlider
                    label="Flow Service"
                    emoji="📡"
                    color="blue"
                    value={flowService}
                    onChange={setFlowService}
                  />
                  
                  <ServiceStatusSlider
                    label="Digicel Service"
                    emoji="📱"
                    color="red"
                    value={digicelService}
                    onChange={setDigicelService}
                  />
                  
                  <ServiceStatusSlider
                    label="Water Service"
                    emoji="💧"
                    color="cyan"
                    value={waterService}
                    onChange={setWaterService}
                  />
                </Stack>
              </Stack>
            </Card>

            <Box>
              <Text size="sm" fw={500} mb="xs">Do you need help?</Text>
              <Radio.Group
                value={needsHelp ? 'yes' : 'no'}
                onChange={(value) => {
                  setNeedsHelp(value === 'yes');
                  if (value === 'no') setHelpType('');
                }}
              >
                <Group mt="xs">
                  <Radio value="yes" label="Yes" color="red" />
                  <Radio value="no" label="No" color="teal" />
                </Group>
              </Radio.Group>
              
              {needsHelp && (
                <Box mt="md">
                  <Text size="sm" fw={500} mb="xs">What type of help do you need?</Text>
                  <Select
                    placeholder="Select help type"
                    value={helpType}
                    onChange={(value) => setHelpType(value as any)}
                    data={[
                      { value: 'medical', label: 'Medical Help' },
                      { value: 'physical', label: 'Physical Help' },
                      { value: 'police', label: 'Police' },
                      { value: 'firefighter', label: 'Firefighter' },
                      { value: 'other', label: 'Other' }
                    ]}
                    required
                  />
                </Box>
              )}
            </Box>

            <Box>
              <Text size="sm" fw={500} mb="xs">Road Status</Text>
              <Radio.Group
                value={roadStatus}
                onChange={(value) => setRoadStatus(value as any)}
              >
                <Stack gap="xs">
                  <Radio value="clear" label="Clear" color="green" />
                  <Radio value="flooded" label="Flooded" color="blue" />
                  <Radio value="blocked" label="Blocked" color="yellow" />
                  <Radio value="mudslide" label="Mudslide" color="red" />
                </Stack>
              </Radio.Group>
            </Box>

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
              onChange={(file) => {
                setImageFile(file);
                if (file) {
                  const url = URL.createObjectURL(file);
                  setImageUrl(url);
                } else {
                  setImageUrl(null);
                }
              }}
              clearable
              leftSection={<IconPhoto size={16} />}
            />

            {imageUrl && (
              <Box>
                <Image
                  src={imageUrl}
                  alt="Preview"
                  style={{
                    maxHeight: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            )}

            <Button
              type="submit"
              loading={submitting}
              disabled={!selectedParish || !selectedCommunity}
              color="electricBlue"
              size="md"
              fullWidth
            >
              Submit Status Update
            </Button>
          </Stack>
        </form>
      </Card>

      <Card shadow="sm" padding="md" radius="md" withBorder style={{ borderColor: '#11DDB0' }}>
        <Stack gap="xs">
          <Title order={4} c="teal.0">How to Use</Title>
          <Text size="sm" c="dimmed">
            • Select your parish and community from the dropdowns
          </Text>
          <Text size="sm" c="dimmed">
            • Toggle power and WiFi status based on your current situation
          </Text>
          <Text size="sm" c="dimmed">
            • Choose the road status that best describes conditions in your area
          </Text>
          <Text size="sm" c="dimmed">
            • Add any additional details that might help others in your community
          </Text>
          <Text size="sm" c="dimmed">
            • Your update will appear in the Community Feed for others to see
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}
