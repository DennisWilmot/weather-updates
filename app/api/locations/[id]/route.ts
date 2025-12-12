import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations, communities, parishes, submissions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/locations/:id - Get location details with submission history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const resolvedParams = await params;
    const locationId = resolvedParams.id;

    // Get location with community and parish info
    const [location] = await db
      .select({
        location: locations,
        community: communities,
        parish: parishes
      })
      .from(locations)
      .leftJoin(communities, eq(locations.communityId, communities.id))
      .leftJoin(parishes, eq(communities.parishId, parishes.id))
      .where(eq(locations.id, locationId));

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Get submissions for this specific location
    const locationSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.locationId, locationId))
      .orderBy(desc(submissions.createdAt))
      .limit(20);

    // Calculate current status from recent submissions
    const recentSubmissions = locationSubmissions.slice(0, 5);
    const hasElectricity = recentSubmissions.filter(s => s.hasElectricity).length > recentSubmissions.length / 2;
    const hasWifi = recentSubmissions.filter(s => s.hasWifi).length > recentSubmissions.length / 2;
    const hasActiveHazards = recentSubmissions.some(s => s.flooding || s.downedPowerLines || s.fallenTrees);

    return NextResponse.json({
      location: location.location,
      community: location.community,
      parish: location.parish,
      currentStatus: {
        hasElectricity,
        hasWifi,
        hasActiveHazards,
        totalReports: locationSubmissions.length,
        lastUpdated: locationSubmissions[0]?.createdAt || null,
        confidenceScore: locationSubmissions.length > 0 ? Math.min(locationSubmissions.length / 5, 1) : 0
      },
      recentSubmissions: locationSubmissions
    });
  } catch (error) {
    console.error('Error fetching location details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location details' },
      { status: 500 }
    );
  }
}
