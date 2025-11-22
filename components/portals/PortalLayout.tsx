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
import DashboardNavigation from '../DashboardNavigation';

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
      <DashboardNavigation />

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

