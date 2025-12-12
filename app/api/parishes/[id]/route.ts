import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes, communities, submissions } from '@/lib/db/schema';
import { eq, desc, gt } from 'drizzle-orm';

// GET /api/parishes/:id - Get parish details with summary stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parishId } = await params;

    // Get parish details
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, parishId));

    if (!parish) {
      return NextResponse.json(
        { error: 'Parish not found' },
        { status: 404 }
      );
    }

    // Get communities count in this parish
    const parishCommunities = await db
      .select()
      .from(communities)
      .where(eq(communities.parishId, parishId));

    // Get recent submissions (last 24 hours) for this parish
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.parishId, parishId))
      .orderBy(desc(submissions.createdAt));

    // Calculate summary statistics
    const totalSubmissions = recentSubmissions.length;
    const noPowerCount = recentSubmissions.filter(s => !s.hasElectricity).length;
    const noWifiCount = recentSubmissions.filter(s => !s.hasWifi).length;
    const needsHelpCount = recentSubmissions.filter(s => s.needsHelp).length;
    const floodingCount = recentSubmissions.filter(s => s.flooding).length;
    const downedPowerLinesCount = recentSubmissions.filter(s => s.downedPowerLines).length;

    return NextResponse.json({
      parish,
      summary: {
        totalCommunities: parishCommunities.length,
        totalSubmissions,
        noPowerCount,
        noPowerPercentage: totalSubmissions > 0 ? (noPowerCount / totalSubmissions * 100).toFixed(1) : 0,
        noWifiCount,
        noWifiPercentage: totalSubmissions > 0 ? (noWifiCount / totalSubmissions * 100).toFixed(1) : 0,
        needsHelpCount,
        floodingCount,
        downedPowerLinesCount,
        lastUpdated: recentSubmissions[0]?.createdAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching parish details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parish details' },
      { status: 500 }
    );
  }
}
