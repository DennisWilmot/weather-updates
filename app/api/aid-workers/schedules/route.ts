import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aidMissions, parishes, communities } from '@/lib/db/schema';
import { eq, and, inArray, gte, lte } from 'drizzle-orm';
import { aidMissionsToGeoJSON } from '@/lib/maps/geojson';

export const dynamic = 'force-dynamic';

/**
 * GET /api/aid-workers/schedules
 * Get aid worker mission schedules
 * Query params:
 *   - missionType: Filter by type (rapid_deployment, planned_mission, standby)
 *   - status: Filter by status (planned, active, completed, cancelled)
 *   - parishId: Filter by parish
 *   - startTime: Filter missions starting after this time (ISO string)
 *   - endTime: Filter missions ending before this time (ISO string)
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const missionType = searchParams.get('missionType');
    const status = searchParams.get('status');
    const parishId = searchParams.get('parishId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const format = searchParams.get('format') || 'json';

    // Build query conditions
    const conditions = [];

    if (missionType) {
      const types = missionType.split(',');
      if (types.length === 1) {
        conditions.push(eq(aidMissions.type, types[0] as any));
      } else {
        conditions.push(inArray(aidMissions.type, types as any[]));
      }
    }

    if (status) {
      const statuses = status.split(',');
      if (statuses.length === 1) {
        conditions.push(eq(aidMissions.status, statuses[0] as any));
      } else {
        conditions.push(inArray(aidMissions.status, statuses as any[]));
      }
    }

    if (parishId) {
      conditions.push(eq(aidMissions.parishId, parishId));
    }

    if (startTime) {
      conditions.push(gte(aidMissions.startTime, new Date(startTime)));
    }

    if (endTime) {
      conditions.push(lte(aidMissions.endTime || aidMissions.startTime, new Date(endTime)));
    }

    // Execute query with joins
    const results = await db
      .select({
        mission: aidMissions,
        parish: parishes,
        community: communities,
      })
      .from(aidMissions)
      .leftJoin(parishes, eq(aidMissions.parishId, parishes.id))
      .leftJoin(communities, eq(aidMissions.communityId, communities.id))
      .where(and(...conditions))
      .orderBy(aidMissions.startTime);

    // Transform results
    const missionsWithRelations = results.map((r) => ({
      ...r.mission,
      parish: r.parish,
      community: r.community,
    }));

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      const geoJSON = aidMissionsToGeoJSON(missionsWithRelations);
      return NextResponse.json(geoJSON, {
        headers: {
          'Content-Type': 'application/geo+json',
        },
      });
    }

    return NextResponse.json({
      missions: missionsWithRelations,
      count: missionsWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching aid worker schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aid worker schedules' },
      { status: 500 }
    );
  }
}



