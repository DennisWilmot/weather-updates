import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // No authentication - user sync not needed
  return NextResponse.json({
    success: true,
    message: 'No authentication system configured',
    synced: 0,
    errors: []
  });
}

