import * as fs from 'fs';
import * as path from 'path';
import { jamaicaParishes } from '../lib/db/seed-data/parishes';

// Create GeoJSON from parish bounds
function createRectangularPolygon(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): number[][][] {
  // Create a rectangle polygon from bounds
  // Coordinates must be [lng, lat] pairs in GeoJSON
  return [[
    [bounds.west, bounds.south],  // Southwest
    [bounds.east, bounds.south],  // Southeast
    [bounds.east, bounds.north],  // Northeast
    [bounds.west, bounds.north],  // Northwest
    [bounds.west, bounds.south]   // Close polygon
  ]];
}

function createParishesGeoJSON() {
  const features: any[] = [];

  jamaicaParishes.forEach(parish => {
    if (!parish.coordinates?.bounds) {
      console.warn(`No bounds for ${parish.name}`);
      return;
    }

    const bounds = parish.coordinates.bounds;
    const coordinates = createRectangularPolygon(bounds);

    features.push({
      type: 'Feature',
      properties: {
        id: parish.code,
        name: parish.name,
        code: parish.code
      },
      geometry: {
        type: 'Polygon',
        coordinates: coordinates
      }
    });
  });

  const geoJSON = {
    type: 'FeatureCollection',
    features: features
  };

  const outputPath = path.join(process.cwd(), 'public', 'jamaica-parishes.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf-8');
  
  console.log(`✓ Created GeoJSON with ${features.length} parishes`);
  console.log(`Output: ${outputPath}`);
}

createParishesGeoJSON();

