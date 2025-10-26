import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communities, locations, submissions, parishes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/communities/:id - Get community details with summary
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // Get community details with parish info
    const [community] = await db
      .select({
        community: communities,
        parish: parishes
      })
      .from(communities)
      .leftJoin(parishes, eq(communities.parishId, parishes.id))
      .where(eq(communities.id, communityId));

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Get locations in this community
    const communityLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.communityId, communityId));

    // Get recent submissions for this community
    const recentSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.communityId, communityId))
      .orderBy(desc(submissions.createdAt))
      .limit(50);

    // Calculate summary statistics
    const totalSubmissions = recentSubmissions.length;
    const noPowerCount = recentSubmissions.filter(s => !s.hasElectricity).length;
    const noWifiCount = recentSubmissions.filter(s => !s.hasWifi).length;
    const needsHelpCount = recentSubmissions.filter(s => s.needsHelp).length;
    const floodingCount = recentSubmissions.filter(s => s.flooding).length;
    const roadIssuesCount = recentSubmissions.filter(
      s => s.roadStatus !== 'clear'
    ).length;

    return NextResponse.json({
      community: community.community,
      parish: community.parish,
      summary: {
        totalLocations: communityLocations.length,
        totalSubmissions,
        noPowerCount,
        noPowerPercentage: totalSubmissions > 0 ? (noPowerCount / totalSubmissions * 100).toFixed(1) : 0,
        noWifiCount,
        noWifiPercentage: totalSubmissions > 0 ? (noWifiCount / totalSubmissions * 100).toFixed(1) : 0,
        needsHelpCount,
        floodingCount,
        roadIssuesCount,
        lastUpdated: recentSubmissions[0]?.createdAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching community details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community details' },
      { status: 500 }
    );
  }
}
