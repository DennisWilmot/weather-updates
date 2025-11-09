import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes, communities, locations } from '@/lib/db/schema';
import { ilike, or, sql } from 'drizzle-orm';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';

// GET /api/search?q=query&type=parish|community|location
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // Optional filter by type

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const searchPattern = `%${query}%`;
    const results: any = {
      parishes: [],
      communities: [],
      locations: [],
      total: 0
    };

    // Search parishes
    if (!type || type === 'parish') {
      results.parishes = await db
        .select()
        .from(parishes)
        .where(
          or(
            ilike(parishes.name, searchPattern),
            ilike(parishes.code, searchPattern)
          )
        )
        .limit(10);
    }

    // Search communities
    if (!type || type === 'community') {
      results.communities = await db
        .select({
          community: communities,
          parish: parishes
        })
        .from(communities)
        .leftJoin(parishes, sql`${communities.parishId} = ${parishes.id}`)
        .where(ilike(communities.name, searchPattern))
        .limit(20);
    }

    // Search locations
    if (!type || type === 'location') {
      results.locations = await db
        .select({
          location: locations,
          community: communities,
          parish: parishes
        })
        .from(locations)
        .leftJoin(communities, sql`${locations.communityId} = ${communities.id}`)
        .leftJoin(parishes, sql`${communities.parishId} = ${parishes.id}`)
        .where(
          or(
            ilike(locations.name, searchPattern),
            ilike(locations.streetAddress, searchPattern)
          )
        )
        .limit(20);
    }

    results.total = results.parishes.length + results.communities.length + results.locations.length;

    return NextResponse.json({
      query,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
