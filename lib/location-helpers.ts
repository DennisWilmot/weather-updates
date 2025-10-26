import { db } from './db';
import { parishes, communities, locations } from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get parish ID from parish name
 */
export async function getParishIdByName(parishName: string): Promise<string | null> {
  const [parish] = await db
    .select({ id: parishes.id })
    .from(parishes)
    .where(eq(parishes.name, parishName))
    .limit(1);

  return parish?.id || null;
}

/**
 * Get community ID from community name and parish ID
 */
export async function getCommunityId(
  communityName: string,
  parishId: string
): Promise<string | null> {
  const [community] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(and(eq(communities.name, communityName), eq(communities.parishId, parishId)))
    .limit(1);

  return community?.id || null;
}

/**
 * Get or create community in a parish
 */
export async function getOrCreateCommunity(
  communityName: string,
  parishId: string,
  coordinates?: { lat: number; lng: number }
): Promise<string> {
  // Try to find existing community
  const existingId = await getCommunityId(communityName, parishId);
  if (existingId) return existingId;

  // Create new community
  const [newCommunity] = await db
    .insert(communities)
    .values({
      name: communityName,
      parishId,
      coordinates: coordinates || null
    })
    .returning({ id: communities.id });

  return newCommunity.id;
}

/**
 * Get location ID from location name and community ID
 */
export async function getLocationId(
  locationName: string,
  communityId: string
): Promise<string | null> {
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.name, locationName), eq(locations.communityId, communityId)))
    .limit(1);

  return location?.id || null;
}

/**
 * Get or create location in a community
 */
export async function getOrCreateLocation(
  locationName: string,
  communityId: string,
  type: 'landmark' | 'street' | 'building' | 'institution',
  coordinates: { lat: number; lng: number },
  streetAddress?: string
): Promise<string> {
  // Try to find existing location
  const existingId = await getLocationId(locationName, communityId);
  if (existingId) return existingId;

  // Create new location
  const [newLocation] = await db
    .insert(locations)
    .values({
      name: locationName,
      communityId,
      type,
      coordinates,
      streetAddress: streetAddress || null,
      verified: false
    })
    .returning({ id: locations.id });

  return newLocation.id;
}

/**
 * Migrate old submission (parish/community text) to new hierarchical IDs
 */
export async function migrateSubmissionLocation(
  parishName: string,
  communityName: string
): Promise<{
  parishId: string | null;
  communityId: string | null;
}> {
  const parishId = await getParishIdByName(parishName);
  if (!parishId) {
    return { parishId: null, communityId: null };
  }

  const communityId = await getOrCreateCommunity(communityName, parishId);
  return { parishId, communityId };
}

/**
 * Get full location hierarchy (parish -> community -> location)
 */
export async function getLocationHierarchy(locationId: string) {
  const [result] = await db
    .select({
      location: locations,
      community: communities,
      parish: parishes
    })
    .from(locations)
    .leftJoin(communities, eq(locations.communityId, communities.id))
    .leftJoin(parishes, eq(communities.parishId, parishes.id))
    .where(eq(locations.id, locationId));

  return result;
}

/**
 * Get community hierarchy (parish -> community)
 */
export async function getCommunityHierarchy(communityId: string) {
  const [result] = await db
    .select({
      community: communities,
      parish: parishes
    })
    .from(communities)
    .leftJoin(parishes, eq(communities.parishId, parishes.id))
    .where(eq(communities.id, communityId));

  return result;
}
