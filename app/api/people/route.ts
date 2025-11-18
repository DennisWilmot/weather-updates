import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { people, parishes, communities } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/people
 * List people (both people in need and aid workers)
 * Query params:
 *   - type: Filter by type (person_in_need | aid_worker)
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const format = searchParams.get('format') || 'json';

    // Build query conditions
    const conditions = [];

    if (type) {
      conditions.push(eq(people.type, type as any));
    }

    if (parishId) {
      conditions.push(eq(people.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(people.communityId, communityId));
    }

    // Only return people with coordinates
    conditions.push(isNotNull(people.latitude));
    conditions.push(isNotNull(people.longitude));

    // Execute query with joins
    const results = await db
      .select({
        person: people,
        parish: parishes,
        community: communities,
      })
      .from(people)
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(and(...conditions));

    // Transform results
    const peopleWithRelations = results.map((r) => ({
      ...r.person,
      parish: r.parish,
      community: r.community,
    }));

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      // For aid workers, we'll use a separate endpoint that includes capabilities
      // For now, return basic GeoJSON
      const features = peopleWithRelations
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [
              parseFloat(p.longitude!.toString()),
              parseFloat(p.latitude!.toString()),
            ],
          },
          properties: {
            id: p.id,
            name: p.name,
            type: p.type,
            contactName: p.contactName,
            contactPhone: p.contactPhone,
            contactEmail: p.contactEmail,
            organization: p.organization,
            parishId: p.parishId,
            communityId: p.communityId,
            createdAt: p.createdAt,
          },
        }));

      return NextResponse.json(
        {
          type: 'FeatureCollection',
          features,
        },
        {
          headers: {
            'Content-Type': 'application/geo+json',
          },
        }
      );
    }

    return NextResponse.json({
      people: peopleWithRelations,
      count: peopleWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
}

