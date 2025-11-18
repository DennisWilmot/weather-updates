'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Text, Button, Alert, Paper, Group, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPackage, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import PortalLayout from '@/components/portals/PortalLayout';
import AssetsDistributionForm from '@/components/portals/AssetsDistributionForm';

export default function AssetsPortal() {
  const router = useRouter();
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
    <PortalLayout title="Assets Portal" icon={<IconPackage size={isMobile ? 24 : 28} />}>
      <Container size="lg" py={isMobile ? "md" : "xl"}>
        <Stack gap="lg">
          {/* Header */}
          <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
            <Stack gap="sm">
              <Title order={2} size={isMobile ? "h3" : "h2"}>
                Asset Distribution Form
              </Title>
              <Text size={isMobile ? "sm" : "md"} c="dimmed">
                Record asset distributions to individuals or locations. This information will be displayed on the dashboard map.
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
              Asset distribution has been recorded successfully. It will appear on the dashboard map shortly.
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
          <AssetsDistributionForm onSuccess={handleSuccess} onError={handleError} />

          {/* Info Box */}
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Tips for filling out this form:
              </Text>
              <Text size="xs" c="dimmed">
                • Use GPS coordinates for accurate location tracking
                <br />
                • Capture recipient signature for verification
                <br />
                • Select all items that were distributed in this session
                <br />
                • Ensure recipient information is accurate for tracking
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </PortalLayout>
  );
}



