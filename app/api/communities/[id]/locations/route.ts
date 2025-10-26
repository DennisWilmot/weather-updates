import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/communities/:id/locations - Get all locations in a community
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by type: landmark, street, building, institution

    let query = db.select().from(locations).where(eq(locations.communityId, communityId));

    if (type) {
      query = query.where(eq(locations.type, type as any));
    }

    const communityLocations = await query;

    return NextResponse.json({
      locations: communityLocations,
      total: communityLocations.length,
      communityId,
      filter: type || 'all'
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
