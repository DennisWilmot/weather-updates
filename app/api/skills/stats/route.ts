import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { skills, peopleSkills, people, parishes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/skills/stats
 * Get skill statistics with person counts
 * Query params:
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - limit: Limit number of results (default: 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const communityId = searchParams.get('communityId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const conditions = [];

    if (parishId) {
      conditions.push(eq(people.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(people.communityId, communityId));
    }

    const skillsWithCounts = await db
      .select({
        id: skills.id,
        name: skills.name,
        count: sql<number>`count(distinct ${peopleSkills.personId})`.as('count'),
      })
      .from(skills)
      .innerJoin(peopleSkills, eq(skills.id, peopleSkills.skillId))
      .innerJoin(people, eq(peopleSkills.personId, people.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(skills.id, skills.name)
      .orderBy(sql`count(distinct ${peopleSkills.personId}) desc`)
      .limit(limit);

    const totalResult = await db
      .select({ count: sql<number>`count(distinct ${skills.id})` })
      .from(skills)
      .innerJoin(peopleSkills, eq(skills.id, peopleSkills.skillId))
      .innerJoin(people, eq(peopleSkills.personId, people.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(totalResult[0]?.count || 0);

    const parishBreakdown = await db
      .select({
        parishId: parishes.id,
        parishName: parishes.name,
        peopleCount: sql<number>`count(distinct ${people.id})`.as('people_count'),
        skillCount: sql<number>`count(distinct ${peopleSkills.skillId})`.as('skill_count'),
      })
      .from(people)
      .innerJoin(parishes, eq(people.parishId, parishes.id))
      .innerJoin(peopleSkills, eq(people.id, peopleSkills.personId))
      .innerJoin(skills, eq(peopleSkills.skillId, skills.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(parishes.id, parishes.name)
      .orderBy(sql`count(distinct ${people.id}) desc`);

    return NextResponse.json({
      skills: skillsWithCounts.map((s) => ({
        id: s.id,
        name: s.name,
        count: Number(s.count),
      })),
      total,
      parishBreakdown: parishBreakdown.map((row) => ({
        parishId: row.parishId,
        parishName: row.parishName,
        peopleCount: Number(row.peopleCount),
        skillCount: Number(row.skillCount),
      })),
    });
  } catch (error) {
    console.error('Error fetching skill statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill statistics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

