'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Container, Flex, Group, Anchor, Burger, Drawer, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronLeft } from '@tabler/icons-react';

export default function AdminNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpened, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);

  const tabs = [
    { name: "Users", href: "/admin/users" },
    { name: "Roles", href: "/admin/roles" },
    { name: "Audit Logs", href: "/admin/audits" },
  ];

  return (
    <>
      <Box bg="white" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
        <Container size="xl">
          <Flex justify="space-between" align="center" h={64} gap="md">
            <Anchor
              component={Link}
              href="/"
              hiddenFrom="md"
              style={{ display: 'none' }}
            >
              <Group gap="xs">
                <IconChevronLeft size={16} />
                <Text size="sm" fw={500} c="gray.6">Back to Dashboard</Text>
              </Group>
            </Anchor>
            <Anchor
              component={Link}
              href="/"
              visibleFrom="md"
            >
              <Group gap="xs">
                <IconChevronLeft size={16} />
                <Text size="sm" fw={500} c="gray.6">Back to Dashboard</Text>
              </Group>
            </Anchor>
            
            {/* Desktop navigation */}
            <Group gap="lg" ml="auto" visibleFrom="md">
              {tabs.map(tab => {
                const active = pathname === tab.href || (pathname === "/admin" && tab.href === "/admin/users");

                return (
                  <Anchor
                    key={tab.href}
                    component={Link}
                    href={tab.href}
                    style={{
                      paddingBottom: '4px',
                      borderBottom: active ? '2px solid #1478FF' : '2px solid transparent',
                      color: active ? '#1a1a3c' : '#6b7280',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    {tab.name}
                  </Anchor>
                );
              })}
            </Group>

            {/* Mobile menu button */}
            <Burger
              opened={mobileMenuOpened}
              onClick={toggleMobileMenu}
              hiddenFrom="md"
              size="sm"
            />
          </Flex>
        </Container>
      </Box>

      {/* Mobile menu */}
      <Drawer
        opened={mobileMenuOpened}
        onClose={closeMobileMenu}
        title="Navigation"
        position="left"
        size="sm"
        hiddenFrom="md"
      >
        <Stack gap="xs">
          <Anchor
            component={Link}
            href="/"
            onClick={closeMobileMenu}
          >
            <Group gap="xs">
              <IconChevronLeft size={16} />
              <Text size="sm" fw={500} c="gray.6">Back to Dashboard</Text>
            </Group>
          </Anchor>
          {tabs.map(tab => {
            const active = pathname === tab.href || (pathname === "/admin" && tab.href === "/admin/users");

            return (
              <Anchor
                key={tab.href}
                component={Link}
                href={tab.href}
                onClick={closeMobileMenu}
                style={{
                  padding: '8px 12px',
                  paddingLeft: '12px',
                  borderLeft: active ? '4px solid #1478FF' : '4px solid transparent',
                  backgroundColor: active ? '#eff6ff' : 'transparent',
                  color: active ? '#1e40af' : '#4b5563',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '16px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.color = '#1f2937';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#4b5563';
                  }
                }}
              >
                {tab.name}
              </Anchor>
            );
          })}
        </Stack>
      </Drawer>
    </>
  );
}