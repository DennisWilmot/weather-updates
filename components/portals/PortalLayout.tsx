/**
 * PortalLayout - Shared layout component for all portal pages
 * Provides consistent navigation and header across portals
 */

'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Group,
  Title,
  Button,
  Burger,
  Drawer,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconPackage, IconMapPin, IconUsers, IconUserCheck } from '@tabler/icons-react';
import Image from 'next/image';

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  icon: ReactNode;
}

const portals = [
  { id: 'portal', name: 'Portal', path: '/portal', icon: <IconPackage size={20} />, color: 'blue' },
];

export default function PortalLayout({ children, title, icon }: PortalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      {/* Header */}
      <Box
        style={{
          backgroundColor: '#0f0f23',
          borderBottom: '2px solid #1478FF',
          height: isMobile ? '12vh' : '14.28vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box style={{ width: '100%', paddingLeft: 'var(--mantine-spacing-md)', paddingRight: 'var(--mantine-spacing-md)' }}>
          <Flex align="center" justify="space-between" gap="lg" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Left side - Logo and Title */}
            <Group gap="md" visibleFrom="sm" style={{ flex: '0 0 auto' }}>
              <Image
                src="/White_Icon_Blue_Bkg-removebg-preview.png"
                alt="Intellibus"
                width={isMobile ? 32 : 40}
                height={isMobile ? 32 : 40}
                style={{ objectFit: 'contain' }}
              />
              <Group gap="xs">
                {icon}
                <Title order={1} c="white" fw={800} size={isMobile ? "lg" : "xl"}>
                  {title}
                </Title>
              </Group>
            </Group>

            {/* Mobile Logo and Title */}
            <Group gap="xs" hiddenFrom="sm" style={{ flex: '1 1 auto', justifyContent: 'center' }}>
              <Image
                src="/White_Icon_Blue_Bkg-removebg-preview.png"
                alt="Intellibus"
                width={32}
                height={32}
                style={{ objectFit: 'contain' }}
              />
              <Group gap="xs">
                {icon}
                <Title order={1} c="white" fw={800} size="lg">
                  {title}
                </Title>
              </Group>
            </Group>

            {/* Right side - Navigation */}
            <Group gap="xs" style={{ flex: '0 0 auto' }}>
              {/* Mobile Hamburger Menu */}
              <Burger
                opened={opened}
                onClick={open}
                color="white"
                size="sm"
                aria-label="Toggle navigation"
                hiddenFrom="sm"
              />

              {/* Desktop Navigation */}
              <Group gap="xs" visibleFrom="sm">
                <Button
                  variant="outline"
                  color="blue"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  leftSection="🗺️"
                >
                  Dashboard
                </Button>
                <Button
                  variant={pathname === '/portal' ? 'filled' : 'outline'}
                  color="blue"
                  size="sm"
                  onClick={() => router.push('/portal')}
                  leftSection={<IconPackage size={20} />}
                >
                  Portal
                </Button>
              </Group>
            </Group>
          </Flex>
        </Box>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Portals"
        position="left"
        size="sm"
        hiddenFrom="sm"
        styles={{
          content: {
            backgroundColor: '#0f0f23',
            color: 'white',
          },
          header: {
            backgroundColor: '#0f0f23',
            borderBottom: '1px solid #1478FF',
          },
          title: {
            color: 'white',
          },
        }}
      >
        <Stack gap="md" mt="md">
          <Button
            variant="subtle"
            color="blue"
            fullWidth
            onClick={() => {
              router.push('/dashboard');
              close();
            }}
            leftSection="🗺️"
            style={{ minHeight: '44px' }}
          >
            Dashboard
          </Button>
          <Button
            variant={pathname === '/portal' ? 'filled' : 'subtle'}
            color="blue"
            fullWidth
            onClick={() => {
              router.push('/portal');
              close();
            }}
            leftSection={<IconPackage size={20} />}
            style={{ minHeight: '44px' }}
          >
            Portal
          </Button>
        </Stack>
        <Box mt="auto" pt="xl" style={{ borderTop: '1px solid rgba(20, 120, 255, 0.2)' }}>
          <Stack gap={4} align="center" mb="md">
            <Text size="xs" c="dimmed">Powered by:</Text>
            <Image
              src="/white_logo.png"
              alt="Intellibus"
              width={240}
              height={180}
              style={{ objectFit: 'contain', marginTop: '-20px' }}
            />
          </Stack>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        style={{
          minHeight: isMobile ? 'calc(100vh - 12vh)' : 'calc(100vh - 14.28vh)',
          backgroundColor: '#f8f9fa',
          paddingBottom: isMobile ? '80px' : '20px',
        }}
      >
        {children}
      </Box>
    </>
  );
}

