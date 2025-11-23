/**
 * Geographic utility functions for distance calculations
 */

/**
 * Earth's radius in kilometers (mean radius)
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 * 
 * The Haversine formula calculates the shortest distance between two points
 * on a sphere (great-circle distance), which is the distance "as the crow flies"
 * on the Earth's surface. This is accurate for most practical purposes, with
 * errors typically less than 0.5% for distances under 1000km.
 * 
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
 *   c = 2 × atan2(√a, √(1−a))
 *   d = R × c
 * 
 * Where:
 *   - Δlat = lat2 - lat1
 *   - Δlon = lon2 - lon1
 *   - R = Earth's radius (6371 km)
 * 
 * @param lat1 Latitude of first point in degrees (-90 to 90)
 * @param lon1 Longitude of first point in degrees (-180 to 180)
 * @param lat2 Latitude of second point in degrees (-90 to 90)
 * @param lon2 Longitude of second point in degrees (-180 to 180)
 * @returns Distance in kilometers
 * 
 * @throws {Error} If coordinates are out of valid range
 * 
 * @example
 * ```typescript
 * // Distance from Kingston to Montego Bay (~100km)
 * const distance = haversineDistanceKm(18.0, -76.8, 18.5, -77.9);
 * // Returns approximately 100-120km
 * ```
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Validate inputs
  if (
    !Number.isFinite(lat1) || !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) || !Number.isFinite(lon2)
  ) {
    throw new Error('All coordinates must be finite numbers');
  }

  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees');
  }

  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees');
  }

  // Handle edge case: same point
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  // Convert degrees to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = EARTH_RADIUS_KM * c;

  return distance;
}


