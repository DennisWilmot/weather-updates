import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities, parishes } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const parishName = searchParams.get('parishName');
    
    if (!parishId && !parishName) {
      return NextResponse.json(
        { error: 'Parish ID or Parish Name parameter is required' },
        { status: 400 }
      );
    }
    
    // Build where condition
    let results;
    if (parishId) {
      // Query by parish ID directly
      results = await db
        .select({
          id: communities.id,
          name: communities.name,
          coordinates: communities.coordinates,
          bounds: communities.bounds
        })
        .from(communities)
        .where(
          and(
            eq(communities.parishId, parishId),
            isNotNull(communities.bounds)
          )
        )
        .orderBy(communities.name);
    } else if (parishName) {
      // Query by parish name - need to join with parishes table
      const [parish] = await db
        .select({ id: parishes.id })
        .from(parishes)
        .where(eq(parishes.name, parishName))
        .limit(1);

      if (!parish) {
        return NextResponse.json(
          { error: `Parish not found: ${parishName}` },
          { status: 404 }
        );
      }

      results = await db
        .select({
          id: communities.id,
          name: communities.name,
          coordinates: communities.coordinates,
          bounds: communities.bounds
        })
        .from(communities)
        .where(
          and(
            eq(communities.parishId, parish.id),
            isNotNull(communities.bounds)
          )
        )
        .orderBy(communities.name);
    }
    
    return NextResponse.json({
      communities: results
    });
    
  } catch (error) {
    console.error('Error fetching communities with bounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities with bounds' },
      { status: 500 }
    );
  }
}
