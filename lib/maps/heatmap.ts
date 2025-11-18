/**
 * Heatmap layer utilities
 * Convert aggregated data to GeoJSON with weights for MapLibre heatmap layers
 */

import { FeatureCollection, Feature, Point } from 'geojson';
import { LayerConfig, layerStylePresets } from './layer-types';
import { calculateHeatmapWeights, aggregateByLocation, aggregateByTime } from './aggregation';

export interface HeatmapConfig {
  intensity?: number;
  radius?: number;
  opacity?: number;
  colorStops?: [number, string][];
}

/**
 * Convert GeoJSON to heatmap-ready format with weights
 */
export function prepareHeatmapData(
  geoJSON: FeatureCollection<Point>,
  weightField?: string
): FeatureCollection<Point> {
  return calculateHeatmapWeights(geoJSON, weightField);
}

/**
 * Generate heatmap layer configuration
 */
export function createHeatmapLayerConfig(
  layerId: string,
  sourceId: string,
  config: HeatmapConfig = {}
): LayerConfig {
  const {
    intensity = 1,
    radius = 30,
    opacity = 0.6,
    colorStops = [
      [0, 'rgba(33,102,172,0)'],
      [0.2, 'rgb(103,169,207)'],
      [0.4, 'rgb(209,229,240)'],
      [0.6, 'rgb(253,219,199)'],
      [0.8, 'rgb(239,138,98)'],
      [1, 'rgb(178,24,43)'],
    ],
  } = config;

  return {
    id: layerId,
    name: `${layerId} Heatmap`,
    type: 'heatmap',
    sourceId,
    style: {
      type: 'heatmap',
      paint: {
        'heatmap-weight': ['get', 'weight', 1],
        'heatmap-intensity': intensity,
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], ...colorStops.flat()],
        'heatmap-radius': radius,
        'heatmap-opacity': opacity,
      },
    },
    metadata: {
      icon: 'heatmap',
      color: '#ef4444',
    },
  };
}

/**
 * Create asset distribution heatmap
 */
export function createAssetDistributionHeatmap(
  distributions: FeatureCollection<Point>,
  options: {
    byLocation?: boolean;
    byTime?: 'hour' | 'day' | 'week' | 'month';
    gridSize?: number;
  } = {}
): FeatureCollection<Point> {
  let aggregated = distributions;

  // Aggregate by location if requested
  if (options.byLocation) {
    aggregated = aggregateByLocation(aggregated, {
      gridSize: options.gridSize,
    });
  }

  // Aggregate by time if requested
  if (options.byTime) {
    aggregated = aggregateByTime(aggregated, options.byTime, 'distributionDate');
  }

  // Add weights for heatmap
  return calculateHeatmapWeights(aggregated, 'weight');
}

/**
 * Create people needs heatmap
 */
export function createPeopleNeedsHeatmap(
  needs: FeatureCollection<Point>,
  options: {
    byUrgency?: boolean;
    byNeedType?: boolean;
    gridSize?: number;
  } = {}
): FeatureCollection<Point> {
  let aggregated = needs;

  // Aggregate by location
  aggregated = aggregateByLocation(aggregated, {
    gridSize: options.gridSize,
  });

  // Add urgency-based weights
  const featuresWithWeights = aggregated.features.map((feature) => {
    const urgency = feature.properties?.urgency || 'low';
    const urgencyWeights: Record<string, number> = {
      critical: 5,
      high: 3,
      medium: 2,
      low: 1,
    };
    const weight = urgencyWeights[urgency] || 1;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        weight: (feature.properties?.weight || 1) * weight,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: featuresWithWeights,
  };
}

/**
 * Create place status heatmap
 */
export function createPlaceStatusHeatmap(
  statuses: FeatureCollection<Point>,
  statusType: 'electricity' | 'water' | 'wifi',
  options: {
    gridSize?: number;
  } = {}
): FeatureCollection<Point> {
  // Filter by status type and aggregate
  const filtered = {
    type: 'FeatureCollection' as const,
    features: statuses.features.filter((feature) => {
      const status = feature.properties?.[`${statusType}Status`];
      return status === 'outage' || status === 'partial';
    }),
  };

  const aggregated = aggregateByLocation(filtered, {
    gridSize: options.gridSize,
  });

  // Add weights based on status severity
  const featuresWithWeights = aggregated.features.map((feature) => {
    const status = feature.properties?.[`${statusType}Status`];
    const weight = status === 'outage' ? 3 : status === 'partial' ? 2 : 1;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        weight,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: featuresWithWeights,
  };
}



