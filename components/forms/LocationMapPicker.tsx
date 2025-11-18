/**
 * LocationMapPicker - Enhanced location picker with map integration
 * Combines hierarchical location selection with coordinate picking
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Group,
  Text,
  TextInput,
  Button,
  Paper,
  Badge,
  Loader,
  Box,
  Modal,
} from '@mantine/core';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import { IconMapPin, IconCurrentLocation, IconCheck } from '@tabler/icons-react';
import HierarchicalLocationPicker from '@/components/HierarchicalLocationPicker';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LocationMapPickerProps {
  label?: string;
  description?: string;
  parishId?: string | null;
  communityId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (location: {
    parishId: string | null;
    communityId: string | null;
    latitude: number | null;
    longitude: number | null;
    accuracy?: number;
  }) => void;
  error?: string;
  required?: boolean;
  showMap?: boolean;
  mapHeight?: number;
  className?: string;
}

export default function LocationMapPicker({
  label,
  description,
  parishId: initialParishId,
  communityId: initialCommunityId,
  latitude: initialLatitude,
  longitude: initialLongitude,
  onLocationChange,
  error,
  required = false,
  showMap = true,
  mapHeight = 300,
  className,
}: LocationMapPickerProps) {
  const [parishId, setParishId] = useState<string | null>(initialParishId || null);
  const [communityId, setCommunityId] = useState<string | null>(initialCommunityId || null);
  const [latitude, setLatitude] = useState<number | null>(initialLatitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude || null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mapModalOpened, { open: openMapModal, close: closeMapModal }] = useDisclosure(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  // Initialize map (only when modal is open on mobile, or always on desktop)
  useEffect(() => {
    if (!showMap || !mapContainer.current || map.current) return;
    if (isMobile && !mapModalOpened) return; // Don't initialize map until modal opens on mobile

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [longitude || -77.2975, latitude || 18.1096], // Default to Jamaica center
      zoom: latitude && longitude ? 15 : 8,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add click handler for coordinate selection
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setLongitude(lng);
      setLatitude(lat);
      updateMarker(lng, lat);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap, isMobile, mapModalOpened]);

  // Update marker position
  const updateMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new maplibregl.Marker({
        color: '#ef4444',
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        setLongitude(lngLat.lng);
        setLatitude(lngLat.lat);
      });
    }

    // Center map on marker
    map.current.flyTo({
      center: [lng, lat],
      zoom: 15,
    });
  };

  // Update marker when coordinates change externally
  useEffect(() => {
    if (map.current && mapLoaded && latitude && longitude) {
      updateMarker(longitude, latitude);
    }
  }, [latitude, longitude, mapLoaded]);

  // Get current location
  const handleGetCurrentLocation = () => {
    setGettingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(acc);
        if (map.current) {
          updateMarker(lng, lat);
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please select manually on the map.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  // Handle hierarchical location change
  const handleHierarchicalChange = (location: {
    parishId: string | null;
    parishName: string | null;
    communityId: string | null;
    communityName: string | null;
    locationId: string | null;
    placeName: string | null;
    streetName: string | null;
  }) => {
    setParishId(location.parishId);
    setCommunityId(location.communityId);
    // Note: We don't auto-set coordinates from hierarchical selection
    // User must select on map or use current location
  };

  // Notify parent of changes (only when values actually change, not on every render)
  useEffect(() => {
    onLocationChange({
      parishId,
      communityId,
      latitude,
      longitude,
      accuracy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parishId, communityId, latitude, longitude, accuracy]);

  // Handle manual coordinate input
  const handleLatitudeChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= -90 && num <= 90) {
      setLatitude(num);
      if (longitude !== null && map.current) {
        updateMarker(longitude, num);
      }
    } else if (value === '') {
      setLatitude(null);
    }
  };

  const handleLongitudeChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= -180 && num <= 180) {
      setLongitude(num);
      if (latitude !== null && map.current) {
        updateMarker(num, latitude);
      }
    } else if (value === '') {
      setLongitude(null);
    }
  };

  return (
    <div className={className}>
      {label && (
        <Group gap="xs" mb="xs">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {required && (
            <Text size="sm" c="red">
              *
            </Text>
          )}
        </Group>
      )}

      {description && (
        <Text size="xs" c="dimmed" mb="sm">
          {description}
        </Text>
      )}

      <Stack gap="md">
        {/* Hierarchical Location Picker */}
        <HierarchicalLocationPicker
          onLocationChange={handleHierarchicalChange}
          initialParish={parishId || undefined}
          initialCommunity={communityId || undefined}
        />

        {/* Map for Coordinate Selection */}
        {showMap && (
          <>
            {isMobile ? (
              <>
                <Button
                  fullWidth
                  variant="light"
                  size="md"
                  leftSection={<IconMapPin size={18} />}
                  onClick={openMapModal}
                  style={{ minHeight: '44px' }}
                >
                  Open Map to Select Coordinates
                </Button>
                
                <Modal
                  opened={mapModalOpened}
                  onClose={closeMapModal}
                  title="Select Coordinates"
                  fullScreen={isMobile}
                  styles={{
                    content: {
                      height: isMobile ? '100vh' : 'auto',
                    },
                    body: {
                      padding: isMobile ? '16px' : undefined,
                    },
                  }}
                >
                  <Stack gap="md">
                    <Button
                      fullWidth
                      variant="light"
                      size="md"
                      leftSection={gettingLocation ? <Loader size={18} /> : <IconCurrentLocation size={18} />}
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      style={{ minHeight: '44px' }}
                    >
                      Use Current Location
                    </Button>

                    <Box
                      ref={mapContainer}
                      style={{
                        width: '100%',
                        height: isMobile ? 'calc(100vh - 300px)' : `${mapHeight}px`,
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #e9ecef',
                      }}
                    />
                    
                    {/* Coordinate Inputs in Modal */}
                    <Group grow>
                      <TextInput
                        label="Latitude"
                        placeholder="18.1096"
                        value={latitude?.toString() || ''}
                        onChange={(e) => handleLatitudeChange(e.target.value)}
                        error={latitude !== null && (latitude < 17.7 || latitude > 18.5) ? 'Must be within Jamaica bounds' : undefined}
                        rightSection={<IconMapPin size={18} />}
                        size="md"
                        styles={{
                          input: {
                            fontSize: '16px', // Prevent zoom on iOS
                            minHeight: '44px',
                          },
                        }}
                      />
                      <TextInput
                        label="Longitude"
                        placeholder="-77.2975"
                        value={longitude?.toString() || ''}
                        onChange={(e) => handleLongitudeChange(e.target.value)}
                        error={longitude !== null && (longitude < -78.5 || longitude > -76.2) ? 'Must be within Jamaica bounds' : undefined}
                        rightSection={<IconMapPin size={18} />}
                        size="md"
                        styles={{
                          input: {
                            fontSize: '16px', // Prevent zoom on iOS
                            minHeight: '44px',
                          },
                        }}
                      />
                    </Group>
                  </Stack>
                </Modal>
              </>
            ) : (
              <Paper withBorder p="sm">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      Select Coordinates on Map
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={gettingLocation ? <Loader size={14} /> : <IconCurrentLocation size={14} />}
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                    >
                      Use Current Location
                    </Button>
                  </Group>

                  <Box
                    ref={mapContainer}
                    style={{
                      width: '100%',
                      height: `${mapHeight}px`,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #e9ecef',
                    }}
                  />
                </Stack>
              </Paper>
            )}
          </>
        )}

              {/* Coordinate Inputs */}
              {(!isMobile || !mapModalOpened) && (
                <Group grow>
                  <TextInput
                    label="Latitude"
                    placeholder="18.1096"
                    value={latitude?.toString() || ''}
                    onChange={(e) => handleLatitudeChange(e.target.value)}
                    error={latitude !== null && (latitude < 17.7 || latitude > 18.5) ? 'Must be within Jamaica bounds' : undefined}
                    rightSection={<IconMapPin size={isMobile ? 18 : 16} />}
                    size={isMobile ? "md" : "sm"}
                    styles={{
                      input: {
                        fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
                        minHeight: isMobile ? '44px' : undefined,
                      },
                    }}
                  />
                  <TextInput
                    label="Longitude"
                    placeholder="-77.2975"
                    value={longitude?.toString() || ''}
                    onChange={(e) => handleLongitudeChange(e.target.value)}
                    error={longitude !== null && (longitude < -78.5 || longitude > -76.2) ? 'Must be within Jamaica bounds' : undefined}
                    rightSection={<IconMapPin size={isMobile ? 18 : 16} />}
                    size={isMobile ? "md" : "sm"}
                    styles={{
                      input: {
                        fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
                        minHeight: isMobile ? '44px' : undefined,
                      },
                    }}
                  />
                </Group>
              )}
              
              {/* Coordinate Inputs in Modal */}
              {isMobile && mapModalOpened && (
                <Group grow>
                  <TextInput
                    label="Latitude"
                    placeholder="18.1096"
                    value={latitude?.toString() || ''}
                    onChange={(e) => handleLatitudeChange(e.target.value)}
                    error={latitude !== null && (latitude < 17.7 || latitude > 18.5) ? 'Must be within Jamaica bounds' : undefined}
                    rightSection={<IconMapPin size={18} />}
                    size="md"
                    styles={{
                      input: {
                        fontSize: '16px', // Prevent zoom on iOS
                        minHeight: '44px',
                      },
                    }}
                  />
                  <TextInput
                    label="Longitude"
                    placeholder="-77.2975"
                    value={longitude?.toString() || ''}
                    onChange={(e) => handleLongitudeChange(e.target.value)}
                    error={longitude !== null && (longitude < -78.5 || longitude > -76.2) ? 'Must be within Jamaica bounds' : undefined}
                    rightSection={<IconMapPin size={18} />}
                    size="md"
                    styles={{
                      input: {
                        fontSize: '16px', // Prevent zoom on iOS
                        minHeight: '44px',
                      },
                    }}
                  />
                </Group>
              )}

        {/* Coordinate Inputs (when map is shown) */}
        {showMap && (
          <>
            {/* Desktop: Show inputs below map */}
            {!isMobile && (
              <Group grow>
                <TextInput
                  label="Latitude"
                  placeholder="18.1096"
                  value={latitude?.toString() || ''}
                  onChange={(e) => handleLatitudeChange(e.target.value)}
                  error={latitude !== null && (latitude < 17.7 || latitude > 18.5) ? 'Must be within Jamaica bounds' : undefined}
                  rightSection={<IconMapPin size={16} />}
                  size="sm"
                />
                <TextInput
                  label="Longitude"
                  placeholder="-77.2975"
                  value={longitude?.toString() || ''}
                  onChange={(e) => handleLongitudeChange(e.target.value)}
                  error={longitude !== null && (longitude < -78.5 || longitude > -76.2) ? 'Must be within Jamaica bounds' : undefined}
                  rightSection={<IconMapPin size={16} />}
                  size="sm"
                />
              </Group>
            )}
            
            {/* Status */}
            {latitude && longitude && (
              <Group gap="xs">
                <IconCheck size={16} color="green" />
                <Text size="xs" c="dimmed">
                  Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  {accuracy && ` (Accuracy: ${Math.round(accuracy)}m)`}
                </Text>
              </Group>
            )}
          </>
        )}

        {/* Manual Coordinate Input (if map hidden) */}
        {!showMap && (
          <Group grow>
            <TextInput
              label="Latitude"
              placeholder="18.1096"
              value={latitude?.toString() || ''}
              onChange={(e) => handleLatitudeChange(e.target.value)}
              error={latitude !== null && (latitude < 17.7 || latitude > 18.5) ? 'Must be within Jamaica bounds' : undefined}
              required={required}
              size={isMobile ? "md" : "sm"}
              styles={{
                input: {
                  fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
                  minHeight: isMobile ? '44px' : undefined,
                },
              }}
            />
            <TextInput
              label="Longitude"
              placeholder="-77.2975"
              value={longitude?.toString() || ''}
              onChange={(e) => handleLongitudeChange(e.target.value)}
              error={longitude !== null && (longitude < -78.5 || longitude > -76.2) ? 'Must be within Jamaica bounds' : undefined}
              required={required}
              size={isMobile ? "md" : "sm"}
              styles={{
                input: {
                  fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
                  minHeight: isMobile ? '44px' : undefined,
                },
              }}
            />
          </Group>
        )}
      </Stack>

      {/* Error Message */}
      {error && (
        <Text size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </div>
  );
}

