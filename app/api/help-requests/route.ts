import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const helpType = searchParams.get('helpType');
    
    // Build query conditions
    const conditions = [eq(submissions.needsHelp, true)];
    
    // Filter by help type if provided
    if (helpType && helpType !== 'all') {
      conditions.push(eq(submissions.helpType, helpType));
    }

    // Fetch all help requests (no time limit for emergency requests)
    const helpRequests = await db
      .select()
      .from(submissions)
      .where(and(...conditions))
      .orderBy(desc(submissions.createdAt));

    return NextResponse.json({
      data: helpRequests,
      total: helpRequests.length
    });
    
  } catch (error) {
    console.error('Error fetching help requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch help requests' },
      { status: 500 }
    );
  }
}

