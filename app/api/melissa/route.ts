import { NextResponse } from 'next/server';
import emergencyContacts from '../../../data/emergency-contacts.json';

// Jamaica coordinates
const JAMAICA_LAT = 18.1096;
const JAMAICA_LON = -77.2975;

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA based on movement speed
function calculateETA(distance: number, speed: number): number | null {
  if (speed <= 0) return null;
  return distance / speed;
}

// Format movement direction
function formatDirection(direction: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(direction / 22.5) % 16;
  return directions[index];
}

export async function GET() {
  try {
    const response = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Tropical Storm Melissa Tracker (https://github.com/your-repo)',
      },
    });

    if (!response.ok) {
      throw new Error(`NHC API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Look for Tropical Storm Melissa
    const melissa = data.activeStorms?.find((storm: any) => 
      storm.name?.toLowerCase().includes('melissa') || 
      storm.name?.toLowerCase().includes('melisa')
    );

    if (!melissa) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Tropical Storm Melissa not found in current active storms',
        lastUpdated: new Date().toISOString(),
        emergencyContacts: emergencyContacts.jamaica
      });
    }

    // Extract storm data from the correct structure
    const lat = melissa.latitudeNumeric;
    const lon = melissa.longitudeNumeric;
    
    // Calculate distance to Jamaica
    const distance = calculateDistance(lat, lon, JAMAICA_LAT, JAMAICA_LON);
    
    // Calculate ETA if movement data is available
    const movementSpeed = melissa.movementSpeed;
    let eta = null;
    if (movementSpeed && movementSpeed > 0) {
      eta = calculateETA(distance, movementSpeed);
    }

    // Determine if close approach
    const isCloseApproach = distance <= 150;

    const result = {
      status: 'active',
      storm: {
        name: melissa.name,
        type: melissa.classification === 'TS' ? 'Tropical Storm' : melissa.classification,
        windSpeed: melissa.intensity ? `${melissa.intensity} mph` : 'Unknown',
        position: {
          lat: lat,
          lon: lon,
          distance: Math.round(distance),
          distanceUnit: 'miles'
        },
        movement: {
          direction: melissa.movementDir ? formatDirection(melissa.movementDir) : 'Unknown',
          speed: movementSpeed ? `${movementSpeed} mph` : 'Unknown',
          eta: eta ? `${Math.round(eta)} hours` : 'Unknown'
        },
        lastAdvisory: melissa.lastUpdate ? new Date(melissa.lastUpdate).toISOString() : null,
        isCloseApproach: isCloseApproach
      },
      jamaica: {
        coordinates: {
          lat: JAMAICA_LAT,
          lon: JAMAICA_LON
        }
      },
      lastUpdated: new Date().toISOString(),
      emergencyContacts: emergencyContacts.jamaica
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching storm data:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch storm data',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString(),
      emergencyContacts: emergencyContacts.jamaica
    }, { status: 500 });
  }
}
