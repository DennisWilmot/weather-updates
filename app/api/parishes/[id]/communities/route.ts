import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/parishes/:id/communities - Get all communities in a parish
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parishId = params.id;

    const parishCommunities = await db
      .select()
      .from(communities)
      .where(eq(communities.parishId, parishId));

    return NextResponse.json({
      communities: parishCommunities,
      total: parishCommunities.length,
      parishId
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}
