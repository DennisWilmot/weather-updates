"use client";

import { Paper, Stack, Text, Group } from "@mantine/core";
import { IconRoute, IconClock } from "@tabler/icons-react";

interface RouteTooltipProps {
  distance: number; // meters from start
  duration: number; // seconds from start
  segmentDistance?: number; // meters for current segment
  roadName?: string; // Road name if available
}

export default function RouteTooltip({
  distance,
  duration,
  segmentDistance,
  roadName,
}: RouteTooltipProps) {
  const distanceKm = (distance / 1000).toFixed(2);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const durationFormatted =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Paper
      p="xs"
      radius="sm"
      shadow="md"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: "1px solid #e0e0e0",
        maxWidth: "200px",
      }}
    >
      <Stack gap={4}>
        {roadName && (
          <Text size="xs" fw={600} c="dimmed" truncate>
            {roadName}
          </Text>
        )}
        <Group gap="xs" justify="space-between">
          <Group gap={4}>
            <IconRoute size={12} color="#2563EB" />
            <Text size="xs">Distance:</Text>
          </Group>
          <Text size="xs" fw={600}>
            {distanceKm} km
          </Text>
        </Group>
        <Group gap="xs" justify="space-between">
          <Group gap={4}>
            <IconClock size={12} color="#2563EB" />
            <Text size="xs">Time:</Text>
          </Group>
          <Text size="xs" fw={600}>
            {durationFormatted}
          </Text>
        </Group>
        {segmentDistance && (
          <Text size="xs" c="dimmed" style={{ borderTop: "1px solid #e0e0e0", paddingTop: 4 }}>
            Segment: {(segmentDistance / 1000).toFixed(2)} km
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

