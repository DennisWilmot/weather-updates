import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/db/schema';
import { eq, gte, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get('parish');
    
    if (!parish) {
      return NextResponse.json(
        { error: 'Parish parameter is required' },
        { status: 400 }
      );
    }
    
    // Filter by last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all submissions for this parish in last 24h
    const allSubmissions = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.parish, parish),
          gte(submissions.createdAt, twentyFourHoursAgo)
        )
      );
    
    // Aggregate statistics
    const total = allSubmissions.length;
    const withElectricity = allSubmissions.filter(s => s.hasElectricity).length;
    const withoutElectricity = total - withElectricity;
    const withWifi = allSubmissions.filter(s => s.hasWifi).length;
    const withoutWifi = total - withWifi;
    const needsHelp = allSubmissions.filter(s => s.needsHelp).length;
    
    // Road status breakdown
    const roadStatus = {
      clear: allSubmissions.filter(s => s.roadStatus === 'clear').length,
      flooded: allSubmissions.filter(s => s.roadStatus === 'flooded').length,
      blocked: allSubmissions.filter(s => s.roadStatus === 'blocked').length,
      mudslide: allSubmissions.filter(s => s.roadStatus === 'mudslide').length
    };
    
    return NextResponse.json({
      total,
      withElectricity,
      withoutElectricity,
      withWifi,
      withoutWifi,
      needsHelp,
      roadStatus
    });
    
  } catch (error) {
    console.error('Error fetching parish stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
