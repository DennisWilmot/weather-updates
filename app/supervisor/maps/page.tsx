'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, NavigationControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, ChevronLeft, ChevronRight, MapPin, Users, Box, Briefcase, Zap } from 'lucide-react';

interface LayerItem {
    id: string;
    name: string;
    enabled: boolean;
    color: string;
    count: number;
}

export default function SupervisorMapPage() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    const [layers, setLayers] = useState<LayerItem[]>([
        { id: 'people', name: 'People', enabled: true, color: '#FF6B6B', count: 0 },
        { id: 'assets', name: 'Assets', enabled: true, color: '#45B7D1', count: 0 },
        { id: 'skills', name: 'Skills', enabled: true, color: '#A78BFA', count: 0 },
    ]);

    const [loading, setLoading] = useState<Set<string>>(new Set());

    const onMapLoad = useCallback((map: Map) => {
        console.log('Map loaded successfully');

        // Add sources for each layer
        ['people', 'assets', 'skills'].forEach(layerId => {
            const layer = layers.find(l => l.id === layerId);
            if (!layer) return;

            // Add source
            map.addSource(layerId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterRadius: 50,
                clusterMaxZoom: 14,
            });

            // Add unclustered points layer
            map.addLayer({
                id: layerId,
                type: 'circle',
                source: layerId,
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-radius': 8,
                    'circle-color': layer.color,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.8,
                },
            });

            // Add cluster layer
            map.addLayer({
                id: `${layerId}-cluster`,
                type: 'circle',
                source: layerId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20, 10,
                        30, 100,
                        40
                    ],
                    'circle-color': layer.color,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.8,
                },
            });

            // Add cluster count layer
            map.addLayer({
                id: `${layerId}-cluster-count`,
                type: 'symbol',
                source: layerId,
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
        });

        // Load initial data
        loadLayerData(map);

        // Setup click handlers
        setupClickHandlers(map);
    }, [layers]);

    const setupClickHandlers = (map: Map) => {
        ['people', 'assets', 'skills'].forEach(layerId => {
            // Click on unclustered point
            map.on('click', layerId, (e) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const properties = feature.properties || {};

                    // Zoom to the point first
                    map.easeTo({
                        center: (feature.geometry as any).coordinates,
                        zoom: Math.max(map.getZoom() + 2, 14),
                        duration: 500,
                    });

                    const popupHTML = generatePopupHTML(properties, layerId);

                    new Popup({
                        closeButton: true,
                        closeOnClick: true,
                        maxWidth: '350px'
                    })
                        .setLngLat((feature.geometry as any).coordinates)
                        .setHTML(popupHTML)
                        .addTo(map);
                }
            });

            // Click on cluster
            map.on('click', `${layerId}-cluster`, (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: [`${layerId}-cluster`]
                });

                if (features.length > 0) {
                    const clusterId = features[0].properties?.cluster_id;
                    const source = map.getSource(layerId) as any;

                    if (clusterId && source) {
                        source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                            if (err) return;
                            map.easeTo({
                                center: (features[0].geometry as any).coordinates,
                                zoom: zoom || map.getZoom() + 2,
                                duration: 500,
                            });
                        });
                    }
                }
            });

            // Change cursor on hover
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
            });

            map.on('mouseenter', `${layerId}-cluster`, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', `${layerId}-cluster`, () => {
                map.getCanvas().style.cursor = '';
            });
        });
    };

    const generatePopupHTML = (properties: any, layerId: string): string => {
        const getTypeLabel = (type: string) => {
            return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        };

        const color = layerId === 'people' ? '#FF6B6B' : layerId === 'assets' ? '#45B7D1' : '#A78BFA';

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
        if (layerId === 'people') {
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

        // Assets-specific
        if (layerId === 'assets') {
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
        }

        // Skills-specific
        if (layerId === 'skills') {
            if (properties.category) {
                html += `<div style="margin: 6px 0; font-size: 14px;"><strong>Category:</strong> ${properties.category}</div>`;
            }
            if (properties.description) {
                html += `<div style="margin: 6px 0; font-size: 13px; color: #666;">${properties.description}</div>`;
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

    const loadLayerData = async (map: Map) => {
        const endpoints = {
            people: '/api/people',
            assets: '/api/assets',
            skills: '/api/skills',
        };

        for (const [layerId, endpoint] of Object.entries(endpoints)) {
            const layer = layers.find(l => l.id === layerId);
            if (!layer || !layer.enabled) continue;

            setLoading(prev => new Set(prev).add(layerId));

            try {
                console.log(`Loading ${layerId} from ${endpoint}...`);
                const response = await fetch(endpoint);

                if (!response.ok) {
                    console.error(`Failed to load ${layerId}: ${response.status} ${response.statusText}`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const apiData = await response.json();
                console.log(`Received data for ${layerId}:`, apiData);

                const geoJSON = transformToGeoJSON(apiData, layerId);
                console.log(`Transformed ${layerId} to GeoJSON with ${geoJSON.features?.length || 0} features`);

                const source = map.getSource(layerId) as any;
                if (source) {
                    source.setData(geoJSON);
                    console.log(`Updated ${layerId} source on map`);
                } else {
                    console.error(`Source ${layerId} not found on map`);
                }

                // Update count
                setLayers(prev => prev.map(l =>
                    l.id === layerId ? { ...l, count: geoJSON.features?.length || 0 } : l
                ));
            } catch (error) {
                console.error(`Error loading data for layer ${layerId}:`, error);
                // Show error in UI
                setLayers(prev => prev.map(l =>
                    l.id === layerId ? { ...l, count: 0 } : l
                ));
            } finally {
                setLoading(prev => {
                    const next = new Set(prev);
                    next.delete(layerId);
                    return next;
                });
            }
        }
    };

    const transformToGeoJSON = (data: any, layerId: string): any => {
        let items: any[] = [];

        // Try different possible response structures
        if (layerId === 'people') {
            items = data.people || data.data || data || [];
        } else if (layerId === 'assets') {
            items = data.assets || data.data || data || [];
        } else if (layerId === 'skills') {
            items = data.skills || data.data || data || [];
        }

        // Ensure items is an array
        if (!Array.isArray(items)) {
            console.warn(`Expected array for ${layerId}, got:`, typeof items);
            items = [];
        }

        console.log(`Transforming ${items.length} items for ${layerId}`);

        const features = items
            .filter((item: any) => {
                // Validate that item has required fields
                const hasCoords = item.latitude != null && item.longitude != null;
                if (!hasCoords) {
                    console.warn(`Item missing coordinates in ${layerId}:`, item);
                }
                return hasCoords;
            })
            .map((item: any) => {
                const lng = parseFloat(item.longitude);
                const lat = parseFloat(item.latitude);

                // Validate coordinates
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

    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm-tiles',
                        type: 'raster',
                        source: 'osm',
                        minzoom: 0,
                        maxzoom: 19,
                    },
                ],
            },
            center: [-77.9160, 18.4663],
            zoom: 10,
        });

        map.addControl(new NavigationControl(), 'top-right');

        map.on('load', () => {
            setMapLoaded(true);
            onMapLoad(map);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    const toggleLayer = (layerId: string) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || !mapRef.current) return;

        const newEnabled = !layer.enabled;

        setLayers(layers.map(l =>
            l.id === layerId ? { ...l, enabled: newEnabled } : l
        ));

        // Update map layer visibility
        const map = mapRef.current;
        const layerIds = [layerId, `${layerId}-cluster`, `${layerId}-cluster-count`];

        layerIds.forEach(id => {
            if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', newEnabled ? 'visible' : 'none');
            }
        });

        // Reload data if enabling
        if (newEnabled && mapLoaded) {
            loadLayerData(map);
        }
    };

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

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-gray-100">

            {/* Left Panel - wrapped in pointer-events-none */}
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

            {/* Right Panel - also pointer-events-none wrapper */}
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

            {/* Map Container */}
            <div className="w-full h-full pointer-events-auto">
                <div ref={mapContainer} className="w-full h-full" />
            </div>

            {/* Top Bar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-white shadow-lg rounded-lg px-6 py-3 border border-gray-200 pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-[#1a1a3c]" />
                        <h1 className="text-lg font-bold text-gray-900">Supervisor Map View</h1>
                    </div>
                </div>
            </div>

        </div>
    );

}