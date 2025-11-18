/**
 * Dashboard Page - Main map dashboard with all layers and controls
 * Integrates EnhancedMap, MapLayerPanel, MapFilters, and StatisticsPanel
 */

'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Group,
  Button,
  Burger,
  Drawer,
  Stack,
  Title,
  Badge,
  ActionIcon,
  Paper,
  Text,
  Collapse,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconX,
  IconFilter,
  IconStack,
  IconChartBar,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import Image from 'next/image';
import maplibregl from 'maplibre-gl';
import EnhancedMap from '@/components/EnhancedMap';
import MapLayerPanel from '@/components/MapLayerPanel';
import MapFilters from '@/components/MapFilters';
import StatisticsPanel from '@/components/dashboard/StatisticsPanel';
import { useMapLayerManager } from '@/components/MapLayerManager';
import { layerHierarchy, getAllLayerIds } from '@/lib/maps/layer-hierarchy';
import { MapFilters as MapFiltersType, deserializeFilters, serializeFilters } from '@/lib/maps/filters';
import { createRealtimeConnection, ConnectionStatus } from '@/lib/maps/realtime';
import { LayerConfig } from '@/lib/maps/layer-types';
import { isHeatmapLayer, getHeatmapApiEndpoint, createHeatmapLayerFromId, getHeatmapSourceId } from '@/lib/maps/heatmap-layers';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  // UI State
  const [layersDrawerOpened, { open: openLayersDrawer, close: closeLayersDrawer }] = useDisclosure(false);
  const [filtersDrawerOpened, { open: openFiltersDrawer, close: closeFiltersDrawer }] = useDisclosure(false);
  const [mobileMenuOpened, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);
  const [filtersExpanded, { toggle: toggleFiltersExpanded }] = useDisclosure(true);

  // Map State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [layerCounts, setLayerCounts] = useState<Map<string, number>>(new Map());
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set());
  const [activeLayers, setActiveLayers] = useState<LayerConfig[]>([]);

  // MapLayerManager hook
  const {
    manager,
    registerLayer,
    setLayerVisibility,
    addSource,
    updateLayerData,
  } = useMapLayerManager(mapInstance);

  // Filter State
  const [filters, setFilters] = useState<MapFiltersType>(() => {
    // Initialize from URL params
    if (typeof window !== 'undefined') {
      return deserializeFilters(new URLSearchParams(window.location.search));
    }
    return {};
  });

  // Real-time State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const realtimeConnectionRef = useRef<ReturnType<typeof createRealtimeConnection> | null>(null);

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = deserializeFilters(new URLSearchParams(searchParams.toString()));
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams]);

  // Handle map load
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    setMapInstance(map);
    setMapLoaded(true);
  }, []);

  // Initialize layers from hierarchy
  useEffect(() => {
    if (!mapLoaded || !manager) return;

    // Create layer configurations from hierarchy
    const layerConfigs: LayerConfig[] = [];
    const allLayerIds = getAllLayerIds(layerHierarchy);

    allLayerIds.forEach((layerId) => {
      // Check if this is a heatmap layer
      if (isHeatmapLayer(layerId)) {
        const sourceId = getHeatmapSourceId(layerId);
        
        // Add source with empty GeoJSON for heatmap
        if (!mapInstance?.getSource(sourceId)) {
          addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });
        }

        // Create heatmap layer config
        const config = createHeatmapLayerFromId(layerId, sourceId);
        config.visible = false;
        
        registerLayer(config);
        layerConfigs.push(config);
      } else {
        // Regular layer handling
        // Determine source ID based on layer ID
        let sourceId = layerId;

        // Map layer IDs to source IDs
        if (layerId.startsWith('assets-')) {
          sourceId = 'assets';
        } else if (layerId.startsWith('places-')) {
          sourceId = 'places';
        } else if (layerId.startsWith('people-')) {
          sourceId = 'people';
        } else if (layerId.startsWith('aid_workers-')) {
          sourceId = 'aid-workers';
        }

        // Add source with empty GeoJSON (only once per source)
        if (!mapInstance?.getSource(sourceId)) {
          addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: sourceId === 'assets' || sourceId === 'places',
            clusterRadius: 50,
            clusterMaxZoom: 14,
          });
        }

        // Register layer
        const config: LayerConfig = {
          id: layerId,
          name: layerId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          type: 'circle',
          sourceId,
          style: {
            type: 'circle',
            paint: {
              'circle-radius': 8,
              'circle-color': '#666',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          },
          metadata: {
            icon: 'circle',
            color: '#666',
          },
          visible: false,
        };

        registerLayer(config);
        layerConfigs.push(config);
      }
    });

    setActiveLayers(layerConfigs);
  }, [mapLoaded, manager, mapInstance, addSource, registerLayer]);

  // Load layer data when visibility changes
  useEffect(() => {
    if (!mapLoaded || visibleLayers.size === 0) return;

    const loadLayerData = async (layerId: string) => {
      setLoadingLayers((prev) => new Set(prev).add(layerId));

      try {
        // Map layer ID to API endpoint
        const apiMap: Record<string, string> = {
          'assets': '/api/assets?format=geojson',
          'places': '/api/places?format=geojson',
          'people': '/api/people?format=geojson',
          'people-needs': '/api/people/needs?format=geojson',
          'aid-workers': '/api/aid-workers/capabilities?format=geojson',
          'asset-distributions': '/api/asset-distributions?format=geojson',
          'place-status': '/api/places/status?format=geojson',
        };

        // Check if this is a heatmap layer
        let endpoint = '';
        if (isHeatmapLayer(layerId)) {
          // Get heatmap-specific endpoint
          const heatmapEndpoint = getHeatmapApiEndpoint(layerId);
          if (!heatmapEndpoint) {
            console.warn(`No API endpoint for heatmap layer: ${layerId}`);
            return;
          }
          endpoint = `${heatmapEndpoint}?format=geojson&heatmap=true`;
        } else {
          // Regular layer endpoint
          if (layerId.startsWith('assets-')) {
            const assetType = layerId.replace('assets-', '');
            endpoint = `/api/assets?format=geojson&type=${assetType}`;
          } else if (layerId.startsWith('places-')) {
            const placeType = layerId.replace('places-', '');
            endpoint = `/api/places?format=geojson&type=${placeType}`;
          } else {
            endpoint = apiMap[layerId] || apiMap[layerId.split('-')[0]];
          }
        }

        if (!endpoint) {
          console.warn(`No API endpoint for layer: ${layerId}`);
          return;
        }

        // Add filter params
        const params = new URLSearchParams();
        if (filters.dateRange) {
          params.set('startDate', filters.dateRange.start.toISOString());
          params.set('endDate', filters.dateRange.end.toISOString());
        }
        if (filters.locations?.parishIds) {
          params.set('parishId', filters.locations.parishIds[0]);
        }
        if (filters.locations?.communityIds) {
          params.set('communityId', filters.locations.communityIds[0]);
        }

        const url = endpoint + (params.toString() ? `&${params.toString()}` : '');
        const response = await fetch(url);
        const geoJSON = await response.json();

        // Update layer data
        if (mapRef.current && manager) {
          const sourceId = isHeatmapLayer(layerId) 
            ? getHeatmapSourceId(layerId)
            : activeLayers.find((l) => l.id === layerId)?.sourceId || layerId;
          updateLayerData(layerId, geoJSON);

          // Update count
          const count = geoJSON.features?.length || 0;
          setLayerCounts((prev) => {
            const next = new Map(prev);
            next.set(layerId, count);
            return next;
          });
        }
      } catch (error) {
        console.error(`Error loading data for layer ${layerId}:`, error);
      } finally {
        setLoadingLayers((prev) => {
          const next = new Set(prev);
          next.delete(layerId);
          return next;
        });
      }
    };

    // Load data for newly visible layers
    visibleLayers.forEach((layerId) => {
      if (!layerCounts.has(layerId)) {
        loadLayerData(layerId);
      }
    });
  }, [visibleLayers, filters, mapLoaded, activeLayers]);

  // Handle layer toggle
  const handleLayerToggle = useCallback((layerId: string, visible: boolean) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (visible) {
        next.add(layerId);
      } else {
        next.delete(layerId);
      }
      return next;
    });

    // Update map layer visibility
    if (mapRef.current && manager) {
      setLayerVisibility(layerId, visible);
    }
  }, [manager, setLayerVisibility]);

  // Handle filter change
  const handleFiltersChange = useCallback((newFilters: MapFiltersType) => {
    setFilters(newFilters);
    
    // Update URL with filters
    const params = serializeFilters(newFilters);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });

    // Reload visible layers with new filters
    setLayerCounts(new Map()); // Clear counts to trigger reload
  }, [router]);

  // Initialize real-time connection
  useEffect(() => {
    if (!mapLoaded || visibleLayers.size === 0) return;

    // Get subscribed layer types
    const subscribedLayers = Array.from(visibleLayers)
      .map((layerId) => {
        if (layerId.startsWith('assets')) return 'assets' as const;
        if (layerId.startsWith('places')) return 'places' as const;
        if (layerId.startsWith('people')) return 'people' as const;
        if (layerId.startsWith('aid')) return 'aid_workers' as const;
        return null;
      })
      .filter((l): l is 'assets' | 'places' | 'people' | 'aid_workers' => l !== null);

    if (subscribedLayers.length === 0) return;

    // Create real-time connection
    const connection = createRealtimeConnection({
      layers: subscribedLayers,
      onUpdate: (event) => {
        // Handle update event
        if (mapRef.current && manager) {
          // Map layerType to layerId and update
          console.log('Real-time update:', event);
          // Reload layer data when updates arrive
          const layerIdMap: Record<string, string> = {
            assets: 'assets',
            places: 'places',
            people: 'people',
            aid_workers: 'aid-workers',
            distributions: 'asset-distributions',
            needs: 'people-needs',
            status: 'place-status',
          };
          const layerId = layerIdMap[event.layerType];
          if (layerId && visibleLayers.has(layerId)) {
            // Trigger reload by clearing count
            setLayerCounts((prev) => {
              const next = new Map(prev);
              next.delete(layerId);
              return next;
            });
          }
        }
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    realtimeConnectionRef.current = connection;

    return () => {
      connection.disconnect();
    };
  }, [mapLoaded, visibleLayers, manager]);

  // Get visible layer configs for legend and stats
  const visibleLayerConfigs = activeLayers.filter((layer) =>
    visibleLayers.has(layer.id)
  );

  return (
    <>
      {/* Header */}
      <Box
        style={{
          backgroundColor: '#0f0f23',
          borderBottom: '2px solid #1478FF',
          height: '14.28vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container size="xl" style={{ width: '100%' }}>
          <Flex align="center" justify="space-between" gap="lg">
            {/* Mobile Menu */}
            <Burger
              opened={mobileMenuOpened}
              onClick={toggleMobileMenu}
              color="white"
              size="sm"
              hiddenFrom="sm"
            />

            {/* Logo */}
            <Image
              src="/White_Icon_Blue_Bkg-removebg-preview.png"
              alt="Atlas.TM"
              width={40}
              height={40}
              style={{ objectFit: 'contain' }}
            />

            {/* Title */}
            <Title
              order={1}
              c="white"
              fw={800}
              size="xl"
              style={{ flex: '1 1 auto', textAlign: 'center' }}
            >
              Atlas.TM Dashboard
            </Title>

            {/* Connection Status */}
            <Badge
              color={
                connectionStatus === 'connected'
                  ? 'green'
                  : connectionStatus === 'connecting'
                  ? 'yellow'
                  : 'red'
              }
              size="lg"
              visibleFrom="sm"
            >
              {connectionStatus === 'connected'
                ? '● Live'
                : connectionStatus === 'connecting'
                ? '● Connecting'
                : '● Offline'}
            </Badge>

            {/* Mobile Actions */}
            <Group gap="xs" hiddenFrom="md">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={openLayersDrawer}
              >
                <IconStack size={20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={openFiltersDrawer}
              >
                <IconFilter size={20} />
              </ActionIcon>
            </Group>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer
        opened={mobileMenuOpened}
        onClose={closeMobileMenu}
        title="Navigation"
        position="left"
        size="sm"
        hiddenFrom="sm"
      >
        <Stack gap="md">
          <Button
            variant="subtle"
            fullWidth
            leftSection={<IconStack size={18} />}
            onClick={() => {
              openLayersDrawer();
              closeMobileMenu();
            }}
          >
            Layers
          </Button>
          <Button
            variant="subtle"
            fullWidth
            leftSection={<IconFilter size={18} />}
            onClick={() => {
              openFiltersDrawer();
              closeMobileMenu();
            }}
          >
            Filters
          </Button>
        </Stack>
      </Drawer>

      {/* Main Content */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 14.28vh)',
          overflow: 'hidden',
        }}
      >
        {/* Map */}
        <Box 
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
          }}
        >
          <EnhancedMap
            onMapLoad={handleMapLoad}
            initialLayers={activeLayers}
          />
        </Box>

        {/* Floating Desktop Panels */}
        <Box
          visibleFrom="md"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            bottom: '20px',
            width: '320px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Paper
            p={0}
            withBorder
            shadow="lg"
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              backgroundColor: 'white',
            }}
          >
            <div style={{ padding: '16px', flexShrink: 0, borderBottom: '1px solid #e9ecef' }}>
              <Text size="lg" fw={600}>
                Map Layers
              </Text>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                minHeight: 0,
                padding: '16px',
              }}
            >
              <MapLayerPanel
                visibleLayers={visibleLayers}
                layerCounts={layerCounts}
                loadingLayers={loadingLayers}
                onLayerToggle={handleLayerToggle}
              />
            </div>
          </Paper>
        </Box>

        <Box
          visibleFrom="md"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            ...(filtersExpanded ? { bottom: '20px' } : {}),
            width: filtersExpanded ? '320px' : '280px',
            maxHeight: filtersExpanded ? 'calc(100vh - 14.28vh - 40px)' : 'auto',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Paper
            p={filtersExpanded ? 0 : "md"}
            withBorder
            shadow="lg"
            style={{
              display: 'flex',
              flexDirection: 'column',
              ...(filtersExpanded ? { flex: 1, minHeight: 0 } : {}),
              backgroundColor: 'white',
            }}
          >
            {filtersExpanded ? (
              <>
                {/* Collapsible Header */}
                <div
                  style={{
                    padding: '16px',
                    flexShrink: 0,
                    borderBottom: '1px solid #e9ecef',
                    cursor: 'pointer',
                  }}
                  onClick={toggleFiltersExpanded}
                >
                  <Group justify="space-between" gap="xs">
                    <Group gap="xs">
                      <IconFilter size={20} />
                      <Text size="lg" fw={600}>
                        Filters
                      </Text>
                    </Group>
                    <IconChevronUp size={16} />
                  </Group>
                </div>

                {/* Collapsible Content */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '16px',
                  }}
                >
                  <MapFilters filters={filters} onFiltersChange={handleFiltersChange} hideHeader />
                </div>
              </>
            ) : (
              <Group
                justify="space-between"
                gap="xs"
                style={{ cursor: 'pointer' }}
                onClick={toggleFiltersExpanded}
              >
                <Group gap="xs">
                  <IconFilter size={20} />
                  <Text size="lg" fw={600}>
                    Filters
                  </Text>
                </Group>
                <IconChevronDown size={16} />
              </Group>
            )}
          </Paper>
        </Box>

        {/* Mobile Drawers */}
        <Drawer
          opened={layersDrawerOpened}
          onClose={closeLayersDrawer}
          title="Map Layers"
          position="left"
          size="sm"
          hiddenFrom="md"
        >
          <MapLayerPanel
            visibleLayers={visibleLayers}
            layerCounts={layerCounts}
            loadingLayers={loadingLayers}
            onLayerToggle={handleLayerToggle}
          />
        </Drawer>

        <Drawer
          opened={filtersDrawerOpened}
          onClose={closeFiltersDrawer}
          title="Filters"
          position="right"
          size="sm"
          hiddenFrom="md"
        >
          <MapFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </Drawer>

        {/* Floating Statistics Panel */}
        <Box
          style={{
            position: 'absolute',
            top: '20px',
            left: '360px',
            zIndex: 1001,
            width: '280px',
            maxHeight: 'calc(100vh - 40px)',
          }}
          visibleFrom="md"
        >
          <Paper p="md" withBorder shadow="lg" style={{ backgroundColor: 'white', maxHeight: '100%', overflowY: 'auto' }}>
            <StatisticsPanel activeLayers={visibleLayerConfigs} filters={filters} />
          </Paper>
        </Box>

        <Box
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1001,
            width: '280px',
          }}
          hiddenFrom="md"
        >
          <Paper p="md" withBorder shadow="lg" style={{ backgroundColor: 'white' }}>
            <StatisticsPanel activeLayers={visibleLayerConfigs} filters={filters} />
          </Paper>
        </Box>

      </Box>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

