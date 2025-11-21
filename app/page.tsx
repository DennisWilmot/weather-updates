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
  IconUser,
  IconMapPin,
  IconBox,
} from '@tabler/icons-react';
import Image from 'next/image';
import maplibregl from 'maplibre-gl';
import EnhancedMap from '@/components/EnhancedMap';
import MapLayerPanel from '@/components/MapLayerPanel';
import MapFilters from '@/components/MapFilters';
import StatisticsPanel from '@/components/dashboard/StatisticsPanel';
import { useMapLayerManager } from '@/components/MapLayerManager';
import { MapFilters as MapFiltersType, deserializeFilters, serializeFilters } from '@/lib/maps/filters';
import { createRealtimeConnection, ConnectionStatus } from '@/lib/maps/realtime';
import { LayerConfig } from '@/lib/maps/layer-types';
import { transformToGeoJSON } from './../components/transform';
import { generatePopupHTML } from './../components/mapPopUp';
import DashboardNavigation from '@/components/DashboardNavigation';

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
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['people', 'places', 'assets']));
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

  const setCategoryVisibility = (category: string, visible: boolean) => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const ids = [
      category,                    // base layer
      `${category}-cluster`,       // clusters
      `${category}-cluster-count`  // cluster numbers
    ];

    ids.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    });
  };

  // Handle map load
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    setMapInstance(map);
    setMapLoaded(true);

    map.on('dblclick', (e) => {
      map.easeTo({
        center: e.lngLat,
        zoom: map.getZoom() + 400,
        duration: 500,
      });
    });




    // Add click handlers for each layer
    const setupClickHandlers = () => {
      ['people', 'places', 'assets'].forEach(layerId => {
        map.on('click', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const properties = feature.properties || {};
            const layer = properties.layer as 'people' | 'places' | 'assets';

            if (!layer) return;

            // Create popup
            const popupHTML = generatePopupHTML(properties, layer);

            new maplibregl.Popup()
              .setLngLat((feature.geometry as any).coordinates)
              .setHTML(popupHTML)
              .addTo(map);
          }
        });

        // Change cursor on hover
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      // Handle cluster clicks
      ['people', 'places', 'assets'].forEach(layerId => {
        map.on('click', layerId, (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [layerId]
          });

          if (features.length > 0) {
            const clusterId = features[0].properties?.cluster_id;

            if (clusterId) {
              const source = map.getSource(layerId) as maplibregl.GeoJSONSource;
              // getClusterExpansionZoom now takes only the clusterId and returns a Promise in maplibregl >=3.0
              const getExpansionZoom = (src: maplibregl.GeoJSONSource, cid: number) => {
                // Fallback for both callback and promise APIs
                if (typeof src.getClusterExpansionZoom === 'function') {
                  try {
                    // Check if API returns a Promise
                    const res = src.getClusterExpansionZoom(cid);
                    if (res && typeof (res as Promise<number>).then === 'function') {
                      // Promise API
                      (res as Promise<number>).then((zoom) => {
                        map.easeTo({
                          center: (features[0].geometry as any).coordinates,
                          zoom: zoom || map.getZoom() + 2,
                        });
                      }).catch((err) => {
                        // handle error if promise rejected
                        // optionally log error
                      });
                      return;
                    }
                  } catch (e) {
                    // fallback
                  }
                  // Fallback to callback API
                  (src.getClusterExpansionZoom as any)(cid, (err: any, zoom: any) => {
                    if (err) return;
                    map.easeTo({
                      center: (features[0].geometry as any).coordinates,
                      zoom: zoom || map.getZoom() + 2,
                    });
                  });
                }
              };

              getExpansionZoom(source, clusterId);
            }
          }
        });
      });
    };

    // Setup click handlers after a brief delay to ensure layers are added
    setTimeout(setupClickHandlers, 500);
  }, []);

  // Initialize layers
  useEffect(() => {
    if (!mapLoaded || !manager || !mapInstance) return;

    // Create layer configurations
    const layerConfigs: LayerConfig[] = [];

    // Define base layers with colors and icons
    const baseLayerDefs = [
      { id: 'people', name: 'People', color: '#FF6B6B', icon: 'user', endpoint: '/api/people' },
      { id: 'places', name: 'Places', color: '#4ECDC4', icon: 'map-pin', endpoint: '/api/places' },
      { id: 'assets', name: 'Assets', color: '#45B7D1', icon: 'box', endpoint: '/api/assets' },
    ];

    baseLayerDefs.forEach(({ id, name, color, icon, endpoint }) => {
      const sourceId = id;

      // Add source with empty GeoJSON (only once per source)
      if (!mapInstance.getSource(sourceId)) {
        addSource(sourceId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14,
        });
      }

      // Register layer with clustering support
      const config: LayerConfig = {
        id,
        name,
        type: 'circle',
        sourceId,
        style: {
          type: 'circle',
          paint: {
            'circle-radius': [
              'case',
              ['has', 'point_count'],
              ['interpolate', ['linear'], ['get', 'point_count'], 10, 20, 100, 30, 500, 40],
              8
            ],
            'circle-color': color,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.8,
          },
        },
        metadata: {
          icon,
          color,
          endpoint,
        },
        visible: true,
      };

      registerLayer(config);
      layerConfigs.push(config);

      // Add cluster count layer
      if (mapInstance) {
        const clusterCountLayerId = `${id}-cluster-count`;
        if (!mapInstance.getLayer(clusterCountLayerId)) {
          mapInstance.addLayer({
            id: clusterCountLayerId,
            type: 'symbol',
            source: sourceId,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: {
              'text-color': '#ffffff',
            },
          });
        }
      }
    });

    setActiveLayers(layerConfigs);
  }, [mapLoaded, manager, mapInstance, addSource, registerLayer]);

  // Load layer data when visibility changes or filters change
  useEffect(() => {
    if (!mapLoaded || !mapInstance) return;

    const loadLayerData = async (layerId: string) => {
      setLoadingLayers((prev) => new Set(prev).add(layerId));

      try {
        const layer = activeLayers.find(l => l.id === layerId);
        const endpoint = layer?.metadata?.endpoint;
        if (!endpoint) {
          console.warn(`No endpoint for layer: ${layerId}`);
          return;
        }

        // Build query params from filters
        const params = new URLSearchParams();

        if (filters.dateRange) {
          params.set('startDate', filters.dateRange.start.toISOString());
          params.set('endDate', filters.dateRange.end.toISOString());
        }
        if (filters.locations?.parishIds && filters.locations.parishIds.length > 0) {
          params.set('parishId', filters.locations.parishIds[0]);
        }
        if (filters.locations?.communityIds && filters.locations.communityIds.length > 0) {
          params.set('communityId', filters.locations.communityIds[0]);
        }

        const url = `${(layer?.metadata as { endpoint?: string })?.endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
        console.log(`Loading data for ${layerId} from ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData = await response.json();
        console.log(`Received API data for ${layerId}:`, apiData);

        // Transform API response to GeoJSON
        const geoJSON = transformToGeoJSON(apiData, layerId as 'people' | 'places' | 'assets');
        console.log(`Transformed to ${geoJSON.features?.length || 0} features for ${layerId}`);

        // Update layer data
        if (mapRef.current && manager) {
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

    // Load data for all visible layers
    visibleLayers.forEach((layerId) => {
      loadLayerData(layerId);
    });
  }, [visibleLayers, filters, mapLoaded, activeLayers, mapInstance, manager, updateLayerData]);

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
      setCategoryVisibility(layerId, visible);

    }
  }, [manager, setLayerVisibility]);

  // Handle filter change
  const handleFiltersChange = useCallback((newFilters: MapFiltersType) => {
    setFilters(newFilters);

    // Update URL with filters
    const params = serializeFilters(newFilters);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  }, [router]);

  // Initialize real-time connection
  useEffect(() => {
    if (!mapLoaded || visibleLayers.size === 0) return;

    // Get subscribed layer types
    const subscribedLayers = Array.from(visibleLayers)
      .filter((layerId): layerId is 'assets' | 'places' | 'people' =>
        ['assets', 'places', 'people'].includes(layerId)
      );

    if (subscribedLayers.length === 0) return;

    // Create real-time connection
    const connection = createRealtimeConnection({
      layers: subscribedLayers as ('assets' | 'places' | 'people' | 'aid_workers')[],
      onUpdate: (event) => {
        console.log('Real-time update:', event);
        // Reload the updated layer
        if (visibleLayers.has(event.layerType)) {
          // Trigger reload by clearing loading state
          setLoadingLayers((prev) => new Set(prev).add(event.layerType));
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
  }, [mapLoaded, visibleLayers]);

  // Get visible layer configs for legend and stats
  const visibleLayerConfigs = activeLayers.filter((layer) =>
    visibleLayers.has(layer.id)
  );

  return (
    <>
      {/* Header */}


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
          height: 'calc(100vh - 9.28vh)',
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

            {/* Legend */}
            <div style={{ padding: '16px', flexShrink: 0, borderTop: '1px solid #e9ecef' }}>
              <Text size="sm" fw={600} mb="xs">Legend</Text>
              <Stack gap="xs">
                {activeLayers.map(layer => (
                  <Group key={layer.id} gap="xs">
                    <Box
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: layer.metadata?.color || '#666',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Text size="sm">{layer.name}</Text>
                    {layerCounts.has(layer.id) && (
                      <Badge size="xs" color="gray" variant="light">
                        {layerCounts.get(layer.id)}
                      </Badge>
                    )}
                  </Group>
                ))}
              </Stack>
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

          {/* Legend in mobile drawer */}
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #e9ecef' }}>
            <Text size="sm" fw={600} mb="xs">Legend</Text>
            <Stack gap="xs">
              {activeLayers.map(layer => (
                <Group key={layer.id} gap="xs">
                  <Box
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: layer.metadata?.color || '#666',
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Text size="sm">{layer.name}</Text>
                  {layerCounts.has(layer.id) && (
                    <Badge size="xs" color="gray" variant="light">
                      {layerCounts.get(layer.id)}
                    </Badge>
                  )}
                </Group>
              ))}
            </Stack>
          </Box>
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
    <>
      <DashboardNavigation />

      <Suspense fallback={<div>Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </>
  );
}