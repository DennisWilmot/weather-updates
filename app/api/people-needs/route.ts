import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { people, parishes, communities, skills, peopleSkills } from '@/lib/db/schema';
import { eq, and, desc, asc, or, like, sql, inArray } from 'drizzle-orm';
import { getPersonSkills } from '@/lib/skill-normalization';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes (shorter for dynamic data)

function getCacheKey(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams);
  params.sort(); // Ensure consistent ordering
  return `people-needs:${params.toString()}`;
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key); // Remove expired entry
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Simple cleanup: remove old entries periodically
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(k);
      }
    }
  }
}

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

    // Check cache first
    const cacheKey = getCacheKey(searchParams);
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      const response = NextResponse.json(cachedResult);
      response.headers.set('Cache-Control', 'public, max-age=180, s-maxage=300');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

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

    // Optimize: Fetch all skills in a single query instead of N+1 queries
    const personIds = rows.map(row => row.id);
    
    // Single query to get all skills for all people
    const allSkills = personIds.length > 0 ? await db
      .select({
        personId: peopleSkills.personId,
        skillId: skills.id,
        skillName: skills.name,
      })
      .from(peopleSkills)
      .innerJoin(skills, eq(peopleSkills.skillId, skills.id))
      .where(inArray(peopleSkills.personId, personIds)) : [];

    // Group skills by person ID for O(1) lookup
    const skillsByPersonId = new Map<string, string[]>();
    for (const skill of allSkills) {
      if (!skillsByPersonId.has(skill.personId)) {
        skillsByPersonId.set(skill.personId, []);
      }
      skillsByPersonId.get(skill.personId)!.push(skill.skillName);
    }

    // Transform results with O(1) skill lookup
    const results = rows.map((row) => ({
      ...row,
      needs: Array.isArray(row.needs) ? row.needs : [],
      skills: skillsByPersonId.get(row.id) || null, // O(1) lookup instead of N queries
      urgency: null,
      status: null,
      description: null,
      numberOfPeople: null,
    }));

    const responseData = {
      data: results,
      total,
      page,
      totalPages,
      limit,
    };

    // Cache the result
    setCache(cacheKey, responseData);

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, max-age=180, s-maxage=300');
    response.headers.set('X-Cache', 'MISS');
    
    return response;
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

