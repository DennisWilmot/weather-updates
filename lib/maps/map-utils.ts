/**
 * Map utility functions for MapLibre GL JS
 */

import maplibregl from 'maplibre-gl';

/**
 * Create a default map style with OpenStreetMap tiles
 */
export function createDefaultMapStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

/**
 * Default map options for Jamaica
 */
export const defaultMapOptions: Partial<maplibregl.MapOptions> = {
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
  cooperativeGestures: false,
};

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if coordinates are within Jamaica bounds
 */
export function isWithinJamaicaBounds(lat: number, lon: number): boolean {
  return lat >= 17.7 && lat <= 18.5 && lon >= -78.5 && lon <= -76.2;
}

/**
 * Get viewport bounds from map
 */
export function getViewportBounds(map: maplibregl.Map): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const bounds = map.getBounds();
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

/**
 * Debounce function for map events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}



