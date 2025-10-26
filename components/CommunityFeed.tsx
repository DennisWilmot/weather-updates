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
  Pagination,
  Modal,
  PasswordInput,
  ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertTriangle,
  IconTrash
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import jamaicaLocations from '../data/jamaica-locations.json';
import JamaicaParishMap from './JamaicaParishMap';

interface Submission {
  id: string;
  parish: string;
  community: string;
  placeName?: string;
  streetName?: string;
  hasElectricity: boolean;
  hasWifi: boolean;
  flowService?: boolean;
  digicelService?: boolean;
  waterService?: boolean;
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

  // Admin delete state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (submissionId: string) => {
    setDeletingId(submissionId);
    setAdminKey('');
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId || !adminKey) {
      notifications.show({
        title: 'Error',
        message: 'Please enter admin key',
        color: 'red'
      });
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/submissions/${deletingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete submission');
      }

      notifications.show({
        title: 'Success',
        message: 'Submission deleted successfully',
        color: 'green'
      });

      closeDeleteModal();
      setDeletingId(null);
      setAdminKey('');
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete submission',
        color: 'red'
      });
    } finally {
      setDeleting(false);
    }
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
    try {
      const now = new Date();
      // Parse the timestamp - database stores in UTC
      let submissionTime: Date;
      
      // Check if the dateString already has timezone info
      if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
        submissionTime = new Date(dateString);
      } else {
        // If no timezone info, assume it's UTC and add Z
        submissionTime = new Date(dateString + 'Z');
      }
      
      // Check if date is valid
      if (isNaN(submissionTime.getTime())) {
        console.log('Invalid date:', dateString);
        return 'Just now';
      }
      
      // Calculate difference in milliseconds
      const diffMs = now.getTime() - submissionTime.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      
      console.log('Time calculation:', {
        dateString,
        submissionTime: submissionTime.toISOString(),
        now: now.toISOString(),
        diffMs,
        diffMinutes
      });
      
      // If negative (future date), just say "Just now"
      if (diffMinutes < 0) {
        return 'Just now';
      }
      
      // If less than 1 minute
      if (diffMinutes < 1) {
        return 'Just now';
      }
      
      // If less than 60 minutes, show in minutes
      if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
      }
      
      // If less than 24 hours, show in hours
      if (diffMinutes < 1440) {
        const hours = Math.round(diffMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      
      // If more than 24 hours, show in days
      const days = Math.round(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error formatting time:', error, dateString);
      return 'Just now';
    }
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
                    <Group gap="xs">
                      <Badge color={getRoadStatusColor(submission.roadStatus)} variant="light">
                        {getRoadStatusLabel(submission.roadStatus)}
                      </Badge>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => handleDeleteClick(submission.id)}
                        title="Delete submission (admin only)"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
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

                      {submission.flowService !== undefined && submission.flowService !== null && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={submission.flowService ? 'green' : 'red'} variant="light">
                            {submission.flowService ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="xs" c={submission.flowService ? 'green' : 'red'}>
                            Flow: {submission.flowService ? 'Up' : 'Down'}
                          </Text>
                        </Group>
                      )}

                      {submission.digicelService !== undefined && submission.digicelService !== null && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={submission.digicelService ? 'green' : 'red'} variant="light">
                            {submission.digicelService ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="xs" c={submission.digicelService ? 'green' : 'red'}>
                            Digicel: {submission.digicelService ? 'Up' : 'Down'}
                          </Text>
                        </Group>
                      )}

                      {submission.waterService !== undefined && submission.waterService !== null && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={submission.waterService ? 'green' : 'red'} variant="light">
                            {submission.waterService ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="xs" c={submission.waterService ? 'green' : 'red'}>
                            Water: {submission.waterService ? 'Available' : 'Unavailable'}
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

      {/* Admin Delete Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Submission (Admin Only)"
        centered
      >
        <Stack gap="md">
          <Alert color="yellow" title="Warning">
            This action cannot be undone. Please enter your admin key to confirm deletion.
          </Alert>

          <PasswordInput
            label="Admin Key"
            placeholder="Enter admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.currentTarget.value)}
            required
          />

          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={closeDeleteModal} disabled={deleting}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={deleting}
              leftSection={<IconTrash size={16} />}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}