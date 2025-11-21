'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Paper,
  Table,
  ScrollArea,
  Flex,
  Burger,
  Drawer
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertTriangle, IconPhone, IconUser, IconMapPin } from '@tabler/icons-react';
import Image from 'next/image';

interface ParishReliefStats {
  parishId: string;
  parishName: string;
  totalSubmissions: number;
  recentSubmissions: number;
  electricityOutages: number;
  flowOutages: number;
  digicelOutages: number;
  waterOutages: number;
  activeHazards: {
    flooding: number;
    downedPowerLines: number;
    fallenTrees: number;
    structuralDamage: number;
  };
  helpRequests: number;
  helpRequestsByType: {
    medical: number;
    physical: number;
    police: number;
    firefighter: number;
    other: number;
  };
  communitiesAffected: number;
  lastUpdate: string;
  actionsNeeded: string[];
}

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
  parishId: string;
}

export default function ReliefPortal() {
  const [selectedParishId, setSelectedParishId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();

  // Fetch parish statistics
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats, isFetching: statsFetching } = useQuery({
    queryKey: ['relief-portal-stats'],
    queryFn: async () => {
      const response = await fetch('/api/relief-portal/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch parish statistics');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch help requests
  const { data: helpRequestsData, isLoading: helpRequestsLoading, error: helpRequestsError, refetch: refetchHelpRequests, isFetching: helpRequestsFetching } = useQuery({
    queryKey: ['help-requests', filterType, selectedParishId],
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

  // Filter help requests by selected parish
  const filteredHelpRequests = helpRequestsData?.data?.filter((request: HelpRequest) => {
    if (!selectedParishId) return true;
    return request.parishId === selectedParishId;
  }) || [];

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

  const getActionPriorityColor = (actions: string[]) => {
    if (actions.some(a => a.includes('Medical') || a.includes('Evacuation') || a.includes('Police') || a.includes('Fire'))) {
      return 'red';
    }
    if (actions.some(a => a.includes('JPS') || a.includes('Power line'))) {
      return 'orange';
    }
    if (actions.some(a => a.includes('Road') || a.includes('Tree'))) {
      return 'yellow';
    }
    return 'green';
  };

  return (
    <>
      {/* Header Navbar - Same as main route */}
      <Box 
        style={{ 
          backgroundColor: '#0f0f23', 
          borderBottom: '2px solid #1478FF',
          height: '14.28vh', // 1/7 of viewport height
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container size="xl">
          <Flex align="center" justify="space-between" gap="lg">
            {/* Mobile Hamburger Menu */}
            <Burger
              opened={opened}
              onClick={open}
              color="white"
              size="sm"
              aria-label="Toggle navigation"
              hiddenFrom="sm"
            />

            {/* Intellibus Logo */}
            <Image 
              src="/White_Icon_Blue_Bkg-removebg-preview.png" 
              alt="Intellibus" 
              width={40} 
              height={40}
              style={{ objectFit: 'contain' }}
            />

            <Title order={1} c="white" fw={800} size="xl" style={{ flex: '1 1 auto', textAlign: 'center' }}>
                  Hurricane Response
            </Title>
            
            {/* Desktop Navigation Tabs */}
            <Group gap="xs" visibleFrom="sm">
             
              <Button
                variant="outline"
                color="electricBlue"
                size="sm"
                onClick={() => router.push('/')}
                leftSection="📢"
              >
                Report
              </Button>
              <Button
                variant="outline"
                color="yellow"
                size="sm"
                onClick={() => router.push('/')}
                leftSection="🌪️"
              >
                Storm
              </Button>
              <Button
                variant="outline"
                color="coral"
                size="sm"
                onClick={() => router.push('/')}
                leftSection="📞"
              >
                Contacts
              </Button>
              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection="🛟"
              >
                Relief Portal
              </Button>
            </Group>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Navigation"
        position="left"
        size="sm"
        hiddenFrom="sm"
        styles={{
          content: {
            backgroundColor: '#0f0f23',
            color: 'white'
          },
          header: {
            backgroundColor: '#0f0f23',
            borderBottom: '1px solid #1478FF'
          },
          title: {
            color: 'white'
          }
        }}
      >
        <Stack gap="md" mt="md">
         
         
          <Button
            variant="subtle"
            color="electricBlue"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="📢"
          >
            Report Update
          </Button>
          <Button
            variant="subtle"
            color="yellow"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="🌪️"
          >
            Storm Updates
          </Button>
          <Button
            variant="filled"
            color="blue"
            fullWidth
            leftSection="🛟"
          >
            Relief Portal
          </Button>
        </Stack>
        <Box mt="auto" pt="xl" style={{ borderTop: '1px solid rgba(20, 120, 255, 0.2)' }}>
          <Stack gap={4} align="center" mb="md">
            <Text size="xs" c="dimmed">Powered by:</Text>
            <Image 
              src="/white_logo.png" 
              alt="Intellibus" 
              width={240} 
              height={180}
              style={{ objectFit: 'contain', marginTop: '-20px' }}
            />
          </Stack>
        </Box>
      </Drawer>

      <Container size="xl" py="xl">
        <Stack gap="lg">
          {/* Two Column Layout */}
          <Flex gap="lg" direction={{ base: 'column', lg: 'row' }}>
              {/* Left Column - Dashboard Table */}
              <Box style={{ flex: '0 0 50%' }}>
                <Card shadow="sm" padding="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Title order={3}>Parish Summary</Title>
                      <Badge size="lg" variant="light">
                        {statsData?.parishes?.length || 0} Parishes
                      </Badge>
                    </Group>

                    {statsLoading ? (
                      <Center py="xl">
                        <Loader size="lg" />
                      </Center>
                    ) : statsError ? (
                      <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
                        {statsError instanceof Error ? statsError.message : 'Failed to load parish statistics'}
                      </Alert>
                    ) : !statsData?.parishes || statsData.parishes.length === 0 ? (
                      <Center py="xl">
                        <Text c="dimmed">No data available</Text>
                      </Center>
                    ) : (
                      <ScrollArea h={600}>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Parish</Table.Th>
                              <Table.Th>Reports</Table.Th>
                              <Table.Th>Key Issues</Table.Th>
                              <Table.Th>Actions Needed</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {statsData.parishes.map((parish: ParishReliefStats) => (
                              <Table.Tr
                                key={parish.parishId}
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: selectedParishId === parish.parishId ? 'rgba(20, 120, 255, 0.1)' : undefined
                                }}
                                onClick={() => setSelectedParishId(
                                  selectedParishId === parish.parishId ? null : parish.parishId
                                )}
                              >
                                <Table.Td>
                                  <Text fw={500}>{parish.parishName}</Text>
                                  <Text size="xs" c="dimmed">
                                    {parish.communitiesAffected} communities
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text>{parish.totalSubmissions}</Text>
                                  <Badge size="xs" variant="light" color="blue">
                                    {parish.recentSubmissions} recent (24h)
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Stack gap={4}>
                                    {parish.helpRequests > 0 && (
                                      <Badge size="sm" color="red" variant="light">
                                        {parish.helpRequests} help req
                                      </Badge>
                                    )}
                                    {parish.electricityOutages > 0 && (
                                      <Badge size="sm" color="orange" variant="light">
                                        {parish.electricityOutages} power out
                                      </Badge>
                                    )}
                                    {Object.values(parish.activeHazards).reduce((a, b) => a + b, 0) > 0 && (
                                      <Badge size="sm" color="yellow" variant="light">
                                        {Object.values(parish.activeHazards).reduce((a, b) => a + b, 0)} hazards
                                      </Badge>
                                    )}
                                  </Stack>
                                </Table.Td>
                                <Table.Td>
                                  {parish.actionsNeeded.length > 0 ? (
                                    <Stack gap={4}>
                                      {parish.actionsNeeded.slice(0, 2).map((action, idx) => (
                                        <Badge
                                          key={idx}
                                          size="sm"
                                          color={getActionPriorityColor(parish.actionsNeeded)}
                                          variant="filled"
                                        >
                                          {action}
                                        </Badge>
                                      ))}
                                      {parish.actionsNeeded.length > 2 && (
                                        <Text size="xs" c="dimmed">
                                          +{parish.actionsNeeded.length - 2} more
                                        </Text>
                                      )}
                                    </Stack>
                                  ) : (
                                    <Badge size="sm" color="green" variant="light">
                                      All clear
                                    </Badge>
                                  )}
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </ScrollArea>
                    )}
                  </Stack>
                </Card>
              </Box>

              {/* Right Column - Incident Feed */}
              <Box style={{ flex: '0 0 50%' }}>
                <Card shadow="sm" padding="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Title order={3}>Incident Feed</Title>
                      {selectedParishId && (
                        <Badge size="lg" variant="light" color="blue">
                          Filtered by {statsData?.parishes?.find((p: ParishReliefStats) => p.parishId === selectedParishId)?.parishName}
                        </Badge>
                      )}
                    </Group>

                    {/* Filters */}
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
                    />

                    {/* Help Requests List */}
                    {helpRequestsLoading ? (
                      <Center py="xl">
                        <Loader size="lg" />
                      </Center>
                    ) : helpRequestsError ? (
                      <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
                        Failed to load help requests. Please try again.
                      </Alert>
                    ) : !filteredHelpRequests || filteredHelpRequests.length === 0 ? (
                      <Center py="xl">
                        <Stack align="center" gap="md">
                          <IconAlertTriangle size={48} color="gray" />
                          <Text size="lg" fw={500} c="dimmed">
                            {selectedParishId ? 'No active help requests for selected parish' : 'No active help requests'}
                          </Text>
                          <Text size="sm" c="dimmed">Check back later or adjust filters</Text>
                        </Stack>
                      </Center>
                    ) : (
                      <ScrollArea h={600}>
                        <Stack gap="md">
                          {filteredHelpRequests.map((request: HelpRequest) => (
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
                      </ScrollArea>
                    )}
                  </Stack>
                </Card>
              </Box>
            </Flex>
          </Stack>
        </Container>
    </>
  );
}

