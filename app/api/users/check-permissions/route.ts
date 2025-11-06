import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // No authentication - all users can submit
  return NextResponse.json({
    canSubmit: true
  });
}

