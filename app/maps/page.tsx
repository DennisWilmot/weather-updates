'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Box,
  Button,
  Burger,
  Drawer,
  Flex,
  Group,
  Stack,
  Checkbox,
  Card,
  Text,
  Badge,
  Alert,
  Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMapPin, IconAlertTriangle, IconChevronUp, IconChevronDown, IconLogout } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Image from 'next/image';
import SheltersJDFMap from '@/components/SheltersJDFMap';
import { useSession, signOut } from '@/lib/auth-client';

interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function MapsPage() {
  const [showShelters, setShowShelters] = useState(true);
  const [showJDFBases, setShowJDFBases] = useState(true);
  const [showUserLocations, setShowUserLocations] = useState(true);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('prompt');
  const [enableLocation, setEnableLocation] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Check location permission status on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setLocationPermission('granted');
        } else if (result.state === 'denied') {
          setLocationPermission('denied');
        } else {
          setLocationPermission('prompt');
        }
      }).catch(() => {
        // Fallback if permissions API is not supported
        setLocationPermission('prompt');
      });
    } else {
      setLocationPermission('denied');
    }
  }, []);

  const handleEnableLocation = () => {
    setEnableLocation(true);
    setLocationPermission('checking');
  };

  // SSE connection for real-time location updates
  useEffect(() => {
    const eventSource = new EventSource('/api/user-locations/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'initial' && data.locations) {
          // Initial state - set all locations
          setUserLocations(data.locations);
        } else if (data.userId) {
          // Single location update
          setUserLocations((prev) => {
            // Update or add location for this user
            const filtered = prev.filter((loc) => loc.userId !== data.userId);
            return [...filtered, data];
          });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // EventSource will automatically reconnect
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Load initial locations
  useEffect(() => {
    fetch('/api/user-locations/active')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUserLocations(data);
        }
      })
      .catch((error) => {
        console.error('Error loading initial locations:', error);
      });
  }, []);

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      notifications.show({
        title: 'Error',
        message: 'Geolocation is not supported by your browser',
        color: 'red',
      });
      return;
    }

    setUpdatingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          const response = await fetch('/api/user-locations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to update location');
          }

          notifications.show({
            title: 'Success',
            message: 'Location updated successfully',
            color: 'green',
          });

          // Immediately refresh locations to show updated position
          try {
            const refreshResponse = await fetch('/api/user-locations/active');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (Array.isArray(refreshData)) {
                setUserLocations(refreshData);
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing locations:', refreshError);
            // Don't show error to user - SSE will eventually update
          }
        } catch (error: any) {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to update location',
            color: 'red',
          });
        } finally {
          setUpdatingLocation(false);
        }
      },
      (error) => {
        setUpdatingLocation(false);
        let errorMessage = 'Failed to get location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      {/* Header Navbar - Same as other routes */}
      <Box 
        style={{ 
          backgroundColor: '#0f0f23', 
          borderBottom: '2px solid #1478FF',
          height: '14.28vh',
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

            {/* Intellibus Logo */}
            <Image 
              src="/White_Icon_Blue_Bkg-removebg-preview.png" 
              alt="Intellibus" 
              width={40} 
              height={40}
              style={{ objectFit: 'contain' }}
            />

            <Title order={1} c="white" fw={800} size="xl" style={{ flex: '1 1 auto', textAlign: 'center' }}>
              Shelters & JDF Bases Map
            </Title>
            
            {/* Desktop Navigation Tabs */}
            <Group gap="xs" visibleFrom="sm">
              <Button
                variant="outline"
                color="teal"
                size="sm"
                onClick={() => router.push('/')}
                leftSection="📋"
              >
                Community Feed
              </Button>
              <Button
                variant="outline"
                color="electricBlue"
                size="sm"
                onClick={() => router.push('/')}
                leftSection="📢"
              >
                Report Incident
              </Button>
              <Button
                variant="outline"
                color="yellow"
                size="sm"
                onClick={() => router.push('/onlineretailers')}
                leftSection="🛒"
              >
                Retailers
              </Button>
              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection="🗺️"
              >
                Maps
              </Button>
              <Button
                variant="outline"
                color="coral"
                size="sm"
                onClick={() => router.push('/')}
                leftSection="📞"
              >
                Contacts
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
            variant="subtle"
            color="teal"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="📋"
          >
            Community Feed
          </Button>
          <Button
            variant="subtle"
            color="electricBlue"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="📢"
          >
            Report Incident
          </Button>
          <Button
            variant="subtle"
            color="yellow"
            fullWidth
            onClick={() => { router.push('/onlineretailers'); close(); }}
            leftSection="🛒"
          >
            Retailers
          </Button>
          <Button
            variant="filled"
            color="blue"
            fullWidth
            leftSection="🗺️"
          >
            Maps
          </Button>
          <Button
            variant="subtle"
            color="coral"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="📞"
          >
            Contacts
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
      <Box style={{ 
        position: 'relative', 
        width: '100%', 
        height: 'calc(100vh - 14.28vh)', 
        overflow: 'hidden'
      }}>
        {/* Map */}
        <Box style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative'
        }}>
          <SheltersJDFMap 
            showShelters={showShelters}
            showJDFBases={showJDFBases}
            showUserLocations={showUserLocations}
            enableLocation={enableLocation}
            onLocationStatusChange={setLocationPermission}
            userLocations={userLocations}
          />
        </Box>

        {/* Consolidated Map Controls & Legend - Collapsible Card */}
        <Card
          shadow="lg"
          padding={controlsExpanded ? "sm" : "xs"}
          radius="md"
          withBorder
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            backgroundColor: 'white',
            width: controlsExpanded ? '180px' : 'auto',
            transition: 'all 0.2s ease'
          }}
        >
          <Stack gap="xs">
            {/* Header with Toggle */}
            <Group justify="space-between" gap="xs" style={{ cursor: 'pointer' }} onClick={() => setControlsExpanded(!controlsExpanded)}>
              <Text size="sm" fw={600}>Map Controls</Text>
              {controlsExpanded ? (
                <IconChevronUp size={16} style={{ color: '#666' }} />
              ) : (
                <IconChevronDown size={16} style={{ color: '#666' }} />
              )}
            </Group>

            {controlsExpanded && (
              <>
                {/* Map Layers Section */}
                <Box>
                  <Text size="xs" fw={500} mb={4} c="dimmed">Layers</Text>
                  
                  <Stack gap={4}>
                    <Checkbox
                      label={
                        <Group gap={4}>
                          <Box
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#1e50ff',
                              border: '1.5px solid #ffffff',
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }}
                          />
                          <Text size="xs">Shelters</Text>
                        </Group>
                      }
                      checked={showShelters}
                      onChange={(event) => setShowShelters(event.currentTarget.checked)}
                      size="xs"
                    />
                    
                    <Checkbox
                      label={
                        <Group gap={4}>
                          <Box
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#22c55e',
                              border: '1.5px solid #ffffff',
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }}
                          />
                          <Text size="xs">JDF Bases</Text>
                        </Group>
                      }
                      checked={showJDFBases}
                      onChange={(event) => setShowJDFBases(event.currentTarget.checked)}
                      size="xs"
                    />
                    
                    <Checkbox
                      label={
                        <Group gap={4}>
                          <Box
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#9333ea',
                              border: '1.5px solid #ffffff',
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }}
                          />
                          <Text size="xs">User Locations</Text>
                        </Group>
                      }
                      checked={showUserLocations}
                      onChange={(event) => setShowUserLocations(event.currentTarget.checked)}
                      size="xs"
                    />
                  </Stack>
                </Box>

                <Divider size="xs" />

                {/* Legend Section - Compact */}
                <Box>
                  <Text size="xs" fw={500} mb={4} c="dimmed">Legend</Text>
                  
                  <Stack gap={3}>
                    <Group gap={6} style={{ alignItems: 'center' }}>
                      <Box
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#1e50ff',
                          border: '1.5px solid #ffffff',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}
                      />
                      <Text size="xs">Shelters</Text>
                    </Group>
                    
                    <Group gap={6} style={{ alignItems: 'center' }}>
                      <Box
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          border: '1.5px solid #ffffff',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}
                      />
                      <Text size="xs">JDF Bases</Text>
                    </Group>
                    
                    <Group gap={6} style={{ alignItems: 'center' }}>
                      <Box
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          border: '1.5px solid #ffffff',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}
                      />
                      <Text size="xs">JDF Bases (Priority)</Text>
                    </Group>

                    <Group gap={6} style={{ alignItems: 'center' }}>
                      <Box
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#9333ea',
                          border: '2px solid #ffffff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          flexShrink: 0
                        }}
                      />
                      <Text size="xs">User Locations</Text>
                    </Group>
                  </Stack>
                </Box>

                <Divider size="xs" />

                {/* Location Controls */}
                <Stack gap={6}>
                  {session?.user && (
                    <>
                      <Button
                        size="xs"
                        color="blue"
                        variant="filled"
                        leftSection={<IconMapPin size={14} />}
                        onClick={handleUpdateLocation}
                        loading={updatingLocation}
                        fullWidth
                      >
                        Update Location
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        leftSection={<IconLogout size={14} />}
                        onClick={async () => {
                          try {
                            await signOut();
                            notifications.show({
                              title: 'Success',
                              message: 'Signed out successfully',
                              color: 'green',
                            });
                            router.push('/');
                          } catch (error: any) {
                            notifications.show({
                              title: 'Error',
                              message: error.message || 'Failed to sign out',
                              color: 'red',
                            });
                          }
                        }}
                        fullWidth
                      >
                        Sign Out
                      </Button>
                    </>
                  )}
                  
                  {!session?.user && (
                    <Button
                      size="xs"
                      color="blue"
                      variant="light"
                      onClick={() => router.push('/login')}
                      fullWidth
                    >
                      Login to Update Location
                    </Button>
                  )}

                  {!enableLocation && locationPermission !== 'granted' && (
                    <Button
                      size="xs"
                      color="green"
                      variant="light"
                      leftSection={<IconMapPin size={14} />}
                      onClick={handleEnableLocation}
                      fullWidth
                    >
                      Enable Location
                    </Button>
                  )}
                  
                  {/* Location Status - Compact */}
                  <Group gap={4} style={{ alignItems: 'center' }}>
                    <IconMapPin size={12} style={{ color: '#666', flexShrink: 0 }} />
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
                      {locationPermission === 'granted' && 'Location active'}
                      {locationPermission === 'denied' && 'Location denied'}
                      {locationPermission === 'prompt' && 'Click button to enable'}
                      {locationPermission === 'checking' && 'Requesting permission...'}
                    </Text>
                  </Group>
                </Stack>
              </>
            )}
          </Stack>
        </Card>
      </Box>
    </>
  );
}

