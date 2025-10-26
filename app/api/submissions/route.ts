import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions, communities, parishes } from '@/lib/db/schema';
import { desc, eq, gte, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get('parish');
    const community = searchParams.get('community');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query conditions
    let whereConditions = [];
    
    if (parish) {
      // Find parish ID by name
      const parishRecord = await db
        .select({ id: parishes.id })
        .from(parishes)
        .where(eq(parishes.name, parish))
        .limit(1);
      
      if (parishRecord.length > 0) {
        whereConditions.push(eq(submissions.parishId, parishRecord[0].id));
      }
    }
    
    if (community) {
      // Find community ID by name
      const communityRecord = await db
        .select({ id: communities.id })
        .from(communities)
        .where(eq(communities.name, community))
        .limit(1);
      
      if (communityRecord.length > 0) {
        whereConditions.push(eq(submissions.communityId, communityRecord[0].id));
      }
    }
    
    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    // Get submissions with pagination
    const results = await db
      .select({
        id: submissions.id,
        parishId: submissions.parishId,
        communityId: submissions.communityId,
        locationId: submissions.locationId,
        jpsElectricity: submissions.jpsElectricity,
        flowService: submissions.flowService,
        digicelService: submissions.digicelService,
        waterService: submissions.waterService,
        hasElectricity: submissions.hasElectricity,
        hasWifi: submissions.hasWifi,
        hasPower: submissions.hasPower,
        flooding: submissions.flooding,
        downedPowerLines: submissions.downedPowerLines,
        fallenTrees: submissions.fallenTrees,
        structuralDamage: submissions.structuralDamage,
        needsHelp: submissions.needsHelp,
        helpType: submissions.helpType,
        roadStatus: submissions.roadStatus,
        additionalInfo: submissions.additionalInfo,
        imageUrl: submissions.imageUrl,
        streetName: submissions.streetName,
        placeName: submissions.placeName,
        parish: submissions.parish,
        community: submissions.community,
        confidence: submissions.confidence,
        createdAt: submissions.createdAt
      })
      .from(submissions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages
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
    const { 
      parish, community, 
      jpsElectricity, flowService, digicelService, waterService, // New service states
      needsHelp, helpType, roadStatus, 
      additionalInfo, imageUrl,
      placeName, streetName // New location details
    } = body;
    
    if (!parish || !community || jpsElectricity === undefined || flowService === undefined || digicelService === undefined || waterService === undefined || needsHelp === undefined || !roadStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: parish, community, jpsElectricity, flowService, digicelService, waterService, needsHelp, roadStatus' },
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
    const validRoadStatuses = ['clear', 'flooded', 'blocked', 'mudslide', 'damaged'];
    if (!validRoadStatuses.includes(roadStatus)) {
      return NextResponse.json(
        { error: 'Invalid road status. Must be one of: clear, flooded, blocked, mudslide, damaged' },
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
          eq(communities.parishId, body.parishId)
        )
      )
      .limit(1);
    
    if (existingCommunity.length > 0) {
      communityId = existingCommunity[0].id;
    } else {
      // Create new community
      const newCommunity = await db.insert(communities).values({
        name: community,
        parishId: body.parishId
      }).returning();
      communityId = newCommunity[0].id;
    }
    
    // Insert submission
    const result = await db.insert(submissions).values({
      parish,
      community,
      parishId: body.parishId, // Assuming these will be passed from HierarchicalLocationPicker
      communityId: body.communityId,
      locationId: body.locationId,
      streetName: streetName,
      placeName: placeName,
      jpsElectricity: jpsElectricity,
      flowService: flowService,
      digicelService: digicelService,
      waterService: waterService,
      hasElectricity: jpsElectricity > 0, // For backward compatibility
      hasWifi: flowService > 0 || digicelService > 0, // For backward compatibility
      hasPower: jpsElectricity > 0, // For backward compatibility
      needsHelp: Boolean(needsHelp),
      helpType: needsHelp ? helpType : null,
      roadStatus,
      additionalInfo: additionalInfo || null,
      imageUrl: imageUrl || null
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