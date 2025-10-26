'use client';

import { Modal, Text, Group, Stack, Button, Badge } from '@mantine/core';
import { IconCheck, IconX, IconRoad } from '@tabler/icons-react';

interface ParishSummaryModalProps {
  opened: boolean;
  onClose: () => void;
  onViewUpdates: () => void;
  parish: string;
  stats: {
    total: number;
    withElectricity: number;
    withoutElectricity: number;
    withWifi: number;
    withoutWifi: number;
    needsHelp: number;
    roadStatus: {
      clear: number;
      flooded: number;
      blocked: number;
      mudslide: number;
    };
  } | null;
}

export default function ParishSummaryModal({
  opened,
  onClose,
  onViewUpdates,
  parish,
  stats
}: ParishSummaryModalProps) {
  if (!stats) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${parish} - Incident Summary (Last 24h)`}
      centered
      size="md"
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600}>Total Submissions</Text>
          <Badge size="lg" variant="filled" color="blue">{stats.total}</Badge>
        </Group>

        <Group justify="space-between">
          <Text fw={500} size="sm">Electricity</Text>
          <Group gap="xs">
            <Group gap={4}>
              <IconCheck size={16} color="green" />
              <Text size="sm">{stats.withElectricity}</Text>
            </Group>
            <Group gap={4}>
              <IconX size={16} color="red" />
              <Text size="sm">{stats.withoutElectricity}</Text>
            </Group>
          </Group>
        </Group>

        <Group justify="space-between">
          <Text fw={500} size="sm">WiFi/Service</Text>
          <Group gap="xs">
            <Group gap={4}>
              <IconCheck size={16} color="green" />
              <Text size="sm">{stats.withWifi}</Text>
            </Group>
            <Group gap={4}>
              <IconX size={16} color="red" />
              <Text size="sm">{stats.withoutWifi}</Text>
            </Group>
          </Group>
        </Group>

        <Group justify="space-between">
          <Text fw={500} size="sm">Help Requests</Text>
          <Badge color="red" variant="filled">
            {stats.needsHelp}
          </Badge>
        </Group>

        <Stack gap="xs" mt="md">
          <Text fw={500} size="sm">Road Status</Text>
          <Group gap="sm">
            <Group gap={4}>
              <IconRoad size={16} />
              <Text size="xs">Clear: {stats.roadStatus.clear}</Text>
            </Group>
            <Badge color="blue" size="sm">Flooded: {stats.roadStatus.flooded}</Badge>
            <Badge color="orange" size="sm">Blocked: {stats.roadStatus.blocked}</Badge>
            <Badge color="red" size="sm">Mudslide: {stats.roadStatus.mudslide}</Badge>
          </Group>
        </Stack>

        <Group mt="xl" grow>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onViewUpdates}>
            View All Updates
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
