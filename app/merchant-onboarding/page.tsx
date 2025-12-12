'use client';

import dynamic from 'next/dynamic';
import { Container, Stack, Title, Text, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

// Dynamic import to avoid SSR issues
const MerchantOnboardingForm = dynamic(
    () => import('@/components/portals/MerchantOnboardingForm'),
    {
        ssr: false,
        loading: () => (
            <Paper p="xl" withBorder radius="md">
                <Stack align="center" gap="md">
                    <Text size="lg" c="dimmed">Loading form...</Text>
                </Stack>
            </Paper>
        ),
    }
);

export default function MerchantOnboardingPage() {
    const isMobile = useMediaQuery('(max-width: 768px)') ?? false;

    return (
        <Container size="lg" py={isMobile ? "md" : "xl"}>
            <Stack gap="lg">
                {/* Header */}
                <Paper p={isMobile ? "md" : "lg"} withBorder radius="md" style={{ backgroundColor: 'white' }}>
                    <Stack gap="sm">
                        <Title order={1} size={isMobile ? "h2" : "h1"}>
                            MSME Merchant Onboarding
                        </Title>
                        <Text size={isMobile ? "sm" : "md"} c="dimmed">
                            Join the Digital Jamaica ATLAS AI program. Register your business to connect with suppliers and access bulk import opportunities.
                        </Text>
                    </Stack>
                </Paper>

                {/* Form */}
                <MerchantOnboardingForm
                    onSuccess={() => {
                        // Success is handled by toast notifications in the form
                        console.log('Merchant onboarding form submitted successfully');
                    }}
                    onError={(error) => {
                        console.error('Error submitting merchant onboarding form:', error);
                    }}
                />
            </Stack>
        </Container>
    );
}

