import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes, communities, submissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface CommunityStats {
  communityId: string;
  communityName: string;
  parishName: string;
  totalSubmissions: number;
  recentSubmissions: number;
  electricityOutages: number;
  flowOutages: number;
  digicelOutages: number;
  activeHazards: {
    flooding: number;
    downedPowerLines: number;
    fallenTrees: number;
    structuralDamage: number;
  };
  needsHelp: number;
  lastUpdate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function calculateSeverity(stats: Omit<CommunityStats, 'severity'>): 'low' | 'medium' | 'high' | 'critical' {
  const totalHazards =
    stats.activeHazards.flooding +
    stats.activeHazards.downedPowerLines +
    stats.activeHazards.fallenTrees +
    stats.activeHazards.structuralDamage;

  const totalOutages = stats.electricityOutages + stats.flowOutages + stats.digicelOutages;

  // Critical: Help needed or major hazards
  if (stats.needsHelp > 0 || totalHazards > 5 || stats.activeHazards.structuralDamage > 1) {
    return 'critical';
  }

  // High: Significant hazards or outages
  if (totalHazards > 3 || totalOutages > 5 || stats.activeHazards.downedPowerLines > 0) {
    return 'high';
  }

  // Medium: Some issues
  if (totalHazards > 0 || totalOutages > 2) {
    return 'medium';
  }

  // Low: Minimal issues
  return 'low';
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parishId = params.id;

    // Verify parish exists
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, parishId))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { error: 'Parish not found' },
        { status: 404 }
      );
    }

    // Get all communities in this parish
    const parishCommunities = await db
      .select()
      .from(communities)
      .where(eq(communities.parishId, parishId));

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Build statistics for each community
    const communityStatsPromises = parishCommunities.map(async (community) => {
      // Get all submissions for this community
      const communitySubmissions = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.parishId, parishId),
            eq(submissions.communityId, community.id)
          )
        );

      // If no submissions, skip this community
      if (communitySubmissions.length === 0) {
        return null;
      }

      // Count recent submissions (last 24 hours)
      const recentSubmissions = communitySubmissions.filter(
        (sub) => new Date(sub.createdAt) >= twentyFourHoursAgo
      ).length;

      // Count service outages
      const electricityOutages = communitySubmissions.filter(
        (sub) => !sub.hasElectricity
      ).length;

      const flowOutages = communitySubmissions.filter(
        (sub) => sub.flowService === false
      ).length;

      const digicelOutages = communitySubmissions.filter(
        (sub) => sub.digicelService === false
      ).length;

      // Count active hazards
      const activeHazards = {
        flooding: communitySubmissions.filter((sub) => sub.flooding === true).length,
        downedPowerLines: communitySubmissions.filter((sub) => sub.downedPowerLines === true).length,
        fallenTrees: communitySubmissions.filter((sub) => sub.fallenTrees === true).length,
        structuralDamage: communitySubmissions.filter((sub) => sub.structuralDamage === true).length,
      };

      // Count help requests
      const needsHelp = communitySubmissions.filter((sub) => sub.needsHelp === true).length;

      // Get last update time
      const lastUpdate: string = communitySubmissions.reduce((latest, sub) => {
        const subDate = new Date(sub.createdAt);
        const latestDate = new Date(latest);
        return subDate > latestDate ? sub.createdAt : latest;
      }, communitySubmissions[0].createdAt);

      const stats: Omit<CommunityStats, 'severity'> = {
        communityId: community.id,
        communityName: community.name,
        parishName: parish.name,
        totalSubmissions: communitySubmissions.length,
        recentSubmissions,
        electricityOutages,
        flowOutages,
        digicelOutages,
        activeHazards,
        needsHelp,
        lastUpdate,
      };

      return {
        ...stats,
        severity: calculateSeverity(stats),
      } as CommunityStats;
    });

    const communityStatsResults = await Promise.all(communityStatsPromises);

    // Filter out null results (communities with no submissions)
    const communityStats = communityStatsResults.filter(
      (stat): stat is CommunityStats => stat !== null
    );

    // Sort by severity (critical first) and then by recent submissions
    const sortedStats = communityStats.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.recentSubmissions - a.recentSubmissions;
    });

    return NextResponse.json({
      parishId,
      parishName: parish.name,
      communities: sortedStats,
      total: sortedStats.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community statistics' },
      { status: 500 }
    );
  }
}
