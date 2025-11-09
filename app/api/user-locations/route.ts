import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userLocations, user } from '@/lib/db/schema';
import { sseConnections } from '@/lib/sse-connections';
import { eq } from 'drizzle-orm';

// Force dynamic rendering - this route uses auth session
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Verify user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, accuracy } = body;

    // Validate required fields
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Store location in database
    const [location] = await db
      .insert(userLocations)
      .values({
        userId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        accuracy: accuracy || null,
        timestamp: new Date(),
      })
      .returning();

    // Get user info for broadcast
    const [userData] = await db
      .select({
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // Broadcast to all SSE connections
    const updateData = {
      userId,
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      accuracy: location.accuracy,
      timestamp: location.timestamp.toISOString(),
      user: {
        name: userData?.name || null,
        email: userData?.email || null,
      },
    };

    sseConnections.broadcast(updateData);

    return NextResponse.json(
      {
        success: true,
        location: {
          id: location.id,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          timestamp: location.timestamp.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location', details: error.message },
      { status: 500 }
    );
  }
}

