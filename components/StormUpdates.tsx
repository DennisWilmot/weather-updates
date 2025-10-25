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
  Box
} from '@mantine/core';
import { 
  IconAlertTriangle
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


      {/* Last Updated Info */}
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Text size="sm" c="dimmed">Last updated: {formatLastUpdated(data.lastUpdated)}</Text>
      </Card>
    </Stack>
  );
}
