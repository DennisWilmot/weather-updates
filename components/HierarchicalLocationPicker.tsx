'use client';

import { useState, useEffect } from 'react';
import { Select, Stack, Text, Loader, Group, Badge, TextInput, Combobox, useCombobox } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

interface Parish {
  id: string;
  name: string;
  code: string;
}

interface Community {
  id: string;
  name: string;
  parishId: string;
}

interface HierarchicalLocationPickerProps {
  onLocationChange: (location: {
    parishId: string | null;
    parishName: string | null;
    communityId: string | null;
    communityName: string | null;
    locationId: string | null;
    placeName: string | null;
    streetName: string | null;
  }) => void;
  initialParish?: string;
  initialCommunity?: string;
  initialPlace?: string;
}

export default function HierarchicalLocationPicker({
  onLocationChange,
  initialParish,
  initialCommunity,
  initialPlace
}: HierarchicalLocationPickerProps) {
  const [selectedParishId, setSelectedParishId] = useState<string | null>(initialParish || null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(initialCommunity || null);
  const [communitySearch, setCommunitySearch] = useState<string>(initialCommunity || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [placeSearch, setPlaceSearch] = useState<string>(initialPlace || '');
  const [streetName, setStreetName] = useState<string>('');
  const [useCustomPlace, setUseCustomPlace] = useState<boolean>(false);
  
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Fetch all parishes
  const { data: parishesData, isLoading: parishesLoading } = useQuery({
    queryKey: ['parishes'],
    queryFn: async () => {
      const response = await fetch('/api/parishes');
      if (!response.ok) throw new Error('Failed to fetch parishes');
      return response.json();
    }
  });

  // Fetch communities for selected parish
  const { data: communitiesData, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities', selectedParishId],
    queryFn: async () => {
      if (!selectedParishId) return null;
      const response = await fetch(`/api/parishes/${selectedParishId}/communities`);
      if (!response.ok) throw new Error('Failed to fetch communities');
      return response.json();
    },
    enabled: !!selectedParishId
  });

  // Fetch locations for selected community
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', selectedCommunityId],
    queryFn: async () => {
      if (!selectedCommunityId) return null;
      const response = await fetch(`/api/communities/${selectedCommunityId}/locations`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    enabled: !!selectedCommunityId
  });



  // Update parent when selection changes
  useEffect(() => {
    const parish = parishesData?.parishes?.find((p: Parish) => p.id === selectedParishId);
    const community = communitiesData?.communities?.find((c: Community) => c.id === selectedCommunityId);

    onLocationChange({
      parishId: selectedParishId,
      parishName: parish?.name || null,
      communityId: selectedCommunityId,
      // Use the community name from DB if ID exists, otherwise use the search text
      communityName: community?.name || (communitySearch.trim() || null),
      locationId: selectedLocationId,
      placeName: useCustomPlace ? placeSearch : null,
      streetName: streetName || null
    });
  }, [selectedParishId, selectedCommunityId, communitySearch, selectedLocationId, placeSearch, streetName, useCustomPlace, parishesData, communitiesData, onLocationChange]);

  // Handle parish change
  const handleParishChange = (value: string | null) => {
    setSelectedParishId(value);
    setSelectedCommunityId(null); // Reset community when parish changes
    setCommunitySearch(''); // Reset community search
  };

  // Handle community selection from dropdown
  const handleCommunitySelect = (value: string) => {
    const community = communitiesData?.communities?.find((c: Community) => c.id === value);
    if (community) {
      setSelectedCommunityId(community.id);
      setCommunitySearch(community.name);
    }
    combobox.closeDropdown();
  };

  return (
    <Stack gap="md">
      {/* Parish Selection */}
      <div>
        <Group mb="xs">
          <Text size="sm" fw={500}>Parish</Text>
          <Badge size="xs" color="blue" variant="light">Required</Badge>
        </Group>
        <Select
          placeholder={parishesLoading ? "Loading parishes..." : "Select parish"}
          value={selectedParishId}
          onChange={handleParishChange}
          data={
            parishesData?.parishes?.map((parish: Parish) => ({
              value: parish.id,
              label: parish.name
            })) || []
          }
          searchable
          clearable
          disabled={parishesLoading}
          leftSection={parishesLoading ? <Loader size="xs" /> : null}
          styles={{
            input: {
              fontWeight: 500,
              fontSize: '15px'
            }
          }}
        />
      </div>

      {/* Community Selection */}
      <div>
        <Group mb="xs">
          <Text size="sm" fw={500}>Community/Town</Text>
          <Badge size="xs" color="blue" variant="light">Required</Badge>
        </Group>
        <Combobox
          store={combobox}
          onOptionSubmit={handleCommunitySelect}
          withinPortal={false}
        >
          <Combobox.Target>
            <TextInput
              placeholder={
                !selectedParishId
                  ? "Select parish first"
                  : communitiesLoading
                  ? "Loading communities..."
                  : "Type or select community"
              }
              value={communitySearch}
              onChange={(event) => {
                setCommunitySearch(event.currentTarget.value);
                setSelectedCommunityId(null); // Clear ID when typing custom name
                combobox.openDropdown();
              }}
              onClick={() => combobox.openDropdown()}
              onFocus={() => combobox.openDropdown()}
              onBlur={() => {
                combobox.closeDropdown();
              }}
              disabled={!selectedParishId || communitiesLoading}
              leftSection={communitiesLoading ? <Loader size="xs" /> : null}
              styles={{
                input: {
                  fontWeight: 500,
                  fontSize: '15px'
                }
              }}
            />
          </Combobox.Target>
          
          <Combobox.Dropdown>
            <Combobox.Options>
              {communitiesLoading ? (
                <Combobox.Empty>Loading...</Combobox.Empty>
              ) : communitiesData?.communities?.length > 0 ? (
                communitiesData.communities
                  .filter((community: Community) => 
                    community.name.toLowerCase().includes(communitySearch.toLowerCase())
                  )
                  .map((community: Community) => (
                    <Combobox.Option value={community.id} key={community.id}>
                      {community.name}
                    </Combobox.Option>
                  ))
              ) : (
                <Combobox.Empty>Type to add new community</Combobox.Empty>
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        {selectedParishId && communitySearch && !selectedCommunityId && (
          <Text size="xs" c="blue" mt="xs">
            ✏️ New community "{communitySearch}" will be created
          </Text>
        )}
      </div>

      {/* Place/Street Level */}
      <div>
        <Group mb="xs">
          <Text size="sm" fw={500}>Specific Place/Street (Optional)</Text>
          <Badge size="xs" color="gray" variant="light">For precise location</Badge>
        </Group>

        <Stack gap="sm">
          {/* Known Places/Landmarks - only show if community is selected */}
          {selectedCommunityId && locationsData?.locations && locationsData.locations.length > 0 && (
            <Select
              placeholder="Select a known place/landmark"
              value={selectedLocationId}
              onChange={(value) => {
                setSelectedLocationId(value);
                setUseCustomPlace(false);
                setPlaceSearch('');
                setStreetName('');
              }}
              data={
                locationsData.locations.map((loc: any) => ({
                  value: loc.id,
                  label: `${loc.name}${loc.type ? ` (${loc.type})` : ''}`
                }))
              }
              searchable
              clearable
              disabled={locationsLoading}
              leftSection={locationsLoading ? <Loader size="xs" /> : null}
            />
          )}

          {/* Street Name - always available */}
          <Stack gap="xs">
            <Text size="xs" c="dimmed">Street address:</Text>
            <TextInput
              placeholder="e.g., 123 Main Street, Hope Road..."
              value={streetName}
              onChange={(e) => {
                setStreetName(e.currentTarget.value);
                setUseCustomPlace(true);
                setSelectedLocationId(null);
              }}
            />
          </Stack>

          {/* Custom Place Name - always available */}
          <Stack gap="xs">
            <Text size="xs" c="dimmed">Or enter custom place:</Text>
            <TextInput
              placeholder="e.g., Pegasus Hotel, Lane Plaza, Devon House..."
              value={placeSearch}
              onChange={(e) => {
                setPlaceSearch(e.currentTarget.value);
                setUseCustomPlace(true);
                setSelectedLocationId(null);
              }}
            />
          </Stack>
        </Stack>
      </div>

      {/* Location Summary */}
      {selectedParishId && selectedCommunityId && (
        <Group gap="xs" mt="xs" wrap="wrap">
          <Badge color="teal" variant="light" size="sm">
            {parishesData?.parishes?.find((p: Parish) => p.id === selectedParishId)?.name}
          </Badge>
          <Text size="sm" c="dimmed">→</Text>
          <Badge color="cyan" variant="light" size="sm">
            {communitiesData?.communities?.find((c: Community) => c.id === selectedCommunityId)?.name}
          </Badge>
          {(selectedLocationId || placeSearch || streetName) && (
            <>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="blue" variant="light" size="sm">
                {selectedLocationId
                  ? locationsData?.locations?.find((l: any) => l.id === selectedLocationId)?.name
                  : placeSearch || streetName}
              </Badge>
            </>
          )}
        </Group>
      )}
    </Stack>
  );
}
