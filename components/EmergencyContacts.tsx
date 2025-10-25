'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Card,
  Group,
  ThemeIcon,
  Badge,
  Text,
  Box,
  Anchor,
  Collapse
} from '@mantine/core';
import { 
  IconBuildingHospital,
  IconExclamationMark,
  IconUsers,
  IconFlame,
  IconShield
} from '@tabler/icons-react';

interface EmergencyContactsProps {
  emergencyContacts: any;
}

export default function EmergencyContacts({ emergencyContacts }: EmergencyContactsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hospitals: false,
    emergencyNumbers: false,
    welfare: false,
    fireBrigade: false,
    police: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Stack gap="md">
      <Title order={2} ta="center" c="electricBlue.0" mb="md">
        Emergency Contacts Directory
      </Title>
      
      {/* Hospitals Section */}
      <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder 
        style={{ 
          borderColor: '#FF686D',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => toggleSection('hospitals')}
      >
        <Group gap="md" justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" color="red" variant="light">
              <IconBuildingHospital size={20} />
            </ThemeIcon>
            <Title order={3} c="red">HOSPITALS</Title>
            <Badge color="red" variant="light">{emergencyContacts.hospitals.contacts.length}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {expandedSections.hospitals ? '▼' : '▶'}
          </Text>
        </Group>
        <Collapse in={expandedSections.hospitals}>
          <Stack gap="sm" mt="md">
            {emergencyContacts.hospitals.contacts.map((hospital: any, index: number) => (
              <Box key={index} p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text fw={600} size="sm" mb="xs">{hospital.name}</Text>
                <Text size="xs" c="dimmed" mb="xs">{hospital.address}</Text>
                <Group gap="xs">
                  {hospital.phones.map((phone: string, phoneIndex: number) => (
                    <Anchor key={phoneIndex} href={`tel:${phone}`} c="red" size="xs">
                      {phone}
                    </Anchor>
                  ))}
                </Group>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Card>

      {/* Emergency Numbers Section */}
      <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder 
        style={{ 
          borderColor: '#1478FF',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => toggleSection('emergencyNumbers')}
      >
        <Group gap="md" justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" color="blue" variant="light">
              <IconExclamationMark size={20} />
            </ThemeIcon>
            <Title order={3} c="blue">EMERGENCY NUMBERS</Title>
            <Badge color="blue" variant="light">{emergencyContacts.emergencyNumbers.contacts.length}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {expandedSections.emergencyNumbers ? '▼' : '▶'}
          </Text>
        </Group>
        <Collapse in={expandedSections.emergencyNumbers}>
          <Stack gap="sm" mt="md">
            {emergencyContacts.emergencyNumbers.contacts.map((contact: any, index: number) => (
              <Box key={index} p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text fw={600} size="sm" mb="xs">{contact.name}</Text>
                <Text size="xs" c="dimmed" mb="xs">{contact.office}</Text>
                <Group gap="xs">
                  {contact.phones.map((phone: string, phoneIndex: number) => (
                    <Anchor key={phoneIndex} href={`tel:${phone}`} c="blue" size="xs">
                      {phone}
                    </Anchor>
                  ))}
                </Group>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Card>

      {/* Welfare Section */}
      <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder 
        style={{ 
          borderColor: '#8B4513',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => toggleSection('welfare')}
      >
        <Group gap="md" justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" color="orange" variant="light">
              <IconUsers size={20} />
            </ThemeIcon>
            <Title order={3} c="orange">WELFARE</Title>
            <Badge color="orange" variant="light">{emergencyContacts.welfare.contacts.length}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {expandedSections.welfare ? '▼' : '▶'}
          </Text>
        </Group>
        <Collapse in={expandedSections.welfare}>
          <Stack gap="sm" mt="md">
            {emergencyContacts.welfare.contacts.map((contact: any, index: number) => (
              <Box key={index} p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text fw={600} size="sm" mb="xs">{contact.name}</Text>
                <Text size="xs" c="dimmed" mb="xs">{contact.office}</Text>
                <Group gap="xs">
                  {contact.phones.map((phone: string, phoneIndex: number) => (
                    <Anchor key={phoneIndex} href={`tel:${phone}`} c="orange" size="xs">
                      {phone}
                    </Anchor>
                  ))}
                </Group>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Card>

      {/* Fire Brigade Section */}
      <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder 
        style={{ 
          borderColor: '#FF686D',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => toggleSection('fireBrigade')}
      >
        <Group gap="md" justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" color="red" variant="light">
              <IconFlame size={20} />
            </ThemeIcon>
            <Title order={3} c="red">JAMAICA FIRE BRIGADE</Title>
            <Badge color="red" variant="light">{emergencyContacts.fireBrigade.contacts.length}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {expandedSections.fireBrigade ? '▼' : '▶'}
          </Text>
        </Group>
        <Collapse in={expandedSections.fireBrigade}>
          <Stack gap="sm" mt="md">
            {emergencyContacts.fireBrigade.contacts.map((station: any, index: number) => (
              <Box key={index} p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text fw={600} size="sm" mb="xs">{station.name}</Text>
                <Text size="xs" c="dimmed" mb="xs">{station.address}</Text>
                <Group gap="xs">
                  {station.phones.map((phone: string, phoneIndex: number) => (
                    <Anchor key={phoneIndex} href={`tel:${phone}`} c="red" size="xs">
                      {phone}
                    </Anchor>
                  ))}
                </Group>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Card>

      {/* Police Section */}
      <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder 
        style={{ 
          borderColor: '#11DDB0',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => toggleSection('police')}
      >
        <Group gap="md" justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" color="green" variant="light">
              <IconShield size={20} />
            </ThemeIcon>
            <Title order={3} c="green">JAMAICA CONSTABULARY FORCE</Title>
            <Badge color="green" variant="light">{emergencyContacts.police.contacts.length}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {expandedSections.police ? '▼' : '▶'}
          </Text>
        </Group>
        <Collapse in={expandedSections.police}>
          <Stack gap="sm" mt="md">
            {emergencyContacts.police.contacts.map((division: any, index: number) => (
              <Box key={index} p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text fw={600} size="sm" mb="xs">{division.name}</Text>
                {division.address && <Text size="xs" c="dimmed" mb="xs">{division.address}</Text>}
                <Stack gap="xs">
                  {division.generalOffice && (
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">General Office:</Text>
                      <Anchor href={`tel:${division.generalOffice}`} c="green" size="xs">
                        {division.generalOffice}
                      </Anchor>
                    </Group>
                  )}
                  {division.guardRoom && (
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Guard Room:</Text>
                      <Anchor href={`tel:${division.guardRoom}`} c="green" size="xs">
                        {division.guardRoom}
                      </Anchor>
                    </Group>
                  )}
                  {division.phones && (
                    <Group gap="xs">
                      {division.phones.map((phone: string, phoneIndex: number) => (
                        <Anchor key={phoneIndex} href={`tel:${phone}`} c="green" size="xs">
                          {phone}
                        </Anchor>
                      ))}
                    </Group>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Card>

      {/* Footer */}
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ borderColor: '#11DDB0' }}>
        <Stack gap="xs" align="center">
          <Text size="xs" c="dimmed" ta="center">
            Prepared by: The Disaster Management Unit of the KSAMC
          </Text>
          <Group gap="md" justify="center">
            <Text size="xs" c="teal.0" fw={600}>
              KINGSTON & ST. ANDREW MUNICIPAL CORPORATION
            </Text>
          </Group>
          <Group gap="md" justify="center">
            <Anchor href="tel:876-967-3329" c="teal.0" size="xs">876-967-3329</Anchor>
            <Anchor href="tel:876-967-9317" c="teal.0" size="xs">876-967-9317</Anchor>
          </Group>
          <Group gap="md" justify="center">
            <Anchor href="https://www.ksame.gov.jm" target="_blank" c="teal.0" size="xs">www.ksame.gov.jm</Anchor>
            <Anchor href="mailto:ksamcemergency@ksame.gov.jm" c="teal.0" size="xs">ksamcemergency@ksame.gov.jm</Anchor>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
