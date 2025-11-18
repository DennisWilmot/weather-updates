/**
 * Clustering utilities for map points
 * Configures MapLibre clustering for dense data points
 */

import { LayerConfig } from './layer-types';

export interface ClusterConfig {
  radius?: number; // Cluster radius in pixels (default: 50)
  maxZoom?: number; // Max zoom level for clustering (default: 14)
  minZoom?: number; // Min zoom level for clustering (default: 0)
  clusterMaxZoom?: number; // Max zoom to cluster points on
  clusterRadius?: number; // Radius of each cluster when clustering points
}

/**
 * Create GeoJSON source configuration with clustering
 */
export function createClusterSource(
  sourceId: string,
  config: ClusterConfig = {}
): any {
  const {
    radius = 50,
    maxZoom = 14,
    clusterRadius = 50,
    clusterMaxZoom = 14,
  } = config;

  return {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
    cluster: true,
    clusterRadius: clusterRadius,
    clusterMaxZoom: clusterMaxZoom,
    clusterMinPoints: 2, // Minimum points to form a cluster
  };
}

/**
 * Create cluster layer configuration
 */
export function createClusterLayer(
  layerId: string,
  sourceId: string,
  config: ClusterConfig = {}
): LayerConfig {
  const { radius = 50, maxZoom = 14 } = config;

  return {
    id: layerId,
    name: `${layerId} Clusters`,
    type: 'circle',
    sourceId,
    style: {
      type: 'circle',
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6', // Color for clusters with < 100 points
          100,
          '#f1f075', // Color for clusters with 100-750 points
          750,
          '#f28cb1', // Color for clusters with 750+ points
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // Radius for clusters with < 100 points
          100,
          30, // Radius for clusters with 100-750 points
          750,
          40, // Radius for clusters with 750+ points
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8,
      },
    },
    metadata: {
      icon: 'cluster',
      color: '#51bbd6',
    },
    minZoom: 0,
    maxZoom,
  };
}

/**
 * Create cluster count layer (text layer showing point count)
 */
export function createClusterCountLayer(
  layerId: string,
  sourceId: string
): LayerConfig {
  return {
    id: layerId,
    name: `${layerId} Cluster Count`,
    type: 'symbol',
    sourceId,
    style: {
      type: 'symbol',
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff',
      },
    },
    metadata: {
      icon: 'text',
    },
  };
}

/**
 * Create unclustered point layer (shows individual points when zoomed in)
 */
export function createUnclusteredPointLayer(
  layerId: string,
  sourceId: string,
  pointStyle: any = {}
): LayerConfig {
  return {
    id: layerId,
    name: `${layerId} Points`,
    type: 'circle',
    sourceId,
    style: {
      type: 'circle',
      filter: ['!', ['has', 'point_count']], // Only show points that are not clusters
      paint: {
        'circle-radius': pointStyle.radius || 8,
        'circle-color': pointStyle.color || '#51bbd6',
        'circle-stroke-width': pointStyle.strokeWidth || 2,
        'circle-stroke-color': pointStyle.strokeColor || '#ffffff',
        'circle-opacity': pointStyle.opacity || 0.8,
      },
    },
    metadata: {
      icon: 'point',
      color: pointStyle.color || '#51bbd6',
    },
  };
}

/**
 * Handle cluster click - zoom to cluster bounds
 */
export function handleClusterClick(
  map: any,
  clusterId: number,
  sourceId: string
): void {
  const source = map.getSource(sourceId);
  if (!source) return;

  const clusterExpansionZoom = getClusterExpansionZoom(map, clusterId, sourceId);
  if (clusterExpansionZoom === null) return;

  map.easeTo({
    center: (source as any).getClusterLeaves(clusterId, Infinity)[0]
      .geometry.coordinates,
    zoom: clusterExpansionZoom,
  });
}

/**
 * Calculate zoom level needed to expand a cluster
 */
export function getClusterExpansionZoom(
  map: any,
  clusterId: number,
  sourceId: string
): number | null {
  const source = map.getSource(sourceId);
  if (!source) return null;

  const cluster = (source as any).getClusterExpansionZoom(clusterId);
  return cluster;
}

/**
 * Get all points in a cluster
 */
export function getClusterPoints(
  map: any,
  clusterId: number,
  sourceId: string,
  limit: number = 100
): any[] {
  const source = map.getSource(sourceId);
  if (!source) return [];

  return (source as any).getClusterLeaves(clusterId, limit);
}



