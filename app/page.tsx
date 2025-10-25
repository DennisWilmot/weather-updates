'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Title,
  Text,
  Box,
  Center,
  Loader,
  Group,
  Button,
  Burger,
  Drawer,
  Flex,
  ActionIcon,
  Affix,
  Paper,
  ThemeIcon,
  Card,
  Alert,
  Badge
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import StormUpdates from '../components/StormUpdates';
import EmergencyContacts from '../components/EmergencyContacts';
import CommunityFeed from '../components/CommunityFeed';
import SubmitUpdate from '../components/SubmitUpdate';

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
  const [activeTab, setActiveTab] = useState<'feed' | 'submit' | 'storm' | 'contacts' | 'news'>('feed');
  const [opened, { open, close }] = useDisclosure(false);

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
          <Container size="xl">
            <Flex align="center" justify="space-between" gap="lg">
              <Title order={1} c="white" fw={800} size="2xl">
                Hurricane Melissa Updates
              </Title>
              
              {/* Desktop Navigation Tabs */}
              <Group gap="lg" visibleFrom="sm" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <Button
                  variant={activeTab === 'feed' ? 'filled' : 'outline'}
                  color="teal"
                  size="md"
                  onClick={() => setActiveTab('feed')}
                  leftSection="📋"
                  style={{
                    fontWeight: activeTab === 'feed' ? 700 : 500,
                    transform: activeTab === 'feed' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Community Feed
                </Button>
                <Button
                  variant={activeTab === 'submit' ? 'filled' : 'outline'}
                  color="electricBlue"
                  size="md"
                  onClick={() => setActiveTab('submit')}
                  leftSection="📝"
                  style={{
                    fontWeight: activeTab === 'submit' ? 700 : 500,
                    transform: activeTab === 'submit' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Submit Update
                </Button>
                <Button
                  variant={activeTab === 'storm' ? 'filled' : 'outline'}
                  color="yellow"
                  size="md"
                  onClick={() => setActiveTab('storm')}
                  leftSection="🌪️"
                  style={{
                    fontWeight: activeTab === 'storm' ? 700 : 500,
                    transform: activeTab === 'storm' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Storm Updates
                </Button>
                <Button
                  variant={activeTab === 'contacts' ? 'filled' : 'outline'}
                  color="coral"
                  size="md"
                  onClick={() => setActiveTab('contacts')}
                  leftSection="📞"
                  style={{
                    fontWeight: activeTab === 'contacts' ? 700 : 500,
                    transform: activeTab === 'contacts' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Emergency Contacts
                </Button>
              </Group>

              {/* Mobile Hamburger Menu */}
              <Burger
                opened={opened}
                onClick={open}
                color="white"
                size="sm"
                aria-label="Toggle navigation"
                hiddenFrom="sm"
              />
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
          <Container size="xl">
            <Flex align="center" justify="space-between" gap="lg">
              <Title order={1} c="white" fw={800} size="2xl">
                Hurricane Melissa Updates
              </Title>
              
              {/* Desktop Navigation Tabs */}
              <Group gap="lg" visibleFrom="sm" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <Button
                  variant={activeTab === 'feed' ? 'filled' : 'outline'}
                  color="teal"
                  size="md"
                  onClick={() => setActiveTab('feed')}
                  leftSection="📋"
                  style={{
                    fontWeight: activeTab === 'feed' ? 700 : 500,
                    transform: activeTab === 'feed' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Community Feed
                </Button>
                <Button
                  variant={activeTab === 'submit' ? 'filled' : 'outline'}
                  color="electricBlue"
                  size="md"
                  onClick={() => setActiveTab('submit')}
                  leftSection="📝"
                  style={{
                    fontWeight: activeTab === 'submit' ? 700 : 500,
                    transform: activeTab === 'submit' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Submit Update
                </Button>
                <Button
                  variant={activeTab === 'storm' ? 'filled' : 'outline'}
                  color="yellow"
                  size="md"
                  onClick={() => setActiveTab('storm')}
                  leftSection="🌪️"
                  style={{
                    fontWeight: activeTab === 'storm' ? 700 : 500,
                    transform: activeTab === 'storm' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Storm Updates
                </Button>
                <Button
                  variant={activeTab === 'contacts' ? 'filled' : 'outline'}
                  color="coral"
                  size="md"
                  onClick={() => setActiveTab('contacts')}
                  leftSection="📞"
                  style={{
                    fontWeight: activeTab === 'contacts' ? 700 : 500,
                    transform: activeTab === 'contacts' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Emergency Contacts
                </Button>
              </Group>

              {/* Mobile Hamburger Menu */}
              <Burger
                opened={opened}
                onClick={open}
                color="white"
                size="sm"
                aria-label="Toggle navigation"
                hiddenFrom="sm"
              />
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
          <Container size="xl">
            <Flex align="center" justify="space-between" gap="lg">
              <Title order={1} c="white" fw={800} size="2xl">
                Hurricane Melissa Updates
              </Title>
              
              {/* Desktop Navigation Tabs */}
              <Group gap="lg" visibleFrom="sm" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <Button
                  variant={activeTab === 'feed' ? 'filled' : 'outline'}
                  color="teal"
                  size="md"
                  onClick={() => setActiveTab('feed')}
                  leftSection="📋"
                  style={{
                    fontWeight: activeTab === 'feed' ? 700 : 500,
                    transform: activeTab === 'feed' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Community Feed
                </Button>
                <Button
                  variant={activeTab === 'submit' ? 'filled' : 'outline'}
                  color="electricBlue"
                  size="md"
                  onClick={() => setActiveTab('submit')}
                  leftSection="📝"
                  style={{
                    fontWeight: activeTab === 'submit' ? 700 : 500,
                    transform: activeTab === 'submit' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Submit Update
                </Button>
                <Button
                  variant={activeTab === 'storm' ? 'filled' : 'outline'}
                  color="yellow"
                  size="md"
                  onClick={() => setActiveTab('storm')}
                  leftSection="🌪️"
                  style={{
                    fontWeight: activeTab === 'storm' ? 700 : 500,
                    transform: activeTab === 'storm' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Storm Updates
                </Button>
                <Button
                  variant={activeTab === 'contacts' ? 'filled' : 'outline'}
                  color="coral"
                  size="md"
                  onClick={() => setActiveTab('contacts')}
                  leftSection="📞"
                  style={{
                    fontWeight: activeTab === 'contacts' ? 700 : 500,
                    transform: activeTab === 'contacts' ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Emergency Contacts
                </Button>
              </Group>

              {/* Mobile Hamburger Menu */}
              <Burger
                opened={opened}
                onClick={open}
                color="white"
                size="sm"
                aria-label="Toggle navigation"
                hiddenFrom="sm"
              />
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
          height: '14.28vh', // 1/7 of viewport height
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container size="xl">
          <Flex align="center" justify="space-between" gap="lg">
            {/* Mobile Hamburger Menu */}
            <Burger
              opened={opened}
              onClick={open}
              color="white"
              size="sm"
              aria-label="Toggle navigation"
              hiddenFrom="sm"
            />

            <Title order={1} c="white" fw={800} size="xl" style={{ flex: '1 1 auto', textAlign: 'center' }}>
              Hurricane Melissa Updates
            </Title>
            
            {/* Desktop Navigation Tabs */}
            <Group gap="xs" visibleFrom="sm">
              <Button
                variant={activeTab === 'feed' ? 'filled' : 'outline'}
                color="teal"
                size="sm"
                onClick={() => setActiveTab('feed')}
                leftSection="📋"
              >
                Community Feed
              </Button>
              <Button
                variant={activeTab === 'submit' ? 'filled' : 'outline'}
                color="electricBlue"
                size="sm"
                onClick={() => setActiveTab('submit')}
                leftSection="📝"
              >
                Submit Update
              </Button>
              <Button
                variant={activeTab === 'storm' ? 'filled' : 'outline'}
                color="yellow"
                size="sm"
                onClick={() => setActiveTab('storm')}
                leftSection="🌪️"
              >
                Storm Updates
              </Button>
              <Button
                variant={activeTab === 'contacts' ? 'filled' : 'outline'}
                color="coral"
                size="sm"
                onClick={() => setActiveTab('contacts')}
                leftSection="📞"
              >
                Emergency Contacts
              </Button>
              <Button
                variant={activeTab === 'news' ? 'filled' : 'outline'}
                color="gray"
                size="sm"
                onClick={() => setActiveTab('news')}
                leftSection="📰"
              >
                News Feed
              </Button>
            </Group>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Navigation"
        position="left"
        size="sm"
        hiddenFrom="sm"
        styles={{
          content: {
            backgroundColor: '#0f0f23',
            color: 'white'
          },
          header: {
            backgroundColor: '#0f0f23',
            borderBottom: '1px solid #1478FF'
          },
          title: {
            color: 'white'
          }
        }}
      >
        <Stack gap="md" mt="md">
          <Button
            variant={activeTab === 'feed' ? 'filled' : 'subtle'}
            color="teal"
            fullWidth
            onClick={() => {
              setActiveTab('feed');
              close();
            }}
            leftSection="📋"
          >
            Community Feed
          </Button>
          <Button
            variant={activeTab === 'submit' ? 'filled' : 'subtle'}
            color="electricBlue"
            fullWidth
            onClick={() => {
              setActiveTab('submit');
              close();
            }}
            leftSection="📝"
          >
            Submit Update
          </Button>
          <Button
            variant={activeTab === 'storm' ? 'filled' : 'subtle'}
            color="yellow"
            fullWidth
            onClick={() => {
              setActiveTab('storm');
              close();
            }}
            leftSection="🌪️"
          >
            Storm Updates
          </Button>
          <Button
            variant={activeTab === 'contacts' ? 'filled' : 'subtle'}
            color="coral"
            fullWidth
            onClick={() => {
              setActiveTab('contacts');
              close();
            }}
            leftSection="📞"
          >
            Emergency Contacts
          </Button>
          <Button
            variant={activeTab === 'news' ? 'filled' : 'subtle'}
            color="gray"
            fullWidth
            onClick={() => {
              setActiveTab('news');
              close();
            }}
            leftSection="📰"
          >
            News Feed
          </Button>
        </Stack>
      </Drawer>

      {/* Main Content - Mobile */}
      <Container size="md" py="xl" style={{ paddingBottom: '70px' }} hiddenFrom="sm">
        {activeTab === 'feed' && <CommunityFeed />}
        {activeTab === 'submit' && <SubmitUpdate />}
        {activeTab === 'storm' && (
          <StormUpdates 
            data={data} 
            loading={loading} 
            error={error} 
            onRefresh={fetchData} 
          />
        )}
        {activeTab === 'contacts' && (
          data?.emergencyContacts ? (
            <EmergencyContacts emergencyContacts={data.emergencyContacts} />
          ) : (
            <Center py="xl">
              <Text>Loading emergency contacts...</Text>
            </Center>
          )
        )}
        {activeTab === 'news' && (
          <Stack gap="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={2} c="gray.6">📰 News Feed</Title>
                  <Badge color="blue" variant="light" size="lg">
                    As of {new Date().toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Jamaica'
                    })}
                  </Badge>
                </Group>
                
                <Text c="dimmed" ta="center" size="lg">
                  Latest news and updates will appear here
                </Text>
                
                <Alert color="blue" title="News Updates" icon="📰">
                  <Text size="sm">
                    This section will display real-time news updates, official announcements, 
                    and emergency information related to Hurricane Melissa and Jamaica.
                  </Text>
                </Alert>
                
                <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
                  <Stack gap="xs">
                    <Text fw={600} size="sm" c="blue">Sample News Item</Text>
                    <Text size="xs" c="dimmed">
                      Last updated: {new Date().toLocaleString('en-US', {
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Jamaica'
                      })}
                    </Text>
                    <Text size="sm">
                      This is where official news updates, weather advisories, 
                      and emergency information will be displayed.
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Card>
          </Stack>
        )}
      </Container>

      {/* Main Content - Desktop */}
      <Container size="md" py="xl" visibleFrom="sm">
        {activeTab === 'feed' && <CommunityFeed />}
        {activeTab === 'submit' && <SubmitUpdate />}
        {activeTab === 'storm' && (
          <StormUpdates 
            data={data} 
            loading={loading} 
            error={error} 
            onRefresh={fetchData} 
          />
        )}
        {activeTab === 'contacts' && (
          data?.emergencyContacts ? (
            <EmergencyContacts emergencyContacts={data.emergencyContacts} />
          ) : (
            <Center py="xl">
              <Text>Loading emergency contacts...</Text>
            </Center>
          )
        )}
        {activeTab === 'news' && (
          <Stack gap="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={2} c="gray.6">📰 News Feed</Title>
                  <Badge color="blue" variant="light" size="lg">
                    As of {new Date().toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Jamaica'
                    })}
                  </Badge>
                </Group>
                
                <Text c="dimmed" ta="center" size="lg">
                  Latest news and updates will appear here
                </Text>
                
                <Alert color="blue" title="News Updates" icon="📰">
                  <Text size="sm">
                    This section will display real-time news updates, official announcements, 
                    and emergency information related to Hurricane Melissa and Jamaica.
                  </Text>
                </Alert>
                
                <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
                  <Stack gap="xs">
                    <Text fw={600} size="sm" c="blue">Sample News Item</Text>
                    <Text size="xs" c="dimmed">
                      Last updated: {new Date().toLocaleString('en-US', {
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Jamaica'
                      })}
                    </Text>
                    <Text size="sm">
                      This is where official news updates, weather advisories, 
                      and emergency information will be displayed.
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Card>
          </Stack>
        )}
      </Container>

      {/* Floating Action Button */}
      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon
          size="xl"
          radius="xl"
          color="electricBlue"
          variant="filled"
          onClick={() => setActiveTab('submit')}
          style={{
            boxShadow: '0 4px 12px rgba(20, 120, 255, 0.3)',
            transition: 'all 0.2s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 120, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 120, 255, 0.3)';
          }}
        >
          <Text size="xl" fw={700}>+</Text>
        </ActionIcon>
      </Affix>

      {/* Mobile Bottom Navigation */}
      <Paper
        hiddenFrom="sm"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(15, 15, 35, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(20, 120, 255, 0.2)',
          padding: '8px 16px 12px 16px',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        <Group justify="space-around" gap="md">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setActiveTab('feed')}
            style={{
              flex: 1,
              flexDirection: 'column',
              height: 'auto',
              padding: '8px 6px',
              minHeight: '60px',
              borderRadius: '16px',
              backgroundColor: activeTab === 'feed' ? 'rgba(17, 221, 176, 0.15)' : 'transparent',
              border: activeTab === 'feed' ? '1px solid rgba(17, 221, 176, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeTab === 'feed' ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: activeTab === 'feed' ? '0 4px 12px rgba(17, 221, 176, 0.2)' : 'none'
            }}
          >
            <Text size="lg" style={{ 
              color: activeTab === 'feed' ? '#11DDB0' : '#8B8B8B',
              transition: 'color 0.3s ease'
            }}>📋</Text>
            <Text size="xs" mt="2px" style={{ 
              color: activeTab === 'feed' ? '#11DDB0' : '#8B8B8B',
              fontWeight: activeTab === 'feed' ? 600 : 400,
              transition: 'all 0.3s ease'
            }}>Feed</Text>
          </Button>
          
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setActiveTab('submit')}
            style={{
              flex: 1,
              flexDirection: 'column',
              height: 'auto',
              padding: '8px 6px',
              minHeight: '60px',
              borderRadius: '16px',
              backgroundColor: activeTab === 'submit' ? 'rgba(20, 120, 255, 0.15)' : 'transparent',
              border: activeTab === 'submit' ? '1px solid rgba(20, 120, 255, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeTab === 'submit' ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: activeTab === 'submit' ? '0 4px 12px rgba(20, 120, 255, 0.2)' : 'none'
            }}
          >
            <Text size="lg" style={{ 
              color: activeTab === 'submit' ? '#1478FF' : '#8B8B8B',
              transition: 'color 0.3s ease'
            }}>📝</Text>
            <Text size="xs" mt="2px" style={{ 
              color: activeTab === 'submit' ? '#1478FF' : '#8B8B8B',
              fontWeight: activeTab === 'submit' ? 600 : 400,
              transition: 'all 0.3s ease'
            }}>Submit</Text>
          </Button>
          
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setActiveTab('storm')}
            style={{
              flex: 1,
              flexDirection: 'column',
              height: 'auto',
              padding: '8px 6px',
              minHeight: '60px',
              borderRadius: '16px',
              backgroundColor: activeTab === 'storm' ? 'rgba(255, 230, 109, 0.15)' : 'transparent',
              border: activeTab === 'storm' ? '1px solid rgba(255, 230, 109, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeTab === 'storm' ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: activeTab === 'storm' ? '0 4px 12px rgba(255, 230, 109, 0.2)' : 'none'
            }}
          >
            <Text size="lg" style={{ 
              color: activeTab === 'storm' ? '#FFE66D' : '#8B8B8B',
              transition: 'color 0.3s ease'
            }}>🌪️</Text>
            <Text size="xs" mt="2px" style={{ 
              color: activeTab === 'storm' ? '#FFE66D' : '#8B8B8B',
              fontWeight: activeTab === 'storm' ? 600 : 400,
              transition: 'all 0.3s ease'
            }}>Storm</Text>
          </Button>
          
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setActiveTab('contacts')}
            style={{
              flex: 1,
              flexDirection: 'column',
              height: 'auto',
              padding: '8px 6px',
              minHeight: '60px',
              borderRadius: '16px',
              backgroundColor: activeTab === 'contacts' ? 'rgba(255, 104, 109, 0.15)' : 'transparent',
              border: activeTab === 'contacts' ? '1px solid rgba(255, 104, 109, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeTab === 'contacts' ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: activeTab === 'contacts' ? '0 4px 12px rgba(255, 104, 109, 0.2)' : 'none'
            }}
          >
            <Text size="lg" style={{ 
              color: activeTab === 'contacts' ? '#FF686D' : '#8B8B8B',
              transition: 'color 0.3s ease'
            }}>📞</Text>
            <Text size="xs" mt="2px" style={{ 
              color: activeTab === 'contacts' ? '#FF686D' : '#8B8B8B',
              fontWeight: activeTab === 'contacts' ? 600 : 400,
              transition: 'all 0.3s ease'
            }}>Contacts</Text>
          </Button>
          
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setActiveTab('news')}
            style={{
              flex: 1,
              flexDirection: 'column',
              height: 'auto',
              padding: '8px 6px',
              minHeight: '60px',
              borderRadius: '16px',
              backgroundColor: activeTab === 'news' ? 'rgba(128, 128, 128, 0.15)' : 'transparent',
              border: activeTab === 'news' ? '1px solid rgba(128, 128, 128, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: activeTab === 'news' ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: activeTab === 'news' ? '0 4px 12px rgba(128, 128, 128, 0.2)' : 'none'
            }}
          >
            <Text size="lg" style={{ 
              color: activeTab === 'news' ? '#808080' : '#8B8B8B',
              transition: 'color 0.3s ease'
            }}>📰</Text>
            <Text size="xs" mt="2px" style={{ 
              color: activeTab === 'news' ? '#808080' : '#8B8B8B',
              fontWeight: activeTab === 'news' ? 600 : 400,
              transition: 'all 0.3s ease'
            }}>News</Text>
          </Button>
        </Group>
      </Paper>
    </>
  );
}
