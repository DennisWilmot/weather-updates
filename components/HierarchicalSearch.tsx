'use client';

import { useState } from 'react';
import { TextInput, Stack, Card, Group, Text, Badge, Loader, Box, ActionIcon } from '@mantine/core';
import { IconSearch, IconMapPin, IconBuilding, IconX } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  parishes: Array<{ id: string; name: string; code: string }>;
  communities: Array<{
    community: { id: string; name: string };
    parish: { id: string; name: string };
  }>;
  locations: Array<{
    location: { id: string; name: string; type: string };
    community: { id: string; name: string };
    parish: { id: string; name: string };
  }>;
  total: number;
}

interface HierarchicalSearchProps {
  onSelectParish?: (parishId: string, parishName: string) => void;
  onSelectCommunity?: (communityId: string, communityName: string, parishName: string) => void;
  onSelectLocation?: (locationId: string, locationName: string, communityName: string, parishName: string) => void;
  placeholder?: string;
}

export default function HierarchicalSearch({
  onSelectParish,
  onSelectCommunity,
  onSelectLocation,
  placeholder = 'Search parishes, communities, places...'
}: HierarchicalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const [showResults, setShowResults] = useState(false);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 1) {
        return { parishes: [], communities: [], locations: [], total: 0 };
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      return data.results;
    },
    enabled: debouncedQuery.length >= 1
  });

  const handleClear = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  const handleSelectParish = (parish: any) => {
    if (onSelectParish) {
      onSelectParish(parish.id, parish.name);
    }
    handleClear();
  };

  const handleSelectCommunity = (result: any) => {
    if (onSelectCommunity) {
      onSelectCommunity(
        result.community.id,
        result.community.name,
        result.parish.name
      );
    }
    handleClear();
  };

  const handleSelectLocation = (result: any) => {
    if (onSelectLocation) {
      onSelectLocation(
        result.location.id,
        result.location.name,
        result.community.name,
        result.parish.name
      );
    }
    handleClear();
  };

  const hasResults = searchResults && searchResults.total > 0;

  return (
    <Box pos="relative">
      <TextInput
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.currentTarget.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        leftSection={<IconSearch size={16} />}
        rightSection={
          searchQuery ? (
            <ActionIcon variant="subtle" onClick={handleClear} size="sm">
              <IconX size={16} />
            </ActionIcon>
          ) : null
        }
        size="md"
        styles={{
          input: {
            borderRadius: '8px',
            border: '2px solid #1478FF'
          }
        }}
      />

      {/* Search Results Dropdown */}
      {showResults && searchQuery.length >= 1 && (
        <Card
          shadow="lg"
          padding="md"
          radius="md"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {isLoading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Searching...</Text>
            </Group>
          ) : !hasResults ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No results found for "{searchQuery}"
            </Text>
          ) : (
            <Stack gap="md">
              {/* Parishes */}
              {searchResults.parishes.length > 0 && (
                <Box>
                  <Text size="xs" fw={600} c="dimmed" mb="xs">PARISHES</Text>
                  <Stack gap="xs">
                    {searchResults.parishes.map((parish) => (
                      <Card
                        key={parish.id}
                        padding="sm"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectParish(parish)}
                      >
                        <Group gap="xs">
                          <IconMapPin size={16} color="#11DDB0" />
                          <Text size="sm" fw={500}>{parish.name}</Text>
                          <Badge size="xs" variant="light" color="teal">
                            {parish.code}
                          </Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Communities */}
              {searchResults.communities.length > 0 && (
                <Box>
                  <Text size="xs" fw={600} c="dimmed" mb="xs">
                    COMMUNITIES ({searchResults.communities.length})
                  </Text>
                  <Stack gap="xs">
                    {searchResults.communities.slice(0, 10).map((result, idx) => (
                      <Card
                        key={idx}
                        padding="sm"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectCommunity(result)}
                      >
                        <Stack gap={4}>
                          <Group gap="xs">
                            <IconMapPin size={16} color="#1478FF" />
                            <Text size="sm" fw={500}>{result.community.name}</Text>
                          </Group>
                          <Group gap="xs" ml={20}>
                            <Badge size="xs" variant="light" color="cyan">
                              {result.parish.name}
                            </Badge>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Locations */}
              {searchResults.locations.length > 0 && (
                <Box>
                  <Text size="xs" fw={600} c="dimmed" mb="xs">
                    PLACES & LANDMARKS ({searchResults.locations.length})
                  </Text>
                  <Stack gap="xs">
                    {searchResults.locations.slice(0, 10).map((result, idx) => (
                      <Card
                        key={idx}
                        padding="sm"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectLocation(result)}
                      >
                        <Stack gap={4}>
                          <Group gap="xs">
                            <IconBuilding size={16} color="#FFE66D" />
                            <Text size="sm" fw={500}>{result.location.name}</Text>
                            <Badge size="xs" variant="outline">
                              {result.location.type}
                            </Badge>
                          </Group>
                          <Group gap="xs" ml={20}>
                            <Text size="xs" c="dimmed">
                              {result.community.name}, {result.parish.name}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Result Count */}
              <Text size="xs" c="dimmed" ta="center">
                Showing {Math.min(
                  searchResults.parishes.length +
                  Math.min(searchResults.communities.length, 10) +
                  Math.min(searchResults.locations.length, 10),
                  searchResults.total
                )} of {searchResults.total} results
              </Text>
            </Stack>
          )}
        </Card>
      )}
    </Box>
  );
}
