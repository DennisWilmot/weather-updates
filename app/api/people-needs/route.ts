import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { people, parishes, communities, skills, peopleSkills } from '@/lib/db/schema';
import { eq, and, desc, asc, or, like, sql } from 'drizzle-orm';
import { getPersonSkills } from '@/lib/skill-normalization';

export const dynamic = 'force-dynamic';

/**
 * GET /api/people-needs
 * Get PNS (People, Need, Skills) report - data from people table
 * Query params:
 *   - parishId: Filter by parish ID
 *   - communityId: Filter by community ID
 *   - search: Search in name, contact name
 *   - sortBy: Column to sort by (default: name)
 *   - sortOrder: asc or desc (default: asc)
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Build query conditions - show all people (we'll aggregate their needs/skills)
    const conditions = [];

    if (parishId) {
      conditions.push(eq(people.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(people.communityId, communityId));
    }

    if (search) {
      conditions.push(
        or(
          like(people.name, `%${search}%`),
          like(people.contactName, `%${search}%`)
        )!
      );
    }

    // Build order by clause
    let orderByClause;
    const validSortColumns = ['createdAt', 'name', 'contactName', 'parish', 'community'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    
    if (sortColumn === 'createdAt') {
      orderByClause = sortOrder === 'asc' 
        ? asc(people.createdAt) 
        : desc(people.createdAt);
    } else if (sortColumn === 'name') {
      orderByClause = sortOrder === 'asc'
        ? asc(people.name)
        : desc(people.name);
    } else if (sortColumn === 'contactName') {
      orderByClause = sortOrder === 'asc'
        ? asc(people.contactName)
        : desc(people.contactName);
    } else if (sortColumn === 'parish') {
      orderByClause = sortOrder === 'asc'
        ? asc(parishes.name)
        : desc(parishes.name);
    } else if (sortColumn === 'community') {
      orderByClause = sortOrder === 'asc'
        ? asc(communities.name)
        : desc(communities.name);
    } else {
      orderByClause = desc(people.createdAt);
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(people)
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Execute query - get data directly from people table
    const rows = await db
      .select({
        id: people.id,
        name: people.name,
        type: people.type,
        parishId: people.parishId,
        communityId: people.communityId,
        latitude: people.latitude,
        longitude: people.longitude,
        contactName: people.contactName,
        contactPhone: people.contactPhone,
        contactEmail: people.contactEmail,
        organization: people.organization,
        needs: people.needs,
        createdAt: people.createdAt,
        parish: {
          id: parishes.id,
          name: parishes.name,
          code: parishes.code,
        },
        community: {
          id: communities.id,
          name: communities.name,
        },
      })
      .from(people)
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Fetch normalized skills for each person
    const results = await Promise.all(
      rows.map(async (row) => {
        const personSkills = await getPersonSkills(row.id);
        return {
          ...row,
          needs: Array.isArray(row.needs) ? row.needs : [],
          skills: personSkills.length > 0 ? personSkills.map((s) => s.name) : null, // Return as array of skill names for backward compatibility
          urgency: null,
          status: null,
          description: null,
          numberOfPeople: null,
        };
      })
    );

    return NextResponse.json({
      data: results,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Error fetching people needs:', error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to fetch people needs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

