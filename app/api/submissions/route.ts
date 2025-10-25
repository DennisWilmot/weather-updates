import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions, communities } from '@/lib/db/schema';
import { desc, eq, gte, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get('parish');
    const community = searchParams.get('community');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query conditions
    const conditions = [];
    
    // Filter by last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    conditions.push(gte(submissions.createdAt, twentyFourHoursAgo));
    
    // Add parish filter if provided
    if (parish) {
      conditions.push(eq(submissions.parish, parish));
    }
    
    // Add community filter if provided
    if (community) {
      conditions.push(eq(submissions.community, community));
    }
    
    const offset = (page - 1) * limit;
    
    // Execute query with pagination
    const results = await db
      .select()
      .from(submissions)
      .where(and(...conditions))
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(and(...conditions));
    
    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
        hasNext: page < Math.ceil((totalCount[0]?.count || 0) / limit),
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { parish, community, hasElectricity, hasWifi, needsHelp, helpType, roadStatus } = body;
    
    if (!parish || !community || hasElectricity === undefined || hasWifi === undefined || needsHelp === undefined || !roadStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: parish, community, hasElectricity, hasWifi, needsHelp, roadStatus' },
        { status: 400 }
      );
    }
    
    // Validate help type if help is needed
    if (needsHelp && !helpType) {
      return NextResponse.json(
        { error: 'Help type is required when help is needed' },
        { status: 400 }
      );
    }
    
    // Validate road status
    const validRoadStatuses = ['clear', 'flooded', 'blocked', 'mudslide'];
    if (!validRoadStatuses.includes(roadStatus)) {
      return NextResponse.json(
        { error: 'Invalid road status. Must be one of: clear, flooded, blocked, mudslide' },
        { status: 400 }
      );
    }
    
    // Check if community exists, create if not
    let communityId;
    const existingCommunity = await db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.name, community),
          eq(communities.parish, parish)
        )
      )
      .limit(1);
    
    if (existingCommunity.length > 0) {
      communityId = existingCommunity[0].id;
    } else {
      // Create new community
      const newCommunity = await db.insert(communities).values({
        name: community,
        parish
      }).returning();
      communityId = newCommunity[0].id;
    }
    
    // Insert submission
    const result = await db.insert(submissions).values({
      parish,
      community,
      hasElectricity: Boolean(hasElectricity),
      hasWifi: Boolean(hasWifi),
      hasPower: Boolean(hasElectricity), // Map hasElectricity to hasPower for database compatibility
      needsHelp: Boolean(needsHelp),
      helpType: needsHelp ? helpType : null,
      roadStatus,
      additionalInfo: body.additionalInfo || null
    }).returning();
    
    return NextResponse.json(result[0], { status: 201 });
    
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}
