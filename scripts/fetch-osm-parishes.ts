import * as fs from 'fs';
import * as path from 'path';

interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OSMRelation {
  type: 'relation';
  id: number;
  members: Array<{
    type: string;
    ref: number;
    role: string;
  }>;
  tags: Record<string, string>;
}

interface OSMResponse {
  elements: Array<OSMNode | OSMWay | OSMRelation>;
}

// Map OSM parish names to our parish names
const parishNameMap: Record<string, string> = {
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
  'St. Catherine': 'St. Catherine'
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

async function fetchJamaicaParishes() {
  console.log('Fetching Jamaica parish boundaries from OpenStreetMap...\n');

  // Overpass query to get administrative boundaries for Jamaica parishes
  // Try multiple query patterns since OSM tagging can vary
  const query = `
    [out:json][timeout:60];
    (
      relation["boundary"="administrative"]["is_in:country"="Jamaica"]["place"="parish"];
      relation["boundary"="administrative"]["is_in:country"="Jamaica"]["name"~"^(Kingston|Saint|St\\.|Portland|Trelawny|Hanover|Westmoreland|Manchester|Clarendon)"];
      relation["place"="parish"]["is_in:country"="Jamaica"];
      relation["admin_level"="4"]["is_in:country"="Jamaica"];
      relation["admin_level"="5"]["is_in:country"="Jamaica"];
    );
    out geom;
  `;

  try {
    console.log('Sending request to Overpass API...');
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data: OSMResponse = await response.json();
    console.log(`Received ${data.elements?.length || 0} relations from OSM\n`);

    if (!data.elements || data.elements.length === 0) {
      console.warn('No parish boundaries found. Trying alternative query...');
      // Try a broader query
      return await fetchAlternativeQuery();
    }

    const features: any[] = [];
    const nodesMap = new Map<number, OSMNode>();
    const waysMap = new Map<number, OSMWay>();

    // First pass: collect all nodes and ways
    for (const element of data.elements) {
      if (element.type === 'node') {
        nodesMap.set(element.id, element as OSMNode);
      } else if (element.type === 'way') {
        waysMap.set(element.id, element as OSMWay);
      }
    }

    // Second pass: process relations
    for (const element of data.elements) {
      if (element.type !== 'relation') continue;

      const relation = element as OSMRelation;
      const name = relation.tags?.name;
      
      if (!name) continue;

      const mappedName = parishNameMap[name];
      if (!mappedName) {
        console.log(`Skipping unknown parish: ${name}`);
        continue;
      }

      console.log(`Processing: ${name} -> ${mappedName}`);

      // Find outer ways (boundary ways)
      const outerWays = relation.members
        .filter(m => m.type === 'way' && m.role === 'outer')
        .map(m => waysMap.get(m.ref))
        .filter(Boolean) as OSMWay[];

      if (outerWays.length === 0) {
        console.warn(`  No outer ways found for ${mappedName}`);
        continue;
      }

      // Extract coordinates from ways
      const polygons: number[][][] = [];
      
      for (const way of outerWays) {
        if (way.geometry && way.geometry.length > 0) {
          const coordinates = way.geometry.map(pt => [pt.lon, pt.lat]);
          
          // Close polygon if not already closed
          if (coordinates.length > 0) {
            const first = coordinates[0];
            const last = coordinates[coordinates.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              coordinates.push([first[0], first[1]]);
            }
            
            polygons.push(coordinates);
          }
        }
      }

      if (polygons.length === 0) {
        console.warn(`  No valid polygons for ${mappedName}`);
        continue;
      }

      // Create GeoJSON feature
      const feature = {
        type: 'Feature' as const,
        properties: {
          id: `JM${relation.id}`,
          name: mappedName,
          code: parishCodeMap[mappedName] || '',
          osm_name: name,
          osm_id: relation.id
        },
        geometry: {
          type: polygons.length === 1 ? 'Polygon' as const : 'MultiPolygon' as const,
          coordinates: polygons.length === 1 ? polygons[0] : polygons
        }
      };

      features.push(feature);
      console.log(`  ✓ Converted ${mappedName} (${polygons.length} polygon(s))`);
    }

    if (features.length === 0) {
      console.error('\nNo features were successfully converted. Trying alternative approach...');
      return await fetchAlternativeQuery();
    }

    // Create GeoJSON FeatureCollection
    const geoJSON = {
      type: 'FeatureCollection',
      features: features.sort((a, b) => 
        a.properties.name.localeCompare(b.properties.name)
      )
    };

    const outputPath = path.join(process.cwd(), 'public', 'jamaica-parishes.geojson');
    fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf-8');
    
    console.log(`\n✓ Successfully created GeoJSON with ${features.length} parishes`);
    console.log(`Output: ${outputPath}`);
    console.log(`\nParishes included:`);
    features.forEach(f => {
      console.log(`  - ${f.properties.name} (${f.properties.code})`);
    });

  } catch (error) {
    console.error('Error fetching OSM data:', error);
    throw error;
  }
}

async function fetchAlternativeQuery() {
  console.log('\nTrying alternative query for individual parishes...\n');
  
  // Try fetching each parish individually by name
  const parishQueries = [
    'Kingston', 'Saint Andrew', 'Saint Thomas', 'Portland',
    'Saint Mary', 'Saint Ann', 'Trelawny', 'Saint James',
    'Hanover', 'Westmoreland', 'Saint Elizabeth', 'Manchester',
    'Clarendon', 'Saint Catherine'
  ];

  const features: any[] = [];

  for (const parishName of parishQueries) {
    try {
      const query = `
        [out:json][timeout:25];
        (
          relation["name"="${parishName}"]["admin_level"="4"]["is_in:country"="Jamaica"];
        );
        out geom;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) continue;

      const data: OSMResponse = await response.json();
      
      for (const element of data.elements || []) {
        if (element.type === 'relation') {
          const relation = element as OSMRelation;
          const outerWays = relation.members
            .filter(m => m.type === 'way' && m.role === 'outer')
            .map(m => {
              // Find way in elements
              const way = data.elements.find(e => e.type === 'way' && e.id === m.ref) as OSMWay;
              return way;
            })
            .filter(Boolean) as OSMWay[];

          if (outerWays.length > 0 && outerWays[0].geometry) {
            const coordinates = outerWays[0].geometry.map(pt => [pt.lon, pt.lat]);
            if (coordinates.length > 0) {
              const first = coordinates[0];
              const last = coordinates[coordinates.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                coordinates.push([first[0], first[1]]);
              }

              const mappedName = parishNameMap[parishName] || parishName;
              features.push({
                type: 'Feature',
                properties: {
                  id: `JM${relation.id}`,
                  name: mappedName,
                  code: parishCodeMap[mappedName] || '',
                  osm_name: parishName
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinates]
                }
              });
              console.log(`  ✓ Found ${mappedName}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`  Error fetching ${parishName}:`, error);
    }
  }

  if (features.length > 0) {
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    const outputPath = path.join(process.cwd(), 'public', 'jamaica-parishes.geojson');
    fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf-8');
    
    console.log(`\n✓ Created GeoJSON with ${features.length} parishes`);
    console.log(`Output: ${outputPath}`);
  } else {
    console.error('\n✗ Could not fetch parish boundaries from OpenStreetMap');
    console.log('\nYou may need to:');
    console.log('1. Manually download from https://overpass-turbo.eu/');
    console.log('2. Use the bounds-based approach (already working)');
    console.log('3. Check if OSM has Jamaica parish data');
  }
}

// Run the fetch
fetchJamaicaParishes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

