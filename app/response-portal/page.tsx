'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Stack,
  Title,
  Card,
  Group,
  Text,
  Badge,
  Select,
  Alert,
  Loader,
  Center,
  Divider,
  Box,
  Button,
  Paper
} from '@mantine/core';
import { IconAlertTriangle, IconPhone, IconUser, IconMapPin, IconClock } from '@tabler/icons-react';

interface HelpRequest {
  id: string;
  parish: string;
  community: string;
  placeName?: string;
  streetName?: string;
  helpType: 'medical' | 'physical' | 'police' | 'firefighter' | 'other';
  requesterName: string;
  requesterPhone: string;
  helpDescription: string;
  hasElectricity: boolean;
  hasWifi: boolean;
  roadStatus: string;
  additionalInfo?: string;
  createdAt: string;
}

export default function ResponsePortal() {
  const [filterType, setFilterType] = useState<string>('all');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['help-requests', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('helpType', filterType);
      }
      
      const response = await fetch(`/api/help-requests?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch help requests');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getHelpTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'red';
      case 'physical': return 'orange';
      case 'police': return 'blue';
      case 'firefighter': return 'yellow';
      default: return 'gray';
    }
  };

  const getHelpTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'physical': return '💪';
      case 'police': return '👮';
      case 'firefighter': return '🚒';
      default: return 'ℹ️';
    }
  };

  const getHelpTypeLabel = (type: string) => {
    switch (type) {
      case 'medical': return 'Medical Emergency';
      case 'physical': return 'Physical Assistance';
      case 'police': return 'Police';
      case 'firefighter': return 'Fire/Rescue';
      default: return 'Other';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      let submissionTime: Date;
      
      if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
        submissionTime = new Date(dateString);
      } else {
        submissionTime = new Date(dateString + 'Z');
      }
      
      if (isNaN(submissionTime.getTime())) {
        return 'Just now';
      }
      
      const diffMs = now.getTime() - submissionTime.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      
      if (diffMinutes < 0) return 'Just now';
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} min ago`;
      if (diffMinutes < 1440) {
        const hours = Math.round(diffMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      const days = Math.round(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } catch (error) {
      return 'Just now';
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Paper shadow="sm" p="xl" radius="md" style={{ backgroundColor: '#1478FF' }}>
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap="md">
                <IconAlertTriangle size={40} color="white" />
                <div>
                  <Title order={1} c="white">Emergency Response Portal</Title>
                  <Text c="white" size="sm" mt="xs">
                    Real-time help requests from affected communities
                  </Text>
                </div>
              </Group>
              <Button 
                variant="white" 
                leftSection={<IconClock size={16} />}
                onClick={() => refetch()}
                loading={isFetching}
              >
                Refresh
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Filters */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group>
            <Select
              label="Filter by Help Type"
              placeholder="All Types"
              value={filterType}
              onChange={(value) => setFilterType(value || 'all')}
              data={[
                { value: 'all', label: 'All Types' },
                { value: 'medical', label: '🏥 Medical Emergency' },
                { value: 'physical', label: '💪 Physical Assistance' },
                { value: 'police', label: '👮 Police' },
                { value: 'firefighter', label: '🚒 Fire/Rescue' },
                { value: 'other', label: 'ℹ️ Other' }
              ]}
              style={{ minWidth: 250 }}
            />
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500} c="dimmed">
                Total Requests: {data?.total || 0}
              </Text>
            </Box>
          </Group>
        </Card>

        {/* Help Requests List */}
        {isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading help requests...</Text>
            </Stack>
          </Center>
        ) : error ? (
          <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
            Failed to load help requests. Please try again.
          </Alert>
        ) : !data?.data || data.data.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <IconAlertTriangle size={48} color="gray" />
              <Text size="lg" fw={500} c="dimmed">No active help requests</Text>
              <Text size="sm" c="dimmed">Check back later or adjust filters</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            {data.data.map((request: HelpRequest) => (
              <Card 
                key={request.id} 
                shadow="md" 
                padding="lg" 
                radius="md" 
                withBorder
                style={{ borderLeft: `4px solid var(--mantine-color-${getHelpTypeColor(request.helpType)}-6)` }}
              >
                <Stack gap="md">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm">
                      <Text size="xl">{getHelpTypeIcon(request.helpType)}</Text>
                      <div>
                        <Badge 
                          color={getHelpTypeColor(request.helpType)} 
                          size="lg" 
                          variant="filled"
                        >
                          {getHelpTypeLabel(request.helpType)}
                        </Badge>
                        <Text size="xs" c="dimmed" mt="xs">
                          {formatTimeAgo(request.createdAt)} • {new Date(request.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Jamaica'
                          })}
                        </Text>
                      </div>
                    </Group>
                  </Group>

                  <Divider />

                  {/* Contact Information */}
                  <Box style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                    <Text size="sm" fw={600} mb="md" c="red">📞 Contact Information</Text>
                    <Stack gap="sm">
                      <Group gap="xs">
                        <IconUser size={16} />
                        <Text size="sm" fw={500}>Name:</Text>
                        <Text size="sm">{request.requesterName}</Text>
                      </Group>
                      <Group gap="xs">
                        <IconPhone size={16} />
                        <Text size="sm" fw={500}>Phone:</Text>
                        <Text size="sm" style={{ fontFamily: 'monospace' }}>
                          <a href={`tel:${request.requesterPhone}`} style={{ color: '#1478FF', textDecoration: 'none' }}>
                            {request.requesterPhone}
                          </a>
                        </Text>
                      </Group>
                    </Stack>
                  </Box>

                  {/* Location */}
                  <Box>
                    <Group gap="xs" mb="xs">
                      <IconMapPin size={16} />
                      <Text size="sm" fw={600}>Location</Text>
                    </Group>
                    <Group gap="xs">
                      <Badge color="teal" variant="light">{request.parish}</Badge>
                      <Text size="xs" c="dimmed">→</Text>
                      <Badge color="cyan" variant="light">{request.community}</Badge>
                      {(request.placeName || request.streetName) && (
                        <>
                          <Text size="xs" c="dimmed">→</Text>
                          <Badge color="blue" variant="filled">
                            📍 {request.placeName || request.streetName}
                          </Badge>
                        </>
                      )}
                    </Group>
                  </Box>

                  {/* Help Description */}
                  <Box>
                    <Text size="sm" fw={600} mb="xs">Description of Help Needed:</Text>
                    <Text size="sm" style={{ 
                      backgroundColor: '#fff3cd', 
                      padding: '0.75rem', 
                      borderRadius: '6px',
                      border: '1px solid #ffc107'
                    }}>
                      {request.helpDescription}
                    </Text>
                  </Box>

                  {/* Additional Info */}
                  {request.additionalInfo && (
                    <Box>
                      <Text size="sm" fw={600} mb="xs">Additional Information:</Text>
                      <Text size="sm" c="dimmed">{request.additionalInfo}</Text>
                    </Box>
                  )}

                  {/* Conditions */}
                  <Group gap="sm">
                    <Badge color={request.hasElectricity ? 'green' : 'red'} variant="light">
                      ⚡ Power: {request.hasElectricity ? 'On' : 'Off'}
                    </Badge>
                    <Badge color={request.hasWifi ? 'green' : 'red'} variant="light">
                      📡 Internet: {request.hasWifi ? 'Available' : 'Down'}
                    </Badge>
                    <Badge color={request.roadStatus === 'clear' ? 'green' : 'yellow'} variant="light">
                      🚗 Road: {request.roadStatus}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

