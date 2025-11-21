'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Container, Stack, Title, Text, Alert, Paper, Tabs, Group, Box, Center, Loader } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPackage, IconMapPin, IconUsers, IconUserCheck, IconCheck, IconAlertCircle, IconStatusChange } from '@tabler/icons-react';
import PortalLayout from '@/components/portals/PortalLayout';

// Dynamic imports to avoid webpack issues - disable SSR to prevent runtime errors
const AssetsDistributionForm = dynamic(() => import('@/components/portals/AssetsDistributionForm'), {
  ssr: false,
  loading: () => (
    <Center py="xl">
      <Loader />
    </Center>
  ),
});

const PlaceStatusForm = dynamic(() => import('@/components/portals/PlaceStatusForm'), {
  ssr: false,
  loading: () => (
    <Center py="xl">
      <Loader />
    </Center>
  ),
});

const PeopleNeedsForm = dynamic(() => import('@/components/portals/PeopleNeedsForm'), {
  ssr: false,
  loading: () => (
    <Center py="xl">
      <Loader />
    </Center>
  ),
});

const AidWorkerScheduleForm = dynamic(() => import('@/components/portals/AidWorkerScheduleForm'), {
  ssr: false,
  loading: () => (
    <Center py="xl">
      <Loader />
    </Center>
  ),
});

const AvailableAssetsForm = dynamic(() => import('@/components/portals/AvailableAssetsForm'), {
  ssr: false,
  loading: () => (
    <Center py="xl">
      <Loader />
    </Center>
  ),
});

type FormType = 'assets' | 'give' | 'places' | 'people' | 'aid-workers';

export default function PortalPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState<FormType>('assets');
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

  const getFormTitle = () => {
    switch (activeTab) {
      case 'assets':
        return 'Asset Distribution Form';
      case 'give':
        return 'Asset Availability Form';
      case 'places':
        return 'Place Operational Status Form';
      case 'people':
        return 'People Needs Reporting Form';
      case 'aid-workers':
        return 'Aid Worker Schedule & Deployment Form';
    }
  };

  const getFormDescription = () => {
    switch (activeTab) {
      case 'give':
        return 'Record asset availability to individuals or locations. This information will be displayed on the dashboard map.';
      case 'assets':
        return 'Record asset distributions to individuals or locations. This information will be displayed on the dashboard map.';
      case 'places':
        return 'Report the operational status of places including electricity, water, WiFi, and shelter capacity. This information helps coordinate relief efforts.';
      case 'people':
        return 'Report the needs of people in affected areas. This helps coordinate relief efforts and prioritize assistance.';
      case 'aid-workers':
        return 'Register aid worker schedules, capabilities, and deployment information. This helps coordinate relief efforts and match workers with needs.';
    }
  };

  const getFormIcon = () => {
    const iconSize = isMobile ? 24 : 28;
    switch (activeTab) {
      case 'assets':
        return <IconPackage size={iconSize} />;
      case 'places':
        return <IconMapPin size={iconSize} />;
      case 'people':
        return <IconUsers size={iconSize} />;
      case 'aid-workers':
        return <IconUserCheck size={iconSize} />;
      default:
        return <IconPackage size={iconSize} />;
    }
  };

  return (
    <PortalLayout title="Portal" icon={getFormIcon()}>
      <Container size="lg" py={isMobile ? "md" : "xl"}>
        <Stack gap="lg">
          {/* Header */}
          <Paper p={isMobile ? "md" : "lg"} withBorder radius="md">
            <Stack gap="sm">
              <Title order={2} size={isMobile ? "h3" : "h2"}>
                {getFormTitle()}
              </Title>
              <Text size={isMobile ? "sm" : "md"} c="dimmed">
                {getFormDescription()}
              </Text>
            </Stack>
          </Paper>

          {/* Form Type Selector */}
          <Paper p="md" withBorder radius="md">
            <Tabs value={activeTab} onChange={(value) => setActiveTab(value as FormType)}>
              <Tabs.List grow={!isMobile}>
                <Tabs.Tab
                  value="assets"
                  leftSection={<IconStatusChange size={isMobile ? 18 : 20} />}
                  style={{ minHeight: isMobile ? '44px' : undefined }}
                >
                  {isMobile ? 'Assets' : 'Assets Distribution'}
                </Tabs.Tab>
                <Tabs.Tab
                  value="give"
                  leftSection={<IconPackage size={isMobile ? 18 : 20} />}
                  style={{ minHeight: isMobile ? '44px' : undefined }}
                >
                  {isMobile ? 'Give' : 'Available Assets'}
                </Tabs.Tab>
                <Tabs.Tab
                  value="places"
                  leftSection={<IconMapPin size={isMobile ? 18 : 20} />}
                  style={{ minHeight: isMobile ? '44px' : undefined }}
                >
                  {isMobile ? 'Places' : 'Place Status'}
                </Tabs.Tab>
                <Tabs.Tab
                  value="people"
                  leftSection={<IconUsers size={isMobile ? 18 : 20} />}
                  style={{ minHeight: isMobile ? '44px' : undefined }}
                >
                  {isMobile ? 'People' : 'People Needs'}
                </Tabs.Tab>
                <Tabs.Tab
                  value="aid-workers"
                  leftSection={<IconUserCheck size={isMobile ? 18 : 20} />}
                  style={{ minHeight: isMobile ? '44px' : undefined }}
                >
                  {isMobile ? 'Workers' : 'Aid Workers'}
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
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
              {activeTab === 'give' && 'Asset availability has been recorded successfully. It will appear on the dashboard map shortly.'}
              {activeTab === 'assets' && 'Asset distribution has been recorded successfully. It will appear on the dashboard map shortly.'}
              {activeTab === 'places' && 'Place status has been recorded successfully. It will appear on the dashboard map shortly.'}
              {activeTab === 'people' && 'People needs have been recorded successfully. They will appear on the dashboard map shortly.'}
              {activeTab === 'aid-workers' && 'Aid worker schedule has been recorded successfully. It will appear on the dashboard map shortly.'}
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
          <Box>
            {activeTab === 'assets' && (
              <AssetsDistributionForm onSuccess={handleSuccess} onError={handleError} />
            )}
            {activeTab === 'places' && (
              <PlaceStatusForm onSuccess={handleSuccess} onError={handleError} />
            )}
            {activeTab === 'people' && (
              <PeopleNeedsForm onSuccess={handleSuccess} onError={handleError} />
            )}
            {activeTab === 'aid-workers' && (
              <AidWorkerScheduleForm onSuccess={handleSuccess} onError={handleError} />
            )}
            {activeTab === 'give' && (
              <AvailableAssetsForm onSuccess={handleSuccess} onError={handleError} />
            )}
          </Box>

          {/* Info Box */}
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Tips for filling out this form:
              </Text>
              <Text size="xs" c="dimmed">
                {activeTab === 'assets' && (
                  <>
                    • Use GPS coordinates for accurate location tracking
                    <br />
                    • Capture recipient signature for verification
                    <br />
                    • Select all items that were distributed in this session
                    <br />
                    • Ensure recipient information is accurate for tracking
                  </>
                )}
                {activeTab === 'places' && (
                  <>
                    • Report status for towns, shelters, bases, or other facilities
                    <br />
                    • Update capacity information for shelters regularly
                    <br />
                    • Use "partial" status when services are intermittent
                    <br />
                    • Add notes for any important details or observations
                  </>
                )}
                {activeTab === 'people' && (
                  <>
                    • Use GPS coordinates for accurate location tracking
                    <br />
                    • Select all needs that apply to ensure comprehensive assistance
                    <br />
                    • Use urgency levels to help prioritize relief efforts
                    <br />
                    • Provide contact information for follow-up if possible
                  </>
                )}
                {activeTab === 'aid-workers' && (
                  <>
                    • Select all capabilities the worker can provide
                    <br />
                    • Use "rapid deployment" for immediate availability
                    <br />
                    • Use "planned mission" for scheduled deployments (24-72 hours)
                    <br />
                    • Update location regularly for real-time tracking
                  </>
                )}
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </PortalLayout>
  );
}

