'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Button,
  Badge,
  Box,
  Alert,
  Loader,
  Center,
  SimpleGrid,
  Progress,
  ThemeIcon,
  Divider,
  Modal,
  Tabs
} from '@mantine/core';
import {
  IconMapPin,
  IconAlertTriangle,
  IconRefresh,
  IconCheck,
  IconX,
  IconBolt,
  IconWifi,
  IconDroplet,
  IconTree,
  IconHome
} from '@tabler/icons-react';

interface ParishStats {
  parishId: string;
  parishName: string;
  totalSubmissions: number;
  recentSubmissions: number; // Last 24 hours
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
  communitiesAffected: number;
  lastUpdate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CommunityStats {
  communityId: string;
  communityName: string;
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
  lastUpdate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function ParishDashboard() {
  const [selectedParishId, setSelectedParishId] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  // Fetch all parish statistics
  const { data: parishesData, isLoading, error, refetch } = useQuery({
    queryKey: ['parish-stats'],
    queryFn: async () => {
      const response = await fetch('/api/parishes/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch parish statistics');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch community stats for selected parish
  const { data: communitiesData, isLoading: communitiesLoading } = useQuery({
    queryKey: ['community-stats', selectedParishId],
    queryFn: async () => {
      if (!selectedParishId) return null;
      const response = await fetch(`/api/parishes/${selectedParishId}/community-stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch community statistics');
      }
      return response.json();
    },
    enabled: !!selectedParishId,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴 Critical';
      case 'high': return '🟠 High';
      case 'medium': return '🟡 Medium';
      case 'low': return '🟢 Low';
      default: return 'Unknown';
    }
  };

  const handleParishClick = (parishId: string) => {
    setSelectedParishId(parishId);
    setModalOpened(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const updateTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2} c="#1478FF">Jamaica Parish Dashboard</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Real-time overview of all 14 parishes
            </Text>
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
      </Card>

      {/* Parish Grid */}
      {isLoading ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="md" />
            <Text c="dimmed">Loading parish data...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
          {error instanceof Error ? error.message : 'Failed to fetch parish statistics'}
          <Button mt="sm" onClick={() => refetch()} leftSection={<IconRefresh />}>
            Retry
          </Button>
        </Alert>
      ) : !parishesData?.parishes || parishesData.parishes.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Text c="dimmed">No parish data available</Text>
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {parishesData.parishes.map((parish: ParishStats) => (
            <Card
              key={parish.parishId}
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
              onClick={() => handleParishClick(parish.parishId)}
            >
              <Stack gap="sm">
                {/* Parish Name & Severity */}
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Group gap="xs">
                      <ThemeIcon size="sm" color="blue" variant="light">
                        <IconMapPin size={14} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">{parish.parishName}</Text>
                    </Group>
                  </Box>
                  <Badge color={getSeverityColor(parish.severity)} variant="filled" size="xs">
                    {getSeverityLabel(parish.severity)}
                  </Badge>
                </Group>

                {/* Statistics */}
                <Box>
                  <Group gap="xs" mb="xs">
                    <Text size="lg" fw={700} c="blue">{parish.totalSubmissions}</Text>
                    <Text size="xs" c="dimmed">total updates</Text>
                  </Group>
                  {parish.recentSubmissions > 0 && (
                    <Text size="xs" c="green" fw={500}>
                      +{parish.recentSubmissions} in last 24h
                    </Text>
                  )}
                </Box>

                <Divider />

                {/* Service Outages */}
                <Box>
                  <Text size="xs" fw={600} c="dimmed" mb="xs">Service Issues</Text>
                  <Stack gap={4}>
                    {parish.electricityOutages > 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="xs" color="yellow" variant="light">
                          <IconBolt size={10} />
                        </ThemeIcon>
                        <Text size="xs">{parish.electricityOutages} JPS outages</Text>
                      </Group>
                    )}
                    {parish.flowOutages > 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="xs" color="blue" variant="light">
                          <IconWifi size={10} />
                        </ThemeIcon>
                        <Text size="xs">{parish.flowOutages} Flow outages</Text>
                      </Group>
                    )}
                    {parish.digicelOutages > 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="xs" color="red" variant="light">
                          <IconWifi size={10} />
                        </ThemeIcon>
                        <Text size="xs">{parish.digicelOutages} Digicel outages</Text>
                      </Group>
                    )}
                    {parish.electricityOutages === 0 && parish.flowOutages === 0 && parish.digicelOutages === 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="xs" color="green" variant="light">
                          <IconCheck size={10} />
                        </ThemeIcon>
                        <Text size="xs" c="green">No service issues</Text>
                      </Group>
                    )}
                  </Stack>
                </Box>

                {/* Active Hazards */}
                {(parish.activeHazards.flooding > 0 ||
                  parish.activeHazards.downedPowerLines > 0 ||
                  parish.activeHazards.fallenTrees > 0 ||
                  parish.activeHazards.structuralDamage > 0) && (
                  <>
                    <Divider />
                    <Box>
                      <Text size="xs" fw={600} c="red" mb="xs">⚠️ Active Hazards</Text>
                      <Stack gap={4}>
                        {parish.activeHazards.flooding > 0 && (
                          <Group gap="xs">
                            <ThemeIcon size="xs" color="blue" variant="light">
                              <IconDroplet size={10} />
                            </ThemeIcon>
                            <Text size="xs">{parish.activeHazards.flooding} flooding reports</Text>
                          </Group>
                        )}
                        {parish.activeHazards.downedPowerLines > 0 && (
                          <Group gap="xs">
                            <ThemeIcon size="xs" color="yellow" variant="light">
                              <IconBolt size={10} />
                            </ThemeIcon>
                            <Text size="xs">{parish.activeHazards.downedPowerLines} power lines down</Text>
                          </Group>
                        )}
                        {parish.activeHazards.fallenTrees > 0 && (
                          <Group gap="xs">
                            <ThemeIcon size="xs" color="green" variant="light">
                              <IconTree size={10} />
                            </ThemeIcon>
                            <Text size="xs">{parish.activeHazards.fallenTrees} fallen trees</Text>
                          </Group>
                        )}
                        {parish.activeHazards.structuralDamage > 0 && (
                          <Group gap="xs">
                            <ThemeIcon size="xs" color="red" variant="light">
                              <IconHome size={10} />
                            </ThemeIcon>
                            <Text size="xs">{parish.activeHazards.structuralDamage} structural damage</Text>
                          </Group>
                        )}
                      </Stack>
                    </Box>
                  </>
                )}

                {/* Emergency Help */}
                {parish.needsHelp > 0 && (
                  <>
                    <Divider />
                    <Badge color="red" variant="filled" size="sm" fullWidth>
                      🆘 {parish.needsHelp} requests for help
                    </Badge>
                  </>
                )}

                {/* Communities Affected */}
                <Box>
                  <Text size="xs" c="dimmed">
                    {parish.communitiesAffected} {parish.communitiesAffected === 1 ? 'community' : 'communities'} reporting
                  </Text>
                  <Text size="xs" c="dimmed">
                    Last update: {formatTimeAgo(parish.lastUpdate)}
                  </Text>
                </Box>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Parish Drill-Down Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="xl"
        title={
          <Group gap="xs">
            <ThemeIcon size="md" color="blue" variant="light">
              <IconMapPin size={18} />
            </ThemeIcon>
            <Box>
              <Text fw={600} size="lg">
                {parishesData?.parishes.find((p: ParishStats) => p.parishId === selectedParishId)?.parishName}
              </Text>
              <Text size="xs" c="dimmed">Community Breakdown</Text>
            </Box>
          </Group>
        }
      >
        {communitiesLoading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="md" />
              <Text c="dimmed">Loading community data...</Text>
            </Stack>
          </Center>
        ) : !communitiesData?.communities || communitiesData.communities.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No community data available</Text>
          </Center>
        ) : (
          <Stack gap="md">
            {communitiesData.communities.map((community: CommunityStats) => (
              <Card key={community.communityId} shadow="xs" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  {/* Community Header */}
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Text fw={600} size="sm">{community.communityName}</Text>
                      <Text size="xs" c="dimmed">{community.totalSubmissions} total updates</Text>
                    </Box>
                    <Badge color={getSeverityColor(community.severity)} variant="light" size="xs">
                      {getSeverityLabel(community.severity)}
                    </Badge>
                  </Group>

                  {/* Service Status */}
                  <Group gap="md" wrap="wrap">
                    <Group gap="xs">
                      <ThemeIcon size="xs" color={community.electricityOutages > 0 ? 'red' : 'green'} variant="light">
                        {community.electricityOutages > 0 ? <IconX size={10} /> : <IconCheck size={10} />}
                      </ThemeIcon>
                      <Text size="xs">
                        JPS: {community.electricityOutages > 0 ? `${community.electricityOutages} outages` : 'OK'}
                      </Text>
                    </Group>
                    {community.flowOutages > 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="xs" color="red" variant="light">
                          <IconX size={10} />
                        </ThemeIcon>
                        <Text size="xs">Flow: {community.flowOutages} outages</Text>
                      </Group>
                    )}
                    {community.digicelOutages > 0 && (
                      <Group gap="xs">
                        <ThemeIcon size="xs" color="red" variant="light">
                          <IconX size={10} />
                        </ThemeIcon>
                        <Text size="xs">Digicel: {community.digicelOutages} outages</Text>
                      </Group>
                    )}
                  </Group>

                  {/* Hazards Summary */}
                  {(community.activeHazards.flooding > 0 ||
                    community.activeHazards.downedPowerLines > 0 ||
                    community.activeHazards.fallenTrees > 0 ||
                    community.activeHazards.structuralDamage > 0) && (
                    <Group gap="xs" wrap="wrap">
                      {community.activeHazards.flooding > 0 && (
                        <Badge color="blue" variant="light" size="xs">
                          💧 {community.activeHazards.flooding} flooding
                        </Badge>
                      )}
                      {community.activeHazards.downedPowerLines > 0 && (
                        <Badge color="yellow" variant="light" size="xs">
                          ⚡ {community.activeHazards.downedPowerLines} power lines
                        </Badge>
                      )}
                      {community.activeHazards.fallenTrees > 0 && (
                        <Badge color="green" variant="light" size="xs">
                          🌳 {community.activeHazards.fallenTrees} trees
                        </Badge>
                      )}
                      {community.activeHazards.structuralDamage > 0 && (
                        <Badge color="red" variant="light" size="xs">
                          🏚️ {community.activeHazards.structuralDamage} damage
                        </Badge>
                      )}
                    </Group>
                  )}

                  {/* Emergency Help */}
                  {community.needsHelp > 0 && (
                    <Badge color="red" variant="filled" size="sm">
                      🆘 {community.needsHelp} requests for help
                    </Badge>
                  )}

                  <Text size="xs" c="dimmed">
                    Last update: {formatTimeAgo(community.lastUpdate)}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
