import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// GET /api/parishes - List all parishes
export async function GET() {
  try {
    const allParishes = await db.select().from(parishes);

    return NextResponse.json({
      parishes: allParishes,
      total: allParishes.length
    });
  } catch (error) {
    console.error('Error fetching parishes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parishes' },
      { status: 500 }
    );
  }
}
