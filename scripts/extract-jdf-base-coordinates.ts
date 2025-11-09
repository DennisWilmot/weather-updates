import * as fs from 'fs';
import * as path from 'path';

/**
 * This script extracts coordinates from BR_SAV_jdf_WDG.geojson
 * and outputs them in a readable format
 * 
 * Usage:
 * npx tsx scripts/extract-jdf-base-coordinates.ts
 */

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    Name: string;
    COMMUNITY: string;
    FID: number;
    [key: string]: any;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface GeoJSON {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJSONFeature[];
}

interface BaseCoordinate {
  name: string;
  community: string;
  longitude: number;
  latitude: number;
  coordinates: [number, number];
}

function extractCoordinates() {
  const inputPath = path.join(process.cwd(), 'public', 'maps', 'BR_SAV_jdf_WDG.geojson');

  if (!fs.existsSync(inputPath)) {
    console.error(`\n✗ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading GeoJSON from: ${inputPath}`);
  const rawContent = fs.readFileSync(inputPath, 'utf-8');
  const geoJSON: GeoJSON = JSON.parse(rawContent);

  console.log(`Found ${geoJSON.features.length} bases\n`);

  const bases: BaseCoordinate[] = [];

  for (const feature of geoJSON.features) {
    if (feature.geometry.type !== 'Point') {
      console.warn(`Skipping non-point feature: ${feature.properties.Name}`);
      continue;
    }

    const [longitude, latitude] = feature.geometry.coordinates;
    
    bases.push({
      name: feature.properties.Name,
      community: feature.properties.COMMUNITY,
      longitude,
      latitude,
      coordinates: [longitude, latitude]
    });
  }

  // Output to console
  console.log('='.repeat(80));
  console.log('JDF BASE COORDINATES');
  console.log('='.repeat(80));
  console.log();

  bases.forEach((base, index) => {
    console.log(`${index + 1}. ${base.name}`);
    console.log(`   Community: ${base.community}`);
    console.log(`   GeoJSON format [lon, lat]: [${base.longitude}, ${base.latitude}]`);
    console.log(`   Google Maps format (lat, lon): ${base.latitude}, ${base.longitude}`);
    console.log(`   Longitude: ${base.longitude}`);
    console.log(`   Latitude: ${base.latitude}`);
    console.log();
  });

  // Output summary
  console.log('='.repeat(80));
  console.log(`Total bases: ${bases.length}`);
  console.log('='.repeat(80));
  console.log();

  // Save to JSON file
  const outputPath = path.join(process.cwd(), 'public', 'maps', 'jdf-base-coordinates.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(bases, null, 2),
    'utf-8'
  );
  console.log(`✓ Coordinates saved to: ${outputPath}`);

  // Save to CSV file
  const csvPath = path.join(process.cwd(), 'public', 'maps', 'jdf-base-coordinates.csv');
  const csvHeader = 'Name,Community,Longitude,Latitude\n';
  const csvRows = bases.map(base => 
    `"${base.name}","${base.community}",${base.longitude},${base.latitude}`
  ).join('\n');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf-8');
  console.log(`✓ CSV saved to: ${csvPath}`);

  // Save to Google Maps format .txt file
  const txtPath = path.join(process.cwd(), 'public', 'maps', 'jdf-base-coordinates-google-maps.txt');
  const txtContent = bases.map(base => 
    `${base.name}: ${base.latitude}, ${base.longitude}`
  ).join('\n') + '\n';
  fs.writeFileSync(txtPath, txtContent, 'utf-8');
  console.log(`✓ Google Maps format saved to: ${txtPath}`);

  // Output as JavaScript/TypeScript array format
  console.log('\nJavaScript/TypeScript format (GeoJSON order):');
  console.log('const jdfBaseCoordinates = [');
  bases.forEach((base, index) => {
    const comma = index < bases.length - 1 ? ',' : '';
    console.log(`  { name: "${base.name}", community: "${base.community}", coordinates: [${base.longitude}, ${base.latitude}] }${comma}`);
  });
  console.log('];');
  
  // Output Google Maps format
  console.log('\nGoogle Maps / Copy-Paste format (lat, lon):');
  bases.forEach((base) => {
    console.log(`${base.latitude}, ${base.longitude}  // ${base.name}`);
  });
}

extractCoordinates();

