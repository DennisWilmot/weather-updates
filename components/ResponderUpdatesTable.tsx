'use client';

import { Table, Text, Badge, Box, Modal, Stack, Image, ScrollArea } from '@mantine/core';
import { useState } from 'react';

interface Submission {
  id: string;
  parish: string;
  placeName: string | null;
  streetName: string | null;
  community: string;
  roadStatus: 'clear' | 'flooded' | 'blocked' | 'mudslide' | 'damaged';
  flowService: boolean | null;
  digicelService: boolean | null;
  hasElectricity: boolean | null;
  waterService: boolean | null;
  additionalInfo: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface ResponderUpdatesTableProps {
  submissions: Submission[];
}

export default function ResponderUpdatesTable({ submissions }: ResponderUpdatesTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getServiceBadge = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) {
      return <Badge color="gray" size="sm">N/A</Badge>;
    }
    return value ? (
      <Badge color="green" size="sm">✓ Available</Badge>
    ) : (
      <Badge color="red" size="sm">✗ Unavailable</Badge>
    );
  };

  const getRoadStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      clear: 'green',
      flooded: 'blue',
      blocked: 'yellow',
      mudslide: 'orange',
      damaged: 'red'
    };
    return <Badge color={colors[status] || 'gray'} size="sm">{status}</Badge>;
  };

  const getWifiStatus = (flow: boolean | null, digicel: boolean | null) => {
    // Both available
    if (flow && digicel) return <Badge color="green" size="sm">✓ Both</Badge>;
    // Only one available
    if (flow) return <Badge color="green" size="sm">✓ Flow</Badge>;
    if (digicel) return <Badge color="green" size="sm">✓ Digicel</Badge>;
    // Both unavailable
    if (flow === false && digicel === false) return <Badge color="red" size="sm">✗ None</Badge>;
    // Mixed or N/A
    return <Badge color="gray" size="sm">N/A</Badge>;
  };

  const rows = submissions.map((submission) => (
    <Table.Tr
      key={submission.id}
      style={{ cursor: 'pointer' }}
      onClick={() => setSelectedSubmission(submission)}
    >
      <Table.Td>
        <Text size="sm">
          {submission.placeName && `${submission.placeName}, `}
          {submission.streetName && `${submission.streetName}, `}
          {submission.community}, {submission.parish}
        </Text>
      </Table.Td>
      <Table.Td>{getRoadStatusBadge(submission.roadStatus)}</Table.Td>
      <Table.Td>{getWifiStatus(submission.flowService, submission.digicelService)}</Table.Td>
      <Table.Td>{getServiceBadge(submission.hasElectricity)}</Table.Td>
      <Table.Td>{getServiceBadge(submission.waterService)}</Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">{formatTime(submission.createdAt)}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Location</Table.Th>
              <Table.Th>Road</Table.Th>
              <Table.Th>Wi-Fi</Table.Th>
              <Table.Th>Power</Table.Th>
              <Table.Th>Water</Table.Th>
              <Table.Th>Time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Detail Modal */}
      <Modal
        opened={selectedSubmission !== null}
        onClose={() => setSelectedSubmission(null)}
        title="Responder Update Details"
        size="lg"
      >
        {selectedSubmission && (
          <Stack gap="md">
            <Box>
              <Text size="sm" c="dimmed">Location</Text>
              <Text fw={500}>
                {selectedSubmission.placeName && `${selectedSubmission.placeName}, `}
                {selectedSubmission.streetName && `${selectedSubmission.streetName}, `}
                {selectedSubmission.community}, {selectedSubmission.parish}
              </Text>
            </Box>

            <Box>
              <Text size="sm" c="dimmed">Status</Text>
              <Stack gap="xs">
                <Box>
                  <Text size="sm">Road: {getRoadStatusBadge(selectedSubmission.roadStatus)}</Text>
                </Box>
                <Box>
                  <Text size="sm">
                    Wi-Fi: {getWifiStatus(selectedSubmission.flowService, selectedSubmission.digicelService)}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm">Power: {getServiceBadge(selectedSubmission.hasElectricity)}</Text>
                </Box>
                <Box>
                  <Text size="sm">Water: {getServiceBadge(selectedSubmission.waterService)}</Text>
                </Box>
              </Stack>
            </Box>

            {selectedSubmission.additionalInfo && (
              <Box>
                <Text size="sm" c="dimmed">Additional Notes</Text>
                <Text size="sm">{selectedSubmission.additionalInfo}</Text>
              </Box>
            )}

            {selectedSubmission.imageUrl && (
              <Box>
                <Text size="sm" c="dimmed" mb="xs">Photo</Text>
                <Image
                  src={selectedSubmission.imageUrl}
                  alt="Submission photo"
                  radius="md"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </Box>
            )}

            <Box>
              <Text size="sm" c="dimmed">Submitted</Text>
              <Text size="sm">{formatTime(selectedSubmission.createdAt)}</Text>
            </Box>
          </Stack>
        )}
      </Modal>
    </>
  );
}
