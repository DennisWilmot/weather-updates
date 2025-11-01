import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { parishes, submissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface ParishReliefStats {
  parishId: string;
  parishName: string;
  totalSubmissions: number;
  recentSubmissions: number;
  electricityOutages: number;
  flowOutages: number;
  digicelOutages: number;
  waterOutages: number;
  activeHazards: {
    flooding: number;
    downedPowerLines: number;
    fallenTrees: number;
    structuralDamage: number;
  };
  helpRequests: number;
  helpRequestsByType: {
    medical: number;
    physical: number;
    police: number;
    firefighter: number;
    other: number;
  };
  communitiesAffected: number;
  lastUpdate: string;
  actionsNeeded: string[];
}

function calculateActionsNeeded(stats: Omit<ParishReliefStats, 'actionsNeeded'>): string[] {
  const actions: string[] = [];

  // Help request actions
  if (stats.helpRequestsByType.medical > 0) {
    actions.push('Medical assistance needed');
  }
  if (stats.helpRequestsByType.physical > 0) {
    actions.push('Physical assistance needed');
  }
  if (stats.helpRequestsByType.police > 0) {
    actions.push('Police response needed');
  }
  if (stats.helpRequestsByType.firefighter > 0) {
    actions.push('Fire/Rescue response needed');
  }
  if (stats.helpRequests > 0 && stats.helpRequestsByType.other > 0) {
    actions.push('Emergency support needed');
  }
  if (stats.activeHazards.structuralDamage > 0 || stats.activeHazards.flooding > 0) {
    actions.push('Evacuation support');
  }

  // Service outage actions
  if (stats.electricityOutages > 0) {
    actions.push('JPS needed on site');
  }
  if (stats.flowOutages > 0) {
    actions.push('Flow restoration needed');
  }
  if (stats.waterOutages > 0) {
    actions.push('Water service needed');
  }

  // Infrastructure/hazard actions
  if (stats.activeHazards.downedPowerLines > 0) {
    actions.push('Power line repair needed');
  }
  if (stats.activeHazards.fallenTrees > 0) {
    actions.push('Tree removal needed');
  }

  return actions;
}

export async function GET() {
  try {
    // Protect route with Clerk authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

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
        (sub) => sub.hasElectricity === false
      ).length;

      const flowOutages = parishSubmissions.filter(
        (sub) => sub.flowService === false
      ).length;

      const digicelOutages = parishSubmissions.filter(
        (sub) => sub.digicelService === false
      ).length;

      const waterOutages = parishSubmissions.filter(
        (sub) => sub.waterService === false
      ).length;

      // Count active hazards
      const activeHazards = {
        flooding: parishSubmissions.filter((sub) => sub.flooding === true).length,
        downedPowerLines: parishSubmissions.filter((sub) => sub.downedPowerLines === true).length,
        fallenTrees: parishSubmissions.filter((sub) => sub.fallenTrees === true).length,
        structuralDamage: parishSubmissions.filter((sub) => sub.structuralDamage === true).length,
      };

      // Count help requests
      const helpRequests = parishSubmissions.filter((sub) => sub.needsHelp === true);
      const helpRequestsCount = helpRequests.length;

      // Count help requests by type
      const helpRequestsByType = {
        medical: helpRequests.filter((sub) => sub.helpType === 'medical').length,
        physical: helpRequests.filter((sub) => sub.helpType === 'physical').length,
        police: helpRequests.filter((sub) => sub.helpType === 'police').length,
        firefighter: helpRequests.filter((sub) => sub.helpType === 'firefighter').length,
        other: helpRequests.filter((sub) => sub.helpType === 'other' || !sub.helpType).length,
      };

      // Check for blocked/mudslide roads
      const roadBlocked = parishSubmissions.some(
        (sub) => sub.roadStatus === 'blocked' || sub.roadStatus === 'mudslide'
      );

      // Count unique communities
      const uniqueCommunities = new Set(
        parishSubmissions.map((sub) => sub.communityId).filter(Boolean)
      ).size;

      // Get last update time
      const lastUpdate =
        parishSubmissions.length > 0
          ? parishSubmissions.reduce((latest, sub) =>
              new Date(sub.createdAt) > new Date(latest) ? sub.createdAt.toISOString() : latest,
              parishSubmissions[0].createdAt.toISOString()
            )
          : new Date().toISOString();

      // Check for blocked/mudslide roads from parish submissions
      const hasBlockedRoads = parishSubmissions.some(
        (sub) => sub.roadStatus === 'blocked' || sub.roadStatus === 'mudslide'
      );

      const stats: Omit<ParishReliefStats, 'actionsNeeded'> = {
        parishId: parish.id,
        parishName: parish.name,
        totalSubmissions: parishSubmissions.length,
        recentSubmissions,
        electricityOutages,
        flowOutages,
        digicelOutages,
        waterOutages,
        activeHazards,
        helpRequests: helpRequestsCount,
        helpRequestsByType,
        communitiesAffected: uniqueCommunities,
        lastUpdate,
      };

      // Calculate actions needed
      const actionsNeeded = calculateActionsNeeded(stats);
      
      // Add road clearance if needed
      if (hasBlockedRoads && !actionsNeeded.includes('Road clearance needed')) {
        actionsNeeded.push('Road clearance needed');
      }

      return {
        ...stats,
        actionsNeeded,
      } as ParishReliefStats;
    });

    const parishStats = await Promise.all(parishStatsPromises);

    // Sort by help requests (most urgent first), then by recent submissions
    const sortedStats = parishStats.sort((a, b) => {
      if (b.helpRequests !== a.helpRequests) {
        return b.helpRequests - a.helpRequests;
      }
      return b.recentSubmissions - a.recentSubmissions;
    });

    return NextResponse.json({
      parishes: sortedStats,
      total: sortedStats.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching relief portal stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relief portal statistics' },
      { status: 500 }
    );
  }
}
