import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aidWorkerCapabilities, people, parishes, communities } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull } from 'drizzle-orm';
import { aidWorkersToGeoJSON } from '@/lib/maps/geojson';

export const dynamic = 'force-dynamic';

/**
 * GET /api/aid-workers/capabilities
 * Get aid worker capabilities
 * Query params:
 *   - capabilities: Comma-separated list of capabilities to filter by
 *   - availabilityStatus: Filter by status (available, on_mission, unavailable)
 *   - parishId: Filter by parish
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const capabilitiesParam = searchParams.get('capabilities');
    const availabilityStatus = searchParams.get('availabilityStatus');
    const parishId = searchParams.get('parishId');
    const format = searchParams.get('format') || 'json';

    // Build query conditions
    const conditions = [eq(people.type, 'aid_worker' as any)];

    if (availabilityStatus) {
      conditions.push(eq(aidWorkerCapabilities.availabilityStatus, availabilityStatus as any));
    }

    if (parishId) {
      conditions.push(eq(people.parishId, parishId));
    }

    // Execute query with joins
    const results = await db
      .select({
        capability: aidWorkerCapabilities,
        person: people,
        parish: parishes,
        community: communities,
      })
      .from(aidWorkerCapabilities)
      .innerJoin(people, eq(aidWorkerCapabilities.personId, people.id))
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(and(...conditions));

    // Transform results
    let workersWithRelations = results.map((r) => ({
      ...r.capability,
      person: {
        ...r.person,
        parish: r.parish,
        community: r.community,
      },
    }));

    // Filter by capabilities if specified (client-side filter for JSONB array)
    if (capabilitiesParam) {
      const requiredCapabilities = capabilitiesParam.split(',');
      workersWithRelations = workersWithRelations.filter((worker) => {
        const capabilities = Array.isArray(worker.capabilities)
          ? worker.capabilities
          : [];
        return requiredCapabilities.some((req) => capabilities.includes(req));
      });
    }

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      const geoJSON = aidWorkersToGeoJSON(workersWithRelations);
      return NextResponse.json(geoJSON, {
        headers: {
          'Content-Type': 'application/geo+json',
        },
      });
    }

    return NextResponse.json({
      workers: workersWithRelations,
      count: workersWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching aid worker capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aid worker capabilities' },
      { status: 500 }
    );
  }
}



