import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { peopleNeeds, parishes, communities } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull } from 'drizzle-orm';
import { peopleNeedsToGeoJSON } from '@/lib/maps/geojson';
import { createPeopleNeedsHeatmap } from '@/lib/maps/heatmap';

export const dynamic = 'force-dynamic';

/**
 * GET /api/people/needs
 * Get people needs records with optional filtering
 * Query params:
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - urgency: Filter by urgency (low, medium, high, critical)
 *   - status: Filter by status (pending, in_progress, fulfilled, cancelled)
 *   - needs: Comma-separated list of needs to filter by
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const urgency = searchParams.get('urgency');
    const status = searchParams.get('status');
    const needsParam = searchParams.get('needs');
    const format = searchParams.get('format') || 'json';
    const heatmap = searchParams.get('heatmap') === 'true';
    const gridSize = searchParams.get('gridSize') ? parseFloat(searchParams.get('gridSize')!) : undefined;

    // Build query conditions
    const conditions = [];

    if (parishId) {
      conditions.push(eq(peopleNeeds.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(peopleNeeds.communityId, communityId));
    }

    if (urgency) {
      conditions.push(eq(peopleNeeds.urgency, urgency as any));
    }

    if (status) {
      conditions.push(eq(peopleNeeds.status, status as any));
    }

    // Only return needs with coordinates
    conditions.push(isNotNull(peopleNeeds.latitude));
    conditions.push(isNotNull(peopleNeeds.longitude));

    // Execute query with joins
    const results = await db
      .select({
        need: peopleNeeds,
        parish: parishes,
        community: communities,
      })
      .from(peopleNeeds)
      .leftJoin(parishes, eq(peopleNeeds.parishId, parishes.id))
      .leftJoin(communities, eq(peopleNeeds.communityId, communities.id))
      .where(and(...conditions))
      .orderBy(peopleNeeds.createdAt);

    // Transform results
    let needsWithRelations = results.map((r) => ({
      ...r.need,
      parish: r.parish,
      community: r.community,
    }));

    // Filter by needs if specified (client-side filter for JSONB array)
    if (needsParam) {
      const requiredNeeds = needsParam.split(',');
      needsWithRelations = needsWithRelations.filter((need) => {
        const needArray = Array.isArray(need.needs) ? need.needs : [];
        return requiredNeeds.some((req) => needArray.includes(req));
      });
    }

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      let geoJSON = peopleNeedsToGeoJSON(needsWithRelations);
      
      // Apply heatmap aggregation if requested
      if (heatmap) {
        geoJSON = createPeopleNeedsHeatmap(geoJSON as any, {
          byUrgency: true,
          byNeedType: true,
          gridSize,
        });
      }
      
      return NextResponse.json(geoJSON, {
        headers: {
          'Content-Type': 'application/geo+json',
        },
      });
    }

    return NextResponse.json({
      needs: needsWithRelations,
      count: needsWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching people needs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people needs' },
      { status: 500 }
    );
  }
}

