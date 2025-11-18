'use client';

import { useState } from 'react';
import { Container, Stack, Title, Text, Alert, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconUsers, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import PortalLayout from '@/components/portals/PortalLayout';
import PeopleNeedsForm from '@/components/portals/PeopleNeedsForm';

export default function PeoplePortal() {
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
    <PortalLayout title="People Portal" icon={<IconUsers size={isMobile ? 24 : 28} />}>
      <Container size="lg" py={isMobile ? "md" : "xl"}>
        <Stack gap="lg">
          {/* Header */}
          <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
            <Stack gap="sm">
              <Title order={2} size={isMobile ? "h3" : "h2"}>
                People Needs Reporting Form
              </Title>
              <Text size={isMobile ? "sm" : "md"} c="dimmed">
                Report the needs of people in affected areas. This helps coordinate relief efforts and prioritize assistance.
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
              People needs have been recorded successfully. They will appear on the dashboard map shortly.
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
          <PeopleNeedsForm onSuccess={handleSuccess} onError={handleError} />

          {/* Info Box */}
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Tips for filling out this form:
              </Text>
              <Text size="xs" c="dimmed">
                • Use GPS coordinates for accurate location tracking
                <br />
                • Select all needs that apply to ensure comprehensive assistance
                <br />
                • Use urgency levels to help prioritize relief efforts
                <br />
                • Provide contact information for follow-up if possible
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </PortalLayout>
  );
}



