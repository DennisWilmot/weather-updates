import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Simple in-memory cache for parishes (they rarely change)
let parishesCache: { data: any; timestamp: number } | null = null;
const PARISHES_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// GET /api/parishes - List all parishes
export async function GET() {
  try {
    // Check cache first
    if (parishesCache && Date.now() - parishesCache.timestamp < PARISHES_CACHE_TTL) {
      const response = NextResponse.json(parishesCache.data);
      response.headers.set('Cache-Control', 'public, max-age=900, s-maxage=1800'); // 15min browser, 30min CDN
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const allParishes = await db.select().from(parishes);

    const responseData = {
      parishes: allParishes,
      total: allParishes.length
    };

    // Cache the result
    parishesCache = { data: responseData, timestamp: Date.now() };

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, max-age=900, s-maxage=1800'); // 15min browser, 30min CDN
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  } catch (error) {
    console.error('Error fetching parishes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parishes' },
      { status: 500 }
    );
  }
}
