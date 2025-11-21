'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, ChevronLeft, ChevronRight, MapPin, Users, Box, Briefcase, Zap } from 'lucide-react';
import EnhancedMap from '@/components/EnhancedMap';
import { useMapLayerManager } from '@/components/MapLayerManager';
import { LayerConfig } from '@/lib/maps/layer-types';

interface LayerItem {
    id: string;
    name: string;
    enabled: boolean;
    color: string;
    count: number;
}

// Dashboard's popup HTML generation function
const generatePopupHTML = (properties: any, layer: string): string => {
    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const color = layer === 'people' ? '#FF6B6B' : layer === 'places' ? '#4ECDC4' : '#45B7D1';

    let html = `
    <div style="padding: 12px; min-width: 250px; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 20px; height: 20px; background: ${color}; border-radius: 50%;"></div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${properties.name || 'Unknown'}</h3>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${getTypeLabel(properties.type || 'unknown')}
        </span>
      </div>
  `;

    // People-specific
    if (layer === 'people') {
        if (properties.contactName) {
            html += `<div style="margin: 6px 0; font-size: 14px;">👤 ${properties.contactName}</div>`;
        }
        if (properties.contactPhone) {
            html += `<div style="margin: 6px 0; font-size: 14px;">📞 ${properties.contactPhone}</div>`;
        }
        if (properties.contactEmail) {
            html += `<div style="margin: 6px 0; font-size: 14px; word-break: break-word;">✉️ ${properties.contactEmail}</div>`;
        }
        if (properties.organization) {
            html += `<div style="margin: 6px 0; font-size: 14px;">🏢 ${properties.organization}</div>`;
        }
    }

    // Places-specific
    if (layer === 'places') {
        if (properties.address) {
            html += `<div style="margin: 6px 0; font-size: 14px;">📍 ${properties.address}</div>`;
        }
        if (properties.maxCapacity) {
            html += `<div style="margin: 6px 0; font-size: 14px;"><strong>Capacity:</strong> ${properties.maxCapacity}</div>`;
        }
        if (properties.description) {
            html += `<div style="margin: 6px 0; font-size: 13px; color: #666;">${properties.description}</div>`;
        }
        if (properties.verified) {
            html += `<div style="margin: 6px 0;"><span style="background: #51cf66; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">✓ Verified</span></div>`;
        }
    }

    // Assets-specific
    if (layer === 'assets') {
        if (properties.serialNumber) {
            html += `<div style="margin: 6px 0; font-size: 14px;"><strong>Serial:</strong> ${properties.serialNumber}</div>`;
        }
        if (properties.status) {
            const statusColors: Record<string, string> = {
                available: '#51cf66',
                in_use: '#ffd43b',
                maintenance: '#ff922b',
                retired: '#868e96',
            };
            const statusColor = statusColors[properties.status] || '#868e96';
            html += `<div style="margin: 6px 0;"><span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${getTypeLabel(properties.status)}</span></div>`;
        }
        if (properties.currentLocation) {
            html += `<div style="margin: 6px 0; font-size: 14px;">📍 ${properties.currentLocation}</div>`;
        }
        if (properties.organization) {
            html += `<div style="margin: 6px 0; font-size: 14px;">🏢 ${properties.organization}</div>`;
        }
    }

    // Location (common)
    if (properties.communityName || properties.parishName) {
        html += `<div style="border-top: 1px solid #e9ecef; margin-top: 12px; padding-top: 8px;">`;
        if (properties.communityName) {
            html += `<div style="font-size: 12px; color: #868e96;">${properties.communityName}${properties.parishName ? `, ${properties.parishName}` : ''}</div>`;
        } else if (properties.parishName) {
            html += `<div style="font-size: 12px; color: #868e96;">${properties.parishName}</div>`;
        }
        html += `</div>`;
    }

    html += `</div>`;
    return html;
};

// Dashboard's transformToGeoJSON function
const transformToGeoJSON = (data: any, layerId: string): any => {
    let items: any[] = [];

    // Try different possible response structures
    if (layerId === 'people') {
        items = data.people || data.data || data || [];
    } else if (layerId === 'places') {
        items = data.places || data.data || data || [];
    } else if (layerId === 'assets') {
        items = data.assets || data.data || data || [];
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
        console.warn(`Expected array for ${layerId}, got:`, typeof items);
        items = [];
    }

    console.log(`Transforming ${items.length} items for ${layerId}`);

    const features = items
        .filter((item: any) => {
            const hasCoords = item.latitude != null && item.longitude != null;
            if (!hasCoords) {
                console.warn(`Item missing coordinates in ${layerId}:`, item);
            }
            return hasCoords;
        })
        .map((item: any) => {
            const lng = parseFloat(item.longitude);
            const lat = parseFloat(item.latitude);

            if (isNaN(lng) || isNaN(lat)) {
                console.warn(`Invalid coordinates for item in ${layerId}:`, item);
                return null;
            }

            return {
                type: 'Feature',
                id: item.id,
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                properties: {
                    ...item,
                    layer: layerId,
                },
            };
        })
        .filter((feature: any) => feature !== null);

    return {
        type: 'FeatureCollection',
        features,
    };
};

export default function SupervisorMapPage() {
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

    const [layers, setLayers] = useState<LayerItem[]>([
        { id: 'people', name: 'People', enabled: true, color: '#FF6B6B', count: 0 },
        { id: 'places', name: 'Places', enabled: true, color: '#4ECDC4', count: 0 },
        { id: 'assets', name: 'Assets', enabled: true, color: '#45B7D1', count: 0 },
    ]);

    const [loading, setLoading] = useState<Set<string>>(new Set());
    const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['people', 'places', 'assets']));
    const [activeLayers, setActiveLayers] = useState<LayerConfig[]>([]);

    // MapLayerManager hook
    const {
        manager,
        registerLayer,
        setLayerVisibility,
        addSource,
        updateLayerData,
    } = useMapLayerManager(mapInstance);

    // Dashboard's click handlers setup
    const setupClickHandlers = useCallback((map: maplibregl.Map) => {
        ['people', 'places', 'assets'].forEach(layerId => {
            // Click on unclustered point
            map.on('click', layerId, (e) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const properties = feature.properties || {};
                    const layer = properties.layer as 'people' | 'places' | 'assets';

                    if (!layer) return;

                    // Create popup using Dashboard's popup HTML
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

        // Dashboard's cluster click logic
        ['people', 'places', 'assets'].forEach(layerId => {
            map.on('click', `${layerId}-cluster`, (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: [`${layerId}-cluster`]
                });

                if (features.length > 0) {
                    const clusterId = features[0].properties?.cluster_id;

                    if (clusterId) {
                        const source = map.getSource(layerId) as maplibregl.GeoJSONSource;
                        // Handle both callback and promise APIs
                        const getExpansionZoom = (src: maplibregl.GeoJSONSource, cid: number) => {
                            if (typeof src.getClusterExpansionZoom === 'function') {
                                try {
                                    const res = src.getClusterExpansionZoom(cid);
                                    if (res && typeof (res as Promise<number>).then === 'function') {
                                        // Promise API
                                        (res as Promise<number>).then((zoom) => {
                                            map.easeTo({
                                                center: (features[0].geometry as any).coordinates,
                                                zoom: zoom || map.getZoom() + 2,
                                            });
                                        }).catch(() => {
                                            // Handle error silently
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

            // Cursor changes for clusters
            map.on('mouseenter', `${layerId}-cluster`, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', `${layerId}-cluster`, () => {
                map.getCanvas().style.cursor = '';
            });
        });
    }, []);

    // Dashboard's map load handler
    const handleMapLoad = useCallback((map: maplibregl.Map) => {
        setMapInstance(map);
        setMapLoaded(true);

        map.on('dblclick', (e) => {
            map.easeTo({
                center: e.lngLat,
                zoom: map.getZoom() + 1,
                duration: 500,
            });
        });

        // Setup click handlers after a brief delay to ensure layers are added
        setTimeout(() => setupClickHandlers(map), 500);
    }, [setupClickHandlers]);

    // Initialize layers using Dashboard's endpoints
    useEffect(() => {
        if (!mapLoaded || !manager || !mapInstance) return;

        const layerConfigs: LayerConfig[] = [];

        // Dashboard's layer definitions with endpoints
        const baseLayerDefs = [
            { id: 'people', name: 'People', color: '#FF6B6B', icon: 'user', endpoint: '/api/people' },
            { id: 'places', name: 'Places', color: '#4ECDC4', icon: 'map-pin', endpoint: '/api/places' },
            { id: 'assets', name: 'Assets', color: '#45B7D1', icon: 'box', endpoint: '/api/assets' },
        ];

        baseLayerDefs.forEach(({ id, name, color, icon, endpoint }) => {
            const sourceId = id;

            // Add source with empty GeoJSON
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

    // Load layer data when visibility changes - using Dashboard's logic
    useEffect(() => {
        if (!mapLoaded || !mapInstance) return;

        const loadLayerData = async (layerId: string) => {
            setLoading((prev) => new Set(prev).add(layerId));

            try {
                const layer = activeLayers.find(l => l.id === layerId);
                const endpoint = layer?.metadata?.endpoint;
                if (!endpoint) {
                    console.warn(`No endpoint for layer: ${layerId}`);
                    return;
                }

                console.log(`Loading data for ${layerId} from ${endpoint}`);

                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const apiData = await response.json();
                console.log(`Received API data for ${layerId}:`, apiData);

                // Transform API response to GeoJSON using Dashboard's transform function
                const geoJSON = transformToGeoJSON(apiData, layerId);
                console.log(`Transformed to ${geoJSON.features?.length || 0} features for ${layerId}`);

                // Update layer data
                if (manager) {
                    updateLayerData(layerId, geoJSON);

                    // Update count
                    const count = geoJSON.features?.length || 0;
                    setLayers((prev) => prev.map(l =>
                        l.id === layerId ? { ...l, count } : l
                    ));
                }
            } catch (error) {
                console.error(`Error loading data for layer ${layerId}:`, error);
                setLayers((prev) => prev.map(l =>
                    l.id === layerId ? { ...l, count: 0 } : l
                ));
            } finally {
                setLoading((prev) => {
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
    const toggleLayer = useCallback((layerId: string) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer) return;

        const newEnabled = !layer.enabled;

        setLayers(layers.map(l =>
            l.id === layerId ? { ...l, enabled: newEnabled } : l
        ));

        setVisibleLayers((prev) => {
            const next = new Set(prev);
            if (newEnabled) {
                next.add(layerId);
            } else {
                next.delete(layerId);
            }
            return next;
        });

        // Update map layer visibility
        if (manager) {
            setLayerVisibility(layerId, newEnabled);
        }
    }, [layers, manager, setLayerVisibility]);

    const getIcon = (layerId: string) => {
        switch (layerId) {
            case 'people':
                return <Users size={20} />;
            case 'places':
                return <MapPin size={20} />;
            case 'assets':
                return <Box size={20} />;
            default:
                return null;
        }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-gray-100">

            {/* Left Panel */}
            <div
                className={`absolute top-0 left-0 h-full z-20 transition-all duration-300 pointer-events-none ${isLeftPanelOpen ? "w-80" : "w-0"
                    }`}
            >
                <div className={`h-full flex flex-col bg-white shadow-xl border-r border-gray-200 pointer-events-auto ${isLeftPanelOpen ? "" : "hidden"}`}>
                    {/* Header */}
                    <div className="bg-[#1a1a3c] p-6 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Map Layers</h2>
                                <p className="text-blue-100 text-sm">Toggle layers to view data</p>
                            </div>
                            <button
                                onClick={() => setIsLeftPanelOpen(false)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {layers.map(layer => (
                            <div
                                key={layer.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: `${layer.color}20`, color: layer.color }}
                                        >
                                            {getIcon(layer.id)}
                                        </div>
                                        <div>
                                            <span className="text-base font-semibold text-gray-900 block">
                                                {layer.name}
                                            </span>
                                            {layer.count > 0 && (
                                                <span className="text-xs text-gray-500">
                                                    {layer.count} item{layer.count !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleLayer(layer.id)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${layer.enabled ? "bg-[#1a1a3c]" : "bg-gray-300"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layer.enabled ? "translate-x-6" : ""
                                                }`}
                                        />
                                    </button>
                                </div>

                                {loading.has(layer.id) && (
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Left Panel Toggle */}
            {!isLeftPanelOpen && (
                <button
                    onClick={() => setIsLeftPanelOpen(true)}
                    className="absolute top-4 left-4 z-20 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors pointer-events-auto"
                >
                    <ChevronRight size={20} className="text-gray-700" />
                </button>
            )}

            {/* Right Panel */}
            <div
                className={`absolute top-0 right-0 h-full z-20 transition-all duration-300 pointer-events-none ${isRightPanelOpen ? "w-80" : "w-0"
                    }`}
            >
                <div className={`h-full flex flex-col bg-white shadow-xl border-l border-gray-200 pointer-events-auto ${isRightPanelOpen ? "" : "hidden"}`}>
                    {/* Header */}
                    <div className="bg-[#1a1a3c] p-6 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={24} className="text-yellow-400" />
                                    <h2 className="text-2xl font-bold text-white">AI Matching</h2>
                                </div>
                                <p className="text-blue-100 text-sm">Intelligent mission assignment</p>
                            </div>
                            <button
                                onClick={() => setIsRightPanelOpen(false)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Right panel content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matching System</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This feature will intelligently match missions with drones.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-blue-200">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                                </span>
                                <span className="text-sm font-medium text-gray-700">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Toggle */}
            {!isRightPanelOpen && (
                <button
                    onClick={() => setIsRightPanelOpen(true)}
                    className="absolute top-4 right-4 z-20 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors pointer-events-auto"
                >
                    <ChevronLeft size={20} className="text-gray-700" />
                </button>
            )}

            {/* Map Container - Using EnhancedMap */}
            <div className="w-full h-full pointer-events-auto">
                <EnhancedMap
                    onMapLoad={handleMapLoad}
                    initialLayers={activeLayers}
                />
            </div>



        </div>
    );
}