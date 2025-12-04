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
import RouteDetailsModal from '@/components/RouteDetailsModal';
import RouteTooltip from '@/components/RouteTooltip';

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

  // Route details state
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [routeMetadata, setRouteMetadata] = useState<{ distance: number; duration: number; coordinates: number[][] } | null>(null);
  const [allRoutes, setAllRoutes] = useState<Array<{ index: number; coordinates: number[][]; distance: number; duration: number; isPrimary: boolean }>>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [routeDetailsModalOpened, setRouteDetailsModalOpened] = useState(false);
  const [routeTooltip, setRouteTooltip] = useState<{ distance: number; duration: number; x: number; y: number } | null>(null);
  const [currentRouteCoords, setCurrentRouteCoords] = useState<number[][]>([]);
  const routeMetadataRef = useRef<{ distance: number; duration: number; coordinates: number[][] } | null>(null);

  // Route preferences state
  const [routePreferences, setRoutePreferences] = useState({
    avoidTolls: false,
    avoidHighways: false,
    avoidBridges: false,
    avoidResidential: false,
  });

  // Store current route endpoints for regeneration
  const currentRouteEndpointsRef = useRef<{ fromLng: number; fromLat: number; toLng: number; toLat: number } | null>(null);

  // Waypoints state (Phase 5)
  const [waypoints, setWaypoints] = useState<Array<{ id: string; lng: number; lat: number; name?: string }>>([]);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);

  // Refs for waypoint handlers (to access latest state in map callbacks)
  const waypointsRef = useRef<Array<{ id: string; lng: number; lat: number; name?: string }>>([]);
  const isAddingWaypointRef = useRef(false);
  const selectedShipmentRef = useRef<Shipment | null>(null);

  // Sync waypoints state with refs (for waypoint click handler)
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  // Sync isAddingWaypoint state with ref
  useEffect(() => {
    isAddingWaypointRef.current = isAddingWaypoint;
  }, [isAddingWaypoint]);


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

    // Waypoint click handler (Phase 5) - uses refs to access latest state
    // This handler checks if we're in waypoint mode before processing
    // IMPORTANT: This must be added BEFORE other click handlers to check waypoint mode first
    const handleMapClickForWaypoint = (e: maplibregl.MapMouseEvent) => {
      // Only process if we're in waypoint mode and a shipment is selected
      // Check refs to avoid stale closures
      if (!isAddingWaypointRef.current || !selectedShipmentRef.current) {
        return; // Not in waypoint mode, let other handlers process
      }

      // We're in waypoint mode - process the click
      const currentWaypoints = waypointsRef.current;
      const newWaypoint = {
        id: `waypoint-${Date.now()}-${Math.random()}`,
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        name: `Waypoint ${currentWaypoints.length + 1}`,
      };

      const updatedWaypoints = [...currentWaypoints, newWaypoint];
      waypointsRef.current = updatedWaypoints;
      setWaypoints(updatedWaypoints);
      setIsAddingWaypoint(false);
      isAddingWaypointRef.current = false;
      map.getCanvas().style.cursor = '';

      // Auto-regenerate route with new waypoint
      if (currentRouteEndpointsRef.current) {
        const { fromLng, fromLat, toLng, toLat } = currentRouteEndpointsRef.current;
        setTimeout(() => {
          regenerateRouteWithWaypoints(fromLng, fromLat, toLng, toLat, updatedWaypoints);
        }, 100);
      }
    };

    // Store handler reference for cleanup
    (map as any)._waypointClickHandler = handleMapClickForWaypoint;

    // Add click handler for waypoints FIRST (before other handlers)
    // This ensures waypoint mode is checked before other click handlers process
    map.on('click', handleMapClickForWaypoint);

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
          const rowDate = new Date(row.createdAt);
          return rowDate >= start && rowDate <= end;
        });
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

  // Helper function to regenerate route with waypoints (Phase 5)
  const regenerateRouteWithWaypoints = useCallback(async (
    fromLng: number,
    fromLat: number,
    toLng: number,
    toLat: number,
    currentWaypoints: Array<{ id: string; lng: number; lat: number; name?: string }>
  ) => {
    if (!mapRef.current || !selectedShipmentRef.current) return;
    const map = mapRef.current;
    const shipment = selectedShipmentRef.current;

    // Build routing URL with waypoints and preferences
    const routingParams = new URLSearchParams({
      fromLng: fromLng.toString(),
      fromLat: fromLat.toString(),
      toLng: toLng.toString(),
      toLat: toLat.toString(),
      alternatives: 'true',
    });

    // Add waypoints if any
    if (currentWaypoints.length > 0) {
      const waypointsStr = currentWaypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
      routingParams.append('waypoints', waypointsStr);
    }

    // Add avoid options
    if (routePreferences.avoidTolls) routingParams.append('avoidTolls', 'true');
    if (routePreferences.avoidHighways) routingParams.append('avoidHighways', 'true');
    if (routePreferences.avoidBridges) routingParams.append('avoidBridges', 'true');
    if (routePreferences.avoidResidential) routingParams.append('avoidResidential', 'true');

    const routingUrl = `/api/routing?${routingParams.toString()}`;
    console.log('Regenerating route with waypoints:', routingUrl);

    try {
      const routeResponse = await fetch(routingUrl);

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();

        if (routeData.routes && Array.isArray(routeData.routes) && routeData.routes.length > 0) {
          // Update routes
          setAllRoutes(routeData.routes);
          setSelectedRouteIndex(0);

          // Use primary route
          const primaryRoute = routeData.routes[0];
          const newRouteMeta = {
            distance: primaryRoute.distance,
            duration: primaryRoute.duration,
            coordinates: primaryRoute.coordinates,
          };
          setRouteMetadata(newRouteMeta);
          routeMetadataRef.current = newRouteMeta;
          setCurrentRouteCoords(primaryRoute.coordinates);

          // Update primary route display
          if (map.getSource("shipment-line")) {
            const lineGeoJSON = {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: primaryRoute.coordinates,
                  },
                  properties: {
                    shipment: shipment,
                    routeIndex: 0,
                  },
                },
              ],
            };
            const src = map.getSource("shipment-line") as maplibregl.GeoJSONSource;
            src.setData(lineGeoJSON as GeoJSON.FeatureCollection);
          }

          // Update alternative routes if available
          if (routeData.routes.length > 1) {
            const alternativeRoutesGeoJSON = {
              type: "FeatureCollection",
              features: routeData.routes.slice(1).map((route: any, idx: number) => ({
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: route.coordinates,
                },
                properties: {
                  routeIndex: route.index,
                  isAlternative: true,
                },
              })),
            };

            if (map.getSource("alternative-routes")) {
              const altSrc = map.getSource("alternative-routes") as maplibregl.GeoJSONSource;
              altSrc.setData(alternativeRoutesGeoJSON as GeoJSON.FeatureCollection);
            } else {
              map.addSource("alternative-routes", {
                type: "geojson",
                data: alternativeRoutesGeoJSON as GeoJSON.FeatureCollection,
              });
            }

            // Update alternative route layers
            routeData.routes.slice(1).forEach((route: any, altIdx: number) => {
              const altLayerId = `alternative-route-${route.index}`;
              const altOutlineId = `alternative-route-outline-${route.index}`;
              const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
              const routeColor = colors[altIdx % colors.length];

              if (!map.getLayer(altOutlineId)) {
                map.addLayer({
                  id: altOutlineId,
                  type: "line",
                  source: "alternative-routes",
                  filter: ["==", ["get", "routeIndex"], route.index],
                  paint: {
                    "line-color": "#FFFFFF",
                    "line-width": 10,
                    "line-opacity": 0.6,
                    "line-blur": 1,
                  },
                  layout: {
                    "line-cap": "round",
                    "line-join": "round",
                  },
                });
              }

              if (!map.getLayer(altLayerId)) {
                map.addLayer({
                  id: altLayerId,
                  type: "line",
                  source: "alternative-routes",
                  filter: ["==", ["get", "routeIndex"], route.index],
                  paint: {
                    "line-color": routeColor,
                    "line-width": 6,
                    "line-opacity": 0.7,
                    "line-blur": 0,
                  },
                  layout: {
                    "line-cap": "round",
                    "line-join": "round",
                  },
                });
              } else {
                map.setPaintProperty(altLayerId, "line-color", routeColor);
                map.setFilter(altLayerId, ["==", ["get", "routeIndex"], route.index]);
              }
            });
          }

          console.log('✅ Route regenerated with waypoints:', routeData.routes.length, 'route(s)');
        }
      } else {
        console.error('Failed to regenerate route:', routeResponse.status);
      }
    } catch (error) {
      console.error('Error regenerating route:', error);
    }
  }, [routePreferences]);

  // ---- SHIPMENT DRAWING LAYER ----
  const handleMatchSelect = useCallback(async (shipment: Shipment & { fromWarehouseCoords?: { lat: number; lng: number }; toCommunityCoords?: { lat: number; lng: number } }) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Update refs for waypoint handling
    selectedShipmentRef.current = shipment;

    // Clear waypoints when selecting a new shipment
    setWaypoints([]);
    waypointsRef.current = [];
    setIsAddingWaypoint(false);
    isAddingWaypointRef.current = false;

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

      // Try to fetch route from Mapbox, fallback to straight line if it fails
      let routeCoords: [number, number][] = [warehouseCoords, communityCoords];
      let usingMapboxRoute = false;
      let routeMeta: { distance: number; duration: number; coordinates: number[][] } | null = null;
      let fetchedRoutes: Array<{ index: number; coordinates: number[][]; distance: number; duration: number; isPrimary: boolean }> = [];

      // Store route endpoints for regeneration
      currentRouteEndpointsRef.current = {
        fromLng: warehouseCoords[0],
        fromLat: warehouseCoords[1],
        toLng: communityCoords[0],
        toLat: communityCoords[1],
      };

      try {
        // Build routing URL with preferences and waypoints
        const routingParams = new URLSearchParams({
          fromLng: warehouseCoords[0].toString(),
          fromLat: warehouseCoords[1].toString(),
          toLng: communityCoords[0].toString(),
          toLat: communityCoords[1].toString(),
          alternatives: 'true',
        });

        // Add waypoints if any
        if (waypoints.length > 0) {
          const waypointsStr = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
          routingParams.append('waypoints', waypointsStr);
        }

        // Add avoid options
        if (routePreferences.avoidTolls) routingParams.append('avoidTolls', 'true');
        if (routePreferences.avoidHighways) routingParams.append('avoidHighways', 'true');
        if (routePreferences.avoidBridges) routingParams.append('avoidBridges', 'true');
        if (routePreferences.avoidResidential) routingParams.append('avoidResidential', 'true');

        const routingUrl = `/api/routing?${routingParams.toString()}`;
        console.log('Fetching route from Mapbox with alternatives:', routingUrl);
        const routeResponse = await fetch(routingUrl);

        if (routeResponse.ok) {
          const routeData = await routeResponse.json();

          // Handle new format with multiple routes
          if (routeData.routes && Array.isArray(routeData.routes) && routeData.routes.length > 0) {
            // Store routes locally and in state
            fetchedRoutes = routeData.routes;
            setAllRoutes(routeData.routes);
            setSelectedRouteIndex(0); // Select primary route by default

            // Use primary route coordinates
            const primaryRoute = routeData.routes[0];
            routeCoords = primaryRoute.coordinates as [number, number][];
            usingMapboxRoute = true;

            // Store primary route metadata for details display
            routeMeta = {
              distance: primaryRoute.distance, // meters
              duration: primaryRoute.duration, // seconds
              coordinates: primaryRoute.coordinates,
            };
            setRouteMetadata(routeMeta);
            routeMetadataRef.current = routeMeta; // Store in ref for event handlers
            setCurrentRouteCoords(primaryRoute.coordinates);

            console.log(`✅ Route fetched successfully from Mapbox! Found ${routeData.routes.length} route(s)`);
            console.log('Primary route metadata:', { distance: primaryRoute.distance, duration: primaryRoute.duration });
          }
          // Backward compatibility: handle old format (single route)
          else if (routeData.coordinates && Array.isArray(routeData.coordinates) && routeData.coordinates.length > 0) {
            routeCoords = routeData.coordinates as [number, number][];
            usingMapboxRoute = true;

            // Store route metadata for details display
            if (routeData.distance && routeData.duration) {
              routeMeta = {
                distance: routeData.distance,
                duration: routeData.duration,
                coordinates: routeData.coordinates,
              };
              setRouteMetadata(routeMeta);
              routeMetadataRef.current = routeMeta;
              setCurrentRouteCoords(routeData.coordinates);

              // Convert to new format for consistency
              setAllRoutes([{
                index: 0,
                coordinates: routeData.coordinates,
                distance: routeData.distance,
                duration: routeData.duration,
                isPrimary: true,
              }]);
            }

            console.log(`✅ Route fetched successfully from Mapbox! Using street route with ${routeCoords.length} points`);
          } else {
            console.warn('⚠️ Invalid route data from Mapbox, falling back to straight line');
            console.warn('Response data:', routeData);
          }
        } else {
          // Route fetch failed, use straight line fallback
          const errorData = await routeResponse.json().catch(() => ({}));
          console.error('❌ Route fetch failed:', routeResponse.status, errorData.error || routeResponse.statusText);
          console.warn('⚠️ Falling back to straight line. Check MAPBOX_ACCESS_TOKEN in .env');
        }
      } catch (routeError: any) {
        // Network error or timeout, use straight line fallback
        console.error('❌ Route fetch error:', routeError.message || routeError);
        console.warn('⚠️ Falling back to straight line due to network/timeout error');
      }

      if (!usingMapboxRoute) {
        console.warn('⚠️ Using straight line fallback. To see actual road routes, configure MAPBOX_ACCESS_TOKEN in .env');
        // Clear route metadata for straight line
        setRouteMetadata(null);
        routeMetadataRef.current = null;
        setCurrentRouteCoords([]);
        setAllRoutes([]);
        setSelectedRouteIndex(0);
      }

      // Store selected shipment for modal
      setSelectedShipment(shipment);

      // Create GeoJSON for line using route coordinates (or straight line fallback)
      const lineGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCoords
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

      // 2. Add or update primary route line source
      if (!map.getSource("shipment-line")) {
        map.addSource("shipment-line", {
          type: "geojson",
          data: lineGeoJSON as GeoJSON.FeatureCollection
        });
      } else {
        const src = map.getSource("shipment-line") as maplibregl.GeoJSONSource;
        src.setData(lineGeoJSON as GeoJSON.FeatureCollection);
      }

      // 2b. Add alternative routes if available
      if (usingMapboxRoute && fetchedRoutes.length > 1) {
        // Create GeoJSON for all alternative routes
        const alternativeRoutesGeoJSON = {
          type: "FeatureCollection",
          features: fetchedRoutes.slice(1).map((route, idx) => ({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: route.coordinates,
            },
            properties: {
              routeIndex: route.index,
              isAlternative: true,
            },
          })),
        };

        // Add or update alternative routes source
        if (!map.getSource("alternative-routes")) {
          map.addSource("alternative-routes", {
            type: "geojson",
            data: alternativeRoutesGeoJSON as GeoJSON.FeatureCollection,
          });
        } else {
          const altSrc = map.getSource("alternative-routes") as maplibregl.GeoJSONSource;
          altSrc.setData(alternativeRoutesGeoJSON as GeoJSON.FeatureCollection);
        }

        // Add alternative routes layers (one for each alternative route)
        fetchedRoutes.slice(1).forEach((route, idx) => {
          const layerId = `alternative-route-${route.index}`;
          const outlineLayerId = `alternative-route-outline-${route.index}`;

          // Color scheme: Yellow/Orange for first alternative, Green for second, etc.
          const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
          const routeColor = colors[idx % colors.length];

          // Add outline layer
          if (!map.getLayer(outlineLayerId)) {
            map.addLayer({
              id: outlineLayerId,
              type: "line",
              source: "alternative-routes",
              filter: ["==", ["get", "routeIndex"], route.index],
              paint: {
                "line-color": "#FFFFFF",
                "line-width": 10,
                "line-opacity": 0.6,
                "line-blur": 1,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });
          }

          // Add main alternative route layer
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "line",
              source: "alternative-routes",
              filter: ["==", ["get", "routeIndex"], route.index],
              paint: {
                "line-color": routeColor,
                "line-width": 6,
                "line-opacity": 0.7,
                "line-blur": 0,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });
          }

          // Always attach handlers (even if layer already exists)
          // Remove existing handlers first to avoid duplicates
          const handlerKey = `_altRouteHandler_${layerId}`;
          if ((map as any)[handlerKey]) {
            try {
              map.off('mouseenter', layerId, (map as any)[handlerKey].mouseenter);
              map.off('mouseleave', layerId, (map as any)[handlerKey].mouseleave);
              map.off('click', layerId, (map as any)[handlerKey].click);
            } catch (err) {
              // Handlers might not exist, ignore error
              console.debug('Removing existing handlers:', err);
            }
          }

          // Add hover and click handlers for alternative routes
          const altPopup = new maplibregl.Popup({ closeOnClick: false, closeButton: false });

          // Calculate route array index once
          const routeArrayIndex = idx + 1; // +1 because we sliced fetchedRoutes.slice(1)

          // Hover handler for alternative route
          const mouseenterHandler = (e: maplibregl.MapLayerMouseEvent) => {
            if (!e.features || e.features.length === 0) return;

            map.getCanvas().style.cursor = 'pointer';

            // Use the route from fetchedRoutes array (already calculated above)
            const altRouteMeta = fetchedRoutes[routeArrayIndex];
            if (!altRouteMeta) return;

            const hoverPoint = e.lngLat;
            const coords = altRouteMeta.coordinates;

            // Find closest point using Haversine distance for better accuracy
            let closestIdx = 0;
            let minDist = Infinity;
            const R = 6371000; // Earth radius in meters

            for (let i = 0; i < coords.length; i++) {
              const dLat = (coords[i][1] - hoverPoint.lat) * Math.PI / 180;
              const dLon = (coords[i][0] - hoverPoint.lng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(hoverPoint.lat * Math.PI / 180) * Math.cos(coords[i][1] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const dist = R * c;

              if (dist < minDist) {
                minDist = dist;
                closestIdx = i;
              }
            }

            // Calculate cumulative distance up to closest point
            let cumulativeDistance = 0;
            for (let i = 1; i <= closestIdx; i++) {
              const dLat = (coords[i][1] - coords[i - 1][1]) * Math.PI / 180;
              const dLon = (coords[i][0] - coords[i - 1][0]) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(coords[i - 1][1] * Math.PI / 180) * Math.cos(coords[i][1] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              cumulativeDistance += R * c;
            }

            // Estimate duration based on distance (assuming average speed)
            const avgSpeedMps = 13.89; // ~50 km/h in m/s
            const cumulativeDuration = cumulativeDistance / avgSpeedMps;

            const tooltipContent = document.createElement('div');
            tooltipContent.innerHTML = `
                <div style="padding: 8px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 12px; min-width: 140px;">
                  <div style="margin-bottom: 4px; color: ${routeColor}; font-weight: 600;">Alternative Route ${idx + 1}</div>
                  <div style="margin-bottom: 4px;"><strong>Total:</strong> ${(altRouteMeta.distance / 1000).toFixed(2)} km, ${Math.floor(altRouteMeta.duration / 60)}m</div>
                  <div style="margin-bottom: 4px; border-top: 1px solid #e0e0e0; padding-top: 4px; margin-top: 4px;"><strong>To here:</strong> ${(cumulativeDistance / 1000).toFixed(2)} km</div>
                  <div><strong>Time:</strong> ${Math.floor(cumulativeDuration / 60)}m ${Math.floor(cumulativeDuration % 60)}s</div>
                </div>
              `;

            altPopup.setLngLat(hoverPoint)
              .setDOMContent(tooltipContent)
              .addTo(map);
          };

          // Mouse leave handler
          const mouseleaveHandler = () => {
            map.getCanvas().style.cursor = '';
            altPopup.remove();
          };

          // Click handler for alternative route - swap routes
          const clickHandler = (e: maplibregl.MapLayerMouseEvent) => {
            console.log('Alternative route clicked!', { layerId, routeArrayIndex, features: e.features });

            if (!e.features || e.features.length === 0) {
              console.warn('No features in click event');
              return;
            }

            const selectedAltRoute = fetchedRoutes[routeArrayIndex];
            if (!selectedAltRoute) {
              console.warn('Selected alternative route not found at index:', routeArrayIndex);
              return;
            }

            console.log('Swapping routes - making alternative route primary:', routeArrayIndex);

            // Swap routes: move clicked alternative to index 0, move current primary to alternative position
            const swappedRoutes = [...fetchedRoutes];
            const oldPrimaryRoute = swappedRoutes[0];
            swappedRoutes[0] = selectedAltRoute;
            swappedRoutes[routeArrayIndex] = oldPrimaryRoute;

            // Update indices
            swappedRoutes.forEach((route, i) => {
              route.index = i;
              route.isPrimary = i === 0;
            });

            // Update state with swapped routes
            setSelectedRouteIndex(0); // New primary is at index 0
            setAllRoutes(swappedRoutes);

            const newRouteMeta = {
              distance: selectedAltRoute.distance,
              duration: selectedAltRoute.duration,
              coordinates: selectedAltRoute.coordinates,
            };
            setRouteMetadata(newRouteMeta);
            routeMetadataRef.current = newRouteMeta;
            setCurrentRouteCoords(selectedAltRoute.coordinates);

            // Update primary route source (shipment-line) with new primary route
            if (map.getSource("shipment-line")) {
              const lineGeoJSON = {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: selectedAltRoute.coordinates,
                    },
                    properties: {
                      shipment: shipment,
                      routeIndex: 0,
                    },
                  },
                ],
              };
              const src = map.getSource("shipment-line") as maplibregl.GeoJSONSource;
              src.setData(lineGeoJSON as GeoJSON.FeatureCollection);
            }

            // Update alternative routes source with swapped routes (excluding new primary)
            if (map.getSource("alternative-routes") && swappedRoutes.length > 1) {
              const alternativeRoutesGeoJSON = {
                type: "FeatureCollection",
                features: swappedRoutes.slice(1).map((route, altIdx) => ({
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: route.coordinates,
                  },
                  properties: {
                    routeIndex: route.index,
                    isAlternative: true,
                  },
                })),
              };
              const altSrc = map.getSource("alternative-routes") as maplibregl.GeoJSONSource;
              altSrc.setData(alternativeRoutesGeoJSON as GeoJSON.FeatureCollection);

              // Update alternative route layer colors and filters to match new positions
              swappedRoutes.slice(1).forEach((route, altIdx) => {
                const altLayerId = `alternative-route-${route.index}`;
                const altOutlineId = `alternative-route-outline-${route.index}`;
                const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
                const routeColor = colors[altIdx % colors.length];

                // Update filter to match new route index
                if (map.getLayer(altOutlineId)) {
                  map.setFilter(altOutlineId, ["==", ["get", "routeIndex"], route.index]);
                }
                if (map.getLayer(altLayerId)) {
                  map.setFilter(altLayerId, ["==", ["get", "routeIndex"], route.index]);
                  map.setPaintProperty(altLayerId, "line-color", routeColor);
                }
              });
            }

            // Store swapped routes for future reference
            fetchedRoutes.length = 0;
            fetchedRoutes.push(...swappedRoutes);

            // Update distance markers if they exist
            if (map.getSource("route-distance-markers") && selectedAltRoute.coordinates.length > 10) {
              const markerInterval = 5000; // 5km in meters
              const distanceMarkers: GeoJSON.Feature[] = [];
              let cumulativeDistance = 0;

              const haversineDistance = (coord1: number[], coord2: number[]): number => {
                const R = 6371000;
                const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
                const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
              };

              for (let i = 1; i < selectedAltRoute.coordinates.length; i++) {
                const segmentDist = haversineDistance(selectedAltRoute.coordinates[i - 1], selectedAltRoute.coordinates[i]);
                cumulativeDistance += segmentDist;

                if (cumulativeDistance >= markerInterval * (distanceMarkers.length + 1)) {
                  distanceMarkers.push({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: selectedAltRoute.coordinates[i],
                    },
                    properties: {
                      label: `${((cumulativeDistance / 1000).toFixed(1))}km`,
                      distance: cumulativeDistance,
                    },
                  });
                }
              }

              if (distanceMarkers.length > 0) {
                const markersGeoJSON = {
                  type: "FeatureCollection",
                  features: distanceMarkers,
                };
                const markersSrc = map.getSource("route-distance-markers") as maplibregl.GeoJSONSource;
                markersSrc.setData(markersGeoJSON as GeoJSON.FeatureCollection);
              }
            }

            // Don't open modal automatically - user can click the primary route if they want details
          };

          // Attach handlers immediately - layers should be ready
          try {
            if (map.getLayer(layerId)) {
              console.log('Attaching handlers for alternative route layer:', layerId, 'routeArrayIndex:', routeArrayIndex);

              // Remove any existing handlers first (if stored)
              if ((map as any)[handlerKey]) {
                try {
                  map.off('mouseenter', layerId, (map as any)[handlerKey].mouseenter);
                  map.off('mouseleave', layerId, (map as any)[handlerKey].mouseleave);
                  map.off('click', layerId, (map as any)[handlerKey].click);
                } catch (e) {
                  // Handlers might not exist, ignore
                }
              }

              // Attach new handlers
              map.on('mouseenter', layerId, mouseenterHandler);
              map.on('mouseleave', layerId, mouseleaveHandler);
              map.on('click', layerId, clickHandler);

              // Store handlers for cleanup
              (map as any)[handlerKey] = {
                mouseenter: mouseenterHandler,
                mouseleave: mouseleaveHandler,
                click: clickHandler,
              };

              console.log('✅ Handlers attached successfully for:', layerId);
            } else {
              console.warn('⚠️ Layer not found when trying to attach handlers:', layerId);
            }
          } catch (err) {
            console.error('❌ Error attaching handlers for alternative route:', layerId, err);
          }
        });
      } else {
        // Remove alternative routes if not available
        if (map.getSource("alternative-routes")) {
          // Remove all alternative route layers (check existing layers)
          const existingLayers = map.getStyle().layers || [];
          existingLayers.forEach((layer: any) => {
            if (layer.id && (layer.id.startsWith("alternative-route-") || layer.id.startsWith("alternative-route-outline-"))) {
              if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
              }
            }
          });
          if (map.getSource("alternative-routes")) {
            map.removeSource("alternative-routes");
          }
        }
      }

      // 3. Add background/outline layer for route (makes it stand out on roads)
      if (!map.getLayer("shipment-line-outline")) {
        map.addLayer({
          id: "shipment-line-outline",
          type: "line",
          source: "shipment-line",
          paint: {
            "line-color": "#FFFFFF", // White outline
            "line-width": 12, // Thick outline
            "line-opacity": 0.8,
            "line-blur": 2
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          }
        });
      } else {
        // Update existing outline layer
        map.setPaintProperty("shipment-line-outline", "line-width", 12);
      }

      // 4. Add or update main route line layer (on top of outline)
      const routeLayerExists = map.getLayer("shipment-line-layer");

      if (!routeLayerExists) {
        map.addLayer({
          id: "shipment-line-layer",
          type: "line",
          source: "shipment-line",
          paint: {
            "line-color": "#2563EB", // Bright blue
            "line-width": 8, // Thick main line
            "line-opacity": 1.0,
            "line-blur": 0
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          }
        });
      } else {
        // Update existing layer paint properties to ensure visibility
        map.setPaintProperty("shipment-line-layer", "line-color", "#2563EB");
        map.setPaintProperty("shipment-line-layer", "line-width", 8);
        map.setPaintProperty("shipment-line-layer", "line-opacity", 1.0);
      }

      // Add hover and click handlers for route (only if not already added)
      // Check if handlers are already attached by checking for a custom property
      if (!(map as any)._routeHandlersAttached) {
        const popup = new maplibregl.Popup({ closeOnClick: false, closeButton: false });

        // Hover handler - show tooltip
        map.on('mouseenter', 'shipment-line-layer', (e) => {
          if (!e.features || e.features.length === 0) return;

          // Get current route metadata from ref (always has latest value)
          const currentRouteMeta = routeMetadataRef.current;
          if (!currentRouteMeta) return;

          map.getCanvas().style.cursor = 'pointer';

          // Calculate cumulative distance and time to hover point
          const hoverPoint = e.lngLat;
          const coords = currentRouteMeta.coordinates;

          // Find closest point on route to hover location
          let closestIdx = 0;
          let minDist = Infinity;
          for (let i = 0; i < coords.length; i++) {
            const dist = Math.sqrt(
              Math.pow(coords[i][0] - hoverPoint.lng, 2) +
              Math.pow(coords[i][1] - hoverPoint.lat, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              closestIdx = i;
            }
          }

          // Calculate cumulative distance (simplified - using index proportion)
          const progress = closestIdx / coords.length;
          const cumulativeDistance = currentRouteMeta.distance * progress;
          const cumulativeDuration = currentRouteMeta.duration * progress;

          // Create tooltip content
          const tooltipContent = document.createElement('div');
          tooltipContent.innerHTML = `
            <div style="padding: 8px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 12px; min-width: 120px;">
              <div style="margin-bottom: 4px;"><strong>Distance:</strong> ${(cumulativeDistance / 1000).toFixed(2)} km</div>
              <div><strong>Time:</strong> ${Math.floor(cumulativeDuration / 60)}m ${Math.floor(cumulativeDuration % 60)}s</div>
            </div>
          `;

          popup.setLngLat(hoverPoint)
            .setDOMContent(tooltipContent)
            .addTo(map);

          // Store tooltip data for React component (if needed)
          setRouteTooltip({
            distance: cumulativeDistance,
            duration: cumulativeDuration,
            x: e.point.x,
            y: e.point.y,
          });
        });

        // Mouse leave handler - hide tooltip
        map.on('mouseleave', 'shipment-line-layer', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
          setRouteTooltip(null);
        });

        // Click handler - show details modal
        map.on('click', 'shipment-line-layer', (e) => {
          if (!e.features || e.features.length === 0) return;
          setRouteDetailsModalOpened(true);
        });

        // Mark handlers as attached
        (map as any)._routeHandlersAttached = true;
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

      // 5. Add or update warehouse marker layer (circle) - make more prominent
      if (!map.getLayer("shipment-warehouse-layer")) {
        map.addLayer({
          id: "shipment-warehouse-layer",
          type: "circle",
          source: "shipment-markers",
          filter: ["==", ["get", "type"], "warehouse"],
          paint: {
            "circle-radius": 12, // Larger for visibility
            "circle-color": "#10B981", // Green for warehouse
            "circle-stroke-width": 3, // Thicker stroke
            "circle-stroke-color": "#fff",
            "circle-opacity": 1.0
          }
        });
      } else {
        // Update existing layer to ensure visibility
        map.setPaintProperty("shipment-warehouse-layer", "circle-radius", 12);
        map.setPaintProperty("shipment-warehouse-layer", "circle-stroke-width", 3);
      }

      // 6. Add or update community marker layer (circle) - make more prominent
      if (!map.getLayer("shipment-community-layer")) {
        map.addLayer({
          id: "shipment-community-layer",
          type: "circle",
          source: "shipment-markers",
          filter: ["==", ["get", "type"], "community"],
          paint: {
            "circle-radius": 12, // Larger for visibility
            "circle-color": "#EF4444", // Red for community/destination
            "circle-stroke-width": 3, // Thicker stroke
            "circle-stroke-color": "#fff",
            "circle-opacity": 1.0
          }
        });
      } else {
        // Update existing layer to ensure visibility
        map.setPaintProperty("shipment-community-layer", "circle-radius", 12);
        map.setPaintProperty("shipment-community-layer", "circle-stroke-width", 3);
      }

      // 6.5. Add or update waypoint markers (Phase 5)
      const waypointMarkersGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: waypoints.map((wp, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [wp.lng, wp.lat],
          },
          properties: {
            id: wp.id,
            name: wp.name || `Waypoint ${index + 1}`,
            index: index + 1,
            type: "waypoint",
          },
        })),
      };

      if (!map.getSource("waypoint-markers")) {
        map.addSource("waypoint-markers", {
          type: "geojson",
          data: waypointMarkersGeoJSON,
        });
      } else {
        const waypointSrc = map.getSource("waypoint-markers") as maplibregl.GeoJSONSource;
        waypointSrc.setData(waypointMarkersGeoJSON);
      }

      // Add waypoint marker layer (numbered circles)
      if (!map.getLayer("waypoint-markers-layer")) {
        map.addLayer({
          id: "waypoint-markers-layer",
          type: "circle",
          source: "waypoint-markers",
          paint: {
            "circle-radius": 10,
            "circle-color": "#8B5CF6", // Purple for waypoints
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
            "circle-opacity": 1.0,
          },
        });
      }

      // Add waypoint labels (numbers)
      if (!map.getLayer("waypoint-labels-layer")) {
        map.addLayer({
          id: "waypoint-labels-layer",
          type: "symbol",
          source: "waypoint-markers",
          layout: {
            "text-field": ["get", "index"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#fff",
          },
        });
      }

      // 7. Add distance markers along route (every 5km if route is long enough)
      if (usingMapboxRoute && routeMeta && routeMeta.coordinates.length > 10) {
        // Calculate cumulative distances and place markers every 5km
        const markerInterval = 5000; // 5km in meters
        const distanceMarkers: GeoJSON.Feature[] = [];
        let cumulativeDistance = 0;

        // Helper function to calculate distance between two coordinates (Haversine)
        const haversineDistance = (coord1: number[], coord2: number[]): number => {
          const R = 6371000; // Earth radius in meters
          const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
          const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        let lastMarkerDistance = 0;
        for (let i = 1; i < routeMeta.coordinates.length; i++) {
          const segmentDistance = haversineDistance(
            routeMeta.coordinates[i - 1],
            routeMeta.coordinates[i]
          );
          cumulativeDistance += segmentDistance;

          // Place marker every 5km
          if (cumulativeDistance - lastMarkerDistance >= markerInterval) {
            const kmMark = Math.floor(cumulativeDistance / 1000);
            distanceMarkers.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: routeMeta.coordinates[i],
              },
              properties: {
                distance: kmMark,
                label: `${kmMark}km`,
              },
            });
            lastMarkerDistance = cumulativeDistance;
          }
        }

        // Add distance markers source and layer if markers exist
        if (distanceMarkers.length > 0) {
          const markersGeoJSON = {
            type: "FeatureCollection",
            features: distanceMarkers,
          };

          if (!map.getSource("route-distance-markers")) {
            map.addSource("route-distance-markers", {
              type: "geojson",
              data: markersGeoJSON as GeoJSON.FeatureCollection,
            });
          } else {
            const src = map.getSource("route-distance-markers") as maplibregl.GeoJSONSource;
            src.setData(markersGeoJSON as GeoJSON.FeatureCollection);
          }

          // Add layer for distance markers if it doesn't exist
          if (!map.getLayer("route-distance-markers-layer")) {
            map.addLayer({
              id: "route-distance-markers-layer",
              type: "circle",
              source: "route-distance-markers",
              paint: {
                "circle-radius": 6,
                "circle-color": "#2563EB",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#fff",
                "circle-opacity": 0.8,
              },
            });

            // Add labels for distance markers
            if (!map.getLayer("route-distance-markers-labels")) {
              map.addLayer({
                id: "route-distance-markers-labels",
                type: "symbol",
                source: "route-distance-markers",
                layout: {
                  "text-field": ["get", "label"],
                  "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                  "text-size": 11,
                  "text-offset": [0, 1.5],
                  "text-anchor": "top",
                },
                paint: {
                  "text-color": "#2563EB",
                  "text-halo-color": "#fff",
                  "text-halo-width": 2,
                },
              });
            }
          }
        }
      } else {
        // Remove distance markers if route is not from Mapbox
        if (map.getLayer("route-distance-markers-labels")) {
          map.removeLayer("route-distance-markers-labels");
        }
        if (map.getLayer("route-distance-markers-layer")) {
          map.removeLayer("route-distance-markers-layer");
        }
        if (map.getSource("route-distance-markers")) {
          map.removeSource("route-distance-markers");
        }
      }

      // 8. Ensure route layers are on top of all other layers (but markers on top of route)
      try {
        // Move outline layer first (bottom)
        if (map.getLayer("shipment-line-outline")) {
          map.moveLayer("shipment-line-outline");
        }
        // Move main route line layer (middle)
        if (map.getLayer("shipment-line-layer")) {
          map.moveLayer("shipment-line-layer");
        }

        // Move alternative routes ABOVE primary route so they're clickable
        if (usingMapboxRoute && fetchedRoutes.length > 1) {
          fetchedRoutes.slice(1).forEach((route) => {
            const altLayerId = `alternative-route-${route.index}`;
            const altOutlineId = `alternative-route-outline-${route.index}`;
            if (map.getLayer(altOutlineId)) {
              map.moveLayer(altOutlineId);
            }
            if (map.getLayer(altLayerId)) {
              map.moveLayer(altLayerId);
            }
          });
        }

        // Move distance markers above route
        if (map.getLayer("route-distance-markers-layer")) {
          map.moveLayer("route-distance-markers-layer");
        }
        if (map.getLayer("route-distance-markers-labels")) {
          map.moveLayer("route-distance-markers-labels");
        }
        // Move marker layers to very top so they're visible above route
        if (map.getLayer("shipment-warehouse-layer")) {
          map.moveLayer("shipment-warehouse-layer");
        }
        if (map.getLayer("shipment-community-layer")) {
          map.moveLayer("shipment-community-layer");
        }
        if (map.getLayer("waypoint-markers-layer")) {
          map.moveLayer("waypoint-markers-layer");
        }
        if (map.getLayer("waypoint-labels-layer")) {
          map.moveLayer("waypoint-labels-layer");
        }
      } catch (e) {
        // Layer ordering might fail, but route should still be visible
        console.debug("Could not move route layer to top:", e);
      }

      // 9. Zoom to fit (use route coordinates for bounds) with animation
      const bounds = new maplibregl.LngLatBounds();
      routeCoords.forEach(c => bounds.extend(c as maplibregl.LngLatLike));

      // Add padding to ensure route is fully visible
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 800, // Smooth animation
        maxZoom: 14 // Don't zoom in too close
      });
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
                routeMetadata={routeMetadata}
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

        {/* Route Details Modal */}
        <RouteDetailsModal
          opened={routeDetailsModalOpened}
          onClose={() => {
            setRouteDetailsModalOpened(false);
            setIsAddingWaypoint(false);
            isAddingWaypointRef.current = false;
            if (mapRef.current) {
              mapRef.current.getCanvas().style.cursor = '';
            }
          }}
          shipment={selectedShipment}
          routeMetadata={routeMetadata}
          allRoutes={allRoutes}
          selectedRouteIndex={selectedRouteIndex}
          routePreferences={routePreferences}
          onPreferencesChange={(prefs) => {
            setRoutePreferences(prefs);
          }}
          waypoints={waypoints}
          onWaypointsChange={(newWaypoints) => {
            setWaypoints(newWaypoints);
            waypointsRef.current = newWaypoints;
            // Auto-regenerate route when waypoints change
            if (currentRouteEndpointsRef.current && selectedShipmentRef.current && mapRef.current) {
              setTimeout(() => {
                const { fromLng, fromLat, toLng, toLat } = currentRouteEndpointsRef.current!;
                regenerateRouteWithWaypoints(fromLng, fromLat, toLng, toLat, newWaypoints);
              }, 100);
            }
          }}
          onAddWaypointClick={() => {
            setIsAddingWaypoint(true);
            isAddingWaypointRef.current = true;
            if (mapRef.current) {
              mapRef.current.getCanvas().style.cursor = 'crosshair';
            }
          }}
          isAddingWaypoint={isAddingWaypoint}
          onRegenerateRoute={async () => {
            // Regenerate route with current preferences
            if (!currentRouteEndpointsRef.current || !selectedShipment || !mapRef.current) {
              console.warn('Cannot regenerate route: missing endpoints or shipment');
              return;
            }

            const { fromLng, fromLat, toLng, toLat } = currentRouteEndpointsRef.current;
            const map = mapRef.current;

            // Build routing URL with current preferences and waypoints
            const routingParams = new URLSearchParams({
              fromLng: fromLng.toString(),
              fromLat: fromLat.toString(),
              toLng: toLng.toString(),
              toLat: toLat.toString(),
              alternatives: 'true',
            });

            // Add waypoints if any
            if (waypoints.length > 0) {
              const waypointsStr = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
              routingParams.append('waypoints', waypointsStr);
            }

            // Add avoid options
            if (routePreferences.avoidTolls) routingParams.append('avoidTolls', 'true');
            if (routePreferences.avoidHighways) routingParams.append('avoidHighways', 'true');
            if (routePreferences.avoidBridges) routingParams.append('avoidBridges', 'true');
            if (routePreferences.avoidResidential) routingParams.append('avoidResidential', 'true');

            const routingUrl = `/api/routing?${routingParams.toString()}`;
            console.log('Regenerating route with preferences:', routingUrl);

            try {
              const routeResponse = await fetch(routingUrl);

              if (routeResponse.ok) {
                const routeData = await routeResponse.json();

                if (routeData.routes && Array.isArray(routeData.routes) && routeData.routes.length > 0) {
                  // Update routes
                  setAllRoutes(routeData.routes);
                  setSelectedRouteIndex(0);

                  // Use primary route
                  const primaryRoute = routeData.routes[0];
                  const newRouteMeta = {
                    distance: primaryRoute.distance,
                    duration: primaryRoute.duration,
                    coordinates: primaryRoute.coordinates,
                  };
                  setRouteMetadata(newRouteMeta);
                  routeMetadataRef.current = newRouteMeta;
                  setCurrentRouteCoords(primaryRoute.coordinates);

                  // Update primary route display
                  if (map.getSource("shipment-line")) {
                    const lineGeoJSON = {
                      type: "FeatureCollection",
                      features: [
                        {
                          type: "Feature",
                          geometry: {
                            type: "LineString",
                            coordinates: primaryRoute.coordinates,
                          },
                          properties: {
                            shipment: selectedShipment,
                            routeIndex: 0,
                          },
                        },
                      ],
                    };
                    const src = map.getSource("shipment-line") as maplibregl.GeoJSONSource;
                    src.setData(lineGeoJSON as GeoJSON.FeatureCollection);
                  }

                  // Update alternative routes if available
                  if (routeData.routes.length > 1) {
                    const alternativeRoutesGeoJSON = {
                      type: "FeatureCollection",
                      features: routeData.routes.slice(1).map((route: any, idx: number) => ({
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: route.coordinates,
                        },
                        properties: {
                          routeIndex: route.index,
                          isAlternative: true,
                        },
                      })),
                    };

                    if (map.getSource("alternative-routes")) {
                      const altSrc = map.getSource("alternative-routes") as maplibregl.GeoJSONSource;
                      altSrc.setData(alternativeRoutesGeoJSON as GeoJSON.FeatureCollection);
                    } else {
                      // Create alternative routes source if it doesn't exist
                      map.addSource("alternative-routes", {
                        type: "geojson",
                        data: alternativeRoutesGeoJSON as GeoJSON.FeatureCollection,
                      });
                    }

                    // Update alternative route layers
                    routeData.routes.slice(1).forEach((route: any, altIdx: number) => {
                      const altLayerId = `alternative-route-${route.index}`;
                      const altOutlineId = `alternative-route-outline-${route.index}`;
                      const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
                      const routeColor = colors[altIdx % colors.length];

                      // Update or create outline layer
                      if (!map.getLayer(altOutlineId)) {
                        map.addLayer({
                          id: altOutlineId,
                          type: "line",
                          source: "alternative-routes",
                          filter: ["==", ["get", "routeIndex"], route.index],
                          paint: {
                            "line-color": "#FFFFFF",
                            "line-width": 10,
                            "line-opacity": 0.6,
                            "line-blur": 1,
                          },
                          layout: {
                            "line-cap": "round",
                            "line-join": "round",
                          },
                        });
                      }

                      // Update or create main alternative route layer
                      if (!map.getLayer(altLayerId)) {
                        map.addLayer({
                          id: altLayerId,
                          type: "line",
                          source: "alternative-routes",
                          filter: ["==", ["get", "routeIndex"], route.index],
                          paint: {
                            "line-color": routeColor,
                            "line-width": 6,
                            "line-opacity": 0.7,
                            "line-blur": 0,
                          },
                          layout: {
                            "line-cap": "round",
                            "line-join": "round",
                          },
                        });
                      } else {
                        map.setPaintProperty(altLayerId, "line-color", routeColor);
                        map.setFilter(altLayerId, ["==", ["get", "routeIndex"], route.index]);
                      }
                    });
                  } else {
                    // Remove alternative routes if none available
                    if (map.getSource("alternative-routes")) {
                      const existingLayers = map.getStyle().layers || [];
                      existingLayers.forEach((layer: any) => {
                        if (layer.id && (layer.id.startsWith("alternative-route-") || layer.id.startsWith("alternative-route-outline-"))) {
                          if (map.getLayer(layer.id)) {
                            map.removeLayer(layer.id);
                          }
                        }
                      });
                      map.removeSource("alternative-routes");
                    }
                  }

                  // Update distance markers
                  if (map.getSource("route-distance-markers") && primaryRoute.coordinates.length > 10) {
                    const markerInterval = 5000;
                    const distanceMarkers: GeoJSON.Feature[] = [];
                    let cumulativeDistance = 0;

                    const haversineDistance = (coord1: number[], coord2: number[]): number => {
                      const R = 6371000;
                      const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
                      const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
                      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      return R * c;
                    };

                    for (let i = 1; i < primaryRoute.coordinates.length; i++) {
                      const segmentDist = haversineDistance(primaryRoute.coordinates[i - 1], primaryRoute.coordinates[i]);
                      cumulativeDistance += segmentDist;

                      if (cumulativeDistance >= markerInterval * (distanceMarkers.length + 1)) {
                        distanceMarkers.push({
                          type: "Feature",
                          geometry: {
                            type: "Point",
                            coordinates: primaryRoute.coordinates[i],
                          },
                          properties: {
                            label: `${((cumulativeDistance / 1000).toFixed(1))}km`,
                            distance: cumulativeDistance,
                          },
                        });
                      }
                    }

                    if (distanceMarkers.length > 0) {
                      const markersGeoJSON = {
                        type: "FeatureCollection",
                        features: distanceMarkers,
                      };
                      const markersSrc = map.getSource("route-distance-markers") as maplibregl.GeoJSONSource;
                      markersSrc.setData(markersGeoJSON as GeoJSON.FeatureCollection);
                    }
                  }

                  console.log('✅ Route regenerated successfully with', routeData.routes.length, 'route(s)');
                }
              } else {
                console.error('Failed to regenerate route:', routeResponse.status);
              }
            } catch (error) {
              console.error('Error regenerating route:', error);
            }
          }}
          onRouteSelect={(index) => {
            setSelectedRouteIndex(index);
            if (allRoutes.length > index && mapRef.current) {
              const selectedRoute = allRoutes[index];
              const newRouteMeta = {
                distance: selectedRoute.distance,
                duration: selectedRoute.duration,
                coordinates: selectedRoute.coordinates,
              };
              setRouteMetadata(newRouteMeta);
              routeMetadataRef.current = newRouteMeta;
              setCurrentRouteCoords(selectedRoute.coordinates);

              // Update map display - update primary route line
              const map = mapRef.current;
              if (map.getSource("shipment-line")) {
                const lineGeoJSON = {
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: {
                        type: "LineString",
                        coordinates: selectedRoute.coordinates,
                      },
                      properties: {
                        shipment: selectedShipment,
                        routeIndex: index,
                      },
                    },
                  ],
                };
                const src = map.getSource("shipment-line") as maplibregl.GeoJSONSource;
                src.setData(lineGeoJSON as GeoJSON.FeatureCollection);
              }

              // Update distance markers if they exist
              if (map.getSource("route-distance-markers") && selectedRoute.coordinates.length > 10) {
                const markerInterval = 5000; // 5km in meters
                const distanceMarkers: GeoJSON.Feature[] = [];
                let cumulativeDistance = 0;

                const haversineDistance = (coord1: number[], coord2: number[]): number => {
                  const R = 6371000;
                  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
                  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
                  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  return R * c;
                };

                for (let i = 1; i < selectedRoute.coordinates.length; i++) {
                  const segmentDist = haversineDistance(selectedRoute.coordinates[i - 1], selectedRoute.coordinates[i]);
                  cumulativeDistance += segmentDist;

                  if (cumulativeDistance >= markerInterval * (distanceMarkers.length + 1)) {
                    distanceMarkers.push({
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: selectedRoute.coordinates[i],
                      },
                      properties: {
                        label: `${((cumulativeDistance / 1000).toFixed(1))}km`,
                        distance: cumulativeDistance,
                      },
                    });
                  }
                }

                if (distanceMarkers.length > 0) {
                  const markersGeoJSON = {
                    type: "FeatureCollection",
                    features: distanceMarkers,
                  };
                  const markersSrc = map.getSource("route-distance-markers") as maplibregl.GeoJSONSource;
                  markersSrc.setData(markersGeoJSON as GeoJSON.FeatureCollection);
                }
              }
            }
          }}
        />

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