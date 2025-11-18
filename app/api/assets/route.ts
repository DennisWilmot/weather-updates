import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assets } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull } from 'drizzle-orm';
import { assetsToGeoJSON } from '@/lib/maps/geojson';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assets
 * List all assets with optional filtering
 * Query params:
 *   - type: Filter by asset type (starlink, iphone, etc.)
 *   - status: Filter by status (available, deployed, etc.)
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - isOneTime: Filter by one-time vs recurring (true/false)
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const isOneTimeParam = searchParams.get('isOneTime');
    const format = searchParams.get('format') || 'json';

    // Build query conditions
    const conditions = [];

    if (type) {
      const types = type.split(',');
      if (types.length === 1) {
        conditions.push(eq(assets.type, types[0] as any));
      } else {
        conditions.push(inArray(assets.type, types as any[]));
      }
    }

    if (status) {
      const statuses = status.split(',');
      if (statuses.length === 1) {
        conditions.push(eq(assets.status, statuses[0] as any));
      } else {
        conditions.push(inArray(assets.status, statuses as any[]));
      }
    }

    if (parishId) {
      conditions.push(eq(assets.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(assets.communityId, communityId));
    }

    if (isOneTimeParam !== null) {
      conditions.push(eq(assets.isOneTime, isOneTimeParam === 'true'));
    }

    // Only return assets with coordinates
    conditions.push(isNotNull(assets.latitude));
    conditions.push(isNotNull(assets.longitude));

    // Execute query
    const results = await db
      .select()
      .from(assets)
      .where(and(...conditions));

    // Return GeoJSON or JSON format
    if (format === 'geojson') {
      const geoJSON = assetsToGeoJSON(results);
      return NextResponse.json(geoJSON, {
        headers: {
          'Content-Type': 'application/geo+json',
        },
      });
    }

    return NextResponse.json({
      assets: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}



