import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get('parish');
    const community = searchParams.get('community');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query conditions
    let query = supabase
      .from('submissions')
      .select('*', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    // Add parish filter if provided
    if (parish) {
      query = query.eq('parish', parish);
    }
    
    // Add community filter if provided
    if (community) {
      query = query.eq('community', community);
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: results, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Transform snake_case to camelCase for frontend
    const transformedResults = (results || []).map((item: any) => ({
      id: item.id,
      parish: item.parish,
      community: item.community,
      hasElectricity: item.has_electricity,
      powerProvider: item.power_provider,
      hasWifi: item.has_wifi,
      wifiProvider: item.wifi_provider,
      needsHelp: item.needs_help,
      helpType: item.help_type,
      roadStatus: item.road_status,
      additionalInfo: item.additional_info,
      imageUrl: item.image_url,
      createdAt: item.created_at
    }));
    
    return NextResponse.json({
      data: transformedResults,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
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
    const { parish, community, hasElectricity, powerProvider, hasWifi, wifiProvider, needsHelp, helpType, roadStatus } = body;
    
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
    const { data: existingCommunity, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('name', community)
      .eq('parish', parish)
      .limit(1);
    
    if (communityError) {
      console.error('Error checking community:', communityError);
      return NextResponse.json(
        { error: `Database error: ${communityError.message}` },
        { status: 500 }
      );
    }
    
    let communityId;
    if (existingCommunity && existingCommunity.length > 0) {
      communityId = existingCommunity[0].id;
    } else {
      // Create new community
      const { data: newCommunity, error: createError } = await supabase
        .from('communities')
        .insert({
          name: community,
          parish
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating community:', createError);
        return NextResponse.json(
          { error: `Failed to create community "${community}": ${createError.message}` },
          { status: 500 }
        );
      }
      
      communityId = newCommunity.id;
    }
    
    // Insert submission
    const { data: result, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        parish,
        community,
        has_electricity: Boolean(hasElectricity),
        power_provider: hasElectricity ? (powerProvider || null) : null,
        has_wifi: Boolean(hasWifi),
        wifi_provider: wifiProvider || null,
        has_power: Boolean(hasElectricity), // Map hasElectricity to hasPower for database compatibility
        needs_help: Boolean(needsHelp),
        help_type: needsHelp ? helpType : null,
        road_status: roadStatus,
        additional_info: body.additionalInfo || null,
        image_url: body.imageUrl || null
      })
      .select()
      .single();
    
    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json(
        { error: `Failed to create submission: ${submissionError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}
