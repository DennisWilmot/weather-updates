'use client';

import { Box } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SheltersJDFMapProps {
  showShelters: boolean;
  showJDFBases: boolean;
  enableLocation?: boolean;
  onLocationStatusChange?: (status: 'granted' | 'denied' | 'prompt' | 'checking') => void;
}

// Utility functions for calculating intermediate points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
}

function calculateDestinationPoint(
  lat: number, 
  lon: number, 
  bearing: number, 
  distanceKm: number
): [number, number] {
  const R = 6371; // Earth's radius in km
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  
  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceKm / R) +
    Math.cos(latRad) * Math.sin(distanceKm / R) * Math.cos(bearingRad)
  );
  
  const destLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distanceKm / R) * Math.cos(latRad),
    Math.cos(distanceKm / R) - Math.sin(latRad) * Math.sin(destLatRad)
  );
  
  return [destLonRad * 180 / Math.PI, destLatRad * 180 / Math.PI];
}

function generateCheckpoints(
  sheltersGeoJSON: any, 
  jdfBasesGeoJSON: any, 
  intervalKm: number = 3.5
): any {
  const checkpoints: any[] = [];
  let checkpointId = 0;
  
  // Process each shelter
  sheltersGeoJSON.features.forEach((shelter: any) => {
    const [shelterLon, shelterLat] = shelter.geometry.coordinates;
    
    // Process each JDF base
    jdfBasesGeoJSON.features.forEach((jdfBase: any) => {
      const [jdfLon, jdfLat] = jdfBase.geometry.coordinates;
      
      // Calculate distance between shelter and JDF base
      const distance = calculateDistance(shelterLat, shelterLon, jdfLat, jdfLon);
      
      // Only create checkpoints if distance is greater than interval
      if (distance > intervalKm) {
        // Calculate bearing
        const bearing = calculateBearing(shelterLat, shelterLon, jdfLat, jdfLon);
        
        // Calculate number of checkpoints needed
        const numCheckpoints = Math.floor(distance / intervalKm);
        
        // Generate checkpoints along the path
        for (let i = 1; i <= numCheckpoints; i++) {
          const checkpointDistance = i * intervalKm;
          
          // Only create if checkpoint is before the destination
          if (checkpointDistance < distance) {
            const [checkpointLon, checkpointLat] = calculateDestinationPoint(
              shelterLat,
              shelterLon,
              bearing,
              checkpointDistance
            );
            
            checkpoints.push({
              type: 'Feature',
              properties: {
                id: `checkpoint-${checkpointId++}`,
                type: 'checkpoint',
                distanceFromShelter: checkpointDistance.toFixed(2),
                distanceToJDF: (distance - checkpointDistance).toFixed(2),
                totalDistance: distance.toFixed(2),
                shelterName: shelter.properties?.Name || 'Unknown',
                jdfBaseName: jdfBase.properties?.Name || 'Unknown'
              },
              geometry: {
                type: 'Point',
                coordinates: [checkpointLon, checkpointLat]
              }
            });
          }
        }
      }
    });
  });
  
  return {
    type: 'FeatureCollection',
    features: checkpoints
  };
}

export default function SheltersJDFMap({ showShelters, showJDFBases, enableLocation = false, onLocationStatusChange }: SheltersJDFMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const userLocationMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with OpenStreetMap-based style
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
      interactive: true,
      scrollZoom: true,
      doubleClickZoom: true,
      dragRotate: false,
      touchZoomRotate: true,
      touchPitch: true,
      dragPan: true,
      boxZoom: true,
      keyboard: true,
      cooperativeGestures: false
    });

    // Create popup for location details
    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px'
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Load both GeoJSON files and generate checkpoints
      Promise.all([
        fetch('/maps/BR_SAV_WDG.geojson').then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch shelters GeoJSON: ${res.status} ${res.statusText}`);
          }
          return res.json();
        }),
        fetch('/maps/BR_SAV_jdf_WDG.geojson').then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch JDF bases GeoJSON: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
      ])
        .then(([sheltersData, jdfData]) => {
          if (!map.current) return;

          // Add shelters source
          if (map.current.getSource('shelters')) {
            map.current.removeLayer('shelters-layer');
            map.current.removeSource('shelters');
          }

          map.current.addSource('shelters', {
            type: 'geojson',
            data: sheltersData
          });

          // Add shelters layer
          map.current.addLayer({
            id: 'shelters-layer',
            type: 'circle',
            source: 'shelters',
            paint: {
              'circle-radius': 8,
              'circle-color': '#1e50ff',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.8
            }
          });

          // Add click handler for shelters
          map.current.on('click', 'shelters-layer', (e) => {
            if (!e.features || e.features.length === 0 || !popup.current) return;
            
            const feature = e.features[0];
            const props = feature.properties;
            const name = props?.Name || 'Unknown';
            const parish = props?.PARISH || 'Unknown';
            const location = props?.LOCATION_O || 'Unknown';
            const areas = props?.AREAS_SERV || 'N/A';
            const type = props?.TYPE_OF_FA || 'N/A';

            const html = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${name}</h3>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Parish:</strong> ${parish}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${location}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Areas Served:</strong> ${areas}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${type}</p>
              </div>
            `;

            popup.current
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map.current!);
          });

          // Hover effect for shelters
          map.current.on('mouseenter', 'shelters-layer', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', 'shelters-layer', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });

          // Add JDF bases source
          if (map.current.getSource('jdf-bases')) {
            map.current.removeLayer('jdf-bases-layer');
            map.current.removeSource('jdf-bases');
          }

          map.current.addSource('jdf-bases', {
            type: 'geojson',
            data: jdfData
          });

          // Add JDF bases layer
          map.current.addLayer({
            id: 'jdf-bases-layer',
            type: 'circle',
            source: 'jdf-bases',
            paint: {
              'circle-radius': 8,
              'circle-color': '#ff6b35',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.8
            }
          });

          // Add click handler for JDF bases
          map.current.on('click', 'jdf-bases-layer', (e) => {
            if (!e.features || e.features.length === 0 || !popup.current) return;
            
            const feature = e.features[0];
            const props = feature.properties;
            const name = props?.Name || 'Unknown';
            const parish = props?.PARISH || 'Unknown';
            const location = props?.LOCATION_O || 'Unknown';
            const areas = props?.AREAS_SERV || 'N/A';
            const type = props?.TYPE_OF_FA || 'N/A';

            const html = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${name}</h3>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Parish:</strong> ${parish}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${location}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Areas Served:</strong> ${areas}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${type}</p>
              </div>
            `;

            popup.current
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map.current!);
          });

          // Hover effect for JDF bases
          map.current.on('mouseenter', 'jdf-bases-layer', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', 'jdf-bases-layer', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });

          setMapLoaded(true);
        })
        .catch(error => {
          console.error('Error loading GeoJSON files:', error);
        });
    });

    // Cleanup
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty deps - only initialize once

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (map.current.getLayer('shelters-layer')) {
      map.current.setLayoutProperty('shelters-layer', 'visibility', showShelters ? 'visible' : 'none');
    }

    if (map.current.getLayer('jdf-bases-layer')) {
      map.current.setLayoutProperty('jdf-bases-layer', 'visibility', showJDFBases ? 'visible' : 'none');
    }
  }, [showShelters, showJDFBases, mapLoaded]);

  // Handle location tracking when enableLocation changes
  useEffect(() => {
    if (!enableLocation || !map.current || !mapLoaded) {
      // Clean up if location is disabled
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
      }
      if (map.current) {
        if (map.current.getLayer('user-location-circle-layer')) {
          map.current.removeLayer('user-location-circle-layer');
        }
        if (map.current.getLayer('user-location-circle-outline')) {
          map.current.removeLayer('user-location-circle-outline');
        }
        if (map.current.getSource('user-location-circle')) {
          map.current.removeSource('user-location-circle');
        }
      }
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      onLocationStatusChange?.('denied');
      return;
    }

    onLocationStatusChange?.('checking');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // First try to get current position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (!map.current) return;

        onLocationStatusChange?.('granted');

        const userLocation: [number, number] = [longitude, latitude];

        // Create user location marker (green dot)
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#22c55e';
        el.style.border = '3px solid #ffffff';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        userLocationMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat(userLocation)
          .addTo(map.current);

        // Create accuracy circle
        const accuracyRadius = accuracy || 50;
        const latRad = latitude * Math.PI / 180;
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLng = 111320 * Math.cos(latRad);
        const radiusLat = accuracyRadius / metersPerDegreeLat;
        const radiusLng = accuracyRadius / metersPerDegreeLng;

        const circleGeoJSON = {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              ...Array.from({ length: 64 }, (_, i) => {
                const angle = (i / 64) * 2 * Math.PI;
                return [
                  longitude + radiusLng * Math.cos(angle),
                  latitude + radiusLat * Math.sin(angle)
                ];
              }),
              [longitude + radiusLng, latitude]
            ]]
          },
          properties: {}
        };

        map.current.addSource('user-location-circle', {
          type: 'geojson',
          data: circleGeoJSON
        });

        map.current.addLayer({
          id: 'user-location-circle-layer',
          type: 'fill',
          source: 'user-location-circle',
          paint: {
            'fill-color': '#22c55e',
            'fill-opacity': 0.2
          }
        });

        map.current.addLayer({
          id: 'user-location-circle-outline',
          type: 'line',
          source: 'user-location-circle',
          paint: {
            'line-color': '#22c55e',
            'line-width': 2,
            'line-opacity': 0.5
          }
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          onLocationStatusChange?.('denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          onLocationStatusChange?.('denied');
        } else if (error.code === error.TIMEOUT) {
          onLocationStatusChange?.('denied');
        } else {
          onLocationStatusChange?.('denied');
        }
      },
      options
    );

    // Then watch for position updates
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (!map.current) return;

        const userLocation: [number, number] = [longitude, latitude];

        // Remove existing marker and circle layers
        if (userLocationMarker.current) {
          userLocationMarker.current.remove();
        }
        if (map.current.getLayer('user-location-circle-layer')) {
          map.current.removeLayer('user-location-circle-layer');
        }
        if (map.current.getLayer('user-location-circle-outline')) {
          map.current.removeLayer('user-location-circle-outline');
        }
        if (map.current.getSource('user-location-circle')) {
          map.current.removeSource('user-location-circle');
        }

        // Create user location marker (green dot)
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#22c55e';
        el.style.border = '3px solid #ffffff';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        userLocationMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat(userLocation)
          .addTo(map.current);

        // Create accuracy circle
        const accuracyRadius = accuracy || 50;
        const latRad = latitude * Math.PI / 180;
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLng = 111320 * Math.cos(latRad);
        const radiusLat = accuracyRadius / metersPerDegreeLat;
        const radiusLng = accuracyRadius / metersPerDegreeLng;

        const circleGeoJSON = {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              ...Array.from({ length: 64 }, (_, i) => {
                const angle = (i / 64) * 2 * Math.PI;
                return [
                  longitude + radiusLng * Math.cos(angle),
                  latitude + radiusLat * Math.sin(angle)
                ];
              }),
              [longitude + radiusLng, latitude]
            ]]
          },
          properties: {}
        };

        map.current.addSource('user-location-circle', {
          type: 'geojson',
          data: circleGeoJSON
        });

        map.current.addLayer({
          id: 'user-location-circle-layer',
          type: 'fill',
          source: 'user-location-circle',
          paint: {
            'fill-color': '#22c55e',
            'fill-opacity': 0.2
          }
        });

        map.current.addLayer({
          id: 'user-location-circle-outline',
          type: 'line',
          source: 'user-location-circle',
          paint: {
            'line-color': '#22c55e',
            'line-width': 2,
            'line-opacity': 0.5
          }
        });
      },
      (error) => {
        console.error('Geolocation watch error:', error);
        onLocationStatusChange?.('denied');
      },
      options
    );

    // Cleanup function
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enableLocation, mapLoaded, onLocationStatusChange]);

  return (
    <Box 
      ref={mapContainer}
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px',
        touchAction: 'pan-x pan-y pinch-zoom',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto'
      }}
    />
  );
}

