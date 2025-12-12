import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const resolvedParams = await params;
    const communityId = resolvedParams.id;

    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1);

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    const coords = community.coordinates as { lat: number; lng: number } | null;

    return NextResponse.json({
      id: community.id,
      name: community.name,
      coordinates: coords || {
        lat: 0,
        lng: 0,
      },
      latitude: coords?.lat,
      longitude: coords?.lng,
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    );
  }
}

