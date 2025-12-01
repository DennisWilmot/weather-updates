/**
 * API endpoint to get current user with role and permissions
 * Used by client-side hooks for permission checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
