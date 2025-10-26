'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Button,
  Select,
  Badge,
  ThemeIcon,
  Box,
  Alert,
  Loader,
  Center,
  Divider,
  Combobox,
  TextInput,
  useCombobox,
  Pagination
} from '@mantine/core';
import { 
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertTriangle
} from '@tabler/icons-react';
import jamaicaLocations from '../data/jamaica-locations.json';
import JamaicaParishMap from './JamaicaParishMap';

interface Submission {
  id: string;
  parish: string;
  community: string;
  placeName?: string;
  streetName?: string;
  hasElectricity: boolean;
  powerProvider?: string;
  hasWifi: boolean;
  flowService?: boolean;
  digicelService?: boolean;
  flooding?: boolean;
  downedPowerLines?: boolean;
  fallenTrees?: boolean;
  structuralDamage?: boolean;
  needsHelp: boolean;
  helpType?: 'medical' | 'physical' | 'police' | 'firefighter' | 'other';
  roadStatus: 'clear' | 'flooded' | 'blocked' | 'mudslide' | 'damaged';
  additionalInfo?: string;
  imageUrl?: string;
  createdAt: string;
}

interface ParishStats {
  parishId: string;
  parishName: string;
  totalSubmissions: number;
  recentSubmissions: number;
  electricityOutages: number;
  flowOutages: number;
  digicelOutages: number;
  activeHazards: {
    flooding: number;
    downedPowerLines: number;
    fallenTrees: number;
    structuralDamage: number;
  };
  needsHelp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function CommunityFeed() {
  // Filter state
  const [filterParish, setFilterParish] = useState<string>('');
  const [filterCommunity, setFilterCommunity] = useState<string>('');
  const [communitySearch, setCommunitySearch] = useState<string>('');
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // React Query for fetching submissions
  const { data: submissionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['submissions', filterParish, filterCommunity, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterParish) params.append('parish', filterParish);
      if (filterCommunity) params.append('community', filterCommunity);
      params.append('page', currentPage.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/submissions?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });


  const searchCommunities = async (search: string) => {
    if (!filterParish || search.length < 1) {
      setCommunities([]);
      return;
    }
    
    try {
      setLoadingCommunities(true);
      const response = await fetch(`/api/communities?parish=${filterParish}&search=${encodeURIComponent(search)}`);
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

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (search: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          searchCommunities(search);
        }, 300); // 300ms delay
      };
    })(),
    [filterParish]
  );

  const handleCommunitySearch = (value: string) => {
    setCommunitySearch(value);
    setFilterCommunity(value);
    debouncedSearch(value);
    combobox.openDropdown();
  };

  const handleCommunitySelect = (value: string) => {
    setFilterCommunity(value);
    setCommunitySearch(value);
    combobox.closeDropdown();
  };

  const clearFilters = () => {
    setFilterParish('');
    setFilterCommunity('');
    setCommunitySearch('');
  };

  const getRoadStatusColor = (status: string) => {
    switch (status) {
      case 'clear': return 'green';
      case 'flooded': return 'blue';
      case 'blocked': return 'yellow';
      case 'mudslide': return 'red';
      default: return 'gray';
    }
  };

  const getRoadStatusLabel = (status: string) => {
    switch (status) {
      case 'clear': return 'Clear';
      case 'flooded': return 'Flooded';
      case 'blocked': return 'Blocked';
      case 'mudslide': return 'Mudslide';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const submissionTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - submissionTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterParish, filterCommunity]);

  const filterCommunities = filterParish ? jamaicaLocations[filterParish as keyof typeof jamaicaLocations] || [] : [];


  return (
    <Stack gap="lg">

      {/* Map Card */}
      <Card shadow="sm" padding="xs" radius="md" withBorder style={{ paddingTop: '12px', paddingBottom: '12px' }}>
        <Stack gap={4}>
          <Text size="xs" fw={500}>Tap a Parish to View Updates</Text>
          <JamaicaParishMap 
            selectedParish={filterParish}
            onParishClick={(parish) => {
              // Toggle filter: if clicking same parish, clear filter; otherwise set it
              if (filterParish === parish) {
                setFilterParish('');
              } else {
                setFilterParish(parish);
              }
              setFilterCommunity('');
              setCommunitySearch('');
            }}
          />
        </Stack>
      </Card>

      {/* Filter Controls */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between" align="flex-end">
          <Group grow>
            <Select
              label="Filter by Parish"
              placeholder="All Parishes"
              value={filterParish}
              onChange={(value) => {
                setFilterParish(value || '');
                setFilterCommunity('');
                setCommunitySearch('');
              }}
              data={[
                { value: '', label: 'All Parishes' },
                ...Object.keys(jamaicaLocations).map(parish => ({ value: parish, label: parish }))
              ]}
              clearable
            />
            <Box>
              <Text size="sm" fw={500} mb="xs">Filter by Community</Text>
              <Combobox
                store={combobox}
                onOptionSubmit={handleCommunitySelect}
                withinPortal={false}
              >
                <Combobox.Target>
                  <TextInput
                    placeholder="Type community name to search"
                    value={communitySearch}
                    onChange={(event) => handleCommunitySearch(event.currentTarget.value)}
                    onClick={() => combobox.openDropdown()}
                    onFocus={() => combobox.openDropdown()}
                    onBlur={() => combobox.closeDropdown()}
                    disabled={!filterParish}
                  />
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {loadingCommunities ? (
                      <Combobox.Empty>Searching...</Combobox.Empty>
                    ) : communities.length > 0 ? (
                      communities.map((community) => (
                        <Combobox.Option value={community.name} key={community.id}>
                          {community.name}
                        </Combobox.Option>
                      ))
                    ) : communitySearch.length >= 1 ? (
                      <Combobox.Empty>
                        No communities found matching "{communitySearch}"
                      </Combobox.Empty>
                    ) : (
                      <Combobox.Empty>Start typing to search communities</Combobox.Empty>
                    )}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            </Box>
          </Group>
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!filterParish && !filterCommunity}
          >
            Clear Filters
          </Button>
        </Group>
      </Card>

      {/* Submissions Feed */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Title order={3} c="#1478FF">Community Updates</Title>
            <Text size="xs" c="dimmed" mt="xs">
              Last updated: {new Date().toLocaleString('en-US', {
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Jamaica'
              })}
            </Text>
          </Box>
          <Button
            variant="outline"
            size="sm"
            leftSection={<IconRefresh />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Group>

        {isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="md" />
              <Text c="dimmed">Loading community updates...</Text>
            </Stack>
          </Center>
        ) : error ? (
          <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
            {error instanceof Error ? error.message : 'Failed to fetch submissions'}
            <Button mt="sm" onClick={() => refetch()} leftSection={<IconRefresh />}>
              Retry
            </Button>
          </Alert>
        ) : !submissionsData?.data || submissionsData.data.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text c="dimmed">No updates found</Text>
              <Text size="sm" c="dimmed">Be the first to share your status!</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="sm">
            {submissionsData.data.map((submission: Submission) => (
              <Card key={submission.id} shadow="xs" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  {/* Location Header */}
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      {/* Hierarchical Location */}
                      <Group gap="xs" wrap="wrap">
                        <Badge color="teal" variant="light" size="sm">
                          {submission.parish}
                        </Badge>
                        <Text size="xs" c="dimmed">→</Text>
                        <Badge color="cyan" variant="light" size="sm">
                          {submission.community}
                        </Badge>
                        {(submission.placeName || submission.streetName) && (
                          <>
                            <Text size="xs" c="dimmed">→</Text>
                            <Badge color="blue" variant="filled" size="sm">
                              📍 {submission.placeName || submission.streetName}
                            </Badge>
                          </>
                        )}
                      </Group>

                      {/* Timestamp */}
                      <Group gap="xs" align="center" mt="xs">
                        <Text size="xs" c="dimmed">
                          {formatTimeAgo(submission.createdAt)}
                        </Text>
                        <Text size="xs" c="blue" fw={500}>
                          • {new Date(submission.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Jamaica'
                          })}
                        </Text>
                      </Group>
                    </Box>
                    <Badge color={getRoadStatusColor(submission.roadStatus)} variant="light">
                      {getRoadStatusLabel(submission.roadStatus)}
                    </Badge>
                  </Group>

                  <Divider />

                  {/* Service Status */}
                  <Box>
                    <Text size="xs" fw={600} c="dimmed" mb="xs">Services</Text>
                    <Group gap="md" wrap="wrap">
                      <Group gap="xs">
                        <ThemeIcon size="sm" color={submission.hasElectricity ? 'green' : 'red'} variant="light">
                          {submission.hasElectricity ? <IconCheck size={12} /> : <IconX size={12} />}
                        </ThemeIcon>
                        <Text size="xs" c={submission.hasElectricity ? 'green' : 'red'}>
                          JPS: {submission.hasElectricity ? 'On' : 'Off'}
                        </Text>
                      </Group>

                      {submission.flowService !== undefined && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={submission.flowService ? 'green' : 'red'} variant="light">
                            {submission.flowService ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="xs" c={submission.flowService ? 'green' : 'red'}>
                            Flow: {submission.flowService ? 'Up' : 'Down'}
                          </Text>
                        </Group>
                      )}

                      {submission.digicelService !== undefined && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={submission.digicelService ? 'green' : 'red'} variant="light">
                            {submission.digicelService ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="xs" c={submission.digicelService ? 'green' : 'red'}>
                            Digicel: {submission.digicelService ? 'Up' : 'Down'}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Box>

                      {submission.digicelService !== undefined && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={submission.digicelService ? 'green' : 'red'} variant="light">
                            {submission.digicelService ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="xs" c={submission.digicelService ? 'green' : 'red'}>
                            Digicel: {submission.digicelService ? 'Up' : 'Down'}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Box>

                  {/* Hazards */}
                  {(submission.flooding || submission.downedPowerLines || submission.fallenTrees || submission.structuralDamage) && (
                    <Box>
                      <Text size="xs" fw={600} c="red" mb="xs">⚠️ Active Hazards</Text>
                      <Group gap="xs" wrap="wrap">
                        {submission.flooding && <Badge color="blue" variant="light" size="sm">💧 Flooding</Badge>}
                        {submission.downedPowerLines && <Badge color="yellow" variant="light" size="sm">⚡ Power Lines Down</Badge>}
                        {submission.fallenTrees && <Badge color="green" variant="light" size="sm">🌳 Fallen Trees</Badge>}
                        {submission.structuralDamage && <Badge color="red" variant="light" size="sm">🏚️ Structural Damage</Badge>}
                      </Group>
                    </Box>
                  )}

                  {/* Emergency Help */}
                  {submission.needsHelp && (
                    <Box>
                      <Badge color="red" variant="filled" size="lg" fullWidth>
                        🆘 NEEDS HELP: {submission.helpType?.toUpperCase() || 'GENERAL'}
                      </Badge>
                    </Box>
                  )}

                  {submission.additionalInfo && (
                    <>
                      <Divider />
                      <Text size="sm" c="dimmed">
                        {submission.additionalInfo}
                      </Text>
                    </>
                  )}

                  {submission.imageUrl && (
                    <>
                      <Divider />
                      <Box>
                        <img 
                          src={submission.imageUrl} 
                          alt="Submission photo"
                          style={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      </Box>
                    </>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
        
        {/* Pagination */}
        {submissionsData?.pagination && submissionsData.pagination.totalPages > 1 && (
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="center">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={submissionsData.pagination.totalPages}
                size="sm"
                withEdges
              />
            </Group>
            <Text size="xs" c="dimmed" ta="center" mt="sm">
              Showing {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, submissionsData.pagination.total)} of {submissionsData.pagination.total} updates
            </Text>
          </Card>
        )}
      </Card>
    </Stack>
  );
}