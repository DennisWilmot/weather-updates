import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { placeStatus, places, parishes, communities } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { placeStatusToGeoJSON } from '@/lib/maps/geojson';
import { createPlaceStatusHeatmap } from '@/lib/maps/heatmap';

export const dynamic = 'force-dynamic';

/**
 * GET /api/places/status
 * Get place status records with optional filtering
 * Query params:
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - electricityStatus: Filter by electricity status
 *   - waterStatus: Filter by water status
 *   - wifiStatus: Filter by WiFi status
 *   - verified: Filter by verified status
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const electricityStatus = searchParams.get('electricityStatus');
    const waterStatus = searchParams.get('waterStatus');
    const wifiStatus = searchParams.get('wifiStatus');
    const verifiedParam = searchParams.get('verified');
    const format = searchParams.get('format') || 'json';
    const heatmap = searchParams.get('heatmap') === 'true';
    const statusType = searchParams.get('statusType') as 'electricity' | 'water' | 'wifi' | undefined;
    const gridSize = searchParams.get('gridSize') ? parseFloat(searchParams.get('gridSize')!) : undefined;

    // Build query conditions
    const conditions = [];

    if (parishId) {
      conditions.push(eq(placeStatus.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(placeStatus.communityId, communityId));
    }

    if (electricityStatus) {
      conditions.push(eq(placeStatus.electricityStatus, electricityStatus as any));
    }

    if (waterStatus) {
      conditions.push(eq(placeStatus.waterStatus, waterStatus as any));
    }

    if (wifiStatus) {
      conditions.push(eq(placeStatus.wifiStatus, wifiStatus as any));
    }

    if (verifiedParam !== null) {
      conditions.push(eq(placeStatus.verified, verifiedParam === 'true'));
    }

    // Execute query with joins
    const results = await db
      .select({
        status: placeStatus,
        place: places,
        parish: parishes,
        community: communities,
      })
      .from(placeStatus)
      .leftJoin(places, eq(placeStatus.placeId, places.id))
      .leftJoin(parishes, eq(placeStatus.parishId, parishes.id))
      .leftJoin(communities, eq(placeStatus.communityId, communities.id))
      .where(and(...conditions))
      .orderBy(placeStatus.createdAt);

    // Transform results
    const statusesWithRelations = results.map((r) => ({
      ...r.status,
      place: r.place,
      parish: r.parish,
      community: r.community,
    }));

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      let geoJSON = placeStatusToGeoJSON(statusesWithRelations);
      
      // Apply heatmap aggregation if requested
      if (heatmap) {
        const heatmapStatusType = statusType || 'electricity';
        geoJSON = createPlaceStatusHeatmap(geoJSON as any, heatmapStatusType, {
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
      statuses: statusesWithRelations,
      count: statusesWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching place status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place status' },
      { status: 500 }
    );
  }
}

