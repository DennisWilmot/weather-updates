import * as fs from 'fs';
import * as path from 'path';

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

// Map "Saint" to "St." format
const parishNameMapping: Record<string, string> = {
  'Kingston': 'Kingston',
  'Saint Andrew': 'St. Andrew',
  'Saint Thomas': 'St. Thomas',
  'Portland': 'Portland',
  'Saint Mary': 'St. Mary',
  'Saint Ann': 'St. Ann',
  'Trelawny': 'Trelawny',
  'Saint James': 'St. James',
  'Hanover': 'Hanover',
  'Westmoreland': 'Westmoreland',
  'Saint Elizabeth': 'St. Elizabeth',
  'Manchester': 'Manchester',
  'Clarendon': 'Clarendon',
  'Saint Catherine': 'St. Catherine'
};

// Parish codes mapping
const parishCodeMap: Record<string, string> = {
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

function processJMJSON() {
  const inputPath = path.join(process.cwd(), 'public', 'jm.json');
  const outputPath = path.join(process.cwd(), 'public', 'jamaica-parishes.geojson');

  if (!fs.existsSync(inputPath)) {
    console.error(`\n✗ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading GeoJSON from: ${inputPath}`);
  const rawContent = fs.readFileSync(inputPath, 'utf-8');
  const geoJSON: GeoJSON = JSON.parse(rawContent);

  console.log(`Found ${geoJSON.features.length} features\n`);

  const processedFeatures: GeoJSONFeature[] = [];

  for (const feature of geoJSON.features) {
    const originalName = feature.properties.name;
    
    if (!originalName) {
      console.warn(`Skipping feature with no name:`, feature.properties);
      continue;
    }

    const standardizedName = parishNameMapping[originalName] || originalName;
    
    if (!parishCodeMap[standardizedName]) {
      console.warn(`Unknown parish: "${originalName}" (standardized: "${standardizedName}")`);
      continue;
    }

    // Standardize the feature properties
    const processedFeature: GeoJSONFeature = {
      type: 'Feature',
      properties: {
        id: feature.properties.id || `JM${parishCodeMap[standardizedName]}`,
        name: standardizedName,
        code: parishCodeMap[standardizedName],
        original_name: originalName,
        source: feature.properties.source || 'simplemaps.com'
      },
      geometry: feature.geometry
    };

    processedFeatures.push(processedFeature);
    console.log(`✓ Processed: ${originalName} → ${standardizedName} (${parishCodeMap[standardizedName]})`);
  }

  if (processedFeatures.length === 0) {
    console.error('\n✗ No features were successfully processed');
    process.exit(1);
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
  } else {
    console.log(`\n✓ All 14 parishes processed successfully!`);
  }
}

processJMJSON();

