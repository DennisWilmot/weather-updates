/**
 * Heatmap layer factory functions
 * Generate heatmap LayerConfig from hierarchy nodes
 */

import { LayerConfig } from './layer-types';
import { createHeatmapLayerConfig, HeatmapConfig } from './heatmap';

/**
 * Map layer IDs to their API endpoints
 */
const layerApiMap: Record<string, string> = {
  'assets-heatmap': '/api/asset-distributions',
  'people-needs-heatmap': '/api/people/needs',
  'places-status-heatmap': '/api/places/status',
};

/**
 * Get API endpoint for a heatmap layer
 */
export function getHeatmapApiEndpoint(layerId: string): string | null {
  return layerApiMap[layerId] || null;
}

/**
 * Check if a layer ID is a heatmap layer
 */
export function isHeatmapLayer(layerId: string): boolean {
  return layerId.includes('heatmap') || layerApiMap.hasOwnProperty(layerId);
}

/**
 * Get heatmap configuration for a specific layer type
 */
function getHeatmapConfigForLayer(layerId: string): HeatmapConfig {
  // Default configuration
  const defaultConfig: HeatmapConfig = {
    intensity: 1,
    radius: 30,
    opacity: 0.6,
  };

  // Custom configurations per layer type
  const configs: Record<string, HeatmapConfig> = {
    'assets-heatmap': {
      intensity: 1.2,
      radius: 40,
      opacity: 0.7,
      colorStops: [
        [0, 'rgba(59,130,246,0)'], // Blue
        [0.2, 'rgba(59,130,246,0.3)'],
        [0.4, 'rgba(59,130,246,0.5)'],
        [0.6, 'rgba(239,68,68,0.6)'], // Red
        [0.8, 'rgba(239,68,68,0.8)'],
        [1, 'rgba(239,68,68,1)'],
      ],
    },
    'people-needs-heatmap': {
      intensity: 1.5,
      radius: 35,
      opacity: 0.65,
      colorStops: [
        [0, 'rgba(245,158,11,0)'], // Amber
        [0.2, 'rgba(245,158,11,0.3)'],
        [0.4, 'rgba(245,158,11,0.5)'],
        [0.6, 'rgba(239,68,68,0.6)'], // Red
        [0.8, 'rgba(239,68,68,0.8)'],
        [1, 'rgba(178,24,43,1)'], // Dark red
      ],
    },
    'places-status-heatmap': {
      intensity: 1.0,
      radius: 30,
      opacity: 0.6,
      colorStops: [
        [0, 'rgba(245,158,11,0)'], // Amber
        [0.2, 'rgba(245,158,11,0.3)'],
        [0.4, 'rgba(245,158,11,0.5)'],
        [0.6, 'rgba(239,68,68,0.6)'], // Red
        [0.8, 'rgba(239,68,68,0.8)'],
        [1, 'rgba(178,24,43,1)'], // Dark red
      ],
    },
  };

  return configs[layerId] || defaultConfig;
}

/**
 * Create a heatmap LayerConfig from a layer ID
 */
export function createHeatmapLayerFromId(
  layerId: string,
  sourceId: string,
  name?: string
): LayerConfig {
  const config = getHeatmapConfigForLayer(layerId);
  const layerName = name || `${layerId} Heatmap`;

  return createHeatmapLayerConfig(layerId, sourceId, {
    ...config,
  });
}

/**
 * Get source ID for a heatmap layer
 */
export function getHeatmapSourceId(layerId: string): string {
  return `${layerId}-source`;
}



