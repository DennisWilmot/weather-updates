import { NextResponse } from 'next/server';
import { sseConnections } from '@/lib/sse-connections';
import { db } from '@/lib/db';
import { userLocations, user } from '@/lib/db/schema';
import { eq, desc, gte } from 'drizzle-orm';

// Force dynamic rendering - this is a streaming endpoint
export const dynamic = 'force-dynamic';

export async function GET() {
  let controllerRef: ReadableStreamDefaultController<string> | null = null;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      // Add connection to pool
      sseConnections.add(controller);

      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(connectMessage);

      // Send initial state - latest locations from last 30 minutes
      (async () => {
        try {
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

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
            .where(gte(userLocations.timestamp, thirtyMinutesAgo))
            .orderBy(desc(userLocations.timestamp));

          // Get latest location per user
          const userMap = new Map<string, typeof latestLocations[0]>();
          latestLocations.forEach((loc) => {
            const userId = loc.userId;
            if (userId && !userMap.has(userId)) {
              userMap.set(userId, loc);
            }
          });

          // Format data to match active endpoint format
          const initialData = Array.from(userMap.values())
            .filter((loc) => loc.userId) // Filter out any null userIds
            .map((loc) => ({
              userId: loc.userId,
              latitude: typeof loc.latitude === 'string' ? parseFloat(loc.latitude) : Number(loc.latitude),
              longitude: typeof loc.longitude === 'string' ? parseFloat(loc.longitude) : Number(loc.longitude),
              accuracy: loc.accuracy,
              timestamp: loc.timestamp instanceof Date ? loc.timestamp.toISOString() : new Date(loc.timestamp).toISOString(),
              user: loc.user || null,
            }));

          const initialMessage = `data: ${JSON.stringify({ type: 'initial', locations: initialData })}\n\n`;
          controller.enqueue(initialMessage);
        } catch (error) {
          console.error('Error sending initial state:', error);
        }
      })();
    },
    cancel() {
      // Client disconnected - remove from pool
      if (controllerRef) {
        sseConnections.remove(controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

