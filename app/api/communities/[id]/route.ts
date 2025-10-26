import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities, parishes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/communities/:id - Get community details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Get community details with parish information
    const [community] = await db
      .select({
        id: communities.id,
        name: communities.name,
        parishId: communities.parishId,
        coordinates: communities.coordinates,
        bounds: communities.bounds,
        createdAt: communities.createdAt,
        parish: {
          id: parishes.id,
          name: parishes.name,
          code: parishes.code
        }
      })
      .from(communities)
      .leftJoin(parishes, eq(communities.parishId, parishes.id))
      .where(eq(communities.id, communityId));

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(community);
  } catch (error) {
    console.error('Error fetching community details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community details' },
      { status: 500 }
    );
  }
}
