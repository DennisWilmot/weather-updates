'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Alert,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
  Select
} from '@mantine/core';
import {
  IconMap,
  IconRefresh,
  IconInfoCircle
} from '@tabler/icons-react';

interface StormPosition {
  lat: number;
  lon: number;
  name: string;
  windSpeed: string;
  movement?: {
    direction: string;
    speed: string;
  };
}

interface HurricaneMapProps {
  className?: string;
  stormPosition?: StormPosition;
}

export default function HurricaneMap({ className, stormPosition }: HurricaneMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [overlay, setOverlay] = useState<string>('wind'); // wind, rain, radar, satellite
  const [loading, setLoading] = useState(true);

  // Generate Windy URL based on overlay selection
  const getWindyUrl = () => {
    const lat = stormPosition?.lat || 18.1;
    const lon = stormPosition?.lon || -76.8;
    const zoom = 6;

    // Note: Windy.com embed handles its own touch interactions
    // The iframe will allow panning in all directions by default
    return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=520&zoom=${zoom}&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=true&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`;
  };

  const refreshMap = () => {
    // Reload iframe to get latest data
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    // Set initial load time
    setLastUpdated(new Date());
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder className={className}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconMap size={24} color="#1f77b4" />
            <Title order={3} c="blue.6">Hurricane Melissa Tracking</Title>
          </Group>
          
          <Group gap="sm">
            <Tooltip label="Refresh map data">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={refreshMap}
                loading={loading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            
            {lastUpdated && (
              <Badge color="blue" variant="light" size="sm">
                Updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
          </Group>
        </Group>

        {/* Map Controls */}
        <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
          <Group justify="space-between" align="center">
            <Text size="sm" fw={600} c="dimmed">Weather Layer</Text>
            <Select
              value={overlay}
              onChange={(value) => setOverlay(value || 'wind')}
              data={[
                { value: 'wind', label: 'Wind' },
                { value: 'rain', label: 'Rain' },
                { value: 'radar', label: 'Radar' },
                { value: 'satellite', label: 'Satellite' },
                { value: 'clouds', label: 'Clouds' },
                { value: 'temp', label: 'Temperature' },
                { value: 'pressure', label: 'Pressure' }
              ]}
              size="sm"
              style={{ width: 150 }}
            />
          </Group>
        </Card>

        {/* Storm Position Info */}
        {stormPosition && (
          <Card withBorder padding="sm" style={{ backgroundColor: '#fff5f5' }}>
            <Group gap="md">
              <Badge color="red" size="lg">Storm Position</Badge>
              <Text size="sm">
                <strong>{stormPosition.name}</strong> • {stormPosition.windSpeed} • {stormPosition.movement?.direction} at {stormPosition.movement?.speed}
              </Text>
            </Group>
          </Card>
        )}

        {/* Map Container */}
        <div style={{ 
          position: 'relative', 
          height: '520px', 
          borderRadius: '8px', 
          overflow: 'hidden',
          // Enable touch interactions on mobile
          touchAction: 'pan-x pan-y pinch-zoom',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading && (
            <Center style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1000 }}>
              <Stack align="center" gap="sm">
                <Loader size="lg" color="blue" />
                <Text c="dimmed">Loading weather map...</Text>
              </Stack>
            </Center>
          )}

          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={getWindyUrl()}
            frameBorder="0"
            style={{ 
              borderRadius: '8px',
              // Enable touch events in iframe
              touchAction: 'pan-x pan-y pinch-zoom',
              pointerEvents: 'auto',
              // Prevent text selection interference
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
            allow="geolocation"
            allowFullScreen
            title="Hurricane Tracking Map - Windy.com"
          />
        </div>

        {/* Information */}
        <Alert color="blue" title="About This Map" icon={<IconInfoCircle />}>
          <Stack gap="xs">
            <Text size="sm">
              This interactive weather map shows real-time wind patterns, radar, satellite imagery, and more around Jamaica. The map automatically centers on the storm position when available.
            </Text>
            <Text size="xs" c="dimmed">
              Data source: Windy.com • Real-time weather data updated continuously
            </Text>
          </Stack>
        </Alert>
      </Stack>
    </Card>
  );
}
