'use client';

import { useState } from 'react';
import { Container, Stack, Title, Text, Button, Alert, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMapPin, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import PortalLayout from '@/components/portals/PortalLayout';
import PlaceStatusForm from '@/components/portals/PlaceStatusForm';

export default function PlacesPortal() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    setSubmitted(true);
    setError(null);
    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  const handleError = (err: string) => {
    setError(err);
    setSubmitted(false);
  };

  return (
    <PortalLayout title="Places Portal" icon={<IconMapPin size={isMobile ? 24 : 28} />}>
      <Container size="lg" py={isMobile ? "md" : "xl"}>
        <Stack gap="lg">
          {/* Header */}
          <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
            <Stack gap="sm">
              <Title order={2} size={isMobile ? "h3" : "h2"}>
                Place Operational Status Form
              </Title>
              <Text size={isMobile ? "sm" : "md"} c="dimmed">
                Report the operational status of places including electricity, water, WiFi, and shelter capacity. This information helps coordinate relief efforts.
              </Text>
            </Stack>
          </Paper>

          {/* Success Message */}
          {submitted && (
            <Alert
              icon={<IconCheck size={20} />}
              title="Success!"
              color="green"
              onClose={() => setSubmitted(false)}
              withCloseButton
            >
              Place status has been recorded successfully. It will appear on the dashboard map shortly.
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={20} />}
              title="Error"
              color="red"
              onClose={() => setError(null)}
              withCloseButton
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <PlaceStatusForm onSuccess={handleSuccess} onError={handleError} />

          {/* Info Box */}
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Tips for filling out this form:
              </Text>
              <Text size="xs" c="dimmed">
                • Report status for towns, shelters, bases, or other facilities
                <br />
                • Update capacity information for shelters regularly
                <br />
                • Use "partial" status when services are intermittent
                <br />
                • Add notes for any important details or observations
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </PortalLayout>
  );
}



