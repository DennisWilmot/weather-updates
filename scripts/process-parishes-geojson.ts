import * as fs from 'fs';
import * as path from 'path';

/**
 * This script processes a manually downloaded GeoJSON file
 * and standardizes it to match our parish naming conventions
 * 
 * Usage:
 * 1. Download a Jamaica parishes GeoJSON from any source
 * 2. Place it in the project root as 'jamaica-parishes-raw.geojson'
 * 3. Run: npx tsx scripts/process-parishes-geojson.ts
 */

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Map various parish name formats to our standard format
const parishNameMapping: Record<string, string> = {
  // Standard formats
  'Kingston': 'Kingston',
  'Saint Andrew': 'St. Andrew',
  'St. Andrew': 'St. Andrew',
  'Saint Thomas': 'St. Thomas',
  'St. Thomas': 'St. Thomas',
  'Portland': 'Portland',
  'Saint Mary': 'St. Mary',
  'St. Mary': 'St. Mary',
  'Saint Ann': 'St. Ann',
  'St. Ann': 'St. Ann',
  'Trelawny': 'Trelawny',
  'Saint James': 'St. James',
  'St. James': 'St. James',
  'Hanover': 'Hanover',
  'Westmoreland': 'Westmoreland',
  'Saint Elizabeth': 'St. Elizabeth',
  'St. Elizabeth': 'St. Elizabeth',
  'Manchester': 'Manchester',
  'Clarendon': 'Clarendon',
  'Saint Catherine': 'St. Catherine',
  'St. Catherine': 'St. Catherine',
  // Variations
  'Kingston Parish': 'Kingston',
  'St Andrew': 'St. Andrew',
  'St Thomas': 'St. Thomas',
  'St Mary': 'St. Mary',
  'St Ann': 'St. Ann',
  'St James': 'St. James',
  'St Elizabeth': 'St. Elizabeth',
  'St Catherine': 'St. Catherine',
};

// Parish codes
const parishCodes: Record<string, string> = {
  'Kingston': 'KGN',
  'St. Andrew': 'AND',
  'St. Thomas': 'THO',
  'Portland': 'POR',
  'St. Mary': 'MAR',
  'St. Ann': 'ANN',
  'Trelawny': 'TRL',
  'St. James': 'JAM',
  'Hanover': 'HAN',
  'Westmoreland': 'WML',
  'St. Elizabeth': 'ELI',
  'Manchester': 'MAN',
  'Clarendon': 'CLA',
  'St. Catherine': 'CAT'
};

function processGeoJSON() {
  const inputPath = path.join(process.cwd(), 'jamaica-parishes-raw.geojson');
  const outputPath = path.join(process.cwd(), 'public', 'jamaica-parishes.geojson');

  if (!fs.existsSync(inputPath)) {
    console.error(`\n✗ Input file not found: ${inputPath}`);
    console.log('\nPlease:');
    console.log('1. Download a Jamaica parishes GeoJSON file');
    console.log('2. Save it as "jamaica-parishes-raw.geojson" in the project root');
    console.log('3. Run this script again\n');
    process.exit(1);
  }

  console.log(`Reading GeoJSON from: ${inputPath}`);
  const rawContent = fs.readFileSync(inputPath, 'utf-8');
  const geoJSON: GeoJSON = JSON.parse(rawContent);

  console.log(`Found ${geoJSON.features.length} features\n`);

  const processedFeatures: GeoJSONFeature[] = [];
  const skippedParishes: string[] = [];

  for (const feature of geoJSON.features) {
    // Try to find parish name from various property fields
    const name = feature.properties.name || 
                 feature.properties.NAME || 
                 feature.properties.NAME_1 || 
                 feature.properties.parish ||
                 feature.properties.PARISH ||
                 feature.properties.admin ||
                 feature.properties.ADMIN;

    if (!name) {
      console.warn(`Skipping feature with no name:`, feature.properties);
      continue;
    }

    const standardizedName = parishNameMapping[name] || name;
    
    if (!parishCodes[standardizedName]) {
      skippedParishes.push(name);
      console.warn(`Unknown parish: "${name}" (standardized: "${standardizedName}")`);
      continue;
    }

    // Standardize the feature
    const processedFeature: GeoJSONFeature = {
      type: 'Feature',
      properties: {
        id: `JM${parishCodes[standardizedName]}`,
        name: standardizedName,
        code: parishCodes[standardizedName],
        original_name: name
      },
      geometry: feature.geometry
    };

    processedFeatures.push(processedFeature);
    console.log(`✓ Processed: ${name} → ${standardizedName}`);
  }

  if (processedFeatures.length === 0) {
    console.error('\n✗ No features were successfully processed');
    console.log('\nParish names found in GeoJSON:');
    geoJSON.features.forEach(f => {
      console.log(`  - ${f.properties.name || f.properties.NAME || 'Unknown'}`);
    });
    process.exit(1);
  }

  if (skippedParishes.length > 0) {
    console.log(`\n⚠ Skipped ${skippedParishes.length} unknown parishes`);
  }

  // Sort by name
  processedFeatures.sort((a, b) => 
    a.properties.name.localeCompare(b.properties.name)
  );

  const outputGeoJSON: GeoJSON = {
    type: 'FeatureCollection',
    features: processedFeatures
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputGeoJSON, null, 2), 'utf-8');
  
  console.log(`\n✓ Successfully processed ${processedFeatures.length} parishes`);
  console.log(`Output: ${outputPath}`);
  console.log(`\nParishes included:`);
  processedFeatures.forEach(f => {
    console.log(`  - ${f.properties.name} (${f.properties.code})`);
  });

  if (processedFeatures.length < 14) {
    console.log(`\n⚠ Warning: Expected 14 parishes, found ${processedFeatures.length}`);
  }
}

processGeoJSON();

