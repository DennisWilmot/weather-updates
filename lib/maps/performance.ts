/**
 * Performance optimization utilities for map rendering
 * Includes viewport-based fetching, caching, and debouncing
 */

import maplibregl from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { getViewportBounds } from './map-utils';

export interface GeoJSONCacheEntry {
  data: FeatureCollection;
  timestamp: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface GeoJSONCache {
  [key: string]: GeoJSONCacheEntry;
}

/**
 * Create a GeoJSON cache manager
 */
export function createGeoJSONCache(ttl: number = 30000): {
  get: (key: string) => FeatureCollection | null;
  set: (key: string, data: FeatureCollection, bounds?: any) => void;
  clear: () => void;
  has: (key: string) => boolean;
} {
  const cache: GeoJSONCache = {};

  return {
    get(key: string): FeatureCollection | null {
      const entry = cache[key];
      if (!entry) return null;

      const age = Date.now() - entry.timestamp;
      if (age > ttl) {
        delete cache[key];
        return null;
      }

      return entry.data;
    },

    set(key: string, data: FeatureCollection, bounds?: any): void {
      cache[key] = {
        data,
        timestamp: Date.now(),
        bounds,
      };
    },

    clear(): void {
      Object.keys(cache).forEach((key) => delete cache[key]);
    },

    has(key: string): boolean {
      return key in cache && Date.now() - cache[key].timestamp <= ttl;
    },
  };
}

/**
 * Check if viewport has changed significantly
 * Returns true if viewport change is > threshold (default 10%)
 */
export function hasViewportChangedSignificantly(
  oldBounds: { north: number; south: number; east: number; west: number },
  newBounds: { north: number; south: number; east: number; west: number },
  threshold: number = 0.1
): boolean {
  const oldWidth = oldBounds.east - oldBounds.west;
  const oldHeight = oldBounds.north - oldBounds.south;
  const newWidth = newBounds.east - newBounds.west;
  const newHeight = newBounds.north - newBounds.south;

  const widthChange = Math.abs(newWidth - oldWidth) / oldWidth;
  const heightChange = Math.abs(newHeight - oldHeight) / oldHeight;

  return widthChange > threshold || heightChange > threshold;
}

/**
 * Check if data fetch is needed based on viewport and cache
 */
export function shouldFetchData(
  map: maplibregl.Map,
  cacheKey: string,
  cache: ReturnType<typeof createGeoJSONCache>,
  lastBounds?: { north: number; south: number; east: number; west: number }
): boolean {
  const currentBounds = getViewportBounds(map);

  // If no cache entry, fetch
  if (!cache.has(cacheKey)) {
    return true;
  }

  // If no previous bounds, fetch
  if (!lastBounds) {
    return true;
  }

  // If viewport changed significantly, fetch
  return hasViewportChangedSignificantly(lastBounds, currentBounds);
}

/**
 * Debounce map events (move, zoom, etc.)
 */
export function debounceMapEvent<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
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

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 1000
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Optimize GeoJSON by removing unnecessary properties
 */
export function optimizeGeoJSON(
  geoJSON: FeatureCollection,
  keepProperties: string[] = []
): FeatureCollection {
  return {
    ...geoJSON,
    features: geoJSON.features.map((feature) => {
      const optimizedProperties: Record<string, any> = {};

      // Always keep essential properties
      const essentialProps = [
        'id',
        'type',
        'name',
        'latitude',
        'longitude',
        'weight', // For heatmaps
        ...keepProperties,
      ];

      Object.keys(feature.properties || {}).forEach((key) => {
        if (essentialProps.includes(key)) {
          optimizedProperties[key] = feature.properties![key];
        }
      });

      return {
        ...feature,
        properties: optimizedProperties,
      };
    }),
  };
}

/**
 * Lazy load layer data (load only when layer is visible)
 */
export function lazyLoadLayer(
  layerId: string,
  loadFunction: () => Promise<FeatureCollection>,
  isVisible: boolean
): Promise<FeatureCollection | null> {
  if (!isVisible) {
    return Promise.resolve(null);
  }

  return loadFunction();
}

/**
 * Batch layer updates to reduce re-renders
 */
export function createBatchUpdater<T>(
  updateFunction: (items: T[]) => void,
  batchSize: number = 50,
  delay: number = 100
): (item: T) => void {
  let batch: T[] = [];
  let timeout: NodeJS.Timeout | null = null;

  const flush = () => {
    if (batch.length > 0) {
      updateFunction([...batch]);
      batch = [];
    }
    timeout = null;
  };

  return (item: T) => {
    batch.push(item);

    if (batch.length >= batchSize) {
      if (timeout) {
        clearTimeout(timeout);
      }
      flush();
    } else if (!timeout) {
      timeout = setTimeout(flush, delay);
    }
  };
}

/**
 * Check if coordinates are within viewport bounds
 */
export function isInViewport(
  lat: number,
  lon: number,
  bounds: { north: number; south: number; east: number; west: number },
  buffer: number = 0.1
): boolean {
  const latBuffer = (bounds.north - bounds.south) * buffer;
  const lonBuffer = (bounds.east - bounds.west) * buffer;

  return (
    lat >= bounds.south - latBuffer &&
    lat <= bounds.north + latBuffer &&
    lon >= bounds.west - lonBuffer &&
    lon <= bounds.east + lonBuffer
  );
}

/**
 * Filter GeoJSON features by viewport bounds
 */
export function filterByViewport(
  geoJSON: FeatureCollection,
  bounds: { north: number; south: number; east: number; west: number },
  buffer: number = 0.1
): FeatureCollection {
  return {
    ...geoJSON,
    features: geoJSON.features.filter((feature) => {
      if (feature.geometry.type === 'Point') {
        const [lon, lat] = feature.geometry.coordinates;
        return isInViewport(lat, lon, bounds, buffer);
      }
      return true; // Keep non-point features
    }),
  };
}



