/**
 * Data aggregation utilities for heatmaps
 * Aggregates point data by location, time, and category
 */

import { FeatureCollection, Feature, Point } from 'geojson';

export interface AggregationOptions {
  gridSize?: number; // Grid cell size in degrees (default: 0.01 ≈ 1km)
  timeWindow?: 'hour' | 'day' | 'week' | 'month';
  categoryField?: string;
}

/**
 * Aggregate points by geographic grid
 */
export function aggregateByLocation(
  geoJSON: FeatureCollection<Point>,
  options: AggregationOptions = {}
): FeatureCollection<Point> {
  const { gridSize = 0.01 } = options;
  const grid = new Map<string, { count: number; features: Feature<Point>[] }>();

  geoJSON.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const gridX = Math.floor(lon / gridSize);
    const gridY = Math.floor(lat / gridSize);
    const key = `${gridX},${gridY}`;

    if (!grid.has(key)) {
      grid.set(key, {
        count: 0,
        features: [],
      });
    }

    const cell = grid.get(key)!;
    cell.count++;
    cell.features.push(feature);
  });

  // Create aggregated features
  const aggregatedFeatures: Feature<Point>[] = Array.from(grid.entries()).map(
    ([key, cell]) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const centerLon = (gridX + 0.5) * gridSize;
      const centerLat = (gridY + 0.5) * gridSize;

      // Calculate average properties
      const properties: Record<string, any> = {
        count: cell.count,
        weight: cell.count, // For heatmap intensity
      };

      // Aggregate properties from all features in this cell
      if (cell.features.length > 0) {
        const firstFeature = cell.features[0];
        Object.keys(firstFeature.properties || {}).forEach((key) => {
          const values = cell.features
            .map((f) => f.properties?.[key])
            .filter((v) => v !== undefined);

          if (values.length > 0) {
            // For numeric values, calculate average
            if (typeof values[0] === 'number') {
              properties[key] =
                values.reduce((sum, v) => sum + (v as number), 0) / values.length;
            } else {
              // For other types, use most common value
              const counts = new Map<any, number>();
              values.forEach((v) => {
                counts.set(v, (counts.get(v) || 0) + 1);
              });
              const mostCommon = Array.from(counts.entries()).sort(
                (a, b) => b[1] - a[1]
              )[0][0];
              properties[key] = mostCommon;
            }
          }
        });
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [centerLon, centerLat],
        },
        properties,
      };
    }
  );

  return {
    type: 'FeatureCollection',
    features: aggregatedFeatures,
  };
}

/**
 * Aggregate points by time periods
 */
export function aggregateByTime(
  geoJSON: FeatureCollection<Point>,
  timeWindow: 'hour' | 'day' | 'week' | 'month' = 'day',
  dateField: string = 'createdAt'
): FeatureCollection<Point> {
  const timeGroups = new Map<string, Feature<Point>[]>();

  geoJSON.features.forEach((feature) => {
    const dateValue = feature.properties?.[dateField];
    if (!dateValue) return;

    const date = new Date(dateValue);
    let timeKey: string;

    switch (timeWindow) {
      case 'hour':
        timeKey = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        timeKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        timeKey = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        timeKey = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      default:
        timeKey = date.toISOString().slice(0, 10);
    }

    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, []);
    }
    timeGroups.get(timeKey)!.push(feature);
  });

  // Create aggregated features (one per time period)
  const aggregatedFeatures: Feature<Point>[] = Array.from(timeGroups.entries()).map(
    ([timeKey, features]) => {
      // Use first feature's coordinates as representative
      const [lon, lat] = features[0].geometry.coordinates;

      // Aggregate properties
      const properties: Record<string, any> = {
        timeKey,
        count: features.length,
        weight: features.length,
      };

      // Add aggregated properties
      features.forEach((feature) => {
        Object.keys(feature.properties || {}).forEach((key) => {
          if (key !== dateField) {
            const values = features
              .map((f) => f.properties?.[key])
              .filter((v) => v !== undefined);

            if (values.length > 0 && !properties[key]) {
              if (typeof values[0] === 'number') {
                properties[key] =
                  values.reduce((sum, v) => sum + (v as number), 0) / values.length;
              } else {
                properties[key] = values[0];
              }
            }
          }
        });
      });

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties,
      };
    }
  );

  return {
    type: 'FeatureCollection',
    features: aggregatedFeatures,
  };
}

/**
 * Aggregate points by category
 */
export function aggregateByCategory(
  geoJSON: FeatureCollection<Point>,
  categoryField: string = 'type'
): Record<string, FeatureCollection<Point>> {
  const categories = new Map<string, Feature<Point>[]>();

  geoJSON.features.forEach((feature) => {
    const category = feature.properties?.[categoryField];
    if (!category) return;

    const categoryKey = Array.isArray(category) ? category.join(',') : String(category);

    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, []);
    }
    categories.get(categoryKey)!.push(feature);
  });

  const result: Record<string, FeatureCollection<Point>> = {};

  categories.forEach((features, categoryKey) => {
    result[categoryKey] = {
      type: 'FeatureCollection',
      features,
    };
  });

  return result;
}

/**
 * Calculate heatmap weights for features
 */
export function calculateHeatmapWeights(
  geoJSON: FeatureCollection<Point>,
  weightField?: string
): FeatureCollection<Point> {
  const features = geoJSON.features.map((feature) => {
    const weight = weightField
      ? feature.properties?.[weightField] || 1
      : feature.properties?.weight || 1;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        weight: typeof weight === 'number' ? weight : 1,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}



