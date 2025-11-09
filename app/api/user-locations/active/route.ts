import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userLocations, user } from '@/lib/db/schema';
import { eq, desc, gte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const minutes = parseInt(url.searchParams.get('minutes') || '30', 10);
    const timeWindow = new Date(Date.now() - minutes * 60 * 1000);

    // Get latest location per user from the time window
    // Use leftJoin in case user table doesn't have matching records
    const latestLocations = await db
      .select({
        userId: userLocations.userId,
        latitude: userLocations.latitude,
        longitude: userLocations.longitude,
        accuracy: userLocations.accuracy,
        timestamp: userLocations.timestamp,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(userLocations)
      .leftJoin(user, eq(userLocations.userId, user.id))
      .where(gte(userLocations.timestamp, timeWindow))
      .orderBy(desc(userLocations.timestamp))
      .limit(1000); // Limit results to prevent huge queries

    // Group by user ID to get latest location per user
    const userMap = new Map<string, typeof latestLocations[0]>();
    latestLocations.forEach((loc) => {
      const userId = loc.userId;
      if (userId && !userMap.has(userId)) {
        userMap.set(userId, loc);
      }
    });

    const activeLocations = Array.from(userMap.values())
      .filter((loc) => loc.userId) // Filter out any null userIds
      .map((loc) => ({
        userId: loc.userId,
        latitude: typeof loc.latitude === 'string' ? parseFloat(loc.latitude) : Number(loc.latitude),
        longitude: typeof loc.longitude === 'string' ? parseFloat(loc.longitude) : Number(loc.longitude),
        accuracy: loc.accuracy,
        timestamp: loc.timestamp instanceof Date ? loc.timestamp.toISOString() : new Date(loc.timestamp).toISOString(),
        user: loc.user || null, // Handle null user from leftJoin
      }));

    return NextResponse.json(activeLocations);
  } catch (error: any) {
    console.error('Error fetching active locations:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to fetch active locations', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

