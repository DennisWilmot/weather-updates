'use client';

import {
  Stack,
  Title,
  Text,
  Badge,
  Alert,
  Card,
  Divider,
  Group,
  ThemeIcon,
  Box,
  Grid,
  Container
} from '@mantine/core';
import { 
  IconAlertTriangle,
  IconVideo
} from '@tabler/icons-react';
import HurricaneMap from './HurricaneMap';

interface StormData {
  status: 'active' | 'not_found' | 'error';
  storm?: {
    name: string;
    type: string;
    windSpeed: string;
    position: {
      lat: number;
      lon: number;
      distance: number;
      distanceUnit: string;
    };
    movement?: {
      direction: string;
      speed: string;
    };
    lastAdvisory: string | null;
    isCloseApproach: boolean;
  };
  lastUpdated: string;
  message?: string;
  error?: string;
}

interface StormUpdatesProps {
  data: StormData | null;
  loading: boolean;
  error: string | null;
}

export default function StormUpdates({ data, loading, error }: StormUpdatesProps) {
  const formatLastUpdated = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Jamaica',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Stack gap="md" align="center">
        <Text>Loading storm data...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert color="red" title="No Data">
        Unable to load storm data.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Disclaimer */}
      <Alert color="yellow" title="Important Disclaimer" c="yellow.0">
        <Text size="sm">
          This is <strong>not an official forecast</strong>. Always follow guidance from ODPEM and the National Hurricane Center (NHC) for official weather information and emergency instructions.
        </Text>
      </Alert>

      {data.status === 'not_found' && (
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#11DDB0' }}>
          <Stack gap="md" align="center">
            <ThemeIcon size="xl" color="teal" variant="light">
              <IconAlertTriangle />
            </ThemeIcon>
            <Title order={3} c="teal.0">No Active Storm</Title>
            <Text ta="center" c="dimmed">
              Tropical Storm Melissa is not currently active or has been downgraded.
            </Text>
          </Stack>
        </Card>
      )}

      {data.status === 'error' && (
        <Alert color="red" title="Data Error">
          {data.message || 'Unable to fetch current storm data.'}
        </Alert>
      )}

      {/* Hurricane Tracking Map */}
      <HurricaneMap
        stormPosition={data.status === 'active' && data.storm ? {
          lat: data.storm.position.lat,
          lon: data.storm.position.lon,
          name: data.storm.name,
          windSpeed: data.storm.windSpeed,
          movement: data.storm.movement
        } : undefined}
      />

      {/* Live Camera Feeds */}
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Stack gap="md">
          <Group gap="xs">
            <IconVideo size={24} color="#1478FF" />
            <Title order={3} c="blue.6">Live Camera Feeds</Title>
          </Group>
          
          <Text size="sm" c="dimmed">
            Real-time video feeds from key locations across Jamaica to monitor current conditions.
          </Text>

          <Stack gap="md">
            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Flat Bridge</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/k4Lt_iev8x4?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Flat Bridge Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Half Way Tree</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/RHkdQI2PSKA?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Half Way Tree Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Cross Road</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/jJ6C03WtBJE?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Cross Road Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Downtown Parade</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/u70ySp4OuHY?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Downtown Parade Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Devon House</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/pmzJ4AAh0Ds?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Devon House Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Kingston Harbor</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/jVr7_V4Tohw?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Kingston Harbor Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Westmoreland Little London</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/SPwW9xN3e1M?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Westmoreland Little London Live Camera"
                  />
                </Box>
              </Stack>
            </Card>

            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Barbican</Text>
                <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/I0w-636mEDY?autoplay=1&mute=1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Barbican Live Camera"
                  />
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Stack>
      </Card>

      {/* Last Updated Info */}
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Text size="sm" c="dimmed">Last updated: {formatLastUpdated(data.lastUpdated)}</Text>
      </Card>
    </Stack>
  );
}
