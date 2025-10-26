// Reverse geocoding service to convert coordinates to parish/community
// This uses a simple bounding box approach for Jamaica's parishes

interface ParishBounds {
  name: string;
  code: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

// Jamaica parish boundaries (approximate)
const PARISH_BOUNDS: ParishBounds[] = [
  {
    name: 'Kingston',
    code: 'KGN',
    bounds: { north: 18.0200, south: 17.9200, east: -76.7500, west: -76.8400 },
    center: { lat: 17.9714, lng: -76.7931 }
  },
  {
    name: 'St. Andrew',
    code: 'AND',
    bounds: { north: 18.1500, south: 17.9200, east: -76.6500, west: -76.9000 },
    center: { lat: 18.0179, lng: -76.8099 }
  },
  {
    name: 'St. Thomas',
    code: 'THO',
    bounds: { north: 18.1000, south: 17.8500, east: -76.2000, west: -76.5500 },
    center: { lat: 17.9596, lng: -76.3522 }
  },
  {
    name: 'Portland',
    code: 'POR',
    bounds: { north: 18.2500, south: 18.0000, east: -76.2000, west: -76.6000 },
    center: { lat: 18.1096, lng: -76.4119 }
  },
  {
    name: 'St. Mary',
    code: 'MAR',
    bounds: { north: 18.5000, south: 18.2000, east: -76.7000, west: -77.2000 },
    center: { lat: 18.3726, lng: -76.9563 }
  },
  {
    name: 'St. Ann',
    code: 'ANN',
    bounds: { north: 18.5500, south: 18.2500, east: -76.9500, west: -77.4500 },
    center: { lat: 18.4372, lng: -77.2014 }
  },
  {
    name: 'Trelawny',
    code: 'TRL',
    bounds: { north: 18.5000, south: 18.2000, east: -77.4000, west: -77.8000 },
    center: { lat: 18.3541, lng: -77.6041 }
  },
  {
    name: 'St. James',
    code: 'JAM',
    bounds: { north: 18.6000, south: 18.3500, east: -77.7500, west: -78.0500 },
    center: { lat: 18.4762, lng: -77.9189 }
  },
  {
    name: 'Hanover',
    code: 'HAN',
    bounds: { north: 18.5000, south: 18.3500, east: -78.0000, west: -78.3500 },
    center: { lat: 18.4097, lng: -78.1336 }
  },
  {
    name: 'Westmoreland',
    code: 'WML',
    bounds: { north: 18.4000, south: 18.1500, east: -77.9500, west: -78.3500 },
    center: { lat: 18.2663, lng: -78.1336 }
  },
  {
    name: 'St. Elizabeth',
    code: 'ELI',
    bounds: { north: 18.3000, south: 17.8500, east: -77.5000, west: -78.0500 },
    center: { lat: 18.0375, lng: -77.7426 }
  },
  {
    name: 'Manchester',
    code: 'MAN',
    bounds: { north: 18.2000, south: 17.9000, east: -77.3000, west: -77.7000 },
    center: { lat: 18.0407, lng: -77.5052 }
  },
  {
    name: 'Clarendon',
    code: 'CLA',
    bounds: { north: 18.2000, south: 17.8000, east: -76.9000, west: -77.5500 },
    center: { lat: 17.9599, lng: -77.2419 }
  },
  {
    name: 'St. Catherine',
    code: 'CAT',
    bounds: { north: 18.2000, south: 17.8500, east: -76.7500, west: -77.2500 },
    center: { lat: 18.0012, lng: -76.9909 }
  }
];

export interface LocationResult {
  parish: string;
  parishCode: string;
  isInJamaica: boolean;
  accuracy: 'high' | 'medium' | 'low';
  distanceFromCenter?: number;
  streetAddress?: string;
  placeName?: string;
  suggestedCommunity?: string;
  detectedCommunity?: {
    id: string;
    name: string;
    distance: number;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface CommunityBounds {
  id: string;
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export function reverseGeocode(latitude: number, longitude: number): LocationResult {
  // Check if coordinates are within Jamaica's general bounds
  const jamaicaBounds = {
    north: 18.6,
    south: 17.7,
    east: -76.0,
    west: -78.5
  };

  const isInJamaicaBounds = (
    latitude >= jamaicaBounds.south &&
    latitude <= jamaicaBounds.north &&
    longitude >= jamaicaBounds.west &&
    longitude <= jamaicaBounds.east
  );

  if (!isInJamaicaBounds) {
    return {
      parish: 'Unknown',
      parishCode: 'UNK',
      isInJamaica: false,
      accuracy: 'low',
      coordinates: { lat: latitude, lng: longitude }
    };
  }

  // Find the parish that contains these coordinates
  for (const parish of PARISH_BOUNDS) {
    const { bounds } = parish;
    
    if (
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      longitude >= bounds.west &&
      longitude <= bounds.east
    ) {
      // Calculate distance from parish center for accuracy assessment
      const distance = calculateDistance(
        latitude,
        longitude,
        parish.center.lat,
        parish.center.lng
      );

      let accuracy: 'high' | 'medium' | 'low' = 'low';
      if (distance < 5) accuracy = 'high';
      else if (distance < 15) accuracy = 'medium';

      return {
        parish: parish.name,
        parishCode: parish.code,
        isInJamaica: true,
        accuracy,
        distanceFromCenter: distance,
        streetAddress: `Approximate location in ${parish.name}`,
        placeName: `Location in ${parish.name}`,
        suggestedCommunity: `Area in ${parish.name}`,
        coordinates: { lat: latitude, lng: longitude }
      };
    }
  }

  // If not in any specific parish bounds, return closest parish
  let closestParish = PARISH_BOUNDS[0];
  let minDistance = calculateDistance(
    latitude,
    longitude,
    closestParish.center.lat,
    closestParish.center.lng
  );

  for (const parish of PARISH_BOUNDS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      parish.center.lat,
      parish.center.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestParish = parish;
    }
  }

  return {
    parish: closestParish.name,
    parishCode: closestParish.code,
    isInJamaica: true,
    accuracy: minDistance < 10 ? 'medium' : 'low',
    distanceFromCenter: minDistance,
    streetAddress: `Approximate location in ${closestParish.name}`,
    placeName: `Location in ${closestParish.name}`,
    suggestedCommunity: `Area in ${closestParish.name}`,
    coordinates: { lat: latitude, lng: longitude }
  };
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate street address based on coordinates and parish
function generateStreetAddress(lat: number, lng: number, parish: ParishBounds): string {
  // Return a generic location description instead of fake street names
  // This will be replaced by actual Google Maps reverse geocoding
  return `Approximate location in ${parish.name}`;
}

// Generate place name based on coordinates and parish
function generatePlaceName(lat: number, lng: number, parish: ParishBounds): string {
  // Return a generic place description instead of fake place names
  // This will be replaced by actual Google Maps reverse geocoding
  return `Location in ${parish.name}`;
}

// Generate community name based on coordinates and parish
function generateCommunityName(lat: number, lng: number, parish: ParishBounds): string {
  // Return a generic community description instead of fake community names
  // This will be replaced by actual Google Maps reverse geocoding
  return `Area in ${parish.name}`;
}

// Find closest community - prioritize within bounds, fallback to nearest
export function findClosestCommunity(
  latitude: number,
  longitude: number,
  communities: CommunityBounds[]
): { id: string; name: string; distance: number } | null {
  if (!communities || communities.length === 0) {
    return null;
  }

  let closestWithinBounds: { id: string; name: string; distance: number } | null = null;
  let closestOverall: { id: string; name: string; distance: number } | null = null;
  let minDistanceWithinBounds = Infinity;
  let minDistanceOverall = Infinity;

  for (const community of communities) {
    // Calculate distance from center if coordinates exist
    let distance = Infinity;
    if (community.coordinates) {
      distance = calculateDistance(
        latitude,
        longitude,
        community.coordinates.lat,
        community.coordinates.lng
      );

      // Track closest overall community
      if (distance < minDistanceOverall) {
        minDistanceOverall = distance;
        closestOverall = {
          id: community.id,
          name: community.name,
          distance
        };
      }
    }

    // Check if within bounds
    if (community.bounds) {
      const { north, south, east, west } = community.bounds;
      const isWithinBounds = (
        latitude >= south &&
        latitude <= north &&
        longitude >= west &&
        longitude <= east
      );

      if (isWithinBounds && distance < minDistanceWithinBounds) {
        minDistanceWithinBounds = distance;
        closestWithinBounds = {
          id: community.id,
          name: community.name,
          distance
        };
      }
    }
  }

  // Return community within bounds if found, otherwise return closest overall
  return closestWithinBounds || closestOverall;
}

// Get all parishes for dropdown
export function getAllParishes() {
  return PARISH_BOUNDS.map(p => ({
    value: p.name,
    label: p.name,
    code: p.code
  }));
}
