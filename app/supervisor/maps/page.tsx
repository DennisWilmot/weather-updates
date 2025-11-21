'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Filter, X, ChevronLeft, ChevronRight, MapPin, Zap } from 'lucide-react';

interface Layer {
    id: string;
    name: string;
    enabled: boolean;
    color: string;
}

export default function SupervisorMapPage() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [layers, setLayers] = useState<Layer[]>([
        { id: 'missions', name: 'Active Missions', enabled: true, color: '#3b82f6' },
        { id: 'zones', name: 'Restricted Zones', enabled: false, color: '#ef4444' },
    ]);

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
            onMapLoad(map);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    const onMapLoad = (map: Map) => {
        console.log('Map loaded successfully');
    };

    const toggleLayer = (layerId: string) => {
        setLayers(layers.map(layer =>
            layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
        ));
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
            {/* Left Panel */}
            <div
                className={`absolute top-0 left-0 h-full bg-white shadow-xl border-r border-gray-200 transition-all duration-300 z-20 ${isLeftPanelOpen ? 'w-80' : 'w-0'
                    }`}
            >
                <div className={`h-full flex flex-col ${isLeftPanelOpen ? '' : 'hidden'}`}>
                    {/* Header */}
                    <div className="bg-[#1a1a3c] p-6 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Map Controls</h2>
                                <p className="text-blue-100 text-sm">Manage layers and filters</p>
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
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Layers Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Layers size={20} className="text-[#1a1a3c]" />
                                <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
                            </div>
                            <div className="space-y-3">
                                {layers.map((layer) => (
                                    <div
                                        key={layer.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: layer.color }}
                                                />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {layer.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => toggleLayer(layer.id)}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${layer.enabled ? 'bg-[#1a1a3c]' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layer.enabled ? 'translate-x-6' : ''
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={20} className="text-[#1a1a3c]" />
                                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${showFilters ? 'bg-[#1a1a3c]' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showFilters ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                            </div>
                            {showFilters && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-700 mb-3 font-medium">Filter Options</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Status</span>
                                            <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white">
                                                <option>All</option>
                                                <option>Active</option>
                                                <option>Pending</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Priority</span>
                                            <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white">
                                                <option>All</option>
                                                <option>High</option>
                                                <option>Medium</option>
                                                <option>Low</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex-shrink-0">
                        <button className="w-full bg-[#1a1a3c] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Reset View
                        </button>
                    </div>
                </div>
            </div>

            {/* Left Panel Toggle Button */}
            {!isLeftPanelOpen && (
                <button
                    onClick={() => setIsLeftPanelOpen(true)}
                    className="absolute top-4 left-4 z-20 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                    <ChevronRight size={20} className="text-gray-700" />
                </button>
            )}

            {/* Right Panel */}
            <div
                className={`absolute top-0 right-0 h-full bg-white shadow-xl border-l border-gray-200 transition-all duration-300 z-20 ${isRightPanelOpen ? 'w-80' : 'w-0'
                    }`}
            >
                <div className={`h-full flex flex-col ${isRightPanelOpen ? '' : 'hidden'}`}>
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                AI Matching System
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This feature will intelligently match missions with available drones based on location, capabilities, and priority.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-blue-200">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <span className="text-sm font-medium text-gray-700">Coming Soon</span>
                            </div>
                        </div>

                        {/* Placeholder Stats */}
                        <div className="mt-6 space-y-3">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Active Missions</span>
                                    <span className="text-lg font-bold text-gray-900">0</span>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Available Drones</span>
                                    <span className="text-lg font-bold text-gray-900">0</span>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Match Accuracy</span>
                                    <span className="text-lg font-bold text-gray-900">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel Toggle Button */}
            {!isRightPanelOpen && (
                <button
                    onClick={() => setIsRightPanelOpen(true)}
                    className="absolute top-4 right-4 z-20 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-700" />
                </button>
            )}

            {/* Map Container */}
            <div className="w-full h-full">
                <div ref={mapContainer} className="w-full h-full" />
            </div>

            {/* Top Bar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white shadow-lg rounded-lg px-6 py-3 border border-gray-200">
                <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-[#1a1a3c]" />
                    <h1 className="text-lg font-bold text-gray-900">Supervisor Map View</h1>
                </div>
            </div>
        </div>
    );
}
