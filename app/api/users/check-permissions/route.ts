import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { canSubmitUpdates } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // If user is not authenticated, return false
    if (!userId) {
      return NextResponse.json({
        canSubmit: false
      });
    }

    const canSubmit = await canSubmitUpdates();
    
    return NextResponse.json({
      canSubmit
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { canSubmit: false, error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}

