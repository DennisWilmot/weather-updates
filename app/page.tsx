'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Title,
  Text,
  Badge,
  Alert,
  Card,
  Divider,
  List,
  Group,
  Center,
  Loader,
  Button,
  ThemeIcon,
  Anchor,
  Box,
  Image,
  Flex,
  Collapse
} from '@mantine/core';
import { 
  IconAlertTriangle, 
  IconPhone, 
  IconGlobe, 
  IconRefresh,
  IconBuildingHospital,
  IconExclamationMark,
  IconUsers,
  IconFlame,
  IconShield
} from '@tabler/icons-react';

interface StormData {
  status: 'active' | 'not_found' | 'error';
  storm?: {
    name: string;
    type: string;
    windSpeed: string;
    position: {
      lat: number;
      lon: number;
      distance: number;
      distanceUnit: string;
    };
    movement?: {
      direction: string;
      speed: string;
      eta: string;
    };
    lastAdvisory: string | null;
    isCloseApproach: boolean;
  };
  jamaica?: {
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  lastUpdated: string;
  emergencyContacts: any;
  message?: string;
  error?: string;
}

export default function HomePage() {
  const [data, setData] = useState<StormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hospitals: false,
    emergencyNumbers: false,
    welfare: false,
    fireBrigade: false,
    police: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data from /api/melissa...');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/melissa', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Data received:', result);
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Failed to fetch storm data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 2 minutes for testing
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Jamaica',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        {/* Header */}
        <Box 
          style={{ 
            backgroundColor: '#0f0f23', 
            borderBottom: '2px solid #1478FF',
            padding: '1rem 0'
          }}
        >
          <Container size="md">
            <Flex align="center" justify="space-between" gap="md">
              <Flex align="center" gap="md" style={{ flex: 1 }}>
                <Image src="/white_logo.png" alt="Intellibus Logo" h={60} w="auto" />
                <Title order={1} c="white" fw={800} size="2xl" style={{ flex: 1 }}>
                  Tropical Storm Melissa
                </Title>
              </Flex>
              <Stack align="flex-end" gap="xs">
                <Text c="teal.0" size="sm" fw={600}>
                  Powered by Intellibus
                </Text>
              </Stack>
            </Flex>
          </Container>
        </Box>

        <Container size="md" py="xl">
          <Center>
            <Stack align="center" gap="md">
              <Loader size="lg" color="white" />
              <Text c="white">Loading storm data...</Text>
            </Stack>
          </Center>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* Header */}
        <Box 
          style={{ 
            backgroundColor: '#0f0f23', 
            borderBottom: '2px solid #1478FF',
            padding: '1rem 0'
          }}
        >
          <Container size="md">
            <Flex align="center" justify="space-between" gap="md">
              <Flex align="center" gap="md" style={{ flex: 1 }}>
                <Image src="/white_logo.png" alt="Intellibus Logo" h={60} w="auto" />
                <Title order={1} c="white" fw={800} size="2xl" style={{ flex: 1 }}>
                  Tropical Storm Melissa
                </Title>
              </Flex>
              <Stack align="flex-end" gap="xs">
                <Text c="teal.0" size="sm" fw={600}>
                  Powered by Intellibus
                </Text>
              </Stack>
            </Flex>
          </Container>
        </Box>

        <Container size="md" py="xl">
          <Alert color="red" title="Error" icon={<IconAlertTriangle />}>
            {error}
            <Button mt="sm" onClick={fetchData} leftSection={<IconRefresh />}>
              Retry
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  if (!data) {
    return (
      <>
        {/* Header */}
        <Box 
          style={{ 
            backgroundColor: '#0f0f23', 
            borderBottom: '2px solid #1478FF',
            padding: '1rem 0'
          }}
        >
          <Container size="md">
            <Flex align="center" justify="space-between" gap="md">
              <Flex align="center" gap="md" style={{ flex: 1 }}>
                <Image src="/white_logo.png" alt="Intellibus Logo" h={60} w="auto" />
                <Title order={1} c="white" fw={800} size="2xl" style={{ flex: 1 }}>
                  Tropical Storm Melissa
                </Title>
              </Flex>
              <Stack align="flex-end" gap="xs">
                <Text c="teal.0" size="sm" fw={600}>
                  Powered by Intellibus
                </Text>
              </Stack>
            </Flex>
          </Container>
        </Box>

        <Container size="md" py="xl">
          <Alert color="red" title="No Data">
            Unable to load storm data.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <Box 
        style={{ 
          backgroundColor: '#0f0f23', 
          borderBottom: '2px solid #1478FF',
          padding: '1rem 0'
        }}
      >
        <Container size="md">
          <Flex align="center" justify="space-between" gap="md">
            <Flex align="center" gap="md" style={{ flex: 1 }}>
              <Image src="/white_logo.png" alt="Intellibus Logo" h={60} w="auto" />
              <Title order={1} c="white" fw={800} size="3xl" style={{ flex: 1 }}>
                Tropical Storm Melissa
              </Title>
            </Flex>
            <Stack align="flex-end" gap="xs">
              <Text c="teal.0" size="sm" fw={600}>
                Powered by Intellibus
              </Text>
              <Text c="white" size="xs" opacity={0.8}>
                Last updated: {formatLastUpdated(data.lastUpdated)}
              </Text>
            </Stack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="md" py="xl">
        <Stack gap="lg">

        {/* Disclaimer */}
        <Alert color="yellow" title="Important Disclaimer" c="yellow.0">
          <Text size="sm">
            This is <strong>not an official forecast</strong>. Always follow guidance from ODPEM and the National Hurricane Center (NHC) for official weather information and emergency instructions.
          </Text>
        </Alert>

        {/* Storm Status */}
        {data.status === 'active' && data.storm && (
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={2} c="electricBlue.0">{data.storm.name}</Title>
                  <Text size="lg" c="teal.0" fw={600}>{data.storm.type}</Text>
                </div>
                {data.storm.isCloseApproach && (
                  <Badge color="coral" size="lg" leftSection={<IconAlertTriangle />}>
                    Close Approach
                  </Badge>
                )}
              </Group>

              <Divider />

              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Wind Speed</Text>
                  <Text size="xl" fw={700} c="electricBlue.0">{data.storm.windSpeed}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Distance from Jamaica</Text>
                  <Text size="xl" fw={700} c="teal.0">{data.storm.position.distance} {data.storm.position.distanceUnit}</Text>
                </div>
              </Group>

               {data.storm.movement && (
                 <Group grow>
                   <div>
                     <Text size="sm" c="dimmed">Movement</Text>
                     <Text size="lg" fw={600} c="coral.0">{data.storm.movement.direction} at {data.storm.movement.speed}</Text>
                   </div>
                 </Group>
               )}

              {data.storm.lastAdvisory && (
                <Text size="sm" c="dimmed">
                  Last Advisory: {formatLastUpdated(data.storm.lastAdvisory)}
                </Text>
              )}
            </Stack>
          </Card>
        )}

        {data.status === 'not_found' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#11DDB0' }}>
            <Stack gap="md" align="center">
              <ThemeIcon size="xl" color="teal" variant="light">
                <IconAlertTriangle />
              </ThemeIcon>
              <Title order={3} c="teal.0">No Active Storm</Title>
              <Text ta="center" c="dimmed">
                Tropical Storm Melissa is not currently active or has been downgraded.
              </Text>
            </Stack>
          </Card>
        )}

        {data.status === 'error' && (
          <Alert color="red" title="Data Error">
            {data.message || 'Unable to fetch current storm data.'}
          </Alert>
        )}

        {/* Emergency Contacts Directory - Accordion Style */}
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
                <Badge color="red" variant="light">{data.emergencyContacts.hospitals.contacts.length}</Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {expandedSections.hospitals ? '▼' : '▶'}
              </Text>
            </Group>
            <Collapse in={expandedSections.hospitals}>
              <Stack gap="sm" mt="md">
                {data.emergencyContacts.hospitals.contacts.map((hospital: any, index: number) => (
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
                <Badge color="blue" variant="light">{data.emergencyContacts.emergencyNumbers.contacts.length}</Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {expandedSections.emergencyNumbers ? '▼' : '▶'}
              </Text>
            </Group>
            <Collapse in={expandedSections.emergencyNumbers}>
              <Stack gap="sm" mt="md">
                {data.emergencyContacts.emergencyNumbers.contacts.map((contact: any, index: number) => (
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
                <Badge color="orange" variant="light">{data.emergencyContacts.welfare.contacts.length}</Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {expandedSections.welfare ? '▼' : '▶'}
              </Text>
            </Group>
            <Collapse in={expandedSections.welfare}>
              <Stack gap="sm" mt="md">
                {data.emergencyContacts.welfare.contacts.map((contact: any, index: number) => (
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
                <Badge color="red" variant="light">{data.emergencyContacts.fireBrigade.contacts.length}</Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {expandedSections.fireBrigade ? '▼' : '▶'}
              </Text>
            </Group>
            <Collapse in={expandedSections.fireBrigade}>
              <Stack gap="sm" mt="md">
                {data.emergencyContacts.fireBrigade.contacts.map((station: any, index: number) => (
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
                <Badge color="green" variant="light">{data.emergencyContacts.police.contacts.length}</Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {expandedSections.police ? '▼' : '▶'}
              </Text>
            </Group>
            <Collapse in={expandedSections.police}>
              <Stack gap="sm" mt="md">
                {data.emergencyContacts.police.contacts.map((division: any, index: number) => (
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
        </Stack>

        {/* Refresh Button */}
        <Card shadow="sm" padding="md" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Last updated: {formatLastUpdated(data.lastUpdated)}</Text>
              <Text size="xs" c="teal.0">Auto-refreshes every 2 minutes</Text>
            </Stack>
            <Button 
              onClick={fetchData} 
              leftSection={<IconRefresh />} 
              variant="filled"
              color="electricBlue"
              size="md"
            >
              Refresh Now
            </Button>
          </Group>
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
      </Container>
    </>
  );
}
