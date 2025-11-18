import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assetDistributions, parishes, communities } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull, gte, lte } from 'drizzle-orm';
import { assetDistributionsToGeoJSON } from '@/lib/maps/geojson';
import { createAssetDistributionHeatmap } from '@/lib/maps/heatmap';

export const dynamic = 'force-dynamic';

/**
 * GET /api/asset-distributions
 * Get asset distribution records
 * Query params:
 *   - assetType: Filter by asset type (starlink, iphone, etc.)
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - startDate: Filter distributions on or after this date (ISO string)
 *   - endDate: Filter distributions on or before this date (ISO string)
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('assetType');
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';
    const heatmap = searchParams.get('heatmap') === 'true';
    const gridSize = searchParams.get('gridSize') ? parseFloat(searchParams.get('gridSize')!) : undefined;
    const timeWindow = searchParams.get('timeWindow') as 'hour' | 'day' | 'week' | 'month' | undefined;

    // Build query conditions
    const conditions = [];

    if (assetType) {
      const types = assetType.split(',');
      if (types.length === 1) {
        conditions.push(eq(assetDistributions.assetType, types[0] as any));
      } else {
        conditions.push(inArray(assetDistributions.assetType, types as any[]));
      }
    }

    if (parishId) {
      conditions.push(eq(assetDistributions.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(assetDistributions.communityId, communityId));
    }

    if (startDate) {
      conditions.push(gte(assetDistributions.distributionDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(assetDistributions.distributionDate, new Date(endDate)));
    }

    // Only return distributions with coordinates
    conditions.push(isNotNull(assetDistributions.latitude));
    conditions.push(isNotNull(assetDistributions.longitude));

    // Execute query with joins
    const results = await db
      .select({
        distribution: assetDistributions,
        parish: parishes,
        community: communities,
      })
      .from(assetDistributions)
      .leftJoin(parishes, eq(assetDistributions.parishId, parishes.id))
      .leftJoin(communities, eq(assetDistributions.communityId, communities.id))
      .where(and(...conditions))
      .orderBy(assetDistributions.distributionDate);

    // Transform results
    const distributionsWithRelations = results.map((r) => ({
      ...r.distribution,
      parish: r.parish,
      community: r.community,
    }));

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      let geoJSON = assetDistributionsToGeoJSON(distributionsWithRelations);
      
      // Apply heatmap aggregation if requested
      if (heatmap) {
        geoJSON = createAssetDistributionHeatmap(geoJSON as any, {
          byLocation: true,
          byTime: timeWindow,
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
      distributions: distributionsWithRelations,
      count: distributionsWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching asset distributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset distributions' },
      { status: 500 }
    );
  }
}

