import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities, parishes } from '@/lib/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishName = searchParams.get('parish');
    const search = searchParams.get('search');
    
    if (!parishName) {
      return NextResponse.json(
        { error: 'Parish parameter is required' },
        { status: 400 }
      );
    }
    
    // First, find the parish ID by parish name
    const parish = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.name, parishName))
      .limit(1);
    
    if (parish.length === 0) {
      return NextResponse.json(
        { error: `Parish not found: ${parishName}` },
        { status: 404 }
      );
    }
    
    const parishId = parish[0].id;
    
    let whereCondition;
    
    if (search) {
      whereCondition = and(
        eq(communities.parishId, parishId),
        ilike(communities.name, `%${search}%`)
      );
    } else {
      whereCondition = eq(communities.parishId, parishId);
    }
    
    const results = await db
      .select()
      .from(communities)
      .where(whereCondition)
      .orderBy(communities.name)
      .limit(20);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, parishName } = body;
    
    if (!name || !parishName) {
      return NextResponse.json(
        { error: 'Name and parish are required' },
        { status: 400 }
      );
    }
    
    // First, find the parish ID by parish name
    const parish = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.name, parishName))
      .limit(1);
    
    if (parish.length === 0) {
      return NextResponse.json(
        { error: `Parish not found: ${parishName}` },
        { status: 404 }
      );
    }
    
    const parishId = parish[0].id;
    
    // Check if community already exists
    const existing = await db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.name, name),
          eq(communities.parishId, parishId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }
    
    // Create new community
    const result = await db.insert(communities).values({
      name,
      parishId
    }).returning();
    
    return NextResponse.json(result[0], { status: 201 });
    
  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    );
  }
}
