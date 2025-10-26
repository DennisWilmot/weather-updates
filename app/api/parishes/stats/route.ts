import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes, communities, submissions } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface ParishStats {
  parishId: string;
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
  communitiesAffected: number;
  lastUpdate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function calculateSeverity(stats: Omit<ParishStats, 'severity'>): 'low' | 'medium' | 'high' | 'critical' {
  const totalHazards =
    stats.activeHazards.flooding +
    stats.activeHazards.downedPowerLines +
    stats.activeHazards.fallenTrees +
    stats.activeHazards.structuralDamage;

  const totalOutages = stats.electricityOutages + stats.flowOutages + stats.digicelOutages;

  // Critical: Help needed or major hazards
  if (stats.needsHelp > 0 || totalHazards > 10 || stats.activeHazards.structuralDamage > 3) {
    return 'critical';
  }

  // High: Significant hazards or outages
  if (totalHazards > 5 || totalOutages > 10 || stats.activeHazards.downedPowerLines > 2) {
    return 'high';
  }

  // Medium: Some issues
  if (totalHazards > 0 || totalOutages > 5) {
    return 'medium';
  }

  // Low: Minimal issues
  return 'low';
}

export async function GET() {
  try {
    // Get all parishes
    const allParishes = await db.select().from(parishes);

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Build statistics for each parish
    const parishStatsPromises = allParishes.map(async (parish) => {
      // Get all submissions for this parish
      const parishSubmissions = await db
        .select()
        .from(submissions)
        .where(eq(submissions.parishId, parish.id));

      // Count recent submissions (last 24 hours)
      const recentSubmissions = parishSubmissions.filter(
        (sub) => new Date(sub.createdAt) >= twentyFourHoursAgo
      ).length;

      // Count service outages
      const electricityOutages = parishSubmissions.filter(
        (sub) => !sub.hasElectricity
      ).length;

      const flowOutages = parishSubmissions.filter(
        (sub) => sub.flowService === false
      ).length;

      const digicelOutages = parishSubmissions.filter(
        (sub) => sub.digicelService === false
      ).length;

      // Count active hazards
      const activeHazards = {
        flooding: parishSubmissions.filter((sub) => sub.flooding === true).length,
        downedPowerLines: parishSubmissions.filter((sub) => sub.downedPowerLines === true).length,
        fallenTrees: parishSubmissions.filter((sub) => sub.fallenTrees === true).length,
        structuralDamage: parishSubmissions.filter((sub) => sub.structuralDamage === true).length,
      };

      // Count help requests
      const needsHelp = parishSubmissions.filter((sub) => sub.needsHelp === true).length;

      // Count unique communities
      const uniqueCommunities = new Set(
        parishSubmissions.map((sub) => sub.communityId).filter(Boolean)
      ).size;

      // Get last update time
      const lastUpdate =
        parishSubmissions.length > 0
          ? parishSubmissions.reduce((latest, sub) =>
              new Date(sub.createdAt) > new Date(latest) ? sub.createdAt : latest,
              parishSubmissions[0].createdAt
            )
          : new Date().toISOString();

      const stats: Omit<ParishStats, 'severity'> = {
        parishId: parish.id,
        parishName: parish.name,
        totalSubmissions: parishSubmissions.length,
        recentSubmissions,
        electricityOutages,
        flowOutages,
        digicelOutages,
        activeHazards,
        needsHelp,
        communitiesAffected: uniqueCommunities,
        lastUpdate,
      };

      return {
        ...stats,
        severity: calculateSeverity(stats),
      } as ParishStats;
    });

    const parishStats = await Promise.all(parishStatsPromises);

    // Sort by severity (critical first) and then by recent submissions
    const sortedStats = parishStats.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.recentSubmissions - a.recentSubmissions;
    });

    return NextResponse.json({
      parishes: sortedStats,
      total: sortedStats.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching parish stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parish statistics' },
      { status: 500 }
    );
  }
}
