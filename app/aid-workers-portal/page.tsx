'use client';

import { useState } from 'react';
import { Container, Stack, Title, Text, Alert, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconUserCheck, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import PortalLayout from '@/components/portals/PortalLayout';
import AidWorkerScheduleForm from '@/components/portals/AidWorkerScheduleForm';

export default function AidWorkersPortal() {
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
    <PortalLayout title="Aid Workers Portal" icon={<IconUserCheck size={isMobile ? 24 : 28} />}>
      <Container size="lg" py={isMobile ? "md" : "xl"}>
        <Stack gap="lg">
          {/* Header */}
          <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
            <Stack gap="sm">
              <Title order={2} size={isMobile ? "h3" : "h2"}>
                Aid Worker Schedule & Deployment Form
              </Title>
              <Text size={isMobile ? "sm" : "md"} c="dimmed">
                Register aid worker schedules, capabilities, and deployment information. This helps coordinate relief efforts and match workers with needs.
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
              Aid worker schedule has been recorded successfully. It will appear on the dashboard map shortly.
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
          <AidWorkerScheduleForm onSuccess={handleSuccess} onError={handleError} />

          {/* Info Box */}
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Tips for filling out this form:
              </Text>
              <Text size="xs" c="dimmed">
                • Select all capabilities the worker can provide
                <br />
                • Use "rapid deployment" for immediate availability
                <br />
                • Use "planned mission" for scheduled deployments (24-72 hours)
                <br />
                • Update location regularly for real-time tracking
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </PortalLayout>
  );
}



