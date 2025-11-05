import * as fs from 'fs';
import * as path from 'path';
import { DOMParser } from '@xmldom/xmldom';

// Jamaica bounds for coordinate transformation
const JAMAICA_BOUNDS = {
  north: 18.6,
  south: 17.7,
  east: -76.0,
  west: -78.5
};

// SVG viewBox dimensions
const SVG_VIEWBOX = {
  width: 1000,
  height: 395
};

// Parish mapping from SVG ID to parish data
// Using "St." format to match jamaica-locations.json
const parishMap: Record<string, { name: string; code: string }> = {
  'JM01': { name: 'Kingston', code: 'KGN' },
  'JM02': { name: 'St. Andrew', code: 'AND' },
  'JM03': { name: 'St. Thomas', code: 'THO' },
  'JM04': { name: 'Portland', code: 'POR' },
  'JM05': { name: 'St. Mary', code: 'MAR' },
  'JM06': { name: 'St. Ann', code: 'ANN' },
  'JM07': { name: 'Trelawny', code: 'TRL' },
  'JM08': { name: 'St. James', code: 'JAM' },
  'JM09': { name: 'Hanover', code: 'HAN' },
  'JM10': { name: 'Westmoreland', code: 'WML' },
  'JM11': { name: 'St. Elizabeth', code: 'ELI' },
  'JM12': { name: 'Manchester', code: 'MAN' },
  'JM13': { name: 'Clarendon', code: 'CLA' },
  'JM14': { name: 'St. Catherine', code: 'CAT' }
};

interface Point {
  x: number;
  y: number;
}

interface GeoPoint {
  lng: number;
  lat: number;
}

// Convert SVG coordinates to lat/lng
function svgToGeo(svgX: number, svgY: number): GeoPoint {
  // Longitude: SVG X (0-1000) maps to lng (-78.5 to -76.0)
  const lng = JAMAICA_BOUNDS.west + (svgX / SVG_VIEWBOX.width) * (JAMAICA_BOUNDS.east - JAMAICA_BOUNDS.west);
  
  // Latitude: SVG Y (0-395) maps to lat (18.6 to 17.7), inverted because SVG Y increases downward
  const lat = JAMAICA_BOUNDS.north - (svgY / SVG_VIEWBOX.height) * (JAMAICA_BOUNDS.north - JAMAICA_BOUNDS.south);
  
  return { lng, lat };
}

// Parse SVG path data and convert to GeoJSON coordinates
function parsePathData(pathData: string): number[][][] {
  const polygons: Point[][] = [];
  let currentPolygon: Point[] = [];
  
  // More robust path parser - handles M, L, Z commands with relative/absolute coordinates
  // Split by command letters (both uppercase and lowercase)
  const commandRegex = /[MmLlZz][^MmLlZz]*/g;
  const commands = pathData.match(commandRegex) || [];
  
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  
  for (const command of commands) {
    const type = command[0].toUpperCase();
    const isRelative = command[0] === command[0].toLowerCase();
    const coordsStr = command.slice(1).trim();
    
    // Parse numbers - handle negative numbers, decimals, and scientific notation
    const coords = coordsStr.match(/-?\d*\.?\d+(?:[eE][+-]?\d+)?/g)?.map(Number) || [];
    
    if (type === 'M') {
      // MoveTo - start new polygon
      if (currentPolygon.length > 0) {
        polygons.push([...currentPolygon]);
      }
      currentPolygon = [];
      if (coords.length >= 2) {
        if (isRelative) {
          currentX += coords[0];
          currentY += coords[1];
        } else {
          currentX = coords[0];
          currentY = coords[1];
        }
        startX = currentX;
        startY = currentY;
        currentPolygon.push({ x: currentX, y: currentY });
        
        // Process remaining coordinates as LineTo
        for (let i = 2; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            if (isRelative) {
              currentX += coords[i];
              currentY += coords[i + 1];
            } else {
              currentX = coords[i];
              currentY = coords[i + 1];
            }
            currentPolygon.push({ x: currentX, y: currentY });
          }
        }
      }
    } else if (type === 'L') {
      // LineTo
      for (let i = 0; i < coords.length; i += 2) {
        if (i + 1 < coords.length) {
          if (isRelative) {
            currentX += coords[i];
            currentY += coords[i + 1];
          } else {
            currentX = coords[i];
            currentY = coords[i + 1];
          }
          currentPolygon.push({ x: currentX, y: currentY });
        }
      }
    } else if (type === 'Z') {
      // Close path
      if (currentPolygon.length > 0) {
        // Close the polygon by adding the first point
        currentPolygon.push({ x: startX, y: startY });
        polygons.push([...currentPolygon]);
        currentPolygon = [];
      }
    }
  }
  
  // Add remaining polygon
  if (currentPolygon.length > 0) {
    polygons.push([...currentPolygon]);
  }
  
  // Convert to GeoJSON format: [[[lng, lat], ...]]
  return polygons.map(polygon =>
    polygon.map(point => {
      const geo = svgToGeo(point.x, point.y);
      return [geo.lng, geo.lat];
    })
  );
}

function convertSvgToGeoJSON() {
  const svgPath = path.join(process.cwd(), 'public', 'jm.svg');
  const outputPath = path.join(process.cwd(), 'public', 'jamaica-parishes.geojson');
  
  console.log('Reading SVG file...');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  
  console.log('Parsing SVG...');
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'text/xml');
  
  const features: any[] = [];
  
  // Find all path elements with IDs starting with JM
  const paths = doc.getElementsByTagName('path');
  
  for (let i = 0; i < paths.length; i++) {
    const pathElement = paths[i];
    const id = pathElement.getAttribute('id');
    
    if (!id || !id.startsWith('JM')) continue;
    
    const parishData = parishMap[id];
    if (!parishData) {
      console.warn(`No mapping found for ${id}`);
      continue;
    }
    
    const pathData = pathElement.getAttribute('d');
    if (!pathData) {
      console.warn(`No path data for ${id}`);
      continue;
    }
    
    console.log(`Processing ${id} - ${parishData.name}...`);
    
    try {
      const coordinates = parsePathData(pathData);
      
      if (coordinates.length === 0) {
        console.warn(`No coordinates parsed for ${id}`);
        continue;
      }
      
      // Create GeoJSON feature
      const feature = {
        type: 'Feature' as const,
        properties: {
          id: id,
          name: parishData.name,
          code: parishData.code
        },
        geometry: {
          type: coordinates.length === 1 ? 'Polygon' as const : 'MultiPolygon' as const,
          coordinates: coordinates.length === 1 ? coordinates[0] : coordinates
        }
      };
      
      features.push(feature);
      console.log(`✓ ${parishData.name} converted`);
    } catch (error) {
      console.error(`Error processing ${id}:`, error);
    }
  }
  
  // Create GeoJSON FeatureCollection
  const geoJSON = {
    type: 'FeatureCollection',
    features: features
  };
  
  console.log(`\nWriting GeoJSON to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf-8');
  
  console.log(`\n✓ Conversion complete! Generated ${features.length} features.`);
  console.log(`Output: ${outputPath}`);
}

// Run the conversion
convertSvgToGeoJSON();

