import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions, communities, parishes } from '@/lib/db/schema';
import { desc, eq, gte, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get('parish');
    const community = searchParams.get('community');
    const imageOnly = searchParams.get('imageOnly') === 'true';
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
    
    // Add image filter if requested
    if (imageOnly) {
      conditions.push(sql`${submissions.imageUrl} IS NOT NULL AND ${submissions.imageUrl} != ''`);
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

    // Handle both old format (parish/community names) and new format (IDs)
    const {
      parish,
      community,
      parishId,
      communityId,
      locationId,
      placeName,
      streetName,
      hasElectricity,
      flowService,
      digicelService,
      waterService,
      flooding,
      downedPowerLines,
      fallenTrees,
      structuralDamage,
      hasWifi,
      needsHelp,
      helpType,
      requesterName,
      requesterPhone,
      helpDescription,
      roadStatus
    } = body;

    // Validate required fields
    if (hasElectricity === undefined || needsHelp === undefined || !roadStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: hasElectricity, needsHelp, roadStatus' },
        { status: 400 }
      );
    }

    // Validate help type and contact info if help is needed
    if (needsHelp) {
      if (!helpType) {
        return NextResponse.json(
          { error: 'Help type is required when help is needed' },
          { status: 400 }
        );
      }
      if (!requesterName || !requesterName.trim()) {
        return NextResponse.json(
          { error: 'Name is required when requesting help' },
          { status: 400 }
        );
      }
      if (!requesterPhone || !requesterPhone.trim()) {
        return NextResponse.json(
          { error: 'Phone number is required when requesting help' },
          { status: 400 }
        );
      }
      if (!helpDescription || !helpDescription.trim()) {
        return NextResponse.json(
          { error: 'Help description is required when requesting help' },
          { status: 400 }
        );
      }
    }

    // Validate road status
    const validRoadStatuses = ['clear', 'flooded', 'blocked', 'mudslide', 'damaged'];
    if (!validRoadStatuses.includes(roadStatus)) {
      return NextResponse.json(
        { error: 'Invalid road status. Must be one of: clear, flooded, blocked, mudslide, damaged' },
        { status: 400 }
      );
    }

    // Resolve parish and community IDs
    let finalParishId = parishId;
    let finalCommunityId = communityId;
    let finalParishName = parish;
    let finalCommunityName = community;

    // If using new format with IDs, get the names for backward compatibility
    if (parishId && !parish) {
      const [parishRecord] = await db.select().from(parishes).where(eq(parishes.id, parishId)).limit(1);
      if (parishRecord) {
        finalParishName = parishRecord.name;
      }
    }

    if (communityId && !community) {
      const [communityRecord] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1);
      if (communityRecord) {
        finalCommunityName = communityRecord.name;
      }
    }

    // If using old format with names, get/create the IDs
    if (!parishId && parish) {
      const [parishRecord] = await db.select().from(parishes).where(eq(parishes.name, parish)).limit(1);
      if (parishRecord) {
        finalParishId = parishRecord.id;
        finalParishName = parishRecord.name;
      } else {
        return NextResponse.json(
          { error: `Parish not found: ${parish}` },
          { status: 400 }
        );
      }
    }

    if (!communityId && community && finalParishId) {
      // Check if community exists
      const [existingCommunity] = await db
        .select()
        .from(communities)
        .where(
          and(
            eq(communities.name, community),
            eq(communities.parishId, finalParishId)
          )
        )
        .limit(1);

      if (existingCommunity) {
        finalCommunityId = existingCommunity.id;
        finalCommunityName = existingCommunity.name;
      } else {
        // Create new community
        const [newCommunity] = await db.insert(communities).values({
          name: community,
          parishId: finalParishId
        }).returning();
        finalCommunityId = newCommunity.id;
        finalCommunityName = newCommunity.name;
      }
    }

    // Validate we have all required IDs
    if (!finalParishId || !finalCommunityId) {
      return NextResponse.json(
        { error: 'Could not resolve parish and community IDs' },
        { status: 400 }
      );
    }

    // Insert submission
    const result = await db.insert(submissions).values({
      parish: finalParishName,
      community: finalCommunityName,
      parishId: finalParishId,
      communityId: finalCommunityId,
      locationId: locationId || null,
      placeName: placeName || null,
      streetName: streetName || null,
      hasElectricity: hasElectricity !== undefined ? Boolean(hasElectricity) : null,
      flowService: flowService !== undefined ? Boolean(flowService) : null,
      digicelService: digicelService !== undefined ? Boolean(digicelService) : null,
      waterService: waterService !== undefined ? (waterService === 2) : null,
      flooding: flooding !== undefined ? Boolean(flooding) : false,
      downedPowerLines: downedPowerLines !== undefined ? Boolean(downedPowerLines) : false,
      fallenTrees: fallenTrees !== undefined ? Boolean(fallenTrees) : false,
      structuralDamage: structuralDamage !== undefined ? Boolean(structuralDamage) : false,
      hasWifi: hasWifi !== undefined ? Boolean(hasWifi) : true,
      needsHelp: Boolean(needsHelp),
      helpType: needsHelp ? helpType : null,
      requesterName: needsHelp && requesterName ? requesterName.trim() : null,
      requesterPhone: needsHelp && requesterPhone ? requesterPhone.trim() : null,
      helpDescription: needsHelp && helpDescription ? helpDescription.trim() : null,
      roadStatus,
      additionalInfo: body.additionalInfo || null,
      imageUrl: body.imageUrl || null
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
