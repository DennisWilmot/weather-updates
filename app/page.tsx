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
import { ChevronUp, Filter, ChevronDown, Zap, ChevronLeft, X, ChevronRight, Users, Briefcase } from 'lucide-react';
import AIMatchingPanel from '@/components/AIMatchingPanel';


import type { Shipment } from '@/lib/types/planning';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<maplibregl.Map | null>(null);

  // UI State
  const [layersDrawerOpened, { open: openLayersDrawer, close: closeLayersDrawer }] = useDisclosure(false);
  const [filtersDrawerOpened, { open: openFiltersDrawer, close: closeFiltersDrawer }] = useDisclosure(false);
  const [mobileMenuOpened, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);
  // const [filtersExpanded, { toggle: toggleFiltersExpanded }] = useDisclosure(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)



  // Map State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['people', 'places', 'assets']));
  const [layerCounts, setLayerCounts] = useState<Map<string, number>>(new Map());
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set());
  const [activeLayers, setActiveLayers] = useState<LayerConfig[]>([]);
  const [layerRawData, setLayerRawData] = useState<Record<string, any[]>>({});
  const [layers, setLayers] = useState<any[]>([]);
  const [subTypeFilters, setSubTypeFilters] = useState<Record<string, Set<string>>>({});


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

  const getIcon = (layerId: string) => {
    switch (layerId) {
      case 'people':
        return <Users size={20} />;
      case 'assets':
        return <Box size={20} />;
      case 'skills':
        return <Briefcase size={20} />;
      default:
        return null;
    }
  };

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


  // LOCAL FILTERING when subtype toggles
  useEffect(() => {
    if (!mapLoaded || !manager || !mapRef.current) return;

    Object.keys(layerRawData).forEach(layerId => {
      const fullRows = layerRawData[layerId];
      if (!fullRows) return;

      const disabledSubTypes = subTypeFilters[layerId];
      const dateRange = filters?.dateRange;
      console.log("DATE R ", dateRange)

      let filteredRows = [...fullRows];

      // 1. Subtype filtering
      if (disabledSubTypes && disabledSubTypes.size > 0) {
        filteredRows = filteredRows.filter(row => !disabledSubTypes.has(row.type));
      }

      // 2. Local date filtering
      if (dateRange) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        filteredRows = filteredRows.filter(row => {
          console.log(row, "ROWWW")
          const rowDate = new Date(row.createdAt);
          return rowDate >= start && rowDate <= end;
        });

        console.log(filteredRows, "FILTERD")
      }

      // Convert → GeoJSON
      const filteredGeoJSON = transformToGeoJSON(
        { [layerId]: filteredRows },
        layerId as 'people' | 'places' | 'assets'
      );

      updateLayerData(layerId, filteredGeoJSON);

      setLayerCounts(prev => {
        const next = new Map(prev);
        next.set(layerId, filteredRows.length);
        return next;
      });
    });
  }, [subTypeFilters, filters?.dateRange, layerRawData, mapLoaded, manager, updateLayerData]);

  const toggleSubType = (layerId: string, subTypeId: string) => {
    setSubTypeFilters(prev => {
      const currentSet = prev[layerId] ? new Set(prev[layerId]) : new Set<string>();

      if (currentSet.has(subTypeId)) {
        // Re-enable this subtype
        currentSet.delete(subTypeId);
      } else {
        // Disable this subtype
        currentSet.add(subTypeId);
      }

      return {
        ...prev,
        [layerId]: currentSet,
      };
    });
  };


  const toggleLayer = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, enabled: !layer.enabled }
          : layer
      )
    );

    const isEnabled =
      !layers.find(layer => layer.id === layerId)?.enabled;

    // Call existing function to update map visibility
    handleLayerToggle(layerId, isEnabled);
  };


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

  useEffect(() => {
    if (!activeLayers.length) return;

    const newLayers = activeLayers.map(layer => {
      const layerId = layer.id;
      const rows = layerRawData[layerId] || [];

      // collect distinct types from DB rows
      const subtypeMap = new Map<string, { id: string; name: string; color: string }>();

      rows.forEach(item => {
        if (!item.type) return;
        if (!subtypeMap.has(item.type)) {
          subtypeMap.set(item.type, {
            id: item.type,
            name: item.type.replace(/_/g, ' ').replace(/\b\w/g, (c: any) => c.toUpperCase()),
            color: layer.metadata?.color ?? '#666',
          });
        }
      });

      const disabledSet = subTypeFilters[layerId] ?? new Set<string>();

      return {
        id: layer.id,
        name: layer.name,
        color: layer.metadata?.color,
        enabled: visibleLayers.has(layerId),
        expanded: true,
        count: layerCounts.get(layerId) || 0,
        subTypes: Array.from(subtypeMap.values()).map(sub => ({
          ...sub,
          // UI enabled if NOT in the disabled set
          enabled: !disabledSet.has(sub.id),
        })),
      };
    });

    setLayers(newLayers);
  }, [activeLayers, layerRawData, layerCounts, visibleLayers, subTypeFilters]);

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

        console.log(apiData, "DAATAA")

        let rows = apiData[layerId] || apiData.data || apiData || [];

        // Transform filtered rows into GeoJSON
        const geoJSON = transformToGeoJSON({ [layerId]: rows }, layerId as 'people' | 'places' | 'assets');

        setLayerRawData(prev => ({
          ...prev,
          [layerId]: apiData[layerId] || apiData.data || apiData || [],
        }));


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
  }, [visibleLayers, mapLoaded, activeLayers, mapInstance, manager, updateLayerData]);

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
    // const params = serializeFilters(newFilters);
    // router.push(`/dashboard?${params.toString()}`, { scroll: false });
  }, [router]);

  // expand/collapse toggle per layer
  const toggleLayerExpand = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, expanded: !layer.expanded }
          : layer
      )
    );
  };

  // ---- SHIPMENT DRAWING LAYER ----
  const handleMatchSelect = useCallback(async (shipment: Shipment & { fromWarehouseCoords?: { lat: number; lng: number }; toCommunityCoords?: { lat: number; lng: number } }) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    try {
      let warehouseCoords: [number, number] | null = null;
      let communityCoords: [number, number] | null = null;

      // First check if coordinates are already in the shipment (from AIMatchingPanel)
      if (shipment.fromWarehouseCoords && shipment.toCommunityCoords) {
        warehouseCoords = [shipment.fromWarehouseCoords.lng, shipment.fromWarehouseCoords.lat];
        communityCoords = [shipment.toCommunityCoords.lng, shipment.toCommunityCoords.lat];
      } else {
        // Try to find in layer data (for performance)
        const warehouseLayer = layers.find(l => l.id === 'warehouses');
        const warehouse = warehouseLayer?.data?.features?.find(
          (f: any) => f.properties?.id === shipment.fromWarehouseId
        );

        const communityLayer = layers.find(l => l.id === 'communities');
        const community = communityLayer?.data?.features?.find(
          (f: any) => f.properties?.id === shipment.toCommunityId
        );

        // If found in layers, use those coordinates
        if (warehouse && community) {
          warehouseCoords = warehouse.geometry.coordinates;
          communityCoords = community.geometry.coordinates;
        } else {
          // Otherwise, fetch from API
          const [warehouseRes, communityRes] = await Promise.all([
            fetch(`/api/warehouses/${shipment.fromWarehouseId}`).catch(() => null),
            fetch(`/api/communities/${shipment.toCommunityId}`).catch(() => null),
          ]);

          if (warehouseRes?.ok) {
            const warehouseData = await warehouseRes.json();
            warehouseCoords = [
              parseFloat(warehouseData.longitude || warehouseData.coordinates?.lng || '0'),
              parseFloat(warehouseData.latitude || warehouseData.coordinates?.lat || '0'),
            ];
          }

          if (communityRes?.ok) {
            const communityData = await communityRes.json();
            communityCoords = [
              parseFloat(communityData.longitude || communityData.coordinates?.lng || '0'),
              parseFloat(communityData.latitude || communityData.coordinates?.lat || '0'),
            ];
          }
        }
      }

      if (!warehouseCoords || !communityCoords) {
        console.warn('Could not find warehouse or community coordinates for shipment', shipment);
        return;
      }

      // Build LineString from warehouse to community
      const coords = [
        warehouseCoords,
        communityCoords
      ];

      // Create GeoJSON for line
      const lineGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coords
            },
            properties: {
              shipment: shipment,
            }
          }
        ]
      };

      // Create GeoJSON for markers (warehouse and community)
      const markersGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: warehouseCoords
            },
            properties: {
              type: "warehouse",
              id: shipment.fromWarehouseId,
              itemCode: shipment.itemCode,
              quantity: shipment.quantity,
            }
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: communityCoords
            },
            properties: {
              type: "community",
              id: shipment.toCommunityId,
              itemCode: shipment.itemCode,
              quantity: shipment.quantity,
            }
          }
        ]
      };

      // 2. Add or update line source
      if (!map.getSource("shipment-line")) {
        map.addSource("shipment-line", {
          type: "geojson",
          data: lineGeoJSON as GeoJSON.FeatureCollection
        });
      } else {
        const src = map.getSource("shipment-line") as maplibregl.GeoJSONSource;
        src.setData(lineGeoJSON as GeoJSON.FeatureCollection);
      }

      // 3. Add or update line layer
      if (!map.getLayer("shipment-line-layer")) {
        map.addLayer({
          id: "shipment-line-layer",
          type: "line",
          source: "shipment-line",
          paint: {
            "line-color": "#1D4ED8",
            "line-width": 4,
            "line-opacity": 0.85
          }
        });
      }

      // 4. Add or update markers source
      if (!map.getSource("shipment-markers")) {
        map.addSource("shipment-markers", {
          type: "geojson",
          data: markersGeoJSON as GeoJSON.FeatureCollection
        });
      } else {
        const markersSrc = map.getSource("shipment-markers") as maplibregl.GeoJSONSource;
        markersSrc.setData(markersGeoJSON as GeoJSON.FeatureCollection);
      }

      // 5. Add or update warehouse marker layer (circle)
      if (!map.getLayer("shipment-warehouse-layer")) {
        map.addLayer({
          id: "shipment-warehouse-layer",
          type: "circle",
          source: "shipment-markers",
          filter: ["==", ["get", "type"], "warehouse"],
          paint: {
            "circle-radius": 10,
            "circle-color": "#10B981", // Green for warehouse
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.9
          }
        });
      }

      // 6. Add or update community marker layer (circle)
      if (!map.getLayer("shipment-community-layer")) {
        map.addLayer({
          id: "shipment-community-layer",
          type: "circle",
          source: "shipment-markers",
          filter: ["==", ["get", "type"], "community"],
          paint: {
            "circle-radius": 10,
            "circle-color": "#EF4444", // Red for community/destination
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.9
          }
        });
      }

      // 7. Zoom to fit
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach(c => bounds.extend(c as maplibregl.LngLatLike));
      map.fitBounds(bounds, { padding: 60, duration: 600 });
    } catch (error) {
      console.error('Error drawing shipment line:', error);
    }
  }, [layers]);




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
        {/* LEFT PANEL – Map Layers */}
        <div
          className={`absolute top-0 left-0 h-full z-20 transition-all duration-300 pointer-events-none ${isLeftPanelOpen ? "w-full sm:w-96 md:w-80 lg:w-80" : "w-0"}`}
        >
          <div
            className={`h-full flex flex-col bg-white shadow-xl border-r border-gray-200 pointer-events-auto ${isLeftPanelOpen ? "" : "hidden"
              }`}
          >
            {/* HEADER */}
            <div className="bg-[#1a1a3c] p-6 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-blue-400" size={24} />
                    <h2 className="text-2xl font-bold text-white">Map Layers</h2>
                  </div>
                  <p className="text-blue-100 text-sm">Toggle layers to view data</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsLeftPanelOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENT SCROLL AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* LAYER LIST */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                {layers.map((layer: any) => (
                  <div key={layer.id} className="border-b border-gray-100 pb-4 last:border-none">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: layer.color }}
                      />

                      <button
                        onClick={() => toggleLayerExpand(layer.id)}
                        className="flex items-center gap-2 text-gray-900 font-semibold"
                      >
                        {layer.name}
                        {layer.expanded ? (
                          <ChevronUp size={16} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-500" />
                        )}
                      </button>

                      <span className="ml-auto text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {layer.count}
                      </span>

                      {/* Toggle switch */}
                      <button
                        onClick={() => toggleLayer(layer.id)}
                        className={`relative w-11 h-6 rounded-full transition-colors ml-2 ${layer.enabled ? "bg-[#1a1a3c]" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${layer.enabled ? "translate-x-5" : ""
                            }`}
                        />
                      </button>
                    </div>

                    {/* SUBTYPES */}
                    {layer.expanded && (
                      <div className="mt-3 pl-7 space-y-2">
                        {layer.subTypes.map((sub: any) => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault()
                                toggleSubType(layer.id, sub.id);
                              }}
                              className={`relative w-9 h-5 rounded-full transition-colors ${sub.enabled ? "bg-[#1a1a3c]" : "bg-gray-300"
                                }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${sub.enabled ? "translate-x-4" : ""
                                  }`}
                              />
                            </button>

                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: sub.color }}
                            />

                            <span className="text-sm text-gray-700">{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>


            </div>
          </div>
        </div>

        {/* TOGGLE BUTTON WHEN CLOSED */}
        {!isLeftPanelOpen && (
          <button
            onClick={() => setIsLeftPanelOpen(true)}
            className="absolute top-4 border-1 border-gray-500 left-4 z-20 flex items-center bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors pointer-events-auto"
          >
            <h3 className='text-lg mr-3 font-bold text-gray-700'>Layers</h3>
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        )}



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

        </Drawer>
        <div
          className={`absolute top-0 right-0 h-full z-20 transition-all duration-300 pointer-events-none ${isRightPanelOpen ? "w-full sm:w-96 md:w-[400px] lg:w-[30%]" : "w-0"}`}
        >
          <div className={`h-full flex flex-col bg-white shadow-xl border-l border-gray-200 pointer-events-auto ${isRightPanelOpen ? "" : "hidden"}`}>
            <div className="bg-[#1a1a3c] p-6 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Filter size={24} className="text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">Filters & Tools</h2>
                  </div>
                  <p className="text-blue-100 text-sm">Filter map data and AI tools</p>
                </div>
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Map Filters - Temporarily commented out */}
              {/* <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-700" />
                    <span className="font-semibold text-gray-900">Map Filters</span>
                  </div>
                  {filtersExpanded ? (
                    <ChevronUp size={18} className="text-gray-700" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-700" />
                  )}
                </button>

                {filtersExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    <MapFilters
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      hideHeader
                    />
                  </div>
                )}
              </div> */}

              <AIMatchingPanel 
                onMatchClick={(chain: any) => handleMatchSelect(chain)}
                filters={filters}
                visibleLayers={visibleLayers}
                subTypeFilters={subTypeFilters}
              />
            </div>
          </div>
        </div>

        {!isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute bottom-4 sm:top-4 sm:bottom-auto right-4 z-20 border border-gray-500 bg-white shadow-lg flex items-center rounded-lg p-3 hover:bg-gray-50 transition-colors pointer-events-auto"
          >
            <ChevronLeft size={20} className="text-gray-700" />
            <h3 className='text-lg ml-3 font-bold text-gray-700'>Filter & Tools</h3>
          </button>
        )}


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
        {/* <Box
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

        </Box> */}

        {/* <Box
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
        </Box> */}

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