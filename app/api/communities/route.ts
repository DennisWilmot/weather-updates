import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities } from '@/lib/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get('parish');
    const search = searchParams.get('search');
    
    if (!parish) {
      return NextResponse.json(
        { error: 'Parish parameter is required' },
        { status: 400 }
      );
    }
    
    let query = db.select().from(communities).where(eq(communities.parish, parish));
    
    if (search) {
      query = query.where(
        and(
          eq(communities.parish, parish),
          ilike(communities.name, `%${search}%`)
        )
      );
    }
    
    const results = await query.orderBy(communities.name).limit(20);
    
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
    const { name, parish } = body;
    
    if (!name || !parish) {
      return NextResponse.json(
        { error: 'Name and parish are required' },
        { status: 400 }
      );
    }
    
    // Check if community already exists
    const existing = await db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.name, name),
          eq(communities.parish, parish)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }
    
    // Create new community
    const result = await db.insert(communities).values({
      name,
      parish
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
