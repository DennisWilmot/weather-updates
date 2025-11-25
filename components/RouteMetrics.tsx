"use client";

import { Paper, Stack, Group, Text, Badge } from "@mantine/core";
import { IconRoute, IconClock, IconMapPin } from "@tabler/icons-react";

interface RouteMetricsProps {
  distance: number; // meters
  duration: number; // seconds
  routePoints?: number; // number of coordinates in route
  showFullDetails?: boolean;
}

export default function RouteMetrics({
  distance,
  duration,
  routePoints,
  showFullDetails = false,
}: RouteMetricsProps) {
  // Format distance
  const distanceKm = (distance / 1000).toFixed(2);
  const distanceMiles = (distance / 1609.34).toFixed(2);

  // Format duration
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  const durationFormatted =
    hours > 0
      ? `${hours}h ${minutes}m`
      : minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  return (
    <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
      <Stack gap="sm">
        <Text size="sm" fw={600} c="dimmed">
          Route Metrics
        </Text>
        
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <IconRoute size={18} color="#2563EB" />
            <Text size="sm">Distance:</Text>
          </Group>
          <Stack gap={2} align="flex-end">
            <Text fw={600} size="sm">
              {distanceKm} km
            </Text>
            {showFullDetails && (
              <Text size="xs" c="dimmed">
                {distanceMiles} miles
              </Text>
            )}
          </Stack>
        </Group>

        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <IconClock size={18} color="#2563EB" />
            <Text size="sm">Duration:</Text>
          </Group>
          <Text fw={600} size="sm">
            {durationFormatted}
          </Text>
        </Group>

        {routePoints && showFullDetails && (
          <Group justify="space-between" align="flex-start">
            <Group gap="xs">
              <IconMapPin size={18} color="#2563EB" />
              <Text size="sm">Route Points:</Text>
            </Group>
            <Badge color="blue" variant="light">
              {routePoints}
            </Badge>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

