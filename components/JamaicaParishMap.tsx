'use client';

import { Box } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface JamaicaParishMapProps {
  selectedParish: string;
  onParishClick: (parishName: string) => void;
}

// Parish names are now stored in GeoJSON properties, no need for mapping here

export default function JamaicaParishMap({ selectedParish, onParishClick }: JamaicaParishMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with OpenStreetMap-based style (no external fonts needed)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [-77.2975, 18.1096], // Jamaica center
      zoom: 7,
      maxBounds: [
        [-78.5, 17.7], // Southwest corner
        [-76.0, 18.6]  // Northeast corner
      ] as maplibregl.LngLatBoundsLike,
      interactive: true,
      scrollZoom: false, // Disable scroll zoom for better UX in constrained space
      doubleClickZoom: false,
      dragRotate: false,
      touchZoomRotate: false
    });

    map.current.on('load', () => {
      if (!map.current) return;

      console.log('Map loaded, fetching GeoJSON...');

      // Load GeoJSON data
      fetch('/jamaica-parishes.geojson')
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          if (!map.current) return;

          console.log('GeoJSON loaded:', data.features?.length, 'features');

          // Check if source already exists (prevent errors on re-render)
          if (map.current.getSource('parishes')) {
            map.current.removeLayer('parishes-fill');
            map.current.removeLayer('parishes-outline');
            map.current.removeSource('parishes');
          }

          // Add GeoJSON source
          map.current.addSource('parishes', {
            type: 'geojson',
            data: data
          });

          console.log('Source added');

          // Add fill layer for parishes (above base layer)
          // Temporarily use higher opacity to ensure visibility
          map.current.addLayer({
            id: 'parishes-fill',
            type: 'fill',
            source: 'parishes',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'name'], selectedParish],
                '#1e50ff', // Blue for selected
                ['case',
                  ['!=', selectedParish, ''],
                  '#6f9c76', // Green when another is selected
                  '#6f9c76'  // Green default
                ]
              ],
              'fill-opacity': [
                'case',
                ['==', ['get', 'name'], selectedParish],
                0.8, // Full opacity for selected
                ['case',
                  ['!=', selectedParish, ''],
                  0.6, // Dimmed when another is selected
                  0.7  // Default opacity - increased for visibility
                ]
              ]
            }
          }, 'osm-tiles-layer'); // Insert above base layer

          console.log('Fill layer added');
          
          // Verify layer was added
          const fillLayer = map.current.getLayer('parishes-fill');
          console.log('Fill layer exists:', !!fillLayer);
          
          // Verify source and bounds
          const source = map.current.getSource('parishes') as maplibregl.GeoJSONSource;
          if (source) {
            const data = source._data;
            if (data && typeof data === 'object' && 'features' in data && Array.isArray(data.features)) {
              console.log('GeoJSON loaded - first feature:', data.features[0]?.properties?.name);
              // Calculate bounds for debugging
              let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
              data.features.forEach((f: any) => {
                if (f.geometry.type === 'Polygon' && f.geometry.coordinates[0]) {
                  f.geometry.coordinates[0].forEach((coord: number[]) => {
                    minLng = Math.min(minLng, coord[0]);
                    maxLng = Math.max(maxLng, coord[0]);
                    minLat = Math.min(minLat, coord[1]);
                    maxLat = Math.max(maxLat, coord[1]);
                  });
                }
              });
              console.log('GeoJSON bounds:', { minLng, maxLng, minLat, maxLat });
              console.log('Map center:', map.current.getCenter());
              console.log('Map zoom:', map.current.getZoom());
              console.log('All parish names:', data.features.map((f: any) => f.properties?.name));
            }
          }

          // Add border/outline layer
          map.current.addLayer({
            id: 'parishes-outline',
            type: 'line',
            source: 'parishes',
            paint: {
              'line-color': '#ffffff',
              'line-width': 2
            }
          });

          console.log('Outline layer added');

          // Add click handler for fill layer
          const handleFillClick = (e: maplibregl.MapLayerMouseEvent) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const parishName = feature.properties?.name;
              console.log('Parish fill clicked:', parishName, feature);
              if (parishName) {
                onParishClick(parishName);
              }
            } else {
              console.log('Click on fill layer but no features found');
            }
          };

          map.current.on('click', 'parishes-fill', handleFillClick);

          // Also add click handler to outline layer as fallback
          const handleOutlineClick = (e: maplibregl.MapLayerMouseEvent) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const parishName = feature.properties?.name;
              console.log('Parish outline clicked:', parishName);
              if (parishName) {
                onParishClick(parishName);
              }
            }
          };

          map.current.on('click', 'parishes-outline', handleOutlineClick);

          // Debug: Add general click handler to see if clicks are registered
          map.current.on('click', (e) => {
            console.log('=== MAP CLICK EVENT ===');
            console.log('Click point (pixel):', e.point);
            console.log('Click coordinates (lng/lat):', e.lngLat);
            
            // Query ALL rendered features first
            const allFeatures = map.current!.queryRenderedFeatures(e.point);
            console.log('All features at click point:', allFeatures.length);
            console.log('All feature layers:', allFeatures.map(f => f.layer.id));
            
            // Query features at click point for our layers
            const features = map.current!.queryRenderedFeatures(e.point, {
              layers: ['parishes-fill', 'parishes-outline']
            });
            console.log('Parish features found:', features.length);
            
            if (features.length > 0) {
              console.log('Parish features:', features);
              const parishName = features[0].properties?.name;
              if (parishName) {
                console.log('Calling onParishClick with:', parishName);
                onParishClick(parishName);
              }
            } else {
              console.log('No parish features found at click point');
              // Let's also try querying the source directly
              const source = map.current!.getSource('parishes') as maplibregl.GeoJSONSource;
              if (source && source._data && typeof source._data === 'object' && 'features' in source._data) {
                console.log('Source has', Array.isArray(source._data.features) ? source._data.features.length : 0, 'features');
              }
            }
    });

          // Hover effects for fill layer
          map.current.on('mouseenter', 'parishes-fill', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', 'parishes-fill', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });

          // Hover effects for outline layer
          map.current.on('mouseenter', 'parishes-outline', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', 'parishes-outline', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });

          setMapLoaded(true);
          console.log('Map fully initialized');
        })
        .catch(error => {
          console.error('Error loading GeoJSON:', error);
        });
    });

    // Add error handler
    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty deps - only initialize once

  // Update map styling when selectedParish changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Update fill color and opacity based on selection
    map.current.setPaintProperty('parishes-fill', 'fill-color', [
      'case',
      ['==', ['get', 'name'], selectedParish],
      '#1e50ff',
      ['case',
        ['!=', selectedParish, ''],
        '#6f9c76',
        '#6f9c76'
      ]
    ]);

    map.current.setPaintProperty('parishes-fill', 'fill-opacity', [
      'case',
      ['==', ['get', 'name'], selectedParish],
      1,
      ['case',
        ['!=', selectedParish, ''],
        0.5,
        0.6
      ]
    ]);
  }, [selectedParish, mapLoaded]);

  return (
    <Box 
      ref={mapContainer}
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px'
      }}
    />
  );
}
